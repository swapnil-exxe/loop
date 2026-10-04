import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Building, Briefcase } from 'lucide-react';

const DECK_CARDS = [
  {
    id: 'morgan-stanley',
    company: 'Morgan Stanley',
    role: 'Quantitative Strategist / Technology',
    tier: 'Super Dream',
    ctc: '29.5 LPA',
    candidate: 'Class of 2024 • Computer Engineering',
    tag: 'Fintech & Quant',
    tagColor: '#E8913C',
    color: '#0A0C0E',
    summary: 'Mastered stochastic calculus, low-latency C++, and algorithmic rounds. Complete placement archive with real interview questions.',
    bgImage: '/images/file-1.jpg',
    accent: '#E8913C'
  },
  {
    id: 'microsoft',
    company: 'Microsoft',
    role: 'Software Development Engineer',
    tier: 'Super Dream',
    ctc: '51.0 LPA',
    candidate: 'Class of 2024 • Information Technology',
    tag: 'Systems & Cloud',
    tagColor: '#2E6B72',
    color: '#0D1117',
    summary: 'End-to-end breakdown of dynamic programming, distributed systems design, and behavioral leadership rounds at Microsoft IDC.',
    bgImage: '/images/file-2.jpg',
    accent: '#2E6B72'
  },
  {
    id: 'jp-morgan',
    company: 'J.P. Morgan Chase & Co.',
    role: 'Software Engineer Analyst',
    tier: 'Super Dream',
    ctc: '20.0 LPA',
    candidate: 'Class of 2025 • CSE (Data Science)',
    tag: 'Investment Tech',
    tagColor: '#E8913C',
    color: '#101317',
    summary: 'From Code For Good hackathon win to full-time PPO. Detailed round-by-round interview strategy and prep roadmap.',
    bgImage: '/images/file-3.jpg',
    accent: '#E8913C'
  },
  {
    id: 'google',
    company: 'Google',
    role: 'Software Engineer (SWE)',
    tier: 'Super Dream',
    ctc: '45.0 LPA',
    candidate: 'Class of 2023 • Computer Engineering',
    tag: 'Algorithms & Core',
    tagColor: '#2E6B72',
    color: '#0C0F12',
    summary: 'Graph theory, tree dynamic programming, and clean modular code writing under strict 45-minute timed interview constraints.',
    bgImage: '/images/file-4.jpg',
    accent: '#2E6B72'
  },
  {
    id: 'deutsche-bank',
    company: 'Deutsche Bank',
    role: 'Graduate Analyst',
    tier: 'Dream',
    ctc: '19.8 LPA',
    candidate: 'Class of 2024 • EXTC',
    tag: 'Corporate Banking',
    tagColor: '#E8913C',
    color: '#0A0C0E',
    summary: 'Core CS fundamentals revision notes, SQL deep dives, and operating system multithreading questions compiled for SPIT juniors.',
    bgImage: '/images/file-5.jpg',
    accent: '#E8913C'
  }
];

export default function ThrowableDeck() {
  const navigate = useNavigate();
  const [cards, setCards] = useState(DECK_CARDS);
  const [dragState, setDragState] = useState(null); // { startX, currentX, startY, currentY, isDragging }
  const [thrownCard, setThrownCard] = useState(null); // { id, dir: 'left' | 'right' }
  const deckRef = useRef(null);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      throwTopCard('right');
    } else if (e.key === 'ArrowLeft') {
      throwTopCard('left');
    }
  };

  const throwTopCard = (direction) => {
    if (cards.length <= 1 || thrownCard) return;
    const top = cards[0];
    setThrownCard({ id: top.id, dir: direction });

    setTimeout(() => {
      setCards((prev) => {
        const [first, ...rest] = prev;
        return [...rest, first];
      });
      setThrownCard(null);
    }, 420);
  };

  // Pointer Handlers
  const handlePointerDown = (e) => {
    if (cards.length <= 1 || thrownCard) return;
    const clientX = e.clientX;
    const clientY = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragState({
      pointerId: e.pointerId,
      startX: clientX,
      currentX: clientX,
      startY: clientY,
      currentY: clientY,
      isDragging: true
    });
  };

  const handlePointerMove = (e) => {
    if (!dragState || !dragState.isDragging) return;
    setDragState((prev) => ({
      ...prev,
      currentX: e.clientX,
      currentY: e.clientY
    }));
  };

  const handlePointerUp = (e) => {
    if (!dragState || !dragState.isDragging) return;
    try {
      e.currentTarget.releasePointerCapture(dragState.pointerId);
    } catch (_) {}

    const deltaX = dragState.currentX - dragState.startX;
    const deckWidth = deckRef.current?.offsetWidth || 340;
    const threshold = deckWidth * 0.15; // Roughly tenth to 15% of deck width

    if (Math.abs(deltaX) > threshold) {
      throwTopCard(deltaX > 0 ? 'right' : 'left');
    }

    setDragState(null);
  };

  const currentDeltaX = dragState ? dragState.currentX - dragState.startX : 0;
  const currentDeltaY = dragState ? dragState.currentY - dragState.startY : 0;
  const rotationAngle = (currentDeltaX / 18); // proportional rotation

  return (
    <div 
      className="throwable-deck-section"
      style={{
        padding: '5rem 1.5rem',
        backgroundColor: '#0A0C0E',
        color: '#EDE7DC',
        borderTop: '1px solid rgba(237, 231, 220, 0.1)',
        borderBottom: '1px solid rgba(237, 231, 220, 0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div className="container" style={{ maxWidth: '1160px', margin: '0 auto' }}>
        
        {/* TWO-COLUMN LAYOUT: Headline & Lede on one side; Deck on the other */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '3.5rem',
          alignItems: 'center'
        }}>
          
          {/* Column 1: Editorial Headline, Lede, Buttons */}
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: "'Sora', sans-serif",
              fontSize: '11px',
              fontWeight: 600,
              color: '#E8913C',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: '1rem',
              padding: '4px 10px',
              borderRadius: '20px',
              backgroundColor: 'rgba(232, 145, 60, 0.1)',
              border: '1px solid rgba(232, 145, 60, 0.2)'
            }}>
              <Sparkles size={12} /> SPIT Placement Catalogue
            </div>

            <h2 style={{
              fontFamily: "'Syne', 'Fraunces', serif",
              fontSize: 'clamp(2rem, 3.8vw, 3.2rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
              color: '#EDE7DC',
              marginBottom: '1.25rem'
            }}>
              The Physical Archive of Real Senior Offers.
            </h2>

            <p style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: '1rem',
              lineHeight: 1.7,
              color: '#9EA5A8',
              marginBottom: '2rem',
              maxWidth: '480px'
            }}>
              Flip through the raw interview playbooks and verified placement records from SPIT seniors who cracked Morgan Stanley, Microsoft, Google, and top quant firms. Throw cards aside to discover the next offer.
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button 
                onClick={() => navigate('/stories')}
                className="btn btn-primary"
                style={{
                  backgroundColor: '#EDE7DC',
                  color: '#0A0C0E',
                  padding: '0.85rem 1.8rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  borderRadius: '30px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'transform 0.2s ease',
                  fontFamily: "'Sora', sans-serif"
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Browse All Stories <ArrowRight size={16} />
              </button>

              <button 
                onClick={() => navigate('/resources')}
                className="btn btn-secondary"
                style={{
                  backgroundColor: 'transparent',
                  color: '#EDE7DC',
                  padding: '0.85rem 1.6rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  borderRadius: '30px',
                  border: '1px solid rgba(237, 231, 220, 0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: "'Sora', sans-serif"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#EDE7DC';
                  e.currentTarget.style.backgroundColor = 'rgba(237, 231, 220, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(237, 231, 220, 0.2)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Study Materials
              </button>
            </div>

            {/* Hint Line & Keyboard Controls */}
            <div style={{ 
              marginTop: '2.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              fontFamily: "'Sora', sans-serif",
              fontSize: '11px',
              color: '#6C7378',
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}>
              <span>Swipe or throw cards</span>
              <span style={{ color: '#E8913C' }}>•</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button 
                  onClick={() => throwTopCard('left')}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(237, 231, 220, 0.06)',
                    border: '1px solid rgba(237, 231, 220, 0.15)',
                    color: '#EDE7DC',
                    cursor: 'pointer',
                    fontSize: '10px'
                  }}
                  title="Previous (Left Arrow)"
                >
                  ←
                </button>
                <button 
                  onClick={() => throwTopCard('right')}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(237, 231, 220, 0.06)',
                    border: '1px solid rgba(237, 231, 220, 0.15)',
                    color: '#EDE7DC',
                    cursor: 'pointer',
                    fontSize: '10px'
                  }}
                  title="Next (Right Arrow)"
                >
                  →
                </button>
              </div>
              <span>Use arrow keys</span>
            </div>
          </div>

          {/* Column 2: Throwable Physical Deck */}
          <div 
            ref={deckRef}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '380px',
              height: '460px',
              margin: '0 auto',
              outline: 'none',
              touchAction: 'pan-y', // allows vertical page scroll on mobile
              userSelect: 'none'
            }}
          >
            {cards.slice(0, 4).reverse().map((card, reverseIdx) => {
              // reverseIdx: 0 is bottom-most card in the rendered stack, 3 is the top card
              const stackIndex = 3 - reverseIdx; // 0 = top card, 1 = 2nd card, 2 = 3rd card...
              const isTop = stackIndex === 0;
              const isThrown = thrownCard && thrownCard.id === card.id;

              // Physical stack offset values
              const offsetX = stackIndex * 10;
              const offsetY = stackIndex * 12;
              const scale = 1 - stackIndex * 0.04;
              const baseRotation = (stackIndex % 2 === 0 ? 1 : -1) * (stackIndex * 2.2);

              let currentTransform = '';
              let currentTransition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease';

              if (isTop) {
                if (isThrown) {
                  const throwX = thrownCard.dir === 'right' ? '140%' : '-140%';
                  const throwRot = thrownCard.dir === 'right' ? 24 : -24;
                  currentTransform = `translate(${throwX}, -20px) rotate(${throwRot}deg) scale(0.95)`;
                  currentTransition = 'transform 0.42s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.42s ease';
                } else if (dragState && dragState.isDragging) {
                  currentTransform = `translate(${currentDeltaX}px, ${currentDeltaY * 0.4}px) rotate(${rotationAngle}deg) scale(1.03)`;
                  currentTransition = 'none'; // instantaneous tracking
                } else {
                  currentTransform = `translate(0px, 0px) rotate(0deg) scale(1)`;
                }
              } else {
                currentTransform = `translate(${offsetX}px, ${offsetY}px) rotate(${baseRotation}deg) scale(${scale})`;
              }

              return (
                <div
                  key={card.id}
                  onPointerDown={isTop ? handlePointerDown : undefined}
                  onPointerMove={isTop ? handlePointerMove : undefined}
                  onPointerUp={isTop ? handlePointerUp : undefined}
                  onPointerCancel={isTop ? handlePointerUp : undefined}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '420px',
                    borderRadius: '20px',
                    backgroundColor: '#101317',
                    border: '1px solid rgba(237, 231, 220, 0.12)',
                    boxShadow: isTop 
                      ? '0 24px 48px rgba(0, 0, 0, 0.75), 0 4px 12px rgba(0, 0, 0, 0.4)' 
                      : '0 12px 24px rgba(0, 0, 0, 0.4)',
                    padding: '1.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: isTop ? (dragState?.isDragging ? 'grabbing' : 'grab') : 'default',
                    transform: currentTransform,
                    transition: currentTransition,
                    zIndex: isTop ? 10 : (4 - stackIndex),
                    opacity: isThrown ? 0 : 1,
                    overflow: 'hidden'
                  }}
                >
                  {/* Card Subtle Top Header */}
                  <div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1.25rem'
                    }}>
                      <span style={{
                        fontFamily: "'Sora', sans-serif",
                        fontSize: '10.5px',
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: card.accent,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: card.accent }} />
                        {card.tag}
                      </span>

                      <span style={{
                        fontFamily: "'Sora', sans-serif",
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#EDE7DC',
                        backgroundColor: 'rgba(237, 231, 220, 0.08)',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        border: '1px solid rgba(237, 231, 220, 0.1)'
                      }}>
                        {card.tier}
                      </span>
                    </div>

                    <h3 style={{
                      fontFamily: "'Syne', 'Fraunces', serif",
                      fontSize: '1.75rem',
                      fontWeight: 800,
                      color: '#EDE7DC',
                      letterSpacing: '-0.02em',
                      marginBottom: '0.35rem'
                    }}>
                      {card.company}
                    </h3>

                    <div style={{
                      fontFamily: "'Sora', sans-serif",
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: '#E8913C',
                      marginBottom: '0.5rem'
                    }}>
                      {card.role}
                    </div>

                    <div style={{
                      fontFamily: "'Sora', sans-serif",
                      fontSize: '0.8rem',
                      color: '#9EA5A8',
                      marginBottom: '1.25rem'
                    }}>
                      {card.candidate}
                    </div>

                    <p style={{
                      fontFamily: "'Sora', sans-serif",
                      fontSize: '0.85rem',
                      lineHeight: 1.6,
                      color: '#EDE7DC',
                      opacity: 0.85
                    }}>
                      "{card.summary}"
                    </p>
                  </div>

                  {/* Card Footer Strip with CTC & CTA */}
                  <div style={{
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(237, 231, 220, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6C7378' }}>
                        Package / CTC
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#EDE7DC', fontFamily: "'Syne', sans-serif" }}>
                        {card.ctc}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/stories');
                      }}
                      style={{
                        padding: '0.45rem 0.9rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        backgroundColor: 'rgba(237, 231, 220, 0.1)',
                        border: '1px solid rgba(237, 231, 220, 0.2)',
                        borderRadius: '20px',
                        color: '#EDE7DC',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      Read Guide <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Progress Dots Beneath Deck */}
            <div style={{
              position: 'absolute',
              bottom: '-32px',
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              gap: '6px'
            }}>
              {DECK_CARDS.map((c, i) => (
                <div 
                  key={c.id}
                  style={{
                    width: cards[0]?.id === c.id ? '20px' : '6px',
                    height: '6px',
                    borderRadius: '4px',
                    backgroundColor: cards[0]?.id === c.id ? '#E8913C' : 'rgba(237, 231, 220, 0.2)',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
