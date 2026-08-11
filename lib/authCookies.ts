/**
 * Intelligent Cookie Cleaner for QureScan
 * Deletes all auth-related cookies safely across paths, domains, and expiration settings.
 */

export function clearAllAuthCookies(): void {
    if (typeof document === "undefined") return;

    const cookieNamesToClear = [
        "qurescan_dev_auth",
        "sb-access-token",
        "sb-refresh-token",
    ];

    const currentDomain = window.location.hostname;
    const paths = ["/", "/app", "/api", "/auth", "/dashboard", "/profile", "/settings"];

    // 1. Clear known cookies and any cookie starting with sb- or qurescan_
    const allCookies = document.cookie.split(";");
    for (const c of allCookies) {
        const name = c.split("=")[0].trim();
        if (name.startsWith("sb-") || name.startsWith("qurescan_") || cookieNamesToClear.includes(name)) {
            for (const path of paths) {
                // Clear without domain
                document.cookie = `${name}=; path=${path}; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax`;
                // Clear with domain
                if (currentDomain) {
                    document.cookie = `${name}=; path=${path}; domain=${currentDomain}; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax`;
                    document.cookie = `${name}=; path=${path}; domain=.${currentDomain}; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax`;
                }
            }
        }
    }
}
