"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Truck, CheckCircle, CreditCard } from 'lucide-react';

export default function CheckoutPage() {
  const { items, finalTotal, cartTotal, couponCode, couponDiscount, clearCart } = useCart();
  const router = useRouter();

  // Form State
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  });

  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<any | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);

  // Redirigir si el carrito está vacío y no hemos terminado
  useEffect(() => {
    if (items.length === 0 && !orderSuccess) {
      router.push('/cart');
    }
  }, [items, router, orderSuccess]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const quoteShipping = async () => {
    if (formData.zip.length !== 5) return;
    setIsQuoting(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/checkout/quote-shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination_zip: formData.zip,
          items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity, weight: 1 }))
        })
      });
      const data = await res.json();
      setShippingRates(data.rates || []);
      if (data.rates && data.rates.length > 0) {
        setSelectedShipping(data.rates[0]);
      }
    } catch (e) {
      console.error(e);
    }
    setIsQuoting(false);
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.zip.length === 5) {
      quoteShipping();
    }
    setStep(2);
  };

  const placeOrder = async () => {
    setIsPlacingOrder(true);
    try {
      const payload = {
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        shipping_address: formData.address,
        shipping_zip: formData.zip,
        shipping_city: formData.city,
        shipping_state: formData.state,
        items: items,
        shipping_cost: selectedShipping ? selectedShipping.amount : 0,
        shipping_provider: selectedShipping ? selectedShipping.provider : 'Local',
        coupon_code: couponCode,
        coupon_discount: couponDiscount
      };

      const res = await fetch('http://localhost:8000/api/v1/checkout/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.success) {
        setOrderSuccess(data);
        clearCart();
        setStep(4);
      }
    } catch (e) {
      console.error(e);
      alert("Hubo un error al procesar el pedido.");
    }
    setIsPlacingOrder(false);
  };

  const totalToPay = finalTotal + (selectedShipping ? selectedShipping.amount : 0);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (orderSuccess) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', maxWidth: '600px' }}>
          <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 20px' }} />
          <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>¡Pedido Confirmado!</h1>
          <p style={{ color: '#94a3b8', fontSize: '1.2rem', marginBottom: '30px' }}>
            Gracias por tu compra. Tu número de pedido es <strong>{orderSuccess.order_id}</strong>.
          </p>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '8px', marginBottom: '30px', textAlign: 'left' }}>
            <h3 style={{ marginBottom: '10px', color: '#e2e8f0' }}>Instrucciones de Pago (SPEI)</h3>
            <p style={{ color: '#94a3b8' }}>{orderSuccess.payment_instructions}</p>
            <p style={{ marginTop: '10px', color: '#94a3b8' }}>Banco: <strong>STP</strong><br/>CLABE: <strong>000000000000000000</strong><br/>Monto a transferir: <strong>${formatCurrency(totalToPay)}</strong></p>
          </div>
          <Link href="/">
            <button className="btn-primary">Volver al Inicio</button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        <button onClick={() => step > 1 ? setStep(step - 1) : router.push('/cart')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <ArrowLeft size={20} /> Volver
        </button>
        <h1 style={{ fontSize: '2rem' }}>Checkout</h1>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '40px' }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ flex: 1, height: '4px', background: s <= step ? '#8b5cf6' : 'rgba(255,255,255,0.1)', borderRadius: '2px' }} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '40px', alignItems: 'start' }}>
        
        {/* Lado Izquierdo: Formulario */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          {step === 1 && (
            <form onSubmit={handleStep1Submit}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Datos de Envío</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Nombre Completo</label>
                  <input required type="text" name="name" value={formData.name} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'white' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Correo Electrónico</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'white' }} />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Teléfono</label>
                <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'white' }} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Dirección Completa (Calle, Número, Colonia)</label>
                <input required type="text" name="address" value={formData.address} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'white' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Código Postal</label>
                  <input required type="text" maxLength={5} name="zip" value={formData.zip} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'white' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Ciudad</label>
                  <input required type="text" name="city" value={formData.city} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'white' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Estado</label>
                  <input required type="text" name="state" value={formData.state} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'white' }} />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '15px', fontSize: '1.1rem' }}>
                Continuar a Opciones de Envío
              </button>
            </form>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><Truck color="#3b82f6" /> Paquetería</h2>
              <p style={{ color: '#94a3b8', marginBottom: '20px' }}>Cotizando envío para el C.P. {formData.zip} desde nuestro almacén en Tonalá (C.P. 45403).</p>
              
              {isQuoting ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>Consultando tarifas de paqueterías...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                  {shippingRates.map((rate, i) => (
                    <div 
                      key={i} 
                      onClick={() => setSelectedShipping(rate)}
                      style={{ 
                        padding: '20px', 
                        border: selectedShipping?.amount === rate.amount ? '2px solid #8b5cf6' : '1px solid var(--border)', 
                        background: selectedShipping?.amount === rate.amount ? 'rgba(139, 92, 246, 0.1)' : 'var(--input-bg)',
                        borderRadius: '8px', 
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '5px' }}>{rate.provider} - {rate.service_level}</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Tiempo estimado: {rate.days} día(s)</p>
                      </div>
                      <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>${formatCurrency(rate.amount)}</span>
                    </div>
                  ))}
                  {shippingRates.length === 0 && (
                    <div style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px' }}>
                      No se encontraron tarifas para este Código Postal. Verifica que sea correcto.
                    </div>
                  )}
                </div>
              )}

              <button 
                onClick={() => setStep(3)} 
                disabled={!selectedShipping}
                className="btn-primary" 
                style={{ width: '100%', padding: '15px', fontSize: '1.1rem', opacity: !selectedShipping ? 0.5 : 1 }}
              >
                Continuar al Pago
              </button>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><CreditCard color="#10b981" /> Método de Pago</h2>
              
              <div style={{ padding: '20px', border: '2px solid #10b981', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', marginBottom: '30px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Transferencia SPEI (Manual)</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Al confirmar tu pedido te daremos una CLABE interbancaria para que realices tu pago desde la app de tu banco. Tu pedido se procesará al confirmar la recepción de los fondos.</p>
              </div>

              {/* Placeholder para Stripe/MercadoPago futuro */}
              <div style={{ padding: '20px', border: '1px solid var(--border)', background: 'var(--input-bg)', borderRadius: '8px', marginBottom: '30px', opacity: 0.5 }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Tarjeta de Crédito / MercadoPago</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Próximamente.</p>
              </div>

              <button 
                onClick={placeOrder} 
                disabled={isPlacingOrder}
                className="btn-success" 
                style={{ width: '100%', padding: '15px', fontSize: '1.1rem', background: '#10b981', color: '#111' }}
              >
                {isPlacingOrder ? 'Procesando...' : 'Confirmar Pedido'}
              </button>
            </div>
          )}
        </div>

        {/* Lado Derecho: Resumen */}
        <div className="glass-panel" style={{ padding: '30px', position: 'sticky', top: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Tu Compra</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {items.map(item => (
              <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span>{item.quantity}x {item.name.substring(0, 30)}...</span>
                <span>${formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#94a3b8', fontSize: '0.95rem' }}>
            <span>Subtotal</span>
            <span>${formatCurrency(cartTotal)}</span>
          </div>

          {couponCode && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#10b981', fontSize: '0.95rem' }}>
              <span>Cupón ({couponCode})</span>
              <span>- ${formatCurrency(couponDiscount)}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', color: '#94a3b8', fontSize: '0.95rem' }}>
            <span>Envío {selectedShipping && `(${selectedShipping.provider})`}</span>
            <span>{selectedShipping ? `$${formatCurrency(selectedShipping.amount)}` : 'Calculando...'}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', fontWeight: 'bold' }}>
            <span>Total</span>
            <span style={{ color: '#8b5cf6' }}>${formatCurrency(totalToPay)}</span>
          </div>
        </div>

      </div>
    </main>
  );
}
