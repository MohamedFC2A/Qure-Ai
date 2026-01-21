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
        <main className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
            <GlassCard className="w-full max-w-2xl p-8" hoverEffect={false}>
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                        <ShieldAlert className="w-6 h-6 text-amber-300" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl md:text-3xl font-bold text-white">الشروط وإخلاء المسؤولية</h1>
                        <p className="text-white/60 mt-2 text-sm leading-relaxed">
                            قبل استخدام ميزات التحليل، يلزم الموافقة على الشروط التالية.
                        </p>
                        <p className="text-white/30 mt-2 text-xs font-mono">Version: {TERMS_VERSION}</p>
                    </div>
                </div>

                <div className="mt-6 space-y-3 text-white/70 text-sm leading-relaxed">
                    <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/15">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-300 mt-0.5 shrink-0" />
                            <p>
                                هذا الموقع يقدم معلومات مساعدة فقط. قد تحتوي نتائج OCR/التحليل على أخطاء أو نقص.
                            </p>
                        </div>
                    </div>

                    <ul className="space-y-2">
                        <li>لا تعتمد على النتائج كبديل عن استشارة طبيب/صيدلي.</li>
                        <li>أي قرار علاجي يجب أن يكون بناءً على مرجع طبي موثوق/النشرة الرسمية للدواء.</li>
                        <li>قد تختلف الأدوية حسب الدولة والشركة والتركيز، حتى لو تشابه الاسم.</li>
                        <li>في الحالات الطارئة أو أعراض خطيرة: تواصل مع خدمات الطوارئ فورًا.</li>
                    </ul>

                    <p className="text-white/50 text-xs">
                        يمكنك مراجعة صفحة التسعير والعودة لاحقًا. لكن لن يتم تفعيل التحليل بدون الموافقة.
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
                    <label htmlFor="agree" className="text-white/70 text-sm">
                        أقر أنني فهمت ما سبق وأوافق على الشروط، وأتفهم أن الموقع غير مسؤول عن أي قرار طبي بدون مرجع/استشارة مختص.
                    </label>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <Link href="/pricing" className="text-xs text-white/50 hover:text-white/80 hover:underline">
                        عرض الخطط والتسعير
                    </Link>

                    {!user ? (
                        <div className="flex gap-2 sm:justify-end">
                            <Link href={`/login?next=${encodeURIComponent(nextPath)}`}>
                                <Button size="sm">تسجيل الدخول</Button>
                            </Link>
                            <Link href={`/signup?next=${encodeURIComponent(nextPath)}`}>
                                <Button size="sm" variant="outline" className="border-white/15 text-white/80 hover:bg-white/10">
                                    إنشاء حساب
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
                            {saving ? "جارٍ الحفظ..." : (
                                <span className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" /> موافق وتفعيل
                                </span>
                            )}
                        </Button>
                    )}
                </div>
            </GlassCard>
        </main>
    );
}

