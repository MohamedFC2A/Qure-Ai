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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/lib/supabase/client";

type HistoryItem = {
    id: string;
    drug_name?: string | null;
    manufacturer?: string | null;
    created_at?: string | null;
    analysis_json?: { warnings?: unknown[]; uses?: unknown[] };
};

const quickActions = [
    { label: "New analysis", href: "/scan", icon: ScanLine, tone: "cyan" },
    { label: "History", href: "/dashboard/history", icon: Clock, tone: "slate" },
    { label: "Profile", href: "/profile", icon: UserRound, tone: "slate" },
    { label: "Plans", href: "/pricing", icon: CreditCard, tone: "amber" },
];

export default function DashboardPage() {
    const { user, profile, plan, credits, loading } = useUser();
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);
    const [recent, setRecent] = useState<HistoryItem[]>([]);
    const [recentLoading, setRecentLoading] = useState(false);

    const hasLocalDevCookie =
        typeof document !== "undefined" &&
        document.cookie.split("; ").some((cookie) => cookie === "qure_dev_auth=1");
    const isLocalDevUser = process.env.NODE_ENV === "development" && (user?.id === "local-dev-user" || hasLocalDevCookie);
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

                if (error) {
                    setRecent([]);
                    return;
                }
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
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
            </main>
        );
    }

    if (!user) return null;

    return (
        <main className="min-h-screen pt-28 pb-28 md:pb-14">
            <div className="clinical-page">
                <section className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
                    <div>
                        <div className="clinical-eyebrow">
                            <Activity className="h-4 w-4" />
                            Workspace
                        </div>
                        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                            Clinical dashboard
                        </h1>
                        <p className="mt-3 max-w-2xl text-slate-400">
                            Monitor usage, continue recent medication reviews, and keep safety context ready before scanning.
                        </p>
                    </div>

                    <GlassCard className="p-5" hoverEffect={false}>
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold text-slate-400">Current plan</p>
                                <p className="mt-1 text-2xl font-bold uppercase text-white">{plan}</p>
                            </div>
                            <div className="rounded-lg border border-amber-300/25 bg-amber-300/10 p-3 text-amber-100">
                                <Zap className="h-6 w-6" />
                            </div>
                        </div>
                        <div className="mt-5 grid grid-cols-2 gap-3">
                            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                                <p className="text-xs text-slate-500">Credits</p>
                                <p className="mt-1 text-xl font-bold text-white">{credits}</p>
                            </div>
                            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                                <p className="text-xs text-slate-500">Profile</p>
                                <p className="mt-1 text-xl font-bold text-white">{profilePercent}%</p>
                            </div>
                        </div>
                    </GlassCard>
                </section>

                <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                    {quickActions.map((item) => (
                        <Link key={item.href} href={item.href}>
                            <div className="clinical-panel group flex h-full items-center justify-between gap-3 p-4 transition hover:border-cyan-300/25 hover:bg-white/[0.05]">
                                <div className="flex items-center gap-3">
                                    <div className={`rounded-lg border p-2 ${item.tone === "amber" ? "border-amber-300/25 bg-amber-300/10 text-amber-100" : item.tone === "cyan" ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-white/[0.04] text-slate-300"}`}>
                                        <item.icon className="h-5 w-5" />
                                    </div>
                                    <span className="font-semibold text-white">{item.label}</span>
                                </div>
                                <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-cyan-200" />
                            </div>
                        </Link>
                    ))}
                </section>

                <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                    <GlassCard className="p-0" hoverEffect={false}>
                        <div className="flex items-center justify-between gap-4 border-b border-white/10 p-5">
                            <div>
                                <h2 className="text-xl font-bold text-white">Recent analyses</h2>
                                <p className="mt-1 text-sm text-slate-500">Continue where you left off.</p>
                            </div>
                            <Link href="/dashboard/history">
                                <Button variant="outline" size="sm" className="gap-2">
                                    Open history <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>

                        <div className="p-5">
                            {recentLoading ? (
                                <div className="grid gap-3">
                                    {[1, 2, 3].map((item) => (
                                        <div key={item} className="h-20 animate-pulse rounded-lg bg-white/5" />
                                    ))}
                                </div>
                            ) : recent.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-white/10 p-8 text-center">
                                    <Pill className="mx-auto h-8 w-8 text-slate-500" />
                                    <p className="mt-3 font-semibold text-white">No analyses yet</p>
                                    <p className="mt-1 text-sm text-slate-500">Run your first scan to build a medication record.</p>
                                    <Link href="/scan" className="mt-5 inline-flex">
                                        <Button>Start analysis</Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {recent.map((item) => (
                                        <Link key={item.id} href="/dashboard/history">
                                            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4 transition hover:border-cyan-300/25 hover:bg-white/[0.055]">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <p className="truncate font-semibold text-white">{item.drug_name || "Unknown medication"}</p>
                                                        <p className="mt-1 truncate text-sm text-slate-500">{item.manufacturer || "Generic"} · {item.created_at ? new Date(item.created_at).toLocaleDateString() : "No date"}</p>
                                                    </div>
                                                    <FileText className="h-5 w-5 shrink-0 text-cyan-200" />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </GlassCard>

                    <div className="grid gap-5">
                        <GlassCard className="p-5" hoverEffect={false}>
                            <div className="flex items-start gap-3">
                                <HeartPulse className="mt-1 h-6 w-6 text-emerald-200" />
                                <div>
                                    <h2 className="text-xl font-bold text-white">Safety context</h2>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-400">
                                        Profile basics are {profilePercent}% complete. More context improves personalization and interaction review.
                                    </p>
                                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                                        <div className="h-full rounded-full bg-emerald-300" style={{ width: `${profilePercent}%` }} />
                                    </div>
                                    <Link href="/profile" className="mt-4 inline-flex">
                                        <Button variant="outline" size="sm">Review profile</Button>
                                    </Link>
                                </div>
                            </div>
                        </GlassCard>

                        <GlassCard className="p-5" hoverEffect={false}>
                            <div className="flex items-start gap-3">
                                <Users className="mt-1 h-6 w-6 text-cyan-200" />
                                <div>
                                    <h2 className="text-xl font-bold text-white">Family care</h2>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-400">
                                        Ultra keeps scan history and medication memory separated by profile.
                                    </p>
                                </div>
                            </div>
                        </GlassCard>

                        <GlassCard className="p-5" hoverEffect={false}>
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="mt-1 h-6 w-6 text-amber-200" />
                                <div>
                                    <h2 className="text-xl font-bold text-white">Medical disclaimer</h2>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-400">
                                        Use reports for review and verification. Confirm critical decisions with a clinician or pharmacist.
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
