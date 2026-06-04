'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Megaphone, Zap, CalendarDays } from 'lucide-react';
import Link from 'next/link';

export default function CampaignsPage() {
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
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/marketing/campaigns');
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
      const res = await fetch('http://127.0.0.1:8000/api/v1/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`http://127.0.0.1:8000/api/v1/marketing/campaigns/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCampaigns();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '8px' }}>Campañas y Eventos</h1>
          <p style={{ color: 'var(--text-muted)' }}>Agrupa descuentos y promociones bajo un mismo evento (Ej. Buen Fin).</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={20} /> Nueva Campaña
        </button>
      </header>

      {/* Lista de Campañas */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando campañas...</div>
        ) : campaigns.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay campañas creadas aún.</div>
        ) : (
          <div className="table-responsive-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--card-border)', borderBottom: '1px solid var(--card-border)' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Campaña</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Inicio</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Fin</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Estado</th>
                <th style={{ padding: '16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((camp) => (
                <tr key={camp.id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--foreground)' }}>{camp.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/{camp.slug}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CalendarDays size={16} color="var(--text-muted)" />
                      {new Date(camp.start_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CalendarDays size={16} color="var(--text-muted)" />
                      {new Date(camp.end_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', background: camp.is_active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: camp.is_active ? '#10b981' : '#ef4444' }}>
                      {camp.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <Link href={`/admin/marketing/campaigns/${camp.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(106, 17, 203, 0.1)', color: 'var(--primary)', padding: '8px', borderRadius: '8px', textDecoration: 'none' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                      </Link>
                      <button onClick={() => handleDelete(camp.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
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

      <div style={{ marginTop: '40px', padding: '32px', border: '1px dashed var(--primary)', borderRadius: '16px', background: 'rgba(106, 17, 203, 0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--primary)', color: '#fff' }}>
            <Zap size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--foreground)' }}>Ofertas Relámpago (Flash Sales)</h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Este submódulo se habilitará en la siguiente fase para anclar cuentas regresivas a productos individuales.</p>
          </div>
        </div>
      </div>

      {/* Modal Nueva Campaña */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '1.5rem', color: 'var(--foreground)' }}>Crear Nueva Campaña</h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Nombre de Campaña *</label>
                <input type="text" required value={formData.name} onChange={e => handleSlugify(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }} placeholder="Ej. Hot Sale 2026" />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Slug (URL)</label>
                <input type="text" required value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }} placeholder="Ej. hot-sale-2026" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Fecha de Inicio *</label>
                  <input type="datetime-local" required value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)', colorScheme: 'dark' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Fecha de Fin *</label>
                  <input type="datetime-local" required value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)', colorScheme: 'dark' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Guardar Campaña</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
