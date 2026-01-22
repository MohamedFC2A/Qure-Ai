"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { User, Users, CreditCard, Settings, Shield, Activity, Gift, LogOut, ChevronRight, Lock, Database, Trash2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSettings } from "@/context/SettingsContext";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const { user, profile, plan, credits, loading: userLoading, refreshUser } = useUser();
    const { resultsLanguage, setResultsLanguage, fdaDrugsEnabled, setFdaDrugsEnabled } = useSettings();
    const [activeTab, setActiveTab] = useState<'account' | 'credits' | 'settings' | 'fda' | 'family' | 'private' | 'memories'>('account');
    const supabase = createClient();
    const router = useRouter();

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

    const fetchTransactions = async () => {
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
                body: JSON.stringify({ code: redeemCode })
            });
            const data = await res.json();
            if (res.ok) {
                setRedeemMsg(data.message);
                setRedeemCode("");
                await refreshUser(); // Update global context
            } else {
                setRedeemMsg(data.error);
            }
        } catch (e) {
            setRedeemMsg("Error redeeming code");
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
            setBasicSavedMsg(error.message || "Failed to save profile.");
            return;
        }

        setBasicSavedMsg("Saved!");
        await refreshUser();
    };

    const fetchCareProfiles = async () => {
        if (!user) return;
        setCareLoading(true);
        setCareMsg(null);
        try {
            const res = await supabase
                .from('care_profiles')
                .select('id, display_name, relationship, created_at')
                .eq('owner_user_id', user.id)
                .order('created_at', { ascending: true });

            if (res.error) {
                // If DB isn't migrated yet, fall back to "self" only.
                setCareProfiles([{ id: user.id, display_name: String(user.email || "Me"), relationship: "self" }]);
                setActiveCareProfileId(user.id);
                return;
            }

            const rows = (res.data || []).map((r: any) => ({
                id: String(r.id),
                display_name: String(r.display_name || "Me"),
                relationship: r.relationship ?? null,
            }));

            rows.sort((a, b) => {
                const aSelf = a.id === user.id || a.relationship === "self";
                const bSelf = b.id === user.id || b.relationship === "self";
                if (aSelf && !bSelf) return -1;
                if (!aSelf && bSelf) return 1;
                return a.display_name.localeCompare(b.display_name);
            });

            setCareProfiles(rows.length ? rows : [{ id: user.id, display_name: String(user.email || "Me"), relationship: "self" }]);

            const saved = typeof window !== "undefined" ? localStorage.getItem("qure_active_care_profile") : null;
            const preferred = saved && rows.some((p) => p.id === saved) ? saved : null;
            const next = preferred || activeCareProfileId || user.id;
            const valid = rows.some((p) => p.id === next) ? next : (rows[0]?.id || user.id);
            setActiveCareProfileId(valid);
        } finally {
            setCareLoading(false);
        }
    };

    useEffect(() => {
        if (!activeCareProfileId) return;
        try {
            localStorage.setItem("qure_active_care_profile", activeCareProfileId);
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
                setCareMsg(res.error.message || "Failed to add profile.");
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
                setCareMsg(error.message || "Failed to delete profile.");
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
            // Legacy fallback (before Family Mode)
            const legacy = await supabase
                .from('user_private_profile')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();
            row = legacy.data || row;
        }

        if (res.error && !String(res.error.message || "").toLowerCase().includes("care_private_profiles")) {
            console.error("Error fetching private profile:", res.error);
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
        if (!error) alert("Profile saved!");
        if (!error) fetchPrivateProfile(pid);
    };

    const fetchMemories = async (profileId: string) => {
        if (!user) return;
        const pid = String(profileId || "").trim() || user.id;

        let res = await supabase
            .from('memories_medications')
            .select('*')
            .eq('user_id', user.id)
            .eq('profile_id', pid)
            .order('last_seen_at', { ascending: false });

        if (res.error && String(res.error.message || "").toLowerCase().includes("profile_id")) {
            // Legacy fallback (before profile_id existed)
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
        { id: 'account', label: 'Account', icon: User },
        { id: 'credits', label: 'Credits & Plans', icon: CreditCard },
        { id: 'settings', label: 'App Settings', icon: Settings },
        { id: 'fda', label: 'FDA Drugs', icon: Database, pro: true, beta: true },
        { id: 'family', label: 'Family Care', icon: Users, pro: true },
        { id: 'private', label: 'Private AI Profile', icon: Shield, pro: true },
        { id: 'memories', label: 'Medication Memories', icon: Activity, pro: true },
    ];

    if (userLoading) return <div className="min-h-screen pt-24 flex justify-center"><div className="animate-spin w-8 h-8 border-2 border-cyan-500 rounded-full border-t-transparent" /></div>;

    return (
        <main className="min-h-screen pt-24 pb-12 px-4 sm:px-6 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">My Profile</h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sidebar Navigation */}
                <GlassCard className="p-4 md:col-span-1 h-fit flex flex-col gap-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left",
                                activeTab === tab.id
                                    ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/30"
                                    : "text-white/60 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <tab.icon className={cn("w-4 h-4", tab.pro && plan !== 'ultra' ? "text-white/30" : "text-cyan-400")} />
                            <span className="flex-1">{tab.label}</span>
                            {(tab as any).beta && <span className="text-[10px] bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 rounded text-amber-300">BETA</span>}
                            {tab.pro && <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/50">ULTRA</span>}
                        </button>
                    ))}

                    <div className="h-px bg-white/10 my-2" />

                    <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </GlassCard>

                {/* Main Content Area */}
                <div className="md:col-span-3">

                    {/* ACCOUNT TAB */}
                    {activeTab === 'account' && (
                        <div className="space-y-6">
                            <GlassCard className="p-6">
                                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><User className="w-5 h-5 text-cyan-400" /> Account Info</h2>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">
                                        {user?.user_metadata?.avatar_url ? (
                                            <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" />
                                        ) : <User className="w-8 h-8 text-white/50" />}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{user?.email}</p>
                                        <p className="text-white/40 text-sm">Joined {new Date(user?.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                                        <label className="text-xs text-white/40">Current Plan</label>
                                        <p className="text-lg font-bold text-white uppercase">{plan}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                                        <label className="text-xs text-white/40">User ID</label>
                                        <p className="text-xs font-mono text-white/60 truncate">{user?.id}</p>
                                    </div>
                                </div>
                            </GlassCard>

                            <GlassCard className="p-6">
                                <h3 className="text-lg font-bold text-white mb-2">Basic Profile</h3>
                                <p className="text-white/50 text-sm mb-6">
                                    Saved for all users. Used to personalize results and auto-fill your Private AI Profile when you upgrade.
                                </p>

                                <form onSubmit={saveBasicProfile} className="space-y-4 max-w-2xl">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-white/60 mb-1 block">Username</label>
                                            <input
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-base text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                                                value={basicProfile.username}
                                                onChange={(e) => setBasicProfile({ ...basicProfile, username: e.target.value })}
                                                placeholder="e.g. Alien_X"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs text-white/60 mb-1 block">Age</label>
                                            <input
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-base text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                                                type="number"
                                                inputMode="numeric"
                                                value={basicProfile.age}
                                                onChange={(e) => setBasicProfile({ ...basicProfile, age: e.target.value })}
                                                placeholder="25"
                                                min={1}
                                                max={120}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs text-white/60 mb-1 block">Gender</label>
                                            <select
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-base text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                                                value={basicProfile.gender}
                                                onChange={(e) => setBasicProfile({ ...basicProfile, gender: e.target.value })}
                                            >
                                                <option value="">Select...</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-xs text-white/60 mb-1 block">Height (cm)</label>
                                            <input
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-base text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                                                type="number"
                                                inputMode="numeric"
                                                value={basicProfile.heightCm}
                                                onChange={(e) => setBasicProfile({ ...basicProfile, heightCm: e.target.value })}
                                                placeholder="180"
                                                min={50}
                                                max={250}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs text-white/60 mb-1 block">Weight (kg)</label>
                                            <input
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-base text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                                                type="number"
                                                inputMode="decimal"
                                                value={basicProfile.weightKg}
                                                onChange={(e) => setBasicProfile({ ...basicProfile, weightKg: e.target.value })}
                                                placeholder="75"
                                                min={10}
                                                max={500}
                                                step="0.1"
                                            />
                                        </div>
                                    </div>

                                    {basicSavedMsg && (
                                        <p className={cn("text-sm", basicSavedMsg === "Saved!" ? "text-green-400" : "text-red-400")}>
                                            {basicSavedMsg}
                                        </p>
                                    )}

                                    <div className="pt-2">
                                        <Button type="submit" disabled={basicSaving}>
                                            {basicSaving ? "Saving..." : "Save Basic Profile"}
                                        </Button>
                                    </div>
                                </form>
                            </GlassCard>
                        </div>
                    )}

                    {/* CREDITS TAB */}
                    {activeTab === 'credits' && (
                        <div className="space-y-6">
                            <GlassCard className="p-6">
                                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><CreditCard className="w-5 h-5 text-cyan-400" /> Credits & Usage</h2>

                                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-gradient-to-br from-cyan-900/40 to-blue-900/40 p-6 rounded-xl border border-cyan-500/20 mb-8">
                                    <div>
                                        <p className="text-sm text-cyan-200 mb-1">Available Balance</p>
                                        <p className="text-4xl font-bold text-white text-shadow-glow">{credits} <span className="text-lg text-white/50 font-normal">credits</span></p>
                                    </div>
                                    <Link href="/pricing">
                                        <Button className="bg-white text-cyan-900 hover:bg-cyan-50 font-bold border-none shadow-lg shadow-black/20">
                                            Manage Plan
                                        </Button>
                                    </Link>
                                </div>

                                <div className="max-w-md mx-auto sm:mx-0">
                                    <h3 className="font-medium text-white mb-3 flex items-center gap-2"><Gift className="w-4 h-4 text-purple-400" /> Redeem Voucher</h3>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={redeemCode}
                                            onChange={(e) => setRedeemCode(e.target.value)}
                                            placeholder="Enter voucher code (e.g. 01272...)"
                                            className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-base text-white w-full focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                                        />
                                        <Button onClick={handleRedeem} disabled={redeemLoading || !redeemCode} className="min-w-[100px]">
                                            {redeemLoading ? "..." : "Redeem"}
                                        </Button>
                                    </div>
                                    {redeemMsg && (
                                        <p className={cn("text-sm", redeemMsg.includes("Success") ? "text-green-400" : "text-red-400")}>{redeemMsg}</p>
                                    )}
                                </div>
                            </GlassCard>

                            <GlassCard className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-white flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-cyan-400" /> Transaction History
                                    </h3>
                                    <button
                                        onClick={fetchTransactions}
                                        className="text-xs text-white/40 hover:text-white transition-colors"
                                    >
                                        Refresh
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-white/40 uppercase bg-white/5">
                                            <tr>
                                                <th className="px-4 py-3 rounded-l-lg">Date</th>
                                                <th className="px-4 py-3">Activity</th>
                                                <th className="px-4 py-3 text-right rounded-r-lg">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {transactions.length === 0 ? (
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-8 text-center text-white/30">
                                                        No transactions found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                transactions.map((tx) => (
                                                    <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                                                        <td className="px-4 py-3 text-white/70">
                                                            {new Date(tx.created_at).toLocaleDateString()} <span className="text-white/30 text-xs">{new Date(tx.created_at).toLocaleTimeString()}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-white capitalize">
                                                            {tx.reason?.replace(/_/g, ' ') || 'Unknown'}
                                                            {tx.metadata?.code && <span className="ml-2 text-xs font-mono bg-white/10 px-1 rounded text-white/50">{tx.metadata.code}</span>}
                                                            {tx.metadata?.plan && <span className="ml-2 text-xs bg-cyan-500/10 text-cyan-400 px-1 rounded">{tx.metadata.plan}</span>}
                                                        </td>
                                                        <td className={cn("px-4 py-3 text-right font-medium", tx.delta > 0 ? "text-green-400" : "text-white/60")}>
                                                            {tx.delta > 0 ? '+' : ''}{tx.delta}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </GlassCard>
                        </div>
                    )}

                    {/* SETTINGS TAB */}
                    {activeTab === 'settings' && (
                        <GlassCard className="p-6">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Settings className="w-5 h-5 text-cyan-400" /> Settings</h2>

                            <div className="space-y-6 max-w-lg">
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-3">AI Results Language</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setResultsLanguage("en")}
                                            className={cn(
                                                "px-4 py-3 rounded-lg border text-sm transition-all",
                                                resultsLanguage === "en"
                                                    ? "bg-cyan-500/20 border-cyan-500/50 text-white"
                                                    : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"
                                            )}
                                        >
                                            English
                                        </button>
                                        <button
                                            onClick={() => setResultsLanguage("ar")}
                                            className={cn(
                                                "px-4 py-3 rounded-lg border text-sm transition-all",
                                                resultsLanguage === "ar"
                                                    ? "bg-cyan-500/20 border-cyan-500/50 text-white"
                                                    : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"
                                            )}
                                        >
                                            العربية (Arabic)
                                        </button>
                                    </div>
                                    <p className="text-xs text-white/40 mt-2">Choose the language for your medication analysis results.</p>
                                </div>
                            </div>
                        </GlassCard>
                    )}

                    {/* FDA TAB (ULTRA) */}
                    {activeTab === 'fda' && (
                        <div className="relative">
                            {plan !== 'ultra' && (
                                <div className="absolute inset-0 z-10 backdrop-blur-sm bg-black/50 flex flex-col items-center justify-center rounded-xl border border-white/10 p-8 text-center">
                                    <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
                                        <Lock className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Ultra Feature</h3>
                                    <p className="text-white/60 mb-6 max-w-sm">
                                        Control FDA verification (openFDA label + NDC) to improve accuracy and ingredient dosages.
                                    </p>
                                    <Link href="/pricing"><Button variant="primary" className="bg-amber-600 hover:bg-amber-500">Upgrade to Ultra</Button></Link>
                                </div>
                            )}

                            <GlassCard className={cn("p-6", plan !== 'ultra' && "opacity-20 pointer-events-none")}>
                                <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                    <Database className="w-5 h-5 text-emerald-300" /> FDA Drugs Verification
                                </h2>
                                <p className="text-white/50 text-sm">
                                    When enabled, QURE cross-checks your scan with FDA datasets (openFDA) to improve drug naming, manufacturer matching, and active-ingredient dosages.
                                </p>

                                <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
                                    <div className="min-w-0">
                                        <p className="text-white font-semibold">Use FDA verification</p>
                                        <p className="text-white/45 text-xs mt-1 leading-relaxed">
                                            Affects new scans and the FDA sections in result cards. Might add a few seconds per scan.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={fdaDrugsEnabled}
                                        onClick={() => setFdaDrugsEnabled(!fdaDrugsEnabled)}
                                        className={cn(
                                            "relative inline-flex h-8 w-14 items-center rounded-full border transition-colors",
                                            fdaDrugsEnabled
                                                ? "bg-emerald-500/20 border-emerald-500/30"
                                                : "bg-white/5 border-white/15"
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform",
                                                fdaDrugsEnabled ? "translate-x-7" : "translate-x-1"
                                            )}
                                        />
                                    </button>
                                </div>

                                <div className="mt-4 text-xs text-white/40">
                                    Docs:{" "}
                                    <a className="text-white/70 hover:underline" href="https://open.fda.gov/apis/drug/" target="_blank" rel="noreferrer">
                                        open.fda.gov
                                    </a>
                                </div>
                            </GlassCard>
                        </div>
                    )}

                    {/* FAMILY TAB (ULTRA) */}
                    {activeTab === 'family' && (
                        <div className="relative">
                            {plan !== 'ultra' && (
                                <div className="absolute inset-0 z-10 backdrop-blur-sm bg-black/50 flex flex-col items-center justify-center rounded-xl border border-white/10 p-8 text-center">
                                    <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
                                        <Lock className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Ultra Feature</h3>
                                    <p className="text-white/60 mb-6 max-w-sm">
                                        Family/Caregiver Mode lets you create sub-profiles (Dad, Child, Grandma…) with separate History, Memories, and Private AI Context.
                                    </p>
                                    <Link href="/pricing"><Button variant="primary" className="bg-amber-600 hover:bg-amber-500">Upgrade to Ultra</Button></Link>
                                </div>
                            )}

                            <GlassCard className={cn("p-6", plan !== 'ultra' && "opacity-20 pointer-events-none")}>
                                <div className="flex items-start justify-between gap-4 mb-6">
                                    <div className="min-w-0">
                                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                            <Users className="w-5 h-5 text-cyan-300" /> Family Care
                                        </h2>
                                        <p className="text-white/50 text-sm mt-1">
                                            Pick an active profile for Private AI + Memories, and create new family members.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={fetchCareProfiles}
                                        className="text-xs text-white/50 hover:text-white transition-colors"
                                        disabled={careLoading}
                                    >
                                        Refresh
                                    </button>
                                </div>

                                {careMsg && (
                                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
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
                                                    <p className="text-white font-semibold truncate">{p.display_name}</p>
                                                    <p className="text-xs text-white/45 mt-1 truncate">
                                                        {p.relationship || (isSelf ? "self" : "family")}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        className={cn("border-white/15 hover:bg-white/10", isActive ? "text-cyan-100" : "text-white/70")}
                                                        onClick={() => setActiveCareProfileId(p.id)}
                                                    >
                                                        {isActive ? "Active" : "Use"}
                                                    </Button>
                                                    {!isSelf && (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-red-500/25 text-red-200 hover:bg-red-500/10"
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
                                        <Plus className="w-4 h-4 text-cyan-300" /> Add family member
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <input
                                            value={careName}
                                            onChange={(e) => setCareName(e.target.value)}
                                            placeholder="Name (e.g. Dad)"
                                            className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white w-full focus:outline-none focus:border-cyan-500/50"
                                        />
                                        <input
                                            value={careRelation}
                                            onChange={(e) => setCareRelation(e.target.value)}
                                            placeholder="Relationship (optional)"
                                            className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white w-full focus:outline-none focus:border-cyan-500/50"
                                        />
                                    </div>
                                    <div className="mt-3">
                                        <Button
                                            type="button"
                                            onClick={addCareProfile}
                                            disabled={careLoading || !careName.trim()}
                                        >
                                            {careLoading ? "..." : "Create profile"}
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
                                <div className="absolute inset-0 z-10 backdrop-blur-sm bg-black/50 flex flex-col items-center justify-center rounded-xl border border-white/10 p-8 text-center">
                                    <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
                                        <Lock className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Pro Feature</h3>
                                    <p className="text-white/60 mb-6 max-w-sm">Private AI Profiles allow the AI to check for specific allergies and condition interactions.</p>
                                    <Link href="/pricing"><Button variant="primary" className="bg-amber-600 hover:bg-amber-500">Upgrade to Ultra</Button></Link>
                                </div>
                            )}

                            <GlassCard className={cn("p-6", plan !== 'ultra' && "opacity-20 pointer-events-none")}>
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="min-w-0">
                                        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-amber-400" /> Private AI Context
                                        </h2>
                                        <p className="text-white/50 text-sm">
                                            Data stored here is used during analysis to check interactions and personalize warnings.
                                        </p>
                                    </div>

                                    {careProfiles.length > 0 && (
                                        <div className="shrink-0 min-w-[180px]">
                                            <label className="text-[11px] text-white/50 block mb-1">Active profile</label>
                                            <select
                                                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
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
                                            <label className="text-xs text-white/60 mb-1 block">Age</label>
                                            <input className="w-full bg-black/20 border border-white/10 rounded p-2 text-white" type="number"
                                                value={privateProfile.age || ''} onChange={e => setPrivateProfile({ ...privateProfile, age: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-white/60 mb-1 block">Sex</label>
                                            <select className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                                value={privateProfile.sex || ''} onChange={e => setPrivateProfile({ ...privateProfile, sex: e.target.value })}>
                                                <option value="">Select...</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-white/60 mb-1 block">Height</label>
                                            <input
                                                className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                                placeholder="e.g. 180 cm"
                                                value={privateProfile.height || ''}
                                                onChange={e => setPrivateProfile({ ...privateProfile, height: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-white/60 mb-1 block">Weight</label>
                                            <input className="w-full bg-black/20 border border-white/10 rounded p-2 text-white" placeholder="e.g. 75 kg"
                                                value={privateProfile.weight || ''} onChange={e => setPrivateProfile({ ...privateProfile, weight: e.target.value })} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-white/60 mb-1 block">Current medications</label>
                                        <textarea
                                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-white h-24"
                                            placeholder="Separate items by comma or new line (e.g. Metformin, Warfarin...)"
                                            value={privateProfile.current_medications || ''}
                                            onChange={e => setPrivateProfile({ ...privateProfile, current_medications: e.target.value })}
                                        />
                                        <p className="text-[11px] text-white/35 mt-1">Used by Cross-Interaction Guard during scans.</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-white/60 mb-1 block">Known Allergies</label>
                                        <textarea className="w-full bg-black/20 border border-white/10 rounded p-2 text-white h-20" placeholder="e.g. Penicillin, Peanuts"
                                            value={privateProfile.allergies || ''} onChange={e => setPrivateProfile({ ...privateProfile, allergies: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-white/60 mb-1 block">Chronic Conditions</label>
                                        <textarea className="w-full bg-black/20 border border-white/10 rounded p-2 text-white h-20" placeholder="e.g. Diabetes, Hypertension"
                                            value={privateProfile.chronic_conditions || ''} onChange={e => setPrivateProfile({ ...privateProfile, chronic_conditions: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-white/60 mb-1 block">Notes (optional)</label>
                                        <textarea
                                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-white h-20"
                                            placeholder="Anything important for the AI to know (e.g. pregnancy, kidney issues...)"
                                            value={privateProfile.notes || ''}
                                            onChange={e => setPrivateProfile({ ...privateProfile, notes: e.target.value })}
                                        />
                                    </div>
                                    <div className="pt-4">
                                        <Button type="submit" disabled={profileSaving}>
                                            {profileSaving ? "Saving..." : "Save Private Profile"}
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
                                <div className="absolute inset-0 z-10 backdrop-blur-sm bg-black/50 flex flex-col items-center justify-center rounded-xl border border-white/10 p-8 text-center">
                                    <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
                                        <Activity className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Medication Memories</h3>
                                    <p className="text-white/60 mb-6 max-w-sm">Qure Ai learns your medication history to warn you about potential interactions in future scans.</p>
                                    <Link href="/pricing"><Button variant="primary" className="bg-amber-600 hover:bg-amber-500">Upgrade to Ultra</Button></Link>
                                </div>
                            )}

                            <GlassCard className={cn("p-6", plan !== 'ultra' && "opacity-20 pointer-events-none")}>
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="min-w-0">
                                        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-amber-400" /> Medication Memories
                                        </h2>
                                        <p className="text-white/50 text-sm">
                                            Automatically populated from your scans. Used by Cross-Interaction Guard.
                                        </p>
                                    </div>

                                    {careProfiles.length > 0 && (
                                        <div className="shrink-0 min-w-[180px]">
                                            <label className="text-[11px] text-white/50 block mb-1">Active profile</label>
                                            <select
                                                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
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
                                    <div className="text-center py-12 border border-dashed border-white/10 rounded-lg">
                                        <p className="text-white/40">No memories yet. Scan some meds!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {memories.map(mem => (
                                            <div key={mem.id} className="flex items-center justify-between bg-white/5 p-4 rounded-lg border border-white/5">
                                                <div>
                                                    <p className="font-medium text-white">{mem.display_name}</p>
                                                    <p className="text-xs text-white/40">Last seen: {new Date(mem.last_seen_at).toLocaleDateString()}</p>
                                                </div>
                                                <button onClick={() => deleteMemory(mem.id)} className="text-red-400/50 hover:text-red-400 p-2">
                                                    <LogOut className="w-4 h-4" />
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
