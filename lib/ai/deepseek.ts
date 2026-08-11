import OpenAI from "openai";

const DEFAULT_POLLINATIONS_KEY = "sk_3cpHv0pELis47TdPWKSNvMwrJZKLXh1Y";
const DEFAULT_POLLINATIONS_BASE_URL = "https://gen.pollinations.ai/v1";
const DEFAULT_POLLINATIONS_MODEL = "openai";

export function getDeepSeekApiKey(): string {
    const envKey = process.env.POLLINATIONS_API_KEY?.trim() || process.env.DEEPSEEK_API_KEY?.trim();
    // Only accept valid Pollinations keys (starting with sk_). Ignore legacy DeepSeek keys (sk-...) or placeholders.
    if (envKey && envKey.startsWith("sk_")) {
        return envKey;
    }
    return DEFAULT_POLLINATIONS_KEY;
}

export function getDeepSeekBaseUrl(): string {
    const envUrl = process.env.POLLINATIONS_BASE_URL?.trim() || process.env.DEEPSEEK_BASE_URL?.trim();
    if (envUrl && envUrl.includes("pollinations.ai")) {
        return envUrl;
    }
    return DEFAULT_POLLINATIONS_BASE_URL;
}

export const DEEPSEEK_BASE_URL = DEFAULT_POLLINATIONS_BASE_URL;

export function getDeepSeekModel(): string {
    const envModel = process.env.POLLINATIONS_MODEL?.trim() || process.env.DEEPSEEK_MODEL?.trim();
    if (envModel && !envModel.includes("chirag-gamer") && !envModel.includes("gemini")) {
        return envModel;
    }
    return DEFAULT_POLLINATIONS_MODEL;
}

export const DEEPSEEK_MODEL = DEFAULT_POLLINATIONS_MODEL;

export function getTextModelsToTry(): string[] {
    const configured = getDeepSeekModel();
    const defaults = ["openai", "deepseek", "gpt-oss", "llama", "mistral"];
    if (configured && !defaults.includes(configured)) {
        return [configured, ...defaults];
    }
    return defaults;
}

export function createPollinationsClient(customKey?: string, customBaseUrl?: string): OpenAI {
    const apiKey = (customKey && customKey.startsWith("sk_")) ? customKey : getDeepSeekApiKey();
    const baseURL = (customBaseUrl && customBaseUrl.includes("pollinations.ai")) ? customBaseUrl : getDeepSeekBaseUrl();
    return new OpenAI({
        apiKey,
        baseURL,
        defaultQuery: { key: apiKey },
        defaultHeaders: {
            "Authorization": `Bearer ${apiKey}`
        }
    });
}
