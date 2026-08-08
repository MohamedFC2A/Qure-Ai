"use client";

import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Database,
    FileText,
    HeartPulse,
    ScanLine,
    ShieldCheck,
    Sparkles,
    Zap,
    Lock,
    Globe,
    Activity,
} from "lucide-react";
import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { useSettings } from "@/context/SettingsContext";
import { cn } from "@/lib/utils";

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.05 },
    },
};

const itemVariants: Variants = {
    hidden: { y: 16, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 120, damping: 20 },
    },
};

/* ── Minimal Product Preview Card ────────────────────────────────── */
function ProductPreview() {
    const { resultsLanguage } = useSettings();
    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    return (
        <div className="relative w-full max-w-xl mx-auto lg:max-w-none">
            <GlassCard variant="elevated" className="overflow-hidden" hoverEffect={false}>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3.5 sm:px-5 sm:py-4">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-400">
                            {t("Instant Analysis", "تحليل فوري")}
                        </p>
                        <p className="mt-0.5 text-base font-bold text-white">
                            {t("Panadol Extra 500mg", "بنادول إكسترا 500 ملغ")}
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-bold text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        <span>{t("Verified", "موثّق")}</span>
                    </div>
                </div>

                {/* Body */}
                <div className="grid gap-3.5 p-4 sm:p-5 sm:grid-cols-2">
                    <div className="glass-inset rounded-xl p-3.5">
                        <div className="flex items-center gap-2.5 mb-2.5">
                            <div className="icon-badge icon-badge-cyan w-8 h-8 rounded-lg">
                                <ScanLine className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-bold text-white">{t("Active Ingredients", "المواد الفعالة")}</span>
                        </div>
                        <p className="text-xs text-slate-300 font-mono">Paracetamol 500mg + Caffeine 65mg</p>
                    </div>

                    <div className="glass-inset rounded-xl p-3.5">
                        <div className="flex items-center gap-2.5 mb-2.5">
                            <div className="icon-badge icon-badge-emerald w-8 h-8 rounded-lg">
                                <ShieldCheck className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-bold text-white">{t("Interaction Guard", "حارس التداخلات")}</span>
                        </div>
                        <p className="text-xs text-emerald-300 font-semibold">{t("0 Critical Conflicts", "لا توجد تعارضات خطيرة")}</p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="border-t border-white/[0.08] px-4 py-2.5 sm:px-5 sm:py-3 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                    <span>{t("FDA & Web Cross-Check", "تحقق FDA وقواعد البيانات")}</span>
                    <span className="text-cyan-400 font-bold">100%</span>
                </div>
            </GlassCard>
        </div>
    );
}

/* ── Main Landing Page ──────────────────────────────────────────── */
export default function Home() {
    const { resultsLanguage } = useSettings();
    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    const workflow = [
        {
            icon: ScanLine,
            label:  t("1. Scan", "١. التقاط الصورة"),
            text:   t("Upload prescription or box photo.", "التقط أو ارفع صورة ملصق الدواء."),
            badge:  "icon-badge-cyan",
        },
        {
            icon: Database,
            label:  t("2. Verify", "٢. الفحص والتحقق"),
            text:   t("Cross-check FDA and active ingredients.", "مطابقة المواد الفعالة وقواعد FDA."),
            badge:  "icon-badge-emerald",
        },
        {
            icon: FileText,
            label:  t("3. Safety Report", "٣. تقرير الأمان"),
            text:   t("Get dosage notes and interaction alerts.", "استلم تقرير الجرعات وتنبيهات التعارض."),
            badge:  "icon-badge-amber",
        },
    ];

    return (
        <main className="relative min-h-screen pb-20 pt-20 sm:pt-24 md:pb-16 md:pt-28">

            {/* ── HERO SECTION ──────────────────────────────────── */}
            <motion.section
                className="clinical-page grid min-h-[calc(100vh-14rem)] items-center gap-8 lg:gap-12 lg:grid-cols-[1.1fr_0.9fr]"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Text Column */}
                <motion.div variants={itemVariants} className="max-w-2xl">
                    <div className="clinical-eyebrow mb-4">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>{t("Medication Intelligence", "فحص الأدوية الذكي")}</span>
                    </div>

                    <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-[3.2rem] font-black leading-[1.15] tracking-tight text-white">
                        {isArabic ? (
                            <>
                                فحص وتحليل ذكي{" "}
                                <span className="bg-gradient-to-r from-cyan-300 via-cyan-200 to-emerald-300 bg-clip-text text-transparent">
                                    لملصقات الأدوية.
                                </span>
                            </>
                        ) : (
                            <>
                                Intelligent Medication{" "}
                                <span className="bg-gradient-to-r from-cyan-300 via-cyan-200 to-emerald-300 bg-clip-text text-transparent">
                                    Label Analysis.
                                </span>
                            </>
                        )}
                    </h1>

                    <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-300 max-w-lg">
                        {t(
                            "Instant OCR extraction, interaction guards, and clinical safety reviews in seconds.",
                            "استخراج فوري لبيانات الدواء، وفحص التعارضات، وإعداد تقارير الأمان في ثوانٍ."
                        )}
                    </p>

                    {/* Action Buttons */}
                    <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                        <Link href="/scan" className="w-full sm:w-auto">
                            <button className="shiny-cta-btn w-full sm:w-auto gap-3 px-8 py-4 text-sm sm:text-base">
                                <ScanLine className="h-5 w-5 shrink-0 text-slate-950 stroke-[2.5]" />
                                <span>{t("Start Analysis Now", "ابدأ الفحص الآن")}</span>
                            </button>
                        </Link>
                        <Link href="/pricing" className="w-full sm:w-auto">
                            <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 px-6 font-bold text-xs sm:text-sm">
                                <span>{t("View Plans", "عرض الباقات")}</span>
                                <ArrowRight className={cn("h-4 w-4 shrink-0", isArabic ? "rotate-180" : "")} />
                            </Button>
                        </Link>
                    </div>

                    {/* Trust badges */}
                    <div className="mt-8 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400">
                        <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                            <span>{t("OCR Instant Read", "قراءة فورية")}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck className="h-4 w-4 text-emerald-400" />
                            <span>{t("FDA Verified", "مطابقة معتمدة")}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Lock className="h-4 w-4 text-amber-400" />
                            <span>{t("100% Private", "بيانات مشفرة")}</span>
                        </div>
                    </div>
                </motion.div>

                {/* Preview Column */}
                <motion.div variants={itemVariants} className="relative w-full">
                    <ProductPreview />
                </motion.div>
            </motion.section>

            {/* ── 3-STEP WORKFLOW ───────────────────────────────── */}
            <section className="clinical-page mt-12 sm:mt-16">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {workflow.map((item) => (
                        <div
                            key={item.label}
                            className="glass-card p-5 sm:p-6"
                        >
                            <div className={cn("icon-badge w-10 h-10 rounded-xl mb-3.5", item.badge)}>
                                <item.icon className="h-5 w-5" />
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-white">
                                {item.label}
                            </h3>
                            <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                                {item.text}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CLINICAL NOTICE ───────────────────────────────── */}
            <section className="clinical-page mt-8 sm:mt-10">
                <GlassCard hoverEffect={false} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-white/10">
                    <div className="flex items-center gap-3 text-xs text-slate-300">
                        <HeartPulse className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>{t("Informational medication review tool. Always verify critical decisions with a doctor.", "أداة مراجعة معلوماتية للأدوية. استشر طبيبك أو الصيدلي دائمًا.")}</span>
                    </div>
                    <Link href="/scan" className="shrink-0">
                        <Button size="xs" variant="primary" className="font-bold whitespace-nowrap text-xs px-4">
                            {t("Try Now", "جرب الفحص")}
                        </Button>
                    </Link>
                </GlassCard>
            </section>

        </main>
    );
}
