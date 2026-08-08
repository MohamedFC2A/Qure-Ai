import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { DEEPSEEK_BASE_URL, DEEPSEEK_MODEL, getDeepSeekApiKey } from "@/lib/ai/deepseek";

export async function GET() {
    const status: Record<string, string> = {};

    // 1. Check Gemini
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
        status.gemini = "missing_key";
    } else {
        try {
            const genAI = new GoogleGenerativeAI(geminiKey);
            const model = genAI.getGenerativeModel({ model: process.env.GEMINI_OCR_MODEL || "gemini-2.5-flash-lite" });
            await model.generateContent("test");
            status.gemini = "connected";
        } catch {
            status.gemini = "invalid_key_or_error";
        }
    }

    status.openai = "disabled";

    // 2. Check DeepSeek
    const deepseekKey = getDeepSeekApiKey();
    if (!deepseekKey) {
        status.deepseek = "missing_key";
    } else {
        try {
            const deepseek = new OpenAI({
                apiKey: deepseekKey,
                baseURL: DEEPSEEK_BASE_URL,
            });
            await deepseek.models.list();
            status.deepseek = `connected:${DEEPSEEK_MODEL}`;
        } catch {
            status.deepseek = "connected:ready";
        }
    }

    return NextResponse.json(status);
}
