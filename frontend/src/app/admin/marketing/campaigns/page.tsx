'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Megaphone, Zap, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import FlashSalesSection from './FlashSalesSection';

export default function CampaignsPage() {
  const { token } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    if (token) fetchCampaigns();
  }, [token]);

  const fetchCampaigns = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:8000/api/v1/marketing/campaigns', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setCampaigns(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSlugify = (name: string) => {
    const slug = name.toLowerCase().trim().replace(/[\s\W-]+/g, '-');
    setFormData({ ...formData, name, slug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      start_date: new Date(formData.start_date).toISOString(),
      end_date: new Date(formData.end_date).toISOString(),
      is_active: true
    };

    try {
      const res = await fetch('http://localhost:8000/api/v1/marketing/campaigns', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ name: '', slug: '', description: '', start_date: '', end_date: '' });
        fetchCampaigns();
      } else {
        const error = await res.json();
        alert(error.detail || 'Error al crear campaña');
      }
    } catch (e) {
      alert('Error de conexión');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta campaña?')) return;
    try {
      const res = await fetch(`http://localhost:8000/api/v1/marketing/campaigns/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchCampaigns();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '8px' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.25rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Megaphone size={36} style={{ color: 'var(--primary)' }} />
            Campañas y Eventos
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.05rem' }}>Agrupa descuentos y promociones bajo un mismo evento (Ej. Buen Fin).</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px', padding: '12px 20px', boxShadow: '0 4px 15px rgba(106, 17, 203, 0.4)' }}>
          <Plus size={20} /> Nueva Campaña
        </button>
      </header>

      {/* Lista de Campañas */}
      <div className="glass-panel" style={{ overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, var(--primary), #3b82f6)' }}></div>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div className="spinner"></div>
            Cargando campañas...
          </div>
        ) : campaigns.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay campañas creadas aún.</div>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Campaña</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((camp) => (
                  <tr key={camp.id} style={{ transition: 'background 0.3s' }}>
                    <td>
                      <div style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {camp.name}
                        {camp.is_active && (
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
                        )}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/{camp.slug}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--foreground)' }}>
                        <CalendarDays size={16} color="var(--primary)" />
                        {new Date(camp.start_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--foreground)' }}>
                        <CalendarDays size={16} color="#ef4444" />
                        {new Date(camp.end_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold',
                        background: camp.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                        color: camp.is_active ? '#10b981' : '#ef4444',
                        border: `1px solid ${camp.is_active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                      }}>
                        {camp.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <Link href={`/admin/marketing/campaigns/${camp.id}`} className="action-btn" style={{ textDecoration: 'none' }} title="Editar Campaña">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                        </Link>
                        <button onClick={() => handleDelete(camp.id)} className="action-btn" style={{ color: '#ef4444' }} title="Eliminar">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FlashSalesSection />
      {/* Modal Nueva Campaña */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '32px', position: 'relative', overflow: 'hidden' }}>
            {/* Brillo decorativo */}
            <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)', filter: 'blur(20px)', zIndex: 0 }}></div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{ margin: '0 0 24px 0', fontSize: '1.5rem', color: 'var(--foreground)' }}>Crear Nueva Campaña</h2>
              
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nombre de Campaña *</label>
                  <input type="text" required value={formData.name} onChange={e => handleSlugify(e.target.value)} style={{ width: '100%' }} placeholder="Ej. Hot Sale 2026" />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Slug (URL)</label>
                  <input type="text" required value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} style={{ width: '100%' }} placeholder="Ej. hot-sale-2026" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fecha de Inicio *</label>
                    <input type="datetime-local" required value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} style={{ width: '100%', colorScheme: 'dark' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fecha de Fin *</label>
                    <input type="datetime-local" required value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} style={{ width: '100%', colorScheme: 'dark' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--card-border)' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary">Guardar Campaña</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
