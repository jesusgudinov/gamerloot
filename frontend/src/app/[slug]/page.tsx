"use client";
import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ShoppingCart, Heart, Check, ShieldCheck, Truck, RotateCcw, Star, ChevronRight, ChevronLeft, Share2, BarChart2, MessageCircleQuestion, Zap } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import Navbar from '@/components/storefront/Navbar';
import ProductCarousel from '@/components/storefront/ProductCarousel';
import Footer from '@/components/storefront/Footer';
import FrequentlyBoughtTogether from '@/components/storefront/FrequentlyBoughtTogether';
import PaymentOptionsModal from '@/components/storefront/product/PaymentOptionsModal';
import ProductAccordion from '@/components/storefront/product/ProductAccordion';
import ProductReviews from '@/components/storefront/product/ProductReviews';
import ProductQA from '@/components/storefront/product/ProductQA';
import StickyAddToCart from '@/components/storefront/product/StickyAddToCart';
import { getImageUrl } from '@/utils/imageUrl';

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const unwrappedParams = use(params);
  const { slug } = unwrappedParams;
  const { addToCart, cartCount } = useCart();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // States for UI
  const [activeImage, setActiveImage] = useState<string>('');
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs'>('desc');
  
  // Animation states
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);

  // Countdown State
  const [timeLeft, setTimeLeft] = useState('');

  // Recommendations
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

  useEffect(() => {
    // 1. Fetch Product
    fetch(`http://localhost:8000/api/v1/products/${slug}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        setActiveImage(getImageUrl(data.main_image_url) || '');
        setLoading(false);
        
        // Setup countdown if needed
        if (data.discount_end_date) {
          const end = new Date(data.discount_end_date).getTime();
          const updateTime = () => {
            const now = new Date().getTime();
            const distance = end - now;
            if (distance < 0) {
              setTimeLeft('Terminada');
            } else {
              const d = Math.floor(distance / (1000 * 60 * 60 * 24));
              const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
              const s = Math.floor((distance % (1000 * 60)) / 1000);
              setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
            }
          };
          updateTime();
          const interval = setInterval(updateTime, 1000);
          return () => clearInterval(interval);
        }
        
        // Save to Recently Viewed in LocalStorage
        saveToRecentlyViewed(data);
        
        // 2. Fetch Related (same category)
        if (data.category_id) {
          fetch(`http://localhost:8000/api/v1/products/?category_id=${data.category_id}&size=10`)
            .then(r => r.json())
            .then(relatedData => {
              // Exclude current and filter by stock
              const withStock = relatedData.items.filter((p: any) => p.id !== data.id && p.inventory_stocks?.some((s: any) => s.quantity > 0));
              setRelatedProducts(withStock);
            });
        }
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
      
    // 3. Load Recently Viewed
    loadRecentlyViewed();
  }, [slug]);

  const saveToRecentlyViewed = (prod: any) => {
    const key = 'gl_recently_viewed';
    let history = JSON.parse(localStorage.getItem(key) || '[]');
    // Remove if exists
    history = history.filter((p: any) => p.id !== prod.id);
    // Add to front
    history.unshift(prod);
    // Keep only last 10
    history = history.slice(0, 10);
    localStorage.setItem(key, JSON.stringify(history));
  };

  const loadRecentlyViewed = () => {
    const key = 'gl_recently_viewed';
    const history = JSON.parse(localStorage.getItem(key) || '[]');
    // Filter out current product, check stock, and ensure it has a valid image
    setRecentlyViewed(history.filter((p: any) => 
      p.slug !== slug && 
      p.inventory_stocks?.some((s: any) => s.quantity > 0) &&
      p.main_image_url &&
      !p.main_image_url.includes('wp-content') &&
      !p.main_image_url.includes('gamerloot.com.mx')
    ));
  };

  const handleAddToCart = () => {
    if (isAdding || added || !product) return;
    setIsAdding(true);
    
    setTimeout(() => {
      addToCart({
        product_id: product.id,
        sku: product.sku || '',
        name: product.name,
        price: product.discount_price || product.base_price,
        image_url: getImageUrl(product.main_image_url) || '',
        quantity: qty
      });
      setIsAdding(false);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }, 600);
  };

  useEffect(() => {
    if (activeImage && product) {
      const g = Array.from(new Set([product.main_image_url, ...(product.image_gallery || [])].filter(Boolean))).map(url => getImageUrl(url)) as string[];
      const idx = g.indexOf(activeImage);
      const el = document.getElementById(`thumb-${idx}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeImage, product]);

  if (loading) {
    return <div style={{ padding: '100px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando producto...</div>;
  }

  if (!product) {
    return <div style={{ padding: '100px', textAlign: 'center', color: 'var(--text-muted)' }}>Producto no encontrado.</div>;
  }

  // Calculate gallery array
  const gallery = Array.from(new Set([product.main_image_url, ...(product.image_gallery || [])].filter(Boolean))).map(url => getImageUrl(url)) as string[];
  const displayRating = product.rating || 0;
  const isAvailable = product.inventory_stocks?.reduce((acc: number, stock: any) => acc + stock.quantity, 0) > 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar />

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px' }}>
        
        {/* Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '30px', flexWrap: 'wrap' }}>
          <Link href="/" className="breadcrumb-link">Inicio</Link>
          <ChevronRight size={14} />
          <Link href="/catalog" className="breadcrumb-link">Catálogo</Link>
          <ChevronRight size={14} />
          {product.category && (
            <>
              <Link href={`/catalog?category=${product.category.id}`} className="breadcrumb-link">{product.category.name}</Link>
              <ChevronRight size={14} />
            </>
          )}
          <span style={{ color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px', fontWeight: 500 }}>{product.name}</span>
        </div>

        {/* 2-Column Product Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '60px', marginBottom: '80px', alignItems: 'start' }}>
          
          {/* Left: Gallery (Sticky) */}
          <div style={{ position: 'sticky', top: '100px', display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
              {/* Main Image */}
              <div style={{ width: '100%', height: '550px', background: '#fff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', overflow: 'hidden', position: 'relative', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)' }}>
                
                {gallery.length > 1 && (
                  <button 
                    onClick={() => {
                      const currentIndex = gallery.indexOf(activeImage);
                      const prevIndex = (currentIndex - 1 + gallery.length) % gallery.length;
                      setActiveImage(gallery[prevIndex]);
                    }}
                    style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', zIndex: 10 }}
                    onMouseOver={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
                  >
                    <ChevronLeft size={24} style={{ marginRight: '2px' }} />
                  </button>
                )}

                {activeImage ? (
                  <img src={activeImage} alt={product.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ color: '#94a3b8' }}>Sin imagen</span>
                )}

                {gallery.length > 1 && (
                  <button 
                    onClick={() => {
                      const currentIndex = gallery.indexOf(activeImage);
                      const nextIndex = (currentIndex + 1) % gallery.length;
                      setActiveImage(gallery[nextIndex]);
                    }}
                    style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', zIndex: 10 }}
                    onMouseOver={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
                  >
                    <ChevronRight size={24} style={{ marginLeft: '2px' }} />
                  </button>
                )}
              </div>
              
              {/* Thumbnails */}
              {gallery.length > 1 && (
                <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }} className="hide-scroll">
                  {gallery.map((imgUrl, idx) => (
                    <div 
                      id={`thumb-${idx}`}
                      key={idx} 
                      onClick={() => setActiveImage(imgUrl)}
                      style={{ 
                        width: '80px', height: '80px', flexShrink: 0, background: '#fff', borderRadius: '8px', 
                        border: `2px solid ${activeImage === imgUrl ? 'var(--primary)' : 'var(--card-border)'}`, 
                        cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: activeImage === imgUrl ? 1 : 0.6, transition: 'all 0.2s'
                      }}
                    >
                      <img src={imgUrl} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Buy Box */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', minWidth: 0, padding: '40px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, width: '4px', height: '100%', background: 'var(--primary)' }}></div>
            
            <div style={{ marginBottom: '16px' }}>
              <Link href={product.brand_relation?.has_storefront ? `/store/${product.brand_relation.slug}` : `/brand/${product.brand_relation?.slug || 'generic'}`} 
                style={{ 
                  color: 'var(--primary)', 
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textTransform: 'uppercase', 
                  letterSpacing: '1px',
                  background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  transition: 'all 0.2s'
                }}
                className="hover-card"
              >
                {product.brand_relation?.name || 'Gamer Loot'}
              </Link>
            </div>
            
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, lineHeight: '1.2', marginBottom: '16px', color: 'var(--foreground)' }}>
              {product.name}
            </h1>

            {/* Stars */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', color: '#eab308' }}>
                {[1,2,3,4,5].map(star => (
                  <Star key={star} size={18} fill={star <= Math.round(displayRating) ? "#eab308" : "none"} strokeWidth={star <= Math.round(displayRating) ? 0 : 1.5} color={star <= Math.round(displayRating) ? undefined : "#cbd5e1"} />
                ))}
              </div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{displayRating} ({product.reviews_count} reseñas)</span>
            </div>

            {/* Price Area */}
            <div style={{ padding: '24px 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
              {product.discount_price ? (
                <>
                  <div style={{ fontSize: '1rem', textDecoration: 'line-through', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    ${Number(product.base_price || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#10b981', lineHeight: '1', textShadow: '0 0 20px rgba(16, 185, 129, 0.3)' }}>
                    ${Number(product.discount_price).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                  {product.discount_end_date && new Date(product.discount_end_date) > new Date() && (
                    <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '12px 16px', borderRadius: '12px' }}>
                      <Zap size={20} color="#eab308" className="pulse-animation" />
                      <div>
                        <div style={{ fontSize: '0.85rem', color: '#eab308', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Oferta Relámpago Termina En:</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--foreground)' }} className="flash-countdown" data-end={product.discount_end_date}>
                          {timeLeft || 'Calculando...'}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: '1' }}>
                  ${Number(product.base_price || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
              )}
              <PaymentOptionsModal price={product.discount_price || product.base_price || 0} />
            </div>

            {/* Action Area */}
            {isAvailable ? (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {/* Quantity */}
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', overflow: 'hidden', height: '54px' }}>
                  <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ padding: '0 16px', background: 'transparent', border: 'none', color: 'var(--foreground)', fontSize: '1.2rem', cursor: 'pointer' }}>-</button>
                  <span style={{ width: '30px', textAlign: 'center', fontWeight: 600 }}>{qty}</span>
                  <button onClick={() => setQty(qty + 1)} style={{ padding: '0 16px', background: 'transparent', border: 'none', color: 'var(--foreground)', fontSize: '1.2rem', cursor: 'pointer' }}>+</button>
                </div>

                {/* Add to Cart Button */}
                <button 
                  onClick={handleAddToCart}
                  className={`cart-btn ${isAdding ? 'adding' : ''} ${added ? 'added' : ''}`}
                  style={{
                    flex: 1,
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
                    cursor: isAdding ? 'default' : 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: added ? '0 4px 15px rgba(16, 185, 129, 0.4)' : '0 4px 15px rgba(139, 92, 246, 0.5)'
                  }}
                >
                  <span className="btn-text" style={{ transition: 'opacity 0.2s', opacity: isAdding ? 0 : 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {added ? (
                      <><Check size={20} /> ¡Agregado al Carrito!</>
                    ) : (
                      <><ShoppingCart size={20} /> Agregar al Carrito</>
                    )}
                  </span>

                  {/* Animation Element */}
                  {isAdding && (
                    <div className="cart-animation-wrapper" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShoppingCart size={24} className="animated-cart" color="#fff" />
                      <div className="animated-item" style={{ width: '10px', height: '10px', background: '#fff', borderRadius: '50%', position: 'absolute' }}></div>
                    </div>
                  )}
                </button>

                {/* Favorites Button */}
                <button 
                  onClick={() => alert('Próximamente: Favoritos')}
                  title="Agregar a Favoritos"
                  style={{ width: '54px', height: '54px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.1)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(236, 72, 153, 0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(236, 72, 153, 0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <Heart size={22} />
                </button>

                {/* Compare Button */}
                <button 
                  onClick={() => alert('Próximamente: Comparativa')}
                  title="Comparar"
                  style={{ width: '54px', height: '54px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.1)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(6, 182, 212, 0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <BarChart2 size={22} />
                </button>

                {/* Share Button */}
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('¡Enlace copiado al portapapeles!');
                  }}
                  title="Compartir"
                  style={{ width: '54px', height: '54px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <Share2 size={22} />
                </button>
              </div>
            ) : (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '16px', borderRadius: '12px', textAlign: 'center', fontWeight: 600 }}>
                Producto Agotado Temporalmente
              </div>
            )}

            {/* Small info */}
            <div style={{ marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
              SKU: {product.sku} <span style={{ margin: '0 8px' }}>|</span> UPC: {product.upc || 'N/A'}
            </div>

            {/* Bodega Tags */}
            {product.inventory_stocks && product.inventory_stocks.filter((s: any) => s.quantity > 0 && s.warehouse).length > 0 && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexWrap: 'wrap' }}>
                {Array.from(new Set(
                  product.inventory_stocks
                    .filter((s: any) => s.quantity > 0 && s.warehouse)
                    .map((s: any) => {
                      const code = s.warehouse.internal_code || '';
                      if (code.includes('CDMX')) return 'Bodega CDMX';
                      if (code.includes('GDL')) return 'Bodega GDL';
                      if (code.includes('MTY')) return 'Bodega MTY';
                      return 'Bodega Foránea';
                    })
                )).map((loc: any, idx: number) => (
                  <span key={idx} style={{ 
                    padding: '6px 12px', 
                    background: 'rgba(139, 92, 246, 0.15)', 
                    border: '1px solid rgba(139, 92, 246, 0.3)', 
                    borderRadius: '8px', 
                    color: 'var(--primary)', 
                    fontSize: '0.85rem', 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Truck size={14} /> Envío desde: {loc}
                  </span>
                ))}
              </div>
            )}

            {/* Badges / Logistics Neon Box */}
            <div style={{ 
              display: 'flex', justifyContent: 'space-between', gap: '15px', marginTop: '30px', padding: '25px',
              background: 'var(--card-bg)', border: '1px solid var(--primary)', borderRadius: '16px',
              boxShadow: '0 0 15px rgba(139, 92, 246, 0.2)', position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, var(--primary), transparent)', opacity: 0.5 }}></div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, var(--primary), transparent)', opacity: 0.5 }}></div>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '10px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={24} color="#10b981" />
                </div>
                <div style={{ fontWeight: 600, color: '#10b981', fontSize: '0.9rem' }}>Pagos Seguros</div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '10px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RotateCcw size={24} color="#3b82f6" />
                </div>
                <div style={{ fontWeight: 600, color: '#3b82f6', fontSize: '0.9rem' }}>30 días de Devolución</div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '10px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Truck size={24} color="var(--primary)" />
                </div>
                <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.9rem' }}>Envío Express</div>
              </div>
            </div>
          </div>
        </div>

        {/* Frecuentemente comprados juntos */}
        {relatedProducts.length > 0 && (
          <FrequentlyBoughtTogether 
            mainProduct={product}
            relatedProducts={relatedProducts.slice(0, 2)}
          />
        )}

        {/* Accordions */}
        <ProductAccordion 
          description={product.description || `<p>${product.short_description || 'Sin descripción detallada.'}</p>`}
          technicalSpecs={product.technical_attributes}
        />

        {/* Preguntas y Respuestas Q&A */}
        <ProductQA productId={product.id} />

        {/* Reseñas Robustas */}
        <ProductReviews productId={product.id} />

        {/* Carousels */}


        {/* Productos Relacionados */}
        {relatedProducts.length > 2 && (
          <ProductCarousel 
            title="Productos Relacionados"
            products={relatedProducts.slice().reverse()}
            bgColor="transparent"
          />
        )}

        {/* Vistos Recientemente */}
        {recentlyViewed.length > 0 && (
          <ProductCarousel 
            title="Vistos Recientemente"
            products={recentlyViewed}
            bgColor="transparent"
          />
        )}

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scroll::-webkit-scrollbar { display: none; }
        
        .breadcrumb-link {
          color: var(--text-muted);
          text-decoration: none;
          padding: 4px 12px;
          border-radius: 16px;
          border: 1px solid transparent;
          background: transparent;
          transition: all 0.2s ease;
          font-weight: 500;
        }
        
        .breadcrumb-link:hover {
          color: var(--primary);
          background: color-mix(in srgb, var(--primary) 15%, transparent);
          border-color: color-mix(in srgb, var(--primary) 30%, transparent);
          font-weight: 600;
        }

        .cart-btn:hover:not(.adding):not(.added) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4) !important;
        }

        .animated-cart {
          animation: cartMove 0.6s ease-in-out forwards;
        }
        .animated-item {
          animation: itemDrop 0.6s ease-in-out forwards;
          opacity: 0;
          top: -15px;
        }

        @keyframes cartMove {
          0% { transform: translateX(-30px); }
          40% { transform: translateX(0px) scale(1.1); }
          60% { transform: translateX(0px) scale(1.1); }
          100% { transform: translateX(30px); opacity: 0; }
        }

        @keyframes itemDrop {
          0% { opacity: 0; transform: translateY(-30px) scale(2); }
          30% { opacity: 1; transform: translateY(-5px) scale(1.2); }
          50% { opacity: 0; transform: translateY(10px) scale(0); }
          100% { opacity: 0; }
        }
      `}} />
      </main>
      <Footer />
      <StickyAddToCart product={product} showAfterY={800} />
    </div>
  );
}
