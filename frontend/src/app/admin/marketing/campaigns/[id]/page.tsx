'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Zap, Tags, Box, Percent, Trash2, X } from 'lucide-react';
import Link from 'next/link';

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
    if (campaignId && campaignId !== 'undefined') {
      fetchData();
    }
  }, [campaignId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [campRes, prodRes, catRes, brandRes, allProdRes] = await Promise.all([
        fetch(`http://127.0.0.1:8000/api/v1/marketing/campaigns/${campaignId}`),
        fetch(`http://127.0.0.1:8000/api/v1/marketing/campaigns/${campaignId}/products`),
        fetch('http://127.0.0.1:8000/api/v1/catalog/categories'),
        fetch('http://127.0.0.1:8000/api/v1/catalog/brands'),
        fetch('http://127.0.0.1:8000/api/v1/products/?size=1000')
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

      const res = await fetch(`http://127.0.0.1:8000/api/v1/marketing/campaigns/${campaignId}/apply-discounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        // Refresh products
        const prodRes = await fetch(`http://127.0.0.1:8000/api/v1/marketing/campaigns/${campaignId}/products`);
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
      const res = await fetch(`http://127.0.0.1:8000/api/v1/marketing/campaigns/${campaignId}/products/${productId}`, {
        method: 'DELETE'
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
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <header style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/admin/marketing/campaigns" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', margin: 0 }}>Campaña: {campaign.name}</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Activa del {new Date(campaign.start_date).toLocaleDateString()} al {new Date(campaign.end_date).toLocaleDateString()}
          </p>
        </div>
      </header>

      {/* Control Panel for Mass Discounts */}
      <div className="glass-panel" style={{ padding: '32px', border: '1px solid var(--primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ padding: '10px', background: 'var(--primary)', borderRadius: '10px', color: '#fff' }}>
            <Zap size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--foreground)' }}>Inyector de Descuentos Masivos</h2>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Aplica un porcentaje de descuento a grupos de productos. El sistema calculará el precio final y los vinculará a las fechas de esta campaña automáticamente.
            </p>
          </div>
        </div>

        <form onSubmit={handleApplyDiscount} style={{ background: 'var(--input-bg)', padding: '24px', borderRadius: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '16px', alignItems: 'flex-end', border: '1px solid var(--card-border)' }}>
          <div style={{ minWidth: 0 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Objetivo</label>
            <div style={{ position: 'relative' }}>
                <select value={targetType} onChange={e => { 
                  setTargetType(e.target.value); 
                  setTargetId(e.target.value === 'product' ? [] : ''); 
                }} style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)', appearance: 'none' }}>
                <option value="all">Todo el Catálogo</option>
                <option value="category">Por Categoría</option>
                <option value="brand">Por Marca</option>
                <option value="product">Producto Individual</option>
              </select>
              <Box size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
            </div>
          </div>

          {targetType !== 'all' ? (
            <div style={{ minWidth: 0 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Selección</label>
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
                <Tags size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '14px', pointerEvents: 'none' }} />
              </div>
            </div>
          ) : (
            <div style={{ minWidth: 0 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Selección</label>
              <input type="text" disabled value="Aplicará a todos los productos" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px dashed var(--card-border)', background: 'transparent', color: 'var(--text-muted)', textAlign: 'center' }} />
            </div>
          )}

          <div style={{ minWidth: 0 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Descuento (%)</label>
            <div style={{ position: 'relative' }}>
              <input type="number" step="0.1" min="0" max="100" required value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} placeholder="Ej. 15" style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)' }} />
              <Percent size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '12px 24px', height: '45px', display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', opacity: saving ? 0.7 : 1, whiteSpace: 'nowrap' }}>
            <Zap size={18} fill="#fff" /> {saving ? 'Aplicando...' : '¡Inyectar Descuentos!'}
          </button>
        </form>

        {targetType === 'product' && Array.isArray(targetId) && targetId.length > 0 && (
          <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Productos Seleccionados para Inyección:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {targetId.map((id: any) => {
                const prod = allProducts.find(p => p.id === id);
                if (!prod) return null;
                return (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', background: 'var(--input-bg)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--card-border)', fontSize: '0.85rem' }}>
                    <span style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prod.sku} - {prod.name}</span>
                    <button 
                      type="button" 
                      onClick={() => setTargetId(targetId.filter((tid: any) => tid !== id))} 
                      style={{ background: 'transparent', border: 'none', marginLeft: '8px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} 
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
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
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--foreground)' }}>Productos Afectados por la Campaña ({products.length})</h3>
        </div>
        
        {products.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No hay productos vinculados a esta campaña todavía.<br/>
            Usa el inyector de arriba para comenzar.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--card-border)' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Producto</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Precio Original</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Precio de Campaña</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Ahorro</th>
                <th style={{ padding: '16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const savingAmount = p.base_price - (p.discount_price || p.base_price);
                const savingPercent = Math.round((savingAmount / p.base_price) * 100);
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                    <td style={{ padding: '16px', fontWeight: 500, color: 'var(--foreground)' }}>{p.name}</td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>${p.base_price.toFixed(2)}</td>
                    <td style={{ padding: '16px', color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem' }}>${(p.discount_price || p.base_price).toFixed(2)}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>
                        -{savingPercent}% (${savingAmount.toFixed(2)})
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleRemoveProduct(p.id)} 
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} 
                        title="Quitar de la campaña" 
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'} 
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
