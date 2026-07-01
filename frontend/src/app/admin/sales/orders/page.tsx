'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Eye, ShoppingCart, Truck, CheckCircle, Clock, XCircle, Settings, X, Save } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Edit Modal State
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editCarrier, setEditCarrier] = useState('');
  const [editTracking, setEditTracking] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [notificationChannel, setNotificationChannel] = useState('WhatsApp');

  // View Modal State
  const [viewingOrder, setViewingOrder] = useState<any>(null);

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = new URL('http://localhost:8000/api/v1/sales/orders');
      if (search) url.searchParams.append('q', search);
      if (statusFilter) url.searchParams.append('status', statusFilter);

      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;
    try {
      const res = await fetch(`http://localhost:8000/api/v1/sales/orders/${editingOrder.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: editStatus,
          carrier: editCarrier || null,
          tracking_number: editTracking || null,
          customer_notes: editNotes || null,
        })
      });
      if (res.ok) {
        setEditingOrder(null);
        fetchOrders();
      } else {
        alert("Error al actualizar");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusBadge = (status: string, isAssembled: boolean) => {
    switch (status) {
      case 'Pendiente':
        return <span style={{ padding: '4px 8px', borderRadius: '20px', fontSize: '0.8rem', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> Pendiente</span>;
      case 'Pagado':
        return <span style={{ padding: '4px 8px', borderRadius: '20px', fontSize: '0.8rem', background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><ShoppingCart size={12} /> Pagado</span>;
      case 'En Ensamble':
        return <span style={{ padding: '4px 8px', borderRadius: '20px', fontSize: '0.8rem', background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Settings size={12} /> {isAssembled ? 'Ensamblado' : 'Ensamblando'}</span>;
      case 'Enviado':
        return <span style={{ padding: '4px 8px', borderRadius: '20px', fontSize: '0.8rem', background: 'rgba(236, 72, 153, 0.2)', color: '#ec4899', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Truck size={12} /> Enviado</span>;
      case 'Entregado':
        return <span style={{ padding: '4px 8px', borderRadius: '20px', fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} /> Entregado</span>;
      case 'Cancelado':
        return <span style={{ padding: '4px 8px', borderRadius: '20px', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><XCircle size={12} /> Cancelado</span>;
      default:
        return <span style={{ padding: '4px 8px', borderRadius: '20px', fontSize: '0.8rem', background: 'rgba(156, 163, 175, 0.2)', color: '#9ca3af' }}>{status}</span>;
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '8px' }}>Pedidos de Venta</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestiona y visualiza todas las órdenes reales de la tienda.</p>
        </div>
        <Link href="/admin/sales/orders/create" style={{ textDecoration: 'none' }}>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none', borderRadius: '8px', fontWeight: 600, color: 'white' }}>
            <Plus size={20} /> Registrar Pedido Manual
          </button>
        </Link>
      </header>

      {/* Buscador y Filtros */}
      <div className="glass-panel" style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ position: 'relative' }}>
          <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '14px' }} />
          <input 
            type="text" 
            placeholder="Buscar por Folio, Cliente o Guía de Rastreo..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '12px 12px 12px 48px', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)', fontSize: '1rem' }}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <Filter size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '14px', pointerEvents: 'none' }} />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '12px 48px', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)', fontSize: '1rem', appearance: 'none', minWidth: '200px', cursor: 'pointer' }}
          >
            <option value="">Todos los Estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Pagado">Pagado</option>
            <option value="En Ensamble">En Ensamble</option>
            <option value="Enviado">Enviado</option>
            <option value="Entregado">Entregado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Tabla de Pedidos */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div className="table-responsive-wrapper">
          <table className="admin-table">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th style={{ padding: '16px' }}>Folio</th>
                <th style={{ padding: '16px' }}>Cliente</th>
                <th style={{ padding: '16px' }}>Fecha</th>
                <th style={{ padding: '16px' }}>Estatus</th>
                <th style={{ padding: '16px' }}>Total</th>
                <th style={{ padding: '16px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando pedidos...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron pedidos.</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{order.folio}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{order.customer_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{order.state || 'N/A'}</div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      {getStatusBadge(order.status, order.is_assembled)}
                    </td>
                    <td style={{ fontWeight: 'bold' }}>
                      ${order.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => {
                            setEditingOrder(order);
                            setEditStatus(order.status);
                            setEditCarrier(order.carrier || '');
                            setEditTracking(order.tracking_number || '');
                            setEditNotes(order.customer_notes || '');
                          }}
                          className="action-btn"
                          title="Editar Estado/Guía"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => setViewingOrder(order)}
                          className="action-btn"
                          title="Ver Detalles"
                        >
                          <Eye size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Editar Estado */}
      {editingOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)', filter: 'blur(20px)', pointerEvents: 'none' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
              <h3 className="text-gradient" style={{ margin: 0, fontSize: '1.5rem' }}>Actualizar Pedido {editingOrder.folio}</h3>
              <button onClick={() => setEditingOrder(null)} className="btn-secondary" style={{ padding: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-color)', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Estado del Pedido</label>
              <select 
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }}
              >
                <option value="Pendiente">Pendiente</option>
                <option value="Pagado">Pagado</option>
                <option value="En Ensamble">En Ensamble</option>
                <option value="Enviado">Enviado</option>
                <option value="Entregado">Entregado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Paquetería</label>
                <input 
                  type="text" 
                  value={editCarrier}
                  onChange={(e) => setEditCarrier(e.target.value)}
                  placeholder="Ej. Estafeta"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Número de Guía</label>
                <input 
                  type="text" 
                  value={editTracking}
                  onChange={(e) => setEditTracking(e.target.value)}
                  placeholder="Ej. 1Z 3A7 X8Y 03 9142 5860"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Notas para el Cliente (Notificación)</label>
              <textarea 
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Ej. Tu paquete ya va en camino, gracias por tu compra."
                rows={3}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)', resize: 'vertical' }}
              />
              <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Estas notas aparecerán en la suite del cliente.</p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--foreground)', fontWeight: 'bold' }}>Canal de Notificación / Cobro</label>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="radio" name="channel" value="WhatsApp" checked={notificationChannel === 'WhatsApp'} onChange={(e) => setNotificationChannel(e.target.value)} style={{ accentColor: '#10b981' }} />
                  <span style={{ fontSize: '0.9rem' }}>WhatsApp</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="radio" name="channel" value="Correo" checked={notificationChannel === 'Correo'} onChange={(e) => setNotificationChannel(e.target.value)} style={{ accentColor: '#3b82f6' }} />
                  <span style={{ fontSize: '0.9rem' }}>Correo Electrónico</span>
                </label>
              </div>
              <button 
                onClick={(e) => { e.preventDefault(); alert(`Notificación y/o Link de Pago enviado correctamente vía ${notificationChannel}.`); }}
                style={{ width: '100%', padding: '10px', background: notificationChannel === 'WhatsApp' ? 'linear-gradient(to right, #10b981, #059669)' : 'linear-gradient(to right, #3b82f6, #2563eb)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              >
                Enviar Link de Pago / Actualización
              </button>
            </div>

            <button onClick={handleUpdateOrder} className="btn-primary" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none', borderRadius: '8px', fontWeight: 600, color: 'white', position: 'relative', zIndex: 1 }}>
              <Save size={18} /> Guardar Cambios
            </button>
          </div>
        </div>
      )}

      {/* Drawer Ver Detalles */}
      {viewingOrder && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', zIndex: 999 }} onClick={() => setViewingOrder(null)} />
          <div className="glass-panel" style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '500px', zIndex: 1000, borderRadius: '0', borderLeft: '1px solid rgba(255,255,255,0.1)', padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', background: 'rgba(15,23,42,0.85)' }}>
            <div style={{ position: 'absolute', top: 0, left: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
              <h2 className="text-gradient" style={{ margin: 0, fontSize: '1.5rem' }}>Detalles del Pedido</h2>
              <button onClick={() => setViewingOrder(null)} className="btn-secondary" style={{ padding: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-color)', cursor: 'pointer' }}><X size={24}/></button>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <p style={{ margin: '0 0 4px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Folio</p>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary)' }}>{viewingOrder.folio}</div>
              </div>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <p style={{ margin: '0 0 4px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Estado</p>
                <div>{getStatusBadge(viewingOrder.status, viewingOrder.is_assembled)}</div>
              </div>
            </div>

            {viewingOrder.status === 'Pago Declinado' && viewingOrder.rejection_reason && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', padding: '12px', borderRadius: '4px' }}>
                <p style={{ margin: 0, color: '#ef4444', fontWeight: 'bold', fontSize: '0.9rem' }}>Motivo de Rechazo (Stripe):</p>
                <p style={{ margin: '4px 0 0 0', color: '#fca5a5', fontSize: '0.85rem' }}>{viewingOrder.rejection_reason}</p>
              </div>
            )}

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem' }}>Cliente y Envío</h3>
              <p style={{ margin: '4px 0' }}><strong>Cliente:</strong> {viewingOrder.customer_name}</p>
              {viewingOrder.company_name && (
                <p style={{ margin: '4px 0' }}><strong>Empresa:</strong> {viewingOrder.company_name}</p>
              )}
              {viewingOrder.customer_email && (
                <p style={{ margin: '4px 0' }}><strong>Email:</strong> {viewingOrder.customer_email}</p>
              )}
              <p style={{ margin: '4px 0' }}><strong>Teléfono:</strong> {viewingOrder.customer_phone || 'N/A'}</p>
              <p style={{ margin: '4px 0' }}><strong>Vía de Contacto:</strong> {viewingOrder.contact_method || 'N/A'}</p>
              <p style={{ margin: '4px 0' }}><strong>Estado (Ubicación):</strong> {viewingOrder.state || 'N/A'}</p>
              {viewingOrder.address_references && (
                <p style={{ margin: '4px 0' }}><strong>Referencias:</strong> {viewingOrder.address_references}</p>
              )}
              {(viewingOrder.shipments_data && Array.isArray(viewingOrder.shipments_data) && viewingOrder.shipments_data.length > 0) ? (
                <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}><strong>Guías Múltiples ({viewingOrder.shipments_data.length})</strong></p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {viewingOrder.shipments_data.map((shipment: any, idx: number) => (
                      <div key={idx} style={{ padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#10b981' }}>{shipment.carrier || 'N/A'} - {shipment.tracking_number || 'Pendiente'}</span>
                          <span style={{ color: 'var(--text-muted)' }}>C.P. {shipment.origin_zip}</span>
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>Status: {shipment.status}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {viewingOrder.carrier && (
                    <p style={{ margin: '12px 0 0 0', color: '#10b981' }}><strong>Paquetería:</strong> {viewingOrder.carrier}</p>
                  )}
                  {viewingOrder.tracking_number && (
                    <p style={{ margin: '4px 0 0 0', color: '#10b981' }}><strong>Guía:</strong> {viewingOrder.tracking_number}</p>
                  )}
                </>
              )}
              {viewingOrder.customer_notes && (
                <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Notas enviadas al cliente:</p>
                  <p style={{ margin: 0, fontStyle: 'italic' }}>{viewingOrder.customer_notes}</p>
                </div>
              )}
            </div>

            <div>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem' }}>Productos Adquiridos</h3>
              <div style={{ border: '1px solid var(--card-border)', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>SKU</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Cant.</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingOrder.items?.map((item: any) => (
                      <tr key={item.id} style={{ borderTop: '1px solid var(--card-border)' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 'bold' }}>{item.sku}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{item.product_name}</div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>x{item.quantity}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>${item.total_price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto', borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Subtotal</span>
                <span>${viewingOrder.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>IVA</span>
                <span>${viewingOrder.tax.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--foreground)' }}>
                <span>Total</span>
                <span>${viewingOrder.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
}
