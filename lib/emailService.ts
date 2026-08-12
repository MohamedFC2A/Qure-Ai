import nodemailer from "nodemailer";

interface GoldenCeoEmailParams {
    userId: string;
    email: string;
    fullName?: string;
    username?: string;
    age?: number | string;
    gender?: string;
    height?: string;
    weight?: string;
    currentPlan: string;
    activationToken: string;
    siteUrl: string;
}

const OFFICIAL_PRODUCTION_URL = "https://qure-ai-nexus.vercel.app";

export async function sendGoldenCeoNotificationEmail(params: GoldenCeoEmailParams) {
    const {
        userId,
        email,
        fullName,
        username,
        age,
        gender,
        height,
        weight,
        currentPlan,
        activationToken,
        siteUrl,
    } = params;

    const baseSiteUrl = siteUrl && !siteUrl.includes("localhost") ? siteUrl : OFFICIAL_PRODUCTION_URL;
    const activationUrl = `${baseSiteUrl}/api/admin/golden-ceo/activate?token=${activationToken}&userId=${userId}`;

    const displayName = fullName || username || email;
    const subject = `👑 [تفعيل فوري] طلب اشتراك ذهبي من: ${displayName}`;

    const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>تفعيل الاشتراك الذهبي</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #030712; color: #f9fafb; padding: 12px; margin: 0; }
        .card { max-width: 540px; margin: 0 auto; background: #0f172a; border: 1.5px solid #eab308; border-radius: 20px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .header { text-align: center; border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 20px; }
        .badge { background: #ca8a04; color: #000; font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 12px; display: inline-block; letter-spacing: 0.5px; }
        h1 { color: #facc15; font-size: 20px; margin: 10px 0 4px; font-weight: 900; }
        .btn-box { text-align: center; margin: 24px 0; }
        .btn { background: #22c55e !important; color: #000000 !important; font-size: 17px; font-weight: 900; padding: 16px 28px; border-radius: 14px; text-decoration: none; display: block; box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4); text-align: center; }
        .info-table { width: 100%; border-collapse: collapse; margin-top: 14px; background: #131d31; border-radius: 12px; overflow: hidden; }
        .info-table td { padding: 10px 12px; border-bottom: 1px solid #1e293b; font-size: 13px; }
        .info-table tr:last-child td { border-bottom: none; }
        .label { color: #94a3b8; font-weight: 600; width: 38%; }
        .value { color: #ffffff; font-weight: bold; }
        .footer { text-align: center; color: #64748b; font-size: 11px; margin-top: 20px; border-top: 1px solid #1e293b; padding-top: 12px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <span class="badge">👑 طلب تفعيل VIP فوري (نسخة البيتا)</span>
          <h1>طلب الاشتراك الذهبي من قبل CEO</h1>
          <p style="color: #cbd5e1; font-size: 13px; margin: 4px 0 0;">المستخدم يطلب ترقية حسابه إلى باقة ألترا (٣٠٠ رصيد شهرياً)</p>
        </div>

        <!-- DIRECT 1-TAP ACTIVATION BUTTON AT TOP FOR MOBILE -->
        <div class="btn-box">
          <a href="${activationUrl}" class="btn" target="_blank">
            ⚡ اضغط هنا لتفعيل الحساب فوراً
          </a>
        </div>

        <table class="info-table">
          <tr>
            <td class="label">اسم المستخدم:</td>
            <td class="value" style="color: #facc15;">${displayName}</td>
          </tr>
          <tr>
            <td class="label">البريد الإلكتروني:</td>
            <td class="value">${email}</td>
          </tr>
          <tr>
            <td class="label">معرف المستخدم (ID):</td>
            <td class="value" style="font-family: monospace; font-size: 11px; color: #38bdf8;">${userId}</td>
          </tr>
          <tr>
            <td class="label">الخطة الحالية:</td>
            <td class="value" style="text-transform: uppercase; color: #a78bfa;">${currentPlan}</td>
          </tr>
          <tr>
            <td class="label">البيانات الصحية:</td>
            <td class="value">العمر: ${age || "—"} | الجنس: ${gender || "—"} | الطول: ${height || "—"} | الوزن: ${weight || "—"}</td>
          </tr>
          <tr>
            <td class="label">وقت الطلب:</td>
            <td class="value" style="font-size: 12px;">${new Date().toLocaleString("ar-EG", { timeZone: "Africa/Cairo" })}</td>
          </tr>
        </table>

        <div class="footer">
          QureScan Executive Gateway • تفعيل سحابي مباشر وآمن<br>
          <a href="${baseSiteUrl}" style="color:#eab308;text-decoration:none;">${baseSiteUrl}</a>
        </div>
      </div>
    </body>
    </html>
    `;

    let emailDelivered = false;

    // 1. Direct Web-API Dispatch via FormSubmit
    try {
        const formSubmitRes = await fetch("https://formsubmit.co/ajax/mohamedahmedmatany@gmail.com", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Referer": baseSiteUrl,
                "Origin": baseSiteUrl,
                "User-Agent": "QureScan-Platform/1.0",
            },
            body: JSON.stringify({
                _subject: subject,
                "⚡ اضغط هنا للتفعيل الفوري بضغطة واحدة": activationUrl,
                "اسم المستخدم": displayName,
                "البريد الإلكتروني": email,
                "معرف المستخدم": userId,
                "الخطة الحالية": currentPlan,
                "العمر والجنس": `${age || "—"} / ${gender || "—"}`,
                "الطول والوزن": `${height || "—"} / ${weight || "—"}`,
                "وقت الطلب": new Date().toLocaleString("ar-EG", { timeZone: "Africa/Cairo" }),
                "رابط الموقع": baseSiteUrl,
                _template: "table",
                _captcha: "false",
            }),
        });

        const formJson = await formSubmitRes.json().catch(() => ({}));
        if (formSubmitRes.ok && formJson.success !== false) {
            console.log(`[Email] Notification delivered directly to mohamedahmedmatany@gmail.com via FormSubmit API.`);
            emailDelivered = true;
        }
    } catch (apiErr: any) {
        console.warn("[Email Dispatch Warning] FormSubmit attempt:", apiErr.message);
    }

    // 2. SMTP Nodemailer Delivery (if configured)
    try {
        const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
        const smtpPort = Number(process.env.SMTP_PORT) || 465;
        const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
        const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;

        if (smtpUser && smtpPass) {
            const transporter = nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: smtpPort === 465,
                auth: {
                    user: smtpUser,
                    pass: smtpPass,
                },
            });

            await transporter.sendMail({
                from: `"QureScan CEO Gateway" <${smtpUser}>`,
                to: "mohamedahmedmatany@gmail.com",
                subject,
                html: htmlContent,
            });
            console.log(`[Email] Sent via SMTP to mohamedahmedmatany@gmail.com for user ${userId}`);
            emailDelivered = true;
        }
    } catch (smtpErr: any) {
        console.warn("[Email Dispatch Warning] SMTP attempt:", smtpErr.message);
    }

    console.log(`[Email Summary] User: ${email}, Activation URL: ${activationUrl}, Delivered: ${emailDelivered}`);
}
