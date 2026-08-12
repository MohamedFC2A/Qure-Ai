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

    const subject = `👑 طلب الاشتراك الذهبي (Beta) — المستخدم: ${fullName || username || email}`;

    const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>طلب اشتراك ذهبي جديد (نسخة البيتا)</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 20px; margin: 0; }
        .card { max-width: 600px; margin: 0 auto; background: #131b2e; border: 1px solid #eab308; border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .header { text-align: center; border-bottom: 1px solid #334155; padding-bottom: 20px; margin-bottom: 24px; }
        .badge { background: #ca8a04; color: #000; font-weight: bold; font-size: 12px; padding: 4px 12px; border-radius: 20px; display: inline-block; }
        h1 { color: #facc15; font-size: 22px; margin: 12px 0 6px; }
        .info-table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 24px; }
        .info-table td { padding: 10px 12px; border-bottom: 1px solid #1e293b; font-size: 14px; }
        .label { color: #94a3b8; font-weight: 600; width: 35%; }
        .value { color: #ffffff; font-weight: 500; }
        .btn-container { text-align: center; margin: 30px 0 10px; }
        .btn { background: #eab308; color: #000000 !important; font-size: 16px; font-weight: 800; padding: 14px 32px; border-radius: 10px; text-decoration: none; display: inline-block; box-shadow: 0 4px 14px rgba(234, 179, 8, 0.4); }
        .btn:hover { background: #facc15; }
        .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <span class="badge">نسخة البيتا الحصرية • Beta Exclusive</span>
          <h1>👑 طلب تفعيل الاشتراك الذهبي من قبل CEO</h1>
          <p style="color: #cbd5e1; font-size: 14px; margin: 0;">تم استلام طلب تفعيل اشتراك ذهبي جديد لمنصة QureScan</p>
        </div>

        <table class="info-table">
          <tr>
            <td class="label">معرف المستخدم (User ID):</td>
            <td class="value" style="font-family: monospace; color: #38bdf8;">${userId}</td>
          </tr>
          <tr>
            <td class="label">البريد الإلكتروني:</td>
            <td class="value">${email}</td>
          </tr>
          <tr>
            <td class="label">الاسم الكامل:</td>
            <td class="value">${fullName || username || "غير محدد"}</td>
          </tr>
          <tr>
            <td class="label">الخطة الحالية:</td>
            <td class="value" style="text-transform: uppercase; color: #a78bfa;">${currentPlan}</td>
          </tr>
          <tr>
            <td class="label">العمر / الجنس:</td>
            <td class="value">${age || "—"} / ${gender || "—"}</td>
          </tr>
          <tr>
            <td class="label">الطول / الوزن:</td>
            <td class="value">${height || "—"} / ${weight || "—"}</td>
          </tr>
          <tr>
            <td class="label">تاريخ ووقت الطلب:</td>
            <td class="value">${new Date().toLocaleString("ar-EG", { timeZone: "Africa/Cairo" })}</td>
          </tr>
        </table>

        <div class="btn-container">
          <a href="${activationUrl}" class="btn" target="_blank">
            ⚡ اضغط هنا لتفعيل الاشتراك الذهبي فوراً
          </a>
        </div>

        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">
          أو يمكنك نسخ الرابط التالي مباشرة في المتصفح:<br>
          <a href="${activationUrl}" style="color: #38bdf8; word-break: break-all;">${activationUrl}</a>
        </p>

        <div class="footer">
          QureScan Intelligence Platform • نظام الإدارة والتحكم الداخلي<br>
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
                "User ID": userId,
                "Email": email,
                "Full Name": fullName || username || "Not provided",
                "Current Plan": currentPlan,
                "Age": age || "N/A",
                "Gender": gender || "N/A",
                "Height": height || "N/A",
                "Weight": weight || "N/A",
                "Activation Link": activationUrl,
                "Site URL": baseSiteUrl,
                "Request Time": new Date().toISOString(),
                _template: "table",
                _captcha: "false",
            }),
        });

        const formJson = await formSubmitRes.json().catch(() => ({}));
        console.log(`[FormSubmit Response]`, formJson);
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
                from: `"QureScan Admin" <${smtpUser}>`,
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
