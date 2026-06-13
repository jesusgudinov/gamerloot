"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Lock, Mail, AlertCircle, ArrowRight, Gamepad2, ShieldCheck } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/context/AuthContext'; // Import auth context if needed

export default function ClientLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // MFA State
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');

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

      const data = await res.json();
      
      if (data.mfa_required) {
        setMfaRequired(true);
        setMfaToken(data.temp_token);
        setIsSubmitting(false);
        return;
      }

      localStorage.setItem('client_token', data.access_token);
      window.location.href = '/'; // hard reload to get context properly
      
    } catch (e) {
      setError('Error de conexión con el servidor');
      setIsSubmitting(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('http://localhost:8000/api/v1/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ temp_token: mfaToken, code: mfaCode })
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.detail || 'Código inválido');
        setIsSubmitting(false);
        return;
      }

      const data = await res.json();
      localStorage.setItem('client_token', data.access_token);
      window.location.href = '/';
      
    } catch (e) {
      setError('Error de conexión con el servidor');
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ credential: credentialResponse.credential })
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.detail || 'Error al iniciar sesión con Google');
        return;
      }

      const data = await res.json();
      
      if (data.mfa_required) {
        setMfaRequired(true);
        setMfaToken(data.temp_token);
        return;
      }

      localStorage.setItem('client_token', data.access_token);
      window.location.href = '/';
      
    } catch (e) {
      setError('Error de conexión con el servidor');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      {/* Mitad Izquierda */}
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
              {mfaRequired ? 'Verificación 2FA' : 'Iniciar Sesión'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1.05rem' }}>
              {mfaRequired ? 'Ingresa el código de 6 dígitos de tu aplicación autenticadora.' : 'Accede a tu cuenta para gestionar pedidos y wishlist'}
            </p>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '12px 16px', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <AlertCircle size={20} />
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{error}</span>
            </div>
          )}

          {!mfaRequired ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google Login falló')}
                  theme="filled_black"
                  shape="circle"
                  text="continue_with"
                  size="large"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                <span style={{ padding: '0 10px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>O CON CORREO</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
              </div>

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
            </>
          ) : (
            <form onSubmit={handleMfaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  Código de 6 dígitos
                </label>
                <div style={{ position: 'relative' }}>
                  <ShieldCheck size={20} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    required
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    style={{ 
                      width: '100%', padding: '14px 14px 14px 44px', borderRadius: '12px', 
                      border: '1px solid var(--border)', background: 'var(--input-bg)', 
                      color: 'var(--foreground)', fontSize: '1.2rem', letterSpacing: '8px', textAlign: 'center', transition: 'border-color 0.2s'
                    }} 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting || mfaCode.length !== 6}
                className="btn-primary" 
                style={{ 
                  marginTop: '1rem', width: '100%', padding: '14px', borderRadius: '12px', 
                  fontSize: '1.05rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                  background: 'linear-gradient(135deg, var(--primary), var(--accent-cyan))'
                }}
              >
                {isSubmitting ? 'Verificando...' : 'Verificar'}
              </button>
              
              <button 
                type="button" 
                onClick={() => { setMfaRequired(false); setMfaCode(''); }}
                style={{ 
                  background: 'none', border: 'none', color: 'var(--text-muted)', 
                  fontWeight: 600, cursor: 'pointer', marginTop: '1rem' 
                }}
              >
                Volver al Login
              </button>
            </form>
          )}

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
