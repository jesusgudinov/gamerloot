import React, { useRef, useState } from 'react';
import { X, Download, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';

interface ShareLootModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: Record<string, any>;
  totalPrice: number;
}

export default function ShareLootModal({ isOpen, onClose, selectedProducts, totalPrice }: ShareLootModalProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  // Extraemos componentes principales para el diseño
  const cpu = selectedProducts['cpu'];
  const gpu = selectedProducts['gpu'];
  const motherboard = selectedProducts['motherboard'];
  const ram = selectedProducts['ram'];
  const caseProduct = selectedProducts['case'];
  
  // Agrupamos el resto
  const otherParts = Object.values(selectedProducts).filter(
    (p: any) => p && !['cpu', 'gpu', 'motherboard', 'ram', 'case'].includes(
      Object.keys(selectedProducts).find(k => selectedProducts[k]?.id === p.id) || ''
    )
  );

  const handleDownload = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(exportRef.current, {
        scale: 2, // Alta resolución
        backgroundColor: '#050505', // Fondo súper oscuro
        logging: false,
        useCORS: true, // Permitir imágenes de otros dominios
      });
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = 'Mi-Gamer-Loot.png';
      link.click();
    } catch (err) {
      console.error("Error al exportar la imagen", err);
    } finally {
      setIsExporting(false);
    }
  };

  // Función para obtener 1 o 2 atributos clave de un producto
  const getKeyAttributes = (product: any) => {
    if (!product?.attributes || product.attributes.length === 0) return '';
    return product.attributes.slice(0, 2).map((a: any) => a.value).join(' | ');
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      
      {/* Contenedor del Modal Visible */}
      <div style={{ background: '#0a0a0a', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '24px', width: '100%', maxWidth: '1200px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 0 50px rgba(139,92,246,0.2)' }}>
        
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Share2 size={24} color="var(--primary)" /> Comparte tu Loot
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* Body - Preview */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px', display: 'flex', justifyContent: 'center', background: '#000' }}>
          
          {/* 
            Este es el contenedor que se exportará a imagen.
            Lo forzamos a 1920x1080 (16:9 estricto) usando CSS transform scale para que quepa en la pantalla,
            pero su tamaño real DOM sigue siendo 1920x1080.
          */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '1000px', aspectRatio: '16/9', overflow: 'hidden' }}>
            <div 
              ref={exportRef}
              style={{ 
                position: 'absolute', top: 0, left: 0, width: '1920px', height: '1080px', 
                transform: 'scale(0.52)', // 1000/1920 aprox para preview
                transformOrigin: 'top left',
                background: 'radial-gradient(circle at center, #1a1025 0%, #050505 100%)',
                color: '#fff',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                padding: '60px',
                display: 'grid',
                gridTemplateColumns: '1fr 400px 1fr',
                gridTemplateRows: 'auto 1fr',
                gap: '40px',
                boxSizing: 'border-box'
              }}
            >
              {/* Decorative Neons */}
              <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '600px', height: '600px', background: 'rgba(139,92,246,0.15)', filter: 'blur(150px)', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '800px', height: '800px', background: 'rgba(16,185,129,0.1)', filter: 'blur(150px)', borderRadius: '50%' }} />

              {/* Top Header Grid */}
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '30px', zIndex: 1 }}>
                <div>
                  <h1 style={{ fontSize: '4rem', margin: '0 0 10px 0', letterSpacing: '-1px', textTransform: 'uppercase', background: 'linear-gradient(to right, #fff, #a78bfa)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
                    Gamer Loot
                  </h1>
                  <p style={{ margin: 0, fontSize: '1.8rem', color: '#a1a1aa', letterSpacing: '2px', textTransform: 'uppercase' }}>
                    Configuración Elite
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '1px' }}>Inversión Total</div>
                  <div style={{ fontSize: '4.5rem', fontWeight: 'bold', color: '#10b981', textShadow: '0 0 30px rgba(16,185,129,0.4)' }}>
                    ${totalPrice.toLocaleString('es-MX')}
                  </div>
                </div>
              </div>

              {/* Left Column (CPU, RAM, Motherboard) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', zIndex: 1 }}>
                <ProductCard product={cpu} label="Procesador" color="#3b82f6" />
                <ProductCard product={motherboard} label="Tarjeta Madre" color="#8b5cf6" />
                <ProductCard product={ram} label="Memoria RAM" color="#ec4899" />
              </div>

              {/* Center Column (Gabinete / Hero) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                {caseProduct && (
                  <div style={{ width: '100%', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff', letterSpacing: '2px', marginBottom: '20px', textTransform: 'uppercase', textShadow: '0 0 20px rgba(255,255,255,0.5)' }}>El Loot Principal</div>
                    <div style={{ position: 'relative', width: '100%', paddingTop: '100%', marginBottom: '30px' }}>
                      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', zIndex: 0 }} />
                      <img src={caseProduct.images?.[0]} alt="Case" crossOrigin="anonymous" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', zIndex: 1, filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.8))' }} />
                    </div>
                    <h3 style={{ fontSize: '1.8rem', margin: '0 0 10px 0', color: '#fff' }}>{caseProduct.name}</h3>
                    <p style={{ margin: 0, fontSize: '1.2rem', color: '#a1a1aa' }}>{getKeyAttributes(caseProduct)}</p>
                  </div>
                )}
              </div>

              {/* Right Column (GPU, Others) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', zIndex: 1 }}>
                <ProductCard product={gpu} label="Tarjeta Gráfica" color="#10b981" />
                
                {/* Agrupamos los demás componentes en cards más pequeñas */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {otherParts.slice(0, 4).map((p: any, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '15px', backdropFilter: 'blur(10px)' }}>
                      <div style={{ fontSize: '0.9rem', color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '8px' }}>Componente</div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</h4>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Watermark */}
              <div style={{ position: 'absolute', bottom: '40px', right: '60px', fontSize: '1.5rem', color: 'rgba(255,255,255,0.3)', zIndex: 1 }}>
                Armado con <strong style={{ color: 'rgba(255,255,255,0.5)' }}>gamerloot.com</strong>
              </div>

            </div>
          </div>
        </div>

        {/* Footer - Actions */}
        <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <button onClick={onClose} style={{ padding: '12px 30px', background: 'transparent', border: '1px solid var(--card-border)', borderRadius: '12px', color: '#fff', fontSize: '1.1rem', cursor: 'pointer' }}>
            Cerrar
          </button>
          <button onClick={handleDownload} disabled={isExporting} style={{ padding: '12px 30px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', boxShadow: '0 0 20px rgba(139,92,246,0.4)', opacity: isExporting ? 0.7 : 1 }}>
            {isExporting ? 'Generando Magia...' : <><Download size={20} /> Descargar Mosaico</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// Sub-componente para las tarjetas laterales
function ProductCard({ product, label, color }: { product: any, label: string, color: string }) {
  if (!product) return null;
  
  const attrs = product.attributes?.slice(0, 2).map((a:any) => a.value).join(' | ') || '';

  return (
    <div style={{ 
      background: 'rgba(255,255,255,0.02)', 
      border: `1px solid rgba(255,255,255,0.1)`, 
      borderLeft: `4px solid ${color}`,
      borderRadius: '20px', 
      padding: '24px', 
      backdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      gap: '24px',
      boxShadow: `inset 0 0 40px rgba(255,255,255,0.01)`
    }}>
      <div style={{ width: '100px', height: '100px', flexShrink: 0, background: '#fff', borderRadius: '12px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={product.images?.[0]} alt={product.name} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>
      <div>
        <div style={{ fontSize: '1.1rem', color: color, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', marginBottom: '8px' }}>{label}</div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.4rem', color: '#fff', lineHeight: 1.2 }}>{product.name}</h3>
        <p style={{ margin: 0, fontSize: '1rem', color: '#a1a1aa' }}>{attrs}</p>
      </div>
    </div>
  );
}
