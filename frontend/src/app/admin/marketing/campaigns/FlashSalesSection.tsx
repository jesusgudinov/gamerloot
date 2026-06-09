'use client';

import { useState, useEffect, useRef } from 'react';
import { Zap, Plus, Trash2, CalendarDays, Box } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const SearchableSelect = ({ options, value, onChange, placeholder = "Seleccionar..." }: any) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleSelect = (optValue: any) => {
    onChange(optValue);
    setIsOpen(false);
    setSearch('');
  };

  const getDisplayText = () => {
    const selectedOption = options.find((opt: any) => opt.value == value);
    return selectedOption ? selectedOption.label : <span style={{ opacity: 0.7 }}>{placeholder}</span>;
  };

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt: any) => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: '100%', padding: '12px', borderRadius: '8px', 
          border: '1px solid var(--card-border)', background: 'var(--bg-color)', 
          color: 'var(--text-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', minHeight: '46px', overflow: 'hidden'
        }}
      >
        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
          {getDisplayText()}
        </div>
      </div>
      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', zIndex: 100, maxHeight: '300px', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}>
          <div style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <input 
              type="text" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Buscar producto..." 
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)', outline: 'none' }}
              autoFocus
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '16px', color: 'var(--text-muted)', textAlign: 'center' }}>No se encontraron resultados</div>
            ) : (
              filteredOptions.map((opt: any) => {
                const isSelected = opt.value == value;
                return (
                  <div 
                    key={opt.value} 
                    onClick={() => handleSelect(opt.value)}
                    style={{ 
                      padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.02)', 
                      transition: 'background 0.2s', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      background: isSelected ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                      color: isSelected ? '#8b5cf6' : 'var(--text-color)'
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                  >
                    {opt.label}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function FlashSalesSection() {
  const { token } = useAuth();
  const [flashSales, setFlashSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    product_id: '',
    discount_price: '',
    stock_limit: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    if (token) {
      fetchFlashSales();
      fetchProducts();
    }
  }, [token]);

  const fetchFlashSales = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/marketing/flash-sales', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setFlashSales(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/products/?size=1000&status=PUBLISHED', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.items || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_id) return alert('Selecciona un producto');
    setSaving(true);
    const payload = {
      product_id: parseInt(formData.product_id),
      discount_price: parseFloat(formData.discount_price),
      stock_limit: formData.stock_limit ? parseInt(formData.stock_limit) : null,
      start_date: new Date(formData.start_date).toISOString(),
      end_date: new Date(formData.end_date).toISOString(),
      is_active: true
    };

    try {
      const res = await fetch('http://localhost:8000/api/v1/marketing/flash-sales', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ product_id: '', discount_price: '', stock_limit: '', start_date: '', end_date: '' });
        fetchFlashSales();
      } else {
        const err = await res.json();
        alert(err.detail || 'Error al crear la oferta relámpago');
      }
    } catch (e) {
      alert('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta oferta relámpago?')) return;
    try {
      const res = await fetch(`http://localhost:8000/api/v1/marketing/flash-sales/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchFlashSales();
    } catch (e) {
      console.error(e);
    }
  };

  const productOptions = products.map(p => ({ value: p.id, label: `${p.sku} - ${p.name}` }));

  return (
    <>
      <div className="glass-panel" style={{ marginTop: '40px', padding: '32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '16px', borderRadius: '16px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: '#fff', boxShadow: '0 10px 25px -5px rgba(139, 92, 246, 0.5)' }}>
              <Zap size={28} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#fff', fontWeight: 700, letterSpacing: '-0.5px' }}>Ofertas Relámpago (Flash Sales)</h2>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>Ancla cuentas regresivas a productos individuales con límite de tiempo y/o stock.</p>
            </div>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none', padding: '12px 24px', fontSize: '1rem', fontWeight: 600 }}>
            <Plus size={18} /> Nueva Oferta
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando ofertas...</div>
        ) : flashSales.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.05)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#8b5cf6' }}>
              <Zap size={32} />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', margin: 0 }}>No hay ofertas relámpago activas.</p>
          </div>
        ) : (
          <div className="table-responsive-wrapper" style={{ position: 'relative', zIndex: 1 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Producto (ID)</th>
                  <th>Precio Oferta</th>
                  <th>Límite de Stock</th>
                  <th>Vigencia</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {flashSales.map((fs) => {
                  const prod = products.find(p => p.id === fs.product_id);
                  return (
                    <tr key={fs.id}>
                      <td style={{ fontWeight: 500, color: '#fff' }}>
                        {prod ? prod.name : `Producto #${fs.product_id}`}
                      </td>
                      <td style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem' }}>${fs.discount_price.toFixed(2)}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{fs.stock_limit ? `${fs.stock_limit} piezas` : 'Sin límite'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                          <CalendarDays size={14} color="#8b5cf6" />
                          {new Date(fs.start_date).toLocaleDateString()} - {new Date(fs.end_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600,
                          background: fs.is_active ? 'rgba(139, 92, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                          color: fs.is_active ? '#8b5cf6' : '#ef4444',
                          border: `1px solid ${fs.is_active ? 'rgba(139, 92, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                        }}>
                          {fs.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button onClick={() => handleDelete(fs.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px' }} title="Eliminar">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '550px', padding: '32px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)', filter: 'blur(20px)', zIndex: 0 }}></div>
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 className="text-gradient" style={{ margin: 0, fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Zap size={28} color="#8b5cf6" />
                  Nueva Oferta Relámpago
                </h3>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 600, color: '#cbd5e1' }}>
                    <Box size={16} color="#8b5cf6" /> Producto
                  </label>
                  <SearchableSelect 
                    options={productOptions}
                    value={formData.product_id}
                    onChange={(v: any) => setFormData({...formData, product_id: v})}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 600, color: '#cbd5e1' }}>Precio de Oferta ($)</label>
                    <input type="number" step="0.01" min="0" required value={formData.discount_price} onChange={e => setFormData({...formData, discount_price: e.target.value})} className="form-input" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 600, color: '#cbd5e1' }}>Límite de Stock (Opcional)</label>
                    <input type="number" min="1" value={formData.stock_limit} onChange={e => setFormData({...formData, stock_limit: e.target.value})} placeholder="Ej. 50 piezas" className="form-input" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 600, color: '#cbd5e1' }}>Inicio</label>
                    <input type="datetime-local" required value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} className="form-input" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)', colorScheme: 'dark' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 600, color: '#cbd5e1' }}>Fin</label>
                    <input type="datetime-local" required value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} className="form-input" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)', colorScheme: 'dark' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '14px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontWeight: 600 }}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1, padding: '14px', borderRadius: '8px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none', fontWeight: 600, fontSize: '1rem' }}>
                    {saving ? 'Guardando...' : 'Activar Oferta'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
