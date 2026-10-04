import React, { useState, useEffect, useRef } from 'react';

/**
 * PortalTransition:
 * Orchestrates the transition between the initial LOOP splash logo and the front page hero.
 * 
 * Flow:
 * Phase 1 ('logo'): First LOOP animation - center wordmark reveals on #0A0C0E ground.
 * Phase 2 ('opening'): The Portal animation - two solid panels part outward, uncovering
 *                     the full-bleed image while the wordmark grows, tracking tightens,
 *                     halves travel outward, and accent dots glide to corners.
 * Phase 3 ('reveal'): Front page uncovers smoothly, hand-off complete.
 */
export default function PortalTransition({ onComplete }) {
  // 'logo' -> 'opening' -> 'fading' -> done
  const [phase, setPhase] = useState('logo');
  const [isSkipped, setIsSkipped] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    // Lock body scroll during portal transition
    document.body.style.overflow = 'hidden';

    // Timeline:
    // 0s - 1.5s: First LOOP logo animation
    // 1.5s - 3.4s: Portal panels part outward, wordmark splits & scales, image settles
    // 3.4s - 4.0s: Fade out transition overlay into front page
    const tOpening = setTimeout(() => {
      setPhase('opening');
    }, 1500);

    const tFading = setTimeout(() => {
      setPhase('fading');
    }, 3400);

    const tComplete = setTimeout(() => {
      document.body.style.overflow = '';
      if (onComplete) onComplete();
    }, 4000);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(tOpening);
      clearTimeout(tFading);
      clearTimeout(tComplete);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, []);

  const handleSkip = () => {
    setIsSkipped(true);
    setPhase('fading');
    setTimeout(() => {
      document.body.style.overflow = '';
      if (onComplete) onComplete();
    }, 300);
  };

  if (isSkipped && phase === 'done') return null;

  const isOpening = phase === 'opening' || phase === 'fading';
  const isFading = phase === 'fading';

  return (
    <div 
      ref={containerRef}
      onClick={handleSkip}
      className={`portal-transition-root ${isFading ? 'portal-fading-out' : ''}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: '#0A0C0E',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.6s ease',
        opacity: isFading ? 0 : 1,
        visibility: isFading ? 'hidden' : 'visible',
        pointerEvents: isFading ? 'none' : 'auto',
      }}
      title="Click or press ESC to skip"
    >
      {/* 1. BACKGROUND FULL-BLEED IMAGE */}
      <div 
        className="portal-bg-layer"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/images/spit-college.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: isOpening ? 'scale(1.0)' : 'scale(1.18)',
          transition: 'transform 1.9s cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform',
        }}
      />

      {/* 2. DUOTONE WASH OVERLAY (Amber #E8913C & Teal #2E6B72 at overlay) */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(232, 145, 60, 0.35) 0%, rgba(46, 107, 114, 0.4) 100%)',
          mixBlendMode: 'overlay',
          opacity: isOpening ? 0.35 : 0,
          transition: 'opacity 1.6s ease',
          pointerEvents: 'none',
        }}
      />

      {/* 3. RADIAL VEIL DARKENING EDGES */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(10,12,14,0.15) 20%, rgba(10,12,14,0.85) 90%)',
          pointerEvents: 'none',
        }}
      />

      {/* 4. TWO OPAQUE PANELS PINNED TO LEFT & RIGHT MEETING IN THE CENTER */}
      {/* Left Panel */}
      <div 
        className="portal-panel-left"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: '50.5%',
          backgroundColor: '#0A0C0E',
          borderRight: '1px solid rgba(237, 231, 220, 0.1)',
          transform: isOpening ? 'translateX(-101%)' : 'translateX(0)',
          transition: 'transform 1.6s cubic-bezier(0.85, 0, 0.15, 1)',
          willChange: 'transform',
          zIndex: 10,
        }}
      />

      {/* Right Panel */}
      <div 
        className="portal-panel-right"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: '50.5%',
          backgroundColor: '#0A0C0E',
          borderLeft: '1px solid rgba(237, 231, 220, 0.1)',
          transform: isOpening ? 'translateX(101%)' : 'translateX(0)',
          transition: 'transform 1.6s cubic-bezier(0.85, 0, 0.15, 1)',
          willChange: 'transform',
          zIndex: 10,
        }}
      />

      {/* 5. TWO ACCENT DOTS (Amber & Teal) STARTING AT SEAM */}
      {/* Amber Dot -> travels towards top-left corner */}
      <div 
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          backgroundColor: '#E8913C',
          boxShadow: '0 0 14px #E8913C, 0 0 4px #EDE7DC',
          transform: isOpening 
            ? 'translate(calc(-50% - 42vw), calc(-50% - 38vh)) scale(1.4)' 
            : 'translate(-50%, -50%) scale(1)',
          opacity: isOpening ? 0.8 : 1,
          transition: 'transform 1.7s cubic-bezier(0.85, 0, 0.15, 1), opacity 1.7s ease',
          zIndex: 15,
          pointerEvents: 'none',
        }}
      />

      {/* Teal Dot -> travels towards bottom-right corner */}
      <div 
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          backgroundColor: '#2E6B72',
          boxShadow: '0 0 14px #2E6B72, 0 0 4px #EDE7DC',
          transform: isOpening 
            ? 'translate(calc(-50% + 42vw), calc(-50% + 38vh)) scale(1.4)' 
            : 'translate(-50%, -50%) scale(1)',
          opacity: isOpening ? 0.8 : 1,
          transition: 'transform 1.7s cubic-bezier(0.85, 0, 0.15, 1), opacity 1.7s ease',
          zIndex: 15,
          pointerEvents: 'none',
        }}
      />

      {/* 6. CORNER METADATA */}
      <div 
        style={{
          position: 'absolute',
          top: '24px',
          left: '32px',
          fontFamily: "'Sora', sans-serif",
          fontSize: '11px',
          fontWeight: 600,
          color: '#EDE7DC',
          opacity: isOpening ? 0 : 0.75,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          transition: 'opacity 0.6s ease',
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        SPIT Senior Network <span style={{ color: '#E8913C' }}>•</span> Mumbai
      </div>

      <div 
        style={{
          position: 'absolute',
          top: '24px',
          right: '32px',
          fontFamily: "'Sora', sans-serif",
          fontSize: '11px',
          fontWeight: 600,
          color: '#EDE7DC',
          opacity: isOpening ? 0 : 0.75,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          transition: 'opacity 0.6s ease',
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        Portal <span style={{ color: '#2E6B72' }}>//</span> v2.0
      </div>

      <div 
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '32px',
          fontFamily: "'Sora', sans-serif",
          fontSize: '10.5px',
          fontWeight: 500,
          color: '#9EA5A8',
          opacity: isOpening ? 0 : 0.6,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          transition: 'opacity 0.6s ease',
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        Est. 1962 <span style={{ color: '#E8913C' }}>•</span> Sardar Patel Institute of Technology
      </div>

      <div 
        style={{
          position: 'absolute',
          bottom: '24px',
          right: '32px',
          fontFamily: "'Sora', sans-serif",
          fontSize: '10px',
          fontWeight: 600,
          color: '#EDE7DC',
          opacity: isOpening ? 0 : 0.5,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          transition: 'opacity 0.6s ease',
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        [ Click or ESC to Skip ]
      </div>

      {/* 7. THE SIGNATURE PORTAL WORDMARK: SCALES UP, TIGHTENS TRACKING, HALVES TRAVEL TO OPPOSITE EDGES */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 25,
          pointerEvents: 'none',
        }}
      >
        <div 
          className="portal-title-wrapper"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Syne', 'Fraunces', serif",
            fontWeight: 800,
            fontSize: 'clamp(3.5rem, 8.5vw, 7.5rem)',
            color: '#EDE7DC',
            // Whole title scales UP while simultaneously tightening tracking
            transform: isOpening ? 'scale(1.22)' : 'scale(1)',
            letterSpacing: isOpening ? '-0.025em' : '0.28em',
            transition: 'transform 1.6s cubic-bezier(0.85, 0, 0.15, 1), letter-spacing 1.6s cubic-bezier(0.85, 0, 0.15, 1)',
            willChange: 'transform, letter-spacing',
            userSelect: 'none',
          }}
        >
          {/* First half "LO": travels left */}
          <span 
            className="portal-half-left"
            style={{
              display: 'inline-block',
              transform: isOpening ? 'translateX(-38vw)' : 'translateX(0)',
              opacity: isOpening ? 0.05 : 1,
              transition: 'transform 1.6s cubic-bezier(0.85, 0, 0.15, 1), opacity 1.3s cubic-bezier(0.85, 0, 0.15, 1)',
              willChange: 'transform, opacity',
            }}
          >
            LO
          </span>

          {/* Center Seam Glow */}
          <span 
            style={{
              display: 'inline-block',
              width: isOpening ? '30px' : '0px',
              transition: 'width 1.6s cubic-bezier(0.85, 0, 0.15, 1)',
            }}
          />

          {/* Last half "OP": travels right */}
          <span 
            className="portal-half-right"
            style={{
              display: 'inline-block',
              transform: isOpening ? 'translateX(38vw)' : 'translateX(0)',
              opacity: isOpening ? 0.05 : 1,
              transition: 'transform 1.6s cubic-bezier(0.85, 0, 0.15, 1), opacity 1.3s cubic-bezier(0.85, 0, 0.15, 1)',
              willChange: 'transform, opacity',
            }}
          >
            OP
          </span>
        </div>
      </div>
    </div>
  );
}
