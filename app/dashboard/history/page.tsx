"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { MedicalResultCard } from "@/components/scanner/MedicalResultCard";
import { Activity, Calendar, ChevronRight, Pill, Search, Users, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { useSettings } from "@/context/SettingsContext";
import { getLocalScans, mergeHistoryItems } from "@/lib/localHistory";
import { cn } from "@/lib/utils";

export default function HistoryPage() {
    const supabase = useMemo(() => createClient(), []);
    const { resultsLanguage } = useSettings();
    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [userId, setUserId] = useState<string | null>(null);
    const [careProfiles, setCareProfiles] = useState<Array<{ id: string; display_name: string }>>([]);
    const [profileFilter, setProfileFilter] = useState<string>("all");
    const { user } = useUser();
    const hasLocalDevCookie =
        typeof document !== "undefined" &&
        document.cookie.split("; ").some((cookie) => cookie === "qurescan_dev_auth=1");
    const isLocalDevUser = process.env.NODE_ENV === "development" && (user?.id === "local-dev-user" || hasLocalDevCookie);

    useEffect(() => {
        const init = async () => {
            try {
                const localItems = getLocalScans();
                if (isLocalDevUser) {
                    const localUserId = user?.id || "local-dev-user";
                    setUserId(localUserId);
                    setCareProfiles([{ id: localUserId, display_name: isArabic ? "أنا (المطور)" : "Local Dev" }]);
                    setProfileFilter("all");
                    setHistory(localItems);
                    return;
                }

                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (!authUser) {
                    setUserId(null);
                    setHistory(localItems);
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
                setHistory(getLocalScans());
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [isArabic, isLocalDevUser, supabase, user?.id]);

    useEffect(() => {
        const fetchHistory = async () => {
            const localItems = getLocalScans();
            if (!userId) {
                setHistory(localItems);
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                let res = await supabase
                    .from("medication_history")
                    .select("*")
                    .eq("user_id", userId)
                    .order("created_at", { ascending: false });

                if (profileFilter !== "all") {
                    res = await supabase
                        .from("medication_history")
                        .select("*")
                        .eq("user_id", userId)
                        .eq("profile_id", profileFilter)
                        .order("created_at", { ascending: false });

                    if (res.error && String(res.error.message || "").toLowerCase().includes("profile_id")) {
                        res = await supabase
                            .from("medication_history")
                            .select("*")
                            .eq("user_id", userId)
                            .order("created_at", { ascending: false });
                    }
                }

                const remoteRows = res.error ? [] : (res.data || []);
                const merged = mergeHistoryItems(remoteRows, localItems);
                setHistory(merged);
            } catch {
                setHistory(localItems);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [profileFilter, supabase, userId]);

    const filteredHistory = history.filter(item =>
        (item.drug_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.manufacturer || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <main className="min-h-screen w-full pt-24 sm:pt-28 pb-24 md:pb-14 px-3 sm:px-6">
            <div className="clinical-page">

                {/* ── Header Section ── */}
                <div className="flex flex-col mb-6 sm:mb-8 gap-5 sm:gap-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
                                {t("Analysis History", "سجل التحليلات")}
                            </h1>
                            <p className="text-slate-400 text-xs sm:text-sm mt-1">
                                {t("Your personal medication review database.", "قاعدة بياناتك الشخصية لمراجعة الأدوية.")}
                            </p>
                        </div>

                        <Link href="/scan" className="w-full sm:w-auto">
                            <Button className="w-full sm:w-auto gap-2 font-bold" glow>
                                <Pill className="w-4 h-4" />
                                <span>{t("Start new analysis", "ابدأ فحصًا جديدًا")}</span>
                            </Button>
                        </Link>
                    </div>

                    {userId && (
                        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2 text-slate-400 text-xs sm:text-sm">
                                <Users className="w-4 h-4 text-cyan-400 shrink-0" />
                                <span>{t("Filter by profile:", "تصفية حسب الملف:")}</span>
                            </div>
                            <select
                                value={profileFilter}
                                onChange={(e) => setProfileFilter(e.target.value)}
                                className="clinical-input w-full sm:w-64 text-xs sm:text-sm"
                            >
                                <option value="all">{t("All profiles", "جميع الملفات")}</option>
                                {careProfiles.map((p) => (
                                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                                        {p.display_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* ── Search Bar ── */}
                    <div className="relative w-full">
                        <GlassCard className="p-0 flex items-center overflow-hidden border-white/10 focus-within:border-cyan-400/50 transition-colors" hoverEffect={false}>
                            <div className="ps-4 text-slate-400 shrink-0">
                                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <input
                                type="text"
                                placeholder={t("Search by drug name or manufacturer...", "ابحث باسم الدواء أو الشركة المصنعة...")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-transparent border-none py-3 sm:py-3.5 px-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-0"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="pe-4 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </GlassCard>
                    </div>
                </div>

                {/* ── Medication Cards Grid ── */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-44 rounded-2xl skeleton" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                        {filteredHistory.map((item) => {
                            const desc = item.analysis_json?.description || item.analysis_json?.uses?.join(", ") || "";
                            const usesCount = item.analysis_json?.uses?.length || 0;
                            return (
                                <motion.div
                                    key={item.id}
                                    layoutId={item.id}
                                    onClick={() => setSelectedItem(item)}
                                    className="cursor-pointer group"
                                    whileHover={{ y: -2 }}
                                    transition={{ duration: 0.18 }}
                                >
                                    <GlassCard className="h-full p-5 sm:p-6 border-white/10 hover:border-cyan-400/30 transition-all group-hover:bg-white/[0.06] relative overflow-hidden flex flex-col justify-between" hoverEffect={false}>
                                        <div>
                                            <div className="flex justify-between items-start mb-3 gap-2">
                                                <div className="icon-badge icon-badge-cyan w-10 h-10 rounded-xl group-hover:scale-105 transition-transform shrink-0">
                                                    <Pill className="w-5 h-5 text-cyan-300" />
                                                </div>
                                                <div className="flex flex-col items-end gap-1 shrink-0">
                                                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                                                        <Calendar className="w-3 h-3 text-slate-500" />
                                                        {item.created_at ? new Date(item.created_at).toLocaleDateString(isArabic ? "ar-SA" : "en-US") : "—"}
                                                    </span>
                                                    {profileFilter === "all" && (
                                                        <span className="text-[10px] text-slate-400 bg-white/[0.05] border border-white/10 px-2 py-0.5 rounded-full max-w-[140px] truncate">
                                                            {careProfiles.find((p) => p.id === String(item.profile_id || item.user_id || ""))?.display_name || t("Me", "أنا")}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <h3 className="text-base sm:text-lg font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors truncate">
                                                {item.drug_name}
                                            </h3>
                                            <p className="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                                                {desc || t("Medication safety analysis report.", "تقرير تحليل السلامة الدوائية.")}
                                            </p>
                                        </div>

                                        <div className="flex items-center text-xs text-slate-400 justify-between pt-3 border-t border-white/[0.06] mt-auto">
                                            <span className="flex items-center gap-1 rounded-lg bg-white/[0.04] px-2 py-0.5 text-[11px]">
                                                <Activity className="w-3 h-3 text-cyan-400" />
                                                <span>{usesCount} {t("uses", "استخدامات")}</span>
                                            </span>
                                            <span className="text-cyan-300 font-semibold flex items-center gap-1 text-xs group-hover:translate-x-0.5 transition-transform">
                                                <span>{t("View", "عرض")}</span>
                                                <ChevronRight className={cn("w-3.5 h-3.5 shrink-0", isArabic ? "rotate-180" : "")} />
                                            </span>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* ── Empty State ── */}
                {!loading && filteredHistory.length === 0 && (
                    <div className="text-center py-16 sm:py-20 text-slate-400">
                        <Pill className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                        <p className="text-sm font-semibold text-white">{t("No medication history found.", "لا يوجد سجل أدوية مطابق.")}</p>
                        <p className="text-xs text-slate-500 mt-1">{t("Try adjusting your search or start a new scan.", "جرّب تغيير عبارة البحث أو ابدأ فحصًا جديدًا.")}</p>
                        <Link href="/scan" className="mt-4 inline-block">
                            <Button size="sm" glow className="gap-2">
                                <Pill className="w-4 h-4" />
                                <span>{t("Scan medication", "فحص دواء")}</span>
                            </Button>
                        </Link>
                    </div>
                )}

                {/* ── Detail Modal ── */}
                <AnimatePresence>
                    {selectedItem && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md"
                            onClick={() => setSelectedItem(null)}
                        >
                            <motion.div
                                layoutId={selectedItem.id}
                                className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl relative no-scrollbar"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="absolute top-4 end-4 z-50 p-2 rounded-full bg-slate-950/80 hover:bg-rose-500/80 border border-white/10 text-white transition-colors backdrop-blur-md"
                                    title={t("Close", "إغلاق")}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <MedicalResultCard data={selectedItem.analysis_json} />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </main>
    );
}
