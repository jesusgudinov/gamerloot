"use client";

import React, { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle, XCircle, Clock, Send, X, MessageCircleQuestion } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminQuestions() {
  const { token } = useAuth();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [answeringId, setAnsweringId] = useState<number | null>(null);
  const [answerText, setAnswerText] = useState("");

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/interactions/questions/admin`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setQuestions(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (id: number) => {
    if (!answerText.trim()) return;
    try {
      const res = await fetch(`http://localhost:8000/api/v1/interactions/questions/${id}/answer`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answer_text: answerText })
      });
      if (res.ok) {
        setAnsweringId(null);
        setAnswerText("");
        fetchQuestions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const rejectQuestion = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/interactions/questions/${id}/reject`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchQuestions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }
        .admin-table th, .admin-table td {
          padding: 16px;
          text-align: left;
          border-bottom: 1px solid var(--card-border);
          vertical-align: middle;
        }
        .admin-table th {
          color: var(--text-muted);
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: rgba(255, 255, 255, 0.02);
        }
        .admin-table tbody tr {
          transition: background 0.2s;
        }
        .admin-table tbody tr:hover {
          background: rgba(255, 255, 255, 0.015);
        }
      `}} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MessageCircleQuestion size={32} style={{ color: 'var(--primary)' }} />
            Preguntas y Respuestas
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Responde a las dudas de los clientes para incentivar sus compras.</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Pregunta</th>
              <th>Tu Respuesta</th>
              <th>Estado</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center' }}>Cargando...</td></tr>
            ) : questions.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center' }}>No hay preguntas registradas.</td></tr>
            ) : (
              questions.map(q => (
                <tr key={q.id}>
                  <td style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {new Date(q.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ maxWidth: '250px' }}>
                    <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500, color: 'var(--foreground)' }}>{q.question_text}</p>
                  </td>
                  <td style={{ maxWidth: '300px' }}>
                    {answeringId === q.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <textarea 
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          placeholder="Escribe tu respuesta aquí..."
                          style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--input-bg)', color: 'var(--input-text)', border: '1px solid var(--input-border)', minHeight: '60px' }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => submitAnswer(q.id)} style={{ padding: '6px 12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                            <Send size={14}/> Enviar
                          </button>
                          <button onClick={() => { setAnsweringId(null); setAnswerText(""); }} style={{ padding: '6px 12px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--input-border)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: q.answer_text ? 'normal' : 'italic' }}>
                        {q.answer_text || 'Sin respuesta aún.'}
                      </p>
                    )}
                  </td>
                  <td>
                    {q.status === 'PENDING' && <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={12}/> Pendiente</span>}
                    {q.status === 'ANSWERED' && <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12}/> Respondida</span>}
                    {q.status === 'REJECTED' && <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><XCircle size={12}/> Rechazada</span>}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {q.status === 'PENDING' && answeringId !== q.id && (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => { setAnsweringId(q.id); setAnswerText(""); }} style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Responder"><MessageSquare size={18}/></button>
                        <button onClick={() => rejectQuestion(q.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Rechazar"><X size={18}/></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
