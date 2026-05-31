"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Atom, ScanLine, User, Clock, Gem, LogIn, UserPlus } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useSettings } from "@/context/SettingsContext";

export const MobileNav = () => {
    const pathname = usePathname();
    const { user } = useUser();
    const { resultsLanguage } = useSettings();

    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    const navItems = user
        ? [
              { name: t("Home", "الرئيسية"),  href: "/",                  icon: Atom,    color: "cyan"    },
              { name: t("Scan", "الفحص"),      href: "/scan",              icon: ScanLine, color: "emerald" },
              { name: t("History", "السجل"),   href: "/dashboard/history", icon: Clock,   color: "violet"  },
              { name: t("Plans", "الباقات"),   href: "/pricing",           icon: Gem,     color: "amber"   },
              { name: t("Profile", "الحساب"),  href: "/profile",           icon: User,    color: "cyan"    },
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
        cyan:    "bg-cyan-400/12 text-cyan-300 ring-1 ring-cyan-400/20",
        emerald: "bg-emerald-400/12 text-emerald-300 ring-1 ring-emerald-400/20",
        amber:   "bg-amber-400/12 text-amber-300 ring-1 ring-amber-400/20",
        violet:  "bg-violet-400/12 text-violet-300 ring-1 ring-violet-400/20",
    };

    const activeLabelMap: Record<string, string> = {
        cyan:    "text-cyan-300",
        emerald: "text-emerald-300",
        amber:   "text-amber-300",
        violet:  "text-violet-300",
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-[env(safe-area-inset-bottom)]">
            {/* Glass background */}
            <div
                className="absolute inset-0 border-t"
                style={{
                    background: "rgba(5, 7, 10, 0.94)",
                    borderColor: "rgba(255,255,255,0.08)",
                    boxShadow: "0 -20px 50px rgba(0,0,0,0.6)",
                    backdropFilter: "blur(24px) saturate(160%)",
                    WebkitBackdropFilter: "blur(24px) saturate(160%)",
                }}
            />

            {/* Top shimmer line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className={cn(
                "relative flex items-center justify-around px-2 py-2.5",
                isArabic ? "flex-row-reverse" : ""
            )}>
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
                            className="flex-1 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
                        >
                            <div className="flex flex-col items-center gap-1 group">
                                {/* Icon container */}
                                <div className={cn(
                                    "relative p-2.5 rounded-xl transition-all duration-250",
                                    isActive
                                        ? activeBgMap[item.color] || activeBgMap["cyan"]
                                        : "text-slate-500 group-hover:text-slate-300"
                                )}>
                                    <item.icon className="w-5 h-5" />
                                    {/* Active dot */}
                                    {isActive && (
                                        <span className={cn(
                                            "absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full",
                                            dotColorMap[item.color] || "bg-cyan-400"
                                        )} />
                                    )}
                                </div>

                                {/* Label */}
                                <span className={cn(
                                    "text-[9px] font-semibold tracking-wide leading-none transition-colors",
                                    isActive
                                        ? activeLabelMap[item.color] || "text-cyan-300"
                                        : "text-slate-600"
                                )}>
                                    {item.name}
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};
