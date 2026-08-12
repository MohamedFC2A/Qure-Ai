"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { AiPartnersMarquee } from "@/components/ui/AiPartnersMarquee";
import {
    ArrowRight,
    CheckCircle2,
    Database,
    HeartPulse,
    ScanLine,
    ShieldCheck,
    Lock,
    ShieldAlert,
    Sparkles,
    Brain,
    Zap,
    Star,
    ChevronRight,
} from "lucide-react";
import { motion, Variants, useInView } from "framer-motion";
import Link from "next/link";
import { useSettings } from "@/context/SettingsContext";
import { cn } from "@/lib/utils";
import { useRef } from "react";

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

const itemVariants: Variants = {
    hidden: { y: 16, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 90, damping: 22 } },
};

const fadeUpVariants: Variants = {
    hidden: { y: 24, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 80, damping: 22 } },
};

/* ── Mock Chat Preview ── */
function MockChatPreview({ isArabic }: { isArabic: boolean }) {
    const messages = isArabic ? [
        { role: "user", text: "ما التداخلات الدوائية للميترفورمين مع الإيبوبروفين؟" },
        { role: "ai", text: "**تحذير تداخل دوائي** — الاستخدام المتزامن قد يزيد خطر حماض اللاكتيك لدى المرضى الذين يعانون من قصور كلوي. يُنصح بمراقبة وظائف الكلى واستشارة الطبيب." },
    ] : [
        { role: "user", text: "What are the interactions between Metformin and Ibuprofen?" },
        { role: "ai", text: "**Drug Interaction Warning** — Concurrent use may increase lactic acidosis risk in patients with renal impairment. Monitor kidney function and consult your doctor for alternatives." },
    ];

    return (
        <div className="w-full max-w-lg mx-auto">
            <div
                className="rounded-2xl border overflow-hidden"
                style={{
                    background: "rgba(8, 12, 22, 0.96)",
                    borderColor: "rgba(255,255,255,0.08)",
                    boxShadow: "0 24px 64px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.05) inset",
                }}
            >
                {/* Chrome bar */}
                <div
                    className="flex items-center gap-2 px-4 py-2.5 border-b"
                    style={{ background: "rgba(6, 9, 16, 0.95)", borderColor: "rgba(255,255,255,0.06)" }}
                >
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                        <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                        <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    </div>
                    <div className="flex-1 flex justify-center">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-medium">
                            <div className="nexus-gold-logo w-4 h-4 rounded-md flex items-center justify-center">
                                <Sparkles className="w-2.5 h-2.5" style={{ color: "#1c1000" }} />
                            </div>
                            MATANY AI
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="p-4 space-y-3" dir={isArabic ? "rtl" : "ltr"}>
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + i * 0.35, duration: 0.4 }}
                            className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
                        >
                            {msg.role === "ai" && (
                                <div className="nexus-gold-logo w-6 h-6 rounded-lg shrink-0 flex items-center justify-center">
                                    <Sparkles className="w-3 h-3" style={{ color: "#1c1000" }} />
                                </div>
                            )}
                            <div
                                className={cn(
                                    "max-w-[80%] rounded-xl px-3 py-2 text-[11px] leading-relaxed border",
                                    msg.role === "user"
                                        ? "bg-cyan-500/10 border-cyan-400/15 text-white/90"
                                        : "text-slate-300 border-white/[0.06]"
                                )}
                                style={msg.role === "ai" ? { background: "rgba(11, 17, 30, 0.95)" } : undefined}
                            >
                                <span dangerouslySetInnerHTML={{
                                    __html: msg.text.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                                }} />
                            </div>
                        </motion.div>
                    ))}

                    {/* Typing dots */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.3 }}
                        className="flex items-center gap-2"
                    >
                        <div className="nexus-gold-logo w-6 h-6 rounded-lg shrink-0 flex items-center justify-center">
                            <Sparkles className="w-3 h-3" style={{ color: "#1c1000" }} />
                        </div>
                        <div
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.06]"
                            style={{ background: "rgba(11, 17, 30, 0.95)" }}
                        >
                            <span className="typing-dot" />
                            <span className="typing-dot" />
                            <span className="typing-dot" />
                        </div>
                    </motion.div>
                </div>

                {/* Input bar preview */}
                <div className="px-4 pb-4">
                    <div
                        className="flex items-center gap-2 rounded-xl border border-white/[0.07] px-3 py-2.5"
                        style={{ background: "rgba(9, 14, 24, 0.90)" }}
                    >
                        <span className="text-[11px] text-white/18 flex-1">{isArabic ? "اسأل MATANY AI…" : "Ask MATANY AI…"}</span>
                        <div className="w-6 h-6 rounded-lg gold-send-btn flex items-center justify-center">
                            <ArrowRight className="w-3 h-3" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Stat Item ── */
function StatItem({ value, label, delay }: { value: string; label: string; delay: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 14 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay, type: "spring", stiffness: 80 }}
            className="text-center"
        >
            <p className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                {value}
            </p>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500">{label}</p>
        </motion.div>
    );
}

export default function Home() {
    const { resultsLanguage } = useSettings();
    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    const pillarsRef = useRef<HTMLElement>(null);
    const pillarsInView = useInView(pillarsRef, { once: true, margin: "-80px" });

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
            dotColor: "bg-cyan-400",
            tagColor: "text-cyan-400/80",
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
            dotColor: "bg-emerald-400",
            tagColor: "text-emerald-400/80",
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
            dotColor: "bg-amber-400",
            tagColor: "text-amber-400/80",
        },
    ];

    const stats = [
        { value: "50,000+", label: t("Verified Drug References", "مرجع دوائي معتمد") },
        { value: "< 2.5s",  label: t("Real-Time Analysis", "سرعة الفحص الفوري") },
        { value: "100%",    label: t("Confidential & Encrypted", "أمان وتشفير كامل") },
    ];

    const aiFeatures = [
        {
            icon: Brain,
            title: "MATANY AI",
            description: t("Ask health and medication questions with full context from your history.", "اسأل أسئلة صحية ودوائية مع كامل سياق تاريخك الطبي."),
            badge: "eyebrow-gold",
            badgeLabel: t("New", "جديد"),
            href: "/ai",
        },
        {
            icon: Zap,
            title: t("Instant Scan", "فحص فوري"),
            description: t("Capture any medication label and get full analysis in under 2.5 seconds.", "التقط أي ملصق دواء واحصل على تحليل كامل في أقل من 2.5 ثانية."),
            badge: "clinical-eyebrow",
            badgeLabel: t("Fast", "سريع"),
            href: "/scan",
        },
        {
            icon: Star,
            title: t("FDA Database", "قاعدة FDA"),
            description: t("Cross-referenced with 50,000+ verified drug references from official sources.", "مطابقة مع أكثر من 50,000 مرجع دوائي معتمد من مصادر رسمية."),
            badge: "eyebrow-emerald",
            badgeLabel: t("Official", "رسمي"),
            href: "/pricing",
        },
    ];

    return (
        <main className="relative min-h-screen pb-24 pt-20 sm:pt-24 md:pb-20 md:pt-28">

            {/* ── BACKGROUND — clean, single subtle grid ── */}
            <div className="pointer-events-none fixed inset-0 -z-10">
                <div className="hero-grid" />
                {/* Single very-low-opacity vignette — no colored orbs */}
                <div
                    className="absolute inset-0"
                    style={{ background: "radial-gradient(ellipse 100% 60% at 50% -10%, rgba(22,36,60,0.45) 0%, transparent 70%)" }}
                />
            </div>

            {/* ── HERO SECTION ── */}
            <motion.section
                className="clinical-page max-w-6xl mx-auto text-center"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants} className="space-y-5">

                    {/* Headline */}
                    <h1 className="text-4xl xs:text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.08] tracking-tight text-white max-w-5xl mx-auto">
                        {isArabic ? (
                            <>
                                منصة التحليل والفحص الذكي{" "}
                                <span className="bg-gradient-to-r from-cyan-300 via-cyan-200 to-emerald-300 bg-clip-text text-transparent">
                                    للأدوية والملصقات الطبية.
                                </span>
                            </>
                        ) : (
                            <>
                                Advanced Pharmaceutical{" "}
                                <span className="bg-gradient-to-r from-cyan-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
                                    Medication Intelligence.
                                </span>
                            </>
                        )}
                    </h1>

                    {/* Subtitle */}
                    <p className="text-sm sm:text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        {t(
                            "Scan prescription labels, extract active ingredients, verify clinical safety, and detect drug interactions — powered by AI.",
                            "التقط صورة ملصق الدواء، واستخرج المواد الفعالة، وتحقق من الجرعات والتداخلات الدوائية — بتقنية الذكاء الاصطناعي."
                        )}
                    </p>

                    {/* CTA Buttons */}
                    <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto">
                        <Link href="/scan" className="w-full sm:w-auto flex-1">
                            <button className="shiny-cta-btn w-full gap-3 px-7 sm:px-10 py-4 sm:py-4.5 text-sm sm:text-base font-black tracking-wide">
                                <ScanLine className="h-5 w-5 shrink-0 stroke-[2.5]" />
                                <span>{t("Start Medication Scan", "ابدأ فحص الدواء")}</span>
                            </button>
                        </Link>

                        <Link href="/ai" className="w-full sm:w-auto">
                            <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl border border-white/[0.10] bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/[0.18] text-white/80 hover:text-white font-semibold text-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5">
                                <Sparkles className="h-4 w-4 shrink-0 text-amber-400/80" />
                                <span>MATANY AI</span>
                                <ChevronRight className={cn("h-4 w-4 shrink-0 text-white/30", isArabic ? "rotate-180" : "")} />
                            </button>
                        </Link>
                    </div>

                    {/* Trust Indicators */}
                    <div className="pt-4 flex flex-wrap items-center justify-center gap-5 text-xs text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400/70" />
                            <span>{t("Instant Label OCR", "قراءة فورية للملصقات")}</span>
                        </div>
                        <div className="w-px h-3 bg-white/8" />
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400/70" />
                            <span>{t("FDA Verified Data", "مطابقة معتمدة مع FDA")}</span>
                        </div>
                        <div className="w-px h-3 bg-white/8" />
                        <div className="flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5 text-slate-400/70" />
                            <span>{t("Encrypted & Private", "حماية وخصوصية تامة")}</span>
                        </div>
                    </div>

                    {/* Partner Technologies Marquee Ticker */}
                    <div className="pt-8 sm:pt-12">
                        <AiPartnersMarquee />
                    </div>
                </motion.div>

                {/* ── MOCK CHAT PREVIEW ── */}
                <motion.div variants={itemVariants} className="mt-12 sm:mt-14">
                    <MockChatPreview isArabic={isArabic} />
                </motion.div>
            </motion.section>

            {/* ── STATS ── */}
            <section className="clinical-page max-w-4xl mx-auto mt-14 sm:mt-16">
                <div
                    className="rounded-2xl border p-8 sm:p-10"
                    style={{ background: "rgba(9, 14, 24, 0.85)", borderColor: "rgba(255,255,255,0.07)" }}
                >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-white/[0.05]">
                        {stats.map((item, i) => (
                            <StatItem key={item.label} value={item.value} label={item.label} delay={i * 0.1} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CORE CAPABILITIES ── */}
            <motion.section
                ref={pillarsRef}
                className="clinical-page max-w-6xl mx-auto mt-16 sm:mt-20"
                initial="hidden"
                animate={pillarsInView ? "visible" : "hidden"}
                variants={containerVariants}
            >
                <motion.div variants={fadeUpVariants} className="text-center mb-10">
                    <span className="clinical-eyebrow">{t("Core Capabilities", "القدرات الأساسية")}</span>
                    <h2 className="mt-4 text-2xl sm:text-3xl font-black text-white tracking-tight">
                        {t("Built for clinical-grade precision", "مبني لدقة المستوى الطبي")}
                    </h2>
                    <p className="mt-3 text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
                        {t(
                            "Every scan passes through a multi-stage AI verification pipeline backed by authoritative pharmaceutical data.",
                            "كل فحص يمر عبر خط تحقق متعدد المراحل مدعوم بالذكاء الاصطناعي وبيانات صيدلانية معتمدة."
                        )}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {pillars.map((pillar, i) => (
                        <motion.div key={pillar.title} variants={fadeUpVariants} custom={i}>
                            <GlassCard
                                className="p-6 sm:p-7 flex flex-col justify-between h-full"
                                hoverEffect={true}
                            >
                                <div>
                                    <div className={cn("icon-badge w-11 h-11 rounded-xl mb-5", pillar.badge)}>
                                        <pillar.icon className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-base font-bold text-white mb-2.5 tracking-tight">
                                        {pillar.title}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                                        {pillar.description}
                                    </p>
                                </div>

                                <div className="mt-6 pt-4 border-t border-white/[0.05] flex items-center gap-2">
                                    <span className={cn("w-1.5 h-1.5 rounded-full", pillar.dotColor)} />
                                    <span className={cn("text-xs font-semibold", pillar.tagColor)}>
                                        {t("Clinical Standard", "معايير معتمدة")}
                                    </span>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))}
                </div>
            </motion.section>

        </main>
    );
}
