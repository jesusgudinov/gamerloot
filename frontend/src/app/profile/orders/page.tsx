"use client";

import { useEffect, useState } from 'react';
import { Package, Search, Clock, CheckCircle2, XCircle, Truck, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: number;
  folio: string;
  created_at: string;
  status: string;
  total: number;
  items: OrderItem[];
  tracking_number?: string;
}

export default function ProfileOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/v1/sales/my-orders', {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, []);

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'Pendiente': return { color: '#eab308', bg: 'rgba(234, 179, 8, 0.1)', icon: <Clock size={16} /> };
      case 'Pagado': return { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', icon: <CheckCircle2 size={16} /> };
      case 'Procesando': return { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', icon: <Package size={16} /> };
      case 'Enviado': return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: <Truck size={16} /> };
      case 'Entregado': return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: <CheckCircle2 size={16} /> };
      case 'Cancelado': return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', icon: <XCircle size={16} /> };
      default: return { color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)', icon: <Clock size={16} /> };
    }
  };

  const filteredOrders = orders.filter(o => 
    o.folio.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.items.some(i => i.product_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px', color: 'var(--foreground)' }}>
        Mis Pedidos
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '1.05rem' }}>
        Revisa el estado de tus compras, rastrea tus envíos y solicita devoluciones.
      </p>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: '32px', maxWidth: '500px' }}>
        <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          placeholder="Buscar por folio o producto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
          style={{ 
            width: '100%', padding: '16px 16px 16px 48px', borderRadius: '14px', 
            border: '1px solid var(--card-border)', background: 'var(--card-bg)', 
            color: 'var(--foreground)', fontSize: '1rem', outline: 'none', transition: 'all 0.2s'
          }} 
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spin" style={{ width: '40px', height: '40px', border: '4px solid var(--card-border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 20px', borderRadius: '24px', textAlign: 'center', background: 'var(--card-bg)', border: '1px dashed var(--card-border)' }}>
          <div style={{ display: 'inline-flex', padding: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.02)', marginBottom: '16px' }}>
            <Package size={48} color="var(--text-muted)" style={{ opacity: 0.5 }} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--foreground)' }}>No se encontraron pedidos</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            {searchTerm ? 'Intenta usar otro término de búsqueda.' : 'Aún no tienes pedidos en tu historial. ¡Empieza a llenar tu inventario!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredOrders.map(order => {
            const statusConfig = getStatusConfig(order.status);
            return (
              <div key={order.id} className="glass-panel hover-card" style={{ 
                padding: '24px', borderRadius: '20px', background: 'var(--card-bg)', 
                border: order.status === 'Pendiente' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--card-border)', 
                boxShadow: order.status === 'Pendiente' ? '0 0 20px rgba(245, 158, 11, 0.05)' : 'none',
                display: 'flex', flexDirection: 'column', gap: '20px',
                position: 'relative', overflow: 'hidden'
              }}>
                {order.status === 'Pendiente' && (
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: '#f59e0b' }}></div>
                )}
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--card-border)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--foreground)' }}>
                        Pedido #{order.folio}
                      </h3>
                      <div style={{ 
                        display: 'flex', alignItems: 'center', gap: '6px', 
                        padding: '6px 12px', borderRadius: '20px', 
                        background: statusConfig.bg, color: statusConfig.color,
                        fontSize: '0.8rem', fontWeight: 700
                      }}>
                        {statusConfig.icon} {order.status}
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      Realizado el {new Date(order.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Total Pagado</p>
                    <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--foreground)' }}>
                      ${order.total.toLocaleString('es-MX')} MXN
                    </p>
                  </div>
                </div>

                {/* Items Preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {order.items.slice(0, 3).map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--input-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Package size={20} color="var(--text-muted)" />
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--foreground)' }}>{item.product_name}</p>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--foreground)' }}>
                        ${item.total_price.toLocaleString('es-MX')}
                      </p>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, textAlign: 'center' }}>
                      + {order.items.length - 3} artículo(s) más
                    </p>
                  )}
                </div>

                {/* Footer / Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--card-border)' }}>
                  <div>
                    {order.tracking_number && (
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <Truck size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                        Guía: <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{order.tracking_number}</span>
                      </p>
                    )}
                  </div>
                  <Link href={`/profile/orders/${order.folio}`} style={{ textDecoration: 'none' }}>
                    <button 
                      style={{ 
                        background: order.status === 'Pendiente' ? 'rgba(245, 158, 11, 0.1)' : 'transparent', 
                        border: order.status === 'Pendiente' ? '1px solid #f59e0b' : '1px solid var(--primary)', 
                        color: order.status === 'Pendiente' ? '#f59e0b' : 'var(--primary)',
                        padding: '10px 20px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = order.status === 'Pendiente' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(139, 92, 246, 0.1)' }}
                      onMouseOut={(e) => { e.currentTarget.style.background = order.status === 'Pendiente' ? 'rgba(245, 158, 11, 0.1)' : 'transparent' }}
                    >
                      {order.status === 'Pendiente' ? 'Pagar Ahora' : 'Ver Detalles'} <ChevronRight size={16} />
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .search-input:focus {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
        }
      `}} />
    </div>
  );
}
