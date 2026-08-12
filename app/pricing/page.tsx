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
    Users,
    Zap,
    ChevronDown,
    Brain,
    HelpCircle,
    CheckCircle2,
    Crown,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useUser } from "@/context/UserContext";
import { useSettings } from "@/context/SettingsContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const freeFeatures = [
    { en: "30 monthly credits (scans & AI messages)",   ar: "٣٠ رصيد شهرياً للفحوصات ورسائل AI"       },
    { en: "Medication OCR and core medical analysis",   ar: "OCR الأدوية والتحليل الطبي الأساسي"       },
    { en: "Basic openFDA and web verification",        ar: "التحقق الأساسي من قواعد بيانات FDA والويب" },
    { en: "Saved scan history & deduplication",        ar: "حفظ سجل الفحص والربط الذكي لمنع التكرار" },
];

const ultraFeatures = [
    { en: "300 monthly credits (scans & AI messages)",  ar: "٣٠٠ رصيد شهرياً للفحوصات ورسائل AI"      },
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
        ar:    { title: "سياق الأمان الدوائي", text: "تنبيهات فورية دقيقة عند مطابقة التحذيرات مع الحساسية وحالتك الصحية وأدويتك الحالية." },
    },
    {
        icon:  Users,
        color: "violet",
        en:    { title: "Family profiles",  text: "Keep scans separated for yourself, a parent, or another person you care for." },
        ar:    { title: "ملفات الأسرة الذكية", text: "احتفظ بسجلات منفصلة تماماً لك، لوالديك، أو لأي فرد من أفراد أسرتك دون اختلاط البيانات." },
    },
    {
        icon:  FileText,
        color: "cyan",
        en:    { title: "Clinical PDF reports", text: "Export professional medical reports for later review with your doctor or pharmacist." },
        ar:    { title: "تقارير PDF طبية", text: "صدّر نتائجك في تقارير طبية منسقة بضغطة زر لمراجعتها مع الطبيب أو الصيدلي." },
    },
];

const faqs = [
    {
        q: { en: "Is the free plan sufficient for daily use?", ar: "هل الخطة المجانية كافية للاستخدام اليومي؟" },
        a: { en: "The free plan grants 30 credits monthly for basic OCR analysis. ULTRA is recommended for continuous family scanning, Mat AI chat, and comprehensive safety checks.", ar: "تمنحك الخطة المجانية 30 رصيداً شهرياً للفحص الأساسي. باقة ألترا هي الخيار المثالي إذا كنت ترغب في محادثات Mat AI غير المحدودة، ملفات الأسرة، والتقارير الاحترافية." },
    },
    {
        q: { en: "Are the AI results a replacement for a doctor?", ar: "هل نتائج الذكاء الاصطناعي بديل للطبيب المعالج؟" },
        a: { en: "No. QureScan is designed for educational guidance and verification. All critical clinical decisions must be confirmed with your physician or pharmacist.", ar: "لا. تم تصميم QureScan كأداة توجيهية وتحقق ذكية للمساعدة والفهم. أي قرارات علاجية هامة يجب استشارة الطبيب أو الصيدلي بشأنها." },
    },
    {
        q: { en: "How does the monthly credit refill work?", ar: "كيف تعمل آلية التعبئة والتجديد الشهري للرصيد؟" },
        a: { en: "Your monthly credits automatically refresh every 30 days from your signup date, ensuring you always have active balance ready.", ar: "يتم تجديد رصيدك تلقائياً بذكاء كل 30 يوماً من تاريخ إنشاء حسابك لضمان توفر رصيدك دوماً دون أي انقطاع." },
    },
];

/* ── Feature check list ────────────────────────────────────────── */
function FeatureList({ items, isUltra, isArabic }: { items: { en: string; ar: string }[]; isUltra?: boolean; isArabic: boolean }) {
    return (
        <ul className="space-y-3.5 my-2">
            {items.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                    <span className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                        isUltra
                            ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-300"
                            : "border-slate-700 bg-slate-800/80 text-cyan-400"
                    )}>
                        <Check className="h-3 w-3 stroke-[2.5]" />
                    </span>
                    <span className="leading-relaxed font-medium">{isArabic ? item.ar : item.en}</span>
                </li>
            ))}
        </ul>
    );
}

/* ── Comparison cell ───────────────────────────────────────────── */
function ComparisonValue({ value, highlighted = false }: { value: boolean | string; highlighted?: boolean }) {
    if (typeof value === "boolean") {
        return value ? (
            <div className="flex items-center justify-center">
                <span className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full",
                    highlighted ? "bg-cyan-500/15 text-cyan-300 border border-cyan-400/30" : "bg-white/5 text-slate-300 border border-white/10"
                )}>
                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                </span>
            </div>
        ) : (
            <div className="flex items-center justify-center">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.02] text-white/20 border border-white/5">
                    <Lock className="h-3 w-3" />
                </span>
            </div>
        );
    }
    return (
        <div className="flex items-center justify-center">
            <span className={cn(
                "text-xs sm:text-sm px-2.5 py-0.5 rounded-lg border",
                highlighted
                    ? "bg-cyan-500/10 border-cyan-400/30 text-cyan-300 font-bold"
                    : "bg-white/5 border-white/10 text-slate-300 font-medium"
            )}>
                {value}
            </span>
        </div>
    );
}

/* ── FAQ Item ──────────────────────────────────────────────────── */
function FaqItem({ q, a, isArabic }: { q: { en: string; ar: string }; a: { en: string; ar: string }; isArabic: boolean }) {
    const [open, setOpen] = useState(false);
    return (
        <div className={cn(
            "rounded-2xl border transition-colors duration-150 overflow-hidden",
            open
                ? "border-cyan-500/30 bg-slate-900/90"
                : "border-white/[0.08] bg-slate-900/60 hover:border-white/15"
        )}>
            <button
                className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-start focus:outline-none"
                onClick={() => setOpen(!open)}
            >
                <span className="font-bold text-white text-xs sm:text-sm">{isArabic ? q.ar : q.en}</span>
                <span className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border transition-transform duration-200",
                    open ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300 rotate-180" : "border-white/10 bg-white/5 text-slate-400"
                )}>
                    <ChevronDown className="h-4 w-4" />
                </span>
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18, ease: "easeInOut" }}
                    >
                        <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-3">
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
    const { user, plan, loading } = useUser();
    const { resultsLanguage } = useSettings();
    const router = useRouter();

    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    const [ceoLoading, setCeoLoading] = useState(false);
    const [ceoMessage, setCeoMessage] = useState<string | null>(null);
    const [ceoError, setCeoError] = useState<string | null>(null);
    const [existingRequest, setExistingRequest] = useState<any>(null);

    const handlePurchase = () => router.push("/billing");

    React.useEffect(() => {
        if (user) {
            fetch("/api/golden-ceo/request")
                .then((r) => r.json())
                .then((data) => {
                    if (data.request) {
                        setExistingRequest(data.request);
                        if (data.request.status === "pending") {
                            setCeoMessage(
                                isArabic
                                    ? "تم إرسال طلبك بنجاح، وهو قيد المراجعة لدى الإدارة حالياً."
                                    : "Your request has been submitted and is currently pending review by the admin."
                            );
                        } else if (data.request.status === "approved" || plan === "ultra") {
                            setCeoMessage(
                                isArabic
                                    ? "تم تفعيل اشتراكك الذهبي بنجاح! حسابك مفعّل على باقة ULTRA."
                                    : "Your Golden CEO subscription is active! You are on ULTRA plan."
                            );
                        }
                    }
                })
                .catch(() => {});
        }
    }, [user, isArabic, plan]);

    const handleGoldenCeoRequest = async () => {
        if (!user) {
            router.push("/auth");
            return;
        }

        setCeoLoading(true);
        setCeoError(null);
        setCeoMessage(null);

        try {
            const res = await fetch("/api/golden-ceo/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            const data = await res.json();
            if (res.ok) {
                setCeoMessage(
                    isArabic
                        ? "تم إرسال طلبك بنجاح. سيتم مراجعة معرف المستخدم من قبل الإدارة وتفعيل الحساب فوراً."
                        : "Your request has been sent successfully. Your User ID will be reviewed by admin for instant activation."
                );
            } else {
                setCeoError(data.error || (isArabic ? "فشل إرسال الطلب. يرجى المحاولة لاحقاً." : "Failed to send request."));
            }
        } catch (err: any) {
            setCeoError(isArabic ? "حدث خطأ في الاتصال. يرجى المحاولة لاحقاً." : "Network connection error.");
        } finally {
            setCeoLoading(false);
        }
    };

    const iconBadgeMap: Record<string, string> = {
        cyan:    "icon-badge-cyan",
        emerald: "icon-badge-emerald",
        violet:  "icon-badge-violet",
    };

    return (
        <main className="min-h-screen px-3 sm:px-6 pb-24 sm:pb-28 pt-24 sm:pt-28 md:pb-16 md:pt-28" dir={isArabic ? "rtl" : "ltr"}>
            <div className="clinical-page space-y-10 sm:space-y-12 max-w-6xl mx-auto">

                {/* ── HERO SECTION ────────────────────────────────── */}
                <section className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-cyan-300 text-xs font-bold mb-3">
                            <Zap className="h-3.5 w-3.5 text-cyan-400" />
                            <span>{t("Transparent Clinical Pricing", "خطط مرنة وواضحة بدون تعقيد")}</span>
                        </div>
                        <h1 className="text-3xl xs:text-4xl sm:text-5xl font-black leading-tight text-white tracking-tight">
                            {isArabic ? (
                                <>
                                    اختر الخطة التي{" "}
                                    <span className="text-cyan-300">
                                        تناسب احتياجاتك.
                                    </span>
                                </>
                            ) : (
                                <>
                                    Choose the plan that{" "}
                                    <span className="text-cyan-300">
                                        fits your healthcare needs.
                                    </span>
                                </>
                            )}
                        </h1>
                        <p className="mt-3 sm:mt-4 text-xs sm:text-sm lg:text-base leading-relaxed text-slate-300 max-w-xl">
                            {t(
                                "Start with core medication analysis for free. Upgrade to ULTRA when you want personal safety context, family profiles, Mat AI chat, and clinical PDF exports.",
                                "ابدأ بفحص الأدوية مجاناً مع ٣٠ رصيد شهرياً. قم بالترقية إلى ULTRA للوصول الكامل لمساعد Mat AI الطبي، ملفات الأسرة، وسياق الأمان المتقدم."
                            )}
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
                        {[
                            { icon: Clock,   labelEn: "Instant Active",   labelAr: "تفعيل فوري",          valueEn: "No card needed",     valueAr: "بدون بطاقة للمجاني", color: "cyan"    },
                            { icon: Shield,  labelEn: "Clinical Safety",  labelAr: "حماية سريرية",        valueEn: "FDA verified",       valueAr: "مطابقة FDA والويب",  color: "emerald" },
                            { icon: Globe,   labelEn: "Smart Refill",     labelAr: "تجديد ذكي",           valueEn: "Monthly refresh",    valueAr: "تعبئة تلقائية شهرياً", color: "violet"   },
                        ].map((item) => (
                            <div
                                key={item.labelEn}
                                className="stat-card p-4 flex flex-col justify-between rounded-2xl bg-slate-900/60 border border-white/[0.08]"
                            >
                                <div className={cn("icon-badge w-9 h-9 rounded-xl mb-2 sm:mb-3 flex items-center justify-center", `icon-badge-${item.color}`)}>
                                    <item.icon className="h-4.5 w-4.5" />
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm font-bold text-white truncate">{isArabic ? item.labelAr : item.labelEn}</p>
                                    <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400 truncate">{isArabic ? item.valueAr : item.valueEn}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── PLAN CARDS ──────────────────────────────────── */}
                <section className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-stretch">
                    
                    {/* Free Plan Card */}
                    <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 sm:p-8 flex flex-col justify-between shadow-sm">
                        <div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800/80 border border-slate-700 text-slate-300">
                                    {t("Free Plan", "الخطة المجانية")}
                                </span>
                                <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                                    <Brain className="h-6 w-6" />
                                </div>
                            </div>

                            <div className="mt-5 flex items-baseline gap-2">
                                <h2 className="text-4xl sm:text-5xl font-black text-white">$0</h2>
                                <span className="text-xs sm:text-sm text-slate-400 font-medium">
                                    {t("/ forever", "/ مدى الحياة")}
                                </span>
                            </div>
                            <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                                {t("For trying QureScan and occasional medication scans.", "لتجربة فحص الأدوية والتعرف السريع على الوصفات الطبية.")}
                            </p>

                            <div className="my-6 h-px bg-white/[0.08]" />

                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                                {t("What's included:", "المزايا المشمولة:")}
                            </p>
                            <FeatureList items={freeFeatures} isArabic={isArabic} />
                        </div>

                        <div className="pt-8 mt-auto">
                            <Button
                                disabled={plan === "free" || loading}
                                variant="outline"
                                className="w-full py-3.5 rounded-2xl border-white/15 bg-white/5 text-slate-300 font-bold hover:bg-white/10"
                            >
                                {loading
                                    ? t("Checking plan...", "جاري التحقق...")
                                    : plan === "free"
                                    ? t("Current Plan", "خطتك الحالية")
                                    : t("Included by Default", "مشمول مجاناً")}
                            </Button>
                        </div>
                    </div>

                    {/* Ultra Plan Card */}
                    <div className="relative rounded-3xl border border-cyan-500/30 bg-slate-900/90 p-6 sm:p-8 flex flex-col justify-between shadow-md">
                        
                        <div>
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-800 border border-slate-700 text-cyan-300 flex items-center gap-1.5">
                                        <Zap className="h-3.5 w-3.5 text-cyan-400" />
                                        {t("Ultra Plan", "خطة ألترا")}
                                    </span>
                                </div>
                                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
                                    {t("Most Popular", "الأكثر تميزاً")}
                                </span>
                            </div>

                            <div className="mt-5 flex items-baseline gap-2">
                                <h2 className="text-4xl sm:text-5xl font-black text-white">$9</h2>
                                <span className="text-xs sm:text-sm text-cyan-200/80 font-medium">
                                    {t("/ month", "/ شهرياً")}
                                </span>
                            </div>
                            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                                {t("For regular health checks, Mat AI medical chat, and full family care.", "للرعاية المتكاملة، استشارات Mat AI، ومتابعة صحة الأسرة بدون حدود.")}
                            </p>

                            <div className="my-6 h-px bg-slate-800" />

                            <p className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3">
                                {t("Everything in Free, plus:", "كل ما في المجاني، بالإضافة إلى:")}
                            </p>
                            <FeatureList items={ultraFeatures} isUltra isArabic={isArabic} />
                        </div>

                        <div className="pt-8 mt-auto">
                            {loading ? (
                                <div className="h-12 w-full skeleton rounded-2xl" />
                            ) : plan === "ultra" ? (
                                <div className="w-full py-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 text-cyan-300 font-bold text-center flex items-center justify-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                                    <span>{t("Ultra is Active", "ألترا مفعّل بحسابك")}</span>
                                </div>
                            ) : (
                                <button
                                    onClick={handlePurchase}
                                    className="w-full py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    <span>{t("Upgrade to Ultra ($9/mo)", "الترقية إلى ألترا ($9/شهر)")}</span>
                                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                {/* ── VALUE CARDS ─────────────────────────────────── */}
                <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {valueCards.map((item) => (
                        <div
                            key={item.en.title}
                            className="stat-card p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-white/[0.08]"
                        >
                            <div className={cn("icon-badge w-10 h-10 rounded-xl mb-4 flex items-center justify-center", iconBadgeMap[item.color] || "icon-badge-cyan")}>
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

                {/* ── COMPARISON TABLE ────────────────────────────── */}
                <section>
                    <div className="rounded-3xl border border-white/10 bg-slate-900/70 overflow-hidden shadow-sm">
                        <div className="border-b border-white/[0.08] p-5 sm:p-7">
                            <h2 className="text-xl sm:text-2xl font-black text-white">
                                {t("Plan Comparison Matrix", "جدول مقارنة الخطط التفصيلي")}
                            </h2>
                            <p className="mt-1 text-xs sm:text-sm text-slate-400">
                                {t("A comprehensive breakdown of all features between plans.", "نظرة شاملة وواضحة على المزايا والحدود بين الخطة المجانية وباقة ألترا.")}
                            </p>
                        </div>

                        <div className="overflow-x-auto relative no-scrollbar">
                            <table className="w-full min-w-[560px] text-xs sm:text-sm">
                                <thead>
                                    <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                                        <th className="p-4 sm:p-5 font-bold text-slate-300 text-start">
                                            {t("Feature", "الميزة")}
                                        </th>
                                        <th className="p-4 sm:p-5 font-bold text-slate-300 text-center w-36 sm:w-44">
                                            {t("Free Plan", "المجاني")}
                                        </th>
                                        <th className="bg-slate-800/40 p-4 sm:p-5 font-black text-cyan-300 text-center w-36 sm:w-44 border-s border-slate-800">
                                            {t("Ultra Plan", "ألترا")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparisonRows.map((row) => (
                                        <tr key={row.en} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                                            <td className="p-4 sm:p-5 text-slate-200 font-medium text-start">
                                                {isArabic ? row.ar : row.en}
                                            </td>
                                            <td className="p-4 sm:p-5 text-center">
                                                <ComparisonValue value={row.free} />
                                            </td>
                                            <td className="bg-slate-800/20 p-4 sm:p-5 text-center border-s border-slate-800">
                                                <ComparisonValue value={row.ultra} highlighted />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* ── VOUCHER & GOLDEN CEO SECTION ────────────────── */}
                <section className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-stretch">
                    
                    {/* Executive CEO Upgrade & Voucher Card */}
                    <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 sm:p-8 flex flex-col justify-between shadow-sm">
                        <div>
                            {/* Executive CEO Upgrade */}
                            <div className="p-5 rounded-2xl bg-slate-950/50 border border-white/10">
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center">
                                            <Crown className="w-4 h-4 text-cyan-400" />
                                        </div>
                                        <h3 className="text-sm font-bold text-white">
                                            {t("Executive Upgrade by CEO", "ترقية الحساب من قبل CEO")}
                                        </h3>
                                    </div>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 border border-slate-700 text-slate-300">
                                        {t("Beta Version Only", "متوفر في نسخة البيتا")}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                                    {t(
                                        "Direct executive upgrade authorized by the CEO for beta testers, granting full access and priority features.",
                                        "ترقية مباشرة معتمدة من قبل الـ CEO لمختبري النسخة التجريبية (Beta) تمنحك وصولاً شاملاً لكافة ميزات المنصة."
                                    )}
                                </p>

                                {ceoMessage ? (
                                    <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 font-medium">
                                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                                        <span>{ceoMessage}</span>
                                    </div>
                                ) : (
                                    <div>
                                        {ceoError && (
                                            <p className="text-xs text-rose-400 mb-2 font-medium">{ceoError}</p>
                                        )}
                                        <button
                                            onClick={handleGoldenCeoRequest}
                                            disabled={ceoLoading}
                                            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 hover:text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                        >
                                            {ceoLoading ? (
                                                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                                            ) : (
                                                <Crown className="w-4 h-4 text-cyan-400" />
                                            )}
                                            <span>
                                                {ceoLoading
                                                    ? t("Sending request...", "جاري إرسال الطلب...")
                                                    : t("Request Upgrade from CEO", "طلب الترقية من قبل CEO")}
                                            </span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Standard Voucher Redeem Link */}
                            <div className="mt-5 p-4 rounded-2xl bg-slate-800/40 border border-white/5 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                                        <Gift className="h-4.5 w-4.5" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-white">
                                            {t("Have a Voucher Code?", "هل لديك كود قسيمة؟")}
                                        </h4>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            {t("Redeem code directly in your profile", "استبدل الرمز من صفحة حسابك")}
                                        </p>
                                    </div>
                                </div>
                                <Link href="/profile" className="shrink-0">
                                    <button className="py-2 px-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 font-medium text-xs transition-colors flex items-center gap-1.5">
                                        <span>{t("Redeem", "استبدال")}</span>
                                        <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                                    </button>
                                </Link>
                            </div>
                        </div>

                        <div className="pt-4 mt-auto text-center">
                            <p className="text-[11px] text-slate-400">
                                {t("Enterprise inquiries? Contact us directly.", "للاستفسارات الخاصة بالشركات، تواصل مع الإدارة مباشرة.")}
                            </p>
                        </div>
                    </div>

                    {/* FAQ Accordion */}
                    <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 sm:p-8 flex flex-col justify-between shadow-sm">
                        <div>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
                                    <HelpCircle className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        {t("Frequently Asked Questions", "الأسئلة الشائعة")}
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {t("Common answers about plans & usage", "إجابات على أكثر الاستفسارات تكراراً")}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {faqs.map((item) => (
                                    <FaqItem key={item.q.en} q={item.q} a={item.a} isArabic={isArabic} />
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 mt-auto text-center">
                            <p className="text-xs text-slate-400">
                                {t("Need further assistance? Contact our support anytime.", "هل تحتاج إلى مساعدة إضافية؟ فريق الدعم جاهز دائماً.")}
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </main>
    );
}
