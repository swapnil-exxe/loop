import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAchievements } from '../utils/db';
import { ArrowLeft, Calendar } from 'lucide-react';

const parsePosition = (posStr) => {
  if (!posStr) return { x: 50, y: 50, zoom: 1.0 };
  if (posStr === 'center') return { x: 50, y: 50, zoom: 1.0 };
  if (posStr === 'top') return { x: 50, y: 0, zoom: 1.0 };
  if (posStr === 'bottom') return { x: 50, y: 100, zoom: 1.0 };
  if (posStr === 'left') return { x: 0, y: 50, zoom: 1.0 };
  if (posStr === 'right') return { x: 100, y: 50, zoom: 1.0 };
  if (posStr.startsWith('crop:')) return { x: 50, y: 50, zoom: 1.0 };
  const parts = posStr.split(' ');
  const x = parseInt(parts[0]) || 50;
  const y = parseInt(parts[1]) || 50;
  const zoom = parseFloat(parts[2]) || 1.0;
  return { x, y, zoom };
};

const parseCrop = (posStr) => {
  const defaults = {
    outer: { x: 10, y: 10, w: 80, h: 61 },
    inner: { x: 10, y: 10, w: 80, h: 33 }
  };
  if (!posStr || !posStr.startsWith('crop:')) return defaults;
  try {
    const parts = posStr.replace('crop:', '').split(';');
    if (parts.length >= 2) {
      const outerParts = parts[0].split(',').map(Number);
      const innerParts = parts[1].split(',').map(Number);
      return {
        outer: { x: outerParts[0] ?? 10, y: outerParts[1] ?? 10, w: outerParts[2] ?? 80, h: outerParts[3] ?? 61 },
        inner: { x: innerParts[0] ?? 10, y: innerParts[1] ?? 10, w: innerParts[2] ?? 80, h: innerParts[3] ?? 33 }
      };
    }
  } catch (e) {
    console.error("Error parsing crop string:", e);
  }
  return defaults;
};

export default function AchievementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [achievement, setAchievement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAchievements().then(data => {
      const found = data.find(a => String(a.id) === String(id));
      setAchievement(found);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '5rem', paddingBottom: '5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      </div>
    );
  }

  if (!achievement) {
    return (
      <div className="container" style={{ paddingTop: '5rem', paddingBottom: '5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Achievement not found.</p>
        <button onClick={() => navigate('/achievements')} className="btn btn-primary">
          Back to Achievements
        </button>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '6.5rem', paddingBottom: '6rem', maxWidth: '1000px' }}>
      
      {/* Back link */}
      <button 
        onClick={() => navigate('/achievements')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
          padding: 0,
          marginBottom: '2.5rem',
          transition: 'color 0.2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
      >
        <ArrowLeft size={16} />
        <span>Back to Achievements</span>
      </button>

      {/* Image (Top - Under back link) */}
      {(() => {
        const isCrop = achievement.imageFit === 'crop' && achievement.imagePosition && achievement.imagePosition.startsWith('crop:');
        if (isCrop) {
          const cropData = parseCrop(achievement.imagePosition);
          const { x, y, w, h } = cropData.inner;
          return (
            <div style={{
              width: '100%',
              height: '380px',
              borderRadius: '24px',
              overflow: 'hidden',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              marginBottom: '3.5rem',
              position: 'relative'
            }}>
              <img 
                src={achievement.image} 
                alt={achievement.title} 
                style={{
                  position: 'absolute',
                  width: `${10000 / w}%`,
                  height: `${10000 / h}%`,
                  left: `${-x * (100 / w)}%`,
                  top: `${-y * (100 / h)}%`,
                  objectFit: 'cover'
                }}
              />
            </div>
          );
        }
        
        const p = parsePosition(achievement.imagePosition);
        return (
          <div style={{
            width: '100%',
            borderRadius: '24px',
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            marginBottom: '3.5rem'
          }}>
            <img 
              src={achievement.image} 
              alt={achievement.title} 
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '500px',
                objectFit: achievement.imageFit || 'cover',
                objectPosition: `${p.x}% ${p.y}%`,
                transform: `scale(${p.zoom})`,
                transformOrigin: 'center',
                display: 'block'
              }}
            />
          </div>
        );
      })()}

      {/* Two Column Layout Block */}
      <div className="achievement-detail-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 2fr',
        gap: '4rem',
        alignItems: 'start'
      }}>
        
        {/* Left Column: Title & Metadata */}
        <div>
          {/* Meta Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
            <span 
              className="badge"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '0.35rem 0.9rem',
                borderRadius: '12px'
              }}
            >
              {achievement.category}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
              <Calendar size={14} />
              <span style={{ fontSize: '0.8rem' }}>
                {new Date(achievement.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: '2.2rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            lineHeight: '1.25',
            margin: 0,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-display)'
          }}>
            {achievement.title}
          </h1>
        </div>

        {/* Right Column: Full Description */}
        <div style={{
          fontSize: '1.05rem',
          color: 'var(--text-primary)',
          lineHeight: '1.85',
          whiteSpace: 'pre-line'
        }}>
          {achievement.description}
        </div>

      </div>

      <style>{`
        @media (max-width: 768px) {
          .achievement-detail-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
        }
      `}</style>
    </div>
  );
}
