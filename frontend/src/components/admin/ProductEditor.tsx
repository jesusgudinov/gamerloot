'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Save, X, Info, Tag, Layers, Settings, Image as ImageIcon,
  Truck, ArrowLeft, Plus, Trash2, CheckCircle2, Zap
} from 'lucide-react';
import Link from 'next/link';
import SearchableSelect from '@/components/ui/SearchableSelect';
import MultiSearchableSelect from '@/components/ui/MultiSearchableSelect';

interface ProductEditorProps {
  productId: string | 'new';
}

export default function ProductEditor({ productId }: ProductEditorProps) {
  const router = useRouter();
  const isNew = productId === 'new';
  
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // Form State
  const [formData, setFormData] = useState<any>({
    sku: '',
    upc: '',
    name: '',
    slug: '',
    short_description: '',
    description: '',
    condition: 'Nuevo',
    base_price: 0,
    discount_price: '',
    discount_start_date: '',
    discount_end_date: '',
    warranty_months: 12,
    category_id: '',
    brand_id: '',
    status: 'DRAFT',
    is_in_configurator: false,
    component_type: '',
    weight_kg: '',
    length_cm: '',
    width_cm: '',
    height_cm: '',
    meta_title: '',
    meta_description: '',
    main_image_url: '',
    image_gallery: '',
    marketing_tag_ids: [],
    attribute_value_ids: []
  });

  // Catalogs
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [marketingTags, setMarketingTags] = useState<any[]>([]);
  const [attributes, setAttributes] = useState<any[]>([]);

  // Local state for attribute builder
  const [selectedAttrId, setSelectedAttrId] = useState('');
  const [selectedAttrValId, setSelectedAttrValId] = useState('');

  useEffect(() => {
    fetchCatalogs();
    if (!isNew) {
      fetchProduct();
    }
  }, [productId]);

  const fetchCatalogs = async () => {
    try {
      const [catRes, brandRes, tagRes, attrRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/v1/catalog/categories', { credentials: 'include' }),
        fetch('http://127.0.0.1:8000/api/v1/catalog/brands', { credentials: 'include' }),
        fetch('http://127.0.0.1:8000/api/v1/catalog/marketing-tags', { credentials: 'include' }),
        fetch('http://127.0.0.1:8000/api/v1/catalog/attributes', { credentials: 'include' })
      ]);
      if (catRes.ok) setCategories(await catRes.json());
      if (brandRes.ok) setBrands(await brandRes.json());
      if (tagRes.ok) setMarketingTags(await tagRes.json());
      if (attrRes.ok) setAttributes(await attrRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProduct = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/products/id/${productId}`);
      if (res.ok) {
        const prod = await res.json();
        
        // Format dates
        const start = prod.discount_start_date ? new Date(prod.discount_start_date).toISOString().slice(0,16) : '';
        const end = prod.discount_end_date ? new Date(prod.discount_end_date).toISOString().slice(0,16) : '';
        
        setFormData({
          ...prod,
          image_gallery: (prod.image_gallery || []).join(', '),
          short_description: prod.short_description || '',
          discount_price: prod.discount_price || '',
          discount_start_date: start,
          discount_end_date: end,
          category_id: prod.category_id || '',
          brand_id: prod.brand_id || '',
          marketing_tag_ids: prod.marketing_tags_relation?.map((t: any) => t.id) || [],
          attribute_value_ids: prod.attribute_values?.map((a: any) => a.id) || [],
          weight_kg: prod.weight_kg || '',
          length_cm: prod.length_cm || '',
          width_cm: prod.width_cm || '',
          height_cm: prod.height_cm || '',
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({msg, type});
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...formData };
      
      // Clean up numbers
      if (payload.discount_price === '') payload.discount_price = null;
      if (payload.discount_start_date === '') payload.discount_start_date = null;
      else payload.discount_start_date = new Date(payload.discount_start_date).toISOString();
      
      if (payload.discount_end_date === '') payload.discount_end_date = null;
      else payload.discount_end_date = new Date(payload.discount_end_date).toISOString();

      ['weight_kg', 'length_cm', 'width_cm', 'height_cm'].forEach(k => {
        if (payload[k] === '') payload[k] = null;
        else payload[k] = parseFloat(payload[k]);
      });

      if (typeof payload.image_gallery === 'string') {
        payload.image_gallery = payload.image_gallery.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
      }

      payload.base_price = parseFloat(payload.base_price);
      if (payload.category_id === '') payload.category_id = null;
      if (payload.brand_id === '') payload.brand_id = null;

      const url = isNew 
        ? 'http://127.0.0.1:8000/api/v1/products/' 
        : `http://127.0.0.1:8000/api/v1/products/${productId}`;
        
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(`Producto ${isNew ? 'creado' : 'actualizado'} con éxito`, 'success');
        setTimeout(() => router.push(`/admin/catalog/products`), 1000);
      } else {
        const err = await res.json();
        let errorMsg = 'Error al guardar';
        if (err.detail) {
          if (typeof err.detail === 'string') errorMsg = err.detail;
          else if (Array.isArray(err.detail)) errorMsg = err.detail.map((e:any) => `${e.loc?.slice(-1)[0] || 'Campo'}: ${e.msg}`).join(', ');
        }
        showToast(errorMsg, 'error');
      }
    } catch (e) {
      showToast('Error de conexión', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addAttributeValue = () => {
    if (!selectedAttrValId) return;
    const valId = parseInt(selectedAttrValId);
    if (!formData.attribute_value_ids.includes(valId)) {
      setFormData({
        ...formData,
        attribute_value_ids: [...formData.attribute_value_ids, valId]
      });
    }
    setSelectedAttrValId('');
  };

  const removeAttributeValue = (id: number) => {
    setFormData({
      ...formData,
      attribute_value_ids: formData.attribute_value_ids.filter((v: number) => v !== id)
    });
  };

  const createAttributeValue = async (attrId: string, valueName: string) => {
    try {
      const parentAttr = attributes.find(a => a.id === parseInt(attrId));
      const parentSlug = parentAttr ? parentAttr.slug : 'attr';
      
      const baseSlug = valueName.toLowerCase().trim().replace(/[\s\W-]+/g, '-');
      const slug = `${parentSlug}-${baseSlug}`;
      
      const res = await fetch(`http://127.0.0.1:8000/api/v1/catalog/attributes/${attrId}/values`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ value: valueName, slug })
      });
      if (res.ok) {
        const newVal = await res.json();
        setAttributes(prev => prev.map(attr => {
          if (attr.id === parseInt(attrId)) {
            return {
              ...attr,
              values: [...(attr.values || []), newVal]
            };
          }
          return attr;
        }));
        showToast(`Valor "${valueName}" creado`, 'success');
        return newVal.id;
      } else {
        const err = await res.json();
        let errorMsg = 'Error al crear valor';
        if (err.detail) {
          if (typeof err.detail === 'string') errorMsg = err.detail;
          else if (Array.isArray(err.detail)) errorMsg = err.detail.map((e:any) => `${e.loc?.slice(-1)[0] || 'Campo'}: ${e.msg}`).join(', ');
        }
        showToast(errorMsg, 'error');
        return null;
      }
    } catch (e) {
      showToast('Error de conexión', 'error');
      return null;
    }
  };

  const handleCreateAttributeValue = async (valueName: string) => {
    if (!selectedAttrId) return;
    const newId = await createAttributeValue(selectedAttrId, valueName);
    if (newId) {
      setSelectedAttrValId(newId.toString());
    }
  };

  const toggleMarketingTag = (id: number) => {
    const current = formData.marketing_tag_ids;
    if (current.includes(id)) {
      setFormData({...formData, marketing_tag_ids: current.filter((t: number) => t !== id)});
    } else {
      setFormData({...formData, marketing_tag_ids: [...current, id]});
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando datos del producto...</div>;

  const tabs = [
    { id: 'general', label: 'General', icon: Info },
    { id: 'pricing', label: 'Precios', icon: Tag },
    { id: 'organization', label: 'Organización', icon: Layers },
    { id: 'specs', label: 'Specs & Config', icon: Settings },
    { id: 'media', label: 'Multimedia', icon: ImageIcon },
    { id: 'logistics', label: 'Logística y SEO', icon: Truck },
  ];

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', position: 'relative' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .premium-input {
          width: 100%;
          padding: 12px 14px;
          border-radius: 8px;
          border: 1px solid var(--card-border);
          background: rgba(255, 255, 255, 0.02);
          color: var(--text-color);
          transition: all 0.2s ease;
          outline: none;
        }
        .premium-input:focus {
          border-color: var(--primary);
          background: rgba(106, 17, 203, 0.05);
          box-shadow: 0 0 0 3px rgba(106, 17, 203, 0.1);
        }
        .form-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .toggle-checkbox {
          appearance: none;
          width: 40px;
          height: 20px;
          background: var(--toggle-bg);
          border-radius: 20px;
          position: relative;
          cursor: pointer;
          outline: none;
          border: 1px solid var(--input-border);
          transition: background 0.3s;
          flex-shrink: 0;
        }
        .toggle-checkbox::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 14px;
          height: 14px;
          background: var(--toggle-circle);
          border-radius: 50%;
          transition: transform 0.3s;
        }
        .toggle-checkbox:checked {
          background: var(--primary);
          border-color: var(--primary);
        }
        .toggle-checkbox:checked::after {
          transform: translateX(20px);
          background: #ffffff;
        }
      `}} />
      
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'absolute', top: '20px', right: '20px', zIndex: 1000,
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white', padding: '12px 24px', borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <CheckCircle2 size={18} /> {toast.msg}
        </div>
      )}

      {/* Header Sticky */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: '20px', background: 'var(--card-bg)', borderBottom: '1px solid var(--card-border)',
        borderRadius: '16px 16px 0 0', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/admin/catalog/products" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{isNew ? 'Nuevo Producto' : 'Editar Producto'}</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>{formData.name || 'Sin nombre'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/admin/catalog/products" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <X size={18} /> Cancelar
          </Link>
          <button 
            className="btn-primary" 
            onClick={handleSave}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', opacity: saving ? 0.7 : 1 }}
          >
            <Save size={18} /> {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* Main Layout: Sidebar Tabs + Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', background: 'var(--card-bg)', borderRadius: '0 0 16px 16px', border: '1px solid var(--card-border)', borderTop: 'none' }}>
        
        {/* Vertical Tabs */}
        <div style={{ 
          width: '240px', borderRight: '1px solid var(--card-border)', 
          padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '8px',
          overflowY: 'auto'
        }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 24px', background: isActive ? 'var(--card-border)' : 'transparent',
                  color: isActive ? 'var(--foreground)' : 'var(--text-muted)',
                  border: 'none', borderRight: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                  cursor: 'pointer', textAlign: 'left', fontWeight: isActive ? 600 : 400,
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={18} /> {tab.label}
              </button>
            )
          })}
        </div>

        {/* Form Content */}
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto', background: 'var(--bg-color)' }}>
          <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* --- TAB GENERAL --- */}
            {activeTab === 'general' && (
              <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h2 style={{ fontSize: '1.2rem', margin: 0, borderBottom: '1px solid var(--card-border)', paddingBottom: '12px' }}>Información General</h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Nombre del Producto *</label>
                    <input type="text" className="premium-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Slug (URL) *</label>
                    <input type="text" className="premium-input" value={formData.slug} onChange={e => {
                      const formattedSlug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '-');
                      setFormData({...formData, slug: formattedSlug});
                    }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>SKU *</label>
                    <input type="text" className="premium-input" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>UPC / Código de Barras</label>
                    <input type="text" className="premium-input" value={formData.upc} onChange={e => setFormData({...formData, upc: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Condición</label>
                    <select className="premium-input" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}>
                      <option value="Nuevo">Nuevo</option>
                      <option value="Reacondicionado">Reacondicionado</option>
                      <option value="Open Box">Open Box</option>
                      <option value="Usado">Usado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Descripción Corta</label>
                  <textarea 
                    className="premium-input"
                    rows={3} 
                    value={formData.short_description} 
                    onChange={e => setFormData({...formData, short_description: e.target.value})} 
                    placeholder="Resumen breve para destacar el producto en listados y SEO..."
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Descripción Completa</label>
                  <textarea 
                    className="premium-input"
                    rows={8} 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    placeholder="Aquí irá el editor Rich Text..."
                  />
                </div>
              </div>
            )}

            {/* --- TAB PRICING --- */}
            {activeTab === 'pricing' && (
              <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h2 style={{ fontSize: '1.2rem', margin: 0, borderBottom: '1px solid var(--card-border)', paddingBottom: '12px' }}>Precios y Ofertas</h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Precio Base (MXN) *</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '16px', top: '12px', color: 'var(--text-muted)', fontWeight: 'bold' }}>$</span>
                      <input type="number" step="0.01" className="premium-input" value={formData.base_price} onChange={e => setFormData({...formData, base_price: e.target.value})} style={{ paddingLeft: '32px' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Garantía (Meses)</label>
                    <input type="number" className="premium-input" value={formData.warranty_months} onChange={e => setFormData({...formData, warranty_months: e.target.value})} />
                  </div>
                </div>

                <div className="form-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '8px', color: '#10b981' }}>
                      <Tag size={20} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Programar Oferta / Descuento</h3>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Precio con Descuento (MXN)</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '16px', top: '12px', color: 'var(--text-muted)', fontWeight: 'bold' }}>$</span>
                      <input type="number" step="0.01" className="premium-input" value={formData.discount_price} onChange={e => setFormData({...formData, discount_price: e.target.value})} placeholder="Dejar vacío si no hay descuento" style={{ paddingLeft: '32px' }} />
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Inicio de la Oferta</label>
                      <input type="datetime-local" className="premium-input" value={formData.discount_start_date} onChange={e => setFormData({...formData, discount_start_date: e.target.value})} style={{ colorScheme: 'dark' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Fin de la Oferta</label>
                      <input type="datetime-local" className="premium-input" value={formData.discount_end_date} onChange={e => setFormData({...formData, discount_end_date: e.target.value})} style={{ colorScheme: 'dark' }} />
                    </div>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Info size={14} /> El precio de descuento se desactivará automáticamente cuando pase la fecha de fin.
                  </p>
                </div>
              </div>
            )}

            {/* --- TAB ORGANIZATION --- */}
            {activeTab === 'organization' && (
              <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h2 style={{ fontSize: '1.2rem', margin: 0, borderBottom: '1px solid var(--card-border)', paddingBottom: '12px' }}>Organización</h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Categoría</label>
                    <SearchableSelect 
                      options={categories.map(c => ({ id: c.id, label: c.name }))}
                      value={formData.category_id ? formData.category_id.toString() : ''}
                      onChange={val => setFormData({...formData, category_id: val.toString()})}
                      placeholder="Buscar categoría..."
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Marca</label>
                    <SearchableSelect 
                      options={brands.map(b => ({ id: b.id, label: b.name }))}
                      value={formData.brand_id ? formData.brand_id.toString() : ''}
                      onChange={val => setFormData({...formData, brand_id: val.toString()})}
                      placeholder="Buscar marca..."
                    />
                  </div>
                </div>

                <div className="form-card">
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 600 }}>Etiquetas de Marketing</h3>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {marketingTags.map(tag => {
                      const isSelected = formData.marketing_tag_ids.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleMarketingTag(tag.id)}
                          style={{
                            padding: '8px 16px', borderRadius: '20px', border: '1px solid',
                            borderColor: isSelected ? tag.color_hex : 'var(--card-border)',
                            background: isSelected ? `${tag.color_hex}22` : 'var(--input-bg)',
                            color: isSelected ? tag.color_hex : 'var(--text-muted)',
                            cursor: 'pointer', transition: 'all 0.2s',
                            fontWeight: isSelected ? 600 : 400,
                            display: 'flex', alignItems: 'center', gap: '6px',
                            boxShadow: isSelected ? `0 4px 12px ${tag.color_hex}44` : 'none'
                          }}
                        >
                          <Zap size={14} fill={isSelected ? tag.color_hex : 'none'} /> {tag.name}
                        </button>
                      )
                    })}
                    {marketingTags.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay etiquetas creadas.</span>}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Estado del Producto en Tienda</label>
                  <select className="premium-input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ fontWeight: 600, fontSize: '1rem' }}>
                    <option value="DRAFT">Borrador (Oculto, requiere revisión)</option>
                    <option value="PUBLISHED">Publicado (Visible en tienda)</option>
                    <option value="ARCHIVED">Archivado (Inactivo / Descontinuado)</option>
                  </select>
                </div>
              </div>
            )}

            {/* --- TAB SPECS & CONFIG --- */}
            {activeTab === 'specs' && (
              <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h2 style={{ fontSize: '1.2rem', margin: 0, borderBottom: '1px solid var(--card-border)', paddingBottom: '12px' }}>Especificaciones y Configurador</h2>
                
                <div className="form-card glass-panel" style={{ background: formData.is_in_configurator ? 'rgba(99, 102, 241, 0.05)' : 'var(--card-bg)', border: formData.is_in_configurator ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid var(--card-border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', marginBottom: formData.is_in_configurator ? '20px' : 0 }}>
                    <input type="checkbox" className="toggle-checkbox" checked={formData.is_in_configurator} onChange={e => setFormData({...formData, is_in_configurator: e.target.checked})} />
                    <div>
                      <div style={{ fontWeight: 600, color: formData.is_in_configurator ? 'var(--primary)' : 'var(--foreground)', fontSize: '1.05rem' }}>Habilitar para Configurador de PC</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Permite que este producto se pueda seleccionar al armar una computadora pieza por pieza.</div>
                    </div>
                  </label>
                  
                  {formData.is_in_configurator && (
                    <div className="animate-fade-in-up" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(99, 102, 241, 0.2)' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tipo de Componente *</label>
                      <select className="premium-input" value={formData.component_type} onChange={e => setFormData({...formData, component_type: e.target.value})} style={{ borderColor: 'rgba(99, 102, 241, 0.4)', background: 'rgba(0,0,0,0.2)' }}>
                        <option value="">Seleccionar Componente</option>
                        <option value="CPU">Procesador (CPU)</option>
                        <option value="MOTHERBOARD">Tarjeta Madre</option>
                        <option value="RAM">Memoria RAM</option>
                        <option value="GPU">Tarjeta de Video</option>
                        <option value="STORAGE">Almacenamiento</option>
                        <option value="PSU">Fuente de Poder</option>
                        <option value="CASE">Gabinete</option>
                        <option value="COOLER">Enfriamiento</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="form-card" style={{ padding: 0, overflow: 'visible' }}>
                  <div style={{ padding: '20px 24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px 12px 0 0', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Settings size={18} color="var(--primary)" /> Atributos Técnicos</h3>
                  </div>
                  
                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* --- Dynamic Required Attributes by Category --- */}
                    {(() => {
                      const currentCategory = categories.find(c => c.id.toString() === formData.category_id?.toString());
                      const requiredAttributes = currentCategory?.attribute_schema || [];
                      
                      if (requiredAttributes.length > 0) {
                        return (
                          <div style={{ marginBottom: '16px', padding: '20px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '12px' }}>
                            <h4 style={{ margin: '0 0 16px 0', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
                              <CheckCircle2 size={16} /> Requeridos por {currentCategory.name}
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                              {requiredAttributes.map((attrName: string) => {
                                const attrObj = attributes.find(a => a.name.toLowerCase() === attrName.toLowerCase());
                                if (!attrObj) return null;
                                
                                const selectedValIds = formData.attribute_value_ids.filter((valId: number) => 
                                  attrObj.values?.some((v: any) => v.id === valId)
                                );

                                return (
                                  <div key={attrName}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{attrName}</label>
                                    <MultiSearchableSelect 
                                      options={attrObj.values?.map((v: any) => ({ id: v.id, label: v.value })) || []}
                                      values={selectedValIds}
                                      onChange={(newValues) => {
                                        const currentIds = formData.attribute_value_ids.filter((id: number) => !attrObj.values?.some((v: any) => v.id === id));
                                        const validNewValues = newValues.map((v: any) => parseInt(v.toString())).filter((v: number) => !isNaN(v));
                                        setFormData({...formData, attribute_value_ids: [...currentIds, ...validNewValues]});
                                      }}
                                      placeholder={`Seleccionar...`}
                                      allowCreate={true}
                                      onCreate={async (valueName) => {
                                        const newId = await createAttributeValue(attrObj.id.toString(), valueName);
                                        if (newId) {
                                          const currentIds = formData.attribute_value_ids;
                                          setFormData({...formData, attribute_value_ids: [...currentIds, newId]});
                                        }
                                      }}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)' }}>Especificaciones Adicionales</h4>
                    {/* Atributos Seleccionados */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {formData.attribute_value_ids.length === 0 && (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', padding: '16px', background: 'var(--input-bg)', borderRadius: '8px', textAlign: 'center' }}>No se han agregado especificaciones técnicas adicionales.</div>
                      )}
                      {formData.attribute_value_ids.map((valId: number) => {
                        let attrName = '';
                        let valName = '';
                        attributes.forEach(attr => {
                          const val = attr.values?.find((v: any) => v.id === valId);
                          if (val) {
                            attrName = attr.name;
                            valName = val.value;
                          }
                        });

                        return (
                          <div key={valId} className="hover-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--card-border)', transition: 'all 0.2s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <div style={{ width: '4px', height: '24px', background: 'var(--primary)', borderRadius: '4px' }}></div>
                              <div>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{attrName}</span>
                                <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{valName}</div>
                              </div>
                            </div>
                            <button onClick={() => removeAttributeValue(valId)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }} className="hover-card">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )
                      })}
                    </div>

                    {/* Constructor */}
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', marginTop: '16px', paddingTop: '24px', borderTop: '1px dashed var(--card-border)' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Buscar Atributo</label>
                        <SearchableSelect 
                          options={attributes.map(a => ({ id: a.id, label: a.name }))}
                          value={selectedAttrId}
                          onChange={(val) => { setSelectedAttrId(val.toString()); setSelectedAttrValId(''); }}
                          placeholder="Ej. Memoria RAM..."
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Seleccionar o Crear Valor</label>
                        <SearchableSelect 
                          options={selectedAttrId ? (attributes.find(a => a.id === parseInt(selectedAttrId))?.values?.map((v: any) => ({ id: v.id, label: v.value })) || []) : []}
                          value={selectedAttrValId}
                          onChange={(val) => setSelectedAttrValId(val.toString())}
                          disabled={!selectedAttrId}
                          placeholder="Ej. 16GB..."
                          allowCreate={true}
                          onCreate={handleCreateAttributeValue}
                        />
                      </div>
                      <button type="button" onClick={addAttributeValue} disabled={!selectedAttrValId} className="btn-secondary hover-card" style={{ padding: '0 24px', height: '46px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, opacity: selectedAttrValId ? 1 : 0.5, cursor: selectedAttrValId ? 'pointer' : 'not-allowed' }}>
                        <Plus size={18} /> Añadir
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- TAB MEDIA --- */}
            {activeTab === 'media' && (
              <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h2 style={{ fontSize: '1.2rem', margin: 0, borderBottom: '1px solid var(--card-border)', paddingBottom: '12px' }}>Multimedia</h2>
                
                <div className="form-card">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Imagen Principal (URL)</label>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                    <input type="text" className="premium-input" value={formData.main_image_url} onChange={e => setFormData({...formData, main_image_url: e.target.value})} placeholder="https://..." style={{ flex: 1 }} />
                    <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px dashed var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {formData.main_image_url ? (
                        <img src={formData.main_image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <ImageIcon size={24} color="var(--text-muted)" />
                      )}
                    </div>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Info size={14} /> En el futuro esta sección permitirá arrastrar y soltar imágenes directamente.
                  </p>
                </div>

                <div className="form-card">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Galería de Imágenes (URLs separadas por comas)</label>
                  <textarea 
                    className="premium-input"
                    rows={4}
                    value={formData.image_gallery || ''} 
                    onChange={e => setFormData({...formData, image_gallery: e.target.value})} 
                    placeholder="https://img1.jpg, https://img2.jpg..."
                  />
                </div>
              </div>
            )}

            {/* --- TAB LOGISTICS --- */}
            {activeTab === 'logistics' && (
              <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h2 style={{ fontSize: '1.2rem', margin: 0, borderBottom: '1px solid var(--card-border)', paddingBottom: '12px' }}>Logística y Envíos</h2>
                
                <div className="form-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}><Truck size={14} /> Peso (Kg)</label>
                    <input type="number" step="0.01" className="premium-input" value={formData.weight_kg} onChange={e => setFormData({...formData, weight_kg: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Largo (cm)</label>
                    <input type="number" step="0.1" className="premium-input" value={formData.length_cm} onChange={e => setFormData({...formData, length_cm: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Ancho (cm)</label>
                    <input type="number" step="0.1" className="premium-input" value={formData.width_cm} onChange={e => setFormData({...formData, width_cm: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Alto (cm)</label>
                    <input type="number" step="0.1" className="premium-input" value={formData.height_cm} onChange={e => setFormData({...formData, height_cm: e.target.value})} />
                  </div>
                </div>

                <h2 style={{ fontSize: '1.2rem', margin: '12px 0 0 0', borderBottom: '1px solid var(--card-border)', paddingBottom: '12px' }}>SEO Metadatos</h2>
                
                <div className="form-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Meta Título</label>
                    <input type="text" className="premium-input" value={formData.meta_title} onChange={e => setFormData({...formData, meta_title: e.target.value})} placeholder="Dejar en blanco para usar el nombre del producto" />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Meta Descripción</label>
                    <textarea className="premium-input" rows={3} value={formData.meta_description} onChange={e => setFormData({...formData, meta_description: e.target.value})} placeholder="Resumen corto para Google..." />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
