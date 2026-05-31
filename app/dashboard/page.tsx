"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Activity,
    ArrowRight,
    Brain,
    CheckCircle2,
    Clock,
    CreditCard,
    FileText,
    HeartPulse,
    Lock,
    Pill,
    ScanLine,
    ShieldCheck,
    Sparkles,
    Star,
    UserRound,
    Users,
    Zap,
    Database,
    Globe,
    Download,
    MessageSquare,
    Fingerprint,
    BarChart3,
    BadgeCheck,
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

/* ── Feature Card ─────────────────────────────────────────────── */
function FeatureCard({
    icon: Icon,
    title,
    description,
    badge,
    color,
    locked,
}: {
    icon: React.ElementType;
    title: string;
    description: string;
    badge?: string;
    color: "cyan" | "emerald" | "amber" | "violet" | "rose";
    locked?: boolean;
}) {
    const colorMap = {
        cyan:    { badge: "icon-badge-cyan",    border: "hover:border-cyan-400/25",    dot: "bg-cyan-400"    },
        emerald: { badge: "icon-badge-emerald", border: "hover:border-emerald-400/25", dot: "bg-emerald-400" },
        amber:   { badge: "icon-badge-amber",   border: "hover:border-amber-400/25",   dot: "bg-amber-400"   },
        violet:  { badge: "icon-badge-violet",  border: "hover:border-violet-400/25",  dot: "bg-violet-400"  },
        rose:    { badge: "icon-badge-rose",    border: "hover:border-rose-400/25",    dot: "bg-rose-400"    },
    };

    const c = colorMap[color];

    return (
        <motion.div
            className={cn(
                "relative overflow-hidden rounded-2xl border border-white/[0.07] p-5 transition-all duration-250",
                c.border,
                locked && "opacity-60"
            )}
            style={{ background: "var(--q-glass-2)" }}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.18 }}
        >
            {locked && (
                <div className="absolute top-4 right-4">
                    <Lock className="w-3.5 h-3.5 text-slate-600" />
                </div>
            )}
            {badge && !locked && (
                <div className="absolute top-4 right-4">
                    <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-black text-black">
                        {badge}
                    </span>
                </div>
            )}
            <div className={cn("icon-badge w-10 h-10 rounded-xl mb-4", c.badge)}>
                <Icon className="h-5 w-5" />
            </div>
            <p className="font-bold text-white text-sm leading-snug">{title}</p>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{description}</p>
        </motion.div>
    );
}

/* ── Stat Metric ──────────────────────────────────────────────── */
function StatMetric({ value, label, sub, color }: { value: string | number; label: string; sub?: string; color: string }) {
    const colors: Record<string, string> = {
        cyan:    "text-cyan-300",
        emerald: "text-emerald-300",
        amber:   "text-amber-300",
        violet:  "text-violet-300",
    };
    return (
        <div className="stat-card text-center group hover-lift">
            <p className={cn("text-2xl font-black tracking-tight", colors[color] || "text-white")}>{value}</p>
            <p className="mt-1 text-xs font-semibold text-slate-400">{label}</p>
            {sub && <p className="mt-0.5 text-[10px] text-slate-600">{sub}</p>}
        </div>
    );
}

/* ── Main Dashboard ───────────────────────────────────────────── */
export default function DashboardPage() {
    const { user, profile, plan, credits, loading } = useUser();
    const { resultsLanguage } = useSettings();
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);
    const [recent, setRecent] = useState<HistoryItem[]>([]);
    const [recentLoading, setRecentLoading] = useState(false);

    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);
    const isUltra = plan === "ultra";

    const hasLocalDevCookie =
        typeof document !== "undefined" &&
        document.cookie.split("; ").some((cookie) => cookie === "qure_dev_auth=1");
    const isLocalDevUser =
        process.env.NODE_ENV === "development" &&
        (user?.id === "local-dev-user" || hasLocalDevCookie);

    const profileCompleteness = [profile?.age, profile?.gender, profile?.height, profile?.weight].filter(Boolean).length;
    const profilePercent = Math.round((profileCompleteness / 4) * 100);

    useEffect(() => {
        if (!loading && !user) router.push("/login?next=/dashboard");
    }, [loading, router, user]);

    useEffect(() => {
        const loadRecent = async () => {
            if (!user?.id) return;
            if (isLocalDevUser) {
                setRecent([
                    { id: "l1", drug_name: "Ibuprofen 200 mg",   manufacturer: "Sample label",   created_at: new Date().toISOString(),                   analysis_json: { warnings: ["NSAID caution"], uses: ["Pain relief"] } },
                    { id: "l2", drug_name: "Paracetamol 500 mg", manufacturer: "Sample package", created_at: new Date(Date.now() - 86400000).toISOString(), analysis_json: { warnings: [], uses: ["Fever"] } },
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
                    .limit(5);
                if (!error) setRecent(data || []);
            } finally {
                setRecentLoading(false);
            }
        };
        loadRecent();
    }, [isLocalDevUser, supabase, user?.id]);

    /* ── Loading skeleton ── */
    if (loading) {
        return (
            <main className="min-h-screen pt-28 px-4">
                <div className="mx-auto max-w-7xl space-y-5">
                    <div className="h-28 skeleton rounded-2xl" />
                    <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i=><div key={i} className="h-20 skeleton rounded-2xl"/>)}</div>
                    <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-5">
                        <div className="h-72 skeleton rounded-2xl" />
                        <div className="h-72 skeleton rounded-2xl" />
                    </div>
                </div>
            </main>
        );
    }

    if (!user) return null;

    /* ── Site features list ── */
    const features: Array<{
        icon: React.ElementType;
        titleEn: string; titleAr: string;
        descEn: string;  descAr: string;
        badge?: string;
        color: "cyan"|"emerald"|"amber"|"violet"|"rose";
        locked?: boolean;
    }> = [
        {
            icon: ScanLine,
            titleEn: "Medication OCR Scan",   titleAr: "فحص الدواء بالذكاء",
            descEn:  "Photograph any medication label and extract full text automatically via AI.",
            descAr:  "صوّر أي ملصق دواء واستخرج النص الكامل تلقائيًا عبر الذكاء الاصطناعي.",
            color:   "cyan",
        },
        {
            icon: Database,
            titleEn: "FDA + Web Verification",  titleAr: "التحقق من FDA والويب",
            descEn:  "Cross-checks with openFDA and live web signals to validate medication data.",
            descAr:  "مطابقة مع openFDA وإشارات الويب الحية للتحقق من بيانات الدواء.",
            color:   "emerald",
        },
        {
            icon: ShieldCheck,
            titleEn: "Safety Report",             titleAr: "تقرير الأمان",
            descEn:  "Organized warnings, dosage notes, side effects, and care recommendations.",
            descAr:  "تحذيرات منظمة، ملاحظات الجرعة، آثار جانبية، وتوصيات الرعاية.",
            color:   "amber",
        },
        {
            icon: Brain,
            titleEn: "AI Interaction Guard",   titleAr: "حارس التداخل الذكي",
            descEn:  "Detects dangerous drug interactions based on your personal medication history.",
            descAr:  "يكتشف التداخلات الدوائية الخطيرة بناءً على سجلك الدوائي الشخصي.",
            color:   "violet",
            badge:   "ULTRA",
            locked:  !isUltra,
        },
        {
            icon: Fingerprint,
            titleEn: "Private Health Profile",  titleAr: "الملف الصحي الخاص",
            descEn:  "Store allergies, conditions, and current meds to personalize every scan.",
            descAr:  "احفظ الحساسية والحالات الصحية والأدوية الحالية لتخصيص كل فحص.",
            color:   "cyan",
            badge:   "ULTRA",
            locked:  !isUltra,
        },
        {
            icon: Users,
            titleEn: "Family & Caregiver Mode",  titleAr: "وضع الأسرة والرعاية",
            descEn:  "Manage separate profiles for each family member with isolated histories.",
            descAr:  "أدر ملفات منفصلة لكل فرد في الأسرة بسجلات معزولة.",
            color:   "emerald",
            badge:   "ULTRA",
            locked:  !isUltra,
        },
        {
            icon: Download,
            titleEn: "PDF & PNG Export",    titleAr: "تصدير PDF و PNG",
            descEn:  "Export clean safety reports to share with pharmacists or doctors.",
            descAr:  "صدّر تقارير أمان نظيفة لمشاركتها مع الصيدلاني أو الطبيب.",
            color:   "violet",
            badge:   "ULTRA",
            locked:  !isUltra,
        },
        {
            icon: Clock,
            titleEn: "Scan History",        titleAr: "سجل الفحوصات",
            descEn:  "Full history of every medication you've analyzed, searchable and sorted.",
            descAr:  "سجل كامل لكل الأدوية التي حللتها، قابل للبحث والفرز.",
            color:   "rose",
        },
    ];

    return (
        <main
            className={cn("min-h-screen pt-28 pb-28 md:pb-14", isArabic ? "font-arabic" : "")}
            dir={isArabic ? "rtl" : "ltr"}
        >
            <div className="clinical-page space-y-6">

                {/* ── HERO HEADER ──────────────────────────────── */}
                <section className="relative overflow-hidden rounded-2xl border border-white/[0.07] p-6 sm:p-8"
                    style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.05) 0%, rgba(8,14,22,0.9) 40%, rgba(139,92,246,0.04) 100%)" }}
                >
                    {/* Ambient glow */}
                    <div className="absolute top-0 left-0 w-64 h-32 bg-cyan-400/8 blur-3xl rounded-full pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-48 h-24 bg-violet-400/6 blur-3xl rounded-full pointer-events-none" />

                    <div className={cn("relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center", isArabic ? "lg:grid-cols-[auto_1fr]" : "")}>
                        <div className={isArabic ? "text-right" : ""}>
                            <div className="clinical-eyebrow mb-3">
                                <Activity className="h-3.5 w-3.5" />
                                {t("Your Workspace", "مساحة عملك")}
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                                {t(
                                    <>Welcome back<span className="text-cyan-400">.</span></>,
                                    <>أهلاً بك<span className="text-cyan-400">.</span></>
                                )}
                            </h1>
                            <p className="mt-2 text-slate-500 text-sm">
                                {t(
                                    "Everything you need to scan, verify, and review medications — in one place.",
                                    "كل ما تحتاجه لفحص الأدوية والتحقق منها ومراجعتها — في مكان واحد."
                                )}
                            </p>
                        </div>

                        {/* Quick scan CTA */}
                        <Link href="/scan">
                            <div className="relative group shrink-0">
                                <div className="absolute -inset-2 rounded-2xl bg-cyan-400/15 blur-xl animate-glow-pulse pointer-events-none" />
                                <div className="relative inline-flex items-center gap-2.5 rounded-xl px-7 py-3.5 font-black text-slate-950 text-sm
                                    bg-gradient-to-r from-cyan-400 via-cyan-300 to-emerald-400
                                    border border-cyan-300/60 shadow-xl shadow-cyan-500/30
                                    transition-all duration-200 hover:shadow-cyan-400/50 active:scale-95">
                                    <ScanLine className="w-5 h-5 shrink-0" />
                                    {t("Start New Scan", "ابدأ فحصًا جديدًا")}
                                    <ArrowRight className={cn("w-4 h-4", isArabic ? "rotate-180" : "")} />
                                </div>
                            </div>
                        </Link>
                    </div>
                </section>

                {/* ── PLAN STATUS STATS ────────────────────────── */}
                <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatMetric value={credits}         label={t("Credits Left",      "الرصيد المتبقي")}  color="cyan"    />
                    <StatMetric value={recent.length}   label={t("Analyses Done",     "تحليلات منجزة")}   color="emerald" />
                    <StatMetric value={`${profilePercent}%`} label={t("Profile",      "الملف الشخصي")} sub={t("complete", "مكتمل")} color="violet" />
                    <StatMetric value={isUltra ? "Ultra" : "Free"} label={t("Current Plan", "الخطة الحالية")} color={isUltra ? "amber" : "cyan"} />
                </section>

                {/* ── MAIN CONTENT GRID ─────────────────────────── */}
                <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_0.85fr]">

                    {/* Left: Site features showcase */}
                    <div className="space-y-4">
                        <div className={cn("flex items-center justify-between", isArabic ? "flex-row-reverse" : "")}>
                            <div className={isArabic ? "text-right" : ""}>
                                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                                    {t("Platform Features", "مميزات المنصة")}
                                </p>
                                <h2 className="mt-1 text-lg font-bold text-white">
                                    {t("Everything QURE AI can do", "كل ما يمكن لـ QURE AI فعله")}
                                </h2>
                            </div>
                            {!isUltra && (
                                <Link href="/pricing">
                                    <Button variant="amber" size="xs" className="gap-1.5 shrink-0">
                                        <Zap className="w-3 h-3" />
                                        {t("Upgrade", "ترقية")}
                                    </Button>
                                </Link>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {features.map((f) => (
                                <FeatureCard
                                    key={f.titleEn}
                                    icon={f.icon}
                                    title={isArabic ? f.titleAr : f.titleEn}
                                    description={isArabic ? f.descAr : f.descEn}
                                    badge={f.badge}
                                    color={f.color}
                                    locked={f.locked}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Right column */}
                    <div className="space-y-4">

                        {/* Recent Analyses */}
                        <GlassCard className="overflow-hidden" hoverEffect={false} accent="cyan">
                            <div className={cn("flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4", isArabic ? "flex-row-reverse" : "")}>
                                <div className={isArabic ? "text-right" : ""}>
                                    <h2 className="font-bold text-white text-sm">
                                        {t("Recent Scans", "الفحوصات الأخيرة")}
                                    </h2>
                                    <p className="text-[11px] text-slate-600 mt-0.5">
                                        {t("Your last analyzed medications", "آخر الأدوية التي حللتها")}
                                    </p>
                                </div>
                                <Link href="/dashboard/history">
                                    <Button variant="outline" size="xs" className="gap-1 shrink-0">
                                        {t("All", "الكل")}
                                        <ArrowRight className={cn("w-3 h-3", isArabic ? "rotate-180" : "")} />
                                    </Button>
                                </Link>
                            </div>

                            <div className="p-4">
                                {recentLoading ? (
                                    <div className="space-y-2">
                                        {[1,2,3].map(i => <div key={i} className="h-14 skeleton rounded-xl" />)}
                                    </div>
                                ) : recent.length === 0 ? (
                                    <div className="flex flex-col items-center py-8 text-center">
                                        <div className="icon-badge icon-badge-cyan w-11 h-11 rounded-xl mx-auto mb-3">
                                            <Pill className="h-5 w-5" />
                                        </div>
                                        <p className="font-semibold text-white text-sm">
                                            {t("No scans yet", "لا توجد فحوصات")}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-600">
                                            {t("Upload a medication to get started.", "ارفع صورة دواء للبدء.")}
                                        </p>
                                        <Link href="/scan" className="mt-4">
                                            <Button size="sm" glow>
                                                <ScanLine className="w-4 h-4 mr-2" />
                                                {t("Scan now", "افحص الآن")}
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {recent.map((item) => {
                                            const warnCount = (item.analysis_json?.warnings?.length ?? 0) as number;
                                            return (
                                                <Link key={item.id} href="/dashboard/history">
                                                    <div className={cn(
                                                        "flex items-center gap-3 rounded-xl border border-white/[0.06] p-3",
                                                        "hover:border-cyan-400/20 hover:bg-white/[0.03] transition-all cursor-pointer group",
                                                        isArabic ? "flex-row-reverse" : ""
                                                    )}>
                                                        <div className="icon-badge icon-badge-cyan w-9 h-9 rounded-xl shrink-0">
                                                            <Pill className="h-4 w-4" />
                                                        </div>
                                                        <div className={cn("flex-1 min-w-0", isArabic ? "text-right" : "")}>
                                                            <p className="font-semibold text-white text-xs truncate">
                                                                {item.drug_name || t("Unknown", "غير محدد")}
                                                            </p>
                                                            <p className="text-[10px] text-slate-600 mt-0.5 truncate">
                                                                {item.created_at
                                                                    ? new Date(item.created_at).toLocaleDateString(isArabic ? "ar-SA" : "en-US", { month: "short", day: "numeric" })
                                                                    : "—"}
                                                            </p>
                                                        </div>
                                                        {warnCount > 0 && (
                                                            <span className="shrink-0 rounded-lg border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[9px] font-bold text-amber-300">
                                                                {warnCount}⚠
                                                            </span>
                                                        )}
                                                        <FileText className={cn("w-3.5 h-3.5 shrink-0 text-slate-700 group-hover:text-cyan-400 transition-colors", isArabic ? "order-first" : "")} />
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </GlassCard>

                        {/* Ultra upsell / plan status */}
                        {!isUltra ? (
                            <GlassCard accent="amber" hoverEffect={false} className="p-5" style={{ background: "rgba(245,158,11,0.04)" }}>
                                <div className={cn("flex items-start gap-3", isArabic ? "flex-row-reverse text-right" : "")}>
                                    <div className="icon-badge icon-badge-amber w-10 h-10 rounded-xl shrink-0">
                                        <Star className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className={cn("flex items-center gap-2 mb-1.5", isArabic ? "flex-row-reverse" : "")}>
                                            <p className="font-bold text-white text-sm">
                                                {t("Unlock Ultra", "افتح Ultra")}
                                            </p>
                                            <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-black text-black">PRO</span>
                                        </div>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            {t(
                                                "Get AI interaction guard, family profiles, PDF exports, and 2000 monthly credits.",
                                                "احصل على حارس التداخل الذكي، ملفات الأسرة، تصدير PDF، و٢٠٠٠ رصيد شهري."
                                            )}
                                        </p>
                                        <Link href="/pricing" className="mt-3 inline-flex">
                                            <Button variant="amber" size="xs" className="gap-1.5">
                                                <Zap className="w-3 h-3" />
                                                {t("Upgrade for $9/mo", "ترقية بـ $9/شهر")}
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </GlassCard>
                        ) : (
                            <GlassCard accent="amber" hoverEffect={false} className="p-5" style={{ background: "rgba(245,158,11,0.04)" }}>
                                <div className={cn("flex items-center gap-3", isArabic ? "flex-row-reverse" : "")}>
                                    <div className="icon-badge icon-badge-amber w-10 h-10 rounded-xl shrink-0">
                                        <BadgeCheck className="h-5 w-5" />
                                    </div>
                                    <div className={isArabic ? "text-right" : ""}>
                                        <p className="font-bold text-amber-300 text-sm">
                                            {t("Ultra Active", "Ultra مفعّل")}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {t("All premium features unlocked.", "جميع الميزات المميزة مفعّلة.")}
                                        </p>
                                    </div>
                                </div>
                            </GlassCard>
                        )}

                        {/* Safety Context progress */}
                        <GlassCard accent="emerald" hoverEffect={false} className="p-5">
                            <div className={cn("flex items-start gap-3", isArabic ? "flex-row-reverse" : "")}>
                                <div className="icon-badge icon-badge-emerald w-10 h-10 rounded-xl shrink-0">
                                    <HeartPulse className="h-5 w-5" />
                                </div>
                                <div className={cn("flex-1", isArabic ? "text-right" : "")}>
                                    <p className="font-bold text-white text-sm">
                                        {t("Health Profile", "الملف الصحي")}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {profilePercent < 100
                                            ? t(
                                                `${profilePercent}% complete — more data = better personalization.`,
                                                `${profilePercent}% مكتمل — بيانات أكثر = تخصيص أفضل.`
                                              )
                                            : t("Profile complete!", "الملف الشخصي مكتمل!")}
                                    </p>
                                    <div className="mt-2.5 progress-bar">
                                        <div className="progress-fill" style={{ width: `${profilePercent}%` }} />
                                    </div>
                                    <Link href="/profile" className="mt-3 inline-flex">
                                        <Button variant="outline" size="xs" className="gap-1.5 border-emerald-400/20 text-emerald-300 hover:bg-emerald-400/8">
                                            {profilePercent < 100
                                                ? t("Complete profile →", "أكمل الملف ←")
                                                : t("View profile →", "عرض الملف ←")}
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Medical disclaimer */}
                        <div className={cn(
                            "flex items-start gap-3 rounded-2xl border border-white/[0.05] p-4",
                            isArabic ? "flex-row-reverse text-right" : ""
                        )}>
                            <ShieldCheck className="h-4 w-4 text-slate-600 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                {t(
                                    "QURE AI is a review and verification tool. Always confirm important medical decisions with a licensed clinician or pharmacist.",
                                    "QURE AI أداة مراجعة وتحقق. أكّد دائمًا القرارات الطبية المهمة مع طبيب أو صيدلاني مرخص."
                                )}
                            </p>
                        </div>
                    </div>
                </section>

                {/* ── HOW IT WORKS STRIP ────────────────────────── */}
                <section>
                    <GlassCard hoverEffect={false} className="p-6 sm:p-8">
                        <div className={cn("mb-6", isArabic ? "text-right" : "")}>
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                                {t("The workflow", "آلية العمل")}
                            </p>
                            <h2 className="mt-1 text-lg font-bold text-white">
                                {t("3 steps from label to report", "٣ خطوات من الملصق إلى التقرير")}
                            </h2>
                        </div>

                        <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-3")}>
                            {[
                                {
                                    step: "01", color: "cyan",
                                    icon: ScanLine,
                                    titleEn: "Upload",     titleAr: "رفع الصورة",
                                    descEn:  "Take a photo of any medication label — pill bottles, blister packs, prescriptions.",
                                    descAr:  "التقط صورة لأي ملصق دواء — زجاجات الحبوب، العبوات، أو الوصفات الطبية.",
                                },
                                {
                                    step: "02", color: "emerald",
                                    icon: Globe,
                                    titleEn: "Verify",     titleAr: "التحقق",
                                    descEn:  "AI extracts the text and cross-checks with FDA databases and web signals.",
                                    descAr:  "يستخرج الذكاء الاصطناعي النص ويتحقق من قواعد بيانات FDA وإشارات الويب.",
                                },
                                {
                                    step: "03", color: "violet",
                                    icon: FileText,
                                    titleEn: "Review",     titleAr: "المراجعة",
                                    descEn:  "Get a clear safety report with warnings, interactions, dosage, and next steps.",
                                    descAr:  "احصل على تقرير أمان واضح بالتحذيرات والتداخلات والجرعة والخطوات القادمة.",
                                },
                            ].map((item, i) => {
                                const badgeColors: Record<string, string> = {
                                    cyan:    "text-cyan-400",
                                    emerald: "text-emerald-400",
                                    violet:  "text-violet-400",
                                };
                                const iconBadges: Record<string, string> = {
                                    cyan:    "icon-badge-cyan",
                                    emerald: "icon-badge-emerald",
                                    violet:  "icon-badge-violet",
                                };
                                return (
                                    <div key={item.step} className={cn("flex gap-4", isArabic ? "flex-row-reverse text-right" : "")}>
                                        <div className="shrink-0">
                                            <div className={cn("icon-badge w-10 h-10 rounded-xl", iconBadges[item.color])}>
                                                <item.icon className="h-5 w-5" />
                                            </div>
                                        </div>
                                        <div>
                                            <div className={cn("flex items-center gap-2 mb-1.5", isArabic ? "flex-row-reverse" : "")}>
                                                <span className={cn("text-xs font-black", badgeColors[item.color])}>{item.step}</span>
                                                <p className="font-bold text-white text-sm">{isArabic ? item.titleAr : item.titleEn}</p>
                                            </div>
                                            <p className="text-xs text-slate-500 leading-relaxed">{isArabic ? item.descAr : item.descEn}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-6 flex justify-center">
                            <Link href="/scan">
                                <Button variant="primary" className="gap-2 px-8" glow>
                                    <ScanLine className="w-4 h-4" />
                                    {t("Try it now — it's free", "جرّبه الآن — مجاناً")}
                                </Button>
                            </Link>
                        </div>
                    </GlassCard>
                </section>
            </div>
        </main>
    );
}
