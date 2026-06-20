import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDown, CornerRightDown } from 'lucide-react';

const heroImage = '/images/spit-college.jpg';
const labImage = '/images/tpo-team.jpg';

function LightboxImage({ src, alt, title, height = '380px', borderRadius = '16px', objectFit = 'contain', backgroundColor = '#ffffff' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <div 
        onClick={() => setIsOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'relative',
          borderRadius: borderRadius,
          overflow: 'hidden',
          border: '1px solid var(--border-color)',
          height: height,
          backgroundColor: backgroundColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          cursor: 'zoom-in',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isHovered ? 'scale(1.02)' : 'scale(1)',
          boxShadow: isHovered ? '0 12px 24px rgba(0, 0, 0, 0.15)' : 'none',
        }}
      >
        <img 
          src={src} 
          alt={alt} 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: objectFit,
            transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          }}
        />
        
        <div style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          color: '#ffffff',
          padding: '8px 16px',
          borderRadius: '30px',
          fontSize: '0.8rem',
          fontWeight: 600,
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? 'translateY(0)' : 'translateY(8px)',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
        }}>
          <span style={{ fontSize: '0.9rem' }}>🔍</span> Click to Expand
        </div>
      </div>

      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            animation: 'fadeIn 0.2s ease-out',
            cursor: 'zoom-out'
          }}
        >
          <button 
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#ffffff',
              fontSize: '1.25rem',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              zIndex: 100000,
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            ✕
          </button>

          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '92%',
              maxHeight: '92%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: 'zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            <img 
              src={src} 
              alt={alt} 
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '12px',
                boxShadow: '0 30px 60px rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backgroundColor: '#ffffff',
                padding: '10px'
              }}
            />
            {title && (
              <div style={{
                marginTop: '20px',
                color: '#ffffff',
                fontSize: '1.2rem',
                fontWeight: 600,
                textAlign: 'center',
                letterSpacing: '0.05em',
                fontFamily: 'var(--font-serif)',
                textShadow: '0 2px 8px rgba(0,0,0,0.6)'
              }}>
                {title}
              </div>
            )}
          </div>

          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes zoomIn {
              from { transform: scale(0.92); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [activePhoto, setActivePhoto] = useState(null);

  useEffect(() => {
    if (!activePhoto) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActivePhoto(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhoto]);

  // Scroll handler for the first CTA button or indicator
  const scrollToPhilosophy = () => {
    document.getElementById('philosophy-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleShareJourney = () => {
    navigate('/stories', { state: { openUploadModal: true } });
  };

  return (
    <div className="animate-fade-in" style={{ backgroundColor: 'var(--bg-primary)', overflowX: 'hidden' }}>
      
      {/* SECTION 1: HERO BANNER (Full-bleed high-contrast banner) */}
      <section style={{
        minHeight: '85vh',
        width: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.65)), url(${heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#ffffff',
        textAlign: 'center',
        padding: '3rem 1.5rem',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ maxWidth: '800px', zIndex: 2 }}>
          <h1 style={{
            fontSize: 'calc(2.2rem + 2vw)',
            fontFamily: 'var(--font-serif)',
            fontWeight: 500,
            lineHeight: '1.15',
            letterSpacing: '-0.02em',
            marginBottom: '2rem'
          }}>
            The student platform <br />
            designed to get you placed.
          </h1>
          <p style={{
            fontSize: '1.15rem',
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: '3rem',
            maxWidth: '560px',
            margin: '0 auto 3rem auto',
            lineHeight: '1.6'
          }}>
            Skip the endless scroll. Connect directly with SPIT seniors through verified placement journeys, roadmap strategies, and raw study materials.
          </p>

          <button 
            onClick={() => navigate('/stories')}
            className="btn btn-primary"
            style={{ 
              padding: '1rem 2.2rem', 
              fontSize: '1rem',
              backgroundColor: '#ffffff',
              color: '#000000',
              border: 'none',
              borderRadius: '30px',
              fontWeight: 600
            }}
          >
            Find a Mentor
          </button>
        </div>

        {/* Scroll Indicator */}
        <button 
          onClick={scrollToPhilosophy}
          style={{
            position: 'absolute',
            bottom: '2rem',
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.6)',
            cursor: 'pointer',
            animation: 'bounce 2s infinite',
            zIndex: 2
          }}
          title="Scroll down"
        >
          <ArrowDown size={28} />
        </button>

        {/* Ambient dark bottom gradient fade */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '120px',
          background: 'linear-gradient(transparent, var(--bg-primary))',
          pointerEvents: 'none'
        }} />
      </section>

      {/* SECTION 2: OUR PHILOSOPHY (Minimal Editorial Comparison) */}
      <section 
        id="philosophy-section"
        style={{
          padding: '8rem 0',
          borderBottom: '1px solid var(--border-color)'
        }}
      >
        <div className="container" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4rem',
          alignItems: 'flex-start'
        }}>
          <div>
            <span style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: '#8A2BE2', // Hinge signature violet tone for subtitles
              marginBottom: '1rem',
              display: 'block'
            }}>
              Our Philosophy
            </span>
            <h2 style={{
              fontSize: 'calc(2rem + 1vw)',
              fontFamily: 'var(--font-serif)',
              fontWeight: 400,
              lineHeight: '1.2',
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em'
            }}>
              Go on your <br />
              last coding interview.
            </h2>
            
            <div style={{ marginTop: '2.5rem', color: 'var(--text-secondary)' }} className="hide-on-mobile">
              <CornerRightDown size={40} strokeWidth={1} style={{ opacity: 0.5 }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingTop: '1.5rem' }}>
            <p style={{
              fontSize: '1.15rem',
              lineHeight: '1.7',
              color: 'var(--text-secondary)'
            }}>
              Loop is built on the belief that anyone looking for career guidance should be able to find it directly from peers. 
            </p>
            <p style={{
              fontSize: '1.15rem',
              lineHeight: '1.7',
              color: 'var(--text-secondary)'
            }}>
              No recruiter spam, no algorithmic timelines. Just verified senior strategy chronologies, authentic PDF templates, and study roadmaps to help you secure your offer and log off.
            </p>
            
            <div style={{ marginTop: '1rem' }}>
              <button 
                onClick={() => navigate('/stories')}
                className="btn btn-secondary"
                style={{ 
                  padding: '0.85rem 1.8rem', 
                  borderRadius: '30px', 
                  fontWeight: 600,
                  backgroundColor: 'var(--text-primary)',
                  color: 'var(--accent-inverse)',
                  borderColor: 'var(--text-primary)'
                }}
              >
                Browse Stories
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: INSIGHTS / LOOP LABS (Large visual left, copy right) */}
      <section 
        id="branches-section"
        style={{
          padding: '8rem 0',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)'
        }}
      >
        <div className="container" style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr',
          gap: '5rem',
          alignItems: 'center'
        }}>
          {/* Loop Labs Image (Left) */}
          <LightboxImage 
            src={labImage} 
            alt="Students collaborating at SPIT" 
            title="We study what works"
            height="520px"
            borderRadius="24px"
            objectFit="cover"
            backgroundColor="transparent"
          />

          {/* Loop Labs Description (Right) */}
          <div>
            <span style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: '#8A2BE2',
              marginBottom: '1rem',
              display: 'block'
            }}>
              Loop Labs
            </span>
            <h2 style={{
              fontSize: 'calc(1.8rem + 1vw)',
              fontFamily: 'var(--font-serif)',
              fontWeight: 500,
              lineHeight: '1.25',
              marginBottom: '1.5rem',
              color: 'var(--text-primary)'
            }}>
              We study what works.
            </h2>
            <p style={{
              fontSize: '1.05rem',
              lineHeight: '1.7',
              color: 'var(--text-secondary)',
              marginBottom: '2rem'
            }}>
              Our placement coordinators, senior mentors, and alumni analyze interview trends, company exam modules, and coding questions so we can organize student resources effectively. We've gotten pretty good at it.
            </p>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.5rem',
              marginBottom: '2.5rem',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '1.5rem'
            }}>
              <div>
                <h4 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '0.25rem' }}>95%</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Senior feedback participation rate</p>
              </div>
              <div>
                <h4 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '0.25rem' }}>200+</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Verified SPIT roadmaps & sheets</p>
              </div>
            </div>

            <button 
              onClick={() => navigate('/resources')}
              className="btn btn-secondary"
              style={{ padding: '0.75rem 1.6rem', borderRadius: '30px' }}
            >
              Explore Resources
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 3B: PLACEMENT RECORDS & PARTNER COMPANIES */}
      <section style={{
        padding: '6rem 0',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div className="container">
          <div style={{
            textAlign: 'center',
            marginBottom: '4rem'
          }}>
            <span style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: '#8A2BE2',
              marginBottom: '1rem',
              display: 'block'
            }}>
              Placement & Partnerships
            </span>
            <h2 style={{
              fontSize: 'calc(1.8rem + 1vw)',
              fontFamily: 'var(--font-serif)',
              fontWeight: 500,
              color: 'var(--text-primary)',
              marginBottom: '1.25rem'
            }}>
              Placement Track Record & Top Recruiters
            </h2>
            <p style={{
              fontSize: '1.1rem',
              color: 'var(--text-secondary)',
              maxWidth: '650px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}>
              SPIT consistently achieves stellar placement records with top-tier technology and financial institutions recruiting directly from our campus.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '3rem',
            alignItems: 'stretch'
          }} className="placement-grid">
            {/* Placement Record Card */}
            <div className="glass-panel" style={{
              padding: '2rem',
              borderRadius: '24px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--bg-primary)',
              boxShadow: 'var(--card-shadow)',
              gap: '1.5rem'
            }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>
                Placement Statistics & Records
              </h3>
              <div style={{
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid var(--border-color)',
                height: '380px',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem'
              }}>
                <img 
                  src="/images/recode.png" 
                  alt="SPIT Placement Record" 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
            </div>

            {/* Partner Companies Card */}
            <div className="glass-panel" style={{
              padding: '2rem',
              borderRadius: '24px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--bg-primary)',
              boxShadow: 'var(--card-shadow)',
              gap: '1.5rem'
            }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>
                Our Prominent Recruiters
              </h3>
              <div style={{
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid var(--border-color)',
                height: '380px',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem'
              }}>
                <img 
                  src="/images/Companies.png" 
                  alt="Recruiting Partner Companies" 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
            </div>
          </div>
        </div>
        
        <style>{`
          @media (max-width: 900px) {
            .placement-grid {
              grid-template-columns: 1fr !important;
              gap: 2rem !important;
            }
          }
        `}</style>
      </section>

      {/* SECTION 4: TESTIMONIAL QUOTES (Dark premium block quotes) */}
      <section style={{
        padding: '7rem 0',
        backgroundColor: '#050505',
        color: '#ffffff',
        borderBottom: '1px solid var(--border-color)',
        textAlign: 'center'
      }}>
        <div className="container" style={{ maxWidth: '850px' }}>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: '#8A2BE2',
            marginBottom: '2rem',
            display: 'block'
          }}>
            What Our Students Say
          </span>
          
          <span style={{
            fontSize: '6rem',
            fontFamily: 'var(--font-serif)',
            lineHeight: '0.1',
            color: 'rgba(255, 255, 255, 0.15)',
            display: 'block',
            marginBottom: '1.5rem'
          }}>
            “
          </span>
          
          <blockquote style={{
            fontSize: 'calc(1.3rem + 0.5vw)',
            fontFamily: 'var(--font-serif)',
            fontWeight: 400,
            lineHeight: '1.5',
            color: 'rgba(255,255,255,0.95)',
            marginBottom: '2.5rem',
            fontStyle: 'normal'
          }}>
            Other placement platforms felt like shooting in the dark. But my mentor and I clicked right away on Loop. The roadmap was clear, and I cracked my JPMC quant interview. We've been collaborating ever since.
          </blockquote>
          
          <cite style={{
            fontSize: '0.95rem',
            fontWeight: 600,
            fontFamily: 'var(--font-display)',
            color: 'rgba(255,255,255,0.6)',
            display: 'block',
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
            Devansh S. (Class of 2025)
          </cite>

          {/* Hinge style indicators */}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '3.5rem' }}>
            <span style={{ width: '40px', height: '2.5px', backgroundColor: '#ffffff', borderRadius: '2px' }}></span>
            <span style={{ width: '40px', height: '2.5px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '2px' }}></span>
            <span style={{ width: '40px', height: '2.5px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '2px' }}></span>
          </div>
        </div>
      </section>

      {/* SECTION 5: CTA & TEAM PHOTO STACK (Left details, right vertical stack) */}
      <section style={{ padding: '8rem 0 10rem 0' }}>
        <div className="container" style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr',
          gap: '6rem',
          alignItems: 'center'
        }}>
          {/* CTA Details (Left) */}
          <div>
            <span style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: '#8A2BE2',
              marginBottom: '1rem',
              display: 'block'
            }}>
              Contribute to Loop
            </span>
            <h2 style={{
              fontSize: 'calc(2rem + 1vw)',
              fontFamily: 'var(--font-serif)',
              fontWeight: 500,
              lineHeight: '1.2',
              marginBottom: '1.5rem',
              color: 'var(--text-primary)'
            }}>
              Let's build together.
            </h2>
            <p style={{
              fontSize: '1.1rem',
              lineHeight: '1.7',
              color: 'var(--text-secondary)',
              marginBottom: '2.5rem'
            }}>
              We're looking for seniors and alumni who want to make placement preparation effective and transparent. Share your journey and guides to pave the way for your juniors.
            </p>
            
            <button 
              onClick={handleShareJourney}
              className="btn btn-secondary"
              style={{ 
                padding: '0.9rem 2rem', 
                borderRadius: '30px',
                fontWeight: 600,
                backgroundColor: 'var(--text-primary)',
                color: 'var(--accent-inverse)',
                borderColor: 'var(--text-primary)'
              }}
            >
              Share Your Journey
            </button>
          </div>

          {/* Hinge style overlapping team photo stack (Right) */}
          <div style={{
            position: 'relative',
            height: '420px',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }} className="photo-stack-container">
            {/* Card 1: Leftmost */}
            <div 
              onClick={() => setActivePhoto({ src: '/images/file-1.jpg', alt: 'Students studying', title: "Let's build together" })}
              className="stack-photo" 
              style={{
                position: 'absolute',
                left: '5%',
                width: '180px',
                height: '270px',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                border: '1px solid var(--border-color)',
                transform: 'rotate(-4deg) translateY(-20px)',
                zIndex: 1,
                cursor: 'zoom-in'
              }}
            >
              <img 
                src="/images/file-1.jpg" 
                alt="Students studying" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Card 2: Center */}
            <div 
              onClick={() => setActivePhoto({ src: '/images/file-2.jpg', alt: 'Working at a table', title: "Let's build together" })}
              className="stack-photo" 
              style={{
                position: 'absolute',
                width: '200px',
                height: '300px',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                border: '1px solid var(--border-color)',
                transform: 'rotate(2deg) translateY(10px)',
                zIndex: 3,
                cursor: 'zoom-in'
              }}
            >
              <img 
                src="/images/file-2.jpg" 
                alt="Working at a table" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Card 3: Rightmost */}
            <div 
              onClick={() => setActivePhoto({ src: '/images/file-3.jpg', alt: 'Student presenting code', title: "Let's build together" })}
              className="stack-photo" 
              style={{
                position: 'absolute',
                right: '5%',
                width: '180px',
                height: '270px',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                border: '1px solid var(--border-color)',
                transform: 'rotate(-2deg) translateY(-30px)',
                zIndex: 2,
                cursor: 'zoom-in'
              }}
            >
              <img 
                src="/images/file-3.jpg" 
                alt="Student presenting code" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Bounce keyframe and stack responsiveness */}
      <style>{`
        .stack-photo {
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), z-index 0.4s step-start, box-shadow 0.4s ease !important;
        }
        .stack-photo:hover {
          transform: scale(1.6) rotate(0deg) translateY(-20px) !important;
          z-index: 100 !important;
          box-shadow: 0 30px 60px rgba(0,0,0,0.5) !important;
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-8px);
          }
          60% {
            transform: translateY(-4px);
          }
        }

        @media (max-width: 900px) {
          section {
            padding: 5rem 1.5rem !important;
          }
          .container {
            grid-template-columns: 1fr !important;
            gap: 4rem !important;
          }
          .hide-on-mobile {
            display: none !important;
          }
          .photo-stack-container {
            height: 350px !important;
            margin-top: 2rem;
          }
          .stack-photo {
            width: 140px !important;
            height: 210px !important;
          }
          .stack-photo:hover {
            transform: scale(1.3) rotate(0deg) translateY(-10px) !important;
          }
          .stack-photo:nth-of-type(1) {
            left: 10% !important;
          }
          .stack-photo:nth-of-type(2) {
            width: 160px !important;
            height: 230px !important;
          }
          .stack-photo:nth-of-type(3) {
            right: 10% !important;
          }
        }
      `}</style>

      {/* Lightbox for stack photos */}
      {activePhoto && (
        <div 
          onClick={() => setActivePhoto(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            animation: 'fadeIn 0.2s ease-out',
            cursor: 'zoom-out'
          }}
        >
          <button 
            onClick={(e) => { e.stopPropagation(); setActivePhoto(null); }}
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#ffffff',
              fontSize: '1.25rem',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              zIndex: 100000,
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            ✕
          </button>

          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '92%',
              maxHeight: '92%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: 'zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            <img 
              src={activePhoto.src} 
              alt={activePhoto.alt} 
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '12px',
                boxShadow: '0 30px 60px rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backgroundColor: '#ffffff',
                padding: '10px'
              }}
            />
            {activePhoto.title && (
              <div style={{
                marginTop: '20px',
                color: '#ffffff',
                fontSize: '1.2rem',
                fontWeight: 600,
                textAlign: 'center',
                letterSpacing: '0.05em',
                fontFamily: 'var(--font-serif)',
                textShadow: '0 2px 8px rgba(0,0,0,0.6)'
              }}>
                {activePhoto.title}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
