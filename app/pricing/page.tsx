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
    { en: "30 monthly credits (scans & AI messages)",   ar: "٣٠ رصيد شهرياً للفحوصات والرسائل"        },
    { en: "Medication OCR and core medical analysis",   ar: "OCR الأدوية والتحليل الطبي الأساسي"       },
    { en: "Basic openFDA and web verification",        ar: "التحقق الأساسي من قواعد بيانات FDA والويب" },
    { en: "Saved scan history & deduplication",        ar: "حفظ سجل الفحص والربط الذكي لمنع التكرار" },
];

const ultraFeatures = [
    { en: "300 monthly credits (scans & AI messages)",  ar: "٣٠٠ رصيد شهرياً للفحوصات والرسائل"       },
    { en: "Full Mat AI medical assistant access",      ar: "المساعد الطبي الذكي Mat AI بلا قيود"     },
    { en: "Private health profile & allergy context",   ar: "سياق الملف الصحي والتفاعلات والحساسية"  },
    { en: "Family and caregiver profiles management",   ar: "إدارة ملفات العائلة ومقدمي الرعاية"      },
    { en: "Smart interaction guard & medication memory",ar: "حارس التداخلات الدوائية وذاكرة الأدوية"  },
    { en: "Interactive follow-up question tree",        ar: "شجرة أسئلة المتابعة والتحليلات التفاعلية" },
    { en: "PNG and high-quality PDF report exports",   ar: "تصدير PNG وتقارير PDF طبية عالية الجودة" },
];

const comparisonRows = [
    { en: "Medication OCR analysis & OCR scanning",  ar: "تحليل علب الأدوية والروشتات بالذكاء الاصطناعي", free: true,          ultra: true                },
    { en: "Mat AI medical assistant chat",           ar: "المساعد الطبي الذكي Mat AI",                    free: false,         ultra: true                },
    { en: "Private health profile context",          ar: "سياق الملف الصحي والحساسية الشخصية",             free: false,         ultra: true                },
    { en: "Medication memory & deduplication",       ar: "ذاكرة الأدوية والربط الذكي في السجل",            free: "أساسي",       ultra: "شامل ومتقدم"       },
    { en: "Drug interaction & safety guard",         ar: "حارس التداخلات الدوائية والتحذيرات",            free: false,         ultra: true                },
    { en: "Family & caregiver profiles mode",        ar: "إدارة ملفات العائلة والوالدين والأبناء",        free: false,         ultra: true                },
    { en: "Interactive follow-up question tree",     ar: "شجرة أسئلة المتابعة والتحليلات الذكية",         free: false,         ultra: true                },
    { en: "FDA label & NDC database checks",         ar: "التحقق الفوري من قواعد بيانات FDA الرسمية",    free: "أساسي",       ultra: "تلقائي وتفصيلي"    },
    { en: "Report exports",                          ar: "تصدير التقارير والنتائج",                       free: "صورة PNG",    ultra: "PNG + PDF طبي"     },
    { en: "Monthly credits (scans & chat)",          ar: "الاستخدام الشهري (الفحوصات والرسائل)",          free: "30 رصيد",     ultra: "300 رصيد"          },
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
                <li key={i} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                    <span className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                        accent === "amber"
                            ? "border-amber-400/25 bg-amber-400/10 text-amber-300"
                            : "border-cyan-400/25 bg-cyan-400/10 text-cyan-300"
                    )}>
                        <Check className="h-3 w-3" />
                    </span>
                    <span className="leading-relaxed">{isArabic ? item.ar : item.en}</span>
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
    return <span className={cn("text-xs sm:text-sm font-semibold", highlighted ? "text-amber-300 font-bold" : "text-slate-400")}>{value}</span>;
}

/* ── FAQ Item ──────────────────────────────────────────────────── */
function FaqItem({ q, a, isArabic }: { q: { en: string; ar: string }; a: { en: string; ar: string }; isArabic: boolean }) {
    const [open, setOpen] = useState(false);
    return (
        <div className={cn(
            "rounded-2xl border border-white/[0.07] overflow-hidden transition-colors",
            open ? "border-white/15" : "hover:border-white/10"
        )}
            style={{ background: "var(--q-glass-2)" }}>
            <button
                className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-start"
                onClick={() => setOpen(!open)}
            >
                <span className="font-semibold text-white text-xs sm:text-sm">{isArabic ? q.ar : q.en}</span>
                {open
                    ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                    : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
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
                        <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs sm:text-sm text-slate-400 leading-relaxed">
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
        <main className="min-h-screen px-3 sm:px-6 pb-24 sm:pb-28 pt-24 sm:pt-28 md:pb-16 md:pt-28">
            <div className="clinical-page space-y-8 sm:space-y-10">

                {/* ── HERO ─────────────────────────────────────── */}
                <section className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
                    <div>
                        <h1 className="mt-1 text-3xl xs:text-4xl sm:text-5xl font-black leading-tight text-white tracking-tight">
                            {isArabic ? (
                                <>
                                    اختر الخطة التي{" "}
                                    <span className="bg-gradient-to-r from-cyan-300 via-cyan-200 to-emerald-300 bg-clip-text text-transparent">
                                        تناسب احتياجاتك.
                                    </span>
                                </>
                            ) : (
                                <>
                                    Choose the plan that{" "}
                                    <span className="bg-gradient-to-r from-cyan-300 via-cyan-200 to-emerald-300 bg-clip-text text-transparent">
                                        fits your scan needs.
                                    </span>
                                </>
                            )}
                        </h1>
                        <p className="mt-3 sm:mt-4 text-xs sm:text-sm lg:text-base leading-relaxed text-slate-300 max-w-xl">
                            {t(
                                "Start with core medication analysis for free. Upgrade when you need personal safety context, family profiles, medication memory, and export-ready reports.",
                                "ابدأ بتحليل الأدوية الأساسي مجانًا. قم بالترقية عندما تحتاج إلى سياق أمان شخصي وملفات عائلية وذاكرة أدوية وتقارير جاهزة للتصدير."
                            )}
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                        {[
                            { icon: Clock,   labelEn: "Fast setup",       labelAr: "إعداد سريع",          valueEn: "No card for Free",     valueAr: "بدون بطاقة للمجاني", color: "cyan"    },
                            { icon: Shield,  labelEn: "Medical safety",   labelAr: "أمان طبي",           valueEn: "Review-focused",       valueAr: "مُركّز على المراجعة",  color: "emerald" },
                            { icon: Globe,   labelEn: "Verification",     labelAr: "التحقق",             valueEn: "FDA + web signals",    valueAr: "FDA + إشارات الويب", color: "cyan"     },
                        ].map((item) => (
                            <div
                                key={item.labelEn}
                                className="stat-card"
                            >
                                <div className={cn("icon-badge w-8 h-8 sm:w-9 sm:h-9 rounded-xl mb-2 sm:mb-3", `icon-badge-${item.color}`)}>
                                    <item.icon className="h-4 w-4" />
                                </div>
                                <p className="text-xs sm:text-sm font-bold text-white truncate">{isArabic ? item.labelAr : item.labelEn}</p>
                                <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400 truncate">{isArabic ? item.valueAr : item.valueEn}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── PLAN CARDS ───────────────────────────────── */}
                <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Free plan */}
                    <GlassCard accent="cyan" className="flex h-full flex-col p-6 sm:p-8" hoverEffect={false}>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                                    {t("Free Plan", "الخطة المجانية")}
                                </p>
                                <h2 className="mt-2 text-3xl sm:text-4xl font-black text-white">$0</h2>
                                <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
                                    {t(
                                        "For trying QureScan and occasional scans.",
                                        "لتجربة QureScan والفحوصات العرضية."
                                    )}
                                </p>
                            </div>
                            <div className="icon-badge icon-badge-cyan w-11 h-11 sm:w-12 sm:h-12 rounded-xl shrink-0">
                                <Brain className="h-6 w-6 text-cyan-300" />
                            </div>
                        </div>

                        <div className="my-5 sm:my-6 h-px bg-white/[0.08]" />
                        <FeatureList items={freeFeatures} accent="cyan" isArabic={isArabic} />

                        <div className="mt-auto pt-6 sm:pt-8">
                            <Button
                                disabled={plan === "free" || loading}
                                variant="outline"
                                className="w-full border-white/15 text-slate-300 font-semibold"
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
                        accent="cyan"
                        className="relative flex h-full flex-col p-6 sm:p-8"
                        hoverEffect={false}
                        style={{ background: "rgba(15, 23, 42, 0.85)", borderColor: "rgba(34, 211, 238, 0.25)" }}
                    >
                        {/* Best value badge */}
                        <div className="absolute end-5 top-5 flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-black shadow-md">
                            <Star className="h-3 w-3 fill-current" />
                            <span>{t("Best value", "أفضل قيمة")}</span>
                        </div>

                        <div className="flex items-start justify-between gap-4 pe-24">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-400">
                                    {t("Ultra Plan", "خطة ألترا")}
                                </p>
                                <div className="mt-2 flex items-end gap-2">
                                    <h2 className="text-3xl sm:text-4xl font-black text-white">$9</h2>
                                    <span className="pb-1 text-xs sm:text-sm text-slate-400">
                                        {t("/ month", "/ شهر")}
                                    </span>
                                </div>
                                <p className="mt-1.5 text-xs sm:text-sm text-amber-200/75">
                                    {t(
                                        "For regular scanning, family care, and personal safety checks.",
                                        "للفحص المنتظم، ورعاية الأسرة، والفحوصات الصحية الشخصية."
                                    )}
                                </p>
                            </div>
                            <div className="icon-badge icon-badge-amber w-11 h-11 sm:w-12 sm:h-12 rounded-xl shrink-0">
                                <Zap className="h-6 w-6" />
                            </div>
                        </div>

                        <div className="my-5 sm:my-6 h-px bg-amber-400/20" />
                        <FeatureList items={ultraFeatures} accent="amber" isArabic={isArabic} />

                        <div className="mt-auto pt-6 sm:pt-8">
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
                                    <span>
                                        {plan === "ultra"
                                            ? t("Ultra is active", "ألترا مفعّل")
                                            : t("Upgrade to Ultra", "الترقية إلى ألترا")}
                                    </span>
                                    {plan !== "ultra" && (
                                        <ArrowRight className={cn("h-4 w-4 shrink-0", isArabic ? "rotate-180" : "")} />
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
                            className="stat-card p-5 sm:p-6"
                        >
                            <div className={cn("icon-badge w-10 h-10 rounded-xl mb-4", iconBadgeMap[item.color] || "icon-badge-cyan")}>
                                <item.icon className="h-5 w-5" />
                            </div>
                            <h3 className="font-bold text-white text-base">
                                {isArabic ? item.ar.title : item.en.title}
                            </h3>
                            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-300">
                                {isArabic ? item.ar.text : item.en.text}
                            </p>
                        </div>
                    ))}
                </section>

                {/* ── COMPARISON TABLE ─────────────────────────── */}
                <section>
                    <GlassCard className="overflow-hidden" hoverEffect={false}>
                        <div className="border-b border-white/[0.08] p-5 sm:p-6">
                            <h2 className="text-xl sm:text-2xl font-bold text-white">
                                {t("Plan comparison", "مقارنة الخطط")}
                            </h2>
                            <p className="mt-1 text-xs sm:text-sm text-slate-400">
                                {t("A clear view of what changes when you upgrade.", "رؤية واضحة لما يتغير عند الترقية.")}
                            </p>
                        </div>

                        <div className="overflow-x-auto relative no-scrollbar">
                            <table className="w-full min-w-[520px] text-xs sm:text-sm">
                                <thead>
                                    <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                                        <th className="p-3.5 sm:p-4 font-bold text-slate-400 text-start">
                                            {t("Feature", "الميزة")}
                                        </th>
                                        <th className="p-3.5 sm:p-4 font-bold text-cyan-400 text-start">
                                            {t("Free", "مجاني")}
                                        </th>
                                        <th className="bg-amber-400/[0.08] p-3.5 sm:p-4 font-bold text-amber-300 text-start">
                                            {t("Ultra", "ألترا")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparisonRows.map((row) => (
                                        <tr key={row.en} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-colors">
                                            <td className="p-3.5 sm:p-4 text-slate-300 font-medium text-start">
                                                {isArabic ? row.ar : row.en}
                                            </td>
                                            <td className="p-3.5 sm:p-4 text-start">
                                                <ComparisonValue value={row.free} />
                                            </td>
                                            <td className="bg-amber-400/[0.03] p-3.5 sm:p-4 text-start">
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
                <section className="grid grid-cols-1 gap-5 lg:grid-cols-[0.8fr_1.2fr]">
                    {/* Voucher */}
                    <GlassCard accent="cyan" hoverEffect={false} className="p-6 sm:p-7 flex flex-col justify-between">
                        <div>
                            <div className="icon-badge icon-badge-cyan w-11 h-11 rounded-xl mb-4">
                                <Gift className="h-5 w-5" />
                            </div>
                            <h2 className="text-lg sm:text-xl font-bold text-white">
                                {t("Have a voucher?", "لديك قسيمة؟")}
                            </h2>
                            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-300">
                                {t(
                                    "Redeem a code from your profile to add credits or unlock plan benefits tied to your account.",
                                    "استبدل رمزًا من ملفك الشخصي لإضافة رصيد أو فتح مزايا الخطة المرتبطة بحسابك."
                                )}
                            </p>
                        </div>
                        <Link href="/profile" className="mt-6 inline-flex">
                            <Button variant="outline" className="gap-2 border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/10 font-semibold text-xs sm:text-sm">
                                <span>{t("Redeem code", "استبدال الكود")}</span>
                                <ArrowRight className={cn("h-4 w-4 shrink-0", isArabic ? "rotate-180" : "")} />
                            </Button>
                        </Link>
                    </GlassCard>

                    {/* FAQ accordion */}
                    <div className="space-y-3">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 mb-3">
                            {t("Frequently Asked Questions", "الأسئلة الشائعة")}
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
