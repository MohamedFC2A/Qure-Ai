import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { safeNextPath } from '@/lib/legal/terms';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const next = safeNextPath(searchParams.get('next'), '/dashboard');

    const requestUrl = new URL(request.url);
    const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
    const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
    const host = forwardedHost || request.headers.get('host');
    const proto = forwardedProto || requestUrl.protocol.replace(':', '');
    const origin = host ? `${proto}://${host}` : requestUrl.origin;

    const redirectUrl = `${origin}${next}`;
    const response = NextResponse.redirect(redirectUrl);

    if (code) {
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
                            response.cookies.set(name, value, options);
                        });
                    },
                },
            }
        );

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return response;
        }
        console.error('[Auth Callback Error]', error);
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
