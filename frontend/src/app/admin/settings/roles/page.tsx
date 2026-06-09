"use client";

import { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function RolesPage() {
  const { token } = useAuth();
  const [roles, setRoles] = useState<any[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', description: '', permissions: [] as number[] });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Roles
      const resRoles = await fetch('http://localhost:8000/api/v1/roles/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resRoles.ok) setRoles(await resRoles.json());

      // Fetch Permissions
      const resPerms = await fetch('http://localhost:8000/api/v1/roles/permissions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resPerms.ok) setAvailablePermissions(await resPerms.json());
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const openNewModal = () => {
    setEditingRole(null);
    setFormData({ name: '', description: '', permissions: [] });
    setIsModalOpen(true);
  };

  const openEditModal = (role: any) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions.map((p: any) => p.id)
    });
    setIsModalOpen(true);
  };

  const handleTogglePermission = (permId: number) => {
    setFormData(prev => {
      if (prev.permissions.includes(permId)) {
        return { ...prev, permissions: prev.permissions.filter(id => id !== permId) };
      } else {
        return { ...prev, permissions: [...prev.permissions, permId] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const url = editingRole 
      ? `http://localhost:8000/api/v1/roles/${editingRole.id}`
      : `http://localhost:8000/api/v1/roles/`;
      
    const method = editingRole ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const error = await res.json();
        alert(error.detail || "Error al guardar el rol");
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
    if (confirm(`¿Estás seguro de eliminar el rol ${name}?`)) {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/roles/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          const error = await res.json();
          alert(error.detail || "Error al eliminar el rol");
        } else {
          fetchData();
        }
      } catch (e) {
        alert("Error de conexión");
      }
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Cargando roles...</div>;

  return (
    <div style={{ width: '100%' }}>
      <header className="admin-header">
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldAlert size={32} style={{ color: 'var(--primary)' }} />
            Control de Accesos (RBAC)
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Gestiona los roles y permisos de tu equipo de colaboradores.
          </p>
        </div>
        
        <button onClick={openNewModal} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none', borderRadius: '8px', fontWeight: 600, color: 'white', boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)' }}>
          <Plus size={18} /> Nuevo Rol
        </button>
      </header>

      <div className="glass-panel" style={{ padding: '24px', animation: 'fadeIn 0.3s ease-out', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-150px', right: '-150px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }}></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
        {roles.map(role => (
          <div key={role.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--foreground)' }}>{role.name}</h3>
              </div>
              {role.name !== 'Dueño' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => openEditModal(role)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-color)', padding: '6px', borderRadius: '6px', cursor: 'pointer' }} title="Editar Rol"><Edit2 size={16}/></button>
                  <button onClick={() => handleDelete(role.id, role.name)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '6px', borderRadius: '6px', cursor: 'pointer' }} title="Eliminar Rol"><Trash2 size={16}/></button>
                </div>
              )}
            </div>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', flexGrow: 1 }}>
              {role.description}
            </p>
            
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--foreground)' }}>Permisos principales:</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {role.name === 'Dueño' ? (
                  <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                    All Access (SuperAdmin)
                  </span>
                ) : (
                  role.permissions.map((p: any) => (
                    <span key={p.id} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                      {p.name}
                    </span>
                  ))
                )}
                {role.name !== 'Dueño' && role.permissions.length === 0 && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sin permisos asignados</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Crear/Editar Rol */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '500px', maxWidth: '90%', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15, 23, 42, 0.8)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none' }}></div>
            <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-color)' }}>{editingRole ? 'Editar Rol' : 'Nuevo Rol'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-color)', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-color)' }}>Nombre del Rol</label>
                <input 
                  required 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--input-text)' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-color)' }}>Descripción</label>
                <input 
                  required 
                  type="text" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--input-text)' }}
                />
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-color)' }}>Permisos del Sistema</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {availablePermissions.map(p => (
                    <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={formData.permissions.includes(p.id)}
                          onChange={() => handleTogglePermission(p.id)}
                        />
                        <span className="toggle-slider"></span>
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: 'var(--text-color)' }}>{p.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '10px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none', borderRadius: '8px', fontWeight: 600, color: 'white', boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)' }}>
                {isSubmitting ? 'Guardando...' : <><Save size={20} /> Guardar Rol</>}
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
