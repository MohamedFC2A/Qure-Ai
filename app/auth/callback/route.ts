import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { EmailOtpType } from '@supabase/supabase-js';
import { safeNextPath } from '@/lib/legal/terms';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const { searchParams } = requestUrl;

    const code = searchParams.get('code');
    const token_hash = searchParams.get('token_hash');
    const type = (searchParams.get('type') || 'signup') as EmailOtpType;
    const next = safeNextPath(searchParams.get('next'), '/scan');

    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
    const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
    const host = forwardedHost || request.headers.get('host');
    const proto = forwardedProto || requestUrl.protocol.replace(':', '');
    const origin = host ? `${proto}://${host}` : requestUrl.origin;

    // Handle provider / auth errors
    if (errorParam) {
        console.warn('[Auth Callback] Provider returned error:', errorParam, errorDescription);
        const loginUrl = new URL('/login', origin);
        loginUrl.searchParams.set('auth_error', errorDescription || errorParam);
        return NextResponse.redirect(loginUrl.toString());
    }

    const redirectTarget = new URL(next, origin);
    const response = NextResponse.redirect(redirectTarget.toString());

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value);
                        response.cookies.set(name, value, {
                            ...options,
                            path: '/',
                            sameSite: 'lax',
                            secure: process.env.NODE_ENV === 'production',
                        });
                    });
                },
            },
        }
    );

    // 1. Handle PKCE Code exchange
    if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error && data?.session) {
            return response;
        }

        console.warn('[Auth Callback] Code exchange failed or code_verifier absent:', error?.message);

        // If code exchange failed (e.g. email opened in a different browser/app where PKCE verifier cookie is absent),
        // the email is usually already confirmed on Supabase backend.
        // Redirect user gracefully to login with a verified banner to sign in with their password immediately.
        const loginSuccessUrl = new URL('/login', origin);
        loginSuccessUrl.searchParams.set('verified', 'true');
        loginSuccessUrl.searchParams.set('next', next);
        return NextResponse.redirect(loginSuccessUrl.toString());
    }

    // 2. Handle Token Hash / OTP verification
    if (token_hash && type) {
        const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type,
        });

        if (!error && data?.session) {
            return response;
        }

        console.warn('[Auth Callback] verifyOtp failed:', error?.message);
        const loginSuccessUrl = new URL('/login', origin);
        loginSuccessUrl.searchParams.set('verified', 'true');
        loginSuccessUrl.searchParams.set('next', next);
        return NextResponse.redirect(loginSuccessUrl.toString());
    }

    // 3. Check existing user session
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user) {
        return response;
    }

    return NextResponse.redirect(new URL('/auth/auth-code-error', origin).toString());
}
