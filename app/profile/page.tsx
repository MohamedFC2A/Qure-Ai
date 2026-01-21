"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { User, CreditCard, Settings, Shield, Activity, Gift, LogOut, ChevronRight, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSettings } from "@/context/SettingsContext";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const { user, plan, credits, loading: userLoading, refreshUser } = useUser();
    const { resultsLanguage, setResultsLanguage } = useSettings();
    const [activeTab, setActiveTab] = useState<'account' | 'credits' | 'settings' | 'private' | 'memories'>('account');
    const supabase = createClient();
    const router = useRouter();

    const [redeemCode, setRedeemCode] = useState("");
    const [redeemMsg, setRedeemMsg] = useState("");
    const [redeemLoading, setRedeemLoading] = useState(false);

    // Private Profile State
    const [privateProfile, setPrivateProfile] = useState<any>({});
    const [profileSaving, setProfileSaving] = useState(false);

    // Memories State
    const [memories, setMemories] = useState<any[]>([]);

    // Transactions State
    const [transactions, setTransactions] = useState<any[]>([]);

    useEffect(() => {
        if (!userLoading && !user) {
            router.push('/login');
        }
        if (user && activeTab === 'private' && plan === 'ultra') {
            fetchPrivateProfile();
        }
        if (user && activeTab === 'memories' && plan === 'ultra') {
            fetchMemories();
        }
        if (user && activeTab === 'credits') {
            fetchTransactions();
        }
    }, [user, userLoading, activeTab, plan]);

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

    const fetchPrivateProfile = async () => {
        const { data, error } = await supabase
            .from('user_private_profile')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
        if (error) {
            console.error("Error fetching private profile:", error);
            return;
        }
        if (data) setPrivateProfile(data);
    };

    const savePrivateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileSaving(true);
        const { error } = await supabase
            .from('user_private_profile')
            .upsert({ user_id: user.id, ...privateProfile, updated_at: new Date() });
        setProfileSaving(false);
        if (!error) alert("Profile saved!");
    };

    const fetchMemories = async () => {
        const { data, error } = await supabase
            .from('memories_medications')
            .select('*')
            .eq('user_id', user.id)
            .order('last_seen_at', { ascending: false });
        if (error) {
            console.error("Error fetching memories:", error);
            return;
        }
        if (data) setMemories(data);
    };

    const deleteMemory = async (id: string) => {
        await supabase.from('memories_medications').delete().eq('id', id);
        fetchMemories();
    };


    const tabs = [
        { id: 'account', label: 'Account', icon: User },
        { id: 'credits', label: 'Credits & Plans', icon: CreditCard },
        { id: 'settings', label: 'App Settings', icon: Settings },
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
                            {tab.pro && <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/50">PRO</span>}
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
                                <div className="grid grid-cols-2 gap-4">
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
                                            className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white w-full focus:outline-none focus:border-cyan-500/50"
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
                                    <div className="grid grid-cols-2 gap-3">
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
                                <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><Shield className="w-5 h-5 text-amber-400" /> Private AI Context</h2>
                                <p className="text-white/50 text-sm mb-6">Data stored here is encrypted and only used during analysis to check for interactions.</p>

                                <form onSubmit={savePrivateProfile} className="space-y-4 max-w-2xl">
                                    <div className="grid grid-cols-2 gap-4">
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
                                            </select>
                                        </div>
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
                                <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><Activity className="w-5 h-5 text-amber-400" /> Medication Memories</h2>
                                <p className="text-white/50 text-sm mb-6">Automatically populated from your scans. Used to check for drug interactions.</p>

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
