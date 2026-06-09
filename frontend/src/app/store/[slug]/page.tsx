"use client";

import React, { useState, useEffect, use } from 'react';
import ProductCarousel from '@/components/storefront/ProductCarousel';
import ProductCard from '@/components/storefront/ProductCard';
import Navbar from '@/components/storefront/Navbar';

export default function BrandStorefront({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [brand, setBrand] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8000/api/v1/catalog/brands`)
      .then(res => res.json())
      .then(data => {
        const foundBrand = data.find((b: any) => b.slug === slug);
        if (foundBrand) {
          setBrand(foundBrand);
          fetch(`http://localhost:8000/api/v1/products/?size=50`)
            .then(r => r.json())
            .then(pData => {
              setProducts(pData.items.filter((p: any) => p.brand_relation?.slug === slug));
              setLoading(false);
            });
        } else {
          setLoading(false);
        }
      });
  }, [slug]);

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: 'white' }}>Cargando Tienda Exclusiva...</div>;
  if (!brand) return <div style={{ padding: '100px', textAlign: 'center', color: 'white' }}>Tienda no encontrada</div>;

  // Usa config de la DB, si no existe usa defaults genéricos "premium"
  const config = brand.store_config || {};
  const themeColor = config.theme_color || '#1e1b4b'; // Default dark purple/blue
  const bannerUrl = config.banner_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar />
      {/* Huge Premium Banner */}
      <div style={{ position: 'relative', height: '500px', width: '100%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bannerUrl} alt={`${brand.name} Banner`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, rgba(15,23,42,1) 0%, rgba(15,23,42,0.4) 100%)', zIndex: 1 }} />
        
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 20px' }}>
          {brand.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.image_url} alt={brand.name} style={{ width: '200px', height: '100px', objectFit: 'contain', background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }} />
          ) : (
            <h1 style={{ fontSize: '5rem', fontWeight: 900, color: 'white', letterSpacing: '-2px', textShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>{brand.name}</h1>
          )}
          <p style={{ fontSize: '1.5rem', color: '#cbd5e1', maxWidth: '800px', margin: '0 auto', textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
            {brand.description || `Bienvenido a la Tienda Oficial de ${brand.name}`}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '-60px auto 40px auto', position: 'relative', zIndex: 10, padding: '0 40px' }}>
        
        {/* Storefront Navigation */}
        <div style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '20px 40px', display: 'flex', gap: '30px', border: '1px solid var(--card-border)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', marginBottom: '60px' }}>
          <div style={{ fontWeight: 600, color: 'var(--primary)', borderBottom: '2px solid var(--primary)', paddingBottom: '4px', cursor: 'pointer' }}>Inicio</div>
          <div style={{ fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--foreground)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>Lanzamientos</div>
          <div style={{ fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--foreground)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>Mejor Valorados</div>
          <div style={{ fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--foreground)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>Soporte</div>
        </div>

        {/* Featured Products Carousel */}
        {products.length > 0 && (
          <ProductCarousel 
            title={`Lanzamientos ${brand.name}`}
            subtitle="Descubre la tecnología de última generación directamente de los creadores."
            products={products}
            bgColor={themeColor}
          />
        )}
        
        {/* All Products grid inside Storefront */}
        <div style={{ marginTop: '60px' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '30px', color: 'var(--foreground)' }}>Catálogo Completo</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
