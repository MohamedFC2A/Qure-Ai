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
    Brain,
    Lock,
    Globe,
    Activity,
    Pill,
    FlaskConical,
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

/* ── Product Preview Card ────────────────────────────────────────── */
function ProductPreview() {
    const { resultsLanguage } = useSettings();
    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    return (
        <div className="relative w-full max-w-xl mx-auto lg:max-w-none">
            {/* Ambient glows */}
            <div className="absolute -inset-4 rounded-3xl bg-cyan-400/10 blur-2xl pointer-events-none" />
            <div className="absolute -inset-4 rounded-3xl bg-violet-500/10 blur-3xl pointer-events-none" />

            <GlassCard variant="elevated" className="overflow-hidden" hoverEffect={false}>
                {/* Card header */}
                <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3.5 sm:px-5 sm:py-4">
                    <div>
                        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-400">
                            {t("Live Analysis", "تحليل فوري")}
                        </p>
                        <p className="mt-0.5 text-sm sm:text-base font-bold text-white">
                            {t("Ibuprofen 200 mg", "إيبوبروفين 200 ملغ")}
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-bold text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        <span>{t("Verified", "موثّق")}</span>
                    </div>
                </div>

                {/* Card body */}
                <div className="grid gap-3.5 sm:gap-4 p-4 sm:p-5 lg:grid-cols-[0.9fr_1.1fr]">
                    {/* Left: Scan extraction info */}
                    <div className="glass-inset rounded-xl p-3.5 sm:p-4">
                        <div className="flex items-center gap-3 mb-3.5">
                            <div className="icon-badge icon-badge-cyan w-9 h-9 sm:w-10 sm:h-10 rounded-xl shrink-0">
                                <ScanLine className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-semibold text-white truncate">
                                    {t("Image Intake", "التقاط الصورة")}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate">
                                    {t("Label text extracted", "تم استخراج نص الملصق")}
                                </p>
                            </div>
                        </div>

                        {/* Skeleton simulated lines */}
                        <div className="space-y-2 py-1">
                            <div className="h-2 w-full rounded-full bg-white/[0.08]" />
                            <div className="h-2 w-5/6 rounded-full bg-white/[0.08]" />
                            <div className="h-2 w-3/5 rounded-full bg-white/[0.08]" />
                        </div>

                        {/* Source check badges */}
                        <div className="mt-3.5 grid grid-cols-3 gap-1.5 text-center">
                            {[
                                { label: "OCR",             color: "cyan"    },
                                { label: t("FDA", "FDA"),   color: "emerald" },
                                { label: t("Web", "الويب"), color: "violet"  },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className={cn(
                                        "rounded-lg border px-1.5 py-1 text-[10px] sm:text-[11px] font-bold truncate",
                                        item.color === "cyan"
                                            ? "border-cyan-400/25 bg-cyan-400/10 text-cyan-300"
                                            : item.color === "emerald"
                                            ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                                            : "border-violet-400/25 bg-violet-400/10 text-violet-300"
                                    )}
                                >
                                    {item.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Results summary */}
                    <div className="space-y-3">
                        {/* Warning callout */}
                        <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.08] p-3 sm:p-3.5">
                            <div className="flex items-start gap-2.5">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                                <div>
                                    <p className="text-xs sm:text-sm font-bold text-white">
                                        {t("Safety Review", "مراجعة الأمان")}
                                    </p>
                                    <p className="mt-1 text-[11px] sm:text-xs leading-relaxed text-slate-300">
                                        {t(
                                            "NSAID cautions, overdose signs, and when to seek care.",
                                            "احتياطات مضادات الالتهاب، علامات الجرعة، وتوصيات الرعاية."
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Stat grid */}
                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="glass-inset rounded-xl p-2.5 sm:p-3">
                                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                                <p className="mt-1.5 text-xs font-bold text-white truncate">
                                    {t("Interactions", "التداخلات")}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate">
                                    {t("Context ready", "السياق جاهز")}
                                </p>
                            </div>
                            <div className="glass-inset rounded-xl p-2.5 sm:p-3">
                                <FileText className="h-4 w-4 text-violet-400" />
                                <p className="mt-1.5 text-xs font-bold text-white truncate">
                                    {t("Export", "التصدير")}
                                </p>
                                <p className="text-[10px] text-slate-400">PNG · PDF</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom progress bar */}
                <div className="border-t border-white/[0.08] px-4 py-2.5 sm:px-5 sm:py-3">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400">
                            {t("Analysis status", "حالة الفحص")}
                        </span>
                        <span className="text-[10px] sm:text-[11px] font-bold text-cyan-400">100%</span>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: "100%" }} />
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}

/* ── Floating Medical Background Icons ──────────────────────────── */
function FloatingIcons() {
    const icons = [
        { Icon: Pill,         x: "6%",  y: "12%", color: "text-cyan-400/20",    delay: 0   },
        { Icon: HeartPulse,   x: "90%", y: "18%", color: "text-rose-400/20",    delay: 1.2 },
        { Icon: FlaskConical, x: "4%",  y: "65%", color: "text-emerald-400/20", delay: 0.6 },
        { Icon: Brain,        x: "92%", y: "60%", color: "text-violet-400/20",  delay: 1.8 },
        { Icon: Activity,     x: "48%", y: "6%",  color: "text-amber-400/15",   delay: 0.9 },
        { Icon: ShieldCheck,  x: "82%", y: "85%", color: "text-cyan-400/15",    delay: 2.1 },
    ];

    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {icons.map(({ Icon, x, y, color, delay }, i) => (
                <motion.div
                    key={i}
                    className={cn("absolute hidden sm:block", color)}
                    style={{ left: x, top: y }}
                    animate={{ y: [0, -12, 0] }}
                    transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay }}
                >
                    <Icon className="w-6 h-6 lg:w-7 lg:h-7" />
                </motion.div>
            ))}
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
            label:  t("Capture", "التقاط"),
            text:   t("Extract label text from medication photos.", "استخراج نص الملصق من صور الأدوية."),
            color:  "cyan",
            number: "01",
        },
        {
            icon: Database,
            label:  t("Verify", "التحقق"),
            text:   t("Check openFDA and web signals when available.", "البحث والتدقيق في قواعد بيانات FDA وإشارات الويب."),
            color:  "emerald",
            number: "02",
        },
        {
            icon: FileText,
            label:  t("Report", "التقرير"),
            text:   t("Produce a readable safety review and next steps.", "إعداد مراجعة أمان منسقة وخطوات عمل واضحة."),
            color:  "violet",
            number: "03",
        },
    ];

    const trustSignals = [
        {
            value: t("3-step", "٣ خطوات"),
            label: t("scan workflow", "سير عمل الفحص"),
            color: "cyan",
        },
        {
            value: t("FDA", "FDA"),
            label: t("source checks", "التحقق من المصادر"),
            color: "emerald",
        },
        {
            value: t("Ultra", "ألترا"),
            label: t("private safety context", "سياق أمان خاص"),
            color: "amber",
        },
    ];

    const trustValueColors: Record<string, string> = {
        cyan:    "text-cyan-300",
        emerald: "text-emerald-300",
        amber:   "text-amber-300",
    };

    const workflowIconBadge: Record<string, string> = {
        cyan:    "icon-badge-cyan",
        emerald: "icon-badge-emerald",
        violet:  "icon-badge-violet",
    };

    const workflowBorder: Record<string, string> = {
        cyan:    "border-cyan-400/15 hover:border-cyan-400/35",
        emerald: "border-emerald-400/15 hover:border-emerald-400/35",
        violet:  "border-violet-400/15 hover:border-violet-400/35",
    };

    const workflowNumber: Record<string, string> = {
        cyan:    "text-cyan-400/20",
        emerald: "text-emerald-400/20",
        violet:  "text-violet-400/20",
    };

    return (
        <main className="relative min-h-screen pb-20 pt-20 sm:pt-24 md:pb-16 md:pt-28 overflow-hidden">
            <FloatingIcons />

            {/* ── HERO SECTION ──────────────────────────────────── */}
            <motion.section
                className="clinical-page grid min-h-[calc(100vh-12rem)] items-center gap-8 lg:gap-12 lg:grid-cols-[1fr_1fr]"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Text column */}
                <motion.div variants={itemVariants} className="max-w-2xl">
                    <div className="clinical-eyebrow">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>{t("Medication Intelligence", "ذكاء وتحليل الأدوية")}</span>
                    </div>

                    <h1 className="mt-5 text-3xl xs:text-4xl sm:text-5xl lg:text-[3.4rem] font-bold leading-[1.12] tracking-tight text-white">
                        {isArabic ? (
                            <>
                                حوّل ملصقات الأدوية إلى{" "}
                                <span className="bg-gradient-to-r from-cyan-300 via-cyan-200 to-emerald-300 bg-clip-text text-transparent">
                                    تقارير أمان واضحة وموثوقة.
                                </span>
                            </>
                        ) : (
                            <>
                                Turn medication labels into{" "}
                                <span className="bg-gradient-to-r from-cyan-300 via-cyan-200 to-emerald-300 bg-clip-text text-transparent">
                                    clear safety reports.
                                </span>
                            </>
                        )}
                    </h1>

                    <p className="mt-4 sm:mt-5 text-sm sm:text-base lg:text-lg leading-relaxed text-slate-300 max-w-xl">
                        {t(
                            "QURE AI extracts label text, verifies reliable signals, and organizes warnings, dosage notes, interactions, and source checks into one practical review.",
                            "يقوم QURE AI باستخراج نص الملصق، والتحقق من الإشارات الموثوقة، وتنسيق التحذيرات والجرعات والتداخلات في تقرير عملي موحد."
                        )}
                    </p>

                    {/* Action buttons */}
                    <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3">
                        <Link href="/scan" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full sm:w-auto gap-2.5 px-7 font-bold text-sm sm:text-base" glow>
                                <ScanLine className="h-5 w-5 shrink-0" />
                                <span>{t("Start Analysis", "ابدأ الفحص الآن")}</span>
                            </Button>
                        </Link>
                        <Link href="/pricing" className="w-full sm:w-auto">
                            <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2.5 px-6 font-semibold text-sm sm:text-base">
                                <span>{t("View Plans", "عرض الباقات")}</span>
                                <ArrowRight className={cn("h-4 w-4 shrink-0", isArabic ? "rotate-180" : "")} />
                            </Button>
                        </Link>
                    </div>

                    {/* Trust Signals Strip */}
                    <div className="mt-8 grid grid-cols-3 gap-2.5 sm:gap-3.5">
                        {trustSignals.map((item) => (
                            <div key={item.label} className="stat-card text-center">
                                <p className={cn("text-lg sm:text-2xl font-black tracking-tight", trustValueColors[item.color] || "text-white")}>
                                    {item.value}
                                </p>
                                <p className="mt-1 text-[10px] sm:text-xs font-semibold text-slate-400 truncate">
                                    {item.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Preview column */}
                <motion.div variants={itemVariants} className="relative w-full">
                    <ProductPreview />
                </motion.div>
            </motion.section>

            {/* ── WORKFLOW SECTION ──────────────────────────────── */}
            <section className="clinical-page mt-12 sm:mt-16 lg:mt-24">
                <div className="mb-8 sm:mb-10 text-center">
                    <p className="eyebrow-emerald mx-auto">
                        <Activity className="h-3.5 w-3.5" />
                        <span>{t("How it works", "كيف يعمل")}</span>
                    </p>
                    <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                        {t("Fast, Accurate 3-Step Verification", "فحص وتحقق سريع في ٣ خطوات")}
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
                    {workflow.map((item) => (
                        <motion.div
                            key={item.label}
                            className={cn(
                                "relative overflow-hidden rounded-2xl border p-5 sm:p-6 backdrop-blur-xl transition-all duration-300 group",
                                workflowBorder[item.color]
                            )}
                            style={{ background: "var(--q-glass-2)" }}
                            whileHover={{ y: -4 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Step number badge */}
                            <span className={cn(
                                "absolute top-3 end-4 text-5xl sm:text-6xl font-black leading-none select-none pointer-events-none",
                                workflowNumber[item.color]
                            )}>
                                {item.number}
                            </span>

                            <div className={cn(
                                "icon-badge w-11 h-11 rounded-xl mb-4",
                                workflowIconBadge[item.color]
                            )}>
                                <item.icon className="h-5 w-5" />
                            </div>

                            <h3 className="text-base sm:text-lg font-bold text-white">
                                {item.label}
                            </h3>
                            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-300">
                                {item.text}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── ABOUT & ULTRA PRO SECTION ─────────────────────── */}
            <section className="clinical-page mt-8 sm:mt-12 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
                {/* Clinical Review Card */}
                <GlassCard accent="emerald" hoverEffect={false} className="p-6 sm:p-8">
                    <div className="flex items-start gap-4">
                        <div className="icon-badge icon-badge-emerald w-11 h-11 sm:w-12 sm:h-12 rounded-xl shrink-0">
                            <HeartPulse className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
                                {t(
                                    "Designed for review, not diagnosis.",
                                    "مصمم للمراجعة، وليس للتشخيص الطّبي."
                                )}
                            </h3>
                            <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-300">
                                {t(
                                    "The interface prioritizes uncertainty, safety warnings, source confidence, and clear next steps so medication information is easier to verify with a clinician or pharmacist.",
                                    "تعطي الواجهة الأولوية لتحذيرات السلامة، وثقة المصادر، وخطوات واضحة للتحقق من معلومات الدواء مع الطبيب أو الصيدلي."
                                )}
                            </p>
                        </div>
                    </div>
                </GlassCard>

                {/* Ultra Pro Feature Card */}
                <GlassCard accent="amber" hoverEffect={false} className="p-6 sm:p-8" style={{ background: "rgba(245,158,11,0.05)" }}>
                    <div className="flex items-start gap-4">
                        <div className="icon-badge icon-badge-amber w-11 h-11 sm:w-12 sm:h-12 rounded-xl shrink-0">
                            <Zap className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
                                    {t("Ultra adds personal context.", "اشتراك ألترا يضيف سياقًا شخصيًا.")}
                                </h3>
                                <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-black">
                                    PRO
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
                                {t(
                                    "Private profiles, family care, medication memories, interaction guard, and exports are organized around the person being scanned for.",
                                    "يتم تنظيم الملفات الخاصة، رعاية الأسرة، ذكريات الأدوية، وحارس التداخلات حول الشخص الذي يتم فحصه."
                                )}
                            </p>
                            <div className="mt-4">
                                <Link href="/pricing">
                                    <Button variant="amber" size="sm" className="gap-2 font-bold">
                                        <span>{t("Explore Ultra", "استكشف ألترا")}</span>
                                        <ArrowRight className={cn("h-4 w-4 shrink-0", isArabic ? "rotate-180" : "")} />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </section>

            {/* ── SECURITY STRIP ────────────────────────────────── */}
            <section className="clinical-page mt-8 sm:mt-12">
                <GlassCard hoverEffect={false} className="p-6 sm:p-8">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        {[
                            {
                                icon:  Lock,
                                title: t("Private by default", "خاص افتراضيًا"),
                                text:  t("No health data shared without consent.", "لا تتم مشاركة البيانات بدون موافقة."),
                                color: "violet",
                            },
                            {
                                icon:  Globe,
                                title: t("Multi-source checks", "تحقق متعدد المصادر"),
                                text:  t("FDA, openFDA, and web signals cross-checked.", "قواعد FDA وإشارات الويب يتم التحقق منها."),
                                color: "cyan",
                            },
                            {
                                icon:  ShieldCheck,
                                title: t("Always transparent", "شفافية وأمان"),
                                text:  t("Informational tool for review & safety.", "أداة مراجعة للمعلومات والسلامة الدوائية."),
                                color: "emerald",
                            },
                        ].map((item) => (
                            <div key={item.title} className="flex items-start gap-3.5">
                                <div className={cn("icon-badge w-10 h-10 rounded-xl shrink-0", `icon-badge-${item.color}`)}>
                                    <item.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-white text-sm">{item.title}</p>
                                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">{item.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </section>
        </main>
    );
}
