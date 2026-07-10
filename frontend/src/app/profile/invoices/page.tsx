"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Receipt, FileText, Download, Building, FileSignature, Landmark, Search } from 'lucide-react';

interface BillingProfile {
  rfc: string;
  business_name: string;
  tax_regime: string;
  cfdi_use: string;
  zip_code: string;
  constancia_pdf_url: string | null;
}

interface Invoice {
  id: number;
  order_id: number;
  rfc: string;
  business_name: string;
  tax_regime: string;
  cfdi_use: string;
  zip_code: string;
  status: string;
  xml_url: string | null;
  pdf_url: string | null;
  created_at: string;
}

const CFDI_USES = [
  { value: 'G01', label: 'G01 - Adquisición de mercancías' },
  { value: 'G02', label: 'G02 - Devoluciones, descuentos o bonificaciones' },
  { value: 'G03', label: 'G03 - Gastos en general' },
  { value: 'I04', label: 'I04 - Equipo de computo y accesorios' },
  { value: 'I08', label: 'I08 - Otra maquinaria y equipo' },
  { value: 'S01', label: 'S01 - Sin efectos fiscales' },
];

const TAX_REGIMES = [
  { value: '601', label: '601 - General de Ley Personas Morales' },
  { value: '605', label: '605 - Sueldos y Salarios e Ingresos Asimilados a Salarios' },
  { value: '606', label: '606 - Arrendamiento' },
  { value: '612', label: '612 - Personas Físicas con Actividades Empresariales y Profesionales' },
  { value: '616', label: '616 - Sin obligaciones fiscales' },
  { value: '626', label: '626 - Régimen Simplificado de Confianza (RESICO)' },
];

export default function InvoicesPage() {
  const { user, token } = useAuth();
  
  const [profile, setProfile] = useState<BillingProfile | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<BillingProfile>({
    rfc: '',
    business_name: '',
    tax_regime: '612',
    cfdi_use: 'G03',
    zip_code: '',
    constancia_pdf_url: null
  });
  const [uploadingPdf, setUploadingPdf] = useState(false);

  useEffect(() => {
    if (user && token) {
      fetchData();
    }
  }, [user, token]);

  const fetchData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      
      // Fetch Billing Profile
      const profileRes = await fetch(`http://localhost:8000/api/v1/invoices/billing-profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
        setFormData(profileData);
      }

      // Fetch Invoices
      const invoicesRes = await fetch(`http://localhost:8000/api/v1/invoices/my-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        setInvoices(invoicesData);
      }

    } catch (error) {
      console.error('Error fetching invoices data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setIsSaving(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/invoices/billing-profile`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const savedProfile = await res.json();
        setProfile(savedProfile);
        setIsModalOpen(false);
      } else {
        const errorData = await res.json();
        alert(errorData.detail || "Error al guardar los datos de facturación.");
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión al guardar los datos.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadConstancia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    if (file.type !== 'application/pdf') {
      alert("Solo se permiten archivos PDF.");
      return;
    }

    setUploadingPdf(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`http://localhost:8000/api/v1/invoices/billing-profile/constancia`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        const updatedProfile = await res.json();
        setProfile(updatedProfile);
        alert("Constancia subida exitosamente.");
      } else {
        const errorData = await res.json();
        alert(errorData.detail || "Error al subir la constancia.");
      }
    } catch (error) {
      console.error(error);
      alert("Error de red al subir la constancia.");
    } finally {
      setUploadingPdf(false);
      // Limpiar input file
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--card-border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px', letterSpacing: '-0.5px' }}>
        Facturación
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '1.1rem' }}>
        Administra tus datos fiscales y descarga tus comprobantes (CFDI).
      </p>

      {/* Datos Fiscales Panel */}
      <div className="glass-panel hover-card" style={{ padding: '32px', borderRadius: '24px', marginBottom: '40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--primary)' }}></div>
        <div style={{ position: 'absolute', right: '-50px', top: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(20px)', pointerEvents: 'none' }}></div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: profile ? '24px' : '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 1 }}>
            <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building size={32} color="var(--primary)" />
            </div>
            <div>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground)' }}>Perfil de Facturación</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>{profile ? 'Tus datos fiscales están guardados.' : 'No has configurado tus datos fiscales.'}</p>
            </div>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary"
            style={{ zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', fontWeight: 700, border: 'none', background: 'linear-gradient(135deg, var(--primary), #6366f1)', color: '#fff', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)' }}
          >
            <FileSignature size={18} /> {profile ? 'Editar Datos' : 'Configurar Datos'}
          </button>
        </div>

        {profile && (
          <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', background: 'var(--input-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
            <div>
              <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Razón Social</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--foreground)' }}>{profile.business_name}</strong>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>RFC</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--foreground)', letterSpacing: '1px' }}>{profile.rfc}</strong>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Código Postal</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--foreground)' }}>{profile.zip_code}</strong>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Uso CFDI</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--foreground)' }}>{profile.cfdi_use}</strong>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Régimen Fiscal</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--foreground)' }}>{profile.tax_regime}</strong>
            </div>
            
            {/* Sección Constancia */}
            <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed var(--card-border)', paddingTop: '20px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Constancia de Situación Fiscal (PDF)</span>
                {profile.constancia_pdf_url ? (
                  <a href={`http://localhost:8000${profile.constancia_pdf_url}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 600, textDecoration: 'none' }}>
                    <FileText size={18} /> Ver Documento Subido
                  </a>
                ) : (
                  <span style={{ color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileSignature size={18} /> Documento Faltante
                  </span>
                )}
              </div>
              
              <div>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', cursor: uploadingPdf ? 'not-allowed' : 'pointer', fontWeight: 600, transition: 'all 0.2s' }}>
                  {uploadingPdf ? 'Subiendo...' : 'Cargar PDF'}
                  <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handleUploadConstancia} disabled={uploadingPdf} />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Historial de Facturas */}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Receipt size={24} color="var(--primary)" /> Mis Comprobantes
      </h2>
      
      {invoices.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '24px' }}>
          <div style={{ background: 'var(--input-bg)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Search size={40} color="var(--text-muted)" />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--foreground)' }}>No hay facturas aún</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0, maxWidth: '400px', marginInline: 'auto' }}>Cuando realices un pedido y solicites factura, aparecerán aquí para que puedas descargar el PDF y XML.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {invoices.map((inv) => (
            <div key={inv.id} className="glass-panel hover-card" style={{ padding: '24px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--card-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ background: 'var(--input-bg)', padding: '16px', borderRadius: '16px' }}>
                  <FileText size={28} color="var(--text-muted)" />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 700, color: 'var(--foreground)' }}>Pedido #{inv.order_id}</h4>
                  <p style={{ margin: '0 0 8px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Fecha: {new Date(inv.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <span style={{ 
                    display: 'inline-flex', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700,
                    background: inv.status === 'Completada' ? 'rgba(16, 185, 129, 0.1)' : (inv.status === 'Pendiente' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)'),
                    color: inv.status === 'Completada' ? '#10b981' : (inv.status === 'Pendiente' ? '#f59e0b' : '#ef4444'),
                    border: inv.status === 'Completada' ? '1px solid rgba(16, 185, 129, 0.3)' : (inv.status === 'Pendiente' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)')
                  }}>
                    {inv.status}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                {inv.pdf_url ? (
                  <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, border: '1px solid rgba(239, 68, 68, 0.2)', transition: 'all 0.2s' }}>
                    <Download size={18} /> PDF
                  </a>
                ) : null}
                {inv.xml_url ? (
                  <a href={inv.xml_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, border: '1px solid rgba(59, 130, 246, 0.2)', transition: 'all 0.2s' }}>
                    <Download size={18} /> XML
                  </a>
                ) : null}
                {!inv.pdf_url && !inv.xml_url && (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', display: 'flex', alignItems: 'center' }}>
                    Procesando en ERP...
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Datos Fiscales */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', background: 'var(--card-bg)', borderRadius: '24px', position: 'relative', overflow: 'hidden', border: '1px solid var(--card-border)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--primary)', zIndex: 1 }}></div>
            <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '120%', background: 'radial-gradient(circle at top left, rgba(139, 92, 246, 0.15), transparent 50%)', pointerEvents: 'none', zIndex: 0 }}></div>
            
            <div style={{ padding: '32px', position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '10px', borderRadius: '12px', display: 'flex' }}>
                    <Landmark size={24} color="var(--primary)" />
                  </div>
                  <span style={{ background: 'linear-gradient(135deg, var(--primary), #d8b4fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Datos Fiscales
                  </span>
                </h2>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem', padding: '0 8px' }}>&times;</button>
              </div>

              <form onSubmit={handleSaveProfile}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>RFC *</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.rfc} 
                      onChange={e => setFormData({...formData, rfc: e.target.value.toUpperCase()})} 
                      placeholder="XAXX010101000" 
                      style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)', outline: 'none', textTransform: 'uppercase', letterSpacing: '1px' }} 
                      onFocus={e => e.target.style.borderColor = 'var(--primary)'} 
                      onBlur={e => e.target.style.borderColor = 'var(--card-border)'} 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Nombre o Razón Social *</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.business_name} 
                      onChange={e => setFormData({...formData, business_name: e.target.value.toUpperCase()})} 
                      placeholder="GAMER LOOT SA DE CV" 
                      style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)', outline: 'none', textTransform: 'uppercase' }} 
                      onFocus={e => e.target.style.borderColor = 'var(--primary)'} 
                      onBlur={e => e.target.style.borderColor = 'var(--card-border)'} 
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Código Postal *</label>
                      <input 
                        type="text" 
                        required 
                        maxLength={5}
                        value={formData.zip_code} 
                        onChange={e => setFormData({...formData, zip_code: e.target.value.replace(/[^0-9]/g, '')})} 
                        placeholder="00000" 
                        style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)', outline: 'none' }} 
                        onFocus={e => e.target.style.borderColor = 'var(--primary)'} 
                        onBlur={e => e.target.style.borderColor = 'var(--card-border)'} 
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Régimen Fiscal *</label>
                    <select 
                      required 
                      value={formData.tax_regime} 
                      onChange={e => setFormData({...formData, tax_regime: e.target.value})}
                      style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                    >
                      {TAX_REGIMES.map(r => (
                        <option key={r.value} value={r.value} style={{ background: '#0f172a' }}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Uso de CFDI *</label>
                    <select 
                      required 
                      value={formData.cfdi_use} 
                      onChange={e => setFormData({...formData, cfdi_use: e.target.value})}
                      style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                    >
                      {CFDI_USES.map(u => (
                        <option key={u.value} value={u.value} style={{ background: '#0f172a' }}>{u.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '12px 24px', borderRadius: '12px', background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s' }} className="hover:bg-white/5">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSaving} style={{ padding: '12px 24px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary), #6366f1)', border: 'none', color: '#fff', fontWeight: 700, cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1, boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)', transition: 'all 0.3s' }}>
                    {isSaving ? 'Guardando...' : 'Guardar Datos'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
