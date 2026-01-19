import { GlassCard } from "@/components/ui/GlassCard";
import { Activity, AlertTriangle, Check, Info, Pill, ShieldAlert, Thermometer, Box, FileText, CheckCircle2, AlertOctagon } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MedicalData {
    drugName: string;
    genericName?: string;
    manufacturer: string;
    description: string;
    category?: string;
    uses: string[];
    sideEffects: string[];
    dosage: string;
    storage?: string;
    contraindications?: string[];
    warnings: string[];
    interactions?: string[];
    confidenceScore?: number;
    error?: string;
}

interface MedicalResultCardProps {
    data: MedicalData;
}

export const MedicalResultCard = ({ data }: MedicalResultCardProps) => {
    if (data.error) {
        return (
            <GlassCard className="p-8 border-red-500/30 bg-red-500/10">
                <div className="flex flex-col items-center text-center gap-4">
                    <AlertTriangle className="w-12 h-12 text-red-400" />
                    <h3 className="text-xl font-bold text-white">Analysis Failed</h3>
                    <p className="text-white/60">{data.error}</p>
                </div>
            </GlassCard>
        );
    }

    return (
        <GlassCard className="w-full max-w-4xl p-0 overflow-hidden shadow-2xl shadow-liquid-primary/10" hoverEffect={false}>
            {/* Header Section */}
            <div className="relative p-8 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-liquid-primary/20 via-liquid-secondary/10 to-transparent" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-4xl font-bold text-white tracking-tight">{data.drugName}</h2>
                            {data.confidenceScore && data.confidenceScore > 80 && (
                                <span className="px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Verified Match
                                </span>
                            )}
                        </div>

                        {data.genericName && (
                            <p className="text-liquid-accent font-medium text-lg mb-1">{data.genericName}</p>
                        )}

                        <div className="flex items-center gap-4 text-white/50 text-sm mt-2">
                            <div className="flex items-center gap-1.5">
                                <Box className="w-4 h-4" />
                                <span>{data.manufacturer}</span>
                            </div>
                            {data.category && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5">
                                    <Pill className="w-3.5 h-3.5" />
                                    <span>{data.category}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="relative z-10 mt-6 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-liquid-primary mt-1 shrink-0" />
                        <p className="text-white/80 leading-relaxed text-sm">
                            {data.description}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-black/20">

                {/* Left Column: Usage & Dosage */}
                <div className="space-y-8">
                    {/* Primary Uses */}
                    <section>
                        <div className="flex items-center gap-2 mb-4 text-liquid-accent">
                            <Activity className="w-5 h-5" />
                            <h3 className="font-bold text-white text-lg">Indication & Uses</h3>
                        </div>
                        <ul className="grid gap-2">
                            {(data.uses || []).map((use, i) => (
                                <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-liquid-accent shrink-0" />
                                    <span className="text-white/80 text-sm">{use}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Dosage Information */}
                    <section>
                        <div className="flex items-center gap-2 mb-4 text-blue-400">
                            <Thermometer className="w-5 h-5" />
                            <h3 className="font-bold text-white text-lg">Standard Dosage</h3>
                        </div>
                        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-100 text-sm leading-relaxed">
                            {data.dosage || "Consult a doctor for precise dosage."}
                        </div>
                    </section>

                    {/* Storage */}
                    {data.storage && (
                        <section>
                            <div className="flex items-center gap-2 mb-2 text-white/40 text-sm uppercase tracking-wider font-bold">
                                <Box className="w-4 h-4" /> Storage
                            </div>
                            <p className="text-white/60 text-sm">{data.storage}</p>
                        </section>
                    )}
                </div>

                {/* Right Column: Safety & Warnings */}
                <div className="space-y-8">
                    {/* Critical Warnings */}
                    <section>
                        <div className="flex items-center gap-2 mb-4 text-red-400">
                            <ShieldAlert className="w-5 h-5" />
                            <h3 className="font-bold text-white text-lg">Safety Warnings</h3>
                        </div>
                        {(data.warnings && data.warnings.length > 0) ? (
                            <ul className="space-y-2">
                                {data.warnings.map((w, i) => (
                                    <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                        <span className="text-red-100/90 text-sm">{w}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-white/40 text-sm italic">No specific critical warnings listed.</p>
                        )}
                    </section>

                    {/* Interactions */}
                    {data.interactions && data.interactions.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-4 text-orange-400">
                                <AlertOctagon className="w-5 h-5" />
                                <h3 className="font-bold text-white text-lg">Drug Interactions</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {data.interactions.map((interaction, i) => (
                                    <span key={i} className="px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-200 text-xs font-medium">
                                        {interaction}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Side Effects */}
                    <section>
                        <div className="flex items-center gap-2 mb-4 text-yellow-500">
                            <Activity className="w-5 h-5" />
                            <h3 className="font-bold text-white text-lg">Common Side Effects</h3>
                        </div>
                        <div className="text-white/70 text-sm space-y-1">
                            {(data.sideEffects || []).join(" • ")}
                        </div>
                    </section>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-white/5 border-t border-white/10 flex justify-between items-center">
                <p className="text-xs text-white/30">
                    * AI Generated Analysis. Verify with a medical professional.
                </p>
                <div className="flex items-center gap-2 text-green-400 text-xs font-medium">
                    <CheckCircle2 className="w-3 h-3" /> Saved to History
                </div>
            </div>
        </GlassCard>
    );
};
