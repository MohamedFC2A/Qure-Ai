export const DEEPSEEK_MODEL = process.env.POLLINATIONS_MODEL || process.env.DEEPSEEK_MODEL || "chirag-gamer/gpt-oss-120b";
export const DEEPSEEK_BASE_URL = process.env.POLLINATIONS_BASE_URL || process.env.DEEPSEEK_BASE_URL || "https://gen.pollinations.ai/v1";

export function getDeepSeekApiKey(): string {
    const envKey = process.env.POLLINATIONS_API_KEY?.trim() || process.env.DEEPSEEK_API_KEY?.trim();
    if (!envKey || envKey === "your-deepseek-api-key" || envKey === "your-pollinations-api-key") {
        throw new Error("POLLINATIONS_API_KEY / DEEPSEEK_API_KEY environment variable is not configured.");
    }
    return envKey;
}

export function getDeepSeekModel(): string {
    return process.env.POLLINATIONS_MODEL || process.env.DEEPSEEK_MODEL || "chirag-gamer/gpt-oss-120b";
}
