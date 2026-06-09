"use client";

import { useState } from 'react';
import { Truck, PackageSearch, Package, MapPin, Loader2, ArrowRight } from 'lucide-react';

export default function QuotePage() {
  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState<any[]>([]);
  const [error, setError] = useState('');

  const [origin, setOrigin] = useState({ provider: 'DEFAULT', city: 'CDMX' });
  const [destination, setDestination] = useState({
    postal_code: '',
    area_level1: '',
    area_level2: '',
    area_level3: '',
    street1: ''
  });
  const [parcel, setParcel] = useState({
    weight: 2,
    length: 20,
    width: 20,
    height: 20
  });

  const handleQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setRates([]);

    try {
      const res = await fetch(`http://localhost:8000/api/v1/shipping/quote?origin_provider=${origin.provider}&origin_city=${origin.city}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address_to: {
            country_code: 'MX',
            postal_code: destination.postal_code,
            area_level1: destination.area_level1,
            area_level2: destination.area_level2,
            area_level3: destination.area_level3,
            street1: destination.street1,
            company: 'Cliente GL',
            name: 'Cliente Final',
            phone: '5555555555',
            email: 'cliente@gamerloot.com',
            reference: 'Generado desde admin'
          },
          parcels: [
            {
              weight: Number(parcel.weight),
              length: Number(parcel.length),
              width: Number(parcel.width),
              height: Number(parcel.height)
            }
          ]
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Error al cotizar');

      if (data.success && data.rates) {
        setRates(data.rates);
      } else {
        setError(data.message || 'No se encontraron tarifas');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <header className="admin-header">
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <PackageSearch size={32} style={{ color: 'var(--primary)' }} />
            Cotizador de Envíos
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Consulta tarifas de paqueterías en tiempo real (Modo de Prueba / Venta Manual)
          </p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* FORMULARIO */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }}></div>
          <form onSubmit={handleQuote} style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', zIndex: 1 }}>
            
            {/* ORIGEN */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 1 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', marginBottom: '16px', color: 'var(--foreground)' }}>
                <Package size={20} style={{ color: 'var(--primary)' }} /> Origen (Almacén)
              </h3>
              <div className="grid-cols-2">
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Proveedor / CEDIS</label>
                  <select 
                    value={origin.provider} 
                    onChange={e => setOrigin({...origin, provider: e.target.value})}
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--input-text)', appearance: 'none' }}
                  >
                    <option value="DEFAULT">Genérico (GL)</option>
                    <option value="PCH">PCH Mayoreo</option>
                    <option value="TechSmart">TechSmart</option>
                    <option value="CVA">CVA</option>
                    <option value="Importacion Digital">Importación Digital</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Ciudad</label>
                  <select 
                    value={origin.city} 
                    onChange={e => setOrigin({...origin, city: e.target.value})}
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--input-text)', appearance: 'none' }}
                  >
                    <option value="CDMX">CDMX</option>
                    <option value="GDL">Guadalajara</option>
                  </select>
                </div>
              </div>
            </div>

            {/* DESTINO */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 1 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', marginBottom: '16px', color: 'var(--foreground)' }}>
                <MapPin size={20} style={{ color: 'var(--primary)' }} /> Destino (Cliente)
              </h3>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Código Postal</label>
                <input 
                  type="text" 
                  placeholder="Ej. 64000" 
                  value={destination.postal_code}
                  onChange={e => setDestination({...destination, postal_code: e.target.value})}
                  required 
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--input-text)' }}
                />
              </div>
              <div className="grid-cols-2" style={{ marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Estado</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Nuevo León" 
                    value={destination.area_level1}
                    onChange={e => setDestination({...destination, area_level1: e.target.value})}
                    required 
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--input-text)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Ciudad</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Monterrey" 
                    value={destination.area_level2}
                    onChange={e => setDestination({...destination, area_level2: e.target.value})}
                    required 
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--input-text)' }}
                  />
                </div>
              </div>
              <div className="grid-cols-2">
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Colonia</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Centro" 
                    value={destination.area_level3}
                    onChange={e => setDestination({...destination, area_level3: e.target.value})}
                    required 
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--input-text)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Calle y Número</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Calle Falsa 123" 
                    value={destination.street1}
                    onChange={e => setDestination({...destination, street1: e.target.value})}
                    required 
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--input-text)' }}
                  />
                </div>
              </div>
            </div>

            {/* PAQUETE */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 1 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', marginBottom: '16px', color: 'var(--foreground)' }}>
                <Truck size={20} style={{ color: 'var(--primary)' }} /> Detalles del Paquete
              </h3>
              <div className="grid-cols-4">
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Peso (kg)</label>
                  <input type="number" min="0.1" step="0.1" value={parcel.weight} onChange={e => setParcel({...parcel, weight: Number(e.target.value)})} required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--input-text)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Largo (cm)</label>
                  <input type="number" min="1" value={parcel.length} onChange={e => setParcel({...parcel, length: Number(e.target.value)})} required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--input-text)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Ancho (cm)</label>
                  <input type="number" min="1" value={parcel.width} onChange={e => setParcel({...parcel, width: Number(e.target.value)})} required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--input-text)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Alto (cm)</label>
                  <input type="number" min="1" value={parcel.height} onChange={e => setParcel({...parcel, height: Number(e.target.value)})} required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--input-text)' }} />
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none', borderRadius: '8px', fontWeight: 600, color: 'white', boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)' }} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <><PackageSearch /> Obtener Tarifas</>}
            </button>

          </form>
        </div>

        {/* RESULTADOS */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }}></div>
          <div style={{ position: 'sticky', top: '2rem', zIndex: 1 }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', color: 'var(--foreground)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
              Tarifas Disponibles
            </h3>
            
            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <Loader2 className="animate-spin" size={40} style={{ marginBottom: '16px', color: 'var(--primary)' }} />
                <p>Consultando con las paqueterías...</p>
              </div>
            )}

            {error && (
              <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <strong>Error: </strong> {error}
              </div>
            )}

            {!loading && rates.length === 0 && !error && (
              <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <PackageSearch size={48} style={{ margin: '0 auto 16px auto', color: 'var(--card-border)' }} />
                Ingresa los datos y haz clic en "Obtener Tarifas" para ver las opciones disponibles.
              </div>
            )}

            {!loading && rates.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {rates.map((rate, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '20px', 
                    background: 'var(--input-bg)', 
                    border: '1px solid rgba(255,255,255,0.05)', 
                    borderRadius: '12px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  >
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {rate.provider}
                        <span style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: '12px', fontWeight: 600 }}>
                          {rate.days} días
                        </span>
                      </h4>
                      <p style={{ margin: '6px 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        {rate.service_level_name}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                        ${rate.amount_local.toFixed(2)}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {rate.currency}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
