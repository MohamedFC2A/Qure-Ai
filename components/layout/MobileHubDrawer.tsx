"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    X,
    Zap,
    Gem,
    Clock,
    User,
    LayoutDashboard,
    Shield,
    Globe,
    LogOut,
    LogIn,
    UserPlus,
    Brain,
    Sparkles,
    ChevronRight,
    ScanLine,
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useSettings } from "@/context/SettingsContext";
import { createClient } from "@/lib/supabase/client";

interface MobileHubDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MobileHubDrawer: React.FC<MobileHubDrawerProps> = ({ isOpen, onClose }) => {
    const pathname = usePathname();
    const { user, profile, plan, credits } = useUser();
    const { resultsLanguage, setResultsLanguage } = useSettings();
    const supabase = createClient();

    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    // Auto-close on route change
    useEffect(() => {
        onClose();
    }, [pathname]);

    // Prevent body scrolling when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = "/";
    };

    const toggleLanguage = () => {
        const nextLang = resultsLanguage === "ar" ? "en" : "ar";
        setResultsLanguage(nextLang);
    };

    const isUltra = plan === "ultra";

    const menuItems = [
        {
            titleEn: "Updates & Changelog",
            titleAr: "التحديثات وسجل الإصدارات",
            descEn: "Live release notes & AI features",
            descAr: "سجل الإصدارات الموثق بالذكاء الاصطناعي",
            href: "/changelog",
            icon: Zap,
            badge: "Beta",
            badgeColor: "bg-cyan-950/80 text-cyan-300 border-cyan-700/40",
            iconColor: "text-cyan-400 bg-slate-800 border-slate-700",
        },
        {
            titleEn: "Plans & Pricing",
            titleAr: "الباقات والأسعار",
            descEn: "Upgrade to Ultra & features",
            descAr: "ترقية ألترا والمزايا الشاملة",
            href: "/pricing",
            icon: Gem,
            badge: isUltra ? t("Active", "نشط") : "$9",
            badgeColor: isUltra ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/40" : "bg-slate-800 text-slate-300 border-slate-700",
            iconColor: "text-amber-400 bg-slate-800 border-slate-700",
        },
        {
            titleEn: "Scan History",
            titleAr: "سجل الفحوصات والتقارير",
            descEn: "Past medication analyses & logs",
            descAr: "تحليلات الأدوية السابقة والتقارير",
            href: "/dashboard/history",
            icon: Clock,
            iconColor: "text-blue-400 bg-slate-800 border-slate-700",
        },
        {
            titleEn: "Health Profile & Allergies",
            titleAr: "الملف الصحي والحساسية",
            descEn: "Personal care & chronic conditions",
            descAr: "الأمراض المزمنة وتفاصيل الجسم",
            href: "/profile",
            icon: User,
            iconColor: "text-purple-400 bg-slate-800 border-slate-700",
        },
        {
            titleEn: "Full Dashboard",
            titleAr: "لوحة التحكم الشاملة",
            descEn: "Comprehensive analytics & overview",
            descAr: "إحصائيات المنصة والتحليلات",
            href: "/dashboard",
            icon: LayoutDashboard,
            iconColor: "text-emerald-400 bg-slate-800 border-slate-700",
        },
        {
            titleEn: "Terms & Clinical Policies",
            titleAr: "الشروط وسياسة الاستخدام",
            descEn: "Medical disclaimers & privacy",
            descAr: "إخلاء المسؤولية الطبية والخصوصية",
            href: "/terms",
            icon: Shield,
            iconColor: "text-slate-400 bg-slate-800 border-slate-700",
        },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end" dir={isArabic ? "rtl" : "ltr"}>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md"
                    />

                    {/* Sheet Content */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 28, stiffness: 300 }}
                        className="relative z-10 w-full max-h-[85vh] flex flex-col rounded-t-[32px] bg-slate-950 border-t border-white/10 shadow-2xl overflow-hidden pb-[env(safe-area-inset-bottom)]"
                    >
                        {/* Drag Pill Handle */}
                        <div className="pt-3 pb-2 flex justify-center items-center shrink-0">
                            <div className="w-12 h-1.5 rounded-full bg-slate-700/80" />
                        </div>

                        {/* Top Header Bar */}
                        <div className="px-5 py-3 flex items-center justify-between border-b border-white/[0.06] shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white leading-none">
                                        {t("Navigation & Actions", "قائمة الخيارات والتنقل")}
                                    </h3>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        {t("QureScan Quick Access Hub", "مركز الوصول السريع لكافة المميزات")}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white active:scale-95 transition-all"
                                aria-label="Close menu"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                            
                            {/* User Status Card */}
                            {user ? (
                                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-300 shrink-0 font-bold text-sm">
                                            {profile?.username ? profile.username.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || "U"}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-white truncate">
                                                {profile?.username || user.email?.split("@")[0] || "User"}
                                            </p>
                                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={cn(
                                            "px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold border",
                                            isUltra
                                                ? "bg-slate-800 text-cyan-300 border-slate-700"
                                                : "bg-slate-800 text-slate-400 border-slate-700"
                                        )}>
                                            {isUltra ? "ULTRA" : "FREE"}
                                        </span>
                                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold bg-slate-800 border border-slate-700 text-slate-300">
                                            {credits > 10000 ? "∞" : credits} 🧠
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 flex items-center justify-between gap-2">
                                    <Link
                                        href="/login"
                                        className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all"
                                    >
                                        <LogIn className="w-3.5 h-3.5" />
                                        <span>{t("Login", "تسجيل الدخول")}</span>
                                    </Link>
                                    <Link
                                        href="/signup"
                                        className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all shadow-sm"
                                    >
                                        <UserPlus className="w-3.5 h-3.5" />
                                        <span>{t("Sign Up", "إنشاء حساب")}</span>
                                    </Link>
                                </div>
                            )}

                            {/* Menu Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {menuItems.map((item) => {
                                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
                                    const Icon = item.icon;

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                "p-3.5 rounded-2xl border transition-all duration-150 flex items-center justify-between group active:scale-[0.98]",
                                                isActive
                                                    ? "bg-slate-900 border-white/20"
                                                    : "bg-slate-900/60 border-white/[0.07] hover:bg-slate-900 hover:border-white/15"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={cn("w-9 h-9 rounded-xl border flex items-center justify-center shrink-0", item.iconColor)}>
                                                    <Icon className="w-4.5 h-4.5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={cn("text-xs font-bold truncate", isActive ? "text-cyan-300" : "text-white")}>
                                                        {isArabic ? item.titleAr : item.titleEn}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                                        {isArabic ? item.descAr : item.descEn}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0 ms-2">
                                                {item.badge && (
                                                    <span className={cn("px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border", item.badgeColor)}>
                                                        {item.badge}
                                                    </span>
                                                )}
                                                <ChevronRight className={cn("w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors", isArabic ? "rotate-180" : "")} />
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>

                            {/* Quick AI & Scanner Links */}
                            <div className="p-3 rounded-2xl bg-slate-900/40 border border-white/[0.06] flex items-center justify-between gap-2">
                                <Link
                                    href="/ai"
                                    className="flex-1 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 active:scale-98 transition-all"
                                >
                                    <Brain className="w-4 h-4 text-cyan-400" />
                                    <span>AOS AI</span>
                                </Link>
                                <Link
                                    href="/scan"
                                    className="flex-1 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 active:scale-98 transition-all"
                                >
                                    <ScanLine className="w-4 h-4 text-emerald-400" />
                                    <span>{t("Scan Drug", "فحص الدواء")}</span>
                                </Link>
                            </div>
                        </div>

                        {/* Footer Controls: Language & Logout */}
                        <div className="p-4 border-t border-white/[0.06] bg-slate-950 flex items-center justify-between gap-3 shrink-0">
                            {/* Language Switcher */}
                            <button
                                onClick={toggleLanguage}
                                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all"
                            >
                                <Globe className="w-4 h-4 text-cyan-400" />
                                <span>{isArabic ? "English (US)" : "العربية (AR)"}</span>
                            </button>

                            {/* Logout or Version */}
                            {user ? (
                                <button
                                    onClick={handleLogout}
                                    className="py-2.5 px-4 rounded-xl bg-red-950/40 border border-red-900/40 hover:bg-red-900/30 text-red-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    <span>{t("Logout", "خروج")}</span>
                                </button>
                            ) : (
                                <div className="px-3 py-2 text-[10px] text-slate-500 font-mono">
                                    QureScan Beta
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
