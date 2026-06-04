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
      const res = await fetch(`http://127.0.0.1:8000/api/v1/sync/status`);
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
      const res = await fetch(`http://127.0.0.1:8000/api/v1/sync/upload/${selectedProvider}`, {
        method: 'POST',
        body: formData,
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
      await fetch(`http://127.0.0.1:8000/api/v1/sync/trigger/${endpoint}`, { method: 'POST' });
    } catch (error) {
      alert("Error de conexión con el backend.");
    }
  };

  const activeSyncEntry = Object.entries(syncStatus).find(([_, s]) => s.status === 'running');
  const activeSyncTask = activeSyncEntry ? activeSyncEntry[0] : null;
  const activeSyncData = activeSyncEntry ? activeSyncEntry[1] : null;

  return (
    <div style={{ width: '100%', paddingRight: '20px' }}>
      <header style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>API e Integración</h1>
          <p style={{ color: 'var(--text-muted)' }}>Sincroniza tus catálogos, taxonomías y sube listas de precios de tus proveedores.</p>
        </div>
      </header>

      <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--foreground)' }}>Sincronización Automática (API)</h2>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          {/* <button className="btn-primary" onClick={() => triggerSync('syscom')} disabled={isAnySyncRunning} style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', cursor: isAnySyncRunning ? 'not-allowed' : 'pointer', opacity: isAnySyncRunning ? 0.5 : 1 }}>
            <Zap size={18} />
            Catálogo Maestro Syscom
          </button> */}
          <button className="btn-primary" onClick={() => triggerSync('woocommerce')} disabled={isAnySyncRunning} style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', cursor: isAnySyncRunning ? 'not-allowed' : 'pointer', opacity: isAnySyncRunning ? 0.5 : 1 }}>
            <ShoppingCart size={18} />
            Sincronizar WooCommerce
          </button>
          <button className="btn-primary" onClick={() => triggerSync('woocommerce-taxonomy')} disabled={isAnySyncRunning} style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', cursor: isAnySyncRunning ? 'not-allowed' : 'pointer', opacity: isAnySyncRunning ? 0.5 : 1 }}>
            <Tags size={18} />
            Descargar Taxonomías WC
          </button>
          <button className="btn-success" onClick={() => triggerSync('quantum')} disabled={isAnySyncRunning} style={{ cursor: isAnySyncRunning ? 'not-allowed' : 'pointer', opacity: isAnySyncRunning ? 0.5 : 1 }}>
            <Zap size={18} />
            API Quantum Imports
          </button>
          <button className="btn-primary" onClick={() => triggerSync('techsmart')} disabled={isAnySyncRunning} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', cursor: isAnySyncRunning ? 'not-allowed' : 'pointer', opacity: isAnySyncRunning ? 0.5 : 1 }}>
            <Bot size={18} />
            Scraper TechSmart
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--foreground)' }}>Sincronización Manual (Excel/CSV)</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'var(--card-border)', padding: '12px 16px', borderRadius: '8px', maxWidth: '500px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Proveedor</label>
            <select 
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              disabled={isAnySyncRunning}
              style={{
                background: 'var(--input-bg)', 
                color: 'var(--input-text)', 
                border: '1px solid var(--input-border)', 
                padding: '10px', 
                borderRadius: '6px',
                outline: 'none',
                width: '100%'
              }}
            >
              <option value="pch">PCH</option>
              <option value="importacion_digital">Importación Digital</option>
              <option value="cva">CVA</option>
            </select>
          </div>
          
          <div style={{ alignSelf: 'flex-end' }}>
            <label className="btn-primary" style={{ cursor: isAnySyncRunning ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg, var(--accent-cyan), #0284c7)', opacity: isAnySyncRunning ? 0.5 : 1, margin: 0 }}>
              <UploadCloud size={18} />
              {isUploading ? 'Subiendo...' : 'Subir Lista'}
              <input type="file" accept=".csv, .xlsx, .xls" style={{ display: 'none' }} onChange={handleFileUpload} disabled={isAnySyncRunning || isUploading} />
            </label>
          </div>
        </div>
      </div>

      {activeSyncData && (
        <div className="glass-panel" style={{ border: '1px solid var(--primary)', borderRadius: '12px', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: 'var(--foreground)', textTransform: 'capitalize', fontSize: '1.1rem' }}>
              Migración Activa: {activeSyncTask}
            </span>
            <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.1rem' }}>{activeSyncData.progress}%</span>
          </div>
          <div style={{ width: '100%', background: 'var(--card-border)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ width: `${activeSyncData.progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--accent-cyan))', transition: 'width 0.3s ease' }}></div>
          </div>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>{activeSyncData.message}</p>
        </div>
      )}
    </div>
  );
}
