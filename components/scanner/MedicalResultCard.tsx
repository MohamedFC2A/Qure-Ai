import { GlassCard } from "@/components/ui/GlassCard";
import { Activity, AlertTriangle, Info, Pill, ShieldAlert, Thermometer, Box, FileText, CheckCircle2, AlertOctagon, Clock, Sparkles, GitBranch, ChevronRight, Lock, Database, ExternalLink, ListTodo, Download, FileDown, Copy, Mic, MicOff, Send, MessageSquare, Bookmark, RotateCcw, Languages, Check, Lightbulb, Zap, Brain, Stethoscope, Building2, Wind, Droplets, Hand, Users, Baby, Syringe, Leaf, Eye, Ear, Utensils, UserCheck, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/Button";
import type { OpenFdaLabelSnapshot } from "@/lib/openfda";
import { AI_DISPLAY_NAME } from "@/lib/ai/branding";
import { AdUnit } from "@/components/AdUnit";
import { useOptionalScan } from "@/context/ScanContext";
import { VoiceReaderButton } from "@/components/ui/VoiceReaderButton";
import { getLocalScans } from "@/lib/localHistory";

export const translateMedicalTerm = (str: string | undefined | null, isArabic: boolean): string => {
    if (!str) return "";
    const trimmed = String(str).trim();
    if (!trimmed || !isArabic) return trimmed;

    const lower = trimmed.toLowerCase();

    // Specific Manufacturers
    if (lower.includes("hikma") || lower.includes("حكمة")) return "شركة الحكمة للأدوية";
    if (lower.includes("sanofi")) return "سانوفي";
    if (lower.includes("gsk") || lower.includes("glaxo")) return "جلاكسو سميث كلاين (GSK)";
    if (lower.includes("novartis")) return "نوفارتس";
    if (lower.includes("pfizer")) return "فايزر";
    if (lower.includes("bayer")) return "باير";
    if (lower.includes("astrazeneca")) return "أسترازينيكا";
    if (lower.includes("eva pharma") || lower === "eva") return "إيفا فارما";
    if (lower.includes("amoun")) return "أمون للأدوية";
    if (lower.includes("sedico")) return "سيديكو للأدوية";
    if (lower.includes("epico") || lower.includes("eupc")) return "إيبيكو للأدوية";
    if (lower.includes("pharco")) return "فاركو للأدوية";
    if (lower.includes("sigma")) return "سيجما للصناعات الدوائية";
    if (lower.includes("marcyrl")) return "ماركيرل للأدوية";
    if (lower.includes("abbott")) return "أبوت";
    if (lower.includes("merck")) return "ميرك";
    if (lower.includes("roche")) return "روش";
    if (lower.includes("johnson")) return "جونسون آند جونسون";

    // Cold & Flu & Respiratory Categories (Handle combinations e.g. "Pharmaceutical cold/flu combination")
    if (lower.includes("cold") || lower.includes("flu") || lower.includes("influenza") || lower.includes("برد") || lower.includes("إنفلونزا") || lower.includes("زكام")) {
        return "علاج نزلات البرد والإنفلونزا";
    }
    if (lower.includes("combination") || lower.includes("multi-symptom") || lower.includes("multi symptom")) {
        return "مركب دوائي متعدد الفعالية";
    }
    if (lower.includes("nasal decongestant") || lower.includes("decongestant") || lower.includes("احتقان")) return "مضاد لاحتقان الأنف والجيوب";
    if (lower.includes("antihistamine") || lower.includes("antihistaminic") || lower.includes("حساسية")) return "مضاد للحساسية والرشح";
    if (lower.includes("analgesic") || lower.includes("antipyretic") || lower.includes("pain reliever") || lower.includes("مسكن")) return "مسكن وخافض للحرارة";
    if (lower.includes("anti-inflammatory") || lower.includes("antiinflammatory") || lower.includes("nsaid")) return "مضاد للالتهاب ومسكن";
    if (lower.includes("antibiotic") || lower.includes("antibacterial") || lower.includes("مضاد حيوي")) return "مضاد حيوي";
    if (lower.includes("antifungal") || lower.includes("فطريات")) return "مضاد للفطريات";
    if (lower.includes("antiviral") || lower.includes("فيروسات")) return "مضاد للفيروسات";
    if (lower.includes("cough suppressant") || lower.includes("antitussive") || lower.includes("سعال")) return "مهدئ للسعال";
    if (lower.includes("expectorant") || lower.includes("mucolytic") || lower.includes("بلغم")) return "مذيب وطارد للبلغم";
    if (lower.includes("bronchodilator") || lower.includes("asthma") || lower.includes("ربو")) return "موسع للشعب الهوائية";
    if (lower.includes("gastrointestinal") || lower.includes("antacid") || lower.includes("proton pump") || lower.includes("معدة")) return "علاج الجهاز الهضمي والمعدة";
    if (lower.includes("antihypertensive") || lower.includes("blood pressure") || lower.includes("cardiovascular")) return "علاج ضغط الدم والقلب";
    if (lower.includes("antidiabetic") || lower.includes("diabetes") || lower.includes("سكر")) return "علاج داء السكري";
    if (lower.includes("dietary supplement") || lower.includes("multivitamin") || lower.includes("vitamin") || lower.includes("مكمل")) return "مكمل غذائي وفيتامينات";

    // Target Audience
    if (lower.includes("adult") && lower.includes("adolescent")) return "البالغون والمراهقون";
    if (lower === "adults & adolescents" || lower === "adults and adolescents") return "البالغون والمراهقون";
    if (lower === "adults" || lower === "adult") return "البالغون";
    if (lower === "adolescents" || lower === "adolescent") return "المراهقون";
    if (lower.includes("children") || lower.includes("pediatric") || lower.includes("pediatrics")) return "الأطفال";
    if (lower.includes("infant") || lower.includes("infants")) return "الرضّع";
    if (lower.includes("elderly") || lower.includes("senior")) return "كبار السن";
    if (lower.includes("all ages")) return "كافة الأعمار";

    // Dosage Forms & Physical Formulations
    if (lower.includes("film coated tablet") || lower.includes("film-coated tablet") || lower.includes("film coated tablets") || lower.includes("film-coated tablets")) return "أقراص مغلفة";
    if (lower.includes("effervescent tablet") || lower.includes("effervescent tablets")) return "أقراص فوارة";
    if (lower.includes("chewable tablet") || lower.includes("chewable tablets")) return "أقراص مضغ";
    if (lower.includes("extended release") || lower.includes("sustained release")) return "أقراص ممتدة المفعول";
    if (lower.includes("lozenge") || lower.includes("lozenges")) return "أقراص استحلاب";
    if (lower.includes("tablet") || lower.includes("tabs") || lower === "tab" || lower.includes("قرص") || lower.includes("أقراص")) return "أقراص";
    if (lower.includes("capsule") || lower.includes("caps") || lower === "cap" || lower.includes("كبسول")) return "كبسولات";
    if (lower.includes("syrup") || lower.includes("شراب")) return "شراب";
    if (lower.includes("suspension") || lower.includes("معلق")) return "معلّق";
    if (lower.includes("solution") || lower.includes("محلول")) return "محلول";
    if (lower.includes("injection") || lower.includes("ampoule") || lower.includes("vial") || lower.includes("حقن")) return "حقن / أمبولات";
    if (lower.includes("cream") || lower.includes("كريم")) return "كريم";
    if (lower.includes("ointment") || lower.includes("مرهم")) return "مرهم";
    if (lower.includes("gel") || lower.includes("جل")) return "جل موضعي";
    if (lower.includes("nasal spray") || lower.includes("بخاخ أنف")) return "بخاخ أنف";
    if (lower.includes("nasal drop") || lower.includes("nasal drops") || lower.includes("قطرة أنف")) return "قطرة أنف";
    if (lower.includes("spray") || lower.includes("بخاخ")) return "بخاخ";
    if (lower.includes("drop") || lower.includes("قطر")) return "قطرات";
    if (lower.includes("suppository") || lower.includes("suppositories") || lower.includes("لبوس")) return "تحاميل (لبوس)";
    if (lower.includes("deodorant")) return "مزيل عرق طبي";

    // Routes of Administration
    if (lower === "oral" || lower === "oral use" || lower.includes("oral")) return "عن طريق الفم";
    if (lower.includes("topical external") || lower.includes("external use only")) return "استعمال خارجي فقط";
    if (lower === "topical" || lower.includes("topical use") || lower.includes("topical")) return "موضعي (سطحي)";
    if (lower === "inhalation" || lower.includes("inhalat")) return "عن طريق الاستنشاق";
    if (lower.includes("ophthalmic") || lower.includes("eye drops")) return "قطرة / مرهم عين";
    if (lower.includes("otic") || lower.includes("ear drops")) return "قطرة أذن";
    if (lower === "nasal" || lower === "nasal use") return "عن طريق الأنف";
    if (lower.includes("sublingual")) return "تحت اللسان";
    if (lower.includes("intravenous") || lower === "iv") return "حقن وريدي";
    if (lower.includes("intramuscular") || lower === "im") return "حقن عضل";
    if (lower.includes("rectal")) return "عن طريق الشرج";

    // High-level categories
    if (lower === "dawa" || lower === "medication" || lower === "drug" || lower === "human_drug" || lower.includes("pharmaceutical")) return "علاج دوائي معتمد";
    if (lower === "human_supplement" || lower.includes("supplement")) return "مكمل غذائي";
    if (lower.includes("cosmetic") || lower.includes("topical_cosmetic")) return "مستحضر تجميل";
    if (lower === "veterinary_drug" || lower === "veterinary_supplement" || lower.includes("veterinary")) return "مستحضر بيطري";
    if (lower.includes("otc") || lower.includes("over-the-counter")) return "دواء OTC";
    if (lower.includes("prescription")) return "دواء بوصفة";
    if (lower === "unknown" || lower === "generic") return "دواء علاجي";

    return trimmed;
};

export const formatCleanStrength = (str?: string): string => {
    if (!str) return "";
    let s = String(str).trim();
    const lower = s.toLowerCase();
    if (
        lower.includes("غير محدد") ||
        lower.includes("لا توجد") ||
        lower.includes("not specified") ||
        lower.includes("unknown") ||
        lower.includes("n/a") ||
        lower.includes("none") ||
        lower.includes("دوسير") ||
        lower.includes("dossier") ||
        lower.includes("مواصفات")
    ) {
        return "";
    }
    // If it contains active ingredient names followed by numbers e.g. "Paracetamol 500 mg + Chlorpheniramine 2 mg..."
    // extract just the dosage numbers: "500 mg + 2 mg + 30 mg"
    const matches = s.match(/\b\d+(\.\d+)?\s*(mg|mcg|g|ml|iu|%|مجم|ملغم|ملج|جرام|مل)\b/gi);
    if (matches && matches.length > 0 && s.length > 25) {
        return matches.join(" + ");
    }
    return s.replace(/\/1\b/g, "").replace(/\s+/g, " ").trim();
};

export const formatShortMedName = (rawName: string): string => {
    if (!rawName) return "Medication";
    let cleaned = String(rawName).trim();
    // Remove leading non-alphanumeric/non-Arabic characters
    cleaned = cleaned.replace(/^[^\w\u0600-\u06FF]+/, "");
    // Remove parenthetical details e.g. "(Antihistamine for Children)"
    cleaned = cleaned.replace(/\s*\([^)]*\)/g, "");
    // Shorten to max 4 words for clean badge titles
    const parts = cleaned.split(/\s+/);
    if (parts.length > 4) {
        cleaned = parts.slice(0, 4).join(" ");
    }
    return cleaned || rawName;
};

export const getMedicalFormIcon = (formStr?: string) => {
    const f = String(formStr || "").toLowerCase();
    if (f.includes("spray") || f.includes("بخاخ") || f.includes("رذاذ") || f.includes("inhaler") || f.includes("aerosol")) {
        return <Wind className="w-3.5 h-3.5 text-cyan-300" />;
    }
    if (f.includes("syrup") || f.includes("شراب") || f.includes("liquid") || f.includes("سائل") || f.includes("drop") || f.includes("قطرة") || f.includes("solution") || f.includes("محلول") || f.includes("elixir")) {
        return <Droplets className="w-3.5 h-3.5 text-cyan-300" />;
    }
    if (f.includes("cream") || f.includes("كريم") || f.includes("ointment") || f.includes("مرهم") || f.includes("gel") || f.includes("جل") || f.includes("lotion") || f.includes("لوشن") || f.includes("paste")) {
        return <Hand className="w-3.5 h-3.5 text-cyan-300" />;
    }
    if (f.includes("inject") || f.includes("حقن") || f.includes("vial") || f.includes("ampoule") || f.includes("syringe")) {
        return <Syringe className="w-3.5 h-3.5 text-cyan-300" />;
    }
    return <Pill className="w-3.5 h-3.5 text-cyan-300" />;
};

export const getMedicalCategoryIcon = (catStr?: string) => {
    const c = String(catStr || "").toLowerCase();
    if (c.includes("cosmetic") || c.includes("تجميل") || c.includes("بشرة") || c.includes("عناية") || c.includes("skincare") || c.includes("beauty")) {
        return <Sparkles className="w-3.5 h-3.5 text-pink-300" />;
    }
    if (c.includes("supplement") || c.includes("مكمل") || c.includes("فيتامين") || c.includes("vitamin") || c.includes("herbal") || c.includes("عشبي")) {
        return <Leaf className="w-3.5 h-3.5 text-emerald-300" />;
    }
    return <Stethoscope className="w-3.5 h-3.5 text-purple-300" />;
};

export const getMedicalRouteIcon = (routeStr?: string) => {
    const r = String(routeStr || "").toLowerCase();
    if (r.includes("topical") || r.includes("موضعي") || r.includes("سطحي") || r.includes("skin") || r.includes("جلد") || r.includes("external")) {
        return <Hand className="w-3.5 h-3.5 text-emerald-300 shrink-0" />;
    }
    if (r.includes("oral") || r.includes("فم") || r.includes("بلع")) {
        return <Activity className="w-3.5 h-3.5 text-emerald-300 shrink-0" />;
    }
    if (r.includes("inject") || r.includes("وريد") || r.includes("عضل") || r.includes("iv") || r.includes("im")) {
        return <Syringe className="w-3.5 h-3.5 text-emerald-300 shrink-0" />;
    }
    if (r.includes("inhal") || r.includes("استنشاق") || r.includes("تنفس")) {
        return <Wind className="w-3.5 h-3.5 text-emerald-300 shrink-0" />;
    }
    if (r.includes("eye") || r.includes("عين") || r.includes("ophthalmic")) {
        return <Eye className="w-3.5 h-3.5 text-emerald-300 shrink-0" />;
    }
    if (r.includes("ear") || r.includes("أذن") || r.includes("otic")) {
        return <Ear className="w-3.5 h-3.5 text-emerald-300 shrink-0" />;
    }
    return <Activity className="w-3.5 h-3.5 text-emerald-300 shrink-0" />;
};

export interface AgeRatingInfo {
    badgeText: string;
    fullLabel: string;
    tier: "adult18" | "teen16" | "adolescent12" | "child6" | "toddler2" | "infant" | "all";
    colorClass: string;
    pillBgClass: string;
    icon: React.ReactNode;
}

export const getAgeSuitability = (data: any, isArabic: boolean): AgeRatingInfo => {
    const raw = `${data?.targetAudience || ""} ${data?.dosage || ""} ${data?.warnings || ""} ${data?.contraindications || ""} ${data?.drugName || ""} ${data?.genericName || ""} ${data?.form || ""}`.toLowerCase();
    const target = String(data?.targetAudience || "").toLowerCase();
    
    // 1. Check +18 / Adults Only (Aspirin, high-strength NSAIDs, fluoroquinolones, adult sedatives)
    const isAspirin = raw.includes("aspirin") || raw.includes("acetylsalicylic") || raw.includes("أسبرين");
    const isAdultNSAID = raw.includes("cataflam 50") || raw.includes("voltaren 100") || raw.includes("celebrex") || raw.includes("ketorolac") || raw.includes("feldene");
    const isAdultOnly = target.includes("18") || target.includes("adults only") || isAspirin || isAdultNSAID;
    
    if (isAdultOnly) {
        return {
            badgeText: "+18",
            fullLabel: isArabic ? "للبالغين فقط" : "Adults Only",
            tier: "adult18",
            colorClass: "bg-rose-500/15 border-rose-500/35 text-rose-200",
            pillBgClass: "bg-rose-500/30 text-rose-100 border-rose-400/40",
            icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        };
    }

    // 2. Check +16 / 16 years
    if (target.includes("16") || raw.includes("16 سنة") || raw.includes("16 years") || raw.includes("سن 16")) {
        return {
            badgeText: "+16",
            fullLabel: isArabic ? "سنة فما فوق" : "Years & older",
            tier: "teen16",
            colorClass: "bg-amber-500/15 border-amber-500/35 text-amber-200",
            pillBgClass: "bg-amber-500/30 text-amber-100 border-amber-400/40",
            icon: <UserCheck className="w-3.5 h-3.5 text-amber-300 shrink-0" />
        };
    }

    // 3. Check +12 / 12 years / Cold & Flu combinations (1,2,3 / Congestal / Pseudoephedrine)
    const isColdDecongestant = raw.includes("pseudoephedrine") || raw.includes("chlorpheniramine") || raw.includes("congestal") || raw.includes("123") || raw.includes("1,2,3") || raw.includes("1 2 3") || raw.includes("one two three") || raw.includes("وان تو ثري");
    if (target.includes("12") || target.includes("adolescent") || isColdDecongestant || raw.includes("12 سنة") || raw.includes("12 years") || raw.includes("سن 12") || target.includes("adult")) {
        return {
            badgeText: "+12",
            fullLabel: isArabic ? "سنة فما فوق" : "Years & older",
            tier: "adolescent12",
            colorClass: "bg-amber-500/15 border-amber-500/35 text-amber-200",
            pillBgClass: "bg-amber-500/30 text-amber-100 border-amber-400/40",
            icon: <Users className="w-3.5 h-3.5 text-amber-300 shrink-0" />
        };
    }

    // 4. Check +6 / 6 years / Children chewables & syrups
    if (target.includes("6") || raw.includes("6 سنوات") || raw.includes("6 years") || raw.includes("سن 6")) {
        return {
            badgeText: "+6",
            fullLabel: isArabic ? "سنوات فما فوق" : "Years & older",
            tier: "child6",
            colorClass: "bg-teal-500/15 border-teal-500/35 text-teal-200",
            pillBgClass: "bg-teal-500/30 text-teal-100 border-teal-400/40",
            icon: <Baby className="w-3.5 h-3.5 text-teal-300 shrink-0" />
        };
    }

    // 5. Check +2 / Toddlers
    if (target.includes("2") || raw.includes("سنتين") || raw.includes("2 years") || raw.includes("toddler") || target.includes("child") || target.includes("أطفال")) {
        return {
            badgeText: "+2",
            fullLabel: isArabic ? "سنتين فما فوق" : "Years & older",
            tier: "toddler2",
            colorClass: "bg-cyan-500/15 border-cyan-500/35 text-cyan-200",
            pillBgClass: "bg-cyan-500/30 text-cyan-100 border-cyan-400/40",
            icon: <Baby className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
        };
    }

    // 6. Check Infant / Drops
    if (target.includes("infant") || target.includes("baby") || target.includes("رضيع") || target.includes("رضع") || raw.includes("قطرات للرضع")) {
        return {
            badgeText: "+0",
            fullLabel: isArabic ? "للرضّع والأطفال" : "Infants & Toddlers",
            tier: "infant",
            colorClass: "bg-indigo-500/15 border-indigo-500/35 text-indigo-200",
            pillBgClass: "bg-indigo-500/30 text-indigo-100 border-indigo-400/40",
            icon: <Baby className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
        };
    }

    // All ages fallback
    return {
        badgeText: isArabic ? "الجميع" : "All",
        fullLabel: isArabic ? "كافة الأعمار" : "All Ages",
        tier: "all",
        colorClass: "bg-emerald-500/15 border-emerald-500/35 text-emerald-200",
        pillBgClass: "bg-emerald-500/30 text-emerald-100 border-emerald-400/40",
        icon: <Users className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
    };
};

export const getMedicalTargetAudienceIcon = (targetStr?: string) => {
    const t = String(targetStr || "").toLowerCase();
    if (t.includes("child") || t.includes("pediatric") || t.includes("أطفال") || t.includes("رضيع") || t.includes("baby") || t.includes("infant")) {
        return <Baby className="w-3.5 h-3.5 text-amber-300" />;
    }
    return <Users className="w-3.5 h-3.5 text-amber-300" />;
};

export interface CareDomainConfig {
    domain: "hair" | "beard" | "face" | "body" | "eyes_lips" | "intimate" | "general";
    badgeLabel: string;
    tabTitle: string;
    guideTitle: string;
    guideSubtitle: string;
    categoryTitle: string;
    icon: React.ReactNode;
    suitabilityList: { label: string; color: string; hint: string }[];
    purityItems: string[];
}

export const getCosmeticCareDomain = (data: any, isArabic: boolean): CareDomainConfig => {
    const raw = `${data?.drugName || ""} ${data?.drugNameEn || ""} ${data?.genericName || ""} ${data?.genericNameEn || ""} ${data?.category || ""} ${data?.form || ""} ${data?.routeOfAdministration || ""} ${data?.description || ""} ${JSON.stringify(data?.uses || [])} ${JSON.stringify(data?.activeIngredients || [])} ${data?.dosage || ""}`.toLowerCase();

    // 1. Beard & Facial Hair (الدقن واللحية والشارب)
    if (raw.includes("beard") || raw.includes("moustache") || raw.includes("mustache") || raw.includes("لحية") || raw.includes("دقن") || raw.includes("شارب") || raw.includes("شعر الوجه")) {
        return {
            domain: "beard",
            badgeLabel: isArabic ? "اللحية والشارب" : "Beard & Moustache",
            tabTitle: isArabic ? "دليل العناية باللحية" : "Beard Care Guide",
            guideTitle: isArabic ? "دليل العناية باللحية وشعر الوجه" : "Beard & Facial Hair Care Guide",
            guideSubtitle: isArabic ? "المكونات • روتين التكثيف والترطيب • ملاءمة نوع شعر اللحية" : "Ingredients · Density Routine · Beard Hair Compatibility",
            categoryTitle: isArabic ? "ملاءمة أنواع شعر اللحية وفروة الوجه" : "Beard & Facial Skin Compatibility",
            icon: <Sparkles className="w-4 h-4 text-amber-400" />,
            suitabilityList: [
                { label: isArabic ? "لحية خفيفة / فراغات" : "Patchy Beard", color: "emerald", hint: isArabic ? "تحفيز نمو البصيلات" : "Stimulates follicles" },
                { label: isArabic ? "شعر لحية خشن ومجعد" : "Coarse Beard", color: "cyan", hint: isArabic ? "تنعيم وترطيب عميق" : "Deep softening" },
                { label: isArabic ? "بشرة تحت اللحية جافة" : "Dry Skin Under Beard", color: "violet", hint: isArabic ? "تهدئة ومنع الحكة" : "Relieves itch" },
                { label: isArabic ? "بشرة حساسة بعد الحلاقة" : "Post-Shave Sensitive", color: "amber", hint: isArabic ? "حماية من الالتهاب" : "Anti-irritation" },
                { label: isArabic ? "كافة أنواع اللحية" : "All Beard Types", color: "pink", hint: isArabic ? "لمعان وصحة يومية" : "Daily conditioning" },
            ],
            purityItems: [
                isArabic ? "خالٍ من الزيوت المعدنية الضارة" : "Mineral Oil Free",
                isArabic ? "لا يسد مسام البشرة" : "Non-Comedogenic",
                isArabic ? "مغذي للبصيلات والجذور" : "Follicle Nourishing",
                isArabic ? "خالٍ من السيليكون القاسي" : "Silicone Free",
                isArabic ? "رائحة رجالية طبيعية هادئة" : "Subtle Natural Scent",
                isArabic ? "سريع الامتصاص غير دهني" : "Non-Greasy Fast Absorbing",
            ]
        };
    }

    // 2. Hair & Scalp (الشعر وفروة الرأس)
    const isHair = raw.includes("hair") || raw.includes("scalp") || raw.includes("شعر") || raw.includes("فروة") || raw.includes("capixyl") || raw.includes("rcp-1") || raw.includes("minoxidil") || raw.includes("shampoo") || raw.includes("conditioner") || raw.includes("follicle") || raw.includes("تساقط") || raw.includes("كثافة الشعر") || raw.includes("قشرة") || raw.includes("dandruff") || raw.includes("alopecia") || raw.includes("صلع");
    if (isHair) {
        return {
            domain: "hair",
            badgeLabel: isArabic ? "الشعر وفروة الرأس" : "Hair & Scalp",
            tabTitle: isArabic ? "دليل العناية بالشعر" : "Hair Care Guide",
            guideTitle: isArabic ? "دليل العناية بالشعر وفروة الرأس" : "Hair & Scalp Advanced Care Guide",
            guideSubtitle: isArabic ? "المكونات النشطة • روتين التقوية والكثافة • ملاءمة نوع الشعر وفروة الرأس" : "Active Complexes · Density Routine · Hair & Scalp Compatibility",
            categoryTitle: isArabic ? "ملاءمة أنواع الشعر وفروة الرأس" : "Hair & Scalp Compatibility",
            icon: <Wind className="w-4 h-4 text-pink-400" />,
            suitabilityList: [
                { label: isArabic ? "شعر خفيف ومتساقط" : "Thinning / Hair Fall", color: "emerald", hint: isArabic ? "يقوي الجذور ويحفز الكثافة" : "Boosts density & roots" },
                { label: isArabic ? "فروة دهنية / قشرة" : "Oily Scalp / Dandruff", color: "cyan", hint: isArabic ? "ينظم الإفرازات وينقي" : "Clarifying & balancing" },
                { label: isArabic ? "شعر جاف وتالف" : "Dry & Damaged", color: "violet", hint: isArabic ? "ترميم عميق للألياف" : "Fiber restoration" },
                { label: isArabic ? "فروة رأس حساسة" : "Sensitive Scalp", color: "amber", hint: isArabic ? "مهدئ ومضاد للحكة" : "Anti-itch soothing" },
                { label: isArabic ? "شعر مصبوغ / كيرلي" : "Colored / Curly", color: "pink", hint: isArabic ? "حماية اللون والترطيب" : "Color & curl care" },
            ],
            purityItems: [
                isArabic ? "خالٍ من السلفات القاسية (Sulfate-Free)" : "Sulfate-Free",
                isArabic ? "خالٍ من البارابين (Paraben-Free)" : "Paraben-Free",
                isArabic ? "آمن على بصيلات الشعر" : "Follicle Safe",
                isArabic ? "مفحوص سريرياً لفروة الرأس" : "Dermatologically Tested",
                isArabic ? "لا يترك بقايا دهنية لاصقة" : "Zero Greasy Residue",
                isArabic ? "مناسب للشعر المعالج والمصبوغ" : "Color Safe",
            ]
        };
    }

    // 3. Eye & Lip Contour (محيط العيون والشفاه)
    if (raw.includes("eye contour") || raw.includes("eye cream") || raw.includes("lip balm") || raw.includes("lips") || raw.includes("حول العين") || raw.includes("شفاه") || raw.includes("هالات") || raw.includes("انتفاخات العيون") || raw.includes("تشقق الشفاه")) {
        return {
            domain: "eyes_lips",
            badgeLabel: isArabic ? "العيون والشفاه" : "Eyes & Lips",
            tabTitle: isArabic ? "دليل العيون والشفاه" : "Eye & Lip Care",
            guideTitle: isArabic ? "دليل العناية بمحيط العيون والشفاه" : "Eye & Lip Delicate Care Guide",
            guideSubtitle: isArabic ? "المكونات الحساسة • روتين النضارة ومكافحة التجاعيد • ملاءمة المناطق الرقيقة" : "Delicate Formula · Anti-Dark Circles · Delicate Zone Safe",
            categoryTitle: isArabic ? "ملاءمة مناطق محيط العيون والشفاه" : "Eye Contour & Lip Compatibility",
            icon: <Eye className="w-4 h-4 text-purple-400" />,
            suitabilityList: [
                { label: isArabic ? "هالات سوداء وانتفاخ" : "Dark Circles & Puffiness", color: "emerald", hint: isArabic ? "تنشيط الدورة الدموية" : "Microcirculation boost" },
                { label: isArabic ? "خطوط دقيقة وتجاعيد" : "Fine Lines / Crow's Feet", color: "cyan", hint: isArabic ? "شد وترطيب فائق" : "Smoothing & plumping" },
                { label: isArabic ? "شفاه جافة ومشققة" : "Dry & Chapped Lips", color: "violet", hint: isArabic ? "ترميم الحاجز الشمعي" : "Barrier repair" },
                { label: isArabic ? "عيون حساسة وعدسات" : "Sensitive Eyes / Lens", color: "amber", hint: isArabic ? "مفحوص رمدياً" : "Ophthalmologist tested" },
                { label: isArabic ? "نضارة يومية شاملة" : "All Delicate Areas", color: "pink", hint: isArabic ? "إشراقة وترطيب مستمر" : "Daily radiance" },
            ],
            purityItems: [
                isArabic ? "مفحوص من أطباء العيون (Ophthalmologist Tested)" : "Ophthalmologist Tested",
                isArabic ? "خالٍ من العطور المسببة للدموع" : "Fragrance-Free",
                isArabic ? "تركيبة خفيفة سريعة الامتصاص" : "Lightweight Absorption",
                isArabic ? "آمن لمستخدمي العدسات اللاصقة" : "Contact Lens Safe",
                isArabic ? "خالٍ من البارابين والزيوت الثقيلة" : "Paraben-Free",
                isArabic ? "لا يسبب انسداد الغدد الدمعية" : "Safe For Sensitive Skin",
            ]
        };
    }

    // 4. Body & Hands (الجسم واليدين والقدمين)
    if (raw.includes("body") || raw.includes("hand") || raw.includes("foot") || raw.includes("feet") || raw.includes("جسم") || raw.includes("يدين") || raw.includes("قدمين") || raw.includes("body lotion") || raw.includes("body wash") || raw.includes("hand cream") || raw.includes("سيلوليت") || raw.includes("تشققات الجسم") || raw.includes("علامات تمدد")) {
        return {
            domain: "body",
            badgeLabel: isArabic ? "الجسم واليدين" : "Body & Hands",
            tabTitle: isArabic ? "دليل العناية بالجسم" : "Body Care Guide",
            guideTitle: isArabic ? "دليل العناية بالجسم واليدين" : "Body & Hand Care Guide",
            guideSubtitle: isArabic ? "المكونات المرطبة • روتين العناية بالجسم • حماية وترميم حاجز البشرة" : "Hydrating Complexes · Body Routine · Skin Barrier Protection",
            categoryTitle: isArabic ? "ملاءمة مناطق وبشرة الجسم" : "Body Skin Compatibility",
            icon: <Hand className="w-4 h-4 text-cyan-400" />,
            suitabilityList: [
                { label: isArabic ? "جسم جاف وشديد الخشونة" : "Very Dry & Rough", color: "emerald", hint: isArabic ? "ترميم مكثف باليوريا والسيراميد" : "Intensive Urea & Ceramide" },
                { label: isArabic ? "بشرة الجسم الحساسة" : "Sensitive Body", color: "cyan", hint: isArabic ? "خالٍ من المهيجات" : "Calming & fragrance-free" },
                { label: isArabic ? "اليدين والقدمين المتشققة" : "Hands & Cracked Feet", color: "violet", hint: isArabic ? "حماية وتنعيم التشققات" : "Softens cracks" },
                { label: isArabic ? "توحيد لون الجسم والنضارة" : "Even Tone & Glow", color: "amber", hint: isArabic ? "تفتيح وتجديد الخلايا" : "Brightening & renewal" },
                { label: isArabic ? "كافة مناطق الجسم" : "All Body Areas", color: "pink", hint: isArabic ? "ترطيب يومي منعش" : "Daily refreshing moisture" },
            ],
            purityItems: [
                isArabic ? "مفحوص جلدياً لكامل الجسم" : "Dermatologist Tested",
                isArabic ? "سريع الامتصاص دون إحساس لزج" : "Non-Sticky Fast Absorption",
                isArabic ? "ترطيب يدوم 24-48 ساعة" : "24h Long-Lasting Moisture",
                isArabic ? "خالٍ من البارابين والملونات" : "Paraben & Dye Free",
                isArabic ? "يدعم الحاجز الطبيعي للبشرة" : "Barrier Supporting",
                isArabic ? "آمن للاستخدام اليومي المتكرر" : "Daily Safe",
            ]
        };
    }

    // 5. Intimate & Specialty (المناطق الحساسة والموضعية المتخصصة)
    if (raw.includes("intimate") || raw.includes("sensitive area") || raw.includes("deodorant") || raw.includes("مناطق حساسة") || raw.includes("مزيل عرق") || raw.includes("تفتيح المناطق الحساسة") || raw.includes("حميمي")) {
        return {
            domain: "intimate",
            badgeLabel: isArabic ? "عناية متخصصة" : "Specialty Care",
            tabTitle: isArabic ? "دليل العناية المتخصصة" : "Specialty Care Guide",
            guideTitle: isArabic ? "دليل العناية بالمناطق المتخصصة والحساسة" : "Intimate & Specialty Care Guide",
            guideSubtitle: isArabic ? "موازنة درجة الحموضة pH • حماية وتهدئة فائقة من التهيج" : "pH-Balanced · High Soothing & Anti-Irritation",
            categoryTitle: isArabic ? "ملاءمة المناطق الحساسة والمتخصصة" : "Specialty Area Compatibility",
            icon: <ShieldAlert className="w-4 h-4 text-emerald-400" />,
            suitabilityList: [
                { label: isArabic ? "توازن درجة الحموضة pH" : "pH Balanced", color: "emerald", hint: isArabic ? "يحافظ على البكتيريا النافعة" : "Maintains microbiome" },
                { label: isArabic ? "حماية من الاحتكاك والتهيج" : "Anti-Chafing", color: "cyan", hint: isArabic ? "تهدئة وعزل وقائي" : "Soothing protective layer" },
                { label: isArabic ? "بشرة فائقة الحساسية" : "Ultra-Sensitive", color: "violet", hint: isArabic ? "خالٍ من الصابون والكحول" : "Soap & alcohol free" },
                { label: isArabic ? "توحيد وتفتيح لطيف" : "Gentle Even-Tone", color: "amber", hint: isArabic ? "آمن بدون تقشير قاسي" : "No harsh acids" },
                { label: isArabic ? "عناية وانتعاش يومي" : "Daily Freshness", color: "pink", hint: isArabic ? "حماية مستمرة طوال اليوم" : "All-day protection" },
            ],
            purityItems: [
                isArabic ? "متوازن الحموضة فسيولوجياً (pH-Balanced)" : "Physiologically pH-Balanced",
                isArabic ? "مفحوص سريرياً للمناطق الحساسة" : "Gynecologically / Derm Tested",
                isArabic ? "خالٍ من الصابون والبارابين" : "Soap & Paraben Free",
                isArabic ? "خالٍ من الكحول والعطور القاسية" : "Alcohol & Harsh Fragrance Free",
                isArabic ? "مضاد للتهيج والتحسس" : "Hypoallergenic",
                isArabic ? "آمن للاستخدام اليومي" : "Daily Gentle Care",
            ]
        };
    }

    // 6. Facial Skincare (الوجه والرقبة) - Default for facial skincare products
    return {
        domain: "face",
        badgeLabel: isArabic ? "الوجه والرقبة" : "Face & Neck",
        tabTitle: isArabic ? "دليل العناية بالوجه" : "Facial Care Guide",
        guideTitle: isArabic ? "دليل العناية ببشرة الوجه والرقبة" : "Facial Skincare Advanced Guide",
        guideSubtitle: isArabic ? "المكونات النشطة • الروتين النهاري والليلي • ملاءمة نوع البشرة" : "Active Ingredients · AM/PM Routine · Skin Type Compatibility",
        categoryTitle: isArabic ? "ملاءمة أنواع بشرة الوجه" : "Facial Skin Type Compatibility",
        icon: <Sparkles className="w-4 h-4 text-pink-400" />,
        suitabilityList: [
            { label: isArabic ? "دهنية ومعرضة للحبوب" : "Oily / Acne-Prone", color: "emerald", hint: isArabic ? "يقلل الإفرازات والمسام" : "Controls shine & pores" },
            { label: isArabic ? "جافة وشاحبة" : "Dry / Dehydrated", color: "cyan", hint: isArabic ? "ترطيب عميق وحاجز وقائي" : "Deep hydration & barrier" },
            { label: isArabic ? "مختلطة T-Zone" : "Combination", color: "violet", hint: isArabic ? "موازنة المناطق الدهنية والجافة" : "Balances T-zone" },
            { label: isArabic ? "حساسة ومتهيجة" : "Sensitive / Reactive", color: "amber", hint: isArabic ? "تهدئة وترميم سريع" : "Soothing & calming" },
            { label: isArabic ? "عادية / ناضجة" : "Normal / Mature", color: "pink", hint: isArabic ? "نضارة ومكافحة التجاعيد" : "Radiance & anti-aging" },
        ],
        purityItems: [
            isArabic ? "خالٍ من البارابين (Paraben-Free)" : "Paraben-Free",
            isArabic ? "خالٍ من السولفات (Sulfate-Free)" : "Sulfate-Free",
            isArabic ? "لا يسد المسام (Non-Comedogenic)" : "Non-Comedogenic",
            isArabic ? "مفحوص من أطباء الجلدية" : "Dermatologist Tested",
            isArabic ? "خالٍ من الكحول والعطور القوية" : "Alcohol & Harsh Fragrance Free",
            isArabic ? "لا يختبر على الحيوانات (Cruelty-Free)" : "Cruelty-Free",
        ]
    };
};

interface MedicalData {
    drugName: string;
    drugNameEn?: string;
    genericName?: string;
    genericNameEn?: string;
    manufacturer: string;
    productCategory?: string;
    productCategoryLabel?: string;
    form?: string;
    dosageForm?: string;
    routeOfAdministration?: string;
    targetAudience?: string;
    strength?: string;
    activeIngredients?: string[];
    activeIngredientsEn?: string[];
    scannedImage?: string;
    activeIngredientsDetailed?: Array<{
        name: string;
        strength?: string;
        strengthMg?: number;
        source?: string;
    }>;
    description: string;
    category?: string;
    uses: string[];
    sideEffects: string[];
    dosage: string;
    missedDose?: string;
    overdose?: {
        symptoms?: string[];
        whatToDo?: string[];
    };
    storage?: string;
    contraindications?: string[];
    precautions?: string[];
    warnings: string[];
    interactions?: string[];
    whenToSeekHelp?: string[];
    personalized?: null | {
        contextUsed?: boolean;
        riskLevel?: string;
        riskSummary?: string;
        alerts?: Array<{
            severity?: string;
            title?: string;
            details?: string;
        }>;
        basedOn?: {
            allergies?: boolean;
            conditions?: boolean;
            currentMedications?: boolean;
            medicationMemories?: boolean;
        };
    };
    confidenceScore?: number;
    interactionGuard?: null | {
        subject?: {
            profileId?: string | null;
            displayName?: string | null;
            relationship?: string | null;
        };
        target?: {
            name?: string | null;
            genericName?: string | null;
        };
        overallRisk?: string;
        items?: Array<{
            otherMedication: string;
            severity: "safe" | "caution" | "danger";
            confidence?: number;
            headline?: string;
            summary?: string;
            mechanism?: string;
            whatToDo?: string[];
            monitoring?: string[];
            redFlags?: string[];
        }>;
        disclaimer?: string;
        generatedAt?: string;
        serverDurationMs?: number;
    };
    fda?: (OpenFdaLabelSnapshot & { serverDurationMs?: number }) | null;
    web?: null | {
        found?: boolean;
        query?: string;
        results?: Array<{ title?: string; link?: string; snippet?: string }>;
        fetchedAt?: string;
        error?: string;
    };
    productClassification?: null | {
        kind?: string;
        confidence?: number;
        reasons?: string[];
    };
    error?: string;
    meta?: {
        plan?: 'free' | 'ultra';
        fdaEnabled?: boolean;
        savedToHistory?: boolean;
        historyId?: string | null;
        subjectProfileId?: string | null;
        subjectProfileName?: string | null;
        subjectRelationship?: string | null;
        usedPrivateContext?: boolean;
        usedMedicationMemories?: boolean;
        medicationMemoriesCount?: number;
        hasPrivateProfile?: boolean;
        usedInteractionGuard?: boolean;
        usedWebVerification?: boolean;
        usedFdaVerification?: boolean;
        isMergedRecord?: boolean;
        scanCount?: number;
        memory?: {
            display_name?: string;
            normalized_name?: string;
            count?: number;
            last_seen_at?: string;
        } | null;
    };
}

interface MedicalResultCardProps {
    data: MedicalData;
    onResetScan?: () => void;
}

interface AiNextQuestion {
    id: string;
    title: string;
    question: string;
}

interface AiTreeNode {
    title: string;
    summary?: string;
    answer: string;
    keyPoints?: string[];
    nextQuestions?: AiNextQuestion[];
    userQuestion?: string;
}

const renderFormattedText = (text: string) => {
    if (!text) return null;
    
    // Split by newlines
    const lines = text.split("\n");
    
    return lines.map((line, lineIdx) => {
        let cleanLine = line.trim();
        if (!cleanLine) return <div key={lineIdx} className="h-2" />;
        
        // Check for lists
        let isBullet = false;
        let isNumbered = false;
        let numberPrefix = "";
        
        if (cleanLine.startsWith("- ") || cleanLine.startsWith("* ")) {
            isBullet = true;
            cleanLine = cleanLine.substring(2);
        } else {
            const numMatch = cleanLine.match(/^(\d+)\.\s+/);
            if (numMatch) {
                isNumbered = true;
                numberPrefix = numMatch[1] + ".";
                cleanLine = cleanLine.substring(numMatch[0].length);
            }
        }
        
        // Parse bold text **bold**
        const parts = [];
        let index = 0;
        const boldRegex = /\*\*([^*]+)\*\*/g;
        let match;
        
        while ((match = boldRegex.exec(cleanLine)) !== null) {
            // Text before bold
            if (match.index > index) {
                parts.push(cleanLine.substring(index, match.index));
            }
            // Bold text
            parts.push(<strong key={match.index} className="font-extrabold text-white text-shadow-sm">{match[1]}</strong>);
            index = boldRegex.lastIndex;
        }
        
        if (index < cleanLine.length) {
            parts.push(cleanLine.substring(index));
        }
        
        const content = parts.length > 0 ? parts : cleanLine;
        
        if (isBullet) {
            return (
                <div key={lineIdx} className="flex items-start gap-2 my-1 ps-2">
                    <span className="text-purple-400 mt-1.5 shrink-0 select-none">•</span>
                    <span className="text-white/80 text-sm leading-relaxed">{content}</span>
                </div>
            );
        }
        
        if (isNumbered) {
            return (
                <div key={lineIdx} className="flex items-start gap-2 my-1 ps-2">
                    <span className="text-purple-400 font-bold font-mono text-xs mt-1 shrink-0 select-none">{numberPrefix}</span>
                    <span className="text-white/80 text-sm leading-relaxed">{content}</span>
                </div>
            );
        }
        
        return (
            <p key={lineIdx} className="text-white/80 text-sm leading-relaxed mb-2">
                {content}
            </p>
        );
    });
};

type UltraSafetyTab = 'precautions' | 'interactions' | 'sideEffects' | 'overdose' | 'seekHelp';

export const MedicalResultCard = ({ data, onResetScan }: MedicalResultCardProps) => {
    const { user, plan, profile } = useUser();
    const { resultsLanguage, fdaDrugsEnabled } = useSettings();

    const exportRef = useRef<HTMLDivElement | null>(null);
    const [exporting, setExporting] = useState<null | 'png' | 'pdf'>(null);
    const [exportError, setExportError] = useState<string | null>(null);

    const meta = (data as any)?.meta as MedicalData["meta"] | undefined;
    const savedToHistory = meta?.savedToHistory ?? true;
    const memory = meta?.memory || null;
    const fdaFeatureEnabled = plan === "ultra" ? Boolean(fdaDrugsEnabled) : true;

    const isArabic = resultsLanguage === 'ar';
    const t = (en: string, ar: string) => (isArabic ? ar : en);
    const router = useRouter();

    const scanContext = useOptionalScan();
    const previewSrc = scanContext?.previewSrc || null;
    const scannedImage = data.scannedImage || previewSrc;

    const displayDrugName = isArabic ? (data.drugName || data.drugNameEn) : (data.drugNameEn || data.drugName);
    const displayGenericName = isArabic ? (data.genericName || data.genericNameEn) : (data.genericNameEn || data.genericName);

    const [fda, setFda] = useState<MedicalData["fda"]>((data as any)?.fda ?? null);
    const [fdaLoading, setFdaLoading] = useState(false);
    const [fdaError, setFdaError] = useState<string | null>(null);
    const [showFdaDetails, setShowFdaDetails] = useState(false);

    const [aiNodes, setAiNodes] = useState<AiTreeNode[]>([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    // Enhanced Ask MATANY AI state
    const [customQuestion, setCustomQuestion] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [copiedNodeIdx, setCopiedNodeIdx] = useState<number | null>(null);
    const [savedAnswers, setSavedAnswers] = useState<number[]>([]);
    const [pendingUserQuestion, setPendingUserQuestion] = useState<string | null>(null);
    const [showSimplified, setShowSimplified] = useState<Record<number, boolean>>({});
    const aiInputRef = useRef<HTMLTextAreaElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const [quickConsult, setQuickConsult] = useState<{
        isOpen: boolean;
        topic: string;
        sectionTitle: string;
        question: string;
    } | null>(null);

    const [activeTab, setActiveTab] = useState<'overview' | 'cosmetics' | 'safety' | 'guard' | 'chat' | 'fda'>('overview');
    const [safetyTab, setSafetyTab] = useState<UltraSafetyTab>('interactions');
    const [safetyShowAll, setSafetyShowAll] = useState<Record<string, boolean>>({});
    const [showAllIngredients, setShowAllIngredients] = useState(false);
    const [showGuardGraph, setShowGuardGraph] = useState(false);

    const isCosmetic = useMemo(() => {
        const pCat = String(data.productCategory || data.category || data.productCategoryLabel || data.productClassification?.kind || "").toLowerCase();
        const dName = String(data.drugName || data.drugNameEn || "").toLowerCase();
        const gName = String(data.genericName || data.genericNameEn || "").toLowerCase();
        const desc = String(data.description || "").toLowerCase();
        const formStr = String(data.form || "").toLowerCase();

        return pCat.includes("cosmetic") || 
               pCat.includes("تجميل") || 
               pCat.includes("بشرة") || 
               pCat.includes("شعر") ||
               pCat.includes("لحية") ||
               pCat.includes("topical_cosmetic") ||
               pCat.includes("skincare") ||
               pCat.includes("haircare") ||
               dName.includes("cream") || dName.includes("serum") || dName.includes("lotion") || dName.includes("deodorant") || dName.includes("shampoo") || dName.includes("sunscreen") || dName.includes("conditioner") || dName.includes("cleanser") || dName.includes("moisturizer") || dName.includes("facewash") || dName.includes("body wash") || dName.includes("كريم") || dName.includes("سيروم") || dName.includes("شامبو") || dName.includes("مرطب") || dName.includes("غسول") || dName.includes("مزيل عرق") || dName.includes("بلسم") || dName.includes("واقي شمس") || dName.includes("تونر") || dName.includes("مقشر") ||
               gName.includes("cosmetic") || gName.includes("تجميل") || gName.includes("skincare") ||
               formStr.includes("cream") || formStr.includes("gel") || formStr.includes("lotion") || formStr.includes("serum") || formStr.includes("shampoo") || formStr.includes("deodorant") || formStr.includes("cleanser") || formStr.includes("moisturizer") ||
               desc.includes("مستحضر تجميل") || desc.includes("عناية بالبشرة") || desc.includes("عناية بالشعر") || desc.includes("cosmetic") || desc.includes("skincare") || desc.includes("haircare");
    }, [data]);

    useEffect(() => {
        if (isCosmetic && (activeTab === 'guard' || activeTab === 'fda')) {
            setActiveTab('overview');
        }
    }, [isCosmetic, activeTab]);

    useEffect(() => {
        if (activeTab === 'chat') {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [aiNodes.length, aiLoading, activeTab]);

    const interactionGuard = (data as any)?.interactionGuard as MedicalData["interactionGuard"] | undefined;
    const serverGuardItems = useMemo(() => {
        if (isCosmetic) return [];
        const list = (interactionGuard as any)?.items;
        return Array.isArray(list) ? (list as any[]).filter((x) => x && x.otherMedication) : [];
    }, [interactionGuard, isCosmetic]);

    const localGuardItems = useMemo(() => {
        // Cosmetic products have ZERO drug-drug interactions with oral medications
        if (isCosmetic) return [];
        if (serverGuardItems.length > 0) return [];
        if (typeof window === "undefined") return [];
        try {
            const scans = getLocalScans();
            const currNorm = String(displayDrugName || "").trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ");
            
            // Filter out self and any cosmetic/topical items from history
            const otherScans = scans.filter((s) => {
                const name = String(s.drug_name || "").trim().toLowerCase();
                const norm = name.replace(/[^\p{L}\p{N}]+/gu, " ");
                if (!norm || norm === currNorm || (currNorm.length >= 4 && norm.length >= 4 && (norm.includes(currNorm) || currNorm.includes(norm)))) {
                    return false;
                }
                const isHistoryCosmetic = name.includes("shampoo") || name.includes("شامبو") || name.includes("cream") || name.includes("كريم") ||
                    name.includes("serum") || name.includes("سيروم") || name.includes("lotion") || name.includes("لوشن") ||
                    name.includes("مرطب") || name.includes("غسول") || name.includes("cleanser") || name.includes("facewash") ||
                    name.includes("sunscreen") || name.includes("واقي شمس") || name.includes("deodorant") || name.includes("مزيل عرق") ||
                    name.includes("cosmetic") || name.includes("تجميل");
                return !isHistoryCosmetic;
            });

            // Known interactions from current medication analysis
            const knownInteractions = Array.isArray(data.interactions) ? data.interactions.map(x => String(x || "").toLowerCase()) : [];

            // ONLY return a warning if there is a verified matched interaction in data.interactions
            if (otherScans.length > 0) {
                const verifiedItems: any[] = [];
                for (const s of otherScans.slice(0, 10)) {
                    const otherName = String(s.drug_name || "").toLowerCase();
                    const hasMatchedInteraction = knownInteractions.some(inter => 
                        inter.includes(otherName) || otherName.split(/\s+/).some(word => word.length >= 4 && inter.includes(word))
                    );

                    if (hasMatchedInteraction) {
                        verifiedItems.push({
                            otherMedication: s.drug_name,
                            severity: "caution",
                            headline: isArabic ? `تداخل دوائي محتمل مع ${s.drug_name}` : `Potential Interaction with ${s.drug_name}`,
                            summary: isArabic
                                ? `تم رصد تعارض دوائي محتمل مع ${s.drug_name} وفقاً لدليل التداخلات الدوائية. يرجى استشارة الصيدلي لتنظيم المواعيد.`
                                : `Potential drug-drug interaction detected with ${s.drug_name} based on pharmacological guidelines. Consult your pharmacist.`,
                            mechanism: isArabic
                                ? `تأثيرات فارماكولوجية متداخلة على الامتصاص أو الفاعلية الحيوية.`
                                : `Pharmacological interaction affecting absorption or bioavailability.`,
                            whatToDo: [
                                isArabic ? "الفصل بين مواعيد الجرعات بساعتين على الأقل." : "Separate administration times by at least 2 hours.",
                                isArabic ? "مراجعة الصيدلي للتأكد من السلامة التامة." : "Check with a pharmacist for absolute safety."
                            ],
                            monitoring: [
                                isArabic ? "مراقبة حدوث خمول أو آلام معدة أو أعراض غير معتادة." : "Monitor for unusual symptoms."
                            ],
                            redFlags: [
                                isArabic ? "التوقف فوراً واستشارة الطبيب عند ظهور حكة جلديّة أو ضيق تنفس." : "Discontinue and seek care if rash or dyspnea occurs."
                            ]
                        });
                    }
                }
                if (verifiedItems.length > 0) {
                    return verifiedItems;
                }
            }

            // Multi-ingredient synergy within complex compound drugs (e.g. Paracetamol + Caffeine)
            const ingredients = Array.isArray(data.activeIngredients) ? data.activeIngredients : [];
            if (ingredients.length > 1) {
                return ingredients.slice(1).map((ing: string) => ({
                    otherMedication: ing,
                    severity: "safe",
                    headline: isArabic ? `تكامل المادة الفعالة: ${ing}` : `Active Component Synergy: ${ing}`,
                    summary: isArabic
                        ? `يحتوي هذا المستحضر المركّب على أكثر من مادة فعالة بما فيها ${ing}. تعمل المواد بتناغم علاجي مدروس.`
                        : `This compound formulation contains multiple active ingredients including ${ing}, formulated for synergistic efficacy.`,
                    mechanism: isArabic ? `تأثيرات فارماكولوجية متكاملة ضمن الدواء المركّب.` : `Synergistic pharmacological action within multi-ingredient compound.`,
                    whatToDo: [isArabic ? "الالتزام التام بالجرعة المقررة لتجنب مضاعفات المواد الفعالة." : "Adhere strictly to recommended dose to avoid component toxicity."],
                    monitoring: [isArabic ? "مراقبة الاستجابة العلاجية وسلامة الجهاز الهضمي." : "Monitor therapeutic response and GI tolerance."],
                    redFlags: [isArabic ? "عدم تكرار تناول أدوية أخرى تحتوي نفس المركّب." : "Avoid duplicating active ingredients with other OTC products."]
                }));
            }
        } catch (e) {
            console.warn("Error building local guard fallback:", e);
        }
        return [];
    }, [isCosmetic, serverGuardItems, displayDrugName, isArabic, data.activeIngredients, data.interactions]);

    const guardItems = useMemo(() => {
        if (isCosmetic) return [];
        const raw = serverGuardItems.length > 0 ? serverGuardItems : localGuardItems;
        const seen = new Set<string>();
        const deduplicated: typeof raw = [];

        for (const it of raw) {
            if (!it || !it.otherMedication) continue;
            const norm = String(it.otherMedication)
                .toLowerCase()
                .replace(/[^\p{L}\p{N}]+/gu, " ")
                .trim();
            if (!norm || seen.has(norm)) continue;
            seen.add(norm);
            deduplicated.push(it);
        }

        return deduplicated;
    }, [isCosmetic, serverGuardItems, localGuardItems]);

    const [selectedGuardKey, setSelectedGuardKey] = useState<string | null>(null);

    useEffect(() => {
        const first = guardItems[0]?.otherMedication ? String(guardItems[0].otherMedication) : null;
        setSelectedGuardKey(first);
    }, [guardItems]);

    const selectedGuardItem = useMemo(() => {
        if (!selectedGuardKey) return guardItems[0] || null;
        return guardItems.find((it: any) => String(it.otherMedication) === String(selectedGuardKey)) || guardItems[0] || null;
    }, [guardItems, selectedGuardKey]);

    const guardCounts = useMemo(() => {
        const counts = { safe: 0, caution: 0, danger: 0 };
        for (const it of guardItems as any[]) {
            const sev = String(it?.severity || "caution").toLowerCase();
            if (sev === "safe") counts.safe += 1;
            else if (sev === "danger") counts.danger += 1;
            else counts.caution += 1;
        }
        return counts;
    }, [guardItems]);

    const guardTopList = useMemo(() => {
        const sevOrder = (s: any) => (String(s || "").toLowerCase() === "danger" ? 2 : String(s || "").toLowerCase() === "caution" ? 1 : 0);
        return (guardItems as any[])
            .slice()
            .sort((a: any, b: any) => {
                const bySeverity = sevOrder(b?.severity) - sevOrder(a?.severity);
                if (bySeverity !== 0) return bySeverity;
                return Number(b?.confidence || 0) - Number(a?.confidence || 0);
            })
            .slice(0, 4);
    }, [guardItems]);

    const graphNodes = useMemo(() => (guardItems as any[]).slice(0, 10), [guardItems]);
    const graphLayout = useMemo(() => {
        const n = graphNodes.length;
        if (n === 0) return [];
        if (n === 1) return [{ x: 80, y: 50 }];
        if (n === 2) return [{ x: 18, y: 50 }, { x: 82, y: 50 }];
        if (n === 3) return [{ x: 18, y: 50 }, { x: 82, y: 26 }, { x: 82, y: 74 }];
        if (n === 4) return [{ x: 18, y: 26 }, { x: 82, y: 26 }, { x: 82, y: 74 }, { x: 18, y: 74 }];

        // Elliptical distribution for 5+ nodes with offset start to prevent top/bottom collisions
        const radiusX = 35;
        const radiusY = 32;
        return graphNodes.map((_: any, idx: number) => {
            const angle = (2 * Math.PI * idx) / n + Math.PI / 4;
            const x = 50 + radiusX * Math.cos(angle);
            const y = 50 + radiusY * Math.sin(angle);
            return { x, y };
        });
    }, [graphNodes]);

    const guardSubjectName = useMemo(() => {
        const fromMeta = String(meta?.subjectProfileName || "").trim();
        if (fromMeta) return fromMeta;
        const fromGuard = String((interactionGuard as any)?.subject?.displayName || "").trim();
        if (fromGuard) return fromGuard;
        const fromProfile = String(profile?.username || profile?.full_name || "").trim();
        if (fromProfile) return fromProfile;
        return "";
    }, [interactionGuard, meta?.subjectProfileName, profile?.full_name, profile?.username]);

    const guardSubjectRelationship = useMemo(() => {
        const fromMeta = String(meta?.subjectRelationship || "").trim();
        if (fromMeta) return fromMeta;
        const fromGuard = String((interactionGuard as any)?.subject?.relationship || "").trim();
        if (fromGuard) return fromGuard;
        return "";
    }, [interactionGuard, meta?.subjectRelationship]);

    const aiSubjectLabel = useMemo(() => {
        const name = guardSubjectName || (isArabic ? "أنت" : "You");
        const rel = guardSubjectRelationship;
        if (!rel) return name;
        return `${name} (${rel})`;
    }, [guardSubjectName, guardSubjectRelationship, isArabic]);

    const severityUi = (sev: string) => {
        const v = String(sev || "caution").toLowerCase();
        if (v === "safe") {
            return {
                label: t("Safe", "آمن"),
                chip: "bg-emerald-500/10 text-emerald-200 border-emerald-500/25",
                stroke: "rgba(16,185,129,0.9)",
                marker: "url(#arrowSafe)",
                node: "bg-emerald-500/10 border-emerald-500/25 text-emerald-50",
            };
        }
        if (v === "danger") {
            return {
                label: t("Danger", "خطر"),
                chip: "bg-red-500/10 text-red-200 border-red-500/25",
                stroke: "rgba(239,68,68,0.9)",
                marker: "url(#arrowDanger)",
                node: "bg-red-500/10 border-red-500/25 text-red-50",
            };
        }
        return {
            label: t("Caution", "تحذير"),
            chip: "bg-yellow-500/10 text-yellow-200 border-yellow-500/25",
            stroke: "rgba(234,179,8,0.95)",
            marker: "url(#arrowCaution)",
            node: "bg-yellow-500/10 border-yellow-500/25 text-yellow-50",
        };
    };

    const exportBaseName = useMemo(() => {
        const raw = String(data?.drugName || "analysis")
            .normalize("NFKC")
            .replace(/\s+/g, " ")
            .trim();
        const safe = raw
            .toLowerCase()
            .replace(/[^\p{L}\p{N}]+/gu, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
        return safe || "analysis";
    }, [data?.drugName]);

    const exportFilter = (node: HTMLElement) => {
        const maybeNode = node as unknown as { nodeType?: unknown; closest?: unknown; hasAttribute?: unknown } | null;
        if (!maybeNode || typeof maybeNode !== "object") return true;
        if (maybeNode.nodeType !== 1) return true;

        const element = node as unknown as Element;
        if (typeof element.closest === "function") {
            return !element.closest("[data-export-ignore]");
        }
        const hasAttribute = maybeNode.hasAttribute as unknown;
        if (typeof hasAttribute === "function") {
            return !(hasAttribute as (name: string) => boolean).call(maybeNode, "data-export-ignore");
        }
        return true;
    };

    const getSafePixelRatio = (node: HTMLElement, desired: number) => {
        const rect = node.getBoundingClientRect();
        const width = Math.max(1, rect.width);
        const height = Math.max(1, rect.height);
        const maxCanvasDimension = 12000;
        const maxRatio = Math.min(maxCanvasDimension / width, maxCanvasDimension / height);
        const ratio = Math.min(desired, maxRatio);
        return Math.max(1, Math.floor(ratio * 100) / 100);
    };

    const exportFrameStyle: Partial<CSSStyleDeclaration> = {
        padding: "18px",
        background: "linear-gradient(135deg, #070A12 0%, #0B1430 50%, #070A12 100%)",
        borderRadius: "28px",
    };

    const downloadPng = async () => {
        setExportError(null);
        setExporting('png');
        try {
            const { exportMedicalReportPng } = await import("@/lib/export/medicalPdfExporter");
            await exportMedicalReportPng({
                data,
                isArabic,
                userName: profile?.full_name || profile?.username || user?.user_metadata?.username || t("Primary User", "المستخدم الرئيسي"),
                scannedImage: data.scannedImage,
            });
        } catch (e: any) {
            console.error("Export PNG error:", e);
            setExportError(String(e?.message || t("Export failed", "فشل التصدير")));
        } finally {
            setExporting(null);
        }
    };

    const downloadPdf = async () => {
        if (plan !== 'ultra') {
            setExportError(t("Ultra plan required for PDF export.", "تصدير PDF يتطلب الاشتراك ألترا."));
            return;
        }

        setExportError(null);
        setExporting('pdf');
        try {
            const { exportMedicalReportPdf } = await import("@/lib/export/medicalPdfExporter");
            await exportMedicalReportPdf({
                data,
                isArabic,
                userName: profile?.full_name || profile?.username || user?.user_metadata?.username || t("Primary User", "المستخدم الرئيسي"),
                plan: plan || "ultra",
            });
        } catch (e: any) {
            console.error("Export PDF error:", e);
            setExportError(String(e?.message || t("Export failed", "فشل التصدير")));
        } finally {
            setExporting(null);
        }
    };

    useEffect(() => {
        setFda(data.fda ?? null);
        setFdaError(null);
        setShowFdaDetails(false);
        setShowAllIngredients(false);
    }, [data.drugName, data.fda]);

    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            if (!fdaFeatureEnabled) return;
            const drugName = String(data?.drugName || "").trim();
            if (!drugName || drugName === "Unknown") return;
            if (data.fda) return;

            setFdaLoading(true);
            setFdaError(null);
            try {
                const res = await fetch("/api/fda/drug", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        language: resultsLanguage,
                        drugName: data.drugName,
                        drugNameEn: data.drugNameEn,
                        genericName: data.genericName,
                        genericNameEn: data.genericNameEn,
                        manufacturer: data.manufacturer,
                    }),
                });

                const payload = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(payload?.error || "FDA lookup failed");
                if (!cancelled) setFda(payload as any);
            } catch (e: any) {
                if (!cancelled) setFdaError(String(e?.message || "FDA lookup failed"));
            } finally {
                if (!cancelled) setFdaLoading(false);
            }
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [data.drugName, data.drugNameEn, data.genericName, data.genericNameEn, data.manufacturer, fdaFeatureEnabled, resultsLanguage]);

    const fdaLabelFound = fdaFeatureEnabled && Boolean((fda as any)?.found);
    const fdaNdcFound = fdaFeatureEnabled && Boolean((fda as any)?.ndc?.found);
    const fdaFoundAny = fdaLabelFound || fdaNdcFound;

    const fdaLabelScore = Number((fda as any)?.match?.score || 0);
    const fdaLabelReason = String((fda as any)?.match?.reason || "");
    const fdaNdcScore = Number((fda as any)?.ndc?.match?.score || 0);
    const fdaNdcReason = String((fda as any)?.ndc?.match?.reason || "");

    const fdaConfirmedLabel =
        fdaLabelFound &&
        (fdaLabelReason.includes("product_ndc match") ||
            (fdaLabelReason.includes("brand_name exact match") &&
                (fdaLabelReason.includes("generic_name exact match") || fdaLabelReason.includes("substance_name match"))) ||
            fdaLabelScore >= 120);

    const fdaConfirmedNdc =
        fdaNdcFound &&
        (fdaNdcReason.includes("package_ndc match") ||
            (fdaNdcReason.includes("product_ndc match") ||
                (fdaNdcReason.includes("brand_name exact match") && fdaNdcReason.includes("generic_name exact match")) ||
                fdaNdcScore >= 130)); // Fixed parenthesis nesting here

    const fdaConfirmed = fdaConfirmedLabel || fdaConfirmedNdc;

    const fdaSoftError = String((fda as any)?.error || "");
    const fdaNotEnoughIdentifiers =
        fdaSoftError.toLowerCase().includes("not enough identifiers") ||
        fdaSoftError.toLowerCase().includes("no fda search terms") ||
        fdaSoftError.toLowerCase().includes("no search terms provided");

    const fdaStatus: "verified" | "uncertain" | "not_found" | "disabled" =
        !fdaFeatureEnabled
            ? "disabled"
            : fdaLoading
                ? "uncertain"
                : fdaError
                    ? "uncertain"
                    : fdaConfirmed
                        ? "verified"
                        : fdaFoundAny
                            ? "uncertain"
                            : !fda
                                ? "uncertain"
                                : fdaNotEnoughIdentifiers
                                    ? "uncertain"
                                    : fdaSoftError
                                        ? "uncertain"
                                        : "not_found";

    const productKind = String(data.productClassification?.kind || "").trim();
    const productKindLabel =
        productKind === "human_drug"
            ? t("Human medicine", "دواء بشري")
            : productKind === "human_supplement"
                ? t("Human supplement", "مكمل غذائي بشري")
                : productKind === "veterinary_drug"
                    ? t("Veterinary medicine", "دواء بيطري")
                    : productKind === "veterinary_supplement"
                        ? t("Veterinary supplement", "مكمل غذائي بيطري")
                        : "";

    const analysisForAi = {
        drugName: data.drugName,
        drugNameEn: data.drugNameEn,
        genericName: data.genericName,
        genericNameEn: data.genericNameEn,
        manufacturer: data.manufacturer,
        form: data.form,
        strength: data.strength,
        activeIngredients: data.activeIngredients,
        activeIngredientsDetailed: (data as any)?.activeIngredientsDetailed,
        category: data.category,
        description: data.description,
        uses: data.uses,
        dosage: data.dosage,
        missedDose: data.missedDose,
        sideEffects: data.sideEffects,
        warnings: data.warnings,
        contraindications: data.contraindications,
        precautions: data.precautions,
        interactions: data.interactions,
        whenToSeekHelp: data.whenToSeekHelp,
        fda: (fda as any) || undefined,
    };

    type ActionTone = "danger" | "warn" | "info" | "success";
    type ActionCard = {
        id: string;
        tone: ActionTone;
        title: string;
        detail?: string;
        icon: ReactNode;
        cta?: { label: string; href: string };
    };

    const actionCards = useMemo(() => {
        const isUltra = plan === "ultra";
        const compactList = (list: unknown, max: number) => {
            if (!Array.isArray(list)) return "";
            return (list as any[])
                .map((s) => String(s || "").trim())
                .filter(Boolean)
                .slice(0, max)
                .join(" • ");
        };

        const items: ActionCard[] = [];

        // For Cosmetic Products: Provide specialized cosmetic safety & application checklists
        if (isCosmetic) {
            if (data.dosage) {
                items.push({
                    id: "cosmetic-dose",
                    tone: "info",
                    title: t("Application Protocol", "طريقة الاستخدام والتطبيق"),
                    detail: String(data.dosage || "").trim(),
                    icon: <Droplets className="w-4 h-4 text-white" />,
                });
            } else {
                items.push({
                    id: "cosmetic-apply",
                    tone: "info",
                    title: t("Application Protocol", "طريقة الاستخدام والتطبيق"),
                    detail: t(
                        "Apply an appropriate amount evenly to clean, dry skin/hair as directed.",
                        "يُطبّق كمية مناسبة بانتظام على بشرة أو شعر نظيف وجاف وفق الإرشادات."
                    ),
                    icon: <Droplets className="w-4 h-4 text-white" />,
                });
            }

            const cosmeticPrecautions = compactList(data.precautions || data.warnings, 2);
            items.push({
                id: "cosmetic-safety",
                tone: "warn",
                title: t("Topical Safety Guidance", "إرشادات الاستخدام الموضعي"),
                detail: cosmeticPrecautions || t(
                    "For external use only. Avoid contact with eyes and mucous membranes. Rinse with water if contact occurs.",
                    "للاستخدام الظاهري فقط. تجنب ملامسة العينين والأغشية المخاطية، واشطف بالماء فوراً عند الملامسة."
                ),
                icon: <ShieldAlert className="w-4 h-4 text-white" />,
            });

            items.push({
                id: "cosmetic-patch-test",
                tone: "info",
                title: t("Compatibility & Patch Test", "اختبار التوافق والحساسية"),
                detail: t(
                    "Recommended to perform a patch test on a small area of skin before regular application.",
                    "يُفضّل إجراء اختبار حساسية على جزء صغير من الجلد قبل الاستخدام المنتظم للتأكد من عدم التحسس."
                ),
                icon: <CheckCircle2 className="w-4 h-4 text-white" />,
            });

            if (data.storage) {
                items.push({
                    id: "cosmetic-storage",
                    tone: "info",
                    title: t("Storage & Protection", "حفظ وتخزين المستحضر"),
                    detail: String(data.storage || "").trim(),
                    icon: <Box className="w-4 h-4 text-white" />,
                });
            }

            return items.slice(0, 4);
        }

        // For Pharmaceutical Medications:
        const topGuard = (guardItems as any[])
            .filter((it) => it && it.otherMedication && it.severity !== "safe")
            .slice()
            .sort((a: any, b: any) => {
                const sevOrder = (s: any) => (String(s || "").toLowerCase() === "danger" ? 2 : String(s || "").toLowerCase() === "caution" ? 1 : 0);
                const bySeverity = sevOrder(b?.severity) - sevOrder(a?.severity);
                if (bySeverity !== 0) return bySeverity;
                return Number(b?.confidence || 0) - Number(a?.confidence || 0);
            })[0];

        if (topGuard?.otherMedication) {
            const sev = String(topGuard.severity || "caution").toLowerCase();
            items.push({
                id: "guard-top",
                tone: sev === "danger" ? "danger" : "warn",
                title: t(
                    `Possible interaction: ${String(topGuard.otherMedication)}`,
                    `تداخل محتمل: ${String(topGuard.otherMedication)}`
                ),
                detail: String(topGuard.summary || "").trim() || t("Tap Private Context for details.", "اضغط على سياقك الصحي الخاص للتفاصيل."),
                icon: <ShieldAlert className="w-4 h-4 text-white" />,
            });
        } else if (!isUltra) {
            items.push({
                id: "unlock-ultra-safety",
                tone: "info",
                title: t("Unlock Ultra Safety Pack", "افتح حزمة السلامة (ألترا)"),
                detail: t(
                    "Precautions, interactions, side effects, overdose guidance, and when to seek help.",
                    "احتياطات، تداخلات، آثار جانبية، إرشادات الجرعة الزائدة، ومتى تطلب المساعدة."
                ),
                icon: <Zap className="w-4 h-4 text-white" />,
                cta: { label: t("Upgrade", "ترقية"), href: "/pricing" },
            });
        }

        if (data.dosage) {
            items.push({
                id: "dose",
                tone: "info",
                title: t("How to take it", "طريقة الاستخدام"),
                detail: String(data.dosage || "").trim(),
                icon: <Thermometer className="w-4 h-4 text-white" />,
            });
        }

        const contraind = compactList(data.contraindications, 3);
        if (contraind) {
            items.push({
                id: "contraindications",
                tone: "danger",
                title: t("Avoid if any applies", "تجنّب إذا ينطبق عليك"),
                detail: contraind,
                icon: <AlertOctagon className="w-4 h-4 text-white" />,
            });
        }

        if (isUltra) {
            const seek = compactList(data.whenToSeekHelp, 3);
            if (seek) {
                items.push({
                    id: "seek-help",
                    tone: "danger",
                    title: t("Seek urgent help if", "اطلب مساعدة عاجلة إذا"),
                    detail: seek,
                    icon: <AlertTriangle className="w-4 h-4 text-white" />,
                });
            }
        }

        if (data.storage) {
            items.push({
                id: "storage",
                tone: "info",
                title: t("Storage", "الحفظ"),
                detail: String(data.storage || "").trim(),
                icon: <Box className="w-4 h-4 text-white" />,
            });
        }

        const productKind = String((data as any)?.productClassification?.kind || "").trim();
        if (productKind === "human_supplement" || productKind === "veterinary_drug" || productKind === "veterinary_supplement") {
            items.push({
                id: "product-kind",
                tone: "warn",
                title: t("Product type warning", "تنبيه نوع المنتج"),
                detail: t(
                    productKind === "human_supplement"
                        ? "This looks like a supplement; quality and interactions can vary."
                        : "This may be veterinary-related; confirm it is intended for humans.",
                    productKind === "human_supplement"
                        ? "يبدو كمكمّل غذائي؛ الجودة والتداخلات قد تختلف."
                        : "قد يكون بيطريًا؛ تأكد أنه مخصص للبشر."
                ),
                icon: <Info className="w-4 h-4 text-white" />,
            });
        }

        return items.slice(0, 5);
    }, [data, guardItems, isCosmetic, plan, t]);

    const actionToneUi = (tone: ActionTone) => {
        switch (tone) {
            case "danger":
                return {
                    card: "bg-red-500/5 hover:bg-red-500/10 border-red-500/20 shadow-sm",
                    icon: "bg-red-500/15 border border-red-500/25 text-red-300 shadow-sm",
                    title: "text-red-200",
                };
            case "warn":
                return {
                    card: "bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20 shadow-sm",
                    icon: "bg-amber-500/15 border border-amber-500/25 text-amber-300 shadow-sm",
                    title: "text-amber-200",
                };
            case "success":
                return {
                    card: "bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 shadow-sm",
                    icon: "bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 shadow-sm",
                    title: "text-emerald-200",
                };
            default:
                return {
                    card: "bg-white/[0.02] hover:bg-white/[0.04] border-white/10 shadow-sm",
                    icon: "bg-slate-800 border border-slate-700 text-cyan-300 shadow-sm",
                    title: "text-white",
                };
        }
    };

    const formatMg = (mg: number) => {
        const rounded = Math.round(mg * 10) / 10;
        return Number.isInteger(rounded) ? `${rounded} mg` : `${rounded.toFixed(1)} mg`;
    };

    const parseDoseFromText = (raw: string) => {
        const text = String(raw || "").trim();
        if (!text) return { name: "", doseText: "—", doseMg: undefined as number | undefined };

        const match = text.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|ug|g|ml|%|iu|units|unit)\b/i);
        if (!match) return { name: text, doseText: "—", doseMg: undefined as number | undefined };

        const value = Number(match[1]);
        const unit = String(match[2] || "");
        
        // Round to max 2 decimal places to keep it clean and correct, keeping the original unit
        const roundedValue = Math.round(value * 100) / 100;
        const doseText = `${roundedValue} ${unit}`;

        let mg = NaN;
        const unitLower = unit.toLowerCase();
        if (unitLower === "g") mg = value * 1000;
        else if (unitLower === "mg") mg = value;
        else if (unitLower === "mcg" || unitLower === "ug") mg = value / 1000;

        const doseMg = Number.isFinite(mg) ? mg : undefined;
        const cleanedName = text
            .replace(match[0], "")
            .replace(/[()،,:–—-]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        return {
            name: cleanedName || text,
            doseText,
            doseMg,
        };
    };

    const ingredientRows = useMemo(() => {
        // Smart normalization key for active pharmaceutical chemical stems
        const normalizeIngKey = (str: string) => {
            return String(str || "")
                .toLowerCase()
                .replace(/\b(hydrochloride|hcl|maleate|sodium|potassium|hydrate|anhydrous|monohydrate|sulfate|phosphate|ماليات|هيدروكلوريد|صوديوم|بوتاسيوم)\b/g, "")
                .replace(/[\d.,%/\s–—-]+/g, "")
                .trim();
        };

        const seenKeys = new Set<string>();
        const rows: Array<{ name: string; doseText: string; doseMg?: number; source: "scan" | "fda" }> = [];

        // 1. Direct active ingredients from AI scan (detailed)
        if (Array.isArray((data as any)?.activeIngredientsDetailed) && (data as any).activeIngredientsDetailed.length > 0) {
            for (let idx = 0; idx < (data as any).activeIngredientsDetailed.length; idx++) {
                const it = (data as any).activeIngredientsDetailed[idx];
                let name = String(it?.name || "").trim();
                if (isArabic) {
                    if (it?.nameAr) {
                        name = String(it.nameAr).trim();
                    } else if (Array.isArray(data.activeIngredients) && data.activeIngredients[idx]) {
                        const parsedAr = parseDoseFromText(String(data.activeIngredients[idx]));
                        if (parsedAr.name && /[\u0600-\u06FF]/.test(parsedAr.name)) {
                            name = parsedAr.name;
                        }
                    }
                }
                if (!name) continue;
                const key = normalizeIngKey(name);
                if (key && seenKeys.has(key)) continue;
                if (key) seenKeys.add(key);

                let strength = String(it?.strength || "").trim().replace(/\/1\b/g, "").trim();
                const strengthMg = typeof it?.strengthMg === "number" ? it.strengthMg : undefined;
                const doseText = strength || (strengthMg !== undefined ? formatMg(strengthMg) : "—");
                rows.push({ name, doseText, doseMg: strengthMg, source: "scan" });
            }
            if (rows.length > 0) return rows;
        }

        // 2. Active ingredients array from AI analysis
        const list = Array.isArray(data.activeIngredients) ? data.activeIngredients : [];
        const listEn = Array.isArray(data.activeIngredientsEn) ? data.activeIngredientsEn : [];
        if (list.length > 0) {
            for (let idx = 0; idx < list.length; idx++) {
                const raw = list[idx];
                const parsed = parseDoseFromText(String(raw || ""));
                if (!parsed.name) continue;

                let displayName = parsed.name;
                if (!isArabic && listEn[idx]) {
                    const parsedEn = parseDoseFromText(String(listEn[idx]));
                    if (parsedEn.name) {
                        displayName = parsedEn.name;
                    }
                } else if (isArabic && !/[\u0600-\u06FF]/.test(displayName) && list[idx]) {
                    displayName = parsed.name;
                }

                const key = normalizeIngKey(displayName);
                if (key && seenKeys.has(key)) continue;
                if (key) seenKeys.add(key);

                const doseText = String(parsed.doseText || "—").replace(/\/1\b/g, "").trim();
                rows.push({ name: displayName, doseText, doseMg: parsed.doseMg, source: "scan" });
            }
            if (rows.length > 0) return rows;
        }

        // 3. Fallback to FDA NDC only if activeIngredients was empty
        const ndcIngredients = (fda as any)?.ndc?.activeIngredients;
        if (fdaFeatureEnabled && Array.isArray(ndcIngredients) && ndcIngredients.length > 0) {
            for (const it of ndcIngredients as any[]) {
                const name = String(it?.name || "").trim();
                if (!name) continue;
                const key = normalizeIngKey(name);
                if (key && seenKeys.has(key)) continue;
                if (key) seenKeys.add(key);

                let strength = String(it?.strength || "").trim().replace(/\/1\b/g, "").trim();
                const strengthMg = typeof it?.strengthMg === "number" ? it.strengthMg : undefined;
                const doseText = strength || (strengthMg !== undefined ? formatMg(strengthMg) : "—");
                rows.push({ name, doseText, doseMg: strengthMg, source: "fda" });
            }
            if (rows.length > 0) return rows;
        }

        return [];
    }, [data.activeIngredients, data.activeIngredientsEn, (data as any)?.activeIngredientsDetailed, fda, fdaFeatureEnabled, isArabic]);

    const askAi = async (params: { preset?: "alternative" | "personalized" | "history"; question?: string; reset?: boolean }) => {
        if (!user) {
            setAiError(t("Login required.", "يجب تسجيل الدخول."));
            return;
        }
        if (plan !== "ultra") {
            setAiError(t("Ultra plan required.", "يلزم الاشتراك ألترا."));
            return;
        }
        const effectiveProfileId = String(meta?.subjectProfileId || (interactionGuard as any)?.subject?.profileId || "").trim() || undefined;
        setAiError(null);
        setAiLoading(true);
        
        const getPresetLabelText = (pr?: string) => {
            if (pr === "alternative") return t("Suggest potential alternatives for this medication", "اقترح بدائل محتملة لهذا الدواء");
            if (pr === "personalized") return t("Analyze compatibility with my profile", "حلّل مدى التوافق مع حالتي الصحية");
            if (pr === "history") return t("Cross-check with my medication history", "طابق هذا الدواء مع سجلي الدوائي");
            return t("Ask AI", "اسأل المعالج الذكي");
        };
        setPendingUserQuestion(params.question || getPresetLabelText(params.preset));

        try {
            const res = await fetch("/api/ai/tree", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    preset: params.preset,
                    question: params.question,
                    profileId: effectiveProfileId,
                    language: resultsLanguage,
                    analysis: analysisForAi,
                    path: (params.reset ? [] : aiNodes).map((n) => ({ title: n.title, answer: n.answer })),
                    userProfile: profile ? {
                        age: profile.age,
                        gender: profile.gender,
                        weight: profile.weight,
                        height: profile.height,
                        username: profile.username
                    } : undefined
                }),
            });

            const payload = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(payload?.error || "AI request failed");
            }

            const getPresetLabel = (pr?: string) => {
                if (pr === "alternative") return t("Suggest potential alternatives for this medication", "اقترح بدائل محتملة لهذا الدواء");
                if (pr === "personalized") return t("Analyze compatibility with my profile", "حلّل مدى التوافق مع حالتي الصحية");
                if (pr === "history") return t("Cross-check with my medication history", "طابق هذا الدواء مع سجلي الدوائي");
                return t("Ask AI", "اسأل المعالج الذكي");
            };

            const nextNode: AiTreeNode = {
                title: String(payload?.title || t("AI Answer", "إجابة الذكاء الاصطناعي")),
                summary: String(payload?.summary || "").trim() || undefined,
                answer: String(payload?.answer || ""),
                keyPoints: Array.isArray(payload?.keyPoints) ? payload.keyPoints : [],
                nextQuestions: Array.isArray(payload?.nextQuestions) ? payload.nextQuestions : [],
                userQuestion: params.question || getPresetLabel(params.preset),
            };

            setAiNodes((prev) => (params.reset ? [nextNode] : [...prev, nextNode]));

            const next = (nextNode.nextQuestions || [])
                .map((q: any, idx: number) => ({
                    id: String(q?.id || `q${idx + 1}`),
                    label: String(q?.title || "").trim() || t("Question", "سؤال"),
                    question: String(q?.question || "").trim(),
                }))
                .filter((q: any) => q.question)
                .slice(0, 4);

            if (next.length > 0) setAiSuggestions(next);
        } catch (e: any) {
            setAiError(e?.message || "Failed to get AI answer.");
        } finally {
            setAiLoading(false);
            setPendingUserQuestion(null);
        }
    };

    const askAiAbout = (topic: string, question: string = "", sectionTitle: string = "") => {
        const formattedTopic = sectionTitle ? `${sectionTitle}: ${topic}` : topic;
        const smartPayload = {
            medication: {
                id: (data as any).id || `med-${Date.now()}`,
                drug_name: displayDrugName,
                drugName: displayDrugName,
                drugNameEn: data.drugNameEn,
                generic_name: displayGenericName,
                genericName: displayGenericName,
                form: data.form,
                strength: data.strength,
                active_ingredients: data.activeIngredients,
                activeIngredients: data.activeIngredients,
                indications: data.uses,
                dosage: data.dosage,
                warnings: data.warnings,
                contraindications: data.contraindications,
                precautions: data.precautions,
                interactions: data.interactions,
                side_effects: data.sideEffects,
                category: data.category || data.productCategory,
                analysis_json: analysisForAi,
                focusedTopic: formattedTopic,
            },
            topic: formattedTopic,
            sectionTitle: sectionTitle,
            isNewChat: true,
            source: "medical_result_card",
            timestamp: Date.now(),
        };

        try {
            sessionStorage.setItem("qure_ai_active_context", JSON.stringify(smartPayload));
        } catch (e) {
            console.warn("Could not save AI context to sessionStorage:", e);
        }

        // Direct user to regular Qure AI page starting a new conversation with context bound in background
        const queryParams = new URLSearchParams({
            topic: formattedTopic,
            newChat: "1",
        });

        router.push(`/ai?${queryParams.toString()}`);
    };

    const LiquidGlassAiButton = ({
        topic,
        question: _question,
        title,
        sectionTitle,
        size = "md",
    }: {
        topic: string;
        question?: string;
        title?: string;
        sectionTitle?: string;
        size?: "sm" | "md";
    }) => {
        return (
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    askAiAbout(topic, "", sectionTitle || "");
                }}
                className={cn(
                    "group/ai-btn relative inline-flex items-center justify-center rounded-xl transition-all duration-300 active:scale-95 cursor-pointer shrink-0 select-none",
                    "bg-gradient-to-b from-white/[0.1] to-white/[0.03] hover:from-cyan-500/25 hover:to-blue-500/20",
                    "border border-white/20 hover:border-cyan-400/50",
                    "shadow-[0_2px_8px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:shadow-[0_0_14px_rgba(6,182,212,0.35)]",
                    "backdrop-blur-md text-cyan-300 hover:text-white",
                    size === "sm" ? "p-1.5" : "p-1.5 sm:px-2.5 sm:py-1 gap-1.5"
                )}
                title={title || (isArabic ? `استشارة سريرية ذكية مع Qure AI حول ${sectionTitle ? `${sectionTitle}: ` : ""}${topic}` : `Ask Qure AI about ${topic}`)}
            >
                <Sparkles className={cn("shrink-0 transition-transform duration-300 group-hover/ai-btn:scale-110 group-hover/ai-btn:rotate-12", size === "sm" ? "w-3 h-3 text-cyan-300" : "w-3.5 h-3.5 text-cyan-300")} />
                {size !== "sm" && (
                    <span className="hidden sm:inline text-[10px] font-bold tracking-tight text-cyan-200/90 group-hover/ai-btn:text-white">
                        {isArabic ? "اسأل AI" : "Ask AI"}
                    </span>
                )}
            </button>
        );
    };

    // Copy answer to clipboard
    const copyAnswer = async (nodeIdx: number, text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedNodeIdx(nodeIdx);
            setTimeout(() => setCopiedNodeIdx(null), 2000);
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopiedNodeIdx(nodeIdx);
            setTimeout(() => setCopiedNodeIdx(null), 2000);
        }
    };

    // Toggle save answer (bookmark)
    const toggleSaveAnswer = (nodeIdx: number) => {
        setSavedAnswers(prev =>
            prev.includes(nodeIdx)
                ? prev.filter(i => i !== nodeIdx)
                : [...prev, nodeIdx]
        );
    };

    // Submit custom question
    const submitCustomQuestion = () => {
        const trimmed = customQuestion.trim();
        if (!trimmed || aiLoading) return;
        askAi({ question: trimmed, reset: aiNodes.length === 0 });
        setCustomQuestion('');
    };

    // Handle keyboard submit
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitCustomQuestion();
        }
    };

    // Voice input (Web Speech API)
    const toggleVoiceInput = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setAiError(t("Voice input not supported in this browser.", "الإدخال الصوتي غير مدعوم في هذا المتصفح."));
            return;
        }

        if (isListening) {
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = resultsLanguage === 'ar' ? 'ar-SA' : 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => {
            setIsListening(false);
            setAiError(t("Voice input failed. Try again.", "فشل الإدخال الصوتي. حاول مجدداً."));
        };
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setCustomQuestion(prev => prev + (prev ? ' ' : '') + transcript);
            aiInputRef.current?.focus();
        };

        recognition.start();
    };

    const fallbackSuggestions = useMemo(() => [
        { id: "s1", label: t("Side effects?", "الآثار الجانبية؟"), question: t("What are the common and serious side effects I should watch for?", "ما هي الآثار الجانبية الشائعة والخطيرة التي يجب مراقبتها؟") },
        { id: "s2", label: t("Dosage timing", "توقيت الجرعة"), question: t("When is the best time to take this medication?", "ما هو أفضل وقت لتناول هذا الدواء؟") },
        { id: "s3", label: t("Food interactions", "تفاعل مع الطعام"), question: t("Should I take this with food or on an empty stomach?", "هل يجب تناوله مع الطعام أم على معدة فارغة؟") },
        { id: "s4", label: t("Pregnancy safe?", "آمن للحامل؟"), question: t("Is this medication safe during pregnancy or breastfeeding?", "هل هذا الدواء آمن أثناء الحمل أو الرضاعة؟") },
    ], [t]);

    const [aiSuggestions, setAiSuggestions] = useState<Array<{ id: string; label: string; question: string }>>([]);
    const [aiSuggestionsKey, setAiSuggestionsKey] = useState<string>("");

    const suggestionChips = aiSuggestions.length > 0 ? aiSuggestions : fallbackSuggestions;

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            if (!user || plan !== "ultra") return;
            const subjectId = String(meta?.subjectProfileId || (interactionGuard as any)?.subject?.profileId || user.id).trim() || user.id;
            const key = `${subjectId}:${resultsLanguage}:${String(data?.drugName || "").trim()}`;
            if (key && key === aiSuggestionsKey && aiSuggestions.length > 0) return;

            setAiSuggestionsKey(key);

            try {
                const res = await fetch("/api/ai/tree", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        preset: "suggestions",
                        profileId: subjectId,
                        language: resultsLanguage,
                        analysis: analysisForAi,
                        path: [],
                    }),
                });
                const payload = await res.json().catch(() => ({}));
                if (!res.ok) return;

                const nextQuestions = Array.isArray(payload?.nextQuestions) ? payload.nextQuestions : [];
                const next = nextQuestions
                    .map((q: any, idx: number) => ({
                        id: String(q?.id || `q${idx + 1}`),
                        label: String(q?.title || "").trim() || t("Question", "سؤال"),
                        question: String(q?.question || "").trim(),
                    }))
                    .filter((q: any) => q.question)
                    .slice(0, 4);

                if (!cancelled && next.length > 0) setAiSuggestions(next);
            } catch {
                // ignore
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [aiSuggestions.length, aiSuggestionsKey, analysisForAi, data?.drugName, interactionGuard, meta?.subjectProfileId, plan, resultsLanguage, t, user]);


    if (data.error) {
        return (
            <GlassCard className="p-8 border-red-500/30 bg-red-500/10">
                <div className="flex flex-col items-center text-center gap-4">
                    <AlertTriangle className="w-12 h-12 text-red-400" />
                    <h3 className="text-xl font-bold text-white">Analysis Failed</h3>
                    <p className="text-white/60">{data.error}</p>
                </div>
            </GlassCard>
        );
    }


    const renderOverview = () => {
        return (
            <div className="space-y-6 p-3.5 sm:p-8">
                {/* Smart Merged Record Notification Banner */}
                {(meta?.isMergedRecord || (meta?.scanCount && meta.scanCount > 1)) && (
                    <div className="p-4 rounded-2xl border border-white/10 bg-slate-900/90 backdrop-blur-xl flex items-center justify-between gap-3 shadow-md animate-fade-in">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-300 shrink-0">
                                <RotateCcw className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                                    <span>{isArabic ? "تم التعرّف على الدواء في سجلك — تم تحديث البيانات" : "Recognized Medication — Record Merged & Enhanced!"}</span>
                                </p>
                                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                                    {isArabic
                                        ? `لم يتم تكرار السجل! تم دمج التفاصيل الجديدة وتحديث هذا الدواء تلقائياً (الفحص رقم ${meta?.scanCount || 2}).`
                                        : `No duplicates created! Enhanced history record & details merged automatically (Scan #${meta?.scanCount || 2}).`}
                                </p>
                            </div>
                        </div>
                        <span className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono font-bold shrink-0">
                            {isArabic ? `فحص ×${meta?.scanCount || 2}` : `Scanned ×${meta?.scanCount || 2}`}
                        </span>
                    </div>
                )}

                {/* Description */}
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md hover:border-white/20 transition-all duration-200 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-cyan-300">
                                <Info className="w-5 h-5 shrink-0" />
                            </div>
                            <p className="text-slate-300 leading-relaxed text-sm">
                                {data.description}
                            </p>
                        </div>
                        <VoiceReaderButton 
                            text={`${data.drugName || ''}. ${data.activeIngredients ? (isArabic ? 'المكونات الفعالة: ' : 'Active ingredients: ') + data.activeIngredients : ''}. ${data.description || ''}. ${t('Dosage:', 'الجرعة:')} ${data.dosage || ''}. ${data.warnings ? (isArabic ? 'تنبيه هام: ' : 'Warning: ') + data.warnings : ''}`} 
                            lang={resultsLanguage} 
                            size="sm" 
                        />
                    </div>
                    {scannedImage && typeof scannedImage === "string" && (scannedImage.startsWith("data:") || scannedImage.startsWith("blob:") || scannedImage.startsWith("http")) ? (
                        <div className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-slate-950/60 p-2.5 transition-all duration-500 hover:border-cyan-500/30 group">
                            <div className="relative rounded-lg overflow-hidden flex items-center justify-center bg-black/30 border border-white/5 shadow-inner">
                                <img
                                    src={scannedImage}
                                    alt={data.drugNameEn || data.drugName || "Scanned Medication"}
                                    className="max-h-[280px] sm:max-h-[380px] w-auto h-auto object-contain transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-350 flex items-end p-3.5">
                                    <p className="text-[10px] text-cyan-300 font-bold tracking-wider uppercase flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                                        {t("Scanned Medication Image", "صورة الدواء الملتقطة")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <AdUnit />
                    )}
                </div>

                {/* Quick Checklist */}
                {actionCards.length > 0 && (
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-lg">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <div className="flex items-center gap-2 text-white/80 text-sm font-semibold">
                                <ListTodo className="w-4 h-4 text-cyan-300 animate-pulse" />
                                <span className="text-white font-bold">{t("Quick Action Checklist", "قائمة سريعة لما يجب فعله")}</span>
                            </div>
                            {fdaConfirmedLabel && (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-medium flex items-center gap-1">
                                    <Database className="w-3 h-3" /> {t("Backed by FDA label", "مدعوم ببيانات FDA")}
                                </span>
                            )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            {actionCards.map((item) => {
                                const ui = actionToneUi(item.tone);
                                return (
                                    <div key={item.id} className={cn("p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.01] hover:shadow-md", ui.card)}>
                                        <div className="flex items-start gap-3">
                                            <div className={cn("shrink-0 p-2.5 rounded-xl", ui.icon)}>
                                                {item.icon}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className={cn("text-sm leading-snug", ui.title)}>{item.title}</p>
                                                {item.detail && (
                                                    <p className="mt-1 text-white/70 text-xs leading-relaxed">
                                                        {item.detail}
                                                    </p>
                                                )}
                                                {item.cta && (
                                                    <div className="mt-3">
                                                        <Button href={item.cta.href} size="sm" className="h-9 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold border-0 shadow-sm transition-all duration-200">
                                                            {item.cta.label}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Active Ingredients (Responsive grid/table) */}
                {ingredientRows.length > 0 && (
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-lg">
                        <div className="flex items-center justify-between gap-3 text-white/70 text-sm font-semibold mb-4">
                            <div className="flex items-center gap-2 text-cyan-300 font-bold">
                                <FileText className="w-5 h-5" />
                                {t('Active Ingredients', 'المواد الفعالة')}
                            </div>
                            {ingredientRows[0]?.source === "scan" ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-medium flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" /> {t("Verified Package Composition", "تركيبة العبوة المعتمدة")}
                                </span>
                            ) : fdaFeatureEnabled && ingredientRows[0]?.source === "fda" ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-medium flex items-center gap-1">
                                    <Database className="w-3 h-3" /> {t("From FDA (NDC)", "من FDA (NDC)")}
                                </span>
                            ) : null}
                        </div>

                        {/* Desktop View */}
                        <div className="hidden md:block overflow-hidden rounded-xl border border-white/10 bg-black/20">
                            <table className={cn("w-full text-sm table-fixed", isArabic ? "text-right" : "text-left")}>
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-4 py-2.5 text-white/60 font-semibold w-12 text-center">#</th>
                                        <th className={cn("px-4 py-2.5 text-white/60 font-semibold", isArabic ? "text-right" : "text-left")}>{t("Ingredient", "المادة الفعالة")}</th>
                                        <th className="px-4 py-2.5 text-white/60 font-semibold w-36 text-center">{t("Dose", "الجرعة")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(showAllIngredients ? ingredientRows : ingredientRows.slice(0, 10)).map((row, i) => (
                                        <tr key={i} className="border-t border-white/10 hover:bg-white/[0.02] transition-colors">
                                            <td className="px-4 py-3 text-white/50 font-mono tabular-nums text-center">{i + 1}</td>
                                            <td className="px-4 py-3 text-white/80 font-medium leading-relaxed break-words">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="truncate" dir="auto">{row.name}</span>
                                                    <LiquidGlassAiButton
                                                        topic={row.name}
                                                        sectionTitle={t("Active Ingredient", "المادة الفعالة")}
                                                        question={t(
                                                            `What is the medical role of ${row.name} in ${data.drugName}? Explain its mechanism, purpose, and precautions.`,
                                                            `ما هو الدور الطبي للمادة الفعالة ${row.name} في دواء ${data.drugName}؟ اشرح آليتها، الغرض منها، والاحتياطات الخاصة بها.`
                                                        )}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-white/70 font-mono tabular-nums text-center">
                                                <bdi dir="ltr" className="inline-block px-2 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-300 font-bold">{row.doseText}</bdi>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile View - Beautiful space-saving 2-column Grid */}
                        <div className="md:hidden grid grid-cols-2 gap-2.5">
                            {(showAllIngredients ? ingredientRows : ingredientRows.slice(0, 6)).map((row, i) => (
                                <div key={i} className="p-3 rounded-xl border border-white/5 bg-slate-900/40 flex flex-col justify-between gap-2 hover:border-cyan-500/20 transition-all duration-300 relative group">
                                    <div className="min-w-0">
                                        <div className="flex items-center justify-between gap-1">
                                            <p className="text-[9px] text-white/35 font-bold uppercase tracking-wider">{t(`Active #${i+1}`, `مادة #${i+1}`)}</p>
                                            <LiquidGlassAiButton
                                                topic={row.name}
                                                sectionTitle={t("Active Ingredient", "المادة الفعالة")}
                                                question={t(
                                                    `What is the medical role of ${row.name} in ${data.drugName}? Explain its mechanism, purpose, and precautions.`,
                                                    `ما هو الدور الطبي للمادة الفعالة ${row.name} في دواء ${data.drugName}؟ اشرح آليتها، الغرض منها، والاحتياطات الخاصة بها.`
                                                )}
                                                size="sm"
                                            />
                                        </div>
                                        <p className="text-white font-semibold text-xs mt-0.5 line-clamp-2 leading-tight" title={row.name} dir="auto">{row.name}</p>
                                    </div>
                                    <div className="w-max px-2.5 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold">
                                        <bdi dir="ltr">{row.doseText}</bdi>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {ingredientRows.length > 6 && (
                            <div className="flex items-center justify-between gap-3 mt-3.5 px-1">
                                <p className="text-xs text-white/45">
                                    {t(`${ingredientRows.length} ingredients detected`, `تم رصد ${ingredientRows.length} مادة`)}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowAllIngredients((v) => !v)}
                                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:underline"
                                >
                                    {showAllIngredients ? t("Show less", "عرض أقل") : t("Show all", "عرض الكل")}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Primary Uses & Dosage (Layout Grid) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Uses */}
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-lg">
                        <div className="flex items-center gap-2 mb-4 text-cyan-300">
                            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                                <Activity className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-white text-base sm:text-lg">{t('Indication & Uses', 'الاستخدامات')}</h3>
                        </div>
                        <ul className="grid gap-2">
                            {(data.uses || []).map((use, i) => (
                                <li key={i} className="flex items-start justify-between gap-2.5 p-3 rounded-xl bg-white/[0.01] border border-white/5 transition-all duration-200 hover:bg-white/[0.03]">
                                    <div className="flex items-start gap-2.5">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                                        <span className="text-white/80 text-sm leading-relaxed">{use}</span>
                                    </div>
                                    <LiquidGlassAiButton
                                        topic={use}
                                        sectionTitle={t("Indication & Uses", "دواعي الاستعمال")}
                                        question={t(
                                            `How does ${data.drugName} treat or support: "${use}"? What is the expected timeframe for relief?`,
                                            `كيف يعالج أو يساعد دواء ${data.drugName} في حالة: "${use}"؟ وما هو الإطار الزمني المتوقع للتحسن؟`
                                        )}
                                    />
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Dosage */}
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl space-y-4 shadow-lg">
                        <div>
                            <div className="flex items-center gap-2 mb-3 text-blue-400">
                                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300">
                                    <Thermometer className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-white text-base sm:text-lg">{t('Standard Dosage', 'الجرعة المعتادة')}</h3>
                            </div>
                            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/15 text-blue-100 text-sm leading-relaxed flex items-start justify-between gap-3">
                                <span>{data.dosage || t("Consult a doctor for precise dosage.", "استشر الطبيب لمعرفة الجرعة الدقيقة.")}</span>
                                {data.dosage && (
                                    <LiquidGlassAiButton
                                        topic={t("Standard Dosage", "الجرعة المعتادة")}
                                        sectionTitle={t("Dosage Details", "تفاصيل الجرعة")}
                                        question={t(
                                            `Please explain the dosage instructions for ${data.drugName}: "${data.dosage}". Are there custom adjustments for liver/kidney/elderly?`,
                                            `يرجى شرح تعليمات جرعة دواء ${data.drugName}: "${data.dosage}". وهل هناك تعديلات مخصصة لمرضى الكبد/الكلى أو كبار السن؟`
                                        )}
                                    />
                                )}
                            </div>
                        </div>

                        {data.missedDose && (
                            <div>
                                <div className="flex items-center gap-2 mb-3 text-slate-300">
                                    <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-bold text-white text-sm sm:text-base">{t('Missed Dose', 'نسيان الجرعة')}</h3>
                                </div>
                                <div className="p-3.5 rounded-xl bg-white/[0.01] border border-white/5 text-white/70 text-xs sm:text-sm leading-relaxed">
                                    {data.missedDose}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderSafety = () => {
        return (
            <div className="space-y-6 p-3.5 sm:p-8">
                {/* Warnings & Contraindications Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Critical Warnings */}
                    <div className="p-5 rounded-2xl bg-red-950/10 border border-red-500/20 backdrop-blur-xl">
                        <div className="flex items-center gap-2 mb-4 text-red-400 font-bold">
                            <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
                            <h3 className="text-white text-base sm:text-lg">{t('Safety Warnings', 'تحذيرات السلامة')}</h3>
                        </div>
                        {(data.warnings && data.warnings.length > 0) ? (
                            <ul className="space-y-2.5">
                                {data.warnings.map((w, i) => (
                                    <li key={i} className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 group">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                            <span className="text-red-100/90 text-sm leading-relaxed">{w}</span>
                                        </div>
                                        <LiquidGlassAiButton
                                            topic={w}
                                            sectionTitle={t("Warning", "تحذير سريري")}
                                            question={t(
                                                `Why is "${w}" a warning for ${data.drugName}? Explain the potential risks and what precautions to take.`,
                                                `لماذا يعتبر "${w}" تحذيراً لدواء ${data.drugName}؟ اشرح المخاطر المحتملة والاحتياطات الواجب اتخاذها.`
                                            )}
                                        />
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-white/40 text-sm italic">{t("No specific critical warnings listed.", "لا توجد تحذيرات حرجة محددة.")}</p>
                        )}
                    </div>

                    {/* Contraindications */}
                    <div className="p-5 rounded-2xl bg-orange-950/10 border border-orange-500/20 backdrop-blur-xl">
                        <div className="flex items-center gap-2 mb-4 text-orange-400 font-bold">
                            <AlertOctagon className="w-5 h-5 text-orange-400" />
                            <h3 className="text-white text-base sm:text-lg">{t('Contraindications', 'موانع الاستعمال')}</h3>
                        </div>
                        {(data.contraindications && data.contraindications.length > 0) ? (
                            <ul className="space-y-2.5">
                                {data.contraindications.map((c, i) => (
                                    <li key={i} className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 group">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                                            <span className="text-orange-100/90 text-sm leading-relaxed">{c}</span>
                                        </div>
                                        <LiquidGlassAiButton
                                            topic={c}
                                            sectionTitle={t("Contraindication", "مانع استعمال")}
                                            question={t(
                                                `Why is "${c}" a contraindication for ${data.drugName}? What are the biological reasons or interactions?`,
                                                `لماذا يمنع استعمال دواء ${data.drugName} في حالة: "${c}"؟ ما هي الأسباب البيولوجية أو التداخلات؟`
                                            )}
                                        />
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-white/40 text-sm italic">{t("No contraindications listed.", "لا توجد موانع استعمال مذكورة.")}</p>
                        )}
                    </div>
                </div>

                {/* Advanced Safety Pack */}
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-2 text-cyan-300 font-bold">
                            <Brain className="w-5 h-5 text-cyan-300" />
                            <h3 className="text-white text-base sm:text-lg">{t('Advanced Safety Pack', 'حزمة الأمان المتقدمة')}</h3>
                        </div>
                        {plan !== 'ultra' && (
                            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold flex items-center gap-1 uppercase tracking-wider">
                                <Lock className="w-3 h-3" /> {t("Ultra", "ألترا")}
                            </span>
                        )}
                    </div>

                    {plan !== 'ultra' ? (
                        <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/5">
                            <div className="p-5 blur-[2px] opacity-40 pointer-events-none select-none">
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {[t('Precautions', 'احتياطات'), t('Interactions', 'التداخلات'), t('Side effects', 'الآثار الجانبية'), t('Overdose', 'الجرعة الزائدة')].map((label, i) => (
                                        <span key={i} className="px-3 py-1.5 rounded-full text-xs border border-white/10 bg-black/20 text-white/50">{label}</span>
                                    ))}
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                                        <p className="text-white/80 font-bold text-sm">Example Interaction Risk</p>
                                        <p className="text-white/50 text-xs mt-1">May interact with blood thinners.</p>
                                    </div>
                                    <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                                        <p className="text-white/80 font-bold text-sm">Red Flag Symptoms</p>
                                        <p className="text-white/50 text-xs mt-1">Fainting or severe breathing issues.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center p-4 backdrop-blur-[1px]">
                                <div className="w-full max-w-sm p-5 rounded-2xl bg-slate-950/90 border border-white/10 shadow-2xl text-center">
                                    <Lock className="w-8 h-8 text-amber-300 mx-auto mb-3" />
                                    <p className="text-white font-bold text-base">{t("Unlock Advanced Safety details", "افتح تفاصيل الأمان المتقدمة")}</p>
                                    <p className="text-white/60 text-xs mt-1.5 leading-relaxed">
                                        {t("Upgrade to get personalized precautions, drug-food interactions, side effects, and warning signs.", "قم بالترقية للحصول على الاحتياطات، التداخلات، الآثار الجانبية، وعلامات الخطر.")}
                                    </p>
                                    <div className="mt-4 flex justify-center gap-2">
                                        {!user ? (
                                            <Button href="/login" size="sm">{t("Log in", "تسجيل الدخول")}</Button>
                                        ) : (
                                            <Button href="/pricing" size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold border-0">
                                                {t("Upgrade to Ultra", "ترقية إلى ألترا")}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
                            <div className="relative w-full border-b border-white/10 bg-white/[0.02]">
                                <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-slate-950 via-slate-950/10 to-transparent pointer-events-none md:hidden z-10" />
                                <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-slate-950 via-slate-950/10 to-transparent pointer-events-none md:hidden z-10" />
                                <div className="p-2.5 overflow-x-auto flex-nowrap flex gap-1.5 scrollbar-none">
                                    {[
                                        { id: 'precautions', label: t('Precautions', 'احتياطات'), active: safetyTab === 'precautions' },
                                        { id: 'interactions', label: t('Drug Interactions', 'التداخلات الدوائية'), active: safetyTab === 'interactions' },
                                        { id: 'sideEffects', label: t('Common Side Effects', 'الآثار الجانبية'), active: safetyTab === 'sideEffects' },
                                        { id: 'overdose', label: t('Overdose', 'الجرعة الزائدة'), active: safetyTab === 'overdose' },
                                        { id: 'seekHelp', label: t('When to seek help', 'متى تطلب المساعدة'), active: safetyTab === 'seekHelp' },
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setSafetyTab(tab.id as any)}
                                            className={cn(
                                                "px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 shrink-0",
                                                tab.active 
                                                    ? "bg-amber-500/15 border-amber-500/35 text-amber-200" 
                                                    : "bg-black/10 border-transparent text-slate-400 hover:text-white hover:bg-white/[0.04]"
                                            )}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-5">
                                {safetyTab === 'precautions' && (
                                    <div>
                                        <div className="flex items-center justify-between gap-3 mb-3">
                                            <p className="text-white font-bold text-sm">{t('Precautions', 'الاحتياطات اللازمة')}</p>
                                            {(data.precautions?.length || 0) > 6 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSafetyShowAll((p) => ({ ...p, precautions: !p.precautions }))}
                                                    className="text-xs text-cyan-400 hover:underline font-semibold"
                                                >
                                                    {safetyShowAll.precautions ? t('Show less', 'عرض أقل') : t('Show all', 'عرض الكل')}
                                                </button>
                                            )}
                                        </div>
                                        {(data.precautions && data.precautions.length > 0) ? (
                                            <ul className="grid gap-2.5 md:grid-cols-2">
                                                {(safetyShowAll.precautions ? data.precautions : data.precautions.slice(0, 6)).map((p, i) => (
                                                    <li key={i} className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/10 group">
                                                        <div className="flex items-start gap-3">
                                                            <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                                                            <span className="text-white/80 text-sm leading-relaxed">{p}</span>
                                                        </div>
                                                        <LiquidGlassAiButton
                                                            topic={p}
                                                            sectionTitle={t("Precaution", "احتياط وقائي")}
                                                            question={t(
                                                                `What precautions should I take regarding "${p}" when using ${data.drugName}? Explain the details.`,
                                                                `ما هي الاحتياطات التي يجب أن أتخذها بخصوص "${p}" عند استخدام ${data.drugName}؟ اشرح التفاصيل.`
                                                            )}
                                                        />
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-white/40 text-sm italic">{t("No precautions listed.", "لا توجد احتياطات مذكورة.")}</p>
                                        )}
                                    </div>
                                )}

                                {safetyTab === 'interactions' && (
                                    <div>
                                        <div className="flex items-center justify-between gap-3 mb-3">
                                            <p className="text-white font-bold text-sm">{t('Drug Interactions', 'التداخلات الدوائية المعروفة')}</p>
                                            {(data.interactions?.length || 0) > 10 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSafetyShowAll((p) => ({ ...p, interactions: !p.interactions }))}
                                                    className="text-xs text-cyan-400 hover:underline font-semibold"
                                                >
                                                    {safetyShowAll.interactions ? t('Show less', 'عرض أقل') : t('Show all', 'عرض الكل')}
                                                </button>
                                            )}
                                        </div>
                                        {(data.interactions && data.interactions.length > 0) ? (
                                            <div className="flex flex-wrap gap-2">
                                                {(safetyShowAll.interactions ? data.interactions : data.interactions.slice(0, 10)).map((interaction, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-200 text-xs font-semibold"
                                                    >
                                                        <span>{interaction}</span>
                                                        <LiquidGlassAiButton
                                                            topic={interaction}
                                                            sectionTitle={t("Drug Interaction", "تداخل دوائي")}
                                                            question={t(
                                                                `Explain the drug-drug or drug-food interaction between ${data.drugName} and "${interaction}". What are the risks and recommendations?`,
                                                                `اشرح التداخل الدوائي أو الغذائي بين ${data.drugName} و"${interaction}". ما هي المخاطر والتوصيات؟`
                                                            )}
                                                            size="sm"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-white/40 text-sm italic">{t("No interactions listed.", "لا توجد تداخلات مذكورة.")}</p>
                                        )}
                                    </div>
                                )}

                                {safetyTab === 'sideEffects' && (
                                    <div>
                                        <div className="flex items-center justify-between gap-3 mb-3">
                                            <p className="text-white font-bold text-sm">{t('Common Side Effects', 'الآثار الجانبية الشائعة')}</p>
                                            {(data.sideEffects?.length || 0) > 8 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSafetyShowAll((p) => ({ ...p, sideEffects: !p.sideEffects }))}
                                                    className="text-xs text-cyan-400 hover:underline font-semibold"
                                                >
                                                    {safetyShowAll.sideEffects ? t('Show less', 'عرض أقل') : t('Show all', 'عرض الكل')}
                                                </button>
                                            )}
                                        </div>
                                        {(data.sideEffects && data.sideEffects.length > 0) ? (
                                            <ul className="grid gap-2.5 md:grid-cols-2">
                                                {(safetyShowAll.sideEffects ? data.sideEffects : data.sideEffects.slice(0, 8)).map((s, i) => (
                                                    <li key={i} className="flex items-start justify-between gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 group">
                                                        <div className="flex items-start gap-2.5">
                                                            <div className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                                            <span className="text-white/80 text-sm leading-relaxed">{s}</span>
                                                        </div>
                                                        <LiquidGlassAiButton
                                                            topic={s}
                                                            sectionTitle={t("Side Effect", "أثر جانبي")}
                                                            question={t(
                                                                `What should I know about the side effect: "${s}" when taking ${data.drugName}? How common is it, and how can I manage it?`,
                                                                `ما الذي يجب معرفته عن الأثر الجانبي: "${s}" عند تناول ${data.drugName}؟ ما مدى شيوعه وكيف يمكنني التعامل معه؟`
                                                            )}
                                                        />
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-white/40 text-sm italic">{t("No side effects listed.", "لا توجد آثار جانبية مذكورة.")}</p>
                                        )}
                                    </div>
                                )}

                                {safetyTab === 'overdose' && (
                                    <div>
                                        <p className="text-white font-bold text-sm mb-3">{t('Overdose Guidelines', 'إرشادات الجرعة الزائدة')}</p>
                                        {data.overdose && ((data.overdose.symptoms?.length || 0) > 0 || (data.overdose.whatToDo?.length || 0) > 0) ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {(data.overdose.symptoms && data.overdose.symptoms.length > 0) && (
                                                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                                                        <p className="text-red-200 font-bold text-xs sm:text-sm mb-2">{t('Overdose Symptoms', 'أعراض الجرعة الزائدة')}</p>
                                                        <ul className="space-y-1.5 text-red-100/90 text-sm leading-relaxed">
                                                            {(safetyShowAll.overdose ? data.overdose.symptoms : data.overdose.symptoms.slice(0, 6)).map((s, i) => (
                                                                <li key={i} className="flex items-center justify-between gap-2 p-1 rounded hover:bg-red-500/5 transition-colors">
                                                                    <span>• {s}</span>
                                                                    <LiquidGlassAiButton
                                                                        topic={s}
                                                                        sectionTitle={t("Overdose Symptom", "عرض جرعة زائدة")}
                                                                        question={t(
                                                                            `What should I do if I notice the overdose symptom "${s}" while taking ${data.drugName}?`,
                                                                            `ماذا يجب أن أفعل إذا لاحظت عرض الجرعة الزائدة "${s}" أثناء تناول ${data.drugName}؟`
                                                                        )}
                                                                        size="sm"
                                                                    />
                                                                </li>
                                                            ))}
                                                        </ul>
                                                        {(data.overdose.symptoms.length > 6) && (
                                                            <button
                                                                onClick={() => setSafetyShowAll((p) => ({ ...p, overdose: !p.overdose }))}
                                                                className="mt-3 text-xs text-red-200/80 hover:underline font-semibold"
                                                            >
                                                                {safetyShowAll.overdose ? t('Show less', 'عرض أقل') : t('Show all', 'عرض الكل')}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                                {(data.overdose.whatToDo && data.overdose.whatToDo.length > 0) && (
                                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                                        <p className="text-white font-bold text-xs sm:text-sm mb-2">{t('What to do', 'خطوات التصرف السريع')}</p>
                                                        <ul className="space-y-1.5 text-white/70 text-sm leading-relaxed">
                                                            {(safetyShowAll.overdose ? data.overdose.whatToDo : data.overdose.whatToDo.slice(0, 6)).map((s, i) => (
                                                                <li key={i} className="flex items-center justify-between gap-2 p-1 rounded hover:bg-white/5 transition-colors">
                                                                    <span>• {s}</span>
                                                                    <LiquidGlassAiButton
                                                                        topic={s}
                                                                        sectionTitle={t("Overdose Action", "إجراء جرعة زائدة")}
                                                                        question={t(
                                                                            `Explain the overdose action step: "${s}" for ${data.drugName}. When should emergency services be called?`,
                                                                            `اشرح خطوة التصرف في حال الجرعة الزائدة: "${s}" لدواء ${data.drugName}. متى يجب الاتصال بخدمات الطوارئ؟`
                                                                        )}
                                                                        size="sm"
                                                                    />
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-white/40 text-sm italic">{t("No overdose info available.", "لا توجد معلومات عن الجرعة الزائدة.")}</p>
                                        )}
                                    </div>
                                )}

                                {safetyTab === 'seekHelp' && (
                                    <div>
                                        <div className="flex items-center justify-between gap-3 mb-3">
                                            <p className="text-white font-bold text-sm">{t('Red Flag Symptoms (Seek Emergency Care)', 'أعراض الخطر (اطلب الرعاية الطبية الفورية)')}</p>
                                            {(data.whenToSeekHelp?.length || 0) > 8 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSafetyShowAll((p) => ({ ...p, seekHelp: !p.seekHelp }))}
                                                    className="text-xs text-cyan-400 hover:underline font-semibold"
                                                >
                                                    {safetyShowAll.seekHelp ? t('Show less', 'عرض أقل') : t('Show all', 'عرض الكل')}
                                                </button>
                                            )}
                                        </div>
                                        {(data.whenToSeekHelp && data.whenToSeekHelp.length > 0) ? (
                                            <ul className="grid gap-2.5 md:grid-cols-2">
                                                {(safetyShowAll.seekHelp ? data.whenToSeekHelp : data.whenToSeekHelp.slice(0, 8)).map((s, i) => (
                                                    <li key={i} className="flex items-center justify-between gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-100 text-sm leading-relaxed group">
                                                        <span>• {s}</span>
                                                        <LiquidGlassAiButton
                                                            topic={s}
                                                            sectionTitle={t("Red Flag Symptom", "علامة خطر حرجة")}
                                                            question={t(
                                                                `Why is "${s}" considered a red flag symptom for ${data.drugName}? What immediate medical interventions are typically required?`,
                                                                `لماذا يعتبر عرض الخطر "${s}" علامة تحذيرية حمراء لدواء ${data.drugName}؟ وما هي التدخلات الطبية الفورية المطلوبة عادة؟`
                                                            )}
                                                        />
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-white/40 text-sm italic">{t("No red-flag symptoms listed.", "لا توجد علامات تحذيرية مذكورة.")}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderGuard = () => {
        return (
            <div className="space-y-6 p-3.5 sm:p-8">
                <div className="flex items-center justify-between gap-4 mb-2 flex-wrap">
                    <div className="flex items-center gap-2 text-cyan-300 font-bold">
                        <GitBranch className="w-5 h-5" />
                        <h3 className="text-white text-base sm:text-lg">{t('Private AI Context & Interaction Guard', 'سياقك الصحي وحارس التداخلات')}</h3>
                    </div>
                    {plan !== 'ultra' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold flex items-center gap-1 uppercase tracking-wider">
                            <Lock className="w-3 h-3" /> {t("Ultra", "ألترا")}
                        </span>
                    )}
                </div>

                {plan !== 'ultra' ? (
                    <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-6">
                        <div className="absolute inset-0 flex items-center justify-center p-4 backdrop-blur-sm z-15">
                            <div className="w-full max-w-sm p-6 rounded-2xl bg-slate-950/90 border border-white/10 shadow-2xl text-center">
                                <Lock className="w-8 h-8 text-amber-300 mx-auto mb-3" />
                                <p className="text-white font-bold text-base">{t("Unlock Interaction Guard", "افتح حارس التداخلات الخاص")}</p>
                                <p className="text-white/60 text-xs mt-1.5 leading-relaxed">
                                    {t("Automatically screen this medicine against all your current medications, chronic conditions, and allergies.", "قم بفحص هذا الدواء تلقائياً ومقارنته بجميع أدويتك الحالية، الأمراض المزمنة، والحساسية التي تعاني منها.")}
                                </p>
                                <div className="mt-4 flex justify-center gap-2">
                                    {!user ? (
                                        <Button href="/login" size="sm">{t("Log in", "تسجيل الدخول")}</Button>
                                    ) : (
                                        <Button href="/pricing" size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold border-0">
                                            {t("Upgrade to Ultra", "ترقية إلى ألترا")}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="blur-[3px] opacity-25 pointer-events-none select-none space-y-4">
                            <div className="h-6 w-1/4 bg-white/10 rounded" />
                            <div className="h-24 w-full bg-white/5 rounded" />
                            <div className="h-32 w-full bg-white/5 rounded" />
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {/* Unified Safety Summary & Context Bar */}
                        <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-950 to-slate-900/90 border border-white/10 backdrop-blur-xl shadow-xl flex-wrap">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold shrink-0">
                                    <ShieldAlert className="w-5 h-5 text-cyan-300" />
                                </div>
                                <div>
                                    <p className="text-white font-extrabold text-sm sm:text-base flex items-center gap-2">
                                        <span>
                                            {guardSubjectName && guardSubjectName.toLowerCase().includes("local_dev")
                                                ? t("Personal Health Profile", "الملف الصحي الشخصي")
                                                : (guardSubjectName || t("Personal Health Profile", "الملف الصحي الشخصي"))}
                                        </span>
                                    </p>
                                    <p className="text-white/40 text-xs mt-0.5">
                                        {t(`Checked against ${guardItems.length} medication records in history`, `تم فحص التداخلات مقارنة بـ ${guardItems.length} أدوية في سجلّك الطّبي`)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5 flex-wrap">
                                {data.personalized?.riskLevel && (
                                    <div className={cn(
                                        "px-3.5 py-1.5 rounded-xl text-xs font-black border uppercase tracking-wider flex items-center gap-1.5 shadow-md",
                                        String(data.personalized.riskLevel).toLowerCase().includes('high')
                                            ? "bg-red-500/15 text-red-200 border-red-500/40 shadow-red-500/20"
                                            : String(data.personalized.riskLevel).toLowerCase().includes('medium')
                                                ? "bg-amber-500/15 text-amber-200 border-amber-500/40 shadow-amber-500/20"
                                                : "bg-emerald-500/15 text-emerald-200 border-emerald-500/40 shadow-emerald-500/20"
                                    )}>
                                        <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                                        <span>
                                            {t("Risk Level:", "مستوى المخاطر:")} {
                                                String(data.personalized.riskLevel).toLowerCase().includes('high')
                                                    ? t("High", "مرتفع")
                                                    : String(data.personalized.riskLevel).toLowerCase().includes('medium')
                                                        ? t("Medium", "متوسط")
                                                        : t("Low", "منخفض")
                                            }
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/10 text-xs">
                                    {guardCounts.danger > 0 && (
                                        <span className="px-2.5 py-0.5 rounded-lg bg-red-500/20 text-red-300 font-bold">
                                            {t(`Danger: ${guardCounts.danger}`, `خطر: ${guardCounts.danger}`)}
                                        </span>
                                    )}
                                    {guardCounts.caution > 0 && (
                                        <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-bold">
                                            {t(`Caution: ${guardCounts.caution}`, `تحذير: ${guardCounts.caution}`)}
                                        </span>
                                    )}
                                    {guardCounts.safe > 0 && (
                                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold">
                                            {t(`Safe: ${guardCounts.safe}`, `آمن: ${guardCounts.safe}`)}
                                        </span>
                                    )}
                                </div>

                                <Link href="/profile" className="text-xs text-cyan-400 hover:text-cyan-300 font-bold underline-offset-4 hover:underline ms-2">
                                    {t('Manage Profile', 'إدارة الملف الطّبي')}
                                </Link>
                            </div>
                        </div>

                        {/* Summary & Graph Section */}
                        {guardItems.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left Side: Network Node List & Info */}
                                <div className="lg:col-span-1 space-y-3">
                                    <p className="text-xs text-white/50 font-bold uppercase tracking-wider mb-1">{t("Scan Results against medications", "نتائج الفحص مقارنة بالأدوية")}</p>
                                    <div className="grid gap-2.5 max-h-[380px] overflow-y-auto pe-1 scrollbar-thin">
                                        {guardItems.map((it: any) => {
                                            const ui = severityUi(it?.severity);
                                            const rawKey = String(it?.otherMedication || "").trim();
                                            if (!rawKey) return null;
                                            const displayKey = formatShortMedName(rawKey);
                                            const selected = String(selectedGuardKey || "") === rawKey;
                                            return (
                                                <button
                                                    key={rawKey}
                                                    type="button"
                                                    onClick={() => setSelectedGuardKey(rawKey)}
                                                    className={cn(
                                                        "w-full p-3.5 rounded-xl border text-start transition-all duration-200 group relative overflow-hidden",
                                                        selected 
                                                            ? "bg-cyan-500/10 border-cyan-500/40 ring-1 ring-cyan-500/25 shadow-lg shadow-cyan-500/10" 
                                                            : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between gap-2 dir-ltr text-end" dir="ltr">
                                                        <span className="text-white font-bold text-sm truncate block" title={rawKey}>{displayKey}</span>
                                                        <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase shrink-0", ui.chip)}>
                                                            {ui.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-white/60 text-xs mt-1.5 line-clamp-1 text-start" dir={isArabic ? "rtl" : "ltr"}>
                                                        {it.headline || it.summary || t("View details", "عرض التفاصيل")}
                                                    </p>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {interactionGuard?.overallRisk && (
                                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-white/70 text-xs leading-relaxed">
                                            <span className="text-cyan-300 font-bold block mb-1">{t("Summary Analysis:", "تحليل الخلاصة:")}</span>
                                            {interactionGuard.overallRisk}
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: Visualizer Graph */}
                                <div className="lg:col-span-2 flex flex-col h-full justify-between p-4 rounded-2xl bg-black/40 border border-white/10 min-h-[360px]">
                                    <div className="flex items-center justify-between gap-3 mb-3">
                                        <span className="text-xs text-white/50 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                                            {t("Interactive Safety Connection Map", "خريطة التداخلات التفاعلية")}
                                        </span>
                                        <span className="text-xs text-cyan-400 font-semibold bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">{t("Tap nodes to investigate", "اضغط على الأدوية للتحقق")}</span>
                                    </div>

                                    <div className="relative w-full h-[320px] sm:h-[360px] rounded-2xl bg-slate-950/80 overflow-hidden border border-white/10 shadow-2xl">
                                        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                                            <style>{`
                                                @keyframes dash {
                                                    to {
                                                        stroke-dashoffset: -40;
                                                    }
                                                }
                                                .animate-dash-slow {
                                                    animation: dash 5s linear infinite;
                                                }
                                            `}</style>
                                            <defs>
                                                <marker id="arrowSafe" markerWidth="6" markerHeight="6" refX="5.5" refY="3" orient="auto">
                                                    <path d="M0,0 L6,3 L0,6 Z" fill="rgba(16,185,129,0.9)" />
                                                </marker>
                                                <marker id="arrowCaution" markerWidth="6" markerHeight="6" refX="5.5" refY="3" orient="auto">
                                                    <path d="M0,0 L6,3 L0,6 Z" fill="rgba(234,179,8,0.95)" />
                                                </marker>
                                                <marker id="arrowDanger" markerWidth="6" markerHeight="6" refX="5.5" refY="3" orient="auto">
                                                    <path d="M0,0 L6,3 L0,6 Z" fill="rgba(239,68,68,0.9)" />
                                                </marker>
                                            </defs>
                                            {graphNodes.map((it: any, idx: number) => {
                                                const ui = severityUi(it?.severity);
                                                const pos = graphLayout[idx] || { x: 50, y: 12 };
                                                return (
                                                    <line
                                                        key={`l-${idx}`}
                                                        x1={pos.x}
                                                        y1={pos.y}
                                                        x2={50}
                                                        y2={50}
                                                        stroke={ui.stroke}
                                                        strokeWidth={2}
                                                        strokeDasharray="4,4"
                                                        className="animate-dash-slow"
                                                        opacity={0.85}
                                                        markerEnd={ui.marker}
                                                    />
                                                );
                                            })}
                                        </svg>

                                        {/* Center Target Med - Clean & Simple 3D Medicine Box */}
                                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                                            <div className="w-[150px] sm:w-[170px] rounded-2xl border border-cyan-400/40 bg-slate-900/95 overflow-hidden shadow-2xl transition-all duration-300 hover:scale-105 hover:border-cyan-300">
                                                {/* Top Header Foil Band */}
                                                <div className="bg-gradient-to-r from-cyan-600 to-blue-700 px-3 py-1.5 flex items-center justify-between text-white border-b border-cyan-400/30">
                                                    <div className="flex items-center gap-1.5">
                                                        {getMedicalFormIcon(data.form)}
                                                        <span className="text-[10px] font-black tracking-wider uppercase">{t("Target", "دواء الفحص")}</span>
                                                    </div>
                                                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/40 text-cyan-200">
                                                        {data.strength || "Rx"}
                                                    </span>
                                                </div>

                                                {/* Main Box Body - Simple & Clean (Name + Purpose only) */}
                                                <div className="p-3 text-center flex flex-col items-center justify-center min-h-[85px]">
                                                    <h4 className="text-white font-black text-xs sm:text-sm leading-snug truncate w-full px-0.5 dir-ltr" dir="ltr" title={displayDrugName}>
                                                        {displayDrugName}
                                                    </h4>

                                                    {/* Simple Purpose / Primary Use */}
                                                    <p className="text-cyan-200/80 text-[10px] font-semibold mt-1 truncate w-full px-1" title={data.uses?.[0] || data.category || ""}>
                                                        {data.uses?.[0] || data.category || (isArabic ? "مسكن وعلاج أعراض" : "Symptom Relief")}
                                                    </p>

                                                    {/* Translated Form Badge */}
                                                    <div className="mt-2.5 flex items-center justify-center">
                                                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 text-[9px] font-bold border border-cyan-500/25">
                                                            {translateMedicalTerm(data.form, isArabic) || (isArabic ? "مستحضر طبي" : "Medicine")}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Peripheral Nodes - Mini 3D Medicine Box Cards */}
                                        {graphNodes.map((it: any, idx: number) => {
                                            const pos = graphLayout[idx] || { x: 50, y: 12 };
                                            const ui = severityUi(it?.severity);
                                            const rawKey = String(it.otherMedication || "");
                                            const displayKey = formatShortMedName(rawKey);
                                            const selected = String(selectedGuardKey || "") === rawKey;

                                            const headerBg = it?.severity === 'danger' 
                                                ? "from-red-600 to-rose-700 text-red-100" 
                                                : it?.severity === 'caution' 
                                                    ? "from-amber-600 to-yellow-700 text-amber-100" 
                                                    : "from-emerald-600 to-teal-700 text-emerald-100";

                                            return (
                                                <button
                                                    key={`n-${idx}`}
                                                    type="button"
                                                    onClick={() => setSelectedGuardKey(rawKey)}
                                                    style={{
                                                        left: `${pos.x}%`,
                                                        top: `${pos.y}%`,
                                                        transform: "translate(-50%, -50%)",
                                                    }}
                                                    className={cn(
                                                        "absolute w-[125px] sm:w-[145px] rounded-xl border text-center backdrop-blur-xl transition-all duration-300 shadow-xl overflow-hidden z-10",
                                                        ui.node,
                                                        selected 
                                                            ? "ring-2 ring-white border-white scale-110 shadow-cyan-500/20 z-30" 
                                                            : "hover:scale-105"
                                                    )}
                                                    title={rawKey}
                                                >
                                                    {/* Top Foil Band */}
                                                    <div className={cn("bg-gradient-to-r px-2.5 py-1 flex items-center justify-between text-[9px] font-bold uppercase tracking-wider border-b border-white/20", headerBg)}>
                                                        <span className="truncate">{ui.label}</span>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                    </div>

                                                    {/* Pack Body */}
                                                    <div className="p-2.5 bg-slate-950/95 flex flex-col items-center justify-center min-h-[50px]">
                                                        <h5 className="text-white font-bold text-xs leading-snug truncate w-full px-0.5 dir-ltr" dir="ltr">
                                                            {displayKey}
                                                        </h5>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-white/50 text-sm">
                                <Info className="w-8 h-8 text-cyan-300 mx-auto mb-2 opacity-65" />
                                {t("No cross-interaction data found. Make sure you have added medication history or other items in your profile.", "لم يتم العثور على بيانات تداخلات دوائية. تأكد من إدخال أدويتك الأخرى في ملفك الشخصي.")}
                            </div>
                        )}

                        {/* Selected Interaction Details Card */}
                        {selectedGuardItem && (
                            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
                                <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3 mb-4">
                                    <div>
                                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{t("Interaction Analysis", "تفاصيل التداخل الدوائي")}</p>
                                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                            <h4 className="text-white font-bold text-base sm:text-lg">
                                                {displayDrugName} + <span className="text-cyan-300">{formatShortMedName(selectedGuardItem.otherMedication)}</span>
                                            </h4>
                                            <LiquidGlassAiButton
                                                topic={`${displayDrugName} + ${selectedGuardItem.otherMedication}`}
                                                sectionTitle={t("Interaction Analysis", "تفاصيل التداخل الدوائي")}
                                                question={t(
                                                    `Explain in detail the interaction between ${displayDrugName} and ${selectedGuardItem.otherMedication}. Headline: "${selectedGuardItem.headline || ''}". Summary: "${selectedGuardItem.summary || ''}". Mechanism: "${selectedGuardItem.mechanism || ''}". What is the biological pathway and clinical risk?`,
                                                    `اشرح بالتفصيل التداخل بين ${displayDrugName} و ${selectedGuardItem.otherMedication}. العنوان الرئيسي: "${selectedGuardItem.headline || ''}". الملخص: "${selectedGuardItem.summary || ''}". الآلية: "${selectedGuardItem.mechanism || ''}". ما هو المسار البيولوجي والمخاطر السريرية؟`
                                                )}
                                            />
                                        </div>
                                    </div>
                                    <span className={cn("px-3.5 py-1 rounded-xl text-xs font-bold border uppercase shrink-0", severityUi(selectedGuardItem.severity).chip)}>
                                        {severityUi(selectedGuardItem.severity).label}
                                    </span>
                                </div>

                                {selectedGuardItem.headline && (
                                    <p className="text-white font-semibold text-sm leading-relaxed mb-2">{selectedGuardItem.headline}</p>
                                )}
                                {selectedGuardItem.summary && (
                                    <p className="text-white/70 text-sm leading-relaxed mb-4">{selectedGuardItem.summary}</p>
                                )}

                                {selectedGuardItem.mechanism && (
                                    <div className="p-3.5 rounded-xl bg-black/20 border border-white/5 text-xs text-white/60 mb-4 leading-relaxed">
                                        <strong className="text-white/90">{t("Biological Mechanism: ", "الآلية البيولوجية للتفاعل: ")}</strong>
                                        {selectedGuardItem.mechanism}
                                    </div>
                                )}

                                <div className="grid gap-4 md:grid-cols-3">
                                    {Array.isArray(selectedGuardItem.whatToDo) && selectedGuardItem.whatToDo.length > 0 && (
                                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                            <p className="text-white font-bold text-xs sm:text-sm mb-2.5 text-cyan-300">{t("Recommended Action", "ما يجب عليك فعله")}</p>
                                            <ul className="space-y-1.5 text-white/70 text-xs leading-relaxed">
                                                {selectedGuardItem.whatToDo.map((s: string, i: number) => <li key={i}>• {s}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                    {Array.isArray(selectedGuardItem.monitoring) && selectedGuardItem.monitoring.length > 0 && (
                                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                            <p className="text-white font-bold text-xs sm:text-sm mb-2.5 text-amber-300">{t("Monitoring & Tests", "المتابعة والفحوصات")}</p>
                                            <ul className="space-y-1.5 text-white/70 text-xs leading-relaxed">
                                                {selectedGuardItem.monitoring.map((s: string, i: number) => <li key={i}>• {s}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                    {Array.isArray(selectedGuardItem.redFlags) && selectedGuardItem.redFlags.length > 0 && (
                                        <div className="p-4 rounded-xl bg-red-950/10 border border-red-500/15">
                                            <p className="text-red-300 font-bold text-xs sm:text-sm mb-2.5">{t("Red Flag Warning Symptoms", "أعراض خطيرة تستدعي الطبيب")}</p>
                                            <ul className="space-y-1.5 text-red-100/90 text-xs leading-relaxed">
                                                {selectedGuardItem.redFlags.map((s: string, i: number) => <li key={i}>• {s}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Personalized Profile Alerts */}
                        {data.personalized && (data.personalized.riskSummary || (data.personalized.alerts && data.personalized.alerts.length > 0)) && (
                            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-4">
                                <h4 className="text-white font-bold text-sm sm:text-base flex items-center gap-2 text-cyan-300">
                                    <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                                    {t("Health Profile Safety Analysis", "تحليل سلامة الدواء لملفك الصحي الخاص")}
                                </h4>
                                {data.personalized.riskSummary && (
                                    <p className="text-white/80 text-sm leading-relaxed p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                        {data.personalized.riskSummary}
                                    </p>
                                )}

                                {data.personalized.alerts && data.personalized.alerts.length > 0 && (
                                    <div className="grid gap-3">
                                        {data.personalized.alerts.slice(0, 6).map((a, i) => (
                                            <div key={i} className={cn(
                                                "p-4 rounded-xl border",
                                                String(a.severity || '').toLowerCase() === 'high'
                                                    ? "bg-red-500/10 border-red-500/20"
                                                    : String(a.severity || '').toLowerCase() === 'medium'
                                                        ? "bg-yellow-500/10 border-yellow-500/20"
                                                        : "bg-white/5 border-white/10"
                                            )}>
                                                <p className="text-white font-bold text-sm">{a.title || t('Personalized Alert', 'تنبيه مخصص')}</p>
                                                {a.details && (
                                                    <p className="text-white/70 text-xs sm:text-sm mt-1 leading-relaxed">{a.details}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderChat = () => {
        const handleStartConsultation = () => {
            askAiAbout(
                t("Comprehensive Medication Consultation", "استشارة سريرية شاملة حول الدواء"),
                t(
                    `Please provide a comprehensive clinical consultation for ${displayDrugName}. Analyze its indications, active ingredients, dosage guidelines, safety precautions, and compatibility with my health profile.`,
                    `يرجى تقديم استشارة سريرية متكاملة حول دواء ${displayDrugName}. حلّل دواعي استعماله، مواده الفعالة، إرشادات الجرعة الدقيقة، واحتياطات الأمان وملاءمته لملفي الصحي.`
                )
            );
        };

        return (
            <div className="space-y-6 p-4 sm:p-10">
                <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/40 p-8 sm:p-12 text-center shadow-2xl space-y-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 flex items-center justify-center mx-auto shadow-md">
                        <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-300" />
                    </div>

                    <div className="space-y-3 max-w-xl mx-auto">
                        <h3 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                            {t("Interactive Qure AI Consultation", "استشارة سريرية ذكية مع Qure AI")}
                        </h3>
                        <p className="text-slate-300 text-xs sm:text-base leading-relaxed">
                            {t(
                                `Qure AI Medical Assistant is ready with full contextual awareness of ${displayDrugName}, its active ingredients, dosage, and your personalized health profile.`,
                                `المساعد الطبي الذكي Qure AI جاهز مع ربط كامل وتلقائي ببيانات دواء (${displayDrugName}) ومواده الفعالة وجرعاته وسجلك الطبي للإجابة الفورية.`
                            )}
                        </p>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={handleStartConsultation}
                            className="shiny-cta-btn inline-flex items-center justify-center px-8 sm:px-12 py-4 font-black text-sm sm:text-base gap-3 select-none cursor-pointer"
                        >
                            <Brain className="w-5 h-5 text-slate-950 shrink-0" />
                            <span>{t("Start Smart Consultation", "بدء الاستشارة الفورية مع Qure AI")}</span>
                            <ChevronRight className={cn("w-5 h-5 stroke-[2.5] text-slate-950", isArabic ? "rotate-180" : "")} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderCosmetics = () => {
        const careDomain = getCosmeticCareDomain(data, isArabic);
        const ingredientsList = data.activeIngredients && data.activeIngredients.length > 0
            ? data.activeIngredients
            : [data.genericName || (isArabic ? "مكونات تجميلية مرطبة ومغذية" : "Nourishing Formula")];

        const benefits = data.uses && data.uses.length > 0 ? data.uses : [];
        const routine = data.dosage || (isArabic
            ? (careDomain.domain === "hair"
                ? "يُوضع على فروة رأس نظيفة مع التدليك الدائري اللطيف بأطراف الأصابع لتعزيز الامتصاص وتحفيز البصيلات."
                : careDomain.domain === "beard"
                ? "توضع بضع قطرات على شعر اللحية النظيف مع تدليك الجذور والبشرة السفلية لتغذية البصيلات وتنعيم الشعر."
                : careDomain.domain === "eyes_lips"
                ? "توضع كمية صغيرة جداً وتُربت بلطف بأطراف الأصابع حول محيط العين أو الشفاه دون شد البشرة."
                : careDomain.domain === "body"
                ? "يُوزع بسخاء على بشرة الجسم بعد الاستحمام مع التدليك حتى الامتصاص الكامل لترطيب يدوم طويلاً."
                : "يُوضع على بشرة نظيفة وجافة صباحاً ومساءً مع الدلك الخفيف حتى الامتصاص الكامل.")
            : (careDomain.domain === "hair"
                ? "Apply to clean scalp and gently massage in circular motions to enhance absorption and stimulate follicles."
                : careDomain.domain === "beard"
                ? "Apply a few drops to clean beard and massage into roots and underlying skin."
                : "Apply to clean, dry skin morning and evening. Massage gently until fully absorbed."));

        const colorMap: Record<string, { bg: string; border: string; text: string; sub: string }> = {
            emerald: { bg: "bg-emerald-500/8", border: "border-emerald-500/20", text: "text-emerald-300", sub: "text-emerald-200/60" },
            cyan: { bg: "bg-cyan-500/8", border: "border-cyan-500/20", text: "text-cyan-300", sub: "text-cyan-200/60" },
            violet: { bg: "bg-violet-500/8", border: "border-violet-500/20", text: "text-violet-300", sub: "text-violet-200/60" },
            amber: { bg: "bg-amber-500/8", border: "border-amber-500/20", text: "text-amber-300", sub: "text-amber-200/60" },
            pink: { bg: "bg-pink-500/8", border: "border-pink-500/20", text: "text-pink-300", sub: "text-pink-200/60" },
        };

        return (
            <div className="space-y-4 p-3 sm:p-5">

                {/* Hero Header */}
                <div className="rounded-2xl overflow-hidden border border-pink-500/15 bg-gradient-to-br from-pink-950/30 via-purple-950/20 to-slate-950/60 backdrop-blur-xl">
                    <div className="px-5 py-4 flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center shrink-0">
                            {careDomain.icon}
                        </div>
                        <div className="min-w-0">
                            <p className="text-white font-bold text-sm">{careDomain.guideTitle}</p>
                            <p className="text-white/40 text-[11px] truncate">{careDomain.guideSubtitle}</p>
                        </div>
                        <span className="ms-auto shrink-0 px-2.5 py-1 rounded-full bg-pink-500/15 border border-pink-500/25 text-pink-300 text-[10px] font-bold uppercase tracking-wider">
                            {careDomain.badgeLabel}
                        </span>
                    </div>
                </div>

                {/* Category Suitability Grid */}
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] backdrop-blur-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-pink-400" />
                        <p className="text-xs font-semibold text-white/70">{careDomain.categoryTitle}</p>
                    </div>
                    <div className="p-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {careDomain.suitabilityList.map((st) => {
                            const c = colorMap[st.color] || colorMap.pink;
                            return (
                                <div key={st.label} className={`rounded-xl ${c.bg} border ${c.border} py-3 px-2 flex flex-col items-center gap-1 text-center`}>
                                    <span className={`text-[11px] font-bold ${c.text}`}>{st.label}</span>
                                    <span className={`text-[9px] ${c.sub} leading-tight`}>{st.hint}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Ingredients + Benefits */}
                <div className="grid gap-3 sm:grid-cols-2">
                    {/* Ingredients */}
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] backdrop-blur-xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                            <p className="text-xs font-semibold text-white/70">{t("Key Ingredients", "المكونات الفعالة")}</p>
                        </div>
                        <div className="p-3 space-y-1.5">
                            {ingredientsList.slice(0, 6).map((ing, i) => (
                                <div key={i} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                                    <span className="text-white/85 text-xs font-medium truncate" dir="ltr">{ing}</span>
                                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-pink-400/60" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Benefits */}
                    {benefits.length > 0 ? (
                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] backdrop-blur-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <p className="text-xs font-semibold text-white/70">{t("Benefits", "الفوائد")}</p>
                            </div>
                            <div className="p-3 space-y-1.5">
                                {benefits.slice(0, 6).map((b, i) => (
                                    <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                                        <div className="w-1 h-1 rounded-full bg-emerald-400/70 mt-1.5 shrink-0" />
                                        <span className="text-white/75 text-xs leading-relaxed">{b}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Purity Checklist fallback */
                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] backdrop-blur-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <p className="text-xs font-semibold text-white/70">{t("Purity & Safety", "النقاء والسلامة")}</p>
                            </div>
                            <div className="p-3 grid grid-cols-2 gap-1.5">
                                {careDomain.purityItems.map((item, i) => (
                                    <div key={i} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                                        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                                        <span className="text-emerald-200/80 text-[10px] font-medium leading-tight">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Application Routine */}
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] backdrop-blur-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <p className="text-xs font-semibold text-white/70">{t("How to Use", "طريقة الاستخدام")}</p>
                        <span className="ms-auto text-[10px] text-cyan-400/60 font-semibold">{t("AM · PM", "صباح · مساء")}</span>
                    </div>
                    <div className="p-4">
                        <p className="text-white/75 text-sm leading-relaxed">{routine}</p>
                    </div>
                    <div className="mx-4 mb-4 flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-amber-500/6 border border-amber-500/15">
                        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-amber-200/80 text-[11px] leading-relaxed">
                            {t(
                                "Do a patch test on your inner wrist 24h before first use to check for reactions.",
                                "اختبر المستحضر على معصمك الداخلي لمدة ٢٤ ساعة قبل الاستخدام الكامل."
                            )}
                        </p>
                    </div>
                </div>

                {/* Purity checklist (shown always when benefits were shown above) */}
                {benefits.length > 0 && (
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] backdrop-blur-xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <p className="text-xs font-semibold text-white/70">{t("Purity & Safety", "معايير النقاء والسلامة")}</p>
                        </div>
                        <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                            {careDomain.purityItems.map((item, i) => (
                                <div key={i} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                                    <span className="text-emerald-200/80 text-[10px] font-medium leading-tight">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        );
    };

    const renderFda = () => {
        return (
            <div className="space-y-6 p-3.5 sm:p-8">
                {/* FDA Status header */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2 text-cyan-300 font-bold">
                        <Database className="w-5 h-5 text-emerald-300" />
                        <h3 className="text-white text-base sm:text-lg">{t('FDA Official Databases Verification', 'التحقق الرسمي من إدارة الغذاء والدواء الأمريكية FDA')}</h3>
                    </div>
                    {plan === 'ultra' ? (
                        fdaFeatureEnabled && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowFdaDetails((v) => !v)}
                                className="border-white/15 text-white/70 hover:bg-white/10"
                                disabled={fdaLoading || !fdaLabelFound}
                            >
                                {showFdaDetails ? t("Hide Full Label", "إخفاء النشرة الكاملة") : t("Show Full Label", "عرض النشرة الكاملة")}
                            </Button>
                        )
                    ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold flex items-center gap-1 uppercase tracking-wider">
                            <Lock className="w-3 h-3" /> {t("Ultra", "ألترا")}
                        </span>
                    )}
                </div>

                {!fdaFeatureEnabled ? (
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-sm text-white/70 leading-relaxed">
                        <p>{t("FDA database cross-checks are disabled in your settings. Please enable them in your profile to search and verify drug barcodes and names.", "تم تعطيل التحقق من قواعد بيانات FDA في إعداداتك. يرجى تفعيلها في ملفك الشخصي لتتمكن من فحص ومطابقة أسماء الأدوية.")}</p>
                        <div className="mt-3">
                            <Link href="/profile" className="text-cyan-400 hover:underline font-semibold">{t("Go to profile settings", "انتقل إلى إعدادات ملفك الشخصي")}</Link>
                        </div>
                    </div>
                ) : fdaLoading ? (
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                        <div className="h-4 w-1/3 bg-white/5 rounded ai-skeleton" />
                        <div className="h-4 w-full bg-white/5 rounded ai-skeleton" />
                        <div className="h-4 w-5/6 bg-white/5 rounded ai-skeleton" />
                    </div>
                ) : fdaError ? (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
                        {fdaError}
                    </div>
                ) : fdaLabelFound ? (
                    <div className="space-y-4">
                        {/* Summary Badges Grid */}
                        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-white font-bold text-sm sm:text-base">{t("Official FDA & RxNorm Registration Info", "بيانات التسجيل المعتمدة (FDA & RxNorm NLM)")}</h4>
                                <span className="px-2.5 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/25 text-cyan-300 text-[10px] font-bold">
                                    RxNorm / NLM Verified
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {((fda as any)?.openfda?.rxcui || []).slice(0, 1).map((rxcuiVal: string, i: number) => (
                                    <span key={`rx-${i}`} className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-mono font-bold">
                                        RxCUI: {rxcuiVal}
                                    </span>
                                ))}
                                {((fda as any)?.openfda?.brand_name || []).slice(0, 2).map((v: string, i: number) => (
                                    <span key={`b-${i}`} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-semibold">
                                        {t("Brand: ", "العلامة التجارية: ")}{v}
                                    </span>
                                ))}
                                {((fda as any)?.openfda?.generic_name || []).slice(0, 2).map((v: string, i: number) => (
                                    <span key={`g-${i}`} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/80 text-xs font-semibold">
                                        {t("Generic: ", "الاسم العلمي: ")}{v}
                                    </span>
                                ))}
                                {((fda as any)?.openfda?.manufacturer_name || []).slice(0, 1).map((v: string, i: number) => (
                                    <span key={`m-${i}`} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs">
                                        {t("Manufacturer: ", "المصنع (FDA): ")}{v}
                                    </span>
                                ))}
                                {((fda as any)?.openfda?.route || []).slice(0, 2).map((v: string, i: number) => (
                                    <span key={`r-${i}`} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs">
                                        {t("Route: ", "طريقة التعاطي: ")}{v}
                                    </span>
                                ))}
                                {((fda as any)?.openfda?.product_ndc || []).slice(0, 1).map((v: string, i: number) => (
                                    <span key={`ndc-${i}`} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 text-xs font-mono">
                                        NDC: {v}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* FDA Full Details */}
                        {plan === 'ultra' && showFdaDetails ? (
                            <div className="grid gap-4">
                                {((fda as any)?.label?.indications_and_usage || []).length > 0 && (
                                    <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
                                        <p className="text-white font-bold text-sm sm:text-base mb-2.5 border-b border-white/5 pb-2 text-cyan-300">{t("Indications & Usage (FDA)", "الاستخدامات الطبية المعتمدة (FDA)")}</p>
                                        {((fda as any).label.indications_and_usage as string[]).map((s, i) => (
                                            <p key={i} className="text-white/70 text-sm whitespace-pre-wrap leading-relaxed">{s}</p>
                                        ))}
                                    </div>
                                )}
                                {((fda as any)?.label?.dosage_and_administration || []).length > 0 && (
                                    <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
                                        <p className="text-white font-bold text-sm sm:text-base mb-2.5 border-b border-white/5 pb-2 text-blue-400">{t("Dosage & Administration (FDA)", "إرشادات الجرعات والتعاطي (FDA)")}</p>
                                        {((fda as any).label.dosage_and_administration as string[]).map((s, i) => (
                                            <p key={i} className="text-white/70 text-sm whitespace-pre-wrap leading-relaxed">{s}</p>
                                        ))}
                                    </div>
                                )}
                                {((fda as any)?.label?.warnings_and_precautions || []).length > 0 && (
                                    <div className="p-5 rounded-2xl bg-red-950/10 border border-red-500/15 backdrop-blur-xl">
                                        <p className="text-red-300 font-bold text-sm sm:text-base mb-2.5 border-b border-red-500/10 pb-2">{t("Warnings & Precautions (FDA)", "التحذيرات والاحتياطات الرسمية (FDA)")}</p>
                                        {((fda as any).label.warnings_and_precautions as string[]).map((s, i) => (
                                            <p key={i} className="text-red-100/80 text-sm whitespace-pre-wrap leading-relaxed">{s}</p>
                                        ))}
                                    </div>
                                )}
                                {((fda as any)?.label?.contraindications || []).length > 0 && (
                                    <div className="p-5 rounded-2xl bg-red-950/10 border border-red-500/15 backdrop-blur-xl">
                                        <p className="text-red-300 font-bold text-sm sm:text-base mb-2.5 border-b border-red-500/10 pb-2">{t("Contraindications (FDA)", "موانع الاستعمال الرسمية (FDA)")}</p>
                                        {((fda as any).label.contraindications as string[]).map((s, i) => (
                                            <p key={i} className="text-red-100/80 text-sm whitespace-pre-wrap leading-relaxed">{s}</p>
                                        ))}
                                    </div>
                                )}
                                {((fda as any)?.label?.drug_interactions || []).length > 0 && (
                                    <div className="p-5 rounded-2xl bg-orange-950/10 border border-orange-500/15 backdrop-blur-xl">
                                        <p className="text-orange-300 font-bold text-sm sm:text-base mb-2.5 border-b border-orange-500/10 pb-2">{t("Drug Interactions (FDA)", "التداخلات الدوائية الموثقة (FDA)")}</p>
                                        {((fda as any).label.drug_interactions as string[]).map((s, i) => (
                                            <p key={i} className="text-orange-100/80 text-sm whitespace-pre-wrap leading-relaxed">{s}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            plan !== 'ultra' && (
                                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-5 text-center">
                                    <Lock className="w-6 h-6 text-amber-300 mx-auto mb-2" />
                                    <p className="text-white font-bold text-sm">{t("Official FDA Drug Monograph Locked", "النشرة الطبية الرسمية مغلقة")}</p>
                                    <p className="text-white/60 text-xs mt-1 max-w-sm mx-auto">{t("Unlock direct excerpts from the FDA drug label dataset regarding safety warnings, drug combinations, and adverse reactions.", "افتح النشرات المباشرة من الغذاء والدواء للتحذيرات، تفاعلات الدواء، والأعراض الجانبية.")}</p>
                                    <div className="mt-3">
                                        <Button href="/pricing" size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-bold border-0">
                                            {t("Upgrade to Ultra", "ترقية إلى ألترا")}
                                        </Button>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                ) : fdaNdcFound ? (
                    <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 text-emerald-100 text-sm leading-relaxed">
                        {t("This medication matches an official FDA NDC code. However, the complete drug label details are not available in the openFDA database at this time.", "يتطابق هذا الدواء مع الكود الوطني الموحد لـ FDA. ولكن النشرة الطبية الكاملة غير متوفرة حالياً في خوادم openFDA.")}
                    </div>
                ) : (
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-slate-400 text-sm leading-relaxed">
                        {t(
                            fdaNotEnoughIdentifiers
                                ? "FDA verification needs an English drug name or an NDC. Try scanning the name more clearly or include an NDC if present on the package."
                                : "Not found in FDA databases (openFDA). It may be outside FDA coverage, a supplement, or not FDA-classified.",
                            fdaNotEnoughIdentifiers
                                ? "تعذر التحقق من FDA لأن الاسم بالإنجليزية أو رقم NDC غير متوفر. جرّب تصوير الاسم بوضوح أو تضمين رقم NDC إن كان موجودًا على العبوة."
                                : "غير موجود في قواعد بيانات FDA (openFDA). قد يكون خارج تغطية FDA أو مكملًا غذائيًا أو غير مُدرج."
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div ref={exportRef} className="w-full max-w-5xl" dir={isArabic ? "rtl" : "ltr"}>
            <GlassCard className="w-full p-0 overflow-hidden shadow-2xl shadow-black/25 text-start" hoverEffect={false}>
                {/* Header Section */}
                <div className="relative p-3.5 sm:p-8 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-black">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-5">
                        <div className="space-y-3.5">
                            {/* Title & FDA status */}
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-300">
                                    <Pill className="w-6 h-6 animate-pulse" />
                                </div>
                                <div>
                                    <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-none">{displayDrugName}</h2>
                                    {displayGenericName && (
                                        <p className="text-cyan-200/90 font-medium text-xs sm:text-sm mt-1">{displayGenericName}</p>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-1.5 ms-2">
                                    {fdaStatus === "verified" ? (
                                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> {t("FDA Verified", "موثّق من FDA")}
                                        </span>
                                    ) : fdaStatus === "not_found" ? (
                                        <span className="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/25 text-red-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                            <AlertOctagon className="w-3 h-3" /> {t("Not in FDA database", "غير موجود في FDA")}
                                        </span>
                                    ) : fdaStatus === "disabled" ? (
                                        <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                            <Lock className="w-3 h-3" /> {t("FDA disabled", "تم إيقاف FDA")}
                                        </span>
                                    ) : (
                                        <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" /> {t("FDA: Unconfirmed", "FDA: غير مؤكد")}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Badges / Comprehensive Pharmaceutical & Product Classification Hub */}
                            <div className="flex flex-wrap items-center gap-2 text-white/90 text-xs mt-3">
                                {/* Manufacturer */}
                                {data.manufacturer && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-200 shadow-sm">
                                        <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                        <span className="truncate">{translateMedicalTerm(data.manufacturer, isArabic)}</span>
                                    </div>
                                )}

                                {/* High-Level Category Label */}
                                {(data.productCategoryLabel || productKindLabel || data.category) && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 font-bold shadow-sm">
                                        {getMedicalCategoryIcon(data.productCategoryLabel || productKindLabel || data.category)}
                                        <span>{translateMedicalTerm(data.productCategoryLabel || productKindLabel || data.category, isArabic)}</span>
                                    </div>
                                )}

                                {/* Specific Dosage / Product Form (e.g. Tablets, Syrup, Deodorant Roll-on, Cream, Spray) */}
                                {data.form && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-200 font-semibold shadow-sm">
                                        {getMedicalFormIcon(data.form)}
                                        <span>{translateMedicalTerm(data.form, isArabic)}</span>
                                    </div>
                                )}

                                {/* Route of Administration (e.g. Topical External Only, Oral, Inhalation) */}
                                {data.routeOfAdministration && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 font-semibold shadow-sm">
                                        {getMedicalRouteIcon(data.routeOfAdministration)}
                                        <span>{translateMedicalTerm(data.routeOfAdministration, isArabic)}</span>
                                    </div>
                                )}

                                {/* Smart Age Suitability Classification Badge */}
                                {(() => {
                                    const ageRating = getAgeSuitability(data, isArabic);
                                    return (
                                        <div className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold shadow-sm transition-all",
                                            ageRating.colorClass
                                        )}>
                                            <div className="flex items-center gap-1">
                                                {ageRating.icon}
                                                <span className={cn(
                                                    "text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md border",
                                                    ageRating.pillBgClass
                                                )}>
                                                    <bdi dir="ltr">{ageRating.badgeText}</bdi>
                                                </span>
                                            </div>
                                            <span className="text-xs">{ageRating.fullLabel}</span>
                                        </div>
                                    );
                                })()}

                                {/* Strength */}
                                {data.strength && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/10 font-mono text-slate-100 font-bold shadow-sm">
                                        <bdi dir="ltr">{formatCleanStrength(data.strength)}</bdi>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Export & Actions */}
                        <div className="flex flex-wrap items-center gap-2 md:justify-end">
                            <div id="export" data-export-ignore className="flex flex-wrap items-center gap-1.5">
                                {onResetScan && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={onResetScan}
                                        className="border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-white h-9 rounded-xl text-xs px-3 border-0"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5 me-1.5" />
                                        <span>{t("New Scan", "فحص جديد")}</span>
                                    </Button>
                                )}

                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={downloadPng}
                                    disabled={!!exporting}
                                    className="border-white/10 text-white/80 hover:bg-white/10 h-9 rounded-xl text-xs px-3 border-0"
                                >
                                    <Download className="w-3.5 h-3.5 me-1.5" />
                                    {exporting === 'png' ? t("Exporting…", "جاري التصدير…") : "PNG"}
                                </Button>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={downloadPdf}
                                    disabled={!!exporting || plan !== 'ultra'}
                                    className={cn(
                                        "border-white/10 hover:bg-white/10 h-9 rounded-xl text-xs px-3 border-0",
                                        plan === 'ultra' ? "text-white/80" : "border-white/5 text-white/30"
                                    )}
                                >
                                    {plan === 'ultra' ? <FileDown className="w-3.5 h-3.5 me-1.5" /> : <Lock className="w-3.5 h-3.5 me-1.5 text-amber-400" />}
                                    {exporting === 'pdf' ? t("Exporting…", "جاري التصدير…") : t("PDF Report", "تقرير PDF")}
                                </Button>
                            </div>

                            <div className="flex items-center gap-1.5">
                                {meta?.plan && (
                                    <span className={cn(
                                        "px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wider",
                                        meta.plan === 'ultra'
                                            ? "bg-amber-500/10 text-amber-200 border-amber-500/30"
                                            : "bg-cyan-500/10 text-cyan-200 border-cyan-500/30"
                                    )}>
                                        {meta.plan === 'ultra' ? t('Ultra', 'ألترا') : t('Free', 'مجاني')}
                                    </span>
                                )}
                                {meta?.usedPrivateContext && (
                                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold border bg-amber-500/10 text-amber-200 border-amber-500/25">
                                        {t('Personalized', 'مخصص لحالتك')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {exportError && (
                        <div data-export-ignore className="relative z-10 mt-3.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs">
                            {exportError}
                        </div>
                    )}

                    {/* Premium STATEFUL TAB NAVIGATION SYSTEM (Horizontal Scrolling on Mobile, Grid/Flex on Desktop) */}
                    <div data-export-ignore className="relative z-10 mt-6 w-full">
                        {/* Scroll indicator fades on mobile */}
                        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-slate-950 via-slate-950/20 to-transparent pointer-events-none md:hidden z-20 rounded-l-2xl" />
                        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-slate-950 via-slate-950/20 to-transparent pointer-events-none md:hidden z-20 rounded-r-2xl" />
                        
                        <div className="overflow-x-auto whitespace-nowrap flex-nowrap flex md:flex-wrap gap-1.5 rounded-2xl border border-white/10 bg-slate-950/75 p-1.5 backdrop-blur-xl scrollbar-none relative">
                            {[
                                { id: "overview", label: t("Overview", "نظرة عامة"), icon: <Activity className="w-4 h-4" /> },
                                ...(isCosmetic ? [
                                    { id: "cosmetics", label: getCosmeticCareDomain(data, isArabic).tabTitle, icon: getCosmeticCareDomain(data, isArabic).icon }
                                ] : []),
                                { id: "safety", label: isCosmetic ? (getCosmeticCareDomain(data, isArabic).domain === "hair" ? t("Hair & Scalp Safety", "أمان الشعر وفروة الرأس") : getCosmeticCareDomain(data, isArabic).domain === "beard" ? t("Beard Safety", "أمان شعر اللحية") : t("Skin Safety & Precautions", "أمان البشرة والاحتياطات")) : t("Safety & Side Effects", "الأمان والآثار الجانبية"), icon: <ShieldAlert className="w-4 h-4" /> },
                                ...(!isCosmetic ? [
                                    { id: "guard", label: t("Interaction Guard", "حارس التداخلات الدوائية"), icon: <GitBranch className="w-4 h-4" /> }
                                ] : []),
                                { id: "chat", label: t("Ask AI", "اسأل الذكاء الاصطناعي"), icon: <Brain className="w-4 h-4" /> },
                                ...(!isCosmetic ? [
                                    { id: "fda", label: t("FDA Database", "التحقق من FDA"), icon: <Database className="w-4 h-4" /> }
                                ] : []),
                            ].map((item) => {
                                const active = activeTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setActiveTab(item.id as any)}
                                        className={cn(
                                            "flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-300 shrink-0",
                                            active 
                                                ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-100 scale-[1.02]" 
                                                : "border border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-white"
                                        )}
                                    >
                                        {item.icon}
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Dashboard Tab Panels */}
                <div className="bg-slate-950/20">
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'cosmetics' && renderCosmetics()}
                    {activeTab === 'safety' && renderSafety()}
                    {activeTab === 'guard' && !isCosmetic && renderGuard()}
                    {activeTab === 'chat' && renderChat()}
                    {activeTab === 'fda' && !isCosmetic && renderFda()}
                </div>

                {/* Footer */}
                <div className="p-4 bg-white/[0.02] border-t border-white/10 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div className="flex flex-col gap-1">
                        <p className="text-[10px] text-white/30">
                            {t(
                                "* Medication information summary. Verify with a medical professional.",
                                "* ملخص معلومات دوائية. تحقّق مع مختص."
                            )}
                        </p>
                        <p data-export-ignore className="text-[10px] text-white/30">
                            {t(
                                `* ${AI_DISPLAY_NAME} summary. Verify with a medical professional. FDA label used when available.`,
                                `* ملخص بواسطة ${AI_DISPLAY_NAME}. تحقّق مع مختص. تُستخدم بيانات FDA عند توفرها.`
                            )}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold">
                        {savedToHistory ? (
                            <Link href="/dashboard/history" className="flex items-center gap-1.5 text-green-400 hover:underline">
                                <CheckCircle2 className="w-3.5 h-3.5" /> {t('Saved to History', 'تم الحفظ في السجل')}
                            </Link>
                        ) : (
                            <span className="text-white/40">{t('Not saved', 'لم يتم الحفظ')}</span>
                        )}
                    </div>
                </div>

                {/* Liquid Glass Quick AI Consultation Modal */}
                {quickConsult?.isOpen && (
                    <div 
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
                        onClick={() => setQuickConsult(null)}
                    >
                        <div 
                            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/98 p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.85),inset_0_1px_2px_rgba(255,255,255,0.2)] backdrop-blur-2xl transition-all"
                            onClick={(e) => e.stopPropagation()}
                            dir={isArabic ? "rtl" : "ltr"}
                        >
                            {/* Decorative liquid glows */}
                            <div className="absolute -top-20 -right-20 w-44 h-44 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

                            {/* Header */}
                            <div className="relative flex items-start justify-between gap-3 border-b border-white/10 pb-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                                        <Brain className="w-5 h-5 text-cyan-300" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-base sm:text-lg">
                                            {t("Qure AI Consultation", "استشارة سريرية مع Qure AI")}
                                        </h3>
                                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                            <span className="text-[11px] font-semibold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">
                                                {quickConsult.sectionTitle}
                                            </span>
                                            <span className="text-white/40 text-xs">•</span>
                                            <span className="text-[11px] font-medium text-white/70 truncate max-w-[200px]" title={quickConsult.topic}>
                                                {quickConsult.topic}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setQuickConsult(null)}
                                    className="p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                                    title={t("Close", "إغلاق")}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Prompt Input Area */}
                            <div className="relative space-y-3">
                                <label className="text-xs font-bold text-white/80 block">
                                    {t("Edit or customize your clinical question:", "حرر أو خصص سؤالك واستفسارك للذكاء الاصطناعي:")}
                                </label>
                                <textarea
                                    value={quickConsult.question}
                                    onChange={(e) => setQuickConsult({ ...quickConsult, question: e.target.value })}
                                    rows={4}
                                    className="w-full rounded-2xl bg-white/[0.04] border border-white/15 focus:border-cyan-400/60 focus:bg-white/[0.06] p-3.5 text-white text-xs sm:text-sm leading-relaxed placeholder:text-white/30 outline-none transition-all resize-none shadow-inner"
                                    placeholder={t("Type your custom question here...", "اكتب استفسارك الدقيق هنا...")}
                                />

                                {/* Smart Preset Chips */}
                                <div className="space-y-1.5 pt-1">
                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                                        {t("Quick Suggestions:", "اقتراحات أسئلة سريعة:")}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {[
                                            {
                                                label: isArabic ? "مدى الأمان والاستخدام الطويل" : "Long-term Safety",
                                                q: isArabic 
                                                    ? `هل يعتبر (${quickConsult.topic}) آمناً للاستخدام المتكرر أو لفترة طويلة مع دواء ${displayDrugName}؟` 
                                                    : `Is (${quickConsult.topic}) safe for long-term or repeated use with ${displayDrugName}?`
                                            },
                                            {
                                                label: isArabic ? "التداخل مع الأمراض المزمنة" : "Chronic Conditions",
                                                q: isArabic 
                                                    ? `هل يتعارض (${quickConsult.topic}) مع مرضى الضغط، السكري، أو الكبد والكلى؟` 
                                                    : `Does (${quickConsult.topic}) have adverse risks for hypertension, diabetes, kidney, or liver disease?`
                                            },
                                            {
                                                label: isArabic ? "التوقيت والجرعة والبدائل" : "Timing & Alternatives",
                                                q: isArabic 
                                                    ? `ما هي أفضل طريقة وتوقيت للتعامل مع (${quickConsult.topic})؟ وهل توجد بدائل أكثر أماناً؟` 
                                                    : `What is the optimal timing and protocol for (${quickConsult.topic}), and are there safer alternatives?`
                                            }
                                        ].map((chip, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setQuickConsult({ ...quickConsult, question: chip.q })}
                                                className="text-[11px] px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-500/30 text-white/70 hover:text-cyan-200 transition-all cursor-pointer text-start"
                                            >
                                                {chip.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Actions */}
                            <div className="relative flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setQuickConsult(null)}
                                    className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                                >
                                    {t("Cancel", "إلغاء")}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const topic = quickConsult.topic;
                                        const q = quickConsult.question.trim();
                                        setQuickConsult(null);
                                        if (q) {
                                            askAiAbout(topic, q);
                                        }
                                    }}
                                    className="shiny-cta-btn inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm gap-2 select-none cursor-pointer text-slate-950"
                                >
                                    <Sparkles className="w-4 h-4 text-slate-950" />
                                    <span>{t("Ask Qure AI Now", "بدء الاستشارة الفورية")}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </GlassCard>
        </div>
    );
};
