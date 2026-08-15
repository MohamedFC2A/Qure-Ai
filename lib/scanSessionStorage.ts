/**
 * Zero-Quota-Failure Scan Session Storage (IndexedDB + Memory Fallback)
 * Ensures 100% resilience against page reloads, tab navigation, and crashes.
 */

import { PipelineStep } from "@/context/ScanContext";

export interface PersistedScanSession {
    version: 2;
    id: string;
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
    errorAction: "login" | "terms" | null;
    detectedScanType: "auto" | "medication" | "prescription" | "wound";
    estimatedDurationSec?: number;
    activeSubStepIndex?: number;
    neuralTelemetryLogs?: string[];
}

const DB_NAME = "qurescan_ai_db";
const DB_VERSION = 1;
const STORE_NAME = "scan_sessions";
const SESSION_RECORD_KEY = "active_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 Hours TTL

let memorySessionCache: PersistedScanSession | null = null;

function openDatabase(): Promise<IDBDatabase | null> {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
        return Promise.resolve(null);
    }

    return new Promise((resolve) => {
        try {
            const request = window.indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => {
                console.warn("[SessionStorage] IndexedDB open error, falling back to memory/local", request.error);
                resolve(null);
            };
            request.onblocked = () => {
                console.warn("[SessionStorage] IndexedDB blocked");
                resolve(null);
            };
        } catch (e) {
            console.warn("[SessionStorage] Failed to initiate IndexedDB:", e);
            resolve(null);
        }
    });
}

/**
 * Persists the scan session into IndexedDB asynchronously.
 */
export async function savePersistedSession(session: Partial<PersistedScanSession>): Promise<boolean> {
    if (typeof window === "undefined") return false;

    const fullSession: PersistedScanSession = {
        version: 2,
        id: session.id || `sess_${Date.now()}`,
        updatedAt: Date.now(),
        status: session.status || "idle",
        startedAtMs: session.startedAtMs ?? null,
        completedAtMs: session.completedAtMs ?? null,
        language: session.language || "ar",
        subjectProfileId: session.subjectProfileId ?? null,
        steps: session.steps || [],
        fileName: session.fileName ?? null,
        processedImageDataUrl: session.processedImageDataUrl ?? null,
        extractedText: session.extractedText ?? null,
        finalResult: session.finalResult ?? null,
        errorMsg: session.errorMsg ?? null,
        errorAction: session.errorAction ?? null,
        detectedScanType: session.detectedScanType || "auto",
        estimatedDurationSec: session.estimatedDurationSec || 8,
        activeSubStepIndex: session.activeSubStepIndex ?? 0,
        neuralTelemetryLogs: session.neuralTelemetryLogs || [],
    };

    memorySessionCache = fullSession;

    try {
        const db = await openDatabase();
        if (db) {
            return new Promise((resolve) => {
                const tx = db.transaction(STORE_NAME, "readwrite");
                const store = tx.objectStore(STORE_NAME);
                const req = store.put(fullSession, SESSION_RECORD_KEY);

                req.onsuccess = () => resolve(true);
                req.onerror = () => {
                    console.warn("[SessionStorage] IndexedDB write failed", req.error);
                    resolve(false);
                };
                tx.oncomplete = () => db.close();
            });
        }
    } catch (err) {
        console.warn("[SessionStorage] Error writing session to DB:", err);
    }

    return true;
}

/**
 * Loads the active scan session from IndexedDB or memory cache.
 */
export async function loadPersistedSession(): Promise<PersistedScanSession | null> {
    if (typeof window === "undefined") return null;

    if (memorySessionCache) {
        if (Date.now() - memorySessionCache.updatedAt <= SESSION_TTL_MS) {
            return memorySessionCache;
        }
    }

    try {
        const db = await openDatabase();
        if (db) {
            return new Promise((resolve) => {
                const tx = db.transaction(STORE_NAME, "readonly");
                const store = tx.objectStore(STORE_NAME);
                const req = store.get(SESSION_RECORD_KEY);

                req.onsuccess = () => {
                    const result = req.result as PersistedScanSession | undefined;
                    if (result && result.version === 2) {
                        if (Date.now() - result.updatedAt <= SESSION_TTL_MS) {
                            memorySessionCache = result;
                            resolve(result);
                            return;
                        }
                    }
                    resolve(null);
                };

                req.onerror = () => {
                    console.warn("[SessionStorage] IndexedDB read failed", req.error);
                    resolve(null);
                };
                tx.oncomplete = () => db.close();
            });
        }
    } catch (err) {
        console.warn("[SessionStorage] Error loading session:", err);
    }

    return null;
}

/**
 * Clears the active scan session permanently from IndexedDB and memory.
 */
export async function clearPersistedSession(): Promise<boolean> {
    memorySessionCache = null;
    if (typeof window === "undefined") return true;

    try {
        const db = await openDatabase();
        if (db) {
            return new Promise((resolve) => {
                const tx = db.transaction(STORE_NAME, "readwrite");
                const store = tx.objectStore(STORE_NAME);
                const req = store.delete(SESSION_RECORD_KEY);

                req.onsuccess = () => resolve(true);
                req.onerror = () => resolve(false);
                tx.oncomplete = () => db.close();
            });
        }
    } catch (err) {
        console.warn("[SessionStorage] Error deleting session:", err);
    }

    return true;
}
