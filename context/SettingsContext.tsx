"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type ResultsLanguage = "en" | "ar";

interface SettingsContextType {
    resultsLanguage: ResultsLanguage;
    setResultsLanguage: (lang: ResultsLanguage) => void;
    fdaDrugsEnabled: boolean;
    setFdaDrugsEnabled: (enabled: boolean) => void;
    requireBiometricOnScan: boolean;
    setRequireBiometricOnScan: (enabled: boolean) => void;
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

function detectDeviceAndLocationLanguage(): ResultsLanguage {
    if (typeof window === "undefined") return "ar";

    // 1. Check Device / Mobile Language (navigator.languages & navigator.language)
    const browserLangs = Array.from(navigator.languages || [navigator.language || ""]);
    for (const lang of browserLangs) {
        if (lang && String(lang).toLowerCase().startsWith("ar")) {
            return "ar";
        }
    }

    // 2. Check Device TimeZone Location
    try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone.toLowerCase();
        for (const tz of ARAB_TIMEZONES) {
            if (timeZone.includes(tz)) {
                return "ar";
            }
        }
    } catch {
        // fallback
    }

    // 3. Fallback to English only if browser explicitly requests English
    if (navigator.language && navigator.language.toLowerCase().startsWith("en")) {
        return "en";
    }

    return "ar"; // Default target audience: Arabic
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
    const [resultsLanguage, setResultsLanguage] = useState<ResultsLanguage>("ar");
    const [fdaDrugsEnabled, setFdaDrugsEnabled] = useState<boolean>(true);
    const [requireBiometricOnScan, setRequireBiometricOnScanState] = useState<boolean>(false);
    const [isAutoDetected, setIsAutoDetected] = useState<boolean>(true);
    const [detectedCountry, setDetectedCountry] = useState<string | null>(null);

    useEffect(() => {
        const savedLang = localStorage.getItem("qurescan_results_language") as ResultsLanguage;
        if (savedLang && (savedLang === "en" || savedLang === "ar")) {
            setResultsLanguage(savedLang);
            setIsAutoDetected(false);
        } else {
            // Auto detect from mobile device + timezone
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

        // Optional: Fast Client GeoIP Check in background
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
            .catch(() => {
                // best effort
            });
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

    return (
        <SettingsContext.Provider
            value={{
                resultsLanguage,
                setResultsLanguage: updateLanguage,
                fdaDrugsEnabled,
                setFdaDrugsEnabled: updateFdaDrugsEnabled,
                requireBiometricOnScan,
                setRequireBiometricOnScan,
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
