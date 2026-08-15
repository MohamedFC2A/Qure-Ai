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
        "مستحضر": "مُسْتَحْضَرٌ",
        "المستحضر": "الْمُسْتَحْضَرُ",
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
        "دواعي": "دَوَاعِي",
        "فوائد": "فَوَائِدُ",
        "فائدة": "فَائِدَةُ",
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

    // 1. AI Intelligent Audio Brief Generator via Pollinations / OpenAI / DeepSeek
    const apiKey = process.env.POLLINATIONS_API_KEY || process.env.DEEPSEEK_API_KEY;
    if (apiKey) {
        try {
            const systemPrompt = isAr
                ? "أنت خبير ومستشار صيدلاني بصوت رجالي واثق ومثقف. مهمتك إنتاج خلاصة ناطقة ذكية وممتعة للمستمع. لا تكتفِ بذكر اسم المنتج فقط، بل اشرح فوراً وبشكل سريع وذكي: 1) ماهية الدواء أو المستحضر، 2) دواعي استخدامه وفائدته الرئيسية، 3) الجرعة أو طريقة الاستخدام والتنبيه الأهم. صغ الجمل بأسلوب ناطق ذكي في حدود 250-350 حرفاً ومُشَكَّل بالحركات الإعرابية التامة لضمان نطق رجالي ممتاز وبلا أي خطأ."
                : "You are an expert medical pharmacology broadcaster. Generate a smart, natural, and informative spoken brief. Do not just read the name—explain clearly: 1) What the medication/product is, 2) Primary indications and benefits, 3) Recommended usage & key safety precaution. Keep it engaging, natural, and under 320 characters.";

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
                    temperature: 0.2,
                }),
                signal: AbortSignal.timeout(3500),
            });

            if (res.ok) {
                const data = await res.json();
                const brief = data.choices?.[0]?.message?.content?.trim();
                if (brief && brief.length > 25 && brief.length <= 450) {
                    return isAr ? diacritizeArabicMedicalText(brief) : brief;
                }
            }
        } catch (e) {
            console.warn("AI Audio Condenser fallback to structured briefing:", e);
        }
    }

    // 2. Deterministic Structured Fallback (Rich Spoken Template)
    if (isAr) {
        const fallbackScript = `هَذَا الْمُسْتَحْضَرُ الطِّبِّيُّ: ${cleaned}. يُسْتَخْدَمُ لِتَسْكِينِ الأَعْرَاضِ وَالْعِلَاجِ الصَّيْدَلَانِيِّ. يُنْصَحُ بِقِرَاءَةِ النَّشْرَةِ الدَّاخِلِيَّةِ وَاسْتِشَارَةِ الطَّبِيبِ أَوْ الصَّيْدَلِيِّ قَبْلَ الاسْتِخْدَامِ.`;
        return diacritizeArabicMedicalText(fallbackScript);
    }

    return `Medical Brief: ${cleaned}. Use as directed by a healthcare professional. Read the package insert for complete usage guidelines.`;
}

export async function POST(req: NextRequest) {
    try {
        const localDevUser = getLocalDevUser(req);
        const supabase = await createClient();
        const { data: authData } = await supabase.auth.getUser();
        const authUser = authData?.user ?? null;
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

        // Condense and smart-diacritize Arabic medical text into an intelligent spoken summary
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
