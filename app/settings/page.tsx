"use client";

import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useSettings } from "@/context/SettingsContext";
import { Globe, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const { resultsLanguage, setResultsLanguage } = useSettings();
    const isArabic = resultsLanguage === 'ar';
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    return (
        <main className="min-h-screen pt-24 sm:pt-28 pb-24 md:pb-14 px-3 sm:px-6">
            <div className="clinical-page space-y-6 sm:space-y-8">

                {/* Header */}
                <div className="flex items-center gap-3.5 mb-6">
                    <div className="icon-badge icon-badge-cyan w-12 h-12 rounded-2xl shrink-0">
                        <SettingsIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{t("Settings", "الإعدادات")}</h1>
                        <p className="text-slate-400 text-xs sm:text-sm mt-0.5">{t("Customize your QureScan experience.", "قم بتخصيص تجربتك مع QureScan.")}</p>
                    </div>
                </div>

                {/* Language Settings */}
                <GlassCard className="p-6 sm:p-8" hoverEffect={false}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1.5">
                            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                                <Globe className="w-5 h-5 text-cyan-400" />
                                <span>{t("Card Results & App Language", "لغة بطاقة النتائج والتطبيق")}</span>
                            </h2>
                            <p className="text-slate-400 text-xs sm:text-sm max-w-lg leading-relaxed">
                                {t("Select the language for AI analysis results and UI interface.", "اختر لغة نتائج تحليل الذكاء الاصطناعي وواجهة المستخدم.")}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-white/10 shrink-0">
                            <button
                                onClick={() => setResultsLanguage("en")}
                                className={cn(
                                    "px-5 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200",
                                    resultsLanguage === "en"
                                        ? "bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 font-bold"
                                        : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                                )}
                            >
                                {t("English", "الإنجليزية")}
                            </button>
                            <button
                                onClick={() => setResultsLanguage("ar")}
                                className={cn(
                                    "px-5 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200",
                                    resultsLanguage === "ar"
                                        ? "bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 font-bold"
                                        : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                                )}
                            >
                                {t("العربية (Arabic)", "العربية")}
                            </button>
                        </div>
                    </div>
                </GlassCard>

            </div>
        </main>
    );
}
