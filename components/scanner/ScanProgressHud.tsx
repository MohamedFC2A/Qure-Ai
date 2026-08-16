"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Brain,
    Sparkles,
    CheckCircle2,
    Loader2,
    Timer,
    ShieldCheck,
    FileText,
    Activity,
    X,
    AlertCircle,
    Check,
    Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PipelineStep } from "@/context/ScanContext";
import { AI_DISPLAY_NAME } from "@/lib/ai/branding";
import { useSettings } from "@/context/SettingsContext";

interface ScanProgressHudProps {
    steps: PipelineStep[];
    totalDuration: string;
    isScanning: boolean;
    previewSrc: string | null;
    scanType: "auto" | "medication" | "prescription" | "wound";
    errorMsg: string | null;
    onCancel: () => void;
    rotation?: number;
    brightness?: number;
    contrast?: number;
    highContrastMode?: boolean;
}

const PHASES = [
    {
        id: "preprocess",
        icon: Sparkles,
        titleAr: "المعالجة البصرية",
        titleEn: "Image Enhancement",
    },
    {
        id: "ocr",
        icon: FileText,
        titleAr: "قراءة العبوة",
        titleEn: "Package OCR",
    },
    {
        id: "analyze",
        icon: Activity,
        titleAr: "التحليل الدوائي",
        titleEn: "Clinical Analysis",
    },
    {
        id: "structure",
        icon: CheckCircle2,
        titleAr: "إعداد التقرير",
        titleEn: "Report Finalizing",
    },
];

const REASSURANCE_TIPS = [
    {
        ar: "فحص فوري لقواعد بيانات الأدوية العالمية والتداخلات الدوائية بدقة فائقة.",
        en: "Instant cross-referencing with global pharmacological databases and interactions.",
    },
    {
        ar: "تشفير وحماية سريرية كاملة لبياناتك الصحية وخصوصية الفحص.",
        en: "Strict clinical encryption protecting your health records and scan privacy.",
    },
    {
        ar: "التحقق التلقائي من ملاءمة الجرعات والتحذيرات السريرية الخاصة بالدواء.",
        en: "Automatic validation of dosage suitability and clinical warnings.",
    },
];

export const ScanProgressHud: React.FC<ScanProgressHudProps> = ({
    steps,
    totalDuration,
    isScanning,
    scanType,
    errorMsg,
    onCancel,
}) => {
    const { resultsLanguage } = useSettings();
    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    const [tipIndex, setTipIndex] = useState(0);

    useEffect(() => {
        if (!isScanning) return;
        const interval = setInterval(() => {
            setTipIndex((prev) => (prev + 1) % REASSURANCE_TIPS.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [isScanning]);

    const preprocessStep = steps.find((s) => s.id === "preprocess");
    const ocrStep = steps.find((s) => s.id === "ocr");
    const analyzeStep = steps.find((s) => s.id === "analyze");
    const structureStep = steps.find((s) => s.id === "structure");

    // Dynamic Progress & Sub-step calculations with smart smooth interpolation
    const { progressPercent, activePhaseIndex, activePhaseNote, remainingSecText } = useMemo(() => {
        const durationNum = parseFloat(totalDuration) || 0;

        let percent = 10;
        let noteAr = "بدء معالجة الصورة وضبط التباين...";
        let noteEn = "Enhancing optical clarity & perspective...";
        let activeIdx = 0;
        let remText = "~8s";

        if (structureStep?.status === "done") {
            percent = 100;
            activeIdx = 3;
            noteAr = "اكتمل التحليل الطبي بنجاح — جارٍ فتح التقرير";
            noteEn = "Analysis complete — loading clinical report";
            remText = "0s";
        } else if (structureStep?.status === "running") {
            percent = 96;
            activeIdx = 3;
            noteAr = "اعتماد التقرير وصياغة الجرعات والتحذيرات السريرية...";
            noteEn = "Finalizing report structure & dosage guidelines...";
            remText = isArabic ? "لحظات..." : "Moments...";
        } else if (analyzeStep?.status === "running") {
            activeIdx = 2;
            noteAr = "فحص التداخلات الدوائية ومطابقة المراجع السريرية...";
            noteEn = "Cross-checking drug interactions & clinical references...";

            const analyzeElapsed = analyzeStep.startTime ? (Date.now() - analyzeStep.startTime) / 1000 : Math.max(1, durationNum - 3);
            
            // Asymptotic smooth curve: 55% at 0s, 72% at 6s, 84% at 14s, 92% at 22s+
            const smoothProgress = 55 + (1 - Math.exp(-analyzeElapsed / 9.0)) * 38;
            percent = Math.min(94, Math.round(smoothProgress));

            // Smart dynamic remaining time that adapts to elapsed time
            if (analyzeElapsed < 4) {
                remText = "~5s";
            } else if (analyzeElapsed < 10) {
                remText = "~3s";
            } else if (analyzeElapsed < 20) {
                remText = "~2s";
            } else {
                remText = isArabic ? "لحظات..." : "Moments...";
            }
        } else if (ocrStep?.status === "running") {
            const ocrElapsed = ocrStep.startTime ? (Date.now() - ocrStep.startTime) / 1000 : Math.max(1, durationNum - 1);
            const ocrRatio = Math.min(0.9, ocrElapsed / 4.0);
            percent = Math.round(25 + ocrRatio * 25);
            activeIdx = 1;
            noteAr = "قراءة العبوة واستخراج المواد الفعالة والبيانات...";
            noteEn = "Reading package text & active compounds...";
            remText = "~7s";
        } else if (preprocessStep?.status === "running") {
            percent = 15;
            activeIdx = 0;
            noteAr = "معالجة الصورة وضبط التباين والأبعاد...";
            noteEn = "Enhancing optical contrast & alignment...";
            remText = "~10s";
        } else {
            percent = 10;
            activeIdx = 0;
            remText = "~10s";
        }

        return {
            progressPercent: Math.min(100, Math.max(10, percent)),
            activePhaseIndex: activeIdx,
            activePhaseNote: isArabic ? noteAr : noteEn,
            remainingSecText: remText,
        };
    }, [analyzeStep, isArabic, ocrStep, preprocessStep, structureStep, totalDuration]);

    return (
        <div className="w-full relative text-start">
            <div className="relative bg-slate-950/85 backdrop-blur-2xl rounded-3xl p-5 sm:p-7 border border-white/10 shadow-2xl overflow-hidden">
                {/* ── Top Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                            <Brain className="w-5 h-5" />
                        </div>

                        <div>
                            <h3 className="text-white font-bold text-base tracking-tight">
                                {AI_DISPLAY_NAME}
                            </h3>
                            <p className="text-xs text-slate-300 font-medium mt-0.5">
                                {activePhaseNote}
                            </p>
                        </div>
                    </div>

                    {/* Dynamic Timers & Cancel */}
                    <div className="flex items-center gap-2 self-start sm:self-center">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10">
                            <Timer className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-slate-400 text-xs font-medium">{t("Elapsed:", "المنقضي:")}</span>
                            <span className="text-white font-mono font-bold text-xs tabular-nums">
                                <bdi dir="ltr">{totalDuration}s</bdi>
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10">
                            <Clock className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: "5s" }} />
                            <span className="text-slate-300 text-xs font-medium">{t("Est. Left:", "المتبقي:")}</span>
                            <span className="text-emerald-400 font-mono font-bold text-xs tabular-nums">
                                <bdi dir="ltr">{remainingSecText}</bdi>
                            </span>
                        </div>

                        <button
                            onClick={onCancel}
                            title={t("Cancel", "إلغاء")}
                            className="p-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 hover:border-rose-500/30 border border-white/10 text-slate-400 hover:text-rose-300 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* ── Center: Fluid Smooth Progress Track (Pure Green & Zero Glowing) ── */}
                <div className="mt-5">
                    <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-semibold text-slate-300">
                            {t("Analysis Progress", "مستوى اكتمال الفحص")}
                        </span>
                        <span className="font-mono font-bold text-sm text-emerald-400 tabular-nums">
                            <bdi dir="ltr">{progressPercent}%</bdi>
                        </span>
                    </div>

                    <div className="relative h-2 rounded-full bg-slate-900 overflow-hidden border border-white/10">
                        <motion.div
                            className="h-full rounded-full bg-emerald-500 shadow-none"
                            initial={{ width: "8%" }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.35, ease: "easeOut" }}
                        />
                    </div>
                </div>

                {/* ── 4 Connected Sleek Step Pills ── */}
                <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {PHASES.map((phase, idx) => {
                        const stepData = steps.find((s) => s.id === phase.id);
                        const isDone = stepData?.status === "done";
                        const isRunning = stepData?.status === "running";
                        const isError = stepData?.status === "error";

                        return (
                            <div
                                key={phase.id}
                                className={cn(
                                    "p-3 rounded-2xl border transition-all duration-300 flex items-center gap-2.5",
                                    isDone
                                        ? "bg-emerald-500/[0.08] border-emerald-500/30 text-emerald-100"
                                        : isRunning
                                        ? "bg-emerald-500/[0.06] border-emerald-500/30 text-emerald-100"
                                        : isError
                                        ? "bg-amber-500/[0.08] border-amber-400/30 text-amber-100"
                                        : "bg-white/[0.02] border-white/5 opacity-40"
                                )}
                            >
                                <div
                                    className={cn(
                                        "w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border transition-all",
                                        isDone
                                            ? "bg-emerald-500/25 border-emerald-400 text-emerald-300"
                                            : isRunning
                                            ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-200 animate-pulse"
                                            : isError
                                            ? "bg-amber-500/20 border-amber-400 text-amber-300"
                                            : "bg-white/5 border-white/10 text-slate-400"
                                    )}
                                >
                                    {isDone ? (
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    ) : isRunning ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        idx + 1
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <h4
                                        className={cn(
                                            "text-xs font-bold truncate",
                                            isDone
                                                ? "text-white"
                                                : isRunning
                                                ? "text-emerald-200"
                                                : "text-slate-400"
                                        )}
                                    >
                                        {isArabic ? phase.titleAr : phase.titleEn}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                        {isDone ? t("Done", "مكتمل") : isRunning ? t("Active...", "جارٍ...") : t("Pending", "بانتظار")}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── Rotating Clinical Reassurance Ticker ── */}
                <div className="mt-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={tipIndex}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.25 }}
                                className="text-xs text-slate-300 font-medium truncate"
                            >
                                {isArabic ? REASSURANCE_TIPS[tipIndex].ar : REASSURANCE_TIPS[tipIndex].en}
                            </motion.p>
                        </AnimatePresence>
                    </div>
                </div>

                {/* ── Quality Alert ── */}
                {errorMsg && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-400/35 text-amber-200 text-xs flex items-start gap-2.5"
                    >
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-1">
                            <p className="font-bold text-white text-xs">{t("Scan Notice", "تنبيه الفحص")}</p>
                            <p className="text-[11px] text-amber-200/90 leading-relaxed">{errorMsg}</p>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

