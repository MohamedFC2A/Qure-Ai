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

    const navItems = user
        ? [
              { name: t("Home", "الرئيسية"), href: "/",                  icon: Atom },
              { name: t("Scan", "الفحص"),    href: "/scan",              icon: ScanLine },
              { name: "AOS AI",               href: "/ai",                icon: Brain },
              { name: t("History", "السجل"), href: "/dashboard/history", icon: Clock },
              // { name: t("Dashboard", "لوحة التحكم"), href: "/dashboard", icon: LayoutDashboard }, // TODO: unhide
          ]
        : [
              { name: t("Home", "الرئيسية"),    href: "/",        icon: Atom },
              { name: t("Plans", "الباقات"),    href: "/pricing", icon: Gem },
              { name: t("Login", "الدخول"),     href: "/login",   icon: LogIn },
              { name: t("Sign Up", "التسجيل"), href: "/signup",  icon: UserPlus },
          ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-[env(safe-area-inset-bottom)] pointer-events-none" suppressHydrationWarning>
            <div className="pointer-events-auto relative">
                {/* Background */}
                <div
                    className="absolute inset-0 border-t border-white/[0.07]"
                    style={{
                        background: "rgba(5, 7, 12, 0.96)",
                        boxShadow: "0 -8px 32px rgba(0,0,0,0.6)",
                        backdropFilter: "blur(24px) saturate(140%)",
                        WebkitBackdropFilter: "blur(24px) saturate(140%)",
                    }}
                />

                {/* Top accent line — subtle, neutral */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

                <div className="relative flex items-center justify-around px-2 py-1.5 sm:py-2">
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
                                className="flex-1 rounded-xl focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 py-1"
                            >
                                <div className="flex flex-col items-center gap-1 group">
                                    {/* Icon */}
                                    <div
                                        className={cn(
                                            "relative p-2 rounded-xl transition-all duration-200",
                                            isActive
                                                ? "bg-white/[0.10] text-white"
                                                : "text-slate-600 group-hover:text-slate-400 hover:bg-white/[0.04]"
                                        )}
                                    >
                                        <item.icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                                        {/* Active indicator */}
                                        {isActive && (
                                            <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/50" />
                                        )}
                                    </div>

                                    {/* Label */}
                                    <span
                                        className={cn(
                                            "text-[9px] sm:text-[10px] tracking-tight leading-none font-medium transition-colors",
                                            isActive ? "text-white" : "text-slate-600 group-hover:text-slate-400"
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
