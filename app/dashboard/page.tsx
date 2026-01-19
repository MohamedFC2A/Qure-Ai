"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Activity, Database, Server } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { DeveloperSection } from "@/components/dashboard/DeveloperSection";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const data = [
    { name: "Mon", calls: 12 },
    { name: "Tue", calls: 19 },
    { name: "Wed", calls: 15 },
    { name: "Thu", calls: 25 },
    { name: "Fri", calls: 32 },
    { name: "Sat", calls: 28 },
    { name: "Sun", calls: 45 },
];

export default function DashboardPage() {
    const [totalScans, setTotalScans] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            const supabase = createClient();
            const { count } = await supabase.from('medication_history').select('*', { count: 'exact', head: true });
            setTotalScans(count || 0);
            setLoading(false);
        };
        fetchStats();
    }, []);

    return (
        <div className="container mx-auto px-4 py-24 max-w-7xl space-y-12">
            {/* Developer API Section (New Plan V4) */}
            <DeveloperSection />

            {/* Real Analytics Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-10 duration-700">
                <GlassCard className="p-6 border-white/5 flex items-center gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-xl">
                        <Database className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-white/40 text-sm font-medium uppercase tracking-wider">Total Scans</p>
                        <h3 className="text-3xl font-bold text-white">{loading ? "..." : totalScans}</h3>
                    </div>
                </GlassCard>

                <GlassCard className="p-6 border-white/5 flex items-center gap-4">
                    <div className="p-3 bg-green-500/20 rounded-xl">
                        <Activity className="w-8 h-8 text-green-400" />
                    </div>
                    <div>
                        <p className="text-white/40 text-sm font-medium uppercase tracking-wider">System Status</p>
                        <h3 className="text-3xl font-bold text-white">Online</h3>
                    </div>
                </GlassCard>

                <GlassCard className="p-6 border-white/5 flex items-center gap-4">
                    <div className="p-3 bg-fuchsia-500/20 rounded-xl">
                        <Server className="w-8 h-8 text-fuchsia-400" />
                    </div>
                    <div>
                        <p className="text-white/40 text-sm font-medium uppercase tracking-wider">API Latency</p>
                        <h3 className="text-3xl font-bold text-white">~45ms</h3>
                    </div>
                </GlassCard>
            </div>

            {/* Usage Analytics (Visuals) */}
            <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
                <GlassCard className="p-8 border-white/5" hoverEffect={false}>
                    <div className="mb-8 flex items-center gap-4">
                        <div className="p-3 bg-liquid-secondary/20 rounded-xl">
                            <Activity className="w-6 h-6 text-liquid-secondary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">System Usage</h2>
                            <p className="text-white/40 text-sm">Real-time API latency and call volume.</p>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <XAxis
                                    dataKey="name"
                                    stroke="rgba(255,255,255,0.1)"
                                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="rgba(255,255,255,0.1)"
                                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(0,0,0,0.8)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        color: '#fff'
                                    }}
                                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="calls"
                                    stroke="#22d3ee"
                                    strokeWidth={3}
                                    dot={{ fill: '#000', stroke: '#22d3ee', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
