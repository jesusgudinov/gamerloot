"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Search, X } from 'lucide-react';
import { getImageUrl } from '@/utils/imageUrl';
import { useCart } from '@/context/CartContext';

export default function Navbar() {
  const router = useRouter();
  const { cartCount, cartTotal } = useCart();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live Search effect
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      setIsSearching(true);
      fetch(`http://localhost:8000/api/v1/products/?search=${encodeURIComponent(searchTerm)}&size=5`)
        .then(res => res.json())
        .then(data => {
          setSearchResults(data.items || []);
          setIsSearching(false);
        })
        .catch(() => setIsSearching(false));
    }, 400); // 400ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setShowDropdown(false);
      router.push(`/catalog?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  return (
    <nav style={{ padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)', background: 'var(--background)', position: 'sticky', top: 0, zIndex: 100 }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none' }}>
        <h1 className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Gamer Loot</h1>
      </Link>

      {/* Search Bar (Center) */}
      <div ref={searchRef} style={{ position: 'relative', flex: 1, maxWidth: '500px', margin: '0 20px' }} className="hide-on-mobile">
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', width: '100%', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Search size={18} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Buscar productos, marcas, SKUs..."
            style={{
              width: '100%',
              padding: '12px 40px',
              borderRadius: '24px',
              border: '1px solid var(--card-border)',
              background: 'var(--card-bg)',
              color: 'var(--foreground)',
              outline: 'none',
              fontSize: '0.95rem',
              transition: 'all 0.2s ease',
              boxShadow: showDropdown ? '0 0 0 2px var(--primary)' : 'none'
            }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <X size={18} />
            </button>
          )}
        </form>

        {/* Live Search Dropdown */}
        {showDropdown && (searchTerm.trim() !== '') && (
          <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: '100%', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', overflow: 'hidden', zIndex: 1000 }}>
            {isSearching ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Buscando...</div>
            ) : searchResults.length > 0 ? (
              <div>
                {searchResults.map((product) => (
                  <Link 
                    key={product.id} 
                    href={`/${product.slug}`}
                    onClick={() => setShowDropdown(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Thumbnail */}
                    <div style={{ width: '40px', height: '40px', background: '#fff', borderRadius: '8px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {product.main_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={getImageUrl(product.main_image_url)} alt={product.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      ) : (
                        <div style={{ color: '#94a3b8', fontSize: '0.6rem' }}>Sin img</div>
                      )}
                    </div>
                    {/* Details */}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>${(product.discount_price || product.base_price).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span style={{ fontSize: '0.75rem', color: product.inventory_stocks?.some((s: any) => s.quantity > 0) ? '#10b981' : '#ef4444' }}>
                          {product.inventory_stocks?.some((s: any) => s.quantity > 0) ? 'En Stock' : 'Agotado'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
                <div 
                  onClick={handleSearchSubmit}
                  style={{ padding: '12px', textAlign: 'center', color: '#a78bfa', fontWeight: 600, cursor: 'pointer', background: 'rgba(139, 92, 246, 0.1)' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'}
                >
                  Ver todos los resultados
                </div>
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron resultados para "{searchTerm}"</div>
            )}
          </div>
        )}
      </div>

      {/* Right Side (Cart & Admin) */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <Link href="/configurator" className="hide-on-mobile" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(16, 185, 129, 0.2))', border: '1px solid rgba(139, 92, 246, 0.5)', padding: '8px 16px', borderRadius: '20px', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 0 15px rgba(139, 92, 246, 0.2)', transition: 'all 0.3s ease' }}>
            <span style={{ fontSize: '1.2rem' }}>⚡</span> Arma tu PC
          </div>
        </Link>

        <Link href="/cart" style={{ color: 'var(--foreground)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }} className="hide-on-mobile">
            <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--foreground)' }}>${cartTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style={{ position: 'relative' }}>
            {/* CSS Animation Class 'cart-filled' when items are present */}
            <ShoppingCart size={28} className={cartCount > 0 ? "cart-filled" : ""} color={cartCount > 0 ? "var(--primary)" : "var(--foreground)"} />
            {cartCount > 0 && (
              <span style={{ position: 'absolute', top: '-6px', right: '-8px', background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', border: '2px solid var(--background)' }}>
                {cartCount}
              </span>
            )}
          </div>
        </Link>
        <Link href="/admin/login" className="btn-secondary hide-on-mobile" style={{ fontSize: '0.9rem' }}>Admin</Link>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .hide-on-mobile {
            display: none !important;
          }
          nav {
            padding: 15px 20px !important;
          }
        }
        
        .cart-filled {
          fill: rgba(139, 92, 246, 0.2);
          transition: all 0.3s ease;
        }
        
        .cart-filled:hover {
          transform: scale(1.1);
        }
      `}} />
    </nav>
  );
}
