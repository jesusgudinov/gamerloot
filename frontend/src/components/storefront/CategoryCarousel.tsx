"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface StoreCategory {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  icon: string | null;
  image_url: string | null;
  promo_image_url: string | null;
  is_featured: boolean;
}

export default function CategoryCarousel() {
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [showScrollArrows, setShowScrollArrows] = useState({ left: false, right: false });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/catalog/categories')
      .then(res => res.json())
      .then((data: any[]) => {
        // Solo las categorías destacadas (is_featured=true)
        const featured = data.filter(c => c.is_active && c.is_featured);
        setCategories(featured);
      })
      .catch(err => console.error("Error fetching featured categories:", err));
  }, []);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowScrollArrows({
        left: scrollLeft > 0,
        right: scrollLeft < scrollWidth - clientWidth - 1
      });
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [categories]);

  const scrollByAmount = (amount: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  if (categories.length === 0) return null;

  return (
    <section style={{ padding: '60px 40px', maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
      <h2 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '40px', textAlign: 'center' }}>
        Lootea por categoría
      </h2>

      <div style={{ position: 'relative' }}>
        {showScrollArrows.left && (
          <button 
            onClick={() => scrollByAmount(-300)}
            style={{ position: 'absolute', left: '-20px', top: '40%', transform: 'translateY(-50%)', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', zIndex: 10 }}
          >
            <ChevronRight size={24} style={{ transform: 'rotate(180deg)', color: 'var(--foreground)' }} />
          </button>
        )}

        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          style={{ 
            display: 'flex', 
            gap: '32px', 
            overflowX: 'auto', 
            scrollbarWidth: 'none', 
            padding: '20px 0'
          }}
        >
          {categories.map(cat => (
            <Link key={cat.id} href={`/catalog?category=${cat.slug}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', flexShrink: 0, width: '180px' }}>
              <div 
                className="hover-card"
                style={{ 
                  width: '180px', 
                  height: '180px', 
                  borderRadius: '50%', 
                  background: 'var(--card-bg)', 
                  border: '1px solid var(--card-border)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: '0',
                  boxShadow: 'inset 0 0 20px rgba(255,255,255,0.02)'
                }}
              >
                {cat.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img 
                    src={cat.image_url.startsWith('http') ? cat.image_url : `http://localhost:8000${cat.image_url}`} 
                    alt={cat.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} 
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    {cat.icon || cat.name.charAt(0)}
                  </div>
                )}
              </div>
              <span style={{ color: 'var(--foreground)', fontWeight: 700, fontSize: '1rem', textAlign: 'center', transition: 'color 0.2s ease' }}>
                {cat.name}
              </span>
            </Link>
          ))}
        </div>

        {showScrollArrows.right && (
          <button 
            onClick={() => scrollByAmount(300)}
            style={{ position: 'absolute', right: '-20px', top: '40%', transform: 'translateY(-50%)', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', zIndex: 10 }}
          >
            <ChevronRight size={24} style={{ color: 'var(--foreground)' }} />
          </button>
        )}
      </div>
    </section>
  );
}
