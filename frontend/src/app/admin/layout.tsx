'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/admin/Sidebar';
import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

import ProtectedRoute from '@/components/admin/ProtectedRoute';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Cerrar el menú si la pantalla se vuelve grande
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Si estamos en la página de login, no mostrar la estructura del admin (sidebar, topbar)
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
      <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
        {/* Top Bar for Mobile */}
        <div className="mobile-only mobile-topbar">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Gamer Loot</h2>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ background: 'transparent', border: 'none', color: 'var(--foreground)', cursor: 'pointer', padding: '4px' }}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Overlay for Mobile Drawer */}
        <div 
          className={`mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>

        <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          <ProtectedRoute>
            {children}
          </ProtectedRoute>
        </main>
      </div>
  );
}
