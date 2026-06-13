"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Heart, BarChart2, Star, Check } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface Product {
  id: number;
  slug: string;
  name: string;
  base_price: number;
  discount_price?: number;
  main_image_url?: string;
  brand_relation?: { name: string };
  is_featured?: boolean;
  rating?: number;
  reviews_count?: number;
  inventory_stocks?: { quantity: number }[];
}

import { getImageUrl } from '@/utils/imageUrl';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAdding || added) return;
    
    setIsAdding(true);
    
    // Simulate animation time before actually adding to cart context
    setTimeout(() => {
      addToCart({
        product_id: product.id,
        sku: product.slug || '',
        name: product.name,
        price: product.discount_price || product.base_price,
        image_url: getImageUrl(product.main_image_url) || '',
        quantity: 1
      });
      setIsAdding(false);
      setAdded(true);
      
      // Reset button state after a while
      setTimeout(() => setAdded(false), 2000);
    }, 600); // Wait 600ms for the animation to play out
  };

  const handleAction = (e: React.MouseEvent, actionName: string) => {
    e.preventDefault();
    alert(`La función "${actionName}" estará disponible próximamente.`);
  };

  const displayRating = product.rating || 0;
  const displayReviews = product.reviews_count || 0;

  return (
    <Link href={`/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="product-card group relative flex flex-col justify-between" style={{
        position: 'relative',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(16px)',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Badges */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 10 }}>
          {product.is_featured && (
            <span style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.3)', backdropFilter: 'blur(4px)', fontSize: '0.7rem', fontWeight: 700, padding: '4px 8px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Destacado
            </span>
          )}
          {product.discount_price && (
            <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', backdropFilter: 'blur(4px)', fontSize: '0.7rem', fontWeight: 700, padding: '4px 8px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Oferta
            </span>
          )}
        </div>

        {/* Hover Actions (Favorites / Compare) */}
        <div className="product-actions" style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 10, opacity: 0, transform: 'translateX(10px)', transition: 'all 0.3s ease' }}>
          <button 
            onClick={(e) => handleAction(e, 'Favoritos')}
            style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(4px)' }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(236, 72, 153, 0.2)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(236, 72, 153, 0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
            title="Agregar a Favoritos"
          >
            <Heart size={18} />
          </button>
          <button 
            onClick={(e) => handleAction(e, 'Comparar')}
            style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(4px)' }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(6, 182, 212, 0.2)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
            title="Comparar Producto"
          >
            <BarChart2 size={18} />
          </button>
        </div>

        {/* Image */}
        <div style={{ width: '100%', height: '220px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {product.main_image_url ? (
            <img 
              src={getImageUrl(product.main_image_url)} 
              alt={product.name} 
              style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '20px', transition: 'transform 0.5s ease' }}
              className="product-image"
            />
          ) : (
            <div style={{ color: '#94a3b8' }}>Sin imagen</div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '4px' }}>
            {product.brand_relation?.name || 'Gamer Loot'}
          </div>
          
          <h3 style={{ fontSize: '1rem', color: 'var(--foreground)', fontWeight: 500, marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.4' }}>
            {product.name}
          </h3>

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', color: '#eab308' }}>
              {[1,2,3,4,5].map(star => (
                <Star key={star} size={14} fill={star <= Math.round(displayRating) ? "#eab308" : "none"} strokeWidth={star <= Math.round(displayRating) ? 0 : 1.5} color={star <= Math.round(displayRating) ? undefined : "#cbd5e1"} />
              ))}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({displayReviews})</span>
          </div>

          <div style={{ marginTop: 'auto' }}>
            {product.discount_price ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span className="text-gradient" style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                  ${Number(product.discount_price).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
                <span style={{ fontSize: '0.85rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                  ${Number(product.base_price || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ) : (
              <div className="text-gradient" style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                ${Number(product.base_price || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
            )}
          </div>

          {/* Add to Cart Button */}
          {(!product.inventory_stocks || !product.inventory_stocks.some(stock => stock.quantity > 0)) ? (
            <button 
              disabled
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                background: 'var(--card-border)',
                color: 'var(--text-muted)',
                border: 'none',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'not-allowed'
              }}
            >
              Agotado
            </button>
          ) : (
            <button 
              onClick={handleAddToCart}
              className={`cart-btn ${isAdding ? 'adding' : ''} ${added ? 'added' : ''}`}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                background: added ? 'rgba(16, 185, 129, 0.15)' : 'rgba(139, 92, 246, 0.1)',
                color: added ? '#10b981' : '#8b5cf6',
                border: added ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(139, 92, 246, 0.2)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: isAdding ? 'default' : 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <span className="btn-text" style={{ transition: 'opacity 0.2s', opacity: isAdding ? 0 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {added ? (
                  <><Check size={18} /> ¡Agregado!</>
                ) : (
                  <><ShoppingCart size={18} /> Agregar al carrito</>
                )}
              </span>

              {/* Animation Element */}
              {isAdding && (
                <div className="cart-animation-wrapper" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingCart size={20} className="animated-cart" color={added ? "#fff" : "var(--primary)"} />
                  <div className="animated-item" style={{ width: '8px', height: '8px', background: 'var(--foreground)', borderRadius: '50%', position: 'absolute' }}></div>
                </div>
              )}
            </button>
          )}
        </div>

        {/* Scoped CSS for the card hover and animation */}
        <style dangerouslySetInnerHTML={{__html: `
          .product-card {
            min-width: 240px;
            max-width: 280px;
          }
          .product-card:hover {
            border-color: var(--primary);
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            transform: translateY(-5px);
          }
          .product-card:hover .product-actions {
            opacity: 1 !important;
            transform: translateX(0) !important;
          }
          .product-card:hover .product-image {
            transform: scale(1.05);
          }
          .cart-btn:hover:not(.adding):not(.added) {
            background: rgba(139, 92, 246, 0.2) !important;
            border-color: rgba(139, 92, 246, 0.4) !important;
            color: #a855f7 !important;
            transform: translateY(-2px);
          }
          
          @media (max-width: 768px) {
            .product-card {
              min-width: calc(50vw - 35px); /* 50% de la pantalla menos el padding y gap */
              max-width: none;
            }
          }

          /* Cart Animation Keyframes */
          .animated-cart {
            animation: cartMove 0.6s ease-in-out forwards;
          }
          .animated-item {
            animation: itemDrop 0.6s ease-in-out forwards;
            opacity: 0;
            top: -10px;
          }

          @keyframes cartMove {
            0% { transform: translateX(-20px); }
            40% { transform: translateX(0px) scale(1.1); }
            60% { transform: translateX(0px) scale(1.1); }
            100% { transform: translateX(20px); opacity: 0; }
          }

          @keyframes itemDrop {
            0% { opacity: 0; transform: translateY(-20px) scale(2); }
            30% { opacity: 1; transform: translateY(-5px) scale(1); }
            50% { opacity: 0; transform: translateY(5px) scale(0); }
            100% { opacity: 0; }
          }
        `}} />
      </div>
    </Link>
  );
}
