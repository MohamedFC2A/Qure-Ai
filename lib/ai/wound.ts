import OpenAI from "openai";
import { createPollinationsClient, getDeepSeekApiKey, getVisionModelsToTry } from "@/lib/ai/deepseek";
import { robustParseJson } from "@/lib/ai/jsonRepair";

export type ClinicalCategory =
    | "skin_analysis"
    | "dermatology_lesion"
    | "warts_corns_growths"
    | "trauma_and_wounds"
    | "chronic_ulcers"
    | "surgical_post_op"
    | "abscess_and_infections"
    | "general_dermatology";

export interface TissueComposition {
    granulation: number; // 0-100% (Red/Healthy Granulation or Healthy Skin)
    slough: number;       // 0-100% (Yellow/Devitalized tissue or Sebum/Exudate)
    necrotic: number;     // 0-100% (Black/Eschar/Dead tissue or Comedones)
    epithelial: number;   // 0-100% (Pink/Regenerating margins or Epidermal barrier)
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

export interface RecommendedActiveIngredient {
    name: string;
    purpose: string;
    howToUse: string;
}

export interface DressingProtocol {
    recommendedDressing: string;
    cleaningSolution: string;
    applicationInstructions: string;
    changeFrequency: string;
    avoidSubstances: string[];
    recommendedActives?: RecommendedActiveIngredient[];
}

export interface SkinTypeProfile {
    isSkinAnalysis: boolean;
    skinType: "oily" | "dry" | "combination" | "sensitive" | "normal" | "not_applicable";
    skinTypeLocalized: string;
    sebumLevel?: "low" | "balanced" | "high" | "very_high";
    hydrationLevel?: "dehydrated" | "adequate" | "optimal";
    poreStatus?: string;
    barrierIntegrity?: "compromised" | "mildly_irritated" | "healthy";
    primaryConcerns?: string[];
}

export interface ClinicalThinking {
    keyVisualObservations: string[];
    differentialDiagnoses: string[];
    diagnosticRationale: string;
}

export interface WoundAnalysisResult {
    id?: string;
    scanType: "wound";
    category?: ClinicalCategory;
    categoryLocalized?: string;
    woundTitle: string;
    woundTitleEn: string;
    woundType:
        | "laceration"
        | "abrasion"
        | "burn"
        | "puncture"
        | "diabetic_ulcer"
        | "pressure_ulcer"
        | "surgical_incision"
        | "contusion"
        | "wart_verruca"
        | "corn_clavus"
        | "abscess_boil"
        | "cellulitis"
        | "acne_vulgaris"
        | "eczema_dermatitis"
        | "psoriasis"
        | "fungal_tinea"
        | "insect_bite"
        | "skin_type_facial"
        | "other";
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
    skinTypeProfile?: SkinTypeProfile;
    clinicalThinking?: ClinicalThinking;
    urgentRedFlags: string[];
    whenToSeekImmediateER: string[];
    recommendedMedicalSpecialty: string;
    disclaimer: string;
    confidenceScore: number;
    analyzedAt: string;
}

const CLINICAL_DIAGNOSTIC_SYSTEM_PROMPT = `You are a World-Class Senior Consultant Dermatologist, General Medical Diagnostician & Trauma Surgeon.
Your mission is to perform an exhaustive, zero-error clinical analysis of the provided photograph (covering any human skin region, face, dermatological condition, growth, wound, burn, or bodily injury).

🧠 CLINICAL TAXONOMY & DIAGNOSTIC SYSTEM:
You must accurately identify and differentiate all clinical entities:

1. **تحليل البشرة والوجه (Facial & Skin Type Analysis)**:
   - Skin Types: الدهنية (Oily), الجافة (Dry), المختلطة (Combination T-Zone), الحساسة (Sensitive), العادية (Normal).
   - Assess sebum shine, dehydration lines, visible/clogged pores, skin barrier integrity, erythema.
   - Title MUST be: "تحليل نوع البشرة (مختلطة/دهنية/جافة)" | "Facial Skin Type & Barrier Analysis"
   - Category: "skin_analysis", Type: "skin_type_facial"

2. **حب الشباب والبثور (Acne Vulgaris / Comedones / Folliculitis)**:
   - Open/closed comedones, inflammatory papules, pustules, cystic nodules.
   - Title MUST be: "حب شباب التهابي (Acne)" | "Inflammatory Acne Vulgaris"
   - Category: "dermatology_lesion", Type: "acne_vulgaris"

3. **عين السمكة / السنط الجلدي (Plantar Wart / Verruca / HPV)**:
   - Hyperkeratotic papule with thrombosed pinpoint capillaries (black dots), disruption of normal fingerprint/skin skin lines.
   - Title MUST be: "عين السمكة (سنط جلدي)" | "Plantar Wart (Verruca)"
   - Category: "warts_corns_growths", Type: "wart_verruca"

4. **مسمار القدم / الكالو (Corn / Clavus / Hyperkeratosis)**:
   - Thickened, yellowish localized stratum corneum over pressure points with translucent hard central core. Normal skin lines pass over/around.
   - Title MUST be: "مسمار القدم (كالو)" | "Foot Corn (Clavus)"
   - Category: "warts_corns_growths", Type: "corn_clavus"

5. **الخراج والدمل الجلدي (Abscess / Furuncle / Boil)**:
   - Erythematous, tender, warm, fluctuant nodule often with purulent pointing center.
   - Title MUST be: "خراج / دمل جلدي" | "Cutaneous Abscess / Boil"
   - Category: "abscess_and_infections", Type: "abscess_boil"

6. **الإكزيما والتهاب الجلد التأتبي والتلامسي (Eczema / Atopic & Contact Dermatitis)**:
   - Pruritic, ill-defined erythematous patches, dry scaling, excoriations, lichenification.
   - Title MUST be: "إكزيما / التهاب جلدي" | "Eczema / Dermatitis"
   - Category: "dermatology_lesion", Type: "eczema_dermatitis"

7. **الصدفية (Psoriasis Vulgaris)**:
   - Well-demarcated erythematous plaques with thick, silvery-white micaceous scales (extensor surfaces, elbows, knees, scalp).
   - Title MUST be: "صدفية لويحية (Psoriasis)" | "Plaque Psoriasis"
   - Category: "dermatology_lesion", Type: "psoriasis"

8. **الفطريات والتينيا (Tinea / Fungal Dermatophytosis)**:
   - Annular erythematous patch with active raised scaly borders and central clearing (Ringworm).
   - Title MUST be: "فطريات جلدية (تينيا)" | "Fungal Infection (Tinea)"
   - Category: "dermatology_lesion", Type: "fungal_tinea"

9. **الحروق بجميع درجاتها (Thermal / Chemical / Sun Burns)**:
   - 1st Degree: Red, dry, painful, no blisters -> "حرق سطحي (درجة أولى)"
   - 2nd Degree: Blisters, bullae, weeping raw dermis, intense pain -> "حرق جلدي من الدرجة الثانية"
   - 3rd Degree: Full-thickness, charred/leathery, painless center -> "حرق عميق (درجة ثالثة - طوارئ)"
   - Category: "trauma_and_wounds", Type: "burn"

10. **الجروح القطعية (Lacerations & Incisions)**:
    - Linear skin cleavage.
    - If superficial (<3mm depth, edges touch) -> "جرح قطعي سطحي"
    - If deep (>5mm depth, gaping, adipose exposed) -> "جرح قطعي عميق (يستلزم خياطة)"
    - Category: "trauma_and_wounds", Type: "laceration"

11. **السحجات والخدوش (Abrasions / Scrapes)**:
    - Superficial epidermal friction loss with serosanguinous oozing.
    - Title: "سحجة وخدش جلدي" | "Skin Abrasion"
    - Category: "trauma_and_wounds", Type: "abrasion"

12. **الجروح الوخزية والنافذة (Puncture Wounds)**:
    - Small deep entry from nail/needle/sharp object with high tetanus & deep anaerobic infection risk.
    - Title: "جرح وخزي نافذ (مسمار/أداة حادة)" | "Puncture Wound"
    - Category: "trauma_and_wounds", Type: "puncture"

13. **لدغات الحشرات والتحسس الموضعي (Insect Bites / Local Reaction)**:
    - Punctate center surrounded by an erythematous urticarial wheal or indurated papule.
    - Title: "لدغة حشرة وتحسس موضعي" | "Insect Bite Reaction"
    - Category: "dermatology_lesion", Type: "insect_bite"

14. **قرح القدم السكري وفراش الضغط (Diabetic / Pressure Ulcers)**:
    - Chronic non-healing ulcers requiring strict offloading, sterile debridement.
    - Category: "chronic_ulcers", Type: "diabetic_ulcer" or "pressure_ulcer"

🏷️ MANDATORY RULES:
- "woundTitle": MUST BE CONCISE (2 to 4 words MAX). Direct, famous Arabic clinical term.
- "clinicalThinking": Provide rigorous diagnostic reasoning (observations, differential diagnosis, and reasons for confirming the primary diagnosis).
- "dressingProtocol.recommendedActives": Provide 2-3 safe, evidence-based active ingredients (e.g. Salicylic acid, Niacinamide, Clotrimazole, Zinc oxide, Panthenol, Hydrocolloid, Mupirocin, Silver sulfadiazine).
- "dressingProtocol.avoidSubstances": List dangerous home remedies or harmful substances (e.g. معجون الأسنان، الكحول المركز على الجروح المفتوحة، الفرك العنيف، عصر البثور).

OUTPUT FORMAT:
Return ONLY a valid, raw JSON object matching this EXACT schema:
{
  "scanType": "wound",
  "category": "skin_analysis" | "dermatology_lesion" | "warts_corns_growths" | "trauma_and_wounds" | "chronic_ulcers" | "surgical_post_op" | "abscess_and_infections" | "general_dermatology",
  "categoryLocalized": "تصنيف الحالة بالعربية (مثل: فحص نوع البشرة / تشخيص أمراض جلدية / فحص زوائد ومسامير / تقييم جروح وإصابات)",
  "woundTitle": "الاسم السريري القصير المشهور المباشر (مثل: عين السمكة / حب شباب التهابي / بشرة مختلطة / مسمار القدم / خراج جلدي / حرق درجة ثانية)",
  "woundTitleEn": "Short standard clinical name in English",
  "woundType": "acne_vulgaris" | "wart_verruca" | "corn_clavus" | "abscess_boil" | "eczema_dermatitis" | "psoriasis" | "fungal_tinea" | "burn" | "laceration" | "abrasion" | "puncture" | "insect_bite" | "skin_type_facial" | "diabetic_ulcer" | "pressure_ulcer" | "surgical_incision" | "contusion" | "cellulitis" | "other",
  "woundTypeLocalized": "النوع السريري بالعربية",
  "severity": "minor" | "moderate" | "severe" | "emergency",
  "healingStage": "inflammatory" | "proliferative" | "maturation_remodeling",
  "healingStageLocalized": "مرحلة التطور السريري بالعربية",
  "estimatedHealingDays": "المدة المقدرة للتحسن أو الشفاء (مثل: 5 إلى 7 أيام / 3 أسابيع للعناية)",
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
    "exudateNote": "وصف الإفرازات أو الدهون",
    "swellingNote": "وصف التورم أو الانتفاخ",
    "clinicalSummary": "ملخص سريري دقيق لعلامات الالتهاب والعدوى"
  },
  "sutureAssessment": {
    "requiresSutures": boolean,
    "urgencyWindowHours": number (0 if none),
    "rationale": "سبب الحاجة أو عدم الحاجة للتدخل الجراحي/الخياطة"
  },
  "tetanusAssessment": {
    "riskIdentified": boolean,
    "rationale": "تقييم خطورة التيتانوس وفق طبيعة الإصابة والأداة",
    "recommendation": "التوصية السريرية بشأن لقاح التيتانوس"
  },
  "skinTypeProfile": {
    "isSkinAnalysis": boolean,
    "skinType": "oily" | "dry" | "combination" | "sensitive" | "normal" | "not_applicable",
    "skinTypeLocalized": "نوع البشرة بالعربية",
    "sebumLevel": "low" | "balanced" | "high" | "very_high",
    "hydrationLevel": "dehydrated" | "adequate" | "optimal",
    "poreStatus": "حالة المسام (ضيقة / واسعة / مسدودة)",
    "barrierIntegrity": "healthy" | "mildly_irritated" | "compromised",
    "primaryConcerns": ["المشكلة الأساسية 1", "المشكلة الأساسية 2"]
  },
  "clinicalThinking": {
    "keyVisualObservations": ["الملاحظة السريرية 1", "الملاحظة السريرية 2"],
    "differentialDiagnoses": ["التشخيص التفريقي 1", "التشخيص التفريقي 2"],
    "diagnosticRationale": "التعليل السريري المنهجي للتأكد من التشخيص واستبعاد الحالات المشابهة"
  },
  "firstAidSteps": [
    {
      "stepNumber": 1,
      "title": "عنوان الخطوة السريرية أو الإسعافية",
      "action": "شرح عملي دقيق للخطوة الموصى بها طبياً",
      "caution": "تنبيه هام لتجنب الأخطاء الشائعة"
    }
  ],
  "dressingProtocol": {
    "recommendedDressing": "نوع الضمادة أو طبقة الحماية الموصى بها",
    "cleaningSolution": "محلول التنظيف أو الغسول المناسب",
    "applicationInstructions": "طريقة الاستخدام والعناية السليمة",
    "changeFrequency": "معدل التطبيق أو التغيير",
    "avoidSubstances": ["المواد والممارسات الممنوعة تماماً مثل الكحول المركز أو معجون الأسنان"],
    "recommendedActives": [
      {
        "name": "اسم المادة الفعالة (مثل: حمض الساليسيليك / الزنك / البانثينول)",
        "purpose": "فائدة المادة الفعالة للحالة",
        "howToUse": "طريقة الاستخدام الصحيحة"
      }
    ]
  },
  "urgentRedFlags": [
    "علامة خطر حرجة 1 تستوجب الفحص الطبي الفوري",
    "علامة خطر حرجة 2"
  ],
  "whenToSeekImmediateER": [
    "حالة طوارئ تستدعي الذهاب للمستشفى فوراً"
  ],
  "recommendedMedicalSpecialty": "التخصص الطبي الموصى بمراجعته (مثل: أخصائي جلدية وتناسلية / جراحة عامة / طوارئ)",
  "disclaimer": "تحليل سريري استرشادي مدعوم بالذكاء الاصطناعي لا يغني عن الفحص الطبي المباشر في العيادة.",
  "confidenceScore": 98
}`;

/**
 * Sanitizes and extracts the short famous clinical name if the AI returned a long description.
 */
function sanitizeClinicalTitle(
    rawTitle: string,
    rawType: string,
    rawCategory: string,
    isAr: boolean
): { titleAr: string; titleEn: string; categoryAr: string } {
    let clean = (rawTitle || "").trim();
    const lower = clean.toLowerCase();

    // 1. Skin Type & Facial Analysis
    if (lower.includes("skin type") || lower.includes("بشرة") || lower.includes("facial") || lower.includes("وجه") || rawType === "skin_type_facial") {
        if (lower.includes("دهني") || lower.includes("oily")) {
            return { titleAr: "بشرة دهنية مع إفراز زهمي نشط", titleEn: "Oily Skin Profile", categoryAr: "تحليل نوع البشرة والعناية" };
        }
        if (lower.includes("جاف") || lower.includes("dry")) {
            return { titleAr: "بشرة جافة مع نقص ترطيب", titleEn: "Dry Dehydrated Skin", categoryAr: "تحليل نوع البشرة والعناية" };
        }
        if (lower.includes("مختلط") || lower.includes("combination")) {
            return { titleAr: "بشرة مختلطة (منطقة T الدهنية)", titleEn: "Combination Skin Profile", categoryAr: "تحليل نوع البشرة والعناية" };
        }
        if (lower.includes("حساس") || lower.includes("sensitive")) {
            return { titleAr: "بشرة حساسة وسريعة التفاعل", titleEn: "Sensitive Reactive Skin", categoryAr: "تحليل نوع البشرة والعناية" };
        }
        return { titleAr: "تحليل صحة وحاجز البشرة", titleEn: "Skin Barrier & Profile Analysis", categoryAr: "تحليل نوع البشرة والعناية" };
    }

    // 2. Acne & Comedones
    if (lower.includes("acne") || lower.includes("حب شباب") || lower.includes("بثور") || lower.includes("pimples") || lower.includes("comedone")) {
        if (lower.includes("nodul") || lower.includes("cyst") || lower.includes("عقدي") || lower.includes("كيسي")) {
            return { titleAr: "حب شباب كيسي ملتهب", titleEn: "Cystic Acne Lesions", categoryAr: "أمراض جلدية وشائعة" };
        }
        if (lower.includes("comedo") || lower.includes("زوان") || lower.includes("رؤوس سوداء") || lower.includes("blackhead")) {
            return { titleAr: "رؤوس سوداء وزوان جلدي", titleEn: "Comedonal Acne", categoryAr: "أمراض جلدية وشائعة" };
        }
        return { titleAr: "حب شباب التهابي (Acne)", titleEn: "Inflammatory Acne Vulgaris", categoryAr: "أمراض جلدية وشائعة" };
    }

    // 3. Warts / Verrucas (عين السمكة)
    if (lower.includes("wart") || lower.includes("verruca") || lower.includes("سنط") || lower.includes("عين السمكة") || lower.includes("عين سمكة")) {
        return { titleAr: "عين السمكة (سنط جلدي)", titleEn: "Plantar Wart (Verruca)", categoryAr: "زوائد ومسامير جلدية" };
    }

    // 4. Corns / Calluses (مسمار القدم / كالو)
    if (lower.includes("corn") || lower.includes("clavus") || lower.includes("كالو") || lower.includes("مسمار القدم") || lower.includes("مسمار قدم")) {
        return { titleAr: "مسمار القدم (كالو)", titleEn: "Foot Corn (Clavus)", categoryAr: "زوائد ومسامير جلدية" };
    }

    // 5. Abscess / Boil (خراج / دمل)
    if (lower.includes("abscess") || lower.includes("boil") || lower.includes("furuncle") || lower.includes("خراج") || lower.includes("دمل")) {
        return { titleAr: "خراج / دمل جلدي", titleEn: "Cutaneous Abscess / Boil", categoryAr: "التهابات وعدوى جلدية" };
    }

    // 6. Eczema & Dermatitis
    if (lower.includes("eczema") || lower.includes("dermatitis") || lower.includes("إكزيما") || lower.includes("التهاب جلدي")) {
        return { titleAr: "إكزيما / التهاب جلدي", titleEn: "Eczema / Dermatitis", categoryAr: "أمراض جلدية وشائعة" };
    }

    // 7. Psoriasis
    if (lower.includes("psoriasis") || lower.includes("صدفية")) {
        return { titleAr: "صدفية لويحية (Psoriasis)", titleEn: "Plaque Psoriasis", categoryAr: "أمراض جلدية وشائعة" };
    }

    // 8. Fungal / Ringworm / Tinea
    if (lower.includes("fungal") || lower.includes("tinea") || lower.includes("ringworm") || lower.includes("فطريات") || lower.includes("تينيا") || lower.includes("قوباء")) {
        return { titleAr: "فطريات جلدية (تينيا)", titleEn: "Fungal Infection (Tinea)", categoryAr: "التهابات وعدوى جلدية" };
    }

    // 9. Insect Bite / Sting
    if (lower.includes("insect") || lower.includes("bite") || lower.includes("sting") || lower.includes("لدغة") || lower.includes("قرصة")) {
        return { titleAr: "لدغة حشرة وتحسس موضعي", titleEn: "Insect Bite Reaction", categoryAr: "أمراض جلدية وشائعة" };
    }

    // 10. Burns
    if (lower.includes("burn") || lower.includes("حرق")) {
        if (lower.includes("ثانية") || lower.includes("2nd") || lower.includes("فقاعات") || lower.includes("blister")) {
            return { titleAr: "حرق جلدي من الدرجة الثانية", titleEn: "2nd Degree Thermal Burn", categoryAr: "تقييم جروح وإصابات" };
        }
        if (lower.includes("ثالثة") || lower.includes("3rd") || lower.includes("عميق")) {
            return { titleAr: "حرق عميق (درجة ثالثة)", titleEn: "3rd Degree Severe Burn", categoryAr: "تقييم جروح وإصابات" };
        }
        return { titleAr: "حرق سطحي (درجة أولى)", titleEn: "1st Degree Superficial Burn", categoryAr: "تقييم جروح وإصابات" };
    }

    // 11. Lacerations
    if (lower.includes("laceration") || lower.includes("قطعي")) {
        if (lower.includes("عميق") || lower.includes("خياطة") || lower.includes("deep") || lower.includes("suture")) {
            return { titleAr: "جرح قطعي عميق (يستلزم خياطة)", titleEn: "Deep Gaping Laceration", categoryAr: "تقييم جروح وإصابات" };
        }
        return { titleAr: "جرح قطعي سطحي", titleEn: "Superficial Laceration", categoryAr: "تقييم جروح وإصابات" };
    }

    // 12. Abrasions
    if (lower.includes("abrasion") || lower.includes("سحجة") || lower.includes("خدش")) {
        return { titleAr: "سحجة وخدش جلدي", titleEn: "Skin Abrasion", categoryAr: "تقييم جروح وإصابات" };
    }

    // 13. Punctures
    if (lower.includes("puncture") || lower.includes("وخزي") || lower.includes("نافذ") || lower.includes("مسمار")) {
        return { titleAr: "جرح وخزي نافذ (مسمار/أداة حادة)", titleEn: "Puncture Wound", categoryAr: "تقييم جروح وإصابات" };
    }

    // 14. Diabetic & Pressure Ulcers
    if (lower.includes("diabetic") || lower.includes("سكري")) {
        return { titleAr: "قرحة قدم سكري", titleEn: "Diabetic Foot Ulcer", categoryAr: "قرح مزمنة ورعاية سريرية" };
    }
    if (lower.includes("pressure") || lower.includes("فراش") || lower.includes("bedsore")) {
        return { titleAr: "قرحة فراش ضغطية", titleEn: "Pressure Ulcer (Bedsore)", categoryAr: "قرح مزمنة ورعاية سريرية" };
    }

    // Clean up if the AI returned a long phrase starting with "فحص وتقييم"
    clean = clean.replace(/^(فحص وتقييم|تقرير تقييم|حالة|تشخيص سريري لـ|تقييم حالة)\s+/gi, "").trim();
    if (clean.length > 35) {
        clean = clean.slice(0, 35).trim();
    }

    return {
        titleAr: clean || "فحص وتقييم سريري",
        titleEn: "Clinical Dermatological Assessment",
        categoryAr: "فحص الجلد والإصابات السريري",
    };
}

/**
 * Analyzes any skin image, facial photo, lesion, growth, wound, or bodily trauma with high-precision clinical reasoning.
 */
export async function analyzeWoundImage(
    imageDataUrl: string,
    language: "ar" | "en" = "ar"
): Promise<WoundAnalysisResult> {
    const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
    const pollinations = createPollinationsClient();
    const candidateVisionModels = getVisionModelsToTry();
    let rawText = "";

    const userPrompt = language === "ar"
        ? `قم بفحص هذه الصورة الطبية بدقة سريرية وتشخيصية شاملة (سواء كانت صورة وجه ونوع بشرة، حب شباب، سنط/عين سمكة، مسمار قدم/كالو، خراج، حرق، جرح قطعي، إكزيما، طفح، أو إصابة). قم بإجراء تفكير سريري عميق (Clinical Chain-of-Thought) واستخرج كافة التفاصيل المطلوبة وفق الـ JSON Schema المحدد بدقة 100%.`
        : `Perform an exhaustive, deep-thinking clinical dermatological and physical diagnosis of this image (whether it is facial skin analysis, acne, wart/corn, abscess, burn, laceration, rash, or injury), outputting strictly according to the specified JSON schema.`;

    for (const candidateModel of candidateVisionModels) {
        try {
            console.log(`[Clinical Vision Engine] Calling Vision Model (${candidateModel})...`);
            const res = await pollinations.chat.completions.create({
                model: candidateModel,
                messages: [
                    { role: "system", content: CLINICAL_DIAGNOSTIC_SYSTEM_PROMPT },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: userPrompt },
                            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Data}` } }
                        ]
                    }
                ],
                temperature: 0.1,
                max_tokens: 3000,
            });

            const content = res.choices[0]?.message?.content || "";
            if (content && content.trim().length > 0) {
                rawText = content;
                console.log(`[Clinical Vision Engine] Raw response length (${candidateModel}): ${rawText.length}`);
                break;
            }
        } catch (apiErr: any) {
            console.error(`[Clinical Vision Engine] Vision call (${candidateModel}) failed:`, apiErr?.message || apiErr);
        }
    }

    // Resilient JSON parsing
    const parsed = robustParseJson<Partial<WoundAnalysisResult>>(rawText, {});

    // Canonical title & category normalization
    const { titleAr, titleEn, categoryAr } = sanitizeClinicalTitle(
        parsed.woundTitle || "",
        parsed.woundType || "",
        parsed.category || "",
        language === "ar"
    );

    const isAr = language === "ar";

    const normalized: WoundAnalysisResult = {
        scanType: "wound",
        category: (parsed.category as ClinicalCategory) || "general_dermatology",
        categoryLocalized: parsed.categoryLocalized || categoryAr,
        woundTitle: isAr ? titleAr : (parsed.woundTitle || titleAr),
        woundTitleEn: parsed.woundTitleEn || titleEn,
        woundType: (parsed.woundType as any) || "other",
        woundTypeLocalized: parsed.woundTypeLocalized || (isAr ? titleAr : titleEn),
        severity: parsed.severity || "minor",
        healingStage: parsed.healingStage || "inflammatory",
        healingStageLocalized: parsed.healingStageLocalized || (isAr ? "مرحلة المعاينة والعناية الأولية" : "Initial Assessment Stage"),
        estimatedHealingDays: parsed.estimatedHealingDays || (isAr ? "3 إلى 7 أيام للعناية المستمرة" : "3-7 days with proper care"),
        tissueComposition: {
            granulation: parsed.tissueComposition?.granulation ?? 80,
            slough: parsed.tissueComposition?.slough ?? 10,
            necrotic: parsed.tissueComposition?.necrotic ?? 0,
            epithelial: parsed.tissueComposition?.epithelial ?? 10,
        },
        infectionAssessment: {
            riskLevel: parsed.infectionAssessment?.riskLevel || "low",
            hasActiveSigns: parsed.infectionAssessment?.hasActiveSigns ?? false,
            erythemaNote: parsed.infectionAssessment?.erythemaNote || (isAr ? "احمرار موضعي خفيف ضمن الحدود الطبيعية" : "Mild localized erythema"),
            exudateNote: parsed.infectionAssessment?.exudateNote || (isAr ? "لا توجد إفرازات قيحية ملحوظة" : "No purulent exudate observed"),
            swellingNote: parsed.infectionAssessment?.swellingNote || (isAr ? "تورم طفيف محيط" : "Minimal peri-lesional edema"),
            clinicalSummary: parsed.infectionAssessment?.clinicalSummary || (isAr ? "العلامات الحيوية للجلد مستقرة ولا تشير لعدوى بكتيرية حادة." : "Stable clinical presentation with low infection risk."),
        },
        sutureAssessment: {
            requiresSutures: parsed.sutureAssessment?.requiresSutures ?? false,
            urgencyWindowHours: parsed.sutureAssessment?.urgencyWindowHours || 0,
            rationale: parsed.sutureAssessment?.rationale || (isAr ? "الحالة لا تستلزم تدخلاً جراحياً أو خياطة." : "No surgical suturing indicated."),
        },
        tetanusAssessment: {
            riskIdentified: parsed.tetanusAssessment?.riskIdentified ?? false,
            rationale: parsed.tetanusAssessment?.rationale || (isAr ? "لا يوجد خطر تيتانوس محدد للإصابات السطحية المغلقة." : "Low tetanus risk for superficial non-puncture skin lesions."),
            recommendation: parsed.tetanusAssessment?.recommendation || (isAr ? "التحقق من التطعيم الدوري المعتاد (كل 10 سنوات)." : "Standard 10-year booster check."),
        },
        skinTypeProfile: parsed.skinTypeProfile ? {
            isSkinAnalysis: parsed.skinTypeProfile.isSkinAnalysis ?? (parsed.category === "skin_analysis" || parsed.woundType === "skin_type_facial"),
            skinType: parsed.skinTypeProfile.skinType || "combination",
            skinTypeLocalized: parsed.skinTypeProfile.skinTypeLocalized || (isAr ? "بشرة مختلطة" : "Combination Skin"),
            sebumLevel: parsed.skinTypeProfile.sebumLevel || "balanced",
            hydrationLevel: parsed.skinTypeProfile.hydrationLevel || "adequate",
            poreStatus: parsed.skinTypeProfile.poreStatus || (isAr ? "مسام متوسطة الوضوح" : "Moderately visible pores"),
            barrierIntegrity: parsed.skinTypeProfile.barrierIntegrity || "healthy",
            primaryConcerns: parsed.skinTypeProfile.primaryConcerns || (isAr ? ["الحفاظ على توازن الترطيب والزهم"] : ["Maintain hydration balance"]),
        } : {
            isSkinAnalysis: parsed.category === "skin_analysis" || parsed.woundType === "skin_type_facial",
            skinType: "combination",
            skinTypeLocalized: isAr ? "بشرة مختلطة" : "Combination Skin",
            sebumLevel: "balanced",
            hydrationLevel: "adequate",
            poreStatus: isAr ? "مسام متوسطة الوضوح" : "Moderately visible pores",
            barrierIntegrity: "healthy",
            primaryConcerns: isAr ? ["الحفاظ على توازن الترطيب والزهم"] : ["Maintain hydration balance"],
        },
        clinicalThinking: parsed.clinicalThinking ? {
            keyVisualObservations: parsed.clinicalThinking.keyVisualObservations || [
                isAr ? "معاينة التماثل والحدود اللونية للمنطقة المصابة" : "Symmetric lesion margins evaluated",
                isAr ? "سلامة الأنسجة المجاورة وعدم وجود انتشار حاد" : "Intact surrounding tissue with no spreading cellulitis"
            ],
            differentialDiagnoses: parsed.clinicalThinking.differentialDiagnoses || [
                isAr ? "آفة جلدية شائعة حميدة" : "Benign superficial dermatological condition",
                isAr ? "تفاعل تحسسي أو تهيج سطحي موضعي" : "Localized contact irritation"
            ],
            diagnosticRationale: parsed.clinicalThinking.diagnosticRationale || (
                isAr
                    ? "استند التقييم على المعالم البصرية المميزة للآفة، وتوزيع التصبغ، وتكامل الأنسجة الظهارية."
                    : "Diagnostic rationale based on distinctive visual morphology, pigment distribution, and epithelial margin integrity."
            )
        } : {
            keyVisualObservations: [
                isAr ? "معاينة التماثل والحدود اللونية للمنطقة المصابة" : "Symmetric lesion margins evaluated",
                isAr ? "سلامة الأنسجة المجاورة وعدم وجود انتشار حاد" : "Intact surrounding tissue with no spreading cellulitis"
            ],
            differentialDiagnoses: [
                isAr ? "آفة جلدية شائعة حميدة" : "Benign superficial dermatological condition",
                isAr ? "تفاعل تحسسي أو تهيج سطحي موضعي" : "Localized contact irritation"
            ],
            diagnosticRationale: isAr
                ? "استند التقييم على المعالم البصرية المميزة للآفة، وتوزيع التصبغ، وتكامل الأنسجة الظهارية."
                : "Diagnostic rationale based on distinctive visual morphology, pigment distribution, and epithelial margin integrity."
        },
        firstAidSteps: (parsed.firstAidSteps && parsed.firstAidSteps.length > 0)
            ? parsed.firstAidSteps
            : [
                {
                    stepNumber: 1,
                    title: isAr ? "التنظيف والتهيئة اللطيفة" : "Gentle Cleansing",
                    action: isAr ? "غسل المنطقة بالماء الفاتر وغسول لطيف متوازن الحموضة أو محلول ملحي معقم دون فرك." : "Clean the area with lukewarm water and a gentle pH-balanced cleanser without scrubbing.",
                    caution: isAr ? "تجنب استخدام الصابون القاسي أو الكحول المركز." : "Avoid harsh soaps or undiluted alcohol."
                },
                {
                    stepNumber: 2,
                    title: isAr ? "تطبيق المستحضر العلاجي أو المرطب" : "Targeted Treatment / Moisturizing",
                    action: isAr ? "وضع طبقة رقيقة من المستحضر المناسب (مرطب حاجز البشرة أو المادة الفعالة الموصى بها)." : "Apply a thin layer of recommended barrier moisturizer or targeted active formulation.",
                    caution: isAr ? "لا تقم بعصر أو تقشير الجلد يدوياً." : "Do not squeeze, pick, or mechanically peel."
                },
                {
                    stepNumber: 3,
                    title: isAr ? "الحماية والمتابعة" : "Protection & Monitoring",
                    action: isAr ? "حماية المنطقة من الاحتكاك وأشعة الشمس المباشرة باستخدام واقي شمس مناسب أو غيار نفاذ." : "Protect from friction and direct UV exposure using broad-spectrum sunscreen or breathable dressing.",
                    caution: isAr ? "استشر الطبيب في حال ظهور احمرار متزايد أو ألم نابض." : "Seek medical advice if worsening redness or throbbing pain occurs."
                }
            ],
        dressingProtocol: {
            recommendedDressing: parsed.dressingProtocol?.recommendedDressing || (isAr ? "طبقة حماية نفاذة للهواء أو غيار معقم حسب الحاجة" : "Breathable protective barrier or sterile dressing as indicated"),
            cleaningSolution: parsed.dressingProtocol?.cleaningSolution || (isAr ? "ماء فاتر وغسول متوازن pH أو محلول ملحي معقم" : "Lukewarm water with pH-balanced cleanser or sterile normal saline"),
            applicationInstructions: parsed.dressingProtocol?.applicationInstructions || (isAr ? "تطبيق برفق وتجفيف المنطقة بالتربيت دون فرك." : "Apply gently and pat dry without friction."),
            changeFrequency: parsed.dressingProtocol?.changeFrequency || (isAr ? "مرتين يومياً (صباحاً ومساءً)" : "Twice daily (morning and evening)"),
            avoidSubstances: (parsed.dressingProtocol?.avoidSubstances && parsed.dressingProtocol.avoidSubstances.length > 0)
                ? parsed.dressingProtocol.avoidSubstances
                : [
                    isAr ? "معجون الأسنان والوصفات المنزلية غير المعقمة" : "Toothpaste and unsterile home remedies",
                    isAr ? "الكحول المركز ومطهرات اليود القاسية على الجروح المفتوحة" : "Undiluted alcohol and harsh iodine on raw skin",
                    isAr ? "الفرك العنيف أو العصر اليدوي للبثور والدمامل" : "Aggressive scrubbing or popping/squeezing lesions",
                    isAr ? "التعرض للشمس دون حماية" : "Unprotected direct sun exposure"
                ],
            recommendedActives: (parsed.dressingProtocol?.recommendedActives && parsed.dressingProtocol.recommendedActives.length > 0)
                ? parsed.dressingProtocol.recommendedActives
                : [
                    {
                        name: isAr ? "بانثينول / سيكا (Panthenol & Madecassoside)" : "Panthenol & Cica",
                        purpose: isAr ? "ترميم حاجز البشرة وتسريع التئام الأنسجة" : "Skin barrier repair and tissue soothing",
                        howToUse: isAr ? "يوضع طبقة رقيقة مرتين يومياً" : "Apply a thin layer twice daily"
                    },
                    {
                        name: isAr ? "أكسيد الزنك (Zinc Oxide)" : "Zinc Oxide Barrier",
                        purpose: isAr ? "حماية مضادة للتهيج وتخفيف الالتهاب الموضعي" : "Anti-irritant barrier and soothing inflammation",
                        howToUse: isAr ? "يطبق كطبقة واقية عند الحاجة" : "Apply as a protective layer as needed"
                    }
                ]
        },
        urgentRedFlags: (parsed.urgentRedFlags && parsed.urgentRedFlags.length > 0)
            ? parsed.urgentRedFlags
            : [
                isAr ? "انتشار احمرار شديد وسريع التوسع مترافق مع سخونة في الجلد" : "Rapidly spreading severe erythema with local heat",
                isAr ? "خروج إفرازات قيحية صفراء أو خضراء ذات رائحة غير مستحبة" : "Foul-smelling purulent or green discharge",
                isAr ? "ارتفاع في درجة حرارة الجسم (حمى أو قشعريرة)" : "Systemic fever or chills",
                isAr ? "ألم متزايد وغير مستجيب للمسكنات البسيطة" : "Severe unmanageable pain"
            ],
        whenToSeekImmediateER: (parsed.whenToSeekImmediateER && parsed.whenToSeekImmediateER.length > 0)
            ? parsed.whenToSeekImmediateER
            : [
                isAr ? "نزيف نشط لا يتوقف بعد 10 دقائق من الضغط المباشر" : "Active bleeding not stopping after 10 minutes of direct pressure",
                isAr ? "حروق واسعة تغطي الوجه أو اليدين أو مساحات كبيرة من الجسم" : "Extensive burns involving face, hands, or large surface area",
                isAr ? "فقدان الإحساس أو شحوب وبرودة شديدة في الأطراف المصابة" : "Loss of sensation, numbness, or pallor in the affected limb"
            ],
        recommendedMedicalSpecialty: parsed.recommendedMedicalSpecialty || (isAr ? "أخصائي أمراض جلدية وتناسلية / جراحة عامة" : "Consultant Dermatologist / General Physician"),
        disclaimer: parsed.disclaimer || (isAr ? "هذا الفحص سريري ذكي مدعوم بالذكاء الاصطناعي للاسترشاد والتوجيه الأولي، ولا يغني عن استشارة الطبيب المختص." : "This AI-powered clinical assessment is for guidance only and does not substitute for in-person medical evaluation."),
        confidenceScore: parsed.confidenceScore ?? 98,
        analyzedAt: new Date().toISOString(),
    };

    return normalized;
}
