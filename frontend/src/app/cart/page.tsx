"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import { Trash2, Plus, Minus, Tag, ArrowRight, Share2, Check, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, cartTotal, finalTotal, couponCode, couponDiscount, applyCoupon, removeCoupon } = useCart();
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const router = useRouter();

  const handleShareCart = async () => {
    try {
      const cartData = JSON.stringify(items);
      const encoded = btoa(encodeURIComponent(cartData));
      const shareUrl = `${window.location.origin}/cart/load?data=${encoded}`;
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (e) {
      console.error("Error al compartir carrito", e);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleApplyCoupon = async () => {
    if (!couponInput) return;
    setIsApplying(true);
    setCouponError('');
    
    try {
      const res = await fetch(`http://localhost:8000/api/v1/storefront/validate-coupon?code=${couponInput}`, {
        method: 'POST'
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        setCouponError(errorData.detail || 'Cupón inválido');
        setIsApplying(false);
        return;
      }
      
      const data = await res.json();
      const result = applyCoupon(data.code, data.discount_type, data.discount_value, data.min_purchase_amount);
      
      if (!result.success) {
        setCouponError(result.message);
      } else {
        setCouponInput('');
      }
    } catch (e) {
      setCouponError('Error al validar el cupón');
    }
    
    setIsApplying(false);
  };

  if (items.length === 0) {
    return (
      <main style={{ minHeight: '100vh', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel animate-fade-in-up hover-card" style={{ padding: '60px 40px', textAlign: 'center', maxWidth: '500px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none', zIndex: 0 }}></div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--primary)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <ShoppingCart size={40} />
            </div>
            <h1 style={{ fontSize: '2rem', marginBottom: '15px' }}>Tu Carrito está vacío</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '35px', lineHeight: '1.5' }}>Parece que aún no has agregado ningún componente épico a tu configuración.</p>
            <Link href="/">
              <button className="btn-primary hover-card" style={{ padding: '14px 30px', fontSize: '1.1rem', width: '100%', borderRadius: '12px' }}>Explorar Catálogo</button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .cart-grid { display: grid; grid-template-columns: 1.8fr 1.2fr; gap: 40px; align-items: start; }
        .cart-item { transition: all 0.3s ease; border: 1px solid rgba(255,255,255,0.05); }
        .cart-item:hover { transform: translateY(-4px); box-shadow: 0 10px 30px rgba(0,0,0,0.3); border-color: rgba(139, 92, 246, 0.3); }
        .qty-btn { transition: all 0.2s ease; border-radius: 6px; }
        .qty-btn:hover { background: rgba(255,255,255,0.1) !important; color: #a855f7 !important; transform: scale(1.1); }
        .delete-btn { transition: all 0.2s ease; }
        .delete-btn:hover { background: rgba(239, 68, 68, 0.1) !important; color: #ef4444 !important; border-radius: 8px; }
        
        @media (max-width: 900px) {
          .cart-grid { grid-template-columns: 1fr; }
          .summary-panel { position: static !important; }
        }
        @media (max-width: 500px) {
          .cart-item-content { flex-direction: column !important; gap: 15px !important; }
          .cart-item-actions { width: 100% !important; justify-content: space-between !important; }
        }
      `}} />
      
      <h1 className="animate-fade-in-up" style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)', marginBottom: '30px', fontWeight: 800 }}>
        Tu <span className="text-gradient">Carrito</span>
      </h1>
      
      <div className="cart-grid animate-fade-in-up delay-100">
        
        {/* Lado Izquierdo: Lista de Productos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {items.map((item) => (
            <div key={item.product_id} className="glass-panel cart-item hover-card" style={{ display: 'flex', gap: '20px', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-30px', left: '-30px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', filter: 'blur(15px)', pointerEvents: 'none', zIndex: 0 }}></div>
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', width: '100%', gap: '20px' }}>
                <div style={{ width: '100px', height: '100px', background: 'var(--card-bg)', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10px' }} />
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sin Foto</span>
                  )}
                </div>
                
                <div className="cart-item-content" style={{ flex: 1, display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1, paddingRight: '15px' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', lineHeight: '1.4', fontWeight: 600 }}>{item.name}</h3>
                    <p style={{ color: 'var(--primary)', fontSize: '0.95rem', fontWeight: 600 }}>${formatCurrency(item.price)} <span style={{color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'normal'}}>c/u</span></p>
                  </div>
                  
                  <div className="cart-item-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', minWidth: '130px' }}>
                    <button onClick={() => removeFromCart(item.product_id)} className="delete-btn" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', color: '#ef4444', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Eliminar producto">
                      <Trash2 size={16} />
                    </button>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-color)' }}>${formatCurrency(item.price * item.quantity)}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--card-bg)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} className="qty-btn" style={{ background: 'transparent', border: 'none', color: 'var(--text-color)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={14} /></button>
                        <span style={{ fontWeight: '600', width: '24px', textAlign: 'center', fontSize: '0.95rem' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} className="qty-btn" style={{ background: 'transparent', border: 'none', color: 'var(--text-color)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={14} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Resumen de Compra */}
        <div className="glass-panel summary-panel" style={{ padding: '32px', position: 'sticky', top: '100px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--primary)' }}></div>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none', zIndex: 0 }}></div>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ padding: '8px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '10px' }}>
                <ShoppingCart size={20} color="var(--primary)" />
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 600 }}>Resumen del Pedido</h2>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '1.05rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Subtotal ({items.reduce((a,b)=>a+b.quantity, 0)} productos)</span>
              <span style={{ fontWeight: 600 }}>${formatCurrency(cartTotal)}</span>
            </div>

            {/* Sección de Cupón */}
            <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {couponCode ? (
                <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px 16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'fadeIn 0.3s ease' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', marginBottom: '4px' }}>
                      <Tag size={16} /> <span style={{ fontWeight: 'bold', letterSpacing: '1px' }}>{couponCode}</span>
                    </div>
                    <span style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 500 }}>Descuento: -${formatCurrency(couponDiscount)}</span>
                  </div>
                  <button onClick={removeCoupon} className="delete-btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>Quitar</button>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      placeholder="Código de promoción" 
                      value={couponInput}
                      onChange={e => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                      style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'var(--card-bg)', color: 'white', transition: 'border-color 0.3s ease', outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                    <button 
                      onClick={handleApplyCoupon}
                      disabled={isApplying || !couponInput}
                      className="btn-secondary"
                      style={{ padding: '0 20px', borderRadius: '12px', opacity: (!couponInput || isApplying) ? 0.5 : 1, background: 'var(--card-bg)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      {isApplying ? '...' : 'Aplicar'}
                    </button>
                  </div>
                  {couponError && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>• {couponError}</p>}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
              <span style={{ fontSize: '1.1rem', color: 'var(--text-color)', fontWeight: 600 }}>Total <span style={{fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', fontWeight: 'normal'}}>(Sin Envío)</span></span>
              <span className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>${formatCurrency(finalTotal)}</span>
            </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <button 
              className="btn-primary" 
              style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '12px', fontSize: '1.15rem', padding: '16px', borderRadius: '12px', fontWeight: 600, background: 'linear-gradient(135deg, #a855f7, #6366f1)', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)' }}
              onClick={() => router.push('/checkout')}
            >
              Proceder al Pago <ArrowRight size={22} />
            </button>

            <button 
              className="btn-secondary hover-card" 
              style={{ 
                width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', 
                fontSize: '1rem', padding: '14px', borderRadius: '12px',
                background: isCopied ? 'rgba(16, 185, 129, 0.1)' : 'var(--input-bg)', 
                color: isCopied ? '#10b981' : 'var(--text-color)', 
                border: isCopied ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--input-border)', 
                transition: 'all 0.3s ease' 
              }}
              onClick={handleShareCart}
            >
              {isCopied ? <><Check size={18} /> ¡Enlace Copiado!</> : <><Share2 size={18} /> Compartir Carrito</>}
            </button>
          </div>
        </div>
        </div>
      </div>
    </main>
  );
}
