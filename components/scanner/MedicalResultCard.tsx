import { GlassCard } from "@/components/ui/GlassCard";
import { Activity, AlertTriangle, Info, Pill, ShieldAlert, Thermometer, Box, FileText, CheckCircle2, AlertOctagon, Clock, Sparkles, GitBranch, ChevronRight, Lock, Database, ExternalLink, ListTodo, Download, FileDown, Copy, Mic, MicOff, Send, MessageSquare, Bookmark, RotateCcw, Languages, Check, Lightbulb, Zap } from "lucide-react";
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
    summary?: string;
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

    // Enhanced Ask NEXUS AI state
    const [customQuestion, setCustomQuestion] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [copiedNodeIdx, setCopiedNodeIdx] = useState<number | null>(null);
    const [savedAnswers, setSavedAnswers] = useState<number[]>([]);
    const [showSimplified, setShowSimplified] = useState<Record<number, boolean>>({});
    const aiInputRef = useRef<HTMLTextAreaElement>(null);

    const [safetyTab, setSafetyTab] = useState<UltraSafetyTab>('interactions');
    const [safetyShowAll, setSafetyShowAll] = useState<Record<string, boolean>>({});
    const [showAllIngredients, setShowAllIngredients] = useState(false);
    const [showGuardGraph, setShowGuardGraph] = useState(false);

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

    const guardTopList = useMemo(() => {
        const sevOrder = (s: any) => (String(s || "").toLowerCase() === "danger" ? 2 : String(s || "").toLowerCase() === "caution" ? 1 : 0);
        return (guardItems as any[])
            .slice()
            .sort((a: any, b: any) => {
                const bySeverity = sevOrder(b?.severity) - sevOrder(a?.severity);
                if (bySeverity !== 0) return bySeverity;
                return Number(b?.confidence || 0) - Number(a?.confidence || 0);
            })
            .slice(0, 4);
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

    const guardSubjectRelationship = useMemo(() => {
        const fromMeta = String(meta?.subjectRelationship || "").trim();
        if (fromMeta) return fromMeta;
        const fromGuard = String((interactionGuard as any)?.subject?.relationship || "").trim();
        if (fromGuard) return fromGuard;
        return "";
    }, [interactionGuard, meta?.subjectRelationship]);

    const aiSubjectLabel = useMemo(() => {
        const name = guardSubjectName || (isArabic ? "أنت" : "You");
        const rel = guardSubjectRelationship;
        if (!rel) return name;
        return `${name} (${rel})`;
    }, [guardSubjectName, guardSubjectRelationship, isArabic]);

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

    type ActionTone = "danger" | "warn" | "info" | "success";
    type ActionCard = {
        id: string;
        tone: ActionTone;
        title: string;
        detail?: string;
        icon: JSX.Element;
        cta?: { label: string; href: string };
    };

    const actionCards = useMemo(() => {
        const isUltra = plan === "ultra";
        const compactList = (list: unknown, max: number) => {
            if (!Array.isArray(list)) return "";
            return (list as any[])
                .map((s) => String(s || "").trim())
                .filter(Boolean)
                .slice(0, max)
                .join(" • ");
        };

        const items: ActionCard[] = [];

        const topGuard = (guardItems as any[])
            .filter((it) => it && it.otherMedication)
            .slice()
            .sort((a: any, b: any) => {
                const sevOrder = (s: any) => (String(s || "").toLowerCase() === "danger" ? 2 : String(s || "").toLowerCase() === "caution" ? 1 : 0);
                const bySeverity = sevOrder(b?.severity) - sevOrder(a?.severity);
                if (bySeverity !== 0) return bySeverity;
                return Number(b?.confidence || 0) - Number(a?.confidence || 0);
            })[0];

        if (topGuard?.otherMedication) {
            const sev = String(topGuard.severity || "caution").toLowerCase();
            items.push({
                id: "guard-top",
                tone: sev === "danger" ? "danger" : sev === "safe" ? "success" : "warn",
                title: t(
                    `Possible interaction: ${String(topGuard.otherMedication)}`,
                    `تداخل محتمل: ${String(topGuard.otherMedication)}`
                ),
                detail: String(topGuard.summary || "").trim() || t("Tap Private Context for details.", "اضغط على سياقك الصحي الخاص للتفاصيل."),
                icon: <ShieldAlert className="w-4 h-4 text-white" />,
            });
        } else if (!isUltra) {
            items.push({
                id: "unlock-ultra-safety",
                tone: "info",
                title: t("Unlock Ultra Safety Pack", "افتح حزمة السلامة (ألترا)"),
                detail: t(
                    "Precautions, interactions, side effects, overdose guidance, and when to seek help.",
                    "احتياطات، تداخلات، آثار جانبية، إرشادات الجرعة الزائدة، ومتى تطلب المساعدة."
                ),
                icon: <Sparkles className="w-4 h-4 text-white" />,
                cta: { label: t("Upgrade", "ترقية"), href: "/pricing" },
            });
        }

        if (data.dosage) {
            items.push({
                id: "dose",
                tone: "info",
                title: t("How to take it", "طريقة الاستخدام"),
                detail: String(data.dosage || "").trim(),
                icon: <Thermometer className="w-4 h-4 text-white" />,
            });
        }

        const contraind = compactList(data.contraindications, 3);
        if (contraind) {
            items.push({
                id: "contraindications",
                tone: "danger",
                title: t("Avoid if any applies", "تجنّب إذا ينطبق عليك"),
                detail: contraind,
                icon: <AlertOctagon className="w-4 h-4 text-white" />,
            });
        }

        if (isUltra) {
            const seek = compactList(data.whenToSeekHelp, 3);
            if (seek) {
                items.push({
                    id: "seek-help",
                    tone: "danger",
                    title: t("Seek urgent help if", "اطلب مساعدة عاجلة إذا"),
                    detail: seek,
                    icon: <AlertTriangle className="w-4 h-4 text-white" />,
                });
            }
        }

        if (data.storage) {
            items.push({
                id: "storage",
                tone: "info",
                title: t("Storage", "الحفظ"),
                detail: String(data.storage || "").trim(),
                icon: <Box className="w-4 h-4 text-white" />,
            });
        }

        const productKind = String((data as any)?.productClassification?.kind || "").trim();
        if (productKind === "human_supplement" || productKind === "veterinary_drug" || productKind === "veterinary_supplement") {
            items.push({
                id: "product-kind",
                tone: "warn",
                title: t("Product type warning", "تنبيه نوع المنتج"),
                detail: t(
                    productKind === "human_supplement"
                        ? "This looks like a supplement; quality and interactions can vary."
                        : "This may be veterinary-related; confirm it is intended for humans.",
                    productKind === "human_supplement"
                        ? "يبدو كمكمّل غذائي؛ الجودة والتداخلات قد تختلف."
                        : "قد يكون بيطريًا؛ تأكد أنه مخصص للبشر."
                ),
                icon: <Info className="w-4 h-4 text-white" />,
            });
        }

        return items.slice(0, 5);
    }, [data, guardItems, plan, t]);

    const actionToneUi = (tone: ActionTone) => {
        switch (tone) {
            case "danger":
                return {
                    card: "bg-red-500/10 border-red-500/20",
                    icon: "bg-red-500/15 border-red-500/25 text-red-100",
                    title: "text-red-50",
                };
            case "warn":
                return {
                    card: "bg-amber-500/10 border-amber-500/20",
                    icon: "bg-amber-500/15 border-amber-500/25 text-amber-100",
                    title: "text-amber-50",
                };
            case "success":
                return {
                    card: "bg-emerald-500/10 border-emerald-500/20",
                    icon: "bg-emerald-500/15 border-emerald-500/25 text-emerald-100",
                    title: "text-emerald-50",
                };
            default:
                return {
                    card: "bg-white/5 border-white/10",
                    icon: "bg-white/5 border-white/10 text-white/80",
                    title: "text-white",
                };
        }
    };

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
                summary: String(payload?.summary || "").trim() || undefined,
                answer: String(payload?.answer || ""),
                keyPoints: Array.isArray(payload?.keyPoints) ? payload.keyPoints : [],
                nextQuestions: Array.isArray(payload?.nextQuestions) ? payload.nextQuestions : [],
            };

            setAiNodes((prev) => (params.reset ? [nextNode] : [...prev, nextNode]));

            const next = (nextNode.nextQuestions || [])
                .map((q: any, idx: number) => ({
                    id: String(q?.id || `q${idx + 1}`),
                    label: String(q?.title || "").trim() || t("Question", "سؤال"),
                    question: String(q?.question || "").trim(),
                }))
                .filter((q: any) => q.question)
                .slice(0, 4);

            if (next.length > 0) setAiSuggestions(next);
        } catch (e: any) {
            setAiError(e?.message || "Failed to get AI answer.");
        } finally {
            setAiLoading(false);
        }
    };

    // Copy answer to clipboard
    const copyAnswer = async (nodeIdx: number, text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedNodeIdx(nodeIdx);
            setTimeout(() => setCopiedNodeIdx(null), 2000);
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopiedNodeIdx(nodeIdx);
            setTimeout(() => setCopiedNodeIdx(null), 2000);
        }
    };

    // Toggle save answer (bookmark)
    const toggleSaveAnswer = (nodeIdx: number) => {
        setSavedAnswers(prev =>
            prev.includes(nodeIdx)
                ? prev.filter(i => i !== nodeIdx)
                : [...prev, nodeIdx]
        );
    };

    // Submit custom question
    const submitCustomQuestion = () => {
        const trimmed = customQuestion.trim();
        if (!trimmed || aiLoading) return;
        askAi({ question: trimmed, reset: aiNodes.length === 0 });
        setCustomQuestion('');
    };

    // Handle keyboard submit
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitCustomQuestion();
        }
    };

    // Voice input (Web Speech API)
    const toggleVoiceInput = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setAiError(t("Voice input not supported in this browser.", "الإدخال الصوتي غير مدعوم في هذا المتصفح."));
            return;
        }

        if (isListening) {
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = resultsLanguage === 'ar' ? 'ar-SA' : 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => {
            setIsListening(false);
            setAiError(t("Voice input failed. Try again.", "فشل الإدخال الصوتي. حاول مجدداً."));
        };
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setCustomQuestion(prev => prev + (prev ? ' ' : '') + transcript);
            aiInputRef.current?.focus();
        };

        recognition.start();
    };

    const fallbackSuggestions = useMemo(() => [
        { id: "s1", label: t("Side effects?", "الآثار الجانبية؟"), question: t("What are the common and serious side effects I should watch for?", "ما هي الآثار الجانبية الشائعة والخطيرة التي يجب مراقبتها؟") },
        { id: "s2", label: t("Dosage timing", "توقيت الجرعة"), question: t("When is the best time to take this medication?", "ما هو أفضل وقت لتناول هذا الدواء؟") },
        { id: "s3", label: t("Food interactions", "تفاعل مع الطعام"), question: t("Should I take this with food or on an empty stomach?", "هل يجب تناوله مع الطعام أم على معدة فارغة؟") },
        { id: "s4", label: t("Pregnancy safe?", "آمن للحامل؟"), question: t("Is this medication safe during pregnancy or breastfeeding?", "هل هذا الدواء آمن أثناء الحمل أو الرضاعة؟") },
    ], [t]);

    const [aiSuggestions, setAiSuggestions] = useState<Array<{ id: string; label: string; question: string }>>([]);
    const [aiSuggestionsKey, setAiSuggestionsKey] = useState<string>("");

    const suggestionChips = aiSuggestions.length > 0 ? aiSuggestions : fallbackSuggestions;

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            if (!user || plan !== "ultra") return;
            const subjectId = String(meta?.subjectProfileId || (interactionGuard as any)?.subject?.profileId || user.id).trim() || user.id;
            const key = `${subjectId}:${resultsLanguage}:${String(data?.drugName || "").trim()}`;
            if (key && key === aiSuggestionsKey && aiSuggestions.length > 0) return;

            setAiSuggestionsKey(key);

            try {
                const res = await fetch("/api/ai/tree", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        preset: "suggestions",
                        profileId: subjectId,
                        language: resultsLanguage,
                        analysis: analysisForAi,
                        path: [],
                    }),
                });
                const payload = await res.json().catch(() => ({}));
                if (!res.ok) return;

                const nextQuestions = Array.isArray(payload?.nextQuestions) ? payload.nextQuestions : [];
                const next = nextQuestions
                    .map((q: any, idx: number) => ({
                        id: String(q?.id || `q${idx + 1}`),
                        label: String(q?.title || "").trim() || t("Question", "سؤال"),
                        question: String(q?.question || "").trim(),
                    }))
                    .filter((q: any) => q.question)
                    .slice(0, 4);

                if (!cancelled && next.length > 0) setAiSuggestions(next);
            } catch {
                // ignore
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [aiSuggestions.length, aiSuggestionsKey, analysisForAi, data?.drugName, interactionGuard, meta?.subjectProfileId, plan, resultsLanguage, t, user]);


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

                    {actionCards.length > 0 && (
                        <div className="relative z-10 mt-4 p-4 rounded-2xl bg-white/5 border border-white/10">
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

                            <div className="grid gap-3 sm:grid-cols-2">
                                {actionCards.map((item) => {
                                    const ui = actionToneUi(item.tone);
                                    return (
                                        <div key={item.id} className={cn("p-4 rounded-2xl border", ui.card)}>
                                            <div className="flex items-start gap-3">
                                                <div className={cn("shrink-0 p-2 rounded-xl border", ui.icon)}>
                                                    {item.icon}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={cn("font-bold text-sm leading-snug", ui.title)}>{item.title}</p>
                                                    {item.detail && (
                                                        <p className="mt-1 text-white/70 text-xs leading-relaxed">
                                                            {item.detail}
                                                        </p>
                                                    )}
                                                    {item.cta && (
                                                        <div className="mt-3">
                                                            <Link href={item.cta.href}>
                                                                <Button size="sm" className="h-9 px-4 rounded-xl bg-amber-600 hover:bg-amber-500">
                                                                    {item.cta.label}
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
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

                                    <div className="mt-4 grid gap-2">
                                        {guardTopList.map((it: any) => {
                                            const ui = severityUi(it?.severity);
                                            const key = String(it?.otherMedication || "").trim();
                                            if (!key) return null;
                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedGuardKey(key);
                                                        setShowGuardGraph(true);
                                                    }}
                                                    className={cn(
                                                        "w-full p-4 rounded-2xl border text-left transition-colors",
                                                        "bg-white/5 border-white/10 hover:bg-white/10",
                                                        ui.node
                                                    )}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="text-white font-bold truncate">{key}</p>
                                                            <p className="text-white/60 text-xs mt-1 line-clamp-2">
                                                                {String(it?.headline || it?.summary || t("Interaction assessment", "تقييم التداخل"))}
                                                            </p>
                                                        </div>
                                                        <span className={cn("px-3 py-1 rounded-full text-xs font-semibold border shrink-0", ui.chip)}>
                                                            {ui.label}
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}

                                        <div className="flex flex-wrap items-center gap-2 pt-1">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setShowGuardGraph((v) => !v)}
                                                className="border-white/15 text-white/70 hover:bg-white/10"
                                            >
                                                {showGuardGraph ? t("Hide graph view", "إخفاء عرض الرسم") : t("Show graph view", "عرض الرسم")}
                                            </Button>
                                            <span className="text-xs text-white/40">
                                                {t("This is an AI risk screen; confirm with a clinician for high-risk combos.", "هذا فحص مخاطر بالذكاء الاصطناعي؛ أكد مع مختص عند وجود خطر.")}
                                            </span>
                                        </div>
                                    </div>

                                    {showGuardGraph && (
                                        <>
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
                                        </>
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

                {/* AI Follow-up Tree - ENHANCED */}
                <div data-export-ignore className="p-5 sm:p-8 bg-gradient-to-b from-black/20 to-black/5 border-t border-white/10">
                    {/* Header with animated gradient */}
                    <div className="flex items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                                <Sparkles className="w-5 h-5 text-purple-300" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    {t(`Ask ${AI_DISPLAY_NAME}`, `اسال ${AI_DISPLAY_NAME}`)}
                                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-200">
                                        {t("Beta", "تجريبي")}
                                    </span>
                                </h3>
                                <p className="text-white/40 text-xs mt-0.5">{t("Interactive medical Q&A", "أسئلة وأجوبة طبية تفاعلية")}</p>
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/45">
                                    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/70">
                                        {t("For:", "لـ:")} {aiSubjectLabel}
                                    </span>
                                    {meta?.hasPrivateProfile && (
                                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-200">
                                            {t("Profile context", "سياق الملف")}
                                        </span>
                                    )}
                                    {typeof meta?.medicationMemoriesCount === "number" && meta.medicationMemoriesCount > 0 && (
                                        <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-200">
                                            {t("Memories", "الذاكرة")}: {meta.medicationMemoriesCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        {plan === "ultra" && aiNodes.length > 0 && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    setAiNodes([]);
                                    setCustomQuestion('');
                                }}
                                className="border-white/15 text-white/70 hover:bg-white/10 gap-1.5"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                {t("Reset", "إعادة")}
                            </Button>
                        )}
                    </div>

                    {(!user || plan !== "ultra") ? (
                        /* Locked State - Premium Teaser */
                        <div className="relative overflow-hidden rounded-2xl ai-gradient-border">
                            <div className="p-6 blur-[2px] opacity-50 pointer-events-none select-none">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {[
                                        { icon: Zap, title: t("Alternative medication", "بدائل هذا الدواء"), subtitle: t("Safer options & same use", "بدائل أكثر أمانًا لنفس الاستخدام") },
                                        { icon: Lightbulb, title: t("Based on my profile", "حسب بياناتي الصحية"), subtitle: t("Allergies, conditions, meds", "حساسية + أمراض + أدوية") },
                                        { icon: MessageSquare, title: t("Against my history", "مقارنةً بسجلي"), subtitle: t("Memories + recent scans", "الذاكرة + آخر التحاليل") },
                                    ].map((card, idx) => (
                                        <div key={idx} className="p-4 rounded-xl border bg-black/40 border-white/10">
                                            <div className="flex items-center gap-2 mb-2">
                                                <card.icon className="w-4 h-4 text-purple-300" />
                                                <p className="text-white font-semibold text-sm">{card.title}</p>
                                            </div>
                                            <p className="text-white/50 text-xs">{card.subtitle}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                                    <div className="h-10 w-full ai-skeleton mb-2" />
                                    <div className="h-4 w-2/3 ai-skeleton" />
                                </div>
                            </div>

                            {/* Overlay CTA */}
                            <div className="absolute inset-0 flex items-center justify-center p-4 backdrop-blur-sm">
                                <div className="w-full max-w-md p-6 rounded-2xl ai-chat-bubble">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                                            <Lock className="w-6 h-6 text-amber-200" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-white font-bold text-lg">
                                                {!user
                                                    ? t(`Login to unlock ${AI_DISPLAY_NAME}`, `سجّل الدخول لفتح ${AI_DISPLAY_NAME}`)
                                                    : t(`Upgrade to unlock ${AI_DISPLAY_NAME}`, `ترقية لفتح ${AI_DISPLAY_NAME}`)}
                                            </p>
                                            <p className="text-white/60 text-sm mt-2 leading-relaxed">
                                                {t(
                                                    "Ask any question about this medication. Get personalized answers based on your health profile.",
                                                    "اسأل أي سؤال عن هذا الدواء. احصل على إجابات مخصصة حسب ملفك الصحي."
                                                )}
                                            </p>
                                            <div className="mt-4 flex items-center gap-3">
                                                {!user ? (
                                                    <Link href="/login">
                                                        <Button size="sm" className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0">
                                                            {t("Log in", "تسجيل الدخول")}
                                                        </Button>
                                                    </Link>
                                                ) : (
                                                    <Link href="/pricing">
                                                        <Button size="sm" className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold border-0">
                                                            <Sparkles className="w-4 h-4" />
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
                        /* Unlocked State - Full Ask NEXUS AI */
                        <div className="space-y-5">
                            {/* Custom Question Input - Premium */}
                            <div className="ai-gradient-border p-4">
                                <div className="relative">
                                    <textarea
                                        ref={aiInputRef}
                                        value={customQuestion}
                                        onChange={(e) => setCustomQuestion(e.target.value.slice(0, 500))}
                                        onKeyDown={handleKeyDown}
                                        placeholder={t("Ask anything about this medication...", "اسأل أي شيء عن هذا الدواء...")}
                                        className="ai-input resize-none min-h-[80px] pr-24"
                                        disabled={aiLoading}
                                        dir={isArabic ? 'rtl' : 'ltr'}
                                    />
                                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                        {/* Voice Input Button */}
                                        <button
                                            type="button"
                                            onClick={toggleVoiceInput}
                                            disabled={aiLoading}
                                            className={cn(
                                                "p-2 rounded-lg transition-all ai-voice-btn",
                                                isListening
                                                    ? "bg-red-500/20 text-red-400 listening"
                                                    : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                                            )}
                                            title={t("Voice input", "إدخال صوتي")}
                                        >
                                            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                        </button>
                                        {/* Submit Button */}
                                        <button
                                            type="button"
                                            onClick={submitCustomQuestion}
                                            disabled={aiLoading || !customQuestion.trim()}
                                            className={cn(
                                                "p-2 rounded-lg transition-all",
                                                customQuestion.trim()
                                                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                                                    : "bg-white/5 text-white/30"
                                            )}
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                {/* Character Counter */}
                                <div className="flex items-center justify-between mt-2 px-1">
                                    <p className="text-[11px] text-white/30">
                                        {t("Press Enter to send, Shift+Enter for new line", "اضغط Enter للإرسال، Shift+Enter لسطر جديد")}
                                    </p>
                                    <p className={cn("text-[11px]", customQuestion.length > 450 ? "text-amber-400" : "text-white/30")}>
                                        {customQuestion.length}/500
                                    </p>
                                </div>
                            </div>

                            {/* Suggested Questions (AI-generated when possible) */}
                            {suggestionChips.length > 0 && (
                                <div>
                                    <p className="text-xs text-white/40 mb-2">
                                        {aiNodes.length === 0 ? t("Suggested questions:", "أسئلة مقترحة:") : t("Suggested follow-ups:", "متابعة مقترحة:")}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {suggestionChips.map((suggestion) => (
                                            <button
                                                key={suggestion.id}
                                                type="button"
                                                onClick={() => {
                                                    setCustomQuestion(suggestion.question);
                                                    aiInputRef.current?.focus();
                                                }}
                                                disabled={aiLoading}
                                                className={cn(
                                                    "ai-chip",
                                                    aiSuggestions.length > 0 && suggestion.id === suggestionChips[0]?.id && "bg-purple-500/15 border-purple-500/25 text-white"
                                                )}
                                            >
                                                {suggestion.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Preset Buttons - Compact Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={aiLoading || !user}
                                    onClick={() => askAi({ preset: "alternative", reset: true })}
                                    className={cn(
                                        "ai-chat-bubble p-4 text-left transition-all",
                                        (aiLoading || !user) && "opacity-60 cursor-not-allowed"
                                    )}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Zap className="w-4 h-4 text-purple-300" />
                                        <p className="text-white font-semibold text-sm">{t("Alternatives", "البدائل")}</p>
                                    </div>
                                    <p className="text-white/50 text-xs">{t("Safer options for the same use.", "بدائل أكثر أمانًا لنفس الاستخدام.")}</p>
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={aiLoading || !user}
                                    onClick={() => askAi({ preset: "personalized", reset: true })}
                                    className="ai-chat-bubble p-4 text-left transition-all"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Lightbulb className="w-4 h-4 text-amber-300" />
                                        <p className="text-white font-semibold text-sm">{t("For My Profile", "حسب ملفي")}</p>
                                    </div>
                                    <p className="text-white/50 text-xs">{t("Personalized based on your health data.", "مخصص حسب بياناتك الصحية.")}</p>
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={aiLoading || !user}
                                    onClick={() => askAi({ preset: "history", reset: true })}
                                    className="ai-chat-bubble p-4 text-left transition-all"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-4 h-4 text-cyan-300" />
                                        <p className="text-white font-semibold text-sm">{t("Check History", "فحص السجل")}</p>
                                    </div>
                                    <p className="text-white/50 text-xs">{t("Against your medication memories.", "مقارنة بذاكرة أدويتك.")}</p>
                                </motion.button>
                            </div>

                            {/* Error Display */}
                            {aiError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-center gap-3"
                                >
                                    <AlertTriangle className="w-5 h-5 shrink-0" />
                                    <span>{aiError}</span>
                                    <button
                                        onClick={() => setAiError(null)}
                                        className="ml-auto text-red-300 hover:text-red-200"
                                    >
                                        ✕
                                    </button>
                                </motion.div>
                            )}

                            {/* Loading State - Skeleton */}
                            {aiLoading && aiNodes.length === 0 && (
                                <div className="ai-chat-bubble p-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="ai-thinking">
                                            <div className="ai-thinking-dot" />
                                            <div className="ai-thinking-dot" />
                                            <div className="ai-thinking-dot" />
                                        </div>
                                        <span className="text-white/60 text-sm">{t("Analyzing...", "جارٍ التحليل...")}</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="h-4 w-3/4 ai-skeleton" />
                                        <div className="h-4 w-full ai-skeleton" />
                                        <div className="h-4 w-5/6 ai-skeleton" />
                                        <div className="h-4 w-2/3 ai-skeleton" />
                                    </div>
                                </div>
                            )}

                            {/* Decision Tree - Enhanced */}
                            {aiNodes.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-white/50 text-sm">
                                        <GitBranch className="w-4 h-4" />
                                        <span>{t("Conversation", "المحادثة")}</span>
                                        <span className="text-white/30">•</span>
                                        <span className="text-white/30">{aiNodes.length} {t("responses", "ردود")}</span>
                                    </div>

                                    <div className="relative pl-5 border-l-2 border-purple-500/30 space-y-4">
                                        {aiNodes.map((node, idx) => {
                                            const isLast = idx === aiNodes.length - 1;
                                            const isCopied = copiedNodeIdx === idx;
                                            const isSaved = savedAnswers.includes(idx);

                                            return (
                                                <motion.div
                                                    key={`${idx}-${node.title}`}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.1 }}
                                                    className="relative ai-node-enter"
                                                >
                                                    {/* Timeline Node */}
                                                    <div className="absolute -left-[11px] top-5 w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-black flex items-center justify-center">
                                                        <span className="text-[10px] text-white font-bold">{idx + 1}</span>
                                                    </div>

                                                    {/* Answer Card */}
                                                    <div className={cn("ai-chat-bubble p-5", isCopied && "ai-copy-flash")}>
                                                        {/* Header with Actions */}
                                                        <div className="flex items-start justify-between gap-3 mb-3">
                                                            <p className="text-white font-bold flex items-center gap-2">
                                                                <MessageSquare className="w-4 h-4 text-purple-300" />
                                                                {node.title}
                                                            </p>
                                                            <div className="flex items-center gap-1">
                                                                {/* Copy Button */}
                                                                <button
                                                                    onClick={() => copyAnswer(
                                                                        idx,
                                                                        `${node.title}\n\n${node.summary ? `TL;DR: ${node.summary}\n\n` : ""}${node.answer}\n\n${node.keyPoints?.length ? `Key points:\n• ${node.keyPoints.join('\n• ')}` : ""}`
                                                                    )}
                                                                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                                                                    title={t("Copy", "نسخ")}
                                                                >
                                                                    {isCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                                                </button>
                                                                {/* Bookmark Button */}
                                                                <button
                                                                    onClick={() => toggleSaveAnswer(idx)}
                                                                    className={cn(
                                                                        "p-1.5 rounded-lg hover:bg-white/10 transition-colors",
                                                                        isSaved ? "text-amber-400" : "text-white/40 hover:text-white"
                                                                    )}
                                                                    title={t("Save", "حفظ")}
                                                                >
                                                                    <Bookmark className={cn("w-4 h-4", isSaved && "fill-current")} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="mt-2 flex items-center justify-between gap-3">
                                                            <div className="flex items-center gap-2 text-xs text-white/40">
                                                                <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
                                                                <span>{t("Read the key points first", "اقرأ النقاط الرئيسية أولاً")}</span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowSimplified((p) => ({ ...p, [idx]: !p[idx] }))}
                                                                className="text-xs text-white/60 hover:text-white transition-colors flex items-center gap-1"
                                                            >
                                                                <span>{showSimplified[idx] ? t("Hide details", "إخفاء التفاصيل") : t("Show details", "عرض التفاصيل")}</span>
                                                                <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", showSimplified[idx] ? "rotate-90" : "rotate-0")} />
                                                            </button>
                                                        </div>

                                                        {node.summary && (
                                                            <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                                                <p className="text-[11px] text-amber-200/80 font-semibold mb-1">{t("TL;DR", "الخلاصة")}</p>
                                                                <p className="text-white/85 text-sm leading-relaxed">{node.summary}</p>
                                                            </div>
                                                        )}

                                                        {node.keyPoints && node.keyPoints.length > 0 && (
                                                            <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10">
                                                                <p className="text-xs text-white/40 mb-2 flex items-center gap-1">
                                                                    <Lightbulb className="w-3 h-3" />
                                                                    {t("Key Points", "النقاط الرئيسية")}
                                                                </p>
                                                                <ul className="grid gap-2">
                                                                    {node.keyPoints.slice(0, 7).map((p, i) => (
                                                                        <li key={i} className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-white/80 text-sm leading-relaxed">
                                                                            <span className="text-amber-300 font-bold mr-1">{i + 1}.</span>
                                                                            {p}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}

                                                        {showSimplified[idx] && (
                                                            <div className="mt-4 p-4 rounded-xl bg-black/20 border border-white/10">
                                                                <p className="text-white/80 text-sm whitespace-pre-wrap leading-relaxed ai-typing">
                                                                    {node.answer}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Next Questions - Only on Last Node */}
                                                        {isLast && node.nextQuestions && node.nextQuestions.length > 0 && (
                                                            <div className="mt-5 pt-4 border-t border-white/10">
                                                                <p className="text-xs text-white/40 mb-3">{t("Continue with (recommended first):", "تابع مع (الأفضل أولاً):")}</p>
                                                                <div className="grid gap-3">
                                                                    {node.nextQuestions.slice(0, 1).map((q) => (
                                                                        <motion.button
                                                                            key={q.id}
                                                                            whileHover={{ scale: 1.01 }}
                                                                            whileTap={{ scale: 0.99 }}
                                                                            disabled={aiLoading}
                                                                            onClick={() => askAi({ question: q.question, reset: false })}
                                                                            className="w-full text-left p-4 rounded-2xl bg-gradient-to-r from-purple-500/15 via-pink-500/10 to-transparent border border-purple-500/25 hover:border-purple-500/40 transition-colors"
                                                                        >
                                                                            <p className="text-white font-bold text-sm flex items-center gap-2">
                                                                                <Sparkles className="w-4 h-4 text-purple-300" />
                                                                                {q.title}
                                                                            </p>
                                                                            <p className="mt-1 text-white/60 text-xs leading-relaxed">
                                                                                {q.question}
                                                                            </p>
                                                                        </motion.button>
                                                                    ))}

                                                                    <div className="flex flex-wrap gap-2">
                                                                        {node.nextQuestions.slice(1, 4).map((q) => (
                                                                            <motion.button
                                                                                key={q.id}
                                                                                whileHover={{ scale: 1.02 }}
                                                                                whileTap={{ scale: 0.98 }}
                                                                                disabled={aiLoading}
                                                                                onClick={() => askAi({ question: q.question, reset: false })}
                                                                                className="ai-chip flex items-center gap-1.5"
                                                                                title={q.question}
                                                                            >
                                                                                <ChevronRight className="w-3 h-3" />
                                                                                {q.title}
                                                                            </motion.button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>

                                    {/* Loading indicator for follow-up */}
                                    {aiLoading && (
                                        <div className="pl-5 border-l-2 border-purple-500/30">
                                            <div className="ai-chat-bubble p-4 flex items-center gap-3">
                                                <div className="ai-thinking">
                                                    <div className="ai-thinking-dot" />
                                                    <div className="ai-thinking-dot" />
                                                    <div className="ai-thinking-dot" />
                                                </div>
                                                <span className="text-white/50 text-sm">{t("Thinking...", "جارٍ التفكير...")}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-white/5 border-t border-white/10 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div className="flex flex-col gap-1">
                        <p className="text-xs text-white/30">
                            {t(
                                "* Medication information summary. Verify with a medical professional.",
                                "* ملخص معلومات دوائية. تحقّق مع مختص."
                            )}
                        </p>
                        <p data-export-ignore className="text-xs text-white/30">
                            {t(
                                `* ${AI_DISPLAY_NAME} summary. Verify with a medical professional. FDA label used when available.`,
                                `* ملخص بواسطة ${AI_DISPLAY_NAME}. تحقّق مع مختص. تُستخدم بيانات FDA عند توفرها.`
                            )}
                        </p>
                    </div>
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
