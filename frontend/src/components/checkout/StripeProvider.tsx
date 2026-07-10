"use client"
import React, { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useTheme } from 'next-themes';

// En producción, cargar desde process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder");

interface StripeProviderProps {
  clientSecret: string;
  children: React.ReactNode;
}

export default function StripeProvider({ clientSecret, children }: StripeProviderProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark' || !resolvedTheme;

  const options = {
    clientSecret,
    appearance: {
      theme: (isDark ? 'night' : 'stripe') as any, // 'stripe' or 'night'
      variables: {
        colorPrimary: '#8b5cf6',
        colorBackground: isDark ? '#06070B' : '#ffffff',
        colorText: isDark ? '#ffffff' : '#0f172a',
        colorDanger: '#ef4444',
        fontFamily: 'Inter, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '12px',
        colorDangerText: '#ef4444',
      },
      rules: {
        '.Input': {
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #cbd5e1',
          boxShadow: 'none',
          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.9)',
        },
        '.Input:focus': {
          border: '1px solid #8b5cf6',
          boxShadow: '0 0 0 2px rgba(139, 92, 246, 0.2)',
        },
      }
    },
  };

  if (!mounted) return null;

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}
