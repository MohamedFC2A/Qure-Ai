import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OFFICIAL_SITE_URL = "https://qure-ai-nexus.vercel.app";

const AUTHORIZED_CHATS = ["8495121463"]; // Mohamed Matany (CEO)

// Helper to send Telegram message
async function sendTelegramMessage(chatId: string | number, text: string, replyMarkup?: any) {
    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: "HTML",
                reply_markup: replyMarkup,
            }),
        });
    } catch (e) {
        console.error("Failed to send telegram message", e);
    }
}

// Helper to answer callback query (for interactive button taps)
async function answerCallbackQuery(callbackQueryId: string, text?: string, showAlert = false) {
    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                callback_query_id: callbackQueryId,
                text: text || "",
                show_alert: showAlert,
            }),
        });
    } catch (e) {
        console.error("Failed to answer callback query", e);
    }
}

// Helper to edit message text
async function editTelegramMessage(chatId: string | number, messageId: number, text: string, replyMarkup?: any) {
    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                message_id: messageId,
                text,
                parse_mode: "HTML",
                reply_markup: replyMarkup,
            }),
        });
    } catch (e) {
        console.error("Failed to edit telegram message", e);
    }
}

export async function POST(req: NextRequest) {
    try {
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json({ error: "Server misconfiguration: missing Supabase credentials." }, { status: 500 });
        }
        if (!TELEGRAM_BOT_TOKEN) {
            return NextResponse.json({ error: "Server misconfiguration: missing TELEGRAM_BOT_TOKEN." }, { status: 500 });
        }

        const update = await req.json();
        const adminSupabase = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 1. Handle Callback Queries (Interactive Button Clicks)
        if (update.callback_query) {
            const cb = update.callback_query;
            const data: string = cb.data || "";
            const chatId = cb.message?.chat?.id;
            const messageId = cb.message?.message_id;

            // ── ACTION: APPROVE REQUEST ──
            if (data.startsWith("approve_")) {
                const reqId = data.replace("approve_", "");
                const { data: requestRecord } = await adminSupabase
                    .from("ceo_upgrade_requests")
                    .select("*")
                    .eq("id", reqId)
                    .maybeSingle();

                if (!requestRecord) {
                    await answerCallbackQuery(cb.id, "❌ لم يتم العثور على هذا الطلب", true);
                    return NextResponse.json({ ok: true });
                }

                // Upgrade user to Ultra
                await adminSupabase
                    .from("profiles")
                    .update({ plan: "ultra", updated_at: new Date().toISOString() })
                    .eq("id", requestRecord.user_id);

                // Refill 300 credits
                await adminSupabase
                    .from("usage_windows")
                    .upsert({
                        user_id: requestRecord.user_id,
                        daily_used: 0,
                        monthly_used: 0,
                        monthly_window_start: new Date().toISOString(),
                    }, { onConflict: "user_id" });

                await adminSupabase
                    .from("ceo_upgrade_requests")
                    .update({ status: "approved", activated_at: new Date().toISOString() })
                    .eq("id", reqId);

                await answerCallbackQuery(cb.id, "✅ تم تفعيل باقة ألترا بنجاح!", true);

                const updatedText = `✅ <b>تمت ترقية الحساب لباقة ULTRA بنجاح!</b>\n\n` +
                    `👤 <b>المستخدم:</b> ${requestRecord.full_name || requestRecord.email}\n` +
                    `📧 <b>البريد:</b> <code>${requestRecord.email}</code>\n` +
                    `📊 <b>الخطة:</b> ULTRA (٣٠٠ رصيد شهرياً)\n` +
                    `⏰ <b>تاريخ التفعيل:</b> ${new Date().toLocaleString("ar-EG")}`;

                await editTelegramMessage(chatId, messageId, updatedText, {
                    inline_keyboard: [
                        [{ text: "🛑 إلغاء باقة ألترا لهذا المستخدم", callback_data: `revoke_${requestRecord.user_id}` }]
                    ]
                });

                return NextResponse.json({ ok: true });
            }

            // ── ACTION: REJECT REQUEST ──
            if (data.startsWith("reject_")) {
                const reqId = data.replace("reject_", "");
                await adminSupabase
                    .from("ceo_upgrade_requests")
                    .update({ status: "rejected" })
                    .eq("id", reqId);

                await answerCallbackQuery(cb.id, "تم رفض الطلب.", true);
                await editTelegramMessage(chatId, messageId, "❌ <b>تم رفض هذا الطلب.</b>");
                return NextResponse.json({ ok: true });
            }

            // ── ACTION: REVOKE ULTRA PLAN (CANCEL SUBSCRIPTION) ──
            if (data.startsWith("revoke_")) {
                const targetUserId = data.replace("revoke_", "");

                // Downgrade user in profiles to Free
                const { data: userProfile } = await adminSupabase
                    .from("profiles")
                    .select("id, full_name, username")
                    .eq("id", targetUserId)
                    .maybeSingle();

                await adminSupabase
                    .from("profiles")
                    .update({ plan: "free", plan_expires_at: null, updated_at: new Date().toISOString() })
                    .eq("id", targetUserId);

                // Reset usage windows so user immediately has clean 30/30 free credits
                await adminSupabase
                    .from("usage_windows")
                    .upsert({
                        user_id: targetUserId,
                        daily_used: 0,
                        monthly_used: 0,
                        daily_window_start: new Date().toISOString(),
                        monthly_window_start: new Date().toISOString(),
                    }, { onConflict: "user_id" });

                // Update request status to revoked
                await adminSupabase
                    .from("ceo_upgrade_requests")
                    .update({ status: "revoked" })
                    .eq("user_id", targetUserId);

                await answerCallbackQuery(cb.id, "🛑 تم إلغاء باقة ألترا وإعادة المستخدم للخطة المجانية (٣٠ رصيد)!", true);

                const userName = userProfile?.full_name || userProfile?.username || targetUserId;
                const revokedText = `🛑 <b>تم إلغاء باقة ULTRA</b>\n\n` +
                    `👤 <b>المستخدم:</b> ${userName}\n` +
                    `🆔 <b>ID:</b> <code>${targetUserId}</code>\n` +
                    `📊 <b>الخطة الحالية:</b> FREE (٣٠ رصيد شهرياً)\n` +
                    `⏰ <b>وقت الإلغاء:</b> ${new Date().toLocaleString("ar-EG")}`;

                await editTelegramMessage(chatId, messageId, revokedText, {
                    inline_keyboard: [
                        [{ text: "⚡ إعادة التفعيل لألترا", callback_data: `reactivate_${targetUserId}` }]
                    ]
                });

                return NextResponse.json({ ok: true });
            }

            // ── ACTION: REACTIVATE ULTRA ──
            if (data.startsWith("reactivate_")) {
                const targetUserId = data.replace("reactivate_", "");

                await adminSupabase
                    .from("profiles")
                    .update({ plan: "ultra", updated_at: new Date().toISOString() })
                    .eq("id", targetUserId);

                await adminSupabase
                    .from("usage_windows")
                    .upsert({
                        user_id: targetUserId,
                        daily_used: 0,
                        monthly_used: 0,
                    }, { onConflict: "user_id" });

                await adminSupabase
                    .from("ceo_upgrade_requests")
                    .update({ status: "approved", activated_at: new Date().toISOString() })
                    .eq("user_id", targetUserId);

                await answerCallbackQuery(cb.id, "⚡ تمت إعادة التفعيل لباقة ULTRA بنجاح!", true);

                await editTelegramMessage(chatId, messageId, `👑 <b>تمت إعادة تفعيل باقة ألترا بنجاح للمستخدم:</b> <code>${targetUserId}</code>`, {
                    inline_keyboard: [
                        [{ text: "🛑 إلغاء الاشتراك مجدداً", callback_data: `revoke_${targetUserId}` }]
                    ]
                });

                return NextResponse.json({ ok: true });
            }

            // ── ACTION: LIST PENDING ──
            if (data === "cmd_pending") {
                await answerCallbackQuery(cb.id);
                await handleListPending(chatId, adminSupabase);
                return NextResponse.json({ ok: true });
            }

            // ── ACTION: LIST SUBSCRIBERS ──
            if (data === "cmd_subscribers") {
                await answerCallbackQuery(cb.id);
                await handleListSubscribers(chatId, adminSupabase);
                return NextResponse.json({ ok: true });
            }

            // ── ACTION: STATS ──
            if (data === "cmd_stats") {
                await answerCallbackQuery(cb.id);
                await handleStats(chatId, adminSupabase);
                return NextResponse.json({ ok: true });
            }
        }

        // 2. Handle Text Messages and Commands
        if (update.message && update.message.text) {
            const chatId = update.message.chat.id;
            const text: string = update.message.text.trim();

            if (text === "/start" || text === "/help" || text === "/menu") {
                const welcomeText = `👑 <b>أهلاً بك يا فندم في لوحة تحكم QureScan CEO</b>\n\n` +
                    `أنا مساعدك التنفيذي لإدارة المشتركين، طلبات التفعيل، وإلغاء الاشتراكات بضغطة زر واحدة.\n\n` +
                    `اختر من القائمة أدناه:`;

                const keyboard = {
                    inline_keyboard: [
                        [
                            { text: "👑 المشتركين الحاليين (باقة ألترا)", callback_data: "cmd_subscribers" },
                        ],
                        [
                            { text: "⏳ الطلبات المعلقة (قيد المراجعة)", callback_data: "cmd_pending" },
                            { text: "📊 إحصائيات المنصة الحية", callback_data: "cmd_stats" },
                        ],
                        [
                            { text: "🌐 فتح لوحة التحكم على الموقع", url: `${OFFICIAL_SITE_URL}/admin/ceo-requests` },
                        ]
                    ]
                };

                await sendTelegramMessage(chatId, welcomeText, keyboard);
                return NextResponse.json({ ok: true });
            }

            if (text === "/subscribers" || text === "/ultra" || text === "المشتركين") {
                await handleListSubscribers(chatId, adminSupabase);
                return NextResponse.json({ ok: true });
            }

            if (text === "/pending" || text === "الطلبات") {
                await handleListPending(chatId, adminSupabase);
                return NextResponse.json({ ok: true });
            }

            if (text === "/stats" || text === "إحصائيات") {
                await handleStats(chatId, adminSupabase);
                return NextResponse.json({ ok: true });
            }

            // Fallback: search or direct command
            await sendTelegramMessage(chatId, `💡 أرسل /menu لفتح القائمة الرئيسية أو /subscribers لعرض كل المشتركين وإلغاء أي اشتراك.`);
        }

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error("[Telegram Webhook Error]", error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}

// ── Handler: List All Ultra Subscribers with Revoke Buttons ──
async function handleListSubscribers(chatId: string | number, adminSupabase: any) {
    const { data: subscribers, error } = await adminSupabase
        .from("profiles")
        .select("id, username, full_name, plan, created_at, updated_at")
        .eq("plan", "ultra")
        .order("updated_at", { ascending: false })
        .limit(20);

    if (error || !subscribers || subscribers.length === 0) {
        await sendTelegramMessage(chatId, "ℹ️ لا يوجد أي مشتركين حاليين في باقة ULTRA.");
        return;
    }

    await sendTelegramMessage(chatId, `👑 <b>قائمة المشتركين الحاليين في باقة ألترا (${subscribers.length}):</b>`);

    for (const sub of subscribers) {
        const name = sub.full_name || sub.username || "مستخدم بدون اسم";
        const msg = `👤 <b>${name}</b>\n` +
            `🆔 <b>ID:</b> <code>${sub.id}</code>\n` +
            `📊 <b>الخطة:</b> ULTRA (مفعلة)\n` +
            `⏰ <b>تاريخ التحديث:</b> ${new Date(sub.updated_at || sub.created_at).toLocaleString("ar-EG")}`;

        const buttons = {
            inline_keyboard: [
                [
                    { text: "🛑 إلغاء اشتراك ألترا فوراً", callback_data: `revoke_${sub.id}` }
                ]
            ]
        };

        await sendTelegramMessage(chatId, msg, buttons);
    }
}

// ── Handler: List Pending Requests with Approve/Reject ──
async function handleListPending(chatId: string | number, adminSupabase: any) {
    const { data: pendingRequests, error } = await adminSupabase
        .from("ceo_upgrade_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(10);

    if (error || !pendingRequests || pendingRequests.length === 0) {
        await sendTelegramMessage(chatId, "✅ <b>رائع! لا توجد أي طلبات معلقة حالياً.</b>\nكل الطلبات تمت معالجتها.");
        return;
    }

    await sendTelegramMessage(chatId, `⏳ <b>الطلبات المعلقة قيد المراجعة (${pendingRequests.length}):</b>`);

    for (const req of pendingRequests) {
        const name = req.full_name || req.username || "بدون اسم";
        const details = req.profile_details || {};
        const msg = `👑 <b>طلب تفعيل من:</b> ${name}\n` +
            `📧 <b>البريد:</b> <code>${req.email}</code>\n` +
            `🆔 <b>User ID:</b> <code>${req.user_id}</code>\n` +
            `🩺 <b>البيانات:</b> عمر: ${details.age || "—"} | جنس: ${details.gender || "—"} | وزن: ${details.weight || "—"} | طول: ${details.height || "—"}\n` +
            `⏰ <b>وقت الطلب:</b> ${new Date(req.created_at).toLocaleString("ar-EG")}`;

        const buttons = {
            inline_keyboard: [
                [
                    { text: "⚡ تفعيل ألترا (٣٠٠ رصيد)", callback_data: `approve_${req.id}` },
                    { text: "❌ رفض", callback_data: `reject_${req.id}` }
                ]
            ]
        };

        await sendTelegramMessage(chatId, msg, buttons);
    }
}

// ── Handler: Live Platform Stats ──
async function handleStats(chatId: string | number, adminSupabase: any) {
    const { count: totalUsers } = await adminSupabase.from("profiles").select("*", { count: "exact", head: true });
    const { count: ultraUsers } = await adminSupabase.from("profiles").select("*", { count: "exact", head: true }).eq("plan", "ultra");
    const { count: freeUsers } = await adminSupabase.from("profiles").select("*", { count: "exact", head: true }).eq("plan", "free");
    const { count: pendingRequests } = await adminSupabase.from("ceo_upgrade_requests").select("*", { count: "exact", head: true }).eq("status", "pending");

    const statsText = `📊 <b>إحصائيات منصة QureScan الحية:</b>\n\n` +
        `👥 <b>إجمالي المستخدمين:</b> ${totalUsers || 0}\n` +
        `👑 <b>مشتركي باقة ألترا (ULTRA):</b> ${ultraUsers || 0}\n` +
        `🆓 <b>المستخدمين المجانيين (FREE):</b> ${freeUsers || 0}\n` +
        `⏳ <b>طلبات الترقية المعلقة:</b> ${pendingRequests || 0}\n\n` +
        `🚀 <i>المنصة تعمل بكفاءة على Vercel & Supabase.</i>`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: "👑 عرض المشتركين", callback_data: "cmd_subscribers" },
                { text: "⏳ الطلبات المعلقة", callback_data: "cmd_pending" },
            ],
            [
                { text: "🌐 فتح لوحة التحكم", url: `${OFFICIAL_SITE_URL}/admin/ceo-requests` }
            ]
        ]
    };

    await sendTelegramMessage(chatId, statsText, keyboard);
}
