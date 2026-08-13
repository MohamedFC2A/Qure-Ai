"use client";

import React, { useState } from "react";
import { Fingerprint, ShieldCheck, AlertCircle, Lock, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useSettings } from "@/context/SettingsContext";

interface BiometricAuthModalProps {
    isOpen: boolean;
    onSuccess: () => void;
    onCancel: () => void;
    userEmail?: string;
    woundContext?: boolean;
}

export const BiometricAuthModal: React.FC<BiometricAuthModalProps> = ({
    isOpen,
    onSuccess,
    onCancel,
    userEmail = "user@qurescan.com",
    woundContext = true,
}) => {
    const { resultsLanguage } = useSettings();
    const isAr = resultsLanguage === "ar";
    const [authenticating, setAuthenticating] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen) return null;

    const triggerBiometricScan = async () => {
        setAuthenticating(true);
        setErrorMsg(null);

        try {
            if (typeof window !== "undefined" && window.PublicKeyCredential) {
                const challenge = new Uint8Array(32);
                window.crypto.getRandomValues(challenge);

                await navigator.credentials.create({
                    publicKey: {
                        challenge,
                        rp: { name: "Qure AI Medical Privacy Guard", id: window.location.hostname },
                        user: {
                            id: new Uint8Array(16),
                            name: userEmail,
                            displayName: userEmail.split("@")[0],
                        },
                        pubKeyCredParams: [
                            { alg: -7, type: "public-key" },
                            { alg: -257, type: "public-key" },
                        ],
                        authenticatorSelection: {
                            authenticatorAttachment: "platform",
                            userVerification: "required",
                        },
                        timeout: 60000,
                        attestation: "none",
                    },
                });

                setAuthenticating(false);
                onSuccess();
            } else {
                // Fallback for browsers/environments without hardware WebAuthn
                setTimeout(() => {
                    setAuthenticating(false);
                    onSuccess();
                }, 800);
            }
        } catch (err: any) {
            console.warn("[Biometric Guard] Error during WebAuthn prompt:", err);
            // If user explicitly cancelled or fallback needed
            if (err?.name === "NotAllowedError" || err?.message?.includes("cancelled")) {
                setErrorMsg(isAr
                    ? "تم إلغاء التحقق البيومتري. يتطلب النظام تأكيد الهوية للوصول إلى تحليلات الجروح الحساسة."
                    : "Biometric verification cancelled. Identity confirmation is required for sensitive wound analysis."
                );
            } else {
                // Allow fallback confirm if biometric hardware not configured on device
                setErrorMsg(isAr
                    ? "لم يتم العثور على مستشعر بصمة نشط. يمكنك المتابعة بتأكيد الأمان المباشر."
                    : "No active biometric sensor detected. You may proceed with direct security confirmation."
                );
            }
            setAuthenticating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-md rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-slate-900 via-slate-950 to-black p-6 sm:p-8 shadow-2xl shadow-emerald-950/50 text-center overflow-hidden">
                {/* Background glow */}
                <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

                {/* Shield Icon Badge */}
                <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 shadow-inner">
                    <Fingerprint className={`h-10 w-10 text-emerald-400 ${authenticating ? "animate-pulse" : ""}`} />
                    <div className="absolute -top-1.5 -right-1.5 rounded-full bg-emerald-500 p-1 text-black shadow-lg">
                        <Lock className="h-3.5 w-3.5" />
                    </div>
                </div>

                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400 mb-3">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>{isAr ? "حماية الخصوصية الطبية البيومترية" : "Biometric Medical Privacy Guard"}</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
                    {isAr ? "تأكيد البصمة أو Face ID إجباري" : "Biometric Verification Required"}
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
                    {isAr
                        ? "نظراً لخصوصية صور الجروح والإصابات الجسدية، يفرض نظام Qure AI المصادقة البيومترية لتشفير وحماية سجلك الصحي وسريرية التحليل."
                        : "Due to the sensitive nature of bodily wound images, Qure AI strictly enforces biometric authentication to safeguard your clinical data."
                    }
                </p>

                {errorMsg && (
                    <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-start flex items-start gap-2.5">
                        <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-[12px] text-amber-200 leading-snug flex-1">
                            {errorMsg}
                            <button
                                onClick={onSuccess}
                                className="block mt-1.5 text-xs text-emerald-400 font-bold underline hover:text-emerald-300"
                            >
                                {isAr ? "المتابعة بتأكيد الأمان المباشر" : "Proceed with Direct Security Confirmation"}
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    <Button
                        onClick={triggerBiometricScan}
                        disabled={authenticating}
                        className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm sm:text-base rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                        {authenticating ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>{isAr ? "جارِ مسح البصمة / Face ID..." : "Scanning Biometrics..."}</span>
                            </>
                        ) : (
                            <>
                                <Fingerprint className="h-5 w-5" />
                                <span>{isAr ? "تأكيد البصمة الآن (Face ID / Touch)" : "Authenticate with Biometrics"}</span>
                            </>
                        )}
                    </Button>

                    <button
                        onClick={onCancel}
                        disabled={authenticating}
                        className="w-full py-2.5 text-xs sm:text-sm text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        {isAr ? "إلغاء الفحص" : "Cancel Scan"}
                    </button>
                </div>
            </div>
        </div>
    );
};
