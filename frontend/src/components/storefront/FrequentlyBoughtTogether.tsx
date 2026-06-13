"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Check, ShoppingCart, Percent } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { getImageUrl } from '@/utils/imageUrl';

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
          price: Number(p.discount_price || p.base_price),
          image_url: getImageUrl(p.main_image_url) || '',
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
    <div className="glass-panel" style={{ 
      margin: '60px 0', padding: '40px', position: 'relative', overflow: 'hidden'
    }}>
      {/* Luces de Neón sutiles en los bordes */}
      <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px', background: 'linear-gradient(90deg, transparent, var(--primary), transparent)', opacity: 0.8 }}></div>
      
      <h2 style={{ fontSize: '1.6rem', marginBottom: '30px', color: 'var(--foreground)', fontWeight: 700 }}>Comprados juntos habitualmente</h2>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center' }}>
        
        {/* Left Side: Gallery of Cards */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flex: '1 1 auto', overflowX: 'auto', paddingBottom: '10px' }} className="hide-scroll">
          
          {/* Main Product */}
          <div style={{ width: '180px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ position: 'relative', width: '180px', height: '180px', background: '#fff', borderRadius: '16px', padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--primary)', boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)' }}>
              {/* Checkbox fijo (Main product siempre seleccionado) */}
              <div style={{ position: 'absolute', top: '10px', right: '10px', width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.2)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(139, 92, 246, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, cursor: 'not-allowed', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                <Check size={18} color="var(--primary)" strokeWidth={3} />
              </div>
              <Link href={`/${mainProduct.slug}`}>
                {mainProduct.main_image_url ? (
                  <img src={getImageUrl(mainProduct.main_image_url)} alt={mainProduct.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Sin Foto</span>
                )}
              </Link>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Link href={`/${mainProduct.slug}`} style={{ textDecoration: 'none', color: 'var(--foreground)', fontSize: '0.95rem', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Este producto: </span>{mainProduct.name}
              </Link>
              <div className="text-gradient" style={{ fontWeight: 800, fontSize: '1.2rem', marginTop: '4px' }}>
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
                    className="hover-card"
                    style={{ position: 'relative', width: '180px', height: '180px', background: '#fff', borderRadius: '16px', padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: isSelected ? '2px solid var(--primary)' : '1px solid var(--card-border)', cursor: 'pointer', transition: 'all 0.2s ease', opacity: isSelected ? 1 : 0.6, boxShadow: isSelected ? '0 4px 20px rgba(139, 92, 246, 0.3)' : 'none' }}
                  >
                    {/* Checkbox Interactivo */}
                    <div style={{ position: 'absolute', top: '10px', right: '10px', width: '28px', height: '28px', borderRadius: '8px', background: isSelected ? 'rgba(139, 92, 246, 0.2)' : 'rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: isSelected ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, transition: 'all 0.2s ease', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                      {isSelected && <Check size={18} color="var(--primary)" strokeWidth={3} />}
                    </div>
                    
                    {p.main_image_url ? (
                      <img src={getImageUrl(p.main_image_url)} alt={p.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Sin Foto</span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', opacity: isSelected ? 1 : 0.6, transition: 'all 0.2s' }}>
                    <Link href={`/${p.slug}`} style={{ textDecoration: 'none', color: 'var(--foreground)', fontSize: '0.95rem', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', transition: 'color 0.2s ease' }} onMouseOver={(e) => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.textDecoration = 'none'; }} onMouseOut={(e) => { e.currentTarget.style.color = 'var(--foreground)'; }}>
                      {p.name}
                    </Link>
                    <div className="text-gradient" style={{ fontWeight: 800, fontSize: '1.2rem', marginTop: '4px' }}>
                      ${formatCurrency(p.discount_price || p.base_price)}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Right Side: Totals & Action */}
        <div style={{ flex: '0 0 320px', display: 'flex', flexDirection: 'column', gap: '15px', paddingLeft: '30px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'var(--primary)', borderRadius: '4px' }}></div>
          <div>
            <div style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Precio total:</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '15px' }}>
              <div className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: '1.1' }}>
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
            className={`cart-btn ${isAdding ? 'adding' : ''} ${added ? 'added' : ''}`}
            style={{
              width: '100%',
              height: '54px',
              borderRadius: '12px',
              background: added ? 'rgba(16, 185, 129, 0.15)' : 'rgba(139, 92, 246, 0.1)',
              color: added ? '#10b981' : '#8b5cf6',
              border: added ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(139, 92, 246, 0.2)',
              fontSize: '1.1rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: (isAdding || added || selectedBundle.length === 0) ? 'default' : 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
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
