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
    Lock,
    AlertOctagon,
    Crown,
    Check,
    Database,
    RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

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
    enabled: boolean;
    bloodType: string;
    allergies: string;
    chronicConditions: string;
    primaryContact: EmergencyContact;
    secondaryContact: EmergencyContact;
    autoDialAmbulance: boolean;
    fallDetectionArmed: boolean;
    customAmbulanceNumber: string;
}

const DEFAULT_CONFIG: ESOSConfig = {
    enabled: true,
    bloodType: "O+",
    allergies: "",
    chronicConditions: "",
    primaryContact: { name: "", relationship: "أحد أفراد الأسرة", phone: "" },
    secondaryContact: { name: "", relationship: "طبيب / قريب", phone: "" },
    autoDialAmbulance: true,
    fallDetectionArmed: true,
    customAmbulanceNumber: "",
};

// Emergency Numbers Directory
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

export const ESOSAISection: React.FC<ESOSAISectionProps> = ({ isUltra, t, isArabic }) => {
    const [config, setConfig] = useState<ESOSConfig>(DEFAULT_CONFIG);
    const [savedMsg, setSavedMsg] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // Geolocation state
    const [geoStatus, setGeoStatus] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
    const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
    const [detectedCountryCode, setDetectedCountryCode] = useState<string>("EG");

    // Sirens / Strobe State
    const [isSirenActive, setIsSirenActive] = useState(false);
    const [isStrobeActive, setIsStrobeActive] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const oscillatorRef = useRef<OscillatorNode | null>(null);
    const sirenIntervalRef = useRef<any>(null);

    // Fall Detection Simulation
    const [fallCountdown, setFallCountdown] = useState<number | null>(null);
    const countdownTimerRef = useRef<any>(null);

    const supabase = createClient();

    // Load configuration & smartly sync with Supabase Care Private Profile
    useEffect(() => {
        let isMounted = true;

        const loadAndSyncHealthData = async () => {
            let initialConfig = { ...DEFAULT_CONFIG };

            // 1. Try local storage first
            if (typeof window !== "undefined") {
                try {
                    const saved = localStorage.getItem("qure_esos_config");
                    if (saved) {
                        initialConfig = { ...initialConfig, ...JSON.parse(saved) };
                    }
                } catch (e) {
                    console.error("Failed to load ESOS config:", e);
                }
            }

            // 2. Fetch authenticated user's private health profile
            try {
                const { data: authData } = await supabase.auth.getUser();
                const user = authData?.user ?? null;
                if (user && isMounted) {
                    setUserId(user.id);
                    setIsSyncing(true);

                    const { data: healthProfile } = await supabase
                        .from('care_private_profiles')
                        .select('allergies, chronic_conditions, notes')
                        .eq('profile_id', user.id)
                        .maybeSingle();

                    if (healthProfile && isMounted) {
                        // Smart auto-population from private AI health memory
                        if (healthProfile.allergies && !initialConfig.allergies) {
                            initialConfig.allergies = healthProfile.allergies;
                        }
                        if (healthProfile.chronic_conditions && !initialConfig.chronicConditions) {
                            initialConfig.chronicConditions = healthProfile.chronic_conditions;
                        }
                    }
                    setIsSyncing(false);
                }
            } catch (err) {
                console.warn("Could not sync with Supabase private profile:", err);
                setIsSyncing(false);
            }

            if (isMounted) {
                setConfig(initialConfig);
            }
        };

        loadAndSyncHealthData();

        return () => {
            isMounted = false;
        };
    }, []);

    // Request GPS Live coordinates
    const requestLiveLocation = () => {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
            setGeoStatus("denied");
            return;
        }

        setGeoStatus("requesting");
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                setCoords({ lat: latitude, lng: longitude, accuracy });
                setGeoStatus("granted");

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

    useEffect(() => {
        requestLiveLocation();
    }, []);

    // Save configuration to both localStorage & Supabase care_private_profiles
    const handleSaveConfig = async () => {
        try {
            localStorage.setItem("qure_esos_config", JSON.stringify(config));

            // Sync with Supabase Care Private Profile in real-time
            if (userId) {
                await supabase
                    .from('care_private_profiles')
                    .upsert({
                        profile_id: userId,
                        allergies: config.allergies || null,
                        chronic_conditions: config.chronicConditions || null,
                        updated_at: new Date().toISOString(),
                    });
            }

            setSavedMsg(true);
            setTimeout(() => setSavedMsg(false), 2500);
        } catch (e) {
            console.error("Save failed:", e);
        }
    };

    const currentEmergencyInfo = EMERGENCY_DIRECTORY[detectedCountryCode] || EMERGENCY_DIRECTORY.GLOBAL;
    const effectiveAmbulanceNumber = config.customAmbulanceNumber.trim() || currentEmergencyInfo.ambulance;

    // Toggle Master ESOS Switch
    const toggleMasterEsos = () => {
        const updated = { ...config, enabled: !config.enabled };
        setConfig(updated);
        try {
            localStorage.setItem("qure_esos_config", JSON.stringify(updated));
        } catch {}
    };

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

    const toggleStrobe = () => {
        setIsStrobeActive(!isStrobeActive);
    };

    useEffect(() => {
        return () => {
            stopSiren();
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        };
    }, []);

    // Simulation
    const startFallSimulation = () => {
        setFallCountdown(30);
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

        countdownTimerRef.current = setInterval(() => {
            setFallCountdown((prev) => {
                if (prev === null || prev <= 1) {
                    clearInterval(countdownTimerRef.current);
                    if (typeof window !== "undefined") {
                        window.location.href = `tel:${effectiveAmbulanceNumber}`;
                    }
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

    // SOS WhatsApp
    const handleShareSosWhatsApp = () => {
        const mapsLink = coords ? `https://maps.google.com/?q=${coords.lat},${coords.lng}` : "غير متاح";
        const msg = (
            `استغاثة طارئة - ESOS AI\n` +
            `أحتاج لمساعدة طبية فورية!\n\n` +
            `الموقع الجغرافي:\n${mapsLink}\n\n` +
            `فصيلة الدم: ${config.bloodType}\n` +
            `الحساسية: ${config.allergies || "لا توجد"}\n` +
            `الأمراض المزمنة: ${config.chronicConditions || "لا توجد"}\n` +
            `رقم الإسعاف: ${effectiveAmbulanceNumber}\n\n` +
            `تم الإرسال عبر نظام Qure ESOS للطوارئ.`
        );
        const text = encodeURIComponent(msg);
        const phone = config.primaryContact.phone ? config.primaryContact.phone.replace(/[^0-9]/g, "") : "";
        const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
        window.open(url, "_blank");
    };

    return (
        <div className="space-y-6">
            {/* ── Main Container Card ── */}
            <div className="p-6 sm:p-7 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl space-y-6">
                
                {/* Header Title */}
                <div>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5">
                            <Siren className="w-5 h-5 text-rose-400 shrink-0" />
                            <h2 className="text-xl font-bold text-white tracking-tight">
                                {t("ESOS AI Emergency System", "نظام الطوارئ والاستغاثة (ESOS AI)")}
                            </h2>
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                            <Database className="w-3.5 h-3.5" />
                            <span>{t("Synchronized with Private AI Health Memory", "مربوط بالملف الصحي الخاص (Care Profile)")}</span>
                        </div>
                    </div>

                    <p className="mt-1.5 text-xs sm:text-sm text-slate-400 leading-relaxed">
                        {t(
                            "Autonomous zero-latency emergency suite. Auto-identifies national ambulance lines, pre-authorizes GPS telemetry, broadcasts medical passes, and monitors fall inactivity.",
                            "منظومة طوارئ ذكية: تحدد رقم إسعاف دولتك تلقائياً، تتيح التفويض المسبق لإحداثيات GPS، تبث بطاقة المسعف الطبية، وتراقب السقوط والصدمات."
                        )}
                    </p>
                </div>

                {/* ── Master Toggle Switch (Matches FDA Switch Design) ── */}
                <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">
                            {t("Enable ESOS AI Emergency Protection", "تفعيل نظام الطوارئ الذكي ESOS AI")}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                            {t(
                                "Enables rapid-response ambulance routing, GPS pre-authorization, and medical emergency beacon.",
                                "تفعيل التوجيه السريع لرقم الإسعاف، التفويض المسبق للموقع، وبث بيانات المسعف عند الطوارئ."
                            )}
                        </p>
                    </div>

                    <button
                        type="button"
                        role="switch"
                        aria-checked={config.enabled}
                        onClick={toggleMasterEsos}
                        className={cn(
                            "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors focus:outline-none",
                            config.enabled
                                ? "bg-emerald-500/20 border-emerald-500/40"
                                : "bg-white/5 border-white/15"
                        )}
                    >
                        <span
                            className={cn(
                                "inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform",
                                isArabic
                                    ? config.enabled ? "-translate-x-7" : "-translate-x-1"
                                    : config.enabled ? "translate-x-7" : "translate-x-1"
                            )}
                        />
                    </button>
                </div>

                {/* ── Content When Enabled ── */}
                {config.enabled ? (
                    <div className="space-y-6 pt-2">
                        
                        {/* ── Simplified Live Status Strip ── */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02]">
                                <span className="text-[11px] text-slate-400 block">{t("Detected Country", "الدولة المكتشفة")}</span>
                                <p className="text-xs sm:text-sm font-bold text-white mt-1 truncate">
                                    {currentEmergencyInfo.country} ({detectedCountryCode})
                                </p>
                            </div>

                            <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02]">
                                <span className="text-[11px] text-slate-400 block">{t("Official Ambulance", "رقم الإسعاف الرسمي")}</span>
                                <p className="text-sm sm:text-base font-bold text-rose-400 mt-0.5 font-mono">
                                    {effectiveAmbulanceNumber}
                                </p>
                            </div>

                            <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02]">
                                <span className="text-[11px] text-slate-400 block">{t("GPS Pre-Auth", "إحداثيات الموقع")}</span>
                                <p className="text-xs sm:text-sm font-bold text-emerald-400 mt-1 truncate">
                                    {coords ? `±${Math.round(coords.accuracy)}م جاهز` : geoStatus === "requesting" ? "جاري التحديد..." : "مفوّض"}
                                </p>
                            </div>

                            <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02]">
                                <span className="text-[11px] text-slate-400 block">{t("Fall Guardian", "حارس السقوط")}</span>
                                <button
                                    onClick={startFallSimulation}
                                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 mt-1 underline block text-start"
                                >
                                    {t("Test Simulation", "اختبار المحاكاة")}
                                </button>
                            </div>
                        </div>

                        {/* ── Fast Action Panel ── */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* Call Ambulance */}
                            <a
                                href={`tel:${effectiveAmbulanceNumber}`}
                                className="h-11 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors px-3"
                            >
                                <PhoneCall className="w-4 h-4" />
                                <span>{t("Call Ambulance", "الاتصال بالإسعاف")} ({effectiveAmbulanceNumber})</span>
                            </a>

                            {/* WhatsApp SOS */}
                            <button
                                type="button"
                                onClick={handleShareSosWhatsApp}
                                className="h-11 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors px-3"
                            >
                                <Share2 className="w-4 h-4 text-emerald-400" />
                                <span>{t("Send SOS via WhatsApp", "بث استغاثة واتساب")}</span>
                            </button>

                            {/* Siren */}
                            <button
                                type="button"
                                onClick={toggleSiren}
                                className={cn(
                                    "h-11 rounded-xl border font-semibold text-xs flex items-center justify-center gap-2 transition-colors px-3",
                                    isSirenActive
                                        ? "border-rose-500 bg-rose-500/15 text-rose-300 font-bold"
                                        : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
                                )}
                            >
                                {isSirenActive ? <Volume2 className="w-4 h-4 text-rose-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                                <span>{isSirenActive ? t("Stop Siren", "إيقاف الصافرة") : t("Acoustic Siren", "صافرة الإنقاذ")}</span>
                            </button>

                            {/* Strobe */}
                            <button
                                type="button"
                                onClick={toggleStrobe}
                                className={cn(
                                    "h-11 rounded-xl border font-semibold text-xs flex items-center justify-center gap-2 transition-colors px-3",
                                    isStrobeActive
                                        ? "border-amber-400 bg-amber-400/15 text-amber-300 font-bold"
                                        : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
                                )}
                            >
                                <Zap className={cn("w-4 h-4", isStrobeActive ? "text-amber-400" : "text-slate-400")} />
                                <span>{isStrobeActive ? t("Stop Strobe", "إيقاف الوميض") : t("Rescue Strobe", "وميض الإنقاذ")}</span>
                            </button>
                        </div>

                        {/* ── Medical Emergency Pass & ICE Data Form ── */}
                        <div className="pt-4 border-t border-white/[0.06] space-y-4">
                            <div>
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <HeartPulse className="w-4 h-4 text-cyan-400" />
                                    <span>{t("Medical Pass & Emergency Contacts (ICE)", "بيانات بطاقة المسعف وجهات اتصال الطوارئ")}</span>
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {t("Pre-filled health details transmitted during emergencies to save crucial time.", "بيانات صحية تُرفق برسالة الاستغاثة ومربوطة بملفك الصحي الخاص لتمكين المسعفين من التدخل السليم.")}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                <div>
                                    <label className="text-xs font-medium text-slate-400 mb-1 block">{t("Blood Type", "فصيلة الدم")}</label>
                                    <select
                                        value={config.bloodType}
                                        onChange={(e) => setConfig({ ...config, bloodType: e.target.value })}
                                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-white/25"
                                    >
                                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"].map((bt) => (
                                            <option key={bt} value={bt}>{bt}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-slate-400 mb-1 block">{t("Drug Allergies", "الحساسية الحرجة")}</label>
                                    <input
                                        type="text"
                                        placeholder="بنسلين، أسبرين..."
                                        value={config.allergies}
                                        onChange={(e) => setConfig({ ...config, allergies: e.target.value })}
                                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-white/25"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-slate-400 mb-1 block">{t("Chronic Diseases", "الأمراض المزمنة")}</label>
                                    <input
                                        type="text"
                                        placeholder="سكري، ضغط، ربو..."
                                        value={config.chronicConditions}
                                        onChange={(e) => setConfig({ ...config, chronicConditions: e.target.value })}
                                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-white/25"
                                    />
                                </div>
                            </div>

                            {/* ICE Contacts */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                                <div className="p-3 rounded-xl border border-white/10 bg-slate-900/50 space-y-2">
                                    <span className="text-xs font-semibold text-slate-300">{t("Primary Emergency Contact (1)", "جهة اتصال الطوارئ الرئيسية (1)")}</span>
                                    <input
                                        type="text"
                                        placeholder="الاسم (الوالد / الزوجة...)"
                                        value={config.primaryContact.name}
                                        onChange={(e) => setConfig({
                                            ...config,
                                            primaryContact: { ...config.primaryContact, name: e.target.value }
                                        })}
                                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/25"
                                    />
                                    <input
                                        type="tel"
                                        placeholder="رقم الهاتف (+20... / +966...)"
                                        value={config.primaryContact.phone}
                                        onChange={(e) => setConfig({
                                            ...config,
                                            primaryContact: { ...config.primaryContact, phone: e.target.value }
                                        })}
                                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/25"
                                    />
                                </div>

                                <div className="p-3 rounded-xl border border-white/10 bg-slate-900/50 space-y-2">
                                    <span className="text-xs font-semibold text-slate-300">{t("Secondary Emergency Contact (2)", "جهة اتصال احتياطية (2)")}</span>
                                    <input
                                        type="text"
                                        placeholder="الاسم (الأخ / الطبيب...)"
                                        value={config.secondaryContact.name}
                                        onChange={(e) => setConfig({
                                            ...config,
                                            secondaryContact: { ...config.secondaryContact, name: e.target.value }
                                        })}
                                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/25"
                                    />
                                    <input
                                        type="tel"
                                        placeholder="رقم الهاتف"
                                        value={config.secondaryContact.phone}
                                        onChange={(e) => setConfig({
                                            ...config,
                                            secondaryContact: { ...config.secondaryContact, phone: e.target.value }
                                        })}
                                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/25"
                                    />
                                </div>
                            </div>

                            {/* Save Actions */}
                            <div className="pt-2 flex items-center justify-between">
                                {savedMsg ? (
                                    <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                                        <Check className="w-3.5 h-3.5" />
                                        <span>{t("Settings & Private Health Profile synced successfully", "تم حفظ وتحديث الملف الصحي بنجاح")}</span>
                                    </span>
                                ) : isSyncing ? (
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        <span>{t("Syncing health memory...", "جاري المزامنة مع الملف الصحي...")}</span>
                                    </span>
                                ) : <div />}

                                <Button
                                    onClick={handleSaveConfig}
                                    variant="primary"
                                    className="bg-slate-800 hover:bg-slate-700 border border-white/15 text-white font-semibold text-xs px-6"
                                >
                                    {t("Save ESOS Settings", "حفظ الإعدادات")}
                                </Button>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] text-center text-xs text-slate-400">
                        {t("ESOS AI Emergency System is currently disabled. Toggle the switch above to activate.", "نظام ESOS AI معطل حالياً. فعّل المفتاح أعلاه لتشغيل منظومة الطوارئ الذكية.")}
                    </div>
                )}
            </div>

            {/* ── Fall / Shock Alert Modal (Formal & Clean) ── */}
            {fallCountdown !== null && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-slate-900 p-6 text-center shadow-xl animate-in zoom-in-95 duration-150">
                        <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-white/10 text-rose-400 mx-auto flex items-center justify-center mb-3">
                            <AlertOctagon className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-bold text-white">
                            {t("Potential Fall / Shock Detected", "تم رصد سقوط أو صدمة")}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {t(
                                "Auto-dispatching ambulance in:",
                                "جاري الاتصال التلقائي بالإسعاف خلال:"
                            )}
                        </p>

                        <div className="my-4">
                            <span className="text-4xl font-bold text-white font-mono">
                                {fallCountdown}s
                            </span>
                        </div>

                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={cancelFallSimulation}
                                className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{t("I Am Safe - Cancel", "أنا بخير - إلغاء")}</span>
                            </button>

                            <a
                                href={`tel:${effectiveAmbulanceNumber}`}
                                className="w-full h-10 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <PhoneCall className="w-3.5 h-3.5" />
                                <span>{t("Call Ambulance Now", "الاتصال بالإسعاف فوراً")} ({effectiveAmbulanceNumber})</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
