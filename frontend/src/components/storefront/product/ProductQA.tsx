"use client";
import React, { useState, useEffect } from 'react';
import { MessageCircleQuestion, Shield } from 'lucide-react';

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
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState("");

  useEffect(() => {
    fetch(`http://localhost:8000/api/v1/interactions/questions/product/${productId}`)
      .then(res => res.json())
      .then(data => {
        setQuestions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [productId]);

  const handleAsk = () => {
    if (!newQuestion.trim()) return;
    
    fetch(`http://localhost:8000/api/v1/interactions/questions/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        product_id: productId,
        question_text: newQuestion
      })
    })
    .then(res => res.json())
    .then(data => {
      alert('Pregunta enviada. Será revisada y respondida pronto.');
      setNewQuestion("");
    })
    .catch(err => console.error(err));
  };

  const getUserTitle = (level: number) => {
    if (level < 10) return "Aventurero Novato";
    if (level < 20) return "Cazador de Loot";
    if (level < 30) return "Guerrero Élite";
    if (level < 40) return "Maestro del Setup";
    if (level < 50) return "Leyenda del Loot";
    return "Dios del Loot";
  };

  return (
    <div style={{ marginTop: '50px', paddingTop: '40px', borderTop: '1px solid var(--card-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
        <h2 style={{ fontSize: '1.8rem' }}>Preguntas y Respuestas</h2>
      </div>

      <div style={{ display: 'flex', gap: '20px', background: 'var(--card-bg)', padding: '25px', borderRadius: '16px', border: '1px solid var(--card-border)', marginBottom: '30px' }}>
        <MessageCircleQuestion size={40} color="var(--primary)" style={{ flexShrink: 0 }} />
        <div style={{ width: '100%' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>¿Tienes alguna duda sobre este producto?</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>Busca respuestas de otros clientes verificados o haz tu propia pregunta a la comunidad Gamer Loot.</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              placeholder="Escribe tu pregunta..." 
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '10px 15px', color: '#fff', outline: 'none' }} 
            />
            <button onClick={handleAsk} style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0 20px', fontWeight: 'bold', cursor: 'pointer' }}>Preguntar</button>
          </div>
        </div>
      </div>

      {!loading && questions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {questions.map(q => {
            const userName = q.user?.username || q.user?.first_name || "Usuario Anónimo";
            const userTitle = getUserTitle(q.user?.level || 1);
            
            return (
              <div key={q.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--foreground)', minWidth: '40px' }}>Q:</div>
                  <div>
                    <div style={{ marginBottom: '8px', fontSize: '1.05rem' }}>{q.question_text}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Por {userName}</span>
                      <Shield size={12} color="var(--primary)" /> <span>Lvl {q.user?.level || 1} - {userTitle}</span>
                    </div>
                  </div>
                </div>

                {q.answer_text && (
                  <div style={{ display: 'flex', gap: '15px', paddingLeft: '20px', borderLeft: '2px solid var(--primary)' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--primary)', minWidth: '20px' }}>A:</div>
                    <div>
                      <div style={{ color: 'var(--foreground)', marginBottom: '5px' }}>{q.answer_text}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Respondido por Equipo Gamer Loot</div>
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
