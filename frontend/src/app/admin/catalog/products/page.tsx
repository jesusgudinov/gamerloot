'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, Plus, Box, Download, Zap, CheckCircle2, FileEdit, Archive, Layers, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import SearchableSelect from '@/components/ui/SearchableSelect';
import EditableCell from '@/components/ui/EditableCell';
import BulkEditModal from '@/components/ui/BulkEditModal';
import SkeletonCard from '@/components/admin/SkeletonCard';

interface Product {
  id: number;
  sku: string;
  name: string;
  base_price: number;
  discount_price?: number;
  main_image_url?: string;
  status?: string;
  is_featured?: boolean;
  active_campaign?: {
    id: number;
    name: string;
  };
  category?: {
    id: number;
    name: string;
  };
  brand_relation?: {
    id: number;
    name: string;
    image_url?: string;
  };
  inventory_stocks: Array<{
    quantity: number;
    supplier_cost: number;
    warehouse: {
      name: string;
      provider_name: string;
      city: string;
      internal_code?: string;
    }
  }>;
}

import { useAuth } from '@/context/AuthContext';

export default function AdminProducts() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [brandId, setBrandId] = useState('');
  const [availableBrands, setAvailableBrands] = useState<{id: number, name: string}[]>([]);
  const [sortBy, setSortBy] = useState('');
  const [provider, setProvider] = useState('');
  const [inStock, setInStock] = useState(false);
  const [hasDiscount, setHasDiscount] = useState(false);
  const [tag, setTag] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryIdFilter, setCategoryIdFilter] = useState('');
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);

  // Bulk Edit y Quick Edit
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const handleQuickEdit = async (productId: number, field: string, value: any) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/products/${productId}/quick-edit`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ [field]: value })
      });
      if (res.ok) {
        setProducts(products.map(p => p.id === productId ? { ...p, [field]: value } : p));
      } else {
        alert("Error al actualizar el campo.");
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión al actualizar.");
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(products.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/catalog/brands`);
      if (res.ok) {
        const data = await res.json();
        setAvailableBrands(data);
      }
    } catch (error) {
      console.error("Error fetching brands", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/catalog/categories');
      if (res.ok) {
        setCategories(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      let url = new URL(`http://127.0.0.1:8000/api/v1/products/`);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('size', pageSize.toString());
      
      if (searchTerm) url.searchParams.append('search', searchTerm);
      if (brandId) url.searchParams.append('brand_id', brandId);
      if (sortBy) url.searchParams.append('sort_by', sortBy);
      if (provider) url.searchParams.append('provider', provider);
      if (inStock) url.searchParams.append('in_stock', 'true');
      if (hasDiscount) url.searchParams.append('has_discount', 'true');
      if (tag) url.searchParams.append('tag', tag);
      if (statusFilter) url.searchParams.append('status', statusFilter);
      if (categoryIdFilter) url.searchParams.append('category_id', categoryIdFilter);
      
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setProducts(data.items);
        setTotalPages(data.pages);
        setTotalItems(data.total);
      }
    } catch (error) {
      console.error("Error fetching products", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    if (currentPage === 1) {
      fetchProducts(1);
    } else {
      setCurrentPage(1);
    }
  };

  const handleToggleFeatured = async (productId: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/products/bulk-edit`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          product_ids: [productId],
          action: 'FEATURED',
          payload: { is_featured: !currentStatus }
        })
      });
      if (res.ok) {
        setProducts(products.map(p => p.id === productId ? { ...p, is_featured: !currentStatus } : p));
      } else {
        console.error("Failed to update featured status");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (productId: number, productName: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente el producto "${productName}"? Esta acción no se puede deshacer.`)) {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/v1/products/${productId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          setProducts(products.filter(p => p.id !== productId));
          setTotalItems(prev => prev - 1);
        } else {
          const errorData = await res.json();
          alert(errorData.detail || "Error al eliminar el producto.");
        }
      } catch (error) {
        console.error(error);
        alert("Error de conexión al intentar eliminar.");
      }
    }
  };

  const handleExport = () => {
    const itemsToExport = selectedIds.length > 0 
      ? products.filter(p => selectedIds.includes(p.id)) 
      : products;

    if (itemsToExport.length === 0) {
      alert('No hay productos para exportar.');
      return;
    }

    const headers = ['ID', 'SKU', 'Nombre', 'Marca', 'Categoría', 'Precio Base', 'Precio Descuento', 'Stock', 'Estado', 'Destacado'];
    
    const csvRows = itemsToExport.map(p => {
      const totalStock = p.inventory_stocks?.reduce((acc: number, stock: any) => acc + stock.quantity, 0) || 0;
      return [
        p.id,
        p.sku || '',
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${(p.brand_relation?.name || '').replace(/"/g, '""')}"`,
        `"${(p.category?.name || '').replace(/"/g, '""')}"`,
        p.base_price || 0,
        p.discount_price || '',
        totalStock,
        p.status || '',
        p.is_featured ? 'Si' : 'No'
      ].join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel UTF-8
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `gamer_loot_productos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (currentPage === 1) {
      fetchProducts(1);
    } else {
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId, sortBy, provider, inStock, hasDiscount, tag, statusFilter, categoryIdFilter, pageSize]);

  useEffect(() => {
    fetchProducts(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  useEffect(() => {
    fetchBrands();
    fetchCategories();
  }, []);

  return (
    <div style={{ width: '100%' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .hover-row:hover { background: rgba(106, 17, 203, 0.03) !important; }
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
        input[type=number] {
          -moz-appearance: textfield;
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
      <header className="animate-fade-in-up" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Catálogo de <span className="text-gradient">Productos</span></h1>
          <p style={{ color: 'var(--text-muted)' }}>Administra tu catálogo, precios e inventario.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleExport} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={18} /> Exportar
          </button>
          <Link href="/admin/catalog/products/new" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <Plus size={18} /> Agregar Producto
          </Link>
        </div>
      </header>

      {/* Basic Filters UI */}
      <div className="glass-panel animate-fade-in-up delay-100" style={{ padding: '20px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 250px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>Buscar</label>
            <input 
              type="text" 
              placeholder="Ej. RTX 4090 o SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-text)' }}
            />
          </div>
          <div style={{ width: '200px', zIndex: 110 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>Categoría</label>
            <SearchableSelect 
              options={[{ id: '', label: 'Todas las categorías' }, ...categories.map(c => ({ id: c.id, label: c.name }))]}
              value={categoryIdFilter}
              onChange={(val) => setCategoryIdFilter(val.toString())}
              placeholder="Seleccionar..."
            />
          </div>
          <div style={{ width: '180px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>Estado</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos los Estados</option>
              <option value="DRAFT">Borradores</option>
              <option value="PUBLISHED">Publicados</option>
              <option value="ARCHIVED">Archivados</option>
            </select>
          </div>
          <button 
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="btn-secondary hover-card" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '42px', padding: '0 20px', flexShrink: 0 }}
          >
            <Filter size={16} /> Filtros Avanzados
            {showAdvancedFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Advanced Filters (Expandable) */}
        {showAdvancedFilters && (
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end', paddingTop: '20px', marginTop: '5px', borderTop: '1px solid var(--card-border)', animation: 'fadeInUp 0.3s ease' }}>
            <div style={{ width: '200px', zIndex: 100 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>Marca</label>
              <SearchableSelect 
                options={[{ id: '', label: 'Todas las marcas' }, ...availableBrands.map(b => ({ id: b.id.toString(), label: b.name }))]}
                value={brandId}
                onChange={(val) => setBrandId(val.toString())}
                placeholder="Seleccionar..."
              />
            </div>
            <div style={{ width: '160px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>Proveedor</label>
              <select 
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="PCH">PCH</option>
                <option value="CVA">CVA</option>
                <option value="Importación Digital">Importación Digital</option>
                <option value="Quantum Imports">Quantum</option>
                <option value="TechSmart">TechSmart</option>
              </select>
            </div>
            <div style={{ width: '180px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>Ordenar por</label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="">Por defecto</option>
                <option value="name_asc">A - Z</option>
                <option value="name_desc">Z - A</option>
                <option value="price_asc">Precio: Menor a Mayor</option>
                <option value="price_desc">Precio: Mayor a Menor</option>
              </select>
            </div>
            <div style={{ width: '160px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>Tag (Etiqueta)</label>
              <input 
                type="text" 
                placeholder="Ej. gamer..."
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginLeft: 'auto', marginRight: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 500 }}>
                <input type="checkbox" className="toggle-checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} />
                Solo existencias
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 500 }}>
                <input type="checkbox" className="toggle-checkbox" checked={hasDiscount} onChange={(e) => setHasDiscount(e.target.checked)} />
                Solo ofertas
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="animate-fade-in-up" style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', background: 'var(--card-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--primary)', color: 'var(--foreground)', padding: '16px 24px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '30px', boxShadow: '0 10px 40px rgba(106, 17, 203, 0.3)', zIndex: 1000 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'var(--primary)', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {selectedIds.length}
            </div>
            <span style={{ fontWeight: 600 }}>productos seleccionados</span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setShowBulkModal(true)} className="btn-primary" style={{ padding: '10px 20px' }}>
              <FileEdit size={16} /> Editar Masivamente
            </button>
            <button onClick={() => setSelectedIds([])} className="btn-secondary" style={{ padding: '10px 20px', border: 'none', background: 'transparent' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="table-responsive-wrapper glass-panel">
        <div style={{ minWidth: '1000px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--card-border)', borderBottom: '1px solid var(--card-border)' }}>
              <th style={{ padding: '16px', width: '40px' }}>
                <input type="checkbox" onChange={toggleAll} checked={products.length > 0 && selectedIds.length === products.length} />
              </th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-muted)' }}>SKU</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-muted)' }}>Imagen</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-muted)' }}>Producto</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-muted)' }}>Categoría</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-muted)' }}>Stock Total</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-muted)' }}>Precio Venta</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-muted)' }}>Campaña</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-muted)' }}>Bodegas</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-muted)' }}>Estado</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center' }}>Destacado</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={12} style={{ padding: '0', border: 'none' }}><SkeletonCard type="table" /></td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={12} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron productos con estos filtros.</td></tr>
            ) : (
              products.map((product) => {
                const totalStock = product.inventory_stocks?.reduce((acc, stock) => acc + stock.quantity, 0) || 0;
                
                return (
                  <tr key={product.id} className="hover-row" style={{ borderBottom: '1px solid var(--card-border)', background: selectedIds.includes(product.id) ? 'rgba(106, 17, 203, 0.05)' : 'transparent', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px', width: '40px' }}>
                      <input type="checkbox" checked={selectedIds.includes(product.id)} onChange={() => toggleSelection(product.id)} />
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '0.8rem', background: 'var(--card-border)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
                        <EditableCell value={product.sku} onSave={(val) => handleQuickEdit(product.id, 'sku', val)} style={{ padding: 0, minHeight: 'auto' }} />
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {product.main_image_url ? (
                        <div style={{ width: '48px', height: '48px', minWidth: '48px', borderRadius: '8px', overflow: 'hidden', background: 'var(--input-bg)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img 
                            src={product.main_image_url} 
                            alt={product.name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', color: 'transparent', fontSize: '0' }} 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                              (e.target as HTMLImageElement).style.objectFit = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div style={{ width: '48px', height: '48px', minWidth: '48px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                          <Box size={20} />
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px', fontWeight: 500, maxWidth: '250px' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={product.name}>
                        <EditableCell value={product.name} onSave={(val) => handleQuickEdit(product.id, 'name', val)} />
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {product.brand_relation?.name}
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                      {product.category?.name || <span style={{ opacity: 0.5 }}>Sin categoría</span>}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ color: totalStock > 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                        {totalStock} pzs
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {product.discount_price ? (
                        <>
                          <div style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            <EditableCell value={product.base_price || 0} type="number" onSave={(val) => handleQuickEdit(product.id, 'base_price', val)} />
                          </div>
                          <div style={{ fontWeight: 'bold', color: '#10b981', display: 'flex', alignItems: 'center' }}>
                            $<EditableCell value={product.discount_price} type="number" onSave={(val) => handleQuickEdit(product.id, 'discount_price', val)} />
                          </div>
                        </>
                      ) : (
                        <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                          $<EditableCell value={product.base_price || 0} type="number" onSave={(val) => handleQuickEdit(product.id, 'base_price', val)} />
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px' }}>
                      {product.active_campaign ? (
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, background: 'rgba(106, 17, 203, 0.15)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Zap size={12} /> {product.active_campaign.name}
                        </span>
                      ) : product.discount_price ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--input-bg)', padding: '4px 8px', borderRadius: '6px' }}>
                          Manual
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--card-border)' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {(() => {
                          const validStocks = product.inventory_stocks?.filter(s => s.quantity > 0) || [];
                          if (validStocks.length > 0) {
                            return validStocks.map((stock, idx) => (
                              <span key={idx} style={{ fontSize: '0.75rem', fontWeight: 600, background: 'rgba(106, 17, 203, 0.1)', color: 'var(--primary)', border: '1px solid rgba(106, 17, 203, 0.2)', padding: '4px 8px', borderRadius: '8px' }} title={`Costo Prov: $${stock.supplier_cost}`}>
                                {stock.warehouse.internal_code}: {stock.quantity}
                              </span>
                            ));
                          } else if (product.inventory_stocks?.length > 0) {
                            return <span style={{ fontSize: '0.75rem', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 8px', borderRadius: '8px', fontWeight: 600 }}>Agotado</span>;
                          } else {
                            return <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sin cruce</span>;
                          }
                        })()}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {product.status === 'PUBLISHED' && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '4px 10px', borderRadius: '20px' }}><CheckCircle2 size={14} /> Publicado</span>}
                        {product.status === 'DRAFT' && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '4px 10px', borderRadius: '20px' }}><FileEdit size={14} /> Borrador</span>}
                        {product.status === 'ARCHIVED' && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, background: 'var(--input-bg)', color: 'var(--text-muted)', border: '1px solid var(--input-border)', padding: '4px 10px', borderRadius: '20px' }}><Archive size={14} /> Archivado</span>}
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          className="toggle-checkbox" 
                          checked={!!product.is_featured} 
                          onChange={() => handleToggleFeatured(product.id, !!product.is_featured)} 
                        />
                      </label>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <Link href={`/admin/catalog/products/${product.id}`} className="action-btn" title="Editar Producto">
                          <Pencil size={18} />
                        </Link>
                        <button className="action-btn delete" title="Borrar Producto" onClick={() => handleDelete(product.id, product.name)}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        
        <BulkEditModal 
          isOpen={showBulkModal} 
          onClose={() => setShowBulkModal(false)} 
          selectedIds={selectedIds} 
          onComplete={() => {
            setSelectedIds([]);
            fetchProducts(currentPage);
          }} 
        />

        {/* Pagination Controls */}
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', borderTop: '1px solid var(--card-border)', background: 'var(--card-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Mostrar:</span>
            <select 
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              style={{ padding: '6px 12px', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-text)' }}
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
              <option value={1000}>1000</option>
            </select>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>por página</span>
          </div>
          
          {(totalPages > 1 || currentPage > 1) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                style={{ background: 'var(--toggle-bg)', border: 'none', color: 'var(--foreground)', padding: '8px 16px', borderRadius: '8px', cursor: (currentPage === 1 || loading) ? 'not-allowed' : 'pointer', opacity: (currentPage === 1 || loading) ? 0.5 : 1 }}
              >
                ← Anterior
              </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Página</span>
              <input 
                type="number" 
                min={1} 
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 1 && val <= totalPages) {
                    setCurrentPage(val);
                  }
                }}
                style={{ width: '60px', padding: '6px', textAlign: 'center', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-text)', borderRadius: '6px' }}
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>de {totalPages}</span>
            </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || loading}
                style={{ background: 'var(--toggle-bg)', border: 'none', color: 'var(--foreground)', padding: '8px 16px', borderRadius: '8px', cursor: (currentPage === totalPages || loading) ? 'not-allowed' : 'pointer', opacity: (currentPage === totalPages || loading) ? 0.5 : 1 }}
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
