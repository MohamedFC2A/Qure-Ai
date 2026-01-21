"use client";

import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useSettings } from "@/context/SettingsContext";
import { Languages, Globe, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const { resultsLanguage, setResultsLanguage } = useSettings();

    return (
        <main className="min-h-screen pt-24 pb-12 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                        <SettingsIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
                        <p className="text-white/50 text-lg">Customize your Qure Ai experience.</p>
                    </div>
                </div>

                {/* Language Settings */}
                <GlassCard className="p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <Globe className="w-5 h-5 text-cyan-400" />
                                Card Results Language
                            </h2>
                            <p className="text-white/60 max-w-lg">
                                Select the language for AI analysis results. New scans will be generated in this language.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-full border border-white/10">
                            <button
                                onClick={() => setResultsLanguage("en")}
                                className={cn(
                                    "px-6 py-2 rounded-full text-sm font-medium transition-all duration-300",
                                    resultsLanguage === "en"
                                        ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/20"
                                        : "text-white/50 hover:text-white hover:bg-white/5"
                                )}
                            >
                                English
                            </button>
                            <button
                                onClick={() => setResultsLanguage("ar")}
                                className={cn(
                                    "px-6 py-2 rounded-full text-sm font-medium transition-all duration-300",
                                    resultsLanguage === "ar"
                                        ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/20"
                                        : "text-white/50 hover:text-white hover:bg-white/5"
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
