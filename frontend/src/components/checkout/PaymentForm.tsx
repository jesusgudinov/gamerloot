"use client"
import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

interface PaymentFormProps {
  onSuccess: () => void;
  orderId: string;
}

export default function PaymentForm({ onSuccess, orderId }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    // Confirmamos el pago usando los elementos montados
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // En una app real de producción, Next.js podría manejar la redirección de vuelta para 3D Secure
        // return_url: \`\${window.location.origin}/checkout?order=\${orderId}\`,
      },
      redirect: 'if_required' // Permite manejar la respuesta aquí si no requiere redirección 3D Secure
    });

    if (error) {
      setErrorMessage(error.message || "Ocurrió un error inesperado al procesar tu tarjeta.");
      setIsProcessing(false);
    } else {
      // El pago fue exitoso
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in-up">
      <PaymentElement id="payment-element" />
      
      {errorMessage && (
        <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '0.95rem' }}>
          {errorMessage}
        </div>
      )}

      <button 
        type="submit" 
        disabled={isProcessing || !stripe || !elements}
        className="btn-primary" 
        style={{ 
          width: '100%', 
          padding: '16px', 
          fontSize: '1.1rem', 
          background: 'linear-gradient(135deg, #10b981, #059669)', 
          color: 'white', 
          borderRadius: '12px', 
          border: 'none', 
          fontWeight: 600, 
          marginTop: '24px',
          boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
          opacity: isProcessing ? 0.7 : 1,
          cursor: isProcessing ? 'not-allowed' : 'pointer'
        }}
      >
        {isProcessing ? 'Procesando Pago...' : 'Pagar de Forma Segura'}
      </button>
    </form>
  );
}
