"use client";
import { useState, useEffect } from 'react';
import { ShieldAlert, Search, RefreshCw, CheckCircle2, AlertCircle, Eye, Box, RotateCcw, X } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface RMAItem {
  id: number;
  order_item_id: number;
  quantity: number;
  condition: string | null;
}

interface RMA {
  id: number;
  folio: string;
  order_id: number;
  user_id: number;
  status: string;
  rma_type: string;
  customer_reason: string;
  admin_notes: string | null;
  created_at: string;
  items: RMAItem[];
}

export default function RMAPage() {
  const { token } = useAuth();
  const [rmas, setRmas] = useState<RMA[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Todos');
  
  const [selectedRma, setSelectedRma] = useState<RMA | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isRestock, setIsRestock] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({msg, type});
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchRMAs();
  }, [activeTab]);

  const fetchRMAs = async () => {
    setLoading(true);
    try {
      let url = 'http://localhost:8000/api/v1/sales/rma';
      if (activeTab !== 'Todos') {
        // Map tabs to status
        const statusMap: Record<string, string> = {
          'Pendientes': 'Pendiente',
          'En Tránsito': 'Recibido', // This could be mapping logic
          'Finalizados': 'Reembolsado'
        };
        if (statusMap[activeTab]) {
          url += `?status=${statusMap[activeTab]}`;
        }
      }
      
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        setRmas(await res.json());
      }
    } catch (error) {
      showToast('Error de red al cargar RMAs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedRma) return;
    
    try {
      const payload = {
        status,
        admin_notes: adminNotes,
        restock_to_inventory: status === 'Reembolsado' || status === 'Recibido' ? isRestock : false
      };
      
      const res = await fetch(`http://localhost:8000/api/v1/sales/rma/${selectedRma.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        showToast(`RMA actualizado a ${status}`);
        setSelectedRma(null);
        fetchRMAs();
      } else {
        showToast('Error al actualizar RMA', 'error');
      }
    } catch (error) {
      showToast('Error de red', 'error');
    }
  };

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <header className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <RotateCcw size={32} style={{ color: 'var(--primary)' }} />
            Devoluciones y Garantías (RMA)
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Gestiona las devoluciones por arrepentimiento o garantías por Hardware defectuoso sin romper tu contabilidad.
          </p>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--card-border)' }}>
        {['Todos', 'Pendientes', 'En Tránsito', 'Finalizados'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ 
              padding: '12px 24px', background: 'none', border: 'none', 
              borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent', 
              color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)', 
              fontWeight: activeTab === tab ? 600 : 400, cursor: 'pointer', fontSize: '1rem' 
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', position: 'relative' }}>
        {/* Glow de fondo para la tabla */}
        <div style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', background: 'radial-gradient(ellipse at top, rgba(168, 85, 247, 0.05), transparent 70%)', pointerEvents: 'none' }}></div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando solicitudes RMA...</div>
        ) : rmas.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--foreground)' }}>No hay solicitudes RMA en esta vista.</h3>
          </div>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="admin-table">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <th style={{ padding: '16px' }}>Folio</th>
                  <th style={{ padding: '16px' }}>Tipo</th>
                  <th style={{ padding: '16px' }}>Pedido ID</th>
                  <th style={{ padding: '16px' }}>Fecha</th>
                  <th style={{ padding: '16px' }}>Estado</th>
                  <th style={{ padding: '16px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rmas.map((rma) => (
                  <tr key={rma.id}>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--primary)' }}>{rma.folio}</td>
                    <td>
                      <span style={{ 
                        background: rma.rma_type === 'Devolución' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                        color: rma.rma_type === 'Devolución' ? '#3b82f6' : '#ef4444', 
                        padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 
                      }}>
                        {rma.rma_type}
                      </span>
                    </td>
                    <td>#{rma.order_id}</td>
                    <td>{new Date(rma.created_at).toLocaleDateString()}</td>
                    <td>
                      <span style={{
                        background: rma.status === 'Pendiente' ? 'rgba(245, 158, 11, 0.1)' : rma.status === 'Reembolsado' || rma.status === 'Recibido' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.1)',
                        color: rma.status === 'Pendiente' ? '#f59e0b' : rma.status === 'Reembolsado' || rma.status === 'Recibido' ? '#10b981' : 'var(--text-muted)',
                        padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600
                      }}>
                        {rma.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => { setSelectedRma(rma); setAdminNotes(rma.admin_notes || ''); setIsRestock(false); }}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-color)', padding: '6px 12px', fontSize: '0.85rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Eye size={16} style={{ marginRight: '6px' }}/> Revisar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer Lateral Simplificado (Modal) */}
      {selectedRma && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 999, display: 'flex', justifyContent: 'flex-end', animation: 'fadeIn 0.2s ease-out' }}>
          <div className="glass-panel" style={{ width: '450px', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', height: '100%', borderLeft: '1px solid rgba(255,255,255,0.1)', padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 30px rgba(0,0,0,0.6)', position: 'relative', borderRadius: 0 }}>
            {/* Brillo del Drawer */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '200px', background: selectedRma.rma_type === 'Devolución' ? 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.15), transparent 70%)' : 'radial-gradient(circle at top right, rgba(239, 68, 68, 0.15), transparent 70%)', pointerEvents: 'none', zIndex: 0 }}></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--foreground)' }}>Folio: <span className="text-gradient">{selectedRma.folio}</span></h2>
              <button onClick={() => setSelectedRma(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--foreground)', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18}/></button>
            </div>
            
            <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Tipo de Solicitud</p>
              <h3 style={{ margin: 0, color: selectedRma.rma_type === 'Garantía' ? '#ef4444' : '#3b82f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={20} />
                {selectedRma.rma_type}
              </h3>
              
              <div style={{ marginTop: '16px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Razón del Cliente</p>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--foreground)', fontStyle: 'italic' }}>
                  "{selectedRma.customer_reason}"
                </div>
              </div>
            </div>

            <h4 style={{ color: 'var(--foreground)', marginBottom: '12px', position: 'relative', zIndex: 1 }}>Artículos Involucrados ({selectedRma.items.length})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
              {selectedRma.items.map(item => (
                <div key={item.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                      <Box size={16} />
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Item ID: {item.order_item_id}</p>
                      <p style={{ margin: 0, color: 'var(--primary)', fontWeight: 'bold' }}>Cant: {item.quantity}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px', color: 'var(--foreground)' }}>
                      {item.condition || 'No especificada'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '24px', flex: 1, position: 'relative', zIndex: 1 }}>
              <h4 style={{ color: 'var(--foreground)', marginBottom: '8px' }}>Dictamen Técnico (Interno)</h4>
              <textarea 
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                style={{ width: '100%', height: '120px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '12px', color: 'var(--foreground)', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.9rem' }}
                placeholder="> Escribe notas sobre el dictamen físico del producto..."
              />

              {selectedRma.rma_type === 'Devolución' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px', cursor: 'pointer', background: isRestock ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: isRestock ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--card-border)', transition: 'all 0.2s ease' }}>
                  <input type="checkbox" checked={isRestock} onChange={e => setIsRestock(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#10b981' }} />
                  <div>
                    <p style={{ margin: 0, color: isRestock ? '#10b981' : 'var(--foreground)', fontWeight: 'bold', fontSize: '0.95rem' }}>Restock a Inventario Local</p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Marcar si el producto está intacto y puede volver a venderse.</p>
                  </div>
                </label>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--card-border)', position: 'relative', zIndex: 1 }}>
              {selectedRma.status === 'Pendiente' && (
                <>
                  <button onClick={() => handleUpdateStatus('Aprobado')} className="btn-primary" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none', color: 'white', padding: '14px', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)', cursor: 'pointer' }}>Aprobar Solicitud</button>
                  <button onClick={() => handleUpdateStatus('Rechazado')} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: '8px', cursor: 'pointer', padding: '14px', fontSize: '1rem', fontWeight: 600 }}>Rechazar Solicitud</button>
                </>
              )}
              {selectedRma.status === 'Aprobado' && (
                <button onClick={() => handleUpdateStatus('Recibido')} className="btn-primary" style={{ padding: '14px', background: 'linear-gradient(to right, #f59e0b, #d97706)', border: 'none', borderRadius: '8px', fontWeight: 600, color: 'white', fontSize: '1rem', boxShadow: '0 0 15px rgba(245, 158, 11, 0.3)', cursor: 'pointer' }}>
                  Registrar Producto Recibido
                </button>
              )}
              {selectedRma.status === 'Recibido' && (
                <button onClick={() => handleUpdateStatus('Reembolsado')} className="btn-primary" style={{ padding: '14px', background: 'linear-gradient(to right, #10b981, #059669)', border: 'none', borderRadius: '8px', fontWeight: 600, color: 'white', fontSize: '1rem', boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)', cursor: 'pointer' }}>
                  Emitir Reembolso y Finalizar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
