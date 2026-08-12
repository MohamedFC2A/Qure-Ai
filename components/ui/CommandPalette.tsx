"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    ScanLine,
    Brain,
    User,
    CreditCard,
    History,
    Settings,
    ShieldAlert,
    Sparkles,
    X,
    FileText,
    HelpCircle,
    Globe,
    Layers,
} from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { cn } from "@/lib/utils";

interface CommandItem {
    id: string;
    titleEn: string;
    titleAr: string;
    descriptionEn: string;
    descriptionAr: string;
    icon: React.ElementType;
    action: () => void;
    category: "actions" | "navigation" | "tools";
    badge?: string;
}

export function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();
    const { resultsLanguage, setResultsLanguage } = useSettings();
    const inputRef = useRef<HTMLInputElement>(null);

    const isArabic = resultsLanguage === "ar";
    const t = useCallback((en: string, ar: string) => (isArabic ? ar : en), [isArabic]);

    // Handle global keyboard listeners
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            } else if (e.key === "Escape" && isOpen) {
                setIsOpen(false);
            }
        };

        const handleCustomOpen = () => setIsOpen(true);

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("open-command-palette", handleCustomOpen);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("open-command-palette", handleCustomOpen);
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            setQuery("");
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const items: CommandItem[] = [
        {
            id: "scan",
            titleEn: "Start New Medication Scan",
            titleAr: "بدء فحص دواء جديد",
            descriptionEn: "Capture or upload medicine box label for OCR and FDA analysis",
            descriptionAr: "التقط أو ارفع صورة الدواء للفحص الفوري بالذكاء الاصطناعي",
            icon: ScanLine,
            action: () => { router.push("/scan"); setIsOpen(false); },
            category: "actions",
            badge: "Fast 3s",
        },
        {
            id: "ai-chat",
            titleEn: "Qure AI Medical Assistant",
            titleAr: "المساعد الطبي الذكي Qure AI",
            descriptionEn: "Ask health and drug questions with context from your medical history",
            descriptionAr: "اسأل أسئلة دوائية وصحية مع ربط كامل بملفك ونتائج فحوصاتك",
            icon: Brain,
            action: () => { router.push("/ai"); setIsOpen(false); },
            category: "actions",
            badge: "Agentic AI",
        },
        {
            id: "history",
            titleEn: "Scan History & Saved Monographs",
            titleAr: "سجل الفحوصات والنشرات المحفوظة",
            descriptionEn: "View past scanned medications and structured summaries",
            descriptionAr: "عرض الفحوصات السابقة وتحليلات الأدوية التي قمت بفحصها",
            icon: History,
            action: () => { router.push("/dashboard"); setIsOpen(false); },
            category: "navigation",
        },
        {
            id: "profile",
            titleEn: "Patient Health Profile",
            titleAr: "الملف الصحي والبيانات الشخصية",
            descriptionEn: "Manage allergies, chronic conditions, and active medications",
            descriptionAr: "إدارة الحساسية، الأمراض المزمنة، والأدوية الحالية لتنبيهات السلامة",
            icon: User,
            action: () => { router.push("/profile"); setIsOpen(false); },
            category: "navigation",
        },
        {
            id: "toggle-lang",
            titleEn: isArabic ? "Switch to English Interface" : "تغيير الواجهة للغة العربية",
            titleAr: isArabic ? "Switch to English Interface" : "تغيير الواجهة للغة العربية",
            descriptionEn: "Toggle language preferences for scan results and monographs",
            descriptionAr: "تبديل لغة التحليل بين العربية والإنجليزية",
            icon: Globe,
            action: () => {
                setResultsLanguage(isArabic ? "en" : "ar");
                setIsOpen(false);
            },
            category: "tools",
        },
        {
            id: "pricing",
            titleEn: "Upgrade to Ultra Pro",
            titleAr: "الترقية إلى باقة ألترا Pro",
            descriptionEn: "Unlock unlimited scans, private history, and interaction guard",
            descriptionAr: "احصل على فحوصات غير محدودة وحماية كاملة للتداخلات الدوائية",
            icon: CreditCard,
            action: () => { router.push("/pricing"); setIsOpen(false); },
            category: "tools",
            badge: "Pro",
        },
    ];

    const filteredItems = items.filter((item) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
            item.titleEn.toLowerCase().includes(q) ||
            item.titleAr.toLowerCase().includes(q) ||
            item.descriptionEn.toLowerCase().includes(q) ||
            item.descriptionAr.toLowerCase().includes(q)
        );
    });

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
        } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
            e.preventDefault();
            filteredItems[selectedIndex].action();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/80 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-900/95 shadow-2xl shadow-cyan-950/50"
                    >
                        {/* Search Input Bar */}
                        <div className="relative flex items-center border-b border-white/10 px-4 py-3.5">
                            <Search className="h-5 w-5 shrink-0 text-cyan-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setSelectedIndex(0);
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder={t("Search actions, tools, commands... (Ctrl+K)", "ابحث في الأوامر والخدمات والتنقل السريع... (Ctrl+K)")}
                                className="w-full bg-transparent px-3 text-sm text-white placeholder-slate-400 focus:outline-none"
                            />
                            {query && (
                                <button
                                    onClick={() => setQuery("")}
                                    className="p-1 text-slate-400 hover:text-white rounded-md"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                            <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                                ESC
                            </kbd>
                        </div>

                        {/* Items List */}
                        <div className="max-h-96 overflow-y-auto p-2">
                            {filteredItems.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-sm">
                                    {t("No commands found matching your query.", "لم يتم العثور على نتائج تطابق بحثك.")}
                                </div>
                            ) : (
                                filteredItems.map((item, index) => {
                                    const Icon = item.icon;
                                    const isSelected = index === selectedIndex;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={item.action}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                            className={cn(
                                                "w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl text-left transition-all",
                                                isSelected
                                                    ? "bg-gradient-to-r from-cyan-500/20 to-sky-500/10 border border-cyan-500/30 text-white"
                                                    : "text-slate-300 hover:bg-white/[0.04]"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={cn(
                                                    "p-2 rounded-xl shrink-0 transition-colors",
                                                    isSelected ? "bg-cyan-500/20 text-cyan-300" : "bg-white/5 text-slate-400"
                                                )}>
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-xs sm:text-sm text-white truncate">
                                                            {t(item.titleEn, item.titleAr)}
                                                        </span>
                                                        {item.badge && (
                                                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
                                                                {item.badge}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                                                        {t(item.descriptionEn, item.descriptionAr)}
                                                    </p>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <span className="hidden sm:inline-block text-[11px] text-cyan-400 font-mono">
                                                    ↵ Select
                                                </span>
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer Shortcuts hint */}
                        <div className="flex items-center justify-between border-t border-white/10 px-4 py-2 text-[11px] text-slate-400 bg-slate-950/40">
                            <div className="flex items-center gap-3">
                                <span><kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white">↑↓</kbd> Navigate</span>
                                <span><kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white">↵</kbd> Execute</span>
                            </div>
                            <span>QURE AI Control Palette</span>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
