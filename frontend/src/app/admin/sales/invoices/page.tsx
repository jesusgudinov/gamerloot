'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, FileText, Upload, CheckCircle, Clock, X, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function InvoicesPage() {
  const { token } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Upload Modal State
  const [uploadingInvoice, setUploadingInvoice] = useState<any>(null);
  const [xmlFile, setXmlFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRefXML = useRef<HTMLInputElement>(null);
  const fileInputRefPDF = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchInvoices();
  }, [search]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      // In a real scenario we could add ?q=search but for now let's just fetch all
      const res = await fetch('http://localhost:8000/api/v1/invoices/admin/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        let data = await res.json();
        if (search) {
          data = data.filter((inv: any) => 
            inv.order_folio.toLowerCase().includes(search.toLowerCase()) || 
            inv.rfc.toLowerCase().includes(search.toLowerCase()) || 
            inv.business_name.toLowerCase().includes(search.toLowerCase())
          );
        }
        setInvoices(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadingInvoice || !xmlFile || !pdfFile) {
      setUploadError('Debes seleccionar ambos archivos (XML y PDF)');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('xml_file', xmlFile);
    formData.append('pdf_file', pdfFile);

    try {
      const res = await fetch(`http://localhost:8000/api/v1/invoices/admin/upload/${uploadingInvoice.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        setUploadingInvoice(null);
        setXmlFile(null);
        setPdfFile(null);
        fetchInvoices();
      } else {
        const err = await res.json();
        setUploadError(err.detail || 'Error al subir los archivos');
      }
    } catch (e) {
      setUploadError('Error de red');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '8px' }}>Solicitudes de Facturación</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestiona las facturas solicitadas por los clientes y sube los comprobantes fiscales.</p>
        </div>
      </header>

      {/* Toolbar */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--input-bg)', borderRadius: '12px', padding: '0 16px', border: '1px solid var(--card-border)', flex: 1, minWidth: '300px' }}>
          <Search size={20} color="var(--text-muted)" />
          <input 
            type="text"
            placeholder="Buscar por Folio, RFC o Razón Social..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', padding: '12px', color: 'var(--foreground)', width: '100%', outline: 'none' }}
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--card-border)' }}>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>ID Pedido</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>RFC</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>Razón Social</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>Uso CFDI</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>Monto</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>Estado</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando solicitudes...</td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron solicitudes.</td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid var(--card-border)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px', fontWeight: 600 }}>#{inv.order_folio}</td>
                    <td style={{ padding: '16px' }}>{inv.rfc}</td>
                    <td style={{ padding: '16px' }}>{inv.business_name}</td>
                    <td style={{ padding: '16px' }}>{inv.cfdi_use}</td>
                    <td style={{ padding: '16px', fontWeight: 700, color: 'var(--primary)' }}>${inv.order_total?.toLocaleString('es-MX')}</td>
                    <td style={{ padding: '16px' }}>
                      {inv.status === 'Pendiente' ? (
                        <span style={{ padding: '4px 8px', borderRadius: '20px', fontSize: '0.8rem', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> Pendiente</span>
                      ) : (
                        <span style={{ padding: '4px 8px', borderRadius: '20px', fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} /> Facturado</span>
                      )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      {inv.status === 'Pendiente' ? (
                        <button 
                          onClick={() => setUploadingInvoice(inv)}
                          className="hover-card"
                          style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600 }}
                        >
                          <Upload size={16} /> Subir Archivos
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Completado</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {uploadingInvoice && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', background: 'var(--bg)', borderRadius: '24px', padding: '32px', position: 'relative' }}>
            <button 
              onClick={() => {
                setUploadingInvoice(null);
                setXmlFile(null);
                setPdfFile(null);
                setUploadError('');
              }}
              style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            
            <h2 style={{ margin: '0 0 24px 0', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileText color="var(--primary)" /> Subir Factura
            </h2>

            <div style={{ marginBottom: '24px', background: 'var(--input-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Pedido</p>
              <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>#{uploadingInvoice.order_folio}</p>
            </div>

            {uploadError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.9rem' }}>
                {uploadError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 600 }}>Archivo XML</label>
                <input 
                  type="file" 
                  accept=".xml" 
                  ref={fileInputRefXML}
                  onChange={(e) => setXmlFile(e.target.files?.[0] || null)}
                  style={{ display: 'none' }}
                />
                <button 
                  onClick={() => fileInputRefXML.current?.click()}
                  style={{ width: '100%', padding: '16px', background: 'var(--input-bg)', border: '1px dashed var(--card-border)', borderRadius: '12px', color: xmlFile ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <FileText size={20} /> {xmlFile ? xmlFile.name : 'Seleccionar archivo .xml'}
                </button>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 600 }}>Archivo PDF</label>
                <input 
                  type="file" 
                  accept=".pdf" 
                  ref={fileInputRefPDF}
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  style={{ display: 'none' }}
                />
                <button 
                  onClick={() => fileInputRefPDF.current?.click()}
                  style={{ width: '100%', padding: '16px', background: 'var(--input-bg)', border: '1px dashed var(--card-border)', borderRadius: '12px', color: pdfFile ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <FileText size={20} /> {pdfFile ? pdfFile.name : 'Seleccionar archivo .pdf'}
                </button>
              </div>
            </div>

            <button 
              onClick={handleUploadSubmit}
              disabled={isUploading}
              className="btn-primary"
              style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px' }}
            >
              {isUploading ? 'Subiendo...' : <><Save size={20} /> Guardar Factura</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
