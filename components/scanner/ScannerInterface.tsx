"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, ScanLine, FileText, Brain, CheckCircle, Loader2, ListTodo, History, Sparkles, Zap, Timer, AlertCircle, AlertTriangle, ChevronRight } from 'lucide-react';
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
    const { user, loading } = useUser();
    const {
        file,
        previewSrc,
        isScanning,
        steps,
        totalDuration,
        finalResult,
        errorMsg,
        errorAction,
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
            const { data, error } = await supabase
                .from("medication_history")
                .select("id, drug_name, manufacturer, created_at")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(5);

            if (error) {
                console.error("History fetch error:", error);
                setRecentHistory([]);
                return;
            }

            setRecentHistory(data || []);
        } finally {
            setHistoryLoading(false);
        }
    }, [supabase, user?.id]);

    useEffect(() => {
        fetchRecentHistory();
    }, [fetchRecentHistory]);

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
            <div className="w-full lg:mr-12 bg-black/40 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10 shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                    <div className="min-w-0">
                        <h3 className="text-white font-bold text-base sm:text-lg flex items-center gap-2">
                            <Brain className="w-5 h-5 text-liquid-primary" />
                            <span className="truncate">{AI_DISPLAY_NAME} Processor</span>
                        </h3>
                        <p className="mt-1 text-xs sm:text-sm text-white/50 leading-relaxed">
                            {t(
                                "Browse freely — your scan continues in the background.",
                                "تقدر تتصفح بحرّية — الفحص مستمر في الخلفية."
                            )}
                        </p>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-2">
                        <div className={cn(
                            "px-2.5 py-1 rounded-full text-[11px] font-semibold border",
                            hasError
                                ? "bg-red-500/10 text-red-200 border-red-500/20"
                                : isScanning
                                    ? "bg-cyan-500/10 text-cyan-100 border-cyan-500/20"
                                    : "bg-white/5 text-white/80 border-white/10"
                        )}>
                            {statusLabel}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                            <Timer className="w-3.5 h-3.5 text-liquid-accent" />
                            <span className="text-white font-mono text-sm tabular-nums">
                                {`${totalDuration}s`}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-4">
                    <div className="flex items-center justify-between text-[11px] sm:text-xs text-white/50">
                        <span>{t("Progress", "التقدم")}</span>
                        <span className="font-mono tabular-nums">{doneCount}/{totalStepsCount}</span>
                    </div>
                    <div
                        className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden relative"
                        role="progressbar"
                        aria-valuenow={percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={t("Scan progress", "تقدم الفحص")}
                    >
                        <div
                            className={cn(
                                "absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-[width] duration-500",
                                isArabic && "left-auto right-0 bg-gradient-to-l from-cyan-400 to-blue-500"
                            )}
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                </div>

                <div className="relative space-y-5 pl-1 mt-5">
                    {/* Vertical Line */}
                    <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-white/10" />

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
                            <div key={step.id} className="relative z-10 flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 min-w-0">
                                    <div className={cn(
                                        "mt-0.5 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-black shrink-0",
                                        isDone ? "border-green-500 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]" :
                                            isRunning ? "border-liquid-primary text-liquid-primary animate-pulse" :
                                                isError ? "border-red-500 text-red-500" :
                                                    "border-white/20 text-white/20"
                                    )}>
                                        {isDone ? <CheckCircle className="w-5 h-5" /> :
                                            isRunning ? <Loader2 className="w-5 h-5 animate-spin" /> :
                                                isError ? <AlertCircle className="w-5 h-5" /> :
                                                    <span className="text-xs font-bold tabular-nums">{index + 1}</span>
                                        }
                                    </div>

                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                            <span className={cn(
                                                "text-sm sm:text-[15px] font-semibold transition-colors truncate",
                                                isDone || isRunning ? "text-white" : "text-white/50"
                                            )}>
                                                {step.label}
                                            </span>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                                                isDone
                                                    ? "bg-green-500/10 text-green-200 border-green-500/20"
                                                    : isRunning
                                                        ? "bg-cyan-500/10 text-cyan-100 border-cyan-500/20"
                                                        : isError
                                                            ? "bg-red-500/10 text-red-200 border-red-500/20"
                                                            : "bg-white/5 text-white/60 border-white/10"
                                            )}>
                                                {stepStatusLabel}
                                            </span>
                                        </div>
                                        <div className="mt-1 text-[11px] text-white/45">
                                            {t("Step", "خطوة")} <span className="font-mono tabular-nums">{index + 1}/{totalStepsCount}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="shrink-0 text-xs sm:text-sm text-liquid-accent font-mono tabular-nums mt-1">
                                    {seconds}
                                </div>
                            </div>
                        );
                    })}

                    {errorMsg && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                <span>{errorMsg}</span>
                            </div>

                            {errorAction === 'login' && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Link href={`/login?next=${encodeURIComponent('/scan')}`}>
                                        <Button size="sm">{t("Log in", "تسجيل الدخول")}</Button>
                                    </Link>
                                    <Link href={`/signup?next=${encodeURIComponent('/scan')}`}>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-white/15 text-white/80 hover:bg-white/10"
                                        >
                                            {t("Create account", "إنشاء حساب")}
                                        </Button>
                                    </Link>
                                </div>
                            )}

                            {errorAction === 'terms' && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Link href={`/terms?next=${encodeURIComponent('/scan')}`}>
                                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black">
                                            {t("Review & accept terms", "مراجعة والموافقة على الشروط")}
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
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
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="flex gap-4">
                                        <Button onClick={startScan} size="lg" className="rounded-full shadow-xl shadow-cyan-500/20 hover:scale-105 transition-transform bg-gradient-to-r from-cyan-500 to-blue-600 border-none text-white font-bold px-8">
                                            <Zap className="mr-2 w-5 h-5" /> Start Analysis
                                        </Button>
                                    </div>
                                    <button onClick={resetScan} className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white/70 hover:text-white transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            )}

                            {/* Mobile Start Button (Always Visible if not scanning) */}
                            {!isScanning && !finalResult && (
                                <div className="absolute bottom-6 left-0 right-0 flex justify-center lg:hidden">
                                    <Button onClick={startScan} size="lg" className="rounded-full shadow-xl bg-cyan-600 text-white">
                                        Scan Now
                                    </Button>
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
