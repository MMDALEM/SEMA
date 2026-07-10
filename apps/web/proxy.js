import { NextResponse } from 'next/server';

/**
 * محافظت از مسیرهای داشبورد در لایه‌ی فرانت.
 * (کنترل اصلی دسترسی همیشه سمت API انجام می‌شود)
 */
export function proxy(req) {
  const hasSession = req.cookies.has('sema_session') || req.cookies.has('sema_at');
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/dashboard') && !hasSession) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if (pathname === '/login' && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  if (pathname === '/') {
    return NextResponse.redirect(new URL(hasSession ? '/dashboard' : '/login', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/dashboard/:path*'],
};
