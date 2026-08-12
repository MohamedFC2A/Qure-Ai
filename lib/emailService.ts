import nodemailer from "nodemailer";
import { Resend } from "resend";

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
const CEO_EMAIL = "mohamedahmedmatany@gmail.com";
const DEFAULT_TELEGRAM_BOT_TOKEN = "8931765268:AAH8gCqORvLTpSsQF0mOAAD8sKxQR2Ko7Pw";

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

    // ─────────────────────────────────────────────────────────────
    // METHOD 1: Telegram Bot Instant Push (Zero-Spam, Instant on Phone!)
    // ─────────────────────────────────────────────────────────────
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN || DEFAULT_TELEGRAM_BOT_TOKEN;
    const configuredChatId = process.env.TELEGRAM_CHAT_ID;

    try {
        const chatIdsToNotify = new Set<string>();
        if (configuredChatId) {
            chatIdsToNotify.add(configuredChatId);
        }

        // Auto-discover any chat that messaged or started the bot
        try {
            const updatesRes = await fetch(`https://api.telegram.org/bot${telegramToken}/getUpdates`, {
                method: "GET",
            });
            const updatesData = await updatesRes.json();
            if (updatesData.ok && Array.isArray(updatesData.result)) {
                for (const update of updatesData.result) {
                    const chatId = update.message?.chat?.id || update.callback_query?.message?.chat?.id;
                    if (chatId) {
                        chatIdsToNotify.add(String(chatId));
                    }
                }
            }
        } catch (e) {
            console.warn("[Telegram Auto-discover]", e);
        }

        const telegramHtml = `👑 <b>طلب ترقية الحساب (CEO VIP)</b>\n\n` +
            `👤 <b>المستخدم:</b> ${displayName}\n` +
            `📧 <b>البريد:</b> <code>${email}</code>\n` +
            `🆔 <b>User ID:</b> <code>${userId}</code>\n` +
            `📊 <b>الخطة:</b> ${currentPlan.toUpperCase()}\n` +
            `🩺 <b>البيانات:</b> عمر: ${age || "—"} | جنس: ${gender || "—"} | طول: ${height || "—"} | وزن: ${weight || "—"}\n\n` +
            `⚡ <b>اضغط على الزر أدناه لتفعيل باقة ألترا فوراً بضغطة واحدة:</b>`;

        for (const targetChatId of chatIdsToNotify) {
            await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: targetChatId,
                    text: telegramHtml,
                    parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "⚡ تفعيل باقة ألترا (٣٠٠ رصيد) فوراً",
                                    url: activationUrl,
                                }
                            ],
                            [
                                {
                                    text: "🌐 فتح لوحة تحكم CEO",
                                    url: `${baseSiteUrl}/admin/ceo-requests`,
                                }
                            ]
                        ]
                    }
                }),
            });
            console.log(`[Telegram] Sent instant alert with activation button to Chat ID: ${targetChatId}`);
        }
    } catch (tgErr: any) {
        console.warn("[Telegram Bot Error]:", tgErr.message);
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ترقية الحساب من CEO</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #030712; color: #f9fafb; padding: 12px; margin: 0; }
        .card { max-width: 540px; margin: 0 auto; background: #0f172a; border: 1px solid #334155; border-radius: 20px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .header { text-align: center; border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 20px; }
        .badge { background: #1e293b; color: #38bdf8; border: 1px solid #38bdf8; font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 12px; display: inline-block; }
        h1 { color: #ffffff; font-size: 20px; margin: 10px 0 4px; font-weight: 900; }
        .btn-box { text-align: center; margin: 24px 0; }
        .btn { background: #22c55e !important; color: #000000 !important; font-size: 17px; font-weight: 900; padding: 16px 28px; border-radius: 14px; text-decoration: none; display: block; text-align: center; }
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
          <span class="badge">👑 طلب ترقية VIP فوري</span>
          <h1>طلب ترقية الحساب من قبل CEO</h1>
          <p style="color: #cbd5e1; font-size: 13px; margin: 4px 0 0;">المستخدم يطلب ترقية حسابه إلى باقة ألترا (٣٠٠ رصيد شهرياً)</p>
        </div>

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

    let delivered = false;

    // ─────────────────────────────────────────────────────────────
    // METHOD 2: Resend API (Official Enterprise Email Service)
    // ─────────────────────────────────────────────────────────────
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
        try {
            const resend = new Resend(resendApiKey);
            const sendRes = await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL || "QureScan <onboarding@resend.dev>",
                to: [CEO_EMAIL],
                subject,
                html: htmlContent,
            });

            if (sendRes.data?.id) {
                console.log(`[Email] Delivered via Resend API (ID: ${sendRes.data.id}) to ${CEO_EMAIL}`);
                delivered = true;
            } else if (sendRes.error) {
                console.warn("[Email] Resend API error:", sendRes.error.message);
            }
        } catch (err: any) {
            console.warn("[Email] Resend exception:", err.message);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // METHOD 3: Official Gmail / SMTP (Nodemailer Direct Connection)
    // ─────────────────────────────────────────────────────────────
    const smtpUser = process.env.GMAIL_USER || process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || process.env.EMAIL_PASS;
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = Number(process.env.SMTP_PORT) || 465;

    if (!delivered && smtpUser && smtpPass) {
        try {
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
                to: CEO_EMAIL,
                subject,
                html: htmlContent,
            });
            console.log(`[Email] Delivered via Direct SMTP to ${CEO_EMAIL}`);
            delivered = true;
        } catch (smtpErr: any) {
            console.warn("[Email] Direct SMTP error:", smtpErr.message);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // METHOD 4: Discord Webhook Push (if configured)
    // ─────────────────────────────────────────────────────────────
    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (discordWebhookUrl) {
        try {
            await fetch(discordWebhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    embeds: [{
                        title: "👑 طلب تفعيل الاشتراك الذهبي (Beta)",
                        color: 16758784, // Gold
                        fields: [
                            { name: "المستخدم", value: displayName, inline: true },
                            { name: "البريد الإلكتروني", value: email, inline: true },
                            { name: "معرف المستخدم (User ID)", value: userId, inline: false },
                            { name: "رابط التفعيل الفوري", value: `[⚡ اضغط هنا لتفعيل الحساب فوراً](${activationUrl})`, inline: false },
                        ],
                        timestamp: new Date().toISOString(),
                    }],
                }),
            });
        } catch (dErr: any) {
            console.warn("[Discord] Error:", dErr.message);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // METHOD 5: Public Web Dispatch (FormSubmit Fallback)
    // ─────────────────────────────────────────────────────────────
    if (!delivered) {
        try {
            const formData = new URLSearchParams();
            formData.append("_subject", subject);
            formData.append("⚡ تفعيل فوري", activationUrl);
            formData.append("المستخدم", displayName);
            formData.append("البريد الإلكتروني", email);
            formData.append("User ID", userId);
            formData.append("الخطة", currentPlan);
            formData.append("_captcha", "false");

            await fetch(`https://formsubmit.co/${CEO_EMAIL}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Referer": baseSiteUrl,
                    "Origin": baseSiteUrl,
                },
                body: formData.toString(),
            });
            console.log(`[FormSubmit] Dispatched form payload to ${CEO_EMAIL}`);
        } catch (fsErr: any) {
            console.warn("[FormSubmit] Error:", fsErr.message);
        }
    }

    console.log(`[Golden CEO Dispatch Summary] User: ${email}, Activation: ${activationUrl}`);
}
