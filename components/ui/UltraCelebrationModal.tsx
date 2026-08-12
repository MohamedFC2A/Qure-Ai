"use client";

import React, { useEffect, useState, useRef } from "react";
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
    Award,
    LockOpen,
    Check,
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useSettings } from "@/context/SettingsContext";
import { useUltraCelebration } from "@/context/UltraCelebrationContext";
import { cn } from "@/lib/utils";
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
        const frequencies = [523.25, 659.25, 783.99, 987.77, 1174.66];

        frequencies.forEach((freq, index) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now + index * 0.08);

            const startTime = now + index * 0.08;
            gain.gain.setValueAtTime(0.0001, startTime);
            gain.gain.exponentialRampToValueAtTime(0.1 / (index + 1), startTime + 0.06);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.0 + index * 0.15);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + 1.4);
        });
    } catch {
        // audio playback might be blocked
    }
}

/* ── Confetti Cannons ─────────────────────────────────────────── */
function fireCelebrationConfetti() {
    try {
        confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0.05, y: 0.85 },
            colors: ["#06b6d4", "#38bdf8", "#fbbf24", "#34d399"],
            zIndex: 99999,
        });
        confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 0.95, y: 0.85 },
            colors: ["#06b6d4", "#38bdf8", "#fbbf24", "#34d399"],
            zIndex: 99999,
        });
    } catch {
        // ignore
    }
}

interface UltraFeatureItem {
    id: string;
    category: "ai" | "safety" | "reports";
    icon: any;
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
        badgeEn: "Unlimited AI",
        badgeAr: "استشارات لا محددة",
        titleEn: "Full Qure AI Clinical Assistant",
        titleAr: "المساعد الطبي الذكي بلا حدود",
        descriptionEn: "Uninterrupted medical chat consultations and pharmacology intelligence 24/7.",
        descriptionAr: "استشارات طبية وتحليل صيدلاني فورية ومستمرة على مدار الساعة.",
        highlightEn: "Clinical AI Chat",
        highlightAr: "استشارات طبية صيدلانية ذكية",
        actionEn: "Start Chat",
        actionAr: "بدء المحادثة",
        actionHref: "/ai",
    },
    {
        id: "safety-guard",
        category: "safety",
        icon: Shield,
        badgeEn: "Active Guard",
        badgeAr: "حماية سريرية",
        titleEn: "Drug Interaction & Safety Guard",
        titleAr: "حارس التداخلات والسلامة الدوائية",
        descriptionEn: "Real-time detection of drug-to-drug interactions and critical contraindications.",
        descriptionAr: "كشف فوري شامل للتفاعلات والتعارضات والجرعات للحد من المخاطر.",
        highlightEn: "Conflict Detection",
        highlightAr: "كشف التعارضات الدوائية المزدوجة",
        actionEn: "Run Scan",
        actionAr: "فحص التداخلات",
        actionHref: "/scan",
    },
    {
        id: "family-profiles",
        category: "safety",
        icon: Users,
        badgeEn: "Multi Profile",
        badgeAr: "ملفات عائلية",
        titleEn: "Family & Caregiver Profiles",
        titleAr: "إدارة ملفات الأسرة",
        descriptionEn: "Distinct health profiles for parents, children, and elderly loved ones.",
        descriptionAr: "إدارة ملفات صحية مستقلة لكل فرد من العائلة بكل سهولة.",
        highlightEn: "Family Health Memory",
        highlightAr: "سجلات منفصلة لحماية أسرتك",
        actionEn: "Manage Family",
        actionAr: "إدارة الأسرة",
        actionHref: "/profile?tab=family",
    },
    {
        id: "health-context",
        category: "safety",
        icon: HeartPulse,
        badgeEn: "Personalized",
        badgeAr: "مواءمة شخصية",
        titleEn: "Private Health & Allergy Context",
        titleAr: "الملف الصحي والحساسية",
        descriptionEn: "Automatically factors in chronic conditions and drug allergies on every scan.",
        descriptionAr: "ربط كل فحص بتاريخ حساسيتك والأمراض المزمنة تلقائياً.",
        highlightEn: "Allergy Matching",
        highlightAr: "تنبيهات فورية مطابقة لملفك",
        actionEn: "Update Health",
        actionAr: "تحديث الملف",
        actionHref: "/profile?tab=private",
    },
    {
        id: "pdf-reports",
        category: "reports",
        icon: FileText,
        badgeEn: "HD Export",
        badgeAr: "تقارير PDF",
        titleEn: "Clinical PDF Export",
        titleAr: "تصدير تقارير طبية PDF",
        descriptionEn: "Export doctor-ready PDF reports of your scans to share with physicians.",
        descriptionAr: "تصدير تقارير سريرية دقيقة بصيغة PDF لمشاركتها مع طبيبك.",
        highlightEn: "Doctor Ready",
        highlightAr: "تقارير جاهزة للمشاركة الطبية",
        actionEn: "View History",
        actionAr: "عرض السجل",
        actionHref: "/dashboard/history",
    },
    {
        id: "question-tree",
        category: "ai",
        icon: GitFork,
        badgeEn: "Diagnostic Tree",
        badgeAr: "شجرة أسئلة",
        titleEn: "Interactive Follow-Up Tree",
        titleAr: "شجرة الأسئلة والمتابعة",
        descriptionEn: "Dynamic diagnostic questions generated in real time after every scan.",
        descriptionAr: "أسئلة تفاعلية ذكية تتكيف حسب إجاباتك لإرشادك بدقة.",
        highlightEn: "Branching Guidance",
        highlightAr: "إرشادات مخصصة لكل حالة",
        actionEn: "Try Tree",
        actionAr: "استكشاف الشجرة",
        actionHref: "/scan",
    },
    {
        id: "credits-refill",
        category: "reports",
        icon: Zap,
        badgeEn: "300 Credits",
        badgeAr: "٣٠٠ رصيد شهرياً",
        titleEn: "300 Monthly Credits",
        titleAr: "٣٠٠ رصيد شهري",
        descriptionEn: "A massive monthly quota auto-refilled every 30 days without interruption.",
        descriptionAr: "رصيد شهري كبير يتجدد تلقائياً لتغطية جميع فحوصاتك واستشاراتك.",
        highlightEn: "10x Quota",
        highlightAr: "رصيد ضخم للفحوصات الاستشارية",
        actionEn: "Check Credits",
        actionAr: "عرض الرصيد",
        actionHref: "/profile?tab=credits",
    },
    {
        id: "fda-ndc",
        category: "ai",
        icon: Database,
        badgeEn: "FDA Official",
        badgeAr: "اعتماد FDA",
        titleEn: "FDA & NDC Verification",
        titleAr: "التحقق من هيئة الغذاء والدواء",
        descriptionEn: "Instant cross-checking with official US FDA drug labels and NDC directories.",
        descriptionAr: "مطابقة أوتوماتيكية مباشرة مع قاعدة بيانات الغذاء والدواء الرسمية.",
        highlightEn: "Official Verification",
        highlightAr: "مطابقة مع السجلات الدوائية",
        actionEn: "FDA Settings",
        actionAr: "إعدادات FDA",
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
        (user?.email ? user.email.split("@")[0] : isArabic ? "عضو Qure AI" : "Valued Member");

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-y-auto bg-black/40 backdrop-blur-md transition-all"
                dir={isArabic ? "rtl" : "ltr"}
            >
                {/* Main Modal Container - Hyper-Transparent Liquid Glass */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                        "relative w-full max-w-4xl my-auto rounded-3xl overflow-hidden",
                        "bg-black/35 border border-white/10 backdrop-blur-3xl shadow-2xl",
                        "flex flex-col max-h-[90vh] text-slate-100"
                    )}
                >
                    {/* Header Controls */}
                    <div className="absolute top-4 end-4 z-20 flex items-center gap-2">
                        <button
                            onClick={() => {
                                const next = !soundEnabled;
                                setSoundEnabled(next);
                                if (next) playCelebrationChime();
                            }}
                            title={soundEnabled ? t("Mute", "كتم") : t("Sound", "صوت")}
                            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 transition-all backdrop-blur-md"
                        >
                            {soundEnabled ? (
                                <Volume2 className="w-4 h-4 text-cyan-400" />
                            ) : (
                                <VolumeX className="w-4 h-4 text-slate-500" />
                            )}
                        </button>

                        <button
                            onClick={() => {
                                fireCelebrationConfetti();
                                if (soundEnabled) playCelebrationChime();
                            }}
                            title={t("Confetti", "احتفال")}
                            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 transition-all backdrop-blur-md flex items-center gap-1 text-xs font-semibold"
                        >
                            <Flame className="w-4 h-4 text-cyan-400" />
                        </button>

                        <button
                            onClick={closeCelebration}
                            title={t("Close", "إغلاق")}
                            className="p-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 border border-white/[0.08] hover:border-rose-500/30 text-slate-300 hover:text-rose-300 transition-all backdrop-blur-md"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Scrollable Body */}
                    <div className="overflow-y-auto p-5 sm:p-7 space-y-6 custom-scrollbar">

                        {/* HERO HEADER CARD */}
                        <div className="rounded-2xl p-5 sm:p-6 bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl flex flex-col md:flex-row items-center gap-5">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                                <Crown className="w-8 h-8 text-amber-400" />
                            </div>

                            <div className="flex-1 text-center md:text-start space-y-1.5">
                                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-cyan-300 text-xs font-semibold">
                                    <Award className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>{t("ULTRA Plan Active", "عضوية ULTRA مفعّلة")}</span>
                                </div>

                                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                                    {isArabic ? (
                                        <>أهلاً بك <span className="text-cyan-400">{usernameDisplay}</span> في باقة ULTRA!</>
                                    ) : (
                                        <>Welcome <span className="text-cyan-400">{usernameDisplay}</span> to ULTRA!</>
                                    )}
                                </h1>

                                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl">
                                    {t(
                                        "All 8 powerhouse medical AI features are unlocked and active on your account.",
                                        "جميع مميزات الذكاء الاصطناعي الطبي الـ ٨ المتقدمة مفعّلة ومتاحة لاستخدامك الآن."
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* TABS SELECTOR */}
                        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
                            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-cyan-400" />
                                <span>{t("Unlocked Features", "المميزات المفتوحة")}</span>
                            </h2>

                            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.02] border border-white/[0.06] shrink-0">
                                {[
                                    { id: "all", labelEn: "All (8)", labelAr: "الكل (8)" },
                                    { id: "ai", labelEn: "AI Chat", labelAr: "الذكاء الطبي" },
                                    { id: "safety", labelEn: "Safety", labelAr: "الأمان والأسرة" },
                                    { id: "reports", labelEn: "Credits", labelAr: "الرصيد والتقارير" },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={cn(
                                            "px-3 py-1 rounded-lg text-xs font-semibold transition-all",
                                            activeTab === tab.id
                                                ? "bg-white/[0.08] text-white border border-white/[0.12]"
                                                : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
                                        )}
                                    >
                                        {isArabic ? tab.labelAr : tab.labelEn}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* FEATURES GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                            {filteredFeatures.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={item.id}
                                        className="rounded-2xl p-4 sm:p-5 bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all flex flex-col justify-between backdrop-blur-xl group"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 text-cyan-400">
                                                    <Icon className="w-5 h-5" />
                                                </div>

                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/[0.04] border border-white/[0.08] text-emerald-400 flex items-center gap-1">
                                                    <LockOpen className="w-2.5 h-2.5" />
                                                    <span>{t("Active", "مفعّل")}</span>
                                                </span>
                                            </div>

                                            <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                                                {isArabic ? item.titleAr : item.titleEn}
                                            </h3>

                                            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                                                {isArabic ? item.descriptionAr : item.descriptionEn}
                                            </p>
                                        </div>

                                        <div className="pt-3 mt-3 border-t border-white/[0.04] flex items-center justify-between">
                                            <button
                                                onClick={() => handleActionClick(item.actionHref)}
                                                className="py-1.5 px-3 rounded-lg bg-white/[0.04] hover:bg-cyan-500 hover:text-slate-950 border border-white/[0.08] text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5"
                                            >
                                                <span>{isArabic ? item.actionAr : item.actionEn}</span>
                                                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* FAST SHORTCUTS */}
                        <div className="rounded-2xl p-4 sm:p-5 bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl space-y-3">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                {t("Quick Start", "انتقل مباشرة إلى:")}
                            </h3>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <button
                                    onClick={() => handleActionClick("/scan")}
                                    className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-start transition-all flex items-center gap-2.5 group"
                                >
                                    <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                                    <span className="text-xs font-semibold text-white truncate">{t("New Scan", "فحص دواء")}</span>
                                </button>

                                <button
                                    onClick={() => handleActionClick("/ai")}
                                    className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-start transition-all flex items-center gap-2.5 group"
                                >
                                    <Brain className="w-4 h-4 text-cyan-400 shrink-0" />
                                    <span className="text-xs font-semibold text-white truncate">{t("AI Chat", "محادثة AI")}</span>
                                </button>

                                <button
                                    onClick={() => handleActionClick("/profile?tab=family")}
                                    className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-start transition-all flex items-center gap-2.5 group"
                                >
                                    <Users className="w-4 h-4 text-cyan-400 shrink-0" />
                                    <span className="text-xs font-semibold text-white truncate">{t("Family Care", "ملفات العائلة")}</span>
                                </button>

                                <button
                                    onClick={() => handleActionClick("/dashboard")}
                                    className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-start transition-all flex items-center gap-2.5 group"
                                >
                                    <Crown className="w-4 h-4 text-cyan-400 shrink-0" />
                                    <span className="text-xs font-semibold text-white truncate">{t("Dashboard", "لوحة التحكم")}</span>
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* Modal Footer */}
                    <div className="p-4 bg-black/30 backdrop-blur-2xl border-t border-white/[0.08] flex items-center justify-between gap-3 shrink-0">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>{t("All perks are active.", "جميع المميزات مفعّلة في حسابك.")}</span>
                        </div>

                        <button
                            onClick={closeCelebration}
                            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2"
                        >
                            <span>{t("Start Using Qure AI", "ابدأ الاستخدام الآن 🚀")}</span>
                        </button>
                    </div>

                </motion.div>
            </div>
        </AnimatePresence>
    );
}
