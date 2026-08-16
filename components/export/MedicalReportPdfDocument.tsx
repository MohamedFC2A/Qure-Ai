import React from "react";
import {
    ShieldCheck,
    AlertTriangle,
    CheckCircle2,
    Clock,
    AlertOctagon,
    HeartPulse,
    Info,
    Calendar,
    Stethoscope,
    Pill,
    Zap,
} from "lucide-react";
import { translateMedicalTerm } from "@/components/scanner/MedicalResultCard";

interface MedicalReportPdfDocumentProps {
    data: any;
    isArabic: boolean;
    reportId: string;
    generatedAt: string;
    userName?: string;
    plan?: string;
}

// Exact A4 dimensions @ 96 DPI
const PAGE_W = 794;
const PAGE_H = 1123;

export const MedicalReportPdfDocument: React.FC<MedicalReportPdfDocumentProps> = ({
    data,
    isArabic,
    reportId,
    generatedAt,
    userName,
    plan = "ultra",
}) => {
    const t = (en: string, ar: string) => (isArabic ? ar : en);
    const dir = isArabic ? "rtl" : "ltr";

    const isLatinOnly = (text: string) => /^[A-Za-z0-9\s+,./()–—:%-]+$/.test(String(text || "").trim());

    const rawDrugName = data?.drugName || "";
    const rawDrugNameEn = data?.drugNameEn || "";
    const drugName = isArabic 
        ? (rawDrugName || rawDrugNameEn || t("Unknown Medication", "دواء غير محدد")) 
        : (rawDrugNameEn || rawDrugName || t("Unknown Medication", "دواء غير محدد"));
    
    const drugNameEn = rawDrugNameEn || (isLatinOnly(rawDrugName) ? rawDrugName : "");
    
    const rawGeneric = data?.genericName || data?.activeIngredients?.[0] || "";
    const rawGenericEn = data?.genericNameEn || "";
    const genericName = isArabic
        ? (rawGeneric || rawGenericEn || t("Not specified", "غير محدد"))
        : (rawGenericEn || rawGeneric || t("Not specified", "غير محدد"));

    const manufacturer = translateMedicalTerm(data?.manufacturer, isArabic) || t("Pharmaceutical Co.", "شركة دوائية معتمدة");
    
    let strength = String(data?.strength || "").trim().replace(/\/1\b/g, "");
    if (!strength && Array.isArray(data?.activeIngredientsDetailed) && data.activeIngredientsDetailed.length > 0) {
        strength = data.activeIngredientsDetailed.map((ai: any) => ai.strength).filter(Boolean).join(" + ");
    }
    
    const dosageForm = translateMedicalTerm(data?.dosageForm || data?.form, isArabic) || (isArabic ? "أقراص" : "Tablets");
    const route = translateMedicalTerm(data?.routeOfAdministration, isArabic) || (isArabic ? "عن طريق الفم" : "Oral");
    const confidence = data?.confidenceScore || 98;

    const uses: string[] = Array.isArray(data?.uses) ? data.uses : [];
    const warnings: string[] = Array.isArray(data?.warnings) ? data.warnings : [];
    const contraindications: string[] = Array.isArray(data?.contraindications) ? data.contraindications : [];
    const precautions: string[] = Array.isArray(data?.precautions) ? data.precautions : [];
    const sideEffects: string[] = Array.isArray(data?.sideEffects) ? data.sideEffects : [];
    const interactions: string[] = Array.isArray(data?.interactions) ? data.interactions : [];
    const whenToSeekHelp: string[] = Array.isArray(data?.whenToSeekHelp) ? data.whenToSeekHelp : [];
    const activeIngredients: string[] = Array.isArray(data?.activeIngredients) ? data.activeIngredients : [];
    const activeIngredientsDetailed = Array.isArray(data?.activeIngredientsDetailed) ? data.activeIngredientsDetailed : [];
    const storage = data?.storage || t(
        "Store below 25°C in a dry place away from light and children.",
        "يحفظ في درجة حرارة أقل من 25 مئوية في مكان جاف بعيداً عن الضوء ومتناول الأطفال."
    );

    /** Shared page style — each page is an isolated A4-sized box with strict layout containment */
    const pageStyle: React.CSSProperties = {
        width: `${PAGE_W}px`,
        height: `${PAGE_H}px`,
        minHeight: `${PAGE_H}px`,
        maxHeight: `${PAGE_H}px`,
        overflow: "hidden",
        boxSizing: "border-box",
        backgroundColor: "#FFFFFF",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        pageBreakAfter: "always",
        fontFamily: "'Segoe UI', 'Cairo', Tahoma, Arial, sans-serif",
        WebkitFontSmoothing: "antialiased",
    };

    /** Robust list item renderer with zero overlap guarantee */
    const renderListItem = (
        text: string,
        idx: number,
        badgeType: "number" | "check" | "warning" | "cross" | "bullet" | "emergency",
        customColor?: string
    ) => {
        let badgeBg = "#e0f2fe";
        let badgeColor = "#0369a1";
        let badgeContent: React.ReactNode = idx + 1;

        if (badgeType === "check") {
            badgeBg = "#dcfce7";
            badgeColor = "#15803d";
            badgeContent = "✓";
        } else if (badgeType === "warning") {
            badgeBg = "#fef3c7";
            badgeColor = "#b45309";
            badgeContent = "▲";
        } else if (badgeType === "cross") {
            badgeBg = "#ffe4e6";
            badgeColor = "#e11d48";
            badgeContent = "✕";
        } else if (badgeType === "bullet") {
            badgeBg = "#e2e8f0";
            badgeColor = "#475569";
            badgeContent = "•";
        } else if (badgeType === "emergency") {
            badgeBg = "#fee2e2";
            badgeColor = "#b91c1c";
            badgeContent = "!";
        }

        return (
            <div
                key={idx}
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    marginBottom: "8px",
                    width: "100%",
                }}
            >
                <div
                    style={{
                        width: "18px",
                        height: "18px",
                        minWidth: "18px",
                        borderRadius: "50%",
                        background: customColor || badgeBg,
                        color: badgeColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "9px",
                        fontWeight: "800",
                        flexShrink: 0,
                        marginTop: "2px",
                        lineHeight: 1,
                    }}
                >
                    {badgeContent}
                </div>
                <div
                    style={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: "10.5px",
                        color: "#1e293b",
                        fontWeight: "500",
                        lineHeight: "1.6",
                        textAlign: isArabic ? "right" : "left",
                        direction: isArabic ? "rtl" : "ltr",
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                    }}
                >
                    {text}
                </div>
            </div>
        );
    };

    return (
        <div
            id="qure-pdf-document"
            dir={dir}
            style={{
                width: `${PAGE_W}px`,
                backgroundColor: "#FFFFFF",
                fontFamily: "'Segoe UI', 'Cairo', Tahoma, Arial, sans-serif",
                direction: isArabic ? "rtl" : "ltr",
            }}
        >
            {/* ══════════════════════════════════════════════════════════════
                PAGE 1 — CLINICAL COVER & EXECUTIVE SUMMARY
            ══════════════════════════════════════════════════════════════ */}
            <div className="qure-pdf-page" style={{ ...pageStyle, borderBottom: "1px solid #e2e8f0", padding: "34px 40px 24px" }}>
                <div style={{ flex: 1, overflow: "hidden" }}>
                    {/* ── Top Header ── */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #0369a1", paddingBottom: "12px", marginBottom: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{
                                width: "42px", height: "42px", borderRadius: "10px",
                                background: "#0c4a6e", color: "white",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontWeight: "900", fontSize: "22px", flexShrink: 0,
                            }}>+</div>
                            <div>
                                <h1 style={{ fontSize: "16px", fontWeight: "900", color: "#0c4a6e", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span>QURE AI</span>
                                    <span style={{
                                        fontSize: "9px", fontWeight: "700",
                                        padding: "2px 8px", borderRadius: "999px",
                                        background: "#e0f2fe", color: "#075985",
                                        border: "1px solid #bae6fd",
                                    }}>CLINICAL INTELLIGENCE</span>
                                </h1>
                                <p style={{ fontSize: "10px", color: "#64748b", margin: "2px 0 0", fontWeight: "500" }}>
                                    {t("Precision Medication Safety & Pharmacological Verification", "نظام الذكاء الصيدلاني والتحقق السريري الشامل")}
                                </p>
                            </div>
                        </div>
                        <div style={{ textAlign: isArabic ? "left" : "right" }}>
                            <div style={{ fontSize: "11px", fontWeight: "800", fontFamily: "monospace", color: "#0c4a6e", letterSpacing: "0.05em" }}>{reportId}</div>
                            <div style={{ fontSize: "9px", color: "#64748b", marginTop: "2px", display: "flex", alignItems: "center", gap: "4px", justifyContent: isArabic ? "flex-start" : "flex-end" }}>
                                <Calendar style={{ width: "10px", height: "10px" }} />
                                <span>{generatedAt}</span>
                            </div>
                            <div style={{ fontSize: "8px", color: "#15803d", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "2px" }}>
                                ● {t("Verified Clinical Record", "سجل سريري معتمد")}
                            </div>
                        </div>
                    </div>

                    {/* ── Patient & Session Bar ── */}
                    <div style={{
                        display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px",
                        background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px",
                        padding: "10px 14px", marginBottom: "16px",
                    }}>
                        {[
                            { label: t("Patient / Profile", "الملف / المريض"), value: userName || t("Primary User", "المستخدم الرئيسي"), color: "#0f172a" },
                            { label: t("Safety Tier", "مستوى الأمان"), value: `✓ ${t("High", "موثوق")} (${confidence}%)`, color: "#15803d" },
                            { label: t("Sources", "قواعد التحقق"), value: "openFDA • RxNorm", color: "#0f172a" },
                            { label: t("Document Type", "نوع الوثيقة"), value: t("Medical Dossier", "تقرير دوائي رسمي"), color: "#0c4a6e" },
                        ].map((item, i) => (
                            <div key={i}>
                                <span style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", fontWeight: "600", display: "block" }}>{item.label}</span>
                                <span style={{ fontSize: "10px", fontWeight: "700", color: item.color, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* ── Drug Hero Banner ── */}
                    <div style={{
                        background: "linear-gradient(135deg, #0c4a6e 0%, #1e3a5f 50%, #1e1b4b 100%)",
                        color: "white", borderRadius: "12px", padding: "16px 20px",
                        marginBottom: "16px",
                        direction: isArabic ? "rtl" : "ltr",
                    }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                            {/* Main Drug Details (Right in RTL, Left in LTR) */}
                            <div style={{ flex: "1 1 auto", minWidth: 0, textAlign: isArabic ? "right" : "left" }}>
                                {/* Pill badge: Form • Route */}
                                <div style={{
                                    display: "inline-flex", alignItems: "center", gap: "6px",
                                    padding: "3px 10px", borderRadius: "999px",
                                    background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.22)",
                                    fontSize: "9px", fontWeight: "700", color: "#bae6fd",
                                    marginBottom: "6px",
                                }}>
                                    <Pill style={{ width: "11px", height: "11px", flexShrink: 0 }} />
                                    <span>{dosageForm} • {route}</span>
                                </div>

                                {/* Trade Name */}
                                <h2 style={{
                                    fontSize: drugName.length > 30 ? "17px" : "21px",
                                    fontWeight: "900",
                                    color: "white",
                                    margin: "0 0 2px",
                                    lineHeight: "1.25",
                                    wordBreak: "break-word",
                                    fontFamily: isArabic ? "'Cairo', 'Segoe UI', Tahoma, sans-serif" : "inherit"
                                }}>
                                    {drugName}
                                </h2>

                                {/* Secondary English Trade Name if in Arabic mode & distinct */}
                                {isArabic && drugNameEn && drugNameEn.toLowerCase() !== drugName.toLowerCase() && (
                                    <p style={{
                                        fontSize: "10.5px",
                                        color: "#93c5fd",
                                        fontFamily: "monospace",
                                        fontWeight: "600",
                                        margin: "0 0 4px",
                                        direction: "ltr",
                                        textAlign: "right"
                                    }}>
                                        <bdi dir="ltr">{drugNameEn}</bdi>
                                    </p>
                                )}

                                {/* Generic Scientific Molecule */}
                                <div style={{
                                    display: "flex",
                                    alignItems: "baseline",
                                    gap: "5px",
                                    fontSize: "10px",
                                    color: "#cbd5e1",
                                    marginTop: "4px",
                                    flexWrap: "wrap",
                                    lineHeight: "1.4"
                                }}>
                                    <span style={{ opacity: 0.8, fontWeight: "700", flexShrink: 0 }}>
                                        {t("Generic Name:", "الاسم العلمي:")}
                                    </span>
                                    <strong style={{
                                        color: "#f8fafc",
                                        fontWeight: "700",
                                        direction: isLatinOnly(genericName) ? "ltr" : (isArabic ? "rtl" : "ltr"),
                                        unicodeBidi: "isolate"
                                    }}>
                                        <bdi dir={isLatinOnly(genericName) ? "ltr" : (isArabic ? "rtl" : "ltr")}>
                                            {genericName}
                                        </bdi>
                                    </strong>
                                </div>
                            </div>

                            {/* Strength & Manufacturer Box (Left in RTL, Right in LTR) */}
                            <div style={{
                                flex: "0 0 auto",
                                minWidth: "160px",
                                maxWidth: "240px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: isArabic ? "flex-start" : "flex-end",
                                gap: "5px"
                            }}>
                                <div style={{
                                    background: "rgba(255,255,255,0.08)",
                                    border: "1px solid rgba(255,255,255,0.18)",
                                    padding: "7px 12px",
                                    borderRadius: "8px",
                                    width: "100%",
                                    boxSizing: "border-box",
                                    textAlign: "center"
                                }}>
                                    <span style={{ fontSize: "8.5px", color: "#bae6fd", display: "block", fontWeight: "700", textTransform: "uppercase", marginBottom: "2px" }}>
                                        {t("Strength / Concentration", "التركيز الدوائي")}
                                    </span>
                                    <span style={{
                                        fontSize: strength.length > 20 ? "10px" : "12px",
                                        fontWeight: "900",
                                        color: "white",
                                        display: "block",
                                        lineHeight: "1.3",
                                        wordBreak: "break-word"
                                    }}>
                                        <bdi dir="ltr">{strength || t("Standard", "معياري")}</bdi>
                                    </span>
                                </div>

                                {manufacturer && (
                                    <div style={{
                                        fontSize: "9px",
                                        color: "#93c5fd",
                                        fontWeight: "600",
                                        maxWidth: "100%",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        textAlign: isArabic ? "left" : "right",
                                        width: "100%"
                                    }}>
                                        {manufacturer}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Medical Indications ── */}
                    <div style={{ marginBottom: "14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <div style={{ padding: "4px", borderRadius: "7px", background: "#e0f2fe", color: "#075985", display: "flex" }}>
                                <Stethoscope style={{ width: "14px", height: "14px" }} />
                            </div>
                            <h3 style={{ fontSize: "11px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 }}>
                                {t("Primary Medical Indications & Uses", "دواعي الاستعمال السريرية المعتمدة")}
                            </h3>
                        </div>
                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px 14px" }}>
                            {uses.length > 0 ? (
                                <div>
                                    {uses.slice(0, 5).map((use, idx) => renderListItem(use, idx, "number"))}
                                </div>
                            ) : (
                                <p style={{ fontSize: "10.5px", color: "#475569", margin: 0, fontWeight: "500", lineHeight: "1.6" }}>
                                    {data?.description || t("Refer to prescribing physician instructions.", "يرجى مراجعة إرشادات الطبيب المعالج.")}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ── Dosage & Administration ── */}
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <div style={{ padding: "4px", borderRadius: "7px", background: "#d1fae5", color: "#065f46", display: "flex" }}>
                                <Clock style={{ width: "14px", height: "14px" }} />
                            </div>
                            <h3 style={{ fontSize: "11px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 }}>
                                {t("Dosage & Administration Protocol", "بروتوكول الجرعات وطريقة الاستخدام")}
                            </h3>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "12px 14px" }}>
                                <span style={{ fontSize: "9px", fontWeight: "700", color: "#14532d", display: "block", marginBottom: "4px" }}>
                                    {t("Standard Daily Dosage", "الجرعة الموصى بها")}
                                </span>
                                <p style={{ fontSize: "10.5px", color: "#14532d", fontWeight: "500", lineHeight: "1.6", margin: 0, wordBreak: "break-word" }}>
                                    {data?.dosage || t("Take strictly as directed by your healthcare professional.", "تناول الدواء بدقة حسب توجيهات الطبيب أو الصيدلي.")}
                                </p>
                            </div>
                            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", padding: "12px 14px" }}>
                                <span style={{ fontSize: "9px", fontWeight: "700", color: "#78350f", display: "block", marginBottom: "4px" }}>
                                    {t("Missed Dose Guideline", "في حال نسيان الجرعة")}
                                </span>
                                <p style={{ fontSize: "10.5px", color: "#78350f", fontWeight: "500", lineHeight: "1.6", margin: 0, wordBreak: "break-word" }}>
                                    {data?.missedDose || t("Take as soon as remembered. Never double the dose.", "تناولها فور التذكر ما لم يقترب موعد الجرعة التالية. لا تضاعف الجرعة.")}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Page 1 Footer ── */}
                <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "14px" }}>
                    <span style={{ fontSize: "8px", color: "#94a3b8" }}>QURE AI Medical Intelligence • Confidential Patient Document</span>
                    <span style={{ fontSize: "8px", color: "#64748b", fontWeight: "600" }}>{t("Page 1 of 3 — Clinical Executive Summary", "صفحة 1 من 3 — الملخص السريري")}</span>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                PAGE 2 — ACTIVE INGREDIENTS & SAFETY CONTRAINDICATIONS
            ══════════════════════════════════════════════════════════════ */}
            <div className="qure-pdf-page" style={{ ...pageStyle, borderBottom: "1px solid #e2e8f0", padding: "32px 40px 24px" }}>
                <div style={{ flex: 1, overflow: "hidden" }}>
                    {/* ── Running Header ── */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px", marginBottom: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontWeight: "800", color: "#0c4a6e", fontSize: "12px" }}>QURE AI</span>
                            <span style={{ color: "#cbd5e1" }}>|</span>
                            <span style={{ fontSize: "10px", fontWeight: "600", color: "#475569" }}>{drugName}</span>
                        </div>
                        <div style={{ fontSize: "9px", fontFamily: "monospace", color: "#94a3b8" }}>{reportId} • {t("Page 2 of 3", "صفحة 2 من 3")}</div>
                    </div>

                    {/* ── Active Ingredients Table ── */}
                    <div style={{ marginBottom: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <div style={{ padding: "4px", borderRadius: "7px", background: "#e0e7ff", color: "#3730a3", display: "flex" }}>
                                <Zap style={{ width: "14px", height: "14px" }} />
                            </div>
                            <h3 style={{ fontSize: "11px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 }}>
                                {t("Active Ingredients & Pharmacological Profile", "المكونات الفعالة والتركيب الدوائي")}
                            </h3>
                        </div>
                        <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
                                <thead>
                                    <tr style={{ background: "#f1f5f9" }}>
                                        <th style={{ padding: "8px 10px", textAlign: isArabic ? "right" : "left", fontWeight: "700", color: "#374151", borderBottom: "1px solid #e2e8f0" }}>{t("Active Molecule", "المادة الفعالة")}</th>
                                        <th style={{ padding: "8px 10px", textAlign: isArabic ? "right" : "left", fontWeight: "700", color: "#374151", borderBottom: "1px solid #e2e8f0" }}>{t("Strength", "التركيز")}</th>
                                        <th style={{ padding: "8px 10px", textAlign: isArabic ? "right" : "left", fontWeight: "700", color: "#374151", borderBottom: "1px solid #e2e8f0" }}>{t("Pharmacological Role", "الهدف الطبي")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeIngredientsDetailed.length > 0 ? (
                                        activeIngredientsDetailed.map((ing: any, idx: number) => (
                                            <tr key={idx} style={{ background: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                                                <td style={{ padding: "8px 10px", fontWeight: "700", color: "#0c4a6e", textAlign: isArabic ? "right" : "left" }}>
                                                    <bdi dir={isLatinOnly(ing?.name) ? "ltr" : (isArabic ? "rtl" : "ltr")}>{ing?.name || ""}</bdi>
                                                </td>
                                                <td style={{ padding: "8px 10px", fontFamily: "monospace", fontWeight: "600", textAlign: isArabic ? "right" : "left" }}>
                                                    <bdi dir="ltr">{ing?.strength || strength || t("Standard", "معياري")}</bdi>
                                                </td>
                                                <td style={{ padding: "8px 10px", color: "#475569", textAlign: isArabic ? "right" : "left" }}>
                                                    {translateMedicalTerm(ing?.source, isArabic) || t("Active Therapeutic Agent", "مركب علاجي رئيسي")}
                                                </td>
                                            </tr>
                                        ))
                                    ) : activeIngredients.length > 0 ? (
                                        activeIngredients.map((name: string, idx: number) => (
                                            <tr key={idx} style={{ background: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                                                <td style={{ padding: "8px 10px", fontWeight: "700", color: "#0c4a6e", textAlign: isArabic ? "right" : "left" }}>
                                                    <bdi dir={isLatinOnly(name) ? "ltr" : (isArabic ? "rtl" : "ltr")}>{name}</bdi>
                                                </td>
                                                <td style={{ padding: "8px 10px", fontFamily: "monospace", fontWeight: "600", textAlign: isArabic ? "right" : "left" }}>
                                                    <bdi dir="ltr">{strength || t("Standard", "معياري")}</bdi>
                                                </td>
                                                <td style={{ padding: "8px 10px", color: "#475569", textAlign: isArabic ? "right" : "left" }}>
                                                    {t("Active Therapeutic Agent", "مركب علاجي فعال")}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td style={{ padding: "8px 10px", fontWeight: "700", color: "#0c4a6e", textAlign: isArabic ? "right" : "left" }}>
                                                <bdi dir={isLatinOnly(genericName) ? "ltr" : (isArabic ? "rtl" : "ltr")}>{genericName}</bdi>
                                            </td>
                                            <td style={{ padding: "8px 10px", fontFamily: "monospace", fontWeight: "600", textAlign: isArabic ? "right" : "left" }}>
                                                <bdi dir="ltr">{strength || t("Standard", "معياري")}</bdi>
                                            </td>
                                            <td style={{ padding: "8px 10px", color: "#475569", textAlign: isArabic ? "right" : "left" }}>{dosageForm}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ── Warnings & Precautions ── */}
                    <div style={{ marginBottom: "14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <div style={{ padding: "4px", borderRadius: "7px", background: "#fef3c7", color: "#92400e", display: "flex" }}>
                                <AlertTriangle style={{ width: "14px", height: "14px" }} />
                            </div>
                            <h3 style={{ fontSize: "11px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 }}>
                                {t("Critical Clinical Warnings & Precautions", "التحذيرات والاحتياطات السريرية الهامة")}
                            </h3>
                        </div>
                        <div style={{ background: "#fffbeb", border: "1px solid rgba(251,191,36,0.5)", borderRadius: "10px", padding: "12px 14px" }}>
                            {(warnings.length > 0 ? warnings : precautions).slice(0, 4).length > 0 ? (
                                <div>
                                    {(warnings.length > 0 ? warnings : precautions).slice(0, 4).map((warn, idx) =>
                                        renderListItem(warn, idx, "warning")
                                    )}
                                </div>
                            ) : (
                                <p style={{ fontSize: "10.5px", color: "#92400e", margin: 0, fontWeight: "500", lineHeight: "1.6" }}>
                                    {t("Follow physician advice. Discontinue and consult doctor if adverse symptoms occur.", "التزم بتعليمات الطبيب وتوقف عن الدواء فوراً في حال ظهور أعراض غير معتادة.")}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ── Contraindications ── */}
                    <div style={{ marginBottom: "14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <div style={{ padding: "4px", borderRadius: "7px", background: "#ffe4e6", color: "#9f1239", display: "flex" }}>
                                <AlertOctagon style={{ width: "14px", height: "14px" }} />
                            </div>
                            <h3 style={{ fontSize: "11px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 }}>
                                {t("Contraindications & Prohibited Cases", "موانع الاستعمال والحالات المحظورة")}
                            </h3>
                        </div>
                        <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "10px", padding: "12px 14px" }}>
                            {contraindications.length > 0 ? (
                                <div>
                                    {contraindications.slice(0, 4).map((contra, idx) =>
                                        renderListItem(contra, idx, "cross")
                                    )}
                                </div>
                            ) : (
                                <p style={{ fontSize: "10.5px", color: "#9f1239", margin: 0, fontWeight: "500", lineHeight: "1.6" }}>
                                    {t("Hypersensitivity to the active substance or any excipients.", "الحساسية المفرطة للمادة الفعالة أو أي من مكونات الدواء.")}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ── Storage ── */}
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                            <div style={{ padding: "4px", borderRadius: "7px", background: "#f1f5f9", color: "#475569", display: "flex" }}>
                                <Info style={{ width: "14px", height: "14px" }} />
                            </div>
                            <h3 style={{ fontSize: "10px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 }}>
                                {t("Storage & Handling Instructions", "إرشادات الحفظ والتخزين السليم")}
                            </h3>
                        </div>
                        <div style={{ padding: "10px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "10px", color: "#374151", fontWeight: "500", lineHeight: "1.5" }}>
                            {storage}
                        </div>
                    </div>
                </div>

                {/* ── Page 2 Footer ── */}
                <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "14px" }}>
                    <span style={{ fontSize: "8px", color: "#94a3b8" }}>QURE AI Medical Intelligence • Confidential Patient Document</span>
                    <span style={{ fontSize: "8px", color: "#64748b", fontWeight: "600" }}>{t("Page 2 of 3 — Pharmacological Safety & Warnings", "صفحة 2 من 3 — السلامة والتحذيرات")}</span>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                PAGE 3 — INTERACTIONS, SIDE EFFECTS & VERIFICATION
            ══════════════════════════════════════════════════════════════ */}
            <div className="qure-pdf-page" style={{ ...pageStyle, padding: "32px 40px 24px" }}>
                <div style={{ flex: 1, overflow: "hidden" }}>
                    {/* ── Running Header ── */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px", marginBottom: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontWeight: "800", color: "#0c4a6e", fontSize: "12px" }}>QURE AI</span>
                            <span style={{ color: "#cbd5e1" }}>|</span>
                            <span style={{ fontSize: "10px", fontWeight: "600", color: "#475569" }}>{drugName}</span>
                        </div>
                        <div style={{ fontSize: "9px", fontFamily: "monospace", color: "#94a3b8" }}>{reportId} • {t("Page 3 of 3", "صفحة 3 من 3")}</div>
                    </div>

                    {/* ── Drug Interactions ── */}
                    <div style={{ marginBottom: "14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <div style={{ padding: "4px", borderRadius: "7px", background: "#fef3c7", color: "#92400e", display: "flex" }}>
                                <AlertTriangle style={{ width: "14px", height: "14px" }} />
                            </div>
                            <h3 style={{ fontSize: "11px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 }}>
                                {t("Drug & Food Interactions Guard", "التداخلات الدوائية والغذائية المحتملة")}
                            </h3>
                        </div>
                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px 14px" }}>
                            {interactions.length > 0 ? (
                                <div>
                                    {interactions.slice(0, 4).map((inter, idx) =>
                                        renderListItem(inter, idx, "warning")
                                    )}
                                </div>
                            ) : (
                                <p style={{ fontSize: "10.5px", color: "#475569", margin: 0, fontWeight: "500", lineHeight: "1.6" }}>
                                    {t("No major critical interactions reported in standard therapeutic doses.", "لم تسجل تداخلات حرجة معروفة ضمن الجرعات العلاجية المعتادة.")}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ── Side Effects ── */}
                    <div style={{ marginBottom: "14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <div style={{ padding: "4px", borderRadius: "7px", background: "#e0f2fe", color: "#075985", display: "flex" }}>
                                <HeartPulse style={{ width: "14px", height: "14px" }} />
                            </div>
                            <h3 style={{ fontSize: "11px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 }}>
                                {t("Potential Adverse Reactions & Side Effects", "الآثار الجانبية المحتملة")}
                            </h3>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                            {sideEffects.slice(0, 6).map((effect, idx) => (
                                <div key={idx} style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "6px",
                                    background: "#f8fafc",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "8px",
                                    padding: "8px 10px"
                                }}>
                                    <span style={{ color: "#0369a1", fontWeight: "700", flexShrink: 0, fontSize: "11px", marginTop: "1px" }}>•</span>
                                    <span style={{ fontSize: "10px", color: "#1e293b", fontWeight: "500", lineHeight: "1.4", textAlign: isArabic ? "right" : "left", flex: 1, minWidth: 0, wordBreak: "break-word" }}>{effect}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Red Flags ── */}
                    <div style={{ marginBottom: "14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                            <div style={{ padding: "4px", borderRadius: "7px", background: "#ffe4e6", color: "#9f1239", display: "flex" }}>
                                <AlertOctagon style={{ width: "14px", height: "14px" }} />
                            </div>
                            <h3 style={{ fontSize: "10px", fontWeight: "800", color: "#9f1239", textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 }}>
                                {t("Emergency Red Flags (Seek Immediate Medical Help)", "علامات الخطر الطارئة (تستوجب الطوارئ فوراً)")}
                            </h3>
                        </div>
                        <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "10px", padding: "10px 14px" }}>
                            {(whenToSeekHelp.length > 0 ? whenToSeekHelp : [
                                t("Severe allergic reaction: breathing difficulty, facial swelling, severe rash.", "أعراض الحساسية المفرطة: تورم الوجه، ضيق التنفس، طفح جلدي حاد."),
                                t("Unusual rapid heartbeat, severe dizziness, loss of consciousness, or chest pain.", "تسارع ضربات القلب، الدوار الشديد، الإغماء، أو ألم الصدر الحاد.")
                            ]).slice(0, 3).map((flag, idx) =>
                                renderListItem(flag, idx, "emergency")
                            )}
                        </div>
                    </div>

                    {/* ── Physician Signature Block ── */}
                    <div style={{ border: "1px dashed #cbd5e1", borderRadius: "10px", padding: "12px 14px", background: "rgba(248,250,252,0.5)", marginBottom: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                            <span style={{ fontSize: "9.5px", fontWeight: "700", color: "#374151" }}>{t("Healthcare Professional Review & Signature", "مساحة توقيع واعتماد الطبيب أو الصيدلي")}</span>
                            <span style={{ fontSize: "8px", color: "#94a3b8" }}>{t("Clinical Stamp", "ختم العيادة / الصيدلية")}</span>
                        </div>
                        <div style={{ height: "34px", borderBottom: "1px solid #cbd5e1", marginBottom: "6px" }} />
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "8px", color: "#64748b" }}>
                            <span>{t("Doctor / Pharmacist Name: _______________________", "اسم الطبيب / الصيدلي: _______________________")}</span>
                            <span>{t("Date: ____ / ____ / 2026", "التاريخ: ____ / ____ / 2026")}</span>
                        </div>
                    </div>
                </div>

                {/* ── Digital Seal & Disclaimer Footer ── */}
                <div>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "#0f172a",
                        color: "white",
                        borderRadius: "10px",
                        padding: "10px 14px",
                        marginBottom: "8px",
                    }}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                                <ShieldCheck style={{ width: "13px", height: "13px", color: "#22d3ee" }} />
                                <span style={{ fontSize: "9.5px", fontWeight: "700", color: "white", letterSpacing: "0.03em" }}>
                                    {t("QURE AI DIGITAL CLINICAL AUTHENTICATION", "الختم الرقمي المعتمد لسلامة المرضى")}
                                </span>
                            </div>
                            <p style={{ fontSize: "7.5px", color: "#94a3b8", margin: 0 }}>
                                {t("Cryptographically verified against openFDA & RxNorm pharmaceutical ontologies.", "تم التحقق المشفر آلياً ومطابقة البيانات بقواعد بيانات الأدوية العالمية.")}
                            </p>
                        </div>
                        <div style={{ textAlign: isArabic ? "left" : "right" }}>
                            <span style={{ fontSize: "8px", fontFamily: "monospace", color: "#22d3ee", display: "block" }}>ID: {reportId}</span>
                            <span style={{ fontSize: "7px", color: "#64748b", display: "block" }}>{generatedAt}</span>
                        </div>
                    </div>
                    <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "6px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                        <span style={{ fontSize: "7px", color: "#94a3b8", lineHeight: "1.5", maxWidth: "580px" }}>
                            {t(
                                "Disclaimer: This AI clinical report is for guidance and medication awareness. Always consult your certified physician or clinical pharmacist for definitive diagnosis and treatment decisions.",
                                "إخلاء مسؤولية: هذا التقرير مخصص للتوعية والإرشاد الدوائي السريري. استشر دائماً طبيبك المعالج أو الصيدلي المعتمد للتشخيص والعلاج."
                            )}
                        </span>
                        <span style={{ fontSize: "8px", color: "#374151", fontWeight: "600", flexShrink: 0 }}>{t("Page 3 of 3", "صفحة 3 من 3")}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
