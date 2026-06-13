"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { User, Package, Award, CreditCard, Receipt, LifeBuoy, LogOut, Shield, Settings, MapPin, MessageSquare } from 'lucide-react';
import { getImageUrl } from '@/utils/imageUrl';

export default function ProfileSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Mi Base (Resumen)', href: '/profile', icon: <User size={20} /> },
    { name: 'Mis Pedidos', href: '/profile/orders', icon: <Package size={20} /> },
    { name: 'Mis Interacciones', href: '/profile/interactions', icon: <MessageSquare size={20} /> },
    { name: 'Mis Direcciones', href: '/profile/addresses', icon: <MapPin size={20} /> },
    { name: 'Recompensas y Nivel', href: '/profile/rewards', icon: <Award size={20} /> },
    { name: 'Métodos de Pago', href: '/profile/payments', icon: <CreditCard size={20} /> },
    { name: 'Facturación', href: '/profile/invoices', icon: <Receipt size={20} /> },
    { name: 'Centro de Soporte', href: '/profile/support', icon: <LifeBuoy size={20} /> },
    { name: 'Ajustes de Perfil', href: '/profile/settings', icon: <Settings size={20} /> },
  ];

  if (!user) return null;

  return (
    <aside style={{ width: '300px', flexShrink: 0, paddingRight: '20px' }} className="hide-on-mobile">
      <div className="glass-panel" style={{ 
        padding: '30px 24px', borderRadius: '24px', 
        position: 'sticky', top: '100px',
        boxShadow: '0 15px 40px rgba(0,0,0,0.2)'
      }}>
        
        {/* User Profile Summary */}
        <div style={{ textAlign: 'center', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ position: 'relative', width: '90px', height: '90px', margin: '0 auto 16px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #3b82f6)', padding: '3px', boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--background)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {user.profile_picture_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={getImageUrl(user.profile_picture_url)} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={40} color="var(--primary)" />
              )}
            </div>
          </div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.3rem', fontWeight: 900, color: 'var(--foreground)', letterSpacing: '-0.5px' }}>
            {user.full_name || user.username || 'Gamer'}
          </h3>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '4px 14px', borderRadius: '20px', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 700 }}>
            <Award size={14} /> Nivel {user.level || 1}
          </div>
          
          {user.is_superuser && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '4px 14px', borderRadius: '20px', color: '#10b981', fontSize: '0.85rem', fontWeight: 700, marginTop: '8px' }}>
              <Shield size={14} /> Super Admin
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                style={{ textDecoration: 'none' }}
              >
                <div 
                  className="hover-card"
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', 
                    borderRadius: '16px', transition: 'all 0.3s ease',
                    background: isActive ? 'linear-gradient(90deg, rgba(139, 92, 246, 0.15), transparent)' : 'transparent',
                    borderLeft: isActive ? '4px solid var(--primary)' : '4px solid transparent',
                    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: isActive ? 800 : 600,
                    boxShadow: isActive ? '0 4px 15px rgba(0,0,0,0.1)' : 'none'
                  }}
                  onMouseOver={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)';
                      e.currentTarget.style.color = 'var(--foreground)';
                      e.currentTarget.style.borderLeft = '4px solid rgba(139, 92, 246, 0.3)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-muted)';
                      e.currentTarget.style.borderLeft = '4px solid transparent';
                    }
                  }}
                >
                  <div style={{ 
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px', 
                    background: isActive ? '#2b1654' : 'rgba(255, 255, 255, 0.04)',
                    border: isActive ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid transparent',
                    color: isActive ? '#a78bfa' : 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {item.icon}
                  </div>
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button 
            onClick={logout}
            className="hover-card"
            style={{ 
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '14px 16px', 
              borderRadius: '16px', background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', 
              border: '1px solid rgba(239, 68, 68, 0.1)', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <LogOut size={20} />
            Desconectarse
          </button>
        </div>

      </div>
    </aside>
  );
}
