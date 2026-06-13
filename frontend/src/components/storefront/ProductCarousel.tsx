"use client";
import React, { useRef } from 'react';
import ProductCard from './ProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
}

interface ProductCarouselProps {
  title: string;
  subtitle?: string;
  bannerImageUrl?: string;
  products: Product[];
  bgColor?: string;
}

export default function ProductCarousel({ title, subtitle, bannerImageUrl, products, bgColor = "var(--card-bg)" }: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 600; // Scroll width
      const currentScroll = scrollRef.current.scrollLeft;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <div style={{ background: bgColor, borderRadius: '16px', overflow: 'hidden', marginBottom: '40px', border: '1px solid var(--card-border)' }}>
      
      {/* Target-style Header Banner */}
      <div className="carousel-header" style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
        {bannerImageUrl && (
          <img 
            src={bannerImageUrl} 
            alt={title} 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3, zIndex: 0 }} 
          />
        )}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to right, var(--card-bg) 30%, transparent)', zIndex: 1 }} />
        
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h2 className="carousel-title" style={{ fontWeight: 800, color: 'var(--foreground)', marginBottom: '8px', letterSpacing: '-0.5px' }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: '600px' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Carousel Section */}
      <div className="carousel-body" style={{ position: 'relative', background: 'transparent' }}>
        
        {/* Navigation Arrows */}
        <button 
          onClick={() => scroll('left')}
          style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', color: '#0f172a', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', transition: 'transform 0.2s' }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
        >
          <ChevronLeft size={24} />
        </button>
        
        <div 
          ref={scrollRef}
          style={{ 
            display: 'flex', 
            overflowX: 'auto', 
            scrollSnapType: 'x mandatory', 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            padding: '10px 0' 
          }}
          className="hide-scroll carousel-track"
        >
          <style dangerouslySetInnerHTML={{__html: `
            .hide-scroll::-webkit-scrollbar {
              display: none;
            }
          `}} />
          
          {products.map((product, index) => (
            <div key={`${product.id || 'prod'}-${index}`} style={{ scrollSnapAlign: 'start', flexShrink: 0 }}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        <button 
          onClick={() => scroll('right')}
          style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', color: '#0f172a', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', transition: 'transform 0.2s' }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
        >
          <ChevronRight size={24} />
        </button>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .carousel-header {
          min-height: 140px;
          padding: 40px;
        }
        .carousel-title {
          font-size: 2.5rem;
        }
        .carousel-body {
          padding: 30px;
        }
        .carousel-track {
          gap: 20px;
        }
        @media (max-width: 768px) {
          .carousel-header {
            min-height: 100px;
            padding: 20px;
          }
          .carousel-title {
            font-size: 1.8rem;
          }
          .carousel-body {
            padding: 15px;
          }
          .carousel-track {
            gap: 15px;
          }
        }
      `}} />
    </div>
  );
}
