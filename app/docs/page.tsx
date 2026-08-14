"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    BookOpen,
    ScanLine,
    Brain,
    ShieldCheck,
    Database,
    Search,
    ChevronRight,
    Sparkles,
    CheckCircle2,
    AlertTriangle,
    FileText,
    Terminal,
    Copy,
    ArrowRight,
    Pill,
    HelpCircle,
    UserCheck,
    Activity,
    Layers,
    Cpu,
    ExternalLink,
} from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/Button";

export default function DocsPage() {
    const { resultsLanguage } = useSettings();
    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    const [activeTab, setActiveTab] = useState<"user-guide" | "scanner-how" | "qure-ai" | "safety-guard" | "sources" | "api">("user-guide");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeStep, setActiveStep] = useState(0);
    const [copiedCode, setCopiedCode] = useState(false);

    const copyCode = (text: string) => {
        if (typeof navigator !== "undefined") {
            navigator.clipboard.writeText(text);
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        }
    };

    // Workflow Steps for Scanner Interactive Animation
    const scannerSteps = [
        {
            number: "01",
            titleEn: "Photo Capture & Label Upload",
            titleAr: "التقاط الصورة أو رفع ملصق الدواء",
            descEn: "Take a clear picture of the medicine box, prescription, or FDA label using your camera or file uploader.",
            descAr: "قم بالتقاط صورة واضحة لعلبة الدواء، النشرة الطبية، أو الروشتة عبر الكاميرا أو رفع ملف مباشر.",
            icon: ScanLine,
            badge: t("Step 1", "الخطوة الأولى"),
            color: "text-cyan-400 bg-slate-900 border-slate-800",
        },
        {
            number: "02",
            titleEn: "Smart OCR Text Extraction",
            titleAr: "استخراج النصوص وتحليل المواد الفعالة",
            descEn: "QureScan reads scientific names, active ingredients, dosages, and serial numbers with high accuracy.",
            descAr: "تقوم المنصة باستخراج المادة الفعالة، اسم الدواء، التركيز، والمكونات من ملصق الصورة بدقة متناهية.",
            icon: Cpu,
            badge: t("Step 2", "الخطوة الثانية"),
            color: "text-emerald-400 bg-slate-900 border-slate-800",
        },
        {
            number: "03",
            titleEn: "FDA Database & Cross-Check",
            titleAr: "مطابقة قواعد بيانات openFDA والمصادر",
            descEn: "Cross-checks active ingredients against openFDA database of 50,000+ registered drug labels.",
            descAr: "مطابقة المكونات الفعالة فورياً مع أكثر من 50,000 دواء مسجل في قواعد openFDA والروشتات المعتمدة.",
            icon: Database,
            badge: t("Step 3", "الخطوة الثالثة"),
            color: "text-blue-400 bg-slate-900 border-slate-800",
        },
        {
            number: "04",
            titleEn: "Personal Profile Health Match",
            titleAr: "فحص الحساسية والتاريخ الطبي الشخصي",
            descEn: "Verifies whether the medication conflicts with your personal chronic conditions, age, or listed allergies.",
            descAr: "مطابقة التداخلات مع ملفك الصحي الشخصي (الأمراض المزمنة، الحساسية المسجلة، والعمر) لمنع المخاطر.",
            icon: UserCheck,
            badge: t("Step 4", "الخطوة الرابعة"),
            color: "text-purple-400 bg-slate-900 border-slate-800",
        },
        {
            number: "05",
            titleEn: "Clinical Safety Report & AI Advice",
            titleAr: "إصدار تقرير السلامة واستشارة Qure AI",
            descEn: "Generates a clean safety summary rating and allows 1-click consultation with Qure AI assistant.",
            descAr: "إصدار تقرير شامل بدرجة السلامة الطبية وتنبيهات الجرعات مع إمكانية استشارة Qure AI فوراً.",
            icon: ShieldCheck,
            badge: t("Step 5", "الخطوة الخامسة"),
            color: "text-cyan-300 bg-slate-900 border-slate-800",
        },
    ];

    // Official Clinical Sources
    const clinicalSources = [
        {
            name: "openFDA Drug Database",
            nameAr: "قاعدة بيانات الدواء الغذاء والدواء الأمريكية (openFDA)",
            descEn: "Official U.S. Food and Drug Administration API providing 50,000+ structured package insert labels, warnings, and indications.",
            descAr: "الواجهة البرمجية الرسمية لهيئة الغذاء والدواء الأمريكية التي تضم أكثر من 50,000 نشرة طبية معتمدة وتحذيرات الجرعات.",
            url: "https://open.fda.gov",
            tag: "Official FDA Data",
        },
        {
            name: "RxNorm & DailyMed System",
            nameAr: "نظام التقييس الدولي للجرعات والمكونات (RxNorm)",
            descEn: "Standardized clinical drug nomenclature produced by the National Library of Medicine (NLM) for ingredient normalization.",
            descAr: "النظام القياسي للمكتبة الوطنية الأمريكية للمكتبات الطبية لربط المواد الفعالة بأسماء الأدوية العالمية والمحلية.",
            url: "https://dailymed.nlm.nih.gov",
            tag: "Clinical Standard",
        },
        {
            name: "DeepSeek-V3 & Multimodal Vision Engine",
            nameAr: "محرك الاستدلال الصيدلاني ورؤية الذكاء الاصطناعي",
            descEn: "State-of-the-art AI language and vision model specialized in multi-language OCR parsing and clinical safety context.",
            descAr: "نماذج الذكاء الاصطناعي المتقدمة لتحليل النصوص الطبية، قراءة الوصفات اليدوية، والتحقق من سلامة الجرعات.",
            url: "https://www.deepseek.com",
            tag: "AI Reasoning",
        },
        {
            name: "Qure AI Medical Core Engine",
            nameAr: "محرك Qure AI للسلامة والتحليل الدوائي",
            descEn: "Proprietary medical logic wrapper that integrates user personal health profiles with pharmaceutical knowledge bases.",
            descAr: "النواة الذكية لمنصة QureScan التي تربط سياق الملف الطبي الشخصي للمستخدم مع تحذيرات الأدوية والتداخلات.",
            url: "https://qurescan.com",
            tag: "QureCore",
        },
    ];

    // FAQ Guide List
    const guideFaqs = [
        {
            qEn: "How do I scan a medication accurately?",
            qAr: "كيف أقوم بفحص الدواء أو الروشتة بشكل صحيح؟",
            aEn: "Go to the Scan page, point your mobile camera at the medicine label or prescription in good lighting, and take a photo. Ensure active ingredients and drug name are readable.",
            aAr: "افتح صفحة 'فحص الدواء'، وجه كاميرا هاتفك نحو علبة الدواء أو الروشتة في إضاءة جيدة والتقط صورة واضحة تحتوي على اسم الدواء أو المادة الفعالة.",
        },
        {
            qEn: "What is Qure AI and how does it help me?",
            qAr: "ما هو مساعد Qure AI وكيف يساعدني؟",
            aEn: "Qure AI is your personal clinical health assistant. It remembers your age, allergies, chronic conditions, and past scanned medications to provide customized safety advice.",
            aAr: "مساعد Qure AI هو مرشدك الطبي الذكي، حيث يربط إجاباته بملفك الصحي الشخصي (العمر، الحساسية، الأمراض المزمنة) ليجيبك بدقة عن ملاءمة الأدوية لك.",
        },
        {
            qEn: "How are drug interaction warnings calculated?",
            qAr: "كيف يتم حساب تحذيرات التداخلات الطبية وتأثيراتها؟",
            aEn: "When you scan multiple medications or enter a new drug, QureScan cross-references their active ingredients against official FDA databases and flags mild, moderate, or severe conflicts.",
            aAr: "عند فحص أكثر من دواء أو قراءة مادة فعالة جديدة، تقارن المنصة المكونات مع قواعد openFDA لتحديد وجود تعارض، تداخل، أو محاذير استخدام.",
        },
        {
            qEn: "Is my personal medical data confidential and safe?",
            qAr: "هل بياناتي الطبية والشخصية محفوطة وآمنة؟",
            aEn: "Yes. All personal health profiles and allergy notes are stored securely using Supabase row-level security (RLS) with strict end-to-end access boundaries.",
            aAr: "نعم تماماً. يتم تشفير وسياق كافة البيانات الشخصية والملفات الصحية باستخدام أعلى معايير الحماية والأمان (Row Level Security).",
        },
    ];

    const apiCodeSnippet = `// QureScan API Example
const res = await fetch("https://qurescan.com/api/analyze", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    text: "Ibuprofen 400mg",
    mode: "health"
  })
});
const result = await res.json();
console.log("Analysis Output:", result);`;

    return (
        <main className="min-h-screen pt-16 sm:pt-24 pb-16 sm:pb-20 md:pb-16 px-3 sm:px-6 max-w-7xl mx-auto" dir={isArabic ? "rtl" : "ltr"}>
            
            {/* Top Hero Section */}
            <div className="text-center space-y-4 mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold">
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{t("Complete User Guide & Knowledge Base", "دليل الاستخدام الشامل والمصادر الطبية")}</span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                    {t("QureScan Knowledge & Guide", "دليل الاستخدام ومصادر التحليل")}
                </h1>

                <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    {t(
                        "Learn how QureScan analyzes medications, checks drug interactions, leverages openFDA data, and connects with Qure AI.",
                        "تعرّف بالتفصيل على طريقة عمل المنصة، خطوات فحص الأدوية، كشف التداخلات الطبية، واستعراض المصادر السريرية المعتمدة."
                    )}
                </p>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 no-scrollbar mb-10 border-b border-white/[0.08]">
                {[
                    { id: "user-guide", nameEn: "Quick Guide & FAQs", nameAr: "دليل الاستخدام والأسئلة", icon: BookOpen },
                    { id: "scanner-how", nameEn: "How Scanning Works", nameAr: "طريقة الفحص والتحليل", icon: ScanLine },
                    { id: "qure-ai", nameEn: "Qure AI Assistant", nameAr: "مساعد Qure AI", icon: Brain },
                    { id: "safety-guard", nameEn: "Drug Safety & Guard", nameAr: "حارس السلامة والتداخلات", icon: ShieldCheck },
                    { id: "sources", nameEn: "Clinical Data Sources", nameAr: "المصادر السريرية و openFDA", icon: Database },
                    { id: "api", nameEn: "Developer API Hub", nameAr: "واجهة المطورين والـ API", icon: Terminal },
                ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all duration-150 active:scale-95 border",
                                isActive
                                    ? "bg-slate-800 text-cyan-300 border-slate-700 shadow-md"
                                    : "bg-slate-950/60 text-slate-400 border-white/[0.06] hover:bg-slate-900 hover:text-slate-200"
                            )}
                        >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span>{isArabic ? tab.nameAr : tab.nameEn}</span>
                        </button>
                    );
                })}
            </div>

            {/* TAB CONTENT AREA */}
            <AnimatePresence mode="wait">
                
                {/* ── TAB 1: QUICK GUIDE & FAQS ── */}
                {activeTab === "user-guide" && (
                    <motion.div
                        key="user-guide"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                    >
                        {/* Quick Feature Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-5 rounded-2xl bg-[#080D1A]/85 backdrop-blur-2xl border border-white/[0.08] shadow-xl space-y-3">
                                <div className="w-10 h-10 rounded-xl bg-[#0C1324] border border-white/[0.08] flex items-center justify-center text-cyan-400">
                                    <ScanLine className="w-5 h-5" />
                                </div>
                                <h3 className="text-base font-bold text-white">
                                    {t("1. Scan Any Medicine", "1. فحص أي دواء أو روشتة")}
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    {t(
                                        "Upload or take a photo of pills, medicine boxes, or medical prescriptions. OCR extracts exact active ingredients in seconds.",
                                        "التقط صورة لعلبة الدواء أو الوصفة الطبية، لتقوم التقنية باستخراج المواد الفعالة والجرعات في ثوانٍ معدودة."
                                    )}
                                </p>
                                <Link href="/scan" className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:underline pt-1">
                                    <span>{t("Try Scan Now", "جرب الفحص الآن")}</span>
                                    <ChevronRight className={cn("w-3.5 h-3.5", isArabic ? "rotate-180" : "")} />
                                </Link>
                            </div>

                            <div className="p-5 rounded-2xl bg-[#080D1A]/85 backdrop-blur-2xl border border-white/[0.08] shadow-xl space-y-3">
                                <div className="w-10 h-10 rounded-xl bg-[#0C1324] border border-white/[0.08] flex items-center justify-center text-emerald-400">
                                    <Brain className="w-5 h-5" />
                                </div>
                                <h3 className="text-base font-bold text-white">
                                    {t("2. Ask Qure AI", "2. استشارة Qure AI")}
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    {t(
                                        "Chat with your clinical AI assistant. Ask whether a medicine suits your health profile, allergies, or current prescriptions.",
                                        "تحدث مع مساعدك الطبي الذكي واسأله عن ملاءمة الأدوية لملفك الصحي وشخص تشخيص الحساسية والتفاعلات."
                                    )}
                                </p>
                                <Link href="/ai" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:underline pt-1">
                                    <span>{t("Open Qure AI", "افتح Qure AI")}</span>
                                    <ChevronRight className={cn("w-3.5 h-3.5", isArabic ? "rotate-180" : "")} />
                                </Link>
                            </div>

                            <div className="p-5 rounded-2xl bg-[#080D1A]/85 backdrop-blur-2xl border border-white/[0.08] shadow-xl space-y-3">
                                <div className="w-10 h-10 rounded-xl bg-[#0C1324] border border-white/[0.08] flex items-center justify-center text-cyan-300">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <h3 className="text-base font-bold text-white">
                                    {t("3. Interaction Guard", "3. حارس التداخلات والأمان")}
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    {t(
                                        "Automatic cross-reference against 50,000+ FDA entries to detect conflicts, food interactions, and contraindications.",
                                        "فحص فوري وتلقائي بين الأدوية المختلفة مع قواعد openFDA لمنع التعارض الخطر أو تداخل المواد الفعالة."
                                    )}
                                </p>
                                <Link href="/profile" className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-400 hover:underline pt-1">
                                    <span>{t("Setup Profile", "إعداد الملف الصحي")}</span>
                                    <ChevronRight className={cn("w-3.5 h-3.5", isArabic ? "rotate-180" : "")} />
                                </Link>
                            </div>
                        </div>

                        {/* FAQs Section */}
                        <div className="space-y-4 pt-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <HelpCircle className="w-5 h-5 text-cyan-400" />
                                <span>{t("Frequently Asked Questions", "الأسئلة الشائعة حول الاستخدام")}</span>
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {guideFaqs.map((faq, i) => (
                                    <div key={i} className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.07] space-y-2">
                                        <h4 className="text-xs font-bold text-white flex items-start gap-2">
                                            <span className="w-5 h-5 rounded-lg bg-slate-800 border border-slate-700 text-cyan-300 flex items-center justify-center shrink-0 text-[10px]">Q</span>
                                            <span className="leading-snug">{isArabic ? faq.qAr : faq.qEn}</span>
                                        </h4>
                                        <p className="text-xs text-slate-400 leading-relaxed ps-7">
                                            {isArabic ? faq.aAr : faq.aEn}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── TAB 2: HOW SCANNING WORKS ── */}
                {activeTab === "scanner-how" && (
                    <motion.div
                        key="scanner-how"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                    >
                        <div className="p-6 rounded-3xl bg-[#080D1A]/85 backdrop-blur-2xl border border-white/[0.08] shadow-2xl space-y-6">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div>
                                    <h2 className="text-xl font-extrabold text-white">
                                        {t("Interactive 5-Step Analysis Pipeline", "مسار فحص وتحليل الأدوية التفاعلي")}
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {t("Click any step to explore how QureScan processes your medication image.", "اضغط على أي خطوة للاطلاع على كيفية معالجة الصورة وتحليلها.")}
                                    </p>
                                </div>
                                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-950 border border-cyan-800 text-cyan-300">
                                    Pipeline Speed: &lt; 2.5s
                                </span>
                            </div>

                            {/* Step Indicator Tabs */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                {scannerSteps.map((step, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveStep(idx)}
                                        className={cn(
                                            "p-3 rounded-xl border text-center transition-all duration-150 flex flex-col items-center gap-1.5 active:scale-95",
                                            activeStep === idx
                                                ? "bg-slate-800 border-white/20 text-white"
                                                : "bg-slate-950/60 border-white/[0.06] text-slate-400 hover:text-white"
                                        )}
                                    >
                                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 text-cyan-300">
                                            {step.number}
                                        </span>
                                        <span className="text-xs font-bold truncate w-full">
                                            {isArabic ? step.titleAr.split(" ")[0] : step.titleEn.split(" ")[0]}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Step Detail Card */}
                            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center gap-5">
                                {(() => {
                                    const current = scannerSteps[activeStep];
                                    const Icon = current.icon;
                                    return (
                                        <>
                                            <div className={cn("w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0", current.color)}>
                                                <Icon className="w-7 h-7" />
                                            </div>
                                            <div className="space-y-1.5 flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono font-bold text-cyan-400">{current.badge}</span>
                                                    <h3 className="text-lg font-extrabold text-white">{isArabic ? current.titleAr : current.titleEn}</h3>
                                                </div>
                                                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                                    {isArabic ? current.descAr : current.descEn}
                                                </p>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── TAB 3: QURE AI ASSISTANT ── */}
                {activeTab === "qure-ai" && (
                    <motion.div
                        key="qure-ai"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <div className="p-6 rounded-3xl bg-[#080D1A]/85 backdrop-blur-2xl border border-white/[0.08] shadow-2xl space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 shrink-0">
                                    <Brain className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        {t("Qure AI Clinical Assistant", "المساعد الطبي الذكي Qure AI")}
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {t("Personalized clinical advice integrated with your health profile.", "مساعدك الشخصي للربط بين ملفك الصحي وتداخلات الأدوية.")}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                                        <UserCheck className="w-4 h-4" />
                                        <span>{t("Profile Awareness", "الإلمام بالملف الشخصي")}</span>
                                    </div>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        {t(
                                            "Qure AI automatically reads your age, listed allergies, and chronic conditions to warn you if a medicine poses personal risks.",
                                            "يقرأ Qure AI تلقائياً عمرك، الحساسية المسجلة، والأمراض المزمنة ليحذرك فوراً إذا كان الدواء يشكل خطراً عليك."
                                        )}
                                    </p>
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                                        <Pill className="w-4 h-4" />
                                        <span>{t("Medication Memory", "ذاكرة الأدوية والروشتات")}</span>
                                    </div>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        {t(
                                            "Keeps track of your past scanned drugs so you can ask follow-up questions like 'Can I take this with my morning pill?'",
                                            "يتذكر الأدوية التي قمت بفحصها سابقاً لتتمكن من السؤال المباشر: 'هل يمكنني تناول هذا مع دوائي الصباحي؟'."
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold text-white">{t("Ready to test Qure AI?", "جاهز لتجربة Qure AI؟")}</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">{t("Available for ULTRA plan members with unlimited context.", "متاح لمشتركي ألترا مع إمكانية الربط بالملف الصحي الكامل.")}</p>
                                </div>
                                <Link href="/ai">
                                    <Button variant="primary" size="xs" className="font-bold px-4">
                                        {t("Open Chat", "بدء المحادثة")}
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── TAB 4: DRUG SAFETY GUARD ── */}
                {activeTab === "safety-guard" && (
                    <motion.div
                        key="safety-guard"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <div className="p-6 rounded-3xl bg-[#080D1A]/85 backdrop-blur-2xl border border-white/[0.08] shadow-2xl space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-purple-400 shrink-0">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        {t("Pharmaceutical Interaction & Safety Ratings", "مستويات الأمان وتصنيف التداخلات الدوائية")}
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {t("Understanding QureScan clinical safety colors and alerts.", "دليل فهم الألوان وتصنيفات الأمان الصيدلاني في التقرير.")}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/50 space-y-2">
                                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>{t("SAFE / SAFE MATCH", "آمن / لا توجد تداخلات خطرة")}</span>
                                    </div>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        {t(
                                            "Active ingredients show no known severe conflicts with your health profile or concurrent medicines.",
                                            "المكونات الفعالة لا تظهر أي تعارضات خطرة مع ملفك الصحي أو الأدوية الحالية المسجلة."
                                        )}
                                    </p>
                                </div>

                                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/50 space-y-2">
                                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                                        <AlertTriangle className="w-4 h-4" />
                                        <span>{t("CAUTION / DOSAGE WARNING", "تنبيه / يرجى مراجعة الجرعة")}</span>
                                    </div>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        {t(
                                            "Requires careful dosage monitoring or meal timing (e.g. take after food, monitor blood pressure).",
                                            "يتطلب تعليمات خاصة كالتناول بعد الطعام أو ضبط التوقيت أو الحذر مع حالات الضغط والسكر."
                                        )}
                                    </p>
                                </div>

                                <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800/50 space-y-2">
                                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                                        <AlertTriangle className="w-4 h-4" />
                                        <span>{t("CONTRAINDICATION / HIGH RISK", "تحذير شديد / تعارض دوائي")}</span>
                                    </div>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        {t(
                                            "High-risk interaction detected with your allergy list or active medications. Requires doctor review.",
                                            "تحذير من تعارض قوي بين المادة الفعالة وأحد أدويتك أو حساسيتك المسجلة، يستوجب مراجعة الطبيب."
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── TAB 5: CLINICAL DATA SOURCES & openFDA ── */}
                {activeTab === "sources" && (
                    <motion.div
                        key="sources"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <div className="p-6 rounded-3xl bg-[#080D1A]/85 backdrop-blur-2xl border border-white/[0.08] shadow-2xl space-y-6">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 shrink-0">
                                        <Database className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">
                                            {t("Clinical Knowledge Bases & Sources", "قواعد البيانات والمصادر الطبية السريرية")}
                                        </h2>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {t("Authentic, verified data sources utilized by QureScan engine.", "قواعد البيانات الدولية المعتمدة التي تعتمد عليها المنصة.")}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {clinicalSources.map((source, i) => (
                                    <div key={i} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className="text-sm font-bold text-white">{isArabic ? source.nameAr : source.name}</h3>
                                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-cyan-300 border border-slate-700">
                                                    {source.tag}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 leading-relaxed">
                                                {isArabic ? source.descAr : source.descEn}
                                            </p>
                                        </div>

                                        <a
                                            href={source.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-cyan-400 hover:underline pt-2"
                                        >
                                            <span>{t("Visit Official Source", "زيارة المصدر الرسمي")}</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── TAB 6: DEVELOPER API HUB ── */}
                {activeTab === "api" && (
                    <motion.div
                        key="api"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <div className="p-6 rounded-3xl bg-[#080D1A]/85 backdrop-blur-2xl border border-white/[0.08] shadow-2xl space-y-6">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 shrink-0">
                                        <Terminal className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">
                                            {t("Developer API & Integration Hub", "واجهة برمجة التطبيقات للمطورين (API)")}
                                        </h2>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {t("Integrate QureScan drug analysis engine with your external app.", "ربط محرك تحليل الأدوية والروشتات مع تطبيقك الخارجي.")}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Code Snippet Box */}
                            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                                    <span>POST /api/analyze</span>
                                    <button
                                        onClick={() => copyCode(apiCodeSnippet)}
                                        className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-bold active:scale-95 transition-all"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>{copiedCode ? t("Copied!", "تم النسخ!") : t("Copy Code", "نسخ الكود")}</span>
                                    </button>
                                </div>
                                <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed dir-ltr">
                                    {apiCodeSnippet}
                                </pre>
                            </div>
                        </div>
                    </motion.div>
                )}

            </AnimatePresence>
        </main>
    );
}
