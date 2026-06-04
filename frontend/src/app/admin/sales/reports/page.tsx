'use client';

import { useState, useEffect, useRef } from 'react';
import { Download, TrendingUp, Package, Calendar } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function SalesReportsPage() {
  const [salesStats, setSalesStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSalesStats();
  }, []);

  const fetchSalesStats = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/sales/stats');
      if (res.ok) {
        const data = await res.json();
        setSalesStats(data);
      }
    } catch (e) {
      console.error("Error fetching stats:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    
    // Preparar UI para impresión (quitar estilos darkmode y fijar fondo blanco)
    const originalBackground = reportRef.current.style.background;
    reportRef.current.style.background = '#ffffff';
    reportRef.current.style.color = '#000000';
    
    // Ocultar botones de la foto
    const headerElement = reportRef.current.querySelector('#report-header') as HTMLElement;
    if (headerElement) headerElement.style.display = 'none';

    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('Reporte_Ventas_Loot.pdf');
    } catch (err) {
      console.error(err);
      alert("Error al generar PDF");
    } finally {
      // Restaurar UI
      reportRef.current.style.background = originalBackground;
      reportRef.current.style.color = '';
      if (headerElement) headerElement.style.display = 'flex';
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--primary)' }}>Cargando inteligencia de ventas...</div>;
  }

  // Preparamos datos para el gráfico de barras (comparativa estados)
  const orderStatusData = [
    { name: 'Pendientes', cantidad: salesStats?.pending_orders || 0, fill: '#f59e0b' },
    { name: 'Enviados', cantidad: salesStats?.shipped_orders || 0, fill: '#10b981' }
  ];

  return (
    <div style={{ width: '100%', padding: '20px' }}>
      
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="text-gradient" style={{ margin: '0 0 8px 0' }}>Reportes y Tendencias</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Análisis gerencial de ventas y desempeño comercial.</p>
        </div>
        <button onClick={handleExportPDF} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={18} /> Exportar Reporte a PDF
        </button>
      </header>

      {/* Contenedor que será exportado a PDF */}
      <div ref={reportRef} style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '32px', border: '1px solid var(--card-border)' }}>
        
        {/* Cabecera del reporte solo visible en PDF o como titulo interior */}
        <div id="report-header" style={{ display: 'none', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '2px solid #eee', paddingBottom: '16px' }}>
          <h2 style={{ color: '#000', margin: 0 }}>Reporte Gerencial de Ventas</h2>
          <div style={{ textAlign: 'right', color: '#666' }}>
            <div>Gamer Loot Inc.</div>
            <div>Fecha: {new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {/* KPIs Resumen */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
          <div style={{ padding: '24px', background: 'rgba(106, 17, 203, 0.05)', borderRadius: '12px', border: '1px solid rgba(106, 17, 203, 0.2)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={16} /> Ingresos Totales
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
              ${salesStats?.total_revenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ padding: '24px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Package size={16} /> Pedidos Totales
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
              {salesStats?.total_orders}
            </div>
          </div>
          <div style={{ padding: '24px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={16} /> Periodo Analizado
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#f59e0b', marginTop: '8px' }}>
              Todo el Histórico
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
          
          {/* Tendencia de Ingresos */}
          <div>
            <h3 style={{ marginBottom: '20px', color: 'var(--text-color)' }}>Tendencia de Ingresos</h3>
            <div style={{ width: '100%', height: '350px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesStats?.chart_data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--primary)', borderRadius: '8px', color: 'var(--text-color)' }}
                    itemStyle={{ color: 'var(--primary)', fontWeight: 'bold' }}
                    formatter={(value: any) => `$${Number(value).toLocaleString()}`}
                  />
                  <Area type="monotone" dataKey="total" stroke="var(--primary)" fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Estado de Pedidos */}
          <div>
            <h3 style={{ marginBottom: '20px', color: 'var(--text-color)' }}>Volumen por Estatus</h3>
            <div style={{ width: '100%', height: '350px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderStatusData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-color)' }}
                    itemStyle={{ color: 'var(--primary)', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="cantidad" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
