import React, { useState, useEffect } from 'react';
import SearchableSelect from './SearchableSelect';
import { X, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: number[];
  onComplete: () => void;
}

export default function BulkEditModal({ isOpen, onClose, selectedIds, onComplete }: BulkEditModalProps) {
  const { token } = useAuth();
  const [action, setAction] = useState('');
  const [payload, setPayload] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [brands, setBrands] = useState<{id: number, name: string}[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetch('http://localhost:8000/api/v1/catalog/categories')
        .then(r => r.json())
        .then(data => setCategories(data))
        .catch(console.error);

      fetch('http://localhost:8000/api/v1/catalog/brands')
        .then(r => r.json())
        .then(data => setBrands(data))
        .catch(console.error);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!action) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/products/bulk-edit', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          product_ids: selectedIds,
          action,
          payload
        })
      });
      if (res.ok) {
        onComplete();
        onClose();
      } else {
        alert('Error al aplicar edición masiva');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '24px', borderRadius: '12px', background: 'var(--background)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Edición Masiva ({selectedIds.length} productos)</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Acción a realizar</label>
          <select 
            value={action} 
            onChange={(e) => { setAction(e.target.value); setPayload({}); }}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-text)' }}
          >
            <option value="">Selecciona una acción...</option>
            <option value="DISCOUNT">Aplicar Descuento (%)</option>
            <option value="REMOVE_DISCOUNT">Remover Descuento</option>
            <option value="STATUS">Cambiar Estado</option>
            <option value="FEATURED">Destacar en Inicio</option>
            <option value="BRAND">Asignar Marca</option>
            <option value="CATEGORY">Asignar Categoría</option>
          </select>
        </div>

        {action === 'DISCOUNT' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Porcentaje de Descuento</label>
            <input 
              type="number" 
              min="1" max="99" 
              placeholder="Ej. 15"
              value={payload.percentage || ''}
              onChange={(e) => setPayload({ ...payload, percentage: Number(e.target.value) })}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-text)' }}
            />
          </div>
        )}

        {action === 'STATUS' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Nuevo Estado</label>
            <select 
              value={payload.status || ''} 
              onChange={(e) => setPayload({ ...payload, status: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-text)' }}
            >
              <option value="">Selecciona estado...</option>
              <option value="PUBLISHED">Publicado</option>
              <option value="DRAFT">Borrador</option>
              <option value="ARCHIVED">Archivado</option>
            </select>
          </div>
        )}

        {action === 'FEATURED' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>¿Destacar producto?</label>
            <select 
              value={payload.is_featured !== undefined ? payload.is_featured.toString() : ''} 
              onChange={(e) => setPayload({ ...payload, is_featured: e.target.value === 'true' })}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-text)' }}
            >
              <option value="">Selecciona...</option>
              <option value="true">Sí, Destacar</option>
              <option value="false">No Destacar</option>
            </select>
          </div>
        )}

        {action === 'BRAND' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Marca</label>
            <SearchableSelect 
              options={brands.map(b => ({ id: b.id.toString(), label: b.name }))}
              value={payload.brand_id ? payload.brand_id.toString() : ''}
              onChange={(val) => setPayload({ ...payload, brand_id: Number(val) })}
              placeholder="Buscar marca..."
            />
          </div>
        )}

        {action === 'CATEGORY' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Categoría</label>
            <SearchableSelect 
              options={categories.map(c => ({ id: c.id.toString(), label: c.name }))}
              value={payload.category_id ? payload.category_id.toString() : ''}
              onChange={(val) => setPayload({ ...payload, category_id: Number(val) })}
              placeholder="Buscar categoría..."
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '8px' }}>
              Al asignar una categoría, los atributos correspondientes se vincularán automáticamente a estos productos.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button 
            onClick={handleSubmit} 
            disabled={!action || loading}
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {loading ? 'Aplicando...' : <><Save size={16} /> Aplicar Cambios</>}
          </button>
        </div>
      </div>
    </div>
  );
}
