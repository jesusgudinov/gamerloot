"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { ShoppingCart, Search, X, User, Heart, BarChart2, Zap, Moon, Sun, Menu, ChevronDown, ChevronRight, MapPin } from 'lucide-react';
import { getImageUrl } from '@/utils/imageUrl';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import MegaMenu from './navigation/MegaMenu';
import MobileMenuDrawer from './navigation/MobileMenuDrawer';

interface StoreCategory {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  icon: string | null;
  image_url: string | null;
  promo_image_url: string | null;
}

function ShippingLocationWidget({ user }: { user: any }) {
  const [address, setAddress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.id) {
      fetch(`http://localhost:8000/api/v1/addresses/user/${user.id}`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            const defaultAddress = data.find((a: any) => a.is_default) || data[0];
            setAddress(defaultAddress);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user || loading) return null;

  if (!address) {
    return (
      <Link href="/profile/addresses" className="hide-on-mobile hover-card" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--foreground)', cursor: 'pointer', padding: '6px 12px', borderRadius: '8px', textDecoration: 'none', border: '1px solid transparent', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.borderColor = 'var(--card-border)'} onMouseOut={e => e.currentTarget.style.borderColor = 'transparent'}>
        <MapPin size={22} color="var(--foreground)" />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Enviar a {user.full_name?.split(' ')[0] || user.username}</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>Agregar dirección</span>
        </div>
      </Link>
    );
  }

  return (
    <Link href="/profile/addresses" className="hide-on-mobile hover-card" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--foreground)', cursor: 'pointer', padding: '6px 12px', borderRadius: '8px', textDecoration: 'none', border: '1px solid transparent', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.borderColor = 'var(--card-border)'} onMouseOut={e => e.currentTarget.style.borderColor = 'transparent'}>
      <MapPin size={22} color="var(--foreground)" />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Enviar a {user.full_name?.split(' ')[0] || user.username}</span>
        <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>{address.city} {address.zip_code}</span>
      </div>
    </Link>
  );
}

export default function Navbar() {
  const router = useRouter();
  const { cartCount, cartTotal } = useCart();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  
  // Category State
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [activeMegaMenu, setActiveMegaMenu] = useState<StoreCategory | null>(null);
  const [activePointerX, setActivePointerX] = useState<number>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showScrollArrows, setShowScrollArrows] = useState({ left: false, right: false });
  
  const searchRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    fetch('http://localhost:8000/api/v1/catalog/categories')
      .then(res => res.json())
      .then((data: any[]) => {
        // Asumiendo que el backend ahora devuelve show_in_menu
        const visibleCategories = data.filter(c => c.is_active && (c.show_in_menu !== false));
        setCategories(visibleCategories);
      })
      .catch(err => console.error("Error fetching categories:", err));
  }, []);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowScrollArrows({
        left: scrollLeft > 0,
        right: scrollLeft < scrollWidth - clientWidth - 1 // -1 to account for rounding errors
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

  const parentCategories = categories.filter(c => !c.parent_id);
  const getSubcategories = (parentId: number) => categories.filter(c => c.parent_id === parentId);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
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
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setShowSearchDropdown(false);
      router.push(`/catalog?search=${encodeURIComponent(searchTerm)}&status=PUBLISHED`);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowSearchDropdown(false);
  };

  return (
    <>
      <nav 
        ref={navRef}
        onMouseLeave={() => setActiveMegaMenu(null)}
        style={{ 
          display: 'flex', flexDirection: 'column', 
          background: 'var(--background)', position: 'sticky', top: 0, zIndex: 100,
          borderBottom: '1px solid var(--card-border)'
        }}
      >
        {/* ========================================================= */}
        {/* TIER 1: TOP BAR (Utility) */}
        {/* ========================================================= */}
        <div style={{ padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)' }} className="top-bar-padding">
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Hamburger (Mobile Only) */}
            <button 
              className="mobile-only icon-squircle" 
              onClick={() => setIsMobileMenuOpen(true)}
              style={{ background: 'transparent', color: 'var(--foreground)' }}
            >
              <Menu size={28} />
            </button>

            {/* Logo */}
            <Link href="/" style={{ textDecoration: 'none', marginRight: '10px' }}>
              <h1 className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>
                GAMER LOOT
              </h1>
            </Link>

            {/* Shipping Location (Desktop Only, if logged in) */}
            {mounted && <ShippingLocationWidget user={user} />}
          </div>

          {/* Search Bar (Center) */}
          <div ref={searchRef} style={{ position: 'relative', flex: 1, maxWidth: '600px', margin: '0 30px' }} className="hide-on-mobile">
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', width: '100%', position: 'relative' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                placeholder="Buscar componentes, periféricos, laptops..."
                style={{
                  position: 'relative', zIndex: 1, width: '100%', padding: '14px 44px 14px 48px',
                  borderRadius: '24px', border: showSearchDropdown ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid var(--card-border)',
                  background: showSearchDropdown ? 'var(--card-bg)' : 'var(--input-bg)',
                  color: 'var(--foreground)', outline: 'none', fontSize: '0.95rem', transition: 'all 0.3s ease',
                  boxShadow: showSearchDropdown ? '0 0 20px rgba(139, 92, 246, 0.15), inset 0 2px 4px rgba(0,0,0,0.5)' : 'none',
                }}
              />
              <div style={{ 
                position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', 
                color: showSearchDropdown ? 'var(--primary)' : 'var(--text-muted)', zIndex: 10, pointerEvents: 'none', transition: 'all 0.3s'
              }}>
                <Search size={18} />
              </div>
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'var(--card-border)', borderRadius: '50%', padding: '6px', border: 'none', color: 'var(--foreground)', cursor: 'pointer', zIndex: 10 }}
                >
                  <X size={14} />
                </button>
              )}
            </form>

            {/* Live Search Dropdown */}
            {showSearchDropdown && (searchTerm.trim() !== '') && (
              <div className="glass-panel" style={{ position: 'absolute', top: 'calc(100% + 12px)', left: 0, width: '100%', overflow: 'hidden', zIndex: 1000, borderRadius: '16px', border: '1px solid var(--card-border)' }}>
                {isSearching ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Buscando...</div>
                ) : searchResults.length > 0 ? (
                  <div>
                    {searchResults.map((product) => (
                      <Link 
                        key={product.id} 
                        href={`/${product.slug}`}
                        onClick={() => setShowSearchDropdown(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', textDecoration: 'none', borderBottom: '1px solid var(--card-border)', transition: 'all 0.2s ease' }}
                        onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.08)'; e.currentTarget.style.paddingLeft = '24px'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.paddingLeft = '16px'; }}
                      >
                        <div style={{ width: '50px', height: '50px', background: '#fff', borderRadius: '10px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {product.main_image_url ? (
                            <img src={getImageUrl(product.main_image_url)} alt={product.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                          ) : (
                            <div style={{ color: '#94a3b8', fontSize: '0.6rem' }}>Sin img</div>
                          )}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontSize: '0.95rem', color: 'var(--foreground)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</div>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '6px' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)' }}>${(product.discount_price || product.base_price).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                    <div 
                      onClick={handleSearchSubmit}
                      style={{ padding: '16px', textAlign: 'center', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer', background: 'var(--card-bg)', transition: 'background 0.2s ease' }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'var(--card-bg)'}
                    >
                      Ver todos los resultados
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron resultados para "{searchTerm}"</div>
                )}
              </div>
            )}
          </div>

          {/* Right Side (Actions & Cart) */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div className="hide-on-mobile" style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingRight: '16px', borderRight: '1px solid var(--card-border)' }}>
              {mounted && (
                <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="icon-squircle icon-theme" title="Cambiar Tema">
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              )}
              {mounted && (
                <Link href={user ? "/profile" : "/auth/login"} style={{ textDecoration: 'none' }}>
                  <button className="icon-squircle icon-user" title={user ? "Mi Cuenta" : "Iniciar Sesión"} style={{ padding: (user && user.profile_picture_url) ? 0 : undefined, overflow: 'hidden' }}>
                    {user ? (
                      user.profile_picture_url ? <img src={getImageUrl(user.profile_picture_url)} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={18} />
                    ) : (
                      <User size={18} />
                    )}
                  </button>
                </Link>
              )}
            </div>

            <Link href="/cart" className="hover-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderRadius: '14px', transition: 'all 0.2s' }}>
              <div style={{ position: 'relative' }}>
                <ShoppingCart size={22} color="var(--primary)" />
                {cartCount > 0 && (
                  <span style={{ position: 'absolute', top: '-8px', right: '-12px', background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold', border: '2px solid var(--card-bg)' }}>
                    {cartCount}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }} className="hide-on-mobile">
                <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>${cartTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </Link>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TIER 2: NAVIGATION BAR (Categories - Desktop Only) */}
        {/* ========================================================= */}
        <div className="hide-on-mobile" style={{ padding: '0 40px', display: 'flex', alignItems: 'center', gap: '30px', position: 'relative' }}>
          
          <Link href="/configurator" style={{ textDecoration: 'none' }}>
            <div className="hover-card" style={{ background: 'linear-gradient(90deg, #8b5cf6, #a855f7)', padding: '12px 24px', color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.85rem' }}>
              <Zap size={16} /> Arma tu PC
            </div>
          </Link>

          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', minWidth: 0 }}>
            {/* Scroll Arrows */}
            {showScrollArrows.left && (
              <button 
                onClick={() => scrollByAmount(-200)}
                style={{ position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.3)', zIndex: 10 }}
              >
                <ChevronRight size={16} style={{ transform: 'rotate(180deg)', color: 'var(--foreground)' }} />
              </button>
            )}

            <div 
              style={{ 
                display: 'flex', gap: '8px', height: '100%', 
                overflowX: 'auto', scrollbarWidth: 'none', position: 'relative', flex: 1, 
                maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)'
              }}
              ref={scrollRef}
              onScroll={handleScroll}
              onWheel={(e) => {
                if (scrollRef.current) {
                  e.preventDefault();
                  scrollRef.current.scrollLeft += e.deltaY;
                }
              }}
            >
              {parentCategories.map((cat) => (
                <div 
                  key={cat.id}
                  onMouseEnter={(e) => {
                    setActiveMegaMenu(cat);
                    const rect = e.currentTarget.getBoundingClientRect();
                    setActivePointerX(rect.left + rect.width / 2);
                  }}
                  style={{ 
                    padding: '16px 12px', 
                    cursor: 'pointer', 
                    whiteSpace: 'nowrap',
                    color: activeMegaMenu?.id === cat.id ? 'var(--primary)' : 'var(--foreground)',
                    fontWeight: activeMegaMenu?.id === cat.id ? 800 : 600,
                    fontSize: '0.95rem',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    borderBottom: activeMegaMenu?.id === cat.id ? '2px solid var(--primary)' : '2px solid transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {cat.name} <ChevronDown size={14} style={{ transform: activeMegaMenu?.id === cat.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                </div>
              ))}
            </div>

            {showScrollArrows.right && (
              <button 
                onClick={() => scrollByAmount(200)}
                style={{ position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.3)', zIndex: 10 }}
              >
                <ChevronRight size={16} style={{ color: 'var(--foreground)' }} />
              </button>
            )}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '24px', flexShrink: 0 }}>
            <Link href="/blog" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }} onMouseOver={e => e.currentTarget.style.color = 'var(--foreground)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>Blog</Link>
            <Link href="/support" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }} onMouseOver={e => e.currentTarget.style.color = 'var(--foreground)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>Soporte</Link>
          </div>
        </div>

        <div className="hide-on-mobile">
          {activeMegaMenu && activePointerX > 0 && (
            <>
              <div style={{
                position: 'absolute',
                top: '100%',
                left: activePointerX,
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '12px solid transparent',
                borderRight: '12px solid transparent',
                borderBottom: '12px solid var(--card-border)',
                zIndex: 91,
                animation: 'fadeIn 0.2s ease-out forwards'
              }} />
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 1px)',
                left: activePointerX,
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '12px solid transparent',
                borderRight: '12px solid transparent',
                borderBottom: '12px solid var(--card-bg)',
                zIndex: 92,
                animation: 'fadeIn 0.2s ease-out forwards'
              }} />
            </>
          )}
          <MegaMenu 
            activeCategory={activeMegaMenu} 
            subcategories={activeMegaMenu ? getSubcategories(activeMegaMenu.id) : []}
            onMouseLeave={() => setActiveMegaMenu(null)}
            onMouseEnter={() => {}}
            pointerX={activePointerX}
          />
        </div>
      </nav>

      <MobileMenuDrawer 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        parents={parentCategories}
        getChildren={getSubcategories}
      />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(5px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .mobile-only {
          display: none !important;
        }
        @media (max-width: 992px) {
          .hide-on-mobile {
            display: none !important;
          }
          .mobile-only {
            display: flex !important;
          }
          .top-bar-padding {
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

        .icon-user {
          background-color: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
        }
        .icon-user:hover {
          background-color: rgba(139, 92, 246, 0.2);
          transform: translateY(-2px);
        }
      `}} />
    </>
  );
}
