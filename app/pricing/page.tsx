"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowRight,
    Check,
    Clock,
    FileText,
    Gift,
    Globe,
    HeartPulse,
    Lock,
    Shield,
    Sparkles,
    Users,
    Zap,
    ChevronDown,
    ChevronUp,
    Star,
    Brain,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { useUser } from "@/context/UserContext";
import { useSettings } from "@/context/SettingsContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const freeFeatures = [
    { en: "100 credits that do not expire",            ar: "١٠٠ رصيد لا تنتهي صلاحيته"              },
    { en: "Medication OCR and core analysis",          ar: "OCR الأدوية والتحليل الأساسي"            },
    { en: "Basic openFDA and web verification",        ar: "التحقق الأساسي من FDA والويب"            },
    { en: "Saved scan history",                        ar: "حفظ سجل الفحص"                          },
];

const ultraFeatures = [
    { en: "Up to 2000 credits per month",              ar: "حتى ٢٠٠٠ رصيد شهريًا"                   },
    { en: "Private health profile and medication memories", ar: "ملف صحي خاص وذاكرة الأدوية"       },
    { en: "Family and caregiver profiles",             ar: "ملفات الأسرة ومقدمي الرعاية"            },
    { en: "Advanced safety and interaction guard",     ar: "حارس التداخل والأمان المتقدم"           },
    { en: "PNG and high-quality PDF exports",          ar: "تصدير PNG وتقارير PDF عالية الجودة"     },
];

const comparisonRows = [
    { en: "Core medication analysis",             ar: "التحليل الأساسي للأدوية",         free: true,    ultra: true        },
    { en: "openFDA and web verification",         ar: "التحقق من FDA والويب",            free: true,    ultra: true        },
    { en: "Medication history",                   ar: "سجل الأدوية",                    free: true,    ultra: true        },
    { en: "Private health profile",               ar: "الملف الصحي الخاص",              free: false,   ultra: true        },
    { en: "Family/caregiver mode",                ar: "وضع العائلة/مقدم الرعاية",       free: false,   ultra: true        },
    { en: "Medication memory and interaction guard", ar: "ذاكرة الأدوية وحارس التداخل", free: false,   ultra: true        },
    { en: "Smart follow-up question tree",        ar: "شجرة أسئلة المتابعة الذكية",     free: false,   ultra: true        },
    { en: "Export",                               ar: "التصدير",                        free: "PNG",   ultra: "PNG + PDF" },
    { en: "Monthly usage",                        ar: "الاستخدام الشهري",               free: "100",   ultra: "2000"      },
];

const valueCards = [
    {
        icon:  HeartPulse,
        color: "emerald",
        en:    { title: "Safety context",   text: "Warnings are easier to review when the app knows allergies, conditions, and current medications." },
        ar:    { title: "سياق الأمان",     text: "التحذيرات أسهل للمراجعة عندما يعرف التطبيق الحساسية والحالات الصحية والأدوية الحالية." },
    },
    {
        icon:  Users,
        color: "violet",
        en:    { title: "Family profiles",  text: "Keep scans separated for yourself, a parent, or another person you care for." },
        ar:    { title: "ملفات الأسرة",   text: "احتفظ بفحوصات منفصلة لك، لأحد والديك، أو لشخص تهتم بصحته." },
    },
    {
        icon:  FileText,
        color: "cyan",
        en:    { title: "Cleaner reports",  text: "Export results for later review with a pharmacist, doctor, or caregiver." },
        ar:    { title: "تقارير أوضح",    text: "صدّر النتائج لمراجعة لاحقة مع الصيدلي أو الطبيب أو مقدم الرعاية." },
    },
];

const faqs = [
    {
        q: { en: "Is the free plan sufficient?",    ar: "هل الخطة المجانية كافية؟"        },
        a: { en: "Yes for trying and basic analysis. Ultra is better if you want health customization, medication memory, and stronger exports.", ar: "نعم للتجربة والتحليل الأساسي. Ultra أفضل إذا كنت تريد تخصيصًا صحيًا، ذاكرة أدوية، وتصديرًا أقوى." },
    },
    {
        q: { en: "Are results a replacement for a doctor?", ar: "هل النتائج بديل للطبيب؟" },
        a: { en: "No. Results help you understand and review, but important medical decisions must be confirmed with a specialist.", ar: "لا. النتائج تساعدك على الفهم والمراجعة، لكن القرارات الطبية المهمة يجب تأكيدها مع مختص." },
    },
    {
        q: { en: "Can it be used for the family?",   ar: "هل يمكن استخدامه للعائلة؟"      },
        a: { en: "Yes in Ultra through separate profiles so medication memory and history don't mix between people.", ar: "نعم في Ultra عبر ملفات منفصلة حتى لا تختلط ذاكرة الأدوية والسجل بين الأشخاص." },
    },
];

/* ── Feature check list ────────────────────────────────────────── */
function FeatureList({ items, accent, isArabic }: { items: { en: string; ar: string }[]; accent: "cyan" | "amber"; isArabic: boolean }) {
    return (
        <ul className="space-y-3">
            {items.map((item, i) => (
                <li key={i} className={cn("flex items-start gap-3 text-sm text-slate-400", isArabic ? "flex-row-reverse text-right" : "")}>
                    <span className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                        accent === "amber"
                            ? "border-amber-400/25 bg-amber-400/10 text-amber-300"
                            : "border-cyan-400/25 bg-cyan-400/10 text-cyan-300"
                    )}>
                        <Check className="h-3 w-3" />
                    </span>
                    <span>{isArabic ? item.ar : item.en}</span>
                </li>
            ))}
        </ul>
    );
}

/* ── Comparison cell ───────────────────────────────────────────── */
function ComparisonValue({ value, highlighted = false }: { value: boolean | string; highlighted?: boolean }) {
    if (typeof value === "boolean") {
        return value ? (
            <Check className={cn("h-4 w-4", highlighted ? "text-amber-400" : "text-cyan-400")} />
        ) : (
            <Lock className="h-4 w-4 text-white/20" />
        );
    }
    return <span className={cn("text-sm font-semibold", highlighted ? "text-amber-300" : "text-slate-400")}>{value}</span>;
}

/* ── FAQ Item ──────────────────────────────────────────────────── */
function FaqItem({ q, a, isArabic }: { q: { en: string; ar: string }; a: { en: string; ar: string }; isArabic: boolean }) {
    const [open, setOpen] = useState(false);
    return (
        <div className={cn(
            "rounded-2xl border border-white/[0.07] overflow-hidden transition-colors",
            open ? "border-white/12" : "hover:border-white/10"
        )}
            style={{ background: "var(--q-glass-2)" }}>
            <button
                className={cn(
                    "w-full flex items-center justify-between gap-4 p-5 text-left",
                    isArabic ? "flex-row-reverse text-right" : ""
                )}
                onClick={() => setOpen(!open)}
            >
                <span className="font-semibold text-white text-sm">{isArabic ? q.ar : q.en}</span>
                {open
                    ? <ChevronUp className="h-4 w-4 text-slate-500 shrink-0" />
                    : <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
                }
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                        <div className={cn("px-5 pb-5 text-sm text-slate-500 leading-relaxed", isArabic ? "text-right" : "")}>
                            {isArabic ? a.ar : a.en}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ── Main Page ──────────────────────────────────────────────────── */
export default function PricingPage() {
    const { plan, loading } = useUser();
    const { resultsLanguage } = useSettings();
    const router = useRouter();

    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    const handlePurchase = () => router.push("/billing");

    const iconBadgeMap: Record<string, string> = {
        cyan:    "icon-badge-cyan",
        emerald: "icon-badge-emerald",
        violet:  "icon-badge-violet",
    };

    return (
        <main
            className={cn("min-h-screen px-4 pb-28 pt-24 sm:px-6 md:pb-16 md:pt-28", isArabic ? "font-arabic" : "")}
            dir={isArabic ? "rtl" : "ltr"}
        >
            <div className="mx-auto w-full max-w-6xl space-y-8">

                {/* ── HERO ─────────────────────────────────────── */}
                <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
                    <div className={isArabic ? "text-right" : ""}>
                        <div className="clinical-eyebrow">
                            <Sparkles className="h-3.5 w-3.5" />
                            {t("Pricing", "الأسعار")}
                        </div>
                        <h1 className="mt-5 text-4xl font-bold leading-tight text-white sm:text-5xl">
                            {t(
                                <>
                                    Choose the plan that{" "}
                                    <span className="bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                                        fits your scan needs.
                                    </span>
                                </>,
                                <>
                                    اختر الخطة التي{" "}
                                    <span className="bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                                        تناسب احتياجاتك.
                                    </span>
                                </>
                            )}
                        </h1>
                        <p className="mt-4 text-base leading-relaxed text-slate-500">
                            {t(
                                "Start with core medication analysis for free. Upgrade when you need personal safety context, family profiles, medication memory, and export-ready reports.",
                                "ابدأ بتحليل الأدوية الأساسي مجانًا. قم بالترقية عندما تحتاج إلى سياق أمان شخصي وملفات عائلية وذاكرة أدوية وتقارير جاهزة للتصدير."
                            )}
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { icon: Clock,   labelEn: "Fast setup",       labelAr: "إعداد سريع",          valueEn: "No card for Free",     valueAr: "بدون بطاقة للمجاني", color: "cyan"    },
                            { icon: Shield,  labelEn: "Medical safety",   labelAr: "أمان طبي",           valueEn: "Review-focused",       valueAr: "مُركّز على المراجعة",  color: "emerald" },
                            { icon: Globe,   labelEn: "Verification",     labelAr: "التحقق",             valueEn: "FDA + web signals",    valueAr: "FDA + إشارات الويب", color: "violet"  },
                        ].map((item) => (
                            <div
                                key={item.labelEn}
                                className="rounded-2xl border border-white/[0.07] p-4"
                                style={{ background: "var(--q-glass-2)" }}
                            >
                                <div className={cn("icon-badge w-9 h-9 rounded-xl mb-3", `icon-badge-${item.color}`)}>
                                    <item.icon className="h-4 w-4" />
                                </div>
                                <p className="text-sm font-bold text-white">{isArabic ? item.labelAr : item.labelEn}</p>
                                <p className="mt-1 text-[11px] text-slate-600">{isArabic ? item.valueAr : item.valueEn}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── PLAN CARDS ───────────────────────────────── */}
                <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Free plan */}
                    <GlassCard accent="cyan" className="flex h-full flex-col p-7" hoverEffect={false}>
                        <div className={cn("flex items-start justify-between gap-4", isArabic ? "flex-row-reverse" : "")}>
                            <div className={isArabic ? "text-right" : ""}>
                                <p className="text-xs font-bold uppercase tracking-widest text-cyan-400/70">
                                    {t("Free", "مجاني")}
                                </p>
                                <h2 className="mt-2 text-4xl font-black text-white">$0</h2>
                                <p className="mt-2 text-sm text-slate-500">
                                    {t(
                                        "For trying QURE AI and occasional scans.",
                                        "لتجربة QURE AI والفحوصات العرضية."
                                    )}
                                </p>
                            </div>
                            <div className="icon-badge icon-badge-cyan w-12 h-12 rounded-xl shrink-0">
                                <Sparkles className="h-6 w-6" />
                            </div>
                        </div>

                        <div className="my-6 h-px bg-white/[0.06]" />
                        <FeatureList items={freeFeatures} accent="cyan" isArabic={isArabic} />

                        <div className="mt-auto pt-8">
                            <Button
                                disabled={plan === "free" || loading}
                                variant="outline"
                                className="w-full border-white/10 text-slate-500"
                            >
                                {loading
                                    ? t("Checking plan...", "جاري التحقق...")
                                    : plan === "free"
                                    ? t("Current plan", "الخطة الحالية")
                                    : t("Included", "مشمول")}
                            </Button>
                        </div>
                    </GlassCard>

                    {/* Ultra plan */}
                    <GlassCard
                        accent="amber"
                        className="relative flex h-full flex-col p-7"
                        hoverEffect={false}
                        style={{ background: "rgba(245,158,11,0.04)", borderColor: "rgba(245,158,11,0.25)" }}
                    >
                        {/* Best value badge */}
                        <div className="absolute right-5 top-5 flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-black">
                            <Star className="h-3 w-3 fill-current" />
                            {t("Best value", "أفضل قيمة")}
                        </div>

                        <div className={cn("flex items-start justify-between gap-4 pr-24", isArabic ? "flex-row-reverse pl-24 pr-0" : "")}>
                            <div className={isArabic ? "text-right" : ""}>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-400/70">
                                    {t("Ultra", "ألترا")}
                                </p>
                                <div className="mt-2 flex items-end gap-2">
                                    <h2 className="text-4xl font-black text-white">$9</h2>
                                    <span className="pb-1.5 text-sm text-slate-500">
                                        {t("/ month", "/ شهر")}
                                    </span>
                                </div>
                                <p className="mt-2 text-sm text-amber-300/60">
                                    {t(
                                        "For regular scanning, family care, and personal safety checks.",
                                        "للفحص المنتظم، ورعاية الأسرة، والفحوصات الصحية الشخصية."
                                    )}
                                </p>
                            </div>
                            <div className="icon-badge icon-badge-amber w-12 h-12 rounded-xl shrink-0">
                                <Zap className="h-6 w-6" />
                            </div>
                        </div>

                        <div className="my-6 h-px bg-amber-400/10" />
                        <FeatureList items={ultraFeatures} accent="amber" isArabic={isArabic} />

                        <div className="mt-auto pt-8">
                            {loading ? (
                                <div className="h-11 w-full skeleton rounded-xl" />
                            ) : (
                                <Button
                                    onClick={handlePurchase}
                                    disabled={plan === "ultra"}
                                    variant="amber"
                                    className="w-full gap-2 text-sm font-bold"
                                    glow
                                >
                                    {plan === "ultra"
                                        ? t("Ultra is active", "ألترا مفعّل")
                                        : t("Upgrade to Ultra", "الترقية إلى ألترا")}
                                    {plan !== "ultra" && (
                                        <ArrowRight className={cn("h-4 w-4", isArabic ? "rotate-180" : "")} />
                                    )}
                                </Button>
                            )}
                        </div>
                    </GlassCard>
                </section>

                {/* ── VALUE CARDS ──────────────────────────────── */}
                <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {valueCards.map((item) => (
                        <div
                            key={item.en.title}
                            className={cn(
                                "relative overflow-hidden rounded-2xl border border-white/[0.07] p-6 hover-lift",
                            )}
                            style={{ background: "var(--q-glass-2)" }}
                        >
                            <div className={cn(`icon-badge w-10 h-10 rounded-xl mb-5`, iconBadgeMap[item.color] || "icon-badge-cyan")}>
                                <item.icon className="h-5 w-5" />
                            </div>
                            <h3 className={cn("font-bold text-white", isArabic ? "text-right" : "")}>
                                {isArabic ? item.ar.title : item.en.title}
                            </h3>
                            <p className={cn("mt-2 text-sm leading-relaxed text-slate-500", isArabic ? "text-right" : "")}>
                                {isArabic ? item.ar.text : item.en.text}
                            </p>
                        </div>
                    ))}
                </section>

                {/* ── COMPARISON TABLE ─────────────────────────── */}
                <section>
                    <GlassCard className="overflow-hidden" hoverEffect={false}>
                        <div className={cn("border-b border-white/[0.06] p-6", isArabic ? "text-right" : "")}>
                            <h2 className="text-2xl font-bold text-white">
                                {t("Plan comparison", "مقارنة الخطط")}
                            </h2>
                            <p className="mt-1 text-sm text-slate-600">
                                {t("A clear view of what changes when you upgrade.", "رؤية واضحة لما يتغير عند الترقية.")}
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[560px] text-sm">
                                <thead>
                                    <tr className="border-b border-white/[0.06]">
                                        <th className={cn("p-4 font-semibold text-slate-600", isArabic ? "text-right" : "text-left")}>
                                            {t("Feature", "الميزة")}
                                        </th>
                                        <th className={cn("p-4 font-semibold text-cyan-400/70", isArabic ? "text-right" : "text-left")}>
                                            {t("Free", "مجاني")}
                                        </th>
                                        <th className={cn("bg-amber-400/[0.05] p-4 font-semibold text-amber-300", isArabic ? "text-right" : "text-left")}>
                                            {t("Ultra", "ألترا")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparisonRows.map((row) => (
                                        <tr key={row.en} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                                            <td className={cn("p-4 text-slate-400 font-medium text-sm", isArabic ? "text-right" : "text-left")}>
                                                {isArabic ? row.ar : row.en}
                                            </td>
                                            <td className="p-4">
                                                <ComparisonValue value={row.free} />
                                            </td>
                                            <td className="bg-amber-400/[0.03] p-4">
                                                <ComparisonValue value={row.ultra} highlighted />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>
                </section>

                {/* ── VOUCHER + FAQ ─────────────────────────────── */}
                <section className="grid grid-cols-1 gap-5 lg:grid-cols-[0.75fr_1.25fr]">
                    {/* Voucher */}
                    <GlassCard accent="cyan" hoverEffect={false} className="p-6">
                        <div className="icon-badge icon-badge-cyan w-11 h-11 rounded-xl mb-4">
                            <Gift className="h-5 w-5" />
                        </div>
                        <h2 className={cn("text-xl font-bold text-white", isArabic ? "text-right" : "")}>
                            {t("Have a voucher?", "لديك قسيمة؟")}
                        </h2>
                        <p className={cn("mt-2 text-sm leading-relaxed text-slate-500", isArabic ? "text-right" : "")}>
                            {t(
                                "Redeem a code from your profile to add credits or unlock plan benefits tied to your account.",
                                "استبدل رمزًا من ملفك الشخصي لإضافة رصيد أو فتح مزايا الخطة المرتبطة بحسابك."
                            )}
                        </p>
                        <Link href="/profile" className="mt-5 inline-flex">
                            <Button variant="outline" className={cn("gap-2 border-cyan-400/20 text-cyan-300 hover:bg-cyan-400/8", isArabic ? "flex-row-reverse" : "")}>
                                {t("Redeem code", "استبدال الكود")}
                                <ArrowRight className={cn("h-4 w-4", isArabic ? "rotate-180" : "")} />
                            </Button>
                        </Link>
                    </GlassCard>

                    {/* FAQ accordion */}
                    <div className="space-y-3">
                        <p className={cn("text-xs font-bold uppercase tracking-[0.14em] text-slate-600 mb-4", isArabic ? "text-right" : "")}>
                            {t("FAQ", "الأسئلة الشائعة")}
                        </p>
                        {faqs.map((item) => (
                            <FaqItem key={item.q.en} q={item.q} a={item.a} isArabic={isArabic} />
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
