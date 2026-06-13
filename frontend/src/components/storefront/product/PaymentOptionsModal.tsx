"use client";
import React, { useState } from 'react';
import { X, CreditCard, ChevronDown } from 'lucide-react';

interface PaymentOptionsModalProps {
  price: number;
}

export default function PaymentOptionsModal({ price }: PaymentOptionsModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  };

  // Lógica del Modelo Híbrido Competitivo
  // Asumimos 3 y 6 meses como "Gratis" (absorbidos por la tienda)
  // De 9 a 24 meses, se transfiere el costo de financiamiento al cliente.
  const msiOptions = [
    { months: 3, feeRate: 0 },       // La tienda absorbe el 5%
    { months: 6, feeRate: 0 },       // La tienda absorbe el 7.5%
    { months: 9, feeRate: 0.10 },    // Stripe cobra 10%
    { months: 12, feeRate: 0.125 },  // Stripe cobra 12.5%
    { months: 18, feeRate: 0.175 },  // Stripe cobra 17.5%
    { months: 24, feeRate: 0.225 },  // Stripe cobra 22.5%
  ];

  return (
    <>
      <div style={{ marginTop: '10px' }}>
        <div style={{ fontSize: '1.2rem', color: '#10b981', fontWeight: 'bold' }}>
          {formatCurrency((price * 1.125) / 12)} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>x 12 meses pagando con tarjetas participantes</span>
        </div>
        <button 
          onClick={() => setIsOpen(true)}
          className="hover-card"
          style={{ 
            background: 'color-mix(in srgb, var(--primary) 15%, transparent)', 
            border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)', 
            color: 'var(--primary)', 
            textDecoration: 'none', 
            cursor: 'pointer', 
            padding: '6px 14px', 
            borderRadius: '20px',
            marginTop: '10px', 
            fontSize: '0.85rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 600,
            transition: 'all 0.2s'
          }}
        >
          <CreditCard size={14} /> Ver opciones de pago y MSI <ChevronDown size={14} />
        </button>
      </div>

      {isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--card-bg)', border: '1px solid var(--primary)',
            borderRadius: '16px', width: '90%', maxWidth: '600px',
            padding: '30px', position: 'relative',
            boxShadow: '0 0 30px rgba(139, 92, 246, 0.2)'
          }}>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            
            <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CreditCard /> Opciones de pago mensual
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
              Selecciona pagar con tu <strong>tarjeta de crédito</strong>. Hasta 24 meses disponibles en tarjetas participantes.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--card-border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px' }}>Plazo</th>
                    <th style={{ padding: '12px' }}>Por mes</th>
                    <th style={{ padding: '12px' }}>Costo de Financiamiento</th>
                    <th style={{ padding: '12px' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {msiOptions.map((opt) => {
                    const totalCost = price * (1 + opt.feeRate);
                    const monthlyCost = totalCost / opt.months;
                    const isFree = opt.feeRate === 0;

                    return (
                      <tr key={opt.months} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '15px 12px', fontWeight: 'bold' }}>{opt.months} meses</td>
                        <td style={{ padding: '15px 12px' }}>{formatCurrency(monthlyCost)}</td>
                        <td style={{ padding: '15px 12px', color: isFree ? '#10b981' : 'var(--text-muted)', fontWeight: isFree ? 'bold' : 'normal' }}>
                          {isFree ? 'GRATIS' : formatCurrency(totalCost - price)}
                        </td>
                        <td style={{ padding: '15px 12px' }}>{formatCurrency(totalCost)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              * El Costo de Financiamiento ya está incluido en los montos totales para los plazos con intereses. Promociones sujetas a disponibilidad y aprobación del banco emisor.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
