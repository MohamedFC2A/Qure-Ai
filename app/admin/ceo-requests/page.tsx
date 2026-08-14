"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Crown,
    CheckCircle2,
    XCircle,
    Clock,
    User,
    Mail,
    Search,
    ArrowLeft,
    RefreshCw,
    ShieldAlert,
    Check,
    Copy,
    Users,
    MessageSquare,
    Ban,
    RotateCcw,
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface CeoRequest {
    id: string;
    user_id: string;
    email: string;
    full_name: string | null;
    username: string | null;
    profile_details: any;
    status: "pending" | "approved" | "rejected" | "revoked";
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
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "revoked">("all");

    const userEmail = (user?.email || (user as any)?.user_metadata?.email || "").toLowerCase().trim();
    const isCeo = ["mohamedahmedmatany@gmail.com", "uversionstore@gmail.com"].includes(userEmail) || user?.id === "00000000-0000-0000-0000-000000000001";

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

    const handleAction = async (requestId: string, action: "approve" | "reject" | "revoke") => {
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
                setRequests((prev) =>
                    prev.map((r) =>
                        r.id === requestId
                            ? {
                                  ...r,
                                  status: action === "approve" ? "approved" : action === "revoke" ? "revoked" : "rejected",
                                  activated_at: action === "approve" ? new Date().toISOString() : r.activated_at,
                              }
                            : r
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

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Filtered requests
    const filteredRequests = useMemo(() => {
        return requests.filter((r) => {
            const matchesStatus = statusFilter === "all" || r.status === statusFilter;
            const q = searchQuery.toLowerCase().trim();
            const matchesQuery =
                !q ||
                r.email?.toLowerCase().includes(q) ||
                r.full_name?.toLowerCase().includes(q) ||
                r.username?.toLowerCase().includes(q) ||
                r.user_id?.toLowerCase().includes(q);
            return matchesStatus && matchesQuery;
        });
    }, [requests, statusFilter, searchQuery]);

    const stats = useMemo(() => {
        const total = requests.length;
        const pending = requests.filter((r) => r.status === "pending").length;
        const approved = requests.filter((r) => r.status === "approved").length;
        const revoked = requests.filter((r) => r.status === "revoked" || r.status === "rejected").length;
        return { total, pending, approved, revoked };
    }, [requests]);

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
                <div className="max-w-md w-full p-8 rounded-3xl bg-[#080D1A]/90 border border-red-500/30 backdrop-blur-2xl text-center shadow-2xl">
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
                        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                            <Crown className="w-4 h-4 text-cyan-400" />
                        </div>
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">CEO Executive Portal</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white">
                        {t("CEO Upgrades & Ultra Control", "لوحة تحكم ترقيات CEO وباقة ألترا")}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                        {t("Activate or revoke ULTRA plan for any user with 1-click in real time.", "تفعيل باقة ULTRA أو إلغاء الاشتراك عن أي مستخدم بضغطة زر واحدة لحظياً.")}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <a
                        href="https://t.me/QureScanbot"
                        target="_blank"
                        rel="noreferrer"
                        className="py-2.5 px-4 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <MessageSquare className="w-4 h-4 text-cyan-400" />
                        <span>{t("Telegram Bot (@QureScanbot)", "بوت تيليجرام (@QureScanbot)")}</span>
                    </a>
                    <button
                        onClick={fetchRequests}
                        disabled={loading}
                        className="py-2.5 px-4 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-300 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin text-cyan-400")} />
                        <span>{t("Refresh", "تحديث")}</span>
                    </button>
                    <Link href="/profile">
                        <button className="py-2.5 px-4 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-2 transition-colors">
                            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                            <span>{t("My Profile", "ملفي")}</span>
                        </button>
                    </Link>
                </div>
            </div>

            {/* KPI Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
                <div className="p-5 rounded-2xl bg-[#080D1A]/85 backdrop-blur-2xl border border-white/[0.08] shadow-xl flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-400 font-semibold">{t("Total Requests", "إجمالي الطلبات")}</p>
                        <p className="text-2xl font-black text-white mt-1">{stats.total}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#0C1324] border border-white/[0.08] text-slate-300 flex items-center justify-center">
                        <Users className="w-5 h-5" />
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#080D1A]/85 backdrop-blur-2xl border border-white/[0.08] shadow-xl flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-400 font-semibold">{t("Pending Review", "قيد المراجعة")}</p>
                        <p className="text-2xl font-black text-slate-200 mt-1">{stats.pending}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#0C1324] border border-white/[0.08] text-cyan-400 flex items-center justify-center">
                        <Clock className="w-5 h-5" />
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#080D1A]/85 backdrop-blur-2xl border border-emerald-500/25 shadow-xl flex items-center justify-between">
                    <div>
                        <p className="text-xs text-emerald-400 font-semibold">{t("Active Ultra Users", "مشتركي ألترا الحاليين")}</p>
                        <p className="text-2xl font-black text-emerald-300 mt-1">{stats.approved}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#080D1A]/85 backdrop-blur-2xl border border-rose-500/25 shadow-xl flex items-center justify-between">
                    <div>
                        <p className="text-xs text-rose-400 font-semibold">{t("Revoked / Rejected", "الملغيين والمرفوضين")}</p>
                        <p className="text-2xl font-black text-rose-300 mt-1">{stats.revoked}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                        <Ban className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-1.5 p-1 bg-[#080D1A]/85 backdrop-blur-xl border border-white/[0.08] rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
                    {[
                        { id: "all", labelEn: "All", labelAr: "الكل" },
                        { id: "pending", labelEn: `Pending (${stats.pending})`, labelAr: `قيد الانتظار (${stats.pending})` },
                        { id: "approved", labelEn: `Active Ultra (${stats.approved})`, labelAr: `المشتركين (${stats.approved})` },
                        { id: "revoked", labelEn: `Revoked (${stats.revoked})`, labelAr: `الملغيين (${stats.revoked})` },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id as any)}
                            className={cn(
                                "whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                                statusFilter === tab.id
                                    ? "bg-slate-800 text-white border border-slate-700"
                                    : "text-slate-400 hover:text-slate-200"
                            )}
                        >
                            {isArabic ? tab.labelAr : tab.labelEn}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder={t("Search by email, name, or ID...", "بحث بالاسم، الإيميل، أو المعرف...")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full py-2 ps-9 pe-4 bg-[#080D1A]/80 border border-white/[0.08] rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/40"
                    />
                </div>
            </div>

            {/* Content List */}
            {loading ? (
                <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center gap-3">
                    <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                    <span>{t("Loading requests...", "جاري تحميل الطلبات...")}</span>
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="py-16 text-center rounded-3xl bg-slate-900/60 border border-white/10 p-8">
                    <Crown className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-white">
                        {searchQuery ? t("No matching requests", "لا توجد نتائج مطابقة لبحثك") : t("No requests in this section", "لا توجد طلبات في هذا القسم")}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">ستظهر هنا أي طلبات ترقية فور تقديمها من المستخدمين.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredRequests.map((req) => {
                        const isPending = req.status === "pending";
                        const isApproved = req.status === "approved";
                        const isRevoked = req.status === "revoked";
                        const isRejected = req.status === "rejected";
                        const isActionLoading = actionLoadingId === req.id;
                        const details = req.profile_details || {};

                        return (
                            <div
                                key={req.id}
                                className={cn(
                                    "p-5 sm:p-6 rounded-3xl border transition-all shadow-sm",
                                    isPending
                                        ? "bg-slate-900/95 border-slate-700"
                                        : isApproved
                                        ? "bg-slate-900/70 border-emerald-500/30"
                                        : isRevoked
                                        ? "bg-slate-900/50 border-rose-500/25"
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
                                                    ? "bg-slate-800 border border-slate-700 text-slate-300"
                                                    : isApproved
                                                    ? "bg-emerald-500/15 border border-emerald-400/30 text-emerald-300"
                                                    : isRevoked
                                                    ? "bg-rose-500/15 border border-rose-400/30 text-rose-300"
                                                    : "bg-slate-800 text-slate-400"
                                            )}>
                                                {isPending && <Clock className="w-3.5 h-3.5" />}
                                                {isApproved && <Check className="w-3.5 h-3.5" />}
                                                {isRevoked && <Ban className="w-3.5 h-3.5" />}
                                                {isRejected && <XCircle className="w-3.5 h-3.5" />}
                                                <span>
                                                    {isPending
                                                        ? "قيد المراجعة"
                                                        : isApproved
                                                        ? "مشترك حالي (ألترا)"
                                                        : isRevoked
                                                        ? "تم إلغاء الاشتراك (مجاني)"
                                                        : "مرفوض"}
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
                                            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-300">
                                                <span className="flex items-center gap-1">
                                                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                    <span>{req.email}</span>
                                                </span>
                                                <span className="text-slate-600">•</span>
                                                <button
                                                    onClick={() => copyToClipboard(req.user_id, req.id)}
                                                    className="font-mono text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer bg-slate-800/80 px-2 py-0.5 rounded"
                                                    title="نسخ معرف المستخدم"
                                                >
                                                    <span>ID: {req.user_id}</span>
                                                    {copiedId === req.id ? (
                                                        <Check className="w-3 h-3 text-emerald-400" />
                                                    ) : (
                                                        <Copy className="w-3 h-3 text-slate-400" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Profile Stats */}
                                        <div className="flex flex-wrap items-center gap-2 pt-1">
                                            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] text-slate-300 font-medium">
                                                العمر: {details.age || "—"}
                                            </span>
                                            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] text-slate-300 font-medium">
                                                الجنس: {details.gender || "—"}
                                            </span>
                                            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] text-slate-300 font-medium">
                                                الطول: {details.height || "—"}
                                            </span>
                                            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] text-slate-300 font-medium">
                                                الوزن: {details.weight || "—"}
                                            </span>
                                            <span className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-[11px] text-cyan-300 font-bold">
                                                الخطة الحالية: {isApproved ? "ULTRA (VIP)" : isRevoked ? "FREE (Cancelled)" : details.currentPlan || "free"}
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
                                                    className="flex-1 sm:flex-none py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                                                >
                                                    <Crown className="w-4 h-4 fill-current" />
                                                    <span>{isActionLoading ? "جاري التفعيل..." : "تفعيل ألترا (٣٠٠ رصيد)"}</span>
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
                                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                                    <span>مفعل (٣٠٠ رصيد)</span>
                                                </div>
                                                <button
                                                    onClick={() => handleAction(req.id, "revoke")}
                                                    disabled={isActionLoading}
                                                    className="py-2 px-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/25 text-rose-300 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                                                >
                                                    <Ban className="w-3.5 h-3.5 text-rose-400" />
                                                    <span>{isActionLoading ? "جاري الإلغاء..." : "إلغاء الاشتراك"}</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-500">
                                                    {isRevoked ? "تم إلغاء الاشتراك" : "تم رفض الطلب"}
                                                </span>
                                                <button
                                                    onClick={() => handleAction(req.id, "approve")}
                                                    disabled={isActionLoading}
                                                    className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                                                >
                                                    <RotateCcw className="w-3 h-3" />
                                                    <span>إعادة التفعيل</span>
                                                </button>
                                            </div>
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
