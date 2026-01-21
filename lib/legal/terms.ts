export const TERMS_VERSION = "2026-01-20";

export type TermsAcceptanceStatus =
    | { accepted: true; version: string; acceptedAt?: string | null }
    | { accepted: false; version: string; acceptedAt?: string | null };

export function getTermsAcceptance(user: any): TermsAcceptanceStatus {
    const meta = (user && (user.user_metadata || user.user_metadata === 0) ? user.user_metadata : null) as any;
    const acceptedAt = meta?.terms_accepted_at ? String(meta.terms_accepted_at) : null;
    const version = meta?.terms_version ? String(meta.terms_version) : "";

    const accepted = Boolean(acceptedAt) && version === TERMS_VERSION;
    return accepted
        ? { accepted: true, version: TERMS_VERSION, acceptedAt }
        : { accepted: false, version: TERMS_VERSION, acceptedAt };
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

