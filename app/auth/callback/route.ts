import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

import { getBaseUrl } from '@/lib/config';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';
    const baseUrl = getBaseUrl();

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            // Force redirect to the configured production URL
            return NextResponse.redirect(`${baseUrl}${next}`);
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${baseUrl}/auth/auth-code-error`);
}
