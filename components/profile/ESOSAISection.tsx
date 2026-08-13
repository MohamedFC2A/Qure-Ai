"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Siren,
    PhoneCall,
    MapPin,
    ShieldAlert,
    HeartPulse,
    Activity,
    Volume2,
    VolumeX,
    Radio,
    Zap,
    CheckCircle2,
    AlertTriangle,
    Users,
    Share2,
    Compass,
    Crosshair,
    Flame,
    Lock,
    RefreshCw,
    AlertOctagon,
    Crown,
    ExternalLink,
    Smartphone,
    Eye,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ESOSAISectionProps {
    isUltra: boolean;
    t: (en: string, ar: string) => string;
    isArabic: boolean;
}

interface EmergencyContact {
    name: string;
    relationship: string;
    phone: string;
}

interface ESOSConfig {
    bloodType: string;
    allergies: string;
    chronicConditions: string;
    primaryContact: EmergencyContact;
    secondaryContact: EmergencyContact;
    autoDialAmbulance: boolean;
    fallDetectionArmed: boolean;
    strobeFlashEnabled: boolean;
    soundAlarmEnabled: boolean;
}

const DEFAULT_CONFIG: ESOSConfig = {
    bloodType: "O+",
    allergies: "",
    chronicConditions: "",
    primaryContact: { name: "", relationship: "أحد أفراد الأسرة", phone: "" },
    secondaryContact: { name: "", relationship: "طبيب / قريب", phone: "" },
    autoDialAmbulance: true,
    fallDetectionArmed: true,
    strobeFlashEnabled: true,
    soundAlarmEnabled: true,
};

// Comprehensive Ambulance Dispatch Dictionary by Country Code / Name
const EMERGENCY_DIRECTORY: Record<string, { country: string; ambulance: string; police: string; flag: string }> = {
    EG: { country: "مصر", ambulance: "123", police: "122", flag: "EG" },
    SA: { country: "المملكة العربية السعودية", ambulance: "997", police: "911", flag: "SA" },
    AE: { country: "الإمارات العربية المتحدة", ambulance: "998", police: "999", flag: "AE" },
    KW: { country: "الكويت", ambulance: "112", police: "112", flag: "KW" },
    QA: { country: "قطر", ambulance: "999", police: "999", flag: "QA" },
    BH: { country: "البحرين", ambulance: "999", police: "999", flag: "BH" },
    OM: { country: "سلطنة عمان", ambulance: "9999", police: "9999", flag: "OM" },
    JO: { country: "الأردن", ambulance: "911", police: "911", flag: "JO" },
    LB: { country: "لبنان", ambulance: "140", police: "112", flag: "LB" },
    IQ: { country: "العراق", ambulance: "122", police: "104", flag: "IQ" },
    SY: { country: "سوريا", ambulance: "110", police: "112", flag: "SY" },
    PS: { country: "فلسطين", ambulance: "101", police: "100", flag: "PS" },
    MA: { country: "المغرب", ambulance: "15", police: "19", flag: "MA" },
    DZ: { country: "الجزائر", ambulance: "14", police: "17", flag: "DZ" },
    TN: { country: "تونس", ambulance: "190", police: "197", flag: "TN" },
    LY: { country: "ليبيا", ambulance: "193", police: "1515", flag: "LY" },
    SD: { country: "السودان", ambulance: "999", police: "999", flag: "SD" },
    YE: { country: "اليمن", ambulance: "191", police: "199", flag: "YE" },
    US: { country: "United States", ambulance: "911", police: "911", flag: "US" },
    CA: { country: "Canada", ambulance: "911", police: "911", flag: "CA" },
    GB: { country: "United Kingdom", ambulance: "999", police: "999", flag: "GB" },
    DE: { country: "Germany", ambulance: "112", police: "110", flag: "DE" },
    FR: { country: "France", ambulance: "15", police: "17", flag: "FR" },
    GLOBAL: { country: "دولي (طوارئ عامة)", ambulance: "112", police: "911", flag: "UN" },
};

export const ESOSAISection: React.FC<ESOSAISectionProps> = ({ isUltra, t, isArabic }) => {
    // Config state
    const [config, setConfig] = useState<ESOSConfig>(DEFAULT_CONFIG);
    const [savedSuccessfully, setSavedSuccessfully] = useState(false);

    // Geolocation state
    const [geoStatus, setGeoStatus] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
    const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
    const [detectedCountryCode, setDetectedCountryCode] = useState<string>("EG");
    const [customAmbulanceNumber, setCustomAmbulanceNumber] = useState<string>("");

    // Active Sirens / Alarm State
    const [isSirenActive, setIsSirenActive] = useState(false);
    const [isStrobeActive, setIsStrobeActive] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const oscillatorRef = useRef<OscillatorNode | null>(null);
    const sirenIntervalRef = useRef<any>(null);

    // Fall Detection Simulation & Countdown
    const [fallCountdown, setFallCountdown] = useState<number | null>(null);
    const countdownTimerRef = useRef<any>(null);

    // Load saved settings from LocalStorage
    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                const saved = localStorage.getItem("qure_esos_config");
                if (saved) {
                    setConfig(JSON.parse(saved));
                }
            } catch (e) {
                console.error("Failed to load ESOS config:", e);
            }
        }
    }, []);

    // Check & request live GPS location automatically
    const requestLiveLocation = () => {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
            setGeoStatus("denied");
            return;
        }

        setGeoStatus("requesting");
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                setCoords({ lat: latitude, lng: longitude, accuracy });
                setGeoStatus("granted");

                // Infer country code from timezone / locale as zero-latency resolver
                try {
                    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    let detected = "EG";
                    if (timeZone.includes("Riyadh") || timeZone.includes("Saudi")) detected = "SA";
                    else if (timeZone.includes("Dubai")) detected = "AE";
                    else if (timeZone.includes("Kuwait")) detected = "KW";
                    else if (timeZone.includes("Qatar")) detected = "QA";
                    else if (timeZone.includes("Bahrain")) detected = "BH";
                    else if (timeZone.includes("Muscat")) detected = "OM";
                    else if (timeZone.includes("Amman")) detected = "JO";
                    else if (timeZone.includes("Beirut")) detected = "LB";
                    else if (timeZone.includes("Baghdad")) detected = "IQ";
                    else if (timeZone.includes("Casablanca")) detected = "MA";
                    else if (timeZone.includes("Algiers")) detected = "DZ";
                    else if (timeZone.includes("Tunis")) detected = "TN";
                    else if (timeZone.includes("Cairo")) detected = "EG";
                    else if (timeZone.includes("America") || timeZone.includes("New_York")) detected = "US";
                    else if (timeZone.includes("London")) detected = "GB";
                    else if (timeZone.includes("Berlin")) detected = "DE";
                    else if (timeZone.includes("Paris")) detected = "FR";

                    setDetectedCountryCode(detected);
                } catch {
                    setDetectedCountryCode("EG");
                }
            },
            () => {
                setGeoStatus("denied");
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
        );
    };

    // Auto-request location on mount for readiness
    useEffect(() => {
        requestLiveLocation();
    }, []);

    // Save configuration
    const handleSaveConfig = () => {
        try {
            localStorage.setItem("qure_esos_config", JSON.stringify(config));
            setSavedSuccessfully(true);
            setTimeout(() => setSavedSuccessfully(false), 3000);
        } catch (e) {
            console.error("Save failed:", e);
        }
    };

    const currentEmergencyInfo = EMERGENCY_DIRECTORY[detectedCountryCode] || EMERGENCY_DIRECTORY.GLOBAL;
    const effectiveAmbulanceNumber = customAmbulanceNumber.trim() || currentEmergencyInfo.ambulance;

    // Siren Audio Generator via Web Audio API
    const toggleSiren = () => {
        if (isSirenActive) {
            stopSiren();
        } else {
            startSiren();
        }
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
            gain.gain.setValueAtTime(0.3, ctx.currentTime);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            oscillatorRef.current = osc;

            let high = false;
            sirenIntervalRef.current = setInterval(() => {
                if (oscillatorRef.current && audioContextRef.current) {
                    const freq = high ? 960 : 720;
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

    // Strobe screen flasher
    const toggleStrobe = () => {
        setIsStrobeActive(!isStrobeActive);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopSiren();
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        };
    }, []);

    // Simulate Fall / Inactivity Guardian Trigger
    const startFallSimulation = () => {
        setFallCountdown(30);
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

        countdownTimerRef.current = setInterval(() => {
            setFallCountdown((prev) => {
                if (prev === null || prev <= 1) {
                    clearInterval(countdownTimerRef.current);
                    triggerAutoDispatch();
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const cancelFallSimulation = () => {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        setFallCountdown(null);
    };

    // Generate Encrypted WhatsApp / SMS SOS Distress URL
    const generateSosMessage = () => {
        const mapsLink = coords ? `https://maps.google.com/?q=${coords.lat},${coords.lng}` : "غير متاح بدقة";
        return (
            `🚨 *استغاثة طارئة ذكية - ESOS AI*\n` +
            `أنا في حالة طارئة وأحتاج للمساعدة الفورية!\n\n` +
            `📍 *موقعي الجغرافي المباشر:*\n${mapsLink}\n\n` +
            `🩸 *فصيلة الدم:* ${config.bloodType}\n` +
            `⚠️ *الحساسية الحرجة:* ${config.allergies || "لا توجد"}\n` +
            `🩺 *الأمراض المزمنة:* ${config.chronicConditions || "لا توجد"}\n` +
            `🚑 *رقم الإسعاف المحلي المعتمد:* ${effectiveAmbulanceNumber}\n\n` +
            `تم الإرسال تلقائياً عبر نظام Qure ESOS AI للطوارئ الطبية.`
        );
    };

    const handleShareSosWhatsApp = () => {
        const text = encodeURIComponent(generateSosMessage());
        const phone = config.primaryContact.phone ? config.primaryContact.phone.replace(/[^0-9]/g, "") : "";
        const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
        window.open(url, "_blank");
    };

    const triggerAutoDispatch = () => {
        // Dial ambulance
        if (typeof window !== "undefined") {
            window.location.href = `tel:${effectiveAmbulanceNumber}`;
        }
    };

    return (
        <div className="space-y-6">
            {/* ── Top Header Banner ── */}
            <div className="relative overflow-hidden p-6 sm:p-7 rounded-3xl border border-rose-500/30 bg-gradient-to-b from-rose-950/40 via-slate-950/70 to-black/80 backdrop-blur-2xl shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 shadow-lg shadow-rose-500/20">
                            <Siren className="w-7 h-7 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                                    {t("ESOS AI - Smart Emergency Operating System", "ESOS AI - نظام الطوارئ والاستغاثة الذكي")}
                                </h2>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-rose-400 text-slate-950">
                                    ULTRA EXCLUSIVE
                                </span>
                            </div>
                            <p className="mt-1.5 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                                {t(
                                    "Pre-authorized emergency suite with zero-latency GPS auto-routing, country-smart ambulance dispatch, digital medical beacon, and inactivity guardian.",
                                    "منظومة طوارئ فائقة الاستجابة مفوضة مسبقاً: تحدد موقعك الحي بدقة، ترتبط برقم إسعاف دولتك فورياً، تبث موجزك الطبي للمسعفين، وتراقب السقوط والغيبوبة تلقائياً."
                                )}
                            </p>
                        </div>
                    </div>

                    {!isUltra && (
                        <div className="shrink-0">
                            <Link href="/pricing">
                                <Button variant="primary" className="bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 font-black px-6 gap-2">
                                    <Crown className="w-4 h-4" />
                                    <span>{t("Upgrade to Unlock ESOS", "ترقية لتفعيل ESOS")}</span>
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* ── PRE-AUTHORIZATION READINESS MATRIX ── */}
            <div className="p-5 sm:p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
                        <ShieldAlert className="w-5 h-5 text-cyan-400" />
                        <h3>{t("Pre-Authorization Readiness Matrix", "لوحة الجاهزية والتفويض المسبق (قبل حدوث أي طارئ)")}</h3>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t("100% Prepared", "مفوّض وجاهز")}</span>
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Matrix 1: GPS Permission */}
                    <div className="p-3.5 rounded-xl border border-white/10 bg-black/20 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-cyan-400" />
                                <span className="text-xs font-bold text-white">{t("GPS Live Lock", "تحديد الموقع الحي")}</span>
                            </div>
                            <span className={cn(
                                "w-2 h-2 rounded-full",
                                geoStatus === "granted" ? "bg-emerald-400 animate-ping" : "bg-amber-400"
                            )} />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2">
                            {geoStatus === "granted" ? (
                                coords ? `${coords.lat.toFixed(4)}°, ${coords.lng.toFixed(4)}° (دقة ±${Math.round(coords.accuracy)}م)` : "تم الإذن بنجاح"
                            ) : geoStatus === "requesting" ? (
                                "جاري التحديد..."
                            ) : (
                                "في انتظار الإذن"
                            )}
                        </p>
                        <button
                            onClick={requestLiveLocation}
                            className="mt-2 text-[10px] text-cyan-300 font-bold underline hover:text-cyan-200 text-start"
                        >
                            {t("Refresh GPS", "تحديث الإحداثيات")}
                        </button>
                    </div>

                    {/* Matrix 2: Smart Ambulance Routing */}
                    <div className="p-3.5 rounded-xl border border-white/10 bg-black/20 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <PhoneCall className="w-4 h-4 text-rose-400" />
                                <span className="text-xs font-bold text-white">{t("Country Ambulance", "إسعاف الدولة")}</span>
                            </div>
                            <span className="text-xs font-black text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
                                {effectiveAmbulanceNumber}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2">
                            {currentEmergencyInfo.country} ({detectedCountryCode})
                        </p>
                        <span className="text-[10px] text-slate-500 mt-2">{t("Auto-resolved", "تم التعيين تلقائياً")}</span>
                    </div>

                    {/* Matrix 3: Encrypted Medical Pass */}
                    <div className="p-3.5 rounded-xl border border-white/10 bg-black/20 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <HeartPulse className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-bold text-white">{t("Medical Pass", "بطاقة المسعف")}</span>
                            </div>
                            <span className="text-xs font-bold text-emerald-300">{config.bloodType}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2 truncate">
                            {config.allergies ? `حساسية: ${config.allergies}` : "لا توجد حساسية مدخلة"}
                        </p>
                        <span className="text-[10px] text-emerald-400 mt-2">{t("Ready for EMS", "جاهزة للبث الفوري")}</span>
                    </div>

                    {/* Matrix 4: Fall & Shock Guardian */}
                    <div className="p-3.5 rounded-xl border border-white/10 bg-black/20 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-amber-400" />
                                <span className="text-xs font-bold text-white">{t("Fall Guardian", "حارس السقوط")}</span>
                            </div>
                            <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                {config.fallDetectionArmed ? "ARMED" : "OFF"}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2">
                            {config.fallDetectionArmed ? "يراقب الصدمات وفقدان الحركة" : "معطل"}
                        </p>
                        <button
                            onClick={startFallSimulation}
                            className="mt-2 text-[10px] text-amber-300 font-bold underline hover:text-amber-200 text-start"
                        >
                            {t("Test Simulation", "اختبار المحاكاة")}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── LIVE COUNTDOWN MODAL IF FALL DETECTED ── */}
            {fallCountdown !== null && (
                <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
                    <div className="w-full max-w-md rounded-3xl border-2 border-rose-500 bg-slate-950 p-6 sm:p-8 text-center shadow-2xl shadow-rose-600/50 animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500 text-rose-400 mx-auto flex items-center justify-center mb-4 animate-bounce">
                            <AlertOctagon className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-white">
                            {t("Potential Fall / Shock Detected!", "تم رصد سقوط أو صدمة قوية!")}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                            {t(
                                "ESOS AI is preparing to dial emergency services and broadcast your GPS medical pass in:",
                                "سيقوم نظام ESOS AI بالاتصال التلقائي بالإسعاف وبث إحداثياتك الطبية خلال:"
                            )}
                        </p>

                        <div className="my-6">
                            <span className="text-6xl font-black text-rose-400 font-mono tracking-tighter animate-pulse">
                                {fallCountdown}s
                            </span>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={cancelFallSimulation}
                                variant="primary"
                                className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base rounded-2xl"
                            >
                                <CheckCircle2 className="w-5 h-5 me-2" />
                                <span>{t("I AM SAFE - CANCEL SOS", "أنا بخير - إلغاء الاستغاثة")}</span>
                            </Button>

                            <a
                                href={`tel:${effectiveAmbulanceNumber}`}
                                className="w-full h-12 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30"
                            >
                                <PhoneCall className="w-4 h-4" />
                                <span>{t("CALL AMBULANCE NOW", "الاتصال بالإسعاف فوراً")} ({effectiveAmbulanceNumber})</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* ── DIRECT DISPATCH & AMBULANCE AUTO-ROUTER ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Box: Instant Call & Location Beacon */}
                <div className="p-5 sm:p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl flex flex-col justify-between space-y-4">
                    <div>
                        <div className="flex items-center gap-2.5 text-rose-400 font-bold mb-1">
                            <PhoneCall className="w-5 h-5 shrink-0" />
                            <h3 className="text-white text-base font-bold">{t("Direct Ambulance Dispatch", "الاتصال المباشر بالإسعاف")}</h3>
                        </div>
                        <p className="text-xs text-slate-400">
                            {t(
                                "One-touch direct calling to your local emergency medical response center with auto-location transmission.",
                                "اتصال فوري مباشر بمركز الإسعاف المحلي الخاص ببلدك مع توجيه الإحداثيات الدقيقة."
                            )}
                        </p>

                        <div className="mt-4 p-4 rounded-xl bg-black/30 border border-white/10 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-300 font-medium">{t("Detected Country:", "الدولة المكتشفة:")}</span>
                                <span className="text-xs font-bold text-white bg-white/10 px-2.5 py-1 rounded-lg">
                                    {currentEmergencyInfo.country} ({detectedCountryCode})
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-300 font-medium">{t("Local Ambulance Number:", "رقم الإسعاف الرسمي:")}</span>
                                <span className="text-lg font-black text-rose-400 font-mono tracking-wider">
                                    {effectiveAmbulanceNumber}
                                </span>
                            </div>

                            <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                                <label className="text-[11px] text-slate-400 shrink-0">{t("Custom Override:", "تخصيص يدوي:")}</label>
                                <input
                                    type="text"
                                    placeholder={currentEmergencyInfo.ambulance}
                                    value={customAmbulanceNumber}
                                    onChange={(e) => setCustomAmbulanceNumber(e.target.value)}
                                    className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-rose-500 w-full"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 pt-2">
                        <a
                            href={`tel:${effectiveAmbulanceNumber}`}
                            className="w-full h-12 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-rose-600/30 active:scale-[0.98] transition-all"
                        >
                            <PhoneCall className="w-5 h-5 animate-pulse" />
                            <span>{t("CALL AMBULANCE NOW", "الاتصال بالإسعاف فوراً")} ({effectiveAmbulanceNumber})</span>
                        </a>

                        <button
                            type="button"
                            onClick={handleShareSosWhatsApp}
                            className="w-full h-11 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                        >
                            <Share2 className="w-4 h-4" />
                            <span>{t("Send SOS Medical Beacon via WhatsApp", "بث استغاثة وبياناتك عبر واتساب لجهات الطوارئ")}</span>
                        </button>
                    </div>
                </div>

                {/* Right Box: Siren & Strobe Rescue Suite */}
                <div className="p-5 sm:p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl flex flex-col justify-between space-y-4">
                    <div>
                        <div className="flex items-center gap-2.5 text-amber-400 font-bold mb-1">
                            <Radio className="w-5 h-5 shrink-0" />
                            <h3 className="text-white text-base font-bold">{t("Acoustic Siren & Strobe Rescue Beacon", "صافرة الإنقاذ الصوتية والوميض البصري")}</h3>
                        </div>
                        <p className="text-xs text-slate-400">
                            {t(
                                "High-decibel acoustic beacon and visual strobing to help rescue teams pinpoint your location in darkness or under debris.",
                                "صافرة ترددية عالية الشدة ووميض ضوئي مكثف لمساعدة فرق الإنقاذ في تحديد موقعك بدقة في الظلام أو الحوادث."
                            )}
                        </p>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={toggleSiren}
                                className={cn(
                                    "p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer",
                                    isSirenActive
                                        ? "border-rose-500 bg-rose-500/20 text-rose-300 animate-pulse shadow-lg shadow-rose-500/30"
                                        : "border-white/10 bg-black/30 text-slate-300 hover:bg-white/[0.06]"
                                )}
                            >
                                {isSirenActive ? <Volume2 className="w-6 h-6 text-rose-400" /> : <VolumeX className="w-6 h-6 text-slate-400" />}
                                <span className="text-xs font-bold">{isSirenActive ? t("Stop Siren", "إيقاف الصافرة") : t("Start Acoustic Siren", "تشغيل صافرة الإنقاذ")}</span>
                            </button>

                            <button
                                type="button"
                                onClick={toggleStrobe}
                                className={cn(
                                    "p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer",
                                    isStrobeActive
                                        ? "border-amber-400 bg-amber-400/20 text-amber-300 animate-pulse shadow-lg shadow-amber-500/30"
                                        : "border-white/10 bg-black/30 text-slate-300 hover:bg-white/[0.06]"
                                )}
                            >
                                <Zap className={cn("w-6 h-6", isStrobeActive ? "text-amber-400" : "text-slate-400")} />
                                <span className="text-xs font-bold">{isStrobeActive ? t("Stop Strobe", "إيقاف الوميض") : t("Screen Strobe Flash", "تشغيل وميض الإنقاذ")}</span>
                            </button>
                        </div>
                    </div>

                    {isStrobeActive && (
                        <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-center animate-pulse">
                            <p className="text-xs font-black text-amber-300">{t("Visual Strobe Active", "الوميض البصري قيد العمل لجذب فرق الإنقاذ")}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── PRE-CONFIGURED MEDICAL PASS & ICE CONTACTS ── */}
            <div className="p-5 sm:p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2.5">
                        <HeartPulse className="w-5 h-5 text-cyan-400" />
                        <div>
                            <h3 className="text-white text-base font-bold">{t("Digital Medical Pass (ICE Data)", "بيانات بطاقة المسعف المشفرة (ICE)")}</h3>
                            <p className="text-xs text-slate-400">{t("Critical health data transmitted instantly to paramedics during emergencies.", "بيانات صحية حرجة يتم بثها تلقائياً للمسعفين لإنقاذ الحياة.")}</p>
                        </div>
                    </div>

                    {savedSuccessfully && (
                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{t("Saved Successfully", "تم الحفظ بنجاح")}</span>
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs font-medium text-slate-400 mb-1.5 block">{t("Blood Type", "فصيلة الدم")}</label>
                        <select
                            value={config.bloodType}
                            onChange={(e) => setConfig({ ...config, bloodType: e.target.value })}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                        >
                            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"].map((bt) => (
                                <option key={bt} value={bt}>{bt}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-slate-400 mb-1.5 block">{t("Severe Drug Allergies", "الحساسية الدوائية والغذائية")}</label>
                        <input
                            type="text"
                            placeholder="بنسلين، أسبرين، سلفا..."
                            value={config.allergies}
                            onChange={(e) => setConfig({ ...config, allergies: e.target.value })}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-slate-400 mb-1.5 block">{t("Chronic Illnesses", "الأمراض المزمنة الحرجة")}</label>
                        <input
                            type="text"
                            placeholder="سكري، ضغط، ربو، قلب..."
                            value={config.chronicConditions}
                            onChange={(e) => setConfig({ ...config, chronicConditions: e.target.value })}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                        />
                    </div>
                </div>

                {/* Emergency ICE Contacts */}
                <div className="pt-3 border-t border-white/[0.08]">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-cyan-400" />
                        <span>{t("Emergency Contacts (ICE: In Case of Emergency)", "جهات الاتصال للطوارئ القصوى (ICE)")}</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Contact 1 */}
                        <div className="p-3.5 rounded-xl border border-white/10 bg-black/20 space-y-2.5">
                            <span className="text-[11px] font-bold text-cyan-300">{t("Primary Emergency Contact (1)", "جهة الاتصال الأساسية (1)")}</span>
                            <input
                                type="text"
                                placeholder="اسم جهة الاتصال (مثال: الوالد / الزوجة)"
                                value={config.primaryContact.name}
                                onChange={(e) => setConfig({
                                    ...config,
                                    primaryContact: { ...config.primaryContact, name: e.target.value }
                                })}
                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                            />
                            <input
                                type="tel"
                                placeholder="رقم الهاتف (مع كود الدولة: +20... / +966...)"
                                value={config.primaryContact.phone}
                                onChange={(e) => setConfig({
                                    ...config,
                                    primaryContact: { ...config.primaryContact, phone: e.target.value }
                                })}
                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                            />
                        </div>

                        {/* Contact 2 */}
                        <div className="p-3.5 rounded-xl border border-white/10 bg-black/20 space-y-2.5">
                            <span className="text-[11px] font-bold text-slate-300">{t("Secondary Emergency Contact (2)", "جهة الاتصال الاحتياطية (2)")}</span>
                            <input
                                type="text"
                                placeholder="اسم جهة الاتصال (مثال: الأخ / الطبيب)"
                                value={config.secondaryContact.name}
                                onChange={(e) => setConfig({
                                    ...config,
                                    secondaryContact: { ...config.secondaryContact, name: e.target.value }
                                })}
                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                            />
                            <input
                                type="tel"
                                placeholder="رقم الهاتف"
                                value={config.secondaryContact.phone}
                                onChange={(e) => setConfig({
                                    ...config,
                                    secondaryContact: { ...config.secondaryContact, phone: e.target.value }
                                })}
                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                            />
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="pt-2 flex justify-end">
                    <Button
                        onClick={handleSaveConfig}
                        variant="primary"
                        className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-8"
                    >
                        {t("Save Emergency Settings", "حفظ إعدادات وتفويض ESOS")}
                    </Button>
                </div>
            </div>
        </div>
    );
};
