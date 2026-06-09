import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, X, CheckCircle, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ImageUploaderProps {
  onUploadSuccess: (url: string) => void;
  currentImageUrl?: string;
  className?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml'];

export default function ImageUploader({ onUploadSuccess, currentImageUrl, className = '' }: ImageUploaderProps) {
  const { token } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): boolean => {
    setError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Formato no soportado. Usa JPG, PNG, WEBP, AVIF, GIF o SVG.');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('La imagen excede el límite de 5MB.');
      return false;
    }
    return true;
  };

  const uploadFile = async (file: File) => {
    if (!validateFile(file)) return;

    // Show instant local preview
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setIsUploading(true);
    setProgress(10); // Start progress

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate slow upload for UI Premium feel
      const progressInterval = setInterval(() => {
        setProgress(prev => (prev >= 90 ? 90 : prev + 15));
      }, 100);

      const response = await fetch('http://localhost:8000/api/v1/uploads/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Error al subir la imagen');
      }

      const data = await response.json();
      setProgress(100);
      
      setTimeout(() => {
        setIsUploading(false);
        onUploadSuccess(data.url); // Pase back URL
      }, 500);

    } catch (err: any) {
      setError(err.message);
      setIsUploading(false);
      setProgress(0);
      setPreview(currentImageUrl || null); // revert on fail
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFile(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setError(null);
    onUploadSuccess('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={`image-uploader ${className}`} style={{ width: '100%', position: 'relative' }}>
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
          backgroundColor: isDragging ? 'rgba(139, 92, 246, 0.05)' : 'var(--input-bg)',
          borderRadius: '16px',
          padding: '2rem 1rem',
          textAlign: 'center',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px'
        }}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept={ALLOWED_TYPES.join(',')}
          style={{ display: 'none' }}
        />

        {preview && !error ? (
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center' }}>
            <img 
              src={preview.startsWith('/') && !preview.startsWith('http') ? `http://localhost:8000${preview}` : preview} 
              alt="Preview" 
              style={{ maxHeight: '180px', borderRadius: '8px', objectFit: 'contain', animation: 'fadeIn 0.5s ease-out' }} 
            />
            {!isUploading && (
              <button 
                onClick={handleRemove}
                style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  background: 'rgba(239, 68, 68, 0.9)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  transition: 'transform 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                title="Eliminar imagen"
              >
                <X size={16} />
              </button>
            )}
            
            {isUploading && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', padding: '12px', backdropFilter: 'blur(4px)', borderRadius: '0 0 8px 8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#fff', marginBottom: '4px' }}>
                  <span>Subiendo al Bucket...</span>
                  <span>{progress}%</span>
                </div>
                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #d946ef)', transition: 'width 0.2s ease-out' }} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', pointerEvents: 'none' }}>
            <div style={{ 
              width: '64px', height: '64px', borderRadius: '50%', 
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(217, 70, 239, 0.1))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isDragging ? '0 0 20px rgba(139, 92, 246, 0.3)' : 'none',
              transition: 'all 0.3s ease'
            }}>
              <UploadCloud size={32} color={isDragging ? '#8b5cf6' : 'var(--text-muted)'} />
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: 'var(--text-color)', fontSize: '1.1rem' }}>
                Arrastra una imagen o <span style={{ color: '#8b5cf6' }}>explora</span>
              </p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Soporta JPG, PNG, WEBP, AVIF (Max 5MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{ 
          marginTop: '12px', padding: '10px 14px', borderRadius: '8px', 
          background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
          display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '0.9rem',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}
    </div>
  );
}
