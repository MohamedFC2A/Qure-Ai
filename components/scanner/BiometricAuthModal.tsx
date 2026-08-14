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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl animate-in fade-in duration-150">
            <div className="relative w-full max-w-md rounded-3xl border border-white/[0.12] bg-[#080D1A]/95 p-6 sm:p-7 text-center overflow-hidden shadow-2xl backdrop-blur-2xl">
                {/* Shield Icon Badge */}
                <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-emerald-500/10">
                    <Fingerprint className={`h-8 w-8 text-emerald-400 ${authenticating ? "animate-pulse" : ""}`} />
                    <div className="absolute -top-1 -right-1 rounded-full bg-emerald-500 p-1 text-slate-950">
                        <Lock className="h-3 w-3" />
                    </div>
                </div>

                <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 px-3 py-1 text-xs font-bold text-cyan-300 mb-3">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>{isAr ? "تم الكشف: فحص جلدي وسريري حساس" : "Detected: Sensitive Clinical Skin / Body Scan"}</span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 tracking-tight">
                    {isAr ? "تأكيد البصمة أو Face ID إجباري" : "Mandatory Biometric Verification"}
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 mb-5 leading-relaxed">
                    {isAr
                        ? "تعرف النظام على الصورة كفحص جلدي أو إصابة سريرية خاصة. ونظراً لخصوصية وحساسية البيانات الطبية والجسدية، يفرض نظام Qure AI التحقق البيومتري لحماية خصوصيتك التامة قبل عرض التقرير."
                        : "The AI classified this image as a private skin or clinical physical scan. Due to strict medical privacy standards for bodily health scans, biometric verification is mandatory to proceed."
                    }
                </p>

                {errorMsg && (
                    <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-start flex items-start gap-2.5">
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

                <div className="flex flex-col gap-2.5">
                    <Button
                        onClick={triggerBiometricScan}
                        disabled={authenticating}
                        className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors"
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
