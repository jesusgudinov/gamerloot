"use client";

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/storefront/ProductCard';
import Navbar from '@/components/storefront/Navbar';
import StorefrontCarousel from '@/components/storefront/StorefrontCarousel';

export default function GenericBrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [brand, setBrand] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We would need an endpoint to fetch brand by slug, or fetch all and find.
    // For now, let's fetch products with a search or category logic, or we can just fetch all products and filter by brand slug.
    fetch(`http://127.0.0.1:8000/api/v1/catalog/brands`)
      .then(res => res.json())
      .then(data => {
        const foundBrand = data.find((b: any) => b.slug === slug);
        if (foundBrand) {
          setBrand(foundBrand);
          // In a real scenario we'd query /products?brand_id=...
          // For now let's just fetch all products and filter (mock)
          fetch(`http://127.0.0.1:8000/api/v1/products/?size=50`)
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

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: 'white' }}>Cargando marca...</div>;
  if (!brand) return <div style={{ padding: '100px', textAlign: 'center', color: 'white' }}>Marca no encontrada</div>;

  if (brand.has_storefront && brand.store_config) {
    const config = brand.store_config;
    const template = config.template_id;

    return (
      <div style={{ minHeight: '100vh', background: 'var(--background)', paddingBottom: '80px' }}>
        <Navbar />
        
        {/* Template A: Hero */}
        {template === 'template_A' && config.hero_banner && (
          <div style={{ position: 'relative', width: '100%', height: '400px', marginBottom: '20px' }}>
            {config.hero_link ? (
              <Link href={config.hero_link} style={{ display: 'block', width: '100%', height: '100%', backgroundImage: `url(${config.hero_banner})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'absolute', top: 0, left: 0 }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)' }} />
                <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'white' }}>
                  <img src={brand.image_url} alt={brand.name} style={{ width: '120px', background: 'white', padding: '10px', borderRadius: '12px', marginBottom: '20px' }} />
                  <h1 style={{ fontSize: '3rem', margin: 0, textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>{config.hero_title || `Oficial ${brand.name}`}</h1>
                </div>
              </Link>
            ) : (
              <div style={{ width: '100%', height: '100%', backgroundImage: `url(${config.hero_banner})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'absolute', top: 0, left: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)' }} />
                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: 'white' }}>
                  <img src={brand.image_url} alt={brand.name} style={{ width: '120px', background: 'white', padding: '10px', borderRadius: '12px', marginBottom: '20px' }} />
                  <h1 style={{ fontSize: '3rem', margin: 0, textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>{config.hero_title || `Oficial ${brand.name}`}</h1>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Template B: Carousel and Banners */}
        {template === 'template_B' && (
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 40px 0 40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
              <img src={brand.image_url} alt={brand.name} style={{ width: '80px', background: 'white', padding: '10px', borderRadius: '12px' }} />
              <h1 style={{ fontSize: '2.5rem', margin: 0, color: 'var(--foreground)' }}>Tienda Oficial {brand.name}</h1>
            </div>
            
            {config.carousel_images && config.carousel_images.split(',').length > 0 && (
              <StorefrontCarousel 
                images={config.carousel_images.split(',').map((u: string) => u.trim()).filter(Boolean)} 
                links={config.carousel_links ? config.carousel_links.split(',').map((u: string) => u.trim()) : []} 
              />
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {config.secondary_banner_1 && (
                config.secondary_banner_1_link ? (
                  <Link href={config.secondary_banner_1_link} style={{ display: 'block', height: '200px', borderRadius: '16px', backgroundImage: `url(${config.secondary_banner_1})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                ) : (
                  <div style={{ height: '200px', borderRadius: '16px', backgroundImage: `url(${config.secondary_banner_1})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                )
              )}
              {config.secondary_banner_2 && (
                config.secondary_banner_2_link ? (
                  <Link href={config.secondary_banner_2_link} style={{ display: 'block', height: '200px', borderRadius: '16px', backgroundImage: `url(${config.secondary_banner_2})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                ) : (
                  <div style={{ height: '200px', borderRadius: '16px', backgroundImage: `url(${config.secondary_banner_2})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                )
              )}
            </div>
          </div>
        )}

        {/* Template C: Multimedia */}
        {template === 'template_C' && (
          <div style={{ background: config.theme_color || '#111', padding: '60px 40px', color: 'white' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
                <img src={brand.image_url} alt={brand.name} style={{ width: '80px', background: 'white', padding: '10px', borderRadius: '12px' }} />
                <h1 style={{ fontSize: '2.5rem', margin: 0 }}>Descubre {brand.name}</h1>
              </div>
              
              {config.youtube_url && (
                <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', aspectRatio: '16/9', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src={config.youtube_url.replace('watch?v=', 'embed/')} 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Product Grid (Common for all templates) */}
        <div style={{ maxWidth: '1400px', margin: '40px auto', padding: '0 40px' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '30px', color: 'var(--foreground)' }}>Todos los Productos</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {products.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', border: '1px dashed var(--card-border)', borderRadius: '16px' }}>
              No hay productos disponibles para esta marca actualmente.
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback a la vista genérica
  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar />
      {/* Generic Header */}
      <div style={{ background: 'var(--card-bg)', borderBottom: '1px solid var(--card-border)', padding: '40px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '24px' }}>
          {brand.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.image_url} alt={brand.name} style={{ width: '100px', height: '100px', objectFit: 'contain', background: 'white', borderRadius: '12px', padding: '10px' }} />
          ) : (
            <div style={{ width: '100px', height: '100px', background: 'var(--input-bg)', borderRadius: '12px' }} />
          )}
          <div>
            <h1 style={{ fontSize: '2.5rem', margin: '0 0 8px 0', color: 'var(--foreground)' }}>Productos {brand.name}</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>{brand.description || `Explora nuestro catálogo de productos ${brand.name}.`}</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '40px auto', display: 'grid', gridTemplateColumns: '250px 1fr', gap: '40px', padding: '0 40px' }}>
        {/* Sidebar (Categories Mock) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', margin: '0 0 16px 0', borderBottom: '1px solid var(--card-border)', paddingBottom: '8px' }}>Categorías</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li>
                <div style={{ color: 'var(--foreground)', fontWeight: 600, cursor: 'pointer' }}>Computadoras</div>
                <ul style={{ listStyle: 'none', padding: '8px 0 0 16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                  <li style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>Laptops Gamer</li>
                  <li style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>PCs de Escritorio</li>
                </ul>
              </li>
              <li>
                <div style={{ color: 'var(--foreground)', fontWeight: 600, cursor: 'pointer' }}>Componentes</div>
              </li>
            </ul>
          </div>
        </div>

        {/* Grid */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ color: 'var(--text-muted)' }}>Mostrando {products.length} productos</div>
            <select style={{ padding: '8px 16px', background: 'var(--card-bg)', color: 'var(--foreground)', border: '1px solid var(--card-border)', borderRadius: '8px', outline: 'none' }}>
              <option>Más recientes</option>
              <option>Precio: Menor a Mayor</option>
              <option>Precio: Mayor a Menor</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          {products.length === 0 && (
             <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', border: '1px dashed var(--card-border)', borderRadius: '16px' }}>
               No hay productos disponibles para esta marca actualmente.
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
