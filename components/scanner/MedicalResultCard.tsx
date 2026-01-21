import { GlassCard } from "@/components/ui/GlassCard";
import { Activity, AlertTriangle, Info, Pill, ShieldAlert, Thermometer, Box, FileText, CheckCircle2, AlertOctagon, Clock, Sparkles, GitBranch, ChevronRight, Lock, Database, ExternalLink, ListTodo, Download, FileDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/Button";
import type { OpenFdaLabelSnapshot } from "@/lib/openfda";
import { AI_DISPLAY_NAME } from "@/lib/ai/branding";

interface MedicalData {
    drugName: string;
    drugNameEn?: string;
    genericName?: string;
    genericNameEn?: string;
    manufacturer: string;
    form?: string;
    strength?: string;
    activeIngredients?: string[];
    activeIngredientsDetailed?: Array<{
        name: string;
        strength?: string;
        strengthMg?: number;
        source?: string;
    }>;
    description: string;
    category?: string;
    uses: string[];
    sideEffects: string[];
    dosage: string;
    missedDose?: string;
    overdose?: {
        symptoms?: string[];
        whatToDo?: string[];
    };
    storage?: string;
    contraindications?: string[];
    precautions?: string[];
    warnings: string[];
    interactions?: string[];
    whenToSeekHelp?: string[];
    personalized?: null | {
        contextUsed?: boolean;
        riskLevel?: string;
        riskSummary?: string;
        alerts?: Array<{
            severity?: string;
            title?: string;
            details?: string;
        }>;
        basedOn?: {
            allergies?: boolean;
            conditions?: boolean;
            currentMedications?: boolean;
            medicationMemories?: boolean;
        };
    };
    confidenceScore?: number;
    interactionGuard?: null | {
        subject?: {
            profileId?: string | null;
            displayName?: string | null;
            relationship?: string | null;
        };
        target?: {
            name?: string | null;
            genericName?: string | null;
        };
        overallRisk?: string;
        items?: Array<{
            otherMedication: string;
            severity: "safe" | "caution" | "danger";
            confidence?: number;
            headline?: string;
            summary?: string;
            mechanism?: string;
            whatToDo?: string[];
            monitoring?: string[];
            redFlags?: string[];
        }>;
        disclaimer?: string;
        generatedAt?: string;
        serverDurationMs?: number;
    };
    fda?: (OpenFdaLabelSnapshot & { serverDurationMs?: number }) | null;
    web?: null | {
        found?: boolean;
        query?: string;
        results?: Array<{ title?: string; link?: string; snippet?: string }>;
        fetchedAt?: string;
        error?: string;
    };
    productClassification?: null | {
        kind?: string;
        confidence?: number;
        reasons?: string[];
    };
    error?: string;
    meta?: {
        plan?: 'free' | 'ultra';
        fdaEnabled?: boolean;
        savedToHistory?: boolean;
        historyId?: string | null;
        subjectProfileId?: string | null;
        subjectProfileName?: string | null;
        subjectRelationship?: string | null;
        usedPrivateContext?: boolean;
        usedMedicationMemories?: boolean;
        medicationMemoriesCount?: number;
        hasPrivateProfile?: boolean;
        usedInteractionGuard?: boolean;
        usedWebVerification?: boolean;
        usedFdaVerification?: boolean;
        memory?: {
            display_name?: string;
            normalized_name?: string;
            count?: number;
            last_seen_at?: string;
        } | null;
    };
}

interface MedicalResultCardProps {
    data: MedicalData;
}

interface AiNextQuestion {
    id: string;
    title: string;
    question: string;
}

interface AiTreeNode {
    title: string;
    answer: string;
    keyPoints?: string[];
    nextQuestions?: AiNextQuestion[];
}

type UltraSafetyTab = 'precautions' | 'interactions' | 'sideEffects' | 'overdose' | 'seekHelp';

export const MedicalResultCard = ({ data }: MedicalResultCardProps) => {
    const { user, plan, profile } = useUser();
    const { resultsLanguage, fdaDrugsEnabled } = useSettings();

    const exportRef = useRef<HTMLDivElement | null>(null);
    const [exporting, setExporting] = useState<null | 'png' | 'pdf'>(null);
    const [exportError, setExportError] = useState<string | null>(null);

    const meta = (data as any)?.meta as MedicalData["meta"] | undefined;
    const savedToHistory = meta?.savedToHistory ?? true;
    const memory = meta?.memory || null;
    const fdaFeatureEnabled = plan === "ultra" ? Boolean(fdaDrugsEnabled) : true;

    const isArabic = resultsLanguage === 'ar';
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    const [fda, setFda] = useState<MedicalData["fda"]>((data as any)?.fda ?? null);
    const [fdaLoading, setFdaLoading] = useState(false);
    const [fdaError, setFdaError] = useState<string | null>(null);
    const [showFdaDetails, setShowFdaDetails] = useState(false);

    const [aiNodes, setAiNodes] = useState<AiTreeNode[]>([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    const [safetyTab, setSafetyTab] = useState<UltraSafetyTab>('interactions');
    const [safetyShowAll, setSafetyShowAll] = useState<Record<string, boolean>>({});
    const [showAllIngredients, setShowAllIngredients] = useState(false);

    const interactionGuard = (data as any)?.interactionGuard as MedicalData["interactionGuard"] | undefined;
    const guardItems = useMemo(() => {
        const list = (interactionGuard as any)?.items;
        return Array.isArray(list) ? (list as any[]).filter((x) => x && x.otherMedication) : [];
    }, [interactionGuard]);

    const [selectedGuardKey, setSelectedGuardKey] = useState<string | null>(null);

    useEffect(() => {
        const first = guardItems[0]?.otherMedication ? String(guardItems[0].otherMedication) : null;
        setSelectedGuardKey(first);
    }, [guardItems]);

    const selectedGuardItem = useMemo(() => {
        if (!selectedGuardKey) return guardItems[0] || null;
        return guardItems.find((it: any) => String(it.otherMedication) === String(selectedGuardKey)) || guardItems[0] || null;
    }, [guardItems, selectedGuardKey]);

    const guardCounts = useMemo(() => {
        const counts = { safe: 0, caution: 0, danger: 0 };
        for (const it of guardItems as any[]) {
            const sev = String(it?.severity || "caution").toLowerCase();
            if (sev === "safe") counts.safe += 1;
            else if (sev === "danger") counts.danger += 1;
            else counts.caution += 1;
        }
        return counts;
    }, [guardItems]);

    const graphNodes = useMemo(() => (guardItems as any[]).slice(0, 10), [guardItems]);
    const graphLayout = useMemo(() => {
        const n = Math.max(1, graphNodes.length);
        const radius = 38; // percent
        return graphNodes.map((_: any, idx: number) => {
            const angle = (2 * Math.PI * idx) / n - Math.PI / 2;
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);
            return { x, y };
        });
    }, [graphNodes]);

    const guardSubjectName = useMemo(() => {
        const fromMeta = String(meta?.subjectProfileName || "").trim();
        if (fromMeta) return fromMeta;
        const fromGuard = String((interactionGuard as any)?.subject?.displayName || "").trim();
        if (fromGuard) return fromGuard;
        const fromProfile = String(profile?.username || profile?.full_name || "").trim();
        if (fromProfile) return fromProfile;
        return "";
    }, [interactionGuard, meta?.subjectProfileName, profile?.full_name, profile?.username]);

    const severityUi = (sev: string) => {
        const v = String(sev || "caution").toLowerCase();
        if (v === "safe") {
            return {
                label: t("Safe", "آمن"),
                chip: "bg-emerald-500/10 text-emerald-200 border-emerald-500/25",
                stroke: "rgba(16,185,129,0.9)",
                marker: "url(#arrowSafe)",
                node: "bg-emerald-500/10 border-emerald-500/25 text-emerald-50",
            };
        }
        if (v === "danger") {
            return {
                label: t("Danger", "خطر"),
                chip: "bg-red-500/10 text-red-200 border-red-500/25",
                stroke: "rgba(239,68,68,0.9)",
                marker: "url(#arrowDanger)",
                node: "bg-red-500/10 border-red-500/25 text-red-50",
            };
        }
        return {
            label: t("Caution", "تحذير"),
            chip: "bg-yellow-500/10 text-yellow-200 border-yellow-500/25",
            stroke: "rgba(234,179,8,0.95)",
            marker: "url(#arrowCaution)",
            node: "bg-yellow-500/10 border-yellow-500/25 text-yellow-50",
        };
    };

    const exportBaseName = useMemo(() => {
        const raw = String(data?.drugName || "analysis")
            .normalize("NFKC")
            .replace(/\s+/g, " ")
            .trim();
        const safe = raw
            .toLowerCase()
            .replace(/[^\p{L}\p{N}]+/gu, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
        return safe || "analysis";
    }, [data?.drugName]);

    const exportFilter = (node: HTMLElement) => {
        const maybeNode = node as unknown as { nodeType?: unknown; closest?: unknown; hasAttribute?: unknown } | null;
        if (!maybeNode || typeof maybeNode !== "object") return true;
        if (maybeNode.nodeType !== 1) return true;

        const element = node as unknown as Element;
        if (typeof element.closest === "function") {
            return !element.closest("[data-export-ignore]");
        }
        const hasAttribute = maybeNode.hasAttribute as unknown;
        if (typeof hasAttribute === "function") {
            return !(hasAttribute as (name: string) => boolean).call(maybeNode, "data-export-ignore");
        }
        return true;
    };

    const getSafePixelRatio = (node: HTMLElement, desired: number) => {
        const rect = node.getBoundingClientRect();
        const width = Math.max(1, rect.width);
        const height = Math.max(1, rect.height);
        const maxCanvasDimension = 12000;
        const maxRatio = Math.min(maxCanvasDimension / width, maxCanvasDimension / height);
        const ratio = Math.min(desired, maxRatio);
        return Math.max(1, Math.floor(ratio * 100) / 100);
    };

    const exportFrameStyle: Partial<CSSStyleDeclaration> = {
        padding: "18px",
        background: "linear-gradient(135deg, #070A12 0%, #0B1430 50%, #070A12 100%)",
        borderRadius: "28px",
    };

    const downloadPng = async () => {
        const node = exportRef.current;
        if (!node) return;

        setExportError(null);
        setExporting('png');
        try {
            const { toPng } = await import("html-to-image");
            const pixelRatio = getSafePixelRatio(node, plan === 'ultra' ? 4 : 3);
            const dataUrl = await toPng(node, {
                cacheBust: true,
                pixelRatio,
                backgroundColor: "#070A12",
                style: exportFrameStyle,
                filter: exportFilter,
            });

            const a = document.createElement("a");
            a.href = dataUrl;
            a.download = `${exportBaseName}-${Date.now()}.png`;
            a.click();
        } catch (e: any) {
            setExportError(String(e?.message || "Export failed"));
        } finally {
            setExporting(null);
        }
    };

    const downloadPdf = async () => {
        if (plan !== 'ultra') {
            setExportError(t("Ultra plan required for PDF export.", "تصدير PDF يتطلب الاشتراك ألترا."));
            return;
        }

        const node = exportRef.current;
        if (!node) return;

        setExportError(null);
        setExporting('pdf');
        try {
            const [{ toPng }, { jsPDF }] = await Promise.all([
                import("html-to-image"),
                import("jspdf"),
            ]);

            const pixelRatio = getSafePixelRatio(node, 5);
            const dataUrl = await toPng(node, {
                cacheBust: true,
                pixelRatio,
                backgroundColor: "#070A12",
                style: exportFrameStyle,
                filter: exportFilter,
            });

            const img = new Image();
            img.src = dataUrl;
            await img.decode();

            const pxToPt = 0.75;
            const pdfWidth = img.width * pxToPt;
            const pdfHeight = img.height * pxToPt;
            const orientation = pdfWidth > pdfHeight ? "landscape" : "portrait";

            const pdf = new jsPDF({
                orientation,
                unit: "pt",
                format: [pdfWidth, pdfHeight],
            });

            pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${exportBaseName}-${Date.now()}.pdf`);
        } catch (e: any) {
            setExportError(String(e?.message || "Export failed"));
        } finally {
            setExporting(null);
        }
    };

    useEffect(() => {
        setFda(data.fda ?? null);
        setFdaError(null);
        setShowFdaDetails(false);
        setShowAllIngredients(false);
    }, [data.drugName, data.fda]);

    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            if (!fdaFeatureEnabled) return;
            const drugName = String(data?.drugName || "").trim();
            if (!drugName || drugName === "Unknown") return;
            if (data.fda) return;

            setFdaLoading(true);
            setFdaError(null);
            try {
                const res = await fetch("/api/fda/drug", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        language: resultsLanguage,
                        drugName: data.drugName,
                        drugNameEn: data.drugNameEn,
                        genericName: data.genericName,
                        genericNameEn: data.genericNameEn,
                        manufacturer: data.manufacturer,
                    }),
                });

                const payload = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(payload?.error || "FDA lookup failed");
                if (!cancelled) setFda(payload as any);
            } catch (e: any) {
                if (!cancelled) setFdaError(String(e?.message || "FDA lookup failed"));
            } finally {
                if (!cancelled) setFdaLoading(false);
            }
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [data.drugName, data.drugNameEn, data.genericName, data.genericNameEn, data.manufacturer, fdaFeatureEnabled, resultsLanguage]);

    const fdaLabelFound = fdaFeatureEnabled && Boolean((fda as any)?.found);
    const fdaNdcFound = fdaFeatureEnabled && Boolean((fda as any)?.ndc?.found);
    const fdaFoundAny = fdaLabelFound || fdaNdcFound;

    const fdaLabelScore = Number((fda as any)?.match?.score || 0);
    const fdaLabelReason = String((fda as any)?.match?.reason || "");
    const fdaNdcScore = Number((fda as any)?.ndc?.match?.score || 0);
    const fdaNdcReason = String((fda as any)?.ndc?.match?.reason || "");

    const fdaConfirmedLabel =
        fdaLabelFound &&
        (fdaLabelReason.includes("product_ndc match") ||
            (fdaLabelReason.includes("brand_name exact match") &&
                (fdaLabelReason.includes("generic_name exact match") || fdaLabelReason.includes("substance_name match"))) ||
            fdaLabelScore >= 120);

    const fdaConfirmedNdc =
        fdaNdcFound &&
        (fdaNdcReason.includes("package_ndc match") ||
            (fdaNdcReason.includes("product_ndc match") ||
                (fdaNdcReason.includes("brand_name exact match") && fdaNdcReason.includes("generic_name exact match")) ||
                fdaNdcScore >= 130)); // Fixed parenthesis nesting here

    const fdaConfirmed = fdaConfirmedLabel || fdaConfirmedNdc;

    const fdaSoftError = String((fda as any)?.error || "");
    const fdaNotEnoughIdentifiers =
        fdaSoftError.toLowerCase().includes("not enough identifiers") ||
        fdaSoftError.toLowerCase().includes("no fda search terms") ||
        fdaSoftError.toLowerCase().includes("no search terms provided");

    const fdaStatus: "verified" | "uncertain" | "not_found" | "disabled" =
        !fdaFeatureEnabled
            ? "disabled"
            : fdaLoading
                ? "uncertain"
                : fdaError
                    ? "uncertain"
                    : fdaConfirmed
                        ? "verified"
                        : fdaFoundAny
                            ? "uncertain"
                            : !fda
                                ? "uncertain"
                                : fdaNotEnoughIdentifiers
                                    ? "uncertain"
                                    : fdaSoftError
                                        ? "uncertain"
                                        : "not_found";

    const productKind = String(data.productClassification?.kind || "").trim();
    const productKindLabel =
        productKind === "human_drug"
            ? t("Human medicine", "دواء بشري")
            : productKind === "human_supplement"
                ? t("Human supplement", "مكمل غذائي بشري")
                : productKind === "veterinary_drug"
                    ? t("Veterinary medicine", "دواء بيطري")
                    : productKind === "veterinary_supplement"
                        ? t("Veterinary supplement", "مكمل غذائي بيطري")
                        : "";

    const analysisForAi = {
        drugName: data.drugName,
        drugNameEn: data.drugNameEn,
        genericName: data.genericName,
        genericNameEn: data.genericNameEn,
        manufacturer: data.manufacturer,
        form: data.form,
        strength: data.strength,
        activeIngredients: data.activeIngredients,
        activeIngredientsDetailed: (data as any)?.activeIngredientsDetailed,
        category: data.category,
        description: data.description,
        uses: data.uses,
        dosage: data.dosage,
        missedDose: data.missedDose,
        sideEffects: data.sideEffects,
        warnings: data.warnings,
        contraindications: data.contraindications,
        precautions: data.precautions,
        interactions: data.interactions,
        whenToSeekHelp: data.whenToSeekHelp,
        fda: (fda as any) || undefined,
    };

    const actionChecklist = useMemo(() => {
        const items: Array<{ title: string; detail?: string; kind: "info" | "warn" }> = [];
        if (data.dosage) items.push({ title: t("Confirm the dose schedule", "تأكد من جدول الجرعة"), detail: data.dosage, kind: "info" });
        if (plan === 'ultra' && data.interactions && data.interactions.length > 0) items.push({ title: t("Avoid key interactions", "تجنب التداخلات المهمة"), detail: data.interactions.slice(0, 4).join(" • "), kind: "warn" });
        if (data.contraindications && data.contraindications.length > 0) items.push({ title: t("Check contraindications", "راجع موانع الاستعمال"), detail: data.contraindications.slice(0, 3).join(" • "), kind: "warn" });
        if (plan === 'ultra' && data.whenToSeekHelp && data.whenToSeekHelp.length > 0) items.push({ title: t("Know when to seek help", "اعرف متى تطلب المساعدة"), detail: data.whenToSeekHelp.slice(0, 3).join(" • "), kind: "warn" });
        if (data.storage) items.push({ title: t("Store it correctly", "احفظه بالشكل الصحيح"), detail: data.storage, kind: "info" });
        return items.slice(0, 5);
    }, [data.contraindications, data.dosage, data.interactions, data.storage, data.whenToSeekHelp, plan, t]);

    const formatMg = (mg: number) => {
        const rounded = Math.round(mg * 10) / 10;
        return Number.isInteger(rounded) ? `${rounded} mg` : `${rounded.toFixed(1)} mg`;
    };

    const parseDoseFromText = (raw: string) => {
        const text = String(raw || "").trim();
        if (!text) return { name: "", doseText: "—", doseMg: undefined as number | undefined };

        const match = text.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|ug|g)\b/i);
        if (!match) return { name: text, doseText: "—", doseMg: undefined as number | undefined };

        const value = Number(match[1]);
        const unit = String(match[2] || "").toLowerCase();
        let mg = Number.isFinite(value) ? value : NaN;
        if (unit === "g") mg = value * 1000;
        else if (unit === "mcg" || unit === "ug") mg = value / 1000;

        const doseMg = Number.isFinite(mg) ? mg : undefined;
        const cleanedName = text
            .replace(match[0], "")
            .replace(/[()،,:–—-]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        return {
            name: cleanedName || text,
            doseText: doseMg !== undefined ? formatMg(doseMg) : match[0],
            doseMg,
        };
    };

    const ingredientRows = useMemo(() => {
        if (fdaFeatureEnabled && Array.isArray((data as any)?.activeIngredientsDetailed) && (data as any).activeIngredientsDetailed.length > 0) {
            return ((data as any).activeIngredientsDetailed as any[])
                .map((it) => {
                    const name = String(it?.name || "").trim();
                    const strength = String(it?.strength || "").trim();
                    const strengthMg = typeof it?.strengthMg === "number" ? it.strengthMg : undefined;
                    const doseText = strengthMg !== undefined ? formatMg(strengthMg) : strength || "—";
                    if (!name) return null;
                    return { name, doseText, doseMg: strengthMg, source: "fda" as const };
                })
                .filter(Boolean) as Array<{ name: string; doseText: string; doseMg?: number; source: "fda" }>;
        }

        const ndcIngredients = (fda as any)?.ndc?.activeIngredients;
        if (fdaFeatureEnabled && Array.isArray(ndcIngredients) && ndcIngredients.length > 0) {
            return (ndcIngredients as any[])
                .map((it) => {
                    const name = String(it?.name || "").trim();
                    const strength = String(it?.strength || "").trim();
                    const strengthMg = typeof it?.strengthMg === "number" ? it.strengthMg : undefined;
                    const doseText = strengthMg !== undefined ? formatMg(strengthMg) : strength || "—";
                    if (!name) return null;
                    return { name, doseText, doseMg: strengthMg, source: "fda" as const };
                })
                .filter(Boolean) as Array<{ name: string; doseText: string; doseMg?: number; source: "fda" }>;
        }

        const list = Array.isArray(data.activeIngredients) ? data.activeIngredients : [];
        return list
            .map((raw) => {
                const parsed = parseDoseFromText(String(raw || ""));
                if (!parsed.name) return null;
                return { name: parsed.name, doseText: parsed.doseText, doseMg: parsed.doseMg, source: "ai" as const };
            })
            .filter(Boolean) as Array<{ name: string; doseText: string; doseMg?: number; source: "ai" }>;
    }, [data.activeIngredients, (data as any)?.activeIngredientsDetailed, fda, fdaFeatureEnabled]);

    const askAi = async (params: { preset?: "alternative" | "personalized" | "history"; question?: string; reset?: boolean }) => {
        if (!user) {
            setAiError(t("Login required.", "يجب تسجيل الدخول."));
            return;
        }
        if (plan !== "ultra") {
            setAiError(t("Ultra plan required.", "يلزم الاشتراك ألترا."));
            return;
        }
        const effectiveProfileId = String(meta?.subjectProfileId || (interactionGuard as any)?.subject?.profileId || "").trim() || undefined;
        setAiError(null);
        setAiLoading(true);
        try {
            const res = await fetch("/api/ai/tree", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    preset: params.preset,
                    question: params.question,
                    profileId: effectiveProfileId,
                    language: resultsLanguage,
                    analysis: analysisForAi,
                    path: (params.reset ? [] : aiNodes).map((n) => ({ title: n.title, answer: n.answer })),
                    userProfile: profile ? {
                        age: profile.age,
                        gender: profile.gender,
                        weight: profile.weight,
                        height: profile.height,
                        username: profile.username
                    } : undefined
                }),
            });

            const payload = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(payload?.error || "AI request failed");
            }

            const nextNode: AiTreeNode = {
                title: String(payload?.title || t("AI Answer", "إجابة الذكاء الاصطناعي")),
                answer: String(payload?.answer || ""),
                keyPoints: Array.isArray(payload?.keyPoints) ? payload.keyPoints : [],
                nextQuestions: Array.isArray(payload?.nextQuestions) ? payload.nextQuestions : [],
            };

            setAiNodes((prev) => (params.reset ? [nextNode] : [...prev, nextNode]));
        } catch (e: any) {
            setAiError(e?.message || "Failed to get AI answer.");
        } finally {
            setAiLoading(false);
        }
    };

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
        <div ref={exportRef} className="w-full max-w-4xl">
            <GlassCard className="w-full p-0 overflow-hidden shadow-2xl shadow-liquid-primary/10" hoverEffect={false}>
                {/* Header Section */}
                <div className="relative p-5 sm:p-8 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-liquid-primary/20 via-liquid-secondary/10 to-transparent" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">{data.drugName}</h2>
                                {fdaStatus === "verified" ? (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> {t("FDA Verified", "موثّق من FDA")}
                                    </span>
                                ) : fdaStatus === "not_found" ? (
                                    <span className="px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                        <AlertOctagon className="w-3 h-3" /> {t("Not in FDA database", "غير موجود في قاعدة بيانات FDA")}
                                    </span>
                                ) : fdaStatus === "disabled" ? (
                                    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                        <Lock className="w-3 h-3" /> {t("FDA disabled", "تم إيقاف FDA")}
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> {t("FDA: Not confirmed", "FDA: غير مؤكد")}
                                    </span>
                                )}
                            </div>

                            {data.genericName && (
                                <p className="text-liquid-accent font-medium text-base sm:text-lg mb-1">{data.genericName}</p>
                            )}

                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-white/50 text-xs sm:text-sm mt-3">
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 min-w-0 max-w-full">
                                    <Box className="w-4 h-4" />
                                    <span className="truncate">{data.manufacturer}</span>
                                </div>
                                {productKindLabel && (
                                    <div
                                        className={cn(
                                            "flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-semibold",
                                            productKind === "human_drug" && "bg-emerald-500/10 border-emerald-500/20 text-emerald-200",
                                            productKind === "human_supplement" && "bg-purple-500/10 border-purple-500/20 text-purple-200",
                                            productKind === "veterinary_drug" && "bg-orange-500/10 border-orange-500/20 text-orange-200",
                                            productKind === "veterinary_supplement" && "bg-amber-500/10 border-amber-500/20 text-amber-200",
                                            productKind !== "human_drug" &&
                                            productKind !== "human_supplement" &&
                                            productKind !== "veterinary_drug" &&
                                            productKind !== "veterinary_supplement" &&
                                            "bg-white/5 border-white/10 text-white/60"
                                        )}
                                    >
                                        {productKind.includes("supplement") ? (
                                            <Sparkles className="w-3.5 h-3.5" />
                                        ) : (
                                            <ShieldAlert className="w-3.5 h-3.5" />
                                        )}
                                        <span>
                                            {productKindLabel}
                                            {fdaStatus === "verified" ? " · 100%" : ""}
                                        </span>
                                    </div>
                                )}
                                {data.category && (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5">
                                        <Pill className="w-3.5 h-3.5" />
                                        <span>{data.category}</span>
                                    </div>
                                )}
                                {data.form && (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5">
                                        <span className="text-white/70">{data.form}</span>
                                    </div>
                                )}
                                {data.strength && (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5">
                                        <span className="text-white/70">{data.strength}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 md:justify-end flex-wrap">
                            <div data-export-ignore className="flex flex-wrap items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={downloadPng}
                                    disabled={!!exporting}
                                    className="border-white/15 text-white/80 hover:bg-white/10"
                                >
                                    <span className="flex items-center gap-2">
                                        <Download className="w-4 h-4" />
                                        {exporting === 'png' ? t("Exporting…", "جارٍ التصدير…") : "PNG"}
                                    </span>
                                </Button>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={downloadPdf}
                                    disabled={!!exporting || plan !== 'ultra'}
                                    className={cn(
                                        "border-white/15 hover:bg-white/10",
                                        plan === 'ultra' ? "text-white/80" : "border-white/10 text-white/40"
                                    )}
                                >
                                    <span className="flex items-center gap-2">
                                        {plan === 'ultra' ? <FileDown className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                        {exporting === 'pdf' ? t("Exporting…", "جارٍ التصدير…") : t("PDF (HQ)", "PDF (جودة عالية)")}
                                    </span>
                                </Button>
                            </div>

                            {meta?.plan && (
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                                    meta.plan === 'ultra'
                                        ? "bg-amber-500/10 text-amber-200 border-amber-500/30"
                                        : "bg-cyan-500/10 text-cyan-200 border-cyan-500/30"
                                )}>
                                    {meta.plan === 'ultra' ? t('Ultra', 'ألترا') : t('Free', 'مجاني')}
                                </span>
                            )}
                            {meta?.usedPrivateContext && (
                                <span className="px-3 py-1 rounded-full text-xs font-medium border bg-amber-500/10 text-amber-200 border-amber-500/30">
                                    {t('Private AI Context', 'سياقك الصحي الخاص')}
                                </span>
                            )}
                            {meta?.usedMedicationMemories && (
                                <span className="px-3 py-1 rounded-full text-xs font-medium border bg-purple-500/10 text-purple-200 border-purple-500/30">
                                    {t('Medication Memories', 'ذاكرة الأدوية')}
                                </span>
                            )}
                        </div>
                    </div>

                    {exportError && (
                        <div data-export-ignore className="relative z-10 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
                            {exportError}
                        </div>
                    )}

                    <div className="relative z-10 mt-6 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                        <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-liquid-primary mt-1 shrink-0" />
                            <p className="text-white/80 leading-relaxed text-sm">
                                {data.description}
                            </p>
                        </div>
                    </div>

                    {actionChecklist.length > 0 && (
                        <div className="relative z-10 mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center justify-between gap-3 mb-3">
                                <div className="flex items-center gap-2 text-white/80 text-sm font-semibold">
                                    <ListTodo className="w-4 h-4 text-liquid-accent" />
                                    {t("Quick Action Checklist", "قائمة سريعة لما يجب فعله")}
                                </div>
                                {fdaConfirmedLabel && (
                                    <span className="text-[11px] text-emerald-200/80 flex items-center gap-1">
                                        <Database className="w-3 h-3" /> {t("Backed by FDA label", "مدعوم ببيانات FDA")}
                                    </span>
                                )}
                            </div>
                            <ul className="grid gap-2">
                                {actionChecklist.map((item, i) => (
                                    <li
                                        key={i}
                                        className={cn(
                                            "p-3 rounded-xl border text-sm",
                                            item.kind === "warn"
                                                ? "bg-red-500/5 border-red-500/15 text-white/80"
                                                : "bg-white/5 border-white/10 text-white/80"
                                        )}
                                    >
                                        <p className="font-semibold text-white/90">{item.title}</p>
                                        {item.detail && <p className="mt-1 text-white/60 text-xs leading-relaxed">{item.detail}</p>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {ingredientRows.length > 0 && (
                        <div className="relative z-10 mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center justify-between gap-3 text-white/70 text-sm font-semibold mb-2">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-liquid-accent" />
                                    {t('Active Ingredients', 'المواد الفعالة')}
                                </div>
                                {fdaFeatureEnabled && ingredientRows[0]?.source === "fda" && (
                                    <span className="text-[11px] text-emerald-200/80 flex items-center gap-1">
                                        <Database className="w-3 h-3" /> {t("From FDA (NDC)", "من FDA (NDC)")}
                                    </span>
                                )}
                            </div>

                            <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/20">
                                <table className={cn("w-full text-xs sm:text-sm table-fixed", isArabic && "text-right")}>
                                    <thead className="bg-white/5">
                                        <tr>
                                            <th className="px-3 py-2 text-white/60 font-semibold w-10 text-center">#</th>
                                            <th className="px-3 py-2 text-white/60 font-semibold">
                                                {t("Ingredient", "المادة")}
                                            </th>
                                            <th className="px-3 py-2 text-white/60 font-semibold w-24 sm:w-28 text-center">
                                                {t("Dose", "الجرعة")}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(showAllIngredients ? ingredientRows : ingredientRows.slice(0, 10)).map((row, i) => (
                                            <tr key={i} className="border-t border-white/10">
                                                <td className="px-3 py-2 text-white/50 font-mono tabular-nums text-center">{i + 1}</td>
                                                <td className="px-3 py-2 text-white/80 leading-relaxed break-words">{row.name}</td>
                                                <td className="px-3 py-2 text-white/70 font-mono tabular-nums text-center">{row.doseText}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {ingredientRows.length > 10 && (
                                    <div className="flex items-center justify-between gap-3 px-3 py-2 border-t border-white/10 bg-white/5">
                                        <p className="text-[11px] text-white/50">
                                            {t(
                                                `${ingredientRows.length} ingredients detected`,
                                                `تم رصد ${ingredientRows.length} مادة`
                                            )}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setShowAllIngredients((v) => !v)}
                                            className="text-[11px] font-semibold text-white/70 hover:text-white hover:underline"
                                        >
                                            {showAllIngredients
                                                ? t("Show less", "عرض أقل")
                                                : t("Show all", "عرض الكل")}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* FDA Verification (openFDA) */}
                    <div className="relative z-10 mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-white/80 text-sm font-semibold">
                                <Database className="w-4 h-4 text-emerald-300" />
                                {t("FDA Database", "قاعدة بيانات FDA")}
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href="https://open.fda.gov/apis/drug/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-white/50 hover:text-white/80 transition-colors flex items-center gap-1"
                                >
                                    {t("Docs", "التوثيق")} <ExternalLink className="w-3 h-3" />
                                </a>
                                {plan === 'ultra' ? (
                                    !fdaFeatureEnabled ? (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled
                                            className="border-white/10 text-white/40"
                                        >
                                            <span className="flex items-center gap-2">
                                                <Lock className="w-4 h-4" />
                                                {t("Disabled", "مُعطّل")}
                                            </span>
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setShowFdaDetails((v) => !v)}
                                            className="border-white/15 text-white/70 hover:bg-white/10"
                                            disabled={fdaLoading || !fdaLabelFound}
                                        >
                                            {showFdaDetails ? t("Hide", "إخفاء") : t("Show", "عرض")}
                                        </Button>
                                    )
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled
                                        className="border-white/10 text-white/40"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Lock className="w-4 h-4" />
                                            {t("Label (Ultra)", "النشرة (ألترا)")}
                                        </span>
                                    </Button>
                                )}
                            </div>
                        </div>

                        {!fdaFeatureEnabled ? (
                            <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-xs leading-relaxed">
                                <p>
                                    {t(
                                        "FDA verification is disabled in your profile settings (Ultra). Enable it to use FDA/NDC cross-checks.",
                                        "تم إيقاف التحقق من FDA من إعدادات ملفك (ألترا). فعّل الخيار لاستخدام التحقق عبر FDA/NDC."
                                    )}
                                </p>
                                <div className="mt-2">
                                    <Link href="/profile" className="text-liquid-accent hover:underline font-medium">
                                        {t("Open Profile", "فتح الملف الشخصي")}
                                    </Link>
                                </div>
                            </div>
                        ) : fdaLoading ? (
                            <p className="mt-3 text-xs text-white/40">{t("Checking FDA label…", "جارٍ التحقق من بيانات FDA…")}</p>
                        ) : fdaError ? (
                            <p className="mt-3 text-xs text-red-200/80">{fdaError}</p>
                        ) : fdaLabelFound ? (
                            <div className="mt-3 grid gap-3">
                                <div className="flex flex-wrap gap-2">
                                    {((fda as any)?.openfda?.brand_name || []).slice(0, 2).map((v: string, i: number) => (
                                        <span key={`b-${i}`} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs font-medium">
                                            {t("Brand", "الاسم التجاري")}: {v}
                                        </span>
                                    ))}
                                    {((fda as any)?.openfda?.generic_name || []).slice(0, 2).map((v: string, i: number) => (
                                        <span key={`g-${i}`} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs font-medium">
                                            {t("Generic", "الاسم العلمي")}: {v}
                                        </span>
                                    ))}
                                    {((fda as any)?.openfda?.substance_name || []).slice(0, 2).map((v: string, i: number) => (
                                        <span key={`s-${i}`} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/60 text-xs">
                                            {t("Substance", "المادة")}: {v}
                                        </span>
                                    ))}
                                    {((fda as any)?.openfda?.manufacturer_name || []).slice(0, 1).map((v: string, i: number) => (
                                        <span key={`m-${i}`} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/60 text-xs">
                                            {t("FDA Manufacturer", "الشركة (FDA)")}: {v}
                                        </span>
                                    ))}
                                    {((fda as any)?.openfda?.route || []).slice(0, 2).map((v: string, i: number) => (
                                        <span key={`r-${i}`} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/60 text-xs">
                                            {t("Route", "طريقة الاستخدام")}: {v}
                                        </span>
                                    ))}
                                    {((fda as any)?.openfda?.product_type || []).slice(0, 1).map((v: string, i: number) => (
                                        <span key={`pt-${i}`} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs">
                                            {t("Type", "النوع")}: {v}
                                        </span>
                                    ))}
                                    {((fda as any)?.openfda?.unii || []).slice(0, 2).map((v: string, i: number) => (
                                        <span key={`unii-${i}`} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs font-mono break-all max-w-full">
                                            UNII: {v}
                                        </span>
                                    ))}
                                    {((fda as any)?.openfda?.product_ndc || []).slice(0, 1).map((v: string, i: number) => (
                                        <span key={`ndc-${i}`} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/60 text-xs font-mono break-all max-w-full">
                                            NDC: {v}
                                        </span>
                                    ))}
                                    {((fda as any)?.openfda?.spl_set_id || []).slice(0, 1).map((v: string, i: number) => (
                                        <span key={`spl-${i}`} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs font-mono break-all max-w-full">
                                            SPL: {v}
                                        </span>
                                    ))}
                                </div>

                                <p className="text-[11px] text-white/40 leading-relaxed">
                                    {t(
                                        "FDA label snippets via openFDA. Availability varies by region/product.",
                                        "مقتطفات من نشرة FDA عبر openFDA. توفر البيانات يختلف حسب الدولة/المنتج."
                                    )}
                                </p>

                                {plan === 'ultra' && showFdaDetails && (
                                    <div className="grid gap-3">
                                        {((fda as any)?.label?.indications_and_usage || []).length > 0 && (
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                                <p className="text-white font-semibold text-sm mb-2">{t("Indications & Usage (FDA)", "الاستخدامات (FDA)")}</p>
                                                {((fda as any).label.indications_and_usage as string[]).map((s, i) => (
                                                    <p key={i} className="text-white/70 text-sm whitespace-pre-wrap leading-relaxed">{s}</p>
                                                ))}
                                            </div>
                                        )}
                                        {((fda as any)?.label?.dosage_and_administration || []).length > 0 && (
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                                <p className="text-white font-semibold text-sm mb-2">{t("Dosage (FDA)", "الجرعة (FDA)")}</p>
                                                {((fda as any).label.dosage_and_administration as string[]).map((s, i) => (
                                                    <p key={i} className="text-white/70 text-sm whitespace-pre-wrap leading-relaxed">{s}</p>
                                                ))}
                                            </div>
                                        )}
                                        {((fda as any)?.label?.warnings_and_precautions || []).length > 0 && (
                                            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/15">
                                                <p className="text-white font-semibold text-sm mb-2">{t("Warnings & Precautions (FDA)", "التحذيرات والاحتياطات (FDA)")}</p>
                                                {((fda as any).label.warnings_and_precautions as string[]).map((s, i) => (
                                                    <p key={i} className="text-red-100/90 text-sm whitespace-pre-wrap leading-relaxed">{s}</p>
                                                ))}
                                            </div>
                                        )}
                                        {((fda as any)?.label?.contraindications || []).length > 0 && (
                                            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/15">
                                                <p className="text-white font-semibold text-sm mb-2">{t("Contraindications (FDA)", "موانع الاستعمال (FDA)")}</p>
                                                {((fda as any).label.contraindications as string[]).map((s, i) => (
                                                    <p key={i} className="text-red-100/90 text-sm whitespace-pre-wrap leading-relaxed">{s}</p>
                                                ))}
                                            </div>
                                        )}
                                        {((fda as any)?.label?.drug_interactions || []).length > 0 && (
                                            <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/15">
                                                <p className="text-white font-semibold text-sm mb-2">{t("Drug Interactions (FDA)", "التداخلات (FDA)")}</p>
                                                {((fda as any).label.drug_interactions as string[]).map((s, i) => (
                                                    <p key={i} className="text-orange-100/90 text-sm whitespace-pre-wrap leading-relaxed">{s}</p>
                                                ))}
                                            </div>
                                        )}
                                        {((fda as any)?.label?.overdosage || []).length > 0 && (
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                                <p className="text-white font-semibold text-sm mb-2">{t("Overdosage (FDA)", "الجرعة الزائدة (FDA)")}</p>
                                                {((fda as any).label.overdosage as string[]).map((s, i) => (
                                                    <p key={i} className="text-white/70 text-sm whitespace-pre-wrap leading-relaxed">{s}</p>
                                                ))}
                                            </div>
                                        )}
                                        {((fda as any)?.label?.storage_and_handling || []).length > 0 && (
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                                <p className="text-white font-semibold text-sm mb-2">{t("Storage (FDA)", "الحفظ (FDA)")}</p>
                                                {((fda as any).label.storage_and_handling as string[]).map((s, i) => (
                                                    <p key={i} className="text-white/70 text-sm whitespace-pre-wrap leading-relaxed">{s}</p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {plan !== 'ultra' && (
                                    <div className="mt-4 relative overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                                        <div className="p-4 blur-sm opacity-60 pointer-events-none select-none">
                                            <div className="grid gap-3 md:grid-cols-2">
                                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                                    <p className="text-white font-semibold text-sm mb-2">{t("FDA: Warnings & Precautions", "FDA: تحذيرات واحتياطات")}</p>
                                                    <p className="text-white/70 text-xs leading-relaxed">
                                                        {t("Official label excerpts (high confidence).", "مقتطفات من النشرة الرسمية (ثقة عالية).")}
                                                    </p>
                                                </div>
                                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                                    <p className="text-white font-semibold text-sm mb-2">{t("FDA: Interactions & Adverse", "FDA: تداخلات وآثار")}</p>
                                                    <p className="text-white/70 text-xs leading-relaxed">
                                                        {t("Interactions, adverse reactions, overdose, and more.", "تداخلات، آثار جانبية، جرعة زائدة، وأكثر.")}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="absolute inset-0 flex items-center justify-center p-4">
                                            <div className="w-full max-w-md p-5 rounded-2xl bg-black/70 border border-white/10 backdrop-blur-md">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                                        <Lock className="w-5 h-5 text-amber-200" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-white font-bold">{t("Unlock FDA label sections", "افتح أقسام نشرة FDA")}</p>
                                                        <p className="text-white/60 text-sm mt-1">
                                                            {t(
                                                                "Read official warnings, interactions, adverse reactions, and overdose sections.",
                                                                "اقرأ التحذيرات الرسمية والتداخلات والآثار الجانبية والجرعة الزائدة."
                                                            )}
                                                        </p>
                                                        <div className="mt-3">
                                                            <Link href="/pricing">
                                                                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black">
                                                                    {t("Upgrade to Ultra", "ترقية إلى ألترا")}
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : fdaNdcFound ? (
                            <div className="mt-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-emerald-100/90 text-xs leading-relaxed">
                                {t(
                                    "Found in FDA NDC listing, but an official label snippet was not available via openFDA label dataset.",
                                    "تم العثور عليه في بيانات NDC التابعة لـ FDA، لكن لم تتوفر نشرة رسمية عبر قاعدة بيانات openFDA (labels)."
                                )}
                            </div>
                        ) : (
                            <div
                                className={cn(
                                    "mt-3 p-3 rounded-xl border text-xs leading-relaxed",
                                    fdaStatus === "not_found"
                                        ? "bg-red-500/5 border-red-500/15 text-red-100/90"
                                        : "bg-amber-500/5 border-amber-500/15 text-amber-100/90"
                                )}
                            >
                                {t(
                                    fdaNotEnoughIdentifiers
                                        ? "FDA verification needs an English drug name or an NDC. Try scanning the name more clearly or include an NDC if present on the package."
                                        : fdaStatus === "not_found"
                                            ? "Not found in FDA databases (openFDA). It may be outside FDA coverage, a supplement, or not FDA-classified."
                                            : "FDA match is not fully confirmed. Try scanning the name/NDC more clearly.",
                                    fdaNotEnoughIdentifiers
                                        ? "تعذر التحقق من FDA لأن الاسم بالإنجليزية أو رقم NDC غير متوفر. جرّب تصوير الاسم بوضوح أو تضمين رقم NDC إن كان موجودًا على العبوة."
                                        : fdaStatus === "not_found"
                                            ? "غير موجود في قواعد بيانات FDA (openFDA). قد يكون خارج تغطية FDA أو مكملًا غذائيًا أو غير مُدرج."
                                            : "مطابقة FDA غير مؤكدة بالكامل. جرّب تصوير الاسم/NDC بوضوح أكبر."
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="p-5 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 bg-black/20">

                    {/* Left Column: Usage & Dosage */}
                    <div className="space-y-6 sm:space-y-8">
                        {/* Primary Uses */}
                        <section>
                            <div className="flex items-center gap-2 mb-4 text-liquid-accent">
                                <Activity className="w-5 h-5" />
                                <h3 className="font-bold text-white text-lg">{t('Indication & Uses', 'الاستخدامات')}</h3>
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
                                <h3 className="font-bold text-white text-lg">{t('Standard Dosage', 'الجرعة المعتادة')}</h3>
                            </div>
                            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-100 text-sm leading-relaxed">
                                {data.dosage || "Consult a doctor for precise dosage."}
                            </div>
                        </section>

                        {data.missedDose && (
                            <section>
                                <div className="flex items-center gap-2 mb-4 text-white/70">
                                    <Clock className="w-5 h-5 text-white/50" />
                                    <h3 className="font-bold text-white text-lg">{t('Missed Dose', 'نسيان الجرعة')}</h3>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm leading-relaxed">
                                    {data.missedDose}
                                </div>
                            </section>
                        )}

                        {/* Storage */}
                        {data.storage && (
                            <section>
                                <div className="flex items-center gap-2 mb-2 text-white/40 text-sm uppercase tracking-wider font-bold">
                                    <Box className="w-4 h-4" /> {t('Storage', 'الحفظ')}
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
                                <h3 className="font-bold text-white text-lg">{t('Safety Warnings', 'تحذيرات السلامة')}</h3>
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

                        {(data.contraindications && data.contraindications.length > 0) && (
                            <section>
                                <div className="flex items-center gap-2 mb-4 text-red-300">
                                    <AlertOctagon className="w-5 h-5" />
                                    <h3 className="font-bold text-white text-lg">{t('Contraindications', 'موانع الاستعمال')}</h3>
                                </div>
                                <ul className="space-y-2">
                                    {data.contraindications.map((c, i) => (
                                        <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                                            <AlertTriangle className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />
                                            <span className="text-white/80 text-sm">{c}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                    </div>
                </div>

                {/* Ultra: Advanced Safety Pack */}
                <div className="p-5 sm:p-8 bg-black/10 border-t border-white/10">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <h3 className="text-lg font-bold text-white">{t('Advanced Safety Pack', 'حزمة الأمان المتقدمة')}</h3>
                        {plan !== 'ultra' && (
                            <Link href="/pricing" className="text-xs text-amber-300 hover:underline">
                                {t('Upgrade to Ultra', 'ترقية إلى ألترا')}
                            </Link>
                        )}
                    </div>

                    {plan !== 'ultra' ? (
                        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                            <div className="p-5 blur-sm opacity-60 pointer-events-none select-none">
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        t('Precautions', 'احتياطات'),
                                        t('Interactions', 'التداخلات'),
                                        t('Side effects', 'الآثار الجانبية'),
                                        t('Overdose', 'الجرعة الزائدة'),
                                        t('Seek help', 'متى تطلب المساعدة'),
                                    ].map((label, i) => (
                                        <span key={i} className="px-3 py-1 rounded-full text-xs border bg-black/20 border-white/10 text-white/70">
                                            {label}
                                        </span>
                                    ))}
                                </div>
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                        <p className="text-white font-semibold text-sm">{t("Example: interaction risk", "مثال: خطر تداخل")}</p>
                                        <p className="text-white/60 text-xs mt-1">{t("May interact with blood thinners or alcohol.", "قد يتداخل مع مميعات الدم أو الكحول.")}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                        <p className="text-white font-semibold text-sm">{t("Example: when to seek help", "مثال: متى تطلب المساعدة")}</p>
                                        <p className="text-white/60 text-xs mt-1">{t("Severe rash, breathing trouble, fainting.", "طفح شديد، صعوبة تنفس، إغماء.")}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center p-4">
                                <div className="w-full max-w-md p-5 rounded-2xl bg-black/70 border border-white/10 backdrop-blur-md">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                            <Lock className="w-5 h-5 text-amber-200" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-white font-bold">
                                                {!user
                                                    ? t("Login to unlock safety details", "سجّل الدخول لفتح تفاصيل الأمان")
                                                    : t("Upgrade to unlock Advanced Safety Pack", "ترقية لفتح حزمة الأمان المتقدمة")}
                                            </p>
                                            <p className="text-white/60 text-sm mt-1">
                                                {t(
                                                    "Precautions, interactions, common side effects, overdose, and red flags.",
                                                    "احتياطات + تداخلات + آثار جانبية + جرعة زائدة + علامات تستدعي المساعدة."
                                                )}
                                            </p>
                                            <div className="mt-3 flex items-center gap-2">
                                                {!user ? (
                                                    <Link href="/login">
                                                        <Button size="sm">{t("Log in", "تسجيل الدخول")}</Button>
                                                    </Link>
                                                ) : (
                                                    <Link href="/pricing">
                                                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black">
                                                            {t("Upgrade to Ultra", "ترقية إلى ألترا")}
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                            <div className="p-3 border-b border-white/10 flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSafetyTab('precautions')}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                                        safetyTab === 'precautions' ? "bg-yellow-500/15 border-yellow-500/30 text-yellow-200" : "bg-black/20 border-white/10 text-white/60 hover:text-white"
                                    )}
                                >
                                    {t('Precautions', 'احتياطات')}
                                </button>
                                <button
                                    onClick={() => setSafetyTab('interactions')}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                                        safetyTab === 'interactions' ? "bg-orange-500/15 border-orange-500/30 text-orange-200" : "bg-black/20 border-white/10 text-white/60 hover:text-white"
                                    )}
                                >
                                    {t('Drug Interactions', 'التداخلات الدوائية')}
                                </button>
                                <button
                                    onClick={() => setSafetyTab('sideEffects')}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                                        safetyTab === 'sideEffects' ? "bg-yellow-500/15 border-yellow-500/30 text-yellow-200" : "bg-black/20 border-white/10 text-white/60 hover:text-white"
                                    )}
                                >
                                    {t('Common Side Effects', 'الآثار الجانبية الشائعة')}
                                </button>
                                <button
                                    onClick={() => setSafetyTab('overdose')}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                                        safetyTab === 'overdose' ? "bg-red-500/15 border-red-500/30 text-red-200" : "bg-black/20 border-white/10 text-white/60 hover:text-white"
                                    )}
                                >
                                    {t('Overdose', 'الجرعة الزائدة')}
                                </button>
                                <button
                                    onClick={() => setSafetyTab('seekHelp')}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                                        safetyTab === 'seekHelp' ? "bg-red-500/15 border-red-500/30 text-red-200" : "bg-black/20 border-white/10 text-white/60 hover:text-white"
                                    )}
                                >
                                    {t('When to seek help', 'متى تطلب المساعدة')}
                                </button>
                            </div>

                            <div className="p-5">
                                {safetyTab === 'precautions' && (
                                    <div>
                                        <div className="flex items-center justify-between gap-3 mb-3">
                                            <p className="text-white/80 text-sm font-semibold">{t('Precautions', 'احتياطات')}</p>
                                            {(data.precautions?.length || 0) > 6 && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setSafetyShowAll((p) => ({ ...p, precautions: !p.precautions }))}
                                                    className="border-white/15 text-white/70 hover:bg-white/10"
                                                >
                                                    {safetyShowAll.precautions ? t('Show less', 'عرض أقل') : t('Show all', 'عرض الكل')}
                                                </Button>
                                            )}
                                        </div>
                                        {(data.precautions && data.precautions.length > 0) ? (
                                            <ul className="grid gap-2 md:grid-cols-2">
                                                {(safetyShowAll.precautions ? data.precautions : data.precautions.slice(0, 6)).map((p, i) => (
                                                    <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                                                        <AlertTriangle className="w-4 h-4 text-yellow-300 shrink-0 mt-0.5" />
                                                        <span className="text-white/80 text-sm">{p}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-white/40 text-sm">{t("No precautions listed.", "لا توجد احتياطات مذكورة.")}</p>
                                        )}
                                    </div>
                                )}

                                {safetyTab === 'interactions' && (
                                    <div>
                                        <div className="flex items-center justify-between gap-3 mb-3">
                                            <p className="text-white/80 text-sm font-semibold">{t('Drug Interactions', 'التداخلات الدوائية')}</p>
                                            {(data.interactions?.length || 0) > 10 && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setSafetyShowAll((p) => ({ ...p, interactions: !p.interactions }))}
                                                    className="border-white/15 text-white/70 hover:bg-white/10"
                                                >
                                                    {safetyShowAll.interactions ? t('Show less', 'عرض أقل') : t('Show all', 'عرض الكل')}
                                                </Button>
                                            )}
                                        </div>
                                        {(data.interactions && data.interactions.length > 0) ? (
                                            <div className="flex flex-wrap gap-2">
                                                {(safetyShowAll.interactions ? data.interactions : data.interactions.slice(0, 10)).map((interaction, i) => (
                                                    <span key={i} className="px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-200 text-xs font-medium">
                                                        {interaction}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-white/40 text-sm">{t("No interactions listed.", "لا توجد تداخلات مذكورة.")}</p>
                                        )}
                                    </div>
                                )}

                                {safetyTab === 'sideEffects' && (
                                    <div>
                                        <div className="flex items-center justify-between gap-3 mb-3">
                                            <p className="text-white/80 text-sm font-semibold">{t('Common Side Effects', 'الآثار الجانبية الشائعة')}</p>
                                            {(data.sideEffects?.length || 0) > 8 && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setSafetyShowAll((p) => ({ ...p, sideEffects: !p.sideEffects }))}
                                                    className="border-white/15 text-white/70 hover:bg-white/10"
                                                >
                                                    {safetyShowAll.sideEffects ? t('Show less', 'عرض أقل') : t('Show all', 'عرض الكل')}
                                                </Button>
                                            )}
                                        </div>
                                        {(data.sideEffects && data.sideEffects.length > 0) ? (
                                            <ul className="grid gap-2 md:grid-cols-2">
                                                {(safetyShowAll.sideEffects ? data.sideEffects : data.sideEffects.slice(0, 8)).map((s, i) => (
                                                    <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0" />
                                                        <span className="text-white/80 text-sm">{s}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-white/40 text-sm">{t("No side effects listed.", "لا توجد آثار جانبية مذكورة.")}</p>
                                        )}
                                    </div>
                                )}

                                {safetyTab === 'overdose' && (
                                    <div>
                                        <p className="text-white/80 text-sm font-semibold mb-3">{t('Overdose', 'الجرعة الزائدة')}</p>
                                        {data.overdose && ((data.overdose.symptoms?.length || 0) > 0 || (data.overdose.whatToDo?.length || 0) > 0) ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {(data.overdose.symptoms && data.overdose.symptoms.length > 0) && (
                                                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                                                        <p className="text-red-100 font-semibold text-sm mb-2">{t('Symptoms', 'الأعراض')}</p>
                                                        <ul className="space-y-1 text-red-100/90 text-sm">
                                                            {(safetyShowAll.overdose ? data.overdose.symptoms : data.overdose.symptoms.slice(0, 6)).map((s, i) => <li key={i}>• {s}</li>)}
                                                        </ul>
                                                        {(data.overdose.symptoms.length > 6) && (
                                                            <button
                                                                onClick={() => setSafetyShowAll((p) => ({ ...p, overdose: !p.overdose }))}
                                                                className="mt-3 text-xs text-red-200/80 hover:underline"
                                                            >
                                                                {safetyShowAll.overdose ? t('Show less', 'عرض أقل') : t('Show all', 'عرض الكل')}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                                {(data.overdose.whatToDo && data.overdose.whatToDo.length > 0) && (
                                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                                        <p className="text-white font-semibold text-sm mb-2">{t('What to do', 'ماذا تفعل')}</p>
                                                        <ul className="space-y-1 text-white/70 text-sm">
                                                            {(safetyShowAll.overdose ? data.overdose.whatToDo : data.overdose.whatToDo.slice(0, 6)).map((s, i) => <li key={i}>• {s}</li>)}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-white/40 text-sm">{t("No overdose info available.", "لا توجد معلومات عن الجرعة الزائدة.")}</p>
                                        )}
                                    </div>
                                )}

                                {safetyTab === 'seekHelp' && (
                                    <div>
                                        <div className="flex items-center justify-between gap-3 mb-3">
                                            <p className="text-white/80 text-sm font-semibold">{t('When to seek help', 'متى تطلب المساعدة')}</p>
                                            {(data.whenToSeekHelp?.length || 0) > 8 && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setSafetyShowAll((p) => ({ ...p, seekHelp: !p.seekHelp }))}
                                                    className="border-white/15 text-white/70 hover:bg-white/10"
                                                >
                                                    {safetyShowAll.seekHelp ? t('Show less', 'عرض أقل') : t('Show all', 'عرض الكل')}
                                                </Button>
                                            )}
                                        </div>
                                        {(data.whenToSeekHelp && data.whenToSeekHelp.length > 0) ? (
                                            <ul className="grid gap-2 md:grid-cols-2">
                                                {(safetyShowAll.seekHelp ? data.whenToSeekHelp : data.whenToSeekHelp.slice(0, 8)).map((s, i) => (
                                                    <li key={i} className="p-3 rounded-xl bg-red-500/5 border border-red-500/15 text-white/80 text-sm">
                                                        • {s}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-white/40 text-sm">{t("No red-flag symptoms listed.", "لا توجد علامات تحذيرية مذكورة.")}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* PRO: Personalized Context */}
                <div className="p-5 sm:p-8 bg-black/10 border-t border-white/10">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <h3 className="text-lg font-bold text-white">{t('Private AI Context', 'سياقك الصحي الخاص')}</h3>
                        {plan !== 'ultra' && (
                            <Link href="/pricing" className="text-xs text-amber-300 hover:underline">
                                {t('Upgrade to Ultra', 'ترقية إلى ألترا')}
                            </Link>
                        )}
                    </div>

                    {plan !== 'ultra' ? (
                        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-amber-500/5">
                            <div className="p-5 blur-sm opacity-60 pointer-events-none select-none">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-red-500/10 text-red-200 border-red-500/30">
                                        {t('Risk', 'المخاطر')}: high
                                    </span>
                                    <span className="px-3 py-1 rounded-full text-xs font-medium border bg-purple-500/10 text-purple-200 border-purple-500/30">
                                        {t('Memories', 'الذاكرة')}: 12
                                    </span>
                                    <span className="px-3 py-1 rounded-full text-xs font-medium border bg-white/5 text-white/70 border-white/10">
                                        {t('Interactions', 'تداخلات')}: 3
                                    </span>
                                </div>
                                <div className="mt-3 grid gap-2">
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                        <p className="text-white font-semibold text-sm">{t("Personalized warning", "تحذير مخصص")}</p>
                                        <p className="text-white/70 text-sm mt-1">{t("This medication may worsen a chronic condition.", "قد يزيد هذا الدواء من مشكلة صحية مزمنة.")}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                        <p className="text-white font-semibold text-sm">{t("Profile-based dosing note", "ملاحظة جرعة حسب الملف")}</p>
                                        <p className="text-white/70 text-sm mt-1">{t("Dose adjustments may be needed based on your profile.", "قد تحتاج الجرعة لتعديل حسب بياناتك.")}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center p-4">
                                <div className="w-full max-w-md p-5 rounded-2xl bg-black/70 border border-white/10 backdrop-blur-md">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                            <Lock className="w-5 h-5 text-amber-200" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-white font-bold">
                                                {!user
                                                    ? t("Login to enable Private AI Context", "سجّل الدخول لتفعيل سياقك الصحي الخاص")
                                                    : t("Upgrade to unlock Private AI Context", "ترقية لفتح سياقك الصحي الخاص")}
                                            </p>
                                            <p className="text-white/60 text-sm mt-1">
                                                {t(
                                                    "Patient-specific warnings + interaction checks using your Private AI Profile and Medication Memories.",
                                                    "تحذيرات وتداخلات مخصصة حسب ملفك الصحي وذاكرة الأدوية."
                                                )}
                                            </p>
                                            <div className="mt-3 flex items-center gap-2">
                                                {!user ? (
                                                    <Link href="/login">
                                                        <Button size="sm">{t("Log in", "تسجيل الدخول")}</Button>
                                                    </Link>
                                                ) : (
                                                    <Link href="/pricing">
                                                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black">{t("Upgrade to Ultra", "ترقية إلى ألترا")}</Button>
                                                    </Link>
                                                )}
                                                <Link href="/profile">
                                                    <Button size="sm" variant="outline" className="border-white/15 text-white/80 hover:bg-white/10">
                                                        {t("Profile", "الملف")}
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            <div className="flex items-center gap-2 flex-wrap">
                                {guardSubjectName && (
                                    <span className="px-3 py-1 rounded-full text-xs font-medium border bg-white/5 text-white/80 border-white/10">
                                        {t("Profile", "الملف")}: {guardSubjectName}
                                    </span>
                                )}

                                {guardItems.length > 0 && (
                                    <>
                                        <span className="px-3 py-1 rounded-full text-xs font-medium border bg-emerald-500/10 text-emerald-200 border-emerald-500/25">
                                            {t("Safe", "آمن")}: {guardCounts.safe}
                                        </span>
                                        <span className="px-3 py-1 rounded-full text-xs font-medium border bg-yellow-500/10 text-yellow-200 border-yellow-500/25">
                                            {t("Caution", "تحذير")}: {guardCounts.caution}
                                        </span>
                                        <span className="px-3 py-1 rounded-full text-xs font-medium border bg-red-500/10 text-red-200 border-red-500/25">
                                            {t("Danger", "خطر")}: {guardCounts.danger}
                                        </span>
                                    </>
                                )}

                                {data.personalized?.riskLevel && (
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                                        String(data.personalized.riskLevel).toLowerCase().includes('high')
                                            ? "bg-red-500/10 text-red-200 border-red-500/30"
                                            : String(data.personalized.riskLevel).toLowerCase().includes('medium')
                                                ? "bg-yellow-500/10 text-yellow-200 border-yellow-500/30"
                                                : "bg-green-500/10 text-green-200 border-green-500/30"
                                    )}>
                                        {t('Risk', 'المخاطر')}: {data.personalized.riskLevel}
                                    </span>
                                )}

                                {Number(meta?.medicationMemoriesCount || 0) > 0 && (
                                    <span className="px-3 py-1 rounded-full text-xs font-medium border bg-purple-500/10 text-purple-200 border-purple-500/30">
                                        {t('Memories', 'الذاكرة')}: {meta?.medicationMemoriesCount}
                                    </span>
                                )}

                                <Link href="/profile" className="text-xs text-white/50 hover:text-white hover:underline">
                                    {t('Edit profile & memories', 'تعديل الملف والذاكرة')}
                                </Link>
                            </div>

                            {guardItems.length > 0 && (
                                <div className="p-4 sm:p-5 rounded-2xl bg-black/20 border border-white/10 overflow-hidden">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <GitBranch className="w-5 h-5 text-cyan-300" />
                                            <p className="text-white font-bold truncate">{t("Cross‑Interaction Guard", "حارس التداخلات الدوائية")}</p>
                                        </div>
                                        <span className="text-xs text-white/40">
                                            {t("Tap a node for details", "اضغط على أي دواء لعرض التفاصيل")}
                                        </span>
                                    </div>

                                    {interactionGuard?.overallRisk && (
                                        <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm">
                                            {interactionGuard.overallRisk}
                                        </div>
                                    )}

                                    <div className="mt-4 relative w-full h-[420px] sm:h-[460px] rounded-2xl bg-black/30 border border-white/10 overflow-hidden">
                                        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                                            <defs>
                                                <marker id="arrowSafe" markerWidth="6" markerHeight="6" refX="5.5" refY="3" orient="auto">
                                                    <path d="M0,0 L6,3 L0,6 Z" fill="rgba(16,185,129,0.9)" />
                                                </marker>
                                                <marker id="arrowCaution" markerWidth="6" markerHeight="6" refX="5.5" refY="3" orient="auto">
                                                    <path d="M0,0 L6,3 L0,6 Z" fill="rgba(234,179,8,0.95)" />
                                                </marker>
                                                <marker id="arrowDanger" markerWidth="6" markerHeight="6" refX="5.5" refY="3" orient="auto">
                                                    <path d="M0,0 L6,3 L0,6 Z" fill="rgba(239,68,68,0.9)" />
                                                </marker>
                                            </defs>

                                            {graphNodes.map((it: any, idx: number) => {
                                                const ui = severityUi(it?.severity);
                                                const pos = graphLayout[idx] || { x: 50, y: 12 };
                                                return (
                                                    <line
                                                        key={`l-${idx}`}
                                                        x1={pos.x}
                                                        y1={pos.y}
                                                        x2={50}
                                                        y2={50}
                                                        stroke={ui.stroke}
                                                        strokeWidth={1.8}
                                                        opacity={0.85}
                                                        markerEnd={ui.marker}
                                                    />
                                                );
                                            })}
                                        </svg>

                                        {/* Center node */}
                                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                                            <div className="w-[170px] sm:w-[210px] rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 p-4 text-center shadow-[0_0_40px_-18px_rgba(34,211,238,0.45)]">
                                                <p className="text-[11px] text-white/50">{t("Target medication", "الدواء الأساسي")}</p>
                                                <p className="text-white font-bold mt-1 leading-tight line-clamp-2">
                                                    {String(data?.drugName || t("Target medication", "الدواء الأساسي"))}
                                                </p>
                                                {data?.genericName && (
                                                    <p className="text-white/60 text-xs mt-1 line-clamp-2">
                                                        {data.genericName}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Peripheral nodes */}
                                        {graphNodes.map((it: any, idx: number) => {
                                            const pos = graphLayout[idx] || { x: 50, y: 12 };
                                            const ui = severityUi(it?.severity);
                                            const key = String(it.otherMedication || "");
                                            const selected = String(selectedGuardKey || "") === key;
                                            return (
                                                <button
                                                    key={`n-${idx}`}
                                                    type="button"
                                                    onClick={() => setSelectedGuardKey(key)}
                                                    style={{
                                                        left: `${pos.x}%`,
                                                        top: `${pos.y}%`,
                                                        transform: "translate(-50%, -50%)",
                                                    }}
                                                    className={cn(
                                                        "absolute w-[150px] sm:w-[180px] p-3 rounded-2xl border text-left backdrop-blur-md transition-all",
                                                        ui.node,
                                                        selected ? "ring-2 ring-white/40" : "hover:ring-2 hover:ring-white/15"
                                                    )}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className="text-sm font-semibold text-white line-clamp-2">
                                                            {key}
                                                        </p>
                                                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold border", ui.chip)}>
                                                            {ui.label}
                                                        </span>
                                                    </div>
                                                    {typeof it?.confidence === "number" && (
                                                        <p className="text-[11px] text-white/60 mt-1">
                                                            {t("Confidence", "الثقة")}: <span className="font-mono tabular-nums">{Math.round(it.confidence)}%</span>
                                                        </p>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {selectedGuardItem && (
                                        <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-white font-bold truncate">{selectedGuardItem.otherMedication}</p>
                                                    <p className="text-white/60 text-xs mt-1 truncate">
                                                        {selectedGuardItem.headline || t("Interaction assessment", "تقييم التداخل")}
                                                    </p>
                                                </div>
                                                <span className={cn("px-3 py-1 rounded-full text-xs font-semibold border", severityUi(selectedGuardItem.severity).chip)}>
                                                    {severityUi(selectedGuardItem.severity).label}
                                                </span>
                                            </div>

                                            {selectedGuardItem.summary && (
                                                <p className="text-white/80 text-sm mt-3 leading-relaxed">
                                                    {selectedGuardItem.summary}
                                                </p>
                                            )}

                                            {selectedGuardItem.mechanism && (
                                                <div className="mt-3 text-xs text-white/60">
                                                    <span className="text-white/80 font-semibold">{t("Mechanism", "الآلية")}: </span>
                                                    {selectedGuardItem.mechanism}
                                                </div>
                                            )}

                                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                                                {Array.isArray(selectedGuardItem.whatToDo) && selectedGuardItem.whatToDo.length > 0 && (
                                                    <div className="p-3 rounded-xl bg-black/20 border border-white/10">
                                                        <p className="text-white font-semibold text-xs mb-2">{t("What to do", "ماذا تفعل")}</p>
                                                        <ul className="space-y-1 text-white/70 text-sm">
                                                            {selectedGuardItem.whatToDo.slice(0, 6).map((s: string, i: number) => (
                                                                <li key={i}>• {s}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {Array.isArray(selectedGuardItem.monitoring) && selectedGuardItem.monitoring.length > 0 && (
                                                    <div className="p-3 rounded-xl bg-black/20 border border-white/10">
                                                        <p className="text-white font-semibold text-xs mb-2">{t("Monitoring", "المتابعة")}</p>
                                                        <ul className="space-y-1 text-white/70 text-sm">
                                                            {selectedGuardItem.monitoring.slice(0, 6).map((s: string, i: number) => (
                                                                <li key={i}>• {s}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {Array.isArray(selectedGuardItem.redFlags) && selectedGuardItem.redFlags.length > 0 && (
                                                    <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/15">
                                                        <p className="text-red-100 font-semibold text-xs mb-2">{t("Red flags", "علامات خطر")}</p>
                                                        <ul className="space-y-1 text-red-100/90 text-sm">
                                                            {selectedGuardItem.redFlags.slice(0, 6).map((s: string, i: number) => (
                                                                <li key={i}>• {s}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {interactionGuard?.disclaimer && (
                                        <p className="mt-3 text-[11px] text-white/45 leading-relaxed">
                                            {interactionGuard.disclaimer}
                                        </p>
                                    )}
                                </div>
                            )}

                            {data.personalized ? (
                                <div className="grid gap-3">
                                    {data.personalized.riskSummary && (
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm">
                                            {data.personalized.riskSummary}
                                        </div>
                                    )}

                                    {data.personalized.alerts && data.personalized.alerts.length > 0 && (
                                        <div className="grid gap-2">
                                            {data.personalized.alerts.slice(0, 6).map((a, i) => (
                                                <div key={i} className={cn(
                                                    "p-4 rounded-xl border",
                                                    String(a.severity || '').toLowerCase() === 'high'
                                                        ? "bg-red-500/10 border-red-500/20"
                                                        : String(a.severity || '').toLowerCase() === 'medium'
                                                            ? "bg-yellow-500/10 border-yellow-500/20"
                                                            : "bg-white/5 border-white/10"
                                                )}>
                                                    <p className="text-white font-semibold text-sm">
                                                        {a.title || t('Personalized Alert', 'تنبيه مخصص')}
                                                    </p>
                                                    {a.details && (
                                                        <p className="text-white/70 text-sm mt-1">{a.details}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : guardItems.length === 0 ? (
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm">
                                    {t(
                                        'Add your Private AI Profile to get personalized warnings (allergies, conditions, current meds).',
                                        'أضف ملفك الصحي الخاص للحصول على تحذيرات مخصصة (حساسية، أمراض مزمنة، أدوية حالية).'
                                    )}
                                    <div className="mt-2">
                                        <Link href="/profile" className="text-liquid-accent hover:underline text-sm font-medium">
                                            {t('Open Profile', 'فتح الملف الشخصي')}
                                        </Link>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>

                {/* AI Follow-up Tree */}
                <div className="p-5 sm:p-8 bg-black/10 border-t border-white/10">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-liquid-accent" />
                            <h3 className="text-lg font-bold text-white">{t(`Ask ${AI_DISPLAY_NAME}`, `اسال ${AI_DISPLAY_NAME}`)}</h3>
                        </div>
                        {plan === "ultra" && aiNodes.length > 0 && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setAiNodes([])}
                                className="border-white/15 text-white/70 hover:bg-white/10"
                            >
                                {t("Reset", "إعادة")}
                            </Button>
                        )}
                    </div>

                    {(!user || plan !== "ultra") ? (
                        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                            <div className="p-5 blur-sm opacity-60 pointer-events-none select-none">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {[
                                        { title: t("Alternative medication", "بدائل هذا الدواء"), subtitle: t("Safer options & same use", "بدائل أكثر أمانًا لنفس الاستخدام") },
                                        { title: t("Based on my profile", "حسب بياناتي الصحية"), subtitle: t("Allergies, conditions, meds", "حساسية + أمراض + أدوية") },
                                        { title: t("Against my history", "مقارنةً بسجلي"), subtitle: t("Memories + recent scans", "الذاكرة + آخر التحاليل") },
                                    ].map((card, idx) => (
                                        <div key={idx} className="p-4 rounded-xl border bg-black/20 border-white/10">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-white font-semibold text-sm">{card.title}</p>
                                                <Lock className="w-4 h-4 text-white/30" />
                                            </div>
                                            <p className="text-white/50 text-xs mt-1">{card.subtitle}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 grid gap-3">
                                    <div className="flex items-center gap-2 text-white/60 text-sm">
                                        <GitBranch className="w-4 h-4" />
                                        <span>{t("Decision path preview", "معاينة مسار القرار")}</span>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                                        <p className="text-white font-bold">{t("Step 1", "الخطوة 1")}</p>
                                        <p className="text-white/70 text-sm mt-2">{t("Ask a question → get an answer → choose the next step.", "اسأل سؤالًا → تحصل على إجابة → اختر الخطوة التالية.")}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center p-4">
                                <div className="w-full max-w-md p-5 rounded-2xl bg-black/70 border border-white/10 backdrop-blur-md">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                                            <Lock className="w-5 h-5 text-amber-200" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-white font-bold">
                                                {!user
                                                    ? t(`Login to unlock ${AI_DISPLAY_NAME}`, `سجّل الدخول لفتح ${AI_DISPLAY_NAME}`)
                                                    : t(`Upgrade to unlock ${AI_DISPLAY_NAME}`, `ترقية لفتح ${AI_DISPLAY_NAME}`)}
                                            </p>
                                            <p className="text-white/60 text-sm mt-1">
                                                {t(
                                                    "Interactive decision-tree questions tailored to your profile + history.",
                                                    "أسئلة تفاعلية بنظام شجرة مرتبطة بملفك الصحي + سجلك."
                                                )}
                                            </p>
                                            <div className="mt-3 flex items-center gap-2">
                                                {!user ? (
                                                    <Link href="/login">
                                                        <Button size="sm" className="gap-2">
                                                            {t("Log in", "تسجيل الدخول")}
                                                        </Button>
                                                    </Link>
                                                ) : (
                                                    <Link href="/pricing">
                                                        <Button size="sm" className="gap-2 bg-amber-500 hover:bg-amber-600 text-black">
                                                            {t("Upgrade to Ultra", "ترقية إلى ألترا")}
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <button
                                    disabled={aiLoading || !user}
                                    onClick={() => askAi({ preset: "alternative", reset: true })}
                                    className={cn(
                                        "p-4 rounded-xl border text-left transition-colors",
                                        "bg-white/5 border-white/10 hover:bg-white/10",
                                        (aiLoading || !user) && "opacity-60 cursor-not-allowed"
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-white font-semibold text-sm">{t("Alternative medication", "بدائل هذا الدواء")}</p>
                                        <ChevronRight className="w-4 h-4 text-white/40" />
                                    </div>
                                    <p className="text-white/50 text-xs mt-1">{t("Safer alternatives for the same use.", "بدائل أكثر أمانًا لنفس الاستخدام.")}</p>
                                </button>

                                <button
                                    disabled={aiLoading || !user}
                                    onClick={() => askAi({ preset: "personalized", reset: true })}
                                    className="p-4 rounded-xl border text-left transition-colors bg-white/5 border-white/10 hover:bg-white/10"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-white font-semibold text-sm">{t("Based on my profile", "حسب بياناتي الصحية")}</p>
                                        <ChevronRight className="w-4 h-4 text-white/40" />
                                    </div>
                                    <p className="text-white/50 text-xs mt-1">{t("Allergies, conditions, current meds.", "الحساسية والأمراض المزمنة والأدوية الحالية.")}</p>
                                </button>

                                <button
                                    disabled={aiLoading || !user}
                                    onClick={() => askAi({ preset: "history", reset: true })}
                                    className="p-4 rounded-xl border text-left transition-colors bg-white/5 border-white/10 hover:bg-white/10"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-white font-semibold text-sm">{t("Against my history", "مقارنةً بسجلي")}</p>
                                        <ChevronRight className="w-4 h-4 text-white/40" />
                                    </div>
                                    <p className="text-white/50 text-xs mt-1">{t("Memories + recent scans.", "الذاكرة + آخر التحاليل.")}</p>
                                </button>
                            </div>

                            {aiError && (
                                <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    {aiError}
                                </div>
                            )}

                            {aiNodes.length > 0 && (
                                <div className="mt-6 grid gap-4">
                                    <div className="flex items-center gap-2 text-white/60 text-sm">
                                        <GitBranch className="w-4 h-4" />
                                        <span>{t("Decision path", "مسار القرار")}</span>
                                    </div>

                                    <div className="relative pl-4 border-l border-white/10 space-y-4">
                                        {aiNodes.map((node, idx) => {
                                            const isLast = idx === aiNodes.length - 1;
                                            return (
                                                <div key={`${idx}-${node.title}`} className="relative">
                                                    <div className="absolute -left-[9px] top-3 w-4 h-4 rounded-full bg-liquid-primary/30 border border-liquid-primary/40" />
                                                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div>
                                                                <p className="text-white font-bold">{node.title}</p>
                                                                <p className="text-white/70 text-sm mt-2 whitespace-pre-wrap leading-relaxed">{node.answer}</p>
                                                            </div>
                                                        </div>

                                                        {node.keyPoints && node.keyPoints.length > 0 && (
                                                            <ul className="mt-4 space-y-1 text-white/70 text-sm">
                                                                {node.keyPoints.slice(0, 8).map((p, i) => (
                                                                    <li key={i}>• {p}</li>
                                                                ))}
                                                            </ul>
                                                        )}

                                                        {isLast && node.nextQuestions && node.nextQuestions.length > 0 && (
                                                            <div className="mt-5">
                                                                <p className="text-xs text-white/40 mb-2">{t("Next questions", "أسئلة تالية")}</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {node.nextQuestions.slice(0, 3).map((q) => (
                                                                        <Button
                                                                            key={q.id}
                                                                            size="sm"
                                                                            variant="outline"
                                                                            disabled={aiLoading}
                                                                            onClick={() => askAi({ question: q.question, reset: false })}
                                                                            className="border-white/15 text-white/80 hover:bg-white/10"
                                                                        >
                                                                            {q.title}
                                                                        </Button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {aiLoading && (
                                        <div className="text-xs text-white/40">{t("Thinking…", "جارٍ التفكير…")}</div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-white/5 border-t border-white/10 flex justify-between items-center">
                    <p className="text-xs text-white/30">
                        {t(
                            `* ${AI_DISPLAY_NAME} summary. Verify with a medical professional. FDA label used when available.`,
                            `* ملخص بواسطة ${AI_DISPLAY_NAME}. تحقّق مع مختص. تُستخدم بيانات FDA عند توفرها.`
                        )}
                    </p>
                    <div className="flex items-center gap-2 text-xs font-medium">
                        {savedToHistory ? (
                            <Link href="/dashboard/history" className="flex items-center gap-2 text-green-400 hover:underline">
                                <CheckCircle2 className="w-3 h-3" /> {t('Saved to History', 'تم الحفظ في السجل')}
                            </Link>
                        ) : (
                            <span className="text-white/40">{t('Not saved', 'لم يتم الحفظ')}</span>
                        )}
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};
