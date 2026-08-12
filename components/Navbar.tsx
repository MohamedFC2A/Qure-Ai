"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clearAllAuthCookies } from "@/lib/authCookies";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";
import {
    Atom,
    ScanLine,
    User,
    Clock,
    Gem,
    Loader2,
    LogOut,
    Brain,
    Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/context/UserContext";
import { useScan } from "@/context/ScanContext";
import { useSettings } from "@/context/SettingsContext";
import { MobileNav } from "./layout/MobileNav";
import { OnboardingModal } from "@/components/auth/OnboardingModal";

export const Navbar = () => {
    const pathname = usePathname();
    const { user, credits, plan, loading } = useUser();
    const { isScanning, totalDuration } = useScan();
    const { resultsLanguage } = useSettings();
    const supabase = createClient();

    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);
    const isUltra = plan === "ultra";

    const handleSignOut = async () => {
        clearAllAuthCookies();
        if (typeof window !== "undefined") {
            localStorage.removeItem("qurescan_active_care_profile");
        }
        await supabase.auth.signOut();
        window.location.href = "/login";
    };

    const navItems = user
        ? [
              { name: t("Home", "الرئيسية"),   href: "/",                  icon: Atom },
              { name: t("Scan", "فحص الدواء"), href: "/scan",              icon: ScanLine },
              { name: "AOS AI",              href: "/ai",                icon: Brain },
              { name: t("Pricing", "الأسعار"), href: "/pricing",           icon: Gem },
              { name: t("Updates", "التحديثات"), href: "/changelog",       icon: Zap },
              { name: t("History", "السجل"),    href: "/dashboard/history", icon: Clock },
          ]
        : [
              { name: t("Home", "الرئيسية"),   href: "/",        icon: Atom },
              { name: t("Pricing", "الأسعار"), href: "/pricing", icon: Gem },
              { name: t("Updates", "التحديثات"), href: "/changelog", icon: Zap },
          ];

    const creditsDisplay = credits > 10000 ? "∞" : credits ?? 0;

    return (
        <>
            <MobileNav />
            <OnboardingModal />

            <header role="banner" aria-label="Main Navigation Header" className="fixed top-2 sm:top-3.5 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] max-w-7xl">
                <div
                    className={cn(
                        "relative overflow-hidden rounded-2xl px-3.5 py-2 sm:px-5 sm:py-2.5",
                        "flex items-center justify-between gap-3 sm:gap-6",
                        "backdrop-blur-2xl border shadow-2xl transition-all duration-300",
                        "bg-slate-950/92 border-white/[0.08] shadow-black/60"
                    )}
                >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

                    {/* Logo */}
                    <Link
                        href="/"
                        aria-label="QureScan Home"
                        className="flex items-center gap-2 sm:gap-2.5 font-bold text-sm sm:text-base tracking-tight shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-xl"
                    >
                        <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center bg-white/[0.08] border border-white/[0.10] transition-transform active:scale-95">
                            <Atom className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/80" />
                        </div>
                        <span className="text-white font-display tracking-tight flex items-center gap-1.5">
                            <span>Qure</span>
                            <span className="text-slate-400">Scan</span>
                            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-transparent select-none ms-0.5">
                                Beta
                            </span>
                        </span>
                    </Link>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center gap-0.5 lg:gap-1" role="navigation" aria-label="Main Menu">
                        {navItems.map((item) => {
                            const isActive =
                                pathname === item.href ||
                                (item.href !== "/" && pathname.startsWith(`${item.href}`));
                            return (
                                <Link key={item.href} href={item.href} className="shrink-0">
                                    <div
                                        aria-current={isActive ? "page" : undefined}
                                        className={cn(
                                            "relative px-2.5 lg:px-3 py-1.5 rounded-xl text-xs lg:text-sm font-medium transition-all duration-200 whitespace-nowrap",
                                            "flex items-center gap-1.5 cursor-pointer select-none",
                                            isActive
                                                ? "bg-white/[0.08] text-white border border-white/[0.10] font-semibold"
                                                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
                                        )}
                                    >
                                        <item.icon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-white" : "opacity-60")} />
                                        <span>{item.name}</span>
                                        {isActive && (
                                            <span className="w-1 h-1 rounded-full bg-cyan-400 shrink-0" />
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Auth / User section */}
                    <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                        {!loading && user ? (
                            <div className="flex items-center gap-2">

                                {isScanning && (
                                    <Link href="/scan" aria-label="Current Scan Progress" className="shrink-0">
                                        <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-all hover:bg-slate-800 hover:border-white/20 whitespace-nowrap">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-cyan-400" />
                                            <span className="hidden sm:inline">{t("Scanning", "جارٍ الفحص")}</span>
                                            <span className="font-mono tabular-nums">{totalDuration}s</span>
                                        </div>
                                    </Link>
                                )}

                                <Link href="/profile" aria-label={t("Account Credits", "رصيد الحساب")} className="shrink-0">
                                    <div className="flex h-8 items-center gap-2 rounded-xl border border-white/10 bg-slate-900/90 hover:border-white/20 hover:bg-slate-800/90 px-3 transition-all whitespace-nowrap backdrop-blur-md shadow-sm">
                                        <Brain className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                                        <span className="font-mono tabular-nums font-bold text-xs sm:text-sm text-white leading-none">
                                            {creditsDisplay}
                                        </span>
                                        <span className={cn(
                                            "text-[10px] font-black tracking-widest leading-none border-l rtl:border-r rtl:border-l-0 pl-2 rtl:pr-2 rtl:pl-0 uppercase",
                                            isUltra ? "border-slate-700 text-cyan-300" : "border-white/10 text-slate-400 font-medium"
                                        )}>
                                            {isUltra ? "ULTRA" : t("credits", "رصيد")}
                                        </span>
                                    </div>
                                </Link>

                                <Link href="/profile" aria-label={t("User Profile", "الملف الشخصي")} className="shrink-0">
                                    <div className="flex h-8 w-8 rounded-xl items-center justify-center border border-white/[0.10] bg-white/[0.05] overflow-hidden transition-all hover:border-white/[0.20] hover:bg-white/[0.10]">
                                        {user?.user_metadata?.avatar_url ? (
                                            <img
                                                src={user.user_metadata.avatar_url}
                                                alt={user.email || "User Avatar"}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <User className="w-4 h-4 text-slate-300" />
                                        )}
                                    </div>
                                </Link>

                                <button
                                    onClick={handleSignOut}
                                    aria-label={t("Log Out", "تسجيل الخروج")}
                                    title={t("Log Out", "تسجيل الخروج")}
                                    className="hidden sm:flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] transition-all shrink-0"
                                >
                                    <LogOut className="h-3.5 w-3.5 shrink-0" />
                                    <span>{t("Exit", "خروج")}</span>
                                </button>
                            </div>
                        ) : !loading ? (
                            <div className="flex items-center gap-2">
                                <Link href="/login" className="shrink-0">
                                    <Button variant="ghost" size="xs" className="text-slate-300 hover:text-white px-3 text-xs">
                                        {t("Login", "دخول")}
                                    </Button>
                                </Link>
                                <Link href="/signup" className="shrink-0">
                                    <Button variant="primary" size="xs" className="px-4 text-xs font-bold whitespace-nowrap" glow>
                                        {t("Get Started", "ابدأ الآن")}
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="w-20 h-8 skeleton rounded-xl" />
                        )}
                    </div>
                </div>
            </header>
        </>
    );
};
