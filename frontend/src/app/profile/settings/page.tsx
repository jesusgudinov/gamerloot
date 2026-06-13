"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Settings as SettingsIcon, Shield, User as UserIcon, Lock, CheckCircle, AlertTriangle, Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  
  // Profile State
  const [profileData, setProfileData] = useState({
    full_name: '',
    username: '',
    phone_number: ''
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password State
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  // MFA State
  const [mfaSetupUri, setMfaSetupUri] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaActivating, setMfaActivating] = useState(false);
  const [mfaError, setMfaError] = useState('');
  const [mfaSuccess, setMfaSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        username: user.username || '',
        phone_number: user.phone_number || ''
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(false);
    
    try {
      const res = await fetch('http://localhost:8000/api/v1/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profileData)
      });
      
      if (res.ok) {
        const updatedUser = await res.json();
        updateUser(updatedUser);
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      } else {
        console.error('Error updating profile');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError('Las contraseñas nuevas no coinciden.');
      return;
    }
    
    if (passwordData.new_password.length < 8) {
      setPasswordError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(passwordData.new_password)) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres e incluir letras, números y al menos un símbolo.');
      return;
    }
    
    setPasswordSaving(true);
    
    try {
      const res = await fetch('http://localhost:8000/api/v1/auth/me/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        })
      });
      
      if (res.ok) {
        alert('Contraseña actualizada exitosamente. Por seguridad, deberás iniciar sesión nuevamente.');
        logout(); // Forzar cierre de sesión
      } else {
        const errorData = await res.json();
        setPasswordError(errorData.detail || 'Ocurrió un error al actualizar la contraseña.');
      }
    } catch (error) {
      setPasswordError('Error de red al intentar cambiar la contraseña.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleStartMfaSetup = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/auth/mfa/setup', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setMfaSetupUri(data.uri);
      } else {
        const err = await res.json();
        setMfaError(err.detail || 'Error al iniciar configuración MFA');
      }
    } catch (e) {
      setMfaError('Error de red');
    }
  };

  const handleEnableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaActivating(true);
    setMfaError('');
    
    try {
      const res = await fetch('http://localhost:8000/api/v1/auth/mfa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: mfaCode })
      });
      
      if (res.ok) {
        setMfaSuccess(true);
        setMfaSetupUri('');
        // Optimistic UI update or refetch me
      } else {
        const err = await res.json();
        setMfaError(err.detail || 'Código incorrecto');
      }
    } catch (e) {
      setMfaError('Error de red');
    } finally {
      setMfaActivating(false);
    }
  };

  return (
    <div style={{ paddingBottom: '60px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0 0 8px 0', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '16px', letterSpacing: '-0.5px' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '12px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SettingsIcon size={32} color="var(--primary)" />
          </div>
          Ajustes de Perfil
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', margin: 0 }}>
          Actualiza tu información personal y mantén tu cuenta segura.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
        
        {/* Personal Info Card */}
        <div className="glass-panel" style={{ padding: '32px', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--primary)' }}></div>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)', filter: 'blur(20px)', borderRadius: '50%', pointerEvents: 'none' }}></div>
          
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 24px 0', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '10px', borderRadius: '12px' }}>
              <UserIcon size={24} color="var(--primary)" />
            </div>
            Información Personal
          </h2>

          <form onSubmit={handleProfileSubmit} style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>Nombre Completo</label>
              <input 
                type="text" 
                value={profileData.full_name} 
                onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                required
                style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)', outline: 'none', transition: 'border-color 0.2s' }} 
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'} 
                onBlur={(e) => e.target.style.borderColor = 'var(--card-border)'}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>Nombre de Usuario (Apodo)</label>
              <input 
                type="text" 
                value={profileData.username} 
                onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                placeholder="GamerTag123"
                style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)', outline: 'none', transition: 'border-color 0.2s' }} 
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'} 
                onBlur={(e) => e.target.style.borderColor = 'var(--card-border)'}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>Teléfono</label>
              <input 
                type="tel" 
                value={profileData.phone_number} 
                onChange={(e) => setProfileData({...profileData, phone_number: e.target.value})}
                placeholder="55 1234 5678"
                style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)', outline: 'none', transition: 'border-color 0.2s' }} 
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'} 
                onBlur={(e) => e.target.style.borderColor = 'var(--card-border)'}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button 
                type="submit" 
                disabled={profileSaving} 
                className="btn-primary hover-card" 
                style={{ padding: '12px 24px', opacity: profileSaving ? 0.7 : 1, transition: 'all 0.3s ease' }}
              >
                {profileSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              
              {profileSuccess && (
                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', fontWeight: 600, animation: 'fadeIn 0.3s ease-in-out' }}>
                  <CheckCircle size={18} /> Actualizado
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Security Card */}
        <div className="glass-panel" style={{ padding: '32px', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#eab308' }}></div>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(234, 179, 8, 0.1) 0%, transparent 70%)', filter: 'blur(20px)', borderRadius: '50%', pointerEvents: 'none' }}></div>
          
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 24px 0', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(234, 179, 8, 0.1)', padding: '10px', borderRadius: '12px' }}>
              <Shield size={24} color="#eab308" />
            </div>
            Seguridad
          </h2>

          <form onSubmit={handlePasswordSubmit} style={{ position: 'relative', zIndex: 1 }} autoComplete="off">
            
            {passwordError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px 16px', borderRadius: '12px', color: '#ef4444', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
                <AlertTriangle size={18} /> {passwordError}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                <Lock size={14} /> Contraseña Actual
              </label>
              <input 
                type="password" 
                value={passwordData.current_password} 
                onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                required
                autoComplete="new-password"
                style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)', outline: 'none', transition: 'border-color 0.2s' }} 
                onFocus={(e) => e.target.style.borderColor = '#eab308'} 
                onBlur={(e) => e.target.style.borderColor = 'var(--card-border)'}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>Nueva Contraseña</label>
              <input 
                type="password" 
                value={passwordData.new_password} 
                onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                required
                minLength={8}
                autoComplete="new-password"
                style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)', outline: 'none', transition: 'border-color 0.2s' }} 
                onFocus={(e) => e.target.style.borderColor = '#eab308'} 
                onBlur={(e) => e.target.style.borderColor = 'var(--card-border)'}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>Confirmar Nueva Contraseña</label>
              <input 
                type="password" 
                value={passwordData.confirm_password} 
                onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                required
                minLength={8}
                autoComplete="new-password"
                style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)', outline: 'none', transition: 'border-color 0.2s' }} 
                onFocus={(e) => e.target.style.borderColor = '#eab308'} 
                onBlur={(e) => e.target.style.borderColor = 'var(--card-border)'}
              />
            </div>

            <button 
              type="submit" 
              disabled={passwordSaving} 
              className="hover-card" 
              style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.2)', fontWeight: 800, fontSize: '1.05rem', cursor: 'pointer', transition: 'all 0.3s ease', opacity: passwordSaving ? 0.7 : 1 }}
            >
              {passwordSaving ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>
          </form>
        </div>

        {/* MFA / 2FA Card */}
        <div className="glass-panel" style={{ padding: '32px', borderRadius: '24px', position: 'relative', overflow: 'hidden', gridColumn: '1 / -1' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#3b82f6' }}></div>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)', filter: 'blur(20px)', borderRadius: '50%', pointerEvents: 'none' }}></div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 12px 0', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '12px' }}>
                  <Smartphone size={24} color="#3b82f6" />
                </div>
                Autenticación de Dos Factores (MFA)
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0, lineHeight: '1.5' }}>
                Agrega una capa adicional de seguridad a tu cuenta. Una vez configurado, se te pedirá que ingreses un código de autenticación (de aplicaciones como Google Authenticator o Authy) al iniciar sesión.
              </p>
            </div>
            
            <div>
              {user?.mfa_enabled || mfaSuccess ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 700, padding: '12px 24px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>
                  <CheckCircle size={20} /> MFA Activado Exitosamente
                </div>
              ) : mfaSetupUri ? (
                <form onSubmit={handleEnableMfa} style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--input-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', background: '#fff', padding: '16px', borderRadius: '12px' }}>
                    <QRCodeSVG value={mfaSetupUri} size={150} />
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
                    Escanea el código con tu app y escribe el número de 6 dígitos
                  </p>
                  {mfaError && <span style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>{mfaError}</span>}
                  <input 
                    type="text" 
                    required 
                    maxLength={6} 
                    value={mfaCode}
                    onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--background)', border: '1px solid var(--card-border)', color: 'var(--foreground)', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '8px', outline: 'none' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={() => setMfaSetupUri('')} style={{ flex: 1, padding: '12px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--card-border)', borderRadius: '12px', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
                    <button type="submit" disabled={mfaActivating || mfaCode.length !== 6} style={{ flex: 1, padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', cursor: mfaCode.length === 6 ? 'pointer' : 'not-allowed', fontWeight: 600, opacity: mfaCode.length === 6 ? 1 : 0.5 }}>Activar</button>
                  </div>
                </form>
              ) : (
                <button onClick={handleStartMfaSetup} className="hover-card" style={{ padding: '14px 28px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.3s' }}>
                  Configurar MFA
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
