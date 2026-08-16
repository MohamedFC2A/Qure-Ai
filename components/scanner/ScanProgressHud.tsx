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
    const { progressPercent, activePhaseIndex, activePhaseNote, remainingSec } = useMemo(() => {
        let percent = 8;
        let noteAr = "بدء تهيئة المحرك الطبي والضبط البصري...";
        let noteEn = "Initializing medical engine & optical alignment...";
        let activeIdx = 0;

        const baselineTotal = scanType === "wound" ? 14.0 : scanType === "prescription" ? 16.0 : 12.0;
        const expectedOcr = 3.5;
        const expectedAnalyze = scanType === "wound" ? 8.5 : scanType === "prescription" ? 10.0 : 7.0;
        const expectedStructure = 0.8;

        let rem = 1.0;

        if (structureStep?.status === "done") {
            percent = 100;
            activeIdx = 3;
            noteAr = "اكتمل التحليل الطبي بنجاح — جارٍ فتح التقرير";
            noteEn = "Analysis complete — loading clinical report";
            rem = 0.0;
        } else if (structureStep?.status === "running") {
            const structureElapsed = structureStep.startTime ? (Date.now() - structureStep.startTime) / 1000 : 0.2;
            percent = Math.min(99, Math.round(94 + Math.min(0.9, structureElapsed / expectedStructure) * 5));
            activeIdx = 3;
            noteAr = "اعتماد التقرير وصياغة الجرعات والتحذيرات السريرية...";
            noteEn = "Finalizing report structure & dosage guidelines...";
            rem = Math.max(0.2, Number((expectedStructure - structureElapsed).toFixed(1)));
        } else if (analyzeStep?.status === "running") {
            const analyzeElapsed = analyzeStep.startTime ? (Date.now() - analyzeStep.startTime) / 1000 : 1;
            activeIdx = 2;
            noteAr = "فحص التداخلات الدوائية ومطابقة المراجع السريرية...";
            noteEn = "Cross-checking drug interactions & clinical references...";

            if (analyzeElapsed < expectedAnalyze) {
                const ratio = analyzeElapsed / expectedAnalyze;
                percent = Math.round(42 + ratio * 46);
                const remInAnalyze = expectedAnalyze - analyzeElapsed;
                rem = Math.max(1.0, Number((remInAnalyze + expectedStructure).toFixed(1)));
            } else {
                const overtime = analyzeElapsed - expectedAnalyze;
                const decayProgress = 1 - Math.exp(-overtime / 6.0);
                percent = Math.min(94, Math.round(88 + decayProgress * 6));
                const asymptoticRem = Math.max(0.6, 2.0 * Math.exp(-overtime / 8.0));
                rem = Number((asymptoticRem + 0.3).toFixed(1));
            }
        } else if (ocrStep?.status === "running") {
            const ocrElapsed = ocrStep.startTime ? (Date.now() - ocrStep.startTime) / 1000 : 1;
            const ratio = Math.min(0.95, ocrElapsed / expectedOcr);
            percent = Math.round(15 + ratio * 25);
            activeIdx = 1;
            noteAr = "قراءة العبوة واستخراج المواد الفعالة والبيانات...";
            noteEn = "Reading package text & active compounds...";
            const remInOcr = Math.max(0.5, expectedOcr - ocrElapsed);
            rem = Number((remInOcr + expectedAnalyze + expectedStructure).toFixed(1));
        } else if (preprocessStep?.status === "running") {
            percent = 12;
            activeIdx = 0;
            noteAr = "معالجة الصورة وضبط التباين والأبعاد...";
            noteEn = "Enhancing optical contrast & alignment...";
            rem = baselineTotal;
        } else {
            percent = 8;
            activeIdx = 0;
            rem = baselineTotal;
        }

        return {
            progressPercent: Math.min(100, Math.max(8, percent)),
            activePhaseIndex: activeIdx,
            activePhaseNote: isArabic ? noteAr : noteEn,
            remainingSec: structureStep?.status === "done" ? 0 : Math.max(0.2, rem),
        };
    }, [analyzeStep, isArabic, ocrStep, preprocessStep, scanType, structureStep]);

    return (
        <div className="w-full relative text-start">
            <div className="relative bg-slate-950/85 backdrop-blur-2xl rounded-3xl p-5 sm:p-7 border border-white/10 shadow-2xl overflow-hidden">
                {/* ── Top Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
                    <div className="flex items-center gap-3.5">
                        <div className="relative w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shrink-0 shadow-inner">
                            <Brain className="w-5 h-5" />
                            <span className="absolute -top-1 -end-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
                            </span>
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-white font-bold text-base tracking-tight">
                                    {AI_DISPLAY_NAME}
                                </h3>
                                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-[11px] font-semibold">
                                    {isScanning ? t("Live Analysis", "تحليل مباشر") : t("Ready", "جاهز")}
                                </span>
                            </div>
                            <p className="text-xs text-slate-300 font-medium mt-1">
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

                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-400/25">
                            <Clock className="w-3.5 h-3.5 text-cyan-300 animate-spin" style={{ animationDuration: "5s" }} />
                            <span className="text-cyan-200 text-xs font-medium">{t("Est. Left:", "المتبقي:")}</span>
                            <span className="text-cyan-300 font-mono font-bold text-xs tabular-nums">
                                <bdi dir="ltr">~{remainingSec}s</bdi>
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

                {/* ── Center: Fluid Smooth Progress Track ── */}
                <div className="mt-5">
                    <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-semibold text-slate-300">
                            {t("Analysis Progress", "مستوى اكتمال الفحص")}
                        </span>
                        <span className="font-mono font-bold text-sm text-cyan-300 tabular-nums">
                            <bdi dir="ltr">{progressPercent}%</bdi>
                        </span>
                    </div>

                    <div className="relative h-2.5 rounded-full bg-slate-900 overflow-hidden border border-white/10 p-0.5 shadow-inner">
                        <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 shadow-[0_0_12px_rgba(6,182,212,0.5)]"
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
                                        ? "bg-emerald-500/[0.08] border-emerald-500/30 text-emerald-100 shadow-sm"
                                        : isRunning
                                        ? "bg-cyan-500/[0.1] border-cyan-400/45 text-cyan-100 shadow-sm shadow-cyan-500/10"
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
                                            ? "bg-cyan-500/25 border-cyan-400 text-cyan-200 animate-pulse"
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
                                                ? "text-cyan-200"
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
                    <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 shrink-0">
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

