"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';

// Mapa simple de rutas a permisos requeridos
const ROUTE_PERMISSIONS: Record<string, string> = {
  '/admin/settings/roles': 'manage_roles',
  '/admin/settings/team': 'manage_users',
  '/admin/catalog': 'view_catalog',
  '/admin/sales': 'view_sales',
  '/admin/logistics': 'view_shipping',
  '/admin/marketing': 'manage_marketing',
};

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || '';
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/admin/login');
      setAuthorized(false);
      return;
    }

    // Comprobar si la ruta actual requiere un permiso específico
    let requiredPermission = null;
    for (const [route, perm] of Object.entries(ROUTE_PERMISSIONS)) {
      if (pathname.startsWith(route)) {
        requiredPermission = perm;
        break;
      }
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      setAuthorized(false);
    } else {
      setAuthorized(true);
    }
  }, [user, loading, pathname, hasPermission, router]);

  if (loading || authorized === null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="loader" style={{ width: '40px', height: '40px', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '60vh', padding: '2rem', textAlign: 'center' }}>
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '24px', borderRadius: '50%', marginBottom: '1.5rem' }}>
          <ShieldAlert size={48} color="#ef4444" />
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '1rem' }}>Acceso Denegado</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: '1.6' }}>
          No tienes los permisos necesarios para ver esta página. Contacta al administrador si crees que esto es un error.
        </p>
        <button 
          onClick={() => router.push('/admin')}
          className="btn btn-primary" 
          style={{ marginTop: '2rem' }}
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
