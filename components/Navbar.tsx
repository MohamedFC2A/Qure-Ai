"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { GlassCard } from "./ui/GlassCard";
import { Button } from "./ui/Button";
import { Atom, ScanLine, LayoutDashboard, User, Clock, Gem, Loader2, LogOut } from "lucide-react";
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

    const isArabic = resultsLanguage === 'ar';
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    const handleSignOut = async () => {
        if (process.env.NODE_ENV === "development") {
            document.cookie = "qure_dev_auth=; path=/; max-age=0; samesite=lax";
        }
        await supabase.auth.signOut();
        // window.location.reload(); // Context will handle null, or forcing reload is safer
        window.location.href = '/login';
    };

    const navItems = user ? [
        { name: t("Home", "الرئيسية"), href: "/", icon: Atom },
        { name: t("Scan", "فحص دواء"), href: "/scan", icon: ScanLine },
        { name: t("Pricing", "الأسعار"), href: "/pricing", icon: Gem },
        { name: t("History", "السجل"), href: "/dashboard/history", icon: Clock },
        { name: t("Dashboard", "لوحة التحكم"), href: "/dashboard", icon: LayoutDashboard },
    ] : [
        { name: t("Home", "الرئيسية"), href: "/", icon: Atom },
        { name: t("Pricing", "الأسعار"), href: "/pricing", icon: Gem },
    ];

    return (
        <>
            <MobileNav />
            <OnboardingModal />

            <header className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-24px)] max-w-6xl">
                <GlassCard className="rounded-xl px-3 py-2.5 sm:px-4 flex items-center justify-between shadow-2xl shadow-black/25 backdrop-blur-2xl bg-slate-950/72 border-white/10" hoverEffect={false}>
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 font-bold text-base sm:text-lg tracking-tight mr-2 sm:mr-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 rounded-lg">
                        <div className="w-9 h-9 rounded-lg bg-cyan-300 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-950/20">
                            <Atom className="w-5 h-5 text-slate-950" />
                        </div>
                        <span className="text-white font-display">
                            Qure Ai
                        </span>
                    </Link>

                    {/* Navigation - Desktop Only */}
                    <nav className="hidden md:flex flex-1 min-w-0 items-center justify-center gap-1 sm:gap-2 px-1 sm:px-0">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link key={item.href} href={item.href}>
                                    <div
                                    className={cn(
                                            "relative px-3.5 py-2 rounded-lg text-sm transition-all duration-300 flex items-center justify-center gap-2",
                                            isActive
                                                ? "bg-cyan-300/10 text-cyan-50 font-semibold ring-1 ring-cyan-300/20"
                                                : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                                        )}
                                    >
                                        {isActive && (
                                            <div className="absolute inset-0 rounded-lg animate-in fade-in zoom-in duration-300" />
                                        )}
                                        <item.icon className={cn("w-4 h-4 relative z-10", isActive ? "text-cyan-300" : "")} />
                                        <span className={cn("relative z-10", isActive ? "text-white" : "")}>
                                            {item.name}
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Auth Buttons */}
                    <div className="flex items-center gap-2 pl-3 sm:pl-4 md:border-l border-white/10 ml-auto md:ml-2">
                        {/* Only show content after we've checked auth state to prevent flickering */}
                        {!loading && user ? (
                            <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                                {/* Enha                                {isScanning && (
                                    <Link href="/scan" className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1.5 text-xs font-semibold text-cyan-100 transition-all hover:bg-cyan-300/15">
                                        <div className="relative">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-300" />
                                            <div className="absolute inset-0 blur-sm bg-cyan-400/40 rounded-full animate-pulse" />
                                        </div>
                                        <span className="hidden xs:inline">{t("Scanning", "جاري الفحص")}</span>
                                        <span className="font-mono tabular-nums">{totalDuration}s</span>
                                    </Link>
                                )}
                                {/* Credits Chip */}
                                <Link href="/profile" aria-label="Open profile">
                                    <div className={cn(
                                        "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                                        plan === 'ultra'
                                            ? "bg-amber-300/10 border-amber-300/25 text-amber-100 hover:bg-amber-300/15"
                                            : "bg-cyan-300/10 border-cyan-300/25 text-cyan-100 hover:bg-cyan-300/15"
                                    )}>
                                        <span className={cn("w-1.5 h-1.5 rounded-full", plan === 'ultra' ? "bg-amber-400" : "bg-cyan-400")} />
                                        {credits} {t("Credits", "رصيد")}
                                    </div>
                                </Link>
 
                                <Link href="/profile">
                                    <Button variant="ghost" size="sm" className="hidden sm:flex h-9 w-9 p-0 items-center justify-center border border-white/10 bg-white/[0.04] overflow-hidden">
                                        {user?.user_metadata?.avatar_url ? (
                                            <img
                                                src={user.user_metadata.avatar_url}
                                                alt={user.email || "User"}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <User className="w-4 h-4" />
                                        )}
                                    </Button>
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSignOut}
                                    className="text-red-200 hover:text-red-100 hover:bg-red-500/10 px-3 sm:px-4 hidden sm:flex gap-2"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span className="hidden sm:inline">{t("Sign Out", "تسجيل الخروج")}</span>
                                </Button>
                            </div>
                        ) : !loading && (
                            <div className="hidden sm:flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                                <Link href="/login">
                                    <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">{t("Login", "تسجيل الدخول")}</Button>
                                </Link>
                                <Link href="/signup">
                                    <Button variant="primary" size="sm" className="px-5 font-semibold">
                                        {t("Get Started", "ابدأ الآن")}
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </GlassCard>
            </header>
        </>
    );
};
