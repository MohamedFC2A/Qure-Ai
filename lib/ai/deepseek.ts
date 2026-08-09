export const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
export const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";

export function getDeepSeekApiKey(): string {
    const envKey = process.env.DEEPSEEK_API_KEY?.trim();
    if (!envKey || envKey === "your-deepseek-api-key") {
        throw new Error("DEEPSEEK_API_KEY environment variable is not configured.");
    }
    return envKey;
}

export function getDeepSeekModel(): string {
    return process.env.DEEPSEEK_MODEL || "deepseek-chat";
}
