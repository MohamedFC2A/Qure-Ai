"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { AiPartnersBadge } from "@/components/ui/AiPartnersBadge";
import {
    ArrowRight,
    CheckCircle2,
    Database,
    HeartPulse,
    ScanLine,
    ShieldCheck,
    Lock,
    ShieldAlert,
} from "lucide-react";
import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { useSettings } from "@/context/SettingsContext";
import { cn } from "@/lib/utils";

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.05 },
    },
};

const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 100, damping: 20 },
    },
};

export default function Home() {
    const { resultsLanguage } = useSettings();
    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    const pillars = [
        {
            icon: ScanLine,
            title: t("High-Accuracy OCR", "التقاط وقراءة الملصقات بدقة"),
            description: t(
                "Extracts medication names, active ingredients, dosage forms, and strengths directly from photos and prescriptions.",
                "استخراج فوري لاسم الدواء والمواد الفعالة والتركيز من صور العبوات والوصفات الطبية."
            ),
            badge: "icon-badge-cyan",
            accent: "cyan",
        },
        {
            icon: Database,
            title: t("Authoritative Verification", "مطابقة معتمدة مع قواعد FDA"),
            description: t(
                "Cross-references extracted substances with official pharmaceutical databases and clinical monographs.",
                "مطابقة وتدقيق المواد الفعالة مع مراجع الأدوية العالمية وقواعد بيانات FDA المعتمدة."
            ),
            badge: "icon-badge-emerald",
            accent: "emerald",
        },
        {
            icon: ShieldAlert,
            title: t("Interaction & Safety Guard", "فحص التداخلات والسلامة"),
            description: t(
                "Detects potential conflicts between medications, precautions, contraindications, and critical safety warnings.",
                "كشف تلقائي للتعارضات الدوائية والتحذيرات والاحتياطات لضمان الاستخدام الآمن والصحيح."
            ),
            badge: "icon-badge-amber",
            accent: "amber",
        },
    ];

    const stats = [
        { value: "50,000+", label: t("Verified Drug References", "مرجع دوائي معتمد") },
        { value: "< 2.5s",   label: t("Real-Time Analysis", "سرعة الفحص الفوري") },
        { value: "100%",     label: t("Confidential & Encrypted", "أمان وتشفير كامل للبيانات") },
    ];

    return (
        <main className="relative min-h-screen pb-24 pt-24 sm:pt-28 md:pb-20 md:pt-32">

            {/* ── HERO SECTION ──────────────────────────────────── */}
            <motion.section
                className="clinical-page max-w-5xl mx-auto text-center"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants} className="space-y-6">

                    {/* Gemini x DeepSeek AI Engine Badge */}
                    <div className="flex justify-center mb-1">
                        <AiPartnersBadge />
                    </div>

                    {/* Headline */}
                    <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.12] tracking-tight text-white max-w-4xl mx-auto">
                        {isArabic ? (
                            <>
                                منصة التحليل والفحص الذكي{" "}
                                <span className="bg-gradient-to-r from-cyan-300 via-cyan-200 to-emerald-300 bg-clip-text text-transparent">
                                    للأدوية والملصقات الطبية.
                                </span>
                            </>
                        ) : (
                            <>
                                Advanced Pharmaceutical &{" "}
                                <span className="bg-gradient-to-r from-cyan-300 via-cyan-200 to-emerald-300 bg-clip-text text-transparent">
                                    Medication Intelligence.
                                </span>
                            </>
                        )}
                    </h1>

                    {/* Subtitle */}
                    <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
                        {t(
                            "Scan prescription labels, extract active ingredients, verify clinical safety, and detect drug interactions instantly.",
                            "التقط صورة ملصق الدواء، واستخرج المواد الفعالة، وتحقق من الجرعات والتداخلات الدوائية في ثوانٍ."
                        )}
                    </p>

                    {/* Action Buttons with Equal Proportions & High-End Styling */}
                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto">
                        <Link href="/scan" className="w-full sm:w-auto flex-1">
                            <button className="shiny-cta-btn w-full gap-3.5 px-8 sm:px-12 py-4 sm:py-5 text-sm sm:text-base font-black tracking-wide">
                                <ScanLine className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-slate-950 stroke-[2.5]" />
                                <span>{t("Start Medication Scan Now", "ابدأ فحص الدواء الآن")}</span>
                            </button>
                        </Link>

                        <Link href="/pricing" className="w-full sm:w-auto">
                            <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 sm:py-5 rounded-2xl border border-white/20 bg-white/[0.06] hover:bg-white/[0.12] hover:border-white/40 text-white font-bold text-sm sm:text-base backdrop-blur-xl shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0">
                                <span>{t("View Plans", "عرض الباقات")}</span>
                                <ArrowRight className={cn("h-4 w-4 shrink-0", isArabic ? "rotate-180" : "")} />
                            </button>
                        </Link>
                    </div>

                    {/* Trust Indicators */}
                    <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-400">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                            <span>{t("Instant Label OCR", "قراءة فورية للملصقات")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-emerald-400" />
                            <span>{t("FDA Verified Data", "مطابقة معتمدة مع FDA")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4 text-amber-400" />
                            <span>{t("Encrypted & Private", "حماية وخصوصية تامة")}</span>
                        </div>
                    </div>
                </motion.div>
            </motion.section>

            {/* ── CORE CAPABILITIES GRID ────────────────────────── */}
            <section className="clinical-page max-w-6xl mx-auto mt-16 sm:mt-24">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                    {pillars.map((pillar) => (
                        <GlassCard
                            key={pillar.title}
                            className="p-6 sm:p-7 flex flex-col justify-between"
                            hoverEffect={true}
                        >
                            <div>
                                <div className={cn("icon-badge w-12 h-12 rounded-2xl mb-5", pillar.badge)}>
                                    <pillar.icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-base sm:text-lg font-bold text-white mb-2 tracking-tight">
                                    {pillar.title}
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                    {pillar.description}
                                </p>
                            </div>

                            <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs font-bold text-slate-400">
                                <span className={cn(
                                    "w-2 h-2 rounded-full",
                                    pillar.accent === "cyan" ? "bg-cyan-400" : pillar.accent === "emerald" ? "bg-emerald-400" : "bg-amber-400"
                                )} />
                                <span>{t("Clinical Standard", "معايير معتمدة")}</span>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </section>

            {/* ── STATS SECTION ─────────────────────────────────── */}
            <section className="clinical-page max-w-5xl mx-auto mt-12 sm:mt-16">
                <GlassCard hoverEffect={false} className="p-6 sm:p-8 border-white/10">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-white/10">
                        {stats.map((item) => (
                            <div key={item.label} className="pt-4 sm:pt-0">
                                <p className="text-2xl sm:text-4xl font-black text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                                    {item.value}
                                </p>
                                <p className="mt-1.5 text-xs sm:text-sm font-semibold text-slate-400">
                                    {item.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </section>

            {/* ── CLINICAL DISCLAIMER BAR ───────────────────────── */}
            <section className="clinical-page max-w-5xl mx-auto mt-8">
                <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300 text-center sm:text-start">
                        <HeartPulse className="w-5 h-5 text-amber-400 shrink-0 hidden sm:block" />
                        <span>
                            {t(
                                "QURE AI is an informational safety review tool. Always verify critical medical decisions with a qualified doctor or pharmacist.",
                                "QURE AI هو أداة مراجعة وتحقق إرشادية. استشر طبيبك أو الصيدلي دائمًا قبل اتخاذ أي قرار علاجي."
                            )}
                        </span>
                    </div>
                    <Link href="/scan" className="shrink-0 w-full sm:w-auto">
                        <button className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors shadow-md shadow-amber-950/30">
                            {t("Scan Medication", "فحص الدواء")}
                        </button>
                    </Link>
                </div>
            </section>

        </main>
    );
}
