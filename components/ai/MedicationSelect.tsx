"use client";

import { cn } from "@/lib/utils";
import { Pill, Upload, History, X, Bandage, Plus, ScanLine } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/context/UserContext";
import { getLocalScans } from "@/lib/localHistory";

/* ──────────────────────────────────────────────────────────
 *  ClinicalContextSelect – Clean Modal / Drawer for Selecting History
 *  Zero-Glow • Clean Matte Design • 44px Touch Targets • Zero Layout Shift
 * ────────────────────────────────────────────────────────── */

export interface ClinicalHistoryItem {
    id: string;
    type: "medication" | "wound";
    title: string;
    subtitle?: string;
    created_at: string;
    severity?: string;
    analysis_json?: any;
    source?: "local" | "remote";
}

interface MedicationSelectProps {
    isArabic: boolean;
    onSelect: (item: ClinicalHistoryItem | null) => void;
    selected: ClinicalHistoryItem | null;
    onNavigateToScan: () => void;
    isOpen: boolean;
    onClose: () => void;
}

export function MedicationSelectModal({ isArabic, onSelect, selected, onNavigateToScan, isOpen, onClose }: MedicationSelectProps) {
    const { user } = useUser();
    const [items, setItems] = useState<ClinicalHistoryItem[]>([]);
    const [filterTab, setFilterTab] = useState<"all" | "medication" | "wound">("all");
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const loadHistory = useCallback(async () => {
        setLoading(true);
        try {
            const unifiedList: ClinicalHistoryItem[] = [];

            // 1. Load Local Medications
            const localMeds = getLocalScans().map((item) => ({
                id: item.id,
                type: "medication" as const,
                title: item.drug_name || (isArabic ? "دواء مفحوص" : "Scanned Medication"),
                subtitle: item.manufacturer || "",
                created_at: item.created_at,
                analysis_json: item.analysis_json,
                source: "local" as const,
            }));
            unifiedList.push(...localMeds);

            // 2. Load Remote Medications & Wounds from Supabase
            if (user?.id) {
                // Fetch Medication History
                const { data: medData } = await supabase
                    .from("medication_history")
                    .select("id, drug_name, manufacturer, created_at, analysis_json")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false })
                    .limit(20);

                if (medData) {
                    const remoteMeds: ClinicalHistoryItem[] = medData.map((d: any) => ({
                        id: d.id,
                        type: "medication",
                        title: d.drug_name,
                        subtitle: d.manufacturer,
                        created_at: d.created_at,
                        analysis_json: d.analysis_json,
                        source: "remote",
                    }));
                    unifiedList.push(...remoteMeds);
                }

                // Fetch Wound Scans
                try {
                    const { data: woundData } = await supabase
                        .from("wound_scans")
                        .select("id, wound_title, wound_type, severity, created_at, analysis_json")
                        .eq("user_id", user.id)
                        .order("created_at", { ascending: false })
                        .limit(20);

                    if (woundData) {
                        const remoteWounds: ClinicalHistoryItem[] = woundData.map((w: any) => ({
                            id: w.id,
                            type: "wound",
                            title: w.wound_title || (isArabic ? "فحص جرح سريري" : "Clinical Wound Scan"),
                            subtitle: `${w.wound_type || ""} • ${w.severity || ""}`,
                            created_at: w.created_at,
                            severity: w.severity,
                            analysis_json: w.analysis_json,
                            source: "remote",
                        }));
                        unifiedList.push(...remoteWounds);
                    }
                } catch (wErr) {
                    console.warn("Could not query wound_scans:", wErr);
                }
            }

            // Deduplicate & Sort by newest date
            const map = new Map<string, ClinicalHistoryItem>();
            for (const it of unifiedList) {
                const key = `${it.type}_${it.title.toLowerCase().trim()}_${(it.created_at || "").slice(0, 10)}`;
                map.set(key, it);
            }

            const sorted = Array.from(map.values()).sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            setItems(sorted);
        } catch (e) {
            console.error("Failed to load clinical history:", e);
        } finally {
            setLoading(false);
        }
    }, [user?.id, isArabic, supabase]);

    useEffect(() => {
        if (isOpen) loadHistory();
    }, [isOpen, loadHistory]);

    if (!isOpen) return null;

    const filteredItems = items.filter((item) => {
        if (filterTab === "all") return true;
        return item.type === filterTab;
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div
                className="w-full max-w-lg rounded-2xl border border-white/10 overflow-hidden shadow-2xl bg-[#080D1A] flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
                dir={isArabic ? "rtl" : "ltr"}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06] bg-[#0C1324]/80">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                            <History className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">
                                {isArabic ? "ربط فحص من السجل السريري" : "Link Clinical Scan"}
                            </h3>
                            <p className="text-[11px] text-slate-400">
                                {isArabic ? "اختر دواء أو جرحاً مسجلاً لتخصيص الاستشارة" : "Select a scanned medication or wound to focus consultation"}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                        aria-label={isArabic ? "إغلاق" : "Close"}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Filter Tabs & New Scan Action */}
                <div className="p-3 border-b border-white/[0.06] flex items-center justify-between gap-2 flex-wrap bg-[#080D1A]">
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setFilterTab("all")}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all touch-manipulation cursor-pointer min-h-[36px]",
                                filterTab === "all" ? "bg-white text-slate-950 font-bold" : "text-slate-400 hover:text-white bg-white/[0.03]"
                            )}
                        >
                            {isArabic ? "الكل" : "All"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterTab("medication")}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 touch-manipulation cursor-pointer min-h-[36px]",
                                filterTab === "medication" ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white bg-white/[0.03]"
                            )}
                        >
                            <Pill className="w-3.5 h-3.5" />
                            <span>{isArabic ? "أدوية" : "Meds"}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterTab("wound")}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 touch-manipulation cursor-pointer min-h-[36px]",
                                filterTab === "wound" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white bg-white/[0.03]"
                            )}
                        >
                            <Bandage className="w-3.5 h-3.5" />
                            <span>{isArabic ? "جروح" : "Wounds"}</span>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            onNavigateToScan();
                        }}
                        className="min-h-[38px] flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-b from-[#22d3ee] via-[#06b6d4] to-[#10b981] text-slate-950 font-bold text-xs border-t border-white/50 border-b border-emerald-900 shadow-[0_3px_0_#047857,0_4px_10px_rgba(16,185,129,0.3)] active:translate-y-[2px] active:shadow-[0_1px_0_#047857] transition-all touch-manipulation cursor-pointer select-none"
                    >
                        <ScanLine className="w-4 h-4 text-slate-950 font-bold" />
                        <span>{isArabic ? "ابدأ فحص الدواء" : "Start Medication Scan"}</span>
                    </button>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
                    {loading ? (
                        <div className="p-4 space-y-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-12 animate-pulse bg-white/5 rounded-xl" />
                            ))}
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="py-12 text-center space-y-2 px-4">
                            <History className="w-8 h-8 text-slate-600 mx-auto" />
                            <p className="text-xs text-slate-400">
                                {isArabic ? "لا توجد عناصر محفوظة في هذا السجل" : "No saved items in this history"}
                            </p>
                            <button
                                type="button"
                                onClick={() => { onClose(); onNavigateToScan(); }}
                                className="text-xs text-cyan-400 hover:underline font-semibold"
                            >
                                {isArabic ? "بدء فحص دواء أو جرح الآن" : "Start a scan now"}
                            </button>
                        </div>
                    ) : (
                        filteredItems.map((item) => {
                            const isWound = item.type === "wound";
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                        onSelect(item);
                                        onClose();
                                    }}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.06] active:bg-white/[0.10] text-start transition-all min-h-[52px] touch-manipulation cursor-pointer border border-transparent hover:border-white/[0.06]"
                                >
                                    <div className={cn(
                                        "w-9 h-9 rounded-xl border flex items-center justify-center shrink-0",
                                        isWound ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
                                    )}>
                                        {isWound ? <Bandage className="w-4 h-4" /> : <Pill className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-xs font-bold text-white group-hover:text-cyan-300 truncate">
                                                {item.title}
                                            </p>
                                            <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                                                {new Date(item.created_at).toLocaleDateString(isArabic ? "ar-EG" : "en-US", { month: "short", day: "numeric" })}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                            {item.subtitle || (isWound ? "فحص سريري" : "دواء مسجل")}
                                        </p>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
