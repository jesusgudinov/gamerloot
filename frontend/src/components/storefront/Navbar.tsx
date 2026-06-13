"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { ShoppingCart, Search, X, User, Heart, BarChart2, Zap, Moon, Sun, Shield } from 'lucide-react';
import { getImageUrl } from '@/utils/imageUrl';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const router = useRouter();
  const { cartCount, cartTotal } = useCart();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      fetch(`http://localhost:8000/api/v1/products/?search=${encodeURIComponent(searchTerm)}&status=PUBLISHED&size=5`)
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
      router.push(`/catalog?search=${encodeURIComponent(searchTerm)}&status=PUBLISHED`);
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
              background: 'var(--input-bg)',
              color: 'var(--input-text)',
              outline: 'none',
              fontSize: '0.95rem',
              transition: 'all 0.3s ease',
              boxShadow: showDropdown ? '0 0 15px rgba(139, 92, 246, 0.2)' : 'inset 0 2px 4px rgba(0,0,0,0.05)',
              backdropFilter: 'blur(8px)'
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
          <div className="glass-panel" style={{ position: 'absolute', top: 'calc(100% + 12px)', left: 0, width: '100%', overflow: 'hidden', zIndex: 1000 }}>
            {isSearching ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Buscando...</div>
            ) : searchResults.length > 0 ? (
              <div>
                {searchResults.map((product) => (
                  <Link 
                    key={product.id} 
                    href={`/${product.slug}`}
                    onClick={() => setShowDropdown(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', borderBottom: '1px solid var(--card-border)', transition: 'all 0.2s ease' }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.08)';
                      e.currentTarget.style.paddingLeft = '20px';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.paddingLeft = '16px';
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{ width: '44px', height: '44px', background: '#fff', borderRadius: '10px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--card-border)' }}>
                      {product.main_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={getImageUrl(product.main_image_url)} alt={product.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      ) : (
                        <div style={{ color: '#94a3b8', fontSize: '0.6rem' }}>Sin img</div>
                      )}
                    </div>
                    {/* Details */}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.9rem', color: 'var(--foreground)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>${(product.discount_price || product.base_price).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: product.inventory_stocks?.some((s: any) => s.quantity > 0) ? '#10b981' : '#ef4444' }}>
                          {product.inventory_stocks?.some((s: any) => s.quantity > 0) ? 'En Stock' : 'Agotado'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
                <div 
                  onClick={handleSearchSubmit}
                  style={{ padding: '14px', textAlign: 'center', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', background: 'rgba(139, 92, 246, 0.05)', borderTop: '1px solid var(--card-border)', transition: 'background 0.2s ease' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)'}
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

      {/* Right Side (Actions & Cart) */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        
        {/* Actions Group (Theme, Compare, Heart, User) */}
        <div className="hide-on-mobile" style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingRight: '20px', borderRight: '1px solid rgba(150,150,150,0.2)' }}>
          
          {mounted && (
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="icon-squircle icon-theme"
              title="Cambiar Tema"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          )}

          <button className="icon-squircle icon-compare" title="Comparar (Próximamente)">
            <BarChart2 size={20} />
          </button>
          <button className="icon-squircle icon-heart" title="Mis Favoritos (Próximamente)">
            <Heart size={20} />
          </button>
          
          {mounted && (
            <Link href={user ? "/profile" : "/auth/login"} style={{ textDecoration: 'none' }}>
              <button 
                className="icon-squircle icon-user" 
                title={user ? "Mi Cuenta" : "Iniciar Sesión"}
                style={{ 
                  background: user ? 'rgba(16, 185, 129, 0.1)' : 'rgba(139, 92, 246, 0.1)', 
                  color: user ? '#10b981' : '#8b5cf6',
                  position: 'relative',
                  overflow: 'hidden',
                  padding: (user && user.profile_picture_url) ? 0 : undefined
                }}
              >
                {user ? (
                  user.profile_picture_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getImageUrl(user.profile_picture_url)} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={20} />
                  )
                ) : (
                  <User size={20} />
                )}
              </button>
            </Link>
          )}
        </div>

        <Link href="/configurator" className="hide-on-mobile" style={{ textDecoration: 'none' }}>
          <div className="hover-card" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.02))', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '10px 20px', borderRadius: '12px', color: 'var(--text-color)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, width: '3px', height: '100%', background: 'var(--primary)' }}></div>
            <Zap size={18} color="var(--primary)" /> Arma tu PC
          </div>
        </Link>

        <Link href="/cart" className="glass-panel hover-card" style={{ color: 'var(--foreground)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 16px', borderRadius: '12px', transition: 'all 0.2s' }}>
          <div style={{ position: 'relative' }}>
            <ShoppingCart size={24} color="var(--text-color)" />
            {cartCount > 0 && (
              <span style={{ position: 'absolute', top: '-8px', right: '-12px', background: 'var(--primary)', color: 'white', padding: '2px 6px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold', border: '2px solid var(--background)', boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)' }}>
                {cartCount}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }} className="hide-on-mobile">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Mi Carrito</span>
            <span className="text-gradient" style={{ fontSize: '1.1rem', fontWeight: 800 }}>${cartTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </Link>
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
        
        .icon-squircle {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }
        
        .icon-theme {
          background-color: var(--card-bg);
          border: 1px solid var(--card-border);
          color: var(--text-color);
        }
        .icon-theme:hover {
          background-color: var(--card-border);
          transform: translateY(-2px);
        }

        .icon-compare {
          background-color: rgba(6, 182, 212, 0.1);
          color: #06b6d4;
        }
        .icon-compare:hover {
          background-color: rgba(6, 182, 212, 0.2);
          transform: translateY(-2px);
        }

        .icon-heart {
          background-color: rgba(236, 72, 153, 0.1);
          color: #ec4899;
        }
        .icon-heart:hover {
          background-color: rgba(236, 72, 153, 0.2);
          transform: translateY(-2px);
        }

        .icon-user {
          background-color: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
        }
        .icon-user:hover {
          background-color: rgba(139, 92, 246, 0.2);
          transform: translateY(-2px);
        }
      `}} />
    </nav>
  );
}
