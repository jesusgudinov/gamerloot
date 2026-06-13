"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, Gamepad2, Globe, Sun, Moon } from 'lucide-react';
import Link from 'next/link';

import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { login } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  // MFA State
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

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
      
      const { access_token } = data;
      
      const meRes = await fetch('http://localhost:8000/api/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${access_token}` },
        credentials: 'include'
      });
      
      if (meRes.ok) {
        const userData = await meRes.json();
        login(access_token, userData);
        window.location.href = '/';
      } else {
        setError('Error al obtener perfil');
        setIsSubmitting(false);
      }
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

      const { access_token } = await res.json();

      const meRes = await fetch('http://localhost:8000/api/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${access_token}` },
        credentials: 'include'
      });
      
      if (meRes.ok) {
        const userData = await meRes.json();
        login(access_token, userData);
        window.location.href = '/';
      } else {
        setError('Error al obtener perfil');
        setIsSubmitting(false);
      }
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
        body: JSON.stringify({ token: credentialResponse.credential })
      });

      if (!res.ok) {
        setError('Error al autenticar con Google');
        return;
      }

      const data = await res.json();
      
      if (data.mfa_required) {
        setMfaRequired(true);
        setMfaToken(data.temp_token);
        return;
      }
      
      const meRes = await fetch('http://localhost:8000/api/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${data.access_token}` },
        credentials: 'include'
      });
      
      if (meRes.ok) {
        const userData = await meRes.json();
        login(data.access_token, userData);
        window.location.href = '/';
      }
    } catch (e) {
      setError('Error de conexión');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)', color: 'var(--foreground)', position: 'relative', overflow: 'hidden' }}>
      
      {/* Theme Toggle Button */}
      {mounted && (
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          style={{ position: 'absolute', top: '2rem', right: '2rem', zIndex: 10, width: '40px', height: '40px', borderRadius: '50%', background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--text-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      )}
      
      {/* Decorative Radials for the right side (form) */}
      <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)', filter: 'blur(80px)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '10%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)', filter: 'blur(80px)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />

      {/* Mitad Izquierda: Imagen Atractiva */}
      <div style={{ flex: 1, position: 'relative', display: 'none' }} className="split-image-container">
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(to right, rgba(6,7,11,0.2) 0%, rgba(6,7,11,0.5) 80%, #06070B 100%)' }}></div>
        <Image 
          src="/gamer_loot_login_bg.png"
          alt="Gamer Loot Suite"
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
        <div style={{ position: 'absolute', top: '3rem', left: '3rem', zIndex: 2 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, background: 'linear-gradient(135deg, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-1px' }}>
              Gamer Loot
            </h2>
          </Link>
        </div>

        <div style={{ position: 'absolute', bottom: '4rem', left: '3rem', zIndex: 2, maxWidth: '500px', background: 'rgba(15, 15, 20, 0.5)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '2rem', borderRadius: '24px', borderLeft: '4px solid var(--primary)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
          <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', lineHeight: '1.2', marginBottom: '1rem' }}>
            Bienvenido a tu <br /><span style={{ color: 'var(--primary)' }}>Base de Operaciones</span>
          </h2>
          <p style={{ margin: 0, color: '#a1a1aa', fontSize: '1.1rem', lineHeight: '1.6' }}>
            Sube de nivel, rastrea tu loot, gestiona tus métodos de pago y accede a la suite completa de herramientas para verdaderos gamers.
          </p>
        </div>
      </div>

      {/* Mitad Derecha: Formulario */}
      <div className="login-form-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 1, position: 'relative' }}>
        <div className="glass-panel hover-card" style={{ 
          width: '100%', maxWidth: '440px', padding: '40px', borderRadius: '24px', 
          background: 'var(--card-bg)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
          borderLeft: '4px solid var(--primary)', borderRight: '1px solid var(--card-border)', borderTop: '1px solid var(--card-border)', borderBottom: '1px solid var(--card-border)'
        }}>
          
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <div style={{ 
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', 
              borderRadius: '20px', background: 'rgba(139, 92, 246, 0.1)', 
              color: 'var(--primary)', marginBottom: '1.5rem',
            }}>
              <Gamepad2 size={32} />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--foreground)', letterSpacing: '-0.5px' }}>
              {mfaRequired ? 'Verificación de Seguridad' : 'Iniciar Sesión'}
            </h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
              {mfaRequired ? 'Ingresa tu código MFA para autorizar tu acceso' : 'Ingresa para continuar a tu Customer Suite'}
            </p>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '14px 16px', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <AlertCircle size={20} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{error}</span>
            </div>
          )}

          {!mfaRequired ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', color: 'var(--text-muted)' }}>
                  Correo Electrónico
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@gamerloot.mx"
                    className="login-input"
                    style={{ 
                      width: '100%', padding: '16px 16px 16px 48px', borderRadius: '14px', 
                      border: '1px solid var(--card-border)', background: 'var(--input-bg)', 
                      color: 'var(--input-text)', fontSize: '1rem', transition: 'all 0.3s ease', outline: 'none'
                    }} 
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>
                    Contraseña
                  </label>
                  <Link href="#" style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>¿Olvidaste tu contraseña?</Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="login-input"
                    style={{ 
                      width: '100%', padding: '16px 16px 16px 48px', borderRadius: '14px', 
                      border: '1px solid var(--card-border)', background: 'var(--input-bg)', 
                      color: 'var(--input-text)', fontSize: '1rem', transition: 'all 0.3s ease', outline: 'none'
                    }} 
                  />
                </div>
              </div>

              {/* Cloudflare Turnstile Placeholder */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: 'var(--input-bg)', border: '1px dashed var(--card-border)', borderRadius: '12px', justifyContent: 'center' }}>
                <ShieldCheck size={20} color="#10b981" />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cloudflare Turnstile (Preparado)</span>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                style={{ 
                  marginTop: '0.5rem', width: '100%', padding: '16px', borderRadius: '14px', 
                  fontSize: '1.1rem', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
                  background: 'var(--primary)', border: 'none', color: '#fff', cursor: 'pointer',
                  boxShadow: '0 0 25px rgba(139, 92, 246, 0.2)', transition: 'all 0.3s ease',
                  opacity: isSubmitting ? 0.7 : 1
                }}
                onMouseOver={(e) => { if(!isSubmitting) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 35px rgba(139, 92, 246, 0.4)'; } }}
                onMouseOut={(e) => { if(!isSubmitting) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 25px rgba(139, 92, 246, 0.2)'; } }}
              >
                {isSubmitting ? 'Iniciando Sesión...' : <>Entrar <ArrowRight size={22} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleMfaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Código de 6 dígitos
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    required
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="login-input"
                    style={{ 
                      width: '100%', padding: '16px', borderRadius: '14px', 
                      border: '1px solid var(--card-border)', background: 'var(--input-bg)', 
                      color: 'var(--input-text)', fontSize: '1.5rem', letterSpacing: '10px', textAlign: 'center', transition: 'all 0.3s ease', outline: 'none'
                    }} 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting || mfaCode.length !== 6}
                style={{ 
                  marginTop: '0.5rem', width: '100%', padding: '16px', borderRadius: '14px', 
                  fontSize: '1.1rem', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
                  background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', cursor: 'pointer',
                  boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)', transition: 'all 0.3s ease',
                  opacity: (isSubmitting || mfaCode.length !== 6) ? 0.7 : 1
                }}
                onMouseOver={(e) => { if(!isSubmitting && mfaCode.length === 6) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 35px rgba(16, 185, 129, 0.6)'; } }}
                onMouseOut={(e) => { if(!isSubmitting && mfaCode.length === 6) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 25px rgba(16, 185, 129, 0.4)'; } }}
              >
                {isSubmitting ? 'Verificando...' : 'Verificar MFA'}
              </button>
              
              <button 
                type="button" 
                onClick={() => { setMfaRequired(false); setMfaCode(''); }}
                style={{ 
                  background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.9rem',
                  fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem', textDecoration: 'underline' 
                }}
              >
                Volver a login
              </button>
            </form>
          )}

          <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }}></div>
            <span style={{ padding: '0 10px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>O CONTINÚA CON</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }}></div>
          </div>

          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Error de conexión con Google')}
              theme="outline"
              shape="pill"
              size="large"
              text="continue_with"
            />
          </div>
          
          <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            ¿Aún no tienes cuenta? <Link href="/auth/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>Regístrate aquí</Link>
          </div>

        </div>
      </div>
      
      {/* CSS inyectado para media queries y estados */}
      <style dangerouslySetInnerHTML={{__html: `
        .login-form-container {
          padding: 2rem;
        }
        .login-input:focus {
          border-color: var(--primary) !important;
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
