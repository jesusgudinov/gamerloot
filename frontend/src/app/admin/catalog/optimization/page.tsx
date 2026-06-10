'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Wand2, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function OptimizationModule() {
  const { token } = useAuth();
  
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [status, setStatus] = useState<string>('idle'); // idle, scanning, progress, completed, error
  const [progress, setProgress] = useState(0); // 0 to 100
  const [stats, setStats] = useState({ current: 0, total: 0, optimized: 0 });
  const [logs, setLogs] = useState<string[]>([]);
  
  const startOptimization = async () => {
    setIsOptimizing(true);
    setStatus('scanning');
    setProgress(0);
    setStats({ current: 0, total: 0, optimized: 0 });
    setLogs(prev => ['Iniciando conexión con el motor de optimización...', ...prev]);
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/catalog/optimize-images/stream', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok || !response.body) {
        throw new Error("Error de conexión al iniciar el stream");
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            try {
              const data = JSON.parse(dataStr);
              
              if (data.status === 'scanning') {
                 setStatus('scanning');
                 setStats({ current: 0, total: data.total_products, optimized: 0 });
                 setLogs(prev => [`Escaneo inicial: ${data.total_products} productos en el catálogo.`, ...prev]);
              } else if (data.status === 'progress') {
                 setStatus('progress');
                 const p = data.total_products > 0 ? Math.round((data.current_product / data.total_products) * 100) : 100;
                 setProgress(p);
                 setStats({ current: data.current_product, total: data.total_products, optimized: data.optimized_images });
              } else if (data.status === 'completed') {
                 setStatus('completed');
                 setProgress(100);
                 setStats(prev => ({ ...prev, optimized: data.optimized_images }));
                 setLogs(prev => [`✅ Optimización finalizada con éxito. ${data.optimized_images} imágenes procesadas y convertidas.`, ...prev]);
                 setIsOptimizing(false);
              }
            } catch (e) {
              console.error("Error parsing SSE JSON", e);
            }
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setLogs(prev => [`❌ Error crítico: ${err.message}`, ...prev]);
      setIsOptimizing(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      <header className="animate-fade-in-up" style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Wand2 size={32} className="text-primary" />
          <span className="text-gradient">Motor de Optimización</span>
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Convierte imágenes masivamente a WEBP 1000x1000 con detección inteligente de fondos transparentes o sólidos para acelerar tu sitio al máximo.</p>
      </header>

      <div className="glass-panel animate-fade-in-up delay-100" style={{ padding: '30px', borderRadius: '16px', border: '1px solid var(--card-border)', position: 'relative', overflow: 'hidden' }}>
        {isOptimizing && <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 }}></div>}
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '30px' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: 'var(--foreground)' }}>Estado del Proceso</h3>
              
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <div style={{ padding: '15px 20px', background: 'var(--input-bg)', borderRadius: '12px', border: '1px solid var(--input-border)', flex: '1 1 120px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Progreso</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: status === 'completed' ? '#10b981' : 'var(--primary)' }}>{progress}%</div>
                </div>
                <div style={{ padding: '15px 20px', background: 'var(--input-bg)', borderRadius: '12px', border: '1px solid var(--input-border)', flex: '1 1 120px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Convertidas</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--foreground)' }}>{stats.optimized}</div>
                </div>
                <div style={{ padding: '15px 20px', background: 'var(--input-bg)', borderRadius: '12px', border: '1px solid var(--input-border)', flex: '1 1 120px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Escaneados</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--foreground)' }}>{stats.current} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {stats.total}</span></div>
                </div>
              </div>

              {/* Barra de Progreso */}
              <div style={{ width: '100%', height: '12px', background: 'var(--input-bg)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--input-border)' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${progress}%`, 
                  background: status === 'completed' ? '#10b981' : 'linear-gradient(90deg, #8b5cf6, #10b981)',
                  transition: 'width 0.5s ease-in-out',
                  position: 'relative'
                }}>
                  {isOptimizing && (
                    <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)', animation: 'shimmer 2s infinite', transform: 'skewX(-20deg)' }}></div>
                  )}
                </div>
              </div>
              <style dangerouslySetInnerHTML={{__html: `@keyframes shimmer { 0% { transform: translateX(-100%) skewX(-20deg); } 100% { transform: translateX(200%) skewX(-20deg); } }`}}></style>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
            {status === 'idle' || status === 'error' || status === 'completed' ? (
              <button 
                onClick={startOptimization}
                className="btn-primary hover-card"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '14px 32px', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', border: 'none', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', width: '100%', justifyContent: 'center', transition: 'all 0.3s ease' }}
              >
                <Wand2 size={24} /> {status === 'completed' ? 'Ejecutar de Nuevo' : 'Iniciar Optimización Masiva'}
              </button>
            ) : (
              <button 
                disabled
                style={{ background: 'var(--input-bg)', color: 'var(--text-muted)', padding: '14px 32px', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', border: '1px solid var(--input-border)', display: 'flex', alignItems: 'center', gap: '10px', width: '100%', justifyContent: 'center', opacity: 0.8, cursor: 'not-allowed' }}
              >
                <Loader2 size={24} className="animate-spin" /> Procesando el catálogo... ({progress}%)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Terminal Mini (Logs) */}
      <div className="glass-panel animate-fade-in-up delay-200" style={{ marginTop: '20px', padding: '20px', borderRadius: '16px', border: '1px solid var(--card-border)', background: 'rgba(0,0,0,0.3)' }}>
        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}><ImageIcon size={16} /> Activity Log</h4>
        <div style={{ height: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: 'monospace', fontSize: '0.85rem' }}>
          {logs.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Esperando inicio...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ color: log.includes('✅') ? '#10b981' : log.includes('❌') ? '#ef4444' : '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                <span style={{ opacity: 0.5, marginRight: '8px' }}>{new Date().toLocaleTimeString()}</span> {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
