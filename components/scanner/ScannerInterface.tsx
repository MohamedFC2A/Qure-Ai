"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, ScanLine, FileText, Brain, CheckCircle, Loader2, ListTodo, History, Sparkles, Zap, Timer, AlertCircle, AlertTriangle, ChevronRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { MedicalResultCard } from './MedicalResultCard';
import { useSettings } from '@/context/SettingsContext';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { AI_DISPLAY_NAME } from '@/lib/ai/branding';
import { useScan } from '@/context/ScanContext';

export const ScannerInterface = () => {
    const { user, plan, loading } = useUser();
    const {
        file,
        previewSrc,
        isScanning,
        steps,
        totalDuration,
        finalResult,
        errorMsg,
        errorAction,
        subjectProfileId,
        setSubjectProfileId,
        setFile,
        resetScan,
        startScan,
    } = useScan();
    const { resultsLanguage } = useSettings();

    const isArabic = resultsLanguage === 'ar';
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    const supabaseRef = useRef<any>(null);
    if (!supabaseRef.current) supabaseRef.current = createClient();
    const supabase = supabaseRef.current;

    const [recentHistory, setRecentHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const [careProfiles, setCareProfiles] = useState<Array<{ id: string; display_name: string; relationship?: string | null }>>([]);
    const [careLoading, setCareLoading] = useState(false);
    const [carePickerOpen, setCarePickerOpen] = useState(false);
    const [careTempId, setCareTempId] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles[0]) {
            setFile(acceptedFiles[0]);
        }
    }, [setFile]);

    const fetchRecentHistory = useCallback(async () => {
        if (!user?.id) {
            setRecentHistory([]);
            return;
        }

        setHistoryLoading(true);
        try {
            const effectiveProfileId = subjectProfileId || user.id;
            let res = await supabase
                .from("medication_history")
                .select("id, drug_name, manufacturer, created_at")
                .eq("user_id", user.id)
                .eq("profile_id", effectiveProfileId)
                .order("created_at", { ascending: false })
                .limit(5);

            if (res.error && String(res.error.message || "").toLowerCase().includes("profile_id")) {
                // Legacy fallback (before profile_id existed)
                res = await supabase
                    .from("medication_history")
                    .select("id, drug_name, manufacturer, created_at")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false })
                    .limit(5);
            }

            if (res.error) {
                console.error("History fetch error:", res.error);
                setRecentHistory([]);
                return;
            }

            setRecentHistory(res.data || []);
        } finally {
            setHistoryLoading(false);
        }
    }, [supabase, subjectProfileId, user?.id]);

    useEffect(() => {
        fetchRecentHistory();
    }, [fetchRecentHistory]);

    const fetchCareProfiles = useCallback(async () => {
        if (!user?.id) {
            setCareProfiles([]);
            return;
        }

        setCareLoading(true);
        try {
            const res = await supabase
                .from("care_profiles")
                .select("id, display_name, relationship, created_at")
                .eq("owner_user_id", user.id)
                .order("created_at", { ascending: true });

            if (res.error) {
                // If the table isn't available yet, fall back to "self".
                setCareProfiles([{ id: user.id, display_name: String(user.email || "Me"), relationship: "self" }]);
                return;
            }

            const rows: Array<{ id: string; display_name: string; relationship?: string | null }> = (res.data || []).map((r: any) => ({
                id: String(r.id),
                display_name: String(r.display_name || "Me"),
                relationship: r.relationship ?? null,
            }));

            // Keep self first if present.
            rows.sort((a, b) => {
                const aSelf = a.id === user.id || a.relationship === "self";
                const bSelf = b.id === user.id || b.relationship === "self";
                if (aSelf && !bSelf) return -1;
                if (!aSelf && bSelf) return 1;
                return a.display_name.localeCompare(b.display_name);
            });

            setCareProfiles(rows.length ? rows : [{ id: user.id, display_name: String(user.email || "Me"), relationship: "self" }]);
        } finally {
            setCareLoading(false);
        }
    }, [supabase, user?.id]);

    useEffect(() => {
        fetchCareProfiles();
    }, [fetchCareProfiles]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
        maxFiles: 1,
    });

    useEffect(() => {
        if (finalResult && user?.id) {
            fetchRecentHistory();
        }
    }, [finalResult, fetchRecentHistory, user?.id]);

    useEffect(() => {
        if (!user?.id) return;
        if (!subjectProfileId) {
            setSubjectProfileId(user.id);
            return;
        }
        const exists = careProfiles.some((p) => p.id === subjectProfileId);
        if (!exists && careProfiles.length > 0) {
            setSubjectProfileId(careProfiles[0].id);
        }
    }, [careProfiles, setSubjectProfileId, subjectProfileId, user?.id]);

    const activeCareProfile = careProfiles.find((p) => p.id === (subjectProfileId || user?.id)) || null;

    const openCarePickerAndStart = () => {
        if (!user?.id) return;
        const effective = subjectProfileId || user.id;
        if (plan === "ultra" && careProfiles.length > 1) {
            setCareTempId(effective);
            setCarePickerOpen(true);
            return;
        }
        setSubjectProfileId(effective);
        void startScan(effective);
    };

    const confirmCarePicker = () => {
        if (!user?.id) return;
        const chosen = careTempId || user.id;
        setCarePickerOpen(false);
        setSubjectProfileId(chosen);
        void startScan(chosen);
    };

    // calculate current duration for running step?
    // Not strictly needed if steps are fast, but nice to have.
    // For simplicity, we just show "..." or a spinner when running, and final time when done.

    // Progress List Component
    const Timeline = () => {
        const totalStepsCount = steps.length || 1;
        const doneCount = steps.filter((s) => s.status === "done").length;
        const runningIndex = steps.findIndex((s) => s.status === "running");
        const hasError = steps.some((s) => s.status === "error") || Boolean(errorMsg);

        const progress =
            (doneCount + (runningIndex !== -1 && isScanning ? 0.5 : 0)) / totalStepsCount;
        const percent = Math.max(0, Math.min(100, Math.round(progress * 100)));

        const statusLabel = hasError
            ? t("Error", "خطأ")
            : isScanning
                ? t("Running", "جارٍ")
                : t("Ready", "جاهز");

        return (
            <div className="w-full lg:mr-12 relative group">
                {/* Premium Glassmorphism Card */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />

                <div className="relative bg-black/50 backdrop-blur-xl rounded-3xl p-5 sm:p-7 border border-white/10 shadow-2xl hover:shadow-cyan-500/10 transition-all duration-500">
                    {/* Header - Compact on mobile */}
                    <div className="relative">
                        <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-xl sm:rounded-2xl blur-sm opacity-60" />
                        <div className="relative flex items-start justify-between gap-3 sm:gap-4 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-white/10">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                                    <div className="relative">
                                        {/* Remove pulsing blur on mobile for performance */}
                                        <div className="hidden sm:block absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg sm:rounded-xl blur-sm sm:blur-md opacity-50 animate-pulse" />
                                        <div className="relative p-2 sm:p-2.5 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg sm:rounded-xl border border-cyan-400/30">
                                            <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300" />
                                        </div>
                                    </div>
                                    <h3 className="text-white font-bold text-base sm:text-lg lg:text-xl bg-gradient-to-r from-white via-cyan-100 to-blue-100 bg-clip-text text-transparent">
                                        {AI_DISPLAY_NAME} Processor
                                    </h3>
                                </div>
                                <p className="text-[11px] sm:text-xs lg:text-sm text-white/60 leading-relaxed ml-10 sm:ml-[52px]">
                                    {t(
                                        "Browse freely — your scan continues in the background.",
                                        "تقدر تتصفح بحرّية — الفحص مستمر في الخلفية."
                                    )}
                                </p>
                            </div>

                            <div className="shrink-0 flex flex-col items-end gap-1.5 sm:gap-2">
                                {/* Animated Status Badge */}
                                <div className={cn(
                                    "px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold border backdrop-blur-sm transition-all duration-300",
                                    hasError
                                        ? "bg-red-500/20 text-red-200 border-red-400/40 shadow-lg shadow-red-500/20"
                                        : isScanning
                                            ? "bg-cyan-500/20 text-cyan-100 border-cyan-400/40 shadow-lg shadow-cyan-500/20 animate-pulse"
                                            : "bg-emerald-500/20 text-emerald-100 border-emerald-400/40 shadow-lg shadow-emerald-500/10"
                                )}>
                                    <span className="flex items-center gap-1 sm:gap-1.5">
                                        <span className={cn(
                                            "w-1.5 h-1.5 rounded-full",
                                            hasError ? "bg-red-400" : isScanning ? "bg-cyan-400 animate-pulse" : "bg-emerald-400"
                                        )} />
                                        {statusLabel}
                                    </span>
                                </div>

                                {/* Timer */}
                                <div className="relative group/timer">
                                    <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-full opacity-0 group-hover/timer:opacity-100 transition-opacity duration-300" />
                                    <div className="relative flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-full border border-white/20">
                                        <Timer className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-300" />
                                        <span className="text-white font-mono text-xs sm:text-sm font-semibold tabular-nums">
                                            {`${totalDuration}s`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Progress Section */}
                    <div className="mt-4 sm:mt-6">
                        <div className="flex items-center justify-between text-[10px] sm:text-xs text-white/60 mb-2 sm:mb-3">
                            <span className="font-semibold">{t("Progress", "التقدم")}</span>
                            <span className="font-mono font-bold tabular-nums text-cyan-300">{doneCount}/{totalStepsCount}</span>
                        </div>

                        {/* Optimized Progress Bar - No shimmer on mobile */}
                        <div className="relative">
                            <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-sm" />
                            <div
                                className="relative h-2.5 sm:h-3 rounded-full bg-gradient-to-r from-white/5 to-white/10 overflow-hidden border border-white/20 shadow-inner"
                                role="progressbar"
                                aria-valuenow={percent}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={t("Scan progress", "تقدم الفحص")}
                                style={{ willChange: 'auto' }}
                            >
                                {/* Simplified gradient fill - no shimmer on mobile */}
                                <div
                                    className={cn(
                                        "absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full transition-all duration-700 ease-out shadow-lg shadow-cyan-500/50",
                                        isArabic && "left-auto right-0 bg-gradient-to-l from-cyan-400 via-blue-500 to-purple-500"
                                    )}
                                    style={{ width: `${percent}%`, willChange: 'width' }}
                                >
                                    {/* Shimmer effect - desktop only */}
                                    <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]"
                                        style={{
                                            backgroundSize: '200% 100%',
                                            animation: 'shimmer 2s infinite'
                                        }} />
                                </div>

                                {/* Percentage text */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-[9px] sm:text-[10px] font-bold text-white/90 drop-shadow-lg">
                                        {percent}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Steps Timeline - Optimized for mobile */}
                    <div className="relative space-y-3 sm:space-y-4 pl-1 mt-5 sm:mt-7">
                        {/* Animated Vertical Line */}
                        <div className="absolute left-[18px] sm:left-[22px] top-3 bottom-3 w-[2px] bg-gradient-to-b from-cyan-500/30 via-blue-500/20 to-purple-500/10 rounded-full" />

                        {steps.map((step, index) => {
                            const isDone = step.status === 'done';
                            const isRunning = step.status === 'running';
                            const isError = step.status === 'error';

                            const seconds = isDone && typeof step.durationMs === "number"
                                ? `${(step.durationMs / 1000).toFixed(1)}s`
                                : isRunning && typeof step.startTime === "number"
                                    ? `${((Date.now() - step.startTime) / 1000).toFixed(1)}s`
                                    : "—";

                            const stepStatusLabel = isDone
                                ? t("Done", "تم")
                                : isRunning
                                    ? t("Running", "جارٍ")
                                    : isError
                                        ? t("Failed", "فشل")
                                        : t("Queued", "قيد الانتظار");

                            return (
                                <div key={step.id} className="relative z-10">
                                    <div className="flex items-start justify-between gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur-sm border border-white/5 hover:border-white/10 hover:bg-white/[0.05] transition-all duration-300">
                                        <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                                            {/* Optimized Step Indicator - No jitter */}
                                            <div className="relative shrink-0" style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}>
                                                {/* Glow effect - simplified on mobile, no scale animation */}
                                                {(isDone || isRunning) && (
                                                    <div className={cn(
                                                        "absolute inset-0 rounded-full blur-sm sm:blur-md transition-all duration-500",
                                                        isDone ? "bg-emerald-400/30 sm:bg-emerald-400/40" : "bg-cyan-400/30 sm:bg-cyan-400/40 animate-pulse"
                                                    )} />
                                                )}

                                                <div className={cn(
                                                    "relative w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-full flex items-center justify-center border-2 transition-all duration-500 shadow-lg bg-gradient-to-br backdrop-blur-sm",
                                                    isDone
                                                        ? "border-emerald-400/60 from-emerald-500/20 to-emerald-600/10 shadow-emerald-500/30"
                                                        : isRunning
                                                            ? "border-cyan-400/60 from-cyan-500/20 to-blue-600/10 shadow-cyan-500/30"
                                                            : isError
                                                                ? "border-red-400/60 from-red-500/20 to-red-600/10 shadow-red-500/30"
                                                                : "border-white/20 from-white/5 to-white/[0.02]"
                                                )}>
                                                    {isDone ? (
                                                        <CheckCircle className="w-5 h-5 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-emerald-300" />
                                                    ) : isRunning ? (
                                                        <Loader2 className="w-5 h-5 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-cyan-300 animate-spin" />
                                                    ) : isError ? (
                                                        <AlertCircle className="w-5 h-5 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-red-300" />
                                                    ) : (
                                                        <span className="text-xs sm:text-sm font-bold tabular-nums text-white/40">{index + 1}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="min-w-0 flex-1 pt-0.5 sm:pt-1">
                                                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-wrap mb-1 sm:mb-1.5">
                                                    <span className={cn(
                                                        "text-xs sm:text-sm lg:text-base font-bold transition-all duration-300 truncate",
                                                        isDone
                                                            ? "text-white"
                                                            : isRunning
                                                                ? "text-cyan-100"
                                                                : "text-white/50"
                                                    )}>
                                                        {step.label}
                                                    </span>

                                                    {/* Status Badge */}
                                                    <span className={cn(
                                                        "px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold border backdrop-blur-sm transition-all duration-300",
                                                        isDone
                                                            ? "bg-emerald-500/15 text-emerald-200 border-emerald-400/30 shadow-sm shadow-emerald-500/20"
                                                            : isRunning
                                                                ? "bg-cyan-500/15 text-cyan-200 border-cyan-400/30 shadow-sm shadow-cyan-500/20 animate-pulse"
                                                                : isError
                                                                    ? "bg-red-500/15 text-red-200 border-red-400/30 shadow-sm shadow-red-500/20"
                                                                    : "bg-white/5 text-white/50 border-white/10"
                                                    )}>
                                                        {stepStatusLabel}
                                                    </span>
                                                </div>
                                                <div className="text-[10px] sm:text-[11px] text-white/40 font-medium">
                                                    {t("Step", "خطوة")} <span className="font-mono tabular-nums text-white/50">{index + 1}/{totalStepsCount}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Duration Badge */}
                                        <div className="shrink-0 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-400/20 backdrop-blur-sm">
                                            <span className="text-[10px] sm:text-xs lg:text-sm text-cyan-300 font-mono font-bold tabular-nums">
                                                {seconds}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {errorMsg && (
                            <div className="mt-4 sm:mt-5 relative animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="absolute -inset-[1px] bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-xl blur-sm" />
                                <div className="relative p-3 sm:p-4 bg-gradient-to-br from-red-500/10 to-red-600/5 backdrop-blur-sm border border-red-400/30 rounded-xl shadow-lg shadow-red-500/10">
                                    <div className="flex items-start gap-2.5 sm:gap-3">
                                        <div className="p-1.5 sm:p-2 bg-red-500/20 rounded-lg border border-red-400/30 shrink-0">
                                            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-300" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-red-200 text-xs sm:text-sm font-semibold leading-relaxed">{errorMsg}</p>

                                            {errorAction === 'login' && (
                                                <div className="mt-3 sm:mt-4 flex flex-wrap gap-2">
                                                    <Link href={`/login?next=${encodeURIComponent('/scan')}`}>
                                                        <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0 shadow-lg shadow-cyan-500/20 text-xs sm:text-sm">
                                                            {t("Log in", "تسجيل الدخول")}
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/signup?next=${encodeURIComponent('/scan')}`}>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-white/20 text-white/90 hover:bg-white/10 backdrop-blur-sm text-xs sm:text-sm"
                                                        >
                                                            {t("Create account", "إنشاء حساب")}
                                                        </Button>
                                                    </Link>
                                                </div>
                                            )}

                                            {errorAction === 'terms' && (
                                                <div className="mt-3 sm:mt-4">
                                                    <Link href={`/terms?next=${encodeURIComponent('/scan')}`}>
                                                        <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold border-0 shadow-lg shadow-amber-500/30 text-xs sm:text-sm">
                                                            {t("Review & accept terms", "مراجعة والموافقة على الشروط")}
                                                        </Button>
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (finalResult && !isScanning) {
        return (
            <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-500 p-4">
                <div className="w-full flex flex-col sm:flex-row justify-between items-center mb-6 max-w-4xl gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-green-500/20 border border-green-500/30">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Analysis Complete</h2>
                            <p className="text-white/50 text-sm">Processed in {totalDuration}s</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/dashboard/history">
                            <Button variant="outline" size="sm" className="gap-2 border-white/20 text-white hover:bg-white/10">
                                <History className="w-4 h-4" /> History
                            </Button>
                        </Link>
                        <Button onClick={resetScan} variant="outline" size="sm" className="gap-2 border-white/20 text-white hover:bg-white/10">
                            <ScanLine className="w-4 h-4" /> New Scan
                        </Button>
                    </div>
                </div>
                <MedicalResultCard data={finalResult} />
            </div>
        )
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-6 relative p-4 lg:p-12 overflow-y-auto">

            <AnimatePresence>
                {carePickerOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                        onClick={() => setCarePickerOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.98, y: 8, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.98, y: 8, opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            className="w-full max-w-lg"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <GlassCard className="p-6 sm:p-7" hoverEffect={false}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 shrink-0">
                                            <Users className="w-5 h-5 text-cyan-200" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-white font-bold text-lg">{t("Who is this scan for?", "لمن هذا الفحص؟")}</p>
                                            <p className="text-white/55 text-sm mt-1">
                                                {t(
                                                    "Choose the profile to personalize results and save History/Memories correctly.",
                                                    "اختر الملف لضبط التخصيص وحفظ السجل/الذاكرة للشخص الصحيح."
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setCarePickerOpen(false)}
                                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="mt-5 grid gap-2">
                                    {careLoading ? (
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {t("Loading profiles…", "جارٍ تحميل الملفات…")}
                                        </div>
                                    ) : (
                                        careProfiles.map((p) => {
                                            const selected = (careTempId || "") === p.id;
                                            return (
                                                <button
                                                    key={p.id}
                                                    onClick={() => setCareTempId(p.id)}
                                                    className={cn(
                                                        "w-full text-left p-4 rounded-xl border transition-colors",
                                                        selected
                                                            ? "bg-cyan-500/10 border-cyan-500/25"
                                                            : "bg-white/5 border-white/10 hover:bg-white/10"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="text-white font-semibold truncate">{p.display_name}</p>
                                                            <p className="text-white/45 text-xs mt-1 truncate">
                                                                {p.relationship ? String(p.relationship) : p.id === user?.id ? t("self", "أنا") : t("family", "عائلة")}
                                                            </p>
                                                        </div>
                                                        <div className={cn(
                                                            "w-6 h-6 rounded-full border flex items-center justify-center shrink-0",
                                                            selected ? "border-cyan-400 text-cyan-200" : "border-white/15 text-white/30"
                                                        )}>
                                                            {selected ? <CheckCircle className="w-4 h-4" /> : <span className="text-[10px] font-bold">•</span>}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>

                                <div className="mt-5 flex items-center justify-between gap-3">
                                    <button
                                        onClick={() => setCarePickerOpen(false)}
                                        className="text-sm text-white/60 hover:text-white transition-colors"
                                    >
                                        {t("Cancel", "إلغاء")}
                                    </button>
                                    <Button onClick={confirmCarePicker} disabled={!careTempId || isScanning}>
                                        {t("Start Analysis", "بدء التحليل")}
                                    </Button>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {!previewSrc && (
                    <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
                        <div {...getRootProps()} className={cn(
                            "relative border-2 border-dashed rounded-3xl p-12 flex flex-col items-center text-center cursor-pointer transition-all duration-300 group",
                            isDragActive ? "border-liquid-primary bg-liquid-primary/10" : "border-white/20 hover:border-liquid-primary/50 hover:bg-white/5"
                        )}>
                            <input {...getInputProps()} />
                            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <ScanLine className="w-10 h-10 text-liquid-primary" />
                            </div>
                            <h3 className="text-xl font-medium text-white mb-2">Upload Medication Image</h3>
                            <p className="text-white/50 text-sm max-w-xs mx-auto">
                                Drag & drop or click to upload. Supports JPEG, PNG (Max 10MB)
                            </p>
                            <div className="mt-8 flex gap-4">
                                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/40">Pills</span>
                                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/40">Bottles</span>
                                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/40">Prescriptions</span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 text-white/50 text-xs font-semibold uppercase tracking-wider">
                                    <History className="w-4 h-4" />
                                    Recent History
                                </div>
                                <Link href="/dashboard/history" className="text-xs text-white/40 hover:text-white hover:underline">
                                    Open
                                </Link>
                            </div>

                            {user && activeCareProfile && careProfiles.length > 1 && (
                                <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                                    <div className="flex items-center gap-2 text-xs text-white/60 min-w-0">
                                        <Users className="w-4 h-4 text-cyan-300 shrink-0" />
                                        <span className="shrink-0">{t("Active:", "الحالي:")}</span>
                                        <span className="text-white/80 font-semibold truncate">{activeCareProfile.display_name}</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setCareTempId(activeCareProfile.id);
                                            setCarePickerOpen(true);
                                        }}
                                        className="text-xs text-cyan-200 hover:underline"
                                    >
                                        {t("Change", "تغيير")}
                                    </button>
                                </div>
                            )}

                            {!user ? (
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm">
                                    <p className="mb-3">Log in to use your History and build Medication Memories.</p>
                                    <Link href="/login">
                                        <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white border border-white/10">
                                            Log in
                                        </Button>
                                    </Link>
                                </div>
                            ) : historyLoading ? (
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-white/40 text-sm">
                                    Loading your history...
                                </div>
                            ) : recentHistory.length === 0 ? (
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm">
                                    No scans yet. Run your first scan to start your personal database.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {recentHistory.map((item) => (
                                        <Link key={item.id} href="/dashboard/history">
                                            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                                <div className="min-w-0">
                                                    <p className="text-white font-medium truncate">{item.drug_name}</p>
                                                    <p className="text-white/40 text-xs truncate">{item.manufacturer || "Generic"} • {new Date(item.created_at).toLocaleDateString()}</p>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-white/30" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {previewSrc && (
                    <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col lg:flex-row gap-8 max-w-6xl items-start">

                        {/* Left: Image Preview */}
                        <div className="w-full lg:w-1/2 relative rounded-3xl overflow-hidden border border-white/10 bg-black/40 shadow-2xl group">
                            <img src={previewSrc!} alt="Preview" className={cn("w-full h-[500px] object-contain transition-all duration-500", (isScanning) && "opacity-50 scale-95 blur-sm")} />

                            {!isScanning && !finalResult && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                                    <div className="flex flex-col gap-3 items-center translate-y-4">
                                        <Button
                                            onClick={openCarePickerAndStart}
                                            size="lg"
                                            className="rounded-full shadow-2xl shadow-cyan-500/40 hover:scale-105 transition-all duration-300 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 border-none text-white font-bold px-10 py-7 text-lg group/btn"
                                        >
                                            <Zap className="mr-2 w-6 h-6 group-hover/btn:animate-pulse" />
                                            {t("Start Analysis", "بدء التحليل")}
                                        </Button>

                                        <Button
                                            onClick={resetScan}
                                            variant="outline"
                                            size="sm"
                                            className="rounded-full border-white/20 bg-black/40 text-white/80 hover:bg-white/10 hover:text-white px-6 h-10 backdrop-blur-md"
                                        >
                                            <X className="mr-2 w-4 h-4" />
                                            {t("Change Image", "تغيير الصورة")}
                                        </Button>
                                    </div>

                                    <button
                                        onClick={resetScan}
                                        className="absolute top-4 right-4 p-2.5 bg-black/60 hover:bg-red-500/80 rounded-full text-white/70 hover:text-white transition-all duration-300 backdrop-blur-md border border-white/10 shadow-lg"
                                        title={t("Cancel", "إلغاء")}
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            )}

                        </div>

                        {/* Right: Timeline */}
                        <div className="w-full lg:w-1/2">
                            <Timeline />

                            {!isScanning && !finalResult && (
                                <div className="mt-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-3">
                                    <Sparkles className="w-5 h-5 text-blue-400 shrink-0" />
                                    <div>
                                        <h4 className="text-white text-sm font-bold mb-1">Pro Tip</h4>
                                        <p className="text-white/60 text-xs leading-relaxed">
                                            For best results, ensure the medication name and dosage are clearly visible and well-lit.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
