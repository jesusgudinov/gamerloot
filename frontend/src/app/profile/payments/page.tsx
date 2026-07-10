"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CreditCard, Plus, Trash2, ShieldCheck, CheckCircle } from 'lucide-react';
import StripeProvider from '@/components/checkout/StripeProvider';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// --- SUB-COMPONENT FOR STRIPE ELEMENTS ---
function SetupForm({ onSuccess, onCancel }: { onSuccess: () => void, onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError('');

    const { error: setupError } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: window.location.href, // Required for 3DS redirects
      },
      redirect: 'if_required' // Evitar redirect si no es necesario (como tarjetas de prueba)
    });

    if (setupError) {
      setError(setupError.message || 'Error al guardar la tarjeta.');
      setLoading(false);
    } else {
      // Éxito
      setLoading(false);
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && <div style={{ color: '#ef4444', fontSize: '0.9rem', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>}
      
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
        <button type="button" onClick={onCancel} className="hover-card" style={{ padding: '12px 24px', borderRadius: '12px', background: 'var(--input-bg)', color: 'var(--text-color)', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
          Cancelar
        </button>
        <button type="submit" disabled={!stripe || loading} className="hover-card" style={{ padding: '12px 24px', borderRadius: '12px', background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 600, cursor: loading || !stripe ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {loading ? 'Guardando...' : <><ShieldCheck size={18} /> Guardar Tarjeta</>}
        </button>
      </div>
    </form>
  );
}


// --- MAIN PAGE ---
export default function PaymentsPage() {
  const { user, token } = useAuth();
  
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (user && token) {
      fetchMethods();
    }
  }, [user, token]);

  const fetchMethods = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:8000/api/v1/stripe/payment-methods`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMethods(data);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = async () => {
    if (!token) return;
    setIsAdding(true);
    setClientSecret(null);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/stripe/setup-intent`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setClientSecret(data.client_secret);
      } else {
        alert("Error al generar sesión segura.");
        setIsAdding(false);
      }
    } catch (e) {
      console.error(e);
      setIsAdding(false);
    }
  };

  const handleDelete = async (pmId: string) => {
    if (!token) return;
    const confirm = window.confirm("¿Seguro que deseas eliminar esta tarjeta?");
    if (!confirm) return;

    try {
      const res = await fetch(`http://localhost:8000/api/v1/stripe/payment-methods/${pmId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchMethods();
      } else {
        alert("Error al eliminar la tarjeta.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && !isAdding && methods.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--card-border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px', letterSpacing: '-0.5px' }}>
            Métodos de Pago
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={18} color="#10b981" /> Totalmente encriptado y protegido por Stripe.
          </p>
        </div>
        
        {!isAdding && (
          <button 
            onClick={handleAddClick}
            className="hover-card"
            style={{ padding: '12px 24px', borderRadius: '12px', background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <Plus size={20} /> Añadir Tarjeta
          </button>
        )}
      </div>

      {isAdding ? (
        <div className="glass-panel" style={{ padding: '32px', borderRadius: '24px', maxWidth: '600px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CreditCard size={24} color="var(--primary)" /> Nueva Tarjeta
          </h2>
          {clientSecret ? (
            <StripeProvider clientSecret={clientSecret}>
              <SetupForm 
                onSuccess={() => {
                  setIsAdding(false);
                  fetchMethods();
                }} 
                onCancel={() => setIsAdding(false)} 
              />
            </StripeProvider>
          ) : (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
              Generando túnel seguro...
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {methods.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', borderRadius: '24px', textAlign: 'center', gridColumn: '1 / -1' }}>
              <CreditCard size={48} color="var(--card-border)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--text-muted)' }}>No tienes tarjetas guardadas</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Añade una tarjeta para facilitar tus futuras compras de manera segura.</p>
            </div>
          ) : (
            methods.map((method) => (
              <div key={method.id} className="glass-panel hover-card" style={{ padding: '24px', borderRadius: '20px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(20px)' }}></div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
                  <div style={{ background: 'var(--input-bg)', padding: '10px', borderRadius: '12px' }}>
                    <CreditCard size={28} color="var(--primary)" />
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <CheckCircle size={12} /> Guardada
                  </span>
                </div>
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                    {method.card.brand}
                  </p>
                  <p style={{ fontSize: '1.2rem', fontWeight: 600, letterSpacing: '2px', fontFamily: 'monospace' }}>
                    •••• •••• •••• {method.card.last4}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Exp: {method.card.exp_month}/{method.card.exp_year}</span>
                    <button 
                      onClick={() => handleDelete(method.id)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 600, padding: '6px 12px', borderRadius: '8px', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <Trash2 size={16} /> Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
