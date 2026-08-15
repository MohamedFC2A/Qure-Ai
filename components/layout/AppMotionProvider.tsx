"use client";

import React, { useEffect } from "react";
import { MotionConfig } from "framer-motion";

export function AppMotionProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (typeof window === "undefined") return;

        const cleanNode = (node: any) => {
            if (node && node.removeAttribute) {
                if (node.hasAttribute("bis_skin_checked")) node.removeAttribute("bis_skin_checked");
                if (node.hasAttribute("fdprocessedid")) node.removeAttribute("fdprocessedid");
            }
        };

        const obs = new MutationObserver((mutations) => {
            mutations.forEach((m) => {
                if (
                    m.type === "attributes" &&
                    (m.attributeName === "bis_skin_checked" || m.attributeName === "fdprocessedid")
                ) {
                    (m.target as Element)?.removeAttribute?.(m.attributeName);
                }
                if (m.addedNodes) {
                    m.addedNodes.forEach((n) => {
                        cleanNode(n);
                        if ((n as Element).querySelectorAll) {
                            (n as Element).querySelectorAll("[bis_skin_checked],[fdprocessedid]").forEach(cleanNode);
                        }
                    });
                }
            });
        });

        obs.observe(document.documentElement, {
            attributes: true,
            childList: true,
            subtree: true,
            attributeFilter: ["bis_skin_checked", "fdprocessedid"],
        });

        return () => {
            obs.disconnect();
        };
    }, []);

    return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
