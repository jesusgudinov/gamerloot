'use client';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Plus } from 'lucide-react';

interface Option {
  id: string | number;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
  allowCreate?: boolean;
  onCreate?: (value: string) => void;
}

export default function SearchableSelect({ options, value, onChange, placeholder = 'Seleccionar...', disabled = false, allowCreate = false, onCreate }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.id.toString() === value.toString());
  const displayLabel = selectedOption ? selectedOption.label : '';

  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{ 
          width: '100%', 
          padding: '10px 12px', 
          borderRadius: '8px', 
          border: '1px solid var(--card-border)', 
          background: disabled ? 'var(--card-border)' : 'var(--input-bg)', 
          color: disabled ? 'var(--text-muted)' : 'var(--text-color)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          opacity: disabled ? 0.6 : 1
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayLabel || <span style={{ color: 'var(--text-muted)' }}>{placeholder}</span>}
        </span>
        <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
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
                const isSelected = option.id.toString() === value.toString();
                return (
                  <div 
                    key={option.id}
                    onClick={() => {
                      onChange(option.id);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    style={{ 
                      padding: '10px 12px', 
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      borderRadius: '6px',
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
                  </div>
                );
              })
            )}
            
            {allowCreate && searchTerm && !options.some(o => o.label.toLowerCase() === searchTerm.toLowerCase()) && (
              <div 
                onClick={() => {
                  onCreate?.(searchTerm);
                  setIsOpen(false);
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
