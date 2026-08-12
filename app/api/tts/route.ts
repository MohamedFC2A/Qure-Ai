import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/creditService";
import { getLocalDevUser } from "@/lib/devAuth";

async function condenseToAudioBrief(rawText: string, lang: string = "ar"): Promise<string> {
    const cleaned = rawText
        .replace(/<[^>]*>/g, "")
        .replace(/[\*\_`#~]/g, "")
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
        .replace(/\s+/g, " ")
        .trim();

    // If text is already medium length (<= 320 chars), use directly for maximum fidelity
    if (cleaned.length <= 320) {
        return cleaned;
    }

    // 1. AI Condenser via Pollinations / OpenAI / DeepSeek for comprehensive audio script
    const apiKey = process.env.POLLINATIONS_API_KEY || process.env.DEEPSEEK_API_KEY;
    if (apiKey) {
        try {
            const isAr = lang === "ar";
            const systemPrompt = isAr
                ? "أنت خبير ومستشار طبي وصيدلاني بصوت رجالي واثق وعميق. قم بصياغة ملخص ناطق شامل ودقيق ومُعالج طبياً من النص المعطى بأسلوب نطق مباشر وسلس. اذكر: 1) اسم الدواء والمادة الفعالة، 2) دواعي الاستعمال الرئيسية، 3) الجرعة والتنبيه الهام. اجعل النص ناطقاً وسلساً في حدود 280-350 حرفاً بدون تشكيل عشوائي أو رموز."
                : "You are a professional medical pharmacology broadcaster with a deep, confident voice. Generate a comprehensive, well-structured spoken summary covering: 1) Drug & active ingredient name, 2) Primary indications, 3) Key dosage and safety warning. Keep it under 320 characters in natural spoken prose.";

            const res = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: "openai",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: cleaned }
                    ],
                    max_tokens: 160,
                    temperature: 0.2,
                }),
                signal: AbortSignal.timeout(4000),
            });

            if (res.ok) {
                const data = await res.json();
                const brief = data.choices?.[0]?.message?.content?.trim();
                if (brief && brief.length > 20 && brief.length <= 400) {
                    return brief;
                }
            }
        } catch (e) {
            console.warn("AI Audio Condenser fast fallback to sentence engine:", e);
        }
    }

    // 2. Deterministic Rule-Based Fallback (Rich Multi-Sentence)
    const sentences = cleaned.split(/(?<=[.،!؟\n])/g).map(s => s.trim()).filter(Boolean);
    let result = "";
    for (const s of sentences) {
        if ((result + " " + s).trim().length <= 320) {
            result = (result + " " + s).trim();
        } else {
            break;
        }
    }
    if (!result && sentences[0]) {
        result = sentences[0].slice(0, 310) + "...";
    }
    return result || cleaned.slice(0, 320);
}

export async function POST(req: NextRequest) {
    try {
        const localDevUser = getLocalDevUser(req);
        const supabase = await createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const user = authUser || localDevUser;

        if (!user) {
            return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
        }

        const userPlan = localDevUser ? "ultra" : await getUserPlan(user.id, supabase);
        const isUltra = userPlan === "ultra";

        if (!isUltra) {
            return NextResponse.json({ 
                error: "Ultra plan required to use neural audio", 
                code: "PLAN_UPGRADE_REQUIRED" 
            }, { status: 403 });
        }

        const apiKey = process.env.ELEVENLABS_API_KEY;
        const targetModelId = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";

        const body = await req.json().catch(() => ({}));
        let { text, voiceId, lang } = body;

        if (!text || typeof text !== "string") {
            return NextResponse.json({ error: "Text parameter is required" }, { status: 400 });
        }

        // Condense text into a rich, comprehensive medical audio script
        const condensedText = await condenseToAudioBrief(text, lang || "ar");

        let audioArrayBuffer: ArrayBuffer | null = null;
        let lastError = "";

        if (apiKey) {
            // Prioritize Deep Masculine Male Voices for ElevenLabs
            const maleBaritoneVoice = "nPczCjzI2devNBz1zQrb"; // Brian - Deep, Resonant Masculine Male
            const primaryVoice = process.env.ELEVENLABS_VOICE_ID || maleBaritoneVoice;
            const voiceCandidates = Array.from(new Set([
                voiceId,
                maleBaritoneVoice,
                primaryVoice,
                "JBFqnCBsd6RMkjVDRZzb", // George - Warm & Resonant Male
                "ONw916nC9r1qSbb1W84R", // Marcus - Deep Baritone
                "TX3LPaxmHKxFdv7VOQHJ", // Liam - Clear Male
            ].filter(Boolean)));

            for (const vid of voiceCandidates) {
                try {
                    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "xi-api-key": apiKey,
                        },
                        body: JSON.stringify({
                            text: condensedText,
                            model_id: targetModelId,
                            voice_settings: {
                                stability: 0.45,
                                similarity_boost: 0.85,
                                style: 0.15,
                                use_speaker_boost: true,
                            },
                        }),
                    });

                    if (response.ok) {
                        audioArrayBuffer = await response.arrayBuffer();
                        break;
                    } else {
                        const errPayload = await response.text().catch(() => "");
                        lastError = `Voice ${vid} returned ${response.status}: ${errPayload}`;
                        console.warn(`ElevenLabs voice ${vid} returned ${response.status}:`, errPayload);
                    }
                } catch (err: any) {
                    lastError = String(err?.message || err);
                    console.warn(`ElevenLabs error for ${vid}:`, err?.message);
                }
            }
        }

        if (!audioArrayBuffer) {
            return NextResponse.json({ error: `Failed to synthesize audio: ${lastError}` }, { status: 502 });
        }

        return new Response(audioArrayBuffer, {
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Length": String(audioArrayBuffer.byteLength),
                "X-Audio-Brief-Length": String(condensedText.length),
                "Accept-Ranges": "bytes",
                "Cache-Control": "public, max-age=86400, s-maxage=86400",
            },
        });
    } catch (error: any) {
        console.error("TTS API Exception:", error);
        return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
    }
}
