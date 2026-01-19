"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { MedicalResultCard } from "@/components/scanner/MedicalResultCard";
import { Activity, Calendar, ChevronRight, Clock, Pill, Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";

export default function HistoryPage() {
    const supabase = createClient();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // Get current user
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    setHistory([]);
                    return;
                }

                const { data, error } = await supabase
                    .from("medication_history")
                    .select("*")
                    // Explicitly filter for current user (RLS does this too, but this is safer)
                    .eq('user_id', user.id)
                    .order("created_at", { ascending: false });

                if (error) {
                    console.error("Error fetching history:", error.message, error.details);

                    if (error.message.includes("Could not find the table") || error.code === "PGRST204") {
                        setHistory([]);
                        // In a real app we might show a setup banner, but for now we'll just log clearly
                        // alert("Database Setup Required...");
                    } else {
                        setHistory([]);
                    }
                } else {
                    setHistory(data || []);
                }
            } catch (err) {
                console.error("Unexpected error:", err);
                setHistory([]);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const filteredHistory = history.filter(item =>
        item.drug_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen w-full text-white p-6 md:p-12">
            <div className="max-w-7xl mx-auto">

                {/* Header Section */}
                <div className="flex flex-col mb-8 gap-6">
                    <div>
                        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent font-display tracking-tight">
                            Analysis History
                        </h1>
                        <p className="text-white/50 text-lg">Your personal pharmaceutical database.</p>
                    </div>

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
                                className="w-full bg-transparent border-none py-4 px-4 text-white placeholder-white/30 text-lg focus:outline-none focus:ring-0"
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
                                        <span className="text-xs text-white/40 font-mono flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </span>
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
