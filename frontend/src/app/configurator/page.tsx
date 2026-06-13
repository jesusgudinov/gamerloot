"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Navbar from '@/components/storefront/Navbar';
import ShareLootModal from '@/components/storefront/ShareLootModal';
import { Layers, Settings, Image as ImageIcon, Truck, CheckCircle2, ChevronRight, X, Heart, ShoppingCart, Filter, Info, ChevronDown, Check, Zap, Cpu, MemoryStick, HardDrive, Fan, ShieldCheck, Gamepad2, AlertCircle, RefreshCw, Smartphone, Monitor, Ban, Share2, Download, Trash2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';

export default function ConfiguratorPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const { addToCart } = useCart();
  const summaryRef = useRef<HTMLDivElement>(null);
  const hiddenReceiptRef = useRef<HTMLDivElement>(null);
  const stepperRef = useRef<HTMLDivElement>(null);
  const activeStepRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeStepRef.current) {
      activeStepRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentStep]);
  
  // Base steps (dynamic required state will be handled below)
  const baseSteps = useMemo(() => [
    { id: 'cpu', label: 'Procesador', categorySlug: 'procesadores', required: true },
    { id: 'air_cooling', label: 'Disipador', categorySlug: 'disipadores', required: false },
    { id: 'liquid_cooling', label: 'Enfriamiento Líquido', categorySlug: 'enfriamientos-liquidos', required: false },
    { id: 'motherboard', label: 'Tarjeta Madre', categorySlug: 'tarjetas-madre', required: true },
    { id: 'ram', label: 'Memoria RAM', categorySlug: 'memorias-ram', required: true },
    { id: 'ssd', label: 'Almacenamiento Primario', categorySlug: 'ssd', required: true },
    { id: 'hdd', label: 'Almacenamiento Extra', categorySlug: 'discos-duros', required: false },
    { id: 'gpu', label: 'Tarjeta de Video', categorySlug: 'tarjetas-de-video', required: false },
    { id: 'psu', label: 'Fuente de Poder', categorySlug: 'fuentes-de-poder', required: false },
    { id: 'case', label: 'Gabinete', categorySlug: 'gabinetes', required: true },
    { id: 'assembly', label: 'Servicio de Ensamble', isVirtual: true, required: true }
  ], []);

  const [selectedProducts, setSelectedProducts] = useState<Record<string, any>>({});
  const [wantsAssembly, setWantsAssembly] = useState<boolean | null>(null);
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  // Filters State
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});

  const downloadReceipt = async () => {
    if (hiddenReceiptRef.current) {
      // html2canvas doesn't always render properly if the element is hidden with display:none.
      // We position it absolute and off-screen instead.
      const canvas = await html2canvas(hiddenReceiptRef.current, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: '#06070B', // Solid background for premium look
      });
      const link = document.createElement('a');
      link.download = 'mi-epic-loot.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  // Dinámicamente calcular requerimientos basados en CPU
  const steps = useMemo(() => {
    return baseSteps.map(s => {
      let isRequired = s.required;
      
      if (s.id === 'air_cooling' || s.id === 'liquid_cooling') {
        const cpu = selectedProducts['cpu'];
        if (cpu) {
          let includeType = "";
          cpu.attributes?.forEach((a: any) => {
            if (a.name.toLowerCase().includes("incluye disipador")) {
              includeType = a.value.toLowerCase();
            }
          });
          
          if (includeType.includes("requiere")) {
            if (s.id === 'liquid_cooling' && !selectedProducts['air_cooling']) {
              isRequired = true;
            } else {
              isRequired = false;
            }
          } else {
            isRequired = false;
          }
        } else {
          isRequired = false;
        }
      }
      return { ...s, required: isRequired };
    });
  }, [baseSteps, selectedProducts]);

  const step = steps[currentStep];

  useEffect(() => {
    if (step.isVirtual) {
      setProducts([]);
      setActiveFilters({});
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setActiveFilters({});

    const selectedIds = Object.entries(selectedProducts)
      .filter(([sId]) => {
        if (step.id === 'liquid_cooling' && sId === 'air_cooling') return false;
        if (step.id === 'air_cooling' && sId === 'liquid_cooling') return false;
        if (sId === step.id) return false;
        return true;
      })
      .map(([_, p]: [string, any]) => p.id);

    fetch('http://localhost:8000/api/v1/configurator/compatible-products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category_slug: step.categorySlug,
        selected_product_ids: selectedIds
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
  }, [currentStep, selectedProducts]);

  const handleRemoveComponent = (sId: string) => {
    setSelectedProducts(prev => {
      const copy = { ...prev };
      delete copy[sId];
      return copy;
    });
    const idx = steps.findIndex(s => s.id === sId);
    if (idx >= 0) setCurrentStep(idx);
  };

  const handleSelectProduct = (product: any) => {
    if (step.id === 'liquid_cooling' && selectedProducts['air_cooling']) {
      if (!window.confirm('Ya tienes un Disipador por aire seleccionado. ¿Deseas reemplazarlo por este Enfriamiento Líquido?')) return;
    }
    if (step.id === 'air_cooling' && selectedProducts['liquid_cooling']) {
      if (!window.confirm('Ya tienes un Enfriamiento Líquido seleccionado. ¿Deseas reemplazarlo por este Disipador por aire?')) return;
    }

    setSelectedProducts(prev => {
      const copy = { ...prev, [step.id]: product };
      if (step.id === 'liquid_cooling') delete copy['air_cooling'];
      if (step.id === 'air_cooling') delete copy['liquid_cooling'];
      return copy;
    });
    nextStep();
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  };
  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };


  const handleAddToCart = () => {
    Object.values(selectedProducts).forEach((product: any) => {
      addToCart({
        product_id: product.id,
        sku: product.slug || '',
        name: product.name,
        price: product.price || 0,
        image_url: product.images?.[0] || '',
        quantity: 1
      });
    });

    if (wantsAssembly) {
      addToCart({
        product_id: 999999, // ID ficticio para el servicio
        sku: 'ensamblaje-gratis',
        name: 'Servicio de Ensamblaje Profesional',
        price: 0,
        image_url: '',
        quantity: 1
      });
    }
    router.push('/cart');
  };

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
        
        <div ref={stepperRef} className="glass-panel" style={{ padding: '20px', borderRadius: '16px', overflowX: 'auto', display: 'flex', gap: '20px', alignItems: 'center', scrollbarWidth: 'none' }}>
          {steps.map((s, idx) => {
            const isCompleted = selectedProducts[s.id] || (s.isVirtual && wantsAssembly !== null);
            const isSkipped = !isCompleted && currentStep > idx;
            const isActive = currentStep === idx;
            
            let statusIcon = idx + 1;
            let statusColor = isActive ? 'var(--primary)' : 'var(--card-border)';
            if (isCompleted) {
              statusIcon = <CheckCircle2 size={16} />;
              statusColor = '#10b981';
            } else if (isSkipped) {
              statusIcon = <Ban size={16} />;
              statusColor = '#eab308';
            }

            return (
              <div 
                key={s.id} 
                ref={isActive ? activeStepRef : null}
                onClick={() => { if (isCompleted || isSkipped || isActive || idx < currentStep) setCurrentStep(idx); }}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '10px', 
                  opacity: (isCompleted || isSkipped || isActive) ? 1 : 0.4,
                  cursor: (isCompleted || isSkipped || isActive || idx < currentStep) ? 'pointer' : 'not-allowed',
                  padding: '8px 16px',
                  borderRadius: '30px',
                  background: isActive ? 'rgba(139,92,246,0.1)' : 'transparent',
                  border: isActive ? '1px solid rgba(139,92,246,0.2)' : '1px solid transparent',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: statusColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.9rem', fontWeight: 'bold', transition: 'background 0.3s ease' }}>
                  {statusIcon}
                </div>
                <span style={{ fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--primary)' : (isSkipped ? '#eab308' : 'inherit'), fontSize: '0.95rem', transition: 'color 0.3s ease' }}>{s.label}</span>
              </div>
            );
          })}
        </div>

        <div className="configurator-layout">
          
          <aside className="configurator-sidebar-left">
            <div className="glass-panel" style={{ padding: '24px', position: 'sticky', top: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--accent-cyan)' }}></div>
              <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)', filter: 'blur(20px)', pointerEvents: 'none', zIndex: 0 }}></div>
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.2rem', marginBottom: '20px', color: 'var(--text-color)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px', fontWeight: 600 }}>
                  <div style={{ padding: '8px', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '10px' }}>
                    <Filter size={20} color="var(--accent-cyan)" />
                  </div>
                  Filtros Activos
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
            </div>
          </aside>

          <section className="configurator-main">
            <div className="glass-panel" style={{ padding: '30px', minHeight: '600px', display: 'flex', flexDirection: 'column', position: 'relative', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--primary)' }}></div>
              <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }}></div>
              
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h1 style={{ fontSize: '2.2rem', margin: '0 0 8px 0', background: 'linear-gradient(135deg, #fff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>
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
              </div>
            </div>
          </section>

          <aside>
            <div ref={summaryRef} className="glass-panel summary-panel" style={{ padding: '24px', position: 'sticky', top: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#10b981' }}></div>
              <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none', zIndex: 0 }}></div>
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
                  <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px' }}>
                    <ShoppingCart size={20} color="#10b981" />
                  </div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 600 }}>Tu Ensamble</h2>
                </div>
                
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
                      onClick={downloadReceipt}
                      className="btn-secondary"
                      style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '1rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: '8px', background: 'rgba(139,92,246,0.1)', border: '1px solid var(--primary)', color: 'var(--primary)', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '16px' }}
                    >
                      <Download size={18} /> Descargar Imagen
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

      {/* HIDDEN RECEIPT FOR HTML2CANVAS EXPORT */}
      <div style={{ position: 'absolute', top: '-10000px', left: '-10000px', width: '1000px' }}>
        <div 
          ref={hiddenReceiptRef} 
          style={{ 
            width: '1000px', 
            background: '#06070B', // Solid color to prevent blur artifacts in html2canvas
            color: '#ffffff', 
            fontFamily: 'sans-serif',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Faux Grid Background & Solid Accents */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '400px', background: 'radial-gradient(ellipse at top, rgba(139, 92, 246, 0.15), transparent 70%)', zIndex: 0 }}></div>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '100%', backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px', zIndex: 0 }}></div>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '8px', height: '100%', background: 'linear-gradient(180deg, #a855f7, #06b6d4, #10b981)', zIndex: 1 }}></div>

          {/* Header */}
          <div style={{ position: 'relative', zIndex: 2, padding: '50px 60px 40px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div>
              <div style={{ display: 'inline-block', padding: '6px 12px', background: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.4)', borderRadius: '20px', color: '#a855f7', fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '15px' }}>
                CONFIGURACIÓN VERIFICADA
              </div>
              <h1 style={{ fontSize: '3.5rem', fontWeight: 900, margin: '0 0 10px 0', color: '#fff', letterSpacing: '-1px' }}>MI EPIC LOOT</h1>
              <p style={{ color: '#94a3b8', fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                Construido en <strong style={{ color: '#fff' }}>GamerLoot.com</strong>
              </p>
            </div>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'right', minWidth: '150px' }}>
                <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Consumo</p>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}><Zap size={24} /> {totalWatts}W</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'right', minWidth: '150px' }}>
                <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Componentes</p>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}><Layers size={24} /> {steps.filter(s => !s.isVirtual && selectedProducts[s.id]).length}</p>
              </div>
            </div>
          </div>

          {/* Component Grid */}
          <div style={{ position: 'relative', zIndex: 2, padding: '40px 60px', flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
              {steps.map(s => {
                if (s.isVirtual) return null;
                const item = selectedProducts[s.id];
                if (!item) return null; // Only show selected items on export
                
                return (
                  <div key={s.id} style={{ display: 'flex', gap: '20px', alignItems: 'center', background: '#0f172a', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                    <div style={{ width: '80px', height: '80px', background: '#1e293b', borderRadius: '12px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                      {item.images?.[0] ? (
                         <img src={item.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                         <ImageIcon size={30} color="#475569" />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.8rem', color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', fontWeight: 700 }}>{s.label}</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.name}
                      </div>
                      <div style={{ marginTop: '8px', fontWeight: 800, fontSize: '1.2rem', color: '#a855f7' }}>
                        ${item.price.toLocaleString('es-MX')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Totals */}
          <div style={{ position: 'relative', zIndex: 2, background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.1))', padding: '40px 60px', borderTop: '2px solid rgba(16, 185, 129, 0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
            <div>
              <p style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                <CheckCircle2 size={22} /> {wantsAssembly ? 'Ensamblaje Profesional Incluido' : 'Componentes por separado'}
              </p>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '1rem' }}>Cotización válida en tienda en línea.</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 5px 0', color: '#94a3b8', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Inversión Total</p>
              <div style={{ fontSize: '3.5rem', fontWeight: 900, color: '#fff', textShadow: '0 4px 20px rgba(16, 185, 129, 0.4)' }}>
                ${total.toLocaleString('es-MX')}
              </div>
            </div>
          </div>
        </div>
      </div>

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
