'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Image as ImageIcon, Link as LinkIcon, MoveUp, MoveDown } from 'lucide-react';

export default function BannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    target_url: '',
    position: 'homepage_carousel',
    display_order: 0,
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/marketing/banners');
      if (res.ok) {
        setBanners(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      display_order: parseInt(formData.display_order.toString()),
      is_active: true
    };

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/marketing/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ title: '', image_url: '', target_url: '', position: 'homepage_carousel', display_order: 0 });
        fetchBanners();
      } else {
        alert('Error al crear banner');
      }
    } catch (e) {
      alert('Error de conexión');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este banner?')) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/marketing/banners/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchBanners();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '8px' }}>Gestor de Banners</h1>
          <p style={{ color: 'var(--text-muted)' }}>Control total de los gráficos y carruseles de la tienda.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={20} /> Nuevo Banner
        </button>
      </header>

      {/* Lista de Banners */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {loading ? (
          <div style={{ color: 'var(--text-muted)' }}>Cargando banners...</div>
        ) : banners.length === 0 ? (
          <div style={{ color: 'var(--text-muted)' }}>No hay banners configurados.</div>
        ) : (
          banners.map((banner) => (
            <div key={banner.id} className="glass-panel hover-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', height: '180px', width: '100%', background: 'var(--card-border)' }}>
                <img src={banner.image_url} alt={banner.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: banner.is_active ? 1 : 0.4 }} />
                <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', color: '#fff' }}>
                  {banner.position}
                </div>
              </div>
              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--foreground)' }}>{banner.title}</h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <LinkIcon size={16} />
                  <a href={banner.target_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {banner.target_url || 'Sin enlace'}
                  </a>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--card-border)' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Orden: {banner.display_order}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-danger" onClick={() => handleDelete(banner.id)} style={{ padding: '8px', display: 'flex' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Nuevo Banner */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '32px' }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '1.5rem', color: 'var(--foreground)' }}>Añadir Banner</h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Título Interno *</label>
                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }} placeholder="Ej. Promoción Laptops Asus" />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>URL de la Imagen *</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input type="url" required value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }} placeholder="https://..." />
                  {formData.image_url && (
                    <img src={formData.image_url} alt="Preview" style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover' }} />
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>URL de Destino (Al dar clic)</label>
                <input type="text" value={formData.target_url} onChange={e => setFormData({...formData, target_url: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }} placeholder="Ej. /categoria/laptops" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Posición</label>
                  <select value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }}>
                    <option value="homepage_carousel">Carrusel Principal (Home)</option>
                    <option value="topbar">Cintillo Superior (Topbar)</option>
                    <option value="sidebar">Sidebar de Catálogo</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Orden de Visualización</label>
                  <input type="number" value={formData.display_order} onChange={e => setFormData({...formData, display_order: parseInt(e.target.value)})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Guardar Banner</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
