'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Printer, X, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useAuth } from '@/context/AuthContext';

export default function QuoteGeneratorPage() {
  const router = useRouter();
  const { token } = useAuth();
  
  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [contactMethod, setContactMethod] = useState('Whatsapp');
  const [validUntil, setValidUntil] = useState('');
  const [folio] = useState(`LOOT-${Math.floor(Math.random() * 900000) + 100000}`);
  
  // Product Selection
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Cart
  const [cart, setCart] = useState<any[]>([]);
  
  const quoteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (search.trim().length > 0) {
        fetchSearchResults(search);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, token]);

  const fetchSearchResults = async (term: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/products/?page=1&size=15&search=${encodeURIComponent(term)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.items || []);
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

  const handleExportPDF = async () => {
    if (!quoteRef.current) return;
    
    try {
      const canvas = await html2canvas(quoteRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Cotizacion_${customerName || 'GamerLoot'}.pdf`);
    } catch (e) {
      console.error("PDF generation failed", e);
      alert("Error al generar el PDF");
    }
  };



  return (
    <div style={{ width: '100%', display: 'flex', gap: '32px' }}>
      
      {/* Columna Izquierda: Formulario de Creación */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/admin/sales/orders">
            <button className="btn-secondary" style={{ padding: '8px', borderRadius: '50%' }}>
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div>
            <h1 className="text-gradient" style={{ fontSize: '1.8rem', margin: 0 }}>Generar Cotización PDF</h1>
            <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Crea rápidamente un documento de cotización sin afectar el inventario.</p>
          </div>
        </header>

        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>Datos del Cliente</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Nombre / Razón Social *</label>
              <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Teléfono</label>
              <input type="text" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Vía de Contacto</label>
              <select value={contactMethod} onChange={e => setContactMethod(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }}>
                <option>Whatsapp</option>
                <option>Correo Electrónico</option>
                <option>Facebook</option>
                <option>Instagram</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Vigencia de Cotización</label>
              <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }} />
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px', overflow: 'visible', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>Buscador de Productos</h3>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o SKU..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setIsSearchOpen(true); }}
              onFocus={() => setIsSearchOpen(true)}
              style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }}
            />
            {isSearchOpen && search && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', background: 'var(--card-bg)', backdropFilter: 'blur(12px)', border: '1px solid var(--card-border)', borderRadius: '8px', zIndex: 100, maxHeight: '300px', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                {searchResults.length === 0 ? (
                  <div style={{ padding: '16px', color: 'var(--text-muted)', textAlign: 'center' }}>No se encontraron productos</div>
                ) : (
                  searchResults.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => addToCart(p)}
                      style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 'bold' }}>{p.sku}</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--foreground)' }}>{p.name}</div>
                      </div>
                      <div style={{ color: '#10b981', fontWeight: 'bold' }}>${(p.discount_price || p.base_price).toFixed(2)}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          
          {/* Cart Table */}
          {cart.length > 0 && (
            <div className="table-responsive-wrapper" style={{ marginTop: '24px' }}>
              <table className="admin-table">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '8px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500 }}>Producto</th>
                    <th style={{ padding: '8px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 500, width: '100px' }}>Cant.</th>
                    <th style={{ padding: '8px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 500 }}>Precio</th>
                    <th style={{ padding: '8px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 500 }}>Total</th>
                    <th style={{ padding: '8px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map(item => (
                    <tr key={item.product_id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>{item.sku}</div>
                        <div style={{ fontSize: '0.9rem' }}>{item.product_name}</div>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <input type="number" min="1" value={item.quantity} onChange={e => updateQuantity(item.product_id, parseInt(e.target.value) || 1)} style={{ width: '60px', padding: '6px', borderRadius: '4px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)', textAlign: 'center' }} />
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--text-muted)' }}>${item.unit_price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold' }}>${(item.unit_price * item.quantity).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <button onClick={() => removeFromCart(item.product_id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Columna Derecha: Previsualización de Cotización (PDF) y Acciones */}
      <div style={{ width: '600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Acciones */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={handleExportPDF} className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none', borderRadius: '8px', fontWeight: 600, color: 'white', padding: '12px' }}>
            <Printer size={18} /> Exportar Documento PDF
          </button>
        </div>

        {/* Hoja de Cotización (Estilo Documento) */}
        <div ref={quoteRef} style={{ background: '#ffffff', color: '#000000', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontFamily: 'Arial, sans-serif' }}>
          
          {/* Encabezado PDF */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
            <div>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '28px', color: '#000' }}>Gamer Loot</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#555' }}>Lootea tu hardware favorito</p>
            </div>
            <div style={{ fontSize: '10px', textAlign: 'right', color: '#333' }}>
              <strong>Razón social:</strong> GAMER LOOT S.A. DE C.V.<br/>
              <strong>RFC:</strong> GLO210224KJ4<br/>
              <strong>Dirección:</strong><br/>
              Calle Niños Héroes 355B 22<br/>
              Infonavit la Soledad 45403 Tonalá Jalisco
            </div>
          </div>

          {/* Datos del Cliente y Folio */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', fontSize: '11px' }}>
            <div>
              <div style={{ marginBottom: '4px' }}><strong>Cliente:</strong> {customerName || '________________________'}</div>
              <div style={{ marginBottom: '4px' }}><strong>Teléfono:</strong> {customerPhone || '________________________'}</div>
              <div><strong>Vía de contacto:</strong> {contactMethod}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ marginBottom: '4px' }}><strong>Folio:</strong> {folio}</div>
              <div><strong>Vigencia:</strong> {validUntil || '_________________'}</div>
            </div>
          </div>

          {/* Tabla de Productos PDF */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px', fontSize: '10px' }}>
            <thead>
              <tr style={{ background: '#000000', color: '#ffffff' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>SKU</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Título</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>Cantidad</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Costo unitario</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {cart.map(item => (
                <tr key={item.product_id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>{item.sku}</td>
                  <td style={{ padding: '8px' }}>{item.product_name}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{item.quantity.toFixed(2)}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>${(item.unit_price / 1.16).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>${((item.unit_price * item.quantity) / 1.16).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
              {cart.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Añade productos para verlos aquí</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Totales y Datos Bancarios */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <div style={{ width: '60%' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '11px' }}>Datos bancarios:</h4>
              <div style={{ marginBottom: '4px' }}><strong>Beneficiario:</strong> GAMER LOOT SA DE CV</div>
              <div style={{ marginBottom: '4px' }}><strong>Banco:</strong> BBVA</div>
              <div style={{ marginBottom: '4px' }}><strong>Cuenta:</strong> 011 705 0321</div>
              <div style={{ marginBottom: '24px' }}><strong>CLABE:</strong> 012320001170503214</div>

              <div style={{ fontSize: '9px', color: '#555' }}>
                <strong>Notas:</strong><br/>
                - Los envíos solo se realizarán en días hábiles una vez que recibamos su pago en nuestras cuentas.<br/>
                - Para agilizar el proceso por favor enviar su comprobante de pago al correo: ventas@gamerloot.com.mx
              </div>
            </div>
            
            <div style={{ width: '35%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <tbody>
                  <tr>
                    <td style={{ background: '#000', color: '#fff', padding: '6px', fontWeight: 'bold' }}>Subtotal:</td>
                    <td style={{ padding: '6px', textAlign: 'right' }}>${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td style={{ background: '#000', color: '#fff', padding: '6px', fontWeight: 'bold' }}>IVA:</td>
                    <td style={{ padding: '6px', textAlign: 'right' }}>${tax.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td style={{ background: '#000', color: '#fff', padding: '6px', fontWeight: 'bold' }}>Total:</td>
                    <td style={{ padding: '6px', textAlign: 'right' }}>${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
