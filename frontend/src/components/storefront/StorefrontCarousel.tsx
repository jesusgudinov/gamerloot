'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface StorefrontCarouselProps {
  images: string[];
  links?: string[];
}

export default function StorefrontCarousel({ images, links = [] }: StorefrontCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance
  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  if (!images || images.length === 0) return null;

  return (
    <div style={{ width: '100%', height: '400px', borderRadius: '24px', overflow: 'hidden', position: 'relative', marginBottom: '24px', background: 'var(--input-bg)' }}>
      {/* Slides */}
      <div 
        style={{ 
          display: 'flex', 
          width: `${images.length * 100}%`, 
          height: '100%', 
          transition: 'transform 0.5s ease-in-out',
          transform: `translateX(-${currentIndex * (100 / images.length)}%)`
        }}
      >
        {images.map((img, idx) => {
          const slideLink = links[idx] ? links[idx].trim() : null;
          const slideContent = (
            <div 
              style={{ 
                width: '100%', 
                height: '100%', 
                backgroundImage: `url(${img.trim()})`, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center' 
              }} 
            />
          );

          return (
            <div key={idx} style={{ width: `${100 / images.length}%`, height: '100%' }}>
              {slideLink ? (
                <Link href={slideLink} style={{ display: 'block', width: '100%', height: '100%' }}>
                  {slideContent}
                </Link>
              ) : slideContent}
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button 
            onClick={prevSlide}
            style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, backdropFilter: 'blur(4px)' }}
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={nextSlide}
            style={{ position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, backdropFilter: 'blur(4px)' }}
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Dots */}
      {images.length > 1 && (
        <div style={{ position: 'absolute', bottom: '20px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '8px', zIndex: 10 }}>
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              style={{
                width: currentIndex === idx ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: currentIndex === idx ? 'var(--primary)' : 'rgba(255,255,255,0.5)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              aria-label={`Ir a diapositiva ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
