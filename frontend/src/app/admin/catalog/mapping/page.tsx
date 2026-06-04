"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Network, Search, CheckCircle2, AlertCircle, Save, Plus, Trash2 } from 'lucide-react';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { useAuth } from '@/context/AuthContext';


interface UnmappedCategory {
  id: number;
  provider_name: string;
  provider_category_path: string;
  sample_product_name: string | null;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function MappingPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'dictionary'>('pending');
  const [unmapped, setUnmapped] = useState<UnmappedCategory[]>([]);
  const [activeMaps, setActiveMaps] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaps, setSelectedMaps] = useState<Record<number, number>>({});
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({msg, type});
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resUnmapped, resCats, resMaps] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/v1/mapping/unmapped', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://127.0.0.1:8000/api/v1/catalog/categories', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://127.0.0.1:8000/api/v1/mapping/maps', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const dataUnmapped = await resUnmapped.json();
      const dataCats = await resCats.json();
      const dataMaps = await resMaps.json();
      
      setUnmapped(dataUnmapped);
      setCategories(dataCats);
      setActiveMaps(dataMaps);
    } catch (error) {
      showToast('Error al cargar datos de mapeo', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMap = async (unmapped_id: number) => {
    const internal_category_id = selectedMaps[unmapped_id];
    if (!internal_category_id) {
      showToast('Selecciona una categoría primero', 'error');
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/mapping/map', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ unmapped_id, internal_category_id })
      });
      
      if (res.ok) {
        showToast('Categoría mapeada y guardada en el Diccionario.');
        setUnmapped(unmapped.filter(u => u.id !== unmapped_id));
        const newMaps = {...selectedMaps};
        delete newMaps[unmapped_id];
        setSelectedMaps(newMaps);
        // Recargar mapas activos
        const mapsRes = await fetch('http://127.0.0.1:8000/api/v1/mapping/maps', { headers: { 'Authorization': `Bearer ${token}` } });
        setActiveMaps(await mapsRes.json());
      } else {
        showToast('Error al mapear', 'error');
      }
    } catch (error) {
      showToast('Error de red', 'error');
    }
  };

  const handleIgnore = async (unmapped_id: number) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/mapping/unmapped/${unmapped_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Ignorado');
        setUnmapped(unmapped.filter(u => u.id !== unmapped_id));
      }
    } catch (error) {
      showToast('Error al ignorar', 'error');
    }
  }

  const handleDeleteMap = async (map_id: number) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/mapping/maps/${map_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Regla eliminada del diccionario');
        setActiveMaps(activeMaps.filter(m => m.id !== map_id));
      }
    } catch (error) {
      showToast('Error al eliminar regla', 'error');
    }
  };

  const catOptions = categories.map(c => ({ id: c.id, label: c.name }));

  return (
    <div style={{ width: '100%' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }
        .admin-table th, .admin-table td {
          padding: 16px;
          text-align: left;
          border-bottom: 1px solid var(--card-border);
          vertical-align: middle;
        }
        .admin-table th {
          color: var(--text-muted);
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: rgba(255, 255, 255, 0.02);
        }
        .admin-table tbody tr {
          transition: background 0.2s;
        }
        .admin-table tbody tr:hover {
          background: rgba(255, 255, 255, 0.015);
        }
      `}} />
      <header className="admin-header">
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Network size={32} style={{ color: 'var(--primary)' }} />
            Mapeador de Proveedores
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            El Diccionario de Términos. Asigna las categorías extrañas de los proveedores a nuestras categorías maestras para automatizar futuras importaciones.
          </p>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--card-border)' }}>
        <button 
          onClick={() => setActiveTab('pending')}
          style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'pending' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'pending' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: activeTab === 'pending' ? 600 : 400, cursor: 'pointer', fontSize: '1rem' }}
        >
          Pendientes ({unmapped.length})
        </button>
        <button 
          onClick={() => setActiveTab('dictionary')}
          style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'dictionary' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'dictionary' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: activeTab === 'dictionary' ? 600 : 400, cursor: 'pointer', fontSize: '1rem' }}
        >
          Diccionario Activo ({activeMaps.length})
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {activeTab === 'pending' && (
          <>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: '16px', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', margin: '0 0 4px 0', color: 'var(--foreground)' }}>Categorías Pendientes</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
                  Estas categorías fueron encontradas durante una importación reciente y detuvieron el proceso. Mapealas para continuar.
                </p>
              </div>
            </div>
            
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando categorías...</div>
            ) : unmapped.length === 0 ? (
              <div style={{ padding: '64px', textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', margin: '0 auto 16px auto' }}>
                  <CheckCircle2 size={40} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '8px' }}>¡Todo al día!</h3>
                <p style={{ color: 'var(--text-muted)' }}>No hay categorías pendientes de mapear. Tu diccionario está perfecto.</p>
              </div>
            ) : (
              <div className="table-responsive-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Proveedor</th>
                      <th>Categoría Original</th>
                      <th>Ejemplo de Producto</th>
                      <th style={{ width: '300px' }}>Mapear a Categoría Interna</th>
                      <th style={{ width: '120px', textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unmapped.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <span style={{ background: 'var(--primary-glow)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '6px', fontWeight: 600, fontSize: '0.75rem' }}>
                            {u.provider_name}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'monospace', color: 'var(--primary-light)' }}>{u.provider_category_path}</td>
                        <td style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-muted)' }} title={u.sample_product_name || ''}>
                          {u.sample_product_name || 'Sin ejemplo'}
                        </td>
                        <td style={{ position: 'relative' }}>
                          <SearchableSelect
                            options={catOptions}
                            value={selectedMaps[u.id]?.toString() || ''}
                            onChange={(val) => setSelectedMaps({...selectedMaps, [u.id]: parseInt(val.toString())})}
                            placeholder="Buscar categoría maestra..."
                          />
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button 
                              onClick={() => handleMap(u.id)}
                              style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Guardar Mapeo"
                            >
                              <Save size={18} />
                            </button>
                            <button 
                              onClick={() => handleIgnore(u.id)}
                              style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Ignorar y Descartar"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === 'dictionary' && (
          <>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: '16px', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', margin: '0 0 4px 0', color: 'var(--foreground)' }}>Diccionario de Mapeos Activos</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
                  Estas son las reglas guardadas. Si el motor de sincronización encuentra alguna de estas categorías, las asignará automáticamente.
                </p>
              </div>
            </div>
            
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando diccionario...</div>
            ) : activeMaps.length === 0 ? (
              <div style={{ padding: '64px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--foreground)' }}>No hay mapeos guardados</h3>
              </div>
            ) : (
              <div className="table-responsive-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Proveedor</th>
                      <th>Categoría Original (Entrada)</th>
                      <th>Categoría Interna (Salida)</th>
                      <th style={{ width: '120px', textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeMaps.map((m) => (
                      <tr key={m.id}>
                        <td>
                          <span style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'var(--foreground)', padding: '4px 8px', borderRadius: '6px', fontWeight: 600, fontSize: '0.75rem' }}>
                            {m.provider_name}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{m.provider_category_path}</td>
                        <td style={{ fontWeight: '500', color: 'var(--primary)' }}>
                          {m.internal_category?.name}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            onClick={() => handleDeleteMap(m.id)}
                            style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem' }}
                          >
                            <Trash2 size={14} /> Eliminar Regla
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {toast && (
        <div style={{ 
          position: 'fixed', bottom: '20px', right: '20px', 
          background: toast.type === 'success' ? '#10b981' : '#ef4444', 
          color: 'white', padding: '12px 24px', borderRadius: '8px', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, 
          display: 'flex', alignItems: 'center', gap: '8px', 
          animation: 'slideIn 0.3s ease-out' 
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
