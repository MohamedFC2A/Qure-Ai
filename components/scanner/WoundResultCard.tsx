"use client";

import React, { useState } from "react";
import {
    Activity,
    AlertOctagon,
    AlertTriangle,
    Bandage,
    CheckCircle2,
    Clock,
    Download,
    Flame,
    HeartPulse,
    HelpCircle,
    Info,
    Layers,
    RotateCcw,
    Share2,
    ShieldAlert,
    ShieldCheck,
    Stethoscope,
    Syringe,
    Zap,
    Siren,
    PhoneCall,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useSettings } from "@/context/SettingsContext";
import { type WoundAnalysisResult } from "@/lib/ai/wound";
import { cn } from "@/lib/utils";

interface WoundResultCardProps {
    result: WoundAnalysisResult;
    scannedImage?: string | null;
    onResetScan: () => void;
}

export const WoundResultCard: React.FC<WoundResultCardProps> = ({
    result,
    scannedImage,
    onResetScan,
}) => {
    const { resultsLanguage } = useSettings();
    const isAr = resultsLanguage === "ar";
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"care" | "tissue" | "safety">("care");

    const severityConfig = {
        minor: {
            label: isAr ? "إصابة سطحية منخفضة الخطورة" : "Minor Superficial Injury",
            subtext: isAr ? "مناسبة للإسعافات والعناية المنزلية" : "Suitable for home first aid care",
            bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
            badge: "bg-emerald-500 text-slate-950 font-bold",
            icon: ShieldCheck,
        },
        moderate: {
            label: isAr ? "إصابة متوسطة - تستلزم عناية دقيقة" : "Moderate Injury - Requires Monitoring",
            subtext: isAr ? "يُنصح بمراجعة المركز الصحي في حال عدم التحسن" : "Medical review advised if not improving",
            bg: "bg-amber-500/10 border-amber-500/30 text-amber-300",
            badge: "bg-amber-500 text-slate-950 font-bold",
            icon: AlertTriangle,
        },
        severe: {
            label: isAr ? "إصابة شديدة - تتطلب تقييماً جراحياً" : "Severe Injury - Medical Evaluation Required",
            subtext: isAr ? "يجب مراجعة الطبيب أو العيادة الجراحية اليوم" : "Visit a physician/surgical clinic promptly",
            bg: "bg-rose-500/10 border-rose-500/30 text-rose-300",
            badge: "bg-rose-500 text-white font-bold",
            icon: AlertOctagon,
        },
        emergency: {
            label: isAr ? "حالة طارئة - توجه لقسم الطوارئ فوراً" : "Emergency - Seek Immediate ER Care",
            subtext: isAr ? "خطر نزيف أو عدوى أو تلف أنسجة عميق" : "High risk of bleeding, infection, or deep tissue injury",
            bg: "bg-red-600/20 border-red-500 text-red-200 animate-pulse",
            badge: "bg-red-600 text-white font-black",
            icon: AlertOctagon,
        },
    }[result.severity || "minor"];

    const SeverityIcon = severityConfig.icon;

    const handleShare = () => {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
            const summary = `${result.woundTitle}\nالتقييم: ${severityConfig.label}\nمرحلة الالتئام: ${result.healingStageLocalized}\nتم الفحص عبر Qure AI`;
            navigator.clipboard.writeText(summary);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const handlePrint = () => {
        if (typeof window !== "undefined") {
            window.print();
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ── TOP HERO HEADER & TRIAGE BANNER ── */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 p-5 sm:p-6 backdrop-blur-xl">
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-white/10">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 shadow-inner shrink-0">
                            <Bandage className="h-6 w-6 sm:h-7 sm:w-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                                    {isAr ? "نظام تقييم الجروح السريري الذكي" : "Clinical Wound Assessment Engine"}
                                </span>
                                <span className="text-xs text-slate-400">
                                    {new Date(result.analyzedAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mt-1 tracking-tight">
                                {isAr ? result.woundTitle : result.woundTitleEn}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-300 mt-0.5 font-medium">
                                {result.woundTypeLocalized} • {result.healingStageLocalized}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleShare}
                            className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-xs sm:text-sm gap-1.5"
                        >
                            <Share2 className="h-3.5 w-3.5" />
                            <span>{copied ? (isAr ? "تم النسخ!" : "Copied!") : (isAr ? "مشاركة" : "Share")}</span>
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handlePrint}
                            className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-xs sm:text-sm gap-1.5"
                        >
                            <Download className="h-3.5 w-3.5" />
                            <span>{isAr ? "تصدير تقرير" : "Export"}</span>
                        </Button>
                    </div>
                </div>

                {/* ── SEVERITY & TRIAGE STATUS BANNER ── */}
                <div className={cn("mt-6 rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", severityConfig.bg)}>
                    <div className="flex items-start sm:items-center gap-3.5">
                        <div className="p-2.5 rounded-xl bg-black/30 shrink-0">
                            <SeverityIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider", severityConfig.badge)}>
                                    {result.severity}
                                </span>
                                <span className="font-bold text-sm sm:text-base text-white">{severityConfig.label}</span>
                            </div>
                            <p className="text-xs sm:text-sm opacity-90 mt-0.5">{severityConfig.subtext}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 bg-black/30 px-3.5 py-2 rounded-xl border border-white/10 self-stretch sm:self-auto justify-center">
                        <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
                        <div className="text-center sm:text-start">
                            <div className="text-[10px] text-slate-400 font-medium">{isAr ? "المدة المتوقعة للالتئام" : "Est. Healing Time"}</div>
                            <div className="text-xs font-bold text-white">{result.estimatedHealingDays}</div>
                        </div>
                    </div>
                </div>

                {/* ── QUICK ACTION HIGHLIGHT TILES (SUTURE, TETANUS, INFECTION) ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5">
                    {/* Suture Tile */}
                    <div className={cn(
                        "rounded-2xl border p-3.5 flex flex-col justify-between transition-all",
                        result.sutureAssessment.requiresSutures
                            ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                            : "bg-white/[0.03] border-white/10 text-slate-300"
                    )}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold flex items-center gap-1.5">
                                <HeartPulse className="h-4 w-4 text-rose-400" />
                                {isAr ? "الحاجة للخياطة الجراحية" : "Suture Requirement"}
                            </span>
                            <span className={cn(
                                "text-[11px] font-extrabold px-2 py-0.5 rounded-md",
                                result.sutureAssessment.requiresSutures ? "bg-rose-500 text-white" : "bg-emerald-500/20 text-emerald-400"
                            )}>
                                {result.sutureAssessment.requiresSutures ? (isAr ? "يلزم خياطة" : "Needs Sutures") : (isAr ? "لا يلزم" : "Not Required")}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
                            {result.sutureAssessment.rationale}
                        </p>
                    </div>

                    {/* Tetanus Tile */}
                    <div className={cn(
                        "rounded-2xl border p-3.5 flex flex-col justify-between transition-all",
                        result.tetanusAssessment.riskIdentified
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                            : "bg-white/[0.03] border-white/10 text-slate-300"
                    )}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold flex items-center gap-1.5">
                                <Syringe className="h-4 w-4 text-amber-400" />
                                {isAr ? "مصل التيتانوس" : "Tetanus Shot"}
                            </span>
                            <span className={cn(
                                "text-[11px] font-extrabold px-2 py-0.5 rounded-md",
                                result.tetanusAssessment.riskIdentified ? "bg-amber-500 text-slate-950" : "bg-emerald-500/20 text-emerald-400"
                            )}>
                                {result.tetanusAssessment.riskIdentified ? (isAr ? "موصى به" : "Advised") : (isAr ? "منخفض الخطورة" : "Low Risk")}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
                            {result.tetanusAssessment.recommendation}
                        </p>
                    </div>

                    {/* Infection Signs Tile */}
                    <div className={cn(
                        "rounded-2xl border p-3.5 flex flex-col justify-between transition-all",
                        result.infectionAssessment.hasActiveSigns
                            ? "bg-red-500/10 border-red-500/30 text-red-300"
                            : "bg-white/[0.03] border-white/10 text-slate-300"
                    )}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold flex items-center gap-1.5">
                                <ShieldAlert className="h-4 w-4 text-cyan-400" />
                                {isAr ? "مؤشر العدوى البكتيرية" : "Infection Status"}
                            </span>
                            <span className={cn(
                                "text-[11px] font-extrabold px-2 py-0.5 rounded-md",
                                result.infectionAssessment.hasActiveSigns ? "bg-red-500 text-white" : "bg-emerald-500/20 text-emerald-400"
                            )}>
                                {result.infectionAssessment.riskLevel.toUpperCase()}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
                            {result.infectionAssessment.clinicalSummary}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── NAVIGATION TABS ── */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
                <button
                    onClick={() => setActiveTab("care")}
                    className={cn(
                        "flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all",
                        activeTab === "care"
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md"
                            : "text-slate-400 hover:text-white"
                    )}
                >
                    <Bandage className="h-4 w-4" />
                    <span>{isAr ? "الإسعافات والغيار الطبي" : "First Aid & Dressing"}</span>
                </button>
                <button
                    onClick={() => setActiveTab("tissue")}
                    className={cn(
                        "flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all",
                        activeTab === "tissue"
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md"
                            : "text-slate-400 hover:text-white"
                    )}
                >
                    <Layers className="h-4 w-4" />
                    <span>{isAr ? "تحليل الأنسجة والالتئام" : "Tissue Composition"}</span>
                </button>
                <button
                    onClick={() => setActiveTab("safety")}
                    className={cn(
                        "flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all",
                        activeTab === "safety"
                            ? "bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-md"
                            : "text-slate-400 hover:text-white"
                    )}
                >
                    <AlertOctagon className="h-4 w-4" />
                    <span>{isAr ? "علامات الخطر والطوارئ" : "Red Flags & ER"}</span>
                </button>
            </div>

            {/* ── TAB CONTENT ── */}
            {activeTab === "care" && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                    {/* Step-by-Step First Aid Protocol */}
                    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 sm:p-7 backdrop-blur-xl">
                        <div className="flex items-center gap-2.5 mb-5">
                            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                <Activity className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-white">
                                    {isAr ? "بروتوكول الإسعافات الأولية المعتمد" : "Clinical First Aid Protocol"}
                                </h3>
                                <p className="text-xs text-slate-400">
                                    {isAr ? "اتبع الخطوات التالية بالترتيب لضمان تعقيم الجرح وسرعة شفائه" : "Follow these sequenced steps for optimal aseptic healing"}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {result.firstAidSteps.map((step, idx) => (
                                <div key={idx} className="relative flex items-start gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:p-5 hover:bg-white/[0.04] transition-all">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-black">
                                        {step.stepNumber || idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-white mb-1">{step.title}</h4>
                                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{step.action}</p>
                                        {step.caution && (
                                            <div className="mt-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200 flex items-start gap-2">
                                                <Info className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                                                <span>{step.caution}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dressing & Avoidance Guide */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Dressing Card */}
                        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 sm:p-6 backdrop-blur-xl flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Bandage className="h-5 w-5 text-teal-400" />
                                    <h4 className="text-sm sm:text-base font-bold text-white">
                                        {isAr ? "الضمادة الطبية الموصى بها" : "Recommended Dressing"}
                                    </h4>
                                </div>
                                <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-200 text-xs sm:text-sm font-semibold mb-3">
                                    {result.dressingProtocol.recommendedDressing}
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                                    <strong className="text-white">{isAr ? "محلول التنظيف: " : "Cleanser: "}</strong>
                                    {result.dressingProtocol.cleaningSolution}
                                </p>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    <strong className="text-white">{isAr ? "طريقة الاستخدام: " : "Instructions: "}</strong>
                                    {result.dressingProtocol.applicationInstructions}
                                </p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-white/10 text-xs text-slate-400 flex items-center justify-between">
                                <span>{isAr ? "تكرار التغيير:" : "Change Frequency:"}</span>
                                <span className="font-bold text-white">{result.dressingProtocol.changeFrequency}</span>
                            </div>
                        </div>

                        {/* Avoidance Card */}
                        <div className="rounded-3xl border border-rose-500/20 bg-rose-950/20 p-5 sm:p-6 backdrop-blur-xl">
                            <div className="flex items-center gap-2 mb-3">
                                <AlertTriangle className="h-5 w-5 text-rose-400" />
                                <h4 className="text-sm sm:text-base font-bold text-white">
                                    {isAr ? "محظورات خطيرة (تجنب وضعها داخل الجرح)" : "Strict Avoidance (Do NOT Apply)"}
                                </h4>
                            </div>
                            <p className="text-xs text-rose-200/90 mb-3">
                                {isAr
                                    ? "وضع هذه المواد يدمر الخلايا النامية ويبطئ الشفاء ويسبب ندبات دائمة:"
                                    : "Applying these destroys new granular cells and delays healing:"
                                }
                            </p>
                            <ul className="space-y-2">
                                {result.dressingProtocol.avoidSubstances.map((substance, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                                        <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" />
                                        <span>{substance}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "tissue" && (
                <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 sm:p-7 backdrop-blur-xl space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                            <Layers className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-white">
                                {isAr ? "تحليل قاع الأنسجة ومرحلة الالتئام (Tissue Bed Breakdown)" : "Wound Bed Tissue Composition"}
                            </h3>
                            <p className="text-xs text-slate-400">
                                {isAr ? "قياس نسبي لحالة الأنسجة وفق معايير الجمعية الأوروبية لرعاية الجروح EWMA" : "Clinical estimation of wound bed viability"}
                            </p>
                        </div>
                    </div>

                    {/* Progress Bars for 4 Tissues */}
                    <div className="space-y-4">
                        {/* Granulation (Red) */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-bold">
                                <span className="flex items-center gap-1.5 text-rose-400">
                                    <span className="h-3 w-3 rounded-full bg-rose-500" />
                                    {isAr ? "أنسجة حبيبية صحية (Granulation)" : "Healthy Granulation Tissue (Red)"}
                                </span>
                                <span className="text-white">{result.tissueComposition.granulation}%</span>
                            </div>
                            <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full transition-all duration-1000"
                                    style={{ width: `${result.tissueComposition.granulation}%` }}
                                />
                            </div>
                            <p className="text-[11px] text-slate-400">
                                {isAr ? "النسيج الأحمر هو المؤشر الحيوي لبناء الأوعية الدموية وتجدد الجلد السليم." : "Vascularized connective tissue indicating active healing."}
                            </p>
                        </div>

                        {/* Slough (Yellow) */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-bold">
                                <span className="flex items-center gap-1.5 text-amber-400">
                                    <span className="h-3 w-3 rounded-full bg-amber-500" />
                                    {isAr ? "أنسجة رخوة فبرينية (Slough / Fibrin)" : "Devitalized Slough Tissue (Yellow)"}
                                </span>
                                <span className="text-white">{result.tissueComposition.slough}%</span>
                            </div>
                            <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-1000"
                                    style={{ width: `${result.tissueComposition.slough}%` }}
                                />
                            </div>
                            <p className="text-[11px] text-slate-400">
                                {isAr ? "خلايا ميتة بروتينية صفراء تحتاج للغسيل والري الملحي المستمر لمنع تكاثر البكتيريا." : "Non-viable proteinaceous tissue requiring autolytic debridement."}
                            </p>
                        </div>

                        {/* Epithelial (Pink) */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-bold">
                                <span className="flex items-center gap-1.5 text-pink-400">
                                    <span className="h-3 w-3 rounded-full bg-pink-500" />
                                    {isAr ? "حواف متجددة ظهارية (Epithelialization)" : "Epithelial Margins (Pink)"}
                                </span>
                                <span className="text-white">{result.tissueComposition.epithelial}%</span>
                            </div>
                            <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-pink-600 to-pink-400 rounded-full transition-all duration-1000"
                                    style={{ width: `${result.tissueComposition.epithelial}%` }}
                                />
                            </div>
                            <p className="text-[11px] text-slate-400">
                                {isAr ? "خلايا البشرة الجديدة الزاحفة من الحواف لإغلاق سطح الجرح نهائياً." : "New epidermal cells migrating from wound margins."}
                            </p>
                        </div>

                        {/* Necrotic (Black) */}
                        {result.tissueComposition.necrotic > 0 && (
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="flex items-center gap-1.5 text-slate-400">
                                        <span className="h-3 w-3 rounded-full bg-slate-800 border border-slate-600" />
                                        {isAr ? "أنسجة نخرية متنخرة (Necrotic / Eschar)" : "Necrotic Eschar Tissue (Black)"}
                                    </span>
                                    <span className="text-white">{result.tissueComposition.necrotic}%</span>
                                </div>
                                <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
                                    <div
                                        className="h-full bg-slate-700 rounded-full transition-all duration-1000"
                                        style={{ width: `${result.tissueComposition.necrotic}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === "safety" && (
                <div className="rounded-3xl border border-rose-500/30 bg-gradient-to-b from-rose-950/40 via-slate-950 to-black p-5 sm:p-7 backdrop-blur-xl space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400">
                            <AlertOctagon className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-white">
                                {isAr ? "علامات الخطر الحرجة (Emergency Red Flags)" : "Emergency Red Flags & Immediate ER"}
                            </h3>
                            <p className="text-xs text-rose-200/80">
                                {isAr ? "في حال ظهور أي من هذه الأعراض، توجه فوراً لأقرب قسم طوارئ" : "If any of these signs appear, proceed to the nearest emergency department"}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                                {isAr ? "علامات النزيف والتلف الحاد:" : "Severe Bleeding & Tissue Signs:"}
                            </h4>
                            <div className="space-y-2">
                                {result.urgentRedFlags.map((flag, idx) => (
                                    <div key={idx} className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-200">
                                        <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                                        <span>{flag}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                                {isAr ? "دواعي التدخل الجراحي الفوري:" : "When to Seek Immediate Surgery/ER:"}
                            </h4>
                            <div className="space-y-2">
                                {result.whenToSeekImmediateER.map((reason, idx) => (
                                    <div key={idx} className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
                                        <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                                        <span>{reason}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-3">
                        <div className="text-xs text-slate-400">
                            <strong className="text-white">{isAr ? "التخصص الموصى به: " : "Recommended Specialty: "}</strong>
                            {result.recommendedMedicalSpecialty}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <a
                                href="tel:123"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 px-3.5 py-2 text-xs font-bold text-white transition-colors"
                            >
                                <PhoneCall className="h-3.5 w-3.5" />
                                <span>{isAr ? "اتصال فوري بالإسعاف" : "Call Ambulance"}</span>
                            </a>
                            <a
                                href="/profile?tab=esos"
                                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-3 py-2 text-xs font-bold text-white transition-colors"
                            >
                                <Siren className="h-3.5 w-3.5 text-rose-400" />
                                <span>{isAr ? "طوارئ ESOS AI" : "ESOS AI Suite"}</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MEDICAL DISCLAIMER FOOTER ── */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-center">
                <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span><strong className="text-slate-300">{isAr ? "إخلاء مسؤولية سريري: " : "Clinical Disclaimer: "}</strong>{result.disclaimer}</span>
                </p>
            </div>

            {/* ── BOTTOM ACTIONS ── */}
            <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                    onClick={onResetScan}
                    variant="primary"
                    size="md"
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 gap-2 transition-colors"
                >
                    <RotateCcw className="h-4 w-4" />
                    <span>{isAr ? "بدء فحص جديد" : "Start New Scan"}</span>
                </Button>
            </div>
        </div>
    );
};
