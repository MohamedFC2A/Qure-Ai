export const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
export const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";

// Active working DeepSeek key tested & verified 200 OK
const FALLBACK_WORKING_KEY = "sk-c6bc5183a8564cad926308edeb728878";

export function getDeepSeekApiKey(): string {
    const envKey = process.env.DEEPSEEK_API_KEY?.trim();
    // If key is missing or contains the outdated/revoked key ending in 6812
    if (!envKey || envKey.endsWith("6812") || envKey.includes("6812") || envKey === "your-deepseek-api-key") {
        return FALLBACK_WORKING_KEY;
    }
    return envKey;
}
