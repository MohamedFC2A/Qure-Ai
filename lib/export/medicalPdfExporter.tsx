import React from "react";
import { createRoot } from "react-dom/client";
import { MedicalReportPdfDocument } from "@/components/export/MedicalReportPdfDocument";
import { MedicalInfographicCard } from "@/components/export/MedicalInfographicCard";
import { WoundReportPdfDocument } from "@/components/export/WoundReportPdfDocument";
import { WoundInfographicCard } from "@/components/export/WoundInfographicCard";

interface ExportOptions {
    data: any;
    isArabic: boolean;
    reportId?: string;
    userName?: string;
    plan?: string;
    scannedImage?: string | null;
}

const generateReportId = (prefix: string = "QUR-MED") => {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `${prefix}-${dateStr}-${rand}`;
};

const formatReportDate = (isArabic: boolean) => {
    const now = new Date();
    return now.toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

/**
 * Creates an isolated offscreen container at exact A4 pixel ratio (794×1123px @ 96dpi)
 * positioned outside the visible viewport but fully rendered by the browser layout engine.
 */
const createOffscreenHost = (): HTMLDivElement => {
    const host = document.createElement("div");
    host.style.position = "fixed";
    host.style.left = "-9999px";
    host.style.top = "0px";
    host.style.width = "794px";      // A4 @ 96dpi = 794px wide
    host.style.zIndex = "-9999";
    host.style.opacity = "1";
    host.style.visibility = "visible";
    host.style.pointerEvents = "none";
    host.style.backgroundColor = "#FFFFFF";
    host.style.overflow = "visible"; // Never clip the content
    document.body.appendChild(host);
    return host;
};

/**
 * Waits for fonts (critical for Arabic), images, and layout to fully settle.
 * Dual requestAnimationFrame ensures the browser completes its render cycle.
 */
const waitForFullRender = async (extraMs: number = 900): Promise<void> => {
    // 1. Wait for all fonts (Arabic shaping requires font load)
    if (typeof document !== "undefined" && document.fonts?.ready) {
        try {
            await document.fonts.ready;
        } catch { /* Ignore */ }
    }
    // 2. Two rAF cycles ensure layout + paint are complete
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    // 3. Extra stabilisation delay for complex Arabic RTL reflow
    await new Promise<void>((r) => setTimeout(r, extraMs));
};

/**
 * Captures one PDF page element at 3× pixel ratio for crisp A4 text output.
 * Explicitly passes exact dimensions to avoid sub-pixel rounding artifacts.
 */
const capturePage = async (
    el: HTMLElement,
    toPng: (node: HTMLElement, options?: Record<string, unknown>) => Promise<string>
): Promise<string> => {
    const w = el.offsetWidth  || 794;
    const h = el.offsetHeight || 1123;
    return toPng(el, {
        cacheBust: true,
        pixelRatio: 3,               // 3× DPI = 2382×3369px → sharp A4 text
        backgroundColor: "#FFFFFF",
        width: w,
        height: h,
    });
};

/* ═══════════════════════════════════════════════════════════════
   MEDICAL REPORT PDF  (3-page dossier)
═══════════════════════════════════════════════════════════════ */

/**
 * Exports a publication-grade, true multi-page A4 Medical Dossier PDF.
 * Fixes text overlap and blurry rendering by using 3× capture DPI,
 * full font/layout wait, and SLOW (best quality) PDF compression.
 */
export async function exportMedicalReportPdf(options: ExportOptions): Promise<void> {
    const { data, isArabic, userName, plan = "ultra" } = options;
    const reportId = options.reportId || generateReportId("QUR-MED");
    const generatedAt = formatReportDate(isArabic);

    const host = createOffscreenHost();
    const root = createRoot(host);

    try {
        const [{ toPng }, { jsPDF }] = await Promise.all([
            import("html-to-image"),
            import("jspdf"),
        ]);

        root.render(
            <MedicalReportPdfDocument
                data={data}
                isArabic={isArabic}
                reportId={reportId}
                generatedAt={generatedAt}
                userName={userName}
                plan={plan}
            />
        );

        // Full wait: fonts + Arabic shaping + layout reflow
        await waitForFullRender(1000);

        const pageElements = host.querySelectorAll<HTMLElement>(".qure-pdf-page");
        if (!pageElements || pageElements.length === 0) {
            throw new Error(isArabic ? "فشل تجهيز صفحات التقرير الطبي." : "Failed to prepare PDF pages.");
        }

        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
            compress: true,
        });

        for (let i = 0; i < pageElements.length; i++) {
            // Brief inter-page pause prevents canvas reuse race conditions
            if (i > 0) await new Promise<void>((r) => setTimeout(r, 150));

            const dataUrl = await capturePage(pageElements[i], toPng);

            if (i > 0) pdf.addPage("a4", "portrait");

            // Fit image edge-to-edge on A4 (210×297mm) with SLOW = best quality
            pdf.addImage(dataUrl, "PNG", 0, 0, 210, 297, `p${i}`, "SLOW");
        }

        const safeDrugName = String(data?.drugName || "Medical-Report")
            .replace(/[^\p{L}\p{N}]+/gu, "-")
            .replace(/^-|-$/g, "");

        pdf.save(`QURE-Report-${safeDrugName}-${Date.now()}.pdf`);
    } finally {
        setTimeout(() => { root.unmount(); host.remove(); }, 1000);
    }
}

/* ═══════════════════════════════════════════════════════════════
   MEDICAL INFOGRAPHIC CARD  (PNG)
═══════════════════════════════════════════════════════════════ */

/**
 * Exports a high-DPI Clinical Medical Infographic Card as PNG.
 */
export async function exportMedicalReportPng(options: ExportOptions): Promise<void> {
    const { data, isArabic, userName, scannedImage } = options;
    const reportId = options.reportId || generateReportId("QUR-CRD");
    const generatedAt = formatReportDate(isArabic);

    const host = createOffscreenHost();
    const root = createRoot(host);

    try {
        const { toPng } = await import("html-to-image");

        root.render(
            <MedicalInfographicCard
                data={data}
                isArabic={isArabic}
                reportId={reportId}
                generatedAt={generatedAt}
                userName={userName}
                scannedImage={scannedImage}
            />
        );

        await waitForFullRender(900);

        const cardEl = host.querySelector<HTMLElement>("#qure-png-infographic");
        if (!cardEl) {
            throw new Error(isArabic ? "فشل تجهيز البطاقة الطبية للتصدير." : "Failed to prepare infographic card.");
        }

        const dataUrl = await toPng(cardEl, {
            cacheBust: true,
            pixelRatio: 3,
            backgroundColor: "#070B19",
            width: cardEl.offsetWidth,
            height: cardEl.offsetHeight,
        });

        const safeDrugName = String(data?.drugName || "Medical-Card")
            .replace(/[^\p{L}\p{N}]+/gu, "-")
            .replace(/^-|-$/g, "");

        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `QURE-Card-${safeDrugName}-${Date.now()}.png`;
        a.click();
    } finally {
        setTimeout(() => { root.unmount(); host.remove(); }, 1000);
    }
}

/* ═══════════════════════════════════════════════════════════════
   WOUND ASSESSMENT PDF  (2-page report)
═══════════════════════════════════════════════════════════════ */

/**
 * Exports a clinical multi-page Wound Assessment PDF report
 * with crisp text and zero overlap at A4 dimensions.
 */
export async function exportWoundReportPdf(options: ExportOptions): Promise<void> {
    const { data: result, isArabic, userName, scannedImage } = options;
    const reportId = options.reportId || generateReportId("QUR-WND");
    const generatedAt = formatReportDate(isArabic);

    const host = createOffscreenHost();
    const root = createRoot(host);

    try {
        const [{ toPng }, { jsPDF }] = await Promise.all([
            import("html-to-image"),
            import("jspdf"),
        ]);

        root.render(
            <WoundReportPdfDocument
                result={result}
                isArabic={isArabic}
                reportId={reportId}
                generatedAt={generatedAt}
                userName={userName}
                scannedImage={scannedImage}
            />
        );

        await waitForFullRender(1000);

        const pageElements = host.querySelectorAll<HTMLElement>(".qure-pdf-page");
        if (!pageElements || pageElements.length === 0) {
            throw new Error(isArabic ? "فشل تجهيز صفحات تقرير الجروح." : "Failed to prepare Wound PDF pages.");
        }

        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
            compress: true,
        });

        for (let i = 0; i < pageElements.length; i++) {
            if (i > 0) await new Promise<void>((r) => setTimeout(r, 150));

            const dataUrl = await capturePage(pageElements[i], toPng);

            if (i > 0) pdf.addPage("a4", "portrait");

            pdf.addImage(dataUrl, "PNG", 0, 0, 210, 297, `wp${i}`, "SLOW");
        }

        pdf.save(`QURE-Wound-Report-${Date.now()}.pdf`);
    } finally {
        setTimeout(() => { root.unmount(); host.remove(); }, 1000);
    }
}

/* ═══════════════════════════════════════════════════════════════
   WOUND INFOGRAPHIC CARD  (PNG)
═══════════════════════════════════════════════════════════════ */

/**
 * Exports a high-DPI Wound Assessment Infographic Card as PNG.
 */
export async function exportWoundReportPng(options: ExportOptions): Promise<void> {
    const { data: result, isArabic, userName, scannedImage } = options;
    const reportId = options.reportId || generateReportId("QUR-WCRD");
    const generatedAt = formatReportDate(isArabic);

    const host = createOffscreenHost();
    const root = createRoot(host);

    try {
        const { toPng } = await import("html-to-image");

        root.render(
            <WoundInfographicCard
                result={result}
                isArabic={isArabic}
                reportId={reportId}
                generatedAt={generatedAt}
                userName={userName}
                scannedImage={scannedImage}
            />
        );

        await waitForFullRender(900);

        const cardEl = host.querySelector<HTMLElement>("#qure-wound-png-infographic");
        if (!cardEl) {
            throw new Error(isArabic ? "فشل تجهيز بطاقة تقييم الجروح." : "Failed to prepare wound infographic card.");
        }

        const dataUrl = await toPng(cardEl, {
            cacheBust: true,
            pixelRatio: 3,
            backgroundColor: "#0A050D",
            width: cardEl.offsetWidth,
            height: cardEl.offsetHeight,
        });

        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `QURE-Wound-Card-${Date.now()}.png`;
        a.click();
    } finally {
        setTimeout(() => { root.unmount(); host.remove(); }, 1000);
    }
}
