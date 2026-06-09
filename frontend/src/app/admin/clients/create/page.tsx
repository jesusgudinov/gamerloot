'use client';

import { useState } from 'react';
import { ArrowLeft, Save, UserPlus, MapPin, Loader2, Camera } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function CreateClientPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Perfil del Jugador
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState(''); // Obligatorio por schema, podemos auto-generarlo o pedirlo
  const [rfc, setRfc] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');

  // Libreta de Direcciones (Dirección Principal)
  const [alias, setAlias] = useState('');
  const [street, setStreet] = useState('');
  const [exteriorNumber, setExteriorNumber] = useState('');
  const [interiorNumber, setInteriorNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [references, setReferences] = useState('');

  const generatePassword = () => {
    return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
  };

  const handleSave = async () => {
    if (!email || !firstName || !street || !exteriorNumber || !neighborhood || !city || !stateName || !zipCode) {
      alert("Por favor completa todos los campos obligatorios (*).");
      return;
    }

    setLoading(true);

    const payload = {
      username: username || null,
      email: email,
      first_name: firstName,
      last_name: lastName || null,
      phone_number: phone || null,
      password: password || generatePassword(),
      rfc: rfc || null,
      profile_picture_url: profilePictureUrl || null,
      is_active: true,
      address: {
        alias: alias || 'Principal',
        street: street,
        exterior_number: exteriorNumber,
        interior_number: interiorNumber || null,
        neighborhood: neighborhood,
        city: city,
        state: stateName,
        zip_code: zipCode,
        references: references || null,
        is_default: true
      }
    };

    try {
      const res = await fetch('http://localhost:8000/api/v1/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        alert("¡Jugador registrado exitosamente en la base de datos!");
        router.push('/admin/clients');
      } else {
        const err = await res.json();
        alert(`Error al registrar: ${err.detail || 'Verifica los datos'}`);
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión al servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative' }}>
      
      <header className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/admin/clients">
            <button className="btn-secondary" style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-color)', cursor: 'pointer' }}>
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div>
            <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <UserPlus size={32} style={{ color: 'var(--primary)' }} />
              Reclutar Jugador
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Crea un nuevo perfil de cliente y configura su expediente logístico.</p>
          </div>
        </div>
        <button 
          onClick={handleSave} 
          disabled={loading}
          className="btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 28px', borderRadius: '12px', opacity: loading ? 0.7 : 1, fontSize: '1rem', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none', fontWeight: 600, color: 'white', boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)' }}
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {loading ? 'Procesando...' : 'Guardar Expediente'}
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '32px', alignItems: 'start' }}>
        
        {/* Columna Izquierda: Perfil */}
        <div className="glass-panel hover-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '28px', position: 'relative', overflow: 'hidden', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Brillo decorativo */}
          <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(106, 17, 203, 0.25) 0%, transparent 70%)', filter: 'blur(20px)', zIndex: 0, pointerEvents: 'none' }}></div>
          
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
            <div style={{ padding: '10px', background: 'rgba(106, 17, 203, 0.1)', borderRadius: '12px', border: '1px solid rgba(106, 17, 203, 0.2)' }}>
              <UserPlus size={24} color="var(--primary)" />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--foreground)' }}>Identidad del Jugador</h2>
          </div>

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '24px', alignItems: 'center' }}>
            <div style={{ width: '96px', height: '96px', borderRadius: '24px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.3)' }}>
              {profilePictureUrl ? (
                <img src={profilePictureUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Camera size={32} color="var(--text-muted)" style={{ opacity: 0.5 }} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label" style={{ marginBottom: '8px' }}>Imagen de Perfil</label>
              <input type="text" className="form-input" value={profilePictureUrl} onChange={e => setProfilePictureUrl(e.target.value)} placeholder="https://ejemplo.com/avatar.jpg" style={{ width: '100%' }} />
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label className="form-label" style={{ marginBottom: '8px' }}>Nombre(s) <span style={{color: 'var(--primary)'}}>*</span></label>
              <input type="text" className="form-input" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Ej. John" style={{ width: '100%' }} />
            </div>
            <div>
              <label className="form-label" style={{ marginBottom: '8px' }}>Apellidos</label>
              <input type="text" className="form-input" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Ej. Doe" style={{ width: '100%' }} />
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label className="form-label" style={{ marginBottom: '8px' }}>Gamer Tag (Nickname)</label>
              <input type="text" className="form-input" value={username} onChange={e => setUsername(e.target.value)} placeholder="Ej. xX_Slayer_Xx" style={{ width: '100%' }} />
            </div>
            <div>
              <label className="form-label" style={{ marginBottom: '8px' }}>RFC / Tax ID</label>
              <input type="text" className="form-input" value={rfc} onChange={e => setRfc(e.target.value)} placeholder="Opcional para facturas" style={{ width: '100%' }} />
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <label className="form-label" style={{ marginBottom: '8px' }}>Correo Electrónico <span style={{color: 'var(--primary)'}}>*</span></label>
            <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="jugador@ejemplo.com" style={{ width: '100%' }} />
          </div>

          <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label className="form-label" style={{ marginBottom: '8px' }}>Teléfono Móvil</label>
              <input type="text" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+52 000 000 0000" style={{ width: '100%' }} />
            </div>
            <div>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Contraseña</span>
                <button onClick={(e) => { e.preventDefault(); setPassword(generatePassword()); }} style={{ background: 'rgba(106, 17, 203, 0.1)', border: '1px solid rgba(106, 17, 203, 0.3)', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px' }}>
                  Auto-generar
                </button>
              </label>
              <input type="text" className="form-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="Se generará sola" style={{ width: '100%' }} />
            </div>
          </div>
        </div>

        {/* Columna Derecha: Libreta de Direcciones */}
        <div className="glass-panel hover-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '28px', position: 'relative', overflow: 'hidden', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Brillo decorativo */}
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)', filter: 'blur(20px)', zIndex: 0, pointerEvents: 'none' }}></div>
          
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
            <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <MapPin size={24} color="#10b981" />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--foreground)' }}>Logística y Entrega</h2>
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <label className="form-label" style={{ marginBottom: '8px' }}>Alias del Destino</label>
            <input type="text" className="form-input" value={alias} onChange={e => setAlias(e.target.value)} placeholder="Ej. Casa, Oficina, Baticueva..." style={{ width: '100%' }} />
          </div>

          <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '24px' }}>
            <div>
              <label className="form-label" style={{ marginBottom: '8px' }}>Calle <span style={{color: '#10b981'}}>*</span></label>
              <input type="text" className="form-input" value={street} onChange={e => setStreet(e.target.value)} placeholder="Av. Siempre Viva" style={{ width: '100%' }} />
            </div>
            <div>
              <label className="form-label" style={{ marginBottom: '8px' }}>No. Ext <span style={{color: '#10b981'}}>*</span></label>
              <input type="text" className="form-input" value={exteriorNumber} onChange={e => setExteriorNumber(e.target.value)} placeholder="123" style={{ width: '100%' }} />
            </div>
            <div>
              <label className="form-label" style={{ marginBottom: '8px' }}>No. Int</label>
              <input type="text" className="form-input" value={interiorNumber} onChange={e => setInteriorNumber(e.target.value)} placeholder="Apt 4" style={{ width: '100%' }} />
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
            <div>
              <label className="form-label" style={{ marginBottom: '8px' }}>Colonia / Fraccionamiento <span style={{color: '#10b981'}}>*</span></label>
              <input type="text" className="form-input" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="Centro" style={{ width: '100%' }} />
            </div>
            <div>
              <label className="form-label" style={{ marginBottom: '8px' }}>Código Postal <span style={{color: '#10b981'}}>*</span></label>
              <input type="text" className="form-input" value={zipCode} onChange={e => setZipCode(e.target.value)} placeholder="00000" style={{ width: '100%' }} />
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label className="form-label" style={{ marginBottom: '8px' }}>Municipio / Alcaldía <span style={{color: '#10b981'}}>*</span></label>
              <input type="text" className="form-input" value={city} onChange={e => setCity(e.target.value)} placeholder="Ciudad" style={{ width: '100%' }} />
            </div>
            <div>
              <label className="form-label" style={{ marginBottom: '8px' }}>Estado <span style={{color: '#10b981'}}>*</span></label>
              <select className="form-input" value={stateName} onChange={e => setStateName(e.target.value)} style={{ width: '100%', cursor: 'pointer' }}>
                <option value="">Selecciona Estado</option>
                <option value="Aguascalientes">Aguascalientes</option>
                <option value="Baja California">Baja California</option>
                <option value="Baja California Sur">Baja California Sur</option>
                <option value="Campeche">Campeche</option>
                <option value="Chiapas">Chiapas</option>
                <option value="Chihuahua">Chihuahua</option>
                <option value="Ciudad de México">Ciudad de México</option>
                <option value="Coahuila">Coahuila</option>
                <option value="Colima">Colima</option>
                <option value="Durango">Durango</option>
                <option value="Estado de México">Estado de México</option>
                <option value="Guanajuato">Guanajuato</option>
                <option value="Guerrero">Guerrero</option>
                <option value="Hidalgo">Hidalgo</option>
                <option value="Jalisco">Jalisco</option>
                <option value="Michoacán">Michoacán</option>
                <option value="Morelos">Morelos</option>
                <option value="Nayarit">Nayarit</option>
                <option value="Nuevo León">Nuevo León</option>
                <option value="Oaxaca">Oaxaca</option>
                <option value="Puebla">Puebla</option>
                <option value="Querétaro">Querétaro</option>
                <option value="Quintana Roo">Quintana Roo</option>
                <option value="San Luis Potosí">San Luis Potosí</option>
                <option value="Sinaloa">Sinaloa</option>
                <option value="Sonora">Sonora</option>
                <option value="Tabasco">Tabasco</option>
                <option value="Tamaulipas">Tamaulipas</option>
                <option value="Tlaxcala">Tlaxcala</option>
                <option value="Veracruz">Veracruz</option>
                <option value="Yucatán">Yucatán</option>
                <option value="Zacatecas">Zacatecas</option>
              </select>
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <label className="form-label" style={{ marginBottom: '8px' }}>Referencias Adicionales</label>
            <textarea className="form-input" value={references} onChange={e => setReferences(e.target.value)} placeholder="Ej. Casa blanca con portón negro, dejar con el guardia..." rows={3} style={{ width: '100%', resize: 'vertical' }} />
          </div>
          
        </div>

      </div>

    </div>
  );
}
