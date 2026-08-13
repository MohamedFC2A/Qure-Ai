"use client";

import { cn } from "@/lib/utils";
import { Pill, Upload, History, X, ChevronDown, ChevronUp, Bandage, Sparkles, Filter } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/context/UserContext";
import { getLocalScans } from "@/lib/localHistory";

/* ──────────────────────────────────────────────────────────
 *  ClinicalContextSelect – Unified local + Supabase history picker
 *  Seamlessly supports BOTH Medications and Wounds / Trauma Scans
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
}

export function MedicationSelect({ isArabic, onSelect, selected, onNavigateToScan }: MedicationSelectProps) {
    const { user } = useUser();
    const [items, setItems] = useState<ClinicalHistoryItem[]>([]);
    const [filterTab, setFilterTab] = useState<"all" | "medication" | "wound">("all");
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
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
                // A) Fetch Medication History
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

                // B) Fetch Wound Scans
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
    }, [user?.id, isArabic]);

    useEffect(() => {
        if (isOpen) loadHistory();
    }, [isOpen, loadHistory]);

    // When an item is selected, show sleek compact selected state
    if (selected) {
        const isWound = selected.type === "wound";
        return (
            <div className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-2.5 animate-fade-in",
                isWound
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
            )}>
                <div className={cn(
                    "w-7 h-7 rounded-lg border flex items-center justify-center shrink-0",
                    isWound ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-cyan-500/20 border-cyan-500/30 text-cyan-400"
                )}>
                    {isWound ? <Bandage className="w-3.5 h-3.5" /> : <Pill className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-white truncate">{selected.title}</p>
                        <span className={cn(
                            "text-[10px] font-bold px-1.5 py-0.2 rounded uppercase",
                            isWound ? "bg-emerald-500/20 text-emerald-300" : "bg-cyan-500/20 text-cyan-300"
                        )}>
                            {isWound ? (isArabic ? "جرح" : "Wound") : (isArabic ? "دواء" : "Rx")}
                        </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                        {isWound
                            ? (isArabic ? "سياق تقييم الجروح نشط" : "Wound triage context active")
                            : (isArabic ? "السياق الدوائي نشط" : "Medication context active")
                        }
                    </p>
                </div>
                <button
                    onClick={() => onSelect(null)}
                    className="p-1 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white transition-all"
                    title={isArabic ? "إلغاء التحديد" : "Remove context"}
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        );
    }

    const filteredItems = items.filter((item) => {
        if (filterTab === "all") return true;
        return item.type === filterTab;
    });

    return (
        <div className="space-y-2">
            {/* Action buttons — always visible */}
            <div className="flex gap-2 flex-wrap items-center">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                        "border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.03]",
                        "text-slate-300 hover:text-white",
                        isOpen && "border-white/25 bg-white/[0.05] text-white"
                    )}
                >
                    <History className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                    <span>{isArabic ? "اختر من السجل" : "Select from history"}</span>
                    {isOpen ? <ChevronUp className="w-3 h-3 ms-0.5" /> : <ChevronDown className="w-3 h-3 ms-0.5" />}
                </button>

                <button
                    onClick={onNavigateToScan}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                        "border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.03]",
                        "text-slate-300 hover:text-white"
                    )}
                >
                    <Upload className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span>{isArabic ? "ارفع صورة دواء أو جرح" : "Upload Scan"}</span>
                </button>
            </div>

            {/* Dropdown clinical history list */}
            {isOpen && (
                <div
                    className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl animate-fade-in bg-slate-900/95 backdrop-blur-xl"
                >
                    {/* Category Filter Bar */}
                    <div className="p-2 border-b border-white/[0.06] flex items-center gap-1 bg-white/[0.02]">
                        <button
                            onClick={() => setFilterTab("all")}
                            className={cn(
                                "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                                filterTab === "all" ? "bg-white text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                            )}
                        >
                            {isArabic ? "الكل" : "All"}
                        </button>
                        <button
                            onClick={() => setFilterTab("medication")}
                            className={cn(
                                "px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1",
                                filterTab === "medication" ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                            )}
                        >
                            <Pill className="w-3 h-3" />
                            <span>{isArabic ? "سجل الأدوية" : "Medications"}</span>
                        </button>
                        <button
                            onClick={() => setFilterTab("wound")}
                            className={cn(
                                "px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1",
                                filterTab === "wound" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                            )}
                        >
                            <Bandage className="w-3 h-3" />
                            <span>{isArabic ? "سجل الجروح" : "Wounds"}</span>
                        </button>
                    </div>

                    {loading ? (
                        <div className="p-3 space-y-1.5">
                            {[1, 2, 3].map(i => <div key={i} className="h-9 animate-pulse bg-white/5 rounded-lg" />)}
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="p-5 text-center space-y-2">
                            <History className="w-6 h-6 text-slate-600 mx-auto" />
                            <p className="text-xs text-slate-400">
                                {isArabic ? "لا توجد عناصر محفوظة في هذا السجل" : "No saved items in this history"}
                            </p>
                            <button
                                onClick={() => { setIsOpen(false); onNavigateToScan(); }}
                                className="text-xs text-cyan-400 hover:underline font-medium"
                            >
                                {isArabic ? "بدء فحص جديد الآن" : "Start a scan now"}
                            </button>
                        </div>
                    ) : (
                        <div className="max-h-56 overflow-y-auto p-1.5 space-y-1">
                            {filteredItems.map((item) => {
                                const isWound = item.type === "wound";
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            onSelect(item);
                                            setIsOpen(false);
                                        }}
                                        className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-white/[0.06] text-start transition-all group"
                                    >
                                        <div className={cn(
                                            "w-7 h-7 rounded-lg border flex items-center justify-center shrink-0",
                                            isWound ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
                                        )}>
                                            {isWound ? <Bandage className="w-3.5 h-3.5" /> : <Pill className="w-3.5 h-3.5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-xs font-bold text-white group-hover:text-cyan-300 truncate">
                                                    {item.title}
                                                </p>
                                                <span className="text-[10px] text-slate-500 shrink-0">
                                                    {new Date(item.created_at).toLocaleDateString(isArabic ? "ar-EG" : "en-US", { month: "short", day: "numeric" })}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                                {item.subtitle || (isWound ? "فحص سريري" : "دواء مسجل")}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
