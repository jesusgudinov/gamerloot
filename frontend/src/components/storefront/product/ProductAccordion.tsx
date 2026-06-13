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
        className={isOpen ? "glass-panel" : "hover-card"}
        style={{ 
          marginBottom: '20px', 
          borderRadius: '16px', 
          position: 'relative',
          background: isOpen ? 'var(--card-bg)' : 'rgba(0,0,0,0.1)',
          border: isOpen ? '1px solid var(--card-border)' : '1px solid transparent',
          boxShadow: isOpen ? '0 10px 30px rgba(0,0,0,0.2)' : 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'var(--card-bg)';
            e.currentTarget.style.border = '1px solid var(--card-border)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'rgba(0,0,0,0.1)';
            e.currentTarget.style.border = '1px solid transparent';
          }
        }}
      >
        {/* Línea lateral de acentuación Premium (solo visible si está abierto) */}
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: 'var(--primary)', opacity: isOpen ? 1 : 0, transition: 'opacity 0.3s ease' }}></div>
        <button 
          onClick={() => togglePanel(id)}
          style={{ 
            width: '100%', padding: '24px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'none', border: 'none', color: isOpen ? 'var(--primary)' : 'var(--foreground)',
            fontSize: '1.2rem', fontWeight: 700, cursor: 'pointer', transition: 'color 0.3s ease', outline: 'none'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {title}
          </span>
          <div style={{ 
            width: '36px', height: '36px', borderRadius: '10px', 
            background: isOpen ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.05)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }}>
            <ChevronDown size={20} color={isOpen ? 'var(--primary)' : 'var(--text-muted)'} />
          </div>
        </button>
        
        <div style={{ 
          maxHeight: isOpen ? '2000px' : '0', 
          opacity: isOpen ? 1 : 0, 
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          padding: isOpen ? '0 30px 30px 30px' : '0 30px'
        }}>
          {children}
        </div>
      </div>
    );
  };

  return (
    <div style={{ marginTop: '60px', paddingTop: '40px', borderTop: '1px solid var(--card-border)' }}>
      
      <AccordionItem id="desc" title="Características y especificaciones">
        <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: description }} />
      </AccordionItem>
      
      <AccordionItem id="specs" title="Detalles Técnicos">
        {technicalSpecs && Object.keys(technicalSpecs).length > 0 ? (
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'rgba(0,0,0,0.2)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <tbody>
                {Object.entries(technicalSpecs).map(([key, value], index) => (
                  <tr key={index} style={{ borderBottom: index === Object.entries(technicalSpecs).length - 1 ? 'none' : '1px solid var(--card-border)' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 600, width: '40%', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRight: '1px solid var(--card-border)' }}>{key}</td>
                    <td style={{ padding: '16px 20px', color: 'var(--foreground)' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No hay especificaciones técnicas detalladas para este producto.</p>
        )}
      </AccordionItem>
    </div>
  );
}
