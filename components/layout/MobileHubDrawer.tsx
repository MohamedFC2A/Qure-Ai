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
    User,
    LayoutDashboard,
    FileText,
    Shield,
    Globe,
    ChevronRight,
} from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

interface MobileHubDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MobileHubDrawer: React.FC<MobileHubDrawerProps> = ({ isOpen, onClose }) => {
    const pathname = usePathname();
    const { resultsLanguage, setResultsLanguage } = useSettings();

    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    // Auto-close when user navigates
    useEffect(() => {
        onClose();
    }, [pathname]);

    // Prevent background scrolling while open
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

    const toggleLanguage = () => {
        setResultsLanguage(resultsLanguage === "ar" ? "en" : "ar");
    };

    // Exclusive pages that are NOT present in the bottom dock (Home, Scan, AOS AI, History are already in the bottom bar)
    const exclusiveMenuItems = [
        {
            titleEn: "Updates & Changelog",
            titleAr: "التحديثات وسجل الإصدارات",
            descEn: "Live release notes & AI features",
            descAr: "سجل التحديثات المدعوم بـ AOS AI",
            href: "/changelog",
            icon: Zap,
            badge: "Beta",
        },
        {
            titleEn: "Plans & Pricing",
            titleAr: "الباقات والأسعار",
            descEn: "Ultra plan & subscription options",
            descAr: "خيارات الاشتراك وباقة ألترا",
            href: "/pricing",
            icon: Gem,
        },
        {
            titleEn: "Personal Health Profile",
            titleAr: "الملف الصحي والحساسية",
            descEn: "Manage allergies, age & chronic conditions",
            descAr: "الأمراض المزمنة وتفاصيل الجسم",
            href: "/profile",
            icon: User,
        },
        {
            titleEn: "Analytics Dashboard",
            titleAr: "لوحة التحكم والتحليلات",
            descEn: "Platform insights & overview",
            descAr: "إحصائيات واستخدام الحساب",
            href: "/dashboard",
            icon: LayoutDashboard,
        },
        {
            titleEn: "Documentation & Guides",
            titleAr: "الوثائق ودليل الاستخدام",
            descEn: "How to use QureScan effectively",
            descAr: "طريقة الاستخدام ومصادر التحليل",
            href: "/docs",
            icon: FileText,
        },
        {
            titleEn: "Terms & Clinical Policies",
            titleAr: "الشروط والسياسات الطبية",
            descEn: "Medical disclaimer & privacy",
            descAr: "إخلاء المسؤولية الطبية والخصوصية",
            href: "/terms",
            icon: Shield,
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
                        transition={{ duration: 0.18 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Drawer Sheet */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 350 }}
                        className="relative z-10 w-full max-h-[80vh] flex flex-col rounded-t-[28px] bg-slate-950 border-t border-white/10 shadow-2xl overflow-hidden pb-[env(safe-area-inset-bottom)]"
                    >
                        {/* Drag Handle Bar */}
                        <div className="pt-3 pb-1 flex justify-center items-center shrink-0">
                            <div className="w-10 h-1 rounded-full bg-slate-700/60" />
                        </div>

                        {/* Clean Header */}
                        <div className="px-5 py-3 flex items-center justify-between border-b border-white/[0.06] shrink-0">
                            <div>
                                <h3 className="text-sm font-bold text-white leading-none">
                                    {t("More Options", "المزيد من الخيارات")}
                                </h3>
                                <p className="text-[11px] text-slate-400 mt-1">
                                    {t("Quick access to platform sections", "وصول سريع لأقسام وخدمات المنصة")}
                                </p>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white active:scale-95 transition-all"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Menu Items List */}
                        <div className="flex-1 overflow-y-auto p-3.5 space-y-2 no-scrollbar">
                            {exclusiveMenuItems.map((item) => {
                                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
                                const Icon = item.icon;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "p-3 rounded-2xl border transition-all duration-150 flex items-center justify-between group active:scale-[0.99]",
                                            isActive
                                                ? "bg-slate-900 border-white/20"
                                                : "bg-slate-900/50 border-white/[0.06] hover:bg-slate-900/80 hover:border-white/10"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            {/* Unified Slate Icon Box (No Clashing Colors) */}
                                            <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-200 shrink-0 group-hover:text-cyan-300 group-hover:border-slate-600 transition-colors">
                                                <Icon className="w-4 h-4" />
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

                                        <div className="flex items-center gap-2 shrink-0 ms-2">
                                            {item.badge && (
                                                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-800 border border-slate-700 text-cyan-300">
                                                    {item.badge}
                                                </span>
                                            )}
                                            <ChevronRight className={cn("w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors", isArabic ? "rotate-180" : "")} />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Minimal Footer: Language Switcher Only */}
                        <div className="p-3.5 border-t border-white/[0.06] bg-slate-950/90 flex items-center justify-between shrink-0">
                            <span className="text-[11px] text-slate-400 font-medium">
                                {t("Language", "لغة المنصة")}
                            </span>

                            <button
                                onClick={toggleLanguage}
                                className="py-2 px-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 active:scale-95 transition-all"
                            >
                                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                                <span>{isArabic ? "English" : "العربية"}</span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
