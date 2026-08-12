"use client";

import { cn } from "@/lib/utils";
import { Pill, Upload, History, X, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/context/UserContext";
import { getLocalScans } from "@/lib/localHistory";

/* ──────────────────────────────────────────────────────────
 *  MedicationSelect – Unified local + Supabase medication picker
 *  Always shows "Select from history" and "Upload" buttons,
 *  loads from both localStorage and Supabase seamlessly.
 * ────────────────────────────────────────────────────────── */

interface MedicationItem {
    id: string;
    drug_name: string;
    manufacturer?: string;
    created_at: string;
    analysis_json?: any;
    source?: "local" | "remote";
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

    const loadMedications = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Load from localStorage
            const localItems = getLocalScans().map((item) => ({
                id: item.id,
                drug_name: item.drug_name,
                manufacturer: item.manufacturer,
                created_at: item.created_at,
                analysis_json: item.analysis_json,
                source: "local" as const,
            }));

            // 2. Load from Supabase
            let remoteItems: MedicationItem[] = [];
            if (user?.id) {
                const { data } = await supabase
                    .from("medication_history")
                    .select("id, drug_name, manufacturer, created_at, analysis_json")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false })
                    .limit(30);
                remoteItems = (data || []).map((d: any) => ({ ...d, source: "remote" as const }));
            }

            // 3. Merge: deduplicate by drug_name + date prefix, remote takes priority
            const map = new Map<string, MedicationItem>();
            for (const item of localItems) {
                const key = `${(item.drug_name || "").toLowerCase().trim()}_${(item.created_at || "").slice(0, 10)}`;
                map.set(key, item);
            }
            for (const item of remoteItems) {
                const key = `${(item.drug_name || "").toLowerCase().trim()}_${(item.created_at || "").slice(0, 10)}`;
                map.set(key, item);
            }

            const merged = Array.from(map.values())
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 20);

            setMedications(merged);
        } catch (e) {
            console.error("Failed to load medications:", e);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (isOpen) loadMedications();
    }, [isOpen, loadMedications]);

    // When a medication is selected, show compact selected state
    if (selected) {
        return (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-2.5 animate-fade-in">
                <div className="w-7 h-7 rounded-lg bg-emerald-400/15 border border-emerald-400/25 flex items-center justify-center shrink-0">
                    <Pill className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-emerald-200 truncate">{selected.drug_name}</p>
                    <p className="text-[10px] text-slate-500">
                        {isArabic ? "السياق الدوائي نشط" : "Medication context active"}
                    </p>
                </div>
                <button
                    onClick={() => onSelect(null)}
                    className="p-1 rounded-lg hover:bg-white/[0.06] text-slate-500 hover:text-white transition-all"
                    title={isArabic ? "إزالة الدواء" : "Remove medication"}
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* Action buttons — always visible */}
            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                        "border border-white/[0.08] hover:border-emerald-400/30 hover:bg-emerald-400/5",
                        "text-slate-400 hover:text-emerald-300",
                        isOpen && "border-emerald-400/30 bg-emerald-400/5 text-emerald-300"
                    )}
                >
                    <History className="w-3.5 h-3.5 shrink-0" />
                    <span>{isArabic ? "اختر من السجل" : "Select from history"}</span>
                    {isOpen ? <ChevronUp className="w-3 h-3 ms-0.5" /> : <ChevronDown className="w-3 h-3 ms-0.5" />}
                </button>

                <button
                    onClick={onNavigateToScan}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                        "border border-white/[0.08] hover:border-cyan-400/30 hover:bg-cyan-400/5",
                        "text-slate-400 hover:text-cyan-300"
                    )}
                >
                    <Upload className="w-3.5 h-3.5 shrink-0" />
                    <span>{isArabic ? "ارفع صورة دواء" : "Upload medication"}</span>
                </button>
            </div>

            {/* Dropdown medication list */}
            {isOpen && (
                <div
                    className="rounded-xl border border-white/[0.08] overflow-hidden animate-fade-in"
                    style={{ background: "rgba(8, 15, 30, 0.95)" }}
                >
                    {loading ? (
                        <div className="p-3 space-y-1.5">
                            {[1, 2, 3].map(i => <div key={i} className="h-9 animate-pulse bg-white/5 rounded-lg" />)}
                        </div>
                    ) : medications.length === 0 ? (
                        <div className="p-5 text-center space-y-2">
                            <Pill className="w-6 h-6 text-slate-700 mx-auto" />
                            <p className="text-xs text-slate-600">
                                {isArabic ? "لا توجد أدوية محفوظة" : "No medications saved yet"}
                            </p>
                            <button
                                onClick={() => { setIsOpen(false); onNavigateToScan(); }}
                                className="text-xs text-cyan-400 hover:underline"
                            >
                                {isArabic ? "اذهب لفحص دواء" : "Scan a medication first"}
                            </button>
                        </div>
                    ) : (
                        <div className="max-h-52 overflow-y-auto p-1.5 space-y-0.5">
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
                                    <div className="w-7 h-7 rounded-lg bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center shrink-0">
                                        <Pill className="w-3.5 h-3.5 text-emerald-400" />
                                    </div>
                                    <div className="flex-1 min-w-0 text-start">
                                        <p className="text-xs font-semibold text-white truncate">{med.drug_name}</p>
                                        <p className="text-[10px] text-slate-500">
                                            {new Date(med.created_at).toLocaleDateString(
                                                isArabic ? "ar-SA" : "en-US",
                                                { month: "short", day: "numeric" }
                                            )}
                                            {med.source === "local" && (
                                                <span className="ms-1.5 text-[9px] bg-white/10 px-1 rounded">local</span>
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
