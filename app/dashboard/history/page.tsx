"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { MedicalResultCard } from "@/components/scanner/MedicalResultCard";
import { Activity, Calendar, ChevronRight, Pill, Search, Users, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";

export default function HistoryPage() {
    const supabase = createClient();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [userId, setUserId] = useState<string | null>(null);
    const [careProfiles, setCareProfiles] = useState<Array<{ id: string; display_name: string }>>([]);
    const [profileFilter, setProfileFilter] = useState<string>("all"); // "all" | profile_id

    useEffect(() => {
        const init = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setUserId(null);
                    setHistory([]);
                    return;
                }
                setUserId(user.id);

                const careRes = await supabase
                    .from("care_profiles")
                    .select("id, display_name")
                    .eq("owner_user_id", user.id);

                const rows = (careRes.data || []).map((r: any) => ({ id: String(r.id), display_name: String(r.display_name || "Me") }));
                rows.sort((a, b) => (a.id === user.id ? -1 : b.id === user.id ? 1 : a.display_name.localeCompare(b.display_name)));
                setCareProfiles(rows.length ? rows : [{ id: user.id, display_name: "Me" }]);

                const saved = typeof window !== "undefined" ? localStorage.getItem("qure_active_care_profile") : null;
                const preferred = saved && rows.some((p) => p.id === saved) ? saved : null;
                setProfileFilter(preferred || "all");
            } catch (err) {
                console.error("History init error:", err);
                setHistory([]);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, []);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!userId) return;
            setLoading(true);
            try {
                let res = await supabase
                    .from("medication_history")
                    .select("*")
                    .eq("user_id", userId)
                    .order("created_at", { ascending: false });

                if (profileFilter !== "all") {
                    res = await supabase
                        .from("medication_history")
                        .select("*")
                        .eq("user_id", userId)
                        .eq("profile_id", profileFilter)
                        .order("created_at", { ascending: false });

                    if (res.error && String(res.error.message || "").toLowerCase().includes("profile_id")) {
                        // Legacy fallback (before profile_id existed)
                        res = await supabase
                            .from("medication_history")
                            .select("*")
                            .eq("user_id", userId)
                            .order("created_at", { ascending: false });
                    }
                } else if (res.error && String(res.error.message || "").toLowerCase().includes("profile_id")) {
                    // keep legacy working
                }

                if (res.error) {
                    console.error("Error fetching history:", res.error.message, res.error.details);
                    setHistory([]);
                    return;
                }

                setHistory(res.data || []);
            } catch (err) {
                console.error("Unexpected error:", err);
                setHistory([]);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [profileFilter, supabase, userId]);

    const filteredHistory = history.filter(item =>
        item.drug_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen w-full text-white pt-24 pb-12 px-4 md:px-8">
            <div className="max-w-7xl mx-auto">

                {/* Header Section */}
                <div className="flex flex-col mb-8 gap-6">
                    <div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent font-display tracking-tight">
                            Analysis History
                        </h1>
                        <p className="text-white/50 text-base sm:text-lg">Your personal pharmaceutical database.</p>
                    </div>

                    {userId && (
                        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2 text-white/60 text-sm">
                                <Users className="w-4 h-4 text-cyan-300" />
                                <span>Profile filter</span>
                            </div>
                            <select
                                value={profileFilter}
                                onChange={(e) => setProfileFilter(e.target.value)}
                                className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-base text-white w-full sm:w-auto focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                            >
                                <option value="all">All profiles</option>
                                {careProfiles.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.display_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Redesigned Search Bar */}
                    <div className="relative w-full">
                        <div className="absolute inset-0 bg-liquid-primary/20 blur-xl opacity-0 transition-opacity duration-500 hover:opacity-100" />
                        <GlassCard className="p-0 flex items-center overflow-hidden border-white/10 focus-within:border-liquid-primary/50 transition-colors" hoverEffect={false}>
                            <div className="pl-6 text-white/40">
                                <Search className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by drug name, manufacturer, or interaction..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-transparent border-none py-4 px-4 text-base sm:text-lg text-white placeholder-white/30 focus:outline-none focus:ring-0"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="pr-6 text-white/40 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </GlassCard>
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredHistory.map((item) => (
                            <motion.div
                                key={item.id}
                                layoutId={item.id}
                                onClick={() => setSelectedItem(item)}
                                className="cursor-pointer group"
                            >
                                <GlassCard className="h-full p-6 border-white/5 hover:border-liquid-primary/30 transition-colors group-hover:bg-white/10 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-liquid-primary/0 via-transparent to-transparent group-hover:from-liquid-primary/10 transition-all duration-500" />

                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 rounded-full bg-white/5 border border-white/10 group-hover:scale-110 transition-transform">
                                            <Pill className="w-6 h-6 text-liquid-primary" />
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-xs text-white/40 font-mono flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </span>
                                            {profileFilter === "all" && (
                                                <span className="text-[10px] text-white/50 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full max-w-[160px] truncate">
                                                    {careProfiles.find((p) => p.id === String(item.profile_id || item.user_id || ""))?.display_name || "Me"}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-liquid-primary transition-colors">
                                        {item.drug_name}
                                    </h3>
                                    <p className="text-sm text-white/50 mb-4 line-clamp-2">
                                        {item.analysis_json.description}
                                    </p>

                                    <div className="flex items-center text-xs text-white/30 gap-2 mt-auto">
                                        <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md">
                                            <Activity className="w-3 h-3" />
                                            {item.analysis_json.uses?.length || 0} Uses
                                        </span>
                                        <span className="ml-auto text-liquid-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            View Details <ChevronRight className="w-3 h-3" />
                                        </span>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && filteredHistory.length === 0 && (
                    <div className="text-center py-20 text-white/30">
                        <Pill className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No medication history found.</p>
                    </div>
                )}

                {/* Detail Modal */}
                <AnimatePresence>
                    {selectedItem && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md"
                            onClick={() => setSelectedItem(null)}
                        >
                            <motion.div
                                layoutId={selectedItem.id}
                                className="w-full max-w-4xl max-h-full overflow-y-auto rounded-3xl relative no-scrollbar"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="absolute top-6 right-6 z-50 p-2 rounded-full bg-black/50 hover:bg-white/20 text-white transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                                <MedicalResultCard data={selectedItem.analysis_json} />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}
