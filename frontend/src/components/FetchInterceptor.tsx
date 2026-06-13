"use client";

import { useEffect } from 'react';

export default function FetchInterceptor() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ((window as any).__fetchIntercepted) return;
      (window as any).__fetchIntercepted = true;

      const originalFetch = window.fetch;
      
      window.fetch = async (...args) => {
        let [resource, config] = args;
        
        // Solo interceptamos llamadas a nuestra API local/backend
        if (typeof resource === 'string' && (resource.includes('localhost:8000') || resource.includes('/api/v1'))) {
          config = config || {};
          config.credentials = 'include';
          
          const context = window.location.pathname.startsWith('/admin') ? 'admin' : 'client';
          config.headers = {
            ...config.headers,
            'X-App-Context': context
          };
        }
        
        return originalFetch(resource, config);
      };
    }
  }, []);

  return null;
}
