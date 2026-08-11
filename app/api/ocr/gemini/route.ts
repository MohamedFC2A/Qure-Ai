import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createPollinationsClient, getDeepSeekApiKey } from "@/lib/ai/deepseek";
import { createClient } from "@/lib/supabase/server";
import { deductCredit, getCreditsStatus } from "@/lib/creditService";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasAcceptedTerms } from "@/lib/legal/terms";
import { getLocalDevUser } from "@/lib/devAuth";

export async function POST(req: NextRequest) {
    const startTime = Date.now();
    try {
        const localDevUser = getLocalDevUser(req);
        const supabase = localDevUser ? null : await createClient();
        const { data: { user } } = localDevUser
            ? { data: { user: localDevUser } }
            : await supabase!.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!localDevUser && !hasAcceptedTerms(user)) {
            return NextResponse.json({ error: "Terms acceptance required", code: "TERMS_REQUIRED" }, {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Credits deduction requires admin privileges (service role) to bypass RLS.
        if (!localDevUser && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("[OCR API] SUPABASE_SERVICE_ROLE_KEY is missing");
            return NextResponse.json(
                { error: "Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing (required for credits deduction)." },
                {
                    status: 503,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Pre-check credits (don't charge if OCR fails).
        if (!localDevUser) {
            const supabaseAdmin = createAdminClient();
            const status = await getCreditsStatus(user.id, supabaseAdmin);
            if ((status?.totalAvailable ?? 0) < 1) {
                return NextResponse.json({ error: "Insufficient credits. Please upgrade your plan." }, {
                    status: 402,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        const { image } = await req.json();
        if (!image) {
            return NextResponse.json(
                { error: "Missing image data." },
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }
        let apiKey = "";
        try {
            apiKey = getDeepSeekApiKey();
        } catch (e) {
            console.error("[OCR API] Pollinations API Key missing in environment variables.");
            return NextResponse.json(
                { error: "Server Configuration Error: POLLINATIONS_API_KEY missing." },
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        console.log("[OCR API] Starting OCR process with quality verification...");

        // Clean base64 string (remove data:image/jpeg;base64, prefix if present)
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

        const prompt = `You are a high-accuracy medical OCR and pharmaceutical image verification system.
Carefully examine the image:
1. Extract ALL visible text from the image exactly as it appears.
2. Determine if this image appears to be a pharmaceutical product, medication box, prescription, blister pack, syrup bottle, medical device, vitamin/supplement, or healthcare document.
3. Assess if the image text is readable or if it is too blurry, dark, unreadable, or unrelated.

Return ONLY a JSON object in this exact schema without any markdown formatting or commentary:
{
  "extractedText": "all extracted text found in the image",
  "isMedication": true or false,
  "isReadable": true or false,
  "qualityNote": "brief quality note (e.g. clear, blurry, low_light, non_medical)"
}`;

        let text = "";
        const primaryVisionModel = process.env.OCR_VISION_MODEL || "YoannDev90/muse-glimmer-30b:free";
        const visionModelsToTry = [primaryVisionModel, "qwen-vision", "openai"];

        const pollinations = createPollinationsClient();

        for (const modelCandidate of visionModelsToTry) {
            try {
                console.log(`[OCR API] Calling Pollinations Vision API (${modelCandidate})...`);
                const res = await pollinations.chat.completions.create({
                    model: modelCandidate,
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: prompt },
                                { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Data}` } }
                            ]
                        }
                    ],
                    temperature: 0.1,
                });

                text = res.choices[0]?.message?.content || "";
                if (text && text.trim().length > 0) {
                    console.log(`[OCR API] Pollinations Vision (${modelCandidate}) response received, length:`, text.length);
                    break;
                }
            } catch (polErr: any) {
                console.warn(`[OCR API] Vision model ${modelCandidate} failed:`, polErr?.message || polErr);
                if (modelCandidate === visionModelsToTry[visionModelsToTry.length - 1]) {
                    throw polErr;
                }
            }
        }

        // Multiple parsing strategies
        let data: any = null;
        let parseSuccess = false;

        // Strategy 1: Direct JSON parse
        try {
            data = JSON.parse(text);
            if (data && (data.extractedText !== undefined || typeof data === "object")) {
                parseSuccess = true;
            }
        } catch (e) {
            console.log("[OCR API] Strategy 1 (Direct parse) failed");
        }

        // Strategy 2: Extract from markdown code block
        if (!parseSuccess) {
            try {
                const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
                if (jsonMatch && jsonMatch[1]) {
                    data = JSON.parse(jsonMatch[1]);
                    if (data && data.extractedText !== undefined) {
                        parseSuccess = true;
                    }
                }
            } catch (e) {
                console.log("[OCR API] Strategy 2 (Markdown block) failed");
            }
        }

        // Strategy 3: Find any JSON object in the text
        if (!parseSuccess) {
            try {
                const jsonMatch = text.match(/{[\s\S]*}/);
                if (jsonMatch && jsonMatch[0]) {
                    data = JSON.parse(jsonMatch[0]);
                    if (data && data.extractedText !== undefined) {
                        parseSuccess = true;
                    }
                }
            } catch (e) {
                console.log("[OCR API] Strategy 3 (JSON extraction) failed");
            }
        }

        // Fallback if data is null
        if (!parseSuccess || !data) {
            data = { extractedText: text.trim(), isMedication: true, isReadable: text.trim().length >= 5 };
        }

        const extractedTextClean = String(data.extractedText || "").trim();

        // Quality and Relevance Validation Check
        const isTooShort = extractedTextClean.length < 3;
        const isExplicitlyNonMedical = data.isMedication === false && isTooShort;
        const isExplicitlyUnreadable = data.isReadable === false && isTooShort;

        if (isTooShort || isExplicitlyNonMedical || isExplicitlyUnreadable) {
            return NextResponse.json(
                {
                    error: "الصورة المرفوعة غير واضحة أو لا تحتوي على ملصق دواء مقروء. يرجى التقاط صورة واضحة ومباشرة لعلبة الدواء أو الروشتة في إضاءة جيدة.",
                    errorEn: "The uploaded image is blurry or does not appear to contain a readable medication label. Please upload a clear, well-lit photo directly showing the medicine box, prescription, or bottle.",
                    isUnclearOrNonMedication: true,
                    extractedText: extractedTextClean,
                },
                {
                    status: 422,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Deduct credit only for valid, readable medication images
        if (!localDevUser) {
            const charged = await deductCredit(user.id, 1, 'scan_pipeline');
            if (!charged) {
                return NextResponse.json({ error: "Insufficient credits. Please try again." }, {
                    status: 402,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        return NextResponse.json({
            extractedText: extractedTextClean,
            isMedication: data.isMedication ?? true,
            isReadable: true,
            serverDurationMs: Date.now() - startTime
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error("[OCR API] Gemini OCR Error:", error);

        const message = String(error?.message || "Failed to analyze image with Gemini.");
        const retryMatch = message.match(/Please retry in\s+(\d+(?:\.\d+)?)s/i);
        const retryAfterSeconds = retryMatch ? Math.ceil(Number(retryMatch[1])) : null;

        // Quota/rate limit handling
        if (message.includes('429') || message.toLowerCase().includes('quota') || message.toLowerCase().includes('too many requests')) {
            const res = NextResponse.json(
                {
                    error: message,
                    retryAfterSeconds,
                },
                {
                    status: 429,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
            if (retryAfterSeconds) res.headers.set('Retry-After', String(retryAfterSeconds));
            return res;
        }

        return NextResponse.json(
            { error: message },
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}
