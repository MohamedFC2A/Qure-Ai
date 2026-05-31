"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Activity,
    ArrowRight,
    Clock,
    CreditCard,
    FileText,
    HeartPulse,
    Pill,
    ScanLine,
    ShieldCheck,
    UserRound,
    Users,
    Zap,
    TrendingUp,
    Star,
    Brain,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { useUser } from "@/context/UserContext";
import { useSettings } from "@/context/SettingsContext";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type HistoryItem = {
    id: string;
    drug_name?: string | null;
    manufacturer?: string | null;
    created_at?: string | null;
    analysis_json?: { warnings?: unknown[]; uses?: unknown[] };
};

export default function DashboardPage() {
    const { user, profile, plan, credits, loading } = useUser();
    const { resultsLanguage } = useSettings();
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);
    const [recent, setRecent] = useState<HistoryItem[]>([]);
    const [recentLoading, setRecentLoading] = useState(false);

    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    const hasLocalDevCookie =
        typeof document !== "undefined" &&
        document.cookie.split("; ").some((cookie) => cookie === "qure_dev_auth=1");
    const isLocalDevUser =
        process.env.NODE_ENV === "development" &&
        (user?.id === "local-dev-user" || hasLocalDevCookie);

    const profileCompleteness = [
        profile?.age,
        profile?.gender,
        profile?.height,
        profile?.weight,
    ].filter(Boolean).length;
    const profilePercent = Math.round((profileCompleteness / 4) * 100);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login?next=/dashboard");
        }
    }, [loading, router, user]);

    useEffect(() => {
        const loadRecent = async () => {
            if (!user?.id) return;
            if (isLocalDevUser) {
                setRecent([
                    {
                        id: "local-1",
                        drug_name: "Ibuprofen 200 mg",
                        manufacturer: "Sample label",
                        created_at: new Date().toISOString(),
                        analysis_json: { warnings: ["NSAID caution"], uses: ["Pain relief"] },
                    },
                    {
                        id: "local-2",
                        drug_name: "Paracetamol 500 mg",
                        manufacturer: "Sample package",
                        created_at: new Date(Date.now() - 86400000).toISOString(),
                        analysis_json: { warnings: [], uses: ["Fever"] },
                    },
                ]);
                return;
            }
            setRecentLoading(true);
            try {
                const { data, error } = await supabase
                    .from("medication_history")
                    .select("id, drug_name, manufacturer, created_at, analysis_json")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false })
                    .limit(4);
                if (error) { setRecent([]); return; }
                setRecent(data || []);
            } finally {
                setRecentLoading(false);
            }
        };
        loadRecent();
    }, [isLocalDevUser, supabase, user?.id]);

    if (loading) {
        return (
            <main className="min-h-screen pt-28 px-4">
                <div className="mx-auto max-w-7xl space-y-6">
                    <div className="h-24 skeleton rounded-2xl" />
                    <div className="grid grid-cols-4 gap-4">
                        {[1,2,3,4].map(i => <div key={i} className="h-20 skeleton rounded-2xl" />)}
                    </div>
                    <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-5">
                        <div className="h-64 skeleton rounded-2xl" />
                        <div className="h-64 skeleton rounded-2xl" />
                    </div>
                </div>
            </main>
        );
    }

    if (!user) return null;

    const quickActions = [
        {
            label: t("New Analysis", "فحص جديد"),
            href: "/scan",
            icon: ScanLine,
            color: "cyan",
            desc: t("Scan a medication label", "افحص ملصق دواء"),
        },
        {
            label: t("History", "السجل"),
            href: "/dashboard/history",
            icon: Clock,
            color: "violet",
            desc: t("View past analyses", "عرض التحليلات السابقة"),
        },
        {
            label: t("Profile", "ملفي"),
            href: "/profile",
            icon: UserRound,
            color: "emerald",
            desc: t("Manage health context", "إدارة السياق الصحي"),
        },
        {
            label: t("Plans", "الباقات"),
            href: "/pricing",
            icon: CreditCard,
            color: "amber",
            desc: t("Upgrade to Ultra", "ترقية إلى ألترا"),
        },
    ];

    const actionBgMap: Record<string, string> = {
        cyan:    "icon-badge-cyan",
        violet:  "icon-badge-violet",
        emerald: "icon-badge-emerald",
        amber:   "icon-badge-amber",
    };

    const actionBorderHoverMap: Record<string, string> = {
        cyan:    "hover:border-cyan-400/25",
        violet:  "hover:border-violet-400/25",
        emerald: "hover:border-emerald-400/25",
        amber:   "hover:border-amber-400/25",
    };

    return (
        <main
            className={cn("min-h-screen pt-28 pb-28 md:pb-14", isArabic ? "font-arabic" : "")}
            dir={isArabic ? "rtl" : "ltr"}
        >
            <div className="clinical-page space-y-5">

                {/* ── HEADER ROW ─────────────────────────────────── */}
                <section className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
                    <div>
                        <div className="clinical-eyebrow">
                            <Activity className="h-3.5 w-3.5" />
                            {t("Workspace", "مساحة العمل")}
                        </div>
                        <h1 className={cn(
                            "mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl",
                            isArabic ? "text-right" : ""
                        )}>
                            {t("Clinical Dashboard", "لوحة التحكم الطبية")}
                        </h1>
                        <p className={cn(
                            "mt-2 text-slate-500 text-sm",
                            isArabic ? "text-right" : ""
                        )}>
                            {t(
                                "Monitor usage, continue recent medication reviews, and keep safety context ready before scanning.",
                                "راقب الاستخدام، واستمر في مراجعات الأدوية الأخيرة، واحتفظ بسياق الأمان جاهزًا."
                            )}
                        </p>
                    </div>

                    {/* Plan card */}
                    <GlassCard
                        accent={plan === "ultra" ? "amber" : "cyan"}
                        hoverEffect={false}
                        className="p-5"
                        style={plan === "ultra" ? { background: "rgba(245,158,11,0.04)" } : undefined}
                    >
                        <div className={cn("flex items-center justify-between gap-4", isArabic ? "flex-row-reverse" : "")}>
                            <div className={isArabic ? "text-right" : ""}>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                    {t("Current Plan", "الخطة الحالية")}
                                </p>
                                <p className="mt-1 text-2xl font-black uppercase text-white tracking-tight">
                                    {plan}
                                </p>
                            </div>
                            <div className={cn(
                                "icon-badge w-12 h-12 rounded-xl",
                                plan === "ultra" ? "icon-badge-amber" : "icon-badge-cyan"
                            )}>
                                <Zap className="h-6 w-6" />
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="glass-inset rounded-xl p-3">
                                <p className="text-[10px] text-slate-600 uppercase tracking-wide font-semibold">
                                    {t("Credits", "الرصيد")}
                                </p>
                                <p className="mt-1 text-xl font-black text-white">{credits}</p>
                            </div>
                            <div className="glass-inset rounded-xl p-3">
                                <p className="text-[10px] text-slate-600 uppercase tracking-wide font-semibold">
                                    {t("Profile", "الملف الشخصي")}
                                </p>
                                <p className={cn(
                                    "mt-1 text-xl font-black",
                                    profilePercent === 100 ? "text-emerald-400" : "text-white"
                                )}>
                                    {profilePercent}%
                                </p>
                            </div>
                        </div>

                        {/* Profile progress */}
                        <div className="mt-3 progress-bar">
                            <div
                                className="progress-fill transition-all duration-700"
                                style={{ width: `${profilePercent}%` }}
                            />
                        </div>
                    </GlassCard>
                </section>

                {/* ── QUICK ACTIONS ──────────────────────────────── */}
                <section className={cn(
                    "grid grid-cols-2 gap-3 md:grid-cols-4",
                    isArabic ? "direction-rtl" : ""
                )}>
                    {quickActions.map((item, i) => (
                        <Link key={item.href} href={item.href}>
                            <motion.div
                                className={cn(
                                    "relative overflow-hidden rounded-2xl border border-white/[0.07] p-4",
                                    "flex flex-col gap-3 cursor-pointer transition-all duration-250",
                                    "hover:bg-white/[0.04]",
                                    actionBorderHoverMap[item.color]
                                )}
                                style={{ background: "var(--q-glass-2)" }}
                                whileHover={{ y: -2 }}
                                transition={{ duration: 0.18 }}
                            >
                                <div className={cn("icon-badge w-10 h-10 rounded-xl", actionBgMap[item.color])}>
                                    <item.icon className="h-5 w-5" />
                                </div>
                                <div className={isArabic ? "text-right" : ""}>
                                    <p className="font-bold text-white text-sm">{item.label}</p>
                                    <p className="text-xs text-slate-600 mt-0.5">{item.desc}</p>
                                </div>
                                <ArrowRight className={cn(
                                    "absolute bottom-4 h-4 w-4 text-slate-700 transition-all",
                                    isArabic ? "left-4 rotate-180" : "right-4"
                                )} />
                            </motion.div>
                        </Link>
                    ))}
                </section>

                {/* ── MAIN CONTENT ROW ───────────────────────────── */}
                <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_0.9fr]">

                    {/* Recent Analyses */}
                    <GlassCard className="overflow-hidden" hoverEffect={false} accent="cyan">
                        <div className={cn(
                            "flex items-center justify-between gap-4 border-b border-white/[0.06] p-5",
                            isArabic ? "flex-row-reverse" : ""
                        )}>
                            <div className={isArabic ? "text-right" : ""}>
                                <h2 className="text-lg font-bold text-white">
                                    {t("Recent Analyses", "التحليلات الأخيرة")}
                                </h2>
                                <p className="mt-0.5 text-xs text-slate-600">
                                    {t("Continue where you left off.", "استمر من حيث توقفت.")}
                                </p>
                            </div>
                            <Link href="/dashboard/history">
                                <Button variant="outline" size="xs" className="gap-1.5 shrink-0">
                                    {t("All history", "كل السجل")}
                                    <ArrowRight className={cn("h-3.5 w-3.5", isArabic ? "rotate-180" : "")} />
                                </Button>
                            </Link>
                        </div>

                        <div className="p-5">
                            {recentLoading ? (
                                <div className="grid gap-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-16 skeleton rounded-xl" />
                                    ))}
                                </div>
                            ) : recent.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-white/[0.08] p-10 text-center">
                                    <div className="icon-badge icon-badge-cyan w-12 h-12 rounded-xl mx-auto">
                                        <Pill className="h-6 w-6" />
                                    </div>
                                    <p className="mt-4 font-bold text-white">
                                        {t("No analyses yet", "لا توجد تحليلات بعد")}
                                    </p>
                                    <p className="mt-1.5 text-sm text-slate-600">
                                        {t(
                                            "Run your first scan to build a medication record.",
                                            "شغّل فحصك الأول لبناء سجل دوائي."
                                        )}
                                    </p>
                                    <Link href="/scan" className="mt-5 inline-flex">
                                        <Button glow>
                                            <ScanLine className="h-4 w-4 mr-2" />
                                            {t("Start Analysis", "ابدأ الفحص")}
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {recent.map((item) => {
                                        const warnCount = (item.analysis_json?.warnings?.length ?? 0) as number;
                                        return (
                                            <Link key={item.id} href="/dashboard/history">
                                                <div className={cn(
                                                    "rounded-xl border border-white/[0.07] p-4 transition-all duration-200",
                                                    "hover:border-cyan-400/20 hover:bg-white/[0.04] group cursor-pointer",
                                                    "flex items-center gap-4",
                                                    isArabic ? "flex-row-reverse" : ""
                                                )}>
                                                    <div className="icon-badge icon-badge-cyan w-10 h-10 rounded-xl shrink-0">
                                                        <Pill className="h-5 w-5" />
                                                    </div>
                                                    <div className={cn("flex-1 min-w-0", isArabic ? "text-right" : "")}>
                                                        <p className="font-semibold text-white text-sm truncate">
                                                            {item.drug_name || t("Unknown medication", "دواء غير محدد")}
                                                        </p>
                                                        <p className="text-xs text-slate-600 mt-0.5 truncate">
                                                            {item.manufacturer || t("Generic", "عام")}
                                                            {" · "}
                                                            {item.created_at
                                                                ? new Date(item.created_at).toLocaleDateString(isArabic ? "ar-SA" : "en-US", { month: "short", day: "numeric" })
                                                                : t("No date", "لا تاريخ")}
                                                        </p>
                                                    </div>
                                                    {warnCount > 0 && (
                                                        <span className="shrink-0 rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                                                            {warnCount} {t("warn", "تحذير")}
                                                        </span>
                                                    )}
                                                    <FileText className={cn(
                                                        "h-4 w-4 shrink-0 text-slate-700 group-hover:text-cyan-400 transition-colors",
                                                        isArabic ? "order-first" : ""
                                                    )} />
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </GlassCard>

                    {/* Right column: safety + family + disclaimer */}
                    <div className="grid gap-4 content-start">

                        {/* Safety Context */}
                        <GlassCard accent="emerald" hoverEffect={false} className="p-5">
                            <div className={cn("flex items-start gap-3", isArabic ? "flex-row-reverse" : "")}>
                                <div className="icon-badge icon-badge-emerald w-10 h-10 rounded-xl shrink-0">
                                    <HeartPulse className="h-5 w-5" />
                                </div>
                                <div className={cn("flex-1", isArabic ? "text-right" : "")}>
                                    <h2 className="font-bold text-white">
                                        {t("Safety Context", "سياق الأمان")}
                                    </h2>
                                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                                        {t(
                                            `Profile is ${profilePercent}% complete. More context improves personalization.`,
                                            `الملف الشخصي مكتمل بنسبة ${profilePercent}%. مزيد من البيانات يحسّن التخصيص.`
                                        )}
                                    </p>
                                    <div className="mt-3 progress-bar">
                                        <div className="progress-fill" style={{ width: `${profilePercent}%` }} />
                                    </div>
                                    <Link href="/profile" className="mt-3 inline-flex">
                                        <Button variant="outline" size="xs" className="gap-1.5 border-emerald-400/20 text-emerald-300 hover:bg-emerald-400/8">
                                            {t("Complete profile", "أكمل الملف")}
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Family Care */}
                        <GlassCard accent="violet" hoverEffect={false} className="p-5">
                            <div className={cn("flex items-start gap-3", isArabic ? "flex-row-reverse" : "")}>
                                <div className="icon-badge icon-badge-violet w-10 h-10 rounded-xl shrink-0">
                                    <Users className="h-5 w-5" />
                                </div>
                                <div className={cn("flex-1", isArabic ? "text-right" : "")}>
                                    <div className={cn("flex items-center gap-2", isArabic ? "flex-row-reverse" : "")}>
                                        <h2 className="font-bold text-white">
                                            {t("Family Care", "رعاية الأسرة")}
                                        </h2>
                                        <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-black text-black">
                                            ULTRA
                                        </span>
                                    </div>
                                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                                        {t(
                                            "Ultra keeps scan history and medication memory separated by profile.",
                                            "يحافظ Ultra على سجل الفحص وذاكرة الأدوية مفصولة حسب الملف."
                                        )}
                                    </p>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Medical Disclaimer */}
                        <GlassCard accent="rose" hoverEffect={false} className="p-5">
                            <div className={cn("flex items-start gap-3", isArabic ? "flex-row-reverse" : "")}>
                                <div className="icon-badge icon-badge-amber w-10 h-10 rounded-xl shrink-0">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <div className={cn("flex-1", isArabic ? "text-right" : "")}>
                                    <h2 className="font-bold text-white text-sm">
                                        {t("Medical Disclaimer", "إخلاء المسؤولية الطبية")}
                                    </h2>
                                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                                        {t(
                                            "Use reports for review and verification. Confirm critical decisions with a clinician or pharmacist.",
                                            "استخدم التقارير للمراجعة والتحقق. أكّد القرارات المهمة مع الطبيب أو الصيدلي."
                                        )}
                                    </p>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </section>
            </div>
        </main>
    );
}
