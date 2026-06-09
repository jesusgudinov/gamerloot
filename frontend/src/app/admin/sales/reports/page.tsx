'use client';

import { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Calendar, DollarSign, ShoppingBag, TrendingUp, Download, Activity, Filter } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444'];

export default function SalesReportsPage() {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    // Set default to last 30 days if empty
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate && token) {
      fetchReportData();
    }
  }, [startDate, endDate, token]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Append time to ensure full days are covered
      const startIso = `${startDate}T00:00:00`;
      const endIso = `${endDate}T23:59:59`;
      
      const res = await fetch(`http://localhost:8000/api/v1/sales/reports/dashboard?start_date=${startIso}&end_date=${endIso}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!startDate || !endDate) return;
    const startIso = `${startDate}T00:00:00`;
    const endIso = `${endDate}T23:59:59`;
    
    const url = `http://localhost:8000/api/v1/sales/reports/export?start_date=${startIso}&end_date=${endIso}`;
    
    try {
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `Reporte_Ventas_${startDate}_a_${endDate}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        alert("Error al exportar el CSV");
      }
    } catch (e) {
      console.error(e);
      alert("Error de red al exportar el CSV");
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ margin: '4px 0', color: entry.color, display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
              <span>{entry.name}:</span>
              <span style={{ fontWeight: 'bold' }}>
                {entry.name === 'Ingresos' || entry.name.includes('revenue') 
                  ? `$${entry.value.toLocaleString('es-MX', {minimumFractionDigits: 2})}`
                  : entry.value}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.25rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Activity size={36} style={{ color: 'var(--primary)' }} />
            Analítica y Reportes
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.05rem' }}>Métricas financieras y rendimiento de ventas de tu eCommerce.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleExportCSV} className="btn-secondary" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px', padding: '12px 20px', cursor: 'pointer' }}>
            <Download size={18} /> Exportar CSV
          </button>
        </div>
      </header>

      {/* Controladores de Fecha */}
      {/* Controladores de Fecha */}
      <div className="glass-panel" style={{ padding: '20px 28px', display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap', borderRadius: '16px', border: '1px solid rgba(139, 92, 246, 0.3)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--foreground)', fontWeight: 600 }}>
          <div style={{ padding: '8px', background: 'rgba(106, 17, 203, 0.1)', borderRadius: '10px' }}>
            <Filter size={20} color="var(--primary)" />
          </div>
          Periodo Analizado:
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <input 
            type="date" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)}
            className="form-input"
            style={{ padding: '10px 16px', borderRadius: '10px', width: '160px' }}
          />
          <span style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>hasta</span>
          <input 
            type="date" 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)}
            className="form-input"
            style={{ padding: '10px 16px', borderRadius: '10px', width: '160px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
          <button onClick={() => {
            const end = new Date(); const start = new Date(); start.setDate(end.getDate() - 7);
            setStartDate(start.toISOString().split('T')[0]); setEndDate(end.toISOString().split('T')[0]);
          }} className="btn-secondary" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-color)', padding: '8px 16px', fontSize: '0.9rem', borderRadius: '8px', cursor: 'pointer' }}>Últimos 7 días</button>
          <button onClick={() => {
            const end = new Date(); const start = new Date(); start.setDate(1);
            setStartDate(start.toISOString().split('T')[0]); setEndDate(end.toISOString().split('T')[0]);
          }} className="btn-secondary" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-color)', padding: '8px 16px', fontSize: '0.9rem', borderRadius: '8px', cursor: 'pointer' }}>Este Mes</button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--primary)' }}>Cargando analíticas...</div>
      ) : !data ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay datos disponibles para este periodo.</div>
      ) : (
        <>
          {/* Tarjetas KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div className="glass-panel hover-card" style={{ padding: '28px', borderLeft: '4px solid #10b981', position: 'relative', overflow: 'hidden', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                <div>
                  <p style={{ margin: '0 0 8px 0', color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ventas Netas</p>
                  <h3 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, color: 'var(--foreground)' }}>
                    ${data.kpis?.total_revenue?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </h3>
                </div>
                <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <DollarSign size={28} />
                </div>
              </div>
            </div>

            <div className="glass-panel hover-card" style={{ padding: '28px', borderLeft: '4px solid #3b82f6', position: 'relative', overflow: 'hidden', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                <div>
                  <p style={{ margin: '0 0 8px 0', color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total de Pedidos</p>
                  <h3 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, color: 'var(--foreground)' }}>
                    {data.kpis?.total_orders?.toLocaleString()}
                  </h3>
                </div>
                <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <ShoppingBag size={28} />
                </div>
              </div>
            </div>

            <div className="glass-panel hover-card" style={{ padding: '28px', borderLeft: '4px solid #f59e0b', position: 'relative', overflow: 'hidden', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                <div>
                  <p style={{ margin: '0 0 8px 0', color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ticket Promedio (AOV)</p>
                  <h3 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, color: 'var(--foreground)' }}>
                    ${data.kpis?.aov?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </h3>
                </div>
                <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  <TrendingUp size={28} />
                </div>
              </div>
            </div>
          </div>

          {/* Gráficas Principales */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            
            <div className="glass-panel" style={{ padding: '24px', minHeight: '400px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', background: 'radial-gradient(ellipse at top, rgba(16, 185, 129, 0.05), transparent 70%)', pointerEvents: 'none' }}></div>
              <h3 style={{ margin: '0 0 24px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--foreground)', zIndex: 1 }}>
                <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
                  <TrendingUp size={20} color="#10b981" />
                </div>
                Tendencia de Ingresos
              </h3>
              <div style={{ flex: 1, minHeight: 0, zIndex: 1 }}>
                {data.sales_over_time?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.sales_over_time} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{fill: 'var(--text-muted)', fontSize: 12}} tickMargin={10} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" stroke="rgba(255,255,255,0.3)" tick={{fill: 'var(--text-muted)', fontSize: 12}} tickFormatter={(val) => `$${val/1000}k`} axisLine={false} tickLine={false} />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                      <Line yAxisId="left" type="monotone" dataKey="revenue" name="Ingresos" stroke="url(#colorRevenue)" strokeWidth={4} dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: 'var(--card-bg)'}} activeDot={{r: 6, strokeWidth: 0, fill: '#34d399'}} />
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        </linearGradient>
                      </defs>
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Sin ventas en este periodo</div>
                )}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px', minHeight: '400px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', background: 'radial-gradient(ellipse at bottom, rgba(59, 130, 246, 0.05), transparent 70%)', pointerEvents: 'none' }}></div>
              <h3 style={{ margin: '0 0 24px 0', fontSize: '1.2rem', color: 'var(--foreground)', zIndex: 1 }}>Distribución por Estados</h3>
              <div style={{ flex: 1, minHeight: 0, zIndex: 1 }}>
                {data.sales_by_status?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.sales_by_status}
                        cx="50%"
                        cy="45%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="status"
                        stroke="var(--card-bg)"
                        strokeWidth={2}
                      >
                        {data.sales_by_status.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '0.85rem', color: 'var(--text-muted)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Sin datos</div>
                )}
              </div>
            </div>
            
          </div>

          {/* Top Productos */}
          <div className="glass-panel" style={{ padding: '32px', position: 'relative', overflow: 'hidden', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            {/* Glow de fondo para la tabla */}
            <div style={{ position: 'absolute', top: '0', right: '0', width: '50%', height: '100%', background: 'radial-gradient(ellipse at right, rgba(236, 72, 153, 0.05), transparent 70%)', pointerEvents: 'none' }}></div>
            
            <h3 style={{ margin: '0 0 24px 0', fontSize: '1.25rem', color: 'var(--foreground)' }}>Top 10 Productos Más Vendidos</h3>
            {data.top_products?.length > 0 ? (
              <div className="table-responsive-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <th style={{ width: '60px', textAlign: 'center', padding: '16px' }}>Pos</th>
                      <th style={{ padding: '16px' }}>Producto</th>
                      <th style={{ textAlign: 'center', padding: '16px' }}>Unidades Vendidas</th>
                      <th style={{ textAlign: 'right', padding: '16px' }}>Ingresos Generados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_products.map((product: any, idx: number) => (
                      <tr key={idx} style={{ background: idx < 3 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '28px', height: '28px', borderRadius: '50%',
                            background: idx === 0 ? 'linear-gradient(135deg, #fbbf24, #d97706)' : 
                                        idx === 1 ? 'linear-gradient(135deg, #9ca3af, #4b5563)' : 
                                        idx === 2 ? 'linear-gradient(135deg, #b45309, #78350f)' : 'rgba(255,255,255,0.05)',
                            color: idx < 3 ? 'white' : 'var(--text-muted)',
                            fontWeight: 'bold', fontSize: '0.85rem'
                          }}>
                            {idx + 1}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--foreground)', fontSize: '0.95rem' }}>{product.name}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '6px 16px', borderRadius: '20px', fontWeight: 'bold' }}>
                            {product.qty}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#10b981', fontSize: '1.05rem' }}>
                          ${product.revenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay productos vendidos en este periodo.</div>
            )}
          </div>
          
        </>
      )}
    </div>
  );
}
