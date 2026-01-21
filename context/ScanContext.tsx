"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSettings } from "@/context/SettingsContext";
import { useUser } from "@/context/UserContext";
import { AI_DISPLAY_NAME } from "@/lib/ai/branding";

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
    { id: "preprocess", label: "Image Preprocessing", status: "idle" },
    { id: "ocr", label: `OCR (${AI_DISPLAY_NAME})`, status: "idle" },
    { id: "analyze", label: `${AI_DISPLAY_NAME} Analysis`, status: "idle" },
    { id: "structure", label: "Medical Data Structuring", status: "idle" },
];

type PersistedScanSession = {
    version: 1;
    updatedAt: number;
    status: "idle" | "running" | "done" | "error";
    startedAtMs: number | null;
    completedAtMs: number | null;
    language: "en" | "ar";
    subjectProfileId: string | null;
    steps: PipelineStep[];
    fileName: string | null;
    processedImageDataUrl: string | null;
    extractedText: string | null;
    finalResult: any | null;
    errorMsg: string | null;
    errorAction: ErrorAction;
};

const STORAGE_KEY = "qure_scan_session_v1";
const STORAGE_TTL_MS = 6 * 60 * 60 * 1000; // 6h

function safeJsonParse<T>(raw: string | null): T | null {
    if (!raw) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

function loadPersistedSession(): PersistedScanSession | null {
    if (typeof window === "undefined") return null;
    const parsed = safeJsonParse<PersistedScanSession>(localStorage.getItem(STORAGE_KEY));
    if (!parsed || parsed.version !== 1) return null;
    if (!parsed.updatedAt || Date.now() - Number(parsed.updatedAt) > STORAGE_TTL_MS) return null;
    return parsed;
}

function clearPersistedSession() {
    if (typeof window === "undefined") return;
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // ignore
    }
}

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
    setFile: (file: File) => void;
    resetScan: () => void;
    startScan: (profileIdOverride?: string) => Promise<void>;
}

const ScanContext = createContext<ScanContextValue | undefined>(undefined);

export const ScanProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useUser();
    const { resultsLanguage, fdaDrugsEnabled } = useSettings();

    const isArabic = resultsLanguage === "ar";
    const t = useCallback((en: string, ar: string) => (isArabic ? ar : en), [isArabic]);

    const [file, setFileState] = useState<File | null>(null);
    const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);
    const [processedImageDataUrl, setProcessedImageDataUrl] = useState<string | null>(null);
    const [extractedText, setExtractedText] = useState<string | null>(null);
    const [subjectProfileId, setSubjectProfileIdState] = useState<string | null>(null);

    const [isScanning, setIsScanning] = useState(false);
    const [steps, setSteps] = useState<PipelineStep[]>(INITIAL_STEPS);
    const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
    const [completedAtMs, setCompletedAtMs] = useState<number | null>(null);
    const [totalDuration, setTotalDuration] = useState<string>("0.0");
    const [finalResult, setFinalResult] = useState<any | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [errorAction, setErrorAction] = useState<ErrorAction>(null);
    const [hydrated, setHydrated] = useState(false);

    const tesseractWorkerRef = useRef<any>(null);
    const runningRef = useRef(false);
    const runIdRef = useRef(0);
    const abortRef = useRef<AbortController | null>(null);
    const resumedOnceRef = useRef(false);
    const pendingResumeRef = useRef<null | PersistedScanSession>(null);
    const lastPersistAtRef = useRef(0);

    const previewSrc = previewObjectUrl || processedImageDataUrl || null;

    const setSubjectProfileId = useCallback((profileId: string) => {
        setSubjectProfileIdState(String(profileId || "").trim() || null);
    }, []);

    const updateStep = useCallback((id: string, updates: Partial<PipelineStep>) => {
        setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    }, []);

    const preprocessImage = useCallback((imageFile: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(imageFile);
            img.src = objectUrl;
            img.onload = () => {
                try {
                    const canvas = document.createElement("canvas");
                    const MAX_WIDTH = 1000;
                    const scaleSize = MAX_WIDTH / img.width;
                    const finalWidth = Math.min(img.width, MAX_WIDTH);
                    const finalHeight = img.width > MAX_WIDTH ? img.height * scaleSize : img.height;

                    canvas.width = finalWidth;
                    canvas.height = finalHeight;

                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
                    }

                    resolve(canvas.toDataURL("image/jpeg", 0.8));
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
    }, []);

    const runLocalOcr = useCallback(async (imageDataUrl: string): Promise<string> => {
        const { default: Tesseract } = await import("tesseract.js");
        if (!tesseractWorkerRef.current) {
            tesseractWorkerRef.current = await Tesseract.createWorker("eng");
        }

        const { data } = await tesseractWorkerRef.current.recognize(imageDataUrl);
        return String(data?.text || "").trim();
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
        clearPersistedSession();
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
            clearPersistedSession();
        },
        []
    );

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

        const startedAt = startedAtMs ?? Date.now();
        if (!startedAtMs) setStartedAtMs(startedAt);
        setCompletedAtMs(null);

        const makeAbortError = () => {
            const err = new Error("Aborted");
            (err as any).name = "AbortError";
            return err;
        };

        const throwIfCancelled = () => {
            if (controller.signal.aborted) throw makeAbortError();
            if (runId !== runIdRef.current) throw makeAbortError();
        };

        try {
            throwIfCancelled();
            // STEP 1: Preprocessing
            const preprocessStart = Date.now();
            updateStep("preprocess", { status: "running", startTime: preprocessStart });

            let imageDataUrl = processedImageDataUrl;
            if (!imageDataUrl) {
                imageDataUrl = await preprocessImage(file as File);
                throwIfCancelled();
                setProcessedImageDataUrl(imageDataUrl);
            }

            const preprocessEnd = Date.now();
            updateStep("preprocess", { status: "done", endTime: preprocessEnd, durationMs: preprocessEnd - preprocessStart });

            // STEP 2: OCR
            const ocrStart = Date.now();
            updateStep("ocr", { status: "running", startTime: ocrStart });

            let ocrText = extractedText || "";
            if (!ocrText) {
                const ocrResponse = await fetch("/api/ocr/gemini", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ image: imageDataUrl }),
                    signal: controller.signal,
                });

                const ocrData = await ocrResponse.json().catch(() => ({}));
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
                    ocrText = await runLocalOcr(imageDataUrl);
                    throwIfCancelled();
                } else if ((ocrData as any)?.error) {
                    if ((ocrData as any)?.retryAfterSeconds) {
                        throw new Error(`System cooling down. Please retry in ${(ocrData as any).retryAfterSeconds}s.`);
                    }
                    throw new Error((ocrData as any).error);
                } else {
                    ocrText = String((ocrData as any)?.extractedText || "").trim();
                }

                if (!ocrText) throw new Error("OCR found no text.");
                setExtractedText(ocrText);
            }

            const ocrEnd = Date.now();
            updateStep("ocr", { status: "done", endTime: ocrEnd, durationMs: ocrEnd - ocrStart });

            // STEP 3: Analysis
            const analyzeStart = Date.now();
            updateStep("analyze", { status: "running", startTime: analyzeStart });

            const effectiveProfileId = profileIdOverride || subjectProfileId || user.id;

            const analyzeResponse = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: ocrText, language: resultsLanguage, fdaEnabled: fdaDrugsEnabled, profileId: effectiveProfileId }),
                signal: controller.signal,
            });

            const analysisText = await analyzeResponse.text();
            throwIfCancelled();
            let analysisData: any;
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

            const analyzeEnd = Date.now();
            updateStep("analyze", { status: "done", endTime: analyzeEnd, durationMs: analyzeEnd - analyzeStart });

            // STEP 4: Structuring / Finalization
            const structureStart = Date.now();
            updateStep("structure", { status: "running", startTime: structureStart });

            throwIfCancelled();
            setFinalResult(analysisData);

            const structureEnd = Date.now();
            updateStep("structure", { status: "done", endTime: structureEnd, durationMs: structureEnd - structureStart });

            setIsScanning(false);
            const completedAt = Date.now();
            setCompletedAtMs(completedAt);
            setTotalDuration(((completedAt - startedAt) / 1000).toFixed(1));
        } catch (error: any) {
            const isAbort = error?.name === "AbortError" || controller.signal.aborted || runId !== runIdRef.current;
            if (!isAbort) {
                console.error(error);
            }

            // Ignore stale runs; a newer run is in progress.
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
        } finally {
            runningRef.current = false;
            if (abortRef.current === controller) abortRef.current = null;
        }
    }, [
        extractedText,
        file,
        preprocessImage,
        processedImageDataUrl,
        subjectProfileId,
        fdaDrugsEnabled,
        resultsLanguage,
        runLocalOcr,
        startedAtMs,
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

    // Warn user before refreshing/closing during active scan
    useEffect(() => {
        if (!isScanning) return;
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [isScanning]);

    // Terminate OCR worker on provider unmount
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

    // Revoke preview URL when it changes/unmounts
    useEffect(() => {
        return () => {
            if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
        };
    }, [previewObjectUrl]);

    // Restore & auto-resume after refresh
    useEffect(() => {
        const session = loadPersistedSession();
        if (session) {
            setProcessedImageDataUrl(session.processedImageDataUrl || null);
            setExtractedText(session.extractedText || null);
            setFinalResult(session.finalResult || null);
            setErrorMsg(session.errorMsg || null);
            setErrorAction(session.errorAction || null);
            setStartedAtMs(session.startedAtMs || null);
            setCompletedAtMs(session.completedAtMs || null);
            setSubjectProfileIdState(session.subjectProfileId || null);

            if (session.status === "running") {
                // Normalize step statuses based on what we can actually resume from.
                const canSkipPreprocess = Boolean(session.processedImageDataUrl);
                const canSkipOcr = Boolean(session.extractedText);

                setSteps(
                    INITIAL_STEPS.map((s) => {
                        if (s.id === "preprocess" && canSkipPreprocess) return { ...s, status: "done" };
                        if (s.id === "ocr" && canSkipOcr) return { ...s, status: "done" };
                        return s;
                    })
                );

                setIsScanning(true);
                pendingResumeRef.current = session;
            } else if (session.status === "done") {
                setIsScanning(false);
                if (session.startedAtMs && session.completedAtMs && session.completedAtMs >= session.startedAtMs) {
                    setTotalDuration(((session.completedAtMs - session.startedAtMs) / 1000).toFixed(1));
                } else {
                    const byStepsMs = Array.isArray(session.steps)
                        ? session.steps.reduce((sum, s) => sum + (typeof s.durationMs === "number" ? s.durationMs : 0), 0)
                        : 0;
                    if (byStepsMs > 0) setTotalDuration((byStepsMs / 1000).toFixed(1));
                }
            }
        }

        setHydrated(true);
    }, []);

    // Persist scan session (without spamming localStorage on every timer tick)
    useEffect(() => {
        if (!hydrated) return;
        if (typeof window === "undefined") return;
        const now = Date.now();
        if (now - lastPersistAtRef.current < 400) return;
        lastPersistAtRef.current = now;

        const status: PersistedScanSession["status"] = isScanning
            ? "running"
            : finalResult
                ? "done"
                : errorMsg
                    ? "error"
                    : "idle";

        const session: PersistedScanSession = {
            version: 1,
            updatedAt: now,
            status,
            startedAtMs,
            completedAtMs,
            language: resultsLanguage === "ar" ? "ar" : "en",
            subjectProfileId: subjectProfileId || (user ? user.id : null),
            steps,
            fileName: file?.name || null,
            processedImageDataUrl,
            extractedText,
            finalResult,
            errorMsg,
            errorAction,
        };

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        } catch {
            // ignore
        }
    }, [
        hydrated,
        completedAtMs,
        errorAction,
        errorMsg,
        extractedText,
        file?.name,
        finalResult,
        isScanning,
        processedImageDataUrl,
        resultsLanguage,
        startedAtMs,
        subjectProfileId,
        user,
        steps,
    ]);

    // Auto-resume once after refresh when user is available
    useEffect(() => {
        if (resumedOnceRef.current) return;
        if (!pendingResumeRef.current) return;
        if (!user) return;

        resumedOnceRef.current = true;
        void startScan();
    }, [startScan, user]);

    const value = useMemo<ScanContextValue>(
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
            setFile,
            resetScan,
            startScan,
        }),
        [errorAction, errorMsg, extractedText, file, finalResult, isScanning, previewSrc, processedImageDataUrl, resetScan, setFile, setSubjectProfileId, startScan, steps, subjectProfileId, totalDuration]
    );

    return <ScanContext.Provider value={value}>{children}</ScanContext.Provider>;
};

export const useScan = () => {
    const context = useContext(ScanContext);
    if (context === undefined) {
        throw new Error("useScan must be used within a ScanProvider");
    }
    return context;
};
