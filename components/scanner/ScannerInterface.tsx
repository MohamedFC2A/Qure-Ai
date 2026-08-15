"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
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
    ChevronRight,
    Users,
    Camera,
    Image as ImageIcon,
    Pill,
    Stethoscope,
    Activity,
    Clock,
} from "lucide-react";
import { getLocalScans, saveLocalScan, mergeHistoryItems } from "@/lib/localHistory";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { MedicalResultCard } from "./MedicalResultCard";
import { WoundResultCard } from "./WoundResultCard";
import { InteractionMatrixModal } from "./InteractionMatrixModal";
import { PreFlightEstimator } from "./PreFlightEstimator";
import { ScanProgressHud } from "./ScanProgressHud";
import { useSettings } from "@/context/SettingsContext";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { AI_DISPLAY_NAME } from "@/lib/ai/branding";
import { useScan } from "@/context/ScanContext";

interface ImageQualityInfo {
    width: number;
    height: number;
    sizeMB: number;
    isHighClarity: boolean;
    isAcceptable: boolean;
    isTooSmall: boolean;
}

export const ScannerInterface = () => {
    const { user, plan } = useUser();
    const {
        file,
        previewSrc,
        processedImageDataUrl,
        isScanning,
        steps,
        totalDuration,
        finalResult,
        errorMsg,
        subjectProfileId,
        setSubjectProfileId,
        rotation,
        setRotation,
        brightness,
        contrast,
        highContrastMode,
        setFile,
        resetScan,
        startScan,
        detectedScanType,
        setDetectedScanType,
        isRestoredSession,
        hasInterruptedDraft,
    } = useScan();
    const { resultsLanguage } = useSettings();

    const isArabic = resultsLanguage === "ar";
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

    const analyzeImageQuality = (imgFile: File | string) => {
        if (typeof imgFile === "string") {
            const img = new Image();
            img.onload = () => {
                const width = img.naturalWidth || img.width;
                const height = img.naturalHeight || img.height;
                setQualityInfo({
                    width,
                    height,
                    sizeMB: 1.2,
                    isHighClarity: width >= 800 && height >= 600,
                    isAcceptable: width >= 350 && height >= 350,
                    isTooSmall: width < 350 || height < 350,
                });
            };
            img.src = imgFile;
            return;
        }

        const sizeMB = Number((imgFile.size / (1024 * 1024)).toFixed(2));
        const img = new Image();
        const objectUrl = URL.createObjectURL(imgFile);
        img.onload = () => {
            const width = img.naturalWidth || img.width;
            const height = img.naturalHeight || img.height;
            const isHighClarity = width >= 800 && height >= 600;
            const isAcceptable = width >= 350 && height >= 350 && !isHighClarity;
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

    useEffect(() => {
        if (previewSrc && !qualityInfo) {
            analyzeImageQuality(previewSrc);
        }
    }, [previewSrc, qualityInfo]);

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles[0]) {
                analyzeImageQuality(acceptedFiles[0]);
                setFile(acceptedFiles[0]);
            }
        },
        [setFile]
    );

    const fetchRecentHistory = useCallback(async () => {
        const localItems = getLocalScans();
        if (!user?.id) {
            setRecentHistory(localItems.slice(0, 5));
            return;
        }

        setHistoryLoading(true);
        try {
            const combined: any[] = [];

            const { data: medData } = await supabase
                .from("medication_history")
                .select("id, drug_name, manufacturer, created_at, analysis_json")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(5);

            if (medData) {
                combined.push(...medData.map((m: any) => ({ ...m, type: "medication" })));
            }

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

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
        maxFiles: 1,
        noClick: false,
    });

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

    // ── Render 1: Final Results View ──
    if (finalResult && !isScanning) {
        if (finalResult.scanType === "wound") {
            return (
                <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-500 p-0 sm:p-4">
                    {isRestoredSession && (
                        <div className="w-full max-w-4xl mb-4 flex items-center justify-between p-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-200 text-xs">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-cyan-300" />
                                <span>{t("Scan results restored automatically from session.", "تمت استعادة نتيجة الفحص السريري تلقائياً من الجلسة المحفوظة.")}</span>
                            </div>
                            <button onClick={resetScan} className="underline text-cyan-300 hover:text-white font-bold">
                                {t("Start New Scan", "بدء فحص جديد")}
                            </button>
                        </div>
                    )}

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
                {isRestoredSession && (
                    <div className="w-full max-w-4xl mb-4 flex items-center justify-between p-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-200 text-xs">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-cyan-300" />
                            <span>{t("Scan results restored automatically from session.", "تمت استعادة نتيجة الفحص السريري تلقائياً من الجلسة المحفوظة.")}</span>
                        </div>
                        <button onClick={resetScan} className="underline text-cyan-300 hover:text-white font-bold">
                            {t("Start New Scan", "بدء فحص جديد")}
                        </button>
                    </div>
                )}

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
                                        <div className="min-w-0 text-start">
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
                                                        "w-full text-start p-4 rounded-xl border transition-colors",
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
                                                        <div
                                                            className={cn(
                                                                "w-6 h-6 rounded-full border flex items-center justify-center shrink-0",
                                                                selected ? "border-cyan-400 text-cyan-200" : "border-white/15 text-white/30"
                                                            )}
                                                        >
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

            {/* ── Mode Switcher Tab ── */}
            <div className="w-full flex items-center justify-center">
                <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-lg">
                    <button
                        type="button"
                        onClick={() => setDetectedScanType("auto")}
                        className={cn(
                            "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                            detectedScanType === "auto" ? "bg-white text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
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
                            detectedScanType === "medication" ? "bg-cyan-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
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
                            detectedScanType === "wound" ? "bg-emerald-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
                        )}
                    >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>{t("Skin & Lesions", "فحص الجلد والإصابات")}</span>
                    </button>
                </div>
            </div>

            {/* ── Main Scanning HUD (When Scanning is in progress) ── */}
            <AnimatePresence mode="wait">
                {isScanning && (
                    <motion.div
                        key="scanning-hud"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="w-full max-w-4xl"
                    >
                        <ScanProgressHud
                            steps={steps}
                            totalDuration={totalDuration}
                            isScanning={isScanning}
                            previewSrc={previewSrc}
                            scanType={detectedScanType}
                            errorMsg={errorMsg}
                            onCancel={resetScan}
                            rotation={rotation}
                            brightness={brightness}
                            contrast={contrast}
                            highContrastMode={highContrastMode}
                        />
                    </motion.div>
                )}

                {/* ── Pre-Scan Staged Image & Pre-Flight Estimator (When image selected but not scanning) ── */}
                {!isScanning && previewSrc && (
                    <motion.div
                        key="preview-estimator"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="w-full flex flex-col lg:flex-row gap-6 max-w-5xl items-start"
                    >
                        {/* Left: Image Card */}
                        <div className="w-full lg:w-1/2 relative rounded-3xl overflow-hidden border border-white/10 bg-slate-950/80 shadow-2xl flex flex-col">
                            <div className="p-3.5 border-b border-white/10 bg-slate-950/90 backdrop-blur-md flex items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="font-bold text-white">
                                        {t("AI Auto-Enhanced Resolution (4K Ready)", "دقة محسنة تلقائياً بالذكاء الاصطناعي")}
                                    </span>
                                </div>
                                <span className="font-mono text-emerald-300/90 text-[11px] font-bold">
                                    {qualityInfo ? `${qualityInfo.width}×${qualityInfo.height} px` : "4K Ready"}
                                </span>
                            </div>

                            <div className="relative w-full h-[360px] flex items-center justify-center p-4 bg-black/40">
                                <img
                                    src={previewSrc}
                                    alt="Medication / Clinical Target Preview"
                                    style={{
                                        transform: `rotate(${rotation}deg)`,
                                        filter: `brightness(${100 + brightness}%) contrast(${100 + contrast}%) ${
                                            highContrastMode ? "grayscale(100%) contrast(220%)" : ""
                                        }`,
                                    }}
                                    className="max-w-full max-h-full object-contain rounded-2xl transition-all duration-300 shadow-lg"
                                />

                                <button
                                    onClick={resetScan}
                                    className="absolute top-4 end-4 p-2.5 bg-black/60 hover:bg-rose-500/80 rounded-2xl text-white/70 hover:text-white transition-all duration-200 backdrop-blur-md border border-white/10"
                                    title={t("Cancel", "إلغاء")}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-3 border-t border-white/10 bg-slate-950/90 backdrop-blur-md flex items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <span className="text-xs font-semibold">
                                        {t("Optical Contrast & Noise Calibration Active", "المعايرة البصرية وإزالة الضوضاء نشطة")}
                                    </span>
                                </div>
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                                    AUTO 4K
                                </span>
                            </div>
                        </div>

                        {/* Right: Pre-Flight Estimator & Start Scan Controls */}
                        <div className="w-full lg:w-1/2">
                            {hasInterruptedDraft && (
                                <div className="mb-4 p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-200 text-xs flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-cyan-300 shrink-0" />
                                    <span>{t("Saved session restored — ready to begin analysis instantly.", "تمت استعادة الصورة المحفوظة بنجاح — جاهز لبدء الفحص فوراً.")}</span>
                                </div>
                            )}

                            <PreFlightEstimator
                                imageQuality={qualityInfo}
                                scanType={detectedScanType}
                                activeProfileName={activeCareProfile?.display_name}
                                onOpenProfilePicker={
                                    plan === "ultra" && careProfiles.length > 1
                                        ? () => {
                                              setCareTempId(subjectProfileId || user?.id || null);
                                              setCarePickerOpen(true);
                                          }
                                        : undefined
                                }
                                onStartScan={openCarePickerAndStart}
                                onRetakeCamera={triggerCamera}
                                onChooseGallery={triggerGallery}
                                onRotate={() => setRotation((r) => (r + 90) % 360)}
                                isScanning={isScanning}
                            />
                        </div>
                    </motion.div>
                )}

                {/* ── Empty Initial Dropzone View ── */}
                {!isScanning && !previewSrc && (
                    <motion.div
                        key="dropzone-view"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="w-full max-w-4xl flex flex-col items-center gap-6"
                    >
                        <div
                            {...getRootProps()}
                            className={cn(
                                "w-full min-h-[320px] sm:min-h-[360px] rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-6 sm:p-8 cursor-pointer relative overflow-hidden group",
                                isDragActive
                                    ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_30px_rgba(6,182,212,0.2)]"
                                    : "border-white/15 bg-[#080E1E]/80 hover:border-cyan-500/40 hover:bg-[#0B132B]/90 shadow-2xl backdrop-blur-xl"
                            )}
                        >
                            <input {...getInputProps()} />

                            <div className="relative z-10 flex flex-col items-center text-center max-w-md">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 mb-4 shadow-[0_0_20px_rgba(6,182,212,0.25)] group-hover:scale-105 transition-transform duration-300">
                                    <ScanLine className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
                                </div>

                                <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5">
                                    {t("Upload Prescription, Medication Box, or Skin Photo", "ارفع صورة الروشتة، علبة الدواء، أو فحص الجلد")}
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
                                    {t(
                                        "Drag & drop here or choose direct capture to start AI clinical analysis.",
                                        "اسحب الصورة هنا أو اختر التصوير المباشر لبدء الفحص والتحليل الفوري."
                                    )}
                                </p>

                                {/* Direct Action Buttons */}
                                <div className="flex flex-wrap items-center justify-center gap-3 w-full">
                                    <button
                                        type="button"
                                        onClick={triggerCamera}
                                        className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all hover:scale-105"
                                    >
                                        <Camera className="w-4 h-4 stroke-[2.5]" />
                                        <span>{t("Camera Capture", "تصوير بالكاميرا")}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={triggerGallery}
                                        className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white font-bold text-sm transition-all hover:scale-105"
                                    >
                                        <ImageIcon className="w-4 h-4 text-cyan-300" />
                                        <span>{t("Browse Gallery", "اختيار من الاستوديو")}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Recent History Quick Strip */}
                        {recentHistory.length > 0 && (
                            <div className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-4 backdrop-blur-xl">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                                        <History className="w-3.5 h-3.5 text-cyan-400" />
                                        <span>{t("Recent Clinical Scans", "آخر الفحوصات الطبية")}</span>
                                    </div>
                                    <Link href="/dashboard/history" className="text-[11px] text-cyan-300 hover:underline">
                                        {t("View All", "عرض السجل بالكامل")}
                                    </Link>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                    {recentHistory.slice(0, 3).map((item, idx) => (
                                        <div
                                            key={item.id || idx}
                                            className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3 text-start"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-white truncate">{item.drug_name || t("Medical Scan", "فحص طبي")}</p>
                                                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                                    {item.manufacturer || (item.created_at ? new Date(item.created_at).toLocaleDateString() : "")}
                                                </p>
                                            </div>
                                            <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-400/20 text-[10px] font-mono">
                                                {item.type === "wound" ? t("SKIN", "جلد") : t("RX", "دواء")}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <InteractionMatrixModal isOpen={isMatrixOpen} onClose={() => setIsMatrixOpen(false)} />
        </div>
    );
};
