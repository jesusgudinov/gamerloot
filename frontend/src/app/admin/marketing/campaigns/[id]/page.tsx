'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Zap, Tags, Box, Percent, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const SearchableSelect = ({ options, value, onChange, placeholder = "Seleccionar...", multiple = false }: any) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleSelect = (optValue: any) => {
    if (multiple) {
      let newValue = Array.isArray(value) ? [...value] : [];
      if (newValue.includes(optValue)) {
        newValue = newValue.filter(v => v !== optValue);
      } else {
        newValue.push(optValue);
      }
      onChange(newValue);
    } else {
      onChange(optValue);
      setIsOpen(false);
      setSearch('');
    }
  };

  const getDisplayText = () => {
    if (multiple) {
      const selectedArr = Array.isArray(value) ? value : [];
      if (selectedArr.length === 0) return <span style={{ opacity: 0.7 }}>{placeholder}</span>;
      if (selectedArr.length === 1) {
        const opt = options.find((o: any) => o.value == selectedArr[0]);
        return opt ? opt.label : `${selectedArr.length} seleccionado`;
      }
      return `${selectedArr.length} productos seleccionados`;
    } else {
      const selectedOption = options.find((opt: any) => opt.value == value);
      return selectedOption ? selectedOption.label : <span style={{ opacity: 0.7 }}>{placeholder}</span>;
    }
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

  const selectedOption = options.find((opt: any) => opt.value == value);

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', 
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
              placeholder="Buscar..." 
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)', outline: 'none' }}
              autoFocus
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '16px', color: 'var(--text-muted)', textAlign: 'center' }}>No se encontraron resultados</div>
            ) : (
              filteredOptions.map((opt: any) => {
                const isSelected = multiple ? Array.isArray(value) && value.includes(opt.value) : opt.value == value;
                return (
                  <div 
                    key={opt.value} 
                    onClick={() => handleSelect(opt.value)}
                    style={{ 
                      padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.02)', 
                      transition: 'background 0.2s', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      background: isSelected ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                      color: isSelected ? '#10b981' : 'var(--text-color)'
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                    title={opt.label}
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

export default function CampaignEditorPage() {
  const { token } = useAuth();
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  
  const [campaign, setCampaign] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Rule State
  const [targetType, setTargetType] = useState('all');
  const [targetId, setTargetId] = useState<any>('');
  const [discountPercent, setDiscountPercent] = useState('');

  useEffect(() => {
    if (campaignId && campaignId !== 'undefined' && token) {
      fetchData();
    }
  }, [campaignId, token]);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const [campRes, prodRes, catRes, brandRes, allProdRes] = await Promise.all([
        fetch(`http://localhost:8000/api/v1/marketing/campaigns/${campaignId}`, { headers }),
        fetch(`http://localhost:8000/api/v1/marketing/campaigns/${campaignId}/products`, { headers }),
        fetch('http://localhost:8000/api/v1/catalog/categories', { headers }),
        fetch('http://localhost:8000/api/v1/catalog/brands', { headers }),
        fetch('http://localhost:8000/api/v1/products/?size=1000&status=PUBLISHED', { headers })
      ]);
      
      if (campRes.ok) setCampaign(await campRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (brandRes.ok) setBrands(await brandRes.json());
      if (allProdRes.ok) {
        const prodData = await allProdRes.json();
        setAllProducts(prodData.items || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountPercent || parseFloat(discountPercent) <= 0 || parseFloat(discountPercent) > 100) {
      alert('Por favor ingresa un porcentaje válido (1-100)');
      return;
    }
    if (targetType !== 'all' && !targetId) {
      alert('Por favor selecciona una categoría o marca');
      return;
    }

    if (!confirm('¿Estás seguro? Esto sobrescribirá el precio de descuento de todos los productos afectados.')) return;

    setSaving(true);
    try {
      const payload: any = {
        target_type: targetType,
        discount_percentage: parseFloat(discountPercent)
      };

      if (targetType === 'all') {
        payload.target_id = null;
      } else if (targetType === 'product' && Array.isArray(targetId)) {
        payload.target_ids = targetId.map((id: any) => parseInt(id));
      } else {
        payload.target_id = parseInt(targetId);
      }

      const res = await fetch(`http://localhost:8000/api/v1/marketing/campaigns/${campaignId}/apply-discounts`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        // Refresh products
        const prodRes = await fetch(`http://localhost:8000/api/v1/marketing/campaigns/${campaignId}/products`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (prodRes.ok) setProducts(await prodRes.json());
      } else {
        alert('Error al aplicar descuentos');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveProduct = async (productId: number) => {
    if (!confirm('¿Estás seguro de quitar el descuento de esta campaña para este producto?')) return;
    try {
      const res = await fetch(`http://localhost:8000/api/v1/marketing/campaigns/${campaignId}/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setProducts(products.filter(p => p.id !== productId));
      } else {
        alert('Error al remover el producto');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando editor de campaña...</div>;
  if (!campaign) return <div style={{ padding: '40px', textAlign: 'center' }}>Campaña no encontrada.</div>;

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.5s ease-out' }}>
      
      <header style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Link href="/admin/marketing/campaigns" style={{ 
            color: 'var(--text-muted)', 
            background: 'rgba(255,255,255,0.03)', 
            padding: '12px', 
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', margin: 0, fontWeight: 800, letterSpacing: '-0.5px' }}>{campaign.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <span style={{ padding: '4px 10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              Activa
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {new Date(campaign.start_date).toLocaleDateString()} — {new Date(campaign.end_date).toLocaleDateString()}
            </span>
          </div>
        </div>
      </header>

      {/* Control Panel for Mass Discounts */}
      <div className="glass-panel" style={{ 
          padding: '40px', 
          border: '1px solid rgba(139, 92, 246, 0.3)', 
          background: 'linear-gradient(180deg, rgba(15,23,42,0.8) 0%, rgba(15,23,42,0.95) 100%)',
          boxShadow: '0 0 40px rgba(139, 92, 246, 0.05) inset',
          position: 'relative'
        }}>
        
        {/* Glow effect with its own overflow hidden wrapper */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
          <div style={{ 
              padding: '16px', 
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', 
              borderRadius: '16px', 
              color: '#fff',
              boxShadow: '0 10px 25px -5px rgba(139, 92, 246, 0.5)'
            }}>
            <Zap size={32} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#fff', fontWeight: 700, letterSpacing: '-0.5px' }}>Inyector de Descuentos</h2>
            <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.5, maxWidth: '800px' }}>
              Selecciona el objetivo y aplica un porcentaje de descuento masivo. El motor recalculará los precios y los inyectará en tiempo real para el rango de fechas establecido.
            </p>
          </div>
        </div>

        <form onSubmit={handleApplyDiscount} style={{ 
            background: 'rgba(0,0,0,0.2)', 
            padding: '32px', 
            borderRadius: '20px', 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr auto', 
            gap: '24px', 
            alignItems: 'flex-end', 
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.2)',
            position: 'relative',
            zIndex: 1
          }}>
          <div style={{ minWidth: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '0.95rem', color: '#cbd5e1', fontWeight: 600 }}>
              <Box size={16} color="#8b5cf6" /> Objetivo de Inyección
            </label>
            <div style={{ position: 'relative' }}>
                <select value={targetType} onChange={e => { 
                  setTargetType(e.target.value); 
                  setTargetId(e.target.value === 'product' ? [] : ''); 
                }} style={{ 
                  width: '100%', padding: '16px 16px 16px 20px', borderRadius: '12px', 
                  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.8)', 
                  color: '#fff', appearance: 'none', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s', cursor: 'pointer'
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#8b5cf6'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                >
                <option value="all">Todo el Catálogo</option>
                <option value="category">Por Categoría</option>
                <option value="brand">Por Marca</option>
                <option value="product">Producto Individual</option>
              </select>
            </div>
          </div>

          {targetType !== 'all' ? (
            <div style={{ minWidth: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '0.95rem', color: '#cbd5e1', fontWeight: 600 }}>
                <Tags size={16} color="#10b981" /> Selección Específica
              </label>
              <div style={{ position: 'relative', minWidth: 0 }}>
                <SearchableSelect 
                  options={
                    targetType === 'category' 
                      ? categories.map(c => ({ value: c.id, label: c.name }))
                      : targetType === 'brand'
                      ? brands.map(b => ({ value: b.id, label: b.name }))
                      : allProducts.map(p => ({ value: p.id, label: `${p.sku} - ${p.name}` }))
                  }
                  value={targetId}
                  onChange={(val: any) => setTargetId(val)}
                  placeholder="Seleccionar..."
                  multiple={targetType === 'product'}
                />
              </div>
            </div>
          ) : (
            <div style={{ minWidth: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '0.95rem', color: '#cbd5e1', fontWeight: 600 }}>
                <Tags size={16} color="#10b981" /> Selección Específica
              </label>
              <input type="text" disabled value="Aplicará a todos los productos" style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', textAlign: 'center', fontSize: '1rem' }} />
            </div>
          )}

          <div style={{ minWidth: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '0.95rem', color: '#cbd5e1', fontWeight: 600 }}>
              <Percent size={16} color="#3b82f6" /> Descuento (%)
            </label>
            <div style={{ position: 'relative' }}>
              <input type="number" step="0.1" min="0" max="100" required value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} placeholder="Ej. 15" 
                style={{ 
                  width: '100%', padding: '16px 16px 16px 20px', borderRadius: '12px', 
                  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.8)', 
                  color: '#fff', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s', fontWeight: 'bold'
                }} 
                onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary" style={{ 
              padding: '0 32px', 
              height: '54px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              background: 'linear-gradient(135deg, #10b981, #059669)', 
              border: 'none', 
              borderRadius: '12px',
              opacity: saving ? 0.7 : 1, 
              whiteSpace: 'nowrap',
              fontSize: '1.05rem',
              fontWeight: 700,
              boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.4)',
              cursor: saving ? 'wait' : 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={e => { if(!saving) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 15px 25px -5px rgba(16, 185, 129, 0.5)'; }}}
            onMouseLeave={e => { if(!saving) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(16, 185, 129, 0.4)'; }}}
            >
            {saving ? (
              <div style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            ) : (
              <Zap size={20} fill="#fff" />
            )}
            {saving ? 'Procesando...' : '¡Inyectar Ahora!'}
          </button>
        </form>

        {targetType === 'product' && Array.isArray(targetId) && targetId.length > 0 && (
          <div style={{ marginTop: '24px', padding: '20px', background: 'rgba(0,0,0,0.3)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', color: '#cbd5e1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Box size={16} color="var(--primary)" /> Productos en fila para Inyección ({targetId.length}):
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {targetId.map((id: any) => {
                const prod = allProducts.find(p => p.id === id);
                if (!prod) return null;
                return (
                  <div key={id} style={{ 
                      display: 'flex', alignItems: 'center', background: 'rgba(15,23,42,0.8)', 
                      padding: '8px 16px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.08)', 
                      fontSize: '0.9rem', color: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
                    }}>
                    <span style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span style={{ color: 'var(--text-muted)', marginRight: '6px' }}>{prod.sku}</span>
                      {prod.name}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setTargetId(targetId.filter((tid: any) => tid !== id))} 
                      style={{ 
                        background: 'rgba(239, 68, 68, 0.1)', border: 'none', marginLeft: '12px', 
                        width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer', 
                        color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                      }} 
                      onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }} 
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Affected Products Table */}
      <div className="glass-panel" style={{ overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
              <Box size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#fff', fontWeight: 700 }}>Inventario Impactado</h3>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{products.length} productos afectados por esta campaña</p>
            </div>
          </div>
        </div>
        
        {products.length === 0 ? (
          <div style={{ padding: '80px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.1)' }}>
              <Box size={40} />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', margin: 0 }}>
              No hay productos vinculados a esta campaña todavía.<br/>
              Usa el inyector de arriba para comenzar la magia.
            </p>
          </div>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '16px 24px', background: 'rgba(0,0,0,0.3)', color: '#cbd5e1', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>Producto</th>
                  <th style={{ padding: '16px 24px', background: 'rgba(0,0,0,0.3)', color: '#cbd5e1', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>Precio Original</th>
                  <th style={{ padding: '16px 24px', background: 'rgba(0,0,0,0.3)', color: '#cbd5e1', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>Precio de Campaña</th>
                  <th style={{ padding: '16px 24px', background: 'rgba(0,0,0,0.3)', color: '#cbd5e1', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>Métrica de Ahorro</th>
                  <th style={{ padding: '16px 24px', background: 'rgba(0,0,0,0.3)', color: '#cbd5e1', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'right' }}>Restaurar</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const savingAmount = p.base_price - (p.discount_price || p.base_price);
                  const savingPercent = Math.round((savingAmount / p.base_price) * 100);
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '20px 24px', fontWeight: 600, color: '#fff' }}>{p.name}</td>
                      <td style={{ padding: '20px 24px', color: 'var(--text-muted)', textDecoration: 'line-through', fontSize: '0.95rem' }}>${p.base_price.toFixed(2)}</td>
                      <td style={{ padding: '20px 24px' }}>
                        <span style={{ color: '#10b981', fontWeight: 800, fontSize: '1.2rem', textShadow: '0 0 10px rgba(16,185,129,0.3)' }}>
                          ${(p.discount_price || p.base_price).toFixed(2)}
                        </span>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', padding: '6px 12px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Zap size={14} fill="#10b981" /> -{savingPercent}%
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            (Ahorro: ${savingAmount.toFixed(2)})
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                        <button 
                          onClick={() => handleRemoveProduct(p.id)} 
                          style={{ 
                            background: 'rgba(239, 68, 68, 0.05)', 
                            border: '1px solid rgba(239, 68, 68, 0.2)', 
                            color: '#ef4444', 
                            cursor: 'pointer', 
                            padding: '10px 14px', 
                            borderRadius: '10px', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            transition: 'all 0.2s',
                            gap: '8px',
                            fontWeight: 600,
                            fontSize: '0.85rem'
                          }} 
                          title="Quitar descuento y restaurar precio original" 
                          onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }} 
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'; e.currentTarget.style.color = '#ef4444'; }}
                        >
                          <Trash2 size={16} /> Restaurar
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

    </div>
  );
}
