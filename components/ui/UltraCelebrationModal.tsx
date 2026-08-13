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
    Check,
    Siren,
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useSettings } from "@/context/SettingsContext";
import { useUltraCelebration } from "@/context/UltraCelebrationContext";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

/* ── Sound Synthesizer ───────────────────────────── */
function playCelebrationChime() {
    try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        if (ctx.state === "suspended") ctx.resume();

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
    } catch {}
}

/* ── Confetti ─────────────────────────────────────────── */
function fireCelebrationConfetti() {
    try {
        confetti({
            particleCount: 45,
            angle: 60,
            spread: 50,
            origin: { x: 0.05, y: 0.85 },
            colors: ["#06b6d4", "#38bdf8", "#fbbf24", "#34d399"],
            zIndex: 99999,
        });
        confetti({
            particleCount: 45,
            angle: 120,
            spread: 50,
            origin: { x: 0.95, y: 0.85 },
            colors: ["#06b6d4", "#38bdf8", "#fbbf24", "#34d399"],
            zIndex: 99999,
        });
    } catch {}
}

interface UltraFeatureItem {
    id: string;
    category: "ai" | "safety" | "reports";
    icon: any;
    badgeAr: string;
    titleAr: string;
    descAr: string;
    actionAr: string;
    actionHref: string;
}

const featuresList: UltraFeatureItem[] = [
    {
        id: "ai-assistant",
        category: "ai",
        icon: Brain,
        badgeAr: "محادثات unlimited",
        titleAr: "مساعد الذكاء الطبي الصيدلاني",
        descAr: "استشارات وتحليلات صيدلانية دقيقة ومستمرة على مدار الساعة.",
        actionAr: "بدء المحادثة",
        actionHref: "/ai",
    },
    {
        id: "safety-guard",
        category: "safety",
        icon: Shield,
        badgeAr: "حماية فحص نشطة",
        titleAr: "حارس التداخلات والتعارضات",
        descAr: "كشف فوري محدد للتفاعلات الدوائية والجرعات لمنع المخاطر.",
        actionAr: "فحص التداخلات",
        actionHref: "/scan",
    },
    {
        id: "family-profiles",
        category: "safety",
        icon: Users,
        badgeAr: "ملفات متعددة",
        titleAr: "إدارة الملفات الصحية للأسرة",
        descAr: "ملفات مستقلة تماماً للوالدين والأبناء لعزل التاريخ الصحي.",
        actionAr: "إدارة الأسرة",
        actionHref: "/profile?tab=family",
    },
    {
        id: "health-context",
        category: "safety",
        icon: HeartPulse,
        badgeAr: "مطابقة شخصية",
        titleAr: "سياق الحساسية والأمراض المزمنة",
        descAr: "ربط أوتوماتيكي لكل فحص مع تاريخك الصحي الخاص والحساسية.",
        actionAr: "تحديث الملف",
        actionHref: "/profile?tab=private",
    },
    {
        id: "esos-ai",
        category: "safety",
        icon: Siren,
        badgeAr: "طوارئ ذكية فائقة",
        titleAr: "نظام الطوارئ والاستغاثة ESOS AI",
        descAr: "توجيه إسعاف الدولة تلقائياً، بث إحداثيات GPS، ومراقبة السقوط والغيبوبة.",
        actionAr: "ضبط ESOS",
        actionHref: "/profile?tab=esos",
    },
    {
        id: "pdf-reports",
        category: "reports",
        icon: FileText,
        badgeAr: "تصدير عالي الدقة",
        titleAr: "تقارير سريرية بصيغة PDF",
        descAr: "تصدير تقارير احترافية فائقة الوضوح لمشاركتها مع الطبيب.",
        actionAr: "استعراض السجل",
        actionHref: "/dashboard/history",
    },
    {
        id: "question-tree",
        category: "ai",
        icon: GitFork,
        badgeAr: "متابعة تفاعلية",
        titleAr: "شجرة الأسئلة والمتابعة الذكية",
        descAr: "توليد أسئلة توجيهية مخصصة تتفرع حسب إجاباتك لكل حالة.",
        actionAr: "جرب الشجرة",
        actionHref: "/scan",
    },
    {
        id: "credits-refill",
        category: "reports",
        icon: Zap,
        badgeAr: "٣٠٠ رصيد شهرياً",
        titleAr: "تجديد رصيد الفحوصات تلقائياً",
        descAr: "رصيد شهري كبير يغطي مئات الفحوصات والاستشارات الطبية.",
        actionAr: "عرض الرصيد",
        actionHref: "/profile?tab=credits",
    },
    {
        id: "fda-ndc",
        category: "ai",
        icon: Database,
        badgeAr: "اعتماد رسمي",
        titleAr: "التحقق المباشر من سجلات FDA",
        descAr: "مطابقة فورية مع قاعدة بيانات الغذاء والدواء الأمريكية و NDC.",
        actionAr: "إعدادات FDA",
        actionHref: "/profile?tab=fda",
    },
];

export function UltraCelebrationModal() {
    const { isOpen, closeCelebration } = useUltraCelebration();
    const { user, profile } = useUser();
    const { resultsLanguage, speakVoiceOs } = useSettings();
    const router = useRouter();

    const isArabic = resultsLanguage === "ar";
    const [activeTab, setActiveTab] = useState<"all" | "ai" | "safety" | "reports">("all");
    const [soundEnabled, setSoundEnabled] = useState(true);
    const hasPlayedSoundRef = useRef(false);

    const filteredFeatures =
        activeTab === "all"
            ? featuresList
            : featuresList.filter((f) => f.category === activeTab);

    useEffect(() => {
        if (isOpen) {
            fireCelebrationConfetti();
            if (soundEnabled && !hasPlayedSoundRef.current) {
                playCelebrationChime();
                speakVoiceOs(
                    isArabic
                        ? "تم تفعيل اشتراك ألترا بنجاح، مبروك لك! جرب جميع المميزات المتاحة الآن."
                        : "ULTRA subscription activated successfully, congratulations! Try all available features now."
                );
                hasPlayedSoundRef.current = true;
            }
        } else {
            hasPlayedSoundRef.current = false;
        }
    }, [isOpen, soundEnabled, speakVoiceOs, isArabic]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) closeCelebration();
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
        (user?.email ? user.email.split("@")[0] : "عضو ULTRA");

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-y-auto bg-black/40 backdrop-blur-md transition-all"
                dir={isArabic ? "rtl" : "ltr"}
            >
                {/* Glass Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                    transition={{ duration: 0.18 }}
                    className={cn(
                        "relative w-full max-w-4xl my-auto rounded-3xl overflow-hidden",
                        "bg-black/35 border border-white/10 backdrop-blur-3xl shadow-2xl",
                        "flex flex-col max-h-[90vh] text-slate-100"
                    )}
                >
                    {/* Header bar controls */}
                    <div className="absolute top-4 end-4 z-20 flex items-center gap-1.5">
                        <button
                            onClick={() => {
                                const next = !soundEnabled;
                                setSoundEnabled(next);
                                if (next) playCelebrationChime();
                            }}
                            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 transition-all"
                        >
                            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                        </button>
                        <button
                            onClick={() => {
                                fireCelebrationConfetti();
                                if (soundEnabled) playCelebrationChime();
                            }}
                            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 transition-all"
                        >
                            <Flame className="w-4 h-4 text-cyan-400" />
                        </button>
                        <button
                            onClick={closeCelebration}
                            className="p-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 border border-white/[0.08] text-slate-300 hover:text-rose-300 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Scrollable body */}
                    <div className="overflow-y-auto p-5 sm:p-7 space-y-6 custom-scrollbar">

                        {/* Top Hero Showcase Card */}
                        <div className="rounded-2xl p-5 sm:p-6 bg-white/[0.02] border border-white/[0.07] backdrop-blur-2xl space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0">
                                    <Crown className="w-6 h-6 text-amber-400" />
                                </div>
                                <div className="min-w-0">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-semibold mb-1">
                                        <Award className="w-3 h-3 text-cyan-400" />
                                        <span>عضوية ULTRA مفعّلة بالكامل</span>
                                    </div>
                                    <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                                        أهلاً بك <span className="text-cyan-400">{usernameDisplay}</span>
                                    </h1>
                                </div>
                            </div>

                            {/* 4 Metrics Strip */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                                    <p className="text-lg font-bold text-white">300</p>
                                    <p className="text-[11px] text-slate-400">رصيد شهرياً</p>
                                </div>
                                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                                    <p className="text-lg font-bold text-cyan-400">∞</p>
                                    <p className="text-[11px] text-slate-400">محادثات AI</p>
                                </div>
                                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                                    <p className="text-lg font-bold text-emerald-400">مفتوح</p>
                                    <p className="text-[11px] text-slate-400">رعاية الأسرة</p>
                                </div>
                                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                                    <p className="text-lg font-bold text-white">FDA</p>
                                    <p className="text-[11px] text-slate-400">مطابقة سريرية</p>
                                </div>
                            </div>
                        </div>

                        {/* Tabs Bar */}
                        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
                            <h2 className="text-sm font-bold text-white flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-cyan-400" />
                                <span>المميزات المفتوحة (8)</span>
                            </h2>
                            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                                {[
                                    { id: "all", label: "الكل (8)" },
                                    { id: "ai", label: "الذكاء الطبي" },
                                    { id: "safety", label: "الأمان والأسرة" },
                                    { id: "reports", label: "الرصيد والتقارير" },
                                ].map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setActiveTab(t.id as any)}
                                        className={cn(
                                            "px-3 py-1 rounded-lg text-xs font-semibold transition-all",
                                            activeTab === t.id
                                                ? "bg-white/[0.08] text-white border border-white/[0.12]"
                                                : "text-slate-400 hover:text-white"
                                        )}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Feature Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filteredFeatures.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={item.id}
                                        className="rounded-2xl p-4 bg-white/[0.02] border border-white/[0.06] border-l-2 border-l-cyan-400/80 hover:border-white/[0.12] transition-all flex flex-col justify-between backdrop-blur-xl group"
                                    >
                                        <div className="space-y-2.5">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-cyan-400 shrink-0">
                                                    <Icon className="w-4.5 h-4.5" />
                                                </div>
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.04] border border-white/[0.08] text-emerald-400 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                                    <span>مفعّل</span>
                                                </span>
                                            </div>

                                            <div>
                                                <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                                                    {item.titleAr}
                                                </h3>
                                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                                    {item.descAr}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-3 mt-3 border-t border-white/[0.04] flex items-center justify-between">
                                            <span className="text-[10px] text-slate-500 font-medium">{item.badgeAr}</span>
                                            <button
                                                onClick={() => handleActionClick(item.actionHref)}
                                                className="py-1.5 px-3 rounded-lg bg-white/[0.04] hover:bg-cyan-500 hover:text-slate-950 border border-white/[0.08] text-slate-200 text-xs font-semibold transition-all flex items-center gap-1"
                                            >
                                                <span>{item.actionAr}</span>
                                                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Fast Shortcuts */}
                        <div className="rounded-2xl p-4 bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl space-y-2.5">
                            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">انتقل فوراً إلى:</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <button
                                    onClick={() => handleActionClick("/scan")}
                                    className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-start transition-all flex items-center gap-2"
                                >
                                    <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                                    <span className="text-xs font-semibold text-white truncate">فحص دواء</span>
                                </button>
                                <button
                                    onClick={() => handleActionClick("/ai")}
                                    className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-start transition-all flex items-center gap-2"
                                >
                                    <Brain className="w-4 h-4 text-cyan-400 shrink-0" />
                                    <span className="text-xs font-semibold text-white truncate">محادثة AI</span>
                                </button>
                                <button
                                    onClick={() => handleActionClick("/profile?tab=family")}
                                    className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-start transition-all flex items-center gap-2"
                                >
                                    <Users className="w-4 h-4 text-cyan-400 shrink-0" />
                                    <span className="text-xs font-semibold text-white truncate">رعاية الأسرة</span>
                                </button>
                                <button
                                    onClick={() => handleActionClick("/dashboard")}
                                    className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-start transition-all flex items-center gap-2"
                                >
                                    <Crown className="w-4 h-4 text-cyan-400 shrink-0" />
                                    <span className="text-xs font-semibold text-white truncate">لوحة التحكم</span>
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-black/30 backdrop-blur-2xl border-t border-white/[0.08] flex items-center justify-between gap-3 shrink-0">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>جميع المميزات مفعّلة وجاهزة.</span>
                        </div>
                        <button
                            onClick={closeCelebration}
                            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-2"
                        >
                            <span>ابدأ الاستخدام الآن</span>
                        </button>
                    </div>

                </motion.div>
            </div>
        </AnimatePresence>
    );
}
