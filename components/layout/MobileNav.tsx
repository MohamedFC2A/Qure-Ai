"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Clock, Brain, MoreHorizontal } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { MobileHubDrawer } from "./MobileHubDrawer";

export const MobileNav = () => {
    const pathname = usePathname();
    const { resultsLanguage } = useSettings();
    const [isHubOpen, setIsHubOpen] = useState(false);

    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    const navItems = [
        {
            name: t("Home", "الرئيسية"),
            href: "/",
            icon: Home,
        },
        {
            name: "Qure AI",
            href: "/ai",
            icon: Brain,
        },
        {
            name: t("History", "السجل"),
            href: "/dashboard/history",
            icon: Clock,
        },
    ];

    // Hide bottom navigation bar on /ai to allow native one-handed chat dock ergonomics
    if (pathname === "/ai" || pathname.startsWith("/ai/")) {
        return null;
    }

    return (
        <>
            <MobileHubDrawer isOpen={isHubOpen} onClose={() => setIsHubOpen(false)} />

            <nav
                className="fixed bottom-0 left-0 right-0 z-40 md:hidden pb-[env(safe-area-inset-bottom)] pointer-events-none select-none"
                suppressHydrationWarning
                role="navigation"
                aria-label="Mobile Navigation"
            >
                <div className="pointer-events-auto relative px-3 pb-2 pt-1">
                    {/* Background Dock Frame */}
                    <div className="relative rounded-2xl border border-white/[0.09] bg-[#080D1A]/95 backdrop-blur-2xl shadow-2xl overflow-hidden">
                        
                        {/* Subtle top divider line */}
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                        <div className="flex items-center justify-around px-1.5 py-1.5 sm:py-2">
                            
                            {/* Standard Nav Tabs (Larger Icons & Clear Text) */}
                            {navItems.map((item) => {
                                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
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
                                                "p-1.5 rounded-xl transition-all duration-150",
                                                isActive
                                                    ? "bg-white/[0.08] text-cyan-300 border border-white/[0.12] shadow-sm"
                                                    : "text-slate-400 group-hover:text-slate-200"
                                            )}>
                                                <Icon className="w-5 h-5 shrink-0" />
                                            </div>
                                            <span className={cn(
                                                "text-[10px] sm:text-[11px] font-bold tracking-tight leading-none transition-colors",
                                                isActive ? "text-white font-extrabold" : "text-slate-400"
                                            )}>
                                                {item.name}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}

                            {/* More Hub Trigger */}
                            <button
                                type="button"
                                onClick={() => setIsHubOpen(true)}
                                aria-label={t("More options", "المزيد")}
                                className="flex-1 rounded-xl py-1 focus-visible:outline-none"
                            >
                                <div className="flex flex-col items-center gap-1 group">
                                    <div className={cn(
                                        "p-1.5 rounded-xl transition-all duration-150",
                                        isHubOpen
                                            ? "bg-white/[0.08] text-white border border-white/[0.12] shadow-sm"
                                            : "text-slate-400 group-hover:text-slate-200"
                                    )}>
                                        <MoreHorizontal className="w-5 h-5 shrink-0" />
                                    </div>
                                    <span className={cn(
                                        "text-[10px] sm:text-[11px] font-bold tracking-tight leading-none transition-colors",
                                        isHubOpen ? "text-white font-extrabold" : "text-slate-400"
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
