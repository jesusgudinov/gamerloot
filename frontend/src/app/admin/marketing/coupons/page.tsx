'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, RefreshCw, BadgePercent } from 'lucide-react';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_purchase_amount: '',
    usage_limit: '',
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/marketing/coupons');
      if (res.ok) {
        setCoupons(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code: formData.code,
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      min_purchase_amount: formData.min_purchase_amount ? parseFloat(formData.min_purchase_amount) : 0,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
      is_active: true
    };

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/marketing/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ code: '', discount_type: 'percentage', discount_value: '', min_purchase_amount: '', usage_limit: '' });
        fetchCoupons();
      } else {
        const error = await res.json();
        alert(error.detail || 'Error al crear cupón');
      }
    } catch (e) {
      alert('Error de conexión');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este cupón?')) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/marketing/coupons/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCoupons();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleActive = async (coupon: any) => {
    const previousCoupons = [...coupons];
    // Optimistic UI update
    setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c));
    
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/marketing/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !coupon.is_active })
      });
      if (!res.ok) {
        throw new Error('Failed to update');
      }
    } catch (e) {
      // Revert if failed
      setCoupons(previousCoupons);
      alert('Error al actualizar el estado del cupón');
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '8px' }}>Cupones de Descuento</h1>
          <p style={{ color: 'var(--text-muted)' }}>Crea y administra códigos promocionales para tus clientes.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={20} /> Nuevo Cupón
        </button>
      </header>

      {/* Lista de Cupones */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando cupones...</div>
        ) : coupons.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay cupones creados aún.</div>
        ) : (
          <div className="table-responsive-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--card-border)', borderBottom: '1px solid var(--card-border)' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Código</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Descuento</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Usos</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Estado</th>
                <th style={{ padding: '16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <td style={{ padding: '16px', fontWeight: 'bold', color: 'var(--primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BadgePercent size={18} /> {coupon.code}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `$${coupon.discount_value} OFF`}
                  </td>
                  <td style={{ padding: '16px' }}>
                    {coupon.times_used} / {coupon.usage_limit ? coupon.usage_limit : '∞'}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div 
                        onClick={() => handleToggleActive(coupon)}
                        style={{ 
                          width: '44px', height: '24px', borderRadius: '12px',
                          background: coupon.is_active ? '#10b981' : 'var(--card-border)',
                          position: 'relative', cursor: 'pointer', transition: '0.3s' 
                        }}
                      >
                        <div style={{ 
                          width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                          position: 'absolute', top: '3px', left: coupon.is_active ? '23px' : '3px', transition: '0.3s',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)' 
                        }} />
                      </div>
                      <span style={{ fontSize: '0.85rem', color: coupon.is_active ? '#10b981' : 'var(--text-muted)' }}>
                        {coupon.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button onClick={() => handleDelete(coupon.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Modal Nuevo Cupón */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '1.5rem', color: 'var(--foreground)' }}>Crear Nuevo Cupón</h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Código del Cupón *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)', textTransform: 'uppercase' }} placeholder="Ej. GAMERLOOT10" />
                  <button type="button" onClick={generateRandomCode} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw size={18} /> Aleatorio
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Tipo de Descuento</label>
                  <select value={formData.discount_type} onChange={e => setFormData({...formData, discount_type: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }}>
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Monto Fijo ($)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Valor *</label>
                  <input type="number" step="0.01" required value={formData.discount_value} onChange={e => setFormData({...formData, discount_value: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Compra Mínima ($)</label>
                  <input type="number" step="0.01" value={formData.min_purchase_amount} onChange={e => setFormData({...formData, min_purchase_amount: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }} placeholder="Opcional" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Límite de Usos Totales</label>
                  <input type="number" value={formData.usage_limit} onChange={e => setFormData({...formData, usage_limit: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }} placeholder="Infinito" />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Guardar Cupón</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
