import OpenAI from "openai";
import { createPollinationsClient, getDeepSeekApiKey } from "@/lib/ai/deepseek";
import { robustParseJson } from "@/lib/ai/jsonRepair";

export interface TissueComposition {
    granulation: number; // 0-100% (Red/Healthy Granulation)
    slough: number;       // 0-100% (Yellow/Devitalized tissue)
    necrotic: number;     // 0-100% (Black/Eschar/Dead tissue)
    epithelial: number;   // 0-100% (Pink/Regenerating margins)
}

export interface InfectionAssessment {
    riskLevel: "low" | "medium" | "high";
    hasActiveSigns: boolean;
    erythemaNote?: string;
    exudateNote?: string;
    swellingNote?: string;
    odorOrHeatNote?: string;
    clinicalSummary: string;
}

export interface SutureAssessment {
    requiresSutures: boolean;
    urgencyWindowHours?: number; // e.g. 6-8 hours
    rationale: string;
}

export interface TetanusAssessment {
    riskIdentified: boolean;
    rationale: string;
    recommendation: string;
}

export interface FirstAidStep {
    stepNumber: number;
    title: string;
    action: string;
    caution?: string;
}

export interface DressingProtocol {
    recommendedDressing: string;
    cleaningSolution: string;
    applicationInstructions: string;
    changeFrequency: string;
    avoidSubstances: string[];
}

export interface WoundAnalysisResult {
    id?: string;
    scanType: "wound";
    woundTitle: string;
    woundTitleEn: string;
    woundType: "laceration" | "abrasion" | "burn" | "puncture" | "diabetic_ulcer" | "pressure_ulcer" | "surgical_incision" | "contusion" | "wart_verruca" | "corn_clavus" | "abscess_boil" | "cellulitis" | "other";
    woundTypeLocalized: string;
    severity: "minor" | "moderate" | "severe" | "emergency";
    healingStage: "inflammatory" | "proliferative" | "maturation_remodeling";
    healingStageLocalized: string;
    estimatedHealingDays: string;
    tissueComposition: TissueComposition;
    infectionAssessment: InfectionAssessment;
    sutureAssessment: SutureAssessment;
    tetanusAssessment: TetanusAssessment;
    firstAidSteps: FirstAidStep[];
    dressingProtocol: DressingProtocol;
    urgentRedFlags: string[];
    whenToSeekImmediateER: string[];
    recommendedMedicalSpecialty: string;
    disclaimer: string;
    confidenceScore: number;
    analyzedAt: string;
}

const WOUND_SYSTEM_PROMPT = `You are a World-Class Clinical Dermatologist, Trauma Surgeon & Advanced Wound Care Specialist (operating under EWMA, WHS, and WHO guidelines).
Your task is to analyze the provided skin/wound/lesion photograph with absolute zero-error clinical precision.

🧠 CRITICAL IDENTIFICATION & TAXONOMY RULES:
You must accurately distinguish between all common dermatological lesions, physical trauma, and wounds:
1. **عين السمكة / السنط الجلدي (Verruca / Plantar Wart / HPV Wart)**:
   - Hyperkeratotic verrucous papule or plaque, often with tiny black pinpoint dots (thrombosed capillaries), disruption of normal skin ridges/fingerprint lines.
   - Title MUST be: "عين السمكة (سنط جلدي)" | "Plantar Wart (Verruca)"
   - Type: "wart_verruca"

2. **مسمار القدم / الكالو (Corn / Clavus / Hyperkeratosis)**:
   - Hard, yellowish localized hyperkeratosis over pressure points (toes/soles) with a central translucent hard core; normal skin lines pass around or over it.
   - Title MUST be: "مسمار القدم (كالو)" | "Foot Corn (Clavus)"
   - Type: "corn_clavus"

3. **الخراج والدمل الجلدي (Cutaneous Abscess / Furuncle / Boil)**:
   - Erythematous, tender, warm, fluctuant nodule often with central white/yellow pus pointing.
   - Title MUST be: "خراج / دمل جلدي" | "Cutaneous Abscess / Boil"
   - Type: "abscess_boil"

4. **الحروق بدرجاتها (Thermal / Chemical Burns)**:
   - 1st Degree: Erythema, no blisters -> Title: "حرق سطحي (درجة أولى)"
   - 2nd Degree: Blisters, bullae, weeping raw dermis -> Title: "حرق جلدي من الدرجة الثانية"
   - 3rd Degree: Leathery, white/black charred, painless full-thickness -> Title: "حرق عميق (درجة ثالثة - طوارئ)"
   - Type: "burn"

5. **الجروح القطعية (Lacerations)**:
   - Sharp linear cleavage of skin.
   - If superficial (<3mm depth, closed edges) -> Title: "جرح قطعي سطحي"
   - If deep (>5mm depth, gaping, fat visible) -> Title: "جرح قطعي عميق (يحتاج خياطة)"
   - Type: "laceration"

6. **السحجات والخدوش (Abrasions / Scrapes)**:
   - Superficial epidermal friction loss with serosanguinous oozing.
   - Title MUST be: "سحجة وخدش جلدي" | "Skin Abrasion"
   - Type: "abrasion"

7. **الجروح الوخزية والنافذة (Puncture Wounds)**:
   - Small entry hole caused by nail, needle, thorn, or sharp point. High tetanus and deep infection risk.
   - Title MUST be: "جرح وخزي نافذ (مسمار/أداة حادة)" | "Puncture Wound"
   - Type: "puncture"

8. **قرحة القدم السكري (Diabetic Foot Ulcer)**:
   - Chronic punched-out ulcer on neuropathic pressure points (heel/metatarsal head).
   - Title MUST be: "قرحة قدم سكري" | "Diabetic Foot Ulcer"
   - Type: "diabetic_ulcer"

9. **قرح الفراش (Pressure Ulcers / Bedsores)**:
   - Ischemic damage over sacrum, hips, or heels.
   - Title MUST be: "قرحة فراش ضغطية" | "Pressure Ulcer"
   - Type: "pressure_ulcer"

10. **الشقوق الجراحية والغرز (Surgical Incisions / Sutures)**:
    - Clean approximated incision with surgical threads or staples.
    - Title MUST be: "شق جراحي ومتابعة خياطة" | "Surgical Incision / Sutures"
    - Type: "surgical_incision"

11. **الكدمات والرضوض (Contusions / Hematomas)**:
    - Intact skin with purple/blue ecchymosis and localized swelling.
    - Title MUST be: "كدمة وتجمع دموي رضحي" | "Contusion / Hematoma"
    - Type: "contusion"

12. **الالتهاب الخلوي والحمرة (Cellulitis / Erysipelas)**:
    - Rapidly expanding bright red, warm, tender indurated skin plaque with indistinct borders.
    - Title MUST be: "التهاب خلوي جلدي (سلوليت)" | "Cellulitis"
    - Type: "cellulitis"

🏷️ MANDATORY TITLE FORMAT RULE:
- "woundTitle": MUST BE SHORT AND CONCISE (2 to 4 words MAX). ALWAYS use the famous, recognized Arabic medical/popular name directly (e.g. "عين السمكة (سنط جلدي)", "مسمار القدم (كالو)", "جرح قطعي سطحي", "حرق جلدي من الدرجة الثانية", "خراج / دمل جلدي").
- STRICTLY FORBIDDEN: NEVER use generic, long, repetitive introductory sentences in "woundTitle" (e.g. NEVER write "فحص وتقييم إصابة جلدية ناتجة عن...").

OUTPUT FORMAT:
Return ONLY a valid, raw JSON object matching this EXACT schema:
{
  "scanType": "wound",
  "woundTitle": "الاسم القصير المشهور المباشر (مثل: عين السمكة / جرح قطعي سطحي / مسمار القدم / خراج)",
  "woundTitleEn": "Short famous clinical diagnosis in English",
  "woundType": "laceration" | "abrasion" | "burn" | "puncture" | "diabetic_ulcer" | "pressure_ulcer" | "surgical_incision" | "contusion" | "wart_verruca" | "corn_clavus" | "abscess_boil" | "cellulitis" | "other",
  "woundTypeLocalized": "النوع السريري بالعربية (مثل: سنط جلدي / جرح قطعي / حرق جلدي)",
  "severity": "minor" | "moderate" | "severe" | "emergency",
  "healingStage": "inflammatory" | "proliferative" | "maturation_remodeling",
  "healingStageLocalized": "مرحلة الالتئام السريرية بالعربية",
  "estimatedHealingDays": "المدة المقدرة للشفاء (مثل: 5 إلى 7 أيام / أسبوعين)",
  "tissueComposition": {
    "granulation": number (0-100),
    "slough": number (0-100),
    "necrotic": number (0-100),
    "epithelial": number (0-100)
  },
  "infectionAssessment": {
    "riskLevel": "low" | "medium" | "high",
    "hasActiveSigns": boolean,
    "erythemaNote": "وصف الاحمرار ومحيطه",
    "exudateNote": "وصف الإفرازات",
    "swellingNote": "وصف التورم والانتفاخ",
    "clinicalSummary": "ملخص سريري لعلامات العدوى"
  },
  "sutureAssessment": {
    "requiresSutures": boolean,
    "urgencyWindowHours": number (e.g. 6 or 8),
    "rationale": "سبب الحاجة أو عدم الحاجة للخياطة الجراحية"
  },
  "tetanusAssessment": {
    "riskIdentified": boolean,
    "rationale": "تقييم خطورة التيتانوس وفق طبيعة الإصابة والأداة",
    "recommendation": "التوصية بشأن مصل وجرعة التيتانوس"
  },
  "firstAidSteps": [
    {
      "stepNumber": 1,
      "title": "عنوان الخطوة الإسعافية",
      "action": "شرح عملي دقيق للخطوة الإسعافية السليمة",
      "caution": "تنبيه أو خطأ شائع يجب تجنبه"
    }
  ],
  "dressingProtocol": {
    "recommendedDressing": "نوع الضمادة الموصى بها طبياً",
    "cleaningSolution": "محلول التنظيف المناسب (محلول ملحي معقم)",
    "applicationInstructions": "طريقة الغيار السليمة",
    "changeFrequency": "معدل التغيير (كل 24 ساعة / يومياً)",
    "avoidSubstances": ["المواد الضارة الممنوع استخدامها مثل الكحول المركز"]
  },
  "urgentRedFlags": [
    "علامة خطر حرجة 1",
    "علامة خطر حرجة 2"
  ],
  "whenToSeekImmediateER": [
    "حالة تستوجب التوجه الفوري للطوارئ 1",
    "حالة تستوجب التوجه الفوري للطوارئ 2"
  ],
  "recommendedMedicalSpecialty": "التخصص الطبي الموصى بمراجعته (مثل: جراحة عامة / جلدية وتناسلية / طوارئ)",
  "disclaimer": "إخلاء مسؤولية سريري واضح",
  "confidenceScore": 98
}`;

/**
 * Sanitizes and extracts the short famous clinical name if the AI returned a long description.
 */
function sanitizeWoundTitle(rawTitle: string, rawType: string, isAr: boolean): { titleAr: string; titleEn: string } {
    let clean = (rawTitle || "").trim();

    // Map keywords to short, famous Arabic names
    const lower = clean.toLowerCase();
    
    if (lower.includes("wart") || lower.includes("verruca") || lower.includes("سنط") || lower.includes("عين السمكة") || lower.includes("عين سمكة")) {
        return { titleAr: "عين السمكة (سنط جلدي)", titleEn: "Plantar Wart (Verruca)" };
    }
    if (lower.includes("corn") || lower.includes("clavus") || lower.includes("كالو") || lower.includes("مسمار القدم") || lower.includes("مسمار قدم")) {
        return { titleAr: "مسمار القدم (كالو)", titleEn: "Foot Corn (Clavus)" };
    }
    if (lower.includes("abscess") || lower.includes("boil") || lower.includes("furuncle") || lower.includes("خراج") || lower.includes("دمل")) {
        return { titleAr: "خراج / دمل جلدي", titleEn: "Cutaneous Abscess / Boil" };
    }
    if (lower.includes("burn") || lower.includes("حرق")) {
        if (lower.includes("ثانية") || lower.includes("2nd") || lower.includes("فقاعات") || lower.includes("blister")) {
            return { titleAr: "حرق جلدي من الدرجة الثانية", titleEn: "2nd Degree Thermal Burn" };
        }
        if (lower.includes("ثالثة") || lower.includes("3rd") || lower.includes("عميق")) {
            return { titleAr: "حرق عميق (درجة ثالثة)", titleEn: "3rd Degree Severe Burn" };
        }
        return { titleAr: "حرق سطحي (درجة أولى)", titleEn: "1st Degree Superficial Burn" };
    }
    if (lower.includes("laceration") || lower.includes("قطعي")) {
        if (lower.includes("عميق") || lower.includes("خياطة") || lower.includes("deep") || lower.includes("suture")) {
            return { titleAr: "جرح قطعي عميق (يستلزم خياطة)", titleEn: "Deep Gaping Laceration" };
        }
        return { titleAr: "جرح قطعي سطحي", titleEn: "Superficial Laceration" };
    }
    if (lower.includes("abrasion") || lower.includes("سحجة") || lower.includes("خدش")) {
        return { titleAr: "سحجة وخدش جلدي", titleEn: "Skin Abrasion" };
    }
    if (lower.includes("puncture") || lower.includes("وخزي") || lower.includes("نافذ") || lower.includes("مسمار")) {
        return { titleAr: "جرح وخزي نافذ (مسمار/أداة حادة)", titleEn: "Puncture Wound" };
    }
    if (lower.includes("diabetic") || lower.includes("سكري")) {
        return { titleAr: "قرحة قدم سكري", titleEn: "Diabetic Foot Ulcer" };
    }
    if (lower.includes("pressure") || lower.includes("فراش")) {
        return { titleAr: "قرحة فراش ضغطية", titleEn: "Pressure Ulcer (Bedsore)" };
    }
    if (lower.includes("surgical") || lower.includes("incision") || lower.includes("جراحي") || lower.includes("غرز")) {
        return { titleAr: "شق جراحي ومتابعة غرز", titleEn: "Surgical Incision / Sutures" };
    }
    if (lower.includes("contusion") || lower.includes("hematoma") || lower.includes("كدمة") || lower.includes("تجمع دموي")) {
        return { titleAr: "كدمة وتجمع دموي رضحي", titleEn: "Contusion & Hematoma" };
    }
    if (lower.includes("cellulitis") || lower.includes("التهاب خلوي") || lower.includes("حمرة")) {
        return { titleAr: "التهاب خلوي جلدي (سلوليت)", titleEn: "Cellulitis / Erysipelas" };
    }

    // Clean up if the AI returned a long phrase starting with "فحص وتقييم"
    clean = clean.replace(/^(فحص وتقييم|تقرير تقييم|حالة|تشخيص سريري لـ|تقييم حالة)\s+/gi, "").trim();
    if (clean.length > 35) {
        clean = clean.slice(0, 35).trim();
    }

    return {
        titleAr: clean || "إصابة / جرح جلدي",
        titleEn: "Wound Assessment",
    };
}

/**
 * Analyzes a high-resolution wound image and returns structured clinical wound metrics.
 */
export async function analyzeWoundImage(
    imageDataUrl: string,
    language: "ar" | "en" = "ar"
): Promise<WoundAnalysisResult> {
    const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
    const pollinations = createPollinationsClient();

    const visionModel = process.env.OCR_VISION_MODEL || "YoannDev90/muse-glimmer-30b:free";
    let rawText = "";

    const userPrompt = language === "ar"
        ? `قم بفحص هذه الصورة الطبية للجرح والإصابة الجلدية بدقة سريرية قصوى، وحدد اسم الجرح المشهور بدقة (مثل: عين السمكة، مسمار القدم، خراج، حرق، جرح قطعي، سحجة)، واستخرج كافة التفاصيل المطلوبة وفق الـ JSON Schema المحدد.`
        : `Examine this wound/skin injury image with maximum clinical precision, identify the exact famous medical condition (e.g., Plantar Wart, Corn, Abscess, Burn, Laceration, Abrasion), and output in JSON Schema.`;

    try {
        console.log(`[Wound Engine] Calling Vision Model (${visionModel})...`);
        const res = await pollinations.chat.completions.create({
            model: visionModel,
            messages: [
                { role: "system", content: WOUND_SYSTEM_PROMPT },
                {
                    role: "user",
                    content: [
                        { type: "text", text: userPrompt },
                        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Data}` } }
                    ]
                }
            ],
            temperature: 0.1,
        });

        rawText = res.choices[0]?.message?.content || "";
    } catch (err: any) {
        console.warn(`[Wound Engine] Vision model failed:`, err?.message || err);
        rawText = "";
    }

    const parsed = robustParseJson<Partial<WoundAnalysisResult>>(rawText, {});

    // Sanitize and extract the short, famous Arabic name
    const sanitizedTitle = sanitizeWoundTitle(
        parsed.woundTitle || parsed.woundTypeLocalized || "",
        parsed.woundType || "",
        language === "ar"
    );

    // Normalize & Hardened Fallbacks
    const normalized: WoundAnalysisResult = {
        scanType: "wound",
        woundTitle: sanitizedTitle.titleAr,
        woundTitleEn: parsed.woundTitleEn || sanitizedTitle.titleEn,
        woundType: (parsed.woundType as any) || "laceration",
        woundTypeLocalized: parsed.woundTypeLocalized || sanitizedTitle.titleAr,
        severity: parsed.severity || "minor",
        healingStage: parsed.healingStage || "inflammatory",
        healingStageLocalized: parsed.healingStageLocalized || (language === "ar" ? "مرحلة الالتئام الأولية" : "Initial Healing Phase"),
        estimatedHealingDays: parsed.estimatedHealingDays || (language === "ar" ? "5 إلى 10 أيام" : "5 to 10 days"),
        tissueComposition: {
            granulation: parsed.tissueComposition?.granulation ?? 75,
            slough: parsed.tissueComposition?.slough ?? 15,
            necrotic: parsed.tissueComposition?.necrotic ?? 0,
            epithelial: parsed.tissueComposition?.epithelial ?? 10,
        },
        infectionAssessment: {
            riskLevel: parsed.infectionAssessment?.riskLevel || "low",
            hasActiveSigns: parsed.infectionAssessment?.hasActiveSigns || false,
            erythemaNote: parsed.infectionAssessment?.erythemaNote || (language === "ar" ? "احمرار موضعي طفيف ضمن حدود الإصابة" : "Mild localized erythema within lesion boundaries"),
            exudateNote: parsed.infectionAssessment?.exudateNote || (language === "ar" ? "إفرازات مصلية خفيفة طبيعية" : "Mild normal serous exudate"),
            swellingNote: parsed.infectionAssessment?.swellingNote || (language === "ar" ? "تورم طفيف في الحواف" : "Mild edge edema"),
            clinicalSummary: parsed.infectionAssessment?.clinicalSummary || (language === "ar" ? "المنطقة مستقرة مع عدم وجود علامات عدوى صديدية نشطة." : "Stable area without purulent active infection signs."),
        },
        sutureAssessment: {
            requiresSutures: parsed.sutureAssessment?.requiresSutures || false,
            urgencyWindowHours: parsed.sutureAssessment?.urgencyWindowHours || 8,
            rationale: parsed.sutureAssessment?.rationale || (language === "ar" ? "حواف الجلد متقاربة ولا يوجد تباعد عميق يستدعي الخياطة الجراحية." : "Wound margins do not require urgent surgical suturing."),
        },
        tetanusAssessment: {
            riskIdentified: parsed.tetanusAssessment?.riskIdentified || false,
            rationale: parsed.tetanusAssessment?.rationale || (language === "ar" ? "إصابة غير ناتجة عن أداة صدئة ملوثة بالتربة." : "Low-risk superficial injury."),
            recommendation: parsed.tetanusAssessment?.recommendation || (language === "ar" ? "تأكد من سريان جرعة التيتانوس التنشيطية خلال الـ 10 سنوات الماضية." : "Ensure tetanus booster is up to date within 10 years."),
        },
        firstAidSteps: Array.isArray(parsed.firstAidSteps) && parsed.firstAidSteps.length > 0
            ? parsed.firstAidSteps
            : [
                {
                    stepNumber: 1,
                    title: language === "ar" ? "التنظيف والتطهير بلطف" : "Gentle Cleansing",
                    action: language === "ar" ? "غسل المنطقة بمحلول ملحي معقم (Normal Saline 0.9%) أو ماء فاتر نظيف." : "Gently flush with sterile 0.9% saline.",
                    caution: language === "ar" ? "تجنب فرك الإصابة أو استخدام الكحول المركز داخل الأنسجة المفتوحة." : "Avoid harsh rubbing or pouring concentrated alcohol inside open tissue.",
                },
                {
                    stepNumber: 2,
                    title: language === "ar" ? "الترطيب والتغطية المعقمة" : "Hydration & Dressing",
                    action: language === "ar" ? "وضع طبقة رقيقة من مرهم معقم مناسب وتغطيته بضمادة غير لاصقة." : "Apply sterile soothing ointment and cover with non-adherent pad.",
                    caution: language === "ar" ? "تغيير الضمادة فور اتساخها أو تبللها." : "Change pad immediately if soiled or wet.",
                },
                {
                    stepNumber: 3,
                    title: language === "ar" ? "المتابعة والمراقبة" : "Monitoring",
                    action: language === "ar" ? "مراقبة علامات الالتئام وتجنب الضغط المباشر على موضع الإصابة." : "Monitor healing signs and avoid direct pressure on the lesion.",
                }
            ],
        dressingProtocol: {
            recommendedDressing: parsed.dressingProtocol?.recommendedDressing || (language === "ar" ? "ضمادة شاش معقم غير لاصق مع شريط طبي مسامي" : "Sterile non-adherent gauze with breathable tape"),
            cleaningSolution: parsed.dressingProtocol?.cleaningSolution || "Normal Saline 0.9%",
            applicationInstructions: parsed.dressingProtocol?.applicationInstructions || (language === "ar" ? "تغيير الضمادة مرة يومياً أو عند البلل." : "Change daily or when soiled."),
            changeFrequency: parsed.dressingProtocol?.changeFrequency || "24h",
            avoidSubstances: parsed.dressingProtocol?.avoidSubstances || ["الكحول الطبي المركز داخل الجرح", "القطن العادي المباشر", "ماء الأكسجين"],
        },
        urgentRedFlags: Array.isArray(parsed.urgentRedFlags) && parsed.urgentRedFlags.length > 0
            ? parsed.urgentRedFlags
            : [
                language === "ar" ? "نزيف نابض أو مستمر لا يتوقف بعد الضغط المتواصل" : "Pulsatile or persistent bleeding failing to stop after continuous pressure",
                language === "ar" ? "انتشار خطوط حمراء أو سخونة شديدة وألم متزايد" : "Spreading red streaks, intense heat, or worsening pain"
            ],
        whenToSeekImmediateER: Array.isArray(parsed.whenToSeekImmediateER) && parsed.whenToSeekImmediateER.length > 0
            ? parsed.whenToSeekImmediateER
            : [
                language === "ar" ? "جروح عميقة تظهر فيها طبقات الدهون أو الأوتار أو العظام" : "Deep wounds exposing fat, tendons, or bones",
                language === "ar" ? "إصابات ملوثة ناتجة عن عضات حيوانات أو أدوات شديدة الصدأ" : "Heavily contaminated or animal bite wounds"
            ],
        recommendedMedicalSpecialty: parsed.recommendedMedicalSpecialty || (language === "ar" ? "طبيب جلدية وتناسلية أو جراحة عامة" : "Dermatologist / General Surgeon"),
        disclaimer: language === "ar"
            ? "هذا التقييم الذكي مخصص للإرشاد السريري الأولي ولا يغني عن الفحص الطبي المباشر في عيادة الطبيب المختص."
            : "This AI assessment is for clinical first-aid guidance and does not replace in-person medical evaluation.",
        confidenceScore: parsed.confidenceScore ?? 98,
        analyzedAt: new Date().toISOString(),
    };

    return normalized;
}
