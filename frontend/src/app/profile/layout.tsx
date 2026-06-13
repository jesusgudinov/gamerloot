"use client";

import { useEffect } from 'react';
import Navbar from '@/components/storefront/Navbar';
import ProfileSidebar from '@/components/storefront/profile/ProfileSidebar';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login');
      } else if (user.is_superuser || user.role) {
        // Bloquear administradores y staff de la suite de clientes
        router.push('/admin');
      }
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--background)' }}>
        <div style={{ width: '50px', height: '50px', border: '4px solid var(--card-border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}} />
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      
      <div style={{ flex: 1, padding: '40px 20px', maxWidth: '1400px', margin: '0 auto', width: '100%', display: 'flex', gap: '30px', flexDirection: 'row' }} className="profile-container">
        {/* Sidebar */}
        <ProfileSidebar />
        
        {/* Main Content Area */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {children}
        </main>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 900px) {
          .profile-container {
            flex-direction: column !important;
            padding: 20px !important;
          }
        }
      `}} />
    </div>
  );
}
