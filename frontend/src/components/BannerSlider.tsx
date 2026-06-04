"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

interface Banner {
  id: number;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string | null;
}

export default function BannerSlider({ banners }: { banners: Banner[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const DURATION = 5000; // 5 seconds per banner

  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;

    const interval = 50; // update every 50ms
    const step = (interval / DURATION) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => prev + step);
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, banners.length, isPaused]); // Reset timer if user manually changes banner or pauses

  useEffect(() => {
    if (progress >= 100) {
      setCurrentIndex((current) => (current + 1) % banners.length);
      setProgress(0);
    }
  }, [progress, banners.length]);

  if (!banners || banners.length === 0) {
    return (
      <div style={{ textAlign: "center", margin: "60px 0" }}>
        <h1 className="text-gradient" style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>
          Construye el Poder.
        </h1>
        <p style={{ fontSize: "1.2rem", color: "#cbd5e1", maxWidth: "600px", margin: "0 auto" }}>
          Hardware de última generación y componentes premium para tu siguiente ensamble.
        </p>
      </div>
    );
  }

  const handlePrev = () => {
    setCurrentIndex((current) => (current === 0 ? banners.length - 1 : current - 1));
    setProgress(0);
  };

  const handleNext = () => {
    setCurrentIndex((current) => (current + 1) % banners.length);
    setProgress(0);
  };

  const setBanner = (index: number) => {
    setCurrentIndex(index);
    setProgress(0);
  };

  const currentBanner = banners[currentIndex];
  const circleRadius = 16;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference * (1 - progress / 100);

  return (
    <div className="banner-slider-container" style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
      
      {/* Background Images */}
      {banners.map((banner, index) => (
        <img 
          key={banner.id}
          src={banner.image_url} 
          alt={banner.title} 
          style={{ 
            position: 'absolute',
            top: 0, left: 0,
            width: '100%', height: '100%', objectFit: 'cover', 
            opacity: index === currentIndex ? 1 : 0,
            transition: 'opacity 0.8s ease-in-out',
            zIndex: index === currentIndex ? 1 : 0
          }} 
        />
      ))}

      {/* Content overlay */}
      <div className="banner-content-overlay" style={{ 
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
        background: 'linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)', 
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        zIndex: 2,
        pointerEvents: 'none' // allow clicking through except for buttons
      }}>
        <h1 className="text-gradient banner-title" style={{ marginBottom: '10px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
          {currentBanner.title}
        </h1>
        <p className="banner-subtitle" style={{ color: '#e2e8f0', maxWidth: '500px', marginBottom: '20px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          {currentBanner.subtitle}
        </p>
        {currentBanner.link_url && (
          <Link href={currentBanner.link_url} style={{ pointerEvents: 'auto', width: 'fit-content' }}>
            <button className="btn-primary" style={{ width: 'fit-content', pointerEvents: 'auto' }}>Ver Oferta</button>
          </Link>
        )}
      </div>

      {banners.length > 1 && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 3, pointerEvents: 'none' }}>
          {/* Navigation Arrows */}
          <button 
            onClick={handlePrev}
            style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)', pointerEvents: 'auto', transition: 'background 0.3s' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={handleNext}
            style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)', pointerEvents: 'auto', transition: 'background 0.3s' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
          >
            <ChevronRight size={24} />
          </button>

          {/* Dots Indicator */}
          <div style={{ position: 'absolute', bottom: '20px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center', pointerEvents: 'auto' }}>
            {banners.map((_, idx) => {
              const isActive = idx === currentIndex;
              return (
                <div 
                  key={idx}
                  onClick={() => setBanner(idx)}
                  style={{
                    cursor: 'pointer',
                    width: isActive ? '32px' : '10px',
                    height: '10px',
                    borderRadius: isActive ? '5px' : '50%',
                    background: isActive ? '#8b5cf6' : 'rgba(255,255,255,0.4)',
                    transition: 'all 0.3s ease'
                  }}
                />
              );
            })}
          </div>

          {/* Circular Progress Timer & Pause/Play Button */}
          <div style={{ position: 'absolute', right: '20px', bottom: '20px', width: '40px', height: '40px', pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Control de autoplay">
            <svg width="40" height="40" viewBox="0 0 40 40" style={{ position: 'absolute', top: 0, left: 0 }}>
              <circle cx="20" cy="20" r={circleRadius} fill="rgba(0,0,0,0.5)" />
              <circle cx="20" cy="20" r={circleRadius} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
              <circle 
                cx="20" cy="20" r={circleRadius} 
                fill="none" 
                stroke="#8b5cf6" 
                strokeWidth="3" 
                strokeDasharray={circleCircumference} 
                strokeDashoffset={strokeDashoffset} 
                strokeLinecap="round"
                transform="rotate(-90 20 20)" 
                style={{ transition: 'stroke-dashoffset 0.1s linear' }}
              />
            </svg>
            <button 
              onClick={() => setIsPaused(!isPaused)} 
              style={{ background: 'none', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 4, width: '100%', height: '100%' }}
            >
              {isPaused ? <Play size={16} fill="white" /> : <Pause size={16} fill="white" />}
            </button>
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        .banner-slider-container {
          height: 400px;
        }
        .banner-content-overlay {
          padding: 60px;
        }
        .banner-title {
          fontSize: 3rem;
        }
        .banner-subtitle {
          fontSize: 1.2rem;
        }
        @media (max-width: 768px) {
          .banner-slider-container {
            height: 300px;
          }
          .banner-content-overlay {
            padding: 20px;
            background: linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 70%, transparent 100%) !important;
          }
          .banner-title {
            font-size: 2rem !important;
          }
          .banner-subtitle {
            font-size: 1rem !important;
          }
        }
      `}} />
    </div>
  );
}
