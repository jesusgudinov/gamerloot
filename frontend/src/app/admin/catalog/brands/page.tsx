"use client";

import { useState, useEffect, FormEvent } from 'react';
import { Pencil, Trash2, Plus, Search, Star, ExternalLink, Image as ImageIcon, CheckCircle, XCircle, Store } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ImageUploader from '@/components/ui/ImageUploader';

interface Brand {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  website_url?: string;
  is_featured: boolean;
  has_storefront?: boolean;
}

export default function AdminBrands() {
  const { token } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    website_url: '',
    is_featured: false,
    has_storefront: false
  });
  const [saving, setSaving] = useState(false);

  const fetchBrands = async (searchTerm = '') => {
    setLoading(true);
    try {
      const url = new URL('http://localhost:8000/api/v1/catalog/brands');
      if (searchTerm) url.searchParams.append('search', searchTerm);
      
      const response = await fetch(url.toString());
      if (response.ok) {
        const data = await response.json();
        setBrands(data);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBrands(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenModal = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand);
      setFormData({
        name: brand.name,
        slug: brand.slug,
        description: brand.description || '',
        image_url: brand.image_url || '',
        website_url: brand.website_url || '',
        is_featured: brand.is_featured,
        has_storefront: brand.has_storefront || false
      });
    } else {
      setEditingBrand(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        image_url: '',
        website_url: '',
        is_featured: false,
        has_storefront: false
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const cleanSlug = formData.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
        .replace(/[^a-z0-9]+/g, '-') // Letras y números solamente
        .replace(/^-+|-+$/g, ''); // Quitar guiones extra
        
      const payload = {
        name: formData.name,
        slug: formData.slug || cleanSlug,
        description: formData.description || null,
        image_url: formData.image_url || null,
        website_url: formData.website_url || null,
        is_featured: formData.is_featured,
        has_storefront: formData.has_storefront
      };

      const method = editingBrand ? 'PUT' : 'POST';
      const url = editingBrand 
        ? `http://localhost:8000/api/v1/catalog/brands/${editingBrand.id}`
        : 'http://localhost:8000/api/v1/catalog/brands';

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchBrands(search);
      } else {
        const err = await response.json();
        alert(`Error: ${err.detail}`);
      }
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (brand: Brand) => {
    if (!confirm(`¿Estás seguro de eliminar la marca "${brand.name}"?`)) return;
    try {
      const response = await fetch(`http://localhost:8000/api/v1/catalog/brands/${brand.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        fetchBrands(search);
      } else {
        const err = await response.json();
        alert(`Error: ${err.detail}`);
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const toggleFeatured = async (brand: Brand) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/catalog/brands/${brand.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_featured: !brand.is_featured })
      });
      if (response.ok) fetchBrands(search);
    } catch (error) {
      console.error('Error toggling featured:', error);
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .toggle-checkbox {
          appearance: none;
          width: 40px;
          height: 20px;
          background: var(--input-bg);
          border-radius: 20px;
          position: relative;
          cursor: pointer;
          outline: none;
          border: 1px solid var(--input-border);
          transition: background 0.3s;
        }
        .toggle-checkbox::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 14px;
          height: 14px;
          background: var(--text-muted);
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
      <header className="admin-header">
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Store size={32} style={{ color: 'var(--primary)' }} />
            Marcas
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Administra las marcas de tus productos, añade logotipos y destaca tus mejores socios comerciales.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => handleOpenModal()}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none', padding: '12px 24px', fontSize: '1rem', fontWeight: 600 }}
          >
            <Plus size={18} /> Nueva Marca
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--input-bg)', padding: '0 12px', borderRadius: '8px', flex: 1, border: '1px solid var(--input-border)' }}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o slug..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', padding: '12px', width: '100%', color: 'var(--input-text)', outline: 'none' }}
          />
        </div>
      </div>

      {/* Grid de Marcas */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando marcas...</div>
      ) : brands.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--card-bg)', borderRadius: '12px', border: '1px dashed var(--card-border)' }}>
          No se encontraron marcas.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
          {brands.map(brand => (
            <div key={brand.id} className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s', cursor: 'default' }} 
                 onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(139, 92, 246, 0.2)'; e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)'; }}
                 onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--card-border)'; }}>
              
              {/* Botón Destacar (Estrella) */}
              <button 
                onClick={() => toggleFeatured(brand)}
                title={brand.is_featured ? "Quitar de destacados" : "Destacar marca"}
                style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
              >
                <Star size={16} fill={brand.is_featured ? "#fbbf24" : "transparent"} color={brand.is_featured ? "#fbbf24" : "var(--text-muted)"} />
              </button>

              {/* Logo Area */}
              <div style={{ height: '140px', background: 'var(--input-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', borderBottom: '1px solid var(--card-border)' }}>
                {brand.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={!brand.image_url.startsWith('http') ? `http://localhost:8000${brand.image_url.startsWith('/') ? '' : '/'}${brand.image_url}` : brand.image_url} alt={brand.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                  <ImageIcon size={48} style={{ opacity: 0.1 }} />
                )}
              </div>

              {/* Info Area */}
              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: 'var(--text-color)' }}>{brand.name}</h3>
                <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{brand.slug}</p>
                
                {brand.website_url && (
                  <a href={brand.website_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--accent-cyan)', textDecoration: 'none', marginBottom: '16px' }}>
                    Sitio Web <ExternalLink size={12} />
                  </a>
                )}

                {brand.has_storefront && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)', padding: '4px 8px', borderRadius: '12px', marginBottom: '16px' }}>
                    <Store size={14} /> Tienda Exclusiva Activa
                  </span>
                )}

                <div style={{ marginTop: 'auto', display: 'flex', gap: '8px', paddingTop: '16px', borderTop: '1px solid var(--card-border)' }}>
                  <Link href={`/admin/catalog/brands/${brand.id}/store`} style={{ flex: 1, background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', border: 'none', color: '#fff', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500 }}>
                    <Store size={14} /> Tienda
                  </Link>
                  <button onClick={() => handleOpenModal(brand)} style={{ flex: 1, background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-color)', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem' }}>
                    <Pencil size={14} /> Editar
                  </button>
                  <button onClick={() => handleDelete(brand)} style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem' }}>
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear/Editar */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(8px)', padding: '16px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', position: 'relative', overflowX: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)', filter: 'blur(20px)', zIndex: 0 }}></div>
            
            <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
              <h2 className="text-gradient" style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Store size={24} color="#8b5cf6" />
                {editingBrand ? 'Editar Marca' : 'Nueva Marca'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '50%', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'} onMouseOut={e => e.currentTarget.style.background='transparent'}><XCircle size={24} /></button>
            </div>
            
            <form onSubmit={handleSave} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Nombre *</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)', outline: 'none' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Slug</label>
                  <input type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="Generado automático" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)', outline: 'none' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Logotipo de la Marca</label>
                <ImageUploader 
                  currentImageUrl={formData.image_url}
                  onUploadSuccess={(url) => setFormData({...formData, image_url: url})}
                />
                <div style={{ marginTop: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>O introduce una URL externa manualmente:</label>
                  <input type="text" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} placeholder="https://..." style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)', outline: 'none' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Sitio Web Oficial</label>
                <input type="url" value={formData.website_url} onChange={e => setFormData({...formData, website_url: e.target.value})} placeholder="https://..." style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)', outline: 'none' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Descripción</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)', outline: 'none', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', padding: '12px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '8px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: '12px' }}>
                  <input type="checkbox" className="toggle-checkbox" checked={formData.is_featured} onChange={e => setFormData({...formData, is_featured: e.target.checked})} />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-color)' }}>
                    <strong>Marca Destacada</strong> (Aparecerá en el carrusel de inicio)
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: '12px' }}>
                  <input type="checkbox" className="toggle-checkbox" checked={formData.has_storefront} onChange={e => setFormData({...formData, has_storefront: e.target.checked})} />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-color)' }}>
                    <strong>Habilitar Tienda Exclusiva</strong> (Creará un micrositio en /store/[slug])
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-color)', cursor: 'pointer', fontWeight: 500 }}>Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '8px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none', color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                  {saving ? 'Guardando...' : 'Guardar Marca'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
