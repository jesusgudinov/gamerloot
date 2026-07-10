"use client";

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Zap } from 'lucide-react';
import DynamicIcon from '@/components/ui/DynamicIcon';

interface StoreCategory {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  icon: string | null;
  image_url: string | null;
  promo_image_url: string | null;
  promo_link: string | null;
}

interface MegaMenuProps {
  activeCategory: StoreCategory | null;
  subcategories: StoreCategory[];
  pointerX?: number;
}

export default function MegaMenu({ activeCategory, subcategories, pointerX = 0 }: MegaMenuProps) {
  if (!activeCategory) return null;

  return (
    <>
      <div 
        style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 80px)',
          maxWidth: '1400px',
          marginTop: '10px',
          borderRadius: '16px',
          background: 'var(--card-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--card-border)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          zIndex: 90,
          animation: 'slideDown 0.2s ease-out forwards',
          transformOrigin: 'top center'
        }}
      >
        <div style={{ padding: '40px', display: 'flex', gap: '40px' }}>
        
        {/* Navigation Columns */}
        <div style={{ flex: 1 }}>
          <h4 style={{ color: 'var(--foreground)', fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {activeCategory.icon ? (
              <div style={{ 
                color: '#c4b5fd', 
                background: 'rgba(139, 92, 246, 0.1)', 
                padding: '8px', 
                borderRadius: '10px', 
                flexShrink: 0, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '1px solid rgba(139, 92, 246, 0.2)'
              }}>
                <DynamicIcon name={activeCategory.icon} size={24} />
              </div>
            ) : (
              <div style={{ width: '4px', height: '18px', background: 'var(--primary)', borderRadius: '2px' }} />
            )}
            Explorar {activeCategory.name}
          </h4>
          
          {subcategories.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px 40px' }}>
              {subcategories.map((sub, idx) => (
                <Link 
                  key={idx}
                  href={`/catalog?category=${sub.slug}`}
                  style={{ 
                    color: 'var(--text-muted)', 
                    textDecoration: 'none', 
                    fontSize: '0.95rem', 
                    transition: 'all 0.2s ease', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    padding: '8px 0'
                  }}
                  onMouseOver={(e) => { 
                    e.currentTarget.style.color = 'var(--foreground)'; 
                    e.currentTarget.style.transform = 'translateX(5px)'; 
                  }} 
                  onMouseOut={(e) => { 
                    e.currentTarget.style.color = 'var(--text-muted)'; 
                    e.currentTarget.style.transform = 'translateX(0)'; 
                  }}
                >
                  <ChevronRight size={16} color="var(--primary)" strokeWidth={3} style={{ opacity: 0.7, flexShrink: 0 }} /> 
                  {sub.name}
                </Link>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No hay subcategorías disponibles.</p>
          )}
        </div>

        {/* Featured Card (Promo Image) */}
        {activeCategory.promo_image_url && (
          <div style={{ width: '350px', flexShrink: 0 }}>
            <Link href={activeCategory.promo_link || `/catalog?category=${activeCategory.slug}`} style={{ textDecoration: 'none' }}>
              <div className="hover-card" style={{ 
                height: '100%', 
                minHeight: '250px',
                borderRadius: '16px', 
                overflow: 'hidden', 
                position: 'relative',
                border: '1px solid var(--card-border)'
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={activeCategory.promo_image_url.startsWith('http') ? activeCategory.promo_image_url : `http://localhost:8000${activeCategory.promo_image_url}`} alt="Promo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ 
                  position: 'absolute', inset: 0, 
                  background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
                  padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'
                }}>
                  <span style={{ 
                    background: 'rgba(139, 92, 246, 0.2)',
                    color: '#ddd6fe',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    fontWeight: 800, 
                    textTransform: 'uppercase', 
                    fontSize: '0.7rem', 
                    letterSpacing: '1px', 
                    marginBottom: '12px',
                    display: 'inline-block',
                    width: 'fit-content',
                    backdropFilter: 'blur(4px)'
                  }}>
                    Todo en {activeCategory.name}
                  </span>
                  <h3 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Ver Catálogo
                    <Zap size={20} color="#a855f7" fill="#8b5cf6" style={{ filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.8))' }} />
                  </h3>
                </div>
              </div>
            </Link>
          </div>
        )}

      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px) scaleY(0.95); }
          to { opacity: 1; transform: translateX(-50%) translateY(0) scaleY(1); }
        }
      `}} />
    </div>
    </>
  );
}
