// @ts-ignore
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    const {
        data: { session },
    } = await supabase.auth.getSession();

    // If there is no session and the user is trying to access the dashboard, redirect to login
    if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = '/login';
        return NextResponse.redirect(redirectUrl);
    }

    // If there IS a session and the user is on the login page, redirect to dashboard
    if (session && req.nextUrl.pathname === '/login') {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = '/dashboard';
        return NextResponse.redirect(redirectUrl);
    }

    return res;
}

export const config = {
    matcher: ['/dashboard/:path*', '/shop/:path*', '/login'],
};
