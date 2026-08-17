"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
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
    Trash2,
    Download,
    RefreshCw,
    AlertTriangle,
    Loader2,
    MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { useSettings } from "@/context/SettingsContext";
import { getLocalScans, deleteLocalScan, clearLocalScans } from "@/lib/localHistory";
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
    const [refreshing, setRefreshing] = useState(false);
    const [selectedItem, setSelectedItem] = useState<UnifiedHistoryItem | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [userId, setUserId] = useState<string | null>(null);
    const [careProfiles, setCareProfiles] = useState<Array<{ id: string; display_name: string }>>([]);
    const [profileFilter, setProfileFilter] = useState<string>("all");
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<UnifiedHistoryItem | null>(null);
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

                const { data: authData } = await supabase.auth.getUser();
                const authUser = authData?.user ?? null;
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

    const fetchAllHistory = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

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
            if (userId && userId !== "local-dev-user") {
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

            // High Precision Deduplication (Uses ID or exact timestamp down to second, never collapsing days)
            const map = new Map<string, UnifiedHistoryItem>();
            for (const item of combined) {
                // If item has a specific unique ID, use it. Otherwise use exact second timestamp.
                const key = item.id || `${item.type}_${(item.title || "").toLowerCase().trim()}_${(item.created_at || "").slice(0, 19)}`;
                if (!map.has(key) || item.source === "remote") {
                    map.set(key, item);
                }
            }

            const sorted = Array.from(map.values()).sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            setHistory(sorted);
        } catch (e) {
            console.error("Failed to load full history:", e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [isArabic, profileFilter, supabase, userId]);

    useEffect(() => {
        fetchAllHistory();
    }, [fetchAllHistory]);

    // Handle Request to Delete a Single History Record (Opens confirmation modal)
    const handleDeleteItem = (e: React.MouseEvent, item: UnifiedHistoryItem) => {
        e.stopPropagation();
        setItemToDelete(item);
    };

    // Execute deletion after user confirms in modal
    const confirmDeleteItem = async () => {
        if (!itemToDelete || deletingId) return;

        const item = itemToDelete;
        setDeletingId(item.id);
        try {
            // 1. Remove from local storage
            deleteLocalScan(item.id);

            // 2. Remove from Supabase if remote
            if (userId && item.source === "remote") {
                const table = item.type === "wound" ? "wound_scans" : "medication_history";
                await supabase.from(table).delete().eq("id", item.id).eq("user_id", userId);
            }

            // 3. Update state
            setHistory((prev) => prev.filter((h) => h.id !== item.id));
            if (selectedItem?.id === item.id) {
                setSelectedItem(null);
            }
            setItemToDelete(null);
        } catch (err) {
            console.error("Failed to delete history item:", err);
        } finally {
            setDeletingId(null);
        }
    };

    // Handle Clearing All Records
    const handleClearAll = async () => {
        try {
            clearLocalScans();
            if (userId && userId !== "local-dev-user") {
                await supabase.from("medication_history").delete().eq("user_id", userId);
                await supabase.from("wound_scans").delete().eq("user_id", userId);
            }
            setHistory([]);
            setShowClearConfirm(false);
            setSelectedItem(null);
        } catch (err) {
            console.error("Failed to clear all history:", err);
        }
    };

    // Export History
    const handleExportHistory = () => {
        const exportData = history.map((item) => ({
            id: item.id,
            type: item.type,
            title: item.title,
            subtitle: item.subtitle,
            severity: item.severity,
            created_at: item.created_at,
            analysis: item.analysis_json,
        }));

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `qurescan_history_export_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Counts for Category Tabs
    const medCount = history.filter((h) => h.type === "medication").length;
    const woundCount = history.filter((h) => h.type === "wound").length;
    const totalCount = history.length;

    const filteredHistory = history.filter((item) => {
        const matchesCategory = categoryFilter === "all" || item.type === categoryFilter;
        const locationStr = item.analysis_json?.anatomicalLocation?.location || item.analysis_json?.anatomical_location || "";
        const matchesSearch =
            (item.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.subtitle || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            locationStr.toLowerCase().includes(searchTerm.toLowerCase());
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

                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                onClick={() => fetchAllHistory(true)}
                                disabled={refreshing}
                                className="h-10 inline-flex items-center gap-2 px-3.5 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white transition-all disabled:opacity-50 shadow-sm"
                                title={t("Refresh history", "تحديث السجل")}
                            >
                                <RefreshCw className={cn("w-4 h-4 text-slate-300", refreshing && "animate-spin text-cyan-400")} />
                                <span>{t("Refresh", "تحديث")}</span>
                            </button>

                            {history.length > 0 && (
                                <>
                                    <button
                                        onClick={handleExportHistory}
                                        className="h-10 inline-flex items-center gap-2 px-3.5 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white transition-all shadow-sm"
                                        title={t("Export history JSON", "تصدير السجل")}
                                    >
                                        <Download className="w-4 h-4 text-cyan-400" />
                                        <span>{t("Export", "تصدير")}</span>
                                    </button>

                                    <button
                                        onClick={() => setShowClearConfirm(true)}
                                        className="h-10 inline-flex items-center gap-2 px-3.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 hover:text-rose-200 transition-all shadow-sm"
                                        title={t("Clear all history", "مسح كافة السجلات")}
                                    >
                                        <Trash2 className="w-4 h-4 text-rose-400" />
                                        <span>{t("Clear All", "مسح الكل")}</span>
                                    </button>
                                </>
                            )}

                            <Button href="/scan" className="h-10 inline-flex items-center gap-2 px-4 font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm">
                                <Sparkles className="w-4 h-4 text-emerald-100" />
                                <span>{t("Start New Scan", "ابدأ فحصاً جديداً")}</span>
                            </Button>
                        </div>
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
                            const isDeleting = deletingId === item.id;

                            return (
                                <motion.div
                                    key={item.id}
                                    layoutId={item.id}
                                    onClick={() => setSelectedItem(item)}
                                    className={cn("cursor-pointer group relative", isDeleting && "opacity-40 pointer-events-none")}
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

                                                <div className="flex items-center gap-2">
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

                                                    <button
                                                        onClick={(e) => handleDeleteItem(e, item)}
                                                        className="p-1.5 rounded-lg opacity-80 sm:opacity-0 group-hover:opacity-100 bg-white/5 hover:bg-rose-500/20 border border-transparent hover:border-rose-500/30 text-slate-400 hover:text-rose-300 transition-all"
                                                        title={t("Delete scan", "حذف الفحص")}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            <h3 className="text-base sm:text-lg font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors truncate">
                                                {item.title}
                                            </h3>

                                            {isWound && (
                                                <div className="mb-2 flex items-center gap-1.5 text-xs text-cyan-300 font-medium bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded-lg w-fit">
                                                    <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                                                    <span className="truncate">
                                                        {item.analysis_json?.anatomicalLocation?.location || item.analysis_json?.anatomical_location || (isArabic ? "الموضع: الساعد أو الذراع" : "Loc: Forearm / Arm")}
                                                    </span>
                                                </div>
                                            )}

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
                        <HistoryIcon className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                        <p className="text-sm font-semibold text-white">{t("No clinical history found in this category.", "لا توجد سجلات مطابقة في هذا التصنيف.")}</p>
                        <p className="text-xs text-slate-500 mt-1">{t("Try switching the category filter or start a new scan.", "جرّب تغيير التصنيف أو ابدأ فحصًا جديدًا الآن.")}</p>
                        <Button href="/scan" size="sm" className="mt-4 gap-2 bg-slate-800 hover:bg-slate-700 text-white border border-white/10 rounded-xl">
                            <Sparkles className="w-4 h-4" />
                            <span>{t("Start a Scan", "بدء فحص جديد")}</span>
                        </Button>
                    </div>
                )}

                {/* ── Clear All Confirmation Modal ── */}
                <AnimatePresence>
                    {showClearConfirm && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                            onClick={() => setShowClearConfirm(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full max-w-md p-6 rounded-2xl border border-rose-500/20 bg-slate-900/95 text-white space-y-4 shadow-2xl"
                            >
                                <div className="flex items-center gap-3 text-rose-400">
                                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                                        <AlertTriangle className="w-5 h-5 text-rose-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base text-white">
                                            {t("Clear All History?", "مسح كافة السجلات؟")}
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                            {t("This action cannot be undone.", "لا يمكن التراجع عن هذا الإجراء.")}
                                        </p>
                                    </div>
                                </div>

                                <p className="text-xs text-slate-300 leading-relaxed">
                                    {t(
                                        "All your local and synced prescription scans, wound triage records, and clinical reports will be permanently deleted.",
                                        "سيتم حذف جميع سجلات فحص الأدوية والروشتات، وتقارير الجروح السريرية من حسابك وجهازك نهائياً."
                                    )}
                                </p>

                                <div className="flex items-center justify-end gap-2.5 pt-2">
                                    <button
                                        onClick={() => setShowClearConfirm(false)}
                                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                                    >
                                        {t("Cancel", "إلغاء")}
                                    </button>
                                    <button
                                        onClick={handleClearAll}
                                        className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors flex items-center gap-1.5"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>{t("Yes, Clear Everything", "نعم، احذف الكل")}</span>
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Single Item Delete Confirmation Modal ── */}
                <AnimatePresence>
                    {itemToDelete && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                            onClick={() => !deletingId && setItemToDelete(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full max-w-md p-6 rounded-2xl border border-rose-500/25 bg-slate-900/95 text-white space-y-4 shadow-2xl"
                            >
                                <div className="flex items-center gap-3 text-rose-400">
                                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                                        <Trash2 className="w-5 h-5 text-rose-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base text-white">
                                            {t("Delete this record?", "تأكيد حذف السجل؟")}
                                        </h3>
                                        <p className="text-xs text-slate-400 truncate max-w-[260px]">
                                            {itemToDelete.title}
                                        </p>
                                    </div>
                                </div>

                                <p className="text-xs text-slate-300 leading-relaxed">
                                    {t(
                                        "Are you sure you want to remove this medical record? It will be deleted from your saved history.",
                                        "هل أنت متأكد من رغبتك في حذف هذا السجل الطبي؟ سيتم حذفه من سجلاتك المحفوظة نهائياً."
                                    )}
                                </p>

                                <div className="flex items-center justify-end gap-2.5 pt-2">
                                    <button
                                        disabled={!!deletingId}
                                        onClick={() => setItemToDelete(null)}
                                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
                                    >
                                        {t("Cancel", "إلغاء")}
                                    </button>
                                    <button
                                        disabled={!!deletingId}
                                        onClick={confirmDeleteItem}
                                        className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                    >
                                        {deletingId ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-3.5 h-3.5" />
                                        )}
                                        <span>{t("Delete", "تأكيد الحذف")}</span>
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

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

function HistoryIcon({ className }: { className?: string }) {
    return <Calendar className={className} />;
}
