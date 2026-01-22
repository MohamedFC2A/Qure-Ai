import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { deductCredit, getCreditsStatus } from "@/lib/creditService";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasAcceptedTerms } from "@/lib/legal/terms";

export async function POST(req: NextRequest) {
    const startTime = Date.now();
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!hasAcceptedTerms(user)) {
            return NextResponse.json({ error: "Terms acceptance required", code: "TERMS_REQUIRED" }, {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Credits deduction currently requires admin privileges (service role) to bypass RLS.
        // If this key is missing in your server environment, the route will fail.
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
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
        const supabaseAdmin = createAdminClient();
        const status = await getCreditsStatus(user.id, supabaseAdmin);
        if ((status?.totalAvailable ?? 0) < 1) {
            return NextResponse.json({ error: "Insufficient credits. Please upgrade your plan." }, {
                status: 402,
                headers: { 'Content-Type': 'application/json' }
            });
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

        console.log("[OCR API] Starting OCR process...");

        // Initialize Gemini with the user-provided key
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: process.env.GEMINI_OCR_MODEL || "gemini-2.0-flash-exp"
        });

        // Clean base64 string (remove data:image/jpeg;base64, prefix if present)
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

        const prompt = `You are an OCR system. Extract ALL visible text from this image exactly as it appears. Return ONLY a JSON object in this exact format: {"extractedText": "the text you found"}. If no text is found, return {"extractedText": ""}. Do not add any markdown, code blocks, or explanations.`;

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
        console.log("[OCR API] Raw response (first 200 chars):", text.substring(0, 200));

        // Multiple parsing strategies
        let data;
        let parseSuccess = false;

        // Strategy 1: Direct JSON parse
        try {
            data = JSON.parse(text);
            if (data.extractedText !== undefined) {
                parseSuccess = true;
                console.log("[OCR API] ✅ Strategy 1 (Direct parse) succeeded");
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
                    if (data.extractedText !== undefined) {
                        parseSuccess = true;
                        console.log("[OCR API] ✅ Strategy 2 (Markdown block) succeeded");
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
                    if (data.extractedText !== undefined) {
                        parseSuccess = true;
                        console.log("[OCR API] ✅ Strategy 3 (JSON extraction) succeeded");
                    }
                }
            } catch (e) {
                console.log("[OCR API] Strategy 3 (JSON extraction) failed");
            }
        }

        // Strategy 4: Treat entire response as extracted text (ultimate fallback)
        if (!parseSuccess) {
            console.log("[OCR API] ⚠️ All JSON strategies failed, using fallback");
            console.log("[OCR API] Full response:", text);

            // If response looks like it might be the actual text (not an error), use it
            if (text && text.length > 0 && !text.toLowerCase().includes('error') && !text.toLowerCase().includes('failed')) {
                data = { extractedText: text.trim() };
                parseSuccess = true;
                console.log("[OCR API] ✅ Strategy 4 (Direct text) succeeded");
            } else {
                console.error("[OCR API] ❌ All parsing strategies failed, response appears invalid");
                return NextResponse.json(
                    {
                        error: "OCR failed to extract text. Please ensure the image contains clear, readable text.",
                        debug: text.substring(0, 100)
                    },
                    {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }
        }

        console.log("[OCR API] Extracted text length:", data.extractedText?.length || 0);

        // Only charge after successful OCR output.
        const charged = await deductCredit(user.id, 1, 'scan_pipeline');
        if (!charged) {
            return NextResponse.json({ error: "Insufficient credits. Please try again." }, {
                status: 402,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return NextResponse.json({ ...data, serverDurationMs: Date.now() - startTime }, {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error("[OCR API] Gemini OCR Error:", error);
        console.error("[OCR API] Error stack:", error?.stack);

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

        // Ensure we always return JSON, even for unexpected errors
        return NextResponse.json(
            { error: message },
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}
