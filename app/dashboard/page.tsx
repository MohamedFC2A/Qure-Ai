"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { DeveloperSection } from "@/components/dashboard/DeveloperSection";

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
    return (
        <div className="container mx-auto px-4 py-24 max-w-7xl">
            {/* Developer API Section (New Plan V4) */}
            <DeveloperSection />

            {/* Usage Analytics (Visuals) */}
            <div className="mt-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
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
