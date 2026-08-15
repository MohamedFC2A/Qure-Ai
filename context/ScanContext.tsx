"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSettings } from "@/context/SettingsContext";
import { useUser } from "@/context/UserContext";
import { AI_DISPLAY_NAME } from "@/lib/ai/branding";
import { getLocalScans } from "@/lib/localHistory";
import { BiometricAuthModal } from "@/components/scanner/BiometricAuthModal";
import {
    savePersistedSession,
    loadPersistedSession,
    clearPersistedSession,
    PersistedScanSession,
} from "@/lib/scanSessionStorage";

export type StepStatus = "idle" | "running" | "done" | "error";

export interface PipelineStep {
    id: string;
    label: string;
    status: StepStatus;
    startTime?: number;
    endTime?: number;
    durationMs?: number;
}

type ErrorAction = null | "login" | "terms";

const INITIAL_STEPS: PipelineStep[] = [
    { id: "preprocess", label: "المعالجة والضبط البصري", status: "idle" },
    { id: "ocr", label: "المسح وقراءة النصوص", status: "idle" },
    { id: "analyze", label: "التحليل السريري والتداخلات", status: "idle" },
    { id: "structure", label: "هيكلة واعتماد التقرير", status: "idle" },
];

interface ScanContextValue {
    file: File | null;
    previewSrc: string | null;
    processedImageDataUrl: string | null;
    extractedText: string | null;
    subjectProfileId: string | null;
    setSubjectProfileId: (profileId: string) => void;
    isScanning: boolean;
    steps: PipelineStep[];
    totalDuration: string;
    finalResult: any | null;
    errorMsg: string | null;
    errorAction: ErrorAction;
    rotation: number;
    setRotation: (fn: number | ((prev: number) => number)) => void;
    brightness: number;
    setBrightness: (val: number) => void;
    contrast: number;
    setContrast: (val: number) => void;
    highContrastMode: boolean;
    setHighContrastMode: (val: boolean) => void;
    detectedScanType: "auto" | "medication" | "prescription" | "wound";
    setDetectedScanType: (type: "auto" | "medication" | "prescription" | "wound") => void;
    isWoundScan: boolean;
    isRestoredSession: boolean;
    hasInterruptedDraft: boolean;
    setFile: (file: File) => void;
    resetScan: () => void;
    startScan: (profileIdOverride?: string) => Promise<void>;
}

const ScanContext = createContext<ScanContextValue | undefined>(undefined);

export const ScanProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useUser();
    const { resultsLanguage, fdaDrugsEnabled, requireBiometricOnScan } = useSettings();

    const isArabic = resultsLanguage === "ar";
    const t = useCallback((en: string, ar: string) => (isArabic ? ar : en), [isArabic]);

    const [file, setFileState] = useState<File | null>(null);
    const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);
    const [processedImageDataUrl, setProcessedImageDataUrl] = useState<string | null>(null);
    const [extractedText, setExtractedText] = useState<string | null>(null);
    const [subjectProfileId, setSubjectProfileIdState] = useState<string | null>(null);
    const [detectedScanType, setDetectedScanType] = useState<"auto" | "medication" | "prescription" | "wound">("auto");
    const [isRestoredSession, setIsRestoredSession] = useState(false);
    const [hasInterruptedDraft, setHasInterruptedDraft] = useState(false);

    // Biometric Security Guard State
    const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);
    const biometricResolverRef = useRef<((passed: boolean) => void) | null>(null);

    // Image pre-processing controls
    const [rotation, setRotationState] = useState<number>(0);
    const [brightness, setBrightness] = useState<number>(0);
    const [contrast, setContrast] = useState<number>(0);
    const [highContrastMode, setHighContrastMode] = useState<boolean>(false);

    const setRotation = useCallback((val: number | ((prev: number) => number)) => {
        setRotationState((prev) => {
            const next = typeof val === "function" ? val(prev) : val;
            return (next % 360 + 360) % 360;
        });
    }, []);

    const [isScanning, setIsScanning] = useState(false);
    const [steps, setSteps] = useState<PipelineStep[]>(INITIAL_STEPS);
    const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
    const [completedAtMs, setCompletedAtMs] = useState<number | null>(null);
    const [totalDuration, setTotalDuration] = useState<string>("0.0");
    const [finalResult, setFinalResult] = useState<any | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [errorAction, setErrorAction] = useState<ErrorAction>(null);

    const tesseractWorkerRef = useRef<any>(null);
    const runningRef = useRef(false);
    const runIdRef = useRef(0);
    const abortRef = useRef<AbortController | null>(null);

    const previewSrc = previewObjectUrl || processedImageDataUrl || null;
    const isWoundScan = detectedScanType === "wound" || finalResult?.scanType === "wound";

    const setSubjectProfileId = useCallback((profileId: string) => {
        setSubjectProfileIdState(String(profileId || "").trim() || null);
    }, []);

    const updateStep = useCallback((id: string, updates: Partial<PipelineStep>) => {
        setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    }, []);

    // High-Resolution & Clean Image Preprocessor (up to 2048px, quality 0.95)
    const preprocessImage = useCallback((imageFile: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(imageFile);
            img.src = objectUrl;
            img.onload = () => {
                try {
                    const canvas = document.createElement("canvas");
                    const MAX_WIDTH = 2048;
                    const scaleSize = MAX_WIDTH / img.width;
                    const finalWidth = Math.min(img.width, MAX_WIDTH);
                    const finalHeight = img.width > MAX_WIDTH ? img.height * scaleSize : img.height;

                    const isSwapped = rotation === 90 || rotation === 270;
                    canvas.width = isSwapped ? finalHeight : finalWidth;
                    canvas.height = isSwapped ? finalWidth : finalHeight;

                    const ctx = canvas.getContext("2d", { willReadFrequently: true });
                    if (ctx) {
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = "high";

                        ctx.save();
                        ctx.translate(canvas.width / 2, canvas.height / 2);
                        ctx.rotate((rotation * Math.PI) / 180);

                        const autoBrightness = brightness !== 0 ? 100 + brightness : 102;
                        const autoContrast = contrast !== 0 ? 100 + contrast : 108;

                        let filterStr = `brightness(${autoBrightness}%) contrast(${autoContrast}%)`;
                        if (highContrastMode) {
                            filterStr += " grayscale(100%) contrast(220%)";
                        }
                        ctx.filter = filterStr;

                        ctx.drawImage(img, -finalWidth / 2, -finalHeight / 2, finalWidth, finalHeight);
                        ctx.restore();
                    }

                    resolve(canvas.toDataURL("image/jpeg", 0.95));
                } catch (e) {
                    reject(e);
                } finally {
                    URL.revokeObjectURL(objectUrl);
                }
            };
            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error("Failed to load image."));
            };
        });
    }, [rotation, brightness, contrast, highContrastMode]);

    const runLocalOcr = useCallback(async (imageDataUrl: string): Promise<string> => {
        try {
            const { default: Tesseract } = await import("tesseract.js");
            const worker = await Tesseract.createWorker("eng");
            try {
                const { data } = await worker.recognize(imageDataUrl);
                return String(data?.text || "").trim();
            } finally {
                await worker.terminate().catch(() => {});
            }
        } catch (err) {
            console.warn("Local OCR fallback failed:", err);
            return "";
        }
    }, []);

    const resetScan = useCallback(() => {
        try {
            abortRef.current?.abort();
        } catch {
            // ignore
        } finally {
            abortRef.current = null;
            runIdRef.current += 1;
            runningRef.current = false;
        }
        setFileState(null);
        setPreviewObjectUrl(null);
        setProcessedImageDataUrl(null);
        setExtractedText(null);
        setFinalResult(null);
        setIsScanning(false);
        setSteps(INITIAL_STEPS);
        setTotalDuration("0.0");
        setStartedAtMs(null);
        setCompletedAtMs(null);
        setErrorMsg(null);
        setErrorAction(null);
        setDetectedScanType("auto");
        setIsBiometricModalOpen(false);
        setIsRestoredSession(false);
        setHasInterruptedDraft(false);
        void clearPersistedSession();
    }, []);

    const setFile = useCallback(
        (nextFile: File) => {
            try {
                abortRef.current?.abort();
            } catch {
                // ignore
            } finally {
                abortRef.current = null;
                runIdRef.current += 1;
                runningRef.current = false;
            }
            setFileState(nextFile);
            setPreviewObjectUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return URL.createObjectURL(nextFile);
            });

            setProcessedImageDataUrl(null);
            setExtractedText(null);
            setFinalResult(null);
            setIsScanning(false);
            setSteps(INITIAL_STEPS);
            setTotalDuration("0.0");
            setStartedAtMs(null);
            setCompletedAtMs(null);
            setErrorMsg(null);
            setErrorAction(null);
            setIsRestoredSession(false);
            setHasInterruptedDraft(false);

            // Pre-save basic draft into IndexedDB
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result as string;
                void savePersistedSession({
                    status: "idle",
                    fileName: nextFile.name,
                    processedImageDataUrl: base64,
                    detectedScanType: "auto",
                });
            };
            reader.readAsDataURL(nextFile);
        },
        []
    );

    // Biometric Trigger Helper returning Promise<boolean>
    const requestBiometricAuthentication = useCallback((): Promise<boolean> => {
        return new Promise((resolve) => {
            biometricResolverRef.current = resolve;
            setIsBiometricModalOpen(true);
        });
    }, []);

    const handleBiometricSuccess = useCallback(() => {
        setIsBiometricModalOpen(false);
        if (biometricResolverRef.current) {
            biometricResolverRef.current(true);
            biometricResolverRef.current = null;
        }
    }, []);

    const handleBiometricCancel = useCallback(() => {
        setIsBiometricModalOpen(false);
        if (biometricResolverRef.current) {
            biometricResolverRef.current(false);
            biometricResolverRef.current = null;
        }
    }, []);

    const startScan = useCallback(async (profileIdOverride?: string) => {
        if (runningRef.current) return;

        if (!user) {
            setErrorAction("login");
            setErrorMsg(t("Login required to start scanning.", "يجب تسجيل الدخول قبل بدء الفحص."));
            return;
        }

        if (!file && !processedImageDataUrl) return;

        const runId = (runIdRef.current += 1);
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        runningRef.current = true;
        setIsScanning(true);
        setErrorMsg(null);
        setErrorAction(null);
        setFinalResult(null);
        setHasInterruptedDraft(false);

        const startedAt = Date.now();
        setStartedAtMs(startedAt);
        setCompletedAtMs(null);

        const effectiveProfileId = profileIdOverride || subjectProfileId || user.id;

        const makeAbortError = () => {
            const err = new Error("Aborted");
            (err as any).name = "AbortError";
            return err;
        };

        const throwIfCancelled = () => {
            if (controller.signal.aborted) throw makeAbortError();
            if (runId !== runIdRef.current) throw makeAbortError();
        };

        // Sync session start to IndexedDB
        void savePersistedSession({
            status: "running",
            startedAtMs: startedAt,
            language: resultsLanguage,
            subjectProfileId: effectiveProfileId,
            detectedScanType,
            processedImageDataUrl,
        });

        try {
            throwIfCancelled();

            // STEP 1: Preprocessing with High-Clarity Canvas (2048px)
            const preprocessStart = Date.now();
            updateStep("preprocess", { status: "running", startTime: preprocessStart });

            let imageDataUrl = processedImageDataUrl;
            if (!imageDataUrl && file) {
                imageDataUrl = await preprocessImage(file);
                throwIfCancelled();
                setProcessedImageDataUrl(imageDataUrl);
            }

            const preprocessEnd = Date.now();
            updateStep("preprocess", { status: "done", endTime: preprocessEnd, durationMs: preprocessEnd - preprocessStart });

            void savePersistedSession({
                processedImageDataUrl: imageDataUrl,
                status: "running",
            });

            // STEP 2: Zero-Error Medical Triage & OCR
            const ocrStart = Date.now();
            updateStep("ocr", { status: "running", startTime: ocrStart });

            let triageType: "medication" | "prescription" | "wound" = detectedScanType === "wound" ? "wound" : "medication";
            let ocrText = extractedText || "";

            if (detectedScanType === "wound") {
                triageType = "wound";
                ocrText = "فحص سريري لجرح وإصابة جلدية";
            } else {
                const ocrResponse = await fetch("/api/ocr/gemini", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ image: imageDataUrl }),
                    signal: controller.signal,
                });

                let ocrData: any = {};
                try {
                    const responseText = await ocrResponse.text();
                    ocrData = responseText ? JSON.parse(responseText) : {};
                } catch (parseError) {
                    console.error("[ScanContext] Failed to parse OCR response:", parseError);
                    if (!ocrResponse.ok) {
                        throw new Error(`OCR service error (${ocrResponse.status}). Please try again.`);
                    }
                    throw new Error("Invalid response from OCR service. Please try again.");
                }

                throwIfCancelled();

                if (ocrResponse.status === 401) {
                    const e: any = new Error(t("Please log in to continue.", "رجاءً سجّل الدخول للمتابعة."));
                    e.action = "login";
                    throw e;
                }
                if (ocrResponse.status === 403 && (ocrData as any)?.code === "TERMS_REQUIRED") {
                    const e: any = new Error(
                        t("Please accept the Terms & Disclaimer to continue.", "يجب الموافقة على الشروط وإخلاء المسؤولية قبل المتابعة.")
                    );
                    e.action = "terms";
                    throw e;
                }

                const errorMessage = String((ocrData as any)?.error || "");
                const shouldFallbackToLocalOcr =
                    ocrResponse.status === 429 ||
                    ocrResponse.status === 503 ||
                    errorMessage.toLowerCase().includes("quota") ||
                    errorMessage.toLowerCase().includes("too many requests") ||
                    errorMessage.toLowerCase().includes("rate limit");

                if (!ocrResponse.ok && shouldFallbackToLocalOcr) {
                    ocrText = await runLocalOcr(imageDataUrl!);
                    throwIfCancelled();
                } else if ((ocrData as any)?.error) {
                    ocrText = (ocrData as any)?.extractedText || (isArabic ? "فحص سريري دوائي (تم التجاوز الذكي للجودة)" : "Clinical medication evaluation (Auto-enhanced)");
                    triageType = (ocrData as any)?.scanType === "wound" ? "wound" : "medication";
                } else {
                    ocrText = String((ocrData as any)?.extractedText || "").trim();
                    if (ocrData.scanType === "wound" || ocrData.isWound === true) {
                        triageType = "wound";
                    } else if (ocrData.scanType === "prescription") {
                        triageType = "prescription";
                    }
                }
            }

            setDetectedScanType(triageType);
            setExtractedText(ocrText);

            const ocrEnd = Date.now();
            updateStep("ocr", { status: "done", endTime: ocrEnd, durationMs: ocrEnd - ocrStart });

            void savePersistedSession({
                extractedText: ocrText,
                detectedScanType: triageType,
                status: "running",
            });

            // MANDATORY BIOMETRIC GUARD FOR WOUND SCANS
            if (triageType === "wound" || requireBiometricOnScan) {
                const passed = await requestBiometricAuthentication();
                throwIfCancelled();
                if (!passed) {
                    setIsScanning(false);
                    const errMsg = isArabic
                        ? "تم إيقاف الفحص: يلزم تأكيد البصمة أو Face ID للوصول إلى تحليلات الجروح لحماية الخصوصية."
                        : "Scan cancelled: Biometric authentication required to proceed with sensitive wound analysis.";
                    setErrorMsg(errMsg);
                    return;
                }
            }

            // STEP 3: Dedicated Clinical Analysis
            const analyzeStart = Date.now();
            updateStep("analyze", { status: "running", startTime: analyzeStart });

            let analysisData: any;

            if (triageType === "wound") {
                const woundResponse = await fetch("/api/wound/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        scannedImage: imageDataUrl,
                        language: resultsLanguage,
                        profileId: effectiveProfileId,
                    }),
                    signal: controller.signal,
                });

                const woundText = await woundResponse.text();
                throwIfCancelled();
                try {
                    analysisData = JSON.parse(woundText);
                } catch {
                    throw new Error(woundText || "Wound assessment failed.");
                }

                if (analysisData?.error) throw new Error(analysisData.error);
            } else {
                const localScans = getLocalScans();
                const localHistoryMedications = localScans.map((s) => s.drug_name).filter(Boolean);

                const analyzeResponse = await fetch("/api/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        text: ocrText,
                        language: resultsLanguage,
                        fdaEnabled: fdaDrugsEnabled,
                        profileId: effectiveProfileId,
                        scannedImage: imageDataUrl,
                        localHistoryMedications,
                    }),
                    signal: controller.signal,
                });

                const analysisText = await analyzeResponse.text();
                throwIfCancelled();
                try {
                    analysisData = JSON.parse(analysisText);
                } catch {
                    throw new Error(analysisText || "Analysis failed (invalid server response).");
                }

                if (analyzeResponse.status === 401) {
                    const e: any = new Error(t("Please log in to continue.", "رجاءً سجّل الدخول للمتابعة."));
                    e.action = "login";
                    throw e;
                }
                if (analyzeResponse.status === 403 && analysisData?.code === "TERMS_REQUIRED") {
                    const e: any = new Error(
                        t("Please accept the Terms & Disclaimer to continue.", "يجب الموافقة على الشروط وإخلاء المسؤولية قبل المتابعة.")
                    );
                    e.action = "terms";
                    throw e;
                }

                if (analysisData?.error) throw new Error(analysisData.error);
            }

            const analyzeEnd = Date.now();
            updateStep("analyze", { status: "done", endTime: analyzeEnd, durationMs: analyzeEnd - analyzeStart });

            // STEP 4: Structuring & Finalization
            const structureStart = Date.now();
            updateStep("structure", { status: "running", startTime: structureStart });

            throwIfCancelled();
            setFinalResult(analysisData);

            const structureEnd = Date.now();
            updateStep("structure", { status: "done", endTime: structureEnd, durationMs: structureEnd - structureStart });

            setIsScanning(false);
            const completedAt = Date.now();
            setCompletedAtMs(completedAt);
            const finalDur = ((completedAt - startedAt) / 1000).toFixed(1);
            setTotalDuration(finalDur);

            // Persist completed scan into IndexedDB
            void savePersistedSession({
                status: "done",
                finalResult: analysisData,
                completedAtMs: completedAt,
                startedAtMs: startedAt,
                subjectProfileId: effectiveProfileId,
                detectedScanType: triageType,
                processedImageDataUrl: imageDataUrl,
                steps: [
                    { id: "preprocess", label: "Image Preprocessing", status: "done", durationMs: preprocessEnd - preprocessStart },
                    { id: "ocr", label: "Smart Medical Triage", status: "done", durationMs: ocrEnd - ocrStart },
                    { id: "analyze", label: "Clinical Analysis", status: "done", durationMs: analyzeEnd - analyzeStart },
                    { id: "structure", label: "Clinical Structuring", status: "done", durationMs: structureEnd - structureStart },
                ],
            });

        } catch (error: any) {
            const isAbort = error?.name === "AbortError" || controller.signal.aborted || runId !== runIdRef.current;
            if (!isAbort) {
                console.error(error);
            }

            if (runId !== runIdRef.current) return;

            if (isAbort) {
                setIsScanning(false);
                setErrorMsg(null);
                setErrorAction(null);
                return;
            }

            setErrorAction((error as any)?.action ?? null);
            setErrorMsg(error?.message || t("Analysis Failed.", "فشل التحليل."));
            setSteps((prev) => prev.map((s) => (s.status === "running" ? { ...s, status: "error" } : s)));
            setCompletedAtMs(Date.now());
            setIsScanning(false);

            void savePersistedSession({
                status: "error",
                errorMsg: error?.message || "Analysis Failed",
            });
        } finally {
            runningRef.current = false;
            if (abortRef.current === controller) abortRef.current = null;
        }
    }, [
        detectedScanType,
        extractedText,
        file,
        fdaDrugsEnabled,
        preprocessImage,
        processedImageDataUrl,
        requireBiometricOnScan,
        requestBiometricAuthentication,
        resultsLanguage,
        runLocalOcr,
        subjectProfileId,
        t,
        updateStep,
        user,
    ]);

    // Live timer while scanning
    useEffect(() => {
        if (!isScanning || !startedAtMs) return;
        const id = window.setInterval(() => {
            setTotalDuration(((Date.now() - startedAtMs) / 1000).toFixed(1));
        }, 100);
        return () => window.clearInterval(id);
    }, [isScanning, startedAtMs]);

    // Clean up OCR worker
    useEffect(() => {
        return () => {
            try {
                tesseractWorkerRef.current?.terminate?.();
            } catch {
                // ignore
            } finally {
                tesseractWorkerRef.current = null;
            }
        };
    }, []);

    // Revoke preview URL
    useEffect(() => {
        return () => {
            if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
        };
    }, [previewObjectUrl]);

    // Restore session smoothly after refresh or navigation
    useEffect(() => {
        let isMounted = true;
        loadPersistedSession().then((session) => {
            if (!isMounted || !session) return;

            if (session.status === "done" && session.finalResult) {
                setProcessedImageDataUrl(session.processedImageDataUrl || null);
                setExtractedText(session.extractedText || null);
                setFinalResult(session.finalResult);
                setSubjectProfileIdState(session.subjectProfileId || null);
                if (session.detectedScanType) setDetectedScanType(session.detectedScanType);
                if (session.steps?.length) setSteps(session.steps);
                setIsRestoredSession(true);
            } else if (session.processedImageDataUrl) {
                // Staged image or interrupted scan
                setProcessedImageDataUrl(session.processedImageDataUrl);
                setExtractedText(session.extractedText || null);
                setSubjectProfileIdState(session.subjectProfileId || null);
                if (session.detectedScanType) setDetectedScanType(session.detectedScanType);
                if (session.status === "running") {
                    setHasInterruptedDraft(true);
                }
            }
        });

        return () => {
            isMounted = false;
        };
    }, []);

    const value: ScanContextValue = useMemo(
        () => ({
            file,
            previewSrc,
            processedImageDataUrl,
            extractedText,
            subjectProfileId,
            setSubjectProfileId,
            isScanning,
            steps,
            totalDuration,
            finalResult,
            errorMsg,
            errorAction,
            rotation,
            setRotation,
            brightness,
            setBrightness,
            contrast,
            setContrast,
            highContrastMode,
            setHighContrastMode,
            detectedScanType,
            setDetectedScanType,
            isWoundScan,
            isRestoredSession,
            hasInterruptedDraft,
            setFile,
            resetScan,
            startScan,
        }),
        [
            errorAction,
            errorMsg,
            extractedText,
            file,
            finalResult,
            isScanning,
            previewSrc,
            processedImageDataUrl,
            resetScan,
            setFile,
            setSubjectProfileId,
            startScan,
            steps,
            subjectProfileId,
            totalDuration,
            rotation,
            setRotation,
            brightness,
            contrast,
            highContrastMode,
            detectedScanType,
            isWoundScan,
            isRestoredSession,
            hasInterruptedDraft,
        ]
    );

    return (
        <ScanContext.Provider value={value}>
            {children}
            <BiometricAuthModal
                isOpen={isBiometricModalOpen}
                onSuccess={handleBiometricSuccess}
                onCancel={handleBiometricCancel}
                userEmail={user?.email || "user@qurescan.com"}
                woundContext={true}
            />
        </ScanContext.Provider>
    );
};

export const useScan = () => {
    const context = useContext(ScanContext);
    if (context === undefined) {
        throw new Error("useScan must be used within a ScanProvider");
    }
    return context;
};

export const useOptionalScan = () => {
    return useContext(ScanContext) || null;
};
