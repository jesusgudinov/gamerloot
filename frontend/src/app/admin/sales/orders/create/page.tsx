'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Trash2, Search, Package, MapPin, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CreateManualOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Customer & Shipping State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactMethod, setContactMethod] = useState('Whatsapp');
  const [address, setAddress] = useState('');
  const [addressReferences, setAddressReferences] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [zipCode, setZipCode] = useState('');

  // Order Details
  const [paymentMethod, setPaymentMethod] = useState('Transferencia Bancaria');
  const [orderStatus, setOrderStatus] = useState('Pendiente');

  // Products & Cart
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/products/?page=1&size=1000');
      if (res.ok) {
        const data = await res.json();
        setAllProducts(data.items || data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addToCart = (product: any) => {
    const existing = cart.find(i => i.product_id === product.id);
    if (existing) {
      setCart(cart.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, {
        product_id: product.id,
        sku: product.sku,
        product_name: product.name,
        quantity: 1,
        unit_price: product.discount_price || product.base_price,
      }]);
    }
    setIsSearchOpen(false);
    setSearch('');
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity < 1) return;
    setCart(cart.map(i => i.product_id === id ? { ...i, quantity } : i));
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(i => i.product_id !== id));
  };

  const total = cart.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
  const subtotal = total / 1.16;
  const tax = total - subtotal;

  const handleSave = async () => {
    if (cart.length === 0) return alert("Agrega al menos un producto");
    if (!customerName) return alert("El nombre del cliente es obligatorio");

    setLoading(true);
    const payload = {
      user_id: 1,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      company_name: companyName,
      contact_method: contactMethod,
      address,
      address_references: addressReferences,
      city,
      state: stateName,
      zip_code: zipCode,
      status: orderStatus,
      payment_method: paymentMethod,
      subtotal,
      tax,
      total,
      items: cart.map(i => ({
        product_id: i.product_id,
        sku: i.sku,
        product_name: i.product_name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total_price: i.unit_price * i.quantity
      }))
    };

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/sales/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert("Pedido registrado exitosamente");
        router.push('/admin/sales/orders');
      } else {
        alert("Error al registrar pedido");
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = allProducts.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 10);

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/admin/sales/orders">
            <button className="btn-secondary" style={{ padding: '8px', borderRadius: '50%' }}>
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div>
            <h1 className="text-gradient" style={{ fontSize: '1.8rem', margin: 0 }}>Registrar Pedido Manual</h1>
            <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Captura un pedido en firme con dirección de envío y facturación.</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={loading} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
          <Save size={20} /> {loading ? 'Guardando...' : 'Guardar Pedido'}
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        
        {/* Columna Izquierda: Datos Logísticos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 20px 0', borderBottom: '1px solid var(--card-border)', paddingBottom: '12px' }}>
              <Search size={20} className="text-primary" /> Datos del Cliente
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Nombre Completo *</label>
                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)' }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Correo Electrónico * (Para notificaciones)</label>
                <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Teléfono</label>
                <input type="text" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Empresa (Opcional)</label>
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Razón social" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)' }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Vía de Contacto</label>
                <select value={contactMethod} onChange={e => setContactMethod(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)' }}>
                  <option>Whatsapp</option>
                  <option>Correo Electrónico</option>
                  <option>Teléfono</option>
                  <option>Tienda Física</option>
                </select>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 20px 0', borderBottom: '1px solid var(--card-border)', paddingBottom: '12px' }}>
              <MapPin size={20} className="text-primary" /> Dirección de Envío
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Dirección Completa (Calle, No., Colonia)</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)' }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Referencias Adicionales (Opcional)</label>
                <textarea value={addressReferences} onChange={e => setAddressReferences(e.target.value)} placeholder="Ej. Casa blanca con portón negro, frente al parque" rows={2} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)', resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Ciudad / Municipio</label>
                <input type="text" value={city} onChange={e => setCity(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Estado</label>
                <input type="text" value={stateName} onChange={e => setStateName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Código Postal</label>
                <input type="text" value={zipCode} onChange={e => setZipCode(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)' }} />
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 20px 0', borderBottom: '1px solid var(--card-border)', paddingBottom: '12px' }}>
              <CreditCard size={20} className="text-primary" /> Información de Pago y Estado
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Método de Pago</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)' }}>
                  <option>Transferencia Bancaria</option>
                  <option>Efectivo</option>
                  <option>Tarjeta de Crédito</option>
                  <option>Mercado Pago</option>
                  <option>PayPal</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Estado del Pedido</label>
                <select value={orderStatus} onChange={e => setOrderStatus(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)' }}>
                  <option value="Pendiente">Pendiente de Pago</option>
                  <option value="Pagado">Pagado</option>
                  <option value="En Ensamble">En Ensamble</option>
                  <option value="Enviado">Enviado</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* Columna Derecha: Productos y Resumen */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '24px', overflow: 'visible' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 20px 0', borderBottom: '1px solid var(--card-border)', paddingBottom: '12px' }}>
              <Package size={20} className="text-primary" /> Productos del Pedido
            </h3>
            
            <div style={{ position: 'relative', marginBottom: '24px' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input 
                type="text" 
                placeholder="Buscar producto por nombre o SKU..." 
                value={search}
                onChange={(e) => { setSearch(e.target.value); setIsSearchOpen(true); }}
                onFocus={() => setIsSearchOpen(true)}
                style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid var(--primary)', background: 'rgba(106, 17, 203, 0.05)', color: 'var(--text-color)' }}
              />
              {isSearchOpen && search && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', background: 'var(--card-bg)', backdropFilter: 'blur(12px)', border: '1px solid var(--card-border)', borderRadius: '8px', zIndex: 100, maxHeight: '300px', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                  {filteredProducts.length === 0 ? (
                    <div style={{ padding: '16px', color: 'var(--text-muted)', textAlign: 'center' }}>No se encontraron productos</div>
                  ) : (
                    filteredProducts.map(p => (
                      <div 
                        key={p.id} 
                        onClick={() => addToCart(p)}
                        style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 'bold' }}>{p.sku}</div>
                          <div style={{ fontSize: '0.9rem' }}>{p.name}</div>
                        </div>
                        <div style={{ color: '#10b981', fontWeight: 'bold' }}>${(p.discount_price || p.base_price).toFixed(2)}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            
            {/* Cart Items */}
            {cart.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {cart.map(item => (
                  <div key={item.product_id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>{item.sku}</div>
                      <div style={{ fontSize: '0.95rem' }}>{item.product_name}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="number" min="1" value={item.quantity} 
                        onChange={e => updateQuantity(item.product_id, parseInt(e.target.value) || 1)} 
                        style={{ width: '60px', padding: '6px', borderRadius: '4px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)', textAlign: 'center' }} 
                      />
                    </div>
                    <div style={{ width: '100px', textAlign: 'right', fontWeight: 'bold' }}>
                      ${(item.unit_price * item.quantity).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                    <button onClick={() => removeFromCart(item.product_id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--card-border)', borderRadius: '8px' }}>
                Aún no hay productos en el pedido
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid var(--card-border)', paddingBottom: '12px' }}>Resumen Financiero</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '1.05rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Subtotal (Sin IVA)</span>
                <span>${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>IVA (16%)</span>
                <span>${tax.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', fontWeight: 'bold', color: '#fff', paddingTop: '12px', borderTop: '1px solid var(--card-border)' }}>
                <span>Total</span>
                <span className="text-gradient">${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
