'use client';

import { useState, useEffect } from 'react';
import { Megaphone, Tags, Zap, Users, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function MarketingDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    active_campaigns: 0,
    active_flash_sales: 0,
    total_coupons_used: 0,
    total_affiliate_commission: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    
    fetch('http://localhost:8000/api/v1/marketing/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, [token]);

  const cards = [
    { title: 'Campañas Activas', value: stats.active_campaigns, icon: Megaphone, color: '#f59e0b', href: '/admin/marketing/campaigns' },
    { title: 'Ofertas Relámpago', value: stats.active_flash_sales, icon: Zap, color: '#ef4444', href: '/admin/marketing/campaigns' },
    { title: 'Cupones Canjeados', value: stats.total_coupons_used, icon: Tags, color: '#10b981', href: '/admin/marketing/coupons' },
    { title: 'Comisiones (Afiliados)', value: `$${stats.total_affiliate_commission.toFixed(2)}`, icon: Users, color: '#6366f1', href: '/admin/marketing/affiliates' },
  ];

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando métricas...</div>;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header style={{ marginBottom: '8px' }}>
        <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '8px' }}>Marketing y Conversión</h1>
        <p style={{ color: 'var(--text-muted)' }}>Métricas en tiempo real de tus estrategias de venta.</p>
      </header>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link key={i} href={card.href} style={{ textDecoration: 'none' }}>
              <div className="glass-panel hover-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: `radial-gradient(circle, ${card.color}33 0%, transparent 70%)`, filter: 'blur(15px)', zIndex: 0 }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                  <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: `1px solid ${card.color}44`, color: card.color }}>
                    <Icon size={24} />
                  </div>
                  <TrendingUp size={20} color="var(--text-muted)" opacity={0.5} />
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--foreground)' }}>{card.value}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>{card.title}</div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions */}
      <h2 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--foreground)' }}>Accesos Rápidos</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <Link href="/admin/marketing/coupons" style={{ textDecoration: 'none' }}>
          <div className="glass-panel hover-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid #10b981' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', color: 'var(--foreground)' }}>Crear Cupón</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Genera códigos de descuento personalizados o aleatorios.</p>
            </div>
            <div style={{ background: 'var(--input-bg)', padding: '10px', borderRadius: '50%' }}>
              <ArrowRight size={20} color="var(--primary)" />
            </div>
          </div>
        </Link>
        <Link href="/admin/marketing/banners" style={{ textDecoration: 'none' }}>
          <div className="glass-panel hover-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid #6366f1' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', color: 'var(--foreground)' }}>Gestionar Banners</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sube imágenes para el carrusel de la página principal.</p>
            </div>
            <div style={{ background: 'var(--input-bg)', padding: '10px', borderRadius: '50%' }}>
              <ArrowRight size={20} color="var(--primary)" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
