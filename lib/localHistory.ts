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
        const drugName = analysisResult.drugNameEn || analysisResult.drugName || "Medication";
        if (!drugName || drugName === "Unknown") return null;

        const newItem: StoredScanItem = {
            id: analysisResult.meta?.historyId || `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            profile_id: profileId || analysisResult.meta?.subjectProfileId || undefined,
            drug_name: drugName,
            manufacturer: analysisResult.manufacturer || "Generic",
            created_at: new Date().toISOString(),
            analysis_json: analysisResult,
        };

        const existing = getLocalScans();
        // Remove duplicate entries for same drug within 1 minute
        const filtered = existing.filter(
            (item) => item.drug_name !== newItem.drug_name || (Date.now() - new Date(item.created_at).getTime() > 60000)
        );

        const updated = [newItem, ...filtered].slice(0, 50); // Keep max 50 recent scans
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        return newItem;
    } catch (e) {
        console.warn("Failed to save local scan:", e);
        return null;
    }
}

export function mergeHistoryItems(remoteItems: StoredScanItem[], localItems: StoredScanItem[]): StoredScanItem[] {
    const map = new Map<string, StoredScanItem>();

    // Add local items first
    for (const item of localItems) {
        const key = (item.drug_name || "").toLowerCase().trim() + "_" + (item.created_at || "").slice(0, 16);
        map.set(key, item);
    }

    // Remote items override local items if duplicate key
    for (const item of remoteItems) {
        const key = (item.drug_name || "").toLowerCase().trim() + "_" + (item.created_at || "").slice(0, 16);
        map.set(key, item);
    }

    const merged = Array.from(map.values());
    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return merged;
}
