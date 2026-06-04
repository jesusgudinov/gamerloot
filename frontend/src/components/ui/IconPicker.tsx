'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import DynamicIcon, { ICON_CATEGORIES } from './DynamicIcon';

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  placeholder?: string;
}

export default function IconPicker({ value, onChange, placeholder = 'Seleccionar ícono...' }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter categories based on search
  const filteredCategories = ICON_CATEGORIES.map(category => ({
    ...category,
    icons: category.icons.filter(icon => icon.toLowerCase().includes(search.toLowerCase()))
  })).filter(category => category.icons.length > 0);

  // Check if current value is a valid Lucide icon name (simple check)
  const isIconSelected = value && value.trim() !== '' && !value.includes('/') && !value.includes('.');

  return (
    <div className="icon-picker" style={{ position: 'relative' }} ref={pickerRef}>
      {/* Trigger Button */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          padding: '10px 12px', 
          background: 'var(--input-bg)', 
          border: '1px solid var(--card-border)', 
          borderRadius: '8px', 
          cursor: 'pointer',
          color: value ? 'var(--text-color)' : 'var(--text-muted)'
        }}
      >
        {isIconSelected ? (
          <DynamicIcon name={value} size={20} color="var(--primary)" />
        ) : (
          <div style={{ width: '20px', height: '20px', border: '1px dashed var(--text-muted)', borderRadius: '4px' }} />
        )}
        <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {value || placeholder}
        </div>
        {value && (
          <X 
            size={16} 
            color="var(--text-muted)" 
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }} 
            style={{ cursor: 'pointer' }}
          />
        )}
      </div>

      {/* Popover */}
      {isOpen && (
        <div style={{ 
          position: 'absolute', 
          top: 'calc(100% + 8px)', 
          left: 0, 
          width: '100%', 
          minWidth: '300px',
          background: 'var(--background)', 
          border: '1px solid var(--card-border)', 
          borderRadius: '12px', 
          boxShadow: '0 10px 40px rgba(0,0,0,0.8)', 
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '400px'
        }}>
          {/* Search Bar */}
          <div style={{ padding: '12px', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--input-bg)', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
            <Search size={16} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Buscar ícono..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-color)', width: '100%', fontSize: '0.9rem' }}
              autoFocus
            />
          </div>

          {/* Grid Area */}
          <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
            {filteredCategories.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', fontSize: '0.9rem' }}>
                No se encontraron íconos.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {filteredCategories.map(category => (
                  <div key={category.name}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {category.name}
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      {category.icons.map(iconName => (
                        <button
                          key={iconName}
                          onClick={() => {
                            onChange(iconName);
                            setIsOpen(false);
                          }}
                          title={iconName}
                          style={{
                            background: value === iconName ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                            border: value === iconName ? '1px solid var(--primary)' : '1px solid transparent',
                            color: value === iconName ? 'var(--primary)' : 'var(--text-color)',
                            borderRadius: '8px',
                            padding: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => {
                            if (value !== iconName) e.currentTarget.style.background = 'var(--input-bg)';
                          }}
                          onMouseLeave={e => {
                            if (value !== iconName) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <DynamicIcon name={iconName} size={24} />
                          <span style={{ fontSize: '0.65rem', marginTop: '6px', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {iconName}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fallback Option */}
          <div style={{ padding: '12px', borderTop: '1px solid var(--card-border)', background: 'rgba(0,0,0,0.1)', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
             <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>O pega un Nombre de Componente Lucide (Ej: Cpu) o una URL (https://...)</p>
             <input 
               type="text" 
               placeholder="Nombre del componente o URL..." 
               value={value || ''}
               onChange={e => onChange(e.target.value)}
               style={{ width: '100%', padding: '8px 10px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: '6px', color: 'var(--text-color)', fontSize: '0.85rem' }}
             />
          </div>
        </div>
      )}
    </div>
  );
}
