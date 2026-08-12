"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import {
    ShieldAlert,
    AlertTriangle,
    CheckCircle2,
    Lock,
    Scale,
    FileText,
    ShieldCheck,
    ChevronRight,
    HelpCircle,
    UserCheck,
    Globe,
    Building2,
    HeartPulse,
} from "lucide-react";
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
            // Auto-redirect if user already accepted, unless explicit view
        }
    }, [alreadyAccepted, loading, nextPath, router]);

    const accept = async () => {
        if (!user) return;
        if (!agree) return;

        setSaving(true);
        setError(null);
        try {
            if (user?.id === "local-dev-user" || user?.id === "00000000-0000-0000-0000-000000000001") {
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
            window.location.href = nextPath;
        } catch (e: any) {
            setError(String(e?.message || t("Failed to save consent", "فشل حفظ الموافقة")));
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="min-h-screen pt-16 sm:pt-24 pb-16 sm:pb-20 md:pb-16 px-3 sm:px-6 max-w-5xl mx-auto" dir={isArabic ? "rtl" : "ltr"}>
            
            {/* Header */}
            <div className="text-center space-y-3 mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{t("Legal & Clinical Governance", "الشروط القانونية والسياسات الطبية")}</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    {t("Terms of Service & Medical Disclaimer", "الشروط وسياسات إخلاء المسؤولية الطبية")}
                </h1>

                <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    {t(
                        "Please read these terms carefully. QureScan and Qure AI are informational medical tools designed to support, not replace, professional healthcare.",
                        "يرجى قراءة هذه الشروط بعناية. منصة QureScan ومساعد Qure AI هما أدوات مساندة وليسا بديلاً عن الرعاية الطبية المباشرة."
                    )}
                </p>

                <p className="text-[11px] text-slate-500 font-mono">
                    {t("Governance Version:", "إصدار الاتفاقية:")} {TERMS_VERSION} (Active)
                </p>
            </div>

            {/* Critical Medical Warning Box */}
            <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-900/60 mb-8 space-y-3">
                <div className="flex items-center gap-2.5 text-rose-300 font-extrabold text-sm">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
                    <span>{t("CRITICAL MEDICAL NOTICE & EMERGENCY DISCLAIMER", "تنبيه طبي حاسم وإخلاء مسؤولية للرعاية الطارئة")}</span>
                </div>
                <p className="text-xs sm:text-sm text-rose-200/90 leading-relaxed">
                    {t(
                        "QureScan and Qure AI DO NOT provide licensed medical diagnosis, prescription writing, or emergency intervention. If you are experiencing a medical emergency, severe allergic reaction, or acute overdose, call your local emergency services (e.g. 123 / 911) or visit the nearest emergency room immediately.",
                        "لا تقدم منصة QureScan أو مساعد Qure AI تشخيصاً طبياً معتمداً أو كتابة وصفات طبية ملزمة أو تدخلاً طارئاً. في حالات الطوارئ الطبية أو التفاعلات الشديدة، اتصل بالإسعاف أو توجه لأقرب مستشفى فوراً."
                    )}
                </p>
            </div>

            {/* Legal Sections Accordion / Cards Grid */}
            <div className="space-y-6">

                {/* SECTION 1: MEDICAL DISCLAIMER */}
                <div className="p-6 rounded-3xl bg-slate-900/90 border border-white/10 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0">
                            <HeartPulse className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-white">
                            {t("1. Medical Disclaimer & Non-Physician Status", "1. إخلاء المسؤولية الطبية وعدم البدائل")}
                        </h2>
                    </div>

                    <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300 leading-relaxed list-disc ps-5">
                        <li>
                            {t(
                                "Informational Purpose Only: All OCR scans, drug label analyses, interaction checks, and Qure AI responses are generated for educational and informational support only.",
                                "غرض إعلامي ومساند فقط: جميع قراءات OCR وتحليلات ملصقات الأدوية وفحوصات التداخلات وإجابات Qure AI مُنشأة لأغراض تعليمية ومساندة فقط."
                            )}
                        </li>
                        <li>
                            {t(
                                "No Doctor-Patient Relationship: Utilizing QureScan does not create a physician-patient or pharmacist-patient relationship.",
                                "عدم وجود علاقة طبيب ومريض: استخدام المنصة لا ينشئ علاقة علاجية أو صيدلانية قانونية بين المنصة والمستخدم."
                            )}
                        </li>
                        <li>
                            {t(
                                "Verification Obligation: Users must verify all active ingredients, dosages, and contraindications with a licensed physician or pharmacist before taking any medication.",
                                "التزام التحقق: يجب على المستخدم التأكد من كافة المواد الفعالة والجرعات والموانع مع طبيب أو صيدلي معتمد قبل تناول أي دواء."
                            )}
                        </li>
                    </ul>
                </div>

                {/* SECTION 2: LIMITATION OF LIABILITY */}
                <div className="p-6 rounded-3xl bg-slate-900/90 border border-white/10 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-rose-400 shrink-0">
                            <Scale className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-white">
                            {t("2. Total Limitation of Liability & Company Protection", "2. حدود المسؤولية القانونية وحماية الشركة بالكامل")}
                        </h2>
                    </div>

                    <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300 leading-relaxed list-disc ps-5">
                        <li>
                            {t(
                                "Zero Company Liability: Under no circumstances shall QureScan, its developers, company, affiliates, or data providers (e.g. openFDA) be held liable for any direct, indirect, accidental, or consequential damages resulting from medication misuse, OCR misreadings, or self-medication.",
                                "إخلاء كامل لمسؤولية الشركة: لا تتحمل منصة QureScan أو مطوروها أو الشركة المشغلة أي مسؤولية قانونية أو مالية أو مدنية عن أي أضرار مباشرة أو غير مباشرة ناتجة عن الاستخدام الخاطئ للأدوية أو قراءة الصور."
                            )}
                        </li>
                        <li>
                            {t(
                                "User Assumption of Risk: The user assumes 100% full personal responsibility for all decisions related to medication purchasing, administration, and health management.",
                                "تحمل المستخدم للمسؤولية: يتحمل المستخدم المسؤولية الكاملة والشخصية بنسبة 100% عن كافة القرارات المتعلقة بشراء أو تناول الأدوية."
                            )}
                        </li>
                        <li>
                            {t(
                                "OCR & Data Variation Notice: Pharmaceutical labels, brand names, and active ingredients vary by manufacturer and region. OCR technology may misinterpret blurred or damaged packaging.",
                                "تنبيه قراءة الصور والأسماء التجريبية: قد تختلف أسماء الأدوية والعبوات حسب الشركة والمنطقة، وتقنية OCR قد تتأثر بالصور غير الواضحة."
                            )}
                        </li>
                    </ul>
                </div>

                {/* SECTION 3: PRIVACY & DATA SECURITY */}
                <div className="p-6 rounded-3xl bg-slate-900/90 border border-white/10 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 shrink-0">
                            <Lock className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-white">
                            {t("3. Health Data Privacy & Confidentiality", "3. الخصوصية وحماية البيانات الطبية الشخصية")}
                        </h2>
                    </div>

                    <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300 leading-relaxed list-disc ps-5">
                        <li>
                            {t(
                                "Encrypted Profile Storage: Personal health profiles, chronic conditions, and allergy notes are encrypted and accessible strictly by your authenticated account.",
                                "تشفير وحماية البيانات: يتم حفظ وتشفير الملفات الصحية والحساسية وتاريخ الفحوصات ببيئة سحابية آمنة خاضعة لحماية الحساب."
                            )}
                        </li>
                        <li>
                            {t(
                                "No Data Resale: We NEVER sell, license, or share your personal health records or scanned medication history with commercial advertisers or insurance brokers.",
                                "عدم بيع البيانات: لا نقوم مطلقاً ببيع أو مشاركة بياناتك الطبية أو سجل فحوصاتك مع أي شركات إعلانات أو طرف ثالث."
                            )}
                        </li>
                    </ul>
                </div>

                {/* SECTION 4: PROHIBITED USES */}
                <div className="p-6 rounded-3xl bg-slate-900/90 border border-white/10 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-purple-400 shrink-0">
                            <FileText className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-white">
                            {t("4. Acceptable Use & External API Limitations", "4. الاستخدام المقبول وشروط الربط الخارجي")}
                        </h2>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {t(
                            "You agree not to use QureScan or Qure AI APIs for illegal pharmaceutical distribution, automated clinical decision-making without human oversight, or unauthorized commercial scraping.",
                            "يتعهد المستخدم بعدم استخدام المنصة أو واجهات API في ترويج الأدوية بشكل غير قانوني، أو التشخيص الآلي التجاري بدون إشراف طبي بشري."
                        )}
                    </p>
                </div>

            </div>

            {/* Interactive User Consent / Acceptance Box */}
            <div className="mt-8 p-6 rounded-3xl bg-slate-900 border border-white/15 space-y-4">
                <h3 className="text-sm font-bold text-white">
                    {t("User Agreement Confirmation", "إقرار الموافقة والالتزام بالشروط")}
                </h3>

                {alreadyAccepted ? (
                    <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/50 flex items-center gap-3 text-emerald-300 text-xs sm:text-sm font-bold">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span>{t("You have already accepted these terms. Protection active.", "لقد وافقت على هذه الشروط مسبقاً. الحماية مفعّلة.")}</span>
                    </div>
                ) : (
                    <>
                        <label className="flex items-start gap-3 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={agree}
                                onChange={(e) => setAgree(e.target.checked)}
                                className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-cyan-500 focus:ring-0 cursor-pointer"
                            />
                            <span className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                {t(
                                    "I confirm that I have read, understood, and agreed to the Medical Disclaimer, Total Limitation of Liability, and Privacy Policy. I acknowledge that QureScan does not replace a doctor.",
                                    "أقر بأنني قرأت وفهمت ووافقت بالكامل على إخلاء المسؤولية الطبية، حدود المسؤولية القانونية لحماية الشركة، وسياسة الخصوصية، وأدرك أن المنصة لا تستبدل الطبيب."
                                )}
                            </span>
                        </label>

                        {error && (
                            <p className="text-xs text-rose-400 font-bold">{error}</p>
                        )}

                        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                            <Button
                                onClick={accept}
                                disabled={!agree || saving || !user}
                                className="w-full sm:w-auto font-bold text-xs sm:text-sm px-6 py-2.5"
                                glow
                            >
                                <CheckCircle2 className="w-4 h-4 me-2" />
                                <span>{saving ? t("Saving...", "جارٍ الحفظ...") : t("Accept & Continue", "إقرار وافقت والمتابعة")}</span>
                            </Button>
                            <Link href="/" className="w-full sm:w-auto">
                                <Button variant="ghost" className="w-full sm:w-auto text-slate-400 hover:text-white text-xs sm:text-sm">
                                    {t("Return Home", "العودة للرئيسية")}
                                </Button>
                            </Link>
                        </div>
                    </>
                )}
            </div>

        </main>
    );
}
