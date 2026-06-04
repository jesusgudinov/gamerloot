"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Lock, Mail, AlertCircle, ArrowRight, Gamepad2 } from 'lucide-react';

export default function ClientLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      
      // En un flujo real de cliente, guardaríamos el token en un contexto de cliente, no en el de admin.
      // Por simplicidad en MVP lo guardaremos en localStorage y usaremos el mismo auth logic o uno simplificado.
      localStorage.setItem('client_token', access_token);
      
      // Redirigir a la tienda pública o checkout
      router.push('/');
      
    } catch (e) {
      setError('Error de conexión con el servidor');
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      {/* Mitad Izquierda: Imagen PC Gaming (Invertida al admin para diferenciar visualmente) */}
      <div style={{ flex: 1, position: 'relative', display: 'none' }} className="split-image-container">
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(to left, var(--background) 0%, transparent 10%)' }}></div>
        <Image 
          src="/pc-gaming-bg.png"
          alt="Gamer Loot Setup"
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
        <div style={{ position: 'absolute', top: '2rem', left: '2rem', zIndex: 2, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link href="/">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', padding: '10px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.2s' }} className="hover-glow">
              <Gamepad2 size={24} color="var(--primary)" />
              <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>Volver a la Tienda</span>
            </div>
          </Link>
        </div>
      </div>
      
      {/* Mitad Derecha: Formulario */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          
          <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', background: 'linear-gradient(90deg, var(--primary), var(--accent-cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Iniciar Sesión
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1.05rem' }}>
              Accede a tu cuenta para gestionar pedidos y wishlist
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
                  placeholder="tucorreo@ejemplo.com"
                  style={{ 
                    width: '100%', padding: '14px 14px 14px 44px', borderRadius: '12px', 
                    border: '1px solid var(--border)', background: 'var(--input-bg)', 
                    color: 'var(--foreground)', fontSize: '1rem', transition: 'border-color 0.2s'
                  }} 
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Contraseña
                </label>
                <Link href="#" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none' }}>
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
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
                fontSize: '1.05rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                background: 'linear-gradient(135deg, var(--primary), var(--accent-cyan))'
              }}
            >
              {isSubmitting ? 'Iniciando...' : <>Entrar <ArrowRight size={20} /></>}
            </button>
          </form>

          <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>
              ¿Aún no tienes cuenta?{' '}
              <Link href="/signup" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                Regístrate aquí
              </Link>
            </p>
          </div>

        </div>
      </div>
      
      {/* CSS inyectado para media queries rápidas y efectos hover */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 900px) {
          .split-image-container {
            display: block !important;
          }
        }
        .hover-glow:hover {
          background: rgba(139, 92, 246, 0.2) !important;
          border-color: rgba(139, 92, 246, 0.4) !important;
        }
      `}} />
    </div>
  );
}
