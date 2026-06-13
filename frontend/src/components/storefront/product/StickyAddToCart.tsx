"use client";
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { getImageUrl } from '@/utils/imageUrl';

interface StickyAddToCartProps {
  product: any;
  showAfterY?: number;
}

export default function StickyAddToCart({ product, showAfterY = 600 }: StickyAddToCartProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > showAfterY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfterY]);

  if (!isVisible) return null;

  const handleAdd = () => {
    if (isAdding || added || !product) return;
    setIsAdding(true);
    
    addToCart({
      product_id: product.id,
      sku: product.sku,
      name: product.name,
      price: product.discount_price || product.base_price,
      image_url: getImageUrl(product.main_image_url) || '',
      quantity: 1
    });

    setIsAdding(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const formatCurrency = (amount: number) => amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  const finalPrice = product.discount_price || product.base_price;

  return (
    <div className="glass-panel" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'color-mix(in srgb, var(--card-bg) 85%, transparent)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderTop: '1px solid var(--primary)',
      padding: '12px 20px',
      zIndex: 999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
      transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* Luz radial superior */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '30%', height: '1px', background: 'linear-gradient(90deg, transparent, var(--primary), transparent)', opacity: 0.5 }}></div>

      <div style={{ width: '100%', maxWidth: '1200px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '56px', height: '56px', background: '#fff', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--card-border)', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
            {getImageUrl(product.main_image_url) ? (
              <img src={getImageUrl(product.main_image_url)} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
            ) : (
              <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>Sin img</span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '600px' }}>
              {product.name}
            </div>
            {/* Si es necesario mostrar atributos extra, pueden ir aquí */}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ textAlign: 'right', display: 'block' }}>
            {product.discount_price && (
              <div style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '-2px' }}>{formatCurrency(product.base_price)}</div>
            )}
            <div className="text-gradient" style={{ fontSize: '1.4rem', fontWeight: 900 }}>{formatCurrency(finalPrice)}</div>
          </div>
          <button 
            onClick={handleAdd}
            className={`cart-btn ${isAdding ? 'adding' : ''} ${added ? 'added' : ''}`}
            style={{
              padding: '0 32px',
              height: '48px',
              background: added ? '#10b981' : 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: isAdding ? 'default' : 'pointer',
              boxShadow: added ? '0 4px 15px rgba(16, 185, 129, 0.4)' : '0 4px 20px rgba(139, 92, 246, 0.5)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <span className="btn-text" style={{ transition: 'opacity 0.2s', opacity: isAdding ? 0 : 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
              {added ? (
                <><Check size={18} /> Agregado</>
              ) : (
                <><ShoppingCart size={18} /> Agregar al Carrito</>
              )}
            </span>
            {isAdding && (
              <div className="cart-animation-wrapper" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingCart size={20} className="animated-cart" color="#fff" />
                <div className="animated-item" style={{ width: '8px', height: '8px', background: '#fff', borderRadius: '50%', position: 'absolute' }}></div>
              </div>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
