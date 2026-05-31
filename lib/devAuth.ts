import { NextRequest } from "next/server";
import { TERMS_VERSION } from "@/lib/legal/terms";

export const LOCAL_DEV_USER_ID = "local-dev-user";
export const LOCAL_DEV_EMAIL = "local.dev@qure-ai.local";
export const LOCAL_DEV_COOKIE = "qure_dev_auth";

export function getLocalDevUser(request: NextRequest) {
    const host = request.headers.get("host") || "";
    const isLocalHost = host.startsWith("localhost:") || host.startsWith("127.0.0.1:") || host.startsWith("[::1]:");
    const hasDevCookie = request.cookies.get(LOCAL_DEV_COOKIE)?.value === "1";

    if (process.env.NODE_ENV !== "development" || !isLocalHost || !hasDevCookie) {
        return null;
    }

    return {
        id: LOCAL_DEV_USER_ID,
        email: LOCAL_DEV_EMAIL,
        user_metadata: {
            username: "local_dev",
            terms_accepted_at: new Date().toISOString(),
            terms_version: TERMS_VERSION,
        },
    };
}
