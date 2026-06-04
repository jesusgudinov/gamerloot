"use client";

import { useState, useEffect, FormEvent } from 'react';
import { Pencil, Trash2, Plus, Search, Tag, Settings, Palette, List, Type, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AttributeValue {
  id: number;
  attribute_id: number;
  value: string;
  slug: string;
  color_hex?: string;
}

interface Attribute {
  id: number;
  name: string;
  slug: string;
  type: string;
  is_filterable: boolean;
  is_for_configurator: boolean;
  values: AttributeValue[];
}

export default function AdminAttributes() {
  const { token } = useAuth();
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null);

  // Modal Atributo
  const [isAttrModalOpen, setIsAttrModalOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState<Attribute | null>(null);
  const [attrForm, setAttrForm] = useState({
    name: '',
    slug: '',
    type: 'text',
    is_filterable: true,
    is_for_configurator: false
  });

  // Modal Valor
  const [isValueModalOpen, setIsValueModalOpen] = useState(false);
  const [editingValue, setEditingValue] = useState<AttributeValue | null>(null);
  const [valueForm, setValueForm] = useState({
    value: '',
    slug: '',
    color_hex: ''
  });

  const [saving, setSaving] = useState(false);

  const fetchAttributes = async (searchTerm = '') => {
    setLoading(true);
    try {
      const url = new URL('http://127.0.0.1:8000/api/v1/catalog/attributes');
      if (searchTerm) url.searchParams.append('search', searchTerm);
      
      const response = await fetch(url.toString());
      if (response.ok) {
        const data = await response.json();
        setAttributes(data);
        if (selectedAttribute) {
          const updatedSelected = data.find((a: Attribute) => a.id === selectedAttribute.id);
          setSelectedAttribute(updatedSelected || null);
        }
      }
    } catch (error) {
      console.error('Error fetching attributes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAttributes(search);
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // --- CRUD Atributos ---
  const handleOpenAttrModal = (attr?: Attribute) => {
    if (attr) {
      setEditingAttr(attr);
      setAttrForm({
        name: attr.name,
        slug: attr.slug,
        type: attr.type || 'text',
        is_filterable: attr.is_filterable,
        is_for_configurator: attr.is_for_configurator
      });
    } else {
      setEditingAttr(null);
      setAttrForm({
        name: '',
        slug: '',
        type: 'text',
        is_filterable: true,
        is_for_configurator: false
      });
    }
    setIsAttrModalOpen(true);
  };

  const handleSaveAttr = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: attrForm.name,
        slug: attrForm.slug || `pa_${attrForm.name.toLowerCase().replace(/\s+/g, '-')}`,
        type: attrForm.type,
        is_filterable: attrForm.is_filterable,
        is_for_configurator: attrForm.is_for_configurator
      };

      const method = editingAttr ? 'PUT' : 'POST';
      const url = editingAttr 
        ? `http://127.0.0.1:8000/api/v1/catalog/attributes/${editingAttr.id}`
        : 'http://127.0.0.1:8000/api/v1/catalog/attributes';

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setIsAttrModalOpen(false);
        fetchAttributes(search);
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

  const handleDeleteAttr = async (attr: Attribute) => {
    if (attr.is_for_configurator) {
      alert("No se puede eliminar un atributo que está marcado para el Configurador de PC.");
      return;
    }
    if (!confirm(`¿Estás seguro de eliminar el atributo "${attr.name}"? Se borrarán todos sus valores.`)) return;
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/catalog/attributes/${attr.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        if (selectedAttribute?.id === attr.id) setSelectedAttribute(null);
        fetchAttributes(search);
      } else {
        const err = await response.json();
        alert(`Error: ${err.detail}`);
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  // --- CRUD Valores ---
  const handleOpenValueModal = (val?: AttributeValue) => {
    if (val) {
      setEditingValue(val);
      setValueForm({
        value: val.value,
        slug: val.slug,
        color_hex: val.color_hex || ''
      });
    } else {
      setEditingValue(null);
      setValueForm({
        value: '',
        slug: '',
        color_hex: ''
      });
    }
    setIsValueModalOpen(true);
  };

  const handleSaveValue = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedAttribute) return;
    setSaving(true);
    try {
      const payload = {
        value: valueForm.value,
        slug: valueForm.slug || `${selectedAttribute.slug}_${valueForm.value.toLowerCase().replace(/\s+/g, '-')}`,
        color_hex: valueForm.color_hex || null
      };

      const method = editingValue ? 'PUT' : 'POST';
      const url = editingValue 
        ? `http://127.0.0.1:8000/api/v1/catalog/attributes/values/${editingValue.id}`
        : `http://127.0.0.1:8000/api/v1/catalog/attributes/${selectedAttribute.id}/values`;

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setIsValueModalOpen(false);
        fetchAttributes(search); // Refresca todo, lo cual actualizará también el selectedAttribute
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

  const handleDeleteValue = async (val: AttributeValue) => {
    if (!confirm(`¿Eliminar el valor "${val.value}"?`)) return;
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/catalog/attributes/values/${val.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        fetchAttributes(search);
      } else {
        const err = await response.json();
        alert(`Error: ${err.detail}`);
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  // Helper para renderizar iconos según el tipo de atributo
  const renderTypeIcon = (type: string) => {
    if (type === 'color') return <Palette size={16} color="var(--text-muted)" />;
    if (type === 'select') return <List size={16} color="var(--text-muted)" />;
    return <Type size={16} color="var(--text-muted)" />;
  };

  return (
    <div style={{ width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', height: 'calc(100vh - 100px)' }}>
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
            <Type size={32} style={{ color: 'var(--primary)' }} />
            Atributos y Filtros
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Gestiona los filtros disponibles para tus productos (colores, tallas, capacidades).
          </p>
        </div>
      </header>

      {/* Main Split View */}
      <div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0, flexWrap: 'wrap' }}>
        
        {/* Left Column: Attributes */}
        <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', overflow: 'hidden', minHeight: '300px' }}>
          
          <div style={{ padding: '16px', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--card-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--input-bg)', padding: '0 12px', borderRadius: '8px', flex: 1 }}>
              <Search size={18} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder="Buscar atributo..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ background: 'transparent', border: 'none', padding: '10px', width: '100%', color: 'var(--text-color)', outline: 'none' }}
              />
            </div>
            <button 
              onClick={() => handleOpenAttrModal()}
              style={{ background: 'var(--accent-color)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}
            >
              <Plus size={16} /> Atributo
            </button>
          </div>

          <div style={{ overflowY: 'auto', flex: 1, padding: '12px' }}>
            {loading ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>Cargando atributos...</p>
            ) : attributes.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>No se encontraron atributos.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {attributes.map(attr => (
                  <div 
                    key={attr.id}
                    onClick={() => setSelectedAttribute(attr)}
                    style={{ 
                      padding: '16px', 
                      borderRadius: '8px', 
                      border: `1px solid ${selectedAttribute?.id === attr.id ? 'var(--accent-color)' : 'var(--card-border)'}`,
                      background: selectedAttribute?.id === attr.id ? 'rgba(var(--accent-color-rgb), 0.1)' : 'var(--input-bg)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {renderTypeIcon(attr.type)}
                        <span style={{ fontWeight: 600, color: 'var(--text-color)' }}>{attr.name}</span>
                        {attr.is_for_configurator && (
                          <span style={{ fontSize: '0.7rem', background: 'var(--accent-color)', color: 'white', padding: '2px 6px', borderRadius: '8px' }}>PC Config</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span>Valores: {attr.values.length}</span>
                        {attr.is_filterable ? (
                          <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12}/> Filtrable</span>
                        ) : (
                          <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}><XCircle size={12}/> Oculto en Filtros</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={(e) => { e.stopPropagation(); handleOpenAttrModal(attr); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}><Pencil size={16} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteAttr(attr); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Values */}
        <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', overflow: 'hidden', minHeight: '300px' }}>
          {selectedAttribute ? (
            <>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-border)' }}>
                <div>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', color: 'var(--text-color)' }}>{selectedAttribute.name}</h2>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Gestionando {selectedAttribute.values.length} valores para este atributo.
                  </p>
                </div>
                <button 
                  onClick={() => handleOpenValueModal()}
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--text-color)', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}
                >
                  <Plus size={16} /> Añadir Valor
                </button>
              </div>

              <div style={{ overflowY: 'auto', flex: 1, padding: '24px' }}>
                {selectedAttribute.values.length === 0 ? (
                  <div style={{ textAlign: 'center', marginTop: '60px', color: 'var(--text-muted)' }}>
                    <Settings size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                    <p>Este atributo aún no tiene valores.</p>
                    <button onClick={() => handleOpenValueModal()} style={{ background: 'transparent', color: 'var(--accent-color)', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Añadir el primer valor</button>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                        <th style={{ padding: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Muestra</th>
                        <th style={{ padding: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Valor</th>
                        <th style={{ padding: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Slug</th>
                        <th style={{ padding: '12px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAttribute.values.map(val => (
                        <tr key={val.id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                          <td style={{ padding: '12px' }}>
                            {selectedAttribute.type === 'color' ? (
                              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: val.color_hex || '#ccc', border: '1px solid var(--card-border)' }} title={val.color_hex}></div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>-</span>
                            )}
                          </td>
                          <td style={{ padding: '12px', fontWeight: 500, color: 'var(--text-color)' }}>{val.value}</td>
                          <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{val.slug}</td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <button onClick={() => handleOpenValueModal(val)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px' }}><Pencil size={16} /></button>
                            <button onClick={() => handleDeleteValue(val)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px' }}><Trash2 size={16} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <List size={64} style={{ opacity: 0.1, marginBottom: '24px' }} />
              <h3>Selecciona un Atributo</h3>
              <p>Haz clic en un atributo de la lista izquierda para gestionar sus valores.</p>
            </div>
          )}
        </div>

      </div>

      {/* Modal Atributo */}
      {isAttrModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)', padding: '16px' }}>
          <div style={{ background: 'var(--background)', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', border: '1px solid var(--card-border)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{editingAttr ? 'Editar Atributo' : 'Nuevo Atributo'}</h2>
              <button onClick={() => setIsAttrModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><XCircle size={24} /></button>
            </div>
            <form onSubmit={handleSaveAttr} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Nombre *</label>
                <input required type="text" value={attrForm.name} onChange={e => setAttrForm({...attrForm, name: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Slug (Opcional)</label>
                <input type="text" value={attrForm.slug} onChange={e => setAttrForm({...attrForm, slug: e.target.value})} placeholder="pa_nombre" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Tipo de UI</label>
                <select value={attrForm.type} onChange={e => setAttrForm({...attrForm, type: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)', outline: 'none' }}>
                  <option value="text">Texto / Etiquetas</option>
                  <option value="select">Lista Desplegable</option>
                  <option value="color">Muestras de Color</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                    <input type="checkbox" className="toggle-checkbox" checked={attrForm.is_filterable} onChange={e => setAttrForm({...attrForm, is_filterable: e.target.checked})} />
                    <span style={{ fontSize: '0.95rem', color: 'var(--text-color)' }}>Aparecer en Filtros Laterales</span>
                  </label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }} title="Atributo Crítico para validar compatibilidad">
                    <input type="checkbox" className="toggle-checkbox" checked={attrForm.is_for_configurator} onChange={e => setAttrForm({...attrForm, is_for_configurator: e.target.checked})} />
                    <span style={{ fontSize: '0.95rem', color: 'var(--text-color)' }}>Atributo Crítico (Configurador PC)</span>
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsAttrModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-color)', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--accent-color)', border: 'none', color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 500 }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Valor */}
      {isValueModalOpen && selectedAttribute && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)', padding: '16px' }}>
          <div style={{ background: 'var(--background)', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', border: '1px solid var(--card-border)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{editingValue ? 'Editar Valor' : 'Nuevo Valor'}</h2>
              <button onClick={() => setIsValueModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><XCircle size={24} /></button>
            </div>
            <form onSubmit={handleSaveValue} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Valor (Ej: Rojo, AM5, 16GB) *</label>
                <input required type="text" value={valueForm.value} onChange={e => setValueForm({...valueForm, value: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Slug (Opcional)</label>
                <input type="text" value={valueForm.slug} onChange={e => setValueForm({...valueForm, slug: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)', outline: 'none' }} />
              </div>
              {selectedAttribute.type === 'color' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Código de Color Hexadecimal</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="color" value={valueForm.color_hex || '#ffffff'} onChange={e => setValueForm({...valueForm, color_hex: e.target.value})} style={{ width: '40px', height: '40px', border: 'none', background: 'transparent', cursor: 'pointer' }} />
                    <input type="text" placeholder="#FF0000" value={valueForm.color_hex} onChange={e => setValueForm({...valueForm, color_hex: e.target.value})} style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)', outline: 'none' }} />
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsValueModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-color)', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--accent-color)', border: 'none', color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 500 }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
