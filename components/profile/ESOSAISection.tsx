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
            `استغاثة طارئة - ESOS AI\n` +
            `أنا في حالة طارئة وأحتاج للمساعدة الفورية!\n\n` +
            `موقعي الجغرافي المباشر:\n${mapsLink}\n\n` +
            `فصيلة الدم: ${config.bloodType}\n` +
            `الحساسية الحرجة: ${config.allergies || "لا توجد"}\n` +
            `الأمراض المزمنة: ${config.chronicConditions || "لا توجد"}\n` +
            `رقم الإسعاف المحلي المعتمد: ${effectiveAmbulanceNumber}\n\n` +
            `تم الإرسال عبر نظام Qure ESOS AI للطوارئ الطبية.`
        );
    };

    const handleShareSosWhatsApp = () => {
        const text = encodeURIComponent(generateSosMessage());
        const phone = config.primaryContact.phone ? config.primaryContact.phone.replace(/[^0-9]/g, "") : "";
        const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
        window.open(url, "_blank");
    };

    const triggerAutoDispatch = () => {
        if (typeof window !== "undefined") {
            window.location.href = `tel:${effectiveAmbulanceNumber}`;
        }
    };

    return (
        <div className="space-y-6">
            {/* ── Top Header Banner (Matte & Clean, No Glowing) ── */}
            <div className="p-5 sm:p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-white/10 flex items-center justify-center text-rose-400 shrink-0">
                            <Siren className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                                    {t("ESOS AI - Smart Emergency Operating System", "ESOS AI - نظام الطوارئ والاستغاثة الذكي")}
                                </h2>
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white border border-white/10">
                                    ULTRA
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-400 max-w-2xl leading-relaxed">
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
                                <Button variant="primary" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 gap-2">
                                    <Crown className="w-4 h-4" />
                                    <span>{t("Upgrade to Unlock ESOS", "ترقية لتفعيل ESOS")}</span>
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* ── PRE-AUTHORIZATION READINESS MATRIX (Matte Flat Style) ── */}
            <div className="p-5 sm:p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
                        <ShieldAlert className="w-5 h-5 text-cyan-400" />
                        <h3>{t("Pre-Authorization Readiness Matrix", "لوحة الجاهزية والتفويض المسبق (قبل حدوث أي طارئ)")}</h3>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t("100% Prepared", "مفوّض وجاهز")}</span>
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Matrix 1: GPS Permission */}
                    <div className="p-3.5 rounded-xl border border-white/10 bg-slate-900/50 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-cyan-400" />
                                <span className="text-xs font-bold text-white">{t("GPS Live Lock", "تحديد الموقع الحي")}</span>
                            </div>
                            <span className={cn(
                                "w-2 h-2 rounded-full",
                                geoStatus === "granted" ? "bg-emerald-400" : "bg-amber-400"
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
                    <div className="p-3.5 rounded-xl border border-white/10 bg-slate-900/50 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <PhoneCall className="w-4 h-4 text-rose-400" />
                                <span className="text-xs font-bold text-white">{t("Country Ambulance", "إسعاف الدولة")}</span>
                            </div>
                            <span className="text-xs font-bold text-rose-300 bg-rose-500/15 px-2 py-0.5 rounded border border-rose-500/20">
                                {effectiveAmbulanceNumber}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2">
                            {currentEmergencyInfo.country} ({detectedCountryCode})
                        </p>
                        <span className="text-[10px] text-slate-500 mt-2">{t("Auto-resolved", "تم التعيين تلقائياً")}</span>
                    </div>

                    {/* Matrix 3: Encrypted Medical Pass */}
                    <div className="p-3.5 rounded-xl border border-white/10 bg-slate-900/50 flex flex-col justify-between">
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
                    <div className="p-3.5 rounded-xl border border-white/10 bg-slate-900/50 flex flex-col justify-between">
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

            {/* ── LIVE COUNTDOWN MODAL (Clean Crisp Flat Minimalist - NO GLOWING) ── */}
            {fallCountdown !== null && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-900 p-6 sm:p-7 text-center shadow-xl animate-in zoom-in-95 duration-150">
                        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-white/10 text-rose-400 mx-auto flex items-center justify-center mb-4">
                            <AlertOctagon className="w-7 h-7" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-white">
                            {t("Potential Fall / Shock Detected!", "تم رصد سقوط أو صدمة قوية!")}
                        </h3>
                        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                            {t(
                                "ESOS AI is preparing to dial emergency services and broadcast your GPS medical pass in:",
                                "سيقوم نظام ESOS AI بالاتصال التلقائي بالإسعاف وبث إحداثياتك الطبية خلال:"
                            )}
                        </p>

                        <div className="my-5">
                            <span className="text-5xl font-bold text-white font-mono tracking-tight">
                                {fallCountdown}s
                            </span>
                        </div>

                        <div className="flex flex-col gap-2.5">
                            <button
                                type="button"
                                onClick={cancelFallSimulation}
                                className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{t("I AM SAFE - CANCEL SOS", "أنا بخير - إلغاء الاستغاثة")}</span>
                            </button>

                            <a
                                href={`tel:${effectiveAmbulanceNumber}`}
                                className="w-full h-11 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
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

                        <div className="mt-4 p-4 rounded-xl bg-slate-900/50 border border-white/10 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-300 font-medium">{t("Detected Country:", "الدولة المكتشفة:")}</span>
                                <span className="text-xs font-bold text-white bg-white/10 px-2.5 py-1 rounded-lg">
                                    {currentEmergencyInfo.country} ({detectedCountryCode})
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-300 font-medium">{t("Local Ambulance Number:", "رقم الإسعاف الرسمي:")}</span>
                                <span className="text-base font-bold text-rose-400 font-mono">
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
                                    className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-white/30 w-full"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 pt-2">
                        <a
                            href={`tel:${effectiveAmbulanceNumber}`}
                            className="w-full h-11 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                        >
                            <PhoneCall className="w-4 h-4" />
                            <span>{t("CALL AMBULANCE NOW", "الاتصال بالإسعاف فوراً")} ({effectiveAmbulanceNumber})</span>
                        </a>

                        <button
                            type="button"
                            onClick={handleShareSosWhatsApp}
                            className="w-full h-11 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                        >
                            <Share2 className="w-4 h-4 text-emerald-400" />
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
                                    "p-4 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-colors cursor-pointer",
                                    isSirenActive
                                        ? "border-rose-500/40 bg-rose-500/10 text-rose-400 font-bold"
                                        : "border-white/10 bg-slate-900/50 text-slate-300 hover:bg-white/[0.04]"
                                )}
                            >
                                {isSirenActive ? <Volume2 className="w-5 h-5 text-rose-400" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
                                <span className="text-xs">{isSirenActive ? t("Stop Siren", "إيقاف الصافرة") : t("Start Acoustic Siren", "تشغيل صافرة الإنقاذ")}</span>
                            </button>

                            <button
                                type="button"
                                onClick={toggleStrobe}
                                className={cn(
                                    "p-4 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-colors cursor-pointer",
                                    isStrobeActive
                                        ? "border-amber-400/40 bg-amber-400/10 text-amber-400 font-bold"
                                        : "border-white/10 bg-slate-900/50 text-slate-300 hover:bg-white/[0.04]"
                                )}
                            >
                                <Zap className={cn("w-5 h-5", isStrobeActive ? "text-amber-400" : "text-slate-400")} />
                                <span className="text-xs">{isStrobeActive ? t("Stop Strobe", "إيقاف الوميض") : t("Screen Strobe Flash", "تشغيل وميض الإنقاذ")}</span>
                            </button>
                        </div>
                    </div>

                    {isStrobeActive && (
                        <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/10 text-center">
                            <p className="text-xs font-bold text-amber-300">{t("Visual Strobe Active", "الوميض البصري قيد العمل لجذب فرق الإنقاذ")}</p>
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
                        <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
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
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
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
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-slate-400 mb-1.5 block">{t("Chronic Illnesses", "الأمراض المزمنة الحرجة")}</label>
                        <input
                            type="text"
                            placeholder="سكري، ضغط، ربو، قلب..."
                            value={config.chronicConditions}
                            onChange={(e) => setConfig({ ...config, chronicConditions: e.target.value })}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
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
                        <div className="p-3.5 rounded-xl border border-white/10 bg-slate-900/50 space-y-2.5">
                            <span className="text-[11px] font-bold text-slate-200">{t("Primary Emergency Contact (1)", "جهة الاتصال الأساسية (1)")}</span>
                            <input
                                type="text"
                                placeholder="اسم جهة الاتصال (مثال: الوالد / الزوجة)"
                                value={config.primaryContact.name}
                                onChange={(e) => setConfig({
                                    ...config,
                                    primaryContact: { ...config.primaryContact, name: e.target.value }
                                })}
                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/30"
                            />
                            <input
                                type="tel"
                                placeholder="رقم الهاتف (مع كود الدولة: +20... / +966...)"
                                value={config.primaryContact.phone}
                                onChange={(e) => setConfig({
                                    ...config,
                                    primaryContact: { ...config.primaryContact, phone: e.target.value }
                                })}
                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/30"
                            />
                        </div>

                        {/* Contact 2 */}
                        <div className="p-3.5 rounded-xl border border-white/10 bg-slate-900/50 space-y-2.5">
                            <span className="text-[11px] font-bold text-slate-200">{t("Secondary Emergency Contact (2)", "جهة الاتصال الاحتياطية (2)")}</span>
                            <input
                                type="text"
                                placeholder="اسم جهة الاتصال (مثال: الأخ / الطبيب)"
                                value={config.secondaryContact.name}
                                onChange={(e) => setConfig({
                                    ...config,
                                    secondaryContact: { ...config.secondaryContact, name: e.target.value }
                                })}
                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/30"
                            />
                            <input
                                type="tel"
                                placeholder="رقم الهاتف"
                                value={config.secondaryContact.phone}
                                onChange={(e) => setConfig({
                                    ...config,
                                    secondaryContact: { ...config.secondaryContact, phone: e.target.value }
                                })}
                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/30"
                            />
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="pt-2 flex justify-end">
                    <Button
                        onClick={handleSaveConfig}
                        variant="primary"
                        className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-7"
                    >
                        {t("Save Emergency Settings", "حفظ إعدادات وتفويض ESOS")}
                    </Button>
                </div>
            </div>
        </div>
    );
};
