"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, ChevronDown, ChevronRight, User, Heart, BarChart2, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/context/AuthContext';
import { getImageUrl } from '@/utils/imageUrl';
import DynamicIcon from '@/components/ui/DynamicIcon';

interface StoreCategory {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  icon: string | null;
  image_url: string | null;
  promo_image_url: string | null;
}

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  parents: StoreCategory[];
  getChildren: (parentId: number) => StoreCategory[];
}

export default function MobileMenuDrawer({ isOpen, onClose, parents, getChildren }: MobileMenuDrawerProps) {
  const [openCategory, setOpenCategory] = useState<number | null>(null);
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleCategory = (id: number) => {
    setOpenCategory(prev => prev === id ? null : id);
  };

  return (
    <>
      {/* Overlay */}
      <div 
        onClick={onClose}
        style={{ 
          position: 'fixed', inset: 0, 
          background: 'rgba(0,0,0,0.6)', 
          backdropFilter: 'blur(4px)', 
          zIndex: 999,
          animation: 'fadeIn 0.3s ease'
        }} 
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: '85%', maxWidth: '350px',
        background: 'var(--background)',
        zIndex: 1000,
        overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
        boxShadow: '20px 0 40px rgba(0,0,0,0.5)',
        animation: 'slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}>
        
        {/* Header */}
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)' }}>
          <h2 className="text-gradient" style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>GAMER LOOT</h2>
          <button onClick={onClose} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '50%', padding: '8px', color: 'var(--foreground)', cursor: 'pointer', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        {/* User Quick Actions */}
        <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', borderBottom: '1px solid var(--card-border)' }}>
          <Link href={user ? "/profile" : "/auth/login"} onClick={onClose} style={{ textDecoration: 'none' }}>
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '12px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--foreground)', transition: 'all 0.2s ease' }} onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--card-border)'}>
              {user && user.profile_picture_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={getImageUrl(user.profile_picture_url)} alt="Profile" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <User size={24} color="var(--primary)" />
              )}
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{user ? 'Mi Cuenta' : 'Ingresar'}</span>
            </div>
          </Link>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '12px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--foreground)' }}>
            <Heart size={24} color="#ec4899" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Favoritos</span>
          </div>
        </div>

        {/* Categories Accordion */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {parents.map((parent) => {
            const children = getChildren(parent.id);
            return (
              <div key={parent.id} style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', overflow: 'hidden' }}>
                <button 
                  onClick={() => toggleCategory(parent.id)}
                  style={{ width: '100%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', color: 'var(--foreground)', cursor: 'pointer', fontWeight: 800, fontSize: '1rem' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {parent.icon && (
                      <div style={{ color: 'var(--primary)' }}>
                        <DynamicIcon name={parent.icon} size={20} />
                      </div>
                    )}
                    {parent.name}
                  </div>
                  {openCategory === parent.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                
                {/* Accordion Content */}
                {openCategory === parent.id && (
                  <div style={{ padding: '0 16px 16px 46px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Link
                      href={`/catalog?category=${parent.slug}`}
                      onClick={onClose}
                      style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 700 }}
                    >
                      Ver todo en {parent.name}
                    </Link>
                    {children.map((child) => (
                      <Link 
                        key={child.id} 
                        href={`/catalog?category=${child.slug}`}
                        onClick={onClose}
                        style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Utilities */}
        <div style={{ padding: '20px', borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <BarChart2 size={16} /> Comparar
          </div>
          {mounted && (
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: 'var(--foreground)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
            >
              {theme === 'dark' ? <><Sun size={16} /> Modo Claro</> : <><Moon size={16} /> Modo Oscuro</>}
            </button>
          )}
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}} />
    </>
  );
}
