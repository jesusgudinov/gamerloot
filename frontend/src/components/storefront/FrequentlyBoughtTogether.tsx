"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Check, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface FBTProps {
  mainProduct: any;
  relatedProducts: any[];
}

export default function FrequentlyBoughtTogether({ mainProduct, relatedProducts }: FBTProps) {
  const { addToCart } = useCart();
  
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set(relatedProducts.map(p => p.id)));
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);

  if (!relatedProducts || relatedProducts.length === 0) return null;

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedBundle = [mainProduct, ...relatedProducts.filter(p => selectedIds.has(p.id))];

  const totalBasePrice = selectedBundle.reduce((sum, p) => sum + (p.base_price || 0), 0);
  const totalDiscountPrice = selectedBundle.reduce((sum, p) => sum + (p.discount_price || p.base_price || 0), 0);

  const savingsAmount = totalBasePrice - totalDiscountPrice;
  const savingsPercentage = totalBasePrice > 0 ? Math.round((savingsAmount / totalBasePrice) * 100) : 0;

  const handleAddToCart = () => {
    if (isAdding || added || selectedBundle.length === 0) return;
    setIsAdding(true);

    setTimeout(() => {
      selectedBundle.forEach(p => {
        addToCart({
          product_id: p.id,
          sku: p.sku || '',
          name: p.name,
          price: p.discount_price || p.base_price,
          image_url: p.main_image_url || '',
          quantity: 1
        });
      });
      setIsAdding(false);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }, 600);
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div style={{ 
      margin: '60px 0', padding: '40px', background: 'var(--card-bg)', 
      border: '1px solid var(--primary)', borderRadius: '16px',
      boxShadow: '0 0 20px rgba(139, 92, 246, 0.15)', position: 'relative', overflow: 'hidden'
    }}>
      {/* Luces de Neón sutiles en los bordes */}
      <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px', background: 'linear-gradient(90deg, transparent, var(--primary), transparent)', opacity: 0.8 }}></div>
      
      <h2 style={{ fontSize: '1.6rem', marginBottom: '30px', color: 'var(--foreground)', fontWeight: 700 }}>Comprados juntos habitualmente</h2>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center' }}>
        
        {/* Left Side: Gallery of Cards */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flex: '1 1 auto', overflowX: 'auto', paddingBottom: '10px' }} className="hide-scroll">
          
          {/* Main Product */}
          <div style={{ width: '180px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ position: 'relative', width: '180px', height: '180px', background: '#fff', borderRadius: '12px', padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--primary)', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.2)' }}>
              {/* Checkbox fijo (Main product siempre seleccionado) */}
              <div style={{ position: 'absolute', top: '10px', right: '10px', width: '24px', height: '24px', borderRadius: '6px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, cursor: 'not-allowed', opacity: 0.8 }}>
                <Check size={16} color="#fff" strokeWidth={3} />
              </div>
              <Link href={`/${mainProduct.slug}`}>
                {mainProduct.main_image_url ? (
                    <img src={mainProduct.main_image_url} alt={mainProduct.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Sin Foto</span>
                )}
              </Link>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Link href={`/${mainProduct.slug}`} style={{ textDecoration: 'none', color: 'var(--foreground)', fontSize: '0.95rem', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Este producto: </span>{mainProduct.name}
              </Link>
              <div style={{ fontWeight: 'bold', color: mainProduct.discount_price ? '#10b981' : 'var(--foreground)', fontSize: '1.1rem', marginTop: '4px' }}>
                ${formatCurrency(mainProduct.discount_price || mainProduct.base_price)}
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.map(p => {
            const isSelected = selectedIds.has(p.id);
            return (
              <React.Fragment key={p.id}>
                <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={28} color="var(--text-muted)" style={{ opacity: isSelected ? 1 : 0.4, transition: 'all 0.2s' }} />
                </div>
                
                <div style={{ width: '180px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div 
                    onClick={() => toggleSelection(p.id)}
                    style={{ position: 'relative', width: '180px', height: '180px', background: '#fff', borderRadius: '12px', padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: isSelected ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.2s', opacity: isSelected ? 1 : 0.6 }}
                  >
                    {/* Checkbox Interactivo */}
                    <div style={{ position: 'absolute', top: '10px', right: '10px', width: '24px', height: '24px', borderRadius: '6px', background: isSelected ? 'var(--primary)' : 'transparent', border: isSelected ? 'none' : '2px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                      {isSelected && <Check size={16} color="#fff" strokeWidth={3} />}
                    </div>
                    
                    {p.main_image_url ? (
                        <img src={p.main_image_url} alt={p.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Sin Foto</span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', opacity: isSelected ? 1 : 0.6, transition: 'all 0.2s' }}>
                    <Link href={`/${p.slug}`} style={{ textDecoration: 'none', color: 'var(--primary)', fontSize: '0.95rem', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'} onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}>
                      {p.name}
                    </Link>
                    <div style={{ fontWeight: 'bold', color: p.discount_price ? '#10b981' : 'var(--foreground)', fontSize: '1.1rem', marginTop: '4px' }}>
                      ${formatCurrency(p.discount_price || p.base_price)}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Right Side: Totals & Action */}
        <div style={{ flex: '0 0 320px', display: 'flex', flexDirection: 'column', gap: '15px', paddingLeft: '30px', borderLeft: '1px solid var(--card-border)' }}>
          <div>
            <div style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Precio total:</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '15px' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--foreground)', lineHeight: '1.1' }}>
                ${formatCurrency(totalDiscountPrice)}
              </div>
              {savingsAmount > 0 && (
                <div style={{ fontSize: '1.1rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                  ${formatCurrency(totalBasePrice)}
                </div>
              )}
            </div>
          </div>

          {savingsAmount > 0 ? (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '8px 12px', borderRadius: '8px', color: '#10b981', fontWeight: 600, fontSize: '0.9rem', display: 'inline-block' }}>
              Ahorras ${formatCurrency(savingsAmount)}
            </div>
          ) : (
            <div style={{ height: '32px' }}></div>
          )}

          <button 
            onClick={handleAddToCart}
            disabled={selectedBundle.length === 0}
            style={{
              width: '100%',
              height: '54px',
              borderRadius: '12px',
              background: added ? '#10b981' : 'var(--primary)',
              color: '#fff',
              border: 'none',
              fontSize: '1.1rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: (isAdding || added || selectedBundle.length === 0) ? 'default' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: added ? 'none' : '0 4px 15px rgba(139, 92, 246, 0.4)',
              opacity: selectedBundle.length === 0 ? 0.5 : 1
            }}
          >
            {added ? (
              <><Check size={20} /> ¡Agregados al Carrito!</>
            ) : isAdding ? (
              <div style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            ) : (
              <><ShoppingCart size={20} /> Agregar los {selectedBundle.length} al carrito</>
            )}
          </button>
        </div>

      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scroll::-webkit-scrollbar { display: none; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
