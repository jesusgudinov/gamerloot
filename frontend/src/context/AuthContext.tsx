"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string | null;
  permissions: string[];
  is_superuser: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  hasPermission: () => false,
  login: () => {},
  logout: () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const meRes = await fetch('http://localhost:8000/api/v1/auth/me', {
          credentials: 'include'
        });
        
        if (meRes.ok) {
          const userData = await meRes.json();
          setUser(userData);
          setToken("cookie-based"); // Indicador de que tenemos sesión
        } else {
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        console.error("Error loading auth:", error);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.is_superuser) return true;
    return user.permissions.includes(permission);
  };

  const login = (newToken: string, userData: User) => {
    // Ya no guardamos el token en localStorage porque está en una cookie HttpOnly
    setToken(newToken);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await fetch('http://localhost:8000/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      console.error("Error al cerrar sesión", e);
    }
    setToken(null);
    setUser(null);
    router.push('/admin/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, hasPermission, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
