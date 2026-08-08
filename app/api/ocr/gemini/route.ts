import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
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
        const apiKey = process.env.GEMINI_API_KEY;

        if (!image) {
            return NextResponse.json(
                { error: "Missing image data." },
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        if (!apiKey) {
            console.error("[OCR API] Gemini API Key missing in environment variables.");
            return NextResponse.json(
                { error: "Server Configuration Error: API Key missing." },
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        console.log("[OCR API] Starting OCR process with quality verification...");

        // Initialize Gemini with the active API key and reliable model
        const genAI = new GoogleGenerativeAI(apiKey);
        const primaryModelName = process.env.GEMINI_OCR_MODEL || "gemini-2.5-flash-lite";
        const model = genAI.getGenerativeModel({
            model: primaryModelName
        });

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

        console.log("[OCR API] Calling Gemini API...");

        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: prompt },
                        { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
                    ],
                },
            ],
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.1,
            },
        });

        const response = await result.response;
        const text = response.text();

        console.log("[OCR API] Gemini response received, length:", text.length);

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
