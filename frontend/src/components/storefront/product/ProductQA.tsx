"use client";
import React, { useState, useEffect } from 'react';
import { MessageCircleQuestion, Shield, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface UserBasicInfo {
  id: number;
  username?: string;
  first_name?: string;
  level: number;
}

interface Question {
  id: number;
  product_id: number;
  question_text: string;
  answer_text?: string;
  status: string;
  created_at: string;
  answered_at?: string;
  user?: UserBasicInfo;
}

interface ProductQAProps {
  productId: number;
}

export default function ProductQA({ productId }: ProductQAProps) {
  const { token, user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState("");
  const [showQAForm, setShowQAForm] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:8000/api/v1/interactions/questions/product/${productId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setQuestions(data);
        } else {
          console.error("Expected array of questions, got:", data);
          setQuestions([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [productId]);

  const handleAsk = () => {
    if (!newQuestion.trim()) return;
    if (!token) {
      alert("Debes iniciar sesión para hacer una pregunta.");
      return;
    }
    
    fetch(`http://localhost:8000/api/v1/interactions/questions/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      body: JSON.stringify({
        product_id: productId,
        question_text: newQuestion
      })
    })
    .then(async res => {
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Error al enviar la pregunta");
      }
      return res.json();
    })
    .then(data => {
      alert('Pregunta enviada. Será revisada y respondida pronto.');
      setNewQuestion("");
      setShowQAForm(false);
    })
    .catch(err => {
      console.error(err);
      alert(err.message);
    });
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

  return (
    <div style={{ marginTop: '50px', paddingTop: '40px', borderTop: '1px solid var(--card-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
        <h2 style={{ fontSize: '1.8rem' }}>Preguntas y Respuestas</h2>
      </div>

      <div className="glass-panel hover-card" style={{ display: 'flex', gap: '20px', backgroundImage: 'radial-gradient(circle at top right, rgba(139,92,246,0.15) 0%, transparent 70%)', padding: '25px', borderRadius: '16px', borderLeft: '4px solid var(--primary)', marginBottom: '30px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <MessageCircleQuestion size={32} color="var(--primary)" />
        </div>
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--foreground)' }}>¿Tienes alguna duda sobre este producto?</h3>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Busca respuestas de otros clientes o haz tu propia pregunta a la comunidad Gamer Loot.</p>
          </div>
          <button 
            onClick={() => setShowQAForm(true)}
            style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 20px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Hacer una pregunta
          </button>
        </div>
      </div>

      {showQAForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in-up" style={{ width: '100%', maxWidth: '500px', padding: '30px', position: 'relative', borderLeft: '4px solid var(--primary)', backgroundImage: 'radial-gradient(circle at top right, rgba(139,92,246,0.15) 0%, transparent 70%)' }}>
            <button 
              onClick={() => setShowQAForm(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--foreground)' }}><MessageCircleQuestion color="var(--primary)" /> Escribe tu Pregunta</h3>
            
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-muted)' }}>¿Qué deseas saber?</label>
              <textarea 
                value={newQuestion}
                onChange={e => setNewQuestion(e.target.value)}
                placeholder="Ej. ¿Tiene garantía en México? ¿Incluye cables?"
                style={{ width: '100%', height: '120px', padding: '15px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'white', resize: 'none' }}
              />
            </div>

            <button 
              onClick={handleAsk}
              className="btn-primary" 
              style={{ width: '100%', padding: '15px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}
            >
              Enviar Pregunta
            </button>
          </div>
        </div>
      )}

      {!loading && questions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {questions.map(q => {
            const userName = q.user?.username || q.user?.first_name || "Usuario Anónimo";
            const userLevel = q.user?.level || 1;
            const userTitle = getUserTitle(userLevel);
            const userTheme = getUserLevelTheme(userLevel);
            
            return (
              <div key={q.id} className="glass-panel hover-card" style={{ padding: '24px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <div style={{ fontWeight: '900', color: 'var(--primary)', fontSize: '1.2rem', minWidth: '24px' }}>P:</div>
                  <div>
                    <div style={{ marginBottom: '8px', fontSize: '1.05rem' }}>{q.question_text}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Por {userName}</span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '6px', background: userTheme.bg }}>
                        <Shield size={12} color={userTheme.color} />
                      </div>
                      <span style={{ color: userTheme.color, fontWeight: 600 }}>Lvl {userLevel} - {userTitle}</span>
                    </div>
                  </div>
                </div>

                {q.answer_text && (
                  <div style={{ 
                    display: 'flex', gap: '15px', padding: '16px 20px', 
                    background: 'rgba(16, 185, 129, 0.05)', borderRadius: '0 12px 12px 0', 
                    borderLeft: '4px solid #10b981', marginTop: '16px' 
                  }}>
                    <div style={{ fontWeight: '900', color: '#10b981', fontSize: '1.2rem', minWidth: '24px' }}>R:</div>
                    <div>
                      <div style={{ color: 'var(--foreground)', marginBottom: '8px', lineHeight: '1.5' }}>{q.answer_text}</div>
                      <div style={{ fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                        <Shield size={14} /> Equipo Gamer Loot
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {!loading && questions.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px 0' }}>No hay preguntas respondidas todavía.</div>
      )}
    </div>
  );
}
