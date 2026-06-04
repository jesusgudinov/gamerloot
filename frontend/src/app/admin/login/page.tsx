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

      const res = await fetch('http://127.0.0.1:8000/api/v1/auth/login', {
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
      const meRes = await fetch('http://127.0.0.1:8000/api/v1/auth/me', {
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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      {/* Mitad Izquierda: Formulario */}
      <div className="login-form-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          
          <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--primary), var(--accent-cyan))', marginBottom: '1rem', color: 'white' }}>
              <Lock size={28} />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--foreground)' }}>
              Panel Administrativo
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Ingresa tus credenciales para acceder a la gestión de tu tienda
            </p>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '12px 16px', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <AlertCircle size={20} />
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                Correo Electrónico
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={20} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@gamerloot.mx"
                  style={{ 
                    width: '100%', padding: '14px 14px 14px 44px', borderRadius: '12px', 
                    border: '1px solid var(--border)', background: 'var(--input-bg)', 
                    color: 'var(--foreground)', fontSize: '1rem', transition: 'border-color 0.2s'
                  }} 
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={20} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{ 
                    width: '100%', padding: '14px 14px 14px 44px', borderRadius: '12px', 
                    border: '1px solid var(--border)', background: 'var(--input-bg)', 
                    color: 'var(--foreground)', fontSize: '1rem', transition: 'border-color 0.2s'
                  }} 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn-primary" 
              style={{ 
                marginTop: '1rem', width: '100%', padding: '14px', borderRadius: '12px', 
                fontSize: '1.05rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
              }}
            >
              {isSubmitting ? 'Verificando...' : <>Acceder <ArrowRight size={20} /></>}
            </button>
          </form>

        </div>
      </div>

      {/* Mitad Derecha: Imagen PC Gaming */}
      <div style={{ flex: 1, position: 'relative', display: 'none' }} className="split-image-container">
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(to right, var(--background) 0%, transparent 10%)' }}></div>
        <Image 
          src="/pc-gaming-bg.png"
          alt="Gamer Loot Setup"
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
        <div style={{ position: 'absolute', bottom: '2rem', right: '2rem', zIndex: 2, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', padding: '1rem 1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, background: 'linear-gradient(90deg, var(--primary), var(--accent-cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Gamer Loot
          </h2>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>El mejor equipo para gamers.</p>
        </div>
      </div>
      
      {/* CSS inyectado para media queries rápidas */}
      <style dangerouslySetInnerHTML={{__html: `
        .login-form-container {
          padding: 2rem;
        }
        @media (min-width: 900px) {
          .split-image-container {
            display: block !important;
          }
        }
        @media (max-width: 768px) {
          .login-form-container {
            padding: 1.5rem;
          }
          .login-form-container h1 {
            font-size: 1.6rem !important;
          }
        }
      `}} />
    </div>
  );
}
