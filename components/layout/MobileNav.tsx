"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Atom, ScanLine, Clock, Brain, MoreHorizontal, Sparkles } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useSettings } from "@/context/SettingsContext";
import { MobileHubDrawer } from "./MobileHubDrawer";

export const MobileNav = () => {
    const pathname = usePathname();
    const { user } = useUser();
    const { resultsLanguage } = useSettings();
    const [isHubOpen, setIsHubOpen] = useState(false);

    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    const navItems = [
        {
            name: t("Home", "الرئيسية"),
            href: "/",
            icon: Atom,
        },
        {
            name: "AOS AI",
            href: "/ai",
            icon: Brain,
        },
        {
            name: t("Scan", "فحص"),
            href: "/scan",
            icon: ScanLine,
            isCenter: true,
        },
        {
            name: t("History", "السجل"),
            href: "/dashboard/history",
            icon: Clock,
        },
    ];

    return (
        <>
            <MobileHubDrawer isOpen={isHubOpen} onClose={() => setIsHubOpen(false)} />

            <nav
                className="fixed bottom-0 left-0 right-0 z-40 md:hidden pb-[env(safe-area-inset-bottom)] pointer-events-none"
                suppressHydrationWarning
                role="navigation"
                aria-label="Mobile Navigation"
            >
                <div className="pointer-events-auto relative px-3 pb-2 pt-1">
                    {/* Background Dock Frame */}
                    <div className="relative rounded-2xl border border-white/10 bg-slate-950/92 backdrop-blur-2xl shadow-2xl overflow-hidden">
                        
                        {/* Top accent divider */}
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                        <div className="flex items-center justify-around px-1 py-1.5 sm:py-2">
                            
                            {/* Tab 1: Home */}
                            {(() => {
                                const item = navItems[0];
                                const isActive = pathname === item.href;
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        aria-label={item.name}
                                        aria-current={isActive ? "page" : undefined}
                                        className="flex-1 rounded-xl py-1 focus-visible:outline-none"
                                    >
                                        <div className="flex flex-col items-center gap-1 group">
                                            <div className={cn(
                                                "p-1.5 rounded-xl transition-all duration-150 relative",
                                                isActive ? "bg-slate-800 text-cyan-300 border border-slate-700" : "text-slate-400 group-hover:text-slate-200"
                                            )}>
                                                <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                                            </div>
                                            <span className={cn(
                                                "text-[10px] font-bold tracking-tight leading-none transition-colors",
                                                isActive ? "text-white" : "text-slate-400"
                                            )}>
                                                {item.name}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })()}

                            {/* Tab 2: AOS AI */}
                            {(() => {
                                const item = navItems[1];
                                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        aria-label={item.name}
                                        aria-current={isActive ? "page" : undefined}
                                        className="flex-1 rounded-xl py-1 focus-visible:outline-none"
                                    >
                                        <div className="flex flex-col items-center gap-1 group">
                                            <div className={cn(
                                                "p-1.5 rounded-xl transition-all duration-150 relative",
                                                isActive ? "bg-slate-800 text-cyan-300 border border-slate-700" : "text-slate-400 group-hover:text-slate-200"
                                            )}>
                                                <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                                            </div>
                                            <span className={cn(
                                                "text-[10px] font-bold tracking-tight leading-none transition-colors",
                                                isActive ? "text-white" : "text-slate-400"
                                            )}>
                                                {item.name}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })()}

                            {/* Center Action: Scan Button */}
                            {(() => {
                                const item = navItems[2];
                                const isActive = pathname === item.href;
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        aria-label={item.name}
                                        aria-current={isActive ? "page" : undefined}
                                        className="flex-1 flex justify-center -mt-3 focus-visible:outline-none"
                                    >
                                        <div className="flex flex-col items-center gap-0.5 group">
                                            <div className={cn(
                                                "w-11 h-11 rounded-2xl flex items-center justify-center border shadow-md active:scale-95 transition-all duration-150",
                                                isActive
                                                    ? "bg-cyan-600 border-cyan-400 text-white"
                                                    : "bg-slate-800 border-slate-700 text-cyan-400 hover:border-white/30"
                                            )}>
                                                <Icon className="w-5 h-5 shrink-0" />
                                            </div>
                                            <span className="text-[10px] font-extrabold text-white tracking-tight">
                                                {item.name}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })()}

                            {/* Tab 4: History */}
                            {(() => {
                                const item = navItems[3];
                                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        aria-label={item.name}
                                        aria-current={isActive ? "page" : undefined}
                                        className="flex-1 rounded-xl py-1 focus-visible:outline-none"
                                    >
                                        <div className="flex flex-col items-center gap-1 group">
                                            <div className={cn(
                                                "p-1.5 rounded-xl transition-all duration-150 relative",
                                                isActive ? "bg-slate-800 text-cyan-300 border border-slate-700" : "text-slate-400 group-hover:text-slate-200"
                                            )}>
                                                <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                                            </div>
                                            <span className={cn(
                                                "text-[10px] font-bold tracking-tight leading-none transition-colors",
                                                isActive ? "text-white" : "text-slate-400"
                                            )}>
                                                {item.name}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })()}

                            {/* Tab 5: More Hub Trigger */}
                            <button
                                type="button"
                                onClick={() => setIsHubOpen(true)}
                                aria-label={t("More options", "المزيد")}
                                className="flex-1 rounded-xl py-1 focus-visible:outline-none"
                            >
                                <div className="flex flex-col items-center gap-1 group">
                                    <div className={cn(
                                        "p-1.5 rounded-xl transition-all duration-150 relative",
                                        isHubOpen ? "bg-slate-800 text-white border border-slate-700" : "text-slate-400 group-hover:text-slate-200"
                                    )}>
                                        <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 border-2 border-slate-950" />
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-bold tracking-tight leading-none transition-colors",
                                        isHubOpen ? "text-white" : "text-slate-400"
                                    )}>
                                        {t("More", "المزيد")}
                                    </span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
};
