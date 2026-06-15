"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Send, ShieldCheck, Zap, Crosshair, 
  MapPin, Phone, Mail, ChevronRight
} from 'lucide-react';
import { FaFacebookF, FaXTwitter, FaInstagram, FaYoutube, FaTwitch, FaCcVisa, FaCcMastercard, FaCcAmex, FaPaypal } from 'react-icons/fa6';
import { SiMercadopago } from 'react-icons/si';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{ 
      background: 'var(--background)',
      position: 'relative',
      overflow: 'hidden',
      marginTop: '80px',
      borderTop: '1px solid rgba(139, 92, 246, 0.2)'
    }}>
      {/* Fondo Arquitectónico (Glows y Mallas) */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', height: '800px', background: 'radial-gradient(ellipse at top, rgba(139, 92, 246, 0.08), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '50px 50px', backgroundPosition: 'center', pointerEvents: 'none', zIndex: 0, opacity: 0.5 }} />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '80px 40px 40px', position: 'relative', zIndex: 10 }}>
        
        {/* Cabecera del Footer: Marca y Newsletter Premium */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '40px', marginBottom: '60px', paddingBottom: '60px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
              <span className="text-gradient" style={{ fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1 }}>
                GAMER LOOT
              </span>
              <span style={{ color: 'var(--primary)', fontWeight: 800, letterSpacing: '6px', textTransform: 'uppercase', fontSize: '0.9rem', marginTop: '12px' }}>
                Equipando a la élite
              </span>
            </Link>
          </div>

          <div style={{ flex: 1, maxWidth: '500px' }}>
            <h4 style={{ color: 'var(--foreground)', fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Zap size={20} color="var(--primary)" /> Boletín Informativo
            </h4>
            <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', gap: '8px', background: 'var(--card-bg)', padding: '8px', borderRadius: '20px', border: '1px solid var(--card-border)', backdropFilter: 'blur(12px)' }}>
              <input 
                type="email" 
                placeholder="Ingresa tu correo..." 
                style={{ 
                  flex: 1, padding: '12px 20px', borderRadius: '14px', 
                  background: 'transparent', border: 'none',
                  color: 'var(--foreground)', outline: 'none', fontSize: '0.95rem'
                }} 
              />
              <button 
                type="button" 
                className="hover-card"
                style={{ 
                  padding: '0 24px', borderRadius: '14px', background: 'var(--primary)', 
                  color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, gap: '8px', transition: 'all 0.3s ease'
                }}
              >
                Suscribirse <Send size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* 4 Columnas de Navegación con Diseño Limpio y Gaming */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '60px', marginBottom: '80px' }}>
          
          {/* Col 1 */}
          <div>
            <h4 style={{ color: 'var(--foreground)', fontSize: '1.1rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '4px', height: '16px', background: 'var(--primary)', borderRadius: '2px', boxShadow: '0 0 10px var(--primary)' }} />
              Explorar
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {['Arma tu PC', 'Lanzamientos', 'Ofertas Épicas', 'Tarjetas de Regalo', 'Nuestro Blog'].map((item, i) => (
                <li key={i}>
                  <Link href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.95rem', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseOver={(e) => { e.currentTarget.style.color = 'var(--foreground)'; e.currentTarget.style.transform = 'translateX(5px)'; }} onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.transform = 'translateX(0)'; }}>
                    <ChevronRight size={14} color="var(--primary)" style={{ opacity: 0.5 }} /> {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 2 */}
          <div>
            <h4 style={{ color: 'var(--foreground)', fontSize: '1.1rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '4px', height: '16px', background: 'var(--primary)', borderRadius: '2px', boxShadow: '0 0 10px var(--primary)' }} />
              Soporte Total
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {['Rastrea tu Loot', 'Garantía de Hardware', 'Devoluciones', 'Centro de Ayuda', 'Políticas de Envío'].map((item, i) => (
                <li key={i}>
                  <Link href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.95rem', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseOver={(e) => { e.currentTarget.style.color = 'var(--foreground)'; e.currentTarget.style.transform = 'translateX(5px)'; }} onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.transform = 'translateX(0)'; }}>
                    <ChevronRight size={14} color="var(--primary)" style={{ opacity: 0.5 }} /> {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 style={{ color: 'var(--foreground)', fontSize: '1.1rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '4px', height: '16px', background: 'var(--primary)', borderRadius: '2px', boxShadow: '0 0 10px var(--primary)' }} />
              Gamer Loot
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {['Sobre Nosotros', 'Programa de Afiliados', 'Patrocinios Esports', 'Inversionistas', 'Contáctanos'].map((item, i) => (
                <li key={i}>
                  <Link href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.95rem', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseOver={(e) => { e.currentTarget.style.color = 'var(--foreground)'; e.currentTarget.style.transform = 'translateX(5px)'; }} onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.transform = 'translateX(0)'; }}>
                    <ChevronRight size={14} color="var(--primary)" style={{ opacity: 0.5 }} /> {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 - Experiencia */}
          <div>
            <h4 style={{ color: 'var(--foreground)', fontSize: '1.1rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '4px', height: '16px', background: 'var(--primary)', borderRadius: '2px', boxShadow: '0 0 10px var(--primary)' }} />
              Directorio
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <MapPin size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>Torre E-Sports, CDMX 01234, Nivel 42</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Phone size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
                <span>+52 (55) 1337-LOOT</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Mail size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
                <span>gg@gamerloot.mx</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Glass Panel (Redes, Pagos, Legal) */}
        <div style={{ 
          background: 'var(--card-bg)', 
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid var(--card-border)',
          borderRadius: '24px',
          padding: '30px 40px',
          display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '30px'
        }}>
          
          {/* Redes Sociales - Esferas Neón */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {[
              { icon: FaTwitch, color: '#9146FF', hoverColor: '#fff' },
              { icon: FaXTwitter, color: '#000000', hoverColor: '#fff' },
              { icon: FaInstagram, color: '#E1306C', hoverColor: '#fff' },
              { icon: FaYoutube, color: '#FF0000', hoverColor: '#fff' },
              { icon: FaFacebookF, color: '#1877F2', hoverColor: '#fff' }
            ].map((social, i) => {
              const Icon = social.icon;
              return (
                <a 
                  key={i} 
                  href="#" 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    width: '40px', height: '40px', borderRadius: '12px', 
                    background: 'var(--card-border)', color: 'var(--foreground)',
                    border: '1px solid var(--card-border)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => { 
                    e.currentTarget.style.background = social.color; 
                    e.currentTarget.style.borderColor = social.color; 
                    e.currentTarget.style.color = social.hoverColor;
                    e.currentTarget.style.boxShadow = `0 0 15px ${social.color}80`; 
                  }}
                  onMouseOut={(e) => { 
                    e.currentTarget.style.background = 'var(--card-border)'; 
                    e.currentTarget.style.borderColor = 'var(--card-border)';
                    e.currentTarget.style.color = 'var(--foreground)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <Icon size={18} />
                </a>
              )
            })}
          </div>

          {/* Pagos - Solo Iconos Grandes */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { name: 'Visa', icon: FaCcVisa },
              { name: 'Mastercard', icon: FaCcMastercard },
              { name: 'Amex', icon: FaCcAmex },
              { name: 'Mercado Pago', icon: SiMercadopago },
              { name: 'PayPal', icon: FaPaypal }
            ].map((payment, i) => {
              const Icon = payment.icon;
              return (
                <div key={i} title={payment.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--foreground)', opacity: 0.6, transition: 'all 0.3s ease', cursor: 'default' }} onMouseOver={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.1)'; }} onMouseOut={e => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.transform = 'scale(1)'; }}>
                  <Icon size={26} />
                </div>
              );
            })}
          </div>

          {/* Legal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <Link href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} onMouseOver={e => e.currentTarget.style.color = 'var(--foreground)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>Privacidad</Link>
              <Link href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} onMouseOver={e => e.currentTarget.style.color = 'var(--foreground)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>Términos</Link>
              <Link href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} onMouseOver={e => e.currentTarget.style.color = 'var(--foreground)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>Cookies</Link>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', opacity: 0.8, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
              <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>Hecho con ❤️ en México</span>
              <span>&copy; {currentYear} Gamer Loot, Inc. All rights reserved.</span>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
