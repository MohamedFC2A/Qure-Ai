"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Atom, ScanLine, Clock, Gem, LogIn, UserPlus, Brain, LayoutDashboard } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useSettings } from "@/context/SettingsContext";

export const MobileNav = () => {
    const pathname = usePathname();
    const { user } = useUser();
    const { resultsLanguage } = useSettings();

    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    const isAiRoute = pathname === "/ai" || pathname.startsWith("/ai/");

    const navItems = user
        ? [
              { name: t("Home", "الرئيسية"),        href: "/",                  icon: Atom,            color: "cyan"    },
              { name: t("Scan", "الفحص"),            href: "/scan",              icon: ScanLine,        color: "emerald" },
              { name: "NEXUS AI",                    href: "/ai",                icon: Brain,           color: "violet"  },
              { name: t("History", "السجل"),         href: "/dashboard/history", icon: Clock,           color: "violet"  },
              { name: t("Dashboard", "لوحة التحكم"), href: "/dashboard",         icon: LayoutDashboard, color: "cyan"    },
          ]
        : [
              { name: t("Home", "الرئيسية"),    href: "/",        icon: Atom,     color: "cyan"  },
              { name: t("Plans", "الباقات"),    href: "/pricing", icon: Gem,      color: "amber" },
              { name: t("Login", "الدخول"),     href: "/login",   icon: LogIn,    color: "cyan"  },
              { name: t("Sign Up", "التسجيل"), href: "/signup",  icon: UserPlus, color: "violet" },
          ];

    const dotColorMap: Record<string, string> = {
        cyan:    "bg-cyan-400",
        emerald: "bg-emerald-400",
        amber:   "bg-amber-400",
        violet:  "bg-violet-400",
    };

    const activeBgMap: Record<string, string> = {
        cyan:    "bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-400/30",
        emerald: "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30",
        amber:   "bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/30",
        violet:  "bg-violet-400/15 text-violet-300 ring-1 ring-violet-400/30",
    };

    const activeLabelMap: Record<string, string> = {
        cyan:    "text-cyan-300 font-bold",
        emerald: "text-emerald-300 font-bold",
        amber:   "text-amber-300 font-bold",
        violet:  "text-violet-300 font-bold",
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-[env(safe-area-inset-bottom)] pointer-events-none">
            <div className="pointer-events-auto relative">
                {/* Frosted Glass background */}
                <div
                    className="absolute inset-0 border-t border-white/[0.08]"
                    style={{
                        background: isAiRoute ? "rgba(8, 7, 4, 0.96)" : "rgba(5, 7, 10, 0.94)",
                        boxShadow: "0 -16px 40px rgba(0,0,0,0.7)",
                        backdropFilter: "blur(24px) saturate(160%)",
                        WebkitBackdropFilter: "blur(24px) saturate(160%)",
                    }}
                />

                {/* Top shimmer accent line */}
                <div
                    className={cn(
                        "absolute inset-x-0 top-0 h-px",
                        isAiRoute
                            ? "bg-gradient-to-r from-transparent via-amber-400/40 to-transparent"
                            : "bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"
                    )}
                />

                <div className="relative flex items-center justify-around px-1.5 py-1.5 sm:py-2">
                    {navItems.map((item) => {
                        const isActive =
                            pathname === item.href ||
                            (item.href !== "/" && pathname.startsWith(`${item.href}/`));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-label={item.name}
                                aria-current={isActive ? "page" : undefined}
                                className="flex-1 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 py-1"
                            >
                                <div className="flex flex-col items-center gap-0.5 group">
                                    {/* Icon badge container */}
                                    <div
                                        className={cn(
                                            "relative p-1.5 sm:p-2 rounded-xl transition-all duration-200",
                                            isActive
                                                ? activeBgMap[item.color] || activeBgMap.cyan
                                                : "text-slate-400 group-hover:text-slate-200 hover:bg-white/[0.04]"
                                        )}
                                    >
                                        <item.icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                                        {/* Active glowing dot */}
                                        {isActive && (
                                            <span
                                                className={cn(
                                                    "absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full",
                                                    dotColorMap[item.color] || "bg-cyan-400"
                                                )}
                                            />
                                        )}
                                    </div>

                                    {/* Label */}
                                    <span
                                        className={cn(
                                            "text-[10px] sm:text-[11px] tracking-tight leading-none transition-colors",
                                            isActive
                                                ? activeLabelMap[item.color] || "text-cyan-300 font-bold"
                                                : "text-slate-500 group-hover:text-slate-300"
                                        )}
                                    >
                                        {item.name}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
