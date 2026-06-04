"use client";

import { useState, useEffect, FormEvent } from 'react';
import { Pencil, Trash2, Plus, Search, Image as ImageIcon, CheckCircle, XCircle, Layers } from 'lucide-react';
import IconPicker from '@/components/ui/IconPicker';
import DynamicIcon from '@/components/ui/DynamicIcon';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { useAuth } from '@/context/AuthContext';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number | null;
  image_url?: string;
  is_active: boolean;
  is_for_configurator: boolean;
  keywords?: string[];
}

export default function AdminCategories() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]); // Para el selector padre
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parent_id: '',
    image_url: '',
    is_active: true,
    is_for_configurator: false,
    keywords: ''
  });
  const [saving, setSaving] = useState(false);

  // Fetch only for table (with search)
  const fetchCategories = async (searchTerm = '') => {
    setLoading(true);
    try {
      const url = new URL('http://127.0.0.1:8000/api/v1/catalog/categories');
      if (searchTerm) url.searchParams.append('search', searchTerm);
      
      const response = await fetch(url.toString());
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
        if (!searchTerm) {
          setAllCategories(data); // Guardamos la lista completa inicial
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Si allCategories está vacío, hacemos el primer fetch completo
    if (allCategories.length === 0) {
      fetchCategories('');
    } else {
      const timer = setTimeout(() => {
        fetchCategories(search);
      }, 300);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Refetch completo post-guardado para actualizar ambos estados
  const fetchAllAndTable = async () => {
    await fetchCategories('');
    if (search) fetchCategories(search);
  }

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        parent_id: category.parent_id?.toString() || '',
        image_url: category.image_url || '',
        is_active: category.is_active,
        is_for_configurator: category.is_for_configurator,
        keywords: category.keywords ? category.keywords.join(', ') : ''
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        parent_id: '',
        image_url: '',
        is_active: true,
        is_for_configurator: false,
        keywords: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/catalog/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchAllAndTable();
      } else {
        const err = await response.json();
        alert(`Error: ${err.detail}`);
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description || null,
        parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
        image_url: formData.image_url || null,
        is_active: formData.is_active,
        is_for_configurator: formData.is_for_configurator,
        keywords: formData.keywords ? formData.keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k) : null
      };

      const method = editingCategory ? 'PUT' : 'POST';
      const url = editingCategory 
        ? `http://127.0.0.1:8000/api/v1/catalog/categories/${editingCategory.id}`
        : 'http://127.0.0.1:8000/api/v1/catalog/categories';

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        handleCloseModal();
        fetchAllAndTable();
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
            <Layers size={32} style={{ color: 'var(--primary)' }} />
            Categorías
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Gestiona el árbol de categorías, iconos y estatus para tu tienda.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => handleOpenModal()}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> Nueva Categoría
          </button>
        </div>
      </header>

      {/* Toolbar / Search */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--input-bg)', padding: '0 12px', borderRadius: '8px', flex: 1, border: '1px solid var(--input-border)' }}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Buscar categoría por nombre..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              padding: '12px', 
              width: '100%', 
              color: 'var(--text-color)',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive-wrapper glass-panel" style={{ borderRadius: '12px', border: '1px solid var(--card-border)' }}>
        <div style={{ minWidth: '800px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: 'var(--card-border)', borderBottom: '1px solid var(--card-border)' }}>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-muted)' }}>Ícono</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-muted)' }}>Nombre</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-muted)' }}>Configurador</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-muted)' }}>Slug</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-muted)' }}>Estatus</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-muted)' }}>ID Padre</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando categorías...</td></tr>
              ) : categories.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron categorías.</td></tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} style={{ borderBottom: '1px solid var(--card-border)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--hover-bg)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '16px' }}>
                      {category.image_url ? (
                        category.image_url.includes('/') || category.image_url.includes('.') ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={category.image_url} alt={category.name} style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '6px' }} />
                        ) : (
                          <div style={{ width: '32px', height: '32px', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <DynamicIcon name={category.image_url} size={20} />
                          </div>
                        )
                      ) : (
                        <div style={{ width: '32px', height: '32px', background: 'var(--input-bg)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                          <ImageIcon size={16} />
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px', fontWeight: 500, color: 'var(--text-color)' }}>{category.name}</td>
                    <td style={{ padding: '16px' }}>
                      {category.is_for_configurator ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.75rem', background: 'var(--accent-color)', color: 'white', padding: '4px 8px', borderRadius: '12px' }}>PC Config</span>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{category.slug}</td>
                    <td style={{ padding: '16px' }}>
                      {category.is_active ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '12px' }}>
                          <CheckCircle size={14} /> Activo
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 8px', borderRadius: '12px' }}>
                          <XCircle size={14} /> Inactivo
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                      {category.parent_id ? `ID: ${category.parent_id}` : '-'}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleOpenModal(category)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                          title="Editar"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(category.id)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)', padding: '16px' }}>
          <div style={{ background: 'var(--background)', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', border: '1px solid var(--card-border)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
              <button onClick={handleCloseModal} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><XCircle size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Nombre *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Slug (Opcional, se autogenera si está vacío)</label>
                <input type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>URL de Imagen / Ícono</label>
                <IconPicker 
                  value={formData.image_url} 
                  onChange={(val) => setFormData({...formData, image_url: val})} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Palabras Clave (Para Mapeo Automático)</label>
                <input type="text" placeholder="Ej: usb, pendrive, flash" value={formData.keywords as any} onChange={e => setFormData({...formData, keywords: e.target.value as any})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)', outline: 'none' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Separadas por comas. Si el título de un producto nuevo contiene alguna de estas palabras, se asignará a esta categoría automáticamente.</span>
              </div>
              
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Categoría Padre (ID)</label>
                  <SearchableSelect
                    options={[
                      { id: '', label: 'Ninguna (Es raíz)' },
                      ...allCategories.filter(c => c.id !== editingCategory?.id).map(c => ({
                        id: c.id.toString(),
                        label: c.name
                      }))
                    ]}
                    value={formData.parent_id || ''}
                    onChange={(val) => setFormData({...formData, parent_id: val.toString()})}
                    placeholder="Buscar categoría padre..."
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, marginTop: '24px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                    <input type="checkbox" className="toggle-checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-color)' }}>Activo</span>
                  </label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, marginTop: '24px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }} title="Protege la categoría y la marca para ser usada en el armado de PCs">
                    <input type="checkbox" className="toggle-checkbox" checked={formData.is_for_configurator} onChange={e => setFormData({...formData, is_for_configurator: e.target.checked})} />
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-color)' }}>Configurador PC</span>
                  </label>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Descripción</label>
                <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)', outline: 'none', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={handleCloseModal} style={{ padding: '10px 20px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-color)', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--accent-color)', border: 'none', color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 500 }}>
                  {saving ? 'Guardando...' : 'Guardar Categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
