export const SITE_CONFIG = {
    name: "MedVision AI",
    description: "Military-grade pharmaceutical analysis.",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://qure-ai-nexus.vercel.app",
};

export function getBaseUrl() {
    return SITE_CONFIG.url;
}
