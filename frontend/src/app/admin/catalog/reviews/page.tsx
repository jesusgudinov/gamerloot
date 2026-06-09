"use client";

import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, XCircle, Clock, Check, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminReviews() {
  const { token } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/interactions/reviews/admin`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setReviews(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/interactions/reviews/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchReviews();
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
            <Star size={32} style={{ color: 'var(--primary)', fill: 'var(--primary)' }} />
            Moderación de Reseñas
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Aprueba o rechaza los comentarios de los clientes antes de que aparezcan en la tienda.</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Calificación</th>
              <th>Comentario</th>
              <th>Estado</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center' }}>Cargando...</td></tr>
            ) : reviews.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center' }}>No hay reseñas registradas.</td></tr>
            ) : (
              reviews.map(review => (
                <tr key={review.id}>
                  <td style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {new Date(review.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '2px', color: '#f59e0b' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} />
                      ))}
                    </div>
                  </td>
                  <td style={{ maxWidth: '300px' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.4' }}>{review.comment}</p>
                  </td>
                  <td>
                    {review.status === 'PENDING' && <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={12}/> Pendiente</span>}
                    {review.status === 'APPROVED' && <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12}/> Aprobada</span>}
                    {review.status === 'REJECTED' && <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><XCircle size={12}/> Rechazada</span>}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {review.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => updateStatus(review.id, 'APPROVED')} style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Aprobar"><Check size={18} /></button>
                        <button onClick={() => updateStatus(review.id, 'REJECTED')} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Rechazar"><X size={18} /></button>
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
