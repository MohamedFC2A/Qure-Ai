"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Crown,
    CheckCircle2,
    XCircle,
    Clock,
    User,
    Mail,
    Calendar,
    ArrowLeft,
    RefreshCw,
    ShieldAlert,
    Check,
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";

interface CeoRequest {
    id: string;
    user_id: string;
    email: string;
    full_name: string | null;
    username: string | null;
    profile_details: any;
    status: "pending" | "approved" | "rejected";
    activation_token: string;
    created_at: string;
    activated_at: string | null;
}

export default function CeoRequestsAdminPage() {
    const { user, loading: userLoading } = useUser();
    const { resultsLanguage } = useSettings();
    const router = useRouter();
    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    const [requests, setRequests] = useState<CeoRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [msg, setMsg] = useState<{ id: string; text: string; success: boolean } | null>(null);

    const isCeo = user?.email === "mohamedahmedmatany@gmail.com" || user?.email === "uversionstore@gmail.com" || user?.id === "00000000-0000-0000-0000-000000000001";

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/ceo-requests");
            const data = await res.json();
            if (res.ok) {
                setRequests(data.requests || []);
            }
        } catch (e) {
            console.error("Failed to fetch requests", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!userLoading) {
            if (!user) {
                router.push("/auth");
            } else if (isCeo) {
                fetchRequests();
            }
        }
    }, [user, userLoading, isCeo, router]);

    const handleAction = async (requestId: string, action: "approve" | "reject") => {
        setActionLoadingId(requestId);
        setMsg(null);
        try {
            const res = await fetch("/api/admin/ceo-requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId, action }),
            });
            const data = await res.json();
            if (res.ok) {
                setMsg({ id: requestId, text: data.message || "تمت العملية بنجاح", success: true });
                // Update local state
                setRequests((prev) =>
                    prev.map((r) =>
                        r.id === requestId ? { ...r, status: action === "approve" ? "approved" : "rejected" } : r
                    )
                );
            } else {
                setMsg({ id: requestId, text: data.error || "فشلت العملية", success: false });
            }
        } catch (e: any) {
            setMsg({ id: requestId, text: "خطأ في الاتصال", success: false });
        } finally {
            setActionLoadingId(null);
        }
    };

    if (userLoading) {
        return (
            <main className="min-h-screen pt-28 pb-16 px-4 flex items-center justify-center">
                <div className="flex items-center gap-3 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
                    <span>جاري التحقق...</span>
                </div>
            </main>
        );
    }

    if (!isCeo) {
        return (
            <main className="min-h-screen pt-28 pb-16 px-4 flex items-center justify-center">
                <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-red-500/30 text-center">
                    <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-white mb-2">غير مصرح بالدخول</h1>
                    <p className="text-slate-400 text-sm mb-6">هذه اللوحة مخصصة حصرياً للمدير التنفيذي (CEO).</p>
                    <Link href="/">
                        <Button variant="outline" className="w-full">العودة للرئيسية</Button>
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen pt-28 pb-24 px-4 sm:px-6 max-w-6xl mx-auto" dir={isArabic ? "rtl" : "ltr"}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-white/10 pb-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
                            <Crown className="w-4 h-4 text-amber-400" />
                        </div>
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">CEO Executive Portal</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white">
                        {t("Golden CEO Subscription Requests", "طلبات الاشتراك الذهبي (نسخة البيتا)")}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                        {t("Direct management and one-click activation of VIP user requests.", "إدارة ومراجعة طلبات المستخدمين وتفعيل باقة ULTRA بضغطة واحدة مباشرة.")}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchRequests}
                        disabled={loading}
                        className="py-2.5 px-4 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin text-cyan-400")} />
                        <span>{t("Refresh Requests", "تحديث الطلبات")}</span>
                    </button>
                    <Link href="/profile">
                        <button className="py-2.5 px-4 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-2 transition-colors">
                            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                            <span>{t("My Profile", "ملفي الشخصي")}</span>
                        </button>
                    </Link>
                </div>
            </div>

            {/* Content List */}
            {loading ? (
                <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center gap-3">
                    <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                    <span>{t("Loading CEO requests...", "جاري تحميل الطلبات...")}</span>
                </div>
            ) : requests.length === 0 ? (
                <div className="py-16 text-center rounded-3xl bg-slate-900/60 border border-white/10 p-8">
                    <Crown className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-white">{t("No Requests Found", "لا توجد طلبات معلقة حالياً")}</h3>
                    <p className="text-xs text-slate-400 mt-1">ستظهر هنا أي طلبات اشتراك ذهبي جديدة فور تقديمها من المستخدمين.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map((req) => {
                        const isPending = req.status === "pending";
                        const isApproved = req.status === "approved";
                        const isRejected = req.status === "rejected";
                        const isActionLoading = actionLoadingId === req.id;
                        const details = req.profile_details || {};

                        return (
                            <div
                                key={req.id}
                                className={cn(
                                    "p-5 sm:p-6 rounded-3xl border transition-all",
                                    isPending
                                        ? "bg-slate-900/90 border-amber-500/30"
                                        : isApproved
                                        ? "bg-slate-900/60 border-emerald-500/20"
                                        : "bg-slate-900/40 border-slate-800"
                                )}
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                    {/* User Info */}
                                    <div className="space-y-3 flex-1">
                                        <div className="flex items-center gap-3">
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5",
                                                isPending
                                                    ? "bg-amber-400/15 border border-amber-400/30 text-amber-300"
                                                    : isApproved
                                                    ? "bg-emerald-500/15 border border-emerald-400/30 text-emerald-300"
                                                    : "bg-slate-800 text-slate-400"
                                            )}>
                                                {isPending && <Clock className="w-3.5 h-3.5" />}
                                                {isApproved && <Check className="w-3.5 h-3.5" />}
                                                {isRejected && <XCircle className="w-3.5 h-3.5" />}
                                                <span>
                                                    {isPending ? "قيد المراجعة" : isApproved ? "تم التفعيل (مقبول)" : "مرفوض"}
                                                </span>
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {new Date(req.created_at).toLocaleString("ar-EG")}
                                            </span>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                <User className="w-4 h-4 text-cyan-400" />
                                                <span>{req.full_name || req.username || "مستخدم بدون اسم"}</span>
                                                {req.username && (
                                                    <span className="text-xs text-slate-400 font-normal">(@{req.username})</span>
                                                )}
                                            </h3>
                                            <p className="text-xs text-slate-300 flex items-center gap-2 mt-1">
                                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                <span>{req.email}</span>
                                                <span className="text-slate-600">•</span>
                                                <span className="font-mono text-slate-400">ID: {req.user_id}</span>
                                            </p>
                                        </div>

                                        {/* Profile Stats */}
                                        <div className="flex flex-wrap items-center gap-2 pt-1">
                                            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] text-slate-300">
                                                العمر: {details.age || "—"}
                                            </span>
                                            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] text-slate-300">
                                                الجنس: {details.gender || "—"}
                                            </span>
                                            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] text-slate-300">
                                                الطول: {details.height || "—"}
                                            </span>
                                            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] text-slate-300">
                                                الوزن: {details.weight || "—"}
                                            </span>
                                            <span className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-[11px] text-cyan-300">
                                                الخطة الحالية: {details.currentPlan || "free"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row lg:flex-col items-end justify-center gap-2 shrink-0">
                                        {msg && msg.id === req.id && (
                                            <p className={cn("text-xs font-semibold mb-1", msg.success ? "text-emerald-400" : "text-rose-400")}>
                                                {msg.text}
                                            </p>
                                        )}

                                        {isPending ? (
                                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                                <button
                                                    onClick={() => handleAction(req.id, "approve")}
                                                    disabled={isActionLoading}
                                                    className="flex-1 sm:flex-none py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                                >
                                                    <Crown className="w-4 h-4 fill-current" />
                                                    <span>{isActionLoading ? "جاري التفعيل..." : "⚡ تفعيل الاشتراك الذهبي"}</span>
                                                </button>
                                                <button
                                                    onClick={() => handleAction(req.id, "reject")}
                                                    disabled={isActionLoading}
                                                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
                                                >
                                                    رفض
                                                </button>
                                            </div>
                                        ) : isApproved ? (
                                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                <span>تم تفعيل ألترا بنجاح</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-500">تم رفض هذا الطلب</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </main>
    );
}
