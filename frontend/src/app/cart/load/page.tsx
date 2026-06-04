"use client"
import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart, CartItem } from '@/context/CartContext';
import { PackageOpen, Plus, Check, ArrowRight, ShoppingCart } from 'lucide-react';

function CartLoader() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();
  
  const [sharedItems, setSharedItems] = useState<CartItem[]>([]);
  const [addedItems, setAddedItems] = useState<Set<number>>(new Set());
  const [error, setError] = useState(false);

  useEffect(() => {
    const data = searchParams.get('data');
    if (!data) {
      router.push('/cart');
      return;
    }

    try {
      const decodedData = decodeURIComponent(atob(data));
      const parsedItems: CartItem[] = JSON.parse(decodedData);
      
      if (Array.isArray(parsedItems) && parsedItems.length > 0) {
        setSharedItems(parsedItems);
      } else {
        setError(true);
      }
    } catch (e) {
      console.error("Error al cargar carrito compartido:", e);
      setError(true);
    }
  }, [searchParams, router]);

  const handleAddSingle = (item: CartItem) => {
    addToCart(item);
    setAddedItems(prev => {
      const newSet = new Set(prev);
      newSet.add(item.product_id);
      return newSet;
    });
  };

  const handleAddAll = () => {
    sharedItems.forEach(item => {
      // Only add items that haven't been added yet in this view
      if (!addedItems.has(item.product_id)) {
        addToCart(item);
      }
    });
    router.push('/cart');
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <h2 style={{ color: '#ef4444', marginBottom: '15px', fontSize: '2rem' }}>Enlace Inválido</h2>
        <p style={{ color: '#94a3b8', fontSize: '1.2rem', marginBottom: '30px' }}>Este carrito compartido está vacío o el enlace está dañado.</p>
        <button className="btn-primary" onClick={() => router.push('/catalog')}>
          Explorar la Tienda
        </button>
      </div>
    );
  }

  if (sharedItems.length === 0) {
    return null; // Loading state (no items yet but no error)
  }

  const allAdded = addedItems.size === sharedItems.length;

  return (
    <main style={{ minHeight: '100vh', padding: '60px 20px', maxWidth: '800px', margin: '0 auto' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', marginBottom: '20px' }}>
          <PackageOpen size={40} />
        </div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '15px' }}>Carrito Compartido</h1>
        <p style={{ color: '#94a3b8', fontSize: '1.2rem' }}>
          Alguien ha compartido estos fantásticos componentes contigo. ¿Qué deseas agregar a tu cuenta?
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
        {sharedItems.map((item) => {
          const isAdded = addedItems.has(item.product_id);
          
          return (
            <div key={item.product_id} className="glass-panel" style={{ display: 'flex', gap: '20px', padding: '20px', alignItems: 'center' }}>
              <div style={{ width: '100px', height: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Sin Foto</span>
                )}
              </div>
              
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{item.name}</h3>
                <div style={{ display: 'flex', gap: '15px', color: '#94a3b8', fontSize: '0.9rem', marginBottom: '5px' }}>
                  <span>Cantidad: {item.quantity}</span>
                  <span>|</span>
                  <span>Precio unitario: ${formatCurrency(item.price)}</span>
                </div>
                <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff' }}>
                  Subtotal: ${formatCurrency(item.price * item.quantity)}
                </p>
              </div>
              
              <div style={{ paddingLeft: '20px' }}>
                <button 
                  onClick={() => !isAdded && handleAddSingle(item)}
                  disabled={isAdded}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '12px 20px', borderRadius: '8px', fontSize: '1rem', fontWeight: '600',
                    cursor: isAdded ? 'default' : 'pointer', transition: 'all 0.3s ease',
                    background: isAdded ? 'rgba(16, 185, 129, 0.1)' : 'rgba(139, 92, 246, 0.2)',
                    color: isAdded ? '#10b981' : '#a78bfa',
                    border: isAdded ? '1px solid #10b981' : '1px solid rgba(139, 92, 246, 0.5)'
                  }}
                >
                  {isAdded ? <><Check size={20} /> Agregado</> : <><Plus size={20} /> Agregar</>}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '30px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <button 
          className="btn-primary" 
          onClick={handleAddAll}
          style={{ width: '100%', padding: '18px', fontSize: '1.2rem', display: 'flex', justifyContent: 'center', gap: '12px', background: allAdded ? '#10b981' : 'var(--primary)' }}
        >
          {allAdded ? "Ir a Pagar" : "Agregar Todos y Ver Mi Carrito"} <ArrowRight size={24} />
        </button>
        
        <button 
          className="btn-secondary" 
          onClick={() => router.push('/cart')}
          style={{ width: '100%', padding: '15px', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', gap: '10px' }}
        >
          <ShoppingCart size={20} /> {allAdded ? "Ver Mi Carrito" : "Ir a Mi Carrito sin agregar nada"}
        </button>
      </div>

    </main>
  );
}

export default function LoadCartPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Preparando...</p>
      </div>
    }>
      <CartLoader />
    </Suspense>
  );
}
