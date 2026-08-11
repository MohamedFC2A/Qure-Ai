import { NextResponse } from "next/server";
import { getDeepSeekApiKey, getDeepSeekModel } from "@/lib/ai/deepseek";

export async function GET() {
    const status: Record<string, string> = {};

    let aiKey = "";
    try {
        aiKey = getDeepSeekApiKey();
    } catch {
        aiKey = "";
    }

    const activeModel = getDeepSeekModel();
    const visionModel = process.env.OCR_VISION_MODEL || "YoannDev90/muse-glimmer-30b:free";

    status.pollinationsAI = aiKey ? `connected:${activeModel}` : "missing_key";
    status.ocrVision = aiKey ? `connected:${visionModel}` : "missing_key";
    status.status = "operational";

    return NextResponse.json(status);
}
