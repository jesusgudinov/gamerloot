"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import ProductCard from '@/components/storefront/ProductCard';
import { ChevronLeft, ChevronRight, SlidersHorizontal, ArrowLeft, LayoutGrid, List } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function CatalogContent() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category');

  const { user } = useAuth();
  const [etasByProduct, setEtasByProduct] = useState<Record<number, string>>({});

  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Category State
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null);
  const [fadeCategory, setFadeCategory] = useState(false);

  // View State
  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');

  // Pagination & Sorting State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('relevance');
  const [pageInput, setPageInput] = useState('1');

  // Attributes Filter State
  const [availableAttributes, setAvailableAttributes] = useState<any[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string[]>>({});
  const [globalAttributes, setGlobalAttributes] = useState<any[]>([]);

  // Price Filter State
  const [priceRange, setPriceRange] = useState<{min: string, max: string}>({ min: '', max: '' });
  const [activePriceRange, setActivePriceRange] = useState<{min?: number, max?: number}>({});

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/catalog/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(e => console.error(e));

    fetch('http://localhost:8000/api/v1/catalog/attributes')
      .then(res => res.json())
      .then(data => setGlobalAttributes(data))
      .catch(e => console.error(e));
  }, []);

  // Listen to URL categoryParam changes
  useEffect(() => {
    if (categories.length > 0 && categoryParam) {
      const cat = categories.find((c: any) => c.id.toString() === categoryParam || c.slug === categoryParam);
      if (cat) {
        if (cat.parent_id) {
          setSelectedParentId(cat.parent_id);
          setSelectedSubId(cat.id);
        } else {
          setSelectedParentId(cat.id);
          setSelectedSubId(null);
        }
      }
    }
  }, [categoryParam, categories]);

  // Fetch available attributes for the selected subcategory (facets)
  useEffect(() => {
    if (!selectedSubId) {
      setAvailableAttributes([]);
      setSelectedAttributes({});
      return;
    }
    
    // Reset filters and page when subcategory changes
    setSelectedAttributes({});
    setPriceRange({ min: '', max: '' });
    setActivePriceRange({});
    setPage(1);
    setPageInput('1');

    // Fetch up to 1000 products just to extract available attributes for the filters
    fetch(`http://localhost:8000/api/v1/products/?size=1000&category_id=${selectedSubId}`)
      .then(res => res.json())
      .then(data => {
        extractAttributes(data.items || []);
      })
      .catch(e => console.error("Error fetching facets", e));
  }, [selectedSubId, globalAttributes]);

  // Main Product Fetch (Server-side filtering, sorting, pagination)
  useEffect(() => {
    setLoadingProducts(true);
    let url = `http://localhost:8000/api/v1/products/?size=40&page=${page}&sort_by=${sortBy}`;
    
    if (search) url += `&search=${encodeURIComponent(search)}`;
    
    if (selectedSubId) {
      url += `&category_id=${selectedSubId}`;
    } else if (selectedParentId) {
      url += `&category_id=${selectedParentId}`;
    }

    if (Object.keys(selectedAttributes).length > 0) {
      url += `&attributes=${encodeURIComponent(JSON.stringify(selectedAttributes))}`;
    }
    if (activePriceRange.min) {
      url += `&min_price=${activePriceRange.min}`;
    }
    if (activePriceRange.max) {
      url += `&max_price=${activePriceRange.max}`;
    }

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setProducts(data.items || []);
        setTotalPages(data.pages || 1);
        setLoadingProducts(false);
      })
      .catch(e => {
        console.error(e);
        setLoadingProducts(false);
      });
  }, [search, selectedParentId, selectedSubId, selectedAttributes, page, sortBy, activePriceRange]);

  // Fetch ETAs for loaded products
  useEffect(() => {
    if (products.length === 0 || !user?.default_zip_code) return;

    const productIds = products.map(p => p.id);

    if (productIds.length > 0) {
      fetch('http://localhost:8000/api/v1/storefront/bulk-eta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          destination_zip: user.default_zip_code,
          product_ids: productIds
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.etas) {
          setEtasByProduct(data.etas);
        }
      })
      .catch(err => console.error("Error fetching ETAs", err));
    }
  }, [products, user?.default_zip_code]);

  const extractAttributes = (items: any[]) => {
    const attrMap = new Map<string, Set<string>>();
    attrMap.set('Marca', new Set());
    attrMap.set('Existencia', new Set(['En stock', 'Agotado']));
    
    items.forEach(product => {
      // 1. Marca
      if (product.brand_relation?.name) {
        attrMap.get('Marca')!.add(product.brand_relation.name);
      } else if (product.brand) {
        attrMap.get('Marca')!.add(product.brand);
      }

      // 2. Relational Attributes (M2M)
      if (product.attribute_values && product.attribute_values.length > 0) {
        product.attribute_values.forEach((val: any) => {
          const parentAttr = globalAttributes.find(a => a.id === val.attribute_id);
          const attrName = parentAttr ? parentAttr.name : `Attr_${val.attribute_id}`;
          if (!attrMap.has(attrName)) attrMap.set(attrName, new Set());
          attrMap.get(attrName)!.add(val.value);
        });
      }

      // 3. Technical Attributes (JSON fallback)
      if (product.technical_attributes) {
        Object.entries(product.technical_attributes).forEach(([key, value]) => {
          if (typeof value === 'string' || typeof value === 'number') {
            if (!attrMap.has(key)) attrMap.set(key, new Set());
            attrMap.get(key)!.add(String(value));
          }
        });
      }
    });

    if (attrMap.get('Marca')!.size === 0) attrMap.delete('Marca');

    const parsedAttrs = Array.from(attrMap.entries()).map(([key, values]) => ({
      name: key,
      values: Array.from(values).sort()
    }));
    
    setAvailableAttributes(parsedAttrs);
  };

  const handleParentSelect = (id: number) => {
    setFadeCategory(true);
    setTimeout(() => {
      setSelectedParentId(id);
      setSelectedSubId(null);
      setPage(1);
      setPageInput('1');
      setFadeCategory(false);
    }, 200);
  };

  const handleBackToParents = () => {
    setFadeCategory(true);
    setTimeout(() => {
      setSelectedParentId(null);
      setSelectedSubId(null);
      setPage(1);
      setPageInput('1');
      setFadeCategory(false);
    }, 200);
  };

  const handleSubSelect = (id: number) => {
    setFadeCategory(true);
    setTimeout(() => {
      setSelectedSubId(id);
      setFadeCategory(false);
    }, 200);
  };

  const handleBackToSubcategories = () => {
    setFadeCategory(true);
    setTimeout(() => {
      setSelectedSubId(null);
      setFadeCategory(false);
    }, 200);
  };

  const toggleAttribute = (attrName: string, val: string) => {
    setSelectedAttributes(prev => {
      const current = prev[attrName] || [];
      const updated = current.includes(val) 
        ? current.filter(v => v !== val)
        : [...current, val];
      
      let newSelection;
      if (updated.length === 0) {
        const copy = { ...prev };
        delete copy[attrName];
        newSelection = copy;
      } else {
        newSelection = { ...prev, [attrName]: updated };
      }
      
      setPage(1); // Reset to page 1 on filter change
      setPageInput('1');
      return newSelection;
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      setPageInput(String(newPage));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(pageInput);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      handlePageChange(p);
    } else {
      setPageInput(String(page));
    }
  };

  // Filter Categories to hide empty ones
  // A parent is visible if it has products OR if any of its subcategories have products
  let parentCats = categories.filter(c => 
    !c.parent_id && 
    (c.product_count > 0 || categories.some(sub => sub.parent_id === c.id && sub.product_count > 0))
  );

  let subCats = selectedParentId ? categories.filter(c => 
    c.parent_id === selectedParentId && c.product_count > 0
  ) : [];

  const currentParent = categories.find(c => c.id === selectedParentId);
  const currentSub = categories.find(c => c.id === selectedSubId);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar />

      <main style={{ maxWidth: '1600px', margin: '0 auto', padding: '40px' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '40px', alignItems: 'start' }}>
          
          {/* Sidebar */}
          <aside style={{ position: 'sticky', top: '100px' }}>
            <div style={{ 
              background: 'var(--card-bg)', 
              borderRadius: '16px', 
              border: '1px solid var(--card-border)',
              padding: '20px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
              
              {/* Category Navigation with Fade Transition */}
              <div style={{ 
                opacity: fadeCategory ? 0 : 1, 
                transform: fadeCategory ? 'translateX(-10px)' : 'translateX(0)', 
                transition: 'all 0.2s ease-out' 
              }}>
                {!selectedParentId ? (
                  <div>
                    <h3 style={{ fontSize: '1.2rem', margin: '0 0 16px 0', borderBottom: '1px solid var(--card-border)', paddingBottom: '12px', color: 'var(--foreground)' }}>
                      Categorías Principales
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {parentCats.map(cat => (
                        <li 
                          key={cat.id} 
                          onClick={() => handleParentSelect(cat.id)}
                          style={{ 
                            padding: '10px 12px', 
                            borderRadius: '10px', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'transparent',
                            transition: 'all 0.2s ease',
                            border: '1px solid transparent'
                          }}
                          onMouseOver={e => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)'; e.currentTarget.style.borderColor = 'var(--card-border)' }}
                          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
                        >
                          <span style={{ fontWeight: 500, color: 'var(--foreground)' }}>{cat.name}</span>
                          <ChevronRight size={16} color="var(--primary)" />
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : selectedSubId === null ? (
                  <div>
                    <button 
                      onClick={handleBackToParents}
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        color: 'var(--text-muted)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        cursor: 'pointer',
                        padding: 0,
                        marginBottom: '16px',
                        fontSize: '0.9rem',
                        transition: 'color 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.color = 'var(--primary)'}
                      onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <ArrowLeft size={16} /> Categorías
                    </button>
                    
                    <h3 style={{ fontSize: '1.2rem', margin: '0 0 16px 0', borderBottom: '1px solid var(--card-border)', paddingBottom: '12px', color: 'var(--primary)' }}>
                      {currentParent?.name}
                    </h3>
                    
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <li 
                        onClick={() => handleSubSelect(currentParent.id)} // Parent as sub selects "All" implicitly but let's just trigger sub selection
                        style={{ 
                          padding: '10px 12px', 
                          borderRadius: '10px', 
                          cursor: 'pointer',
                          background: 'transparent',
                          color: 'var(--foreground)',
                          fontWeight: 500,
                          transition: 'all 0.2s',
                          border: '1px solid transparent',
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}
                        onMouseOver={e => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)'; e.currentTarget.style.borderColor = 'var(--card-border)' }}
                        onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
                      >
                        <span>Ver Todo {currentParent?.name}</span>
                        <ChevronRight size={16} color="var(--primary)" />
                      </li>
                      
                      {subCats.map(cat => (
                        <li 
                          key={cat.id} 
                          onClick={() => handleSubSelect(cat.id)}
                          style={{ 
                            padding: '10px 12px', 
                            borderRadius: '10px', 
                            cursor: 'pointer',
                            background: 'transparent',
                            color: 'var(--foreground)',
                            fontWeight: 500,
                            transition: 'all 0.2s',
                            border: '1px solid transparent',
                            display: 'flex',
                            justifyContent: 'space-between'
                          }}
                          onMouseOver={e => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)'; e.currentTarget.style.borderColor = 'var(--card-border)' }}
                          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
                        >
                          <span>{cat.name}</span>
                          <ChevronRight size={16} color="var(--primary)" />
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div>
                    <button 
                      onClick={handleBackToSubcategories}
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        color: 'var(--text-muted)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        cursor: 'pointer',
                        padding: 0,
                        marginBottom: '16px',
                        fontSize: '0.9rem',
                        transition: 'color 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.color = 'var(--primary)'}
                      onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <ArrowLeft size={16} /> Volver a Subcategorías
                    </button>
                    
                    <h3 style={{ fontSize: '1.2rem', margin: '0 0 16px 0', borderBottom: '1px solid var(--card-border)', paddingBottom: '12px', color: 'var(--primary)' }}>
                      Filtrar por
                    </h3>

                    {/* Dynamic Filters */}
                    {availableAttributes.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {availableAttributes.map(attr => (
                          <div key={attr.name}>
                            <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {attr.name}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {attr.values.map((val: string) => (
                                <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', cursor: 'pointer', color: 'var(--text-muted)', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--foreground)'} onMouseOut={e => { if(!selectedAttributes[attr.name]?.includes(val)) e.currentTarget.style.color = 'var(--text-muted)' }}>
                                  <input 
                                    type="checkbox" 
                                    className="custom-checkbox"
                                    checked={selectedAttributes[attr.name]?.includes(val) || false}
                                    onChange={() => toggleAttribute(attr.name, val)}
                                  />
                                  <span style={{ fontWeight: selectedAttributes[attr.name]?.includes(val) ? 600 : 400, color: selectedAttributes[attr.name]?.includes(val) ? 'var(--foreground)' : 'inherit' }}>{val}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                        No hay filtros disponibles para esta categoría.
                      </div>
                    )}

                    <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid var(--card-border)' }}>
                      <h3 style={{ fontSize: '1.2rem', margin: '0 0 16px 0', borderBottom: '1px solid var(--card-border)', paddingBottom: '12px', color: 'var(--primary)' }}>
                        Filtrar por precio
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>$</span>
                          <input 
                            type="number" 
                            placeholder="Mín" 
                            value={priceRange.min}
                            onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                            style={{ width: '100%', padding: '10px 10px 10px 24px', borderRadius: '10px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--foreground)', fontSize: '0.9rem', outline: 'none' }}
                          />
                        </div>
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>$</span>
                          <input 
                            type="number" 
                            placeholder="Máx" 
                            value={priceRange.max}
                            onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                            style={{ width: '100%', padding: '10px 10px 10px 24px', borderRadius: '10px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--foreground)', fontSize: '0.9rem', outline: 'none' }}
                          />
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setActivePriceRange({
                            min: priceRange.min ? parseFloat(priceRange.min) : undefined,
                            max: priceRange.max ? parseFloat(priceRange.max) : undefined
                          });
                          setPage(1);
                          setPageInput('1');
                        }}
                        style={{ width: '100%', marginTop: '12px', padding: '10px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)', border: '1px solid rgba(139, 92, 246, 0.2)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseOver={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = 'white'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'; e.currentTarget.style.color = 'var(--primary)'; }}
                      >
                        Aplicar Precio
                      </button>
                    </div>

                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Grid Area */}
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '800px' }}>
            
            {/* Grid Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
              {search ? (
                <h1 style={{ fontSize: '2rem', margin: 0, fontWeight: 700, background: 'linear-gradient(to right, var(--foreground), #a855f7)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
                  Resultados para "{search}"
                </h1>
              ) : (currentSub || currentParent) ? (
                <h2 style={{ fontSize: '2rem', margin: 0, fontWeight: 800, background: 'linear-gradient(to right, var(--foreground), #a855f7)', WebkitBackgroundClip: 'text', color: 'transparent', letterSpacing: '-0.5px' }}>
                  {currentSub?.name || currentParent?.name}
                </h2>
              ) : (
                <h2 style={{ fontSize: '2rem', margin: 0, fontWeight: 800, background: 'linear-gradient(to right, var(--foreground), #a855f7)', WebkitBackgroundClip: 'text', color: 'transparent', letterSpacing: '-0.5px' }}>
                  Catálogo
                </h2>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '4px', background: 'var(--card-bg)', padding: '4px', borderRadius: '12px', border: '1px solid var(--card-border)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
                  <button onClick={() => setViewMode('grid')} style={{ padding: '6px', borderRadius: '8px', border: 'none', background: viewMode === 'grid' ? 'rgba(139, 92, 246, 0.15)' : 'transparent', color: viewMode === 'grid' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center' }}>
                    <LayoutGrid size={18} />
                  </button>
                  <button onClick={() => setViewMode('list')} style={{ padding: '6px', borderRadius: '8px', border: 'none', background: viewMode === 'list' ? 'rgba(139, 92, 246, 0.15)' : 'transparent', color: viewMode === 'list' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center' }}>
                    <List size={18} />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--card-bg)', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--card-border)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
                  <SlidersHorizontal size={18} color="var(--primary)" />
                  <select 
                    value={sortBy} 
                    onChange={(e) => { setSortBy(e.target.value); setPage(1); setPageInput('1'); }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--foreground)', fontSize: '0.95rem', outline: 'none', cursor: 'pointer', fontWeight: 500 }}
                  >
                    <option value="relevance" style={{ background: 'var(--card-bg)' }}>Más Relevantes</option>
                    <option value="newest" style={{ background: 'var(--card-bg)' }}>Más Nuevos</option>
                    <option value="best_selling" style={{ background: 'var(--card-bg)' }}>Más Vendidos</option>
                    <option value="price_asc" style={{ background: 'var(--card-bg)' }}>Menor a Mayor Precio</option>
                    <option value="price_desc" style={{ background: 'var(--card-bg)' }}>Mayor a Menor Precio</option>
                  </select>
                </div>
              </div>
            </div>

            {loadingProducts ? (
              <div style={{ display: viewMode === 'grid' ? 'grid' : 'flex', flexDirection: viewMode === 'list' ? 'column' : 'row', gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(220px, 1fr))' : 'none', gap: '24px' }}>
                {[1,2,3,4,5,6,7,8].map(i => (
                  <div key={i} style={{ height: viewMode === 'list' ? '200px' : '360px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div style={{ display: viewMode === 'grid' ? 'grid' : 'flex', flexDirection: viewMode === 'list' ? 'column' : 'row', gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(220px, 1fr))' : 'none', gap: '24px', flex: 1, alignContent: 'start' }}>
                  {products.map((product) => {
                    const productEta = etasByProduct[product.id] || null;
                    return (
                      <ProductCard key={product.id} product={product} viewMode={viewMode} eta={productEta} />
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '60px', padding: '20px 0', borderTop: '1px solid var(--card-border)' }}>
                    <button 
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      style={{ 
                        background: page === 1 ? 'transparent' : 'var(--card-bg)', 
                        border: '1px solid var(--card-border)', 
                        color: page === 1 ? 'var(--text-muted)' : 'var(--foreground)',
                        padding: '10px',
                        borderRadius: '12px',
                        cursor: page === 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    
                    <form onSubmit={handlePageInputSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Página</span>
                      <input 
                        type="text" 
                        value={pageInput}
                        onChange={(e) => setPageInput(e.target.value)}
                        onBlur={handlePageInputSubmit}
                        style={{ 
                          width: '50px', 
                          textAlign: 'center', 
                          padding: '8px', 
                          borderRadius: '8px', 
                          border: '1px solid var(--primary)', 
                          background: 'rgba(139, 92, 246, 0.1)', 
                          color: 'var(--foreground)',
                          fontWeight: 600,
                          fontSize: '1rem',
                          outline: 'none'
                        }}
                      />
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>de {totalPages}</span>
                    </form>

                    <button 
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      style={{ 
                        background: page === totalPages ? 'transparent' : 'var(--card-bg)', 
                        border: '1px solid var(--card-border)', 
                        color: page === totalPages ? 'var(--text-muted)' : 'var(--foreground)',
                        padding: '10px',
                        borderRadius: '12px',
                        cursor: page === totalPages ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '80px', 
                background: 'var(--card-bg)',
                border: '1px dashed var(--card-border)', 
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '20px', borderRadius: '50%' }}>
                  <SlidersHorizontal size={40} color="var(--primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.4rem', margin: '0 0 8px 0', color: 'var(--foreground)' }}>No se encontraron productos</h3>
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}>Intenta ajustando los filtros o buscando otra categoría.</p>
                </div>
                <button 
                  onClick={() => { setSelectedAttributes({}); setActivePriceRange({}); setPriceRange({min: '', max: ''}); setPage(1); setPageInput('1'); }}
                  style={{
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: '12px',
                    fontWeight: 600,
                    marginTop: '10px',
                    cursor: 'pointer'
                  }}
                >
                  Limpiar Filtros
                </button>
              </div>
            )}
          </div>

        </div>
      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.3; }
          100% { opacity: 0.6; }
        }

        .custom-checkbox {
          appearance: none;
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border: 2px solid rgba(139, 92, 246, 0.3);
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.2);
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .custom-checkbox:hover {
          border-color: var(--primary);
          background: rgba(139, 92, 246, 0.1);
        }
        .custom-checkbox:checked {
          background: var(--primary);
          border-color: var(--primary);
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.4);
        }
        .custom-checkbox:checked::after {
          content: '✓';
          position: absolute;
          color: white;
          font-size: 14px;
          font-weight: 800;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
      `}} />
      <Footer />
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div style={{ padding: '100px', textAlign: 'center', color: 'var(--primary)', fontWeight: 'bold' }}>Invocando catálogo épico...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
