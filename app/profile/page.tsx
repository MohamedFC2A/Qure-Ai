"use client";

import { clearAllAuthCookies } from "@/lib/authCookies";

import React, { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import {
    User,
    Users,
    CreditCard,
    Settings,
    Shield,
    Activity,
    Gift,
    LogOut,
    ChevronRight,
    Lock,
    Database,
    Trash2,
    Plus,
    RefreshCw,
    UserCheck,
    Crown,
    Fingerprint,
    Smartphone,
    MapPin,
    RotateCcw,
    Check,
    Zap,
    Volume2,
    Siren,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSettings } from "@/context/SettingsContext";
import { useUltraCelebration } from "@/context/UltraCelebrationContext";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SmartHeightInput, SmartWeightInput } from "@/components/ui/SmartMeasurementInput";
import { ESOSAISection } from "@/components/profile/ESOSAISection";

export default function ProfilePage() {
    const { user, profile, plan, credits, loading: userLoading, refreshUser } = useUser();
    const {
        resultsLanguage,
        setResultsLanguage,
        isAutoDetected,
        resetToAutoDetect,
        detectedCountry,
        fdaDrugsEnabled,
        setFdaDrugsEnabled,
        requireBiometricOnScan,
        setRequireBiometricOnScan,
        voiceOsEnabled,
        setVoiceOsEnabled,
    } = useSettings();
    const { triggerCelebration } = useUltraCelebration();
    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");
    const [activeTab, setActiveTab] = useState<'account' | 'credits' | 'settings' | 'esos' | 'fda' | 'family' | 'private' | 'memories'>('account');

    useEffect(() => {
        if (tabParam && ['account', 'credits', 'settings', 'esos', 'fda', 'family', 'private', 'memories'].includes(tabParam)) {
            setActiveTab(tabParam as any);
        }
    }, [tabParam]);
    const supabase = createClient();
    const router = useRouter();
    const isLocalDevUser = process.env.NODE_ENV === "development" && user?.id === "local-dev-user";

    const [redeemCode, setRedeemCode] = useState("");
    const [redeemMsg, setRedeemMsg] = useState("");
    const [redeemLoading, setRedeemLoading] = useState(false);

    // Basic Profile (stored in `profiles` for all plans)
    const [basicProfile, setBasicProfile] = useState({
        username: "",
        age: "",
        gender: "",
        heightCm: "",
        weightKg: "",
    });
    const [basicSaving, setBasicSaving] = useState(false);
    const [basicSavedMsg, setBasicSavedMsg] = useState<string | null>(null);

    // Private Profile State
    const [privateProfile, setPrivateProfile] = useState<any>({});
    const [profileSaving, setProfileSaving] = useState(false);

    // Memories State
    const [memories, setMemories] = useState<any[]>([]);

    // Transactions State
    const [transactions, setTransactions] = useState<any[]>([]);

    // Family/Caregiver Mode (Ultra): sub-profiles under the same account
    const [careProfiles, setCareProfiles] = useState<Array<{ id: string; display_name: string; relationship?: string | null }>>([]);
    const [careLoading, setCareLoading] = useState(false);
    const [activeCareProfileId, setActiveCareProfileId] = useState<string | null>(null);
    const [careName, setCareName] = useState("");
    const [careRelation, setCareRelation] = useState("");
    const [careMsg, setCareMsg] = useState<string | null>(null);

    useEffect(() => {
        if (!userLoading && !user) {
            router.push('/login');
        }
    }, [router, user, userLoading]);

    useEffect(() => {
        if (!user) return;
        fetchCareProfiles();
    }, [user?.id]);

    useEffect(() => {
        if (!user) return;
        if (activeTab === 'credits') {
            fetchTransactions();
        }
    }, [activeTab, user?.id]);

    useEffect(() => {
        if (!user) return;
        if (plan !== 'ultra') return;
        if (!activeCareProfileId) return;

        if (activeTab === 'private') {
            fetchPrivateProfile(activeCareProfileId);
        }
        if (activeTab === 'memories') {
            fetchMemories(activeCareProfileId);
        }
    }, [activeCareProfileId, activeTab, plan, user?.id]);

    useEffect(() => {
        if (!user) return;
        const num = (value?: string) => {
            const m = String(value || "").match(/[\d.]+/);
            return m ? m[0] : "";
        };
        setBasicProfile({
            username: String(profile?.username || ""),
            age: profile?.age == null ? "" : String(profile.age),
            gender: String(profile?.gender || ""),
            heightCm: num(profile?.height),
            weightKg: num(profile?.weight),
        });
    }, [user, profile]);

    const handleSignOut = async () => {
        clearAllAuthCookies();
        if (typeof window !== "undefined") {
            localStorage.removeItem("qurescan_active_care_profile");
        }
        await supabase.auth.signOut();
        router.push('/login');
    };

    const fetchTransactions = async () => {
        if (isLocalDevUser) {
            setTransactions([
                { id: "local-credit", created_at: new Date().toISOString(), amount: 999, reason: "Local dev credits", delta: 999 },
            ]);
            return;
        }

        const { data, error } = await supabase
            .from('credit_ledger')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (data) {
            setTransactions(data);
        } else if (error) {
            console.error("Error fetching transactions:", error);
        }
    };

    const handleRedeem = async () => {
        if (!redeemCode) return;
        setRedeemLoading(true);
        setRedeemMsg("");
        try {
            const res = await fetch('/api/credits/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: redeemCode })
            });
            const data = await res.json();
            if (res.ok) {
                setRedeemMsg(data.message || t("Voucher redeemed successfully!", "تم شحن القسيمة بنجاح!"));
                setRedeemCode("");
                await refreshUser();
                setTimeout(() => {
                    triggerCelebration({ force: true });
                }, 300);
            } else {
                setRedeemMsg(data.error || t("Failed to redeem code", "فشل استبدال الكود"));
            }
        } catch (e) {
            setRedeemMsg(t("Error redeeming code", "حدث خطأ أثناء استبدال الكود"));
        } finally {
            setRedeemLoading(false);
        }
    };

    const saveBasicProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setBasicSaving(true);
        setBasicSavedMsg(null);

        const payload = {
            username: basicProfile.username.trim() || null,
            age: basicProfile.age ? Number(basicProfile.age) : null,
            gender: basicProfile.gender || null,
            height: basicProfile.heightCm ? `${basicProfile.heightCm} cm` : null,
            weight: basicProfile.weightKg ? `${basicProfile.weightKg} kg` : null,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from('profiles')
            .update(payload)
            .eq('id', user.id);

        setBasicSaving(false);

        if (error) {
            console.error("Error saving basic profile:", error);
            setBasicSavedMsg(error.message || t("Failed to save profile.", "فشل حفظ بيانات الملف الشخصي."));
            return;
        }

        setBasicSavedMsg(t("Saved!", "تم الحفظ بنجاح!"));
        await refreshUser();
    };

    const fetchCareProfiles = async () => {
        if (!user) return;
        if (isLocalDevUser) {
            const rows = [{ id: user.id, display_name: "Local Dev", relationship: "self" }];
            setCareProfiles(rows);
            setActiveCareProfileId(user.id);
            return;
        }

        setCareLoading(true);
        setCareMsg(null);
        try {
            const res = await supabase
                .from('care_profiles')
                .select('id, display_name, relationship, created_at')
                .eq('owner_user_id', user.id)
                .order('created_at', { ascending: true });

            if (res.error) {
                setCareProfiles([{ id: user.id, display_name: String(user.email || t("Me", "أنا")), relationship: "self" }]);
                setActiveCareProfileId(user.id);
                return;
            }

            const rows = (res.data || []).map((r: any) => ({
                id: String(r.id),
                display_name: String(r.display_name || t("Me", "أنا")),
                relationship: r.relationship ?? null,
            }));

            rows.sort((a: any, b: any) => {
                const aSelf = a.id === user.id || a.relationship === "self";
                const bSelf = b.id === user.id || b.relationship === "self";
                if (aSelf && !bSelf) return -1;
                if (!aSelf && bSelf) return 1;
                return a.display_name.localeCompare(b.display_name);
            });

            setCareProfiles(rows.length ? rows : [{ id: user.id, display_name: String(user.email || t("Me", "أنا")), relationship: "self" }]);

            const saved = typeof window !== "undefined" ? localStorage.getItem("qurescan_active_care_profile") : null;
            const preferred = saved && rows.some((p: any) => p.id === saved) ? saved : null;
            const next = preferred || activeCareProfileId || user.id;
            const valid = rows.some((p: any) => p.id === next) ? next : (rows[0]?.id || user.id);
            setActiveCareProfileId(valid);
        } finally {
            setCareLoading(false);
        }
    };

    useEffect(() => {
        if (!activeCareProfileId) return;
        try {
            localStorage.setItem("qurescan_active_care_profile", activeCareProfileId);
        } catch {
            // ignore
        }
    }, [activeCareProfileId]);

    const addCareProfile = async () => {
        if (!user) return;
        if (plan !== 'ultra') return;

        const name = careName.trim();
        if (!name) return;

        setCareLoading(true);
        setCareMsg(null);
        try {
            const res = await supabase
                .from('care_profiles')
                .insert({
                    owner_user_id: user.id,
                    display_name: name,
                    relationship: careRelation.trim() || null,
                    updated_at: new Date().toISOString(),
                })
                .select('id, display_name, relationship')
                .single();

            if (res.error) {
                setCareMsg(res.error.message || t("Failed to add profile.", "فشل إضافة الملف العائلي."));
                return;
            }

            setCareName("");
            setCareRelation("");
            await fetchCareProfiles();
            if (res.data?.id) setActiveCareProfileId(String(res.data.id));
        } finally {
            setCareLoading(false);
        }
    };

    const deleteCareProfile = async (profileId: string) => {
        if (!user) return;
        if (plan !== 'ultra') return;
        if (profileId === user.id) return;

        setCareLoading(true);
        setCareMsg(null);
        try {
            const { error } = await supabase
                .from('care_profiles')
                .delete()
                .eq('id', profileId)
                .eq('owner_user_id', user.id);

            if (error) {
                setCareMsg(error.message || t("Failed to delete profile.", "فشل حذف الملف."));
                return;
            }

            await fetchCareProfiles();
            setActiveCareProfileId(user.id);
        } finally {
            setCareLoading(false);
        }
    };

    const fetchPrivateProfile = async (profileId: string) => {
        if (!user) return;
        const pid = String(profileId || "").trim() || user.id;

        const defaults: any = {
            profile_id: pid,
            age: "",
            sex: "",
            height: "",
            weight: "",
            allergies: "",
            chronic_conditions: "",
            current_medications: "",
            notes: "",
        };

        if (isLocalDevUser) {
            setPrivateProfile({
                ...defaults,
                allergies: "Penicillin",
                chronic_conditions: "Asthma",
                current_medications: "Ibuprofen, Paracetamol",
                notes: "Local development sample profile.",
            });
            return;
        }

        if (pid === user.id) {
            defaults.age = profile?.age == null ? "" : String(profile.age);
            defaults.sex = String(profile?.gender || "");
            defaults.height = String(profile?.height || "");
            defaults.weight = String(profile?.weight || "");
        }

        const res = await supabase
            .from('care_private_profiles')
            .select('*')
            .eq('profile_id', pid)
            .maybeSingle();

        let row: any = res.data || null;

        if ((!row || res.error) && pid === user.id) {
            const legacy = await supabase
                .from('user_private_profile')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();
            row = legacy.data || row;
        }

        setPrivateProfile({ ...defaults, ...(row || {}) });
    };

    const savePrivateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (plan !== 'ultra') return;

        const pid = activeCareProfileId || user.id;

        setProfileSaving(true);
        const payload = {
            profile_id: pid,
            age: privateProfile.age ? Number(privateProfile.age) : null,
            sex: privateProfile.sex || null,
            height: privateProfile.height || null,
            weight: privateProfile.weight || null,
            allergies: privateProfile.allergies || null,
            chronic_conditions: privateProfile.chronic_conditions || null,
            current_medications: privateProfile.current_medications || null,
            notes: privateProfile.notes || null,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from('care_private_profiles')
            .upsert(payload);
        setProfileSaving(false);
        if (!error) alert(t("Profile saved!", "تم حفظ الملف الصحي بنجاح!"));
        if (!error) fetchPrivateProfile(pid);
    };

    const fetchMemories = async (profileId: string) => {
        if (!user) return;
        if (isLocalDevUser) {
            setMemories([
                {
                    id: "local-memory-1",
                    display_name: "Ibuprofen",
                    last_seen_at: new Date().toISOString(),
                },
            ]);
            return;
        }

        const pid = String(profileId || "").trim() || user.id;

        let res = await supabase
            .from('memories_medications')
            .select('*')
            .eq('user_id', user.id)
            .eq('profile_id', pid)
            .order('last_seen_at', { ascending: false });

        if (res.error && String(res.error.message || "").toLowerCase().includes("profile_id")) {
            res = await supabase
                .from('memories_medications')
                .select('*')
                .eq('user_id', user.id)
                .order('last_seen_at', { ascending: false });
        }

        if (res.error) {
            console.error("Error fetching memories:", res.error);
            return;
        }
        setMemories(res.data || []);
    };

    const deleteMemory = async (id: string) => {
        if (!user) return;
        await supabase.from('memories_medications').delete().eq('id', id);
        if (activeCareProfileId) fetchMemories(activeCareProfileId);
    };

    const tabs = [
        { id: 'account', label: t('Account', 'الحساب'), icon: User },
        { id: 'credits', label: t('Credits & Plans', 'الرصيد والخطط'), icon: CreditCard },
        { id: 'settings', label: t('Advanced Settings', 'الإعدادات المتقدمة'), icon: Settings },
        { id: 'esos', label: t('ESOS AI', 'طوارئ ESOS AI'), icon: Siren, pro: true },
        { id: 'fda', label: t('FDA Drugs', 'أدوية FDA'), icon: Database, pro: true, beta: true },
        { id: 'family', label: t('Family Care', 'رعاية الأسرة'), icon: Users, pro: true },
        { id: 'private', label: t('Private AI Profile', 'الملف الصحي الخاص'), icon: Shield, pro: true },
        { id: 'memories', label: t('Medication Memories', 'سجل الأدوية'), icon: Activity, pro: true },
    ];

    if (userLoading) return <div className="min-h-screen pt-20 flex justify-center items-center"><div className="animate-spin w-8 h-8 border-2 border-cyan-300 rounded-full border-t-transparent" /></div>;

    return (
        <main className="min-h-screen pt-16 sm:pt-24 pb-16 sm:pb-20 md:pb-14 px-3 sm:px-6 max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                        {t("My Profile", "الحساب والملف الشخصي")}
                    </h1>
                    <p className="mt-2 text-slate-400 text-xs sm:text-sm">
                        {t("Manage account details, credits, safety context, and family profiles.", "إدارة تفاصيل الحساب، الرصيد، خيارات السلامة الدوائية، وحسابات العائلة.")}
                    </p>
                </div>
                {(["mohamedahmedmatany@gmail.com", "uversionstore@gmail.com"].includes((user?.email || user?.user_metadata?.email || "").toLowerCase().trim()) || user?.id === "00000000-0000-0000-0000-000000000001") && (
                    <Link href="/admin/ceo-requests">
                        <button className="py-2.5 px-4 rounded-xl bg-q-surface-2 border border-white/10 hover:bg-q-surface-3 text-slate-200 hover:text-white text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-sm">
                            <Crown className="w-4 h-4 text-cyan-400" />
                            <span>{t("CEO Control Portal", "لوحة تحكم وإدارة CEO")}</span>
                        </button>
                    </Link>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Responsive Navigation Sidebar */}
                <div className="p-2 md:col-span-1 h-fit flex flex-row md:flex-col overflow-x-auto no-scrollbar gap-1 shrink-0 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 md:w-full text-start",
                                activeTab === tab.id
                                    ? "bg-white/[0.08] text-white border border-white/[0.12]"
                                    : "text-slate-400 hover:bg-white/[0.03] hover:text-white"
                            )}
                        >
                            <tab.icon className={cn("w-4 h-4 shrink-0", activeTab === tab.id ? "text-cyan-400" : "text-slate-400")} />
                            <span className="flex-1 truncate">{tab.label}</span>
                            {(tab as any).beta && <span className="text-[9px] font-bold text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded border border-cyan-400/20 hidden xs:inline">BETA</span>}
                            {tab.pro && <span className="text-[9px] font-bold text-slate-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 hidden xs:inline">ULTRA</span>}
                        </button>
                    ))}

                    <div className="h-px bg-white/[0.06] my-1 hidden md:block" />

                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors w-full text-start shrink-0"
                    >
                        <LogOut className="w-4 h-4 shrink-0" />
                        <span>{t("Sign Out", "تسجيل الخروج")}</span>
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="md:col-span-3">

                    {/* ACCOUNT TAB */}
                    {activeTab === 'account' && (
                        <div className="space-y-6">
                            {/* User Info Card */}
                            <div className="p-5 sm:p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl space-y-5">
                                <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] overflow-hidden flex items-center justify-center border border-white/[0.08] shrink-0">
                                            {user?.user_metadata?.avatar_url ? (
                                                <img src={user.user_metadata.avatar_url} alt={user.email || "Avatar"} className="w-full h-full object-cover" />
                                            ) : <User className="w-7 h-7 text-slate-400" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-base font-bold text-white truncate">{user?.email}</p>
                                            <p className="text-slate-400 text-xs mt-0.5">
                                                {t("Joined", "انضم في")}: {user?.created_at ? new Date(user.created_at).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US') : '-'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-end shrink-0">
                                        <span className="px-3 py-1 rounded-xl bg-white/[0.04] border border-white/[0.08] text-cyan-400 text-xs font-bold uppercase">
                                            {plan}
                                        </span>
                                    </div>
                                </div>

                                {plan === 'ultra' && (
                                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <Crown className="w-5 h-5 text-amber-400 shrink-0" />
                                            <div>
                                                <p className="text-xs font-bold text-white">{t("ULTRA VIP Plan Active", "عضوية ULTRA مفعّلة بالكامل")}</p>
                                                <p className="text-[11px] text-slate-400">{t("All 8 features active.", "جميع المميزات المتقدمة متاحة.")}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => triggerCelebration({ force: true })}
                                            className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white text-xs font-semibold transition-all"
                                        >
                                            {t("Showcase", "استعراض المميزات")}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Basic Profile Form */}
                            <div className="p-5 sm:p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl space-y-4">
                                <div>
                                    <h3 className="text-base font-bold text-white">{t("Basic Profile", "الملف الأساسي")}</h3>
                                    <p className="text-slate-400 text-xs mt-1">
                                        {t("Personalizes scan results and medical context.", "يُستخدم لتخصيص نتائج الفحص والتحليل الطبي.")}
                                    </p>
                                </div>

                                <form onSubmit={saveBasicProfile} className="space-y-4 pt-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        <div>
                                            <label className="text-xs font-medium text-slate-400 mb-1 block">{t("Username", "اسم المستخدم")}</label>
                                            <input
                                                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white/20 transition-all"
                                                value={basicProfile.username}
                                                onChange={(e) => setBasicProfile({ ...basicProfile, username: e.target.value })}
                                                placeholder="mohamed123"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-medium text-slate-400 mb-1 block">{t("Age", "العمر")}</label>
                                            <input
                                                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white/20 transition-all"
                                                type="number"
                                                value={basicProfile.age}
                                                onChange={(e) => setBasicProfile({ ...basicProfile, age: e.target.value })}
                                                placeholder="25"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-medium text-slate-400 mb-1 block">{t("Gender", "الجنس")}</label>
                                            <select
                                                className="w-full bg-q-surface border border-white/[0.06] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white/20 transition-all"
                                                value={basicProfile.gender}
                                                onChange={(e) => setBasicProfile({ ...basicProfile, gender: e.target.value })}
                                            >
                                                <option value="">{t("Select...", "اختر...")}</option>
                                                <option value="male">{t("Male", "ذكر")}</option>
                                                <option value="female">{t("Female", "أنثى")}</option>
                                                <option value="other">{t("Other", "آخر")}</option>
                                            </select>
                                        </div>

                                        <SmartHeightInput
                                            label={t("Height", "الطول")}
                                            value={basicProfile.heightCm}
                                            onChange={(val) => setBasicProfile({ ...basicProfile, heightCm: val })}
                                            isArabic={isArabic}
                                        />

                                        <SmartWeightInput
                                            label={t("Weight", "الوزن")}
                                            value={basicProfile.weightKg}
                                            onChange={(val) => setBasicProfile({ ...basicProfile, weightKg: val })}
                                            isArabic={isArabic}
                                        />
                                    </div>

                                    {basicSavedMsg && (
                                        <p className={cn("text-xs font-semibold", basicSavedMsg.includes("Saved") || basicSavedMsg.includes("نجاح") ? "text-emerald-400" : "text-rose-400")}>
                                            {basicSavedMsg}
                                        </p>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={basicSaving}
                                        className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.12] text-white font-semibold text-xs transition-all disabled:opacity-50"
                                    >
                                        {basicSaving ? t("Saving...", "جارٍ الحفظ...") : t("Save Profile", "حفظ التغييرات")}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* CREDITS TAB */}
                    {activeTab === 'credits' && (
                        <div className="space-y-6">
                            <div className="p-5 sm:p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl space-y-6">
                                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1">{t("Available Credits", "الرصيد المتاح")}</p>
                                        <p className="text-3xl sm:text-4xl font-bold text-white">
                                            {credits} <span className="text-sm font-normal text-slate-400">{t("credits", "رصيد")}</span>
                                        </p>
                                    </div>
                                    <Link href="/pricing">
                                        <button className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors">
                                            {t("Manage Plan", "ترقية / إدارة الباقة")}
                                        </button>
                                    </Link>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("Redeem Voucher", "شحن كود القسيمة")}</h3>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={redeemCode}
                                            onChange={(e) => setRedeemCode(e.target.value)}
                                            placeholder={t("Voucher code...", "أدخل كود القسيمة...")}
                                            className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3.5 py-2.5 text-sm text-white w-full focus:outline-none focus:border-white/20 transition-all"
                                        />
                                        <button
                                            onClick={handleRedeem}
                                            disabled={redeemLoading || !redeemCode}
                                            className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.12] text-white font-semibold text-xs transition-all disabled:opacity-50 shrink-0"
                                        >
                                            {redeemLoading ? "..." : t("Redeem", "شحن")}
                                        </button>
                                    </div>
                                    {redeemMsg && (
                                        <p className={cn("text-xs font-semibold mt-1", redeemMsg.includes("Success") || redeemMsg.includes("نجاح") ? "text-emerald-400" : "text-rose-400")}>
                                            {redeemMsg}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="p-5 sm:p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-cyan-400" />
                                        <span>{t("Transaction History", "سجل المعاملات")}</span>
                                    </h3>
                                    <button onClick={fetchTransactions} className="text-xs text-slate-400 hover:text-white transition-colors">
                                        {t("Refresh", "تحديث")}
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-start">
                                        <thead className="text-slate-400 uppercase border-b border-white/[0.06]">
                                            <tr>
                                                <th className="py-2.5 text-start font-semibold">{t("Date", "التاريخ")}</th>
                                                <th className="py-2.5 text-start font-semibold">{t("Activity", "المعاملة")}</th>
                                                <th className="py-2.5 text-end font-semibold">{t("Amount", "المبلغ")}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/[0.04]">
                                            {transactions.length === 0 ? (
                                                <tr>
                                                    <td colSpan={3} className="py-6 text-center text-slate-500">
                                                        {t("No transactions yet.", "لا توجد معاملات.")}
                                                    </td>
                                                </tr>
                                            ) : (
                                                transactions.map((tx) => (
                                                    <tr key={tx.id}>
                                                        <td className="py-2.5 text-slate-400">
                                                            {new Date(tx.created_at).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US')}
                                                        </td>
                                                        <td className="py-2.5 text-white capitalize">
                                                            {tx.reason?.replace(/_/g, ' ') || 'Credit'}
                                                        </td>
                                                        <td className={cn("py-2.5 text-end font-bold", tx.delta > 0 ? "text-emerald-400" : "text-slate-400")}>
                                                            {tx.delta > 0 ? '+' : ''}{tx.delta}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ADVANCED SETTINGS TAB */}
                    {activeTab === 'settings' && (
                        <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl divide-y divide-white/[0.06]">

                            {/* Section Header */}
                            <div className="px-5 py-4 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                    <Settings className="w-4 h-4 text-white/60" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">{t("Advanced Settings", "الإعدادات المتقدمة")}</p>
                                    <p className="text-[11px] text-white/35">{t("Security & AI preferences", "الأمان وتفضيلات الذكاء الاصطناعي")}</p>
                                </div>
                            </div>

                            {/* Language Row */}
                            <div className="px-5 py-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/[0.07] flex items-center justify-center shrink-0">
                                            <Smartphone className="w-4 h-4 text-white/50" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{t("Language", "اللغة")}</p>
                                            <p className="text-[11px] text-white/35">{t("AI results & interface", "نتائج الذكاء والواجهة")}</p>
                                        </div>
                                    </div>
                                    {isAutoDetected && (
                                        <span className="text-[10px] font-semibold text-white/40 border border-white/10 px-2 py-0.5 rounded-full">
                                            {t("Auto", "تلقائي")}
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 ms-11">
                                    <button
                                        type="button"
                                        onClick={() => setResultsLanguage("en")}
                                        className={cn(
                                            "px-3 py-2 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
                                            resultsLanguage === "en"
                                                ? "bg-white/10 border-white/20 text-white"
                                                : "bg-transparent border-white/[0.07] text-white/40 hover:text-white/60 hover:border-white/15"
                                        )}
                                    >
                                        {resultsLanguage === "en" && <Check className="w-3 h-3" />}
                                        English
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setResultsLanguage("ar")}
                                        className={cn(
                                            "px-3 py-2 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
                                            resultsLanguage === "ar"
                                                ? "bg-white/10 border-white/20 text-white"
                                                : "bg-transparent border-white/[0.07] text-white/40 hover:text-white/60 hover:border-white/15"
                                        )}
                                    >
                                        {resultsLanguage === "ar" && <Check className="w-3 h-3" />}
                                        العربية
                                    </button>
                                </div>
                                {!isAutoDetected && (
                                    <div className="ms-11">
                                        <button
                                            type="button"
                                            onClick={resetToAutoDetect}
                                            className="text-white/35 hover:text-white/60 text-[11px] flex items-center gap-1.5 transition-colors"
                                        >
                                            <RotateCcw className="w-3 h-3" />
                                            {t("Reset to auto-detect", "إعادة التحديد التلقائي")}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Biometric Row */}
                            <div className="px-5 py-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={cn(
                                        "w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 transition-colors",
                                        requireBiometricOnScan
                                            ? "bg-cyan-500/10 border-cyan-500/20"
                                            : "bg-white/5 border-white/[0.07]"
                                    )}>
                                        <Fingerprint className={cn("w-4 h-4 transition-colors", requireBiometricOnScan ? "text-cyan-400" : "text-white/40")} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-white">{t("Biometric Lock", "قفل البصمة / Face ID")}</p>
                                        <p className="text-[11px] text-white/35 truncate">{t("Required before every scan", "مطلوب قبل كل فحص دواء")}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={requireBiometricOnScan}
                                    onClick={() => setRequireBiometricOnScan(!requireBiometricOnScan)}
                                    className={cn(
                                        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-all duration-200",
                                        requireBiometricOnScan
                                            ? "bg-cyan-500/25 border-cyan-400/30"
                                            : "bg-white/[0.05] border-white/10"
                                    )}
                                >
                                    <span className={cn(
                                        "inline-block h-5 w-5 rounded-full transition-transform duration-200",
                                        requireBiometricOnScan ? "bg-cyan-300" : "bg-white/40",
                                        isArabic
                                            ? requireBiometricOnScan ? "-translate-x-6" : "-translate-x-1"
                                            : requireBiometricOnScan ? "translate-x-6" : "translate-x-1"
                                    )} />
                                </button>
                            </div>

                            {/* VOICE OS Row */}
                            <div className="px-5 py-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={cn(
                                        "w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 transition-colors",
                                        voiceOsEnabled
                                            ? "bg-cyan-500/10 border-cyan-500/20"
                                            : "bg-white/5 border-white/[0.07]"
                                    )}>
                                        <Zap className={cn("w-4 h-4 transition-colors", voiceOsEnabled ? "text-cyan-400" : "text-white/40")} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-white">{t("VOICE OS — Auto Background Voice", "VOICE OS — المساعد الصوتي التلقائي")}</p>
                                        <p className="text-[11px] text-white/35 truncate">{t("Automatic male voice warnings and ULTRA activation speech", "سرد تلقائي بالصوت الرجالي للتحذيرات الطبية واشتراك ألترا")}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={voiceOsEnabled}
                                    onClick={() => setVoiceOsEnabled(!voiceOsEnabled)}
                                    className={cn(
                                        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-all duration-200",
                                        voiceOsEnabled
                                            ? "bg-cyan-500/25 border-cyan-400/30"
                                            : "bg-white/[0.05] border-white/10"
                                    )}
                                >
                                    <span className={cn(
                                        "inline-block h-5 w-5 rounded-full transition-transform duration-200",
                                        voiceOsEnabled ? "bg-cyan-300" : "bg-white/40",
                                        isArabic
                                            ? voiceOsEnabled ? "-translate-x-6" : "-translate-x-1"
                                            : voiceOsEnabled ? "translate-x-6" : "translate-x-1"
                                    )} />
                                </button>
                            </div>

                            {/* FDA Row */}
                            <div className="px-5 py-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={cn(
                                        "w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 transition-colors",
                                        fdaDrugsEnabled
                                            ? "bg-emerald-500/10 border-emerald-500/20"
                                            : "bg-white/5 border-white/[0.07]"
                                    )}>
                                        <Shield className={cn("w-4 h-4 transition-colors", fdaDrugsEnabled ? "text-emerald-400" : "text-white/40")} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-white">{t("FDA Verification", "التحقق عبر FDA")}</p>
                                        <p className="text-[11px] text-white/35 truncate">{t("openFDA cross-check on scans", "مطابقة الأدوية مع قواعد FDA")}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={fdaDrugsEnabled}
                                    onClick={() => setFdaDrugsEnabled(!fdaDrugsEnabled)}
                                    className={cn(
                                        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-all duration-200",
                                        fdaDrugsEnabled
                                            ? "bg-emerald-500/25 border-emerald-400/30"
                                            : "bg-white/[0.05] border-white/10"
                                    )}
                                >
                                    <span className={cn(
                                        "inline-block h-5 w-5 rounded-full transition-transform duration-200",
                                        fdaDrugsEnabled ? "bg-emerald-300" : "bg-white/40",
                                        isArabic
                                            ? fdaDrugsEnabled ? "-translate-x-6" : "-translate-x-1"
                                            : fdaDrugsEnabled ? "translate-x-6" : "translate-x-1"
                                    )} />
                                </button>
                            </div>

                        </div>
                    )}

                    {/* ESOS AI EMERGENCY SUITE (ULTRA) */}
                    {activeTab === 'esos' && (
                        <div className="relative">
                            {plan !== 'ultra' && (
                                <div className="absolute inset-0 z-10 bg-q-base/80 backdrop-blur-md flex flex-col items-center justify-center rounded-2xl border border-white/10 p-8 text-center">
                                    <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center mb-4 border border-white/10">
                                        <Lock className="w-6 h-6 text-slate-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">{t("Ultra Feature", "ميزة Ultra")}</h3>
                                    <p className="text-white/60 mb-6 max-w-sm text-sm leading-relaxed">
                                        {t(
                                            "Automate emergency medical dispatch, country-smart ambulance routing, GPS medical beacon, and fall inactivity guardian.",
                                            "تفعيل الربط التلقائي بالطوارئ، توجيه إسعاف الدولة ذكياً، بث إحداثيات وبطاقة المسعف، ومراقبة السقوط."
                                        )}
                                    </p>
                                    <Link href="/pricing">
                                        <Button variant="primary" className="bg-q-surface-2 hover:bg-q-surface-3 text-white border border-white/15 font-bold px-6">
                                            {t("Upgrade to Ultra", "الترقية إلى Ultra")}
                                        </Button>
                                    </Link>
                                </div>
                            )}

                            <div className={cn(plan !== 'ultra' && "opacity-20 pointer-events-none")}>
                                <ESOSAISection isUltra={plan === 'ultra'} t={t} isArabic={isArabic} />
                            </div>
                        </div>
                    )}

                    {/* FDA TAB (ULTRA) */}
                    {activeTab === 'fda' && (
                        <div className="relative">
                            {plan !== 'ultra' && (
                                <div className="absolute inset-0 z-10 bg-q-base/80 backdrop-blur-md flex flex-col items-center justify-center rounded-xl border border-white/10 p-8 text-center">
                                    <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-4 border border-amber-500/30">
                                        <Lock className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">{t("Ultra Feature", "ميزة Ultra")}</h3>
                                    <p className="text-white/60 mb-6 max-w-sm text-sm leading-relaxed">
                                        {t("Control FDA verification (openFDA label + NDC) to improve accuracy and ingredient dosages.", "التحكم في المطابقة الرسمية عبر هيئة الغذاء والدواء (openFDA + NDC) لزيادة الدقة وجرعات المكونات الفعالة.")}
                                    </p>
                                    <Link href="/pricing"><Button variant="primary" className="bg-amber-600 hover:bg-amber-500 font-bold">{t("Upgrade to Ultra", "الترقية إلى Ultra")}</Button></Link>
                                </div>
                            )}

                            <GlassCard className={cn("p-6", plan !== 'ultra' && "opacity-20 pointer-events-none")}>
                                <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                    <Database className="w-5 h-5 text-emerald-300" />
                                    <span>{t("FDA Drugs Verification", "التحقق من الأدوية عبر هيئة الغذاء والدواء (FDA)")}</span>
                                </h2>
                                <p className="text-white/50 text-sm leading-relaxed">
                                    {t(
                                        "When enabled, QureScan cross-checks your scan with FDA datasets (openFDA) to improve drug naming, manufacturer matching, and active-ingredient dosages.",
                                        "عند التفعيل، يقوم التطبيق بمطابقة الأدوية المفحوصة مع قواعد بيانات هيئة الغذاء والدواء العالمية لتدقيق الأسماء والشركات المُنصعة والجرعات."
                                    )}
                                </p>

                                <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
                                    <div className="min-w-0">
                                        <p className="text-white font-semibold">{t("Use FDA verification", "تفعيل المطابقة مع FDA")}</p>
                                        <p className="text-white/45 text-xs mt-1 leading-relaxed">
                                            {t("Affects new scans and the FDA sections in result cards. Might add a few seconds per scan.", "يؤثر على الفحوصات الجديدة وأقسام FDA بطاقات النتائج. قد يضيف بضع ثوانٍ للفحص.")}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={fdaDrugsEnabled}
                                        onClick={() => setFdaDrugsEnabled(!fdaDrugsEnabled)}
                                        className={cn(
                                            "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors focus:outline-none",
                                            fdaDrugsEnabled
                                                ? "bg-emerald-500/20 border-emerald-500/40"
                                                : "bg-white/5 border-white/15"
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform",
                                                isArabic
                                                    ? fdaDrugsEnabled ? "-translate-x-7" : "-translate-x-1"
                                                    : fdaDrugsEnabled ? "translate-x-7" : "translate-x-1"
                                            )}
                                        />
                                    </button>
                                </div>
                            </GlassCard>
                        </div>
                    )}

                    {/* FAMILY TAB (ULTRA) */}
                    {activeTab === 'family' && (
                        <div className="relative">
                            {plan !== 'ultra' && (
                                <div className="absolute inset-0 z-10 bg-q-base/80 backdrop-blur-md flex flex-col items-center justify-center rounded-xl border border-white/10 p-8 text-center">
                                    <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-4 border border-amber-500/30">
                                        <Lock className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">{t("Ultra Feature", "ميزة Ultra")}</h3>
                                    <p className="text-white/60 mb-6 max-w-sm text-sm leading-relaxed">
                                        {t("Family/Caregiver Mode lets you create sub-profiles (Dad, Child, Grandma…) with separate History, Memories, and Private AI Context.", "تتيح ميزة رعاية الأسرة إنشاء ملفات فرعية (الأب، الطفل، الجدة...) مع سجل وملف صحي منفصل.")}
                                    </p>
                                    <Link href="/pricing"><Button variant="primary" className="bg-amber-600 hover:bg-amber-500 font-bold">{t("Upgrade to Ultra", "الترقية إلى Ultra")}</Button></Link>
                                </div>
                            )}

                            <GlassCard className={cn("p-6", plan !== 'ultra' && "opacity-20 pointer-events-none")}>
                                <div className="flex items-start justify-between gap-4 mb-6">
                                    <div className="min-w-0">
                                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                            <Users className="w-5 h-5 text-cyan-300" />
                                            <span>{t("Family Care", "رعاية الأسرة (الحسابات الفرعية)")}</span>
                                        </h2>
                                        <p className="text-white/50 text-sm mt-1 leading-relaxed">
                                            {t("Pick an active profile for Private AI + Memories, and create new family members.", "اختر ملفاً شخصياً نشطاً للذكاء الاصطناعي الخاص والسجل الدوائي، وأضف أفراد العائلة.")}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={fetchCareProfiles}
                                        className="text-xs text-white/50 hover:text-white transition-colors"
                                        disabled={careLoading}
                                    >
                                        {t("Refresh", "تحديث")}
                                    </button>
                                </div>

                                {careMsg && (
                                    <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm">
                                        {careMsg}
                                    </div>
                                )}

                                <div className="grid gap-3">
                                    {careProfiles.map((p) => {
                                        const isSelf = user?.id === p.id || p.relationship === "self";
                                        const isActive = activeCareProfileId === p.id;
                                        return (
                                            <div key={p.id} className={cn(
                                                "flex items-center justify-between gap-3 p-4 rounded-xl border",
                                                isActive ? "bg-cyan-500/10 border-cyan-500/25" : "bg-white/5 border-white/10"
                                            )}>
                                                <div className="min-w-0">
                                                    <p className="text-white font-semibold truncate flex items-center gap-2">
                                                        <span>{p.display_name}</span>
                                                        {isActive && <span className="text-[10px] bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 px-1.5 py-0.5 rounded font-bold">{t("Active", "النشط")}</span>}
                                                    </p>
                                                    <p className="text-xs text-white/45 mt-1 truncate">
                                                        {p.relationship || (isSelf ? t("self", "حسابي") : t("family", "عائلي"))}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        className={cn("border-white/15 hover:bg-white/10", isActive ? "text-cyan-100 border-cyan-400/30" : "text-white/70")}
                                                        onClick={() => setActiveCareProfileId(p.id)}
                                                    >
                                                        {isActive ? t("Active", "النشط") : t("Use", "استخدام")}
                                                    </Button>
                                                    {!isSelf && (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-rose-500/25 text-rose-200 hover:bg-rose-500/10"
                                                            onClick={() => deleteCareProfile(p.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-6 pt-6 border-t border-white/10">
                                    <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                                        <Plus className="w-4 h-4 text-cyan-300" />
                                        <span>{t("Add family member", "إضافة فرد عائلة جديد")}</span>
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <input
                                            value={careName}
                                            onChange={(e) => setCareName(e.target.value)}
                                            placeholder={t("Name (e.g. Dad)", "الاسم (مثال: الوالد)")}
                                            className="glass-inset rounded-lg px-4 py-2 text-white w-full focus:outline-none focus:border-cyan-500/50"
                                        />
                                        <input
                                            value={careRelation}
                                            onChange={(e) => setCareRelation(e.target.value)}
                                            placeholder={t("Relationship (optional)", "صلة القرابة (اختياري)")}
                                            className="glass-inset rounded-lg px-4 py-2 text-white w-full focus:outline-none focus:border-cyan-500/50"
                                        />
                                    </div>
                                    <div className="mt-3">
                                        <Button
                                            type="button"
                                            onClick={addCareProfile}
                                            disabled={careLoading || !careName.trim()}
                                        >
                                            {careLoading ? "..." : t("Create profile", "إضافة ملف")}
                                        </Button>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
                    )}

                    {/* PRIVATE PROFILE TAB (PRO) */}
                    {activeTab === 'private' && (
                        <div className="relative">
                            {plan !== 'ultra' && (
                                <div className="absolute inset-0 z-10 bg-q-base/80 backdrop-blur-md flex flex-col items-center justify-center rounded-xl border border-white/10 p-8 text-center">
                                    <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-4 border border-amber-500/30">
                                        <Lock className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">{t("Pro Feature", "ميزة Ultra")}</h3>
                                    <p className="text-white/60 mb-6 max-w-sm text-sm leading-relaxed">
                                        {t("Private AI Profiles allow the AI to check for specific allergies and condition interactions.", "تسمح الملفات الصحية الخاصة للذكاء الاصطناعي بفحص التداخلات بناءً على الحساسية والأمراض المزمنة.")}
                                    </p>
                                    <Link href="/pricing"><Button variant="primary" className="bg-amber-600 hover:bg-amber-500 font-bold">{t("Upgrade to Ultra", "الترقية إلى Ultra")}</Button></Link>
                                </div>
                            )}

                            <GlassCard className={cn("p-6", plan !== 'ultra' && "opacity-20 pointer-events-none")}>
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="min-w-0">
                                        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-amber-400" />
                                            <span>{t("Private AI Context", "الملف الصحي الذكي الخاص")}</span>
                                        </h2>
                                        <p className="text-white/50 text-sm leading-relaxed">
                                            {t("Data stored here is used during analysis to check interactions and personalize warnings.", "تُستخدم البيانات المسجلة هنا أثناء الفحص للكشف التلقائي عن التداخلات الدوائية والتحذيرات الشخصية.")}
                                        </p>
                                    </div>

                                    {careProfiles.length > 0 && (
                                        <div className="shrink-0 min-w-[180px]">
                                            <label className="text-[11px] text-white/50 block mb-1">{t("Active profile", "الملف النشط")}</label>
                                            <select
                                                className="w-full bg-q-surface border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                                value={activeCareProfileId || ""}
                                                onChange={(e) => setActiveCareProfileId(e.target.value)}
                                            >
                                                {careProfiles.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.display_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <form onSubmit={savePrivateProfile} className="space-y-4 max-w-2xl">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-white/60 mb-1 block">{t("Age", "العمر")}</label>
                                            <div className="relative flex items-center">
                                                <input
                                                    className="w-full glass-inset rounded-xl p-2.5 pe-16 text-white"
                                                    type="number"
                                                    inputMode="numeric"
                                                    value={privateProfile.age || ''}
                                                    onChange={e => setPrivateProfile({ ...privateProfile, age: e.target.value })}
                                                    placeholder="25"
                                                    min={1}
                                                    max={120}
                                                />
                                                <div className="absolute end-2.5 flex items-center gap-1 bg-violet-500/10 border border-violet-400/25 text-violet-300 text-xs font-bold px-2.5 py-1.5 rounded-lg select-none pointer-events-none">
                                                    <span>{isArabic ? "سنة" : "yr"}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-white/60 mb-1 block">{t("Gender", "الجنس")}</label>
                                            <select className="w-full bg-q-surface border border-white/10 rounded-xl p-2.5 text-white"
                                                value={privateProfile.sex || ''} onChange={e => setPrivateProfile({ ...privateProfile, sex: e.target.value })}>
                                                <option value="">{t("Select...", "اختر...")}</option>
                                                <option value="male">{t("Male", "ذكر")}</option>
                                                <option value="female">{t("Female", "أنثى")}</option>
                                                <option value="other">{t("Other", "آخر")}</option>
                                            </select>
                                        </div>
                                        <SmartHeightInput
                                            label={t("Height", "الطول")}
                                            value={privateProfile.height || ''}
                                            onChange={val => setPrivateProfile({ ...privateProfile, height: val })}
                                            isArabic={isArabic}
                                        />

                                        <SmartWeightInput
                                            label={t("Weight", "الوزن")}
                                            value={privateProfile.weight || ''}
                                            onChange={val => setPrivateProfile({ ...privateProfile, weight: val })}
                                            isArabic={isArabic}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs text-white/60 mb-1 block">{t("Current medications", "الأدوية التي تتناولها حالياً")}</label>
                                        <textarea
                                            className="w-full glass-inset rounded-xl p-2.5 text-white h-24"
                                            placeholder={t("Separate items by comma or new line (e.g. Metformin, Warfarin...)", "افصل بين الأدوية بفصلة أو سطر جديد (مثال: ميتفورمين، فارفرين...)")}
                                            value={privateProfile.current_medications || ''}
                                            onChange={e => setPrivateProfile({ ...privateProfile, current_medications: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-white/60 mb-1 block">{t("Known Allergies", "الحساسية المعروفة")}</label>
                                        <textarea className="w-full glass-inset rounded-xl p-2.5 text-white h-20" placeholder={t("e.g. Penicillin, Peanuts", "مثال: بنسلين، مكسرات")}
                                            value={privateProfile.allergies || ''} onChange={e => setPrivateProfile({ ...privateProfile, allergies: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-white/60 mb-1 block">{t("Chronic Conditions", "الأمراض المزمنة")}</label>
                                        <textarea className="w-full glass-inset rounded-xl p-2.5 text-white h-20" placeholder={t("e.g. Diabetes, Hypertension", "مثال: السكري، ضغط الدم")}
                                            value={privateProfile.chronic_conditions || ''} onChange={e => setPrivateProfile({ ...privateProfile, chronic_conditions: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-white/60 mb-1 block">{t("Notes (optional)", "ملاحظات إضافية (اختياري)")}</label>
                                        <textarea
                                            className="w-full glass-inset rounded-xl p-2.5 text-white h-20"
                                            placeholder={t("Anything important for the AI to know (e.g. pregnancy, kidney issues...)", "أي معلومات هامة يرجي إعلام الذكاء الاصطناعي بها (مثل الحمل، كفاءة الكلى...)")}
                                            value={privateProfile.notes || ''}
                                            onChange={e => setPrivateProfile({ ...privateProfile, notes: e.target.value })}
                                        />
                                    </div>
                                    <div className="pt-4">
                                        <Button type="submit" disabled={profileSaving}>
                                            {profileSaving ? t("Saving...", "جارٍ الحفظ...") : t("Save Private Profile", "حفظ الملف الصحي الخاص")}
                                        </Button>
                                    </div>
                                </form>
                            </GlassCard>
                        </div>
                    )}

                    {/* MEMORIES TAB (PRO) */}
                    {activeTab === 'memories' && (
                        <div className="relative">
                            {plan !== 'ultra' && (
                                <div className="absolute inset-0 z-10 bg-q-base/80 backdrop-blur-md flex flex-col items-center justify-center rounded-xl border border-white/10 p-8 text-center">
                                    <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-4 border border-amber-500/30">
                                        <Activity className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">{t("Medication Memories", "سجل الأدوية المكتسب")}</h3>
                                    <p className="text-white/60 mb-6 max-w-sm text-sm leading-relaxed">
                                        {t("QureScan learns your medication history to warn you about potential interactions in future scans.", "يتعلم التطبيق تاريخ أدویتك تلقائياً للتحذير من أي تداخلات دوائية خطيرة مستقبلية.")}
                                    </p>
                                    <Link href="/pricing"><Button variant="primary" className="bg-amber-600 hover:bg-amber-500 font-bold">{t("Upgrade to Ultra", "الترقية إلى Ultra")}</Button></Link>
                                </div>
                            )}

                            <GlassCard className={cn("p-6", plan !== 'ultra' && "opacity-20 pointer-events-none")}>
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="min-w-0">
                                        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-amber-400" />
                                            <span>{t("Medication Memories", "سجل الأدوية المكتسب")}</span>
                                        </h2>
                                        <p className="text-white/50 text-sm leading-relaxed">
                                            {t("Automatically populated from your scans. Used by Cross-Interaction Guard.", "تتجمع الأدوية تلقائياً من فحوصاتك لخدمة نظام الوقاية من التداخلات الدوائية.")}
                                        </p>
                                    </div>

                                    {careProfiles.length > 0 && (
                                        <div className="shrink-0 min-w-[180px]">
                                            <label className="text-[11px] text-white/50 block mb-1">{t("Active profile", "الملف النشط")}</label>
                                            <select
                                                className="w-full bg-q-surface border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                                value={activeCareProfileId || ""}
                                                onChange={(e) => setActiveCareProfileId(e.target.value)}
                                            >
                                                {careProfiles.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.display_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                {memories.length === 0 ? (
                                    <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
                                        <p className="text-white/40">{t("No memories yet. Scan some meds!", "لا يوجد سجل أدوية مكتسب بعد. قم بفحص بعض الأدوية لإضافتها هنا!")}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {memories.map(mem => (
                                            <div key={mem.id} className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                                                <div>
                                                    <p className="font-medium text-white">{mem.display_name}</p>
                                                    <p className="text-xs text-white/40">{t("Last seen:", "آخر ظهور:")} {new Date(mem.last_seen_at).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US')}</p>
                                                </div>
                                                <button onClick={() => deleteMemory(mem.id)} className="text-rose-400/60 hover:text-rose-400 p-2">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </GlassCard>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
