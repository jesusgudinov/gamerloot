import React, { useState, useEffect, useRef } from 'react';

interface EditableCellProps {
  value: string | number;
  type?: 'text' | 'number';
  onSave: (newValue: string | number) => void;
  style?: React.CSSProperties;
}

export default function EditableCell({ value, type = 'text', onSave, style }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (tempValue !== value) {
      onSave(tempValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setTempValue(value);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={tempValue}
        onChange={(e) => setTempValue(type === 'number' ? Number(e.target.value) : e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        style={{
          width: '100%',
          padding: '4px 8px',
          borderRadius: '4px',
          border: '1px solid var(--primary)',
          background: 'var(--input-bg)',
          color: 'var(--input-text)',
          outline: 'none',
          ...style
        }}
      />
    );
  }

  return (
    <div 
      onDoubleClick={() => setIsEditing(true)}
      title="Doble clic para editar"
      style={{
        cursor: 'text',
        padding: '4px 0',
        minHeight: '24px',
        borderBottom: '1px dashed transparent',
        transition: 'border-color 0.2s',
        ...style
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderBottomColor = 'var(--text-muted)'}
      onMouseLeave={(e) => e.currentTarget.style.borderBottomColor = 'transparent'}
    >
      {value || <span style={{ opacity: 0.5 }}>-</span>}
    </div>
  );
}
