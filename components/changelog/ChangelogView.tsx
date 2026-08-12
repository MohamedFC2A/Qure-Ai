"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/SettingsContext";
import { Sparkles, GitCommit, CheckCircle2, ShieldAlert, Zap, Search, ArrowRight, Tag, Calendar, Layers } from "lucide-react";
import Link from "next/link";

export interface ChangelogChange {
    type: "feat" | "fix" | "style" | "perf";
    categoryEn: string;
    categoryAr: string;
    itemsEn: string[];
    itemsAr: string[];
}

export interface ChangelogRelease {
    version: string;
    titleEn: string;
    titleAr: string;
    date: string;
    badge?: string;
    changes: ChangelogChange[];
}

export function ChangelogView() {
    const { resultsLanguage } = useSettings();
    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    const [releases, setReleases] = useState<ChangelogRelease[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetch("/api/changelog")
            .then((res) => res.json())
            .then((data) => {
                setReleases(data.releases || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const filteredReleases = releases.filter((r) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const matchesVer = r.version.toLowerCase().includes(q);
        const matchesTitle = r.titleEn.toLowerCase().includes(q) || r.titleAr.toLowerCase().includes(q);
        const matchesItem = r.changes.some((c) =>
            c.itemsEn.some((i) => i.toLowerCase().includes(q)) ||
            c.itemsAr.some((i) => i.toLowerCase().includes(q))
        );
        return matchesVer || matchesTitle || matchesItem;
    });

    return (
        <main className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto select-none" dir={isArabic ? "rtl" : "ltr"}>
            
            {/* ── HEADER ── */}
            <div className="text-center space-y-4 mb-12">
                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                    {isArabic ? (
                        <>
                            سجل التحديثات والإصدارات{" "}
                            <span className="bg-gradient-to-r from-cyan-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
                                التلقائي
                            </span>
                        </>
                    ) : (
                        <>
                            Product{" "}
                            <span className="bg-gradient-to-r from-cyan-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
                                Changelog & Updates
                            </span>
                        </>
                    )}
                </h1>

                <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
                    {t(
                        "Real-time platform release notes and intelligent feature updates summarized by Aura-OS Ai (AOS AI).",
                        "سجل الإصدارات والتحسينات المباشرة للمنصة الموثق والملخص بواسطة الذكاء الاصطناعي Aura-OS Ai (AOS AI)."
                    )}
                </p>

                {/* Search Bar */}
                <div className="pt-4 max-w-md mx-auto relative">
                    <Search className={cn("w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2", isArabic ? "right-3.5" : "left-3.5")} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t("Search updates, versions, features…", "البحث في التحديثات والإصدارات…")}
                        className={cn(
                            "w-full rounded-2xl border border-white/10 bg-white/[0.03] py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-cyan-400/40 focus:bg-white/[0.06]",
                            isArabic ? "pr-10 pl-4" : "pl-10 pr-4"
                        )}
                    />
                </div>
            </div>

            {/* ── SKELETON LOADING ── */}
            {loading && (
                <div className="space-y-6 max-w-3xl mx-auto">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-36 skeleton rounded-3xl" />
                    ))}
                </div>
            )}

            {/* ── TIMELINE CONTAINER ── */}
            {!loading && (
                <div className="relative max-w-3xl mx-auto space-y-10">
                    
                    {/* Vertical timeline line */}
                    <div className={cn(
                        "absolute top-4 bottom-4 w-0.5 bg-gradient-to-b from-cyan-400/30 via-white/10 to-transparent pointer-events-none hidden sm:block",
                        isArabic ? "right-6" : "left-6"
                    )} />

                    {filteredReleases.map((release, idx) => (
                        <motion.div
                            key={release.version || idx}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.08 }}
                            className={cn(
                                "relative flex flex-col sm:flex-row gap-6 items-start group"
                            )}
                        >
                            {/* Version Node Dot */}
                            <div className={cn(
                                "hidden sm:flex w-12 h-12 rounded-2xl items-center justify-center shrink-0 z-10 border transition-transform duration-300 group-hover:scale-110",
                                idx === 0
                                    ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-lg shadow-cyan-950/40"
                                    : "bg-white/[0.06] border-white/10 text-slate-400"
                            )}>
                                <GitCommit className="w-5 h-5" />
                            </div>

                            {/* Release Card */}
                            <div className="flex-1 w-full rounded-3xl border border-white/[0.08] bg-slate-950/70 p-6 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:border-white/20">
                                
                                {/* Top metadata row */}
                                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-white/[0.06]">
                                    <div className="flex items-center gap-2.5">
                                        <span className="px-3 py-1 rounded-xl text-xs font-black bg-cyan-400/10 border border-cyan-400/25 text-cyan-300 font-mono tracking-tight">
                                            {release.version}
                                        </span>

                                        {release.badge && (
                                            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-white/[0.06] border border-white/10 text-slate-300">
                                                {release.badge}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>{release.date}</span>
                                    </div>
                                </div>

                                {/* Release Title */}
                                <h3 className="text-lg sm:text-xl font-bold text-white mb-4">
                                    {isArabic ? release.titleAr : release.titleEn}
                                </h3>

                                {/* Changes list */}
                                <div className="space-y-4">
                                    {release.changes.map((change, cIdx) => (
                                        <div key={cIdx} className="space-y-2">
                                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                {change.type === "feat" ? (
                                                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                                                ) : (
                                                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                                                )}
                                                {isArabic ? change.categoryAr : change.categoryEn}
                                            </span>

                                            <ul className="space-y-2">
                                                {(isArabic ? change.itemsAr : change.itemsEn).map((item, iIdx) => (
                                                    <li key={iIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/60 mt-2 shrink-0" />
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {filteredReleases.length === 0 && (
                        <div className="text-center py-12 border border-dashed border-white/10 rounded-3xl p-8">
                            <p className="text-sm text-slate-400">
                                {t("No updates found matching your search.", "لم يتم العثور على تحديثات تطابق البحث.")}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}
