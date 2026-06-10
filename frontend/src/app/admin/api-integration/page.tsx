'use client';
import { useState, useEffect } from 'react';
import { ShoppingCart, Tags, Zap, Bot, UploadCloud } from 'lucide-react';

interface SyncState {
  status: string;
  progress: number;
  message: string;
}

export default function ApiIntegrationPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<Record<string, SyncState>>({});
  const isAnySyncRunning = Object.values(syncStatus).some(s => s.status === 'running');
  const [selectedProvider, setSelectedProvider] = useState<string>('pch');

  const fetchSyncStatus = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/sync/status`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSyncStatus(data);
      }
    } catch (error) {
      console.error("Error fetching sync status", error);
    }
  };

  useEffect(() => {
    fetchSyncStatus();
    const interval = setInterval(fetchSyncStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await fetch(`http://localhost:8000/api/v1/sync/upload/${selectedProvider}`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (res.ok) {
        e.target.value = '';
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.detail || 'Hubo un error al subir el archivo.'}`);
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión al subir el archivo.");
    } finally {
      setIsUploading(false);
    }
  };

  const triggerSync = async (endpoint: string) => {
    try {
      await fetch(`http://localhost:8000/api/v1/sync/trigger/${endpoint}`, { method: 'POST', credentials: 'include' });
    } catch (error) {
      alert("Error de conexión con el backend.");
    }
  };

  const activeSyncEntry = Object.entries(syncStatus).find(([_, s]) => s.status === 'running');
  const activeSyncTask = activeSyncEntry ? activeSyncEntry[0] : null;
  const activeSyncData = activeSyncEntry ? activeSyncEntry[1] : null;

  return (
    <div style={{ width: '100%', paddingRight: '20px', minHeight: '100vh', position: 'relative' }}>
      
      {/* Decorative Background Orbs */}
      <div style={{ position: 'absolute', top: '10%', right: '10%', width: '300px', height: '300px', background: 'rgba(139, 92, 246, 0.15)', filter: 'blur(100px)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '20%', left: '5%', width: '400px', height: '400px', background: 'rgba(16, 185, 129, 0.1)', filter: 'blur(120px)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 8px 0', background: 'linear-gradient(to right, #fff, #a78bfa)', WebkitBackgroundClip: 'text', color: 'transparent', letterSpacing: '-1px' }}>
              API e Integración
            </h1>
            <p style={{ color: '#a1a1aa', margin: 0, fontSize: '1rem', letterSpacing: '0.5px' }}>
              Command Center: Sincroniza tus catálogos, taxonomías y sube listas de precios.
            </p>
          </div>
        </header>

        <div className="glass-panel" style={{ 
          padding: '30px', marginBottom: '30px', borderRadius: '24px',
          background: 'rgba(15, 15, 20, 0.5)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(139, 92, 246, 0.2)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 20px 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Zap size={24} color="#8b5cf6" /> Sincronización Automática (API)
          </h2>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <button onClick={() => triggerSync('woocommerce')} disabled={isAnySyncRunning} className="gamer-btn" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(79,70,229,0.2))', border: '1px solid rgba(99,102,241,0.5)', boxShadow: '0 0 20px rgba(99,102,241,0.2)' }}>
              <ShoppingCart size={20} color="#818cf8" />
              <span>Sincronizar WooCommerce</span>
            </button>
            <button onClick={() => triggerSync('woocommerce-taxonomy')} disabled={isAnySyncRunning} className="gamer-btn" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(124,58,237,0.2))', border: '1px solid rgba(139,92,246,0.5)', boxShadow: '0 0 20px rgba(139,92,246,0.2)' }}>
              <Tags size={20} color="#a78bfa" />
              <span>Descargar Taxonomías WC</span>
            </button>
            <button onClick={() => triggerSync('quantum')} disabled={isAnySyncRunning} className="gamer-btn" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.2))', border: '1px solid rgba(16,185,129,0.5)', boxShadow: '0 0 20px rgba(16,185,129,0.2)' }}>
              <Zap size={20} color="#34d399" />
              <span>API Quantum Imports</span>
            </button>
            <button onClick={() => triggerSync('techsmart')} disabled={isAnySyncRunning} className="gamer-btn" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.2))', border: '1px solid rgba(245,158,11,0.5)', boxShadow: '0 0 20px rgba(245,158,11,0.2)' }}>
              <Bot size={20} color="#fbbf24" />
              <span>Scraper TechSmart</span>
            </button>
          </div>
        </div>

        <div className="glass-panel" style={{ 
          padding: '30px', marginBottom: '30px', borderRadius: '24px',
          background: 'rgba(15, 15, 20, 0.5)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(16, 185, 129, 0.2)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 20px 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UploadCloud size={24} color="#10b981" /> Sincronización Manual (Excel/CSV)
          </h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', maxWidth: '600px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', color: '#a1a1aa' }}>
                Proveedor Destino
              </label>
              <div style={{ position: 'relative' }}>
                <select 
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  disabled={isAnySyncRunning}
                  style={{
                    background: 'rgba(15, 15, 20, 0.8)', color: '#fff', border: '1px solid rgba(16,185,129,0.3)', 
                    padding: '14px 16px', borderRadius: '12px', outline: 'none', width: '100%', fontSize: '1rem',
                    appearance: 'none', cursor: 'pointer', transition: 'border-color 0.3s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(16,185,129,0.3)'}
                >
                  <option value="pch">PCH Mayoreo</option>
                  <option value="importacion_digital">Importación Digital</option>
                  <option value="cva">Grupo CVA</option>
                </select>
                <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#10b981' }}>▼</div>
              </div>
            </div>
            
            <div>
              <label style={{ 
                cursor: isAnySyncRunning ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg, #10b981, #059669)', 
                padding: '14px 24px', borderRadius: '12px', color: '#fff', fontWeight: 700, fontSize: '1rem',
                display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 0 20px rgba(16,185,129,0.4)',
                opacity: isAnySyncRunning ? 0.5 : 1, transition: 'all 0.3s', margin: 0
              }}
              onMouseOver={(e) => { if(!isAnySyncRunning && !isUploading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(16,185,129,0.6)'; } }}
              onMouseOut={(e) => { if(!isAnySyncRunning && !isUploading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(16,185,129,0.4)'; } }}
              >
                <UploadCloud size={20} />
                {isUploading ? 'Subiendo Datos...' : 'Subir Archivo'}
                <input type="file" accept=".csv, .xlsx, .xls" style={{ display: 'none' }} onChange={handleFileUpload} disabled={isAnySyncRunning || isUploading} />
              </label>
            </div>
          </div>
        </div>

        {activeSyncData && (
          <div className="glass-panel" style={{ 
            border: '1px solid #8b5cf6', borderRadius: '24px', padding: '30px', 
            background: 'rgba(139, 92, 246, 0.05)', backdropFilter: 'blur(20px)',
            boxShadow: '0 0 30px rgba(139, 92, 246, 0.2)', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.1), transparent)', animation: 'shimmer 2s infinite linear' }} />
            
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '15px' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700, marginBottom: '5px' }}>Proceso Activo</div>
                <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#fff', textTransform: 'capitalize' }}>{activeSyncTask}</h3>
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#10b981', textShadow: '0 0 20px rgba(16,185,129,0.5)' }}>
                {activeSyncData.progress}%
              </div>
            </div>

            <div style={{ position: 'relative', zIndex: 1, width: '100%', background: 'rgba(0,0,0,0.5)', height: '16px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ width: `${activeSyncData.progress}%`, height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #34d399)', boxShadow: '0 0 10px rgba(52, 211, 153, 0.8)', transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
            </div>
            
            <p style={{ position: 'relative', zIndex: 1, color: '#a1a1aa', margin: '15px 0 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981', animation: 'pulse 1.5s infinite' }}></span>
              {activeSyncData.message}
            </p>
          </div>
        )}

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .gamer-btn {
          padding: 16px 24px;
          border-radius: 16px;
          color: #fff;
          font-size: 1rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .gamer-btn:hover:not(:disabled) {
          transform: translateY(-3px);
          filter: brightness(1.2);
        }
        .gamer-btn:disabled {
          cursor: not-allowed;
          opacity: 0.5;
          filter: grayscale(1);
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
      `}} />
    </div>
  );
}
