"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";
import {
    Atom,
    ScanLine,
    LayoutDashboard,
    User,
    Clock,
    Gem,
    Loader2,
    LogOut,
    Brain,
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

    const isAiRoute = pathname === "/ai" || pathname.startsWith("/ai/");

    const handleSignOut = async () => {
        if (process.env.NODE_ENV === "development") {
            document.cookie = "qure_dev_auth=; path=/; max-age=0; samesite=lax";
        }
        await supabase.auth.signOut();
        window.location.href = "/login";
    };

    const navItems = user
        ? [
              { name: t("Home", "الرئيسية"),       href: "/",                   icon: Atom },
              { name: t("Scan", "فحص الدواء"),     href: "/scan",               icon: ScanLine },
              { name: "MATANY AI",                   href: "/ai",                 icon: Brain },
              { name: t("Pricing", "الأسعار"),      href: "/pricing",            icon: Gem },
              { name: t("History", "السجل"),         href: "/dashboard/history",  icon: Clock },
              { name: t("Dashboard", "لوحة التحكم"), href: "/dashboard",          icon: LayoutDashboard },
          ]
        : [
              { name: t("Home", "الرئيسية"),   href: "/",        icon: Atom },
              { name: t("Pricing", "الأسعار"),  href: "/pricing", icon: Gem },
          ];

    return (
        <>
            <MobileNav />
            <OnboardingModal />

            <header className="fixed top-2.5 sm:top-4 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] max-w-6xl">
                <div
                    className={cn(
                        "relative overflow-hidden rounded-2xl px-3.5 py-2 sm:px-5 sm:py-2.5",
                        "flex items-center justify-between gap-2 sm:gap-4",
                        "backdrop-blur-2xl border shadow-2xl transition-all duration-300",
                        isAiRoute
                            ? "bg-slate-950/95 border-amber-400/25 shadow-amber-950/30"
                            : "bg-slate-950/90 border-white/10 shadow-black/60"
                    )}
                >
                    {/* Top subtle accent line */}
                    <div
                        className={cn(
                            "absolute inset-x-0 top-0 h-[1.5px] pointer-events-none",
                            isAiRoute
                                ? "bg-gradient-to-r from-transparent via-amber-400/40 to-transparent"
                                : "bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"
                        )}
                    />

                    {/* ── Logo ── */}
                    <Link
                        href="/"
                        className="flex items-center gap-2.5 font-bold text-sm sm:text-base tracking-tight shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 rounded-xl"
                    >
                        <div
                            className={cn(
                                "relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shadow-lg transition-transform active:scale-95",
                                isAiRoute
                                    ? "nexus-gold-logo shadow-amber-950/40"
                                    : "bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-cyan-950/50"
                            )}
                        >
                            <Atom className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            <div className="absolute inset-0 rounded-xl bg-white/10" />
                            {isAiRoute && <div className="absolute inset-0 rounded-xl nexus-gold-rotate" />}
                        </div>
                        <span className="text-white font-display tracking-tight flex items-center gap-1">
                            <span>Qure</span>
                            <span className={isAiRoute ? "nexus-gold-text" : "text-cyan-400"}>Ai</span>
                        </span>
                        {isAiRoute && (
                            <span className="nexus-gold-badge rounded-[6px] px-1.5 py-0.5 text-[8px] sm:text-[9px] font-black tracking-widest hidden xs:inline-block">
                                AI
                            </span>
                        )}
                    </Link>

                    {/* ── Desktop Navigation Links ── */}
                    <nav className="hidden md:flex flex-1 items-center justify-center gap-1">
                        {navItems.map((item) => {
                            const isActive =
                                pathname === item.href ||
                                (item.href !== "/" && pathname.startsWith(`${item.href}`));
                            return (
                                <Link key={item.href} href={item.href}>
                                    <div
                                        className={cn(
                                            "relative px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200",
                                            "flex items-center gap-2 cursor-pointer select-none",
                                            isActive
                                                ? "bg-cyan-400/15 text-cyan-300 border border-cyan-400/30"
                                                : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                                        )}
                                    >
                                        <item.icon
                                            className={cn(
                                                "w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0",
                                                isActive ? "text-cyan-400" : "opacity-75"
                                            )}
                                        />
                                        <span>{item.name}</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* ── Auth / User Action Area ── */}
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        {!loading && user ? (
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                {/* Scanning Indicator */}
                                {isScanning && (
                                    <Link href="/scan">
                                        <div className="flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-400/20">
                                            <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                                            <span className="hidden sm:inline">{t("Scanning", "فحص")}</span>
                                            <span className="font-mono tabular-nums">{totalDuration}s</span>
                                        </div>
                                    </Link>
                                )}

                                {/* Credits Badge */}
                                <Link href="/profile" aria-label="Open profile">
                                    <div
                                        className={cn(
                                            "flex items-center gap-1.5 rounded-xl border px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold transition-all",
                                            plan === "ultra"
                                                ? "bg-amber-400/10 border-amber-400/30 text-amber-300 hover:bg-amber-400/20"
                                                : "bg-cyan-400/10 border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/20"
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "w-1.5 h-1.5 rounded-full animate-glow-pulse",
                                                plan === "ultra" ? "bg-amber-400" : "bg-cyan-400"
                                            )}
                                        />
                                        <span className="font-mono tabular-nums font-bold">
                                            {credits > 10000 ? "∞" : credits}
                                        </span>
                                        <span className="hidden sm:inline text-[10px] text-slate-400">
                                            {t("cr", "رصيد")}
                                        </span>
                                    </div>
                                </Link>

                                {/* Profile Avatar */}
                                <Link href="/profile" aria-label="Profile">
                                    <div className="flex h-8 w-8 sm:h-9 sm:w-9 rounded-xl items-center justify-center border border-white/10 bg-white/[0.05] overflow-hidden transition-all hover:border-white/25 hover:bg-white/[0.10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50">
                                        {user?.user_metadata?.avatar_url ? (
                                            <img
                                                src={user.user_metadata.avatar_url}
                                                alt={user.email || "User"}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300" />
                                        )}
                                    </div>
                                </Link>

                                {/* Sign Out Button */}
                                <button
                                    onClick={handleSignOut}
                                    title={t("Log Out", "تسجيل الخروج")}
                                    className="hidden sm:flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
                                >
                                    <LogOut className="h-3.5 w-3.5" />
                                    <span>{t("Exit", "خروج")}</span>
                                </button>
                            </div>
                        ) : !loading ? (
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <Link href="/login">
                                    <Button variant="ghost" size="xs" className="text-slate-400 hover:text-white px-2.5 sm:px-3 text-xs">
                                        {t("Login", "دخول")}
                                    </Button>
                                </Link>
                                <Link href="/signup">
                                    <Button variant="primary" size="xs" className="px-3 sm:px-4 text-xs font-bold" glow>
                                        {t("Get Started", "ابدأ الآن")}
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="w-16 sm:w-20 h-7 sm:h-8 skeleton rounded-xl" />
                        )}
                    </div>
                </div>
            </header>
        </>
    );
};
