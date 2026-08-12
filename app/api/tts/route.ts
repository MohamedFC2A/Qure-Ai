import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/creditService";
import { getLocalDevUser } from "@/lib/devAuth";

// Smart Arabic Medical Diacritization & Vocalization Engine for 0 TTS Pronunciation Errors
function diacritizeArabicMedicalText(text: string): string {
    if (!text || typeof text !== "string") return "";

    const medicalDiacriticsMap: Record<string, string> = {
        "دواء": "دَوَاءٌ",
        "الدواء": "الدَّوَاءُ",
        "علاج": "عِلَاجٌ",
        "العلاج": "الْعِلَاجُ",
        "جرعة": "جُرْعَةٌ",
        "الجرعة": "الْجُرْعَةُ",
        "تحذير": "تَحْذِيرٌ",
        "تنبيه": "تَنْبِيهٌ",
        "مهم": "مُهِمٌّ",
        "تداخلات": "تَدَاخُلَاتٌ",
        "تعارض": "تَعَارُضٌ",
        "أعراض": "أَعْرَاضٌ",
        "جانبية": "جَانِبِيَّةٌ",
        "مادة": "مَادَّةٌ",
        "فعالة": "فَعَّالَةٌ",
        "استخدام": "اسْتِخْدَامُ",
        "استعمال": "اسْتِعْمَالُ",
        "طبي": "طِبِّيٌّ",
        "طبيبة": "طَبِيبَةٌ",
        "طبيب": "طَبِيبٌ",
        "صيدلي": "صَيْدَلِيٌّ",
        "يوميا": "يَوْمِيّاً",
        "يومياً": "يَوْمِيّاً",
        "فورا": "فَوْراً",
        "فوراً": "فَوْراً",
        "احتياط": "احْتِيَاطٌ",
        "مستمر": "مُسْتَمِرٌّ",
        "حساسية": "حَسَّاسِيَّةٌ",
        "خطيرة": "خَطِيرَةٌ",
        "خطر": "خَطَرٌ",
        "آمن": "آمِنٌ",
        "سلامة": "سَلَامَةٌ",
        "اقرأ": "اقْرَأْ",
        "راجع": "رَاجِعْ",
        "تناول": "تَنَاوَلْ",
        "استشر": "اسْتَشِرْ",
        "قبل": "قَبْلَ",
        "بعد": "بَعْدَ",
        "الطعام": "الطَّعَامِ",
        "الأكل": "الأَكْلِ",
        "ماء": "مَاءٍ",
        "كافي": "كافٍ",
    };

    let result = text;
    for (const [rawWord, vocalizedWord] of Object.entries(medicalDiacriticsMap)) {
        // Regex word boundary matching for whole word replacement
        const regex = new RegExp(`(?<=^|\\s)${rawWord}(?=\\s||\\.|,|!|؟|$)`, "g");
        result = result.replace(regex, vocalizedWord);
    }

    return result;
}

async function condenseToAudioBrief(rawText: string, lang: string = "ar"): Promise<string> {
    const cleaned = rawText
        .replace(/<[^>]*>/g, "")
        .replace(/[\*\_`#~]/g, "")
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
        .replace(/\s+/g, " ")
        .trim();

    const isAr = lang === "ar";

    // 1. AI Diacritized Condenser via Pollinations / OpenAI / DeepSeek
    const apiKey = process.env.POLLINATIONS_API_KEY || process.env.DEEPSEEK_API_KEY;
    if (apiKey) {
        try {
            const systemPrompt = isAr
                ? "أنت خبير صيدلاني وطبي ونحوي متمرس بصوت رجالي واثق وعميق. قم بصياغة ملخص ناطق شامل ودقيق ومُعالج طبياً من النص المعطى في حدود 280-350 حرفاً. الشَرطُ الأَسَاسِيّ: قُم بِتَشكِيلِ الكَلِمَاتِ العَرَبِيَّةِ تَشكِيلاً ذَكِيّاً وَدَقِيقاً بِالحَرَكَاتِ (الْفَتْحَة، الضَّمَّة، الْكَسْرَة، السُّكُون، وَالتَّنْوِين) لِضَمَانِ قِرَاءَةٍ صَوْتِيَّةٍ سَلِيمَةٍ 100% بِدُونِ أَيِّ أَخْطَاءِ إِعْرَابِيَّةٍ أَوْ لَغْوِيَّة. اذكر: 1) اسم الدواء والمادة الفعالة، 2) دواعي الاستعمال الرئيسية، 3) الجرعة والتنبيه الهام."
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
                    max_tokens: 220,
                    temperature: 0.15,
                }),
                signal: AbortSignal.timeout(2500),
            });

            if (res.ok) {
                const data = await res.json();
                const brief = data.choices?.[0]?.message?.content?.trim();
                if (brief && brief.length > 20 && brief.length <= 450) {
                    return isAr ? diacritizeArabicMedicalText(brief) : brief;
                }
            }
        } catch (e) {
            console.warn("AI Audio Condenser fallback to diacritized sentence engine:", e);
        }
    }

    // 2. Deterministic Rule-Based Fallback with Smart Diacritics
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
    const finalBrief = result || cleaned.slice(0, 320);
    return isAr ? diacritizeArabicMedicalText(finalBrief) : finalBrief;
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

        // Condense and smart-diacritize Arabic medical text for zero TTS pronunciation errors
        const condensedText = await condenseToAudioBrief(text, lang || "ar");

        let audioArrayBuffer: ArrayBuffer | null = null;
        let lastError = "";

        if (apiKey) {
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
                                stability: 0.52,
                                similarity_boost: 0.88,
                                style: 0.12,
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
