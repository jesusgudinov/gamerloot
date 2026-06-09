import os

content = """\"use client\";

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/storefront/Navbar';
import ShareLootModal from '@/components/storefront/ShareLootModal';
import { CheckCircle2, ChevronRight, Settings, Zap, ShieldCheck, Cpu, Share2, Trash2, Filter, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';

export default function ConfiguratorPage() {
  const router = useRouter();
  const { addItem } = useCart();
  
  // Base steps (dynamic required state will be handled below)
  const baseSteps = useMemo(() => [
    { id: 'cpu', label: 'Procesador', categorySlug: 'procesadores', required: true },
    { id: 'air_cooling', label: 'Disipador', categorySlug: 'disipadores', required: false },
    { id: 'liquid_cooling', label: 'Enfriamiento Líquido', categorySlug: 'enfriamientos-liquidos', required: false },
    { id: 'motherboard', label: 'Tarjeta Madre', categorySlug: 'tarjetas-madre', required: true },
    { id: 'ram', label: 'Memoria RAM', categorySlug: 'memorias-ram', required: true },
    { id: 'ssd', label: 'Almacenamiento Primario', categorySlug: 'almacenamiento-ssd', required: true },
    { id: 'hdd', label: 'Almacenamiento Extra', categorySlug: 'almacenamiento-hdd', required: false },
    { id: 'gpu', label: 'Tarjeta de Video', categorySlug: 'tarjetas-de-video', required: false },
    { id: 'psu', label: 'Fuente de Poder', categorySlug: 'fuentes-de-poder', required: false },
    { id: 'case', label: 'Gabinete', categorySlug: 'gabinetes', required: true },
    { id: 'assembly', label: 'Servicio de Ensamble', isVirtual: true, required: true }
  ], []);

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, any>>({});
  const [wantsAssembly, setWantsAssembly] = useState<boolean | null>(null);
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  // Filters State
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});

  // Dinámicamente calcular requerimientos basados en CPU
  const steps = useMemo(() => {
    return baseSteps.map(s => {
      let isRequired = s.required;
      
      if (s.id === 'air_cooling' || s.id === 'liquid_cooling') {
        const cpu = selectedProducts['cpu'];
        if (cpu) {
          // Evaluar atributos de "Incluye disipador"
          let includeType = "";
          cpu.attributes?.forEach((a: any) => {
            if (a.name.toLowerCase().includes("incluye disipador")) {
              includeType = a.value.toLowerCase();
            }
          });
          
          if (includeType.includes("requiere")) {
            // Si el CPU requiere disipador, liquid_cooling es obligatorio si NO hay air_cooling
            if (s.id === 'liquid_cooling' && !selectedProducts['air_cooling']) {
              isRequired = true;
            } else {
              isRequired = false;
            }
          } else {
            // Si el CPU incluye disipador
            isRequired = false;
          }
        } else {
          // Si no hay CPU, por defecto opcional para permitir navegación libre si se quiere
          isRequired = false;
        }
      }
      return { ...s, required: isRequired };
    });
  }, [baseSteps, selectedProducts]);

  const step = steps[currentStep];

  // Bidirectional Compatibility Logic:
  // Build accumulated attributes from ALL selected products EXCEPT the current step
  const accumulatedAttributes = useMemo(() => {
    const merged: {name: string, value: string}[] = [];
    
    Object.entries(selectedProducts).forEach(([sId, product]) => {
      if (sId === step.id) return; // Skip current step
      
      product.attributes?.forEach((a: any) => {
        const idx = merged.findIndex(ma => ma.name.toLowerCase() === a.name.toLowerCase());
        if (idx >= 0) {
          // Optional: merge or replace
          merged[idx] = { name: a.name, value: a.value };
        } else {
          merged.push({ name: a.name, value: a.value });
        }
      });
    });
    
    return merged;
  }, [selectedProducts, step]);

  useEffect(() => {
    if (step.isVirtual) {
      setProducts([]);
      setActiveFilters({});
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setActiveFilters({}); // Reset filters when changing steps

    let currentWatts = 0;
    steps.forEach(s => {
      if (s.id === 'psu' || s.isVirtual) return;
      const p = selectedProducts[s.id];
      if (p) currentWatts += (p.estimated_watts || 0);
    });

    fetch('http://127.0.0.1:8000/api/v1/configurator/compatible-products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category_slug: step.categorySlug,
        required_attributes: accumulatedAttributes,
        total_watts_required: currentWatts,
        has_psu_selected: !!selectedProducts['psu']
      })
    })
      .then(res => {
        if (!res.ok) throw new Error("Error fetching products");
        return res.json();
      })
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setErrorMsg('No pudimos cargar los componentes para este paso. Revisa la categoría.');
        setLoading(false);
      });
  }, [currentStep, accumulatedAttributes, selectedProducts['psu']]); // Removed step object to avoid circular dep

  // Remove Component Logic (Cascading clear not needed because of Bi-directional calculation!)
  // If we remove the CPU, the MOBO will just recalculate its attributes without CPU constraints!
  // Wait, if we keep MOBO but remove CPU, the user might pick a different CPU. The new CPU will be constrained by the MOBO. This is EXACTLY what the user wants!
  const handleRemoveComponent = (sId: string) => {
    setSelectedProducts(prev => {
      const copy = { ...prev };
      delete copy[sId];
      return copy;
    });
    // Go back to the step where the component was removed
    const idx = steps.findIndex(s => s.id === sId);
    if (idx >= 0) setCurrentStep(idx);
  };

  const handleSelectProduct = (product: any) => {
    setSelectedProducts(prev => ({ ...prev, [step.id]: product }));
    nextStep();
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  };
  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleAddToCart = () => {
    Object.values(selectedProducts).forEach(product => {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || '',
        quantity: 1,
        slug: product.slug
      });
    });

    if (wantsAssembly) {
      addItem({
        id: 'virtual-assembly-01',
        name: 'Servicio de Ensamblaje Profesional',
        price: 0,
        image: '',
        quantity: 1,
        slug: 'ensamblaje-gratis'
      });
    }
    router.push('/cart');
  };

  // Filter Extraction
  const filterOptions = useMemo(() => {
    const opts: Record<string, Set<string>> = {};
    products.forEach(p => {
      p.attributes?.forEach((a: any) => {
        if (a.is_critical) {
          if (!opts[a.name]) opts[a.name] = new Set();
          opts[a.name].add(a.value);
        }
      });
    });
    
    const finalOpts: Record<string, string[]> = {};
    Object.keys(opts).forEach(k => {
      finalOpts[k] = Array.from(opts[k]).sort();
    });
    return finalOpts;
  }, [products]);

  const toggleFilter = (filterName: string, val: string) => {
    setActiveFilters(prev => {
      const active = prev[filterName] ? [...prev[filterName]] : [];
      if (active.includes(val)) {
        const result = active.filter(x => x !== val);
        return { ...prev, [filterName]: result };
      } else {
        return { ...prev, [filterName]: [...active, val] };
      }
    });
  };

  // Apply Filters
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      let passes = true;
      Object.entries(activeFilters).forEach(([fName, activeVals]) => {
        if (activeVals.length === 0) return;
        
        let pHasMatch = false;
        p.attributes?.forEach((a: any) => {
          if (a.name === fName && activeVals.includes(a.value)) {
            pHasMatch = true;
          }
        });
        if (!pHasMatch) passes = false;
      });
      return passes;
    });
  }, [products, activeFilters]);

  const total = Object.values(selectedProducts).reduce((acc: number, p: any) => acc + (p.price || 0), 0);
  const totalWatts = steps.reduce((acc, s) => {
    if (s.id === 'psu' || s.isVirtual) return acc;
    const p = selectedProducts[s.id];
    return acc + (p?.estimated_watts || 0);
  }, 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--foreground)' }}>
      <Navbar />

      <main style={{ maxWidth: '1600px', margin: '40px auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* TOP STEPPER PROGRESS */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', overflowX: 'auto', display: 'flex', gap: '20px', alignItems: 'center' }}>
          {steps.map((s, idx) => {
            const isCompleted = selectedProducts[s.id] || (s.isVirtual && wantsAssembly !== null);
            const isActive = currentStep === idx;
            return (
              <div 
                key={s.id} 
                onClick={() => { if (isCompleted || isActive || idx < currentStep) setCurrentStep(idx); }}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '10px', 
                  opacity: (isCompleted || isActive) ? 1 : 0.4,
                  cursor: (isCompleted || isActive || idx < currentStep) ? 'pointer' : 'not-allowed',
                  padding: '8px 16px',
                  borderRadius: '30px',
                  background: isActive ? 'rgba(139,92,246,0.1)' : 'transparent',
                  border: isActive ? '1px solid rgba(139,92,246,0.2)' : '1px solid transparent',
                  whiteSpace: 'nowrap'
                }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isCompleted ? '#10b981' : (isActive ? 'var(--primary)' : 'var(--card-border)'), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  {isCompleted ? <CheckCircle2 size={16} /> : idx + 1}
                </div>
                <span style={{ fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--primary)' : 'inherit', fontSize: '0.95rem' }}>{s.label}</span>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 340px', gap: '30px' }}>
          
          {/* Left Sidebar: Filters */}
          <aside>
            <div className="glass-panel" style={{ padding: '24px', position: 'sticky', top: '20px', borderRadius: '16px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', marginBottom: '20px', color: 'var(--primary)', borderBottom: '1px solid var(--card-border)', paddingBottom: '16px' }}>
                <Filter size={20} /> 
                Filtros
              </h2>
              
              {step.isVirtual ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay filtros para este paso.</p>
              ) : Object.keys(filterOptions).length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay filtros críticos disponibles.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxHeight: '600px', overflowY: 'auto', paddingRight: '10px' }}>
                  {Object.entries(filterOptions).map(([fName, options]) => (
                    <div key={fName}>
                      <h4 style={{ fontSize: '0.95rem', marginBottom: '10px', color: 'var(--foreground)' }}>{fName}</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {options.map(opt => (
                          <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                            <input 
                              type="checkbox" 
                              checked={activeFilters[fName]?.includes(opt) || false}
                              onChange={() => toggleFilter(fName, opt)}
                              style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* Center Content: Product Selection */}
          <section>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '2.2rem', margin: '0 0 8px 0', background: 'linear-gradient(135deg, #fff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Elige tu {step.label}
                </h1>
                {!step.isVirtual && <p style={{ color: 'var(--text-muted)' }}>Solo mostramos productos 100% compatibles con tu configuración actual.</p>}
              </div>
              {!step.required && !step.isVirtual && (
                <button onClick={nextStep} className="btn-secondary" style={{ borderRadius: '20px', padding: '6px 16px', border: '1px solid var(--card-border)' }}>
                  Saltar este paso
                </button>
              )}
            </div>

            {step.isVirtual ? (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', borderRadius: '16px' }}>
                <Settings size={48} color="var(--primary)" style={{ margin: '0 auto 20px auto' }} />
                <h2 style={{ marginBottom: '16px', fontSize: '1.8rem' }}>¿Lo quieres ensamblado?</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '30px', maxWidth: '500px', margin: '0 auto 30px auto' }}>
                  Podemos enviar todas las piezas selladas en sus cajas, o puedes aprovechar nuestro servicio de ensamblaje profesional totalmente GRATIS.
                </p>
                
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                  <button 
                    onClick={() => setWantsAssembly(true)}
                    style={{ 
                      padding: '20px 40px', borderRadius: '12px', background: wantsAssembly === true ? 'rgba(16,185,129,0.1)' : 'var(--card-bg)', 
                      border: wantsAssembly === true ? '2px solid #10b981' : '1px solid var(--card-border)', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'
                    }}
                  >
                    <ShieldCheck size={32} color={wantsAssembly === true ? "#10b981" : "var(--foreground)"} />
                    <span style={{ fontWeight: 600 }}>Sí, ensamblar por favor</span>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>GRATIS</span>
                  </button>
                  
                  <button 
                    onClick={() => setWantsAssembly(false)}
                    style={{ 
                      padding: '20px 40px', borderRadius: '12px', background: wantsAssembly === false ? 'rgba(139,92,246,0.1)' : 'var(--card-bg)', 
                      border: wantsAssembly === false ? '2px solid var(--primary)' : '1px solid var(--card-border)', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'
                    }}
                  >
                    <Settings size={32} color={wantsAssembly === false ? "var(--primary)" : "var(--foreground)"} />
                    <span style={{ fontWeight: 600 }}>No, enviarme en piezas</span>
                    <span style={{ color: 'var(--text-muted)' }}>Yo lo ensamblaré</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {loading ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                    {[1,2,3,4,5,6].map(i => <div key={i} style={{ height: '300px', background: 'var(--card-border)', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />)}
                  </div>
                ) : errorMsg ? (
                  <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {errorMsg}
                  </div>
                ) : filteredProducts.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                    {filteredProducts.map(product => (
                      <div key={product.id} style={{ position: 'relative' }}>
                        {selectedProducts[step.id]?.id === product.id && (
                          <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#10b981', color: '#fff', borderRadius: '50%', padding: '4px', zIndex: 10 }}>
                            <CheckCircle2 size={24} />
                          </div>
                        )}
                        <div onClick={() => handleSelectProduct(product)} style={{ cursor: 'pointer', height: '100%' }}>
                          <div style={{ 
                            background: 'var(--card-bg)', borderRadius: '16px', padding: '16px', height: '100%',
                            border: selectedProducts[step.id]?.id === product.id ? '2px solid #10b981' : '1px solid var(--card-border)',
                            transition: 'all 0.2s', display: 'flex', flexDirection: 'column'
                          }} className="hover-card">
                            <img src={product.images?.[0] || 'https://via.placeholder.com/200'} alt={product.name} style={{ width: '100%', height: '180px', objectFit: 'contain', marginBottom: '12px' }} />
                            <h3 style={{ fontSize: '1rem', marginBottom: '8px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{product.name}</h3>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                              <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary)' }}>${product.price.toLocaleString('es-MX')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', borderRadius: '16px' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>No hay piezas compatibles</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Al parecer tu configuración actual es muy restrictiva o no hay stock. Intenta regresar o quitar algún filtro.</p>
                    <button onClick={prevStep} className="btn-secondary" style={{ marginTop: '20px' }}>Volver atrás</button>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Right Sidebar: Build Summary */}
          <aside>
            <div className="glass-panel" style={{ padding: '24px', position: 'sticky', top: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none', zIndex: 0 }}></div>
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '20px', borderBottom: '1px solid var(--card-border)', paddingBottom: '16px' }}>Tu Ensamble</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', minHeight: '300px' }}>
                  {steps.map(s => {
                    if (s.isVirtual) return null;
                    const item = selectedProducts[s.id];
                    return (
                      <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }} className="configurator-item">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                            {item ? item.name : <span style={{ color: 'var(--card-border)' }}>Esperando selección...</span>}
                          </div>
                        </div>
                        {item ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 'bold' }}>${item.price.toLocaleString('es-MX')}</span>
                            <button 
                              onClick={() => handleRemoveComponent(s.id)}
                              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                              className="remove-btn"
                              title="Remover componente"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ fontWeight: 'bold' }}>--</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Estimated Watts */}
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: 600 }}>
                    <Zap size={18} /> Consumo Est.
                  </div>
                  <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>{totalWatts} W</span>
                </div>

                <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '20px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '16px' }}>
                    <span>Total:</span>
                    <span className="text-gradient" style={{ fontSize: '1.8rem' }}>${total.toLocaleString('es-MX')}</span>
                  </div>
                  
                  {wantsAssembly !== null && (
                    <button 
                      onClick={() => setIsShareModalOpen(true)}
                      className="btn-secondary"
                      style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '1rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: '8px', background: 'rgba(139,92,246,0.1)', border: '1px solid var(--primary)', color: 'var(--primary)', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '16px' }}
                    >
                      <Share2 size={18} /> Comparte tu Loot
                    </button>
                  )}
                </div>

                <button 
                  onClick={handleAddToCart}
                  disabled={wantsAssembly === null}
                  className="btn-primary" 
                  style={{ width: '100%', padding: '16px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', boxShadow: '0 0 20px rgba(16,185,129,0.4)', opacity: (currentStep === steps.length - 1 && wantsAssembly !== null) ? 1 : 0.5 }}
                >
                  Agregar al Carrito <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </aside>
        </div>

      </main>

      <ShareLootModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        selectedProducts={selectedProducts} 
        totalPrice={total} 
      />
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.3; }
          100% { opacity: 0.6; }
        }
        .configurator-item .remove-btn {
          opacity: 0;
          transition: opacity 0.2s;
        }
        .configurator-item:hover .remove-btn {
          opacity: 1;
        }
      `}} />
    </div>
  );
}
"""

with open("/Users/rampage/Documents/Gamer Loot Desarrollo/frontend/src/app/configurator/page.tsx", "w") as f:
    f.write(content)
