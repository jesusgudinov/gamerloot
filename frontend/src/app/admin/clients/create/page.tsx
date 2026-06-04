'use client';

import { useState } from 'react';
import { ArrowLeft, Save, UserPlus, MapPin, Loader2, Camera } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CreateClientPage() {
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
      const res = await fetch('http://127.0.0.1:8000/api/v1/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/admin/clients">
            <button className="btn-secondary" style={{ padding: '8px', borderRadius: '50%' }}>
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div>
            <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '4px' }}>Reclutar Jugador</h1>
            <p style={{ color: 'var(--text-muted)' }}>Crea un nuevo perfil de cliente y su dirección principal.</p>
          </div>
        </div>
        <button 
          onClick={handleSave} 
          disabled={loading}
          className="btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {loading ? 'Guardando...' : 'Guardar Perfil'}
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Columna Izquierda: Perfil */}
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--card-border)', paddingBottom: '16px' }}>
            <UserPlus size={24} color="var(--primary)" />
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Datos del Perfil</h2>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--card-bg)', border: '2px dashed var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {profilePictureUrl ? (
                <img src={profilePictureUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Camera size={24} color="var(--text-muted)" />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>URL de Imagen de Perfil (Opcional)</label>
              <input type="text" value={profilePictureUrl} onChange={e => setProfilePictureUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Nombre(s) *</label>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Apellidos</label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Nickname (Gamer Tag)</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Ej. xX_Slayer_Xx" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>RFC (Opcional)</label>
              <input type="text" value={rfc} onChange={e => setRfc(e.target.value)} placeholder="Para facturación" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Correo Electrónico *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Teléfono Móvil</label>
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Contraseña Inicial</label>
              <input type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder="Auto-generada si se deja en blanco" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)' }} />
            </div>
          </div>
        </div>

        {/* Columna Derecha: Libreta de Direcciones */}
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--card-border)', paddingBottom: '16px' }}>
            <MapPin size={24} color="#10b981" />
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Dirección de Entrega Principal</h2>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Alias de la Dirección</label>
            <input type="text" value={alias} onChange={e => setAlias(e.target.value)} placeholder="Ej. Casa, Oficina, Baticueva..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Calle *</label>
              <input type="text" value={street} onChange={e => setStreet(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>No. Ext *</label>
              <input type="text" value={exteriorNumber} onChange={e => setExteriorNumber(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>No. Int</label>
              <input type="text" value={interiorNumber} onChange={e => setInteriorNumber(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Colonia / Fracc. *</label>
              <input type="text" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Código Postal *</label>
              <input type="text" value={zipCode} onChange={e => setZipCode(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Municipio / Alcaldía *</label>
              <input type="text" value={city} onChange={e => setCity(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Estado *</label>
              <select value={stateName} onChange={e => setStateName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)' }}>
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

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Referencias Adicionales (Opcional)</label>
            <textarea value={references} onChange={e => setReferences(e.target.value)} placeholder="Ej. Casa blanca con portón negro, frente al Oxxo" rows={3} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)', resize: 'vertical' }} />
          </div>
          
        </div>

      </div>

    </div>
  );
}
