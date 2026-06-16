import { useNavigate } from 'react-router-dom';
import { ArrowDown, CornerRightDown } from 'lucide-react';
import heroImage from '../assets/hero_student_life.png';
import labImage from '../assets/student_collaboration.png';

export default function Landing() {
  const navigate = useNavigate();

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
          <div style={{
            borderRadius: '24px',
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--card-shadow)',
            height: '520px',
            position: 'relative'
          }}>
            <img 
              src={labImage} 
              alt="Students collaborating at SPIT" 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'grayscale(100%)' // premium B&W Hinge aesthetics
              }}
            />
          </div>

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
            <div className="stack-photo" style={{
              position: 'absolute',
              left: '5%',
              width: '180px',
              height: '270px',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              border: '1px solid var(--border-color)',
              transform: 'rotate(-4deg) translateY(-20px)',
              zIndex: 1
            }}>
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=400&h=600" 
                alt="Students studying" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%)' }}
              />
            </div>

            {/* Card 2: Center */}
            <div className="stack-photo" style={{
              position: 'absolute',
              width: '200px',
              height: '300px',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
              border: '1px solid var(--border-color)',
              transform: 'rotate(2deg) translateY(10px)',
              zIndex: 3
            }}>
              <img 
                src="https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?auto=format&fit=crop&q=80&w=400&h=600" 
                alt="Working at a table" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%)' }}
              />
            </div>

            {/* Card 3: Rightmost */}
            <div className="stack-photo" style={{
              position: 'absolute',
              right: '5%',
              width: '180px',
              height: '270px',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              border: '1px solid var(--border-color)',
              transform: 'rotate(-2deg) translateY(-30px)',
              zIndex: 2
            }}>
              <img 
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=400&h=600" 
                alt="Student presenting code" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%)' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Bounce keyframe and stack responsiveness */}
      <style>{`
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
    </div>
  );
}
