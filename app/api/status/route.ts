import { NextResponse } from "next/server";
import { getDeepSeekApiKey, getDeepSeekModel } from "@/lib/ai/deepseek";

export async function GET() {
    const status: Record<string, string> = {};

    // 1. Check Gemini key configuration
    const geminiKey = process.env.GEMINI_API_KEY;
    status.gemini = geminiKey ? "connected" : "missing_key";

    status.openai = "disabled";

    // 2. Check DeepSeek key configuration (zero API token cost)
    const deepseekKey = getDeepSeekApiKey();
    status.deepseek = deepseekKey ? `connected:${getDeepSeekModel()}` : "missing_key";

    return NextResponse.json(status);
}
