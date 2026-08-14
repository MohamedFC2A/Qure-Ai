"use client";

import React, { useState, useEffect, useRef } from "react";
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
    PhoneCall,
    MapPin,
    Brain,
    Sparkles,
    Check,
    Pill,
    Ban,
    Droplets,
    FileText,
    ListChecks,
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

const EMERGENCY_DIRECTORY: Record<string, { country: string; ambulance: string }> = {
    EG: { country: "مصر", ambulance: "123" },
    SA: { country: "المملكة العربية السعودية", ambulance: "997" },
    AE: { country: "الإمارات العربية المتحدة", ambulance: "998" },
    KW: { country: "الكويت", ambulance: "112" },
    QA: { country: "قطر", ambulance: "999" },
    BH: { country: "البحرين", ambulance: "999" },
    OM: { country: "سلطنة عمان", ambulance: "9999" },
    JO: { country: "الأردن", ambulance: "911" },
    LB: { country: "لبنان", ambulance: "140" },
    IQ: { country: "العراق", ambulance: "122" },
    SY: { country: "سوريا", ambulance: "110" },
    PS: { country: "فلسطين", ambulance: "101" },
    MA: { country: "المغرب", ambulance: "15" },
    DZ: { country: "الجزائر", ambulance: "14" },
    TN: { country: "تونس", ambulance: "190" },
    LY: { country: "ليبيا", ambulance: "193" },
    SD: { country: "السودان", ambulance: "999" },
    YE: { country: "اليمن", ambulance: "191" },
    US: { country: "United States", ambulance: "911" },
    CA: { country: "Canada", ambulance: "911" },
    GB: { country: "United Kingdom", ambulance: "999" },
    DE: { country: "Germany", ambulance: "112" },
    FR: { country: "France", ambulance: "15" },
    GLOBAL: { country: "طوارئ عامة", ambulance: "112" },
};

export const WoundResultCard: React.FC<WoundResultCardProps> = ({
    result,
    scannedImage,
    onResetScan,
}) => {
    const { resultsLanguage } = useSettings();
    const isAr = resultsLanguage === "ar";
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"care" | "reasoning" | "safety">("care");
    const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

    // ESOS Emergency Telemetry
    const [detectedCountryCode, setDetectedCountryCode] = useState<string>("EG");
    const [ambulanceNumber, setAmbulanceNumber] = useState<string>("123");
    const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

    // Auto-detect country & read ESOS config on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                let detected = "EG";
                if (tz.includes("Riyadh") || tz.includes("Saudi")) detected = "SA";
                else if (tz.includes("Dubai")) detected = "AE";
                else if (tz.includes("Kuwait")) detected = "KW";
                else if (tz.includes("Qatar")) detected = "QA";
                else if (tz.includes("Bahrain")) detected = "BH";
                else if (tz.includes("Muscat")) detected = "OM";
                else if (tz.includes("Amman") || tz.includes("Jordan")) detected = "JO";
                else if (tz.includes("Cairo")) detected = "EG";
                else if (tz.includes("Baghdad")) detected = "IQ";
                else if (tz.includes("Casablanca")) detected = "MA";
                else if (tz.includes("Algiers")) detected = "DZ";
                else if (tz.includes("Tunis")) detected = "TN";
                else if (tz.includes("Khartoum")) detected = "SD";
                else if (tz.includes("New_York") || tz.includes("Los_Angeles") || tz.includes("Chicago")) detected = "US";
                else if (tz.includes("London")) detected = "GB";

                setDetectedCountryCode(detected);
                setAmbulanceNumber(EMERGENCY_DIRECTORY[detected]?.ambulance || "112");

                // Get GPS location for emergency dispatch
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => {
                            setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                        },
                        (err) => console.log("GPS unavailable:", err.message),
                        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
                    );
                }
            } catch (e) {
                console.error("Country detection error:", e);
            }
        }
    }, []);

    const toggleStep = (stepIdx: number) => {
        setCompletedSteps((prev) => ({ ...prev, [stepIdx]: !prev[stepIdx] }));
    };

    const handleCopyReport = () => {
        const text = `QURE AI - تقرير الفحص السريري للجلد والإصابات
الحالة: ${isAr ? result.woundTitle : result.woundTitleEn}
التصنيف: ${result.categoryLocalized || (isAr ? "فحص سريري" : "Clinical Assessment")}
الدرجة: ${result.severity}
مدة التحسن المقدرة: ${result.estimatedHealingDays}
التخصص الموصى به: ${result.recommendedMedicalSpecialty}
تاريخ الفحص: ${new Date(result.analyzedAt || Date.now()).toLocaleDateString(isAr ? "ar-EG" : "en-US")}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Severity styling
    const severityConfig = {
        minor: {
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/30",
            text: "text-emerald-400",
            label: isAr ? "حالة طفيفة / عناية منزلية" : "Minor / Self-Care",
        },
        moderate: {
            bg: "bg-cyan-500/10",
            border: "border-cyan-500/30",
            text: "text-cyan-400",
            label: isAr ? "حالة متوسطة / تستوجب المتابعة" : "Moderate / Monitor",
        },
        severe: {
            bg: "bg-amber-500/10",
            border: "border-amber-500/30",
            text: "text-amber-400",
            label: isAr ? "حالة متقدمة / تستلزم فحص طبيب" : "Severe / Clinical Attention",
        },
        emergency: {
            bg: "bg-rose-500/15",
            border: "border-rose-500/40",
            text: "text-rose-400",
            label: isAr ? "طوارئ طبية عاجلة" : "Medical Emergency",
        },
    }[result.severity] || {
        bg: "bg-slate-500/10",
        border: "border-white/10",
        text: "text-slate-300",
        label: isAr ? "فحص سريري" : "Clinical Assessment",
    };

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* ── TOP HERO HEADER & CLINICAL BANNER ── */}
            <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#080D1A]/90 p-5 sm:p-7 backdrop-blur-2xl shadow-2xl">
                
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 shrink-0 shadow-lg">
                            <Brain className="h-7 w-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="rounded-full bg-cyan-500/10 border border-cyan-400/25 px-3 py-0.5 text-[11px] font-bold text-cyan-300">
                                    {result.categoryLocalized || (isAr ? "الفاحص السريري للجلد والإصابات" : "Clinical Dermatology & Body Health AI")}
                                </span>
                                <span className="text-xs text-slate-400">
                                    {new Date(result.analyzedAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                            </div>
                            
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mt-1.5 tracking-tight">
                                {isAr ? result.woundTitle : result.woundTitleEn}
                            </h1>
                            
                            <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium flex items-center gap-2 flex-wrap">
                                <span>{result.woundTypeLocalized}</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-cyan-300">{result.healingStageLocalized}</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-400">{isAr ? `مدة التحسن المقدرة: ${result.estimatedHealingDays}` : `Estimated recovery: ${result.estimatedHealingDays}`}</span>
                            </p>
                        </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleCopyReport}
                            className="gap-1.5 text-xs bg-[#0C1324] border border-white/[0.08] hover:bg-[#10192F]"
                        >
                            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
                            <span>{copied ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "مشاركة" : "Share")}</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onResetScan}
                            className="gap-1.5 text-xs border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.04]"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>{isAr ? "فحص جديد" : "New Scan"}</span>
                        </Button>
                    </div>
                </div>

                {/* Key Status Metrics Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
                    
                    {/* Severity Badge */}
                    <div className={cn("p-3.5 rounded-2xl border flex flex-col justify-between", severityConfig.bg, severityConfig.border)}>
                        <span className="text-[11px] font-semibold text-slate-400">{isAr ? "درجة الحالة" : "Severity Level"}</span>
                        <span className={cn("text-sm font-black mt-1", severityConfig.text)}>{severityConfig.label}</span>
                    </div>

                    {/* Infection / Inflammation Risk */}
                    <div className="p-3.5 rounded-2xl bg-[#0C1324]/80 border border-white/[0.06] flex flex-col justify-between">
                        <span className="text-[11px] font-semibold text-slate-400">{isAr ? "مؤشر الالتهاب" : "Inflammation Risk"}</span>
                        <span className={cn(
                            "text-sm font-bold mt-1 flex items-center gap-1.5",
                            result.infectionAssessment.riskLevel === "low" ? "text-emerald-400" : (result.infectionAssessment.riskLevel === "medium" ? "text-amber-400" : "text-rose-400")
                        )}>
                            <span className="w-2 h-2 rounded-full bg-current" />
                            {result.infectionAssessment.riskLevel === "low" ? (isAr ? "منخفض ومستقر" : "Low Risk") : (result.infectionAssessment.riskLevel === "medium" ? (isAr ? "متوسط - يتطلب رعاية" : "Moderate") : (isAr ? "مرتفع - عدوى نشطة" : "High Risk"))}
                        </span>
                    </div>

                    {/* Specialist Referral */}
                    <div className="p-3.5 rounded-2xl bg-[#0C1324]/80 border border-white/[0.06] flex flex-col justify-between">
                        <span className="text-[11px] font-semibold text-slate-400">{isAr ? "التخصص الموصى به" : "Recommended Specialty"}</span>
                        <span className="text-xs font-bold text-slate-200 mt-1 truncate" title={result.recommendedMedicalSpecialty}>
                            {result.recommendedMedicalSpecialty}
                        </span>
                    </div>

                    {/* AI Confidence */}
                    <div className="p-3.5 rounded-2xl bg-[#0C1324]/80 border border-white/[0.06] flex flex-col justify-between">
                        <span className="text-[11px] font-semibold text-slate-400">{isAr ? "دقة الفحص السريري" : "AI Confidence"}</span>
                        <span className="text-sm font-bold text-cyan-300 mt-1 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                            {result.confidenceScore}%
                        </span>
                    </div>
                </div>
            </div>

            {/* ── INTERACTIVE NAVIGATION TABS ── */}
            <div className="flex items-center gap-2 p-1.5 bg-[#080D1A]/85 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-xl">
                <button
                    onClick={() => setActiveTab("care")}
                    className={cn(
                        "flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2",
                        activeTab === "care"
                            ? "bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-md"
                            : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                    )}
                >
                    <ListChecks className="w-4 h-4" />
                    <span>{isAr ? "بروتوكول العناية والمواد الفعالة" : "Care Protocol & Actives"}</span>
                </button>

                <button
                    onClick={() => setActiveTab("reasoning")}
                    className={cn(
                        "flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2",
                        activeTab === "reasoning"
                            ? "bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-md"
                            : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                    )}
                >
                    <Brain className="w-4 h-4" />
                    <span>{isAr ? "التفكير والتشخيص السريري" : "Clinical Diagnostic Reasoning"}</span>
                </button>

                <button
                    onClick={() => setActiveTab("safety")}
                    className={cn(
                        "flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2",
                        activeTab === "safety"
                            ? "bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-md"
                            : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                    )}
                >
                    <ShieldAlert className="w-4 h-4" />
                    <span>{isAr ? "معايير الأمان وعلامات الخطر" : "Safety & Triage"}</span>
                </button>
            </div>

            {/* ── TAB 1: CARE PROTOCOL & ACTIVE INGREDIENTS ── */}
            {activeTab === "care" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    
                    {/* Step-by-Step Practical Care */}
                    <div className="rounded-3xl border border-white/[0.08] bg-[#080D1A]/85 p-6 sm:p-7 backdrop-blur-2xl shadow-xl space-y-5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                                <ListChecks className="w-5 h-5 text-cyan-400" />
                                <span>{isAr ? "الخطوات العلاجية والإسعافية الموصى بها" : "Step-by-Step Clinical Care Plan"}</span>
                            </h2>
                            <span className="text-xs text-slate-500 font-medium">
                                {isAr ? "اضغط على الخطوة لتحديد إنجازها" : "Click to mark completed"}
                            </span>
                        </div>

                        <div className="space-y-3">
                            {result.firstAidSteps.map((step, idx) => {
                                const isDone = !!completedSteps[step.stepNumber];
                                return (
                                    <div
                                        key={idx}
                                        onClick={() => toggleStep(step.stepNumber)}
                                        className={cn(
                                            "p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5",
                                            isDone
                                                ? "bg-emerald-950/20 border-emerald-500/30 opacity-75"
                                                : "bg-[#0C1324]/80 border-white/[0.06] hover:border-cyan-500/30"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 transition-colors",
                                            isDone
                                                ? "bg-emerald-500 text-slate-950"
                                                : "bg-cyan-500/15 text-cyan-300 border border-cyan-400/30"
                                        )}>
                                            {isDone ? <Check className="w-4 h-4" /> : step.stepNumber}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className={cn("text-sm font-bold text-white", isDone && "line-through text-slate-400")}>
                                                {step.title}
                                            </h3>
                                            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                                                {step.action}
                                            </p>
                                            {step.caution && (
                                                <div className="mt-2 text-[11px] text-amber-300/90 flex items-center gap-1.5 font-medium">
                                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                                    <span>{step.caution}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Recommended Active Ingredients */}
                    {result.dressingProtocol.recommendedActives && result.dressingProtocol.recommendedActives.length > 0 && (
                        <div className="rounded-3xl border border-white/[0.08] bg-[#080D1A]/85 p-6 sm:p-7 backdrop-blur-2xl shadow-xl space-y-5">
                            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                                <Pill className="w-5 h-5 text-emerald-400" />
                                <span>{isAr ? "المواد الفعالة الموصى بها طبياً (Active Ingredients)" : "Recommended OTC Active Ingredients"}</span>
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                {result.dressingProtocol.recommendedActives.map((act, i) => (
                                    <div key={i} className="p-4 rounded-2xl bg-[#0C1324]/80 border border-white/[0.06] space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                                            <h3 className="text-sm font-bold text-emerald-300">{act.name}</h3>
                                        </div>
                                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                            <strong className="text-slate-400">{isAr ? "الفائدة:" : "Purpose:"}</strong> {act.purpose}
                                        </p>
                                        <p className="text-[11px] text-slate-400 leading-relaxed">
                                            <strong className="text-slate-500">{isAr ? "الاستخدام:" : "Usage:"}</strong> {act.howToUse}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Dressing & Prohibited Substances */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        
                        {/* Dressing & Cleansing Rules */}
                        <div className="rounded-3xl border border-white/[0.08] bg-[#080D1A]/85 p-6 backdrop-blur-2xl shadow-xl space-y-4">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Droplets className="w-4 h-4 text-cyan-400" />
                                <span>{isAr ? "الغيار والتنظيف السليم" : "Cleansing & Protection"}</span>
                            </h3>
                            <div className="space-y-2 text-xs text-slate-300">
                                <p><strong className="text-slate-400">{isAr ? "محلول التنظيف:" : "Cleanser:"}</strong> {result.dressingProtocol.cleaningSolution}</p>
                                <p><strong className="text-slate-400">{isAr ? "طريقة الغيار:" : "Instructions:"}</strong> {result.dressingProtocol.applicationInstructions}</p>
                                <p><strong className="text-slate-400">{isAr ? "معدل التغيير:" : "Frequency:"}</strong> {result.dressingProtocol.changeFrequency}</p>
                            </div>
                        </div>

                        {/* Prohibited substances */}
                        <div className="rounded-3xl border border-rose-500/20 bg-[#080D1A]/85 p-6 backdrop-blur-2xl shadow-xl space-y-4">
                            <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                                <Ban className="w-4 h-4 text-rose-400" />
                                <span>{isAr ? "محظورات وممارسات خاطئة يجب تجنبها" : "Strictly Avoid (Contraindicated)"}</span>
                            </h3>
                            <div className="space-y-2">
                                {result.dressingProtocol.avoidSubstances.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-xs text-rose-200/90">
                                        <span className="text-rose-400 font-bold shrink-0">•</span>
                                        <span className="leading-relaxed">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── TAB 2: CLINICAL REASONING & DIAGNOSTICS ── */}
            {activeTab === "reasoning" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    
                    {/* Deep Clinical Thinking & Differential Diagnosis */}
                    {result.clinicalThinking && (
                        <div className="rounded-3xl border border-white/[0.08] bg-[#080D1A]/85 p-6 sm:p-7 backdrop-blur-2xl shadow-xl space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300">
                                    <Brain className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base sm:text-lg font-bold text-white">
                                        {isAr ? "التحليل السريري والتفكير الطبي المعمق (Clinical CoT)" : "Clinical Chain-of-Thought & Reasoning"}
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        {isAr ? "منهجية الفحص البصري واستبعاد الحالات المشابهة" : "Visual observation heuristics & differential rule-out"}
                                    </p>
                                </div>
                            </div>

                            {/* Visual Observations */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    {isAr ? "المعالم والملاحظات البصرية المرصودة:" : "Key Visual Observations:"}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {result.clinicalThinking.keyVisualObservations.map((obs, i) => (
                                        <div key={i} className="p-3 rounded-xl bg-[#0C1324]/80 border border-white/[0.06] text-xs text-slate-300 flex items-start gap-2">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                                            <span>{obs}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Differentials */}
                            <div className="space-y-2 pt-1">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    {isAr ? "التشخيص التفريقي وحالات الاشتباه المستبعدة:" : "Differential Diagnoses Evaluated:"}
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {result.clinicalThinking.differentialDiagnoses.map((diff, i) => (
                                        <span key={i} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.04] border border-white/[0.08] text-slate-300">
                                            {diff}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Diagnostic Rationale */}
                            <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/25 text-xs sm:text-sm text-cyan-200 leading-relaxed space-y-1">
                                <strong className="text-cyan-300 block font-bold">{isAr ? "التعليل السريري للتشخيص:" : "Diagnostic Rationale:"}</strong>
                                <p>{result.clinicalThinking.diagnosticRationale}</p>
                            </div>
                        </div>
                    )}

                    {/* Skin Type Profile (if applicable) */}
                    {result.skinTypeProfile && result.skinTypeProfile.skinType !== "not_applicable" && (
                        <div className="rounded-3xl border border-white/[0.08] bg-[#080D1A]/85 p-6 sm:p-7 backdrop-blur-2xl shadow-xl space-y-5">
                            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                                <Sparkles className="w-5 h-5 text-cyan-400" />
                                <span>{isAr ? "ملف خصائص وحاجز البشرة (Skin Type Profile)" : "Skin Barrier & Type Profile"}</span>
                            </h2>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="p-3.5 rounded-2xl bg-[#0C1324]/80 border border-white/[0.06]">
                                    <span className="text-[11px] text-slate-400 block">{isAr ? "نوع البشرة" : "Skin Type"}</span>
                                    <span className="text-sm font-bold text-white mt-1 block">{result.skinTypeProfile.skinTypeLocalized}</span>
                                </div>
                                <div className="p-3.5 rounded-2xl bg-[#0C1324]/80 border border-white/[0.06]">
                                    <span className="text-[11px] text-slate-400 block">{isAr ? "إفراز الزهم" : "Sebum Level"}</span>
                                    <span className="text-sm font-bold text-cyan-300 mt-1 block">{result.skinTypeProfile.sebumLevel}</span>
                                </div>
                                <div className="p-3.5 rounded-2xl bg-[#0C1324]/80 border border-white/[0.06]">
                                    <span className="text-[11px] text-slate-400 block">{isAr ? "الترطيب" : "Hydration"}</span>
                                    <span className="text-sm font-bold text-emerald-300 mt-1 block">{result.skinTypeProfile.hydrationLevel}</span>
                                </div>
                                <div className="p-3.5 rounded-2xl bg-[#0C1324]/80 border border-white/[0.06]">
                                    <span className="text-[11px] text-slate-400 block">{isAr ? "حاجز البشرة" : "Barrier Integrity"}</span>
                                    <span className="text-sm font-bold text-slate-200 mt-1 block">{result.skinTypeProfile.barrierIntegrity}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tissue / Lesion Composition Breakdown */}
                    <div className="rounded-3xl border border-white/[0.08] bg-[#080D1A]/85 p-6 sm:p-7 backdrop-blur-2xl shadow-xl space-y-4">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Layers className="w-4 h-4 text-cyan-400" />
                            <span>{isAr ? "تحليل طبقات النسيج والحالة الخلوية" : "Tissue & Cellular Composition"}</span>
                        </h3>

                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-xs font-semibold mb-1">
                                    <span className="text-emerald-400">{isAr ? "نسيج حبيبي سليم / جلد متعافي" : "Healthy Granulation / Intact Skin"}</span>
                                    <span className="text-slate-300">{result.tissueComposition.granulation}%</span>
                                </div>
                                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${result.tissueComposition.granulation}%` }} />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-semibold mb-1">
                                    <span className="text-amber-400">{isAr ? "إفرازات زهمية / نسيج غير حيوي (Slough)" : "Sebum / Slough / Exudate"}</span>
                                    <span className="text-slate-300">{result.tissueComposition.slough}%</span>
                                </div>
                                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${result.tissueComposition.slough}%` }} />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-semibold mb-1">
                                    <span className="text-cyan-400">{isAr ? "تجدد ظهاري / حواف البشرة (Epithelial)" : "Epithelial Margins"}</span>
                                    <span className="text-slate-300">{result.tissueComposition.epithelial}%</span>
                                </div>
                                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                                    <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${result.tissueComposition.epithelial}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── TAB 3: SAFETY & EMERGENCY TRIAGE ── */}
            {activeTab === "safety" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    
                    {/* Sutures & Tetanus Triage */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className={cn(
                            "p-5 rounded-3xl border backdrop-blur-xl space-y-2",
                            result.sutureAssessment.requiresSutures ? "bg-rose-950/20 border-rose-500/30" : "bg-[#080D1A]/85 border-white/[0.08]"
                        )}>
                            <div className="flex items-center gap-2 text-sm font-bold">
                                <Bandage className={cn("w-4 h-4", result.sutureAssessment.requiresSutures ? "text-rose-400" : "text-emerald-400")} />
                                <span className="text-white">{isAr ? "تقييم الحاجة للخياطة الجراحية" : "Suture Assessment"}</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">{result.sutureAssessment.rationale}</p>
                            {result.sutureAssessment.requiresSutures && (
                                <span className="inline-block mt-2 px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-bold text-[11px]">
                                    {isAr ? `النافذة الزمنية الحرجة: خلال ${result.sutureAssessment.urgencyWindowHours} ساعات` : `Urgency Window: within ${result.sutureAssessment.urgencyWindowHours}h`}
                                </span>
                            )}
                        </div>

                        <div className={cn(
                            "p-5 rounded-3xl border backdrop-blur-xl space-y-2",
                            result.tetanusAssessment.riskIdentified ? "bg-amber-950/20 border-amber-500/30" : "bg-[#080D1A]/85 border-white/[0.08]"
                        )}>
                            <div className="flex items-center gap-2 text-sm font-bold">
                                <Syringe className={cn("w-4 h-4", result.tetanusAssessment.riskIdentified ? "text-amber-400" : "text-emerald-400")} />
                                <span className="text-white">{isAr ? "تقييم خطورة التيتانوس" : "Tetanus Risk Assessment"}</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">{result.tetanusAssessment.rationale}</p>
                            <p className="text-[11px] text-cyan-300 font-medium">{result.tetanusAssessment.recommendation}</p>
                        </div>
                    </div>

                    {/* Urgent Red Flags & Emergency Triggers */}
                    <div className="rounded-3xl border border-rose-500/30 bg-[#080D1A]/85 p-6 sm:p-7 backdrop-blur-2xl shadow-xl space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400">
                                <AlertOctagon className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-white">
                                    {isAr ? "علامات الخطر ودواعي التوجه الفوري للطوارئ" : "Urgent Red Flags & ER Warning Signs"}
                                </h2>
                                <p className="text-xs text-slate-400">
                                    {isAr ? "راجع الطبيب فوراً أو توجه لأقرب مستشفى عند ملاحظة أي من الأعراض التالية" : "Seek emergency room care immediately if experiencing these signs"}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {result.urgentRedFlags.map((flag, idx) => (
                                <div key={idx} className="p-3.5 rounded-2xl bg-rose-950/15 border border-rose-500/20 text-xs text-rose-200 flex items-start gap-2.5">
                                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                    <span className="leading-relaxed">{flag}</span>
                                </div>
                            ))}
                        </div>

                        {/* Emergency Contact Hub */}
                        <div className="mt-4 p-4 rounded-2xl bg-slate-950/60 border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                                    <PhoneCall className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white">
                                        {isAr ? `إسعاف الطوارئ (${EMERGENCY_DIRECTORY[detectedCountryCode]?.country || "المحلي"})` : `Emergency Ambulance (${EMERGENCY_DIRECTORY[detectedCountryCode]?.country || "Local"})`}
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                        {isAr ? "اتصال مباشر سريع بغرفة العمليات الطبية" : "Instant direct dispatch"}
                                    </p>
                                </div>
                            </div>

                            <a
                                href={`tel:${ambulanceNumber}`}
                                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg"
                            >
                                <PhoneCall className="w-4 h-4" />
                                <span>{isAr ? `اتصال بالإسعاف (${ambulanceNumber})` : `Call Ambulance (${ambulanceNumber})`}</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* ── CLINICAL DISCLAIMER ── */}
            <div className="p-4 rounded-2xl bg-[#080D1A]/60 border border-white/[0.04] text-[11px] text-slate-500 text-center leading-relaxed">
                <p>{result.disclaimer}</p>
            </div>
        </div>
    );
};
