'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, User, Mail, Phone, Trophy, DollarSign, X, Edit, Ban } from 'lucide-react';
import Link from 'next/link';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(''); // e.g. "active", "whales"
  const [viewingClient, setViewingClient] = useState<any>(null);

  useEffect(() => {
    fetchClients();
  }, [search, filter]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      let url = new URL('http://127.0.0.1:8000/api/v1/clients');
      if (search) url.searchParams.append('q', search);
      // Faltaría implementar lógica de filtros en backend o filtrarlos aquí en frontend por ahora
      
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (res.ok) {
        let data = await res.json();
        
        // Frontend filtering for demo purposes
        if (filter === 'whales') {
          data = data.sort((a: any, b: any) => b.total_spent - a.total_spent);
        } else if (filter === 'active') {
          data = data.filter((c: any) => c.is_active);
        } else if (filter === 'buyers') {
          data = data.filter((c: any) => c.total_spent > 0);
        }
        
        setClients(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getGamerRank = (totalSpent: number) => {
    if (totalSpent >= 50000) return { name: 'Leyenda', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.2)' };
    if (totalSpent >= 20000) return { name: 'Oro', color: '#fcd34d', bg: 'rgba(252, 211, 77, 0.2)' };
    if (totalSpent >= 5000) return { name: 'Plata', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.2)' };
    if (totalSpent > 0) return { name: 'Bronce', color: '#b45309', bg: 'rgba(180, 83, 9, 0.2)' };
    return { name: 'Novato', color: '#64748b', bg: 'rgba(100, 116, 139, 0.2)' };
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '8px' }}>Suite de Clientes</h1>
          <p style={{ color: 'var(--text-muted)' }}>Visualiza y administra a tu comunidad de Gamers.</p>
        </div>
        <Link href="/admin/clients/create" style={{ textDecoration: 'none' }}>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
            <Plus size={20} /> Añadir Cliente Manual
          </button>
        </Link>
      </header>

      <div className="glass-panel" style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '14px' }} />
          <input 
            type="text" 
            placeholder="Buscar por Nickname, Nombre, Correo, RFC..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '12px 12px 12px 48px', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)', fontSize: '1rem' }}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <Filter size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '14px', pointerEvents: 'none' }} />
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: '12px 48px', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)', fontSize: '1rem', appearance: 'none', minWidth: '200px', cursor: 'pointer' }}
          >
            <option value="">Todos los Clientes</option>
            <option value="buyers">Solo Compradores</option>
            <option value="whales">Mejores Clientes (Ballenas)</option>
            <option value="active">Solo Activos</option>
          </select>
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div className="table-responsive-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--card-border)' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Jugador</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Contacto</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>Rango</th>
                <th style={{ padding: '16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>LTV (Gastado)</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>Estado</th>
                <th style={{ padding: '16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando jugadores...</td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron clientes en la base de datos.</td>
                </tr>
              ) : (
                clients.map((client) => {
                  const rank = getGamerRank(client.total_spent);
                  return (
                    <tr key={client.id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--card-bg)', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {client.profile_picture_url ? (
                              <img src={client.profile_picture_url} alt={client.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <User size={20} color="var(--primary)" />
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 'bold', color: 'var(--text-color)' }}>{client.username || 'Sin Nickname'}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{client.full_name || 'Sin Nombre'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', marginBottom: '4px' }}>
                          <Mail size={14} color="var(--text-muted)" /> {client.email}
                        </div>
                        {client.phone_number && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <Phone size={14} /> {client.phone_number}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', background: rank.bg, color: rank.color, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Trophy size={12} /> {rank.name}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold', color: client.total_spent > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                        ${client.total_spent.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        {client.is_active ? (
                          <span style={{ color: '#10b981', fontSize: '0.9rem' }}>Activo</span>
                        ) : (
                          <span style={{ color: '#ef4444', fontSize: '0.9rem' }}>Suspendido</span>
                        )}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => setViewingClient(client)}
                            className="action-btn"
                            title="Ver Detalles del Jugador"
                          >
                            <Eye size={18} />
                          </button>
                          <Link href={`/admin/clients/${client.id}/edit`}>
                            <button 
                              className="action-btn"
                              title="Editar Perfil"
                            >
                              <Edit size={18} />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewingClient && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 999 }} onClick={() => setViewingClient(null)} />
          <div className="glass-panel" style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '500px', zIndex: 1000, borderRadius: '0', borderLeft: '1px solid var(--card-border)', padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--card-bg)', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {viewingClient.profile_picture_url ? (
                    <img src={viewingClient.profile_picture_url} alt={viewingClient.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={32} color="var(--primary)" />
                  )}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {viewingClient.username || 'Sin Nickname'}
                    {!viewingClient.is_active && <span title="Suspendido"><Ban size={16} color="#ef4444" /></span>}
                  </h2>
                  <p style={{ margin: 0, color: 'var(--text-muted)' }}>{viewingClient.full_name || 'Sin Nombre'}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link href={`/admin/clients/${viewingClient.id}/edit`}>
                  <button className="btn-secondary" style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Edit size={18} /> Editar
                  </button>
                </Link>
                <button onClick={() => setViewingClient(null)} className="btn-secondary" style={{ padding: '8px' }}><X size={24}/></button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                <p style={{ margin: '0 0 4px 0', color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <DollarSign size={16} /> Total Gastado
                </p>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                  ${viewingClient.total_spent.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                <p style={{ margin: '0 0 4px 0', color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Trophy size={16} /> Rango Gamer
                </p>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: getGamerRank(viewingClient.total_spent).color }}>
                  {getGamerRank(viewingClient.total_spent).name}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '8px' }}>Información de Contacto</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', fontSize: '0.95rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Correo:</span>
                  <span style={{ fontWeight: 500 }}>{viewingClient.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Teléfono:</span>
                  <span style={{ fontWeight: 500 }}>{viewingClient.phone_number || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>RFC:</span>
                  <span style={{ fontWeight: 500 }}>{viewingClient.rfc || 'No proporcionado'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Fecha Registro:</span>
                  <span style={{ fontWeight: 500 }}>{new Date(viewingClient.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '8px' }}>Libreta de Direcciones</h3>
              {viewingClient.addresses && viewingClient.addresses.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {viewingClient.addresses.map((addr: any) => (
                    <div key={addr.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '0.9rem' }}>{addr.alias || 'Dirección Principal'}</span>
                        {addr.is_default && <span style={{ fontSize: '0.7rem', background: 'var(--primary)', color: '#ffffff', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>Predeterminada</span>}
                      </div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem', lineHeight: '1.4' }}>
                        {addr.street} {addr.exterior_number} {addr.interior_number ? `Int. ${addr.interior_number}` : ''}<br/>
                        Col. {addr.neighborhood}, C.P. {addr.zip_code}<br/>
                        {addr.city}, {addr.state}
                      </p>
                      {addr.references && (
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Ref: {addr.references}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                  Este cliente no tiene direcciones registradas.
                </div>
              )}
            </div>
            
            <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
              <button className="btn-secondary" style={{ width: '100%', padding: '12px' }}>Ver Historial de Pedidos (Próximamente)</button>
            </div>

          </div>
        </>
      )}

    </div>
  );
}
