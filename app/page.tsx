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

const floatVariants: Variants = {
    animate: {
        y: [0, -10, 0],
        transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
    },
};

/* ── Product Preview Mock ───────────────────────────────────────── */
function ProductPreview() {
    const { resultsLanguage } = useSettings();
    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    return (
        <div className="relative">
            {/* Ambient glow behind card */}
            <div className="absolute -inset-6 rounded-3xl bg-cyan-400/5 blur-2xl pointer-events-none" />
            <div className="absolute -inset-6 rounded-3xl bg-violet-500/4 blur-3xl pointer-events-none" />

            <GlassCard variant="elevated" className="overflow-hidden" hoverEffect={false}>
                {/* Card header */}
                <div className={cn(
                    "flex items-center justify-between border-b border-white/[0.06] px-5 py-4",
                    isArabic ? "flex-row-reverse" : ""
                )}>
                    <div className={isArabic ? "text-right" : ""}>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-400/80">
                            {t("Live Analysis", "تحليل مباشر")}
                        </p>
                        <p className="mt-1 text-sm font-bold text-white">
                            {t("Ibuprofen 200 mg", "إيبوبروفين 200 ملغ")}
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {t("Verified", "موثّق")}
                    </div>
                </div>

                {/* Card body */}
                <div className="grid gap-4 p-5 lg:grid-cols-[0.9fr_1.1fr]">
                    {/* Left: scan info */}
                    <div className="glass-inset rounded-xl p-4">
                        <div className={cn("flex items-center gap-3 mb-4", isArabic ? "flex-row-reverse" : "")}>
                            <div className="icon-badge icon-badge-cyan w-10 h-10 rounded-xl">
                                <ScanLine className="h-5 w-5" />
                            </div>
                            <div className={isArabic ? "text-right" : ""}>
                                <p className="text-sm font-semibold text-white">
                                    {t("Image Intake", "التقاط الصورة")}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {t("Label text extracted", "تم استخراج نص الملصق")}
                                </p>
                            </div>
                        </div>

                        {/* Skeleton lines */}
                        <div className="space-y-2">
                            <div className="h-2 w-full rounded-full bg-white/[0.06]" />
                            <div className="h-2 w-5/6 rounded-full bg-white/[0.06]" />
                            <div className="h-2 w-3/5 rounded-full bg-white/[0.06]" />
                        </div>

                        {/* Source tags */}
                        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                            {[
                                { label: "OCR",             color: "cyan"    },
                                { label: t("FDA", "FDA"),   color: "emerald" },
                                { label: t("Web", "الويب"), color: "violet"  },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className={cn(
                                        "rounded-lg border px-2 py-1.5 text-[11px] font-bold",
                                        item.color === "cyan"
                                            ? "border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-300"
                                            : item.color === "emerald"
                                            ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300"
                                            : "border-violet-400/20 bg-violet-400/[0.06] text-violet-300"
                                    )}
                                >
                                    {item.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: results */}
                    <div className="space-y-3">
                        {/* Warning card */}
                        <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4">
                            <div className={cn("flex items-start gap-3", isArabic ? "flex-row-reverse" : "")}>
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                                <div className={isArabic ? "text-right" : ""}>
                                    <p className="text-sm font-bold text-white">
                                        {t("Safety Review", "مراجعة الأمان")}
                                    </p>
                                    <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                                        {t(
                                            "NSAID cautions, overdose signs, and when to seek care.",
                                            "احتياطات NSAID، علامات الجرعة الزائدة، ومتى تطلب الرعاية."
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Stat grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="glass-inset rounded-xl p-3">
                                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                                <p className="mt-2 text-xs font-bold text-white">
                                    {t("Interactions", "التداخلات")}
                                </p>
                                <p className="text-[10px] text-slate-500">
                                    {t("Context ready", "السياق جاهز")}
                                </p>
                            </div>
                            <div className="glass-inset rounded-xl p-3">
                                <FileText className="h-4 w-4 text-violet-400" />
                                <p className="mt-2 text-xs font-bold text-white">
                                    {t("Export", "التصدير")}
                                </p>
                                <p className="text-[10px] text-slate-500">PNG · PDF</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom progress bar */}
                <div className="border-t border-white/[0.05] px-5 py-3">
                    <div className={cn("flex items-center justify-between mb-2", isArabic ? "flex-row-reverse" : "")}>
                        <span className="text-[10px] font-semibold text-slate-500">
                            {t("Analysis complete", "اكتمل التحليل")}
                        </span>
                        <span className="text-[10px] font-bold text-cyan-400">100%</span>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: "100%" }} />
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}

/* ── Floating Medical Icons Background ─────────────────────────── */
function FloatingIcons() {
    const icons = [
        { Icon: Pill,         x: "8%",  y: "15%", color: "text-cyan-400/20",    delay: 0   },
        { Icon: HeartPulse,   x: "88%", y: "20%", color: "text-rose-400/20",    delay: 1.2 },
        { Icon: FlaskConical, x: "5%",  y: "70%", color: "text-emerald-400/20", delay: 0.6 },
        { Icon: Brain,        x: "92%", y: "65%", color: "text-violet-400/20",  delay: 1.8 },
        { Icon: Activity,     x: "50%", y: "5%",  color: "text-amber-400/15",   delay: 0.9 },
        { Icon: ShieldCheck,  x: "80%", y: "88%", color: "text-cyan-400/15",    delay: 2.1 },
    ];

    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {icons.map(({ Icon, x, y, color, delay }, i) => (
                <motion.div
                    key={i}
                    className={cn("absolute", color)}
                    style={{ left: x, top: y }}
                    animate={{ y: [0, -14, 0] }}
                    transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay }}
                >
                    <Icon className="w-7 h-7" />
                </motion.div>
            ))}
        </div>
    );
}

/* ── Main Page ──────────────────────────────────────────────────── */
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
            value: t("3-step",   "٣ خطوات"),
            label: t("scan workflow",         "سير عمل الفحص"),
            color: "cyan",
        },
        {
            value: t("FDA",   "FDA"),
            label: t("source checks",         "التحقق من المصادر"),
            color: "emerald",
        },
        {
            value: t("Ultra",  "ألترا"),
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
        cyan:    "border-cyan-400/12 hover:border-cyan-400/25",
        emerald: "border-emerald-400/12 hover:border-emerald-400/25",
        violet:  "border-violet-400/12 hover:border-violet-400/25",
    };

    const workflowNumber: Record<string, string> = {
        cyan:    "text-cyan-400/30",
        emerald: "text-emerald-400/30",
        violet:  "text-violet-400/30",
    };

    return (
        <main
            className={cn(
                "relative min-h-screen pb-24 pt-24 md:pb-16 md:pt-28 overflow-hidden",
                isArabic ? "font-arabic" : ""
            )}
            dir={isArabic ? "rtl" : "ltr"}
        >
            <FloatingIcons />

            {/* ── HERO SECTION ──────────────────────────────────── */}
            <motion.section
                className="clinical-page grid min-h-[calc(100vh-10rem)] items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Left column */}
                <motion.div
                    variants={itemVariants}
                    className={cn("max-w-2xl", isArabic ? "lg:order-2 text-right" : "")}
                >
                    <div className="clinical-eyebrow">
                        <Sparkles className="h-3.5 w-3.5" />
                        {t("Medication intelligence", "ذكاء وتحليل الأدوية")}
                    </div>

                    <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
                        {isArabic ? (
                            <>
                                حوّل ملصقات الأدوية إلى{" "}
                                <span className="bg-gradient-to-r from-cyan-300 via-cyan-200 to-emerald-300 bg-clip-text text-transparent">
                                    تقارير أمان واضحة.
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

                    <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
                        {t(
                            "QURE AI extracts label text, verifies reliable signals, and organizes warnings, dosage notes, interactions, and source checks into one practical review.",
                            "يقوم QURE AI باستخراج نص الملصق، والتحقق من الإشارات الموثوقة، وتنسيم التحذيرات والجرعات والتداخلات في تقرير عملي موحد."
                        )}
                    </p>

                    <div className={cn(
                        "mt-8 flex flex-col gap-3 sm:flex-row",
                        isArabic ? "sm:flex-row-reverse" : ""
                    )}>
                        <Link href="/scan" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full gap-2.5 px-7 font-semibold" glow>
                                <ScanLine className="h-5 w-5" />
                                {t("Start Analysis", "ابدأ الفحص الآن")}
                            </Button>
                        </Link>
                        <Link href="/pricing" className="w-full sm:w-auto">
                            <Button variant="outline" size="lg" className="w-full gap-2.5 px-7">
                                {t("View Plans", "عرض الباقات")}
                                <ArrowRight className={cn("h-4 w-4", isArabic ? "rotate-180" : "")} />
                            </Button>
                        </Link>
                    </div>

                    {/* Trust Signals */}
                    <div className="mt-8 grid grid-cols-3 gap-3">
                        {trustSignals.map((item) => (
                            <div
                                key={item.label}
                                className="stat-card text-center"
                            >
                                <p className={cn(
                                    "text-xl font-bold tracking-tight",
                                    trustValueColors[item.color] || "text-white"
                                )}>
                                    {item.value}
                                </p>
                                <p className="mt-1 text-[11px] leading-tight text-slate-600">
                                    {item.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Right column — Product Preview */}
                <motion.div
                    variants={itemVariants}
                    className={cn("relative", isArabic ? "lg:order-1" : "")}
                >
                    <ProductPreview />
                </motion.div>
            </motion.section>

            {/* ── WORKFLOW SECTION ──────────────────────────────── */}
            <section className="clinical-page mt-8 md:mt-12">
                <div className={cn("mb-8 text-center", isArabic ? "text-right text-center" : "")}>
                    <p className="eyebrow-emerald mx-auto justify-center">
                        <Activity className="h-3.5 w-3.5" />
                        {t("How it works", "كيف يعمل")}
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {workflow.map((item) => (
                        <motion.div
                            key={item.label}
                            className={cn(
                                "relative overflow-hidden rounded-2xl border p-6 backdrop-blur-xl transition-all duration-300 group",
                                workflowBorder[item.color]
                            )}
                            style={{
                                background: "var(--q-glass-2)",
                            }}
                            whileHover={{ y: -3 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Large step number background */}
                            <span className={cn(
                                "absolute right-4 top-4 text-6xl font-black leading-none select-none pointer-events-none",
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

                            <h2 className={cn(
                                "text-base font-bold text-white",
                                isArabic ? "text-right" : ""
                            )}>
                                {item.label}
                            </h2>
                            <p className={cn(
                                "mt-2 text-sm leading-relaxed text-slate-500",
                                isArabic ? "text-right" : ""
                            )}>
                                {item.text}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── ABOUT SECTION ─────────────────────────────────── */}
            <section className="clinical-page mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Review card */}
                <GlassCard accent="emerald" hoverEffect={false} className="p-6 sm:p-8">
                    <div className={cn("flex items-start gap-4", isArabic ? "flex-row-reverse" : "")}>
                        <div className="icon-badge icon-badge-emerald w-12 h-12 rounded-xl shrink-0">
                            <HeartPulse className="h-6 w-6" />
                        </div>
                        <div className={isArabic ? "text-right" : ""}>
                            <h2 className="text-xl font-bold text-white leading-tight">
                                {t(
                                    "Designed for review, not diagnosis.",
                                    "مصمم للمراجعة، وليس للتشخيص الطّبي."
                                )}
                            </h2>
                            <p className="mt-3 text-sm leading-relaxed text-slate-400">
                                {t(
                                    "The interface prioritizes uncertainty, safety warnings, source confidence, and clear next steps so medication information is easier to verify with a clinician or pharmacist.",
                                    "تعطي الواجهة الأولوية لتحذيرات السلامة، وثقة المصادر، وخطوات واضحة للتحقق من معلومات الدواء مع الطبيب أو الصيدلي."
                                )}
                            </p>
                        </div>
                    </div>
                </GlassCard>

                {/* Ultra card */}
                <GlassCard accent="amber" hoverEffect={false} className="p-6 sm:p-8" style={{ background: "rgba(245,158,11,0.04)" }}>
                    <div className={cn("flex items-start gap-4", isArabic ? "flex-row-reverse" : "")}>
                        <div className="icon-badge icon-badge-amber w-12 h-12 rounded-xl shrink-0">
                            <Zap className="h-6 w-6" />
                        </div>
                        <div className={isArabic ? "text-right" : ""}>
                            <div className={cn("flex items-center gap-2 mb-2", isArabic ? "flex-row-reverse" : "")}>
                                <h2 className="text-xl font-bold text-white leading-tight">
                                    {t("Ultra adds personal context.", "اشتراك ألترا يضيف سياقًا شخصيًا.")}
                                </h2>
                                <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-black">
                                    PRO
                                </span>
                            </div>
                            <p className="text-sm leading-relaxed text-slate-400">
                                {t(
                                    "Private profiles, family care, medication memories, interaction guard, and exports are organized around the person being scanned for.",
                                    "يتم تنظيم الملفات الخاصة، رعاية الأسرة، ذكريات الأدوية، وحارس التداخلات حول الشخص الذي يتم فحصه."
                                )}
                            </p>
                            <Link href="/pricing" className={cn("mt-4 inline-flex", isArabic ? "flex-row-reverse" : "")}>
                                <Button variant="amber" size="sm" className="gap-2 mt-4">
                                    {t("Explore Ultra", "استكشف ألترا")}
                                    <ArrowRight className={cn("h-4 w-4", isArabic ? "rotate-180" : "")} />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </GlassCard>
            </section>

            {/* ── SECURITY SECTION ──────────────────────────────── */}
            <section className="clinical-page mt-6">
                <GlassCard hoverEffect={false} className="p-6 sm:p-8">
                    <div className={cn(
                        "grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto_1fr_auto_1fr]",
                        "items-center"
                    )}>
                        {[
                            {
                                icon:  Lock,
                                title: t("Private by default",   "خاص افتراضيًا"),
                                text:  t("No data shared without consent.", "لا تتم مشاركة البيانات بدون موافقة."),
                                color: "violet",
                            },
                            {
                                icon:  Globe,
                                title: t("Multi-source verification",  "تحقق متعدد المصادر"),
                                text:  t("FDA, openFDA, and web signals cross-checked.", "FDA وإشارات الويب يتم التحقق منها."),
                                color: "cyan",
                            },
                            {
                                icon:  ShieldCheck,
                                title: t("Always transparent",  "شفافية دائمة"),
                                text:  t("Review tool — not a replacement for medical advice.", "أداة مراجعة — ليست بديلًا عن المشورة الطبية."),
                                color: "emerald",
                            },
                        ].map((item, i) => (
                            <>
                                <div key={item.title} className={cn("flex items-start gap-4", isArabic ? "flex-row-reverse text-right" : "")}>
                                    <div className={cn("icon-badge w-10 h-10 rounded-xl shrink-0", `icon-badge-${item.color}`)}>
                                        <item.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-sm">{item.title}</p>
                                        <p className="mt-1 text-xs text-slate-500 leading-relaxed">{item.text}</p>
                                    </div>
                                </div>
                                {i < 2 && (
                                    <div key={`divider-${i}`} className="hidden md:block w-px h-10 bg-white/[0.06] mx-auto" />
                                )}
                            </>
                        ))}
                    </div>
                </GlassCard>
            </section>
        </main>
    );
}
