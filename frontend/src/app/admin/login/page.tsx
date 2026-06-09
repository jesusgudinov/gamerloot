"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const res = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.detail || 'Credenciales incorrectas');
        setIsSubmitting(false);
        return;
      }

      const { access_token } = await res.json();
      
      // Obtener datos del usuario
      const meRes = await fetch('http://localhost:8000/api/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${access_token}` },
        credentials: 'include'
      });
      
      if (meRes.ok) {
        const userData = await meRes.json();
        if (!userData.is_superuser && !userData.role) {
          setError('No tienes permisos para acceder al panel administrativo');
          setIsSubmitting(false);
          return;
        }
        
        login(access_token, userData);
        router.push('/admin');
      } else {
        setError('Error al obtener perfil');
        setIsSubmitting(false);
      }
    } catch (e) {
      setError('Error de conexión con el servidor');
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#050505', position: 'relative', overflow: 'hidden' }}>
      
      {/* Decorative Orbs for the left side background */}
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '40vw', height: '40vw', background: 'rgba(139, 92, 246, 0.15)', filter: 'blur(100px)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '10%', width: '30vw', height: '30vw', background: 'rgba(16, 185, 129, 0.1)', filter: 'blur(100px)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />

      {/* Mitad Izquierda: Formulario */}
      <div className="login-form-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 1, position: 'relative' }}>
        <div className="glass-panel" style={{ 
          width: '100%', maxWidth: '440px', padding: '40px', borderRadius: '24px', 
          background: 'rgba(15, 15, 20, 0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(139, 92, 246, 0.2)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
        }}>
          
          <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
            <div style={{ 
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', 
              borderRadius: '20px', background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(16,185,129,0.2))', 
              border: '1px solid rgba(139,92,246,0.5)', marginBottom: '1.5rem', color: '#fff',
              boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)'
            }}>
              <Lock size={32} />
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0 0 0.5rem 0', background: 'linear-gradient(to right, #fff, #a78bfa)', WebkitBackgroundClip: 'text', color: 'transparent', letterSpacing: '-0.5px' }}>
              Panel Administrativo
            </h1>
            <p style={{ color: '#a1a1aa', margin: 0, fontSize: '0.95rem' }}>
              Ingresa tus credenciales para la gestión del loot
            </p>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '14px 16px', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.3)', boxShadow: '0 0 15px rgba(239, 68, 68, 0.1)' }}>
              <AlertCircle size={20} />
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', color: '#a1a1aa' }}>
                Correo Electrónico
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@gamerloot.mx"
                  className="login-input"
                  style={{ 
                    width: '100%', padding: '16px 16px 16px 48px', borderRadius: '14px', 
                    border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', 
                    color: '#fff', fontSize: '1rem', transition: 'all 0.3s ease', outline: 'none'
                  }} 
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', color: '#a1a1aa' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="login-input"
                  style={{ 
                    width: '100%', padding: '16px 16px 16px 48px', borderRadius: '14px', 
                    border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', 
                    color: '#fff', fontSize: '1rem', transition: 'all 0.3s ease', outline: 'none'
                  }} 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{ 
                marginTop: '1.5rem', width: '100%', padding: '16px', borderRadius: '14px', 
                fontSize: '1.1rem', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
                background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none', color: '#fff', cursor: 'pointer',
                boxShadow: '0 0 25px rgba(139, 92, 246, 0.4)', transition: 'all 0.3s ease',
                opacity: isSubmitting ? 0.7 : 1
              }}
              onMouseOver={(e) => { if(!isSubmitting) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 35px rgba(139, 92, 246, 0.6)'; } }}
              onMouseOut={(e) => { if(!isSubmitting) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 25px rgba(139, 92, 246, 0.4)'; } }}
            >
              {isSubmitting ? 'Iniciando Sistema...' : <>Autorizar Acceso <ArrowRight size={22} /></>}
            </button>
          </form>

        </div>
      </div>

      {/* Mitad Derecha: Imagen PC Gaming */}
      <div style={{ flex: 1, position: 'relative', display: 'none' }} className="split-image-container">
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(to right, #050505 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.5) 100%)' }}></div>
        <Image 
          src="/pc-gaming-bg.png"
          alt="Gamer Loot Setup"
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
        <div style={{ position: 'absolute', bottom: '3rem', right: '3rem', zIndex: 2, background: 'rgba(15, 15, 20, 0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '1.5rem 2rem', borderRadius: '20px', border: '1px solid rgba(139,92,246,0.3)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
          <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, background: 'linear-gradient(90deg, #a78bfa, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-1px' }}>
            Gamer Loot
          </h2>
          <p style={{ margin: '5px 0 0 0', color: '#a1a1aa', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>Command Center</p>
        </div>
      </div>
      
      {/* CSS inyectado para media queries y estados */}
      <style dangerouslySetInnerHTML={{__html: `
        .login-form-container {
          padding: 2rem;
        }
        .login-input:focus {
          border-color: #8b5cf6 !important;
          background: rgba(139, 92, 246, 0.05) !important;
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
        }
        @media (min-width: 1000px) {
          .split-image-container {
            display: block !important;
          }
        }
        @media (max-width: 768px) {
          .login-form-container {
            padding: 1.5rem;
          }
          .glass-panel {
            padding: 30px !important;
          }
        }
      `}} />
    </div>
  );
}
