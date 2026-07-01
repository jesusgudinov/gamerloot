"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Box, Truck, Megaphone, ChevronDown, ChevronRight, Package, ListTree, Tags, BadgeCheck, PlugZap, ShoppingBag, FileText, Users, LogOut, Network, Activity, RotateCcw, Wand2 } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar({ isOpen = false, onClose = () => {} }: { isOpen?: boolean, onClose?: () => void }) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const { user, logout } = useAuth();
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({
    catalog: pathname.startsWith('/admin/catalog'),
    marketing: pathname.startsWith('/admin/marketing'),
    sales: pathname.startsWith('/admin/sales'),
    logistics: pathname.startsWith('/admin/logistics'),
  });

  const toggleDropdown = (id: string, defaultPath?: string) => {
    setOpenDropdowns(prev => ({ ...prev, [id]: !prev[id] }));
    if (defaultPath && !pathname.startsWith(defaultPath)) {
      router.push(defaultPath);
    }
  };

  // Close sidebar on route change for mobile
  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const menuItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { 
      id: 'catalog',
      icon: Box, 
      label: 'Catálogo',
      isDropdown: true,
      subLinks: [
        { href: '/admin/catalog/products', icon: Package, label: 'Productos' },
        { href: '/admin/catalog/categories', icon: ListTree, label: 'Categorías' },
        { href: '/admin/catalog/attributes', icon: Tags, label: 'Filtros / Atributos' },
        { href: '/admin/catalog/brands', icon: BadgeCheck, label: 'Marcas' },
        { href: '/admin/catalog/mapping', icon: Network, label: 'Mapeador de Proveedores' },
        { href: '/admin/catalog/reviews', icon: Megaphone, label: 'Reseñas' },
        { href: '/admin/catalog/questions', icon: FileText, label: 'Preguntas y Respuestas' },
        { href: '/admin/catalog/optimization', icon: Wand2, label: 'Optimización de Imágenes' },
      ]
    },
    { 
      id: 'sales',
      icon: ShoppingBag, 
      label: 'Ventas',
      isDropdown: true,
      subLinks: [
        { href: '/admin/sales/orders', icon: Package, label: 'Pedidos' },
        { href: '/admin/sales/invoices', icon: FileText, label: 'Facturación' },
        { href: '/admin/sales/quotes', icon: FileText, label: 'Cotizar' },
        { href: '/admin/sales/reports', icon: Activity, label: 'Reporte de ventas' },
        { href: '/admin/sales/rma', icon: RotateCcw, label: 'RMA y Devoluciones' },
      ]
    },
    { href: '/admin/clients', icon: Users, label: 'Suite de Clientes' },
    { 
      id: 'logistics',
      icon: Truck, 
      label: 'Logística',
      isDropdown: true,
      subLinks: [
        { href: '/admin/logistics/shipments', icon: Package, label: 'Envíos' },
        { href: '/admin/logistics/quote', icon: FileText, label: 'Cotizar Envío' },
      ]
    },
    { 
      id: 'marketing',
      icon: Megaphone, 
      label: 'Marketing',
      isDropdown: true,
      subLinks: [
        { href: '/admin/marketing', icon: LayoutDashboard, label: 'Resumen' },
        { href: '/admin/marketing/campaigns', icon: Tags, label: 'Campañas' },
        { href: '/admin/marketing/coupons', icon: BadgeCheck, label: 'Cupones' },
        { href: '/admin/marketing/banners', icon: LayoutDashboard, label: 'Banners' },
      ]
    },
    { href: '/admin/api-integration', icon: PlugZap, label: 'API e Integración' },
    { 
      id: 'settings',
      icon: Users, 
      label: 'Ajustes y Equipo',
      isDropdown: true,
      subLinks: [
        { href: '/admin/settings/roles', icon: LayoutDashboard, label: 'Roles y Permisos' },
        { href: '/admin/settings/team', icon: Users, label: 'Miembros' },
      ]
    },
  ];

  return (
    <aside className={`glass-panel mobile-drawer ${isOpen ? 'open' : ''}`} style={{ width: '280px', height: 'calc(100vh - 40px)', position: 'sticky', top: '20px', display: 'flex', flexDirection: 'column', padding: '24px', flexShrink: 0, zIndex: 1000, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}>
      <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }}></div>
      
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }} className="desktop-only">
          <div>
            <h2 style={{ color: 'var(--foreground)', fontSize: '1.75rem', fontWeight: 800, marginBottom: '4px' }}>Gamer Loot</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 400 }}>Centro de administración</span>
          </div>
          <ThemeToggle />
        </div>
      
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
        {menuItems.map((item) => {
          if (item.isDropdown) {
            const isActiveFolder = pathname.startsWith(`/admin/${item.id}`);
            const isOpenState = openDropdowns[item.id!];
            return (
              <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button 
                  onClick={() => toggleDropdown(item.id!, item.subLinks?.[0]?.href)}
                  className={`sidebar-link ${isActiveFolder ? 'active-folder' : ''}`}
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    border: 'none',
                    color: 'var(--foreground)', 
                    padding: '12px 16px', 
                    borderRadius: '8px', 
                    background: 'transparent', 
                    fontWeight: 500, 
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flexShrink: 0, display: 'flex' }}><item.icon size={20} /></div>
                    <span style={{ textAlign: 'left', lineHeight: '1.2' }}>{item.label}</span>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {isOpenState ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                </button>
                
                {isOpenState && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '20px', borderLeft: '2px solid rgba(255,255,255,0.1)', marginLeft: '26px' }}>
                    {item.subLinks?.map((subLink) => {
                      const isActive = pathname === subLink.href;
                      return (
                        <Link 
                          onClick={handleNavClick}
                          key={subLink.href}
                          href={subLink.href} 
                          className={isActive ? "" : "sidebar-link"}
                          style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            textDecoration: 'none', 
                            color: isActive ? '#ffffff' : 'var(--text-muted)', 
                            padding: '10px 14px', 
                            borderRadius: '8px', 
                            background: isActive ? 'linear-gradient(135deg, var(--primary), var(--primary-hover))' : 'transparent', 
                            fontWeight: isActive ? 600 : 400, 
                            boxShadow: isActive ? '0 4px 14px rgba(106, 17, 203, 0.4)' : 'none'
                          }}
                        >
                          <div style={{ flexShrink: 0, display: 'flex' }}><subLink.icon size={16} strokeWidth={isActive ? 2.5 : 2} /></div>
                          <span style={{ fontSize: '0.9rem', lineHeight: '1.2' }}>{subLink.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              onClick={handleNavClick}
              key={item.href}
              href={item.href!} 
              className={isActive ? "" : "sidebar-link"}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textDecoration: 'none', 
                color: isActive ? '#ffffff' : 'var(--foreground)', 
                padding: '12px 16px', 
                borderRadius: '8px', 
                background: isActive ? 'linear-gradient(135deg, var(--primary), var(--primary-hover))' : 'transparent', 
                fontWeight: isActive ? 600 : 500, 
                boxShadow: isActive ? '0 4px 14px rgba(106, 17, 203, 0.4)' : 'none'
              }}
            >
              <div style={{ flexShrink: 0, display: 'flex' }}><Icon size={20} strokeWidth={isActive ? 2.5 : 2} /></div>
              <span style={{ lineHeight: '1.2' }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent-cyan))', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--foreground)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.full_name || 'Cargando...'}</p>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.email || '...'}</p>
            </div>
          </div>
        </div>
        <button onClick={logout} style={{ width: '100%', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
          <LogOut size={16} /> Cerrar Sesión
        </button>
      </div>
      </div>
    </aside>
  );
}
