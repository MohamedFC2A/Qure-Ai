"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { MedicalResultCard } from "@/components/scanner/MedicalResultCard";
import { WoundResultCard } from "@/components/scanner/WoundResultCard";
import {
    Activity,
    Calendar,
    ChevronRight,
    Pill,
    Search,
    Users,
    X,
    Bandage,
    Layers,
    ShieldAlert,
    Sparkles,
    Flame,
    Filter,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { useSettings } from "@/context/SettingsContext";
import { getLocalScans, mergeHistoryItems } from "@/lib/localHistory";
import { cn } from "@/lib/utils";

interface UnifiedHistoryItem {
    id: string;
    type: "medication" | "wound";
    title: string;
    subtitle?: string;
    severity?: string;
    created_at: string;
    profile_id?: string | null;
    user_id?: string;
    analysis_json?: any;
    source?: "local" | "remote";
}

export default function HistoryPage() {
    const supabase = useMemo(() => createClient(), []);
    const { resultsLanguage } = useSettings();
    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    const [history, setHistory] = useState<UnifiedHistoryItem[]>([]);
    const [categoryFilter, setCategoryFilter] = useState<"all" | "medication" | "wound">("all");
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<UnifiedHistoryItem | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [userId, setUserId] = useState<string | null>(null);
    const [careProfiles, setCareProfiles] = useState<Array<{ id: string; display_name: string }>>([]);
    const [profileFilter, setProfileFilter] = useState<string>("all");
    const { user } = useUser();

    useEffect(() => {
        const init = async () => {
            try {
                const hasLocalDevCookie =
                    typeof document !== "undefined" &&
                    document.cookie.split("; ").some((cookie) => cookie === "qurescan_dev_auth=1");
                const isLocalDevUser = process.env.NODE_ENV === "development" && (user?.id === "local-dev-user" || hasLocalDevCookie);

                if (isLocalDevUser) {
                    const localUserId = user?.id || "local-dev-user";
                    setUserId(localUserId);
                    setCareProfiles([{ id: localUserId, display_name: isArabic ? "أنا (المطور)" : "Local Dev" }]);
                    setProfileFilter("all");
                    return;
                }

                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (!authUser) {
                    setUserId(null);
                    return;
                }
                setUserId(authUser.id);

                const careRes = await supabase
                    .from("care_profiles")
                    .select("id, display_name")
                    .eq("owner_user_id", authUser.id);

                const rows = (careRes.data || []).map((r: any) => ({ id: String(r.id), display_name: String(r.display_name || (isArabic ? "أنا" : "Me")) }));
                rows.sort((a: any, b: any) => (a.id === authUser.id ? -1 : b.id === authUser.id ? 1 : a.display_name.localeCompare(b.display_name)));
                setCareProfiles(rows.length ? rows : [{ id: authUser.id, display_name: isArabic ? "أنا" : "Me" }]);

                const saved = typeof window !== "undefined" ? localStorage.getItem("qurescan_active_care_profile") : null;
                const preferred = saved && rows.some((p: any) => p.id === saved) ? saved : null;
                setProfileFilter(preferred || "all");
            } catch (err) {
                console.error("History init error:", err);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [isArabic, supabase, user?.id]);

    useEffect(() => {
        const fetchAllHistory = async () => {
            setLoading(true);
            try {
                const combined: UnifiedHistoryItem[] = [];

                // 1. Local Medications
                const localMeds: UnifiedHistoryItem[] = getLocalScans().map((item) => ({
                    id: item.id,
                    type: "medication",
                    title: item.drug_name || (isArabic ? "دواء مسجل" : "Medication"),
                    subtitle: item.manufacturer || "",
                    created_at: item.created_at,
                    analysis_json: item.analysis_json,
                    source: "local",
                }));
                combined.push(...localMeds);

                // 2. Supabase Medication History & Wound Scans
                if (userId) {
                    // A) Medications
                    let medQuery = supabase
                        .from("medication_history")
                        .select("*")
                        .eq("user_id", userId)
                        .order("created_at", { ascending: false });

                    if (profileFilter !== "all") {
                        medQuery = medQuery.eq("profile_id", profileFilter);
                    }

                    const { data: remoteMeds } = await medQuery;
                    if (remoteMeds) {
                        for (const rm of remoteMeds) {
                            combined.push({
                                id: rm.id,
                                type: "medication",
                                title: rm.drug_name || (isArabic ? "دواء مسجل" : "Medication"),
                                subtitle: rm.manufacturer || "",
                                created_at: rm.created_at,
                                profile_id: rm.profile_id,
                                user_id: rm.user_id,
                                analysis_json: rm.analysis_json,
                                source: "remote",
                            });
                        }
                    }

                    // B) Wounds
                    try {
                        let woundQuery = supabase
                            .from("wound_scans")
                            .select("*")
                            .eq("user_id", userId)
                            .order("created_at", { ascending: false });

                        if (profileFilter !== "all") {
                            woundQuery = woundQuery.eq("profile_id", profileFilter);
                        }

                        const { data: remoteWounds } = await woundQuery;
                        if (remoteWounds) {
                            for (const rw of remoteWounds) {
                                combined.push({
                                    id: rw.id,
                                    type: "wound",
                                    title: rw.wound_title || (isArabic ? "فحص جرح سريري" : "Wound Scan"),
                                    subtitle: rw.wound_type || "",
                                    severity: rw.severity || "minor",
                                    created_at: rw.created_at,
                                    profile_id: rw.profile_id,
                                    user_id: rw.user_id,
                                    analysis_json: rw.analysis_json,
                                    source: "remote",
                                });
                            }
                        }
                    } catch (wErr) {
                        console.warn("Error fetching wound scans:", wErr);
                    }
                }

                // Deduplicate by type + title + date
                const map = new Map<string, UnifiedHistoryItem>();
                for (const item of combined) {
                    const key = `${item.type}_${(item.title || "").toLowerCase().trim()}_${(item.created_at || "").slice(0, 10)}`;
                    map.set(key, item);
                }

                const sorted = Array.from(map.values()).sort(
                    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );

                setHistory(sorted);
            } catch (e) {
                console.error("Failed to load full history:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchAllHistory();
    }, [profileFilter, supabase, userId, isArabic]);

    // Counts for Category Tabs
    const medCount = history.filter((h) => h.type === "medication").length;
    const woundCount = history.filter((h) => h.type === "wound").length;
    const totalCount = history.length;

    const filteredHistory = history.filter((item) => {
        const matchesCategory = categoryFilter === "all" || item.type === categoryFilter;
        const matchesSearch =
            (item.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.subtitle || "").toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <main className="min-h-screen w-full pt-16 sm:pt-24 pb-16 sm:pb-20 md:pb-14 px-3 sm:px-6">
            <div className="clinical-page">

                {/* ── Header Section ── */}
                <div className="flex flex-col mb-6 sm:mb-8 gap-5 sm:gap-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
                                {t("Clinical Analysis History", "سجل التحليلات والفحوصات")}
                            </h1>
                            <p className="text-slate-400 text-xs sm:text-sm mt-1">
                                {t(
                                    "Your complete medical archive: prescription medications, wound evaluations, and trauma triage.",
                                    "أرشيفك الصحي المتكامل: سجل فحص الأدوية والروشتات، وتقييمات الجروح والإصابات."
                                )}
                            </p>
                        </div>

                        <Button href="/scan" className="w-full sm:w-auto gap-2 font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl">
                            <Sparkles className="w-4 h-4" />
                            <span>{t("Start New Scan", "ابدأ فحصاً جديداً")}</span>
                        </Button>
                    </div>

                    {/* ── Category Tabs (All / Medications / Wounds) ── */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                        <button
                            onClick={() => setCategoryFilter("all")}
                            className={cn(
                                "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center gap-2",
                                categoryFilter === "all"
                                    ? "bg-white text-slate-950 shadow-md"
                                    : "bg-white/[0.04] border border-white/10 text-slate-400 hover:text-white"
                            )}
                        >
                            <span>{t("All Records", "كافة السجلات")}</span>
                            <span className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full font-mono font-bold",
                                categoryFilter === "all" ? "bg-slate-200 text-slate-950" : "bg-white/10 text-slate-300"
                            )}>
                                {totalCount}
                            </span>
                        </button>

                        <button
                            onClick={() => setCategoryFilter("medication")}
                            className={cn(
                                "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center gap-2",
                                categoryFilter === "medication"
                                    ? "bg-cyan-500 text-slate-950 shadow-md font-extrabold"
                                    : "bg-white/[0.04] border border-white/10 text-slate-400 hover:text-white"
                            )}
                        >
                            <Pill className="w-3.5 h-3.5" />
                            <span>{t("Medications & Rx", "سجل الأدوية والروشتات")}</span>
                            <span className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full font-mono font-bold",
                                categoryFilter === "medication" ? "bg-cyan-900 text-cyan-200" : "bg-white/10 text-slate-300"
                            )}>
                                {medCount}
                            </span>
                        </button>

                        <button
                            onClick={() => setCategoryFilter("wound")}
                            className={cn(
                                "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center gap-2",
                                categoryFilter === "wound"
                                    ? "bg-emerald-500 text-slate-950 shadow-md font-extrabold"
                                    : "bg-white/[0.04] border border-white/10 text-slate-400 hover:text-white"
                            )}
                        >
                            <Bandage className="w-3.5 h-3.5" />
                            <span>{t("Wounds & Trauma", "سجل الجروح والإصابات")}</span>
                            <span className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full font-mono font-bold",
                                categoryFilter === "wound" ? "bg-emerald-900 text-emerald-200" : "bg-white/10 text-slate-300"
                            )}>
                                {woundCount}
                            </span>
                        </button>
                    </div>

                    {/* ── Profile Filter (Family Mode) & Search ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {userId && (
                            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                                <Users className="w-4 h-4 text-cyan-400 shrink-0" />
                                <select
                                    value={profileFilter}
                                    onChange={(e) => setProfileFilter(e.target.value)}
                                    className="bg-transparent border-none text-xs sm:text-sm text-white focus:outline-none w-full cursor-pointer"
                                >
                                    <option value="all" className="bg-slate-900 text-white">{t("All Care Profiles", "جميع أفراد العائلة")}</option>
                                    {careProfiles.map((p) => (
                                        <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                                            {p.display_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Search Bar */}
                        <div className={cn("relative", userId ? "sm:col-span-2" : "sm:col-span-3")}>
                            <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 focus-within:border-white/25 transition-colors">
                                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                                <input
                                    type="text"
                                    placeholder={t("Search by drug name, wound diagnosis, or details...", "ابحث باسم الدواء، تشخيص الجرح، أو الشركة المصنعة...")}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-transparent border-none px-2 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none"
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm("")} className="text-slate-400 hover:text-white">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Clinical Cards Grid ── */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-44 rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                        {filteredHistory.map((item) => {
                            const isWound = item.type === "wound";
                            return (
                                <motion.div
                                    key={item.id}
                                    layoutId={item.id}
                                    onClick={() => setSelectedItem(item)}
                                    className="cursor-pointer group"
                                    whileHover={{ y: -2 }}
                                    transition={{ duration: 0.18 }}
                                >
                                    <div className={cn(
                                        "h-full p-5 sm:p-6 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between",
                                        isWound
                                            ? "border-white/10 hover:border-emerald-500/30 bg-slate-900/60 hover:bg-slate-900/90"
                                            : "border-white/10 hover:border-cyan-500/30 bg-slate-900/60 hover:bg-slate-900/90"
                                    )}>
                                        <div>
                                            <div className="flex justify-between items-start mb-3 gap-2">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                                                    isWound
                                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                                        : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                                                )}>
                                                    {isWound ? <Bandage className="w-5 h-5" /> : <Pill className="w-5 h-5" />}
                                                </div>

                                                <div className="flex flex-col items-end gap-1 shrink-0">
                                                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                                                        <Calendar className="w-3 h-3 text-slate-500" />
                                                        {item.created_at ? new Date(item.created_at).toLocaleDateString(isArabic ? "ar-EG" : "en-US", { month: "short", day: "numeric" }) : "—"}
                                                    </span>
                                                    <span className={cn(
                                                        "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase",
                                                        isWound ? "bg-emerald-500/15 text-emerald-300" : "bg-cyan-500/15 text-cyan-300"
                                                    )}>
                                                        {isWound ? (isArabic ? "تقييم جروح" : "Wound Triage") : (isArabic ? "دواء" : "Rx")}
                                                    </span>
                                                </div>
                                            </div>

                                            <h3 className="text-base sm:text-lg font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors truncate">
                                                {item.title}
                                            </h3>
                                            <p className="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                                                {item.subtitle || (isWound ? t("Clinical wound triage & dressing report.", "تقرير التقييم السريري للجرح والتضميد.") : t("Medication safety analysis report.", "تقرير تحليل السلامة الدوائية."))}
                                            </p>
                                        </div>

                                        <div className="flex items-center text-xs text-slate-400 justify-between pt-3 border-t border-white/[0.06] mt-auto">
                                            {isWound ? (
                                                <span className={cn(
                                                    "flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold uppercase",
                                                    item.severity === "emergency" ? "bg-rose-600 text-white" : item.severity === "severe" ? "bg-rose-500/20 text-rose-300" : "bg-emerald-500/20 text-emerald-300"
                                                )}>
                                                    <ShieldAlert className="w-3 h-3" />
                                                    <span>{item.severity || "Minor"}</span>
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 rounded-lg bg-white/[0.04] px-2 py-0.5 text-[11px]">
                                                    <Activity className="w-3 h-3 text-cyan-400" />
                                                    <span>{t("Verified Rx", "دواء موثق")}</span>
                                                </span>
                                            )}

                                            <span className="text-slate-300 font-semibold flex items-center gap-1 text-xs group-hover:text-white group-hover:translate-x-0.5 transition-all">
                                                <span>{t("View Details", "عرض التفاصيل")}</span>
                                                <ChevronRight className={cn("w-3.5 h-3.5 shrink-0", isArabic ? "rotate-180" : "")} />
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* ── Empty State ── */}
                {!loading && filteredHistory.length === 0 && (
                    <div className="text-center py-16 sm:py-20 text-slate-400">
                        <History className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                        <p className="text-sm font-semibold text-white">{t("No clinical history found in this category.", "لا توجد سجلات مطابقة في هذا التصنيف.")}</p>
                        <p className="text-xs text-slate-500 mt-1">{t("Try switching the category filter or start a new scan.", "جرّب تغيير التصنيف أو ابدأ فحصًا جديدًا الآن.")}</p>
                        <Button href="/scan" size="sm" className="mt-4 gap-2 bg-slate-800 hover:bg-slate-700 text-white border border-white/10 rounded-xl">
                            <Sparkles className="w-4 h-4" />
                            <span>{t("Start a Scan", "بدء فحص جديد")}</span>
                        </Button>
                    </div>
                )}

                {/* ── Detail Modal (Dynamically Renders MedicalResultCard OR WoundResultCard) ── */}
                <AnimatePresence>
                    {selectedItem && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md"
                            onClick={() => setSelectedItem(null)}
                        >
                            <motion.div
                                layoutId={selectedItem.id}
                                className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl relative no-scrollbar"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="absolute top-4 end-4 z-50 p-2 rounded-full bg-slate-900 hover:bg-slate-800 border border-white/10 text-white transition-colors"
                                    title={t("Close", "إغلاق")}
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                {selectedItem.type === "wound" || selectedItem.analysis_json?.woundTitle ? (
                                    <WoundResultCard
                                        result={selectedItem.analysis_json || selectedItem}
                                        onResetScan={() => setSelectedItem(null)}
                                    />
                                ) : (
                                    <MedicalResultCard data={selectedItem.analysis_json} />
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </main>
    );
}

function History({ className }: { className?: string }) {
    return <Calendar className={className} />;
}
