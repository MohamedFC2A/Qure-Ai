"use client";

import { Button } from "@/components/ui/Button";
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
} from "lucide-react";
import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { useSettings } from "@/context/SettingsContext";

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.12 },
    },
};

const itemVariants: Variants = {
    hidden: { y: 16, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 110, damping: 18 },
    },
};

function ProductPreview() {
    const { resultsLanguage } = useSettings();
    const isArabic = resultsLanguage === 'ar';
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    return (
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/80">{t("Live analysis", "تحليل مباشر")}</p>
                    <p className="mt-1 text-sm font-bold text-white">{t("Ibuprofen 200 mg", "إيبوبروفين 200 ملغ")}</p>
                </div>
                <div className="rounded-lg border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                    {t("Verified", "موثّق")}
                </div>
            </div>

            <div className="grid gap-4 p-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-lg border border-white/10 bg-slate-900/65 p-4">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-300 text-slate-950">
                            <ScanLine className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">{t("Image intake", "التقاط الصورة")}</p>
                            <p className="text-xs text-slate-400">{t("Label text extracted", "تم استخراج نص الملصق")}</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-2.5 w-full rounded-full bg-white/10" />
                        <div className="h-2.5 w-5/6 rounded-full bg-white/10" />
                        <div className="h-2.5 w-3/5 rounded-full bg-white/10" />
                    </div>
                    <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                        {["OCR", t("FDA", "منظمة الغذاء"), t("Web", "الويب")].map((item) => (
                            <div key={item} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-2 text-[11px] font-semibold text-slate-300">
                                {item}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" />
                            <div>
                                <p className="text-sm font-bold text-white">{t("Safety review", "مراجعة الأمان")}</p>
                                <p className="mt-1 text-xs leading-relaxed text-slate-300">
                                    {t("Review stomach bleeding risk, NSAID cautions, overdose signs, and when to seek care.", "مراجعة مخاطر نزيف المعدة، احتياطات مضادات الالتهاب، علامات الجرعة الزائدة، ومتى تطلب الرعاية.")}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                            <ShieldCheck className="h-4 w-4 text-emerald-200" />
                            <p className="mt-2 text-xs font-semibold text-white">{t("Interactions", "التداخلات")}</p>
                            <p className="text-[11px] text-slate-400">{t("Care context ready", "سياق الرعاية جاهز")}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                            <CheckCircle2 className="h-4 w-4 text-cyan-200" />
                            <p className="mt-2 text-xs font-semibold text-white">{t("Export", "التصدير")}</p>
                            <p className="text-[11px] text-slate-400">{t("PNG and PDF", "صور وتقارير PDF")}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Home() {
    const { resultsLanguage } = useSettings();
    const isArabic = resultsLanguage === 'ar';
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    const workflow = [
        { icon: ScanLine, label: t("Capture", "التقاط"), text: t("Extract label text from medication photos.", "استخراج نص الملصق من صور الأدوية المعنية.") },
        { icon: Database, label: t("Verify", "التحقق من FDA"), text: t("Check openFDA and web signals when available.", "البحث والتدقيق في قواعد بيانات FDA وإشارات الويب.") },
        { icon: FileText, label: t("Report", "تقرير شامل"), text: t("Produce a readable safety review and next steps.", "إعداد مراجعة أمان منسقة وسهلة القراءة مع خطوات العمل القادمة.") },
    ];

    const trustSignals = [
        { value: t("3-step", "٣ خطوات"), label: t("scan workflow", "سير عمل الفحص") },
        { value: t("FDA", "FDA"), label: t("source checks", "التحقق من المصادر") },
        { value: t("Ultra", "ألترا"), label: t("private safety context", "سياق أمان صحي خاص") },
    ];

    return (
        <main className="min-h-screen pb-24 pt-24 md:pb-16 md:pt-28">
            <motion.section
                className="clinical-page grid min-h-[calc(100vh-8rem)] items-center gap-8 lg:grid-cols-[0.92fr_1.08fr]"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants} className="max-w-2xl">
                    <div className="clinical-eyebrow">
                        <Sparkles className="h-3.5 w-3.5" />
                        {t("Medication intelligence", "ذكاء وتحليل الأدوية")}
                    </div>
                    <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                        {t("Turn medication labels into clear safety reports.", "حول ملصقات الأدوية إلى تقارير أمان واضحة.")}
                    </h1>
                    <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
                        {t("QURE AI extracts label text, verifies reliable signals, and organizes warnings, dosage notes, interactions, and source checks into one practical review.", "يقوم QURE AI باستخراج نص الملصق، والتحقق من الإشارات الموثوقة، وتنسيق التحذيرات، والجرعات، والتداخلات الدوائية في تقرير عملي موحد.")}
                    </p>

                    <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                        <Link href="/scan" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full gap-2 px-7">
                                <ScanLine className="h-5 w-5" />
                                {t("Start analysis", "ابدأ الفحص الآن")}
                            </Button>
                        </Link>
                        <Link href="/pricing" className="w-full sm:w-auto">
                            <Button variant="outline" size="lg" className="w-full gap-2 px-7">
                                {t("View plans", "عرض الباقات")}
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>

                    <div className="mt-8 grid grid-cols-3 gap-3">
                        {trustSignals.map((item) => (
                            <div key={item.label} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                                <p className="text-lg font-bold text-white">{item.value}</p>
                                <p className="mt-1 text-xs leading-tight text-slate-500">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="relative">
                    <div className="absolute -inset-4 rounded-2xl bg-cyan-300/5 blur-2xl" />
                    <ProductPreview />
                </motion.div>
            </motion.section>

            <section className="clinical-page mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                {workflow.map((item) => (
                    <div key={item.label} className="clinical-panel p-5">
                        <item.icon className="h-5 w-5 text-cyan-200" />
                        <h2 className="mt-4 text-base font-bold text-white">{item.label}</h2>
                        <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.text}</p>
                    </div>
                ))}
            </section>

            <section className="clinical-page mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="clinical-panel p-6">
                    <HeartPulse className="h-6 w-6 text-emerald-200" />
                    <h2 className="mt-4 text-2xl font-bold text-white">{t("Designed for review, not diagnosis.", "مصمم للمراجعة، وليس للتشخيص الطّبي.")}</h2>
                    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">
                        {t("The interface prioritizes uncertainty, safety warnings, source confidence, and clear next steps so medication information is easier to verify with a clinician or pharmacist.", "تعطي الواجهة الأولوية لتحذيرات السلامة، وثقة المصادر، وخطوات واضحة للتأكد من معلومات الدواء والتحقق منها مع الطبيب أو الصيدلي.")}
                    </p>
                </div>
                <div className="clinical-panel p-6">
                    <Zap className="h-6 w-6 text-amber-200" />
                    <h2 className="mt-4 text-2xl font-bold text-white">{t("Ultra adds personal context.", "اشتراك ألترا يضيف سياقاً شخصياً.")}</h2>
                    <p className="mt-3 text-sm leading-relaxed text-slate-400">
                        {t("Private profiles, family care, medication memories, interaction guard, and exports are organized around the person being scanned for.", "يتم تنظيم الملفات الشخصية الخاصة، رعاية الأسرة، ذكريات الأدوية، وحارس التداخلات، والتصدير حول الشخص الذي يتم فحصه بذكاء ودقة.")}
                    </p>
                </div>
            </section>
        </main>
    );
}
