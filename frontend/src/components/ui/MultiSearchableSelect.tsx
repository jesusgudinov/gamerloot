'use client';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Plus, X } from 'lucide-react';

interface Option {
  id: string | number;
  label: string;
}

interface MultiSearchableSelectProps {
  options: Option[];
  values: (string | number)[];
  onChange: (values: (string | number)[]) => void;
  placeholder?: string;
  disabled?: boolean;
  allowCreate?: boolean;
  onCreate?: (value: string) => void;
}

export default function MultiSearchableSelect({ options, values, onChange, placeholder = 'Seleccionar...', disabled = false, allowCreate = false, onCreate }: MultiSearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOptions = options.filter(o => values.some(v => v.toString() === o.id.toString()));

  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggle = (id: string | number) => {
    const isSelected = values.some(v => v.toString() === id.toString());
    if (isSelected) {
      onChange(values.filter(v => v.toString() !== id.toString()));
    } else {
      onChange([...values, id]);
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{ 
          width: '100%', 
          minHeight: '44px',
          padding: '4px 12px', 
          borderRadius: '8px', 
          border: '1px solid var(--card-border)', 
          background: disabled ? 'var(--card-border)' : 'var(--input-bg)', 
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          opacity: disabled ? 0.6 : 1,
          flexWrap: 'wrap',
          gap: '6px'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flex: 1, padding: '4px 0' }}>
          {selectedOptions.length > 0 ? (
            selectedOptions.map(opt => (
              <span 
                key={opt.id} 
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle(opt.id);
                }}
                style={{ 
                  background: 'var(--primary)', 
                  color: '#fff', 
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  fontSize: '0.8rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px' 
                }}
              >
                {opt.label}
                <X size={12} style={{ cursor: 'pointer' }} />
              </span>
            ))
          ) : (
            <span style={{ color: 'var(--text-muted)', paddingTop: '4px', paddingBottom: '4px' }}>{placeholder}</span>
          )}
        </div>
        <ChevronDown size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      </div>

      {isOpen && (
        <div style={{ 
          position: 'absolute', 
          top: '100%', 
          left: 0, 
          right: 0, 
          marginTop: '8px',
          background: 'var(--background)',
          border: '1px solid var(--card-border)',
          borderRadius: '8px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          zIndex: 1000,
          maxHeight: '250px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '8px', borderBottom: '1px solid var(--card-border)', position: 'relative' }}>
            <Search size={14} style={{ color: 'var(--text-muted)', position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input 
              type="text" 
              autoFocus
              placeholder="Buscar..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ 
                width: '100%', 
                background: 'var(--input-bg)', 
                border: '1px solid transparent', 
                color: 'var(--text-color)', 
                fontSize: '0.95rem',
                padding: '8px 8px 8px 30px',
                borderRadius: '6px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.border = '1px solid var(--primary)'}
              onBlur={e => e.target.style.border = '1px solid transparent'}
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1, padding: '4px' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>No se encontraron resultados</div>
            ) : (
              filteredOptions.map(option => {
                const isSelected = values.some(v => v.toString() === option.id.toString());
                return (
                  <div 
                    key={option.id}
                    onClick={() => handleToggle(option.id)}
                    style={{ 
                      padding: '10px 12px', 
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      color: isSelected ? '#ffffff' : 'var(--text-color)',
                      background: isSelected ? 'var(--primary)' : 'transparent',
                      fontWeight: isSelected ? 600 : 400,
                      marginBottom: '2px',
                      transition: 'background 0.2s, color 0.2s'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'var(--card-border)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {option.label}
                    {isSelected && <span style={{ fontSize: '0.8rem', color: '#ffffff' }}>✓</span>}
                  </div>
                );
              })
            )}
            
            {allowCreate && searchTerm && !options.some(o => o.label.toLowerCase() === searchTerm.toLowerCase()) && (
              <div 
                onClick={() => {
                  onCreate?.(searchTerm);
                  setSearchTerm('');
                }}
                style={{ 
                  padding: '10px 12px', 
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  color: 'var(--primary)',
                  background: 'transparent',
                  borderLeft: '2px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderTop: filteredOptions.length > 0 ? '1px dashed var(--card-border)' : 'none'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--card-border)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Plus size={14} /> Crear "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
