"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Truck, CheckCircle, CreditCard, Package, ShoppingCart, Tag, Home, MapPin, Plus } from 'lucide-react';
import AddressModal from '@/components/checkout/AddressModal';
import StripeProvider from '@/components/checkout/StripeProvider';
import PaymentForm from '@/components/checkout/PaymentForm';
import { useAuth } from '@/context/AuthContext';

export default function CheckoutPage() {
  const { items, finalTotal, cartTotal, couponCode, couponDiscount, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  // Form State
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    exteriorNumber: '',
    neighborhood: '',
    city: '',
    state: '',
    zip: '',
  });

  const [userAddresses, setUserAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | 'new'>('new');
  const [saveAddress, setSaveAddress] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.full_name || prev.name,
        email: user.email || prev.email,
        phone: user.phone_number || prev.phone
      }));
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    if (!user) return;
    setLoadingAddresses(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/addresses/user/${user.id}`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setUserAddresses(data);
        if (data.length > 0) {
          const defaultAddress = data.find((a: any) => a.is_default) || data[0];
          setSelectedAddressId(defaultAddress.id);
          populateFormWithAddress(defaultAddress);
        }
      }
    } catch (e) {
      console.error("Error fetching addresses", e);
    }
    setLoadingAddresses(false);
  };

  const populateFormWithAddress = (addr: any) => {
    setFormData(prev => ({
      ...prev,
      street: addr.street || '',
      exteriorNumber: addr.exterior_number || '',
      neighborhood: addr.neighborhood || '',
      city: addr.city || '',
      state: addr.state || '',
      zip: addr.zip_code || ''
    }));
  };

  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<any | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'SPEI' | 'Stripe'>('Stripe');
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);

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
          destination_city: formData.city,
          destination_state: formData.state,
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

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedAddressId === 'new' && saveAddress && user) {
      try {
        await fetch(`http://localhost:8000/api/v1/addresses/${user.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            alias: 'Dirección de envío',
            icon_name: 'Home',
            street: formData.street,
            exterior_number: formData.exteriorNumber,
            neighborhood: formData.neighborhood,
            city: formData.city,
            state: formData.state,
            zip_code: formData.zip,
            is_default: userAddresses.length === 0
          })
        });
      } catch (err) {
        console.error("Error saving address", err);
      }
    }

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
        shipping_address: `${formData.street} ${formData.exteriorNumber}`,
        shipping_neighborhood: formData.neighborhood,
        shipping_zip: formData.zip,
        shipping_city: formData.city,
        shipping_state: formData.state,
        items: items,
        shipping_cost: selectedShipping ? (selectedShipping.amount_local || selectedShipping.amount) : 0,
        shipping_provider: selectedShipping ? `${selectedShipping.provider} - ${selectedShipping.service_level_name}` : 'Local',
        shipping_breakdown: selectedShipping ? selectedShipping.breakdown : null,
        coupon_code: couponCode,
        coupon_discount: couponDiscount,
        payment_method: paymentMethod,
        save_payment_method: savePaymentMethod
      };

      const res = await fetch('http://localhost:8000/api/v1/checkout/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.success) {
        if (paymentMethod === 'Stripe' && data.client_secret) {
          setClientSecret(data.client_secret);
          setOrderSuccess(data); // We store the order info but don't show success yet
          setStep(3.5);
        } else {
          setOrderSuccess(data);
          clearCart();
          setStep(4);
        }
      }
    } catch (e) {
      console.error(e);
      alert("Hubo un error al procesar el pedido.");
    }
    setIsPlacingOrder(false);
  };

  const totalToPay = finalTotal + (selectedShipping ? (selectedShipping.amount_local || selectedShipping.amount) : 0);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handlePaymentSuccess = () => {
    clearCart();
    setStep(4);
  };

  if (step === 4 && orderSuccess) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <style dangerouslySetInnerHTML={{__html: `
          .success-panel { animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; position: relative; overflow: hidden; }
          @keyframes popIn { 0% { opacity: 0; transform: scale(0.9) translateY(20px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        `}} />
        <div className="glass-panel success-panel" style={{ padding: '60px 40px', textAlign: 'center', maxWidth: '600px', width: '100%', borderRadius: '24px', border: '1px solid rgba(16, 185, 129, 0.3)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
          <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)', filter: 'blur(30px)', zIndex: 0 }}></div>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', border: '2px solid rgba(16, 185, 129, 0.4)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)' }}>
              <CheckCircle size={40} />
            </div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '15px', fontWeight: 800 }}>¡Pedido Confirmado!</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '35px', lineHeight: '1.6' }}>
              Gracias por tu compra. Tu número de pedido es <strong style={{ color: 'var(--text-color)', fontSize: '1.2rem', display: 'inline-block', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '6px' }}>{orderSuccess.order_id}</strong>.
            </p>
            
            {paymentMethod === 'SPEI' && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '25px', borderRadius: '16px', marginBottom: '35px', textAlign: 'left', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: '#10b981' }}></div>
                <h3 style={{ marginBottom: '15px', color: 'var(--text-color)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Instrucciones de Pago (SPEI)
                </h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '15px', lineHeight: '1.5' }}>{orderSuccess.payment_instructions}</p>
                
                <div style={{ background: 'var(--input-bg)', padding: '15px', borderRadius: '8px', border: '1px solid var(--input-border)', display: 'grid', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{color: 'var(--text-muted)'}}>Banco:</span> <strong style={{color: 'var(--text-color)'}}>STP</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{color: 'var(--text-muted)'}}>CLABE:</span> <strong style={{color: 'var(--text-color)', letterSpacing: '1px'}}>000000000000000000</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px', marginTop: '5px' }}>
                    <span style={{color: 'var(--text-muted)'}}>Monto a transferir:</span> 
                    <strong style={{color: '#10b981', fontSize: '1.2rem'}}>${formatCurrency(totalToPay)}</strong>
                  </div>
                </div>
              </div>
            )}
            
            <Link href="/">
              <button className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', borderRadius: '12px' }}>Volver al Inicio</button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  
      <AddressModal 
        isOpen={isAddressModalOpen} 
        onClose={() => setIsAddressModalOpen(false)} 
        formData={formData} 
        handleInputChange={handleInputChange} 
        saveAddress={saveAddress} 
        setSaveAddress={setSaveAddress} 
        onSubmit={() => {
          setIsAddressModalOpen(false);
        }} 
      />
  return (
    <main style={{ minHeight: '100vh', padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .checkout-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 40px; align-items: start; }
        .step-indicator { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
        .shipping-card { transition: all 0.2s ease; border: 1px solid rgba(255,255,255,0.05); }
        .shipping-card:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.25); border-color: rgba(139, 92, 246, 0.3); }
        .shipping-card.selected { border-color: #8b5cf6 !important; background: rgba(139, 92, 246, 0.1) !important; box-shadow: 0 0 15px rgba(139, 92, 246, 0.2); }
        .input-premium { width: 100%; padding: 14px 16px; border-radius: 12px; border: 1px solid var(--input-border); background: var(--input-bg); color: white; transition: all 0.3s ease; outline: none; }
        .input-premium:focus { border-color: var(--primary); box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2); }
        
        @media (max-width: 900px) {
          .checkout-grid { grid-template-columns: 1fr; }
          .summary-panel { position: static !important; order: -1; margin-bottom: 20px; }
        }
        @media (max-width: 600px) {
          .form-grid { grid-template-columns: 1fr !important; }
        }
      `}} />
      
      <div className="animate-fade-in-up" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        <button onClick={() => step > 1 ? setStep(step - 1) : router.push('/cart')} className="hover-card" style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '50%', color: 'var(--text-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', transition: 'all 0.2s' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800 }}>Pago <span className="text-gradient">Seguro</span></h1>
      </div>

      <div className="animate-fade-in-up" style={{ display: 'flex', gap: '10px', marginBottom: '40px' }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ flex: 1, position: 'relative' }}>
            <div className="step-indicator" style={{ height: '6px', background: s <= step ? 'linear-gradient(90deg, #a855f7, #6366f1)' : 'var(--input-bg)', borderRadius: '3px', boxShadow: s <= step ? '0 0 10px rgba(139, 92, 246, 0.5)' : 'none' }} />
          </div>
        ))}
      </div>

      <div className="checkout-grid animate-fade-in-up delay-100">
        
        {/* Lado Izquierdo: Formulario */}
        <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--primary)' }}></div>
          <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none', zIndex: 0 }}></div>
          
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="animate-fade-in-up" style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ padding: '8px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '10px' }}>
                  <MapPin size={20} color="var(--primary)" />
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 600 }}>Dirección de Envío</h2>
              </div>
              
              {/* Selector de Direcciones */}
              {user && userAddresses.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                  <label style={{ display: 'block', marginBottom: '12px', color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 500 }}>Mis Direcciones Guardadas</label>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {userAddresses.map((addr) => (
                      <div 
                        key={addr.id}
                        onClick={() => {
                          setSelectedAddressId(addr.id);
                          populateFormWithAddress(addr);
                        }}
                        style={{ 
                          padding: '16px', 
                          border: selectedAddressId === addr.id ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)', 
                          background: selectedAddressId === addr.id ? 'rgba(139, 92, 246, 0.05)' : 'var(--input-bg)', 
                          borderRadius: '12px', 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '15px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '50%' }}>
                           {addr.icon_name === 'Home' ? <Home size={20} color="var(--text-muted)" /> : <MapPin size={20} color="var(--text-muted)" />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-color)', fontWeight: 600 }}>{addr.alias || 'Dirección'} {addr.is_default && <span style={{ fontSize: '0.75rem', background: 'var(--primary)', color: 'white', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>Predeterminada</span>}</h4>
                          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {addr.street} {addr.exterior_number}, {addr.neighborhood}, C.P. {addr.zip_code}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    <div 
                      onClick={() => {
                        setSelectedAddressId('new');
                        setFormData(prev => ({ ...prev, street: '', exteriorNumber: '', neighborhood: '', city: '', state: '', zip: '' }));
                        setIsAddressModalOpen(true);
                      }}
                      style={{ 
                        padding: '16px', 
                        border: selectedAddressId === 'new' ? '2px solid var(--primary)' : '1px dashed rgba(255,255,255,0.2)', 
                        background: selectedAddressId === 'new' ? 'rgba(139, 92, 246, 0.05)' : 'transparent', 
                        borderRadius: '12px', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        transition: 'all 0.2s',
                        color: selectedAddressId === 'new' ? 'var(--primary)' : 'var(--text-muted)'
                      }}
                    >
                      <Plus size={20} />
                      <span style={{ fontWeight: 500 }}>Usar Otra Dirección</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Formulario de Nueva Dirección (o editar datos de contacto) */}
              <div style={{ display: (!user || userAddresses.length === 0) ? 'block' : 'none', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '30px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', color: 'var(--text-color)', fontWeight: 600 }}>
                  {userAddresses.length === 0 ? 'Datos de Contacto y Envío' : 'Nueva Dirección de Envío'}
                </h3>
                
                {/* Datos de Contacto */}
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Nombre Completo</label>
                    <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="input-premium" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Correo Electrónico</label>
                    <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="input-premium" />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Teléfono</label>
                  <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="input-premium" />
                </div>

                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Calle</label>
                    <input required={selectedAddressId === 'new'} type="text" name="street" value={formData.street} onChange={handleInputChange} className="input-premium" placeholder="Ej. Av. Insurgentes Sur" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Número Exterior</label>
                    <input required={selectedAddressId === 'new'} type="text" name="exteriorNumber" value={formData.exteriorNumber} onChange={handleInputChange} className="input-premium" placeholder="Ej. 123" />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Colonia</label>
                  <input required={selectedAddressId === 'new'} type="text" name="neighborhood" value={formData.neighborhood} onChange={handleInputChange} className="input-premium" placeholder="Ej. Roma Norte" />
                </div>

                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Código Postal</label>
                    <input required={selectedAddressId === 'new'} type="text" maxLength={5} name="zip" value={formData.zip} onChange={handleInputChange} className="input-premium" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Ciudad</label>
                    <input required={selectedAddressId === 'new'} type="text" name="city" value={formData.city} onChange={handleInputChange} className="input-premium" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Estado</label>
                    <input required={selectedAddressId === 'new'} type="text" name="state" value={formData.state} onChange={handleInputChange} className="input-premium" />
                  </div>
                </div>
                
                {user && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '20px', padding: '12px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <input 
                      type="checkbox" 
                      checked={saveAddress}
                      onChange={(e) => setSaveAddress(e.target.checked)}
                      style={{ accentColor: '#8b5cf6', width: '18px', height: '18px' }}
                    />
                    <span style={{ color: 'var(--text-color)', fontSize: '0.95rem' }}>Guardar Dirección para futuras compras</span>
                  </label>
                )}
              </div>

              {/* Datos de contacto para usuarios que usan direcciones guardadas o nueva desde modal */}
              {(user && userAddresses.length > 0) && (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '30px' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--text-color)', fontWeight: 500 }}>Datos de Contacto</h3>
                  <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nombre</label>
                      <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="input-premium" style={{ padding: '10px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Correo</label>
                      <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="input-premium" style={{ padding: '10px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Teléfono</label>
                      <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="input-premium" style={{ padding: '10px' }} />
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', borderRadius: '12px', display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' }}>
                Continuar a Envíos <ArrowRight size={20} />
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="animate-fade-in-up" style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ padding: '8px', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '10px' }}>
                  <Truck size={20} color="var(--accent-cyan)" />
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 600 }}>Paquetería</h2>
              </div>
              
              {isQuoting ? (
                <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Calculando opciones de envío para el C.P. {formData.zip}...</p>
              ) : shippingRates.length > 0 && shippingRates[0].breakdown && shippingRates[0].breakdown.length > 1 ? (
                <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Cotización de múltiples orígenes para el C.P. {formData.zip}.</p>
              ) : shippingRates.length > 0 && shippingRates[0].breakdown && shippingRates[0].breakdown.length === 1 ? (
                <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Cotizando envío para el C.P. {formData.zip} desde Bodega C.P. {shippingRates[0].breakdown[0].origin_zip}.</p>
              ) : (
                <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Opciones de envío para el C.P. {formData.zip}.</p>
              )}
              
              {isQuoting ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                  <div className="spinner" style={{ width: '30px', height: '30px', border: '3px solid rgba(139, 92, 246, 0.3)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  Consultando tarifas de paqueterías...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                  {shippingRates.map((rate, i) => (
                    <div 
                      key={i} 
                      className={`shipping-card ${selectedShipping?.amount_local === rate.amount_local ? 'selected' : ''}`}
                      onClick={() => setSelectedShipping(rate)}
                      style={{ 
                        padding: '20px', 
                        background: 'var(--input-bg)',
                        borderRadius: '16px', 
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h3 style={{ fontSize: '1.15rem', marginBottom: '6px', fontWeight: 600 }}>{rate.provider} - {rate.service_level_name}</h3>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Tiempo máximo estimado: {rate.days} día(s)</p>
                        </div>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)' }}>${formatCurrency(rate.amount_local || rate.amount)}</span>
                      </div>
                      
                      {/* Breakdown para Marketplace Hubs */}
                      {rate.breakdown && rate.breakdown.length > 0 && (
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <p style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', marginBottom: '8px', fontWeight: 600 }}>
                            {rate.breakdown.length > 1 ? 'Desglose de Envíos (Orígenes Múltiples):' : 'Desglose de Envío:'}
                          </p>
                          {rate.breakdown.map((b: any, bIdx: number) => (
                            <div key={bIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Truck size={14} opacity={0.7} /> Desde Bodega C.P. {b.origin_zip}</span>
                              <span style={{ fontWeight: 500 }}>Entrega: {b.days} día(s) ({b.provider})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {shippingRates.length === 0 && (
                    <div style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                      No se encontraron tarifas para este Código Postal. Verifica que sea correcto.
                    </div>
                  )}
                </div>
              )}

              <button 
                onClick={() => setStep(3)} 
                disabled={!selectedShipping}
                className="btn-primary" 
                style={{ width: '100%', padding: '16px', fontSize: '1.1rem', borderRadius: '12px', display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center', opacity: !selectedShipping ? 0.5 : 1, background: 'var(--accent-cyan)', boxShadow: '0 4px 15px rgba(6, 182, 212, 0.4)' }}
              >
                Continuar al Pago <ArrowRight size={20} />
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in-up" style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px' }}>
                  <CreditCard size={20} color="#10b981" />
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 600 }}>Método de Pago</h2>
              </div>
              
              <div 
                onClick={() => setPaymentMethod('SPEI')}
                style={{ cursor: 'pointer', padding: '24px', border: paymentMethod === 'SPEI' ? '2px solid #10b981' : '1px solid var(--input-border)', background: paymentMethod === 'SPEI' ? 'rgba(16, 185, 129, 0.05)' : 'var(--input-bg)', borderRadius: '16px', marginBottom: '24px', position: 'relative', overflow: 'hidden', transition: 'all 0.2s' }}
              >
                {paymentMethod === 'SPEI' && <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#10b981' }}></div>}
                <h3 style={{ fontSize: '1.15rem', marginBottom: '12px', color: 'var(--text-color)', fontWeight: 600 }}>Transferencia SPEI (Manual)</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>Al confirmar tu pedido te daremos una CLABE interbancaria para que realices tu pago desde la app de tu banco. Tu pedido se procesará al confirmar la recepción de los fondos.</p>
              </div>

              <div 
                onClick={() => setPaymentMethod('Stripe')}
                style={{ cursor: 'pointer', padding: '24px', border: paymentMethod === 'Stripe' ? '2px solid #8b5cf6' : '1px solid var(--input-border)', background: paymentMethod === 'Stripe' ? 'rgba(139, 92, 246, 0.05)' : 'var(--input-bg)', borderRadius: '16px', marginBottom: '32px', position: 'relative', overflow: 'hidden', transition: 'all 0.2s' }}
              >
                {paymentMethod === 'Stripe' && <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#8b5cf6' }}></div>}
                <h3 style={{ fontSize: '1.15rem', marginBottom: '12px', color: 'var(--text-color)', fontWeight: 600 }}>Tarjeta de Crédito / Débito Seguro</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '15px' }}>Paga de forma segura usando la plataforma de pagos cifrados de Stripe. Aceptamos todas las tarjetas.</p>
                
                {paymentMethod === 'Stripe' && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }} onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={savePaymentMethod}
                      onChange={(e) => setSavePaymentMethod(e.target.checked)}
                      style={{ accentColor: '#8b5cf6', width: '18px', height: '18px' }}
                    />
                    <span style={{ color: 'var(--text-color)', fontSize: '0.95rem' }}>Guardar mi tarjeta para futuras compras de forma segura</span>
                  </label>
                )}
              </div>

              <button 
                onClick={placeOrder} 
                disabled={isPlacingOrder}
                className="btn-primary" 
                style={{ width: '100%', padding: '16px', fontSize: '1.1rem', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 600, boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)' }}
              >
                {isPlacingOrder ? 'Procesando...' : 'Confirmar y Continuar'}
              </button>
            </div>
          )}

          {step === 3.5 && clientSecret && (
            <div className="animate-fade-in-up" style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ padding: '8px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '10px' }}>
                  <CreditCard size={20} color="var(--primary)" />
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 600 }}>Pago Seguro con Tarjeta</h2>
              </div>
              <StripeProvider clientSecret={clientSecret}>
                <PaymentForm onSuccess={handlePaymentSuccess} orderId={orderSuccess?.order_id || ""} />
              </StripeProvider>
            </div>
          )}
        </div>

        {/* Lado Derecho: Resumen */}
        <div className="glass-panel summary-panel" style={{ padding: '32px', position: 'sticky', top: '100px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--primary)' }}></div>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none', zIndex: 0 }}></div>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ padding: '8px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '10px' }}>
                <ShoppingCart size={20} color="var(--primary)" />
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 600 }}>Tu Compra</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {items.map(item => (
                <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', gap: '15px' }}>
                  <span style={{ color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    <span style={{ color: 'var(--text-color)', fontWeight: 500 }}>{item.quantity}x</span> {item.name.substring(0, 35)}{item.name.length > 35 ? '...' : ''}
                  </span>
                  <span style={{ fontWeight: 500, color: 'var(--text-color)' }}>${formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: 'var(--text-muted)', fontSize: '1rem' }}>
              <span>Subtotal</span>
              <span style={{ color: 'var(--text-color)' }}>${formatCurrency(cartTotal)}</span>
            </div>

            {couponCode && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: '#10b981', fontSize: '1rem', background: 'rgba(16, 185, 129, 0.05)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Tag size={14} /> Cupón ({couponCode})</span>
                <span style={{ fontWeight: 500 }}>- ${formatCurrency(couponDiscount)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', color: 'var(--text-muted)', fontSize: '1rem' }}>
              <span>Envío</span>
              <span style={{ color: 'var(--text-color)' }}>{selectedShipping ? `$${formatCurrency(selectedShipping.amount_local || selectedShipping.amount)}` : 'Calculando...'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.4rem', fontWeight: 800, paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'var(--text-color)' }}>Total</span>
              <span className="text-gradient" style={{ fontSize: '2rem' }}>${formatCurrency(totalToPay)}</span>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
