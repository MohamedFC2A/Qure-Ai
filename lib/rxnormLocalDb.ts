/* ================================================================
   RxNorm Local Offline Database — Top Clinical Drug Concepts
   National Library of Medicine (NLM) Standardized Nomenclature
   ================================================================ */

export interface RxNormConcept {
    rxcui: string;
    nameEn: string;
    nameAr: string;
    synonyms: string[];
    tty: "IN" | "PIN" | "BN" | "SCD"; // Ingredient, Precise Ingredient, Brand Name, Semantic Clinical Drug
    activeIngredients: string[];
    activeIngredientsAr?: string[];
    doseForm?: string;
    atcCode?: string;
    categoryEn?: string;
    categoryAr?: string;
}

export const RXNORM_LOCAL_DATABASE: Record<string, RxNormConcept> = {
    // ── ANALGESICS & NSAIDS ─────────────────────────────────────
    "5640": {
        rxcui: "5640",
        nameEn: "Ibuprofen",
        nameAr: "إيبوبروفين",
        synonyms: ["Advil", "Motrin", "Nurofen", "Brufen", "Advil Extra Strength"],
        tty: "IN",
        activeIngredients: ["Ibuprofen"],
        activeIngredientsAr: ["إيبوبروفين"],
        doseForm: "Oral Tablet / Capsule",
        atcCode: "M01AE01",
        categoryEn: "Nonsteroidal Anti-inflammatory Drug (NSAID)",
        categoryAr: "مضاد التهاب غير ستيرويدي (مسكن ومضاد للالتهاب)",
    },
    "161": {
        rxcui: "161",
        nameEn: "Acetaminophen",
        nameAr: "باراسيتامول / أسيتامينوفين",
        synonyms: ["Paracetamol", "Tylenol", "Panadol", "Cetamol", "Abimol", "Adol"],
        tty: "IN",
        activeIngredients: ["Acetaminophen"],
        activeIngredientsAr: ["باراسيتامول"],
        doseForm: "Oral Tablet / Solution",
        atcCode: "N02BE01",
        categoryEn: "Analgesic & Antipyretic",
        categoryAr: "مسكن للآلام وخافض للحرارة",
    },
    "1191": {
        rxcui: "1191",
        nameEn: "Aspirin",
        nameAr: "أسبرين",
        synonyms: ["Acetylsalicylic Acid", "Bayer Aspirin", "Ecotrin", "Jusprin", "Aspocid"],
        tty: "IN",
        activeIngredients: ["Aspirin"],
        activeIngredientsAr: ["حمض أستيل ساليسليك"],
        doseForm: "Oral Tablet",
        atcCode: "N02BA01",
        categoryEn: "Antiplatelet / NSAID",
        categoryAr: "مضاد لتخثر الصفائح ومسكن آلام",
    },
    "7258": {
        rxcui: "7258",
        nameEn: "Naproxen",
        nameAr: "نابروكسين",
        synonyms: ["Aleve", "Naprosyn", "Anaprox"],
        tty: "IN",
        activeIngredients: ["Naproxen"],
        activeIngredientsAr: ["نابروكسين"],
        doseForm: "Oral Tablet",
        atcCode: "M01AE02",
        categoryEn: "NSAID Analgesic",
        categoryAr: "مسكن ومضاد التهاب غير ستيرويدي",
    },
    "32120": {
        rxcui: "32120",
        nameEn: "Diclofenac",
        nameAr: "ديكلوفيناك",
        synonyms: ["Voltaren", "Cataflam", "Zipsor", "Voltfast"],
        tty: "IN",
        activeIngredients: ["Diclofenac"],
        activeIngredientsAr: ["ديكلوفيناك"],
        doseForm: "Oral Tablet / Gel / Injection",
        atcCode: "M01AB05",
        categoryEn: "NSAID Analgesic",
        categoryAr: "مضاد التهاب ومسكن آلام مفصلي وعضلي",
    },

    // ── DIABETES & METABOLIC ────────────────────────────────────
    "6809": {
        rxcui: "6809",
        nameEn: "Metformin",
        nameAr: "سيدوفاج / ميتفورمين",
        synonyms: ["Glucophage", "Cidophage", "Glumetza", "Riomet", "Fortamet"],
        tty: "IN",
        activeIngredients: ["Metformin"],
        activeIngredientsAr: ["ميتفورمين هيدروكلوريد"],
        doseForm: "Oral Tablet / Extended Release",
        atcCode: "A10BA02",
        categoryEn: "Biguanide Antidiabetic Agent",
        categoryAr: "خافض لمركز السكر بالدم (بيجوانيد)",
    },
    "4815": {
        rxcui: "4815",
        nameEn: "Glibenclamide",
        nameAr: "جليبنكلاميد / الجليبينكلاميد",
        synonyms: ["Glyburide", "Micronase", "Diabeta", "Daonil"],
        tty: "IN",
        activeIngredients: ["Glibenclamide"],
        activeIngredientsAr: ["جليبنكلاميد"],
        doseForm: "Oral Tablet",
        atcCode: "A10BB01",
        categoryEn: "Sulfonylurea Antidiabetic",
        categoryAr: "مُحفز لإفراز الأنسولين (سلفونيل يوريا)",
    },

    // ── CARDIOVASCULAR & HYPERTENSION ───────────────────────────
    "3827": {
        rxcui: "3827",
        nameEn: "Amlodipine",
        nameAr: "أملوديبين",
        synonyms: ["Norvasc", "Amlofar", "Amloal"],
        tty: "IN",
        activeIngredients: ["Amlodipine"],
        activeIngredientsAr: ["أملوديبين"],
        doseForm: "Oral Tablet",
        atcCode: "C08CA01",
        categoryEn: "Calcium Channel Blocker (Antihypertensive)",
        categoryAr: "مُغلق قنوات الكالسيوم (لعلاج ضغط الدم السامي)",
    },
    "29046": {
        rxcui: "29046",
        nameEn: "Lisinopril",
        nameAr: "ليسينوبريل",
        synonyms: ["Zestril", "Prinivil", "Sinopryl"],
        tty: "IN",
        activeIngredients: ["Lisinopril"],
        activeIngredientsAr: ["ليسينوبريل"],
        doseForm: "Oral Tablet",
        atcCode: "C09AA03",
        categoryEn: "ACE Inhibitor Antihypertensive",
        categoryAr: "مثبط إنزيم تحويل الأنجيوتنسين (لعلاج الضغط)",
    },
    "5224": {
        rxcui: "5224",
        nameEn: "Losartan",
        nameAr: "لوسارتان",
        synonyms: ["Cozaar", "Amzaar", "Losar"],
        tty: "IN",
        activeIngredients: ["Losartan"],
        activeIngredientsAr: ["لوسارتان"],
        doseForm: "Oral Tablet",
        atcCode: "C09CA01",
        categoryEn: "Angiotensin II Receptor Blocker (ARB)",
        categoryAr: "مُغلق مستقبلات الأنجيوتنسين 2",
    },
    "83367": {
        rxcui: "83367",
        nameEn: "Atorvastatin",
        nameAr: "أتورفاستاتين",
        synonyms: ["Lipitor", "Ator", "Lipimax", "Torvast"],
        tty: "IN",
        activeIngredients: ["Atorvastatin"],
        activeIngredientsAr: ["أتورفاستاتين"],
        doseForm: "Oral Tablet",
        atcCode: "C10AA05",
        categoryEn: "HMG-CoA Reductase Inhibitor (Statin)",
        categoryAr: "خافض للكوليسترول والدهون الثلاثية (ستاتين)",
    },

    // ── GASTROINTESTINAL & PPIs ────────────────────────────────
    "7646": {
        rxcui: "7646",
        nameEn: "Omeprazole",
        nameAr: "أوميبرازول",
        synonyms: ["Prilosec", "Losec", "Gastrazole", "Omez"],
        tty: "IN",
        activeIngredients: ["Omeprazole"],
        activeIngredientsAr: ["أوميبرازول"],
        doseForm: "Oral Capsule",
        atcCode: "A02BC01",
        categoryEn: "Proton Pump Inhibitor (PPI)",
        categoryAr: "مثبط مضخة البروتون (لعلاج حموضة وقرحة المعدة)",
    },
    "40790": {
        rxcui: "40790",
        nameEn: "Pantoprazole",
        nameAr: "بانتوبرازول",
        synonyms: ["Protonix", "Controloc", "Zurcal"],
        tty: "IN",
        activeIngredients: ["Pantoprazole"],
        activeIngredientsAr: ["بانتوبرازول"],
        doseForm: "Oral Tablet / IV Injection",
        atcCode: "A02BC02",
        categoryEn: "Proton Pump Inhibitor (PPI)",
        categoryAr: "مثبط حموضة وعلاج ارتجاع المريء والقرحة",
    },

    // ── ANTIBIOTICS & ANTIMICROBIALS ────────────────────────────
    "723": {
        rxcui: "723",
        nameEn: "Amoxicillin",
        nameAr: "أموكسيسيلين",
        synonyms: ["Amoxil", "Augmentin", "Curam", "Hibiotic", "E-Mox"],
        tty: "IN",
        activeIngredients: ["Amoxicillin"],
        activeIngredientsAr: ["أموكسيسيلين"],
        doseForm: "Oral Suspension / Capsule",
        atcCode: "J01CA04",
        categoryEn: "Penicillin Antibiotic",
        categoryAr: "مضاد حيوي واسع المجال (بنسيلين)",
    },
    "18631": {
        rxcui: "18631",
        nameEn: "Azithromycin",
        nameAr: "أزيثروميسين",
        synonyms: ["Zithromax", "Z-Pak", "Zithron", "Azitro"],
        tty: "IN",
        activeIngredients: ["Azithromycin"],
        activeIngredientsAr: ["أزيثروميسين"],
        doseForm: "Oral Tablet / Suspension",
        atcCode: "J01FA10",
        categoryEn: "Macrolide Antibiotic",
        categoryAr: "مضاد حيوي ماكرولايد لعلاج التهابات الجهاز التنفسي",
    },
    "2551": {
        rxcui: "2551",
        nameEn: "Ciprofloxacin",
        nameAr: "سيبروفلوكساسين",
        synonyms: ["Cipro", "Ciprobay", "Cipronat"],
        tty: "IN",
        activeIngredients: ["Ciprofloxacin"],
        activeIngredientsAr: ["سيبروفلوكساسين"],
        doseForm: "Oral Tablet / Eye Drops",
        atcCode: "J01MA02",
        categoryEn: "Fluoroquinolone Antibiotic",
        categoryAr: "مضاد حيوي فلوروكينولون لعلاج المسالك والتنفس",
    },
    "6922": {
        rxcui: "6922",
        nameEn: "Metronidazole",
        nameAr: "ميترونيدازول",
        synonyms: ["Flagyl", "Metron", "Dumozol"],
        tty: "IN",
        activeIngredients: ["Metronidazole"],
        activeIngredientsAr: ["ميترونيدازول"],
        doseForm: "Oral Tablet / Infusion",
        atcCode: "P01AB01",
        categoryEn: "Nitroimidazole Antiprotozoal & Antibacterial",
        categoryAr: "مضاد للمطثيات والبكتيريا اللاهوائية والطفيليات",
    },

    // ── CNS & NEUROLOGIC ────────────────────────────────────────
    "25480": {
        rxcui: "25480",
        nameEn: "Gabapentin",
        nameAr: "جابابنتين",
        synonyms: ["Neurontin", "Gabatrend", "Conventin"],
        tty: "IN",
        activeIngredients: ["Gabapentin"],
        activeIngredientsAr: ["جابابنتين"],
        doseForm: "Oral Capsule / Tablet",
        atcCode: "N02BF01",
        categoryEn: "Anticonvulsant / Neuropathic Analgesic",
        categoryAr: "مسكن لآلام الأعصاب ومضاد لنوبات الصرع",
    },
    "36437": {
        rxcui: "36437",
        nameEn: "Sertraline",
        nameAr: "سيرترالين",
        synonyms: ["Zoloft", "Lustral", "Moodsert"],
        tty: "IN",
        activeIngredients: ["Sertraline"],
        activeIngredientsAr: ["سيرترالين"],
        doseForm: "Oral Tablet",
        atcCode: "N06AB06",
        categoryEn: "SSRI Antidepressant",
        categoryAr: "مثبط استرداد السيروتونين الانتقائي (مضاد اكتئاب والقلق)",
    },
};

/**
 * Normalizes text for matching RxNorm concepts.
 */
export function normalizeRxNormTerm(term: string): string {
    return term.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Searches the pre-bundled local RxNorm concept database.
 */
export function searchLocalRxNormDb(query: string): RxNormConcept | null {
    if (!query || query.trim().length < 2) return null;
    const qNorm = normalizeRxNormTerm(query);

    for (const concept of Object.values(RXNORM_LOCAL_DATABASE)) {
        if (normalizeRxNormTerm(concept.nameEn) === qNorm || normalizeRxNormTerm(concept.nameAr) === qNorm) {
            return concept;
        }
        for (const syn of concept.synonyms) {
            if (normalizeRxNormTerm(syn) === qNorm) {
                return concept;
            }
        }
        for (const ing of concept.activeIngredients) {
            if (normalizeRxNormTerm(ing) === qNorm) {
                return concept;
            }
        }
    }

    // Partial substring match fallback
    for (const concept of Object.values(RXNORM_LOCAL_DATABASE)) {
        const nameNorm = normalizeRxNormTerm(concept.nameEn);
        if (nameNorm.includes(qNorm) || qNorm.includes(nameNorm)) {
            return concept;
        }
    }

    return null;
}
