"use client";

import { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";

interface OrderPaymentStripeProps {
  folio: string;
}

export default function OrderPaymentStripe({ folio }: OrderPaymentStripeProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/profile/orders/${folio}?payment_intent=success`,
      },
    });

    if (error) {
      setErrorMessage(error.message || "Ocurrió un error al procesar el pago.");
    }
    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '24px', background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(139, 92, 246, 0.5)', animation: 'fadeIn 0.3s ease' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: 'var(--primary)' }}>Pago Seguro con Stripe</h3>
      <PaymentElement />
      {errorMessage && <p style={{ color: '#ef4444', marginTop: '12px', fontSize: '0.9rem', fontWeight: 600 }}>{errorMessage}</p>}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="hover-card"
        style={{
          marginTop: '24px',
          width: '100%',
          padding: '14px',
          borderRadius: '12px',
          background: 'var(--primary)',
          color: '#fff',
          border: 'none',
          fontWeight: 800,
          fontSize: '1rem',
          cursor: isProcessing || !stripe ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          opacity: isProcessing || !stripe ? 0.7 : 1
        }}
      >
        {isProcessing ? <><Loader2 size={18} className="spin" /> Procesando...</> : "Confirmar y Pagar"}
      </button>
    </form>
  );
}
