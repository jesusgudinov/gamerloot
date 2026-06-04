"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import { Trash2, Plus, Minus, Tag, ArrowRight, Share2, Check } from 'lucide-react';
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
      const res = await fetch(`http://127.0.0.1:8000/api/v1/storefront/validate-coupon?code=${couponInput}`, {
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
      <main style={{ minHeight: '100vh', padding: '60px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>Tu Carrito</h1>
        <p style={{ color: '#94a3b8', fontSize: '1.2rem', marginBottom: '30px' }}>Tu carrito está vacío. ¡Es hora de agregar componentes!</p>
        <Link href="/">
          <button className="btn-primary">Explorar Catálogo</button>
        </Link>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '30px' }}>Tu Carrito</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px', alignItems: 'start' }}>
        
        {/* Lado Izquierdo: Lista de Productos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {items.map((item) => (
            <div key={item.product_id} className="glass-panel" style={{ display: 'flex', gap: '20px', padding: '20px' }}>
              <div style={{ width: '120px', height: '120px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Sin Foto</span>
                )}
              </div>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{item.name}</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Precio unitario: ${formatCurrency(item.price)}</p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(255,255,255,0.05)', padding: '5px', borderRadius: '8px' }}>
                    <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '5px' }}><Minus size={16} /></button>
                    <span style={{ fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '5px' }}><Plus size={16} /></button>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>${formatCurrency(item.price * item.quantity)}</p>
                  </div>
                </div>
              </div>
              
              <button onClick={() => removeFromCart(item.product_id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '10px' }}>
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>

        {/* Resumen de Compra */}
        <div className="glass-panel" style={{ padding: '30px', position: 'sticky', top: '20px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Resumen</h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <span style={{ color: '#94a3b8' }}>Subtotal</span>
            <span>${formatCurrency(cartTotal)}</span>
          </div>

          {/* Sección de Cupón */}
          <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {couponCode ? (
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', padding: '10px 15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#10b981' }}>
                    <Tag size={16} /> <span style={{ fontWeight: 'bold' }}>{couponCode}</span>
                  </div>
                  <span style={{ fontSize: '0.9rem', color: '#10b981' }}>- ${formatCurrency(couponDiscount)}</span>
                </div>
                <button onClick={removeCoupon} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Quitar</button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    placeholder="Código de cupón" 
                    value={couponInput}
                    onChange={e => setCouponInput(e.target.value.toUpperCase())}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'white' }}
                  />
                  <button 
                    onClick={handleApplyCoupon}
                    disabled={isApplying || !couponInput}
                    className="btn-secondary"
                  >
                    Aplicar
                  </button>
                </div>
                {couponError && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '8px' }}>{couponError}</p>}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', fontSize: '1.2rem', fontWeight: 'bold' }}>
            <span>Total (Sin Envío)</span>
            <span>${formatCurrency(finalTotal)}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <button 
              className="btn-primary" 
              style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '10px', fontSize: '1.1rem', padding: '15px' }}
              onClick={() => router.push('/checkout')}
            >
              Ir a Pagar <ArrowRight size={20} />
            </button>

            <button 
              className="btn-secondary" 
              style={{ 
                width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', 
                fontSize: '1rem', padding: '12px', 
                background: isCopied ? 'rgba(16, 185, 129, 0.1)' : 'transparent', 
                color: isCopied ? '#10b981' : '#fff', 
                border: isCopied ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.2)', 
                transition: 'all 0.3s ease' 
              }}
              onClick={handleShareCart}
            >
              {isCopied ? <><Check size={18} /> ¡Enlace Copiado!</> : <><Share2 size={18} /> Compartir Carrito</>}
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
