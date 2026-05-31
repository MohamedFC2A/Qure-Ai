"use client";

import React from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";

const freeFeatures = [
    "100 credits that do not expire",
    "Medication OCR and core analysis",
    "Basic openFDA and web verification",
    "Saved scan history",
];

const ultraFeatures = [
    "Up to 2000 credits per month",
    "Private health profile and medication memories",
    "Family and caregiver profiles",
    "Advanced safety and interaction guard",
    "PNG and high-quality PDF exports",
];

const comparisonRows = [
    { feature: "Core medication analysis", free: true, ultra: true },
    { feature: "openFDA and web verification", free: true, ultra: true },
    { feature: "Medication history", free: true, ultra: true },
    { feature: "Private health profile", free: false, ultra: true },
    { feature: "Family/caregiver mode", free: false, ultra: true },
    { feature: "Medication memory and interaction guard", free: false, ultra: true },
    { feature: "Smart follow-up question tree", free: false, ultra: true },
    { feature: "Export", free: "PNG", ultra: "PNG + PDF" },
    { feature: "Monthly usage", free: "100 credits", ultra: "2000 credits" },
];

const valueCards = [
    {
        icon: HeartPulse,
        title: "Safety context",
        text: "Warnings are easier to review when the app knows allergies, conditions, and current medications.",
    },
    {
        icon: Users,
        title: "Family profiles",
        text: "Keep scans separated for yourself, a parent, or another person you care for.",
    },
    {
        icon: FileText,
        title: "Cleaner reports",
        text: "Export results for later review with a pharmacist, doctor, or caregiver.",
    },
];

const faqs = [
    {
        q: "هل الخطة المجانية كافية؟",
        a: "نعم للتجربة والتحليل الأساسي. Ultra أفضل إذا كنت تريد تخصيصًا صحيًا، ذاكرة أدوية، وتصديرًا أقوى.",
    },
    {
        q: "هل النتائج بديل للطبيب؟",
        a: "لا. النتائج تساعدك على الفهم والمراجعة، لكن القرارات الطبية المهمة يجب تأكيدها مع مختص.",
    },
    {
        q: "هل يمكن استخدامه للعائلة؟",
        a: "نعم في Ultra عبر ملفات منفصلة حتى لا تختلط ذاكرة الأدوية والسجل بين الأشخاص.",
    },
];

function FeatureList({ items, accent }: { items: string[]; accent: "cyan" | "amber" }) {
    return (
        <ul className="space-y-3">
            {items.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-white/72">
                    <span
                        className={cn(
                            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                            accent === "amber"
                                ? "border-amber-300/25 bg-amber-300/10 text-amber-200"
                                : "border-cyan-300/25 bg-cyan-300/10 text-cyan-200"
                        )}
                    >
                        <Check className="h-3.5 w-3.5" />
                    </span>
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );
}

function ComparisonValue({ value, highlighted = false }: { value: boolean | string; highlighted?: boolean }) {
    if (typeof value === "boolean") {
        return value ? (
            <Check className={cn("h-5 w-5", highlighted ? "text-amber-300" : "text-cyan-300")} />
        ) : (
            <Lock className="h-5 w-5 text-white/25" />
        );
    }

    return <span className={cn("text-sm", highlighted ? "text-white" : "text-white/70")}>{value}</span>;
}

export default function PricingPage() {
    const { plan, loading } = useUser();
    const router = useRouter();

    const handlePurchase = () => {
        router.push("/billing");
    };

    return (
        <main className="min-h-screen px-4 pb-28 pt-24 sm:px-6 md:pb-16 md:pt-28">
            <div className="mx-auto w-full max-w-6xl">
                <section className="grid grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
                    <div>
                        <div className="clinical-eyebrow">
                            <Sparkles className="h-4 w-4" />
                            Pricing
                        </div>
                        <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight text-white sm:text-5xl">
                            Choose the plan that matches how you scan.
                        </h1>
                        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg">
                            Start with core medication analysis for free. Upgrade when you need personal safety context, family profiles, medication memory, and export-ready reports.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {[
                            { icon: Clock, label: "Fast setup", value: "No card for Free" },
                            { icon: Shield, label: "Medical safety", value: "Review-focused" },
                            { icon: Globe, label: "Verification", value: "FDA + web signals" },
                        ].map((item) => (
                            <div key={item.label} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                                <item.icon className="h-5 w-5 text-cyan-200" />
                                <p className="mt-3 text-sm font-semibold text-white">{item.label}</p>
                                <p className="mt-1 text-xs leading-relaxed text-white/45">{item.value}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <GlassCard className="flex h-full flex-col p-6 sm:p-8" hoverEffect={false}>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold text-cyan-100">Free</p>
                                <h2 className="mt-2 text-3xl font-bold text-white">$0</h2>
                                <p className="mt-2 text-sm text-white/50">For trying QURE AI and occasional scans.</p>
                            </div>
                            <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-100">
                                <Sparkles className="h-6 w-6" />
                            </div>
                        </div>

                        <div className="my-6 h-px bg-white/10" />
                        <FeatureList items={freeFeatures} accent="cyan" />

                        <div className="mt-auto pt-8">
                            <Button disabled={plan === "free" || loading} variant="outline" className="w-full border-white/10 text-white/55">
                                {loading ? "Checking plan..." : plan === "free" ? "Current plan" : "Included"}
                            </Button>
                        </div>
                    </GlassCard>

                    <GlassCard className="relative flex h-full flex-col overflow-hidden border-amber-300/30 bg-amber-300/[0.055] p-6 sm:p-8" hoverEffect={false}>
                        <div className="absolute right-5 top-5 rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-black">
                            Best value
                        </div>

                        <div className="flex items-start justify-between gap-4 pr-24">
                            <div>
                                <p className="text-sm font-semibold text-amber-100">Ultra</p>
                                <div className="mt-2 flex items-end gap-2">
                                    <h2 className="text-4xl font-bold text-white">$9</h2>
                                    <span className="pb-1 text-sm text-white/50">/ month</span>
                                </div>
                                <p className="mt-2 text-sm text-amber-100/70">For regular scanning, family care, and personal safety checks.</p>
                            </div>
                            <div className="rounded-lg border border-amber-300/25 bg-amber-300/10 p-3 text-amber-100">
                                <Zap className="h-6 w-6" />
                            </div>
                        </div>

                        <div className="my-6 h-px bg-amber-100/15" />
                        <FeatureList items={ultraFeatures} accent="amber" />

                        <div className="mt-auto pt-8">
                            {loading ? (
                                <div className="h-11 w-full animate-pulse rounded-full bg-white/10" />
                            ) : (
                                <Button
                                    onClick={handlePurchase}
                                    disabled={plan === "ultra"}
                                    className="w-full gap-2 bg-amber-400 text-black shadow-none hover:bg-amber-300"
                                >
                                    {plan === "ultra" ? "Ultra is active" : "Upgrade to Ultra"}
                                    {plan !== "ultra" && <ArrowRight className="h-4 w-4" />}
                                </Button>
                            )}
                        </div>
                    </GlassCard>
                </section>

                <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                    {valueCards.map((item) => (
                            <div key={item.title} className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
                            <item.icon className="h-5 w-5 text-cyan-200" />
                            <h3 className="mt-4 text-base font-bold text-white">{item.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-white/52">{item.text}</p>
                        </div>
                    ))}
                </section>

                <section className="mt-12">
                    <GlassCard className="overflow-hidden p-0" hoverEffect={false}>
                        <div className="border-b border-white/10 p-5 sm:p-6">
                            <h2 className="text-2xl font-bold text-white">Plan comparison</h2>
                            <p className="mt-1 text-sm text-white/50">A clear view of what changes when you upgrade.</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[640px] text-left text-sm">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="p-4 font-semibold text-white/50">Feature</th>
                                        <th className="p-4 font-semibold text-white/50">Free</th>
                                        <th className="bg-amber-300/[0.06] p-4 font-semibold text-amber-100">Ultra</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparisonRows.map((row) => (
                                        <tr key={row.feature} className="border-b border-white/10 last:border-b-0">
                                            <td className="p-4 text-white/80">{row.feature}</td>
                                            <td className="p-4">
                                                <ComparisonValue value={row.free} />
                                            </td>
                                            <td className="bg-amber-300/[0.04] p-4">
                                                <ComparisonValue value={row.ultra} highlighted />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>
                </section>

                <section className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-6">
                        <Gift className="h-6 w-6 text-cyan-200" />
                        <h2 className="mt-4 text-xl font-bold text-white">Have a voucher?</h2>
                        <p className="mt-2 text-sm leading-relaxed text-white/55">
                            Redeem a code from your profile to add credits or unlock plan benefits tied to your account.
                        </p>
                        <Link href="/profile" className="mt-5 inline-flex">
                            <Button variant="outline" className="gap-2 border-cyan-300/25 text-cyan-100 hover:bg-cyan-300/10">
                                Redeem code <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {faqs.map((item) => (
                            <div key={item.q} className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
                                <h3 className="font-semibold text-white">{item.q}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-white/55">{item.a}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
