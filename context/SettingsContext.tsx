"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

type ResultsLanguage = "en" | "ar";

interface SettingsContextType {
    resultsLanguage: ResultsLanguage;
    setResultsLanguage: (lang: ResultsLanguage) => void;
    fdaDrugsEnabled: boolean;
    setFdaDrugsEnabled: (enabled: boolean) => void;
    requireBiometricOnScan: boolean;
    setRequireBiometricOnScan: (enabled: boolean) => void;
    voiceOsEnabled: boolean;
    setVoiceOsEnabled: (enabled: boolean) => void;
    speakVoiceOs: (phrase: string, options?: { lang?: "ar" | "en"; override?: boolean }) => void;
    isAutoDetected: boolean;
    resetToAutoDetect: () => void;
    detectedCountry?: string | null;
}

const ARAB_COUNTRIES = new Set([
    "EG", "SA", "AE", "KW", "QA", "BH", "OM", "JO", "LB", "IQ", "SY", "YE", "SD", "LY", "TN", "DZ", "MA", "PS"
]);

const ARAB_TIMEZONES = [
    "cairo", "riyadh", "dubai", "amman", "baghdad", "kuwait", "muscat", "doha", "bahrain", "beirut",
    "casablanca", "tunis", "algiers", "tripoli", "khartoum"
];

// Global in-memory phrase audio cache (0ms latency, zero token burn)
const VOICE_OS_AUDIO_CACHE = new Map<string, string>();

function detectDeviceAndLocationLanguage(): ResultsLanguage {
    if (typeof window === "undefined") return "ar";

    const browserLangs = Array.from(navigator.languages || [navigator.language || ""]);
    for (const lang of browserLangs) {
        if (lang && String(lang).toLowerCase().startsWith("ar")) {
            return "ar";
        }
    }

    try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone.toLowerCase();
        for (const tz of ARAB_TIMEZONES) {
            if (timeZone.includes(tz)) {
                return "ar";
            }
        }
    } catch {}

    if (navigator.language && navigator.language.toLowerCase().startsWith("en")) {
        return "en";
    }

    return "ar";
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
    const [resultsLanguage, setResultsLanguage] = useState<ResultsLanguage>("ar");
    const [fdaDrugsEnabled, setFdaDrugsEnabled] = useState<boolean>(true);
    const [requireBiometricOnScan, setRequireBiometricOnScanState] = useState<boolean>(false);
    const [voiceOsEnabled, setVoiceOsEnabledState] = useState<boolean>(true);
    const [isAutoDetected, setIsAutoDetected] = useState<boolean>(true);
    const [detectedCountry, setDetectedCountry] = useState<string | null>(null);

    useEffect(() => {
        const savedLang = localStorage.getItem("qurescan_results_language") as ResultsLanguage;
        if (savedLang && (savedLang === "en" || savedLang === "ar")) {
            setResultsLanguage(savedLang);
            setIsAutoDetected(false);
        } else {
            const detected = detectDeviceAndLocationLanguage();
            setResultsLanguage(detected);
            setIsAutoDetected(true);
        }

        const savedFda = localStorage.getItem("qurescan_fda_drugs_enabled");
        if (savedFda === "0" || savedFda === "false") {
            setFdaDrugsEnabled(false);
        } else if (savedFda === "1" || savedFda === "true") {
            setFdaDrugsEnabled(true);
        }

        const savedBioScan = localStorage.getItem("qurescan_require_biometric_scan");
        if (savedBioScan === "1" || savedBioScan === "true") {
            setRequireBiometricOnScanState(true);
        } else if (savedBioScan === "0" || savedBioScan === "false") {
            setRequireBiometricOnScanState(false);
        }

        const savedVoiceOs = localStorage.getItem("qurescan_voice_os_enabled");
        if (savedVoiceOs === "0" || savedVoiceOs === "false") {
            setVoiceOsEnabledState(false);
        } else {
            setVoiceOsEnabledState(true);
        }

        fetch("https://ipapi.co/json/")
            .then((res) => res.json())
            .then((data) => {
                if (data?.country_code) {
                    setDetectedCountry(data.country_code);
                    if (!savedLang && ARAB_COUNTRIES.has(data.country_code)) {
                        setResultsLanguage("ar");
                        setIsAutoDetected(true);
                    }
                }
            })
            .catch(() => {});
    }, []);

    const updateLanguage = (lang: ResultsLanguage) => {
        setResultsLanguage(lang);
        setIsAutoDetected(false);
        if (typeof window !== "undefined") {
            localStorage.setItem("qurescan_results_language", lang);
        }
    };

    const resetToAutoDetect = () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("qurescan_results_language");
        }
        const detected = detectDeviceAndLocationLanguage();
        setResultsLanguage(detected);
        setIsAutoDetected(true);
    };

    useEffect(() => {
        if (typeof document !== "undefined") {
            document.documentElement.dir = resultsLanguage === "ar" ? "rtl" : "ltr";
            document.documentElement.lang = resultsLanguage;
        }
    }, [resultsLanguage]);

    const updateFdaDrugsEnabled = (enabled: boolean) => {
        setFdaDrugsEnabled(Boolean(enabled));
        if (typeof window !== "undefined") {
            localStorage.setItem("qurescan_fda_drugs_enabled", enabled ? "1" : "0");
        }
    };

    const setRequireBiometricOnScan = (enabled: boolean) => {
        setRequireBiometricOnScanState(Boolean(enabled));
        if (typeof window !== "undefined") {
            localStorage.setItem("qurescan_require_biometric_scan", enabled ? "1" : "0");
        }
    };

    const setVoiceOsEnabled = (enabled: boolean) => {
        setVoiceOsEnabledState(Boolean(enabled));
        if (typeof window !== "undefined") {
            localStorage.setItem("qurescan_voice_os_enabled", enabled ? "1" : "0");
        }
    };

    // Pre-warm Web Speech API voices on component load for 0ms speech latency
    useEffect(() => {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.getVoices();
            if (window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = () => {
                    window.speechSynthesis.getVoices();
                };
            }
        }
    }, []);

    const speakVoiceOs = useCallback(async (phrase: string, options?: { lang?: "ar" | "en"; override?: boolean }) => {
        if (typeof window === "undefined") return;
        const isEnabled = options?.override || (localStorage.getItem("qurescan_voice_os_enabled") !== "0");
        if (!isEnabled) return;

        const cleaned = phrase
            .replace(/<[^>]*>/g, "")
            .replace(/[\*\_`#~]/g, "")
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
            .trim();

        if (!cleaned) return;

        // Fast path 0: In-Memory Static Audio Cache (0ms latency, 0 AI tokens burned)
        const cacheKey = `${options?.lang || resultsLanguage}:${cleaned}`;
        const cachedUrl = VOICE_OS_AUDIO_CACHE.get(cacheKey);
        if (cachedUrl) {
            try {
                const audio = new Audio(cachedUrl);
                await audio.play();
                return;
            } catch {
                // If blob expired, proceed to fetch
            }
        }

        // 1. Primary: Authentic ElevenLabs Neural Male Voice via /api/tts
        try {
            const res = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: cleaned, lang: options?.lang || resultsLanguage }),
            });

            if (res.ok) {
                const blob = await res.blob();
                const audioBlob = new Blob([blob], { type: "audio/mpeg" });
                const audioUrl = URL.createObjectURL(audioBlob);
                
                // Cache phrase audio URL for zero-latency future calls
                VOICE_OS_AUDIO_CACHE.set(cacheKey, audioUrl);

                const audio = new Audio(audioUrl);
                await audio.play();
                return;
            }
        } catch (e) {
            console.warn("ElevenLabs VOICE OS playback failed, using fallback:", e);
        }

        // 2. Secondary: Web Speech API Fallback
        try {
            if ("speechSynthesis" in window) {
                window.speechSynthesis.cancel();

                const utterance = new SpeechSynthesisUtterance(cleaned);
                utterance.lang = (options?.lang || resultsLanguage) === "en" ? "en-US" : "ar-SA";
                utterance.pitch = 0.82; // Deep masculine tone
                utterance.rate = 1.0;

                const voices = window.speechSynthesis.getVoices();
                const targetLang = utterance.lang.slice(0, 2);
                const maleVoice = voices.find((v) => 
                    v.lang.startsWith(targetLang) && 
                    (v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("tarik") || v.name.toLowerCase().includes("naayf") || v.name.toLowerCase().includes("george") || v.name.toLowerCase().includes("brian"))
                ) || voices.find((v) => v.lang.startsWith(targetLang));

                if (maleVoice) utterance.voice = maleVoice;
                
                requestAnimationFrame(() => {
                    window.speechSynthesis.speak(utterance);
                });
            }
        } catch (e) {
            console.warn("VOICE OS Fallback Speech Error:", e);
        }
    }, [resultsLanguage]);

    return (
        <SettingsContext.Provider
            value={{
                resultsLanguage,
                setResultsLanguage: updateLanguage,
                fdaDrugsEnabled,
                setFdaDrugsEnabled: updateFdaDrugsEnabled,
                requireBiometricOnScan,
                setRequireBiometricOnScan,
                voiceOsEnabled,
                setVoiceOsEnabled,
                speakVoiceOs,
                isAutoDetected,
                resetToAutoDetect,
                detectedCountry,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
};
