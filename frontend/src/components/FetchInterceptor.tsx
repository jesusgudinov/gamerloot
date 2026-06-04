"use client";

import { useEffect } from 'react';

export default function FetchInterceptor() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const originalFetch = window.fetch;
      
      window.fetch = async (...args) => {
        let [resource, config] = args;
        
        // Solo interceptamos llamadas a nuestra API local/backend
        if (typeof resource === 'string' && (resource.includes('127.0.0.1:8000') || resource.includes('/api/v1'))) {
          config = config || {};
          // Siempre incluimos las cookies (credentials: 'include')
          config.credentials = 'include';
        }
        
        return originalFetch(resource, config);
      };
    }
  }, []);

  return null;
}
