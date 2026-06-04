import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;
  
  const isAuthPage = pathname.startsWith('/admin/login') || pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isAdminRoute = pathname.startsWith('/admin');
  
  // Proteger rutas de admin (excepto el login de admin)
  if (isAdminRoute && !isAuthPage) {
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Si ya estamos autenticados y queremos entrar al login
  if (isAuthPage && token) {
     if (pathname.startsWith('/admin/login')) {
       return NextResponse.redirect(new URL('/admin', request.url));
     }
     // Para usuarios normales
     return NextResponse.redirect(new URL('/store', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login', '/signup'],
};
