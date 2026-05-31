"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TERMS_VERSION, hasAcceptedTerms, safeNextPath } from "@/lib/legal/terms";
import { useUser } from "@/context/UserContext";

export default function TermsPage() {
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);
    const { user, loading, refreshUser } = useUser();

    const [agree, setAgree] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const nextPath = useMemo(() => {
        if (typeof window === "undefined") return "/scan";
        const params = new URLSearchParams(window.location.search);
        return safeNextPath(params.get("next"), "/scan");
    }, []);

    const alreadyAccepted = Boolean(user && hasAcceptedTerms(user));

    useEffect(() => {
        if (!loading && alreadyAccepted) {
            router.replace(nextPath);
        }
    }, [alreadyAccepted, loading, nextPath, router]);

    const accept = async () => {
        if (!user) return;
        if (!agree) return;

        setSaving(true);
        setError(null);
        try {
            const { error: updateError } = await supabase.auth.updateUser({
                data: {
                    terms_accepted_at: new Date().toISOString(),
                    terms_version: TERMS_VERSION,
                },
            });
            if (updateError) throw updateError;

            await refreshUser();
            router.replace(nextPath);
        } catch (e: any) {
            setError(String(e?.message || "Failed to save consent"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="min-h-screen pt-28 pb-28 md:pb-12 px-4 flex items-center justify-center">
            <GlassCard className="w-full max-w-2xl p-8" hoverEffect={false}>
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-amber-300/10 border border-amber-300/20">
                        <ShieldAlert className="w-6 h-6 text-amber-300" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl md:text-3xl font-bold text-white">Terms and medical disclaimer</h1>
                        <p className="text-slate-400 mt-2 text-sm leading-relaxed">
                            Review these terms before using medication analysis features.
                        </p>
                        <p className="text-slate-600 mt-2 text-xs font-mono">Version: {TERMS_VERSION}</p>
                    </div>
                </div>

                <div className="mt-6 space-y-3 text-slate-300 text-sm leading-relaxed">
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-300 mt-0.5 shrink-0" />
                            <p>
                                QURE AI provides supporting medication information only. OCR and AI analysis can be
                                incorrect, incomplete, or outdated.
                            </p>
                        </div>
                    </div>

                    <ul className="space-y-2 list-disc pl-5">
                        <li>Do not use results as a replacement for a doctor, pharmacist, official label, or emergency care.</li>
                        <li>Verify critical medication decisions with a qualified professional and authoritative references.</li>
                        <li>Medication names, strengths, and formulations can differ by country, manufacturer, and package.</li>
                        <li>For severe symptoms or emergencies, contact emergency services immediately.</li>
                    </ul>

                    <p className="text-slate-500 text-xs">
                        You can review plans and return later. Analysis remains disabled until these terms are accepted.
                    </p>
                </div>

                {error && (
                    <div className="mt-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
                        {error}
                    </div>
                )}

                <div className="mt-6 flex items-start gap-3">
                    <input
                        id="agree"
                        type="checkbox"
                        checked={agree}
                        onChange={(e) => setAgree(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10"
                        disabled={saving || loading || !user}
                    />
                    <label htmlFor="agree" className="text-slate-300 text-sm">
                        I understand and agree that QURE AI is an informational tool and that medical decisions must be
                        verified with a qualified professional or official source.
                    </label>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <Link href="/pricing" className="text-xs text-slate-400 hover:text-white hover:underline">
                        View plans and pricing
                    </Link>

                    {!user ? (
                        <div className="flex gap-2 sm:justify-end">
                            <Link href={`/login?next=${encodeURIComponent(nextPath)}`}>
                                <Button size="sm">Log in</Button>
                            </Link>
                            <Link href={`/signup?next=${encodeURIComponent(nextPath)}`}>
                                <Button size="sm" variant="outline" className="border-white/15 text-white/80 hover:bg-white/10">
                                    Create account
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <Button
                            onClick={accept}
                            disabled={!agree || saving || loading}
                            size="sm"
                            className="bg-emerald-500 hover:bg-emerald-600 text-black"
                        >
                            {saving ? "Saving..." : (
                                <span className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" /> Accept and continue
                                </span>
                            )}
                        </Button>
                    )}
                </div>
            </GlassCard>
        </main>
    );
}
