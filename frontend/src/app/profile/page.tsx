"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Package, Award, Star, MessageSquare } from 'lucide-react';

export default function ProfileOverview() {
  const { user, token } = useAuth();
  
  const [activeOrders, setActiveOrders] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [questionsCount, setQuestionsCount] = useState(0);

  useEffect(() => {
    if (!token) return;

    const fetchStats = async () => {
      try {
        const [ordersRes, reviewsRes, questionsRes] = await Promise.all([
          fetch('http://localhost:8000/api/v1/sales/my-orders', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('http://localhost:8000/api/v1/interactions/reviews/me', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('http://localhost:8000/api/v1/interactions/questions/me', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (ordersRes.ok) {
          const orders = await ordersRes.json();
          const active = orders.filter((o: any) => !['Cancelado', 'Entregado', 'Devuelto', 'Cotización'].includes(o.status));
          setActiveOrders(active.length);
        }
        if (reviewsRes.ok) {
          const reviews = await reviewsRes.json();
          setReviewsCount(reviews.length);
        }
        if (questionsRes.ok) {
          const questions = await questionsRes.json();
          setQuestionsCount(questions.length);
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    };

    fetchStats();
  }, [token]);

  return (
    <div>
      <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px', letterSpacing: '-0.5px' }}>
        Resumen de mi Base
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '1.1rem' }}>
        Bienvenido a tu cuartel general, {user?.full_name || user?.username || 'Gamer'}. Aquí tienes el estado de tu botín.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {/* Card 1 */}
        <div className="glass-panel hover-card" style={{ padding: '24px', borderRadius: '16px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: '4px', height: '100%', background: 'var(--primary)' }}></div>
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(10px)', pointerEvents: 'none' }}></div>
          
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '16px', borderRadius: '14px', color: 'var(--primary)', boxShadow: '0 0 15px rgba(139, 92, 246, 0.2)' }}>
            <Package size={28} />
          </div>
          <div style={{ zIndex: 1 }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pedidos Activos</p>
            <h3 style={{ margin: '4px 0 0', fontSize: '1.8rem', fontWeight: 900, color: 'var(--foreground)' }}>{activeOrders}</h3>
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-panel hover-card" style={{ padding: '24px', borderRadius: '16px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: '4px', height: '100%', background: '#10b981' }}></div>
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(10px)', pointerEvents: 'none' }}></div>
          
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '14px', color: '#10b981', boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)' }}>
            <Award size={28} />
          </div>
          <div style={{ zIndex: 1 }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nivel de Jugador</p>
            <h3 style={{ margin: '4px 0 0', fontSize: '1.8rem', fontWeight: 900, color: '#10b981' }}>Lvl {user?.level || 1}</h3>
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-panel hover-card" style={{ padding: '24px', borderRadius: '16px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: '4px', height: '100%', background: '#f59e0b' }}></div>
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(10px)', pointerEvents: 'none' }}></div>
          
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '16px', borderRadius: '14px', color: '#f59e0b', boxShadow: '0 0 15px rgba(245, 158, 11, 0.2)' }}>
            <Star size={28} />
          </div>
          <div style={{ zIndex: 1 }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mis Reseñas</p>
            <h3 style={{ margin: '4px 0 0', fontSize: '1.8rem', fontWeight: 900, color: 'var(--foreground)' }}>{reviewsCount}</h3>
          </div>
        </div>
        
        {/* Card 4 */}
        <div className="glass-panel hover-card" style={{ padding: '24px', borderRadius: '16px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: '4px', height: '100%', background: '#3b82f6' }}></div>
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(10px)', pointerEvents: 'none' }}></div>
          
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '14px', color: '#3b82f6', boxShadow: '0 0 15px rgba(59, 130, 246, 0.2)' }}>
            <MessageSquare size={28} />
          </div>
          <div style={{ zIndex: 1 }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mis Preguntas</p>
            <h3 style={{ margin: '4px 0 0', fontSize: '1.8rem', fontWeight: 900, color: 'var(--foreground)' }}>{questionsCount}</h3>
          </div>
        </div>
      </div>
      
      {/* Últimos Movimientos */}
      <div className="glass-panel hover-card" style={{ padding: '40px', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-150px', right: '-150px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 60%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', left: 0, top: 0, width: '4px', height: '100%', background: 'linear-gradient(to bottom, var(--primary), transparent)' }}></div>
        
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '24px', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '10px' }}>
            <Package size={24} color="var(--primary)" />
          </div>
          Actividad Reciente
        </h2>
        
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', zIndex: 1, position: 'relative' }}>
          <div style={{ background: 'var(--input-bg)', display: 'inline-flex', padding: '24px', borderRadius: '50%', marginBottom: '20px', border: '1px dashed var(--card-border)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            <Package size={48} color="var(--text-muted)" style={{ opacity: 0.5 }} />
          </div>
          <p style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700, color: 'var(--foreground)' }}>Aún no tienes actividad reciente.</p>
          <p style={{ fontSize: '1rem', marginTop: '10px' }}>¡Explora la tienda y empieza a subir tu nivel de Loot!</p>
        </div>
      </div>
    </div>
  );
}
