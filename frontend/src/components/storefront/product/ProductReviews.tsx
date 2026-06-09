"use client";
import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, ThumbsDown, CheckCircle, Shield } from 'lucide-react';

interface UserBasicInfo {
  id: number;
  username?: string;
  first_name?: string;
  level: number;
}

interface Review {
  id: number;
  product_id: number;
  user_id: number;
  rating: number;
  comment?: string;
  status: string;
  created_at: string;
  user?: UserBasicInfo;
}

interface ProductReviewsProps {
  productId: number;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8000/api/v1/interactions/reviews/product/${productId}`)
      .then(res => res.json())
      .then(data => {
        setReviews(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [productId]);

  const handleVote = (id: number, type: 'up' | 'down') => {
    console.log(`Voto ${type} registrado para la reseña ${id}`);
    alert('Próximamente: Sistema de votos');
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} size={16} fill={i < rating ? "#eab308" : "transparent"} color={i < rating ? "#eab308" : "var(--text-muted)"} />
    ));
  };

  const getUserTitle = (level: number) => {
    if (level < 10) return "Aventurero Novato";
    if (level < 20) return "Cazador de Loot";
    if (level < 30) return "Guerrero Élite";
    if (level < 40) return "Maestro del Setup";
    if (level < 50) return "Leyenda del Loot";
    return "Dios del Loot";
  };

  if (loading) {
    return <div style={{ marginTop: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando reseñas...</div>;
  }

  const averageRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "0.0";

  return (
    <div style={{ marginTop: '50px', paddingTop: '40px', borderTop: '1px solid var(--card-border)' }}>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '30px' }}>Opiniones de Clientes</h2>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', marginBottom: '40px' }}>
        {/* Resumen de Calificaciones */}
        <div style={{ flex: '1 1 300px', background: 'var(--card-bg)', padding: '30px', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--foreground)' }}>{averageRating}</div>
            <div>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>{renderStars(Math.round(Number(averageRating)))}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Basado en {reviews.length} reseñas</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[5, 4, 3, 2, 1].map(stars => {
              const count = reviews.filter(r => r.rating === stars).length;
              const percent = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
              return (
                <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                  <span style={{ width: '60px', color: 'var(--text-muted)' }}>{stars} estrell{stars === 1 ? 'a' : 'as'}</span>
                  <div style={{ flex: 1, height: '8px', background: 'var(--bg-color)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${percent}%`, height: '100%', background: '#eab308', borderRadius: '4px' }}></div>
                  </div>
                  <span style={{ width: '35px', textAlign: 'right', color: 'var(--text-muted)' }}>{percent}%</span>
                </div>
              );
            })}
          </div>

          <button 
            onClick={() => alert("Solo los compradores verificados que ya han recibido el producto pueden escribir una reseña.")}
            style={{ width: '100%', padding: '12px', marginTop: '25px', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Escribir una reseña
          </button>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '12px', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
            <Shield size={12} />
            <span>Solo compradores verificados pueden reseñar</span>
          </div>
        </div>

        {/* Lista de Reseñas */}
        <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
          {reviews.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Aún no hay reseñas para este producto. ¡Sé el primero!</div>
          ) : (
            reviews.map(review => {
              const userName = review.user?.username || review.user?.first_name || "Usuario Anónimo";
              const userLevel = review.user?.level || 1;
              const userTitle = getUserTitle(userLevel);
              const dateObj = new Date(review.created_at);
              const dateStr = dateObj.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });

              return (
                <div key={review.id} style={{ paddingBottom: '25px', borderBottom: '1px solid var(--card-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{userName}</div>
                        <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Shield size={12} color="var(--primary)" /> Lvl {userLevel} - {userTitle}
                        </div>
                      </div>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{dateStr}</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>{renderStars(review.rating)}</div>
                  </div>

                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: '#10b981', fontWeight: 600, marginBottom: '10px', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                    <CheckCircle size={12} /> Compra Verificada
                  </div>

                  <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '15px' }}>
                    {review.comment}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    <span>¿Te resultó útil esta opinión?</span>
                    <button onClick={() => handleVote(review.id, 'up')} style={{ background: 'none', border: '1px solid var(--card-border)', padding: '4px 10px', borderRadius: '15px', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                      <ThumbsUp size={14} /> 0
                    </button>
                    <button onClick={() => handleVote(review.id, 'down')} style={{ background: 'none', border: '1px solid var(--card-border)', padding: '4px 10px', borderRadius: '15px', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                      <ThumbsDown size={14} /> 0
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
