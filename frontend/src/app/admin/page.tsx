'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, Package, Users, AlertTriangle, Target, 
  PlusCircle, Megaphone, ShoppingCart, ArrowRight 
} from 'lucide-react';
import Link from 'next/link';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart 
} from 'recharts';
import SkeletonCard from '@/components/admin/SkeletonCard';
import { useAuth } from '@/context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [salesStats, setSalesStats] = useState<any>(null);
  const [productStats, setProductStats] = useState<any>(null);
  const [marketingStats, setMarketingStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllStats() {
      try {
        const [salesRes, prodRes, mktRes] = await Promise.all([
          fetch('http://localhost:8000/api/v1/sales/stats', { credentials: 'include' }).catch(() => null),
          fetch('http://localhost:8000/api/v1/products/stats', { credentials: 'include' }).catch(() => null),
          fetch('http://localhost:8000/api/v1/marketing/dashboard', { credentials: 'include' }).catch(() => null)
        ]);

        if (salesRes && salesRes.ok) setSalesStats(await salesRes.json());
        if (prodRes && prodRes.ok) setProductStats(await prodRes.json());
        if (mktRes && mktRes.ok) setMarketingStats(await mktRes.json());
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchAllStats();
  }, []);

  if (loading) {
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <header style={{ marginBottom: '10px' }}>
          <div className="skeleton skeleton-title" style={{ width: '300px' }}></div>
          <div className="skeleton skeleton-text" style={{ width: '200px' }}></div>
        </header>
        
        {/* Skeleton Quick Actions */}
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '10px' }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ minWidth: '150px', height: '48px', borderRadius: '12px' }}></div>)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          <SkeletonCard type="metric" />
          <SkeletonCard type="metric" />
          <SkeletonCard type="metric" />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          <SkeletonCard type="chart" />
        </div>
      </div>
    );
  }

  // Si no hay datos, mostramos 0 para evitar errores de render
  const rev = salesStats?.total_revenue || 0;
  const pending = salesStats?.pending_orders || 0;
  const lowStock = productStats?.low_stock || 0;
  
  // Transform real data for chart
  const realChartData = salesStats?.chart_data?.map((item: any) => {
    // Convert YYYY-MM-DD to a more readable format, e.g. "03 Jun"
    const dateObj = new Date(item.date + 'T00:00:00');
    const dayName = dateObj.toLocaleDateString('es-MX', { weekday: 'short', timeZone: 'UTC' });
    return {
      name: dayName.charAt(0).toUpperCase() + dayName.slice(1),
      ventas: item.total
    };
  }) || [];

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header & Quick Actions */}
      <header className="animate-fade-in-up" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
        <div>
          <h1 style={{ marginBottom: '8px', fontSize: '2rem' }}>
            Hola, <span className="text-gradient">{user?.full_name?.split(' ')[0] || 'Administrador'}</span> 👋
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Aquí tienes el resumen de tu negocio de hoy.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link href="/admin/catalog/products/new" style={{ textDecoration: 'none' }}>
            <button className="btn-secondary hover-card" style={{ borderRadius: '12px', background: 'var(--card-bg)' }}>
              <PlusCircle size={18} color="var(--primary)" />
              <span>Nuevo Producto</span>
            </button>
          </Link>
          <Link href="/admin/marketing/campaigns" style={{ textDecoration: 'none' }}>
            <button className="btn-secondary hover-card" style={{ borderRadius: '12px', background: 'var(--card-bg)' }}>
              <Megaphone size={18} color="var(--accent-pink)" />
              <span>Crear Campaña</span>
            </button>
          </Link>
          <Link href="/admin/sales/orders" style={{ textDecoration: 'none' }}>
            <button className="btn-primary hover-card" style={{ borderRadius: '12px' }}>
              <ShoppingCart size={18} />
              <span>Ver Pedidos</span>
            </button>
          </Link>
        </div>
      </header>
      
      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        <div className="glass-panel hover-card animate-fade-in-up delay-100" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', filter: 'blur(20px)', pointerEvents: 'none', zIndex: 0 }}></div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ padding: '10px', background: 'rgba(106, 17, 203, 0.1)', borderRadius: '12px' }}>
                <TrendingUp size={24} color="var(--primary)" />
              </div>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>Ingresos Totales</p>
            <h2 style={{ fontSize: '2rem' }}>${rev.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h2>
          </div>
        </div>
        
        <div className="glass-panel hover-card animate-fade-in-up delay-200" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%)', filter: 'blur(20px)', pointerEvents: 'none', zIndex: 0 }}></div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px' }}>
                <Package size={24} color="#f59e0b" />
              </div>
              {pending > 0 && (
                <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '4px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%', display: 'inline-block' }}></span>
                  Requiere Atención
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>Pedidos Pendientes</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              <h2 style={{ fontSize: '2rem' }}>{pending}</h2>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>/ {salesStats?.shipped_orders || 0} Enviados</span>
            </div>
          </div>
        </div>

        <div className="glass-panel hover-card animate-fade-in-up delay-300" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)', filter: 'blur(20px)', pointerEvents: 'none', zIndex: 0 }}></div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ padding: '10px', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '12px' }}>
                <Target size={24} color="var(--accent-cyan)" />
              </div>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>Catálogo Activo</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              <h2 style={{ fontSize: '2rem' }}>{productStats?.total_products || 0}</h2>
              <span style={{ color: '#10b981', fontSize: '0.9rem' }}>Productos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Chart + Action Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px', alignItems: 'start' }} className="responsive-dashboard-grid">
        
        {/* Chart Section */}
        <div className="glass-panel animate-fade-in-up delay-400" style={{ padding: '24px', overflow: 'hidden', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }}></div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>Rendimiento de Ventas</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Evolución de ingresos en tiempo real</p>
              </div>
            </div>
            
            <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={realChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--card-border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ background: 'var(--card-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--card-border)', borderRadius: '12px', color: 'var(--foreground)' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Area type="monotone" dataKey="ventas" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorVentas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          </div>
        </div>

        {/* Actionable Alerts Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade-in-up delay-500">
          
          {/* Alertas de Inventario (Actionable) */}
          <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: lowStock > 0 ? '#ef4444' : '#10b981' }}></div>
            
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', fontSize: '1.1rem' }}>
              <AlertTriangle size={20} color={lowStock > 0 ? '#ef4444' : '#10b981'} />
              Estado del Inventario
            </h3>
            
            {lowStock > 0 ? (
              <div>
                <p style={{ color: 'var(--foreground)', fontSize: '0.95rem', marginBottom: '16px', lineHeight: '1.5' }}>
                  Tienes <strong style={{ color: '#ef4444' }}>{lowStock} productos</strong> con bajo stock (menos de 3 unidades).
                </p>
                <Link href="/admin/catalog/products?filter=low_stock" style={{ textDecoration: 'none' }}>
                  <button className="btn-secondary hover-card" style={{ width: '100%', justifyContent: 'space-between', padding: '10px 16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    Reabastecer ahora <ArrowRight size={16} />
                  </button>
                </Link>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16, 185, 129, 0.1)', padding: '4px', borderRadius: '50%' }}>
                  <TrendingUp size={14} />
                </span>
                Inventario sano, sin alertas.
              </p>
            )}
          </div>

          {/* Marketing Quick Stats */}
          <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
             <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--accent-cyan)' }}></div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', fontSize: '1.1rem' }}>
              <Megaphone size={20} color="var(--accent-cyan)" />
              Impacto de Marketing
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Campañas Activas</span>
                <span style={{ fontWeight: 'bold' }}>{marketingStats?.active_campaigns || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Ventas Flash</span>
                <span style={{ fontWeight: 'bold', color: 'var(--accent-pink)' }}>{marketingStats?.active_flash_sales || 0}</span>
              </div>
            </div>
            
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
               <Link href="/admin/marketing/campaigns" style={{ textDecoration: 'none' }}>
                  <span style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    Gestionar Campañas <ArrowRight size={14} />
                  </span>
               </Link>
            </div>
          </div>
        </div>

      </div>
      
      <style jsx>{`
        @media (max-width: 1024px) {
          .responsive-dashboard-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
