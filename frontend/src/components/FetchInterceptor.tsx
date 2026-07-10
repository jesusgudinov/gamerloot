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
          // Fix IPv6 connection refused issues by forcing IPv4 loopback
          resource = resource.replace('localhost:8000', '127.0.0.1:8000');
          
          config = config || {};
          config.credentials = 'include';
          
          const context = window.location.pathname.startsWith('/admin') ? 'admin' : 'client';
          const newHeaders = new Headers(config.headers);
          newHeaders.set('X-App-Context', context);
          
          // Respaldo de seguridad: si las cookies fallan en dev, inyectar el token desde localStorage
          const localToken = context === 'admin' ? localStorage.getItem('admin_token') : localStorage.getItem('client_token');
          if (localToken) {
            newHeaders.set('Authorization', `Bearer ${localToken}`);
          }
          
          config.headers = newHeaders;
        }
        
        return originalFetch(resource, config);
      };
    }
  }, []);

  return null;
}
