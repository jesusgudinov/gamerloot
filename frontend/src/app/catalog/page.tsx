"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import ProductCard from '@/components/storefront/ProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function CatalogContent() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';

  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Category State
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null);
  const [fadeCategory, setFadeCategory] = useState(false);

  // Attributes Filter State
  const [availableAttributes, setAvailableAttributes] = useState<any[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string[]>>({});
  const [globalAttributes, setGlobalAttributes] = useState<any[]>([]);

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

  useEffect(() => {
    setLoadingProducts(true);
    let url = `http://localhost:8000/api/v1/products/?size=100`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    
    // Priority: Subcategory > Parent Category
    if (selectedSubId) {
      url += `&category_id=${selectedSubId}`;
    } else if (selectedParentId) {
      url += `&category_id=${selectedParentId}`;
    }

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setProducts(data.items || []);
        extractAttributes(data.items || []);
        setLoadingProducts(false);
      })
      .catch(e => {
        console.error(e);
        setLoadingProducts(false);
      });
  }, [search, selectedParentId, selectedSubId, globalAttributes]);

  const extractAttributes = (items: any[]) => {
    if (!selectedSubId) {
      setAvailableAttributes([]);
      setSelectedAttributes({});
      return;
    }

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
    setSelectedAttributes({}); // Reset selections on category change
  };

  const handleParentSelect = (id: number) => {
    setFadeCategory(true);
    setTimeout(() => {
      setSelectedParentId(id);
      setSelectedSubId(null);
      setFadeCategory(false);
    }, 200);
  };

  const handleBackToParents = () => {
    setFadeCategory(true);
    setTimeout(() => {
      setSelectedParentId(null);
      setSelectedSubId(null);
      setFadeCategory(false);
    }, 200);
  };

  const handleSubSelect = (id: number) => {
    setSelectedSubId(id);
  };

  const toggleAttribute = (attrName: string, val: string) => {
    setSelectedAttributes(prev => {
      const current = prev[attrName] || [];
      const updated = current.includes(val) 
        ? current.filter(v => v !== val)
        : [...current, val];
      
      if (updated.length === 0) {
        const copy = { ...prev };
        delete copy[attrName];
        return copy;
      }
      return { ...prev, [attrName]: updated };
    });
  };

  // Frontend Filtering for Attributes
  const filteredProducts = products.filter(p => {
    if (Object.keys(selectedAttributes).length === 0) return true;
    
    return Object.entries(selectedAttributes).every(([attrName, selectedValues]) => {
      if (selectedValues.length === 0) return true;

      // Special Case: Stock
      if (attrName === 'Existencia') {
        const inStock = p.inventory_stocks?.reduce((acc: number, s: any) => acc + s.quantity, 0) > 0;
        const matchesInStock = selectedValues.includes('En stock') && inStock;
        const matchesOutOfStock = selectedValues.includes('Agotado') && !inStock;
        return matchesInStock || matchesOutOfStock;
      }

      // Special Case: Brand
      if (attrName === 'Marca') {
        const brandName = p.brand_relation?.name || p.brand || '';
        return selectedValues.includes(brandName);
      }

      // Technical attributes (JSON)
      let valInTech = false;
      if (p.technical_attributes && p.technical_attributes[attrName] !== undefined) {
        valInTech = selectedValues.includes(String(p.technical_attributes[attrName]));
      }

      // Relational attributes (M2M)
      let valInRelational = false;
      if (p.attribute_values) {
        const parentAttr = globalAttributes.find(a => a.name === attrName);
        if (parentAttr) {
          valInRelational = p.attribute_values.some((v: any) => v.attribute_id === parentAttr.id && selectedValues.includes(v.value));
        }
      }

      return valInTech || valInRelational;
    });
  });

  let parentCats = categories.filter(c => !c.parent_id);
  let subCats = selectedParentId ? categories.filter(c => c.parent_id === selectedParentId) : [];
  const currentParent = categories.find(c => c.id === selectedParentId);

  // If there's an active search, filter the sidebar categories to only show those that have results
  if (search && products.length > 0) {
    const relevantParentIds = new Set<number>();
    const relevantSubIds = new Set<number>();

    products.forEach(p => {
      if (!p.category_id) return;
      const cat = categories.find(c => c.id === p.category_id);
      if (cat) {
        if (cat.parent_id) {
          relevantSubIds.add(cat.id);
          relevantParentIds.add(cat.parent_id);
        } else {
          relevantParentIds.add(cat.id);
        }
      }
    });

    parentCats = parentCats.filter(c => relevantParentIds.has(c.id));
    subCats = subCats.filter(c => relevantSubIds.has(c.id));
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar />

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px' }}>
        
        {search && (
          <div style={{ marginBottom: '30px' }}>
            <h1 style={{ fontSize: '2rem', margin: 0 }}>Resultados para "{search}"</h1>
            <p style={{ color: 'var(--text-muted)' }}>{filteredProducts.length} productos encontrados</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '40px' }}>
          
          {/* Sidebar */}
          <aside>
            <div style={{ 
              background: 'var(--card-bg)', 
              borderRadius: '16px', 
              border: '1px solid var(--card-border)',
              padding: '20px',
              position: 'sticky',
              top: '100px'
            }}>
              
              {/* Category Navigation with Fade Transition */}
              <div style={{ 
                opacity: fadeCategory ? 0 : 1, 
                transform: fadeCategory ? 'translateX(-10px)' : 'translateX(0)', 
                transition: 'all 0.2s ease-out' 
              }}>
                {!selectedParentId ? (
                  <div>
                    <h3 style={{ fontSize: '1.2rem', margin: '0 0 16px 0', borderBottom: '1px solid var(--card-border)', paddingBottom: '8px' }}>Categorías</h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {parentCats.map(cat => (
                        <li 
                          key={cat.id} 
                          onClick={() => handleParentSelect(cat.id)}
                          style={{ 
                            padding: '10px 12px', 
                            borderRadius: '8px', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'transparent',
                            transition: 'background 0.2s'
                          }}
                          onMouseOver={e => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{cat.name}</span>
                          <ChevronRight size={16} color="var(--primary)" />
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
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
                        fontSize: '0.9rem'
                      }}
                      onMouseOver={e => e.currentTarget.style.color = 'var(--primary)'}
                      onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <ChevronLeft size={16} /> Volver a Principal
                    </button>
                    
                    <h3 style={{ fontSize: '1.2rem', margin: '0 0 16px 0', borderBottom: '1px solid var(--card-border)', paddingBottom: '8px', color: 'var(--primary)' }}>
                      {currentParent?.name}
                    </h3>
                    
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <li 
                        onClick={() => handleSubSelect(0)} // 0 = null logic essentially handled manually below
                        style={{ 
                          padding: '8px 12px', 
                          borderRadius: '8px', 
                          cursor: 'pointer',
                          background: selectedSubId === null ? 'var(--primary)' : 'transparent',
                          color: selectedSubId === null ? 'white' : 'var(--foreground)',
                          fontWeight: selectedSubId === null ? 700 : 500,
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={e => { if(selectedSubId !== null) e.currentTarget.style.background = 'var(--card-border)' }}
                        onMouseOut={e => { if(selectedSubId !== null) e.currentTarget.style.background = 'transparent' }}
                      >
                        Ver Todo {currentParent?.name}
                      </li>
                      
                      {subCats.map(cat => (
                        <li 
                          key={cat.id} 
                          onClick={() => handleSubSelect(cat.id)}
                          style={{ 
                            padding: '8px 12px', 
                            borderRadius: '8px', 
                            cursor: 'pointer',
                            background: selectedSubId === cat.id ? 'var(--primary)' : 'transparent',
                            color: selectedSubId === cat.id ? 'white' : 'var(--foreground)',
                            fontWeight: selectedSubId === cat.id ? 700 : 500,
                            transition: 'background 0.2s'
                          }}
                          onMouseOver={e => { if(selectedSubId !== cat.id) e.currentTarget.style.background = 'var(--card-border)' }}
                          onMouseOut={e => { if(selectedSubId !== cat.id) e.currentTarget.style.background = 'transparent' }}
                        >
                          {cat.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Dynamic Filters (Only when Subcategory selected) */}
              {selectedSubId !== null && availableAttributes.length > 0 && (
                <div style={{ marginTop: '30px', borderTop: '1px solid var(--card-border)', paddingTop: '20px' }}>
                  <h3 style={{ fontSize: '1.1rem', margin: '0 0 16px 0' }}>Filtros Avanzados</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {availableAttributes.map(attr => (
                      <div key={attr.name}>
                        <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                          {attr.name}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {attr.values.map((val: string) => (
                            <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                checked={selectedAttributes[attr.name]?.includes(val) || false}
                                onChange={() => toggleAttribute(attr.name, val)}
                                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                              />
                              {val}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Grid */}
          <div>
            {loadingProducts ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} style={{ height: '350px', background: 'var(--card-border)', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', border: '1px dashed var(--card-border)', borderRadius: '16px' }}>
                No se encontraron productos para esta selección.
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
      `}} />
      <Footer />
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div style={{ padding: '100px', textAlign: 'center', color: 'white' }}>Cargando catálogo...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
