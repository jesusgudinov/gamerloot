'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, LayoutTemplate, LayoutList, Video, ImageIcon, Search, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import SearchableSelect from '@/components/ui/SearchableSelect';

interface Category {
  id: number;
  name: string;
}

export default function BrandStoreEditor() {
  const params = useParams();
  const router = useRouter();
  const brandId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [brandName, setBrandName] = useState('');
  const [hasStorefront, setHasStorefront] = useState(false);
  const [templateId, setTemplateId] = useState('template_A');
  const [config, setConfig] = useState<any>({});
  
  const [categories, setCategories] = useState<Category[]>([]);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Categories for the Featured Category dropdowns
        const catRes = await fetch('http://localhost:8000/api/v1/catalog/categories');
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData);
        }

        // Fetch Brand
        const res = await fetch(`http://localhost:8000/api/v1/catalog/brands/${brandId}`);
        if (res.ok) {
          const data = await res.json();
          setBrandName(data.name);
          setHasStorefront(data.has_storefront || false);
          
          if (data.store_config) {
            setTemplateId(data.store_config.template_id || 'template_A');
            setConfig(data.store_config || {});
          }
        }
      } catch (err) {
        console.error(err);
        showToast('Error cargando información', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [brandId]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Ensure the template_id is saved inside store_config
    const finalConfig = { ...config, template_id: templateId };

    try {
      const res = await fetch(`http://localhost:8000/api/v1/catalog/brands/${brandId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          has_storefront: hasStorefront,
          store_config: finalConfig
        })
      });

      if (res.ok) {
        showToast('Tienda actualizada con éxito');
      } else {
        showToast('Error al guardar', 'error');
      }
    } catch (err) {
      showToast('Error de red al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConfigChange = (key: string, value: any) => {
    setConfig({ ...config, [key]: value });
  };

  const renderTemplateA = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>URL del Hero Banner Principal *</label>
        <input 
          type="text" 
          value={config.hero_banner || ''} 
          onChange={e => handleConfigChange('hero_banner', e.target.value)}
          placeholder="https://ejemplo.com/banner.jpg"
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)', marginBottom: '12px' }}
        />
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Enlace al hacer clic (URL)</label>
        <input 
          type="text" 
          value={config.hero_link || ''} 
          onChange={e => handleConfigChange('hero_link', e.target.value)}
          placeholder="Ej: /store?tag=proart o https://..."
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }}
        />
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Título del Hero Banner (Opcional)</label>
        <input 
          type="text" 
          value={config.hero_title || ''} 
          onChange={e => handleConfigChange('hero_title', e.target.value)}
          placeholder="Nueva generación de componentes"
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }}
        />
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Categoría Destacada</label>
        <SearchableSelect 
          options={categories.map(cat => ({ id: cat.id, label: cat.name }))}
          value={config.featured_category_id || ''} 
          onChange={val => handleConfigChange('featured_category_id', val)}
          placeholder="Seleccionar Categoría..."
        />
      </div>
    </div>
  );

  const renderTemplateB = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Imágenes del Carrusel (separadas por comas)</label>
        <textarea 
          rows={3}
          value={config.carousel_images || ''} 
          onChange={e => handleConfigChange('carousel_images', e.target.value)}
          placeholder="https://img1.jpg, https://img2.jpg"
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)', marginBottom: '12px' }}
        />
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Enlaces del Carrusel (separados por comas, en el mismo orden)</label>
        <textarea 
          rows={3}
          value={config.carousel_links || ''} 
          onChange={e => handleConfigChange('carousel_links', e.target.value)}
          placeholder="/store?tag=asus, /store?category=2"
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Banner Secundario 1</label>
          <input 
            type="text" 
            value={config.secondary_banner_1 || ''} 
            onChange={e => handleConfigChange('secondary_banner_1', e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)', marginBottom: '12px' }}
          />
          <input 
            type="text" 
            value={config.secondary_banner_1_link || ''} 
            onChange={e => handleConfigChange('secondary_banner_1_link', e.target.value)}
            placeholder="Enlace (URL)"
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Banner Secundario 2</label>
          <input 
            type="text" 
            value={config.secondary_banner_2 || ''} 
            onChange={e => handleConfigChange('secondary_banner_2', e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)', marginBottom: '12px' }}
          />
          <input 
            type="text" 
            value={config.secondary_banner_2_link || ''} 
            onChange={e => handleConfigChange('secondary_banner_2_link', e.target.value)}
            placeholder="Enlace (URL)"
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }}
          />
        </div>
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Categoría Destacada</label>
        <SearchableSelect 
          options={categories.map(cat => ({ id: cat.id, label: cat.name }))}
          value={config.featured_category_id || ''} 
          onChange={val => handleConfigChange('featured_category_id', val)}
          placeholder="Seleccionar Categoría..."
        />
      </div>
    </div>
  );

  const renderTemplateC = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Enlace al Video de YouTube</label>
        <input 
          type="text" 
          value={config.youtube_url || ''} 
          onChange={e => handleConfigChange('youtube_url', e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }}
        />
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Color de Tema Principal (Hex)</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input 
            type="color" 
            value={config.theme_color || '#6a11cb'} 
            onChange={e => handleConfigChange('theme_color', e.target.value)}
            style={{ width: '50px', height: '40px', padding: '0', border: 'none', background: 'transparent', cursor: 'pointer' }}
          />
          <input 
            type="text" 
            value={config.theme_color || '#6a11cb'} 
            onChange={e => handleConfigChange('theme_color', e.target.value)}
            style={{ width: '120px', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }}
          />
        </div>
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Categoría Destacada</label>
        <SearchableSelect 
          options={categories.map(cat => ({ id: cat.id, label: cat.name }))}
          value={config.featured_category_id || ''} 
          onChange={val => handleConfigChange('featured_category_id', val)}
          placeholder="Seleccionar Categoría..."
        />
      </div>
    </div>
  );

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Cargando información de la marca...</div>;
  }

  return (
    <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Toast Notification */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: toast.type === 'success' ? '#10b981' : '#ef4444', color: 'white', padding: '12px 24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '8px', animation: 'slideIn 0.3s ease-out' }}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/admin/catalog/brands" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '10px', borderRadius: '8px', color: 'var(--text-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={18} />
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', color: 'var(--text-color)' }}>Diseño de Tienda: {brandName}</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Configura el micrositio oficial de la marca.</p>
        </div>
        {brandName && (
          <Link 
            href={`/brand/${brandName.toLowerCase().replace(/\s+/g, '-')}`}
            target="_blank"
            style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '10px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            Ver Tienda Pública <ExternalLink size={16} />
          </Link>
        )}
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Toggle Storefront */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-color)' }}>Habilitar Tienda Exclusiva</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Si se apaga, los usuarios solo verán una lista genérica de productos al visitar la marca.
            </p>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px' }}>
            <input 
              type="checkbox" 
              checked={hasStorefront}
              onChange={e => setHasStorefront(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }} 
            />
            <span style={{ 
              position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, 
              backgroundColor: hasStorefront ? 'var(--primary)' : 'var(--card-border)', 
              transition: '.4s', borderRadius: '28px' 
            }}>
              <span style={{
                position: 'absolute', content: '""', height: '20px', width: '20px', left: '4px', bottom: '4px',
                backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                transform: hasStorefront ? 'translateX(22px)' : 'translateX(0)'
              }} />
            </span>
          </label>
        </div>

        {hasStorefront && (
          <>
            {/* Template Selector */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-color)' }}>Selecciona una Plantilla</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                
                {/* Template A */}
                <div 
                  onClick={() => setTemplateId('template_A')}
                  style={{ border: templateId === 'template_A' ? '2px solid var(--primary)' : '2px solid var(--card-border)', borderRadius: '12px', padding: '20px', cursor: 'pointer', background: templateId === 'template_A' ? 'rgba(139, 92, 246, 0.05)' : 'transparent', textAlign: 'center', transition: 'all 0.2s' }}
                >
                  <LayoutTemplate size={40} color={templateId === 'template_A' ? 'var(--primary)' : 'var(--text-muted)'} style={{ margin: '0 auto 12px' }} />
                  <h4 style={{ margin: '0 0 8px 0', color: templateId === 'template_A' ? 'var(--primary)' : 'var(--text-color)' }}>Plantilla A</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hero Clásico con título y productos destacados.</p>
                </div>

                {/* Template B */}
                <div 
                  onClick={() => setTemplateId('template_B')}
                  style={{ border: templateId === 'template_B' ? '2px solid var(--primary)' : '2px solid var(--card-border)', borderRadius: '12px', padding: '20px', cursor: 'pointer', background: templateId === 'template_B' ? 'rgba(139, 92, 246, 0.05)' : 'transparent', textAlign: 'center', transition: 'all 0.2s' }}
                >
                  <LayoutList size={40} color={templateId === 'template_B' ? 'var(--primary)' : 'var(--text-muted)'} style={{ margin: '0 auto 12px' }} />
                  <h4 style={{ margin: '0 0 8px 0', color: templateId === 'template_B' ? 'var(--primary)' : 'var(--text-color)' }}>Plantilla B</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Carrusel dinámico y banners promocionales.</p>
                </div>

                {/* Template C */}
                <div 
                  onClick={() => setTemplateId('template_C')}
                  style={{ border: templateId === 'template_C' ? '2px solid var(--primary)' : '2px solid var(--card-border)', borderRadius: '12px', padding: '20px', cursor: 'pointer', background: templateId === 'template_C' ? 'rgba(139, 92, 246, 0.05)' : 'transparent', textAlign: 'center', transition: 'all 0.2s' }}
                >
                  <Video size={40} color={templateId === 'template_C' ? 'var(--primary)' : 'var(--text-muted)'} style={{ margin: '0 auto 12px' }} />
                  <h4 style={{ margin: '0 0 8px 0', color: templateId === 'template_C' ? 'var(--primary)' : 'var(--text-color)' }}>Plantilla C</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Enfoque multimedia con video de YouTube integrado.</p>
                </div>

              </div>
            </div>

            {/* Template Settings */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-color)' }}>Configuración de {templateId === 'template_A' ? 'Plantilla A' : templateId === 'template_B' ? 'Plantilla B' : 'Plantilla C'}</h3>
              {templateId === 'template_A' && renderTemplateA()}
              {templateId === 'template_B' && renderTemplateB()}
              {templateId === 'template_C' && renderTemplateC()}
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', padding: '16px 0' }}>
          <button 
            type="button" 
            onClick={() => router.push('/admin/catalog/brands')}
            style={{ background: 'transparent', color: 'var(--text-color)', border: '1px solid var(--card-border)', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={saving}
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', color: 'white', border: 'none', padding: '12px 32px', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(106, 17, 203, 0.3)' }}
          >
            {saving ? 'Guardando...' : <><Save size={18} /> Guardar Configuración</>}
          </button>
        </div>

      </form>
    </div>
  );
}
