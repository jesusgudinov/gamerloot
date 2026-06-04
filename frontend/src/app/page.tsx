"use client"
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Zap, Tag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import Navbar from '@/components/storefront/Navbar';
import BannerSlider from '@/components/BannerSlider';
import ProductCarousel from '@/components/storefront/ProductCarousel';
import BrandCarousel from '@/components/storefront/BrandCarousel';

export default function Home() {
  const { addToCart, cartCount } = useCart();
  const [banners, setBanners] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [offerProducts, setOfferProducts] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  useEffect(() => {
    // Fetch Banners
    fetch('http://127.0.0.1:8000/api/v1/storefront/banners')
      .then(r => r.json())
      .then(data => setBanners(data || []))
      .catch(e => console.error(e));

    // Fetch Campaigns
    fetch('http://127.0.0.1:8000/api/v1/storefront/campaigns')
      .then(r => r.json())
      .then(data => setCampaigns(data || []))
      .catch(e => console.error(e));

    // Fetch Offer Products (Has Discount)
    fetch('http://127.0.0.1:8000/api/v1/products/?size=16&status=PUBLISHED&has_discount=true')
      .then(r => r.json())
      .then(data => setOfferProducts(data.items || []))
      .catch(e => console.error(e));

    // Fetch Featured Products (is_featured = true)
    fetch('http://127.0.0.1:8000/api/v1/products/?size=16&status=PUBLISHED&is_featured=true')
      .then(r => r.json())
      .then(data => setFeaturedProducts(data.items || []))
      .catch(e => console.error(e));

    // Fetch Brands
    fetch('http://127.0.0.1:8000/api/v1/catalog/brands')
      .then(r => r.json())
      .then(data => setBrands(data.filter((b: any) => b.is_featured) || []))
      .catch(e => console.error(e));
  }, []);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <main style={{ minHeight: '100vh' }}>
      <Navbar />

      {/* Hero / Banners Section */}
      <section className="home-section">
        <BannerSlider banners={banners} />
      </section>

      {/* Featured Brands Carousel */}
      <BrandCarousel brands={brands} />

      {/* Target Style Product Carousels */}
      <section className="home-carousel-section" style={{ marginBottom: '60px' }}>
        {offerProducts.length > 0 && (
          <ProductCarousel 
            title="Ofertas de Locura"
            subtitle="Equipa tu setup con los mejores componentes a precios inigualables."
            bannerImageUrl="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop"
            products={offerProducts} 
            bgColor="#0f172a" 
          />
        )}
        
        {featuredProducts.length > 0 && (
          <ProductCarousel 
            title="Lo Más Vendido"
            subtitle="Nuestros clientes lo prefieren. Únete a la élite del gaming."
            bannerImageUrl="https://images.unsplash.com/photo-1616588589676-62b3bd4ff6d2?q=80&w=2069&auto=format&fit=crop"
            products={featuredProducts} 
            bgColor="#1e1b4b" 
          />
        )}
      </section>


      <style dangerouslySetInnerHTML={{__html: `
        .home-nav {
          padding: 20px 40px;
        }
        .home-section {
          padding: 40px;
        }
        .home-carousel-section {
          padding: 0 40px;
        }
        @media (max-width: 768px) {
          .home-nav {
            padding: 15px 20px;
          }
          .home-section {
            padding: 20px;
          }
          .home-carousel-section {
            padding: 0 20px;
          }
        }
      `}} />
    </main>
  );
}
