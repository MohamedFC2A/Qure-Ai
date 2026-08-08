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
import { useSettings } from "@/context/SettingsContext";
import { cn } from "@/lib/utils";

export default function TermsPage() {
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);
    const { user, loading, refreshUser } = useUser();
    const { resultsLanguage } = useSettings();
    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

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
            if (user?.id === "local-dev-user") {
                router.replace(nextPath);
                return;
            }
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
            setError(String(e?.message || t("Failed to save consent", "فشل حفظ الموافقة")));
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="min-h-screen pt-24 sm:pt-28 pb-24 md:pb-14 px-3 sm:px-6 flex items-center justify-center">
            <GlassCard className="w-full max-w-2xl p-6 sm:p-8" hoverEffect={false}>
                <div className="flex items-start gap-4">
                    <div className="icon-badge icon-badge-amber w-11 h-11 rounded-2xl shrink-0">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
                            {t("Terms and medical disclaimer", "الشروط وإخلاء المسؤولية الطبية")}
                        </h1>
                        <p className="text-slate-400 mt-1 text-xs sm:text-sm leading-relaxed">
                            {t("Review these terms before using medication analysis features.", "يرجى مراجعة هذه الشروط قبل استخدام ميزات فحص وتحليل الأدوية.")}
                        </p>
                        <p className="text-slate-500 mt-1 text-[11px] font-mono">Version: {TERMS_VERSION}</p>
                    </div>
                </div>

                <div className="mt-6 space-y-3.5 text-slate-300 text-xs sm:text-sm leading-relaxed">
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25">
                        <div className="flex items-start gap-2.5">
                            <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                            <p className="text-rose-200">
                                {t(
                                    "QURE AI provides supporting medication information only. OCR and AI analysis can be incorrect, incomplete, or outdated.",
                                    "يوفر QURE AI معلومات مساندة للأدوية فقط. قد تكون قراءات الذكاء الاصطناعي وOCR غير دقيقة أو غير كاملة أو غير محدثة."
                                )}
                            </p>
                        </div>
                    </div>

                    <ul className="space-y-2 list-disc ps-5 text-slate-300">
                        <li>{t("Do not use results as a replacement for a doctor, pharmacist, official label, or emergency care.", "لا تستخدم النتائج كبديل للطبيب أو الصيدلاني أو الملصق الرسمي أو الرعاية الطارئة.")}</li>
                        <li>{t("Verify critical medication decisions with a qualified professional and authoritative references.", "أكّد القرارات الدوائية المهمة دائمًا مع مختص مؤهل ومراجع موثوقة.")}</li>
                        <li>{t("Medication names, strengths, and formulations can differ by country, manufacturer, and package.", "أسماء الأدوية وتركيزاتها قد تختلف حسب البلد والشركة المصنعة ونوع العبوة.")}</li>
                        <li>{t("For severe symptoms or emergencies, contact emergency services immediately.", "في حالات الأعراض الشديدة أو الطوارئ، اتصل بالإسعاف فورًا.")}</li>
                    </ul>

                    <p className="text-slate-500 text-[11px]">
                        {t(
                            "You can review plans and return later. Analysis remains disabled until these terms are accepted.",
                            "يمكنك مراجعة الباقات والعودة لاحقًا. يبقى الفحص معطلاً حتى يتم قبول هذه الشروط."
                        )}
                    </p>
                </div>

                {error && (
                    <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                        {error}
                    </div>
                )}

                <div className="mt-6 pt-5 border-t border-white/10 flex flex-col gap-4">
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={agree}
                            onChange={(e) => setAgree(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-0"
                        />
                        <span className="text-xs sm:text-sm text-slate-300">
                            {t("I have read and agree to the medical terms and disclaimer.", "لقد قرأت ووافقت على الشروط الطبية وإخلاء المسؤولية.")}
                        </span>
                    </label>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <Button
                            onClick={accept}
                            disabled={!agree || saving || !user}
                            className="w-full sm:w-auto font-bold text-xs sm:text-sm px-6"
                            glow
                        >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            <span>{saving ? t("Saving...", "جارٍ الحفظ...") : t("Accept & Continue", "موافق والمتابعة")}</span>
                        </Button>
                        <Link href="/" className="w-full sm:w-auto">
                            <Button variant="ghost" className="w-full sm:w-auto text-slate-400 hover:text-white text-xs sm:text-sm">
                                {t("Cancel", "إلغاء")}
                            </Button>
                        </Link>
                    </div>
                </div>
            </GlassCard>
        </main>
    );
}
