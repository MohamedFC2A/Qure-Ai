"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
    Crown,
    Sparkles,
    CheckCircle2,
    Brain,
    Shield,
    Users,
    HeartPulse,
    FileText,
    GitFork,
    Zap,
    Database,
    ArrowRight,
    X,
    Volume2,
    VolumeX,
    Flame,
    ExternalLink,
    LockOpen,
    Star,
    Award,
    Check,
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useSettings } from "@/context/SettingsContext";
import { useUltraCelebration } from "@/context/UltraCelebrationContext";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* ── Web Audio API Chime Synthesizer ───────────────────────────── */
function playCelebrationChime() {
    try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        if (ctx.state === "suspended") {
            ctx.resume();
        }

        const now = ctx.currentTime;
        // Pentatonic shimmer chord: C5, E5, G5, B5, D6
        const frequencies = [523.25, 659.25, 783.99, 987.77, 1174.66];

        frequencies.forEach((freq, index) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now + index * 0.08);

            // Shimmer vibrato
            const startTime = now + index * 0.08;
            gain.gain.setValueAtTime(0.0001, startTime);
            gain.gain.exponentialRampToValueAtTime(0.12 / (index + 1), startTime + 0.06);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.2 + index * 0.2);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + 1.6);
        });
    } catch {
        // audio playback might be blocked by browser policy until interaction
    }
}

/* ── Confetti Cannons ─────────────────────────────────────────── */
function fireCelebrationConfetti() {
    try {
        // Cannon 1: Bottom Left
        confetti({
            particleCount: 70,
            angle: 60,
            spread: 65,
            origin: { x: 0.05, y: 0.85 },
            colors: ["#06b6d4", "#38bdf8", "#fbbf24", "#a855f7", "#34d399", "#f59e0b"],
            zIndex: 99999,
        });

        // Cannon 2: Bottom Right
        confetti({
            particleCount: 70,
            angle: 120,
            spread: 65,
            origin: { x: 0.95, y: 0.85 },
            colors: ["#06b6d4", "#38bdf8", "#fbbf24", "#a855f7", "#34d399", "#f59e0b"],
            zIndex: 99999,
        });

        // Center Gold & Cyan Starburst after 250ms
        setTimeout(() => {
            confetti({
                particleCount: 90,
                spread: 100,
                origin: { x: 0.5, y: 0.35 },
                colors: ["#f59e0b", "#fbbf24", "#06b6d4", "#ffffff", "#818cf8"],
                shapes: ["circle", "square"],
                scalar: 1.1,
                zIndex: 99999,
            });
        }, 250);
    } catch {
        // ignore confetti errors
    }
}

/* ── 8 Powerhouse Ultra Features Data ──────────────────────────── */
interface UltraFeatureItem {
    id: string;
    category: "ai" | "safety" | "reports";
    icon: React.ElementType;
    color: string;
    badgeEn: string;
    badgeAr: string;
    titleEn: string;
    titleAr: string;
    descriptionEn: string;
    descriptionAr: string;
    highlightEn: string;
    highlightAr: string;
    actionEn: string;
    actionAr: string;
    actionHref: string;
}

const ultraFeaturesList: UltraFeatureItem[] = [
    {
        id: "ai-assistant",
        category: "ai",
        icon: Brain,
        color: "from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30",
        badgeEn: "Unlimited AI",
        badgeAr: "محادثات غير محدودة",
        titleEn: "Full Qure AI Clinical Assistant",
        titleAr: "المساعد الطبي الذكي Qure AI بلا قيود",
        descriptionEn: "Direct, uninterrupted medical chat consultations, in-depth drug mechanisms, symptom cross-checks, and personalized pharmacology intelligence 24/7.",
        descriptionAr: "محادثات واستشارات طبية فورية بلا حدود، تحليل معمق للأعراض والميكانيزم الدوائي، وتوجيه صيدلاني دقيق مدعوم بأقوى نماذج الذكاء الطبي على مدار الساعة.",
        highlightEn: "Clinical AI Chat & Drug Q&A",
        highlightAr: "استشارات طبية فورية ومحادثة صيدلانية ذكية",
        actionEn: "Chat with Qure AI",
        actionAr: "بدء محادثة طبية الآن",
        actionHref: "/ai",
    },
    {
        id: "safety-guard",
        category: "safety",
        icon: Shield,
        color: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30",
        badgeEn: "Active Clinical Guard",
        badgeAr: "حماية سريرية نشطة",
        titleEn: "Smart Drug Interaction & Safety Guard",
        titleAr: "حارس التداخلات الدوائية والسلامة السريرية",
        descriptionEn: "Comprehensive real-time detection of high-risk drug-to-drug interactions, maximum safe dosage breaches, and critical contraindications.",
        descriptionAr: "كشف فوري شامل للتفاعلات الخطيرة بين أدويتك المختلفة، وفحص تلقائي للجرعات القصوى الآمنة والتحذيرات الحرجة لتجنب أي تعارضات غير محسوبة.",
        highlightEn: "Drug-Drug Conflict Detection",
        highlightAr: "كشف التعارضات والتداخلات الدوائية المزدوجة",
        actionEn: "Run Safety Scan",
        actionAr: "فحص تداخلات الأدوية",
        actionHref: "/scan",
    },
    {
        id: "family-profiles",
        category: "safety",
        icon: Users,
        color: "from-violet-500/20 to-purple-500/20 text-violet-400 border-violet-500/30",
        badgeEn: "Unlimited Profiles",
        badgeAr: "ملفات عائلية مستقلة",
        titleEn: "Family & Caregiver Profiles Management",
        titleAr: "إدارة ملفات الأسرة ومقدمي الرعاية",
        descriptionEn: "Manage distinct health profiles for parents, children, and elderly loved ones. Run independent scans and track separate medication histories seamlessly.",
        descriptionAr: "أنشئ ملفات صحية مستقلة تماماً لكل فرد من عائلتك (الوالدين، الأبناء، كبار السن) مع عزل سجلات الفحص والتحذيرات الخاصة بكل شخص بكل سهولة.",
        highlightEn: "Multi-Member Health Memory",
        highlightAr: "سجلات منفصلة لحماية كل أفراد أسرتك",
        actionEn: "Manage Family Profiles",
        actionAr: "إدارة ملفات العائلة",
        actionHref: "/profile?tab=family",
    },
    {
        id: "health-context",
        category: "safety",
        icon: HeartPulse,
        color: "from-rose-500/20 to-pink-500/20 text-rose-400 border-rose-500/30",
        badgeEn: "100% Personalized",
        badgeAr: "مواءمة شخصية دقيقة",
        titleEn: "Private Health & Allergy Context Integration",
        titleAr: "سياق الملف الصحي والحساسية الشخصية",
        descriptionEn: "Every scan automatically factors in your chronic conditions, drug allergies, age, and existing prescriptions to issue tailored clinical alerts.",
        descriptionAr: "يربط الذكاء الاصطناعي كل فحص بتاريخ حساسيتك الدوائية وأمراضك المزمنة تلقائياً لينبهك فوراً إذا كان الدواء يحتوي على مكونات تتعارض معك.",
        highlightEn: "Allergy & Chronic Illness Matching",
        highlightAr: "تنبيهات فورية مطابقة لملفك الصحي",
        actionEn: "Update Health Profile",
        actionAr: "تحديث ملفك الصحي",
        actionHref: "/profile?tab=private",
    },
    {
        id: "pdf-reports",
        category: "reports",
        icon: FileText,
        color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
        badgeEn: "Vector HD Export",
        badgeAr: "تقارير PDF طبية",
        titleEn: "Clinical PDF & PNG Report Exports",
        titleAr: "تصدير تقارير PDF طبية سريرية احترافية",
        descriptionEn: "Export rich, doctor-ready PDF reports of your medication scans and treatment guides to share instantly with your physician or pharmacist.",
        descriptionAr: "صدّر تقارير فحص احترافية فائقة الدقة بضغطة زر بصيغة PDF وطباعتها أو مشاركتها مع طبيبك المعالج أو الصيدلي للمراجعة الطبية.",
        highlightEn: "Doctor-Ready Export Reports",
        highlightAr: "تقارير جاهزة للمشاركة مع الطبيب والصيدلي",
        actionEn: "View Scan Reports",
        actionAr: "استعراض السجل والتقارير",
        actionHref: "/dashboard/history",
    },
    {
        id: "question-tree",
        category: "ai",
        icon: GitFork,
        color: "from-indigo-500/20 to-cyan-500/20 text-indigo-400 border-indigo-500/30",
        badgeEn: "Smart Diagnostic Tree",
        badgeAr: "شجرة أسئلة ذكية",
        titleEn: "Interactive Follow-Up Clinical Tree",
        titleAr: "شجرة الأسئلة والمتابعة التفاعلية",
        descriptionEn: "Dynamic diagnostic questions generated in real time after every scan to uncover side-effect risks, optimal administration times, and next steps.",
        descriptionAr: "توليد شجرة أسئلة سريرية تفاعلية مخصصة تتفرع حسب إجاباتك لتوجيهك نحو أفضل أوقات تناول الدواء والأعراض الجانبية المحتملة.",
        highlightEn: "Branching Clinical Guidance",
        highlightAr: "إرشادات تفاعلية مخصصة لكل حالة",
        actionEn: "Try Question Tree",
        actionAr: "استكشاف شجرة الأسئلة",
        actionHref: "/scan",
    },
    {
        id: "credits-refill",
        category: "reports",
        icon: Zap,
        color: "from-yellow-500/20 to-amber-500/20 text-yellow-400 border-yellow-500/30",
        badgeEn: "300 Monthly Credits",
        badgeAr: "٣٠٠ رصيد شهرياً",
        titleEn: "300 Monthly Credits & Auto-Refill",
        titleAr: "٣٠٠ رصيد شهري للفحوصات والمحادثات",
        descriptionEn: "A massive quota of 300 credits every month for deep scans and AI messages, automatically refilled every 30 days without interruption.",
        descriptionAr: "رصيد شهري ضخم يمنحك حرية إجراء مئات الفحوصات والاستشارات الذكية مع تجديد وتعبئة تلقائية ذكية كل 30 يوماً دون أي انقطاع.",
        highlightEn: "10x Free Plan Quota",
        highlightAr: "١٠ أضعاف رصيد الخطة المجانية",
        actionEn: "Check Credits Balance",
        actionAr: "عرض الرصيد والاستخدام",
        actionHref: "/profile?tab=credits",
    },
    {
        id: "fda-ndc",
        category: "ai",
        icon: Database,
        color: "from-teal-500/20 to-cyan-500/20 text-teal-300 border-teal-500/30",
        badgeEn: "Official FDA Database",
        badgeAr: "قواعد بيانات FDA الرسمية",
        titleEn: "Automatic FDA & NDC Official Data Verification",
        titleAr: "التحقق الرسمي التلقائي من قواعد بيانات FDA و NDC",
        descriptionEn: "Instant cross-checking with official US FDA drug labels and National Drug Code (NDC) directories for verified active ingredients and clinical accuracy.",
        descriptionAr: "مطابقة أوتوماتيكية مع السجلات الرسمية المعتمدة لهيئة الغذاء والدواء الأمريكية وقواعد NDC للتحقق من أسماء المواد الفعالة والجرعات والشركات.",
        highlightEn: "Official Government Verification",
        highlightAr: "مطابقة مباشرة مع السجلات الدوائية المعتمدة",
        actionEn: "FDA Settings",
        actionAr: "إعدادات التحقق من FDA",
        actionHref: "/profile?tab=fda",
    },
];

export function UltraCelebrationModal() {
    const { isOpen, closeCelebration } = useUltraCelebration();
    const { user, profile } = useUser();
    const { resultsLanguage } = useSettings();
    const router = useRouter();

    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    const [activeTab, setActiveTab] = useState<"all" | "ai" | "safety" | "reports">("all");
    const [soundEnabled, setSoundEnabled] = useState(true);
    const hasPlayedSoundRef = useRef(false);

    const filteredFeatures =
        activeTab === "all"
            ? ultraFeaturesList
            : ultraFeaturesList.filter((f) => f.category === activeTab);

    // Trigger sound and confetti upon opening
    useEffect(() => {
        if (isOpen) {
            fireCelebrationConfetti();
            if (soundEnabled && !hasPlayedSoundRef.current) {
                playCelebrationChime();
                hasPlayedSoundRef.current = true;
            }
        } else {
            hasPlayedSoundRef.current = false;
        }
    }, [isOpen, soundEnabled]);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                closeCelebration();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, closeCelebration]);

    const handleActionClick = (href: string) => {
        closeCelebration();
        router.push(href);
    };

    if (!isOpen) return null;

    const usernameDisplay =
        profile?.full_name ||
        profile?.username ||
        user?.user_metadata?.full_name ||
        user?.user_metadata?.username ||
        (user?.email ? user.email.split("@")[0] : isArabic ? "عضو Qure AI المتميز" : "Valued Member");

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-y-auto bg-slate-950/85 backdrop-blur-xl"
                dir={isArabic ? "rtl" : "ltr"}
            >
                {/* ── Background Aura Lights ───────────────────────── */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[750px] h-[550px] bg-gradient-to-tr from-cyan-500/8 via-amber-500/5 to-violet-600/8 rounded-full blur-[140px] opacity-50" />
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px]" />
                    <div className="absolute top-10 left-10 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px]" />
                </div>

                {/* ── Main Modal Container ─────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 25 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 25 }}
                    transition={{ type: "spring", stiffness: 300, damping: 28 }}
                    className={cn(
                        "relative w-full max-w-5xl my-auto rounded-3xl sm:rounded-[32px] overflow-hidden",
                        "bg-slate-900/90 border border-white/[0.08] backdrop-blur-2xl",
                        "flex flex-col max-h-[92vh] text-slate-100"
                    )}
                >
                    {/* Top Glowing Gradient Line */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-cyan-400 to-violet-500 shrink-0" />

                    {/* ── Header Controls (Sound, Re-fire confetti, Close) ─ */}
                    <div className="absolute top-4 end-4 z-20 flex items-center gap-2">
                        {/* Sound Toggle */}
                        <button
                            onClick={() => {
                                const next = !soundEnabled;
                                setSoundEnabled(next);
                                if (next) playCelebrationChime();
                            }}
                            title={soundEnabled ? t("Mute Sound", "كتم الصوت") : t("Enable Sound", "تفعيل الصوت")}
                            className="p-2 sm:p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all backdrop-blur-md"
                        >
                            {soundEnabled ? (
                                <Volume2 className="w-4 h-4 text-cyan-400" />
                            ) : (
                                <VolumeX className="w-4 h-4 text-slate-400" />
                            )}
                        </button>

                        {/* Re-fire Fireworks */}
                        <button
                            onClick={() => {
                                fireCelebrationConfetti();
                                if (soundEnabled) playCelebrationChime();
                            }}
                            title={t("Launch Fireworks!", "إطلاق الألعاب النارية!")}
                            className="p-2 sm:p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-all backdrop-blur-md flex items-center gap-1.5 text-xs font-bold"
                        >
                            <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
                            <span className="hidden sm:inline">{t("Fireworks", "احتفال")}</span>
                        </button>

                        {/* Close Button */}
                        <button
                            onClick={closeCelebration}
                            title={t("Close", "إغلاق")}
                            className="p-2 sm:p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 transition-all backdrop-blur-md"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* ── Scrollable Body ──────────────────────────────── */}
                    <div className="overflow-y-auto p-5 sm:p-8 md:p-10 space-y-8 custom-scrollbar">

                        {/* 👑 VIP HERO BANNER & GRATITUDE NOTE ────────── */}
                        <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-slate-950/90 via-slate-900/90 to-cyan-950/60 border border-cyan-500/30 shadow-xl">
                            {/* Ambient Light Orbs */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
                                
                                {/* 3D Holographic Crown Badge */}
                                <div className="relative shrink-0">
                                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white/[0.06] border border-amber-400/25 flex items-center justify-center relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                        <Crown className="w-12 h-12 sm:w-14 sm:h-14 text-amber-400" />
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-black tracking-widest uppercase shadow-md flex items-center gap-1">
                                        <Sparkles className="w-3 h-3 fill-slate-950" />
                                        <span>ELITE</span>
                                    </div>
                                </div>

                                {/* Gratitude Text */}
                                <div className="flex-1 text-center md:text-start space-y-3">
                                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-bold">
                                        <Award className="w-3.5 h-3.5 text-amber-400" />
                                        <span>{t("ULTRA Membership Activated", "تم تفعيل عضوية باقة ULTRA بنجاح")}</span>
                                    </div>

                                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                                        {isArabic ? (
                                            <>
                                                شكراً جزيلاً لثقتك وانضمامك إلى{" "}
                                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-cyan-300 to-violet-300">
                                                    نخبة مشتركي ألترا (ULTRA)!
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                Thank You for Joining the{" "}
                                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-cyan-300 to-violet-300">
                                                    ULTRA VIP Tier!
                                                </span>
                                            </>
                                        )}
                                    </h1>

                                    <p className="text-xs sm:text-sm md:text-base text-slate-300 leading-relaxed max-w-2xl">
                                        {isArabic ? (
                                            <>
                                                أهلاً بك يا <span className="text-white font-bold underline decoration-cyan-400 decoration-2">{usernameDisplay}</span> في أعلى مستويات الذكاء الطبي والصيدلاني. تم فتح جميع القدرات الاحترافية في حسابك لتنعم برعاية متكاملة لك ولعائلتك.
                                            </>
                                        ) : (
                                            <>
                                                Welcome <span className="text-white font-bold underline decoration-cyan-400 decoration-2">{usernameDisplay}</span> to the highest tier of pharmaceutical and clinical AI intelligence. All powerhouse capabilities are now fully unlocked for you and your family!
                                            </>
                                        )}
                                    </p>

                                    {/* Quick Metrics Bar */}
                                    <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2.5 sm:gap-4 text-xs font-medium text-slate-300">
                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10">
                                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                                            <span>{t("300 Monthly Credits", "٣٠٠ رصيد شهرياً")}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10">
                                            <Brain className="w-3.5 h-3.5 text-cyan-400" />
                                            <span>{t("Unlimited Qure AI Chat", "محادثات AI بلا قيود")}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10">
                                            <Users className="w-3.5 h-3.5 text-violet-400" />
                                            <span>{t("Multi-Family Care", "ملفات عائلية كاملة")}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10">
                                            <Shield className="w-3.5 h-3.5 text-emerald-400" />
                                            <span>{t("FDA & Drug Safety Guard", "حماية سريرية ومطابقة FDA")}</span>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* ── FILTER TABS ─────────────────────────────────── */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-4">
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-cyan-400" />
                                    <span>{t("All Unlocked Ultra Features", "المميزات والإمكانيات التي انفتحت لك")}</span>
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {t("Explore the 8 powerhouse features now active on your account", "استكشف ٨ مميزات جبارة أصبحت مفعّلة وجاهزة للاستخدام في حسابك")}
                                </p>
                            </div>

                            <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-950/80 border border-white/10 shrink-0">
                                {[
                                    { id: "all",     labelEn: "All (8)",      labelAr: "الكل (8)" },
                                    { id: "ai",      labelEn: "AI & Chat",    labelAr: "الذكاء الطبي" },
                                    { id: "safety",  labelEn: "Safety & Family", labelAr: "الأمان والأسرة" },
                                    { id: "reports", labelEn: "Credits & PDF", labelAr: "الرصيد والتقارير" },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                                            activeTab === tab.id
                                                ? "bg-cyan-500 text-slate-950 shadow-md"
                                                : "text-slate-400 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        {isArabic ? tab.labelAr : tab.labelEn}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── 8 POWERHOUSE FEATURE CARDS GRID ─────────────── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                            {filteredFeatures.map((item, index) => {
                                const Icon = item.icon;
                                return (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.25, delay: index * 0.04 }}
                                        className="relative group rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-white/[0.03] border border-white/[0.07] hover:border-white/15 transition-all duration-300 flex flex-col justify-between backdrop-blur-xl"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-3 mb-4">
                                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/[0.08] bg-white/[0.04] shrink-0">
                                                    <Icon className={cn("w-6 h-6", item.color.split(" ").find((c: string) => c.startsWith("text-")) || "text-white/70")} />
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300">
                                                        {isArabic ? item.badgeAr : item.badgeEn}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                                                        <LockOpen className="w-2.5 h-2.5" />
                                                        <span>{t("Active", "مفعّل 🔓")}</span>
                                                    </span>
                                                </div>
                                            </div>

                                            <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                                                {isArabic ? item.titleAr : item.titleEn}
                                            </h3>

                                            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                                                {isArabic ? item.descriptionAr : item.descriptionEn}
                                            </p>

                                            <div className="mt-3.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-semibold">
                                                <Check className="w-3 h-3 text-cyan-400" />
                                                <span>{isArabic ? item.highlightAr : item.highlightEn}</span>
                                            </div>
                                        </div>

                                        <div className="pt-5 mt-4 border-t border-white/5 flex items-center justify-between gap-3">
                                            <button
                                                onClick={() => handleActionClick(item.actionHref)}
                                                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-300 font-bold text-xs transition-all flex items-center justify-center gap-2 group-hover:bg-cyan-500 group-hover:text-slate-950"
                                            >
                                                <span>{isArabic ? item.actionAr : item.actionEn}</span>
                                                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* ── FAST LAUNCHPAD SHORTCUTS ────────────────────── */}
                        <div className="rounded-3xl p-6 sm:p-7 bg-slate-950/90 border border-cyan-500/20 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-amber-400" />
                                    <h3 className="text-base sm:text-lg font-bold text-white">
                                        {t("Quick Start Launchpad", "انطلق الآن وجرب ميزاتك المفتوحة")}
                                    </h3>
                                </div>
                                <span className="text-xs text-slate-400 font-medium">
                                    {t("Choose your first destination", "اختر وجهتك الأولى")}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <button
                                    onClick={() => handleActionClick("/scan")}
                                    className="p-4 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-start transition-all flex items-center gap-3 group"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center shrink-0 font-bold">
                                        <Sparkles className="w-4.5 h-4.5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 truncate">
                                            {t("Start Medication Scan", "فحص دواء جديد")}
                                        </p>
                                        <p className="text-[11px] text-slate-400 truncate">
                                            {t("OCR & FDA Check", "تحليل OCR ومطابقة FDA")}
                                        </p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => handleActionClick("/ai")}
                                    className="p-4 rounded-2xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-start transition-all flex items-center gap-3 group"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-violet-500 text-white flex items-center justify-center shrink-0 font-bold">
                                        <Brain className="w-4.5 h-4.5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm font-bold text-white group-hover:text-violet-300 truncate">
                                            {t("Chat with Qure AI", "محادثة Qure AI")}
                                        </p>
                                        <p className="text-[11px] text-slate-400 truncate">
                                            {t("Unlimited Medical Chat", "استشارات طبية غير محدودة")}
                                        </p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => handleActionClick("/profile?tab=family")}
                                    className="p-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-start transition-all flex items-center gap-3 group"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 font-bold">
                                        <Users className="w-4.5 h-4.5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 truncate">
                                            {t("Family Profiles", "ملفات العائلة")}
                                        </p>
                                        <p className="text-[11px] text-slate-400 truncate">
                                            {t("Add Family Members", "إضافة ملفات الأبناء والوالدين")}
                                        </p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => handleActionClick("/dashboard")}
                                    className="p-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-start transition-all flex items-center gap-3 group"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-bold">
                                        <Crown className="w-4.5 h-4.5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 truncate">
                                            {t("Open Dashboard", "لوحة التحكم")}
                                        </p>
                                        <p className="text-[11px] text-slate-400 truncate">
                                            {t("Manage All Insights", "استعراض الإحصائيات الشاملة")}
                                        </p>
                                    </div>
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* ── Modal Footer ─────────────────────────────────── */}
                    <div className="p-4 sm:p-5 bg-slate-950 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>{t("You can re-open this VIP showcase anytime from your Profile or Navbar.", "يمكنك إعادة استعراض هذه المميزات في أي وقت من الملف الشخصي أو شارة ULTRA.")}</span>
                        </div>

                        <div className="flex items-center gap-2.5 w-full sm:w-auto">
                            <button
                                onClick={closeCelebration}
                                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                            >
                                <span>{t("Let's Get Started!", "ابدأ الاستخدام الآن 🚀")}</span>
                            </button>
                        </div>
                    </div>

                </motion.div>
            </div>
        </AnimatePresence>
    );
}
