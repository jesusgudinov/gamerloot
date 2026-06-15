"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Star, ThumbsUp, ThumbsDown, CheckCircle, Shield, X, Image as ImageIcon, Loader2, Upload } from 'lucide-react';

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
  images?: string[];
  upvotes?: number;
  downvotes?: number;
  votes?: Record<string, string>;
}

interface ProductReviewsProps {
  productId: number;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState<{rating: number, comment: string, images: string[]}>({ rating: 5, comment: '', images: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`http://localhost:8000/api/v1/interactions/reviews/product/${productId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setReviews(data);
        } else {
          console.error("Expected array of reviews, got:", data);
          setReviews([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [productId]);

  const handleVote = async (id: number, type: 'up' | 'down') => {
    if (!user) {
      alert("Debes iniciar sesión para votar.");
      return;
    }
    try {
      const res = await fetch(`http://localhost:8000/api/v1/interactions/reviews/${id}/vote`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ vote_type: type })
      });
      if (res.ok) {
        const { votes } = await res.json();
        // Update local state
        setReviews(reviews.map(r => {
          if (r.id === id) {
            const upvotes = Object.values(votes).filter(v => v === 'up').length;
            const downvotes = Object.values(votes).filter(v => v === 'down').length;
            return { ...r, votes, upvotes, downvotes };
          }
          return r;
        }));
      }
    } catch (e) {
      console.error("Error voting:", e);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    
    setIsUploadingImg(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/interactions/reviews/upload-image', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setNewReview(prev => ({ ...prev, images: [...prev.images, data.url] }));
      } else {
        alert("Error al subir imagen. Solo se permiten jpg, png, webp.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingImg(false);
    }
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

  const getUserLevelTheme = (level: number) => {
    if (level < 10) return { color: 'var(--primary)', bg: 'rgba(139, 92, 246, 0.1)' }; // Morado
    if (level < 20) return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' }; // Verde
    if (level < 30) return { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' }; // Azul
    if (level < 40) return { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' }; // Rosa
    if (level < 50) return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' }; // Naranja
    return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }; // Rojo
  };
  const submitReview = async () => {
    if (!newReview.comment.trim()) {
      alert("Por favor escribe un comentario.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/interactions/reviews/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          product_id: productId,
          rating: newReview.rating,
          comment: newReview.comment,
          images: newReview.images
        })
      });
      
      if (res.ok) {
        const created = await res.json();
        // Depending on backend, might be PENDING. Show alert.
        if (created.status === 'PENDING') {
          alert('¡Reseña enviada con éxito! Está en revisión.');
        } else {
          alert('¡Reseña publicada con éxito!');
        }
        setShowReviewForm(false);
        setNewReview({ rating: 5, comment: '', images: [] });
        // Refetch reviews
        fetch(`http://localhost:8000/api/v1/interactions/reviews/product/${productId}`)
          .then(r => r.json())
          .then(data => setReviews(data));
      } else {
        alert('Error al enviar reseña.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión.');
    } finally {
      setIsSubmitting(false);
    }
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
        <div className="glass-panel" style={{ flex: '1 1 300px', padding: '30px', borderRadius: '16px', position: 'relative', backgroundImage: 'radial-gradient(circle at top right, rgba(234,179,8,0.15) 0%, transparent 70%)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: '#eab308', borderRadius: '4px' }}></div>
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
                  <div style={{ flex: 1, height: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '5px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                    <div style={{ width: `${percent}%`, height: '100%', background: 'linear-gradient(90deg, #ca8a04, #eab308)', borderRadius: '5px', boxShadow: '0 0 10px rgba(234, 179, 8, 0.4)' }}></div>
                  </div>
                  <span style={{ width: '35px', textAlign: 'right', color: 'var(--text-muted)' }}>{percent}%</span>
                </div>
              );
            })}
          </div>

          <button 
            onClick={() => setShowReviewForm(true)}
            className="hover-card"
            style={{ width: '100%', padding: '14px', marginTop: '25px', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', color: '#eab308', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s ease' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(234, 179, 8, 0.2)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(234, 179, 8, 0.1)'}
          >
            Escribir una reseña
          </button>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '12px', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
            <Shield size={12} />
            <span>(Modo Pruebas: Restricción Desactivada)</span>
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
              const userTheme = getUserLevelTheme(userLevel);
              const dateObj = new Date(review.created_at);
              const dateStr = dateObj.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });

              return (
                <div key={review.id} className="glass-panel" style={{ padding: '25px', borderRadius: '16px', marginBottom: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', color: '#ffffff' }}>
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{userName}</div>
                        <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '6px', background: userTheme.bg }}>
                            <Shield size={12} color={userTheme.color} />
                          </div>
                          <span style={{ color: userTheme.color, fontWeight: 600 }}>Lvl {userLevel} - {userTitle}</span>
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

                  {review.images && review.images.length > 0 && (
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', overflowX: 'auto' }}>
                      {review.images.map((img, i) => (
                        <img 
                          key={i} 
                          src={`http://localhost:8000${img}`} 
                          alt="Review img" 
                          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--card-border)', cursor: 'pointer' }} 
                          onClick={() => setSelectedImage(`http://localhost:8000${img}`)}
                        />
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    <span>¿Te resultó útil esta opinión?</span>
                    <button 
                      onClick={() => handleVote(review.id, 'up')} 
                      className="hover-card"
                      style={{ background: review.votes?.[user?.id?.toString() || ''] === 'up' ? 'rgba(16, 185, 129, 0.2)' : 'none', border: '1px solid var(--card-border)', padding: '4px 10px', borderRadius: '15px', color: review.votes?.[user?.id?.toString() || ''] === 'up' ? '#10b981' : 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      <ThumbsUp size={14} /> {review.upvotes || 0}
                    </button>
                    <button 
                      onClick={() => handleVote(review.id, 'down')} 
                      className="hover-card"
                      style={{ background: review.votes?.[user?.id?.toString() || ''] === 'down' ? 'rgba(239, 68, 68, 0.2)' : 'none', border: '1px solid var(--card-border)', padding: '4px 10px', borderRadius: '15px', color: review.votes?.[user?.id?.toString() || ''] === 'down' ? '#ef4444' : 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      <ThumbsDown size={14} /> {review.downvotes || 0}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* Modal Formulario Reseña */}
      {showReviewForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in-up" style={{ width: '100%', maxWidth: '500px', padding: '30px', position: 'relative', borderLeft: '4px solid #eab308', backgroundImage: 'radial-gradient(circle at top right, rgba(234,179,8,0.15) 0%, transparent 70%)' }}>
            <button 
              onClick={() => setShowReviewForm(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><Star color="#eab308" /> Escribe tu Reseña</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-muted)' }}>Calificación</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewReview({ ...newReview, rating: star })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <Star size={32} fill={newReview.rating >= star ? "#eab308" : "transparent"} color={newReview.rating >= star ? "#eab308" : "var(--text-muted)"} style={{ transition: 'all 0.2s' }} />
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-muted)' }}>Tu Experiencia</label>
              <textarea 
                value={newReview.comment}
                onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                placeholder="¿Qué te pareció el producto? ¿Lo recomendarías?"
                style={{ width: '100%', height: '120px', padding: '15px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'white', resize: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Fotos (Opcional)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                {newReview.images.map((img, i) => (
                  <div key={i} style={{ position: 'relative', width: '60px', height: '60px' }}>
                    <img src={`http://localhost:8000${img}`} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                  </div>
                ))}
                <label className="hover-card" style={{ width: '60px', height: '60px', border: '1px dashed var(--input-border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', transition: 'all 0.2s' }}>
                  {isUploadingImg ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                  <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleImageUpload} style={{ display: 'none' }} disabled={isUploadingImg} />
                </label>
              </div>
            </div>

            <button 
              onClick={submitReview}
              disabled={isSubmitting}
              className="btn-primary" 
              style={{ width: '100%', padding: '15px', borderRadius: '12px', fontWeight: 600 }}
            >
              {isSubmitting ? 'Enviando...' : 'Publicar Reseña'}
            </button>
          </div>
        </div>
      )}

      {/* Visor de Imagen en Tamaño Completo */}
      {selectedImage && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
          onClick={() => setSelectedImage(null)}
        >
          <img src={selectedImage} alt="Full screen preview" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} onClick={(e) => e.stopPropagation()} />
          <button onClick={() => setSelectedImage(null)} style={{ position: 'absolute', top: '25px', right: '30px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} className="hover-card">
            <X size={28} />
          </button>
        </div>
      )}
    </div>
  );
}
