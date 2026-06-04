"use client";
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ProductAccordionProps {
  description: string;
  technicalSpecs?: Record<string, string>;
}

export default function ProductAccordion({ description, technicalSpecs }: ProductAccordionProps) {
  const [openPanel, setOpenPanel] = useState<string | null>(null);

  const togglePanel = (panel: string) => {
    setOpenPanel(openPanel === panel ? null : panel);
  };

  const AccordionItem = ({ id, title, children }: { id: string, title: string, children: React.ReactNode }) => {
    const isOpen = openPanel === id;
    return (
      <div 
        style={{ 
          marginBottom: '15px', 
          borderRadius: '12px', 
          background: 'var(--card-bg)',
          border: isOpen ? '1px solid var(--primary)' : '1px solid var(--card-border)',
          boxShadow: isOpen ? '0 0 15px rgba(139, 92, 246, 0.15)' : 'none',
          transition: 'all 0.3s ease',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = 'var(--primary)';
            e.currentTarget.style.boxShadow = '0 0 10px rgba(139, 92, 246, 0.1)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = 'var(--card-border)';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      >
        <button 
          onClick={() => togglePanel(id)}
          style={{ 
            width: '100%', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'none', border: 'none', color: isOpen ? 'var(--primary)' : 'var(--foreground)',
            fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer', transition: 'color 0.3s ease'
          }}
        >
          {title}
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
        
        <div style={{ 
          maxHeight: isOpen ? '2000px' : '0', 
          opacity: isOpen ? 1 : 0, 
          transition: 'all 0.4s ease-in-out',
          padding: isOpen ? '0 20px 20px 20px' : '0 20px'
        }}>
          {children}
        </div>
      </div>
    );
  };

  return (
    <div style={{ marginTop: '40px' }}>
      <h3 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Información del Producto</h3>
      
      <AccordionItem id="desc" title="Características y especificaciones">
        <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: description }} />
      </AccordionItem>
      
      <AccordionItem id="specs" title="Detalles del producto">
        {technicalSpecs && Object.keys(technicalSpecs).length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {Object.entries(technicalSpecs).map(([key, value], index) => (
                <tr key={index} style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <td style={{ padding: '15px 10px', fontWeight: 600, width: '40%', color: 'var(--text-muted)' }}>{key}</td>
                  <td style={{ padding: '15px 10px' }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No hay especificaciones técnicas detalladas para este producto.</p>
        )}
      </AccordionItem>
    </div>
  );
}
