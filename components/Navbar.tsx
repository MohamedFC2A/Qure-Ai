"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";
import {
    Atom, ScanLine, LayoutDashboard, User, Clock,
    Gem, Loader2, LogOut, ChevronDown, Brain,
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

    const handleSignOut = async () => {
        if (process.env.NODE_ENV === "development") {
            document.cookie = "qure_dev_auth=; path=/; max-age=0; samesite=lax";
        }
        await supabase.auth.signOut();
        window.location.href = "/login";
    };

    const navItems = user
        ? [
              { name: t("Home", "الرئيسية"),       href: "/",                   icon: Atom,           color: "cyan"    },
              { name: t("Scan", "فحص دواء"),        href: "/scan",               icon: ScanLine,       color: "emerald" },
              { name: "NEXUS AI",                    href: "/ai",                 icon: Brain,          color: "violet"  },
              { name: t("Pricing", "الأسعار"),      href: "/pricing",            icon: Gem,            color: "amber"   },
              { name: t("History", "السجل"),         href: "/dashboard/history",  icon: Clock,          color: "violet"  },
              { name: t("Dashboard", "لوحة التحكم"), href: "/dashboard",          icon: LayoutDashboard, color: "cyan"   },
          ]
        : [
              { name: t("Home", "الرئيسية"),  href: "/",        icon: Atom,  color: "cyan"  },
              { name: t("Pricing", "الأسعار"), href: "/pricing", icon: Gem,  color: "amber" },
          ];

    const activeColorMap: Record<string, string> = {
        cyan:    "bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/25",
        emerald: "bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/25",
        amber:   "bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/25",
        violet:  "bg-violet-400/10 text-violet-300 ring-1 ring-violet-400/25",
    };

    const activeIconColorMap: Record<string, string> = {
        cyan:    "text-cyan-400",
        emerald: "text-emerald-400",
        amber:   "text-amber-400",
        violet:  "text-violet-400",
    };

    return (
        <>
            <MobileNav />
            <OnboardingModal />

            <header className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-16px)] max-w-6xl">
                <div
                    className={cn(
                        "relative overflow-hidden rounded-2xl px-3 py-2.5 sm:px-4",
                        "flex items-center justify-between gap-2",
                        "backdrop-blur-2xl border shadow-2xl",
                        "transition-all duration-500",
                    )}
                    style={{
                        background: (pathname === "/ai" || pathname.startsWith("/ai/")) ? "rgba(12,10,5,0.92)" : "rgba(6, 9, 14, 0.88)",
                        borderColor: (pathname === "/ai" || pathname.startsWith("/ai/")) ? "rgba(217,170,75,0.25)" : "rgba(255,255,255,0.08)",
                        boxShadow: (pathname === "/ai" || pathname.startsWith("/ai/"))
                            ? "0 0 0 0.5px rgba(217,170,75,0.15) inset, 0 24px 60px rgba(0,0,0,0.55), 0 0 40px rgba(217,170,75,0.06)"
                            : "0 0 0 0.5px rgba(255,255,255,0.05) inset, 0 24px 60px rgba(0,0,0,0.55)",
                    }}
                >
                    {/* Top shimmer */}
                    <div className={cn(
                        "absolute inset-x-0 top-0 h-px pointer-events-none",
                        (pathname === "/ai" || pathname.startsWith("/ai/"))
                            ? "bg-gradient-to-r from-transparent via-amber-400/30 to-transparent"
                            : "bg-gradient-to-r from-transparent via-white/12 to-transparent"
                    )} />

                    {/* ── Logo ── */}
                    <Link
                        href="/"
                        className={cn(
                            "flex items-center gap-2.5 font-bold text-base tracking-tight shrink-0",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 rounded-xl",
                            isArabic ? "flex-row-reverse" : ""
                        )}
                    >
                        <div className={cn(
                            "relative w-9 h-9 rounded-xl flex items-center justify-center shadow-lg",
                            (pathname === "/ai" || pathname.startsWith("/ai/"))
                                ? "nexus-gold-logo shadow-amber-950/40"
                                : "bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-cyan-950/40"
                        )}>
                            <Atom className="w-5 h-5 text-white" />
                            <div className="absolute inset-0 rounded-xl bg-white/10" />
                            {(pathname === "/ai" || pathname.startsWith("/ai/")) && (
                                <div className="absolute inset-0 rounded-xl nexus-gold-rotate" />
                            )}
                        </div>
                        <span className="text-white font-display tracking-tight">
                            Qure{" "}
                            <span className={(pathname === "/ai" || pathname.startsWith("/ai/")) ? "nexus-gold-text" : "text-cyan-400"}>
                                Ai
                            </span>
                        </span>
                        {(pathname === "/ai" || pathname.startsWith("/ai/")) && (
                            <span className="nexus-gold-badge rounded-[6px] px-1.5 py-0.5 text-[9px] font-black tracking-widest">
                                AI
                            </span>
                        )}
                    </Link>

                    {/* ── Desktop Navigation ── */}
                    <nav className={cn(
                        "hidden md:flex flex-1 items-center justify-center gap-0.5",
                        isArabic ? "flex-row-reverse" : ""
                    )}>
                        {navItems.map((item) => {
                            const isActive = pathname === item.href ||
                                (item.href !== "/" && pathname.startsWith(`${item.href}`));
                            return (
                                <Link key={item.href} href={item.href}>
                                    <div className={cn(
                                        "relative px-3.5 py-2 rounded-xl text-sm transition-all duration-200",
                                        "flex items-center gap-2 cursor-pointer select-none",
                                        isActive
                                            ? activeColorMap[item.color] || activeColorMap["cyan"]
                                            : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                                    )}>
                                        <item.icon className={cn(
                                            "w-4 h-4 shrink-0",
                                            isActive
                                                ? activeIconColorMap[item.color] || "text-cyan-400"
                                                : "opacity-70"
                                        )} />
                                        <span className="font-medium">{item.name}</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* ── Auth Area ── */}
                    <div className={cn(
                        "flex items-center gap-2 shrink-0",
                        isArabic ? "flex-row-reverse" : ""
                    )}>
                        {!loading && user ? (
                            <div className={cn(
                                "flex items-center gap-2",
                                isArabic ? "flex-row-reverse" : ""
                            )}>
                                {/* Scanning indicator */}
                                {isScanning && (
                                    <Link href="/scan">
                                        <div className="flex items-center gap-1.5 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-400/15">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span className="hidden xs:inline">{t("Scanning", "جاري الفحص")}</span>
                                            <span className="font-mono tabular-nums">{totalDuration}s</span>
                                        </div>
                                    </Link>
                                )}

                                {/* Credits chip */}
                                <Link href="/profile" aria-label="Open profile">
                                    <div className={cn(
                                        "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all",
                                        plan === "ultra"
                                            ? "bg-amber-400/10 border-amber-400/25 text-amber-300 hover:bg-amber-400/15"
                                            : "bg-cyan-400/10 border-cyan-400/25 text-cyan-300 hover:bg-cyan-400/15"
                                    )}>
                                        <span className={cn(
                                            "w-1.5 h-1.5 rounded-full animate-glow-pulse",
                                            plan === "ultra" ? "bg-amber-400" : "bg-cyan-400"
                                        )} />
                                        {credits > 10000 ? "∞" : credits}
                                        <span className="hidden sm:inline">{t(" Credits", " رصيد")}</span>
                                    </div>
                                </Link>

                                {/* Avatar */}
                                <Link href="/profile">
                                    <button className="hidden sm:flex h-9 w-9 rounded-xl items-center justify-center border border-white/10 bg-white/[0.05] overflow-hidden transition-all hover:border-white/20 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30">
                                        {user?.user_metadata?.avatar_url ? (
                                            <img
                                                src={user.user_metadata.avatar_url}
                                                alt={user.email || "User"}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <User className="w-4 h-4 text-slate-300" />
                                        )}
                                    </button>
                                </Link>

                                {/* Sign out */}
                                <button
                                    onClick={handleSignOut}
                                    className="hidden sm:flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-400/70 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
                                >
                                    <LogOut className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">{t("Exit", "خروج")}</span>
                                </button>
                            </div>
                        ) : !loading ? (
                            <div className={cn(
                                "hidden sm:flex items-center gap-2",
                                isArabic ? "flex-row-reverse" : ""
                            )}>
                                <Link href="/login">
                                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                        {t("Login", "الدخول")}
                                    </Button>
                                </Link>
                                <Link href="/signup">
                                    <Button variant="primary" size="sm" className="px-5" glow>
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
