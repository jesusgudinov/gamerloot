"use client";
import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface StickyAddToCartProps {
  product: any;
  showAfterY: number; // Pixels to scroll before showing
}

export default function StickyAddToCart({ product, showAfterY = 600 }: StickyAddToCartProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > showAfterY) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfterY]);

  if (!isVisible) return null;

  const handleAdd = () => {
    addToCart({
      product_id: product.id,
      sku: product.sku,
      name: product.name,
      price: product.discount_price || product.base_price,
      image_url: product.main_image_url || '',
      quantity: 1
    });
  };

  const formatCurrency = (amount: number) => amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  const finalPrice = product.discount_price || product.base_price;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'rgba(26, 26, 46, 0.95)',
      backdropFilter: 'blur(10px)',
      borderTop: '1px solid var(--primary)',
      padding: '10px 20px',
      zIndex: 999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 -5px 20px rgba(139, 92, 246, 0.2)',
      transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
      transition: 'transform 0.3s ease-out'
    }}>
      <div style={{ width: '100%', maxWidth: '1200px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '50px', height: '50px', background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
            <img src={product.main_image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '600px' }}>
              {product.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
              {product.discount_price && (
                <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>{formatCurrency(product.base_price)}</span>
              )}
              <span style={{ color: '#10b981', fontWeight: 'bold', display: 'none' }}>{formatCurrency(finalPrice)}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right', display: 'block' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>{formatCurrency(finalPrice)}</div>
          </div>
          <button 
            onClick={handleAdd}
            style={{
              padding: '12px 30px',
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)'
            }}
          >
            <ShoppingCart size={18} /> Agregar al Carrito
          </button>
        </div>

      </div>
    </div>
  );
}
