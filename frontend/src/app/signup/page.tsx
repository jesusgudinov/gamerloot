"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { User, Lock, Mail, AlertCircle, ArrowRight, Gamepad2, CheckCircle2 } from 'lucide-react';

export default function ClientSignup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('http://localhost:8000/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: name,
          email: email,
          password: password
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.detail || 'Error al crear la cuenta');
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
      
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
              Crear Cuenta
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1.05rem' }}>
              Únete a Gamer Loot para una experiencia premium
            </p>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '12px 16px', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <AlertCircle size={20} />
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{error}</span>
            </div>
          )}

          {success && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '12px 16px', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <CheckCircle2 size={20} />
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>¡Cuenta creada! Redirigiendo...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                Nombre Completo
              </label>
              <div style={{ position: 'relative' }}>
                <User size={20} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Master Chief"
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
              disabled={isSubmitting || success}
              className="btn-primary" 
              style={{ 
                marginTop: '1rem', width: '100%', padding: '14px', borderRadius: '12px', 
                fontSize: '1.05rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                background: 'linear-gradient(135deg, var(--primary), var(--accent-cyan))'
              }}
            >
              {isSubmitting ? 'Creando cuenta...' : <>Unirse Ahora <ArrowRight size={20} /></>}
            </button>
          </form>

          <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                Inicia sesión
              </Link>
            </p>
          </div>

        </div>
      </div>
      
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
