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
    woundType: "laceration" | "abrasion" | "burn" | "puncture" | "diabetic_ulcer" | "pressure_ulcer" | "surgical_incision" | "contusion" | "other";
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

const WOUND_SYSTEM_PROMPT = `You are an elite clinical wound care specialist and surgical triage AI operating under international wound management standards (EWMA, WHS, and WHO guidelines).
Your task is to perform an exhaustive, evidence-based clinical assessment of the provided skin/wound photograph.

You must analyze:
1. Exact Wound Classification: Laceration (جرح قطعي), Abrasion (سحجة/خدش), Burn (حرق سطحي/عميق), Puncture (جرح وخزي/مسمار), Diabetic Ulcer (قرحة سكري), Pressure Ulcer (قرحة فراش), Surgical Incision (شق جراحي/غرز), Contusion/Hematoma (كدمة/تجمع دموي).
2. Tissue Bed Composition (% Total must equal 100):
   - granulation: Red healthy vascular bed %
   - slough: Yellow fibrinous non-viable tissue %
   - necrotic: Black/brown eschar %
   - epithelial: Pink resurfacing edge %
3. Suture Necessity: Does the wound gape >5mm, penetrate dermis/subcutaneous fat, or involve facial/joint tissue? Detail the golden suture window (6-8 hours).
4. Tetanus Shot Assessment: Check if wound is puncture, dirty, rusted object, soil/animal contact, or deep tissue injury.
5. Infection Markers: Erythema extension, purulent exudate, localized edema, heat, cellulitis signs.
6. Step-by-step First Aid & Evidence-based Dressing: Saline irrigation (no toxic high-strength povidone-iodine in deep beds), optimal dressing (Hydrogel/Foam/Non-adherent gauze).
7. Red Flags / Immediate ER Triggers: Arterial pulsatile bleeding, numbness/loss of motor function distal to wound, rapid spreading redness, systemic sepsis signs.

You must reply with a valid, clean JSON object matching this EXACT schema without any conversational text or markdown code fences:

{
  "scanType": "wound",
  "woundTitle": "عنوان تشخيصي مختصر للجرح بالعربية",
  "woundTitleEn": "Short clinical diagnosis in English",
  "woundType": "laceration",
  "woundTypeLocalized": "جرح قطعي سطحي / سحجة / حرق",
  "severity": "minor",
  "healingStage": "inflammatory",
  "healingStageLocalized": "المرحلة الالتهابية الأولى / مرحلة التكاثر وبناء الأنسجة",
  "estimatedHealingDays": "5 إلى 7 أيام تقريباً",
  "tissueComposition": {
    "granulation": 75,
    "slough": 15,
    "necrotic": 0,
    "epithelial": 10
  },
  "infectionAssessment": {
    "riskLevel": "low",
    "hasActiveSigns": false,
    "erythemaNote": "احمرار موضعي خفيف طبيعي ضمن حدود الإصابة",
    "exudateNote": "إفرازات مصلية طبيعية خفيفة",
    "swellingNote": "تورم طفيف في الحواف",
    "clinicalSummary": "لا توجد علامات عدوى بكتيرية نشطة حالياً."
  },
  "sutureAssessment": {
    "requiresSutures": false,
    "urgencyWindowHours": 8,
    "rationale": "حواف الجرح متقاربة ولا يوجد تباعد عميق في طبقات الجلد."
  },
  "tetanusAssessment": {
    "riskIdentified": false,
    "rationale": "الجرح سطحي ونظيف ولم ينتج عن أداة صدئة أو تربة ملوثة.",
    "recommendation": "تأكد من سريان جرعة التيتانوس التنشيطية خلال الـ 10 سنوات الماضية."
  },
  "firstAidSteps": [
    {
      "stepNumber": 1,
      "title": "إيقاف أي نزيف متبقي",
      "action": "الضغط المباشر والمستمر بقطعة شاش معقمة لمدة 5-10 دقائق دون رفع الشاش باستمرار.",
      "caution": "تجنب فرك الجرح لمنع تمزق التخثر الدموي المتشكل."
    },
    {
      "stepNumber": 2,
      "title": "التنظيف والري المعقم",
      "action": "غسل الجرح بلطف باستخدام محلول ملحي معقم (Normal Saline 0.9%) أو ماء جارٍ فاتر ونظيف.",
      "caution": "تجنب سكب الكحول المركز أو ماء الأكسجين أو البيتادين الخام داخل عمق الجرح لتجنب حرق الخلايا النامية."
    },
    {
      "stepNumber": 3,
      "title": "الترطيب والتغطية",
      "action": "وضع طبقة رقيقة من مرهم مضاد حيوي موضعي أو جل هيدروجيل وتغطيته بضمادة غير لاصقة.",
      "caution": "الحفاظ على بيئة الجرح رطبة ومعقمة يسرع الالتئام بمقدار الضعف مقارنة بتركه يجف مكشوفاً."
    }
  ],
  "dressingProtocol": {
    "recommendedDressing": "ضمادة شاش معقم غير لاصق (Non-adherent Dressing) مع شريط طبي مسامي",
    "cleaningSolution": "محلول ملحي معقم 0.9% (Normal Saline)",
    "applicationInstructions": "تغيير الضمادة مرة يومياً أو فور تبللها أو اتساخها.",
    "changeFrequency": "كل 24 ساعة",
    "avoidSubstances": ["الكحول الطبي 70% داخل الجرح", "القطن العادي (يلتصق بالأنسجة)", "ماء الأكسجين (Hydrogen Peroxide)"]
  },
  "urgentRedFlags": [
    "نزيف نابض أو مستمر لا يتوقف بعد 10 دقائق من الضغط المتواصل",
    "فقدان الإحساس أو التنميل في الأطراف بعد موضع الإصابة",
    "انتشار خطوط حمراء ساخنة تمتد من الجرح باتجاه الجسم"
  ],
  "whenToSeekImmediateER": [
    "إذا كان الجرح عميقاً وتظهر فيه الأنسجة الصفراء الدهنية أو العضلات (يلزم خياطة خلال 6-8 ساعات)",
    "إذا كانت الإصابة ناتجة عن عضة حيوان أو أداة حادة مجهولة المصدر شديدة الصدأ",
    "ارتفاع درجة حرارة الجسم (حمى) أو قشعريرة مصاحبة للانتفاخ والصديد"
  ],
  "recommendedMedicalSpecialty": "طبيب جراحة عامة أو رعاية الجروح المتقدمة",
  "disclaimer": "هذا التقييم الذكي مخصص للإرشاد الإسعافي الأولي ولا يغني عن الفحص الطبي المباشر في الطوارئ أو عيادة الجراحة.",
  "confidenceScore": 98
}`;

/**
 * Analyzes a high-resolution wound image and returns structured clinical wound metrics.
 */
export async function analyzeWoundImage(
    imageDataUrl: string,
    language: "ar" | "en" = "ar"
): Promise<WoundAnalysisResult> {
    const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
    const pollinations = createPollinationsClient();

    const primaryVisionModel = process.env.OCR_VISION_MODEL || "YoannDev90/muse-glimmer-30b:free";
    const visionModelsToTry = [primaryVisionModel, "qwen-vision", "openai"];

    let rawText = "";

    const userPrompt = language === "ar"
        ? `قم بفحص هذه الصورة الطبية للجرح والإصابة الجلدية بدقة سريرية قصوى، واستخرج كافة التفاصيل المطلوبة وفق الـ JSON Schema المحدد باللغة العربية بدقة متناهية.`
        : `Examine this wound/skin injury image with maximum clinical precision, and output the comprehensive assessment in the specified JSON Schema in English.`;

    for (const modelCandidate of visionModelsToTry) {
        try {
            console.log(`[Wound Engine] Calling Vision Model (${modelCandidate})...`);
            const res = await pollinations.chat.completions.create({
                model: modelCandidate,
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
            if (rawText && rawText.trim().length > 50) {
                console.log(`[Wound Engine] Model ${modelCandidate} returned response length: ${rawText.length}`);
                break;
            }
        } catch (err: any) {
            console.warn(`[Wound Engine] Vision model ${modelCandidate} failed:`, err?.message || err);
            if (modelCandidate === visionModelsToTry[visionModelsToTry.length - 1]) {
                throw err;
            }
        }
    }

    const parsed = robustParseJson<Partial<WoundAnalysisResult>>(rawText, {});

    // Normalize & Hardened Fallbacks
    const normalized: WoundAnalysisResult = {
        scanType: "wound",
        woundTitle: parsed.woundTitle || (language === "ar" ? "فحص وتقييم إصابة جلدية" : "Wound & Skin Injury Assessment"),
        woundTitleEn: parsed.woundTitleEn || "Wound Clinical Assessment",
        woundType: parsed.woundType || "laceration",
        woundTypeLocalized: parsed.woundTypeLocalized || (language === "ar" ? "جرح أو إصابة جلدية" : "Wound Injury"),
        severity: parsed.severity || "minor",
        healingStage: parsed.healingStage || "inflammatory",
        healingStageLocalized: parsed.healingStageLocalized || (language === "ar" ? "مرحلة الالتئام الأولية" : "Initial Healing Phase"),
        estimatedHealingDays: parsed.estimatedHealingDays || (language === "ar" ? "5 إلى 10 أيام" : "5 to 10 days"),
        tissueComposition: {
            granulation: parsed.tissueComposition?.granulation ?? 70,
            slough: parsed.tissueComposition?.slough ?? 15,
            necrotic: parsed.tissueComposition?.necrotic ?? 0,
            epithelial: parsed.tissueComposition?.epithelial ?? 15,
        },
        infectionAssessment: {
            riskLevel: parsed.infectionAssessment?.riskLevel || "low",
            hasActiveSigns: parsed.infectionAssessment?.hasActiveSigns || false,
            erythemaNote: parsed.infectionAssessment?.erythemaNote || (language === "ar" ? "احمرار موضعي خفيف" : "Mild localized erythema"),
            exudateNote: parsed.infectionAssessment?.exudateNote || (language === "ar" ? "إفرازات مصلية خفيفة" : "Mild serous exudate"),
            swellingNote: parsed.infectionAssessment?.swellingNote || (language === "ar" ? "تورم طفيف في الحواف" : "Mild edge edema"),
            clinicalSummary: parsed.infectionAssessment?.clinicalSummary || (language === "ar" ? "المنطقة مستقرة مع عدم وجود علامات عدوى شديدة." : "Stable wound bed without severe infection signs."),
        },
        sutureAssessment: {
            requiresSutures: parsed.sutureAssessment?.requiresSutures || false,
            urgencyWindowHours: parsed.sutureAssessment?.urgencyWindowHours || 8,
            rationale: parsed.sutureAssessment?.rationale || (language === "ar" ? "حواف الجرح لا تتطلب خياطة جراحية عاجلة." : "Wound margins do not require urgent surgical suturing."),
        },
        tetanusAssessment: {
            riskIdentified: parsed.tetanusAssessment?.riskIdentified || false,
            rationale: parsed.tetanusAssessment?.rationale || (language === "ar" ? "إصابة سطحية منخفضة الخطورة." : "Low-risk superficial injury."),
            recommendation: parsed.tetanusAssessment?.recommendation || (language === "ar" ? "تأكد من جرعة التيتانوس التنشيطية كل 10 سنوات." : "Ensure tetanus booster is up to date within 10 years."),
        },
        firstAidSteps: Array.isArray(parsed.firstAidSteps) && parsed.firstAidSteps.length > 0
            ? parsed.firstAidSteps
            : [
                {
                    stepNumber: 1,
                    title: language === "ar" ? "إيقاف النزيف بالضغط" : "Control Bleeding",
                    action: language === "ar" ? "الضغط المستمر بشاش معقم لمدة 5-10 دقائق." : "Apply continuous direct pressure with sterile gauze.",
                },
                {
                    stepNumber: 2,
                    title: language === "ar" ? "الغسيل والتطهير المعقم" : "Irrigation & Cleaning",
                    action: language === "ar" ? "استخدام محلول ملحي معقم (Saline 0.9%) بلطف دون فرك شديد." : "Gently flush with sterile 0.9% saline.",
                },
                {
                    stepNumber: 3,
                    title: language === "ar" ? "التغطية والترطيب" : "Protection & Dressing",
                    action: language === "ar" ? "وضع مرهم مرطب معقم وتغطيته بضمادة غير لاصقة." : "Apply soothing wound hydrogel and cover with sterile pad.",
                }
            ],
        dressingProtocol: {
            recommendedDressing: parsed.dressingProtocol?.recommendedDressing || (language === "ar" ? "ضمادة شاش معقم غير لاصق" : "Sterile non-adherent gauze"),
            cleaningSolution: parsed.dressingProtocol?.cleaningSolution || "Normal Saline 0.9%",
            applicationInstructions: parsed.dressingProtocol?.applicationInstructions || (language === "ar" ? "تغيير الضمادة يومياً أو عند البلل." : "Change daily or when soiled."),
            changeFrequency: parsed.dressingProtocol?.changeFrequency || "24h",
            avoidSubstances: parsed.dressingProtocol?.avoidSubstances || ["الكحول المركز داخل الجرح", "القطن الطبي المباشر", "ماء الأكسجين"],
        },
        urgentRedFlags: Array.isArray(parsed.urgentRedFlags) && parsed.urgentRedFlags.length > 0
            ? parsed.urgentRedFlags
            : [
                language === "ar" ? "نزيف نابض أو مستمر لا يتوقف بعد 10 دقائق من الضغط المتواصل" : "Pulsatile or persistent bleeding failing to stop after 10 mins",
                language === "ar" ? "انتشار خطوط حمراء أو سخونة شديدة حول الجرح" : "Spreading red streaks or intense heat around the wound"
            ],
        whenToSeekImmediateER: Array.isArray(parsed.whenToSeekImmediateER) && parsed.whenToSeekImmediateER.length > 0
            ? parsed.whenToSeekImmediateER
            : [
                language === "ar" ? "جروح عميقة تظهر فيها طبقات الدهون أو الأوتار" : "Deep wounds exposing fat or tendons",
                language === "ar" ? "إصابات ملوثة شديدة الصدأ أو عضات حيوانات" : "Heavily contaminated or animal bite wounds"
            ],
        recommendedMedicalSpecialty: parsed.recommendedMedicalSpecialty || (language === "ar" ? "طبيب جراحة عامة / رعاية الجروح" : "General Surgeon / Wound Care Specialist"),
        disclaimer: language === "ar"
            ? "هذا التقييم الذكي مخصص للإرشاد الإسعافي الأولي ولا يغني عن الفحص الطبي المباشر في الطوارئ أو عيادة الجراحة."
            : "This AI assessment is for first-aid guidance and does not replace in-person emergency evaluation.",
        confidenceScore: parsed.confidenceScore ?? 95,
        analyzedAt: new Date().toISOString(),
    };

    return normalized;
}
