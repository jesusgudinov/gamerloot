import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const adminToken = request.cookies.get('admin_access_token')?.value;
  const clientToken = request.cookies.get('client_access_token')?.value;
  const { pathname } = request.nextUrl;
  
  const isAdminLogin = pathname.startsWith('/admin/login');
  const isClientLogin = pathname.startsWith('/auth/login') || pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isAdminRoute = pathname.startsWith('/admin');
  
  // NOTA: La protección de rutas ahora se maneja 100% en el cliente (ProtectedRoute y AuthContext)
  // porque el middleware no puede leer tokens de localStorage en entornos de desarrollo (SameSite/IP issues).
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login', '/signup'],
};
