/* ================================================================
   NLM RxNorm & RxNav REST API Service Client
   National Institutes of Health (NIH) / National Library of Medicine
   ================================================================ */

import { searchLocalRxNormDb, RXNORM_LOCAL_DATABASE, type RxNormConcept } from "./rxnormLocalDb";

const RXNAV_BASE_URL = "https://rxnav.nlm.nih.gov/REST";

export interface RxNormSearchResult {
    rxcui: string;
    name: string;
    synonym?: string;
    tty?: string;
    score?: number;
    source: "rxnav_api" | "local_db";
    activeIngredients?: string[];
    doseForm?: string;
    atcCode?: string;
    categoryEn?: string;
    categoryAr?: string;
}

export interface RxNormConceptDetails {
    rxcui: string;
    name: string;
    tty?: string;
    synonyms?: string[];
    activeIngredients?: Array<{ rxcui: string; name: string }>;
    brandNames?: Array<{ rxcui: string; name: string }>;
    doseForms?: string[];
    ndcs?: string[];
    source: "rxnav_api" | "local_db";
}

// In-memory cache for fast repeated lookups
const rxnormCache = new Map<string, RxNormSearchResult | null>();

/**
 * Searches RxNorm for a drug name or OCR label snippet using RxNav API
 * with local offline fallback.
 */
export async function searchRxNorm(term: string): Promise<RxNormSearchResult | null> {
    if (!term || !term.trim()) return null;
    const cleanTerm = term.trim();
    const cacheKey = `rx_search_${cleanTerm.toLowerCase()}`;

    if (rxnormCache.has(cacheKey)) {
        return rxnormCache.get(cacheKey) || null;
    }

    // 1. Check local pre-bundled database for instant 0ms match
    const localMatch = searchLocalRxNormDb(cleanTerm);
    if (localMatch) {
        const result: RxNormSearchResult = {
            rxcui: localMatch.rxcui,
            name: localMatch.nameEn,
            synonym: localMatch.synonyms[0],
            tty: localMatch.tty,
            source: "local_db",
            activeIngredients: localMatch.activeIngredients,
            doseForm: localMatch.doseForm,
            atcCode: localMatch.atcCode,
            categoryEn: localMatch.categoryEn,
            categoryAr: localMatch.categoryAr,
        };
        rxnormCache.set(cacheKey, result);
        return result;
    }

    // 2. Fetch live from NLM RxNav REST API
    try {
        const exactUrl = `${RXNAV_BASE_URL}/rxcui.json?name=${encodeURIComponent(cleanTerm)}`;
        const res = await fetch(exactUrl, {
            headers: { Accept: "application/json" },
            next: { revalidate: 86400 }, // Cache for 24 hours
        });

        if (res.ok) {
            const data = await res.json();
            const rxnormIds = data?.idGroup?.rxnormId;
            if (Array.isArray(rxnormIds) && rxnormIds.length > 0) {
                const rxcui = rxnormIds[0];
                const conceptProps = await getRxNormProperties(rxcui);

                const result: RxNormSearchResult = {
                    rxcui,
                    name: conceptProps?.name || cleanTerm,
                    synonym: conceptProps?.synonym,
                    tty: conceptProps?.tty,
                    source: "rxnav_api",
                };

                rxnormCache.set(cacheKey, result);
                return result;
            }
        }

        // 3. Fallback: Try NLM Approximate Matching (for OCR typos or noisy labels)
        const approxUrl = `${RXNAV_BASE_URL}/approximateTerm.json?term=${encodeURIComponent(cleanTerm)}&maxEntries=1`;
        const approxRes = await fetch(approxUrl, {
            headers: { Accept: "application/json" },
            next: { revalidate: 86400 },
        });

        if (approxRes.ok) {
            const approxData = await approxRes.json();
            const candidates = approxData?.approximateGroup?.candidate;
            if (Array.isArray(candidates) && candidates.length > 0) {
                const best = candidates[0];
                const result: RxNormSearchResult = {
                    rxcui: best.rxcui,
                    name: best.name || cleanTerm,
                    score: parseFloat(best.score || "0"),
                    source: "rxnav_api",
                };
                rxnormCache.set(cacheKey, result);
                return result;
            }
        }
    } catch (e) {
        console.warn(`RxNav API lookup error for term "${cleanTerm}":`, e);
    }

    rxnormCache.set(cacheKey, null);
    return null;
}

/**
 * Gets RxNorm concept properties (Name, TTY, Synonym) by RxCUI.
 */
export async function getRxNormProperties(rxcui: string) {
    if (!rxcui) return null;
    try {
        const url = `${RXNAV_BASE_URL}/rxcui/${encodeURIComponent(rxcui)}/properties.json`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (res.ok) {
            const data = await res.json();
            const props = data?.properties;
            if (props) {
                return {
                    rxcui: props.rxcui,
                    name: props.name,
                    synonym: props.synonym,
                    tty: props.tty,
                };
            }
        }
    } catch (e) {
        console.warn(`RxNav properties error for RxCUI ${rxcui}:`, e);
    }
    return null;
}

/**
 * Retrieves active ingredients, dose forms, and brand names for an RxCUI.
 */
export async function getRxNormConceptDetails(rxcui: string): Promise<RxNormConceptDetails | null> {
    if (!rxcui) return null;

    // Check local database first
    if (RXNORM_LOCAL_DATABASE[rxcui]) {
        const d = RXNORM_LOCAL_DATABASE[rxcui];
        return {
            rxcui: d.rxcui,
            name: d.nameEn,
            tty: d.tty,
            synonyms: d.synonyms,
            activeIngredients: d.activeIngredients.map((name: string) => ({ rxcui: d.rxcui, name })),
            doseForms: d.doseForm ? [d.doseForm] : [],
            source: "local_db",
        };
    }

    try {
        const url = `${RXNAV_BASE_URL}/rxcui/${encodeURIComponent(rxcui)}/allrelated.json`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (res.ok) {
            const data = await res.json();
            const conceptGroups = data?.allRelatedGroup?.conceptGroup || [];

            const activeIngredients: Array<{ rxcui: string; name: string }> = [];
            const brandNames: Array<{ rxcui: string; name: string }> = [];
            const doseForms: string[] = [];

            for (const group of conceptGroups) {
                const tty = group.tty;
                const concepts = group.conceptProperties || [];

                if (tty === "IN" || tty === "PIN") {
                    concepts.forEach((c: any) => {
                        if (c.rxcui && c.name) activeIngredients.push({ rxcui: c.rxcui, name: c.name });
                    });
                } else if (tty === "BN") {
                    concepts.forEach((c: any) => {
                        if (c.rxcui && c.name) brandNames.push({ rxcui: c.rxcui, name: c.name });
                    });
                } else if (tty === "DF") {
                    concepts.forEach((c: any) => {
                        if (c.name) doseForms.push(c.name);
                    });
                }
            }

            const props = await getRxNormProperties(rxcui);

            return {
                rxcui,
                name: props?.name || `RxCUI ${rxcui}`,
                tty: props?.tty,
                synonyms: props?.synonym ? [props.synonym] : [],
                activeIngredients,
                brandNames,
                doseForms,
                source: "rxnav_api",
            };
        }
    } catch (e) {
        console.warn(`RxNav concept details error for RxCUI ${rxcui}:`, e);
    }

    return null;
}

/**
 * Maps a National Drug Code (NDC) package identifier to RxNorm RxCUI.
 */
export async function getRxNormByNDC(ndc: string): Promise<string | null> {
    if (!ndc) return null;
    const cleanNdc = ndc.replace(/[^0-9]/g, "");
    try {
        const url = `${RXNAV_BASE_URL}/ndcstatus.json?ndc=${encodeURIComponent(cleanNdc)}`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (res.ok) {
            const data = await res.json();
            const rxcui = data?.ndcStatus?.rxcui;
            if (rxcui) return String(rxcui);
        }
    } catch (e) {
        console.warn(`RxNav NDC lookup error for NDC ${ndc}:`, e);
    }
    return null;
}
