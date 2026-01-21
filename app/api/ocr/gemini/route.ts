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
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasAcceptedTerms(user)) {
            return NextResponse.json({ error: "Terms acceptance required", code: "TERMS_REQUIRED" }, { status: 403 });
        }

        // Credits deduction currently requires admin privileges (service role) to bypass RLS.
        // If this key is missing in your server environment, the route will fail.
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json(
                { error: "Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing (required for credits deduction)." },
                { status: 503 }
            );
        }

        // Pre-check credits (don't charge if OCR fails).
        const supabaseAdmin = createAdminClient();
        const status = await getCreditsStatus(user.id, supabaseAdmin);
        if ((status?.totalAvailable ?? 0) < 1) {
            return NextResponse.json({ error: "Insufficient credits. Please upgrade your plan." }, { status: 402 });
        }

        const { image } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!image) {
            return NextResponse.json(
                { error: "Missing image data." },
                { status: 400 }
            );
        }

        if (!apiKey) {
            console.error("Gemini API Key missing in environment variables.");
            return NextResponse.json(
                { error: "Server Configuration Error: API Key missing." },
                { status: 500 }
            );
        }

        // Initialize Gemini with the user-provided key
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: process.env.GEMINI_OCR_MODEL || "gemini-2.5-flash-lite"
        });

        // Clean base64 string (remove data:image/jpeg;base64, prefix if present)
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

        const prompt = `OCR this image and return strict JSON: {"extractedText": "..."}. Extract all visible text verbatim; no summary.`;

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
            },
        });

        const response = await result.response;
        const text = response.text();

        // Extract JSON from markdown code block if present
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*}/);

        let data;
        if (jsonMatch) {
            data = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } else {
            // Fallback: If model returns just text, wrap it
            data = { extractedText: text };
        }

        // Only charge after successful OCR output.
        const charged = await deductCredit(user.id, 1, 'scan_pipeline');
        if (!charged) {
            return NextResponse.json({ error: "Insufficient credits. Please try again." }, { status: 402 });
        }

        return NextResponse.json({ ...data, serverDurationMs: Date.now() - startTime });

    } catch (error: any) {
        console.error("Gemini OCR Error:", error);

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
                { status: 429 }
            );
            if (retryAfterSeconds) res.headers.set('Retry-After', String(retryAfterSeconds));
            return res;
        }

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
