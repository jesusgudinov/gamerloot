"use client";

import { useState, useEffect } from 'react';
import { Package, Truck, Calendar, MapPin, Search, FileDown, Send, CheckCircle2, Clock } from 'lucide-react';

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simulamos la carga desde nuestro nuevo endpoint
    fetch('http://127.0.0.1:8000/api/v1/shipping/shipments')
      .then(res => res.json())
      .then(data => {
        if (data.success) setShipments(data.shipments);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleDownloadPDF = (url: string) => {
    window.open(url, '_blank');
  };

  const handleSendToProvider = (orderId: string) => {
    alert(`Se ha enviado un correo al proveedor para la orden ${orderId} con la guía PDF adjunta.`);
  };

  const filteredShipments = shipments.filter(shipment => {
    const search = searchTerm.toLowerCase();
    return (
      shipment.order_id?.toLowerCase().includes(search) ||
      shipment.client_name?.toLowerCase().includes(search) ||
      shipment.tracking_number?.toLowerCase().includes(search) ||
      shipment.provider?.toLowerCase().includes(search) ||
      shipment.phone?.toLowerCase().includes(search) ||
      shipment.address?.toLowerCase().includes(search) ||
      shipment.products?.toLowerCase().includes(search)
    );
  });

  return (
    <div style={{ width: '100%' }}>
      <header className="admin-header">
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Truck size={32} style={{ color: 'var(--primary)' }} />
            Gestión de Envíos
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Administra y rastrea las guías de paquetería generadas
          </p>
        </div>
        
        <div className="header-actions" style={{ display: 'flex', gap: '1rem' }}>
          <div className="input-group" style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Buscar envío..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '40px', width: '100%', minWidth: '250px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-text)', padding: '10px 14px 10px 40px', borderRadius: '8px' }} 
            />
          </div>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
            Sincronizar Estados
          </button>
        </div>
      </header>
      
      <div className="glass-panel" style={{ padding: '24px', animation: 'fadeIn 0.3s ease-out' }}>
        <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .header-actions {
            flex-direction: column;
            width: 100%;
          }
          .header-actions .input-group {
            width: 100%;
          }
          .header-actions input {
            min-width: 100% !important;
          }
        }
      `}} />

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Cargando envíos...
        </div>
      ) : shipments.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--background)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
          <Package size={48} style={{ color: 'var(--text-secondary)', margin: '0 auto 1rem auto', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.25rem', color: 'var(--foreground)', marginBottom: '0.5rem' }}>No hay envíos registrados</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
            Los envíos se listarán aquí una vez que un cliente complete un pedido en la tienda o cuando generes una guía manualmente.
          </p>
        </div>
      ) : filteredShipments.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--background)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
          <Search size={48} style={{ color: 'var(--text-secondary)', margin: '0 auto 1rem auto', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.25rem', color: 'var(--foreground)', marginBottom: '0.5rem' }}>No se encontraron resultados</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Intenta con otros términos de búsqueda.</p>
        </div>
      ) : (
        <div className="table-responsive-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '1rem' }}>Pedido / Cliente</th>
                <th style={{ padding: '1rem' }}>Detalle / Envío</th>
                <th style={{ padding: '1rem' }}>Paquetería / Guía</th>
                <th style={{ padding: '1rem' }}>Estado</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.map((shipment) => (
                <tr key={shipment.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '4px' }}>{shipment.order_id}</div>
                    <div style={{ fontWeight: 500 }}>{shipment.client_name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{shipment.phone}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--foreground)', marginBottom: '4px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={shipment.products}>
                      <Package size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/> 
                      {shipment.products}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={shipment.address}>
                      <MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/> 
                      {shipment.address}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>{shipment.provider}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{shipment.tracking_number}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                      {shipment.status === 'en_transito' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
                          <Truck size={14} /> En Tránsito
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
                          <CheckCircle2 size={14} /> Creado
                        </span>
                      )}
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <Clock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }}/>
                        {new Date(shipment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleDownloadPDF(shipment.label_url)}
                        title="Descargar PDF"
                        className="action-btn"
                        style={{ color: 'var(--primary)' }}
                      >
                        <FileDown size={18} />
                      </button>
                      <button 
                        onClick={() => handleSendToProvider(shipment.order_id)}
                        title="Enviar Guía a Proveedor"
                        className="action-btn"
                      >
                        <Send size={18} />
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
    </div>
  );
}
