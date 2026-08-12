"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@/context/UserContext";

interface UltraCelebrationContextType {
    isOpen: boolean;
    triggerCelebration: (options?: { force?: boolean }) => void;
    closeCelebration: () => void;
    hasSeenCelebration: boolean;
}

const UltraCelebrationContext = createContext<UltraCelebrationContextType | undefined>(undefined);

const CELEBRATION_STORAGE_KEY_PREFIX = "qurescan_ultra_celebrated_v1_";
const PENDING_TRIGGER_KEY = "qurescan_pending_ultra_celebration";

export const triggerGlobalUltraCelebration = () => {
    if (typeof window !== "undefined") {
        try {
            sessionStorage.setItem(PENDING_TRIGGER_KEY, "1");
            window.dispatchEvent(new CustomEvent("qurescan:celebrate_ultra"));
        } catch {
            // ignore storage errors
        }
    }
};

export function UltraCelebrationProvider({ children }: { children: React.ReactNode }) {
    const { user, plan, loading } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [hasSeenCelebration, setHasSeenCelebration] = useState(false);
    const previousPlanRef = useRef<string | null>(null);
    const initialCheckDoneRef = useRef(false);

    const getStorageKey = useCallback((userId: string) => {
        return `${CELEBRATION_STORAGE_KEY_PREFIX}${userId}`;
    }, []);

    const triggerCelebration = useCallback((options?: { force?: boolean }) => {
        setIsOpen(true);
        if (typeof window !== "undefined" && user?.id && !options?.force) {
            try {
                localStorage.setItem(getStorageKey(user.id), "true");
                setHasSeenCelebration(true);
            } catch {
                // ignore
            }
        }
    }, [user?.id, getStorageKey]);

    const closeCelebration = useCallback(() => {
        setIsOpen(false);
        if (typeof window !== "undefined" && user?.id) {
            try {
                localStorage.setItem(getStorageKey(user.id), "true");
                setHasSeenCelebration(true);
            } catch {
                // ignore
            }
        }
    }, [user?.id, getStorageKey]);

    // Check on user & plan change
    useEffect(() => {
        if (loading || !user) {
            previousPlanRef.current = plan || null;
            return;
        }

        const storageKey = getStorageKey(user.id);
        const alreadySeen = typeof window !== "undefined" ? localStorage.getItem(storageKey) === "true" : false;
        setHasSeenCelebration(alreadySeen);

        // Check if there's a pending trigger from checkout or voucher redemption
        let hasPendingTrigger = false;
        if (typeof window !== "undefined") {
            hasPendingTrigger = sessionStorage.getItem(PENDING_TRIGGER_KEY) === "1";
            if (hasPendingTrigger) {
                sessionStorage.removeItem(PENDING_TRIGGER_KEY);
            }
        }

        const isUltra = plan === "ultra";
        const wasNotUltra = previousPlanRef.current !== null && previousPlanRef.current !== "ultra";

        // If plan changed to ultra dynamically during the session
        if (isUltra && wasNotUltra) {
            const timer = setTimeout(() => {
                triggerCelebration();
            }, 600);
            previousPlanRef.current = plan;
            return () => clearTimeout(timer);
        }

        // If user is Ultra and has a pending trigger or has never seen celebration before on this device
        if (isUltra && !initialCheckDoneRef.current) {
            initialCheckDoneRef.current = true;
            if (hasPendingTrigger || !alreadySeen) {
                const timer = setTimeout(() => {
                    triggerCelebration();
                }, 800);
                previousPlanRef.current = plan;
                return () => clearTimeout(timer);
            }
        }

        previousPlanRef.current = plan;
    }, [user, plan, loading, getStorageKey, triggerCelebration]);

    // Listen to custom global window event
    useEffect(() => {
        const handleCustomEvent = () => {
            triggerCelebration({ force: true });
        };

        if (typeof window !== "undefined") {
            window.addEventListener("qurescan:celebrate_ultra", handleCustomEvent);
            return () => {
                window.removeEventListener("qurescan:celebrate_ultra", handleCustomEvent);
            };
        }
    }, [triggerCelebration]);

    return (
        <UltraCelebrationContext.Provider
            value={{
                isOpen,
                triggerCelebration,
                closeCelebration,
                hasSeenCelebration,
            }}
        >
            {children}
        </UltraCelebrationContext.Provider>
    );
}

export const useUltraCelebration = () => {
    const context = useContext(UltraCelebrationContext);
    if (!context) {
        throw new Error("useUltraCelebration must be used within an UltraCelebrationProvider");
    }
    return context;
};
