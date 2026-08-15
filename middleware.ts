import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { hasAcceptedTerms, safeNextPath } from '@/lib/legal/terms'

// In-memory sliding window rate limiter for API endpoints
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

function applyRateLimit(ip: string, limit: number = 60, windowMs: number = 60000): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || entry.expiresAt < now) {
        rateLimitMap.set(ip, { count: 1, expiresAt: now + windowMs });
        return true;
    }

    if (entry.count >= limit) {
        return false;
    }

    entry.count += 1;
    return true;
}

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Fast-path bypass for webhooks and public callbacks
    if (
        pathname.startsWith('/api/telegram') ||
        pathname.startsWith('/api/admin/golden-ceo/activate') ||
        pathname.startsWith('/api/golden-ceo') ||
        pathname.startsWith('/api/status') ||
        pathname.startsWith('/api/v1/analyze')
    ) {
        return NextResponse.next();
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '127.0.0.1';

    // 1. Rate limiting check for API routes
    if (pathname.startsWith('/api/')) {
        const isStrictEndpoint = pathname.startsWith('/api/analyze') || pathname.startsWith('/api/ai');
        const limit = isStrictEndpoint ? 20 : 60; // 20 requests/min for AI analysis, 60/min for general APIs
        const allowed = applyRateLimit(`${ip}:${pathname}`, limit, 60000);

        if (!allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Rate limit exceeded.', code: 'RATE_LIMIT_EXCEEDED' },
                { status: 429, headers: { 'Retry-After': '60' } }
            );
        }
    }

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const applySecurityHeaders = (res: NextResponse) => {
        res.headers.set('X-Content-Type-Options', 'nosniff');
        res.headers.set('X-Frame-Options', 'DENY');
        res.headers.set('X-XSS-Protection', '1; mode=block');
        res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.headers.delete('x-powered-by');
        res.headers.delete('server');
        if (pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|woff2)$/)) {
            res.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        }
        return res;
    };

    applySecurityHeaders(response);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder.supabase.co')) {
        return response;
    }

    const safeFetch = async (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
        try {
            return await fetch(url, options);
        } catch (err: any) {
            console.warn("[Middleware Supabase] Fetch intercepted safely:", err?.message || err);
            return new Response(
                JSON.stringify({
                    error: "network_error",
                    message: err?.message || "Failed to fetch",
                }),
                {
                    status: 503,
                    statusText: "Service Unavailable",
                    headers: { "Content-Type": "application/json" },
                }
            );
        }
    };

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            global: {
                fetch: safeFetch,
            },
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    response = NextResponse.next({ request: { headers: request.headers } });
                    applySecurityHeaders(response);
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    let user: any = null;
    try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
            console.log(`[Middleware] Auth Error: ${error.message}`);
        }
        user = data?.user ?? null;
    } catch (authErr: any) {
        console.warn("[Middleware] Auth check network exception:", authErr?.message || authErr);
    }

    const isApi = pathname.startsWith('/api');
    const isAuthFlow = pathname.startsWith('/auth') || pathname === '/login' || pathname === '/signup';

    const publicApiPrefixes = [
        '/api/auth',
        '/api/status',
        '/api/tts',
        '/api/credits/status',
        '/api/v1/analyze',
        '/api/dev/login',
        '/api/telegram',
        '/api/admin/golden-ceo/activate',
        '/api/golden-ceo/request',
        '/api/changelog',
    ];
    const isPublicApi = isApi && publicApiPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

    const protectedPagePrefixes = ['/dashboard', '/profile', '/scan', '/ai'];
    const isProtectedPage = protectedPagePrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

    const isProtectedApi = isApi && !isPublicApi;
    const requiresAuth = isProtectedPage || isProtectedApi;
    const requiresTerms = requiresAuth && !isAuthFlow && pathname !== '/terms';
    const isLocalDevSession =
        process.env.NODE_ENV === 'development' &&
        request.cookies.get('qurescan_dev_auth')?.value === '1' &&
        (request.nextUrl.hostname === 'localhost' || request.nextUrl.hostname === '127.0.0.1' || request.nextUrl.hostname === '::1');

    const nextPath = `${pathname}${request.nextUrl.search || ''}`;

    const copyCookies = (from: NextResponse, to: NextResponse) => {
        try {
            for (const c of from.cookies.getAll()) {
                to.cookies.set(c.name, c.value, c);
            }
        } catch (e) {
            console.warn("[Middleware] Failed to copy cookies:", e);
        }
    };

    if (requiresAuth && !user && !isLocalDevSession) {
        if (isApi) {
            const unauthorized = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            copyCookies(response, unauthorized);
            return unauthorized;
        }

        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/login';
        loginUrl.searchParams.set('next', nextPath);
        const redirect = NextResponse.redirect(loginUrl);
        copyCookies(response, redirect);
        return redirect;
    }

    if (user && requiresTerms && !hasAcceptedTerms(user)) {
        if (isApi) {
            const forbidden = NextResponse.json({ error: "Terms acceptance required", code: "TERMS_REQUIRED" }, { status: 403 });
            copyCookies(response, forbidden);
            return forbidden;
        }

        const termsUrl = request.nextUrl.clone();
        termsUrl.pathname = '/terms';
        termsUrl.searchParams.set('next', nextPath);
        const redirect = NextResponse.redirect(termsUrl);
        copyCookies(response, redirect);
        return redirect;
    }

    if ((isLocalDevSession || (user && hasAcceptedTerms(user))) && (pathname === '/login' || pathname === '/signup')) {
        const target = request.nextUrl.clone();
        const requestedNext = safeNextPath(target.searchParams.get('next'), '/scan');
        const parsed = new URL(requestedNext, request.nextUrl.origin);
        target.pathname = parsed.pathname;
        target.search = parsed.search;
        const redirect = NextResponse.redirect(target);
        copyCookies(response, redirect);
        return redirect;
    }

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
