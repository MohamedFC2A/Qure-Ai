"use client";

import { cn } from "@/lib/utils";
import { Pill, Upload, History, X, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/context/UserContext";

/* ──────────────────────────────────────────────────────────
 *  MedicationSelect – picker for medication mode
 *  Allows users to select from recent scans or upload new
 * ────────────────────────────────────────────────────────── */

interface MedicationItem {
    id: string;
    drug_name: string;
    manufacturer?: string;
    created_at: string;
    analysis_json?: any;
}

interface MedicationSelectProps {
    isArabic: boolean;
    onSelect: (medication: MedicationItem | null) => void;
    selected: MedicationItem | null;
    onNavigateToScan: () => void;
}

export function MedicationSelect({ isArabic, onSelect, selected, onNavigateToScan }: MedicationSelectProps) {
    const { user } = useUser();
    const [medications, setMedications] = useState<MedicationItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const loadMedications = async () => {
            if (!user?.id) return;
            setLoading(true);
            try {
                const { data } = await supabase
                    .from("medication_history")
                    .select("id, drug_name, manufacturer, created_at, analysis_json")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false })
                    .limit(20);
                setMedications(data || []);
            } catch (e) {
                console.error("Failed to load medications:", e);
            } finally {
                setLoading(false);
            }
        };
        if (isOpen) loadMedications();
    }, [isOpen, supabase, user?.id]);

    if (selected) {
        return (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3">
                <div className="icon-badge icon-badge-emerald w-9 h-9 rounded-lg shrink-0">
                    <Pill className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{selected.drug_name}</p>
                    {selected.manufacturer && (
                        <p className="text-[10px] text-slate-500 truncate">{selected.manufacturer}</p>
                    )}
                </div>
                <button
                    onClick={() => onSelect(null)}
                    className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-500 hover:text-white transition-all"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                {/* Select from history */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all",
                        "border border-white/[0.08] hover:border-emerald-400/20 hover:bg-emerald-400/5",
                        "text-slate-400 hover:text-emerald-300"
                    )}
                >
                    <History className="w-4 h-4" />
                    {isArabic ? "اختر من السجل" : "Select from history"}
                </button>

                {/* Upload new */}
                <button
                    onClick={onNavigateToScan}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all",
                        "border border-white/[0.08] hover:border-cyan-400/20 hover:bg-cyan-400/5",
                        "text-slate-400 hover:text-cyan-300"
                    )}
                >
                    <Upload className="w-4 h-4" />
                    {isArabic ? "ارفع صورة دواء" : "Upload medication"}
                </button>
            </div>

            {/* Dropdown of medications */}
            {isOpen && (
                <div className="rounded-xl border border-white/[0.08] overflow-hidden"
                    style={{ background: "var(--q-glass-2)" }}
                >
                    {loading ? (
                        <div className="p-4 space-y-2">
                            {[1, 2, 3].map(i => <div key={i} className="h-10 skeleton rounded-lg" />)}
                        </div>
                    ) : medications.length === 0 ? (
                        <div className="p-6 text-center">
                            <Pill className="w-6 h-6 text-slate-700 mx-auto mb-2" />
                            <p className="text-xs text-slate-600">
                                {isArabic ? "لا توجد أدوية محفوظة" : "No medications saved yet"}
                            </p>
                        </div>
                    ) : (
                        <div className="max-h-48 overflow-y-auto p-1.5 space-y-1">
                            {medications.map((med) => (
                                <button
                                    key={med.id}
                                    onClick={() => {
                                        onSelect(med);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                                        "hover:bg-white/[0.05]"
                                    )}
                                >
                                    <div className="icon-badge icon-badge-emerald w-7 h-7 rounded-lg shrink-0">
                                        <Pill className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-white truncate">{med.drug_name}</p>
                                        <p className="text-[10px] text-slate-600">
                                            {new Date(med.created_at).toLocaleDateString(
                                                isArabic ? "ar-SA" : "en-US",
                                                { month: "short", day: "numeric" }
                                            )}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
