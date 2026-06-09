"use client";

import { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Edit2, Trash2, X, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function TeamPage() {
  const { token } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '', role_id: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Team
      const resTeam = await fetch('http://localhost:8000/api/v1/users/team', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resTeam.ok) setMembers(await resTeam.json());

      // Fetch Roles para el dropdown
      const resRoles = await fetch('http://localhost:8000/api/v1/roles/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resRoles.ok) {
        const rolesData = await resRoles.json();
        setRoles(rolesData);
        if (rolesData.length > 0) {
          setFormData(prev => ({ ...prev, role_id: rolesData[0].id }));
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const openNewModal = () => {
    setFormData({ full_name: '', email: '', password: '', role_id: roles.length > 0 ? roles[0].id : 0 });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:8000/api/v1/users/team', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const error = await res.json();
        alert(error.detail || "Error al invitar colaborador");
      } else {
        setIsModalOpen(false);
        fetchData();
      }
    } catch (e) {
      alert("Error de conexión");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`¿Estás seguro de desactivar a ${name}? Ya no podrá iniciar sesión.`)) {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/users/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          const error = await res.json();
          alert(error.detail || "Error al desactivar");
        } else {
          fetchData();
        }
      } catch (e) {
        alert("Error de conexión");
      }
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <header className="admin-header">
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users size={32} style={{ color: 'var(--primary)' }} />
            Miembros del Equipo
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Agrega colaboradores y asígnales roles para delegar tareas.
          </p>
        </div>
        
        <button onClick={openNewModal} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '8px', fontWeight: 600, color: 'white', boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)' }}>
          <UserPlus size={18} /> Agregar Colaborador
        </button>
      </header>

      <div className="glass-panel" style={{ padding: '24px', animation: 'fadeIn 0.3s ease-out', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-150px', right: '-150px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }}></div>
      <div className="table-responsive-wrapper" style={{ position: 'relative', zIndex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Usuario</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Rol Asignado</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Estado</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Fecha de Registro</th>
              <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>Cargando equipo...</td></tr>
            ) : members.map(member => (
              <tr key={member.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s', opacity: member.is_active ? 1 : 0.5 }}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent-cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
                      {member.full_name ? member.full_name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{member.full_name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{member.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Shield size={16} color={member.role === 'Dueño' || member.role === 'SuperAdmin' ? '#ef4444' : 'var(--primary)'} />
                    <span style={{ fontWeight: 500, color: member.role === 'Dueño' || member.role === 'SuperAdmin' ? '#ef4444' : 'var(--foreground)' }}>
                      {member.role}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '20px', 
                    fontSize: '0.8rem', 
                    fontWeight: 600,
                    background: member.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: member.is_active ? '#10b981' : '#ef4444'
                  }}>
                    {member.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                  {new Date(member.created_at).toLocaleDateString()}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    {member.role !== 'Dueño' && member.role !== 'SuperAdmin' && member.is_active ? (
                      <>
                        <button onClick={() => handleDelete(member.id, member.full_name)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Trash2 size={16} />
                        </button>
                      </>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Protegido / Inactivo</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {members.length === 0 && !loading && (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No hay colaboradores registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '400px', maxWidth: '90%', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15, 23, 42, 0.8)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none' }}></div>
            <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-color)' }}>Agregar Colaborador</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-color)', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-color)' }}>Nombre Completo</label>
                <input 
                  required 
                  type="text" 
                  value={formData.full_name} 
                  onChange={e => setFormData({...formData, full_name: e.target.value})} 
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--input-text)' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-color)' }}>Correo Electrónico (Login)</label>
                <input 
                  required 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--input-text)' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-color)' }}>Contraseña Temporal</label>
                <input 
                  required 
                  type="text" 
                  placeholder="Ej: gamerloot2026"
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--input-text)' }}
                />
                <small style={{ color: 'var(--text-secondary)' }}>Dale esta contraseña al colaborador para que inicie sesión.</small>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-color)' }}>Asignar Rol</label>
                <select 
                  value={formData.role_id} 
                  onChange={e => setFormData({...formData, role_id: Number(e.target.value)})}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--input-text)', appearance: 'none', cursor: 'pointer' }}
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name} - {r.description}</option>
                  ))}
                </select>
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '8px', fontWeight: 600, color: 'white', boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)' }}>
                {isSubmitting ? 'Guardando...' : <><Save size={20} /> Guardar Colaborador</>}
              </button>
            </form>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
