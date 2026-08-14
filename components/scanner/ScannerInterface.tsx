"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload,
    X,
    ScanLine,
    FileText,
    Brain,
    CheckCircle,
    Loader2,
    History,
    Sparkles,
    Zap,
    Timer,
    AlertCircle,
    AlertTriangle,
    ChevronRight,
    Users,
    Camera,
    Image as ImageIcon,
    ShieldAlert,
    RefreshCw,
    RotateCw,
    Sun,
    SlidersHorizontal,
    Layers,
    Pill,
    Package,
    FlaskConical,
    Droplets,
    Flame,
    Scissors,
    HeartPulse,
    Stethoscope,
    Activity,
    Bandage,
} from 'lucide-react';
import { getLocalScans, saveLocalScan, mergeHistoryItems } from "@/lib/localHistory";
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { MedicalResultCard } from './MedicalResultCard';
import { WoundResultCard } from './WoundResultCard';
import { InteractionMatrixModal } from './InteractionMatrixModal';
import { useSettings } from '@/context/SettingsContext';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { AI_DISPLAY_NAME } from '@/lib/ai/branding';
import { useScan } from '@/context/ScanContext';

interface ImageQualityInfo {
    width: number;
    height: number;
    sizeMB: number;
    isHighClarity: boolean;
    isAcceptable: boolean;
    isTooSmall: boolean;
}

export const ScannerInterface = () => {
    const { user, plan, loading } = useUser();
    const {
        file,
        previewSrc,
        isScanning,
        steps,
        totalDuration,
        finalResult,
        errorMsg,
        errorAction,
        subjectProfileId,
        setSubjectProfileId,
        rotation,
        setRotation,
        brightness,
        setBrightness,
        contrast,
        setContrast,
        highContrastMode,
        setHighContrastMode,
        setFile,
        resetScan,
        startScan,
        detectedScanType,
        setDetectedScanType,
        isWoundScan,
    } = useScan();
    const { resultsLanguage } = useSettings();

    const isArabic = resultsLanguage === 'ar';
    const t = (en: string, ar: string) => (isArabic ? ar : en);
    const [isMatrixOpen, setIsMatrixOpen] = useState(false);

    const supabaseRef = useRef<any>(null);
    if (!supabaseRef.current) supabaseRef.current = createClient();
    const supabase = supabaseRef.current;

    const [recentHistory, setRecentHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [qualityInfo, setQualityInfo] = useState<ImageQualityInfo | null>(null);

    const [careProfiles, setCareProfiles] = useState<Array<{ id: string; display_name: string; relationship?: string | null }>>([]);
    const [careLoading, setCareLoading] = useState(false);
    const [carePickerOpen, setCarePickerOpen] = useState(false);
    const [careTempId, setCareTempId] = useState<string | null>(null);
    const isLocalDevUser = process.env.NODE_ENV === "development" && user?.id === "local-dev-user";

    const cameraInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const handleDirectFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            analyzeImageQuality(selectedFile);
            setFile(selectedFile);
        }
    };

    const triggerCamera = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (cameraInputRef.current) {
            cameraInputRef.current.value = "";
            cameraInputRef.current.click();
        }
    };

    const triggerGallery = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (galleryInputRef.current) {
            galleryInputRef.current.value = "";
            galleryInputRef.current.click();
        }
    };

    // Analyze image resolution upon selection
    const analyzeImageQuality = (imgFile: File) => {
        const sizeMB = Number((imgFile.size / (1024 * 1024)).toFixed(2));
        const img = new Image();
        const objectUrl = URL.createObjectURL(imgFile);
        img.onload = () => {
            const width = img.naturalWidth || img.width;
            const height = img.naturalHeight || img.height;
            const isHighClarity = width >= 800 && height >= 600;
            const isAcceptable = (width >= 350 && height >= 350) && !isHighClarity;
            const isTooSmall = width < 350 || height < 350;

            setQualityInfo({
                width,
                height,
                sizeMB,
                isHighClarity,
                isAcceptable,
                isTooSmall,
            });
            URL.revokeObjectURL(objectUrl);
        };
        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            setQualityInfo(null);
        };
        img.src = objectUrl;
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles[0]) {
            analyzeImageQuality(acceptedFiles[0]);
            setFile(acceptedFiles[0]);
        }
    }, [setFile]);

    const fetchRecentHistory = useCallback(async () => {
        const localItems = getLocalScans();
        if (!user?.id) {
            setRecentHistory(localItems.slice(0, 5));
            return;
        }

        setHistoryLoading(true);
        try {
            const combined: any[] = [];

            // 1. Medications
            const { data: medData } = await supabase
                .from("medication_history")
                .select("id, drug_name, manufacturer, created_at, analysis_json")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(5);

            if (medData) {
                combined.push(...medData.map((m: any) => ({ ...m, type: "medication" })));
            }

            // 2. Wounds
            try {
                const { data: woundData } = await supabase
                    .from("wound_scans")
                    .select("id, wound_title, wound_type, severity, created_at, analysis_json")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false })
                    .limit(5);

                if (woundData) {
                    combined.push(...woundData.map((w: any) => ({ ...w, type: "wound", drug_name: w.wound_title, manufacturer: w.wound_type })));
                }
            } catch (wErr) {
                console.warn("Wound scans history error:", wErr);
            }

            const merged = mergeHistoryItems(combined, localItems);
            setRecentHistory(merged.slice(0, 5));
        } catch {
            setRecentHistory(localItems.slice(0, 5));
        } finally {
            setHistoryLoading(false);
        }
    }, [supabase, user?.id]);

    useEffect(() => {
        fetchRecentHistory();
    }, [fetchRecentHistory]);

    useEffect(() => {
        if (finalResult) {
            saveLocalScan(finalResult, subjectProfileId);
            fetchRecentHistory();
        }
    }, [finalResult, fetchRecentHistory, subjectProfileId]);

    const fetchCareProfiles = useCallback(async () => {
        if (!user?.id) {
            setCareProfiles([]);
            return;
        }

        if (isLocalDevUser) {
            setCareProfiles([{ id: user.id, display_name: String(user.email || "Local Dev"), relationship: "self" }]);
            return;
        }

        setCareLoading(true);
        try {
            const res = await supabase
                .from("care_profiles")
                .select("id, display_name, relationship, created_at")
                .eq("owner_user_id", user.id)
                .order("created_at", { ascending: true });

            if (res.error) {
                setCareProfiles([{ id: user.id, display_name: String(user.email || "Me"), relationship: "self" }]);
                return;
            }

            const rows: Array<{ id: string; display_name: string; relationship?: string | null }> = (res.data || []).map((r: any) => ({
                id: String(r.id),
                display_name: String(r.display_name || "Me"),
                relationship: r.relationship ?? null,
            }));

            rows.sort((a, b) => {
                const aSelf = a.id === user.id || a.relationship === "self";
                const bSelf = b.id === user.id || b.relationship === "self";
                if (aSelf && !bSelf) return -1;
                if (!aSelf && bSelf) return 1;
                return a.display_name.localeCompare(b.display_name);
            });

            setCareProfiles(rows.length ? rows : [{ id: user.id, display_name: String(user.email || "Me"), relationship: "self" }]);
        } finally {
            setCareLoading(false);
        }
    }, [isLocalDevUser, supabase, user?.email, user?.id]);

    useEffect(() => {
        fetchCareProfiles();
    }, [fetchCareProfiles]);

    const { getRootProps, getInputProps, isDragActive, open: openFileDialog } = useDropzone({
        onDrop,
        accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
        maxFiles: 1,
        noClick: false,
    });

    useEffect(() => {
        if (finalResult && user?.id) {
            fetchRecentHistory();
        }
    }, [finalResult, fetchRecentHistory, user?.id]);

    useEffect(() => {
        if (!user?.id) return;
        if (!subjectProfileId) {
            setSubjectProfileId(user.id);
            return;
        }
        const exists = careProfiles.some((p) => p.id === subjectProfileId);
        if (!exists && careProfiles.length > 0) {
            setSubjectProfileId(careProfiles[0].id);
        }
    }, [careProfiles, setSubjectProfileId, subjectProfileId, user?.id]);

    const activeCareProfile = careProfiles.find((p) => p.id === (subjectProfileId || user?.id)) || null;

    const openCarePickerAndStart = () => {
        if (!user?.id) return;
        const effective = subjectProfileId || user.id;
        if (plan === "ultra" && careProfiles.length > 1) {
            setCareTempId(effective);
            setCarePickerOpen(true);
            return;
        }
        setSubjectProfileId(effective);
        void startScan(effective);
    };

    const confirmCarePicker = () => {
        if (!user?.id) return;
        const chosen = careTempId || user.id;
        setCarePickerOpen(false);
        setSubjectProfileId(chosen);
        void startScan(chosen);
    };

    // Progress Timeline Component
    const Timeline = () => {
        const totalStepsCount = steps.length || 1;
        const doneCount = steps.filter((s) => s.status === "done").length;
        const runningIndex = steps.findIndex((s) => s.status === "running");
        const hasError = steps.some((s) => s.status === "error") || Boolean(errorMsg);

        const progress = (doneCount + (runningIndex !== -1 && isScanning ? 0.5 : 0)) / totalStepsCount;
        const percent = Math.max(0, Math.min(100, Math.round(progress * 100)));

        const statusLabel = hasError
            ? t("Quality Check", "تحقق من الجودة")
            : isScanning
                ? t("Analyzing", "جارٍ الفحص")
                : t("Ready", "جاهز");

        return (
            <div className="w-full lg:mr-12 relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10 rounded-3xl blur-xl" />

                <div className="relative bg-black/50 backdrop-blur-xl rounded-3xl p-5 sm:p-7 border border-white/10 shadow-2xl">
                    {/* Header */}
                    <div className="relative">
                        <div className="relative flex items-start justify-between gap-3 sm:gap-4 bg-white/[0.03] backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 sm:gap-3 mb-1.5">
                                    <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-400/30">
                                        <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300" />
                                    </div>
                                    <h3 className="text-white font-bold text-base sm:text-lg">
                                        {AI_DISPLAY_NAME} Engine
                                    </h3>
                                </div>
                                <p className="text-xs text-white/60 leading-relaxed">
                                    {t(
                                        "Extracting active substances and verifying safety profile.",
                                        "قراءة المواد الفعالة والتحقق من التداخلات والسلامة الدوائية."
                                    )}
                                </p>
                            </div>

                            <div className="shrink-0 flex flex-col items-end gap-1.5">
                                <div className={cn(
                                    "px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-sm",
                                    hasError
                                        ? "bg-amber-500/20 text-amber-200 border-amber-400/40"
                                        : isScanning
                                            ? "bg-cyan-500/20 text-cyan-100 border-cyan-400/40 animate-pulse"
                                            : "bg-emerald-500/20 text-emerald-100 border-emerald-400/40"
                                )}>
                                    <span>{statusLabel}</span>
                                </div>

                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-full border border-white/10">
                                    <Timer className="w-3.5 h-3.5 text-cyan-300" />
                                    <span className="text-white font-mono text-xs font-semibold tabular-nums">
                                        {`${totalDuration}s`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-5">
                        <div className="flex items-center justify-between text-xs text-white/60 mb-2">
                            <span className="font-semibold">{t("Progress", "نسبة الإنجاز")}</span>
                            <span className="font-mono font-bold tabular-nums text-cyan-300">{percent}%</span>
                        </div>

                        <div className="relative h-2.5 rounded-full bg-white/10 overflow-hidden border border-white/10">
                            <div
                                className="absolute inset-y-0 start-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 rounded-full transition-all duration-500"
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                    </div>

                    {/* Steps Timeline */}
                    <div className="relative space-y-3 pl-1 mt-6">
                        {steps.map((step, index) => {
                            const isDone = step.status === 'done';
                            const isRunning = step.status === 'running';
                            const isError = step.status === 'error';

                            const seconds = isDone && typeof step.durationMs === "number"
                                ? `${(step.durationMs / 1000).toFixed(1)}s`
                                : isRunning && typeof step.startTime === "number"
                                    ? `${((Date.now() - step.startTime) / 1000).toFixed(1)}s`
                                    : "—";

                            return (
                                <div key={step.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center border text-xs font-bold shrink-0",
                                            isDone ? "border-emerald-400 bg-emerald-500/20 text-emerald-300" :
                                            isRunning ? "border-cyan-400 bg-cyan-500/20 text-cyan-300 animate-pulse" :
                                            isError ? "border-amber-400 bg-amber-500/20 text-amber-300" :
                                            "border-white/20 text-white/40"
                                        )}>
                                            {isDone ? <CheckCircle className="w-4 h-4" /> :
                                             isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                             isError ? <AlertTriangle className="w-4 h-4" /> :
                                             index + 1}
                                        </div>
                                        <span className={cn("text-xs sm:text-sm font-semibold truncate", isDone ? "text-white" : isRunning ? "text-cyan-200" : "text-white/50")}>
                                            {step.label}
                                        </span>
                                    </div>
                                    <span className="text-xs font-mono font-bold text-cyan-300">{seconds}</span>
                                </div>
                            );
                        })}

                        {/* Blurry / Non-Medical Quality Feedback Alert */}
                        {errorMsg && (
                            <div className="mt-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-amber-200 shadow-xl">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                    <div className="space-y-2 flex-1">
                                        <p className="text-xs sm:text-sm font-bold text-white">
                                            {t("Image Quality Notice", "تنبيه جودة ووضوح الصورة")}
                                        </p>
                                        <p className="text-xs text-amber-200/90 leading-relaxed">
                                            {errorMsg}
                                        </p>

                                        {/* Action Buttons to Retry with Clearer Photo */}
                                        <div className="pt-2 flex flex-wrap gap-2">
                                            <button
                                                onClick={() => {
                                                    resetScan();
                                                    setTimeout(() => openFileDialog(), 100);
                                                }}
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors shadow-md"
                                            >
                                                <Camera className="w-3.5 h-3.5" />
                                                <span>{t("Upload Clearer Photo", "رفع صورة أوضح للدواء")}</span>
                                            </button>

                                            <Button
                                                onClick={resetScan}
                                                size="sm"
                                                variant="outline"
                                                className="border-white/20 text-white hover:bg-white/10 text-xs"
                                            >
                                                {t("Cancel", "إلغاء")}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (finalResult && !isScanning) {
        if (finalResult.scanType === "wound") {
            return (
                <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-500 p-0 sm:p-4">
                    <div className="w-full flex flex-col sm:flex-row justify-between items-center mb-6 max-w-4xl gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                                <CheckCircle className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {t("Clinical Skin & Health Assessment Complete", "اكتمل الفحص السريري للجلد والإصابة")}
                                </h2>
                                <p className="text-white/50 text-sm">
                                    {t("Processed in", "استغرق الفحص")} {totalDuration}s
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                            <Button onClick={resetScan} variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                                {t("Scan Another", "فحص جديد")}
                            </Button>
                        </div>
                    </div>
                    <WoundResultCard result={finalResult} scannedImage={previewSrc} onResetScan={resetScan} />
                </div>
            );
        }

        return (
            <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-500 p-0 sm:p-4">
                <div className="w-full flex flex-col sm:flex-row justify-between items-center mb-6 max-w-4xl gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                            <CheckCircle className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                {t("Analysis Complete", "اكتمل الفحص والتحليل الطبي")}
                            </h2>
                            <p className="text-white/50 text-sm">
                                {t("Processed in", "استغرق الفحص")} {totalDuration}s
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                        <Link href="/dashboard/history">
                            <Button variant="outline" size="sm" className="gap-2 border-white/20 text-white hover:bg-white/10">
                                <History className="w-4 h-4" /> {t("History", "السجل")}
                            </Button>
                        </Link>
                        <Button onClick={resetScan} variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                            {t("Analyze Another", "فحص دواء آخر")}
                        </Button>
                    </div>
                </div>
                <MedicalResultCard data={finalResult} />
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-6 relative p-2 sm:p-3 lg:p-4 overflow-y-auto">

            {/* Hidden Inputs for Direct Camera & Gallery Trigger */}
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleDirectFileChange}
            />
            <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleDirectFileChange}
            />

            {/* Profile Selection Modal */}
            <AnimatePresence>
                {carePickerOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                        onClick={() => setCarePickerOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.98, y: 8, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.98, y: 8, opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            className="w-full max-w-lg"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <GlassCard className="p-6 sm:p-7" hoverEffect={false}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 shrink-0">
                                            <Users className="w-5 h-5 text-cyan-200" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-white font-bold text-lg">{t("Who is this scan for?", "لمن هذا الفحص؟")}</p>
                                            <p className="text-white/55 text-sm mt-1">
                                                {t(
                                                    "Choose the profile to personalize results and save History/Memories correctly.",
                                                    "اختر الملف لضبط التخصيص وحفظ السجل/الذاكرة للشخص الصحيح."
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setCarePickerOpen(false)}
                                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="mt-5 grid gap-2">
                                    {careLoading ? (
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {t("Loading profiles…", "جارٍ تحميل الملفات…")}
                                        </div>
                                    ) : (
                                        careProfiles.map((p) => {
                                            const selected = (careTempId || "") === p.id;
                                            return (
                                                <button
                                                    key={p.id}
                                                    onClick={() => setCareTempId(p.id)}
                                                    className={cn(
                                                        "w-full text-left p-4 rounded-xl border transition-colors",
                                                        selected
                                                            ? "bg-cyan-500/10 border-cyan-500/25"
                                                            : "bg-white/5 border-white/10 hover:bg-white/10"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="text-white font-semibold truncate">{p.display_name}</p>
                                                            <p className="text-white/45 text-xs mt-1 truncate">
                                                                {p.relationship ? String(p.relationship) : p.id === user?.id ? t("self", "أنا") : t("family", "عائلة")}
                                                            </p>
                                                        </div>
                                                        <div className={cn(
                                                            "w-6 h-6 rounded-full border flex items-center justify-center shrink-0",
                                                            selected ? "border-cyan-400 text-cyan-200" : "border-white/15 text-white/30"
                                                        )}>
                                                            {selected ? <CheckCircle className="w-4 h-4" /> : <span className="text-[10px] font-bold">•</span>}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>

                                <div className="mt-5 flex items-center justify-between gap-3">
                                    <button
                                        onClick={() => setCarePickerOpen(false)}
                                        className="text-sm text-white/60 hover:text-white transition-colors"
                                    >
                                        {t("Cancel", "إلغاء")}
                                    </button>
                                    <Button onClick={confirmCarePicker} disabled={!careTempId || isScanning} variant="primary" className="gap-2 px-6 font-bold">
                                        <ScanLine className="w-4 h-4" />
                                        <span>{t("Start Analysis Now", "ابدأ الفحص الآن")}</span>
                                    </Button>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Mode Switcher Tab (Emoji-Free & Modern Icons) ── */}
            <div className="w-full flex items-center justify-center">
                <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-lg">
                    <button
                        type="button"
                        onClick={() => setDetectedScanType("auto")}
                        className={cn(
                            "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                            detectedScanType === "auto"
                                ? "bg-white text-slate-950"
                                : "text-slate-400 hover:text-white"
                        )}
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{t("Auto Detect", "الوضع التلقائي الذكي")}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setDetectedScanType("medication")}
                        className={cn(
                            "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                            detectedScanType === "medication"
                                ? "bg-cyan-500 text-slate-950"
                                : "text-slate-400 hover:text-white"
                        )}
                    >
                        <Pill className="w-3.5 h-3.5" />
                        <span>{t("Medications", "أدوية وروشتات")}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setDetectedScanType("wound")}
                        className={cn(
                            "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                            detectedScanType === "wound"
                                ? "bg-cyan-500 text-slate-950"
                                : "text-slate-400 hover:text-white"
                        )}
                    >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>{t("Skin & Lesions", "فحص الجلد والإصابات")}</span>
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {!previewSrc && (
                    <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-5xl grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
                        
                        {/* ── Main Dropzone Area ── */}
                        <div className="flex flex-col gap-4">
                            <div {...getRootProps()} className={cn(
                                "relative min-h-[320px] sm:min-h-[350px] border-2 border-dashed rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group overflow-hidden flex-1",
                                isDragActive
                                    ? "border-cyan-400 bg-[#080D1A]"
                                    : "border-white/15 hover:border-cyan-400/50 hover:bg-[#080D1A]/50 bg-[#080D1A]/75 backdrop-blur-2xl"
                            )}>
                                <input {...getInputProps()} />

                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4 shadow-sm border bg-[#0C1324] border-white/[0.08] text-cyan-300">
                                    {detectedScanType === "wound" ? (
                                        <Stethoscope className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400" />
                                    ) : (
                                        <ScanLine className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-300" />
                                    )}
                                </div>

                                <h3 className="text-lg sm:text-xl font-black text-white mb-2 tracking-tight">
                                    {detectedScanType === "wound"
                                        ? t("Capture skin, facial photo, lesion, or wound", "التقط صورة للوجه، الجلد، الحبوب، أو الإصابات")
                                        : detectedScanType === "medication"
                                        ? t("Upload medication box or prescription photo", "ارفع صورة ملصق علبة الدواء أو الروشتة")
                                        : t("Upload medication, prescription, skin, or wound photo", "ارفع صورة الدواء، الروشتة، أو فحص الجلد والإصابات")}
                                </h3>

                                <p className="text-slate-300 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                                    {detectedScanType === "wound"
                                        ? t(
                                            "Clinical AI diagnosis: Skin types, acne, warts, corns, burns, eczema, and bodily trauma with step-by-step care.",
                                            "تشخيص سريري متكامل: تحليل نوع البشرة، حب الشباب، عين السمكة، الكالو، الحروق، الإكزيما، والجروح مع بروتوكول عناية مفصل."
                                        )
                                        : detectedScanType === "medication"
                                        ? t(
                                            "Clear focus on medication brand name, strength (mg/ml), and instructions for high precision.",
                                            "تأكد من تركيز الكاميرا على اسم الدواء التجاري، تركيز المادة الفعالة، والتعليمات الطبية بدقة."
                                        )
                                        : t(
                                            "AI automatically identifies medications, prescriptions, or skin conditions. (High-Res JPEG, PNG, WEBP)",
                                            "يتعرف النظام تلقائياً على نوع الصورة (دواء، روشتة، أو فحص جلدي وسريري) ويوجه الفحص بدقة فائقة."
                                        )}
                                </p>

                                {/* Explicit Choice Buttons: Camera vs Gallery */}
                                <div className="mt-5 flex flex-wrap items-center justify-center gap-3 w-full max-w-md z-20">
                                    <button
                                        type="button"
                                        onClick={triggerCamera}
                                        className={cn(
                                            "flex-1 min-w-[140px] inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl text-white font-bold text-xs sm:text-sm shadow-sm active:scale-[0.98] transition-all duration-150",
                                            detectedScanType === "wound" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-cyan-600 hover:bg-cyan-500"
                                        )}
                                    >
                                        <Camera className="w-4.5 h-4.5 shrink-0" />
                                        <span>{t("Take Photo", "التقاط بالكاميرا")}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={triggerGallery}
                                        className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl border border-white/20 bg-white/[0.08] hover:bg-white/[0.15] text-white font-bold text-xs sm:text-sm backdrop-blur-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                                    >
                                        <ImageIcon className="w-4.5 h-4.5 shrink-0 text-cyan-300" />
                                        <span>{t("Choose from Gallery", "اختيار من الاستوديو")}</span>
                                    </button>
                                </div>

                                {/* Dynamic Accepted Medical Formats Guidance Cards (Per Mode) */}
                                <div className="mt-5 grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-3 w-full max-w-xl">
                                    {detectedScanType === "wound" ? (
                                        <>
                                            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center flex flex-col items-center justify-center hover:bg-white/[0.07] transition-all">
                                                <Sparkles className="w-4 h-4 text-cyan-400 mb-1" />
                                                <p className="text-xs font-bold text-white tracking-tight whitespace-nowrap">{t("Skin & Face Profile", "نوع البشرة والوجه")}</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">{t("Oily, Dry, Pores", "دهنية، جافة، مسام")}</p>
                                            </div>
                                            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center flex flex-col items-center justify-center hover:bg-white/[0.07] transition-all">
                                                <Activity className="w-4 h-4 text-amber-400 mb-1" />
                                                <p className="text-xs font-bold text-white tracking-tight whitespace-nowrap">{t("Acne, Warts & Corns", "حب الشباب وعين السمكة")}</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">{t("Lesions & Calluses", "سنط، كالو، دمامل")}</p>
                                            </div>
                                            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center flex flex-col items-center justify-center hover:bg-white/[0.07] transition-all">
                                                <Flame className="w-4 h-4 text-rose-400 mb-1" />
                                                <p className="text-xs font-bold text-white tracking-tight whitespace-nowrap">{t("Burns & Eczema", "الحروق والإكزيما")}</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">{t("Rash & Irritation", "طفح جلدي وتهيج")}</p>
                                            </div>
                                            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center flex flex-col items-center justify-center hover:bg-white/[0.07] transition-all">
                                                <Bandage className="w-4 h-4 text-emerald-400 mb-1" />
                                                <p className="text-xs font-bold text-white tracking-tight whitespace-nowrap">{t("Cuts & Injuries", "الجروح والقطوع")}</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">{t("Sutures & First Aid", "الخياطة والإسعاف")}</p>
                                            </div>
                                        </>
                                    ) : detectedScanType === "medication" ? (
                                        <>
                                            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center flex flex-col items-center justify-center hover:bg-white/[0.07] transition-all">
                                                <Package className="w-4 h-4 text-cyan-400 mb-1" />
                                                <p className="text-xs font-bold text-white tracking-tight whitespace-nowrap">{t("Boxes", "علب الأدوية")}</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">{t("Clear Name & Dose", "الاسم والتركيز")}</p>
                                            </div>
                                            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center flex flex-col items-center justify-center hover:bg-white/[0.07] transition-all">
                                                <FileText className="w-4 h-4 text-cyan-400 mb-1" />
                                                <p className="text-xs font-bold text-white tracking-tight whitespace-nowrap">{t("Prescriptions", "الروشتات الطبية")}</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">{t("Legible Text", "خط مقروء")}</p>
                                            </div>
                                            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center flex flex-col items-center justify-center hover:bg-white/[0.07] transition-all">
                                                <FlaskConical className="w-4 h-4 text-cyan-400 mb-1" />
                                                <p className="text-xs font-bold text-white tracking-tight whitespace-nowrap">{t("Bottles & Drops", "العبوات والقطرات")}</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">{t("Label Visible", "الملصق الرئيسي")}</p>
                                            </div>
                                            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center flex flex-col items-center justify-center hover:bg-white/[0.07] transition-all">
                                                <Layers className="w-4 h-4 text-cyan-400 mb-1" />
                                                <p className="text-xs font-bold text-white tracking-tight whitespace-nowrap">{t("Blisters", "شرائط الأقراص")}</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">{t("Printed Side", "الجانب المطبوع")}</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center flex flex-col items-center justify-center hover:bg-white/[0.07] transition-all">
                                                <Pill className="w-4 h-4 text-cyan-400 mb-1" />
                                                <p className="text-xs font-bold text-white tracking-tight whitespace-nowrap">{t("Medication Boxes", "علب وأشرطة الأدوية")}</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">{t("Instant Match", "تعرف فوري")}</p>
                                            </div>
                                            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center flex flex-col items-center justify-center hover:bg-white/[0.07] transition-all">
                                                <FileText className="w-4 h-4 text-cyan-400 mb-1" />
                                                <p className="text-xs font-bold text-white tracking-tight whitespace-nowrap">{t("Medical Rx", "الروشتات والتقارير")}</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">{t("Prescription OCR", "تحليل الجرعات")}</p>
                                            </div>
                                            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center flex flex-col items-center justify-center hover:bg-white/[0.07] transition-all">
                                                <Sparkles className="w-4 h-4 text-cyan-400 mb-1" />
                                                <p className="text-xs font-bold text-white tracking-tight whitespace-nowrap">{t("Skin & Face", "الجلد والبشرة")}</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">{t("Clinical Diagnosis", "تشخيص سريري")}</p>
                                            </div>
                                            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center flex flex-col items-center justify-center hover:bg-white/[0.07] transition-all">
                                                <Bandage className="w-4 h-4 text-emerald-400 mb-1" />
                                                <p className="text-xs font-bold text-white tracking-tight whitespace-nowrap">{t("Wounds & Burns", "الجروح والحروق")}</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">{t("Tissue Analysis", "تحليل الأنسجة")}</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Helpful Photography Guidance Banner */}
                            <div className={cn(
                                "rounded-2xl border p-3.5 flex items-center gap-3 transition-all",
                                detectedScanType === "wound"
                                    ? "border-cyan-500/30 bg-cyan-500/[0.06]"
                                    : "border-amber-400/20 bg-amber-400/[0.04]"
                            )}>
                                {detectedScanType === "wound" ? (
                                    <Stethoscope className="w-5 h-5 text-cyan-400 shrink-0" />
                                ) : (
                                    <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
                                )}
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    {detectedScanType === "wound"
                                        ? t(
                                            "For high clinical accuracy: Ensure direct lighting, steady camera focus on skin/lesion margins, and keep the area centered.",
                                            "لضمان أعلى دقة سريرية: صوّر المنطقة في إضاءة مباشرة وثبات تام لليد مع إظهار حواف المنطقة أو الآفة ونوع البشرة بوضوح."
                                        )
                                        : t(
                                            "For high accuracy: Ensure good lighting, avoid glare, and keep the drug name and strength centered.",
                                            "لضمان دقة القراءة: صوّر الدواء في إضاءة كافية بدون انعكاسات قوية وتأكد من وضوح اسم الدواء وتركيزه."
                                        )}
                                </p>
                            </div>
                        </div>

                        {/* ── Right Column: Recent Scans ── */}
                        <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 sm:p-6 backdrop-blur-xl shadow-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                    <History className="w-4 h-4 text-cyan-400" />
                                    <span>{t("Recent Scans", "الفحوصات الأخيرة")}</span>
                                </div>
                                <Link href="/dashboard/history" className="text-xs text-cyan-300 hover:text-cyan-200 font-semibold hover:underline">
                                    {t("View all", "عرض الكل")}
                                </Link>
                            </div>

                            {user && activeCareProfile && careProfiles.length > 1 && (
                                <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                                    <div className="flex items-center gap-2 text-xs text-slate-300 min-w-0">
                                        <Users className="w-4 h-4 text-cyan-300 shrink-0" />
                                        <span className="shrink-0 text-slate-500">{t("Active:", "الملف:")}</span>
                                        <span className="text-white font-semibold truncate">{activeCareProfile.display_name}</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setCareTempId(activeCareProfile.id);
                                            setCarePickerOpen(true);
                                        }}
                                        className="text-xs text-cyan-300 hover:underline font-semibold shrink-0"
                                    >
                                        {t("Change", "تغيير")}
                                    </button>
                                </div>
                            )}

                            {!user ? (
                                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-slate-400 text-xs leading-relaxed">
                                    <p className="mb-3">{t("Log in to use your History and build Medication Memories.", "سجّل الدخول للوصول إلى سجلك وبناء ذاكرة الأدوية الخاصة بك.")}</p>
                                    <Link href="/login">
                                        <Button size="xs" variant="outline" className="text-white border-white/15">
                                            {t("Log In", "تسجيل الدخول")}
                                        </Button>
                                    </Link>
                                </div>
                            ) : historyLoading ? (
                                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-slate-500 text-xs">
                                    {t("Loading history...", "جارٍ تحميل السجل...")}
                                </div>
                            ) : recentHistory.length === 0 ? (
                                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-slate-400 text-xs leading-relaxed">
                                    {t("No scans yet. Run your first scan to start your personal database.", "لا توجد فحوصات بعد. أجرِ أول فحص لبدء بناء سجلك الشخصي.")}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {recentHistory.map((item) => {
                                        const scanCount = item.analysis_json?.meta?.scanCount || item.scan_count || 1;
                                        const isWound = item.type === "wound" || Boolean(item.wound_title);
                                        const title = item.wound_title || item.drug_name || (isWound ? "Wound Assessment" : "Medication");
                                        return (
                                            <Link key={item.id} href="/dashboard/history" className="block group">
                                                <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all duration-150">
                                                    <div className="flex items-center gap-2.5 min-w-0 flex-1 me-2">
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-xl border flex items-center justify-center shrink-0",
                                                            isWound ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                                                        )}>
                                                            {isWound ? <Bandage className="w-4 h-4" /> : <Pill className="w-4 h-4" />}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-1.5">
                                                                <p className="text-white font-bold text-xs truncate group-hover:text-cyan-300 transition-colors">{title}</p>
                                                                {scanCount > 1 && (
                                                                    <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[9px] font-bold shrink-0">
                                                                        ×{scanCount}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-slate-400 text-[10px] truncate mt-0.5">
                                                                {item.manufacturer || (isWound ? (isArabic ? "تقييم سريري" : "Clinical triage") : t("Generic", "عام"))} • {new Date(item.created_at).toLocaleDateString(isArabic ? "ar-EG" : "en-US", { month: "short", day: "numeric" })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className={cn("w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-300 transition-colors shrink-0", isArabic ? "rotate-180" : "")} />
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {previewSrc && (
                    <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col lg:flex-row gap-6 max-w-6xl items-start">

                        {/* Left: Image Preview & Pre-Flight Quality Guard */}
                        <div className="w-full lg:w-1/2 relative rounded-3xl overflow-hidden border border-white/10 bg-slate-950/80 shadow-2xl group flex flex-col">
                            
                            {/* Pre-Flight Auto-Enhanced Quality Bar */}
                            {qualityInfo && (
                                <div className="p-3.5 border-b border-white/10 bg-slate-950/90 backdrop-blur-md flex items-center justify-between gap-3 text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="font-bold text-white">
                                            {t("AI Auto-Enhanced Resolution (4K Ready)", "دقة محسنة تلقائياً بالذكاء الاصطناعي")}
                                        </span>
                                    </div>
                                    <span className="font-mono text-emerald-300/80 text-[11px] font-semibold">
                                        {qualityInfo.width}×{qualityInfo.height} px • {qualityInfo.sizeMB} MB
                                    </span>
                                </div>
                            )}

                            {/* Image Container */}
                            <div className="relative w-full h-[380px] flex items-center justify-center p-4 bg-black/40">
                                <img
                                    src={previewSrc!}
                                    alt="Medication Preview"
                                    style={{
                                        transform: `rotate(${rotation}deg)`,
                                        filter: `brightness(${100 + brightness}%) contrast(${100 + contrast}%) ${highContrastMode ? "grayscale(100%) contrast(220%)" : ""}`,
                                    }}
                                    className={cn(
                                        "max-w-full max-h-full object-contain rounded-2xl transition-all duration-300",
                                        isScanning && "opacity-50 scale-95 blur-sm"
                                    )}
                                />

                                {!isScanning && !finalResult && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
                                        <div className="flex flex-col gap-3.5 items-center max-w-sm text-center">
                                            
                                            {/* Glowing Ultra-Shiny Start Analysis Button */}
                                            <button
                                                onClick={openCarePickerAndStart}
                                                className={cn(
                                                    "shiny-cta-btn w-full gap-3.5 px-8 sm:px-12 py-4 sm:py-5 text-base sm:text-lg font-black tracking-wide",
                                                    detectedScanType === "wound" ? "from-emerald-400 via-teal-300 to-emerald-400" : ""
                                                )}
                                            >
                                                {detectedScanType === "wound" ? (
                                                    <>
                                                        <Bandage className="w-6 h-6 shrink-0 text-slate-950 stroke-[2.5]" />
                                                        <span>{t("Analyze Wound Now", "فحص الجرح الآن")}</span>
                                                    </>
                                                ) : detectedScanType === "medication" ? (
                                                    <>
                                                        <Pill className="w-6 h-6 shrink-0 text-slate-950 stroke-[2.5]" />
                                                        <span>{t("Analyze Medication Now", "فحص الدواء الآن")}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-6 h-6 shrink-0 text-slate-950 stroke-[2.5]" />
                                                        <span>{t("Analyze Now", "الفحص الآن")}</span>
                                                    </>
                                                )}
                                            </button>

                                            {/* Camera vs Gallery Re-select Buttons */}
                                            <div className="flex items-center gap-2 w-full">
                                                <button
                                                    type="button"
                                                    onClick={triggerCamera}
                                                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-cyan-500/30 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-100 text-xs font-semibold transition-all"
                                                >
                                                    <Camera className="w-3.5 h-3.5" />
                                                    <span>{t("Camera", "الكاميرا")}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={triggerGallery}
                                                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-white/20 bg-white/[0.06] hover:bg-white/[0.12] text-white text-xs font-semibold transition-all"
                                                >
                                                    <ImageIcon className="w-3.5 h-3.5 text-cyan-300" />
                                                    <span>{t("Gallery", "الاستوديو")}</span>
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            onClick={resetScan}
                                            className="absolute top-4 end-4 p-2.5 bg-black/60 hover:bg-rose-500/80 rounded-2xl text-white/70 hover:text-white transition-all duration-200 backdrop-blur-md border border-white/10"
                                            title={t("Cancel", "إلغاء")}
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Automatic Image Quality Pre-Processing (Auto 4K & Contrast) */}
                            {!isScanning && (
                                <div className="p-3 border-t border-white/10 bg-slate-950/90 backdrop-blur-md flex items-center justify-between gap-2 text-xs">
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <span className="text-xs font-semibold">{t("AI Auto-Enhance & 4K Clarity Active", "التحسين التلقائي لجودة المستند والتباين نشط")}</span>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                        AUTO 4K
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Right: Timeline & Analysis Progress */}
                        <div className="w-full lg:w-1/2">
                            <Timeline />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <InteractionMatrixModal isOpen={isMatrixOpen} onClose={() => setIsMatrixOpen(false)} />
        </div>
    );
};
