"use client";

import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useSettings } from "@/context/SettingsContext";
import { Languages, Globe, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const { resultsLanguage, setResultsLanguage } = useSettings();
    const isArabic = resultsLanguage === 'ar';
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    return (
        <main className="min-h-screen pt-28 pb-28 md:pb-12 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 rounded-lg bg-cyan-300/10 border border-cyan-300/20 text-cyan-200">
                        <SettingsIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">{t("Settings", "الإعدادات")}</h1>
                        <p className="text-slate-400 text-lg">{t("Customize your Qure Ai experience.", "قم بتخصيص تجربتك مع Qure Ai.")}</p>
                    </div>
                </div>

                {/* Language Settings */}
                <GlassCard className="p-6 sm:p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <Globe className="w-5 h-5 text-cyan-200" />
                                {t("Card Results & App Language", "لغة بطاقة النتائج والتطبيق")}
                            </h2>
                            <p className="text-slate-400 max-w-lg">
                                {t("Select the language for AI analysis results and UI interface.", "اختر لغة نتائج تحليل الذكاء الاصطناعي وواجهة المستخدم.")}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-950/70 p-1.5 rounded-lg border border-white/10">
                            <button
                                onClick={() => setResultsLanguage("en")}
                                className={cn(
                                    "px-6 py-2 rounded-md text-sm font-medium transition-all duration-300",
                                    resultsLanguage === "en"
                                        ? "bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-950/20"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                English
                            </button>
                            <button
                                onClick={() => setResultsLanguage("ar")}
                                className={cn(
                                    "px-6 py-2 rounded-md text-sm font-medium transition-all duration-300",
                                    resultsLanguage === "ar"
                                        ? "bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-950/20"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                العربية (Arabic)
                            </button>
                        </div>
                    </div>
                </GlassCard>

                {/* Future settings placeholders can go here */}

            </div>
        </main>
    );
}
