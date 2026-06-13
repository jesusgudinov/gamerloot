"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LifeBuoy, PackageX, Plus, MessageSquare, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function SupportPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'tickets' | 'rmas'>('tickets');
  
  const [tickets, setTickets] = useState<any[]>([]);
  const [rmas, setRmas] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showRmaModal, setShowRmaModal] = useState(false);
  
  const [newTicket, setNewTicket] = useState({ subject: '', category: 'Técnico', message: '', order_id: '' });
  const [newRma, setNewRma] = useState({ order_id: '', rma_type: 'Devolución', customer_reason: '', items: [] as any[] });
  
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [ticketsRes, rmasRes, ordersRes] = await Promise.all([
        fetch('http://localhost:8000/api/v1/support/me', { credentials: 'include' }),
        fetch('http://localhost:8000/api/v1/sales/rma/me', { credentials: 'include' }),
        fetch('http://localhost:8000/api/v1/sales/orders/me', { credentials: 'include' })
      ]);
      
      if (ticketsRes.ok) setTickets(await ticketsRes.json());
      if (rmasRes.ok) setRmas(await rmasRes.json());
      if (ordersRes.ok) setOrders(await ordersRes.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body: any = {
        subject: newTicket.subject,
        category: newTicket.category,
        message: newTicket.message,
      };
      if (newTicket.order_id) body.order_id = parseInt(newTicket.order_id);

      const res = await fetch('http://localhost:8000/api/v1/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setShowTicketModal(false);
        setNewTicket({ subject: '', category: 'Técnico', message: '', order_id: '' });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newRma.items.length === 0) {
      alert("Debes seleccionar al menos un producto a devolver.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/sales/rma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          order_id: parseInt(newRma.order_id),
          user_id: user?.id,
          rma_type: newRma.rma_type,
          customer_reason: newRma.customer_reason,
          items: newRma.items
        })
      });
      if (res.ok) {
        setShowRmaModal(false);
        setNewRma({ order_id: '', rma_type: 'Devolución', customer_reason: '', items: [] });
        fetchData();
        setActiveTab('rmas');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedOrder = orders.find(o => o.id === parseInt(newRma.order_id));

  const toggleRmaItem = (orderItemId: number, quantity: number) => {
    const exists = newRma.items.find(i => i.order_item_id === orderItemId);
    if (exists) {
      setNewRma({...newRma, items: newRma.items.filter(i => i.order_item_id !== orderItemId)});
    } else {
      setNewRma({...newRma, items: [...newRma.items, { order_item_id: orderItemId, quantity: quantity, condition: "Intacto" }]});
    }
  };

  const getStatusColor = (status: string) => {
    if (['Abierto', 'Pendiente'].includes(status)) return '#eab308'; // yellow
    if (['En Progreso', 'Reemplazado', 'Reembolsado'].includes(status)) return '#3b82f6'; // blue
    if (['Resuelto', 'Cerrado', 'Recibido', 'Aprobado'].includes(status)) return '#10b981'; // green
    if (['Rechazado'].includes(status)) return '#ef4444'; // red
    return '#8b5cf6'; // default primary
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando Centro de Soporte...</div>;

  return (
    <div style={{ paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0 0 8px 0', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '16px', letterSpacing: '-0.5px' }}>
            <div style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '12px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LifeBuoy size={32} color="var(--primary)" />
            </div>
            Centro de Soporte
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', margin: 0 }}>
            Te ayudamos con cualquier duda, garantía o problema técnico.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowTicketModal(true)} className="btn-primary hover-card" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px' }}>
            <Plus size={18} /> Crear Ticket
          </button>
          <button onClick={() => setShowRmaModal(true)} className="hover-card" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '12px', fontWeight: 700 }}>
            <PackageX size={18} /> Solicitar Garantía / RMA
          </button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', borderBottom: '1px solid var(--card-border)', paddingBottom: '16px' }}>
        <button 
          onClick={() => setActiveTab('tickets')}
          style={{ background: 'none', border: 'none', color: activeTab === 'tickets' ? 'var(--primary)' : 'var(--text-muted)', fontSize: '1.1rem', fontWeight: activeTab === 'tickets' ? 800 : 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', position: 'relative' }}
        >
          <MessageSquare size={20} /> Mis Tickets
          {activeTab === 'tickets' && <div style={{ position: 'absolute', bottom: '-17px', left: 0, width: '100%', height: '3px', background: 'var(--primary)', borderRadius: '3px 3px 0 0' }}></div>}
        </button>
        <button 
          onClick={() => setActiveTab('rmas')}
          style={{ background: 'none', border: 'none', color: activeTab === 'rmas' ? 'var(--primary)' : 'var(--text-muted)', fontSize: '1.1rem', fontWeight: activeTab === 'rmas' ? 800 : 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', position: 'relative' }}
        >
          <PackageX size={20} /> Garantías y Devoluciones (RMA)
          {activeTab === 'rmas' && <div style={{ position: 'absolute', bottom: '-17px', left: 0, width: '100%', height: '3px', background: 'var(--primary)', borderRadius: '3px 3px 0 0' }}></div>}
        </button>
      </div>

      {/* TICKETS LIST */}
      {activeTab === 'tickets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {tickets.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', borderRadius: '24px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>No tienes tickets de soporte activos.</p>
            </div>
          ) : (
            tickets.map(ticket => (
              <Link href={`/profile/support/${ticket.id}`} key={ticket.id} style={{ textDecoration: 'none' }}>
                <div className="glass-panel hover-card" style={{ padding: '24px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderLeft: `4px solid ${getStatusColor(ticket.status)}` }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--foreground)' }}>{ticket.subject}</h3>
                    <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {new Date(ticket.created_at).toLocaleDateString()}</span>
                      <span>Folio: {ticket.folio}</span>
                      <span>Categoría: {ticket.category}</span>
                    </div>
                  </div>
                  <div style={{ background: `rgba(${getStatusColor(ticket.status) === '#eab308' ? '234, 179, 8' : getStatusColor(ticket.status) === '#10b981' ? '16, 185, 129' : '59, 130, 246'}, 0.1)`, color: getStatusColor(ticket.status), padding: '6px 12px', borderRadius: '20px', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase' }}>
                    {ticket.status}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {/* RMAs LIST */}
      {activeTab === 'rmas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {rmas.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', borderRadius: '24px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>No tienes solicitudes de garantía o devolución.</p>
            </div>
          ) : (
            rmas.map(rma => (
              <div key={rma.id} className="glass-panel" style={{ padding: '24px', borderRadius: '16px', borderLeft: `4px solid ${getStatusColor(rma.status)}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--foreground)' }}>{rma.rma_type} de Pedido (Orden #{rma.order_id})</h3>
                    <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {new Date(rma.created_at).toLocaleDateString()}</span>
                      <span>Folio RMA: {rma.folio}</span>
                    </div>
                  </div>
                  <div style={{ background: `rgba(${getStatusColor(rma.status) === '#eab308' ? '234, 179, 8' : getStatusColor(rma.status) === '#10b981' ? '16, 185, 129' : getStatusColor(rma.status) === '#ef4444' ? '239, 68, 68' : '59, 130, 246'}, 0.1)`, color: getStatusColor(rma.status), padding: '6px 12px', borderRadius: '20px', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase' }}>
                    {rma.status}
                  </div>
                </div>
                <div style={{ background: 'var(--background)', padding: '16px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                  <p style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--foreground)' }}>Razón del cliente:</p>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', fontStyle: 'italic' }}>"{rma.customer_reason}"</p>
                  
                  {rma.admin_notes && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--card-border)' }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--primary)' }}>Notas del Soporte Técnico:</p>
                      <p style={{ margin: 0, color: 'var(--foreground)', fontSize: '0.95rem' }}>{rma.admin_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL CREAR TICKET */}
      {showTicketModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(139, 92, 246, 0.05)' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground)' }}>Nuevo Ticket de Soporte</h2>
              <button onClick={() => setShowTicketModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem', fontWeight: 800 }}>&times;</button>
            </div>
            
            <form onSubmit={handleCreateTicket} style={{ padding: '24px', overflowY: 'auto' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>Asunto</label>
                <input required type="text" value={newTicket.subject} onChange={e => setNewTicket({...newTicket, subject: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)', outline: 'none' }} placeholder="Ej. Duda sobre mi envío..." />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>Categoría</label>
                  <select required value={newTicket.category} onChange={e => setNewTicket({...newTicket, category: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)', outline: 'none', appearance: 'none' }}>
                    <option value="Técnico">Soporte Técnico</option>
                    <option value="Comercial">Ventas y Cotizaciones</option>
                    <option value="Facturación">Facturación y Pagos</option>
                    <option value="Otro">Otros</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>Vincular Pedido (Opcional)</label>
                  <select value={newTicket.order_id} onChange={e => setNewTicket({...newTicket, order_id: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)', outline: 'none', appearance: 'none' }}>
                    <option value="">Ninguno</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>Orden #{o.folio}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>Mensaje Detallado</label>
                <textarea required rows={5} value={newTicket.message} onChange={e => setNewTicket({...newTicket, message: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)', outline: 'none', resize: 'vertical' }} placeholder="Describe detalladamente tu solicitud..."></textarea>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowTicketModal(false)} style={{ padding: '12px 24px', background: 'transparent', color: 'var(--foreground)', border: '1px solid var(--card-border)', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '12px 24px', opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Enviando...' : 'Abrir Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR RMA */}
      {showRmaModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '700px', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(139, 92, 246, 0.05)' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground)' }}>Solicitud de Garantía / Devolución</h2>
              <button onClick={() => setShowRmaModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem', fontWeight: 800 }}>&times;</button>
            </div>
            
            <form onSubmit={handleCreateRma} style={{ padding: '24px', overflowY: 'auto' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>Selecciona el Pedido</label>
                  <select required value={newRma.order_id} onChange={e => setNewRma({...newRma, order_id: e.target.value, items: []})} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)', outline: 'none', appearance: 'none' }}>
                    <option value="" disabled>-- Elige tu pedido --</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>Orden #{o.folio} - {new Date(o.created_at).toLocaleDateString()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>Tipo de Solicitud</label>
                  <select required value={newRma.rma_type} onChange={e => setNewRma({...newRma, rma_type: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)', outline: 'none', appearance: 'none' }}>
                    <option value="Garantía">Garantía (Falla de fábrica)</option>
                    <option value="Devolución">Devolución (Ya no lo quiero / Error al comprar)</option>
                  </select>
                </div>
              </div>

              {selectedOrder && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>¿Qué productos del pedido quieres devolver/aplicar garantía?</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--background)', padding: '16px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                    {selectedOrder.items.map((item: any) => {
                      const isSelected = newRma.items.some(i => i.order_item_id === item.id);
                      return (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', background: isSelected ? 'rgba(139, 92, 246, 0.1)' : 'var(--input-bg)', border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--card-border)'}`, borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => toggleRmaItem(item.id, item.quantity)}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '6px', border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--text-muted)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSelected ? 'var(--primary)' : 'transparent' }}>
                            {isSelected && <CheckCircle size={16} color="#fff" />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontWeight: 700, color: 'var(--foreground)' }}>{item.product_name}</p>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cant: {item.quantity} | SKU: {item.sku}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>Razón Detallada</label>
                <textarea required rows={4} value={newRma.customer_reason} onChange={e => setNewRma({...newRma, customer_reason: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)', outline: 'none', resize: 'vertical' }} placeholder="Explica por qué solicitas la garantía o devolución..."></textarea>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowRmaModal(false)} style={{ padding: '12px 24px', background: 'transparent', color: 'var(--foreground)', border: '1px solid var(--card-border)', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={submitting || !newRma.order_id || newRma.items.length === 0} className="btn-primary" style={{ padding: '12px 24px', opacity: (submitting || !newRma.order_id || newRma.items.length === 0) ? 0.5 : 1 }}>
                  {submitting ? 'Enviando...' : 'Enviar Solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
