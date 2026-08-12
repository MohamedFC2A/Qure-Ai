export const TERMS_VERSION = "2026-01-20";

export type TermsAcceptanceStatus =
    | { accepted: true; version: string; acceptedAt?: string | null }
    | { accepted: false; version: string; acceptedAt?: string | null };

export function getTermsAcceptance(user: any): TermsAcceptanceStatus {
    if (!user) {
        if (typeof window !== "undefined") {
            const clientSaved = localStorage.getItem("qurescan_terms_accepted");
            if (clientSaved) return { accepted: true, version: TERMS_VERSION, acceptedAt: clientSaved };
        }
        return { accepted: false, version: TERMS_VERSION, acceptedAt: null };
    }

    if (user?.id === "local-dev-user" || user?.id === "00000000-0000-0000-0000-000000000001") {
        return { accepted: true, version: TERMS_VERSION, acceptedAt: new Date().toISOString() };
    }

    const meta = (user.user_metadata || user.app_metadata || {}) as any;
    const acceptedAt = meta?.terms_accepted_at || user?.terms_accepted_at || null;
    const version = meta?.terms_version || user?.terms_version || "";

    const accepted = Boolean(acceptedAt) || (Boolean(version) && version === TERMS_VERSION);
    if (accepted) {
        return { accepted: true, version: version || TERMS_VERSION, acceptedAt: String(acceptedAt || new Date().toISOString()) };
    }

    if (typeof window !== "undefined") {
        const clientSaved = localStorage.getItem("qurescan_terms_accepted");
        if (clientSaved) return { accepted: true, version: TERMS_VERSION, acceptedAt: clientSaved };
    }

    return { accepted: false, version: TERMS_VERSION, acceptedAt: null };
}

export function hasAcceptedTerms(user: any): boolean {
    return getTermsAcceptance(user).accepted;
}

export function safeNextPath(input: unknown, fallback: string): string {
    const value = String(input || "").trim();
    if (!value) return fallback;
    if (!value.startsWith("/")) return fallback;
    if (value.startsWith("//")) return fallback;
    if (value.includes("\\")) return fallback;
    return value;
}

