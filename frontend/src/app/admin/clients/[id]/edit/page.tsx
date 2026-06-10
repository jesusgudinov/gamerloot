'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, User, Camera, Loader2, Ban, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ImageUploader from '@/components/ui/ImageUploader';

export default function EditClientPage() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientData, setClientData] = useState<any>(null);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [rfc, setRfc] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (id) fetchClient();
  }, [id]);

  const fetchClient = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/clients/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setClientData(data);
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setPhone(data.phone_number || '');
        setRfc(data.rfc || '');
        setProfilePictureUrl(data.profile_picture_url || '');
        setIsActive(data.is_active);
      } else {
        alert("Cliente no encontrado.");
        router.push('/admin/clients');
      }
    } catch (e) {
      console.error(e);
      alert("Error al cargar cliente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      first_name: firstName,
      last_name: lastName || null,
      phone_number: phone || null,
      rfc: rfc || null,
      profile_picture_url: profilePictureUrl || null,
      is_active: isActive
    };

    try {
      const res = await fetch(`http://localhost:8000/api/v1/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        alert("¡Perfil de jugador actualizado!");
        router.push('/admin/clients');
      } else {
        const err = await res.json();
        alert(`Error al actualizar: ${err.detail || 'Verifica los datos'}`);
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión al servidor");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    let newStatus = !isActive;
    if (isActive) {
      const confirmBan = window.confirm("¿Estás seguro de que quieres SUSPENDER a este jugador? No podrá iniciar sesión ni comprar.");
      if (!confirmBan) return;
      newStatus = false;
    }

    try {
      const res = await fetch(`http://localhost:8000/api/v1/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ is_active: newStatus })
      });
      if (res.ok) {
        setIsActive(newStatus);
        alert(newStatus ? "Cuenta reactivada exitosamente." : "Jugador suspendido.");
      } else {
        alert("Error al cambiar el estado.");
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión al servidor");
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando perfil del jugador...</div>;
  }

  return (
    <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/admin/clients">
            <button className="btn-secondary" style={{ padding: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-color)', cursor: 'pointer' }}>
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div>
            <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '4px' }}>Editar Perfil: {clientData?.username}</h1>
            <p style={{ color: 'var(--text-muted)' }}>Actualiza la información de contacto o administra su acceso.</p>
          </div>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', opacity: saving ? 0.7 : 1, background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none', borderRadius: '8px', fontWeight: 600, color: 'white', boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)' }}
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </header>

      <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }}></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <User size={24} color="var(--primary)" />
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Datos Generales</h2>
          </div>
          
          <button 
            onClick={toggleStatus}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
              background: isActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              color: isActive ? '#ef4444' : '#10b981'
            }}
          >
            {isActive ? <Ban size={18} /> : <CheckCircle size={18} />}
            {isActive ? 'Suspender / Banear' : 'Reactivar Cuenta'}
          </button>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <label style={{ display: 'block', marginBottom: '16px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Imagen de Perfil</label>
          <ImageUploader 
            onUploadSuccess={(url) => setProfilePictureUrl(url)} 
            currentImageUrl={profilePictureUrl} 
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div>
            <label style={{ display: 'block', marginBottom: '16px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Nombre(s)</label>
            <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '16px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Apellidos</label>
            <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div>
            <label style={{ display: 'block', marginBottom: '16px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Teléfono Móvil</label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '16px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>RFC (Opcional)</label>
            <input type="text" value={rfc} onChange={e => setRfc(e.target.value)} placeholder="Para facturación" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }} />
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '8px', position: 'relative', zIndex: 1 }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: 'var(--text-muted)' }}>Seguridad de la Cuenta</h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            La contraseña y el correo no pueden ser modificados manualmente por el administrador para proteger la privacidad del usuario. El cliente debe usar el portal para restablecerla.
          </p>
          <button className="btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: 'var(--text-color)', cursor: 'pointer' }} onClick={() => alert("Se enviaría un correo de restablecimiento de contraseña a " + clientData.email)}>
            Enviar enlace de restablecimiento de contraseña
          </button>
        </div>

      </div>
    </div>
  );
}
