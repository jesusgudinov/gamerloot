import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const adminToken = request.cookies.get('admin_access_token')?.value;
  const clientToken = request.cookies.get('client_access_token')?.value;
  const { pathname } = request.nextUrl;
  
  const isAdminLogin = pathname.startsWith('/admin/login');
  const isClientLogin = pathname.startsWith('/auth/login') || pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isAdminRoute = pathname.startsWith('/admin');
  
  // Proteger rutas de admin (excepto el login de admin)
  if (isAdminRoute && !isAdminLogin) {
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Si ya estamos autenticados y queremos entrar al login de admin
  if (isAdminLogin && adminToken) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }
  
  // Si ya estamos autenticados y queremos entrar al login de cliente
  if (isClientLogin && clientToken) {
     return NextResponse.redirect(new URL('/store', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login', '/signup'],
};
