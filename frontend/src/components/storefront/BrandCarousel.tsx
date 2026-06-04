"use client";

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Brand {
  id: number;
  name: string;
  slug: string;
  image_url: string;
  has_storefront: boolean;
}

interface BrandCarouselProps {
  brands: Brand[];
}

export default function BrandCarousel({ brands }: BrandCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!brands || brands.length === 0) return null;

  const cardWidth = 180;
  const cardGap = 24;
  const itemWidth = cardWidth + cardGap;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const currentScroll = scrollRef.current.scrollLeft;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? currentScroll - itemWidth : currentScroll + itemWidth,
        behavior: 'smooth'
      });
    }
  };

  const scrollTo = (index: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: index * itemWidth,
        behavior: 'smooth'
      });
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const index = Math.round(e.currentTarget.scrollLeft / itemWidth);
    setActiveIndex(index);
  };

  return (
    <section style={{ padding: '0 40px', marginBottom: '80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--foreground)' }}>Marcas Oficiales</h2>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Las mejores marcas de gaming confían en nosotros</div>
      </div>
      
      <div style={{ position: 'relative' }}>
        {/* Navigation Arrows */}
        <button 
          onClick={() => scroll('left')}
          style={{ position: 'absolute', left: '-20px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: '40px', height: '40px', borderRadius: '50%', background: 'var(--card-bg)', color: 'var(--foreground)', border: '1px solid var(--card-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', transition: 'transform 0.2s' }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
        >
          <ChevronLeft size={20} />
        </button>

        <div 
          ref={scrollRef}
          onScroll={handleScroll}
        style={{ 
          display: 'flex', 
          gap: '24px', 
          overflowX: 'auto', 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          paddingTop: '20px',
          paddingBottom: '20px',
          marginTop: '-20px'
        }}
        className="hide-scroll"
      >
        <style dangerouslySetInnerHTML={{__html: `
          .hide-scroll::-webkit-scrollbar { display: none; }
          .brand-card:hover { border-color: var(--primary) !important; transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
        `}} />
        
        {brands.map(brand => (
          <Link 
            key={brand.id} 
            href={brand.has_storefront ? `/store/${brand.slug}` : `/brand/${brand.slug}`}
            style={{ textDecoration: 'none' }}
          >
            <div className="brand-card" style={{ 
              width: '180px', 
              height: '120px', 
              background: 'var(--card-bg)', 
              borderRadius: '16px', 
              border: '1px solid var(--card-border)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '24px',
              transition: 'all 0.3s ease',
              flexShrink: 0
            }}>
              {brand.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={brand.image_url} 
                  alt={brand.name} 
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                />
              ) : (
                <span style={{ fontWeight: 700, color: 'var(--foreground)', textAlign: 'center' }}>{brand.name}</span>
              )}
            </div>
          </Link>
        ))}
        </div>

        <button 
          onClick={() => scroll('right')}
          style={{ position: 'absolute', right: '-20px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: '40px', height: '40px', borderRadius: '50%', background: 'var(--card-bg)', color: 'var(--foreground)', border: '1px solid var(--card-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', transition: 'transform 0.2s' }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Pills / Dots Indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
        {brands.map((_, idx) => {
          const isActive = idx === activeIndex;
          return (
            <div 
              key={idx}
              onClick={() => scrollTo(idx)}
              style={{
                cursor: 'pointer',
                width: isActive ? '32px' : '10px',
                height: '10px',
                borderRadius: '10px',
                background: isActive ? 'var(--primary)' : 'var(--card-border)',
                transition: 'all 0.3s ease'
              }}
            />
          );
        })}
      </div>
    </section>
  );
}
