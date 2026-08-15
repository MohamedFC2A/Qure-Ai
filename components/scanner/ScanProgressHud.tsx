"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Brain,
    Sparkles,
    CheckCircle2,
    Loader2,
    Timer,
    Zap,
    ShieldCheck,
    Cpu,
    Activity,
    FileText,
    Database,
    Crosshair,
    X,
    AlertCircle,
    Check,
    Layers,
    Pill,
    Stethoscope,
    Clock,
    ArrowLeft,
    CheckCircle,
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
        titleAr: "المعالجة والضبط البصري",
        titleEn: "Optical Enhancement",
        descAr: "تحسين التباين وإزالة التشويش",
        descEn: "HDR contrast & noise filtration",
    },
    {
        id: "ocr",
        icon: FileText,
        titleAr: "المسح وقراءة النصوص",
        titleEn: "Neural OCR Triage",
        descAr: "استخراج المواد الفعالة والبيانات",
        descEn: "Extracting active compounds & text",
    },
    {
        id: "analyze",
        icon: ShieldCheck,
        titleAr: "التحليل السريري والتداخلات",
        titleEn: "Clinical Intelligence",
        descAr: "مطابقة مراجع FDA وفحص الأمان",
        descEn: "FDA cross-check & interaction guard",
    },
    {
        id: "structure",
        icon: CheckCircle2,
        titleAr: "هيكلة واعتماد التقرير",
        titleEn: "Report Structuring",
        descAr: "صياغة الجرعات والتحذيرات السريرية",
        descEn: "Formatting dosage & patient warnings",
    },
];

const REASSURANCE_TIPS = [
    {
        ar: "يتم فحص أكثر من 20,000 تداخل دوائي وقاعدة بيانات FDA العالمية في أجزاء من الثانية.",
        en: "Cross-checking 20,000+ drug interactions & openFDA global databases in real-time.",
    },
    {
        ar: "تشفير وحماية سريرية كاملة لبياناتك الصحية وسجل أدويتك الشخصي.",
        en: "Strict clinical encryption protecting your health records and scan privacy.",
    },
    {
        ar: "التحقق من ملاءمة الجرعات وموانع الاستخدام مع الأمراض المزمنة والحالات الخاصة.",
        en: "Verifying dosage suitability and contraindications with chronic conditions.",
    },
];

export const ScanProgressHud: React.FC<ScanProgressHudProps> = ({
    steps,
    totalDuration,
    isScanning,
    previewSrc,
    scanType,
    errorMsg,
    onCancel,
    rotation = 0,
    brightness = 0,
    contrast = 0,
    highContrastMode = false,
}) => {
    const { resultsLanguage } = useSettings();
    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    const [tipIndex, setTipIndex] = useState(0);

    useEffect(() => {
        if (!isScanning) return;
        const interval = setInterval(() => {
            setTipIndex((prev) => (prev + 1) % REASSURANCE_TIPS.length);
        }, 3600);
        return () => clearInterval(interval);
    }, [isScanning]);

    const preprocessStep = steps.find((s) => s.id === "preprocess");
    const ocrStep = steps.find((s) => s.id === "ocr");
    const analyzeStep = steps.find((s) => s.id === "analyze");
    const structureStep = steps.find((s) => s.id === "structure");

    // Dynamic Progress & Sub-step calculations with 90-100% accurate timing model
    const { progressPercent, activePhaseIndex, activePhaseNote, remainingSec } = useMemo(() => {
        let percent = 5;
        let noteAr = "بدء تهيئة المحرك السريري...";
        let noteEn = "Initializing Clinical Engine...";
        let activeIdx = 0;

        const durationNum = parseFloat(totalDuration) || 0;
        
        // Realistic expected duration baselines
        const baselineTotal = scanType === "wound" ? 18.0 : scanType === "prescription" ? 22.0 : 16.0;
        const expectedPreprocess = 0.6;
        const expectedOcr = 4.0;
        const expectedAnalyze = scanType === "wound" ? 12.0 : scanType === "prescription" ? 15.0 : 10.5;
        const expectedStructure = 0.8;

        let rem = 1.0;

        if (structureStep?.status === "done") {
            percent = 100;
            activeIdx = 3;
            noteAr = "اكتمل الفحص بنجاح — جارٍ عرض النتائج";
            noteEn = "Scan complete — rendering results";
            rem = 0.0;
        } else if (structureStep?.status === "running") {
            const structureElapsed = structureStep.startTime ? (Date.now() - structureStep.startTime) / 1000 : 0.2;
            percent = Math.min(99, Math.round(94 + Math.min(0.9, structureElapsed / expectedStructure) * 5));
            activeIdx = 3;
            noteAr = "هيكلة التقرير الطبي والتحذيرات السريرية...";
            noteEn = "Structuring clinical insights & warnings...";
            rem = Math.max(0.2, Number((expectedStructure - structureElapsed).toFixed(1)));
        } else if (analyzeStep?.status === "running") {
            const analyzeElapsed = analyzeStep.startTime ? (Date.now() - analyzeStep.startTime) / 1000 : 1;
            activeIdx = 2;
            noteAr = "فحص التداخلات ومطابقة قواعد بيانات FDA وRxNorm...";
            noteEn = "Cross-referencing FDA & RxNorm clinical matrices...";

            if (analyzeElapsed < expectedAnalyze) {
                // Smooth linear progression up to 88%
                const ratio = analyzeElapsed / expectedAnalyze;
                percent = Math.round(40 + ratio * 48);
                const remInAnalyze = expectedAnalyze - analyzeElapsed;
                rem = Math.max(1.2, Number((remInAnalyze + expectedStructure).toFixed(1)));
            } else {
                // Smooth asymptotic decay when LLM reasoning takes longer
                const overtime = analyzeElapsed - expectedAnalyze;
                const decayProgress = 1 - Math.exp(-overtime / 8.0);
                percent = Math.min(94, Math.round(88 + decayProgress * 6));
                const asymptoticRem = Math.max(0.8, 2.5 * Math.exp(-overtime / 10.0));
                rem = Number((asymptoticRem + 0.4).toFixed(1));
            }
        } else if (ocrStep?.status === "running") {
            const ocrElapsed = ocrStep.startTime ? (Date.now() - ocrStep.startTime) / 1000 : 1;
            const ratio = Math.min(0.95, ocrElapsed / expectedOcr);
            percent = Math.round(15 + ratio * 24);
            activeIdx = 1;
            noteAr = "قراءة التركيبة واستخراج المواد الفعالة بالذكاء الاصطناعي...";
            noteEn = "Extracting active compounds & typography via AI...";
            const remInOcr = Math.max(0.5, expectedOcr - ocrElapsed);
            rem = Number((remInOcr + expectedAnalyze + expectedStructure).toFixed(1));
        } else if (preprocessStep?.status === "running") {
            percent = 10;
            activeIdx = 0;
            noteAr = "معالجة الصورة وضبط التباين والأبعاد...";
            noteEn = "Enhancing optical clarity & perspective...";
            rem = Number((baselineTotal - durationNum).toFixed(1));
        } else {
            percent = 5;
            activeIdx = 0;
            rem = baselineTotal;
        }

        return {
            progressPercent: Math.min(100, Math.max(5, percent)),
            activePhaseIndex: activeIdx,
            activePhaseNote: isArabic ? noteAr : noteEn,
            remainingSec: structureStep?.status === "done" ? 0 : Math.max(0.2, rem),
        };
    }, [analyzeStep, isArabic, ocrStep, preprocessStep, scanType, structureStep, totalDuration]);

    return (
        <div className="w-full relative text-start">
            <div className="relative bg-[#080E1E] rounded-3xl p-4 sm:p-6 border border-white/10 shadow-2xl overflow-hidden">
                {/* ── Top Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                    <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-300 shrink-0">
                            <Brain className="w-5 h-5" />
                            <span className="absolute -top-1 -end-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
                            </span>
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-white font-bold text-sm sm:text-base tracking-tight">
                                    {AI_DISPLAY_NAME}
                                </h3>
                                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 text-[10px] font-mono font-bold">
                                    {isScanning ? t("Analyzing", "جارٍ الفحص") : t("Ready", "جاهز")}
                                </span>
                            </div>
                            <p className="text-[11px] sm:text-xs text-slate-300 font-medium truncate mt-0.5">
                                {activePhaseNote}
                            </p>
                        </div>
                    </div>

                    {/* Dynamic Timers & Cancel */}
                    <div className="flex items-center gap-2 self-start sm:self-center">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10">
                            <Timer className="w-3.5 h-3.5 text-cyan-300" />
                            <span className="text-slate-400 text-[11px] font-medium">{t("Elapsed", "المنقضي")}:</span>
                            <span className="text-white font-mono font-bold text-xs tabular-nums">{totalDuration}s</span>
                        </div>

                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-400/20">
                            <Clock className="w-3.5 h-3.5 text-cyan-300 animate-spin" style={{ animationDuration: "4s" }} />
                            <span className="text-cyan-200 text-[11px] font-medium">{t("Remaining", "المتبقي")}:</span>
                            <span className="text-cyan-300 font-mono font-bold text-xs tabular-nums">~{remainingSec}s</span>
                        </div>

                        <button
                            onClick={onCancel}
                            title={t("Cancel", "إلغاء")}
                            className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 hover:border-rose-500/30 border border-white/10 text-slate-400 hover:text-rose-300 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* ── Center: Fluid Smooth Progress Track ── */}
                <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-slate-300 text-[11px]">
                            {t("Pipeline Execution", "مستوى اكتمال الفحص")}
                        </span>
                        <span className="font-mono font-bold text-xs text-cyan-300 tabular-nums">
                            {progressPercent}%
                        </span>
                    </div>

                    <div className="relative h-2 rounded-full bg-slate-900 overflow-hidden border border-white/10 p-0.5">
                        <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400"
                            initial={{ width: "5%" }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.35, ease: "easeOut" }}
                        />
                    </div>
                </div>

                {/* ── 4 Connected Progressive Stepper Nodes (Sleek & Non-Repetitive) ── */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {PHASES.map((phase, idx) => {
                        const stepData = steps.find((s) => s.id === phase.id);
                        const isDone = stepData?.status === "done";
                        const isRunning = stepData?.status === "running";
                        const isError = stepData?.status === "error";

                        const durationStr =
                            isDone && typeof stepData?.durationMs === "number"
                                ? `${(stepData.durationMs / 1000).toFixed(1)}s`
                                : isRunning && typeof stepData?.startTime === "number"
                                ? `${((Date.now() - stepData.startTime) / 1000).toFixed(1)}s`
                                : "";

                        return (
                            <div
                                key={phase.id}
                                className={cn(
                                    "p-3 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3",
                                    isDone
                                        ? "bg-emerald-500/[0.06] border-emerald-500/25 text-emerald-100"
                                        : isRunning
                                        ? "bg-cyan-500/[0.08] border-cyan-400/40 text-cyan-100"
                                        : isError
                                        ? "bg-amber-500/[0.08] border-amber-400/30 text-amber-100"
                                        : "bg-white/[0.02] border-white/5 opacity-55"
                                )}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    {/* Number / Status Icon */}
                                    <div
                                        className={cn(
                                            "w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border",
                                            isDone
                                                ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                                                : isRunning
                                                ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 animate-pulse"
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

                                    <div className="min-w-0">
                                        <h4
                                            className={cn(
                                                "text-xs font-bold truncate",
                                                isDone
                                                    ? "text-white"
                                                    : isRunning
                                                    ? "text-cyan-200 font-black"
                                                    : "text-slate-400"
                                            )}
                                        >
                                            {isArabic ? phase.titleAr : phase.titleEn}
                                        </h4>
                                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                            {isArabic ? phase.descAr : phase.descEn}
                                        </p>
                                    </div>
                                </div>

                                {/* Step Metric or Status Tag */}
                                <div className="shrink-0 text-end">
                                    {durationStr ? (
                                        <span className="px-2 py-0.5 rounded-md bg-white/[0.05] text-[10px] font-mono font-bold text-cyan-300 border border-white/10">
                                            {durationStr}
                                        </span>
                                    ) : isRunning ? (
                                        <span className="text-[10px] font-mono font-bold text-cyan-300 animate-pulse">
                                            {t("ACTIVE", "جارٍ...")}
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── Rotating Clinical Reassurance Ticker ── */}
                <div className="mt-4 p-2.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 shrink-0">
                        <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={tipIndex}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.25 }}
                                className="text-[11px] text-slate-300 font-medium truncate"
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
