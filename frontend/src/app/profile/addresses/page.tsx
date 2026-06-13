"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MapPin, Plus, Edit, Trash2, CheckCircle } from 'lucide-react';
import DynamicIcon from '@/components/ui/DynamicIcon';

interface Address {
  id: number;
  user_id: number;
  alias: string | null;
  street: string;
  exterior_number: string;
  interior_number: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  references: string | null;
  icon_name: string | null;
  is_default: boolean;
}

export default function AddressesPage() {
  const { user, token } = useAuth();
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Partial<Address>>({
    alias: '',
    street: '',
    exterior_number: '',
    interior_number: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
    references: '',
    icon_name: 'Home',
    is_default: false
  });

  useEffect(() => {
    if (user && token) {
      fetchAddresses();
    }
  }, [user, token]);

  const fetchAddresses = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:8000/api/v1/addresses/user/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        // Ordenar: Primero la default, luego el resto
        data.sort((a: Address, b: Address) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));
        setAddresses(data);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAddress = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta dirección?')) return;
    try {
      const res = await fetch(`http://localhost:8000/api/v1/addresses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      });
      if (res.ok) {
        setAddresses(addresses.filter(a => a.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetDefault = async (address: Address) => {
    if (address.is_default) return;
    try {
      const res = await fetch(`http://localhost:8000/api/v1/addresses/${address.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ is_default: true })
      });
      if (res.ok) {
        // Refetch to get updated list and defaults
        fetchAddresses();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    try {
      const isEditing = !!editingAddress.id;
      const url = isEditing 
        ? `http://localhost:8000/api/v1/addresses/${editingAddress.id}`
        : `http://localhost:8000/api/v1/addresses/${user.id}`;
        
      const method = isEditing ? 'PUT' : 'POST';

      const payload = { ...editingAddress };
      // Limpiar id y user_id del payload
      delete payload.id;
      delete payload.user_id;

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        closeModal();
        fetchAddresses();
      } else {
        const errorData = await res.json();
        console.error("Error saving address", errorData);
        alert("Ocurrió un error al guardar la dirección");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const openModal = (address?: Address) => {
    if (address) {
      setEditingAddress({ ...address });
    } else {
      setEditingAddress({
        alias: '', street: '', exterior_number: '', interior_number: '',
        neighborhood: '', city: '', state: '', zip_code: '', references: '',
        icon_name: 'Home',
        is_default: addresses.length === 0 // If first address, default to true
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAddress({});
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <div className="spin" style={{ width: '40px', height: '40px', border: '3px solid var(--card-border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
        <style dangerouslySetInnerHTML={{__html: `.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}} />
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '60px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '12px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={32} color="var(--primary)" />
          </div>
          Mis Direcciones
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: 0 }}>
          Administra las direcciones donde recibirás tu Loot. Puedes establecer una dirección principal para un checkout más rápido.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        
        {/* Add New Address Card */}
        <button 
          onClick={() => openModal()}
          className="hover-card"
          style={{ 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px',
            padding: '32px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', 
            border: '2px dashed var(--card-border)', cursor: 'pointer', transition: 'all 0.3s ease', minHeight: '220px',
            color: 'var(--text-muted)'
          }}
        >
          <div style={{ background: 'rgba(139, 92, 246, 0.15)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', transition: 'all 0.3s' }}>
            <Plus size={28} color="var(--primary)" />
          </div>
          <span style={{ fontWeight: 600, color: 'var(--text-color)', fontSize: '1.05rem' }}>Agregar nueva dirección</span>
        </button>

        {/* Saved Addresses */}
        {addresses.map((address) => (
          <div key={address.id} className="glass-panel hover-card" style={{ 
            padding: '24px', borderRadius: '20px', background: 'var(--card-bg)', 
            border: address.is_default ? '1px solid var(--primary)' : '1px solid var(--card-border)',
            position: 'relative', display: 'flex', flexDirection: 'column',
            boxShadow: address.is_default ? '0 0 20px rgba(139, 92, 246, 0.15)' : 'none'
          }}>
            {/* Glow for default */}
            {address.is_default && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at top right, rgba(139, 92, 246, 0.1), transparent)', pointerEvents: 'none', borderRadius: '20px' }} />
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '12px', borderRadius: '14px', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DynamicIcon name={address.icon_name || 'Home'} size={24} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--foreground)' }}>
                    {address.alias || 'Dirección Guardada'}
                  </h3>
                  {address.is_default && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', background: 'rgba(139, 92, 246, 0.1)', padding: '2px 8px', borderRadius: '8px', display: 'inline-block' }}>Predeterminada</span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ flex: 1, zIndex: 1, marginBottom: '20px' }}>
              <p style={{ margin: '0 0 4px 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                {address.street} {address.exterior_number} {address.interior_number ? `Int. ${address.interior_number}` : ''}
              </p>
              <p style={{ margin: '0 0 4px 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                Col. {address.neighborhood}, C.P. {address.zip_code}
              </p>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                {address.city}, {address.state}
              </p>
              {address.references && (
                <p style={{ margin: '12px 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '8px' }}>
                  Ref: {address.references}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--card-border)', paddingTop: '16px', zIndex: 1 }}>
              {!address.is_default ? (
                <button onClick={() => handleSetDefault(address)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'color 0.2s' }} className="hover:text-primary">
                  Hacer Predeterminada
                </button>
              ) : (
                <span style={{ fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  <CheckCircle size={14} /> Seleccionada
                </span>
              )}
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => openModal(address)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer' }} title="Editar">
                  <Edit size={18} />
                </button>
                <button onClick={() => deleteAddress(address.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Eliminar">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Address Form Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', overflowY: 'auto', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '32px', borderRadius: '24px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', position: 'relative', overflow: 'hidden' }}>
            
            {/* Background Glow */}
            <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '120%', background: 'radial-gradient(circle at top left, rgba(139, 92, 246, 0.1), transparent 60%)', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ width: '4px', height: '100%', background: 'var(--primary)', position: 'absolute', left: 0, top: 0, zIndex: 1 }}></div>

            <div style={{ position: 'relative', zIndex: 2 }}>
              <h2 style={{ margin: '0 0 24px 0', fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '10px', borderRadius: '12px', display: 'flex' }}>
                  <MapPin size={24} color="var(--primary)" /> 
                </div>
                <span style={{ background: 'linear-gradient(135deg, var(--primary), #d8b4fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {editingAddress.id ? 'Editar Dirección' : 'Nueva Dirección'}
                </span>
              </h2>
              
              <form onSubmit={handleSaveAddress}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Alias (Ej: Casa, Oficina)</label>
                    <input type="text" value={editingAddress.alias || ''} onChange={e => setEditingAddress({...editingAddress, alias: e.target.value})} placeholder="Mi Casa" style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)', outline: 'none', transition: 'border-color 0.2s' }} onFocus={(e) => e.target.style.borderColor = 'var(--primary)'} onBlur={(e) => e.target.style.borderColor = 'var(--card-border)'} />
                  </div>

                  <div style={{ gridColumn: 'span 2', marginBottom: '8px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Ícono Visual</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', background: 'var(--input-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                      {[
                        'Home', 'Building', 'Building2', 'Church', 'Castle', 
                        'Factory', 'Hospital', 'Hotel', 'Landmark', 'School', 
                        'Store', 'Tent', 'Warehouse', 'Briefcase', 'MapPin'
                      ].map((iconName) => (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => setEditingAddress({...editingAddress, icon_name: iconName})}
                          style={{
                            background: editingAddress.icon_name === iconName ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${editingAddress.icon_name === iconName ? 'var(--primary)' : 'var(--card-border)'}`,
                            borderRadius: '8px',
                            padding: '8px',
                            color: editingAddress.icon_name === iconName ? '#fff' : 'var(--text-muted)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseOver={(e) => { if (editingAddress.icon_name !== iconName) e.currentTarget.style.color = 'var(--foreground)'; }}
                          onMouseOut={(e) => { if (editingAddress.icon_name !== iconName) e.currentTarget.style.color = 'var(--text-muted)'; }}
                          title={iconName}
                        >
                          <DynamicIcon name={iconName} size={20} />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Calle *</label>
                    <input type="text" value={editingAddress.street || ''} onChange={e => setEditingAddress({...editingAddress, street: e.target.value})} required style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)', outline: 'none', transition: 'border-color 0.2s' }} onFocus={(e) => e.target.style.borderColor = 'var(--primary)'} onBlur={(e) => e.target.style.borderColor = 'var(--card-border)'} />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Núm. Exterior *</label>
                    <input type="text" value={editingAddress.exterior_number || ''} onChange={e => setEditingAddress({...editingAddress, exterior_number: e.target.value})} required style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)', outline: 'none', transition: 'border-color 0.2s' }} onFocus={(e) => e.target.style.borderColor = 'var(--primary)'} onBlur={(e) => e.target.style.borderColor = 'var(--card-border)'} />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Núm. Interior</label>
                    <input type="text" value={editingAddress.interior_number || ''} onChange={e => setEditingAddress({...editingAddress, interior_number: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)', outline: 'none', transition: 'border-color 0.2s' }} onFocus={(e) => e.target.style.borderColor = 'var(--primary)'} onBlur={(e) => e.target.style.borderColor = 'var(--card-border)'} />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Colonia / Fraccionamiento *</label>
                    <input type="text" value={editingAddress.neighborhood || ''} onChange={e => setEditingAddress({...editingAddress, neighborhood: e.target.value})} required style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)', outline: 'none', transition: 'border-color 0.2s' }} onFocus={(e) => e.target.style.borderColor = 'var(--primary)'} onBlur={(e) => e.target.style.borderColor = 'var(--card-border)'} />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Código Postal *</label>
                    <input type="text" value={editingAddress.zip_code || ''} onChange={e => setEditingAddress({...editingAddress, zip_code: e.target.value})} required style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)', outline: 'none', transition: 'border-color 0.2s' }} onFocus={(e) => e.target.style.borderColor = 'var(--primary)'} onBlur={(e) => e.target.style.borderColor = 'var(--card-border)'} />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Ciudad *</label>
                    <input type="text" value={editingAddress.city || ''} onChange={e => setEditingAddress({...editingAddress, city: e.target.value})} required style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)', outline: 'none', transition: 'border-color 0.2s' }} onFocus={(e) => e.target.style.borderColor = 'var(--primary)'} onBlur={(e) => e.target.style.borderColor = 'var(--card-border)'} />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Estado *</label>
                    <input type="text" value={editingAddress.state || ''} onChange={e => setEditingAddress({...editingAddress, state: e.target.value})} required style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)', outline: 'none', transition: 'border-color 0.2s' }} onFocus={(e) => e.target.style.borderColor = 'var(--primary)'} onBlur={(e) => e.target.style.borderColor = 'var(--card-border)'} />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Referencias Adicionales (Entre calles, color de fachada, etc.)</label>
                    <textarea value={editingAddress.references || ''} onChange={e => setEditingAddress({...editingAddress, references: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)', minHeight: '80px', resize: 'vertical', outline: 'none', transition: 'border-color 0.2s' }} onFocus={(e) => e.target.style.borderColor = 'var(--primary)'} onBlur={(e) => e.target.style.borderColor = 'var(--card-border)'} />
                  </div>
                </div>

                {/* Default Address Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: '16px', background: 'var(--input-bg)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                  <input 
                    type="checkbox" 
                    id="is_default"
                    checked={editingAddress.is_default || false}
                    onChange={e => setEditingAddress({...editingAddress, is_default: e.target.checked})}
                    style={{ width: '20px', height: '20px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />
                  <label htmlFor="is_default" style={{ fontSize: '0.95rem', color: 'var(--foreground)', cursor: 'pointer', fontWeight: 600 }}>
                    Establecer como dirección predeterminada
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--card-border)', paddingTop: '20px' }}>
                  <button type="button" onClick={closeModal} className="hover-card" style={{ padding: '12px 24px', borderRadius: '12px', background: 'var(--input-bg)', color: 'var(--foreground)', border: '1px solid var(--card-border)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s ease' }}>Cancelar</button>
                  <button type="submit" disabled={isSaving} className="btn-primary hover-card" style={{ padding: '12px 24px', opacity: isSaving ? 0.7 : 1, transition: 'all 0.3s ease' }}>{isSaving ? 'Guardando...' : 'Guardar Dirección'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
