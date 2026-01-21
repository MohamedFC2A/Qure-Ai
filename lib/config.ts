export const SITE_CONFIG = {
    name: "MedVision AI",
    description: "Military-grade pharmaceutical analysis.",
    url: (() => {
        const envBaseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "").trim();
        const vercelUrl = (process.env.VERCEL_URL || "").trim();
        const isVercel = process.env.VERCEL === "1" || Boolean(vercelUrl);

        const looksLikeLocalhost = (value: string) =>
            /^(?:https?:\/\/)?(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?(?:\/|$)/i.test(value);

        // On Vercel, do not allow a localhost base URL to break redirects.
        if (isVercel) {
            if (envBaseUrl && !looksLikeLocalhost(envBaseUrl)) return envBaseUrl.replace(/\/+$/, "");
            if (vercelUrl) return `https://${vercelUrl}`;
        }

        if (envBaseUrl) return envBaseUrl.replace(/\/+$/, "");
        return "http://localhost:3000";
    })(),
};

export function getBaseUrl() {
    if (typeof window !== "undefined") {
        return window.location.origin;
    }

    return SITE_CONFIG.url;
}
