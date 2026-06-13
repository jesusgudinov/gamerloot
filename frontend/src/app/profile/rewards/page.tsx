"use client";

import { useAuth } from '@/context/AuthContext';
import { Award, Zap, Trophy, Shield, Star, Target } from 'lucide-react';

export default function GamificationPage() {
  const { user } = useAuth();
  
  const currentLevel = user?.level || 1;
  const currentXp = user?.xp || 0;
  
  // Fórmula: Cada nivel cuesta 1000 XP en el acumulado total
  const xpForNextLevel = currentLevel * 1000;
  
  // XP obtenido dentro del nivel actual
  const currentLevelXpProgress = currentXp % 1000;
  
  // Calcular porcentaje de progreso del nivel actual
  const progressPercentage = (currentLevelXpProgress / 1000) * 100;
  const xpFaltante = xpForNextLevel - currentXp;

  return (
    <div>
      <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px', letterSpacing: '-0.5px' }}>
        Rango y Recompensas
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '40px', fontSize: '1.1rem' }}>
        Sube de nivel completando compras, dejando reseñas y participando en la comunidad.
      </p>

      {/* Main Banner: Current Level */}
      <div className="glass-panel hover-card" style={{ 
        position: 'relative', overflow: 'hidden', padding: '40px', borderRadius: '24px', 
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, var(--card-bg) 100%)', 
        border: '1px solid var(--card-border)', marginBottom: '40px',
      }}>
        {/* Glow Effects */}
        <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)', filter: 'blur(40px)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-50%', left: '-10%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(52, 211, 153, 0.15) 0%, transparent 70%)', filter: 'blur(40px)', borderRadius: '50%', pointerEvents: 'none' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px', position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
          
          {/* Level Badge */}
          <div style={{ 
            width: '130px', height: '130px', borderRadius: '50%', 
            background: 'linear-gradient(135deg, var(--primary), #34d399)', padding: '4px',
            boxShadow: '0 0 30px rgba(139, 92, 246, 0.3)'
          }}>
            <div style={{ 
              width: '100%', height: '100%', borderRadius: '50%', background: 'var(--background)', 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' 
            }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Lvl</span>
              <span style={{ fontSize: '3rem', fontWeight: 900, background: 'linear-gradient(135deg, #a78bfa, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: '1' }}>
                {currentLevel}
              </span>
            </div>
          </div>

          {/* Progress Details */}
          <div style={{ flex: 1, minWidth: '250px' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '2.2rem', fontWeight: 900, color: 'var(--foreground)', letterSpacing: '-0.5px' }}>
              {currentLevel < 5 ? 'Aventurero Novato' : currentLevel < 15 ? 'Cazador de Loot' : 'Leyenda Gamer'}
            </h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.95rem', fontWeight: 700 }}>
              <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={16} style={{ color: '#eab308' }} />
                {currentXp.toLocaleString()} XP Actuales
              </span>
              <span style={{ color: 'var(--primary)' }}>Faltan {xpFaltante.toLocaleString()} XP</span>
            </div>
            
            {/* Progress Bar Container */}
            <div style={{ width: '100%', height: '14px', background: 'var(--input-bg)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--card-border)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ 
                width: `${progressPercentage}%`, height: '100%', 
                background: 'linear-gradient(90deg, var(--primary), #34d399)',
                borderRadius: '12px', transition: 'width 1s ease-in-out',
                position: 'relative', overflow: 'hidden', boxShadow: '0 0 10px rgba(52, 211, 153, 0.5)'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', animation: 'shimmer 2s infinite' }} />
              </div>
            </div>
            
            <p style={{ margin: '16px 0 0 0', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
              El siguiente rango desbloquea descuentos exclusivos en envíos y acceso anticipado a hardware.
            </p>
          </div>

        </div>
      </div>

      {/* Perks Grid */}
      <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '24px', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ padding: '8px', background: 'rgba(234, 179, 8, 0.15)', borderRadius: '12px' }}>
          <Trophy size={24} color="#eab308" />
        </div>
        Beneficios de tu Nivel Actual
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        
        {/* Perk 1 */}
        <div className="glass-panel hover-card" style={{ padding: '28px', borderRadius: '20px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: '4px', height: '100%', background: '#10b981' }}></div>
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(10px)', pointerEvents: 'none' }}></div>
          
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: 'fit-content', padding: '14px', borderRadius: '14px', color: '#10b981', boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)' }}>
            <Shield size={28} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--foreground)' }}>Garantía Extendida Base</h4>
            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Como jugador activo, todas tus compras de componentes cuentan con 30 días de protección directa con nosotros además del fabricante.
            </p>
          </div>
        </div>

        {/* Perk 2 */}
        <div className="glass-panel hover-card" style={{ padding: '28px', borderRadius: '20px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: '4px', height: '100%', background: '#eab308' }}></div>
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(234, 179, 8, 0.15) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(10px)', pointerEvents: 'none' }}></div>
          
          <div style={{ background: 'rgba(234, 179, 8, 0.1)', width: 'fit-content', padding: '14px', borderRadius: '14px', color: '#eab308', boxShadow: '0 0 15px rgba(234, 179, 8, 0.2)' }}>
            <Star size={28} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--foreground)' }}>Multiplicador de Reseñas (1x)</h4>
            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Tus reseñas en productos comprados otorgan XP base. Llega a nivel 15 para multiplicar x2 la experiencia ganada.
            </p>
          </div>
        </div>

        {/* Perk 3 - Locked */}
        <div className="glass-panel hover-card" style={{ padding: '28px', borderRadius: '20px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '16px', opacity: 0.7 }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: '4px', height: '100%', background: 'var(--text-muted)' }}></div>
          
          <div style={{ background: 'var(--input-bg)', width: 'fit-content', padding: '14px', borderRadius: '14px', color: 'var(--text-muted)', border: '1px dashed var(--card-border)' }}>
            <Target size={28} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--foreground)' }}>Envío Express Gratis</h4>
            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Desbloqueable en Lvl 20. Obtén envíos urgentes a precio de envíos estándar en todas tus guías unificadas.
            </p>
            <div style={{ marginTop: '16px', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', background: 'var(--input-bg)', border: '1px solid var(--card-border)', display: 'inline-flex', alignItems: 'center', padding: '6px 12px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Bloqueado
            </div>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}
