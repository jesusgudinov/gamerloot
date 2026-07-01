"use client"
import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// En producción, cargar desde process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder");

interface StripeProviderProps {
  clientSecret: string;
  children: React.ReactNode;
}

export default function StripeProvider({ clientSecret, children }: StripeProviderProps) {
  const options = {
    clientSecret,
    appearance: {
      theme: 'night' as const,
      variables: {
        colorPrimary: '#8b5cf6',
        colorBackground: '#06070B',
        colorText: '#ffffff',
        colorDanger: '#ef4444',
        fontFamily: 'Inter, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '12px',
        colorDangerText: '#ef4444',
      },
      rules: {
        '.Input': {
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: 'none',
          backgroundColor: 'rgba(255,255,255,0.03)',
        },
        '.Input:focus': {
          border: '1px solid #8b5cf6',
          boxShadow: '0 0 0 2px rgba(139, 92, 246, 0.2)',
        },
      }
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}
