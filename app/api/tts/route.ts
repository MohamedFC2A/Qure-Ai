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

    // If already crisp (<= 110 chars), use directly
    if (cleaned.length <= 110) {
        return cleaned;
    }

    // 1. Ultra-fast AI Condenser via Pollinations/DeepSeek
    const apiKey = process.env.POLLINATIONS_API_KEY || process.env.DEEPSEEK_API_KEY;
    if (apiKey) {
        try {
            const isAr = lang === "ar";
            const systemPrompt = isAr
                ? "أنت معد نصوص صوتية طبية احترافي فائق الإيجاز. لخص النص المعطى في جملة واحدة منطوقة وسلسة وبشرية تماماً (اسم المنتج أو الدواء + الغرض/الفائدة الأساسية + الجرعة أو التحذير الأهم) بحد أقصى 90 حرف فقط. أرجع فقط الجملة المنطوقة بدون أي مقدمات أو تشكيل معقد."
                : "You are an ultra-concise medical audio condenser. Summarize the text into ONE natural spoken sentence (Product/Drug name + Core benefit/purpose + Key dose or advice) in under 90 characters. Return ONLY the plain spoken sentence.";

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
                    max_tokens: 45,
                    temperature: 0.2,
                }),
                signal: AbortSignal.timeout(3500),
            });

            if (res.ok) {
                const data = await res.json();
                const brief = data.choices?.[0]?.message?.content?.trim();
                if (brief && brief.length > 5 && brief.length <= 140) {
                    return brief;
                }
            }
        } catch (e) {
            console.warn("AI Audio Condenser fast fallback to rule engine:", e);
        }
    }

    // 2. Deterministic Rule-Based Fallback (Instant & 0 latency)
    const sentences = cleaned.split(/(?<=[.،!؟\n])/g).map(s => s.trim()).filter(Boolean);
    let result = "";
    for (const s of sentences) {
        if ((result + " " + s).trim().length <= 120) {
            result = (result + " " + s).trim();
        } else {
            break;
        }
    }
    if (!result && sentences[0]) {
        result = sentences[0].slice(0, 117) + "...";
    }
    return result || cleaned.slice(0, 120);
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
                error: "Ultra plan required to use ElevenLabs neural audio", 
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

        // Condense text to a short high-impact audio script saving 85%+ ElevenLabs quota
        const condensedText = await condenseToAudioBrief(text, lang || "ar");

        let audioArrayBuffer: ArrayBuffer | null = null;
        let lastError = "";

        if (apiKey) {
            const primaryVoice = process.env.ELEVENLABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb";
            const voiceCandidates = Array.from(new Set([
                voiceId,
                primaryVoice,
                "JBFqnCBsd6RMkjVDRZzb", // George - Warm, Captivating Storyteller (Top Natural Human Voice)
                "nPczCjzI2devNBz1zQrb", // Brian - Deep, Resonant & Comforting
                "TX3LPaxmHKxFdv7VOQHJ", // Liam - Energetic, Clear
                "EXAVITQu4vr4xnSDxMaL", // Sarah - Reassuring, Mature
                "enzbGixeo55iqn1QxbbC", // Jon - Calm Presence
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
                                stability: 0.5,
                                similarity_boost: 0.75,
                                style: 0.0,
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
