import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { hasAcceptedTerms, safeNextPath } from '@/lib/legal/terms'

// Middleware to handle Supabase session persistence
export async function middleware(request: NextRequest) {
    // Log incoming request
    console.log(`[Middleware] ${request.method} ${request.nextUrl.pathname}`);

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
        console.log(`[Middleware] Auth Error: ${error.message}`);
    } else if (user) {
        console.log(`[Middleware] Authenticated User: ${user.id}`);
    } else {
        console.log(`[Middleware] No User Session`);
    }

    const pathname = request.nextUrl.pathname;

    const isApi = pathname.startsWith('/api');
    const isAuthFlow = pathname.startsWith('/auth') || pathname === '/login' || pathname === '/signup';

    const publicApiPrefixes = ['/api/status', '/api/credits/status', '/api/v1/analyze'];
    const isPublicApi = isApi && publicApiPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

    const protectedPagePrefixes = ['/dashboard', '/profile', '/scan'];
    const isProtectedPage = protectedPagePrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

    const isProtectedApi = isApi && !isPublicApi;

    const requiresAuth = isProtectedPage || isProtectedApi;
    const requiresTerms = requiresAuth && !isAuthFlow && pathname !== '/terms';

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

    if (requiresAuth && !user) {
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

    // If logged in and already accepted terms, keep auth pages clean.
    if (user && hasAcceptedTerms(user) && (pathname === '/login' || pathname === '/signup')) {
        const target = request.nextUrl.clone();
        const requestedNext = safeNextPath(target.searchParams.get('next'), '/scan');
        const parsed = new URL(requestedNext, request.nextUrl.origin);
        target.pathname = parsed.pathname;
        target.search = parsed.search;
        const redirect = NextResponse.redirect(target);
        copyCookies(response, redirect);
        return redirect;
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
