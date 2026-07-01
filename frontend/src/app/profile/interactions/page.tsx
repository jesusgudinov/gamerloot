"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MessageSquare, Star, Edit, Trash2, ShieldAlert, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { getImageUrl } from '@/utils/imageUrl';

interface ProductBasicInfo {
  id: number;
  name: string;
  slug: string;
  main_image_url: string;
}

interface Review {
  id: number;
  product_id: number;
  rating: number;
  comment: string;
  status: string;
  created_at: string;
  product: ProductBasicInfo;
}

interface Question {
  id: number;
  product_id: int;
  question_text: string;
  answer_text: string | null;
  status: string;
  created_at: string;
  product: ProductBasicInfo;
}

export default function InteractionsPage() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'reviews' | 'questions'>('reviews');
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetchInteractions();
  }, []);

  const fetchInteractions = async () => {
    try {
      setLoading(true);
      const [resReviews, resQuestions] = await Promise.all([
        fetch('http://localhost:8000/api/v1/interactions/reviews/me', { 
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include' 
        }),
        fetch('http://localhost:8000/api/v1/interactions/questions/me', { 
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include' 
        })
      ]);
      
      if (resReviews.ok) {
        setReviews(await resReviews.json());
      }
      if (resQuestions.ok) {
        setQuestions(await resQuestions.json());
      }
    } catch (error) {
      console.error('Error fetching interactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteReview = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta reseña?')) return;
    try {
      const res = await fetch(`http://localhost:8000/api/v1/interactions/reviews/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      });
      if (res.ok) setReviews(reviews.filter(r => r.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const deleteQuestion = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta pregunta?')) return;
    try {
      const res = await fetch(`http://localhost:8000/api/v1/interactions/questions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      });
      if (res.ok) setQuestions(questions.filter(q => q.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    setEditLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/interactions/reviews/${editingReview.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          rating: editingReview.rating,
          comment: editingReview.comment
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setReviews(reviews.map(r => r.id === updated.id ? { ...r, rating: updated.rating, comment: updated.comment, status: updated.status } : r));
        setEditingReview(null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;
    setEditLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/interactions/questions/${editingQuestion.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          question_text: editingQuestion.question_text
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setQuestions(questions.map(q => q.id === updated.id ? { ...q, question_text: updated.question_text, status: updated.status, answer_text: null } : q));
        setEditingQuestion(null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setEditLoading(false);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'APPROVED' || status === 'ANSWERED') return <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14}/> {status === 'ANSWERED' ? 'Respondida' : 'Aprobada'}</span>;
    if (status === 'REJECTED') return <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><ShieldAlert size={14}/> Rechazada</span>;
    return <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14}/> Pendiente Moderación</span>;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <div className="spin" style={{ width: '40px', height: '40px', border: '3px solid var(--card-border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
        <style dangerouslySetInnerHTML={{__html: `.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}} />
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '60px' }}>
      <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '24px', color: 'var(--foreground)' }}>Mis Interacciones</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', borderBottom: '1px solid var(--card-border)', paddingBottom: '16px' }}>
        <button
          onClick={() => setActiveTab('reviews')}
          style={{ background: 'transparent', border: 'none', color: activeTab === 'reviews' ? 'var(--primary)' : 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 16px', borderRadius: '12px', transition: 'all 0.2s', ...(activeTab === 'reviews' ? { background: 'rgba(139, 92, 246, 0.1)' } : {}) }}
        >
          <Star size={20} fill={activeTab === 'reviews' ? 'currentColor' : 'none'} /> Mis Reseñas ({reviews.length})
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          style={{ background: 'transparent', border: 'none', color: activeTab === 'questions' ? '#3b82f6' : 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 16px', borderRadius: '12px', transition: 'all 0.2s', ...(activeTab === 'questions' ? { background: 'rgba(59, 130, 246, 0.1)' } : {}) }}
        >
          <MessageSquare size={20} fill={activeTab === 'questions' ? 'currentColor' : 'none'} /> Mis Preguntas ({questions.length})
        </button>
      </div>

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {reviews.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No has dejado ninguna reseña todavía.</p>
          ) : (
            reviews.map(review => (
              <div key={review.id} className="glass-panel hover-card" style={{ padding: '24px', borderRadius: '20px', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {review.product?.main_image_url && (
                      <div style={{ width: '60px', height: '60px', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getImageUrl(review.product.main_image_url)} alt={review.product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                    )}
                    <div>
                      <Link href={`/${review.product?.slug}`} style={{ color: 'var(--foreground)', textDecoration: 'none', fontWeight: 700, fontSize: '1.1rem' }}>
                        {review.product?.name || 'Producto Desconocido'}
                      </Link>
                      <div style={{ display: 'flex', gap: '2px', marginTop: '4px' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} size={16} color={star <= review.rating ? '#f59e0b' : 'var(--card-border)'} fill={star <= review.rating ? '#f59e0b' : 'none'} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={review.status} />
                </div>
                
                <p style={{ margin: '0 0 20px 0', color: 'var(--text-muted)', lineHeight: '1.6', fontStyle: 'italic' }}>
                  "{review.comment}"
                </p>
                
                {/* Render Uploaded Images */}
                {review.images && review.images.length > 0 && (
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    {review.images.map((imgUrl, idx) => (
                      <div key={idx} style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getImageUrl(imgUrl)} alt={`Imagen ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(review.created_at).toLocaleDateString('es-MX')}</span>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setEditingReview(review)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 600 }}>
                      <Edit size={16} /> Editar
                    </button>
                    <button onClick={() => deleteReview(review.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 600 }}>
                      <Trash2 size={16} /> Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {questions.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No has realizado ninguna pregunta todavía.</p>
          ) : (
            questions.map(question => (
              <div key={question.id} className="glass-panel hover-card" style={{ padding: '24px', borderRadius: '20px', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {question.product?.main_image_url && (
                      <div style={{ width: '60px', height: '60px', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getImageUrl(question.product.main_image_url)} alt={question.product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                    )}
                    <div>
                      <Link href={`/${question.product?.slug}`} style={{ color: 'var(--foreground)', textDecoration: 'none', fontWeight: 700, fontSize: '1.1rem' }}>
                        {question.product?.name || 'Producto Desconocido'}
                      </Link>
                    </div>
                  </div>
                  <StatusBadge status={question.status} />
                </div>
                
                <div style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px' }}>
                  <p style={{ margin: 0, color: 'var(--foreground)', fontWeight: 600, display: 'flex', gap: '8px' }}>
                    <MessageSquare size={18} color="#3b82f6" /> {question.question_text}
                  </p>
                </div>

                {question.answer_text ? (
                  <div style={{ marginBottom: '20px', background: 'rgba(16, 185, 129, 0.05)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#10b981', fontWeight: 700 }}>Respuesta de Gamer Loot:</p>
                    <p style={{ margin: 0, color: 'var(--foreground)', lineHeight: '1.5' }}>{question.answer_text}</p>
                  </div>
                ) : (
                  <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Esperando respuesta de nuestro equipo...</p>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(question.created_at).toLocaleDateString('es-MX')}</span>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setEditingQuestion(question)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 600 }}>
                      <Edit size={16} /> Editar
                    </button>
                    <button onClick={() => deleteQuestion(question.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 600 }}>
                      <Trash2 size={16} /> Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
          <div style={{ width: '100%', maxWidth: '500px', padding: '32px', borderRadius: '24px', background: '#0a0a0f', border: '1px solid var(--card-border)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.5rem', fontWeight: 800 }}>Editar Reseña</h2>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.9rem', display: 'flex', gap: '8px' }}>
              <ShieldAlert size={18} />
              <span>Al editar tu reseña, volverá a pasar por nuestro proceso de moderación y cambiará a estado "Pendiente".</span>
            </div>
            <form onSubmit={handleEditReview}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Calificación</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button type="button" key={star} onClick={() => setEditingReview({...editingReview, rating: star})} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                      <Star size={28} color={star <= editingReview.rating ? '#f59e0b' : 'var(--card-border)'} fill={star <= editingReview.rating ? '#f59e0b' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Comentario</label>
                <textarea 
                  value={editingReview.comment}
                  onChange={e => setEditingReview({...editingReview, comment: e.target.value})}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--card-border)', color: 'var(--foreground)', minHeight: '100px', resize: 'vertical' }}
                />
              </div>

              {/* Edit Modal Uploaded Images (Readonly for now) */}
              {editingReview.images && editingReview.images.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Imágenes adjuntas</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {editingReview.images.map((imgUrl, idx) => (
                      <div key={idx} style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getImageUrl(imgUrl)} alt={`Imagen ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setEditingReview(null)} style={{ padding: '10px 20px', borderRadius: '12px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--card-border)', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={editLoading} className="btn-primary" style={{ padding: '10px 20px', opacity: editLoading ? 0.7 : 1 }}>{editLoading ? 'Guardando...' : 'Guardar Cambios'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {editingQuestion && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
          <div style={{ width: '100%', maxWidth: '500px', padding: '32px', borderRadius: '24px', background: '#0a0a0f', border: '1px solid var(--card-border)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.5rem', fontWeight: 800 }}>Editar Pregunta</h2>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.9rem', display: 'flex', gap: '8px' }}>
              <ShieldAlert size={18} />
              <span>Al editar tu pregunta, volverá a pasar a estado "Pendiente" y cualquier respuesta anterior será eliminada.</span>
            </div>
            <form onSubmit={handleEditQuestion}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Tu pregunta</label>
                <textarea 
                  value={editingQuestion.question_text}
                  onChange={e => setEditingQuestion({...editingQuestion, question_text: e.target.value})}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--card-border)', color: 'var(--foreground)', minHeight: '100px', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setEditingQuestion(null)} style={{ padding: '10px 20px', borderRadius: '12px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--card-border)', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={editLoading} className="btn-primary" style={{ padding: '10px 20px', opacity: editLoading ? 0.7 : 1 }}>{editLoading ? 'Guardando...' : 'Guardar Cambios'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
