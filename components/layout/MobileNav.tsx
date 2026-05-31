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

    const isArabic = resultsLanguage === 'ar';
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    const navItems = user
        ? [
            { name: t("Home", "الرئيسية"), href: "/", icon: Atom },
            { name: t("Scan", "الفحص"), href: "/scan", icon: ScanLine },
            { name: t("History", "السجل"), href: "/dashboard/history", icon: Clock },
            { name: t("Plans", "الباقات"), href: "/pricing", icon: Gem },
            { name: t("Profile", "الحساب"), href: "/profile", icon: User },
        ]
        : [
            { name: t("Home", "الرئيسية"), href: "/", icon: Atom },
            { name: t("Plans", "الباقات"), href: "/pricing", icon: Gem },
            { name: t("Login", "الدخول"), href: "/login", icon: LogIn },
            { name: t("Sign Up", "التسجيل"), href: "/signup", icon: UserPlus },
        ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-[env(safe-area-inset-bottom)]">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl border-t border-white/10 shadow-[0_-18px_40px_rgba(0,0,0,0.45)]" />

            <div className="relative flex items-center justify-around px-2.5 py-3">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-label={item.name}
                            aria-current={isActive ? "page" : undefined}
                            className="flex-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                        >
                            <div className="flex flex-col items-center gap-1.5 group">
                                <div className={cn(
                                    "p-2 rounded-lg transition-all duration-300",
                                    isActive
                                        ? "bg-cyan-300/10 text-cyan-200 ring-1 ring-cyan-300/20"
                                        : "text-slate-500 group-hover:text-slate-200"
                                )}>
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <span className={cn(
                                    "text-[10px] font-semibold tracking-wide transition-colors leading-none",
                                    isActive ? "text-cyan-100" : "text-slate-500"
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
