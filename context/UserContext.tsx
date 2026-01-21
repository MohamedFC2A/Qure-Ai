"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface UserState {
    user: any | null;
    plan: 'free' | 'ultra';
    credits: number;
    loading: boolean;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserState | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [plan, setPlan] = useState<'free' | 'ultra'>('free');
    const [credits, setCredits] = useState(0);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const refreshUser = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                // Fetch credits and plan
                try {
                    const res = await fetch('/api/credits/status');
                    if (res.ok) {
                        const data = await res.json();
                        setPlan(data.plan);
                        setCredits(Number(data.totalAvailable ?? 0));
                    }
                } catch (e) {
                    console.warn("UserProvider: Failed to fetch credits", e);
                }
            } else {
                setPlan('free');
                setCredits(0);
            }
        } catch (error) {
            console.error("User context refresh error", error);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        refreshUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            refreshUser();
        });

        return () => subscription.unsubscribe();
    }, [refreshUser, supabase]);

    return (
        <UserContext.Provider value={{ user, plan, credits, loading, refreshUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
};
