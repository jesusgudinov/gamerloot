"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: number;
  email: string;
  username?: string;
  full_name: string;
  phone_number?: string;
  profile_picture_url?: string;
  level?: number;
  xp?: number;
  role: string | null;
  permissions: string[];
  is_superuser: boolean;
  default_zip_code?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  hasPermission: () => false,
  login: () => {},
  logout: () => {},
  updateUser: () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const isAdminContext = window.location.pathname.startsWith('/admin');
        const contextParam = isAdminContext ? 'admin' : 'client';
        
        const meRes = await fetch(`http://localhost:8000/api/v1/auth/me?context=${contextParam}`, {
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

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  const logout = async () => {
    try {
      const isAdminContext = window.location.pathname.startsWith('/admin');
      await fetch(`http://localhost:8000/api/v1/auth/logout?context=${isAdminContext ? 'admin' : 'client'}`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      console.error("Error al cerrar sesión", e);
    }
    setToken(null);
    setUser(null);
    
    // Redirect to correct login page based on context
    const isAdminContext = window.location.pathname.startsWith('/admin');
    router.push(isAdminContext ? '/admin/login' : '/auth/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, hasPermission, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
