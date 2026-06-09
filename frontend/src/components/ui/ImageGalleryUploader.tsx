import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, X, AlertCircle, GripHorizontal } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ImageGalleryUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  className?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml'];

export default function ImageGalleryUploader({ images, onChange, className = '' }: ImageGalleryUploaderProps) {
  const { token } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{ id: string; file: File; progress: number; preview: string }[]>([]);
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
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Formato no soportado en uno de los archivos. Usa JPG, PNG, WEBP, AVIF, GIF o SVG.');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`El archivo "${file.name}" excede el límite de 5MB.`);
      return false;
    }
    return true;
  };

  const uploadFiles = async (files: FileList | File[]) => {
    setError(null);
    const validFiles: File[] = [];
    
    // Validar todos los archivos
    for (let i = 0; i < files.length; i++) {
      if (validateFile(files[i])) {
        validFiles.push(files[i]);
      } else {
        return; // Detener si hay un error
      }
    }

    if (validFiles.length === 0) return;

    const newUploads = validFiles.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f,
      progress: 10,
      preview: URL.createObjectURL(f)
    }));

    setUploadingFiles(prev => [...prev, ...newUploads]);

    const uploadedUrls: string[] = [];

    // Subir cada archivo de forma secuencial o paralela
    // Lo haremos secuencial para no sobrecargar el servidor
    for (const uploadItem of newUploads) {
      const formData = new FormData();
      formData.append('file', uploadItem.file);

      try {
        // Simulador de progreso UI
        const progressInterval = setInterval(() => {
          setUploadingFiles(prev => prev.map(u => 
            u.id === uploadItem.id ? { ...u, progress: Math.min(u.progress + 15, 90) } : u
          ));
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
        
        setUploadingFiles(prev => prev.map(u => 
          u.id === uploadItem.id ? { ...u, progress: 100 } : u
        ));
        
        uploadedUrls.push(data.url);

      } catch (err: any) {
        setError(err.message);
      }
    }

    // Terminado, limpiamos la lista de subiendo y agregamos a las imágenes
    setTimeout(() => {
      setUploadingFiles(prev => prev.filter(u => !newUploads.find(n => n.id === u.id)));
      if (uploadedUrls.length > 0) {
        onChange([...images, ...uploadedUrls]);
      }
    }, 500);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
    }
  };

  const handleRemove = (e: React.MouseEvent, indexToRemove: number) => {
    e.stopPropagation();
    onChange(images.filter((_, i) => i !== indexToRemove));
  };

  return (
    <div className={`image-gallery-uploader ${className}`} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Zona Drag & Drop */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
          backgroundColor: isDragging ? 'rgba(139, 92, 246, 0.05)' : 'var(--input-bg)',
          borderRadius: '16px',
          padding: '2rem 1rem',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '120px'
        }}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept={ALLOWED_TYPES.join(',')}
          multiple
          style={{ display: 'none' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', pointerEvents: 'none' }}>
          <div style={{ 
            width: '48px', height: '48px', borderRadius: '50%', 
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(217, 70, 239, 0.1))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isDragging ? '0 0 20px rgba(139, 92, 246, 0.3)' : 'none',
            transition: 'all 0.3s ease'
          }}>
            <UploadCloud size={24} color={isDragging ? '#8b5cf6' : 'var(--text-muted)'} />
          </div>
          <div>
            <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: 'var(--text-color)', fontSize: '1rem' }}>
              Arrastra múltiples imágenes o <span style={{ color: '#8b5cf6' }}>explora</span>
            </p>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Soporta JPG, PNG, WEBP, AVIF (Max 5MB c/u)
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ 
          padding: '10px 14px', borderRadius: '8px', 
          background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
          display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '0.9rem',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Grid de Previsualización */}
      {(images.length > 0 || uploadingFiles.length > 0) && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
          gap: '16px',
          padding: '16px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '12px',
          border: '1px solid var(--card-border)'
        }}>
          
          {/* Imágenes subidas exitosamente */}
          {images.map((url, index) => (
            <div key={index} style={{ position: 'relative', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--card-border)', group: 'hover' }}>
              <img 
                src={url.startsWith('/') && !url.startsWith('http') ? `http://localhost:8000${url}` : url} 
                alt={`Gallery image ${index + 1}`} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              <div style={{ 
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                background: 'rgba(0,0,0,0.4)', opacity: 0, transition: 'opacity 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              onMouseOver={e => e.currentTarget.style.opacity = '1'}
              onMouseOut={e => e.currentTarget.style.opacity = '0'}
              >
                <button 
                  onClick={(e) => handleRemove(e, index)}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
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
                  <X size={18} />
                </button>
              </div>
              <div style={{ position: 'absolute', top: '4px', left: '4px', background: 'rgba(0,0,0,0.6)', borderRadius: '4px', padding: '2px 6px', fontSize: '0.7rem', color: '#fff' }}>
                {index + 1}
              </div>
            </div>
          ))}

          {/* Imágenes en proceso de subida */}
          {uploadingFiles.map(upload => (
            <div key={upload.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--primary)', opacity: 0.7 }}>
              <img src={upload.preview} alt="Subiendo" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(50%)' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.8)', padding: '8px', backdropFilter: 'blur(4px)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', fontSize: '0.7rem', color: '#fff', marginBottom: '4px' }}>
                  <span>{upload.progress}%</span>
                </div>
                <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${upload.progress}%`, height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #d946ef)', transition: 'width 0.2s ease-out' }} />
                </div>
              </div>
            </div>
          ))}

        </div>
      )}

    </div>
  );
}
