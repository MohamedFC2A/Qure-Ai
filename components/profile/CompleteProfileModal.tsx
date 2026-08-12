"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/Button";
import {
    HeartPulse,
    User,
    Calendar,
    Ruler,
    Weight,
    CheckCircle2,
    AlertCircle,
    ShieldAlert,
    RotateCw,
} from "lucide-react";

interface CompleteProfileModalProps {
    forceOpen?: boolean;
    onCompleted?: () => void;
}

export function CompleteProfileModal({ forceOpen = false, onCompleted }: CompleteProfileModalProps) {
    const { user, profile, isProfileIncomplete, refreshUser, loading } = useUser();
    const { resultsLanguage } = useSettings();
    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    const [open, setOpen] = useState(false);
    const [age, setAge] = useState("");
    const [gender, setGender] = useState("");
    const [heightCm, setHeightCm] = useState("");
    const [weightKg, setWeightKg] = useState("");
    const [username, setUsername] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && user && (isProfileIncomplete || forceOpen)) {
            setOpen(true);
            if (profile) {
                if (profile.age) setAge(String(profile.age));
                if (profile.gender) setGender(profile.gender);
                if (profile.height) {
                    const cleanH = String(profile.height).replace(/[^0-9.]/g, "");
                    if (cleanH) setHeightCm(cleanH);
                }
                if (profile.weight) {
                    const cleanW = String(profile.weight).replace(/[^0-9.]/g, "");
                    if (cleanW) setWeightKg(cleanW);
                }
                if (profile.username) setUsername(profile.username);
            }
        } else if (!isProfileIncomplete && !forceOpen) {
            setOpen(false);
        }
    }, [user, profile, isProfileIncomplete, forceOpen, loading]);

    if (!open || loading || !user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const ageNum = parseInt(age, 10);
        const heightNum = parseFloat(heightCm);
        const weightNum = parseFloat(weightKg);

        if (!ageNum || ageNum < 1 || ageNum > 120) {
            setError(isArabic ? "يرجى إدخال عمر صحيح بين 1 و 120 عاماً." : "Please enter a valid age between 1 and 120.");
            return;
        }

        if (!gender || !["male", "female", "other"].includes(gender)) {
            setError(isArabic ? "يرجى اختيار الجنس للمتابعة." : "Please select your gender.");
            return;
        }

        if (!heightNum || heightNum < 50 || heightNum > 250) {
            setError(isArabic ? "يرجى إدخال الطول بالسنتيمتر (بين 50 و 250 سم)." : "Please enter a valid height (50 - 250 cm).");
            return;
        }

        if (!weightNum || weightNum < 10 || weightNum > 500) {
            setError(isArabic ? "يرجى إدخال الوزن بالكيلوغرام (بين 10 و 500 كجم)." : "Please enter a valid weight (10 - 500 kg).");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/profile/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    age: ageNum,
                    gender,
                    height: `${heightNum} cm`,
                    weight: `${weightNum} kg`,
                    username: username.trim() || undefined,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to update profile");
            }

            await refreshUser();
            setOpen(false);
            if (onCompleted) onCompleted();
        } catch (err: any) {
            setError(err.message || (isArabic ? "فشل حفظ البيانات. يرجى المحاولة مرة أخرى." : "Failed to save. Please try again."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-start">
                
                {/* Header */}
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                        <HeartPulse className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-[10px] font-bold text-cyan-300">
                            <ShieldAlert className="w-3 h-3" />
                            <span>{t("Required for Clinical Safety", "مطلوب لمعايير السلامة الدوائية")}</span>
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                            {t("Complete Your Health Profile", "استكمال بياناتك الصحية الأساسية")}
                        </h2>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            {t(
                                "To calculate safe medication dosages and check contraindications accurately, please enter your basic details.",
                                "لحساب الجرعات الآمنة بدقة وفحص موانع الاستعمال بحسب وزنك وعمرك، يرجى استكمال البيانات التالية."
                            )}
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Username if missing */}
                    {!profile?.username && (
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-300 ms-1 block">
                                {t("Username", "اسم المستخدم")}
                            </label>
                            <div className="relative">
                                <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                                    className="clinical-input ps-9 pe-4 py-2.5 text-xs sm:text-sm bg-slate-950 border-slate-800 font-mono"
                                    placeholder={t("e.g. mohamed or ahmed", "مثال: mohamed أو ahmed")}
                                    dir="ltr"
                                />
                            </div>
                        </div>
                    )}

                    {/* Age & Gender */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-300 ms-1 block">
                                {t("Age", "العمر")} <span className="text-rose-400">*</span>
                            </label>
                            <div className="relative">
                                <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    className="clinical-input ps-9 pe-4 py-2.5 text-xs sm:text-sm bg-slate-950 border-slate-800"
                                    placeholder="25"
                                    min={1}
                                    max={120}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-300 ms-1 block">
                                {t("Gender", "الجنس")} <span className="text-rose-400">*</span>
                            </label>
                            <div className="relative">
                                <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    className="clinical-input ps-9 pe-8 py-2.5 text-xs sm:text-sm appearance-none bg-slate-950 border-slate-800"
                                    required
                                >
                                    <option value="" disabled className="bg-slate-900 text-slate-500">
                                        {t("Select...", "اختر...")}
                                    </option>
                                    <option value="male" className="bg-slate-900 text-white">
                                        {t("Male", "ذكر")}
                                    </option>
                                    <option value="female" className="bg-slate-900 text-white">
                                        {t("Female", "أنثى")}
                                    </option>
                                    <option value="other" className="bg-slate-900 text-white">
                                        {t("Other", "آخر")}
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Height & Weight */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-300 ms-1 block">
                                {t("Height (cm)", "الطول (سم)")} <span className="text-rose-400">*</span>
                            </label>
                            <div className="relative">
                                <Ruler className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    value={heightCm}
                                    onChange={(e) => setHeightCm(e.target.value)}
                                    className="clinical-input ps-9 pe-4 py-2.5 text-xs sm:text-sm bg-slate-950 border-slate-800"
                                    placeholder="175"
                                    min={50}
                                    max={250}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-300 ms-1 block">
                                {t("Weight (kg)", "الوزن (كجم)")} <span className="text-rose-400">*</span>
                            </label>
                            <div className="relative">
                                <Weight className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.1"
                                    value={weightKg}
                                    onChange={(e) => setWeightKg(e.target.value)}
                                    className="clinical-input ps-9 pe-4 py-2.5 text-xs sm:text-sm bg-slate-950 border-slate-800"
                                    placeholder="70"
                                    min={10}
                                    max={500}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2 text-rose-300 text-xs font-medium">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-2">
                        <Button
                            type="submit"
                            disabled={saving}
                            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <RotateCw className="w-4 h-4 animate-spin" />
                                    <span>{t("Saving Profile...", "جارٍ حفظ البيانات...")}</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>{t("Save & Continue to Platform", "حفظ ومتابعة استخدام المنصة")}</span>
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
