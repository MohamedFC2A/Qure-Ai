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

const fadeUpVariants: Variants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 80, damping: 20 },
    },
};

/* ── Mock Chat Preview Component ── */
function MockChatPreview({ isArabic }: { isArabic: boolean }) {
    const messages = isArabic ? [
        { role: "user", text: "ما التداخلات الدوائية للميترفورمين مع الإيبوبروفين؟" },
        { role: "ai", text: "**تحذير تداخل دوائي مهم** — الاستخدام المتزامن للميتفورمين مع الإيبوبروفين قد يزيد خطر حماض اللاكتيك لدى المرضى الذين يعانون من قصور كلوي. يُنصح بمراقبة وظائف الكلى واستشارة الطبيب بديلاً." },
    ] : [
        { role: "user", text: "What are the interactions between Metformin and Ibuprofen?" },
        { role: "ai", text: "**Important Drug Interaction** — Concurrent use of Metformin with Ibuprofen may increase lactic acidosis risk in patients with renal impairment. Monitor kidney function and consult your doctor for safer alternatives." },
    ];

    return (
        <div className="w-full max-w-lg mx-auto">
            {/* Chat window frame */}
            <div
                className="rounded-2xl border border-white/[0.09] overflow-hidden"
                style={{
                    background: "rgba(6, 10, 18, 0.95)",
                    boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05) inset, 0 0 80px rgba(34,211,238,0.05)",
                }}
            >
                {/* Window chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]" style={{ background: "rgba(8,12,20,0.9)" }}>
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                    </div>
                    <div className="flex-1 flex justify-center">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-medium">
                            <div className="nexus-gold-logo w-4 h-4 rounded-md flex items-center justify-center">
                                <Sparkles className="w-2.5 h-2.5" style={{ color: "#1a0e00" }} />
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
                            initial={{ opacity: 0, x: msg.role === "user" ? 15 : -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + i * 0.3, type: "spring", stiffness: 100 }}
                            className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
                        >
                            {msg.role === "ai" && (
                                <div className="nexus-gold-logo w-6 h-6 rounded-lg shrink-0 flex items-center justify-center">
                                    <Sparkles className="w-3 h-3" style={{ color: "#1a0e00" }} />
                                </div>
                            )}
                            <div className={cn(
                                "max-w-[80%] rounded-xl px-3 py-2 text-[11px] leading-relaxed",
                                msg.role === "user"
                                    ? "bg-cyan-500/15 border border-cyan-400/20 text-white"
                                    : "border border-white/[0.07] text-slate-300"
                            )}
                                style={msg.role === "ai" ? { background: "rgba(12,20,35,0.9)" } : undefined}
                            >
                                <span dangerouslySetInnerHTML={{
                                    __html: msg.text.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                                }} />
                            </div>
                        </motion.div>
                    ))}

                    {/* Typing indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        className="flex items-center gap-2"
                    >
                        <div className="nexus-gold-logo w-6 h-6 rounded-lg shrink-0 flex items-center justify-center">
                            <Sparkles className="w-3 h-3" style={{ color: "#1a0e00" }} />
                        </div>
                        <div className="flex items-center gap-1 px-3 py-2 rounded-xl border border-white/[0.07]"
                            style={{ background: "rgba(12,20,35,0.9)" }}>
                            <span className="typing-dot" />
                            <span className="typing-dot" />
                            <span className="typing-dot" />
                        </div>
                    </motion.div>
                </div>

                {/* Input bar preview */}
                <div className="px-4 pb-4">
                    <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2.5"
                        style={{ background: "rgba(10,15,25,0.8)" }}>
                        <span className="text-[11px] text-white/20 flex-1">{isArabic ? "اسأل MATANY AI…" : "Ask MATANY AI…"}</span>
                        <div className="w-6 h-6 rounded-lg gold-send-btn flex items-center justify-center">
                            <ArrowRight className="w-3 h-3" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Stats Counter ── */
function StatItem({ value, label, delay }: { value: string; label: string; delay: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay, type: "spring", stiffness: 80 }}
            className="text-center"
        >
            <p className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-b from-white via-white to-slate-400 bg-clip-text text-transparent">
                {value}
            </p>
            <p className="mt-1.5 text-xs sm:text-sm font-medium text-slate-500">{label}</p>
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
            gradientFrom: "from-cyan-400/10",
            gradientVia: "via-cyan-400/5",
            borderHover: "hover:border-cyan-400/25",
            tagColor: "text-cyan-400",
            dotColor: "bg-cyan-400",
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
            gradientFrom: "from-emerald-400/10",
            gradientVia: "via-emerald-400/5",
            borderHover: "hover:border-emerald-400/25",
            tagColor: "text-emerald-400",
            dotColor: "bg-emerald-400",
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
            gradientFrom: "from-amber-400/10",
            gradientVia: "via-amber-400/5",
            borderHover: "hover:border-amber-400/25",
            tagColor: "text-amber-400",
            dotColor: "bg-amber-400",
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
            title: t("MATANY AI", "MATANY AI"),
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
        <main className="relative min-h-screen pb-24 pt-20 sm:pt-24 md:pb-20 md:pt-28 overflow-hidden">

            {/* ── AMBIENT BACKGROUND ── */}
            <div className="pointer-events-none fixed inset-0 -z-10">
                {/* Hero grid */}
                <div className="hero-grid" />
                {/* Orbs */}
                <div className="absolute top-[-15%] left-[10%] w-[600px] h-[600px] rounded-full opacity-30"
                    style={{ background: "radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 65%)", filter: "blur(60px)" }} />
                <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-25"
                    style={{ background: "radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 65%)", filter: "blur(80px)" }} />
                <div className="absolute bottom-[-10%] left-[30%] w-[600px] h-[400px] rounded-full opacity-20"
                    style={{ background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 65%)", filter: "blur(80px)" }} />
            </div>

            {/* ── HERO SECTION ── */}
            <motion.section
                className="clinical-page max-w-6xl mx-auto text-center"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants} className="space-y-5">

                    {/* Badge */}
                    <div className="flex justify-center mb-3">
                        <AiPartnersBadge />
                    </div>

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
                                <span className="relative">
                                    <span className="bg-gradient-to-r from-cyan-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
                                        Medication Intelligence.
                                    </span>
                                </span>
                            </>
                        )}
                    </h1>

                    {/* Subtitle */}
                    <p className="text-sm sm:text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed font-normal">
                        {t(
                            "Scan prescription labels, extract active ingredients, verify clinical safety, and detect drug interactions instantly — powered by AI.",
                            "التقط صورة ملصق الدواء، واستخرج المواد الفعالة، وتحقق من الجرعات والتداخلات الدوائية في ثوانٍ — بتقنية الذكاء الاصطناعي."
                        )}
                    </p>

                    {/* CTA Buttons */}
                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto">
                        <Link href="/scan" className="w-full sm:w-auto flex-1">
                            <button className="shiny-cta-btn w-full gap-3 px-7 sm:px-10 py-4 sm:py-5 text-sm sm:text-base font-black tracking-wide">
                                <ScanLine className="h-5 w-5 sm:h-5 sm:w-5 shrink-0 text-slate-950 stroke-[2.5]" />
                                <span>{t("Start Medication Scan", "ابدأ فحص الدواء")}</span>
                            </button>
                        </Link>

                        <Link href="/ai" className="w-full sm:w-auto">
                            <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 sm:py-5 rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] hover:bg-amber-400/[0.12] hover:border-amber-400/40 text-amber-200 font-bold text-sm sm:text-base backdrop-blur-xl shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 hover:shadow-amber-950/30 hover:shadow-xl">
                                <Sparkles className="h-4 w-4 shrink-0" />
                                <span>MATANY AI</span>
                                <ChevronRight className={cn("h-4 w-4 shrink-0 opacity-50", isArabic ? "rotate-180" : "")} />
                            </button>
                        </Link>
                    </div>

                    {/* Trust Indicators */}
                    <div className="pt-5 flex flex-wrap items-center justify-center gap-5 text-xs font-semibold text-slate-500">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                            <span>{t("Instant Label OCR", "قراءة فورية للملصقات")}</span>
                        </div>
                        <div className="w-px h-3 bg-white/10" />
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                            <span>{t("FDA Verified Data", "مطابقة معتمدة مع FDA")}</span>
                        </div>
                        <div className="w-px h-3 bg-white/10" />
                        <div className="flex items-center gap-2">
                            <Lock className="h-3.5 w-3.5 text-amber-400" />
                            <span>{t("Encrypted & Private", "حماية وخصوصية تامة")}</span>
                        </div>
                    </div>
                </motion.div>

                {/* ── MOCK CHAT PREVIEW ── */}
                <motion.div
                    variants={itemVariants}
                    className="mt-14 sm:mt-16"
                >
                    <div className="relative">
                        {/* Glow behind */}
                        <div className="absolute inset-0 blur-3xl opacity-25 pointer-events-none"
                            style={{ background: "radial-gradient(ellipse 80% 50% at 50% 70%, rgba(34,211,238,0.3), transparent)" }} />
                        <MockChatPreview isArabic={isArabic} />
                    </div>
                </motion.div>
            </motion.section>

            {/* ── STATS SECTION ── */}
            <section className="clinical-page max-w-4xl mx-auto mt-16 sm:mt-20">
                <GlassCard hoverEffect={false} className="p-6 sm:p-10 border-white/[0.07]">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-4 text-center divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-white/[0.06]">
                        {stats.map((item, i) => (
                            <StatItem key={item.label} value={item.value} label={item.label} delay={i * 0.1} />
                        ))}
                    </div>
                </GlassCard>
            </section>

            {/* ── CORE CAPABILITIES GRID ── */}
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
                    <p className="mt-3 text-sm text-slate-500 max-w-xl mx-auto">
                        {t(
                            "Every scan goes through a multi-stage verification pipeline powered by AI and authoritative pharmaceutical data.",
                            "كل فحص يمر عبر خط إنتاج تحقق متعدد المراحل مدعوم بالذكاء الاصطناعي وبيانات صيدلانية معتمدة."
                        )}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                    {pillars.map((pillar, i) => (
                        <motion.div
                            key={pillar.title}
                            variants={fadeUpVariants}
                            custom={i}
                        >
                            <GlassCard
                                className={cn(
                                    "p-6 sm:p-7 flex flex-col justify-between h-full transition-all duration-300",
                                    `bg-gradient-to-br ${pillar.gradientFrom} ${pillar.gradientVia} to-transparent`,
                                    pillar.borderHover
                                )}
                                hoverEffect={true}
                            >
                                <div>
                                    <div className={cn("icon-badge w-12 h-12 rounded-2xl mb-5", pillar.badge)}>
                                        <pillar.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-base sm:text-lg font-bold text-white mb-2.5 tracking-tight">
                                        {pillar.title}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                                        {pillar.description}
                                    </p>
                                </div>

                                <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs font-bold">
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

            {/* ── AI FEATURES ROW ── */}
            <section className="clinical-page max-w-6xl mx-auto mt-16 sm:mt-20">
                <div className="text-center mb-10">
                    <span className="eyebrow-gold">{t("AI-Powered Features", "مزايا مدعومة بالذكاء الاصطناعي")}</span>
                    <h2 className="mt-4 text-2xl sm:text-3xl font-black text-white tracking-tight">
                        {t("Everything you need to stay safe", "كل ما تحتاجه للبقاء بأمان")}
                    </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {aiFeatures.map((feature, i) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-60px" }}
                            transition={{ delay: i * 0.1, type: "spring", stiffness: 80 }}
                        >
                            <Link href={feature.href}>
                                <div className="group p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.14] transition-all duration-300 h-full cursor-pointer">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
                                            <feature.icon className="w-5 h-5 text-slate-300" />
                                        </div>
                                        <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border", feature.badge)}>
                                            {feature.badgeLabel}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-bold text-white mb-2">{feature.title}</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">{feature.description}</p>
                                    <div className={cn(
                                        "mt-4 flex items-center gap-1 text-xs font-semibold text-slate-600 group-hover:text-slate-300 transition-colors",
                                    )}>
                                        <span>{t("Learn more", "اعرف المزيد")}</span>
                                        <ArrowRight className={cn("w-3 h-3 transition-transform group-hover:translate-x-1", isArabic ? "rotate-180 group-hover:-translate-x-1 group-hover:translate-x-0" : "")} />
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── CLINICAL DISCLAIMER BAR ── */}
            <section className="clinical-page max-w-5xl mx-auto mt-12">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 80 }}
                    className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.03] p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
                >
                    <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-400 text-center sm:text-start max-w-lg">
                        <HeartPulse className="w-5 h-5 text-amber-400/70 shrink-0 hidden sm:block" />
                        <span>
                            {t(
                                "QURE AI is an informational safety review tool. Always verify critical medical decisions with a qualified doctor or pharmacist.",
                                "QURE AI هو أداة مراجعة وتحقق إرشادية. استشر طبيبك أو الصيدلي دائمًا قبل اتخاذ أي قرار علاجي."
                            )}
                        </span>
                    </div>
                    <Link href="/scan" className="shrink-0 w-full sm:w-auto">
                        <button className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-950/30 hover:shadow-amber-950/50 hover:-translate-y-0.5 active:translate-y-0">
                            {t("Scan Medication", "فحص الدواء")}
                        </button>
                    </Link>
                </motion.div>
            </section>

        </main>
    );
}
