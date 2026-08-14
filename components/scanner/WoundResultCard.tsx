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
    Siren,
    PhoneCall,
    MapPin,
    Volume2,
    VolumeX,
    Radio,
    Database,
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
    const [activeTab, setActiveTab] = useState<"care" | "tissue" | "safety">("care");

    // ESOS Emergency Telemetry
    const [detectedCountryCode, setDetectedCountryCode] = useState<string>("EG");
    const [ambulanceNumber, setAmbulanceNumber] = useState<string>("123");
    const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [isSirenActive, setIsSirenActive] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const oscillatorRef = useRef<OscillatorNode | null>(null);
    const sirenIntervalRef = useRef<any>(null);

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
                else if (tz.includes("Amman")) detected = "JO";
                else if (tz.includes("Beirut")) detected = "LB";
                else if (tz.includes("Baghdad")) detected = "IQ";
                else if (tz.includes("Casablanca")) detected = "MA";
                else if (tz.includes("Algiers")) detected = "DZ";
                else if (tz.includes("Tunis")) detected = "TN";
                else if (tz.includes("Cairo")) detected = "EG";
                else if (tz.includes("America") || tz.includes("New_York")) detected = "US";
                else if (tz.includes("London")) detected = "GB";
                else if (tz.includes("Berlin")) detected = "DE";
                else if (tz.includes("Paris")) detected = "FR";

                setDetectedCountryCode(detected);

                const saved = localStorage.getItem("qure_esos_config");
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.customAmbulanceNumber?.trim()) {
                        setAmbulanceNumber(parsed.customAmbulanceNumber.trim());
                    } else {
                        setAmbulanceNumber(EMERGENCY_DIRECTORY[detected]?.ambulance || "123");
                    }
                } else {
                    setAmbulanceNumber(EMERGENCY_DIRECTORY[detected]?.ambulance || "123");
                }
            } catch (e) {
                console.warn("ESOS resolution error in WoundResultCard:", e);
            }
        }

        // Live location
        if (typeof navigator !== "undefined" && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                () => {},
                { enableHighAccuracy: true, timeout: 8000 }
            );
        }

        return () => {
            stopSiren();
        };
    }, []);

    // Siren
    const toggleSiren = () => {
        if (isSirenActive) stopSiren();
        else startSiren();
    };

    const startSiren = () => {
        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            audioContextRef.current = ctx;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sawtooth";
            gain.gain.setValueAtTime(0.2, ctx.currentTime);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            oscillatorRef.current = osc;

            let high = false;
            sirenIntervalRef.current = setInterval(() => {
                if (oscillatorRef.current && audioContextRef.current) {
                    const freq = high ? 900 : 700;
                    oscillatorRef.current.frequency.setTargetAtTime(freq, audioContextRef.current.currentTime, 0.08);
                    high = !high;
                }
            }, 350);

            setIsSirenActive(true);
        } catch (e) {
            console.error("Siren start error:", e);
        }
    };

    const stopSiren = () => {
        if (sirenIntervalRef.current) clearInterval(sirenIntervalRef.current);
        if (oscillatorRef.current) {
            try {
                oscillatorRef.current.stop();
                oscillatorRef.current.disconnect();
            } catch {}
            oscillatorRef.current = null;
        }
        if (audioContextRef.current) {
            try {
                audioContextRef.current.close();
            } catch {}
            audioContextRef.current = null;
        }
        setIsSirenActive(false);
    };

    const isEmergency = result.severity === "emergency" || result.severity === "severe" || (result.urgentRedFlags && result.urgentRedFlags.length > 0);

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
            subtext: isAr ? "يجب مراجعة الطبيب أو العيادة الجراحية فوراً" : "Visit a physician/surgical clinic promptly",
            bg: "bg-rose-500/10 border-rose-500/30 text-rose-300",
            badge: "bg-rose-500 text-white font-bold",
            icon: AlertOctagon,
        },
        emergency: {
            label: isAr ? "حالة طارئة حرجة - توجه لقسم الطوارئ فوراً" : "Critical Emergency - Seek Immediate ER Care",
            subtext: isAr ? "خطر نزيف أو عدوى حادة أو تلف أنسجة عميق" : "High risk of arterial bleeding, infection, or deep tissue injury",
            bg: "bg-rose-600/20 border-rose-500/40 text-rose-200",
            badge: "bg-rose-600 text-white font-bold",
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

    const handleShareSosWhatsApp = () => {
        const mapsLink = userCoords ? `https://maps.google.com/?q=${userCoords.lat},${userCoords.lng}` : "غير متاح";
        const msg = (
            `[نداء استغاثة عاجل] حالة إصابة حرجة (ESOS AI)\n\n` +
            `تشخيص الإصابة: ${result.woundTitle} (${severityConfig.label})\n` +
            `التخصص الموصى به: ${result.recommendedMedicalSpecialty}\n` +
            `الموقع الجغرافي المباشر للمصاب:\n${mapsLink}\n\n` +
            `علامات الخطر: ${result.urgentRedFlags?.slice(0, 3).join(" | ") || "تتطلب طوارئ"}\n` +
            `رقم الإسعاف المعتمد: ${ambulanceNumber}\n\n` +
            `تم الإرسال فورياً عبر نظام Qure AI للطوارئ الطبية.`
        );
        const text = encodeURIComponent(msg);
        const url = `https://wa.me/?text=${text}`;
        window.open(url, "_blank");
    };

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ── TOP HERO HEADER & TRIAGE BANNER ── */}
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080D1A]/85 p-5 sm:p-6 backdrop-blur-2xl shadow-xl">
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-white/10">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-white/10 text-emerald-400 shrink-0">
                            <Bandage className="h-6 w-6 sm:h-7 sm:w-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="rounded-full bg-white/[0.04] border border-white/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
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
                                {isAr ? result.woundTypeLocalized : result.woundType} &bull; {isAr ? result.healingStageLocalized : result.healingStage}
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

                {/* ── ESOS PROACTIVE EMERGENCY DISPATCH PROTOCOL (FOR SEVERE / EMERGENCY WOUNDS) ── */}
                {isEmergency && (
                    <div className="mt-4 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs sm:text-sm">
                                <Siren className="w-4 h-4 shrink-0" />
                                <span>{isAr ? "استجابة ESOS AI الفورية للحالات الحرجة والطوارئ:" : "ESOS AI Instant Emergency Protocol Activated:"}</span>
                            </div>
                            <span className="text-[10px] font-bold text-white bg-rose-600 px-2 py-0.5 rounded">
                                {isAr ? "تدخل عاجل" : "Urgent ER Action"}
                            </span>
                        </div>

                        <p className="text-xs text-rose-200 leading-relaxed">
                            {isAr
                                ? "تشير المعايير السريرية إلى ضرورة تلقي رعاية طبية أو جراحية فورية في قسم الطوارئ لتجنب النزيف أو العدوى العميقة. خط الاتصال والبث المباشر جاهز الآن:"
                                : "Clinical parameters indicate this injury requires immediate emergency medical care to prevent hemorrhage or deep infection. Emergency lines are armed:"
                            }
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                            {/* Call Ambulance */}
                            <a
                                href={`tel:${ambulanceNumber}`}
                                className="h-10 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors px-3 shadow-sm"
                            >
                                <PhoneCall className="w-3.5 h-3.5" />
                                <span>{isAr ? "اتصال بالإسعاف فوراً" : "Call Ambulance"} ({ambulanceNumber})</span>
                            </a>

                            {/* WhatsApp SOS */}
                            <button
                                type="button"
                                onClick={handleShareSosWhatsApp}
                                className="h-10 rounded-xl border border-white/15 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors px-3"
                            >
                                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{isAr ? "بث الاستغاثة والموقع" : "Broadcast SOS Pass"}</span>
                            </button>

                            {/* Siren */}
                            <button
                                type="button"
                                onClick={toggleSiren}
                                className={cn(
                                    "h-10 rounded-xl border font-semibold text-xs flex items-center justify-center gap-2 transition-colors px-3",
                                    isSirenActive
                                        ? "border-rose-500 bg-rose-500/20 text-rose-300 font-bold"
                                        : "border-white/15 bg-slate-900 text-slate-300 hover:bg-slate-800"
                                )}
                            >
                                {isSirenActive ? <Volume2 className="w-3.5 h-3.5 text-rose-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                                <span>{isSirenActive ? (isAr ? "إيقاف الصافرة" : "Stop Siren") : (isAr ? "صافرة الإنقاذ" : "Rescue Siren")}</span>
                            </button>
                        </div>
                    </div>
                )}

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

                    {/* Infection Tile */}
                    <div className={cn(
                        "rounded-2xl border p-3.5 flex flex-col justify-between transition-all",
                        result.infectionAssessment.riskLevel === "high"
                            ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                            : result.infectionAssessment.riskLevel === "medium"
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                                : "bg-white/[0.03] border-white/10 text-slate-300"
                    )}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold flex items-center gap-1.5">
                                <Activity className="h-4 w-4 text-cyan-400" />
                                {isAr ? "مستوى خطورة العدوى" : "Infection Risk"}
                            </span>
                            <span className={cn(
                                "text-[11px] font-extrabold px-2 py-0.5 rounded-md uppercase",
                                result.infectionAssessment.riskLevel === "high" ? "bg-rose-500 text-white" : result.infectionAssessment.riskLevel === "medium" ? "bg-amber-500 text-slate-950" : "bg-emerald-500/20 text-emerald-400"
                            )}>
                                {result.infectionAssessment.riskLevel}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
                            {result.infectionAssessment.clinicalSummary}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── TABS NAVIGATION ── */}
            <div className="flex items-center justify-center">
                <div className="inline-flex p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl">
                    <button
                        onClick={() => setActiveTab("care")}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2",
                            activeTab === "care" ? "bg-white text-slate-950" : "text-slate-400 hover:text-white"
                        )}
                    >
                        <Bandage className="h-4 w-4" />
                        <span>{isAr ? "بروتوكول الإسعاف والتضميد" : "First Aid & Dressing"}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("tissue")}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2",
                            activeTab === "tissue" ? "bg-white text-slate-950" : "text-slate-400 hover:text-white"
                        )}
                    >
                        <Layers className="h-4 w-4" />
                        <span>{isAr ? "تحليل طبقات الأنسجة" : "Tissue Composition"}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("safety")}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2",
                            activeTab === "safety" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-white"
                        )}
                    >
                        <ShieldAlert className="h-4 w-4" />
                        <span>{isAr ? "علامات الخطر الحرجة" : "Emergency Safety"}</span>
                    </button>
                </div>
            </div>

            {/* ── TAB 1: CARE & DRESSING PROTOCOL ── */}
            {activeTab === "care" && (
                <div className="space-y-6">
                    {/* Step-by-Step First Aid Protocol */}
                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 sm:p-7 backdrop-blur-xl space-y-4">
                        <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
                            <Bandage className="h-5 w-5 text-emerald-400" />
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-white">
                                    {isAr ? "خطوات الإسعافات الأولية والتطهير السريري" : "Step-by-Step First Aid & Cleansing"}
                                </h3>
                                <p className="text-xs text-slate-400">
                                    {isAr ? "اتبع هذه الخطوات بدقة لتقليل خطر التلوث والندبات" : "Follow strictly to minimize contamination and scarring risk"}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3.5">
                            {result.firstAidSteps.map((step) => (
                                <div key={step.stepNumber} className="flex items-start gap-3.5 p-3.5 rounded-xl border border-white/5 bg-white/[0.02]">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-black text-xs">
                                        {step.stepNumber}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs sm:text-sm font-bold text-white">{step.title}</h4>
                                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">{step.action}</p>
                                        {step.caution && (
                                            <div className="mt-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[11px] text-amber-300 flex items-center gap-1.5">
                                                <AlertTriangle className="h-3 w-3 shrink-0" />
                                                <span>{step.caution}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Optimal Dressing Guide */}
                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 sm:p-7 backdrop-blur-xl space-y-4">
                        <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
                            <Stethoscope className="h-5 w-5 text-cyan-400" />
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-white">
                                    {isAr ? "نوع الغيار والضمادة الطبية المثالية" : "Evidence-Based Dressing Protocol"}
                                </h3>
                                <p className="text-xs text-slate-400">
                                    {isAr ? "توصيات موجهة لنوع إفرازات وعمق الجرح" : "Targeted dressing selection based on exudate level and bed depth"}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-1.5">
                                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">{isAr ? "الضمادة الموصى بها:" : "Recommended Dressing:"}</span>
                                <p className="text-xs sm:text-sm font-bold text-white">{result.dressingProtocol.recommendedDressing}</p>
                            </div>

                            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-1.5">
                                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{isAr ? "محلول التنظيف السليم:" : "Cleaning Solution:"}</span>
                                <p className="text-xs sm:text-sm font-bold text-white">{result.dressingProtocol.cleaningSolution}</p>
                            </div>

                            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-1.5 sm:col-span-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isAr ? "طريقة التطبيق ومعدل التغيير:" : "Application & Frequency:"}</span>
                                <p className="text-xs text-slate-200 leading-relaxed">{result.dressingProtocol.applicationInstructions} ({result.dressingProtocol.changeFrequency})</p>
                            </div>

                            {result.dressingProtocol.avoidSubstances.length > 0 && (
                                <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-1.5 sm:col-span-2">
                                    <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">{isAr ? "مواد يُحظر استخدامها على هذا الجرح:" : "Substances to Avoid:"}</span>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {result.dressingProtocol.avoidSubstances.map((sub, i) => (
                                            <span key={i} className="rounded-lg bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 text-xs text-rose-300">
                                                {sub}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── TAB 2: TISSUE COMPOSITION & HEALING ── */}
            {activeTab === "tissue" && (
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 sm:p-7 backdrop-blur-xl space-y-6">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
                        <Layers className="h-5 w-5 text-purple-400" />
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-white">
                                {isAr ? "التحليل الطيفي لطبقات النسيج وسرير الجرح" : "Wound Bed Tissue Spectrum Analysis"}
                            </h3>
                            <p className="text-xs text-slate-400">
                                {isAr ? "تقييم سريري لنسبة الأنسجة الحية، المتليفة، والمتجددة" : "Clinical quantification of granulation, slough, necrosis, and epithelialization"}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Granulation */}
                        <div>
                            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                                <span className="text-red-400 flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                    {isAr ? "نسيج حبيبي أحمر سليم (Granulation):" : "Red Granulation Tissue:"}
                                </span>
                                <span className="text-white font-mono">{result.tissueComposition.granulation}%</span>
                            </div>
                            <div className="h-2.5 w-full rounded-full bg-white/5 overflow-hidden">
                                <div className="h-full bg-red-500 rounded-full transition-all duration-700" style={{ width: `${result.tissueComposition.granulation}%` }} />
                            </div>
                        </div>

                        {/* Slough */}
                        <div>
                            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                                <span className="text-amber-400 flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                    {isAr ? "نسيج أصفر متموت غير وظيفي (Slough):" : "Yellow Slough:"}
                                </span>
                                <span className="text-white font-mono">{result.tissueComposition.slough}%</span>
                            </div>
                            <div className="h-2.5 w-full rounded-full bg-white/5 overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full transition-all duration-700" style={{ width: `${result.tissueComposition.slough}%` }} />
                            </div>
                        </div>

                        {/* Necrotic */}
                        <div>
                            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                                <span className="text-slate-300 flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                                    {isAr ? "نسيج متنخر جاف/أسود (Necrotic/Eschar):" : "Necrotic Eschar:"}
                                </span>
                                <span className="text-white font-mono">{result.tissueComposition.necrotic}%</span>
                            </div>
                            <div className="h-2.5 w-full rounded-full bg-white/5 overflow-hidden">
                                <div className="h-full bg-slate-600 rounded-full transition-all duration-700" style={{ width: `${result.tissueComposition.necrotic}%` }} />
                            </div>
                        </div>

                        {/* Epithelial */}
                        <div>
                            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                                <span className="text-pink-400 flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                                    {isAr ? "حواف متجددة ووردية (Epithelial):" : "Epithelial Margins:"}
                                </span>
                                <span className="text-white font-mono">{result.tissueComposition.epithelial}%</span>
                            </div>
                            <div className="h-2.5 w-full rounded-full bg-white/5 overflow-hidden">
                                <div className="h-full bg-pink-500 rounded-full transition-all duration-700" style={{ width: `${result.tissueComposition.epithelial}%` }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── TAB 3: EMERGENCY SAFETY & RED FLAGS ── */}
            {activeTab === "safety" && (
                <div className="rounded-2xl border border-rose-500/30 bg-slate-900/60 p-5 sm:p-7 backdrop-blur-xl space-y-6">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
                        <div className="p-2 rounded-xl bg-rose-500/20 border border-white/10 text-rose-400">
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
                                href={`tel:${ambulanceNumber}`}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 px-3.5 py-2 text-xs font-bold text-white transition-colors"
                            >
                                <PhoneCall className="h-3.5 w-3.5" />
                                <span>{isAr ? "اتصال فوري بالإسعاف" : "Call Ambulance"} ({ambulanceNumber})</span>
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
        </div>
    );
};
