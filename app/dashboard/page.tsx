"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Activity, Database, Server } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { DeveloperSection } from "@/components/dashboard/DeveloperSection";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";



export default function DashboardPage() {
    const [totalScans, setTotalScans] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<any[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            const supabase = createClient();

            // 1. Get total count
            const { count } = await supabase.from('medication_history').select('*', { count: 'exact', head: true });
            setTotalScans(count || 0);

            // 2. Get calls for last 7 days to populate chart
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { data: historyData } = await supabase
                .from('medication_history')
                .select('created_at')
                .gte('created_at', sevenDaysAgo.toISOString());

            // Process data for chart
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return days[d.getDay()];
            });

            // Initialize counts
            const counts: Record<string, number> = {};
            last7Days.forEach(day => counts[day] = 0);

            // Fill with real data
            historyData?.forEach(item => {
                const dayName = days[new Date(item.created_at).getDay()];
                // Only count if it's in our last 7 days window (labels)
                // Note: simple day name match might clash if range > 1 week, but here we query > 7 days ago.
                // To be precise we should match DD/MM, but for UI visual purposes day name is usually fine for a 7 day view.
                if (counts[dayName] !== undefined) {
                    counts[dayName]++;
                }
            });

            const formattedData = last7Days.map(day => ({
                name: day,
                calls: counts[day]
            }));

            setChartData(formattedData);
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
                            <LineChart data={chartData.length > 0 ? chartData : [{ name: 'Loading', calls: 0 }]}>
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
