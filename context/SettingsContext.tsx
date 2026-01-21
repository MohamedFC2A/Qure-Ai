"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type ResultsLanguage = "en" | "ar";

interface SettingsContextType {
    resultsLanguage: ResultsLanguage;
    setResultsLanguage: (lang: ResultsLanguage) => void;
    fdaDrugsEnabled: boolean;
    setFdaDrugsEnabled: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
    const [resultsLanguage, setResultsLanguage] = useState<ResultsLanguage>("en");
    const [fdaDrugsEnabled, setFdaDrugsEnabled] = useState<boolean>(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const savedLang = localStorage.getItem("qure_results_language") as ResultsLanguage;
        if (savedLang && (savedLang === "en" || savedLang === "ar")) {
            setResultsLanguage(savedLang);
        }

        const savedFda = localStorage.getItem("qure_fda_drugs_enabled");
        if (savedFda === "0" || savedFda === "false") {
            setFdaDrugsEnabled(false);
        } else if (savedFda === "1" || savedFda === "true") {
            setFdaDrugsEnabled(true);
        }
    }, []);

    const updateLanguage = (lang: ResultsLanguage) => {
        setResultsLanguage(lang);
        if (typeof window !== "undefined") {
            localStorage.setItem("qure_results_language", lang);
        }
    };

    const updateFdaDrugsEnabled = (enabled: boolean) => {
        setFdaDrugsEnabled(Boolean(enabled));
        if (typeof window !== "undefined") {
            localStorage.setItem("qure_fda_drugs_enabled", enabled ? "1" : "0");
        }
    };

    // Prevent hydration mismatch by rendering children only after mount, 
    // or render children with default state but acknowledge potential mismatch.
    // However, for language preference that affects initial data fetch, it's safer to just render.
    // If we want to avoid flash of wrong content for UI text, we might wait. 
    // For this specific requirement (API results), immediate render is fine.

    return (
        <SettingsContext.Provider value={{ resultsLanguage, setResultsLanguage: updateLanguage, fdaDrugsEnabled, setFdaDrugsEnabled: updateFdaDrugsEnabled }}>
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
