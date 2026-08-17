export interface StoredScanItem {
    id: string;
    user_id?: string;
    profile_id?: string;
    drug_name: string;
    manufacturer: string;
    created_at: string;
    analysis_json: any;
}

const LOCAL_STORAGE_KEY = "qurescan_scans_history_v1";

export function getLocalScans(): StoredScanItem[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function saveLocalScan(analysisResult: any, profileId?: string | null): StoredScanItem | null {
    if (typeof window === "undefined" || !analysisResult) return null;
    try {
        if (analysisResult.scanType === "wound" || analysisResult.woundTitle) {
            const woundTitle = analysisResult.woundTitle || analysisResult.woundTitleEn || "Wound Assessment";
            const loc = analysisResult.anatomicalLocation?.location || "الساعد / الذراع";
            const existing = getLocalScans();
            const matchedId = analysisResult.id || `local-wound-${Date.now()}`;
            const newItem: StoredScanItem = {
                id: matchedId,
                profile_id: profileId || undefined,
                drug_name: woundTitle,
                manufacturer: `موضع: ${loc}`,
                created_at: new Date().toISOString(),
                analysis_json: analysisResult,
            };
            existing.unshift(newItem);
            const finalItems = existing.slice(0, 100);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(finalItems));
            return newItem;
        }

        const drugName = analysisResult.drugNameEn || analysisResult.drugName || "Medication";
        if (!drugName || drugName === "Unknown") return null;

        const normDrug = String(drugName).trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ");

        const existing = getLocalScans();
        let isMerged = false;
        let scanCount = 1;
        let matchedId = analysisResult.meta?.historyId || `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

        const updated = existing.map((item) => {
            const normExisting = String(item.drug_name || "").trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ");
            const isMatch = normExisting === normDrug || (normExisting.length >= 4 && normDrug.length >= 4 && (normExisting.includes(normDrug) || normDrug.includes(normExisting)));

            if (isMatch) {
                isMerged = true;
                matchedId = item.id;
                const prevCount = item.analysis_json?.meta?.scanCount || 1;
                scanCount = prevCount + 1;

                return {
                    ...item,
                    drug_name: drugName, // Update name if refined
                    created_at: new Date().toISOString(),
                    analysis_json: {
                        ...(item.analysis_json || {}),
                        ...analysisResult,
                        dosage: analysisResult.dosage || item.analysis_json?.dosage,
                        meta: {
                            ...(analysisResult.meta || {}),
                            historyId: matchedId,
                            isMergedRecord: true,
                            scanCount: scanCount,
                        },
                    },
                };
            }
            return item;
        });

        if (!isMerged) {
            const newItem: StoredScanItem = {
                id: matchedId,
                profile_id: profileId || analysisResult.meta?.subjectProfileId || undefined,
                drug_name: drugName,
                manufacturer: analysisResult.manufacturer || "Generic",
                created_at: new Date().toISOString(),
                analysis_json: {
                    ...analysisResult,
                    meta: {
                        ...(analysisResult.meta || {}),
                        isMergedRecord: false,
                        scanCount: 1,
                    },
                },
            };
            updated.unshift(newItem);
        } else {
            // Move merged item to top
            updated.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }

        const finalItems = updated.slice(0, 100);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(finalItems));

        const returnItem = finalItems.find((it) => it.id === matchedId) || finalItems[0];
        return returnItem;
    } catch (e) {
        console.warn("Failed to save local scan:", e);
        return null;
    }
}

export function deleteLocalScan(id: string): boolean {
    if (typeof window === "undefined" || !id) return false;
    try {
        const existing = getLocalScans();
        const filtered = existing.filter((item) => item.id !== id && item.analysis_json?.meta?.historyId !== id);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
        return true;
    } catch (e) {
        console.warn("Failed to delete local scan:", e);
        return false;
    }
}

export function clearLocalScans(): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
        console.warn("Failed to clear local scans:", e);
    }
}

export function mergeHistoryItems(remoteItems: StoredScanItem[], localItems: StoredScanItem[]): StoredScanItem[] {
    const map = new Map<string, StoredScanItem>();

    // Add local items first
    for (const item of localItems) {
        const key = item.id || `${(item.drug_name || "").toLowerCase().trim()}_${(item.created_at || "").slice(0, 19)}`;
        map.set(key, item);
    }

    // Remote items override local items if duplicate key
    for (const item of remoteItems) {
        const key = item.id || `${(item.drug_name || "").toLowerCase().trim()}_${(item.created_at || "").slice(0, 19)}`;
        map.set(key, item);
    }

    const merged = Array.from(map.values());
    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return merged;
}
