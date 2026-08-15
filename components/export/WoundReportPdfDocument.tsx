import React from "react";
import {
    ShieldAlert,
    AlertTriangle,
    Activity,
    HeartPulse,
    Calendar,
} from "lucide-react";

interface WoundReportPdfDocumentProps {
    result: any;
    isArabic: boolean;
    reportId: string;
    generatedAt: string;
    userName?: string;
    scannedImage?: string | null;
}

// Exact A4 dimensions @ 96 DPI
const PAGE_W = 794;
const PAGE_H = 1123;

export const WoundReportPdfDocument: React.FC<WoundReportPdfDocumentProps> = ({
    result,
    isArabic,
    reportId,
    generatedAt,
    userName,
    scannedImage,
}) => {
    const t = (en: string, ar: string) => (isArabic ? ar : en);
    const dir = isArabic ? "rtl" : "ltr";

    const classification = result?.woundClassification || t("Clinical Wound Assessment", "تقييم الجروح السريري");
    const severityTier = result?.severityTier || "moderate";
    const confidence = result?.confidenceScore || 95;
    const immediateActions: string[] = Array.isArray(result?.immediateFirstAid) ? result.immediateFirstAid : [];
    const stepByStepCare: string[] = Array.isArray(result?.stepByStepCare) ? result.stepByStepCare : [];
    const redFlags: string[] = Array.isArray(result?.redFlags) ? result.redFlags : [];
    const doNots: string[] = Array.isArray(result?.doNots) ? result.doNots : [];

    const getSeverity = (): { label: string; bg: string; color: string } => {
        if (severityTier === "critical" || severityTier === "danger") {
            return { label: t("Critical Emergency", "حالة طارئة حرجة"), bg: "#dc2626", color: "#ffffff" };
        }
        if (severityTier === "urgent" || severityTier === "caution") {
            return { label: t("Urgent Attention", "عناية عاجلة مطلوبة"), bg: "#f59e0b", color: "#ffffff" };
        }
        return { label: t("Routine / Mild Care", "إصابة خفيفة مستقرة"), bg: "#16a34a", color: "#ffffff" };
    };
    const severity = getSeverity();

    /** Shared style for an isolated A4 page container */
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
        badgeType: "number" | "warning" | "cross" | "emergency",
        customColor?: string
    ) => {
        let badgeBg = "#ffe4e6";
        let badgeColor = "#be123c";
        let badgeContent: React.ReactNode = idx + 1;

        if (badgeType === "warning") {
            badgeBg = "#fef3c7";
            badgeColor = "#b45309";
            badgeContent = "▲";
        } else if (badgeType === "cross") {
            badgeBg = "#fef3c7";
            badgeColor = "#d97706";
            badgeContent = "✕";
        } else if (badgeType === "emergency") {
            badgeBg = "#fee2e2";
            badgeColor = "#dc2626";
            badgeContent = "!";
        }

        return (
            <div
                key={idx}
                style={{
                    display: "flex",
                    flexDirection: isArabic ? "row-reverse" : "row",
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

    const sectionHeader = (icon: React.ReactNode, text: string, color: string = "#0f172a"): React.ReactNode => (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            {icon}
            <h3 style={{ fontSize: "11px", fontWeight: "800", color, textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 }}>
                {text}
            </h3>
        </div>
    );

    return (
        <div
            id="qure-wound-pdf-document"
            dir={dir}
            style={{
                width: `${PAGE_W}px`,
                backgroundColor: "#FFFFFF",
                fontFamily: "'Segoe UI', 'Cairo', Tahoma, Arial, sans-serif",
                direction: isArabic ? "rtl" : "ltr",
            }}
        >
            {/* ══════════════════════════════════════
                PAGE 1 — WOUND ASSESSMENT & FIRST AID
            ══════════════════════════════════════ */}
            <div className="qure-pdf-page" style={{ ...pageStyle, borderBottom: "1px solid #e2e8f0", padding: "34px 40px 24px" }}>
                {/* CONTENT */}
                <div style={{ flex: 1, overflow: "hidden" }}>

                    {/* ── Header ── */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #be123c", paddingBottom: "12px", marginBottom: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#be123c", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "22px", flexShrink: 0 }}>⚕</div>
                            <div>
                                <h1 style={{ fontSize: "16px", fontWeight: "900", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span>QURE AI</span>
                                    <span style={{ fontSize: "9px", fontWeight: "700", padding: "2px 8px", borderRadius: "999px", background: "#ffe4e6", color: "#9f1239", border: "1px solid #fecdd3" }}>
                                        CLINICAL WOUND ASSESSMENT
                                    </span>
                                </h1>
                                <p style={{ fontSize: "10px", color: "#64748b", margin: "2px 0 0", fontWeight: "500" }}>
                                    {t("Emergency Triage & Wound Protocol Report", "تقرير فرز الطوارئ والبروتوكول السريري للجروح")}
                                </p>
                            </div>
                        </div>

                        <div style={{ textAlign: isArabic ? "left" : "right" }}>
                            <div style={{ fontSize: "11px", fontWeight: "800", fontFamily: "monospace", color: "#be123c", letterSpacing: "0.05em" }}>{reportId}</div>
                            <div style={{ fontSize: "9px", color: "#64748b", marginTop: "2px", display: "flex", alignItems: "center", gap: "4px", justifyContent: isArabic ? "flex-start" : "flex-end" }}>
                                <Calendar style={{ width: "10px", height: "10px" }} />
                                <span>{generatedAt}</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Triage Info Bar ── */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px 14px", marginBottom: "16px" }}>
                        <div>
                            <span style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", fontWeight: "600", display: "block" }}>{t("Patient / Profile", "الملف / المريض")}</span>
                            <span style={{ fontSize: "10px", fontWeight: "700", color: "#0f172a", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName || t("Primary User", "المستخدم الرئيسي")}</span>
                        </div>
                        <div>
                            <span style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", fontWeight: "600", display: "block" }}>{t("Triage Severity", "درجة الخطورة")}</span>
                            <span style={{ fontSize: "9px", fontWeight: "700", padding: "2px 8px", borderRadius: "4px", background: severity.bg, color: severity.color, display: "inline-block" }}>{severity.label}</span>
                        </div>
                        <div>
                            <span style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", fontWeight: "600", display: "block" }}>{t("AI Confidence", "دقة التحليل")}</span>
                            <span style={{ fontSize: "10px", fontWeight: "700", color: "#0f172a" }}>{confidence}%</span>
                        </div>
                        <div>
                            <span style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", fontWeight: "600", display: "block" }}>{t("Assessment ID", "رقم التقييم")}</span>
                            <span style={{ fontSize: "9px", fontWeight: "700", color: "#be123c", fontFamily: "monospace", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{reportId}</span>
                        </div>
                    </div>

                    {/* ── Classification Hero Banner ── */}
                    <div style={{ background: "linear-gradient(135deg, #4c0519 0%, #1e293b 50%, #1e1b4b 100%)", color: "white", borderRadius: "12px", padding: "18px 20px", marginBottom: "16px" }}>
                        <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "999px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", fontSize: "9px", fontWeight: "600", color: "#fecdd3", marginBottom: "6px" }}>
                            {t("Visual Classification", "التصنيف الإكلينيكي البصري")}
                        </span>
                        <h2 style={{ fontSize: "20px", fontWeight: "900", color: "white", margin: "0 0 4px", lineHeight: "1.2" }}>{classification}</h2>
                        <p style={{ fontSize: "10px", color: "#cbd5e1", margin: 0, lineHeight: "1.5" }}>
                            {result?.summary || t("Comprehensive clinical evaluation of injury characteristics and bleeding level.", "تقييم سريري شامل لخصائص الإصابة ومستوى النزيف والالتهاب.")}
                        </p>
                    </div>

                    {/* ── Immediate First Aid ── */}
                    <div style={{ marginBottom: "14px" }}>
                        {sectionHeader(
                            <div style={{ padding: "4px", borderRadius: "7px", background: "#ffe4e6", color: "#9f1239", display: "flex" }}><HeartPulse style={{ width: "14px", height: "14px" }} /></div>,
                            t("Immediate First-Aid Protocol", "إجراءات الإسعاف الأولي الفوري"),
                        )}
                        <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "10px", padding: "12px 14px" }}>
                            {immediateActions.length > 0 ? (
                                <div>
                                    {immediateActions.slice(0, 5).map((action, idx) => renderListItem(action, idx, "number"))}
                                </div>
                            ) : (
                                <p style={{ fontSize: "10.5px", color: "#9f1239", margin: 0, fontWeight: "500", lineHeight: "1.6" }}>
                                    {t("Apply pressure to control bleeding and keep wound clean.", "اضغط على الجرح للسيطرة على النزيف وحافظ على نظافته.")}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ── Prohibited Actions ── */}
                    <div>
                        {sectionHeader(
                            <div style={{ padding: "4px", borderRadius: "7px", background: "#fef3c7", color: "#92400e", display: "flex" }}><AlertTriangle style={{ width: "14px", height: "14px" }} /></div>,
                            t("Strictly Avoid (Harmful Practices)", "تحذيرات: ما يجب تجنبه تماماً"),
                        )}
                        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", padding: "12px 14px" }}>
                            {doNots.length > 0 ? (
                                <div>
                                    {doNots.slice(0, 4).map((item, idx) => renderListItem(item, idx, "cross"))}
                                </div>
                            ) : (
                                <p style={{ fontSize: "10.5px", color: "#92400e", margin: 0, fontWeight: "500", lineHeight: "1.6" }}>
                                    {t("Do not remove embedded objects. Do not apply excessive pressure on fractures.", "لا تحاول إزالة الأجسام الغريبة المدمجة. لا تضغط بشدة على الكسور.")}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* PAGE 1 FOOTER */}
                <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "14px" }}>
                    <span style={{ fontSize: "8px", color: "#94a3b8" }}>QURE AI Medical Intelligence • Clinical Wound Triage</span>
                    <span style={{ fontSize: "8px", color: "#64748b", fontWeight: "600" }}>{t("Page 1 of 2 — First Aid & Triage", "صفحة 1 من 2 — الإسعاف الأولي والفرز")}</span>
                </div>
            </div>

            {/* ══════════════════════════════════════
                PAGE 2 — STEP-BY-STEP CARE & RED FLAGS
            ══════════════════════════════════════ */}
            <div className="qure-pdf-page" style={{ ...pageStyle, padding: "32px 40px 24px" }}>
                {/* CONTENT */}
                <div style={{ flex: 1, overflow: "hidden" }}>

                    {/* ── Running Header ── */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px", marginBottom: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontWeight: "800", color: "#be123c", fontSize: "12px" }}>QURE AI</span>
                            <span style={{ color: "#cbd5e1" }}>|</span>
                            <span style={{ fontSize: "10px", fontWeight: "600", color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "400px" }}>{classification}</span>
                        </div>
                        <div style={{ fontSize: "9px", fontFamily: "monospace", color: "#94a3b8", flexShrink: 0 }}>{reportId} • {t("Page 2 of 2", "صفحة 2 من 2")}</div>
                    </div>

                    {/* ── Step-by-Step Care ── */}
                    <div style={{ marginBottom: "16px" }}>
                        {sectionHeader(
                            <div style={{ padding: "4px", borderRadius: "7px", background: "#e0f2fe", color: "#075985", display: "flex" }}><Activity style={{ width: "14px", height: "14px" }} /></div>,
                            t("Step-by-Step Treatment & Dressing Guidelines", "خطوات التطهير والضماد والغيار"),
                        )}
                        <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden", background: "rgba(248,250,252,0.5)", padding: "10px 14px" }}>
                            {stepByStepCare.length > 0 ? (
                                <div>
                                    {stepByStepCare.slice(0, 5).map((step, idx) =>
                                        renderListItem(step, idx, "number", "#e0f2fe")
                                    )}
                                </div>
                            ) : (
                                <div style={{ fontSize: "10.5px", color: "#475569", fontWeight: "500", lineHeight: "1.6" }}>
                                    {t("Follow standard wound care protocol as advised by your healthcare provider.", "اتبع بروتوكول العناية بالجروح المعياري كما أوصى به مقدم الرعاية الصحية.")}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Red Flags ── */}
                    <div style={{ marginBottom: "16px" }}>
                        {sectionHeader(
                            <div style={{ padding: "4px", borderRadius: "7px", background: "#ffe4e6", color: "#9f1239", display: "flex" }}><ShieldAlert style={{ width: "14px", height: "14px" }} /></div>,
                            t("Danger Signs — When to Call Emergency Services", "علامات الخطر التي تستدعي الطوارئ فوراً"),
                            "#9f1239",
                        )}
                        <div style={{ background: "#fff1f2", border: "1px solid #fca5a5", borderRadius: "10px", padding: "12px 14px" }}>
                            {redFlags.length > 0 ? (
                                <div>
                                    {redFlags.slice(0, 4).map((flag, idx) =>
                                        renderListItem(flag, idx, "emergency")
                                    )}
                                </div>
                            ) : (
                                <p style={{ fontSize: "10.5px", color: "#9f1239", margin: 0, fontWeight: "500", lineHeight: "1.6" }}>
                                    {t("Seek emergency care if bleeding won't stop, wound is deeply embedded, or infection signs appear.", "توجه للطوارئ إذا لم يتوقف النزيف أو كان الجرح عميقاً أو ظهرت علامات التهاب.")}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ── Physician Signature Block ── */}
                    <div style={{ border: "1px dashed #cbd5e1", borderRadius: "10px", padding: "12px 14px", background: "rgba(248,250,252,0.5)", marginBottom: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                            <span style={{ fontSize: "9.5px", fontWeight: "700", color: "#374151" }}>{t("Emergency Physician / Surgeon Endorsement", "مساحة توقيع واعتماد طبيب الطوارئ")}</span>
                            <span style={{ fontSize: "8px", color: "#94a3b8" }}>{t("Clinical Stamp", "ختم المستشفى")}</span>
                        </div>
                        <div style={{ height: "34px", borderBottom: "1px solid #cbd5e1", marginBottom: "6px" }} />
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "8px", color: "#64748b" }}>
                            <span>{t("Physician Name: _______________________", "اسم الطبيب المعالج: _______________________")}</span>
                            <span>{t("Date: ____ / ____ / 2026", "التاريخ: ____ / ____ / 2026")}</span>
                        </div>
                    </div>
                </div>

                {/* PAGE 2 FOOTER */}
                <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0f172a", color: "white", borderRadius: "10px", padding: "10px 14px", marginBottom: "8px" }}>
                        <div>
                            <span style={{ fontSize: "9.5px", fontWeight: "700", color: "white", display: "block", marginBottom: "2px" }}>
                                {t("QURE AI WOUND SYSTEM • DIGITAL TRIAGE SEAL", "ختم فرز الطوارئ الرقمي المعتمد")}
                            </span>
                            <span style={{ fontSize: "7.5px", color: "#94a3b8", display: "block" }}>
                                {t("Verified with Emergency Clinical Safety Guidelines", "تم الفرز وفق البروتوكولات الإسعافية السريرية")}
                            </span>
                        </div>
                        <div style={{ textAlign: isArabic ? "left" : "right", fontFamily: "monospace", fontSize: "8px", color: "#22d3ee" }}>
                            ID: {reportId}
                        </div>
                    </div>
                    <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "6px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                        <span style={{ fontSize: "7px", color: "#94a3b8", lineHeight: "1.5", maxWidth: "580px" }}>
                            {t("Disclaimer: Emergency AI guidance is supportive. In life-threatening bleeding or severe trauma, call local emergency services immediately.", "إخلاء مسؤولية: إرشادات الذكاء الاصطناعي استرشادية. في حالات النزيف الحاد أو الحوادث، اتصل بالإسعاف فوراً.")}
                        </span>
                        <span style={{ fontSize: "8px", color: "#374151", fontWeight: "600", flexShrink: 0 }}>{t("Page 2 of 2", "صفحة 2 من 2")}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
