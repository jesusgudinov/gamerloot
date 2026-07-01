"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Package, CreditCard, Building2, CircleDollarSign, 
  CheckCircle2, Clock, Truck, Hammer, ShieldCheck, Copy, ChevronRight 
} from 'lucide-react';
import Link from 'next/link';

interface OrderItem {
  id: int;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sku: string;
  product?: {
    slug: string;
    main_image_url?: string;
  };
}

interface Order {
  id: number;
  folio: string;
  created_at: string;
  status: string;
  total: number;
  subtotal: number;
  tax: number;
  items: OrderItem[];
  tracking_number?: string;
  carrier?: string;
  customer_name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  invoice?: any;
}



export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Payment Module State
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Invoice State
  const [requestingInvoice, setRequestingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/sales/my-orders/${params.folio}`, {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        } else {
          setError('Pedido no encontrado o sin acceso.');
        }
      } catch (err) {
        setError('Error al conectar con el servidor.');
      } finally {
        setLoading(false);
      }
    };
    if (params.folio) {
      fetchOrder();
    }
  }, [params.folio]);

  const handleRequestInvoice = async () => {
    if (!order) return;
    setRequestingInvoice(true);
    setInvoiceError('');
    try {
      const res = await fetch(`http://localhost:8000/api/v1/invoices/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ order_id: order.id })
      });
      if (res.ok) {
        const newInvoice = await res.json();
        setOrder({ ...order, invoice: newInvoice });
      } else {
        const err = await res.json();
        setInvoiceError(err.detail || 'Error al solicitar la factura');
      }
    } catch (e) {
      setInvoiceError('Error de conexión');
    } finally {
      setRequestingInvoice(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <div className="spin" style={{ width: '50px', height: '50px', border: '4px solid var(--card-border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
        <style dangerouslySetInnerHTML={{__html: `.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', borderRadius: '24px', background: 'var(--card-bg)' }}>
        <h2 style={{ color: '#ef4444' }}>{error || 'Error desconocido'}</h2>
        <button onClick={() => router.push('/profile/orders')} className="btn-primary" style={{ marginTop: '20px' }}>Volver a Pedidos</button>
      </div>
    );
  }

  let currentFlow = [
    { label: 'Pendiente', icon: Clock },
    { label: 'Pagado', icon: CircleDollarSign },
    { label: 'Enviado', icon: Truck },
    { label: 'Entregado', icon: CheckCircle2 }
  ];

  if (order) {
    const hasAssembly = order.items.some(item => item.sku === 'ensamblaje-gratis' || item.product_name.toLowerCase().includes('ensambl'));
    if (hasAssembly || (order as any).is_assembled) {
      currentFlow = [
        { label: 'Pendiente', icon: Clock },
        { label: 'Pagado', icon: CircleDollarSign },
        { label: 'En Ensamble', icon: Hammer },
        { label: 'Ensamblado', icon: ShieldCheck },
        { label: 'Enviado', icon: Truck },
        { label: 'Entregado', icon: CheckCircle2 }
      ];
    }
  }

  // Determine current status index for the timeline
  let currentIndex = currentFlow.findIndex(s => s.label === order.status);
  if (order.status === 'Cancelado') {
    currentIndex = -1; // Cancelado is special
  }

  return (
    <div style={{ paddingBottom: '60px' }}>
      <button 
        onClick={() => router.push('/profile/orders')}
        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '24px', fontSize: '0.9rem', fontWeight: 600 }}
      >
        <ArrowLeft size={16} /> Regresar a Mis Pedidos
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
            Pedido <span style={{ color: 'var(--primary)' }}>#{order.folio}</span>
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.05rem', fontWeight: 500 }}>
            Realizado el {new Date(order.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Total Pagado</p>
          <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: 'var(--foreground)' }}>
            ${order.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>MXN</span>
          </p>
        </div>
      </div>

      {/* Timeline Premium */}
      <div className="glass-panel" style={{ padding: '40px', borderRadius: '24px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', marginBottom: '32px', overflowX: 'auto', position: 'relative' }}>
        <h3 style={{ margin: '0 0 32px 0', fontSize: '1.3rem', fontWeight: 800, color: 'var(--foreground)' }}>Estatus del Pedido</h3>
        
        {order.status === 'Cancelado' ? (
          <div style={{ padding: '24px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '16px', color: '#f87171', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: 'inset 0 0 20px rgba(239, 68, 68, 0.05)' }}>
            <div style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', padding: '12px', boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)' }}><ShieldCheck size={28} /></div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Pedido Cancelado</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.95rem', color: 'var(--text-muted)' }}>Este pedido ha sido cancelado y ya no está activo.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', minWidth: '600px', position: 'relative' }}>
            {/* Base line */}
            <div style={{ position: 'absolute', left: '40px', right: '40px', top: '26px', height: '6px', background: 'var(--input-bg)', borderRadius: '3px', zIndex: 0, border: '1px solid var(--card-border)' }}></div>
            {/* Progress line */}
            <div style={{ position: 'absolute', left: '40px', width: `${(Math.max(0, currentIndex) / (currentFlow.length - 1)) * 100}%`, top: '26px', height: '6px', background: 'linear-gradient(90deg, var(--primary), #34d399)', boxShadow: '0 0 8px rgba(52, 211, 153, 0.3)', borderRadius: '3px', zIndex: 1, transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
            
            {currentFlow.map((step, idx) => {
              const isCompleted = idx <= currentIndex;
              const isCurrent = idx === currentIndex;
              const Icon = step.icon;
              
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                  <div style={{ 
                    width: '56px', height: '56px', borderRadius: '50%', 
                    background: isCompleted ? (isCurrent ? 'linear-gradient(135deg, var(--primary), #34d399)' : 'var(--primary)') : 'var(--input-bg)',
                    border: isCompleted ? 'none' : '2px solid var(--card-border)',
                    boxShadow: isCurrent ? '0 0 12px rgba(139, 92, 246, 0.3)' : isCompleted ? '0 0 6px rgba(139, 92, 246, 0.15)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isCompleted ? '#fff' : 'var(--text-muted)',
                    marginBottom: '16px', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isCurrent ? 'scale(1.05)' : 'scale(1)'
                  }}>
                    <Icon size={24} />
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: isCurrent ? 800 : 600, color: isCurrent ? 'var(--primary)' : isCompleted ? 'var(--foreground)' : 'var(--text-muted)', textAlign: 'center', letterSpacing: '0.5px' }}>
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment Module (Only if Pendiente) */}
      {order.status === 'Pendiente' && (
        <div className="glass-panel" style={{ padding: '32px', borderRadius: '24px', background: 'var(--card-bg)', border: '1px solid #f59e0b', boxShadow: '0 0 40px rgba(245, 158, 11, 0.05)', marginBottom: '32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: '#f59e0b' }}></div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '12px', borderRadius: '16px' }}>
              <CircleDollarSign size={28} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--foreground)' }}>Acción Requerida: Pago Pendiente</h2>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>Para comenzar a procesar tu pedido, selecciona un método de pago.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: selectedPayment === 'spei' ? '24px' : '0' }}>
            
            {/* SPEI */}
            <div 
              className="hover-card"
              onClick={() => setSelectedPayment('spei')}
              style={{ 
                padding: '20px', borderRadius: '16px', cursor: 'pointer', border: selectedPayment === 'spei' ? '2px solid var(--primary)' : '1px solid var(--card-border)',
                background: selectedPayment === 'spei' ? 'rgba(139, 92, 246, 0.05)' : 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: '16px',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ background: '#fff', color: '#000', padding: '8px', borderRadius: '8px' }}><Building2 size={24} /></div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Transferencia SPEI</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Procesamiento manual (24h)</p>
              </div>
            </div>

            {/* Stripe */}
            <div style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.01)', opacity: 0.6, position: 'relative' }}>
              <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.1)', fontSize: '0.7rem', padding: '4px 8px', borderRadius: '20px', fontWeight: 600 }}>Próximamente</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: '#635BFF', color: '#fff', padding: '8px', borderRadius: '8px' }}><CreditCard size={24} /></div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Tarjeta Crédito/Débito</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Vía Stripe</p>
                </div>
              </div>
            </div>

            {/* PayPal */}
            <div style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.01)', opacity: 0.6, position: 'relative' }}>
              <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.1)', fontSize: '0.7rem', padding: '4px 8px', borderRadius: '20px', fontWeight: 600 }}>Próximamente</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: '#00457C', color: '#fff', padding: '8px', borderRadius: '8px', fontWeight: 900, fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px' }}>P</div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>PayPal</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Procesamiento instantáneo</p>
                </div>
              </div>
            </div>

            {/* Mercado Pago */}
            <div style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.01)', opacity: 0.6, position: 'relative' }}>
              <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.1)', fontSize: '0.7rem', padding: '4px 8px', borderRadius: '20px', fontWeight: 600 }}>Próximamente</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: '#009EE3', color: '#fff', padding: '8px', borderRadius: '8px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px' }}>MP</div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Mercado Pago</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Efectivo o Tarjetas</p>
                </div>
              </div>
            </div>
          </div>

          {/* SPEI Instructions Expanded */}
          {selectedPayment === 'spei' && (
            <div style={{ background: 'var(--input-bg)', borderRadius: '16px', padding: '24px', border: '1px solid var(--card-border)', animation: 'fadeIn 0.3s ease', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={20} /> Instrucciones para SPEI
              </h3>
              <p style={{ margin: '0 0 24px 0', fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Por favor realiza la transferencia interbancaria utilizando los siguientes datos. Como concepto de pago, ingresa exclusivamente tu número de folio: <strong style={{ color: 'var(--foreground)' }}>{order.folio}</strong>
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: 'var(--card-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Beneficiario</p>
                  <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--foreground)' }}>GAMER LOOT SA DE CV</p>
                </div>
                <div style={{ background: 'var(--card-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Banco</p>
                  <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--foreground)' }}>BBVA</p>
                </div>
                <div style={{ background: 'var(--card-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cuenta</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '1px' }}>011 705 0321</p>
                    <button onClick={() => copyToClipboard('0117050321')} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer' }} title="Copiar">
                      <Copy size={18} />
                    </button>
                  </div>
                </div>
                <div style={{ background: 'var(--card-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>CLABE Interbancaria</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '1px' }}>012 320 0011 7050 3214</p>
                    <button onClick={() => copyToClipboard('012320001170503214')} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer' }} title="Copiar">
                      <Copy size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {copied && <p style={{ color: '#10b981', fontSize: '0.9rem', marginTop: '-10px', marginBottom: '20px', fontWeight: 600 }}>¡Copiado al portapapeles!</p>}

              <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px dashed #10b981', borderRadius: '12px', color: '#34d399', fontSize: '0.9rem' }}>
                <strong style={{ display: 'block', marginBottom: '8px' }}>Paso Final:</strong>
                Una vez realizada la transferencia, envía el comprobante de pago al correo <strong>pagos@gamerloot.com.mx</strong> o a nuestro WhatsApp oficial, mencionando tu número de pedido ({order.folio}). Procesaremos tu pedido en menos de 24 horas hábiles.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Items and Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' }}>
        
        {/* Left Column: Items */}
        <div className="glass-panel hover-card" style={{ padding: '32px', borderRadius: '24px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'linear-gradient(to bottom, var(--primary), transparent)' }}></div>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '1.3rem', fontWeight: 900, borderBottom: '1px solid var(--card-border)', paddingBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '10px' }}>
              <Package size={20} color="var(--primary)" />
            </div>
            Artículos en el Pedido
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {order.items.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--card-border)' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '16px', background: 'var(--input-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--card-border)', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                  {item.product?.main_image_url ? (
                    <img src={item.product.main_image_url.startsWith('http') ? item.product.main_image_url : `http://localhost:8000${item.product.main_image_url}`} alt={item.product_name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }} />
                  ) : (
                    <Package size={32} color="var(--primary)" style={{ opacity: 0.8 }} />
                  )}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  {item.product?.slug ? (
                    <Link href={`/products/${item.product.slug}`} style={{ textDecoration: 'none' }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--foreground)', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--foreground)'}>{item.product_name}</h4>
                    </Link>
                  ) : (
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--foreground)' }}>{item.product_name}</h4>
                  )}
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>SKU: {item.sku}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                      Cant: <strong style={{ color: 'var(--foreground)' }}>{item.quantity}</strong> × ${item.unit_price.toLocaleString('es-MX')}
                    </p>
                    <p style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: 'var(--primary)' }}>
                      ${item.total_price.toLocaleString('es-MX')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Order Summary & Shipping */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Resumen */}
          <div className="glass-panel hover-card" style={{ padding: '32px', borderRadius: '24px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)', filter: 'blur(30px)', borderRadius: '50%', pointerEvents: 'none' }}></div>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#10b981' }}></div>
            
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CircleDollarSign size={20} color="#10b981" /> Resumen Financiero
            </h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              <span>Subtotal</span>
              <span>${order.subtotal.toLocaleString('es-MX')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              <span>Envío (si aplica)</span>
              <span>Calculado aparte</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              <span>IVA (16%)</span>
              <span>${order.tax.toLocaleString('es-MX')}</span>
            </div>
            
            <div style={{ borderTop: '1px dashed var(--card-border)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>Total Pagado</span>
              <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--foreground)' }}>${order.total.toLocaleString('es-MX')}</span>
            </div>
          </div>

          {/* Dirección */}
          <div className="glass-panel hover-card" style={{ padding: '32px', borderRadius: '24px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', bottom: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)', filter: 'blur(30px)', borderRadius: '50%', pointerEvents: 'none' }}></div>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#3b82f6' }}></div>
            
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}>
               Envío
            </h3>
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 800 }}>{order.customer_name}</p>
              {order.address ? (
                <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  {order.address}<br />
                  {order.city}, {order.state}<br />
                  C.P. {order.zip_code}
                </p>
              ) : (
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic', background: 'var(--input-bg)', padding: '12px', borderRadius: '12px', border: '1px dashed var(--card-border)' }}>
                  (Recogida en tienda local o sin dirección asignada)
                </p>
              )}

              {(order.shipments_data && Array.isArray(order.shipments_data) && order.shipments_data.length > 0) ? (
                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--card-border)' }}>
                  <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                    Guías de Rastreo ({order.shipments_data.length})
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {order.shipments_data.map((shipment: any, index: number) => (
                      <div key={index} style={{ padding: '16px', background: 'var(--input-bg)', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px' }}>
                            Origen: C.P. {shipment.origin_zip || 'N/A'}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: shipment.status === 'Guía Generada' ? '#10b981' : 'var(--text-muted)', fontWeight: 600 }}>
                            {shipment.status || 'Pendiente'}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '8px' }}>
                            <Truck size={20} color="#3b82f6" />
                          </div>
                          <div style={{ flex: 1 }}>
                            <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{shipment.carrier || 'Asignando...'}</span>
                            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--foreground)' }}>{shipment.tracking_number || 'Pendiente'}</span>
                          </div>
                        </div>

                        {shipment.tracking_number && (
                          <a 
                            href={`https://tracking.skydropx.com/${shipment.tracking_number}`} 
                            target="_blank" 
                            rel="noreferrer"
                            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', width: '100%', marginTop: '16px', padding: '10px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)', border: '1px solid rgba(139, 92, 246, 0.3)', textDecoration: 'none', fontWeight: 800, transition: 'all 0.3s', fontSize: '0.9rem' }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = 'var(--primary)';
                              e.currentTarget.style.color = '#fff';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                              e.currentTarget.style.color = 'var(--primary)';
                            }}
                          >
                            <ExternalLink size={16} /> Rastrear Paquete
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (order.carrier || order.tracking_number) ? (
                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--card-border)' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Guía de Rastreo</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--input-bg)', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '8px' }}>
                      <Truck size={20} color="#3b82f6" />
                    </div>
                    <div>
                      {order.carrier && <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{order.carrier}</span>}
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--foreground)' }}>{order.tracking_number || 'Pendiente'}</span>
                    </div>
                  </div>
                  {['Enviado', 'Entregado'].includes(order.status) && order.tracking_number && (
                    <a 
                      href={`https://tracking.skydropx.com/${order.tracking_number}`} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', width: '100%', marginTop: '16px', padding: '14px', borderRadius: '16px', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)', border: '1px solid rgba(139, 92, 246, 0.3)', textDecoration: 'none', fontWeight: 800, transition: 'all 0.3s' }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'var(--primary)';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                        e.currentTarget.style.color = 'var(--primary)';
                      }}
                    >
                      <ExternalLink size={20} /> Rastrear Paquete en Skydropx
                    </a>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {/* Facturación */}
          <div className="glass-panel hover-card" style={{ padding: '32px', borderRadius: '24px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%)', filter: 'blur(30px)', borderRadius: '50%', pointerEvents: 'none' }}></div>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#a855f7' }}></div>
            
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}>
               <FileText size={20} color="#a855f7" /> Facturación
            </h3>
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              {order.invoice ? (
                <div style={{ background: 'var(--input-bg)', padding: '16px', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Estado</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: order.invoice.status === 'Facturado' ? '#10b981' : '#f59e0b' }}>
                      {order.invoice.status}
                    </span>
                  </div>
                  
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    <p style={{ margin: '0 0 4px 0' }}>RFC: <strong style={{ color: 'var(--foreground)' }}>{order.invoice.rfc}</strong></p>
                    <p style={{ margin: '0 0 4px 0' }}>Razón Social: <strong style={{ color: 'var(--foreground)' }}>{order.invoice.business_name}</strong></p>
                  </div>

                  {order.invoice.status === 'Facturado' && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {order.invoice.pdf_url && (
                        <a 
                          href={`http://localhost:8000${order.invoice.pdf_url}`} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s' }}
                        >
                          <Download size={16} /> PDF
                        </a>
                      )}
                      {order.invoice.xml_url && (
                        <a 
                          href={`http://localhost:8000${order.invoice.xml_url}`} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s' }}
                        >
                          <Download size={16} /> XML
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Puedes solicitar tu factura si la compra fue realizada en el mes en curso. Asegúrate de tener tus datos fiscales configurados en tu perfil.
                  </p>
                  
                  {invoiceError && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '12px', color: '#ef4444', fontSize: '0.85rem', marginBottom: '16px' }}>
                      {invoiceError}
                    </div>
                  )}

                  <button 
                    onClick={handleRequestInvoice}
                    disabled={requestingInvoice}
                    className="hover-card"
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.2)', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.3s ease', opacity: requestingInvoice ? 0.7 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                  >
                    {requestingInvoice ? 'Solicitando...' : <><FileText size={18} /> Solicitar Factura</>}
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}
