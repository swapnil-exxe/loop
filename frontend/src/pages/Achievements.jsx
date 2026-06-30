import { useState, useEffect } from 'react';
import { Calendar, ArrowUpRight, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAchievements } from '../utils/db';
import { useCachedData } from '../hooks/useCachedData';

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
    outer: { x: 10, y: 0, w: 80, h: 33 },
    inner: { x: 10, y: 0, w: 80, h: 24 }
  };
  if (!posStr || !posStr.startsWith('crop:')) return defaults;
  try {
    const parts = posStr.replace('crop:', '').split(';');
    if (parts.length >= 2) {
      const outerParts = parts[0].split(',').map(Number);
      const innerParts = parts[1].split(',').map(Number);
      return {
        outer: { x: outerParts[0] ?? 10, y: outerParts[1] ?? 0, w: outerParts[2] ?? 80, h: outerParts[3] ?? 33 },
        inner: { x: innerParts[0] ?? 10, y: innerParts[1] ?? 0, w: innerParts[2] ?? 80, h: innerParts[3] ?? 24 }
      };
    }
  } catch (e) {
    console.error("Error parsing crop string:", e);
  }
  return defaults;
};

const parseSliders = (posStr) => {
  const defaults = {
    outer: { x: 48, y: 0, zoom: 1.8 },
    inner: { x: 50, y: 50, zoom: 1.0 }
  };
  if (!posStr) return defaults;
  if (posStr.startsWith('sliders:')) {
    try {
      const parts = posStr.replace('sliders:', '').split(';');
      if (parts.length >= 2) {
        const outerParts = parts[0].split(',');
        const innerParts = parts[1].split(',');
        return {
          outer: {
            x: isNaN(parseInt(outerParts[0])) ? 48 : parseInt(outerParts[0]),
            y: isNaN(parseInt(outerParts[1])) ? 0 : parseInt(outerParts[1]),
            zoom: isNaN(parseFloat(outerParts[2])) ? 1.8 : parseFloat(outerParts[2])
          },
          inner: {
            x: isNaN(parseInt(innerParts[0])) ? 50 : parseInt(innerParts[0]),
            y: isNaN(parseInt(innerParts[1])) ? 50 : parseInt(innerParts[1]),
            zoom: isNaN(parseFloat(innerParts[2])) ? 1.0 : parseFloat(innerParts[2])
          }
        };
      }
    } catch (e) {
      console.error("Error parsing sliders string:", e);
    }
  }
  const p = parsePosition(posStr);
  return {
    outer: { ...p },
    inner: { ...p }
  };
};

export default function Achievements() {
  const { data: cachedAchievements, loading, error: fetchError } = useCachedData('achievements', getAchievements);
  const achievements = cachedAchievements || [];
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (fetchError) {
      setError('Connection issue: Unable to fetch achievements from server.');
    } else {
      setError(null);
    }
  }, [fetchError]);

  const categories = [
    'ALL',
    'Hackathon Winners',
    'Placement Successes',
    'Internship Achievements',
    'Competition Winners',
    'Research Publications'
  ];

  const filteredAchievements = achievements.filter(a => {
    const matchesCategory = selectedCategory === 'ALL' || a.category === selectedCategory;
    const matchesSearch = searchQuery.trim() === '' || 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const sortedAndFilteredAchievements = [...filteredAchievements].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '6.5rem', paddingBottom: '5rem' }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
          SPIT News & Achievements
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Celebrating excellence, academic milestones, and student leadership across various domains.
        </p>
      </div>

      {error && (
        <div style={{
          backgroundColor: 'rgba(255, 69, 58, 0.1)',
          border: '1px solid rgba(255, 69, 58, 0.2)',
          color: '#ff453a',
          borderRadius: '12px',
          padding: '1rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.9rem',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontWeight: 500 }}>⚠️ Connection Issue: Unable to connect to the server. Please check your database connection or backend status.</span>
          <button 
            onClick={fetchAchievements} 
            className="btn btn-secondary" 
            style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', borderColor: '#ff453a', color: '#ff453a', borderRadius: '8px', background: 'transparent' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 69, 58, 0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Search and Sort Filter Block */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {/* Search Input Filter */}
        <div style={{
          position: 'relative',
          flex: '1',
          minWidth: '280px',
          maxWidth: '500px'
        }}>
          <span style={{
            position: 'absolute',
            left: '1.25rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search size={18} />
          </span>
          <input 
            type="text"
            placeholder="Search achievements by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.85rem 1.25rem 0.85rem 3rem',
              fontSize: '0.95rem',
              borderRadius: '24px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'all 0.3s ease'
            }}
            className="search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '1.25rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                padding: 0
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '0.6rem 2rem 0.6rem 1rem',
              fontSize: '0.9rem',
              borderRadius: '24px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
              backgroundImage: 'url("data:image/svg+xml;utf8,<svg fill=\'%23111111\' height=\'24\' viewBox=\'0 0 24 24\' width=\'24\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/><path d=\'M0 0h24v24H0z\' fill=\'none\'/></svg>")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
              backgroundSize: '16px'
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Categories Filter Panel */}
      <div style={{
        display: 'flex',
        gap: '0.6rem',
        flexWrap: 'wrap',
        marginBottom: '3rem',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '2rem'
      }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className="btn"
            style={{
              padding: '0.45rem 1.1rem',
              fontSize: '0.85rem',
              borderRadius: '16px',
              backgroundColor: selectedCategory === cat ? 'var(--text-primary)' : 'var(--bg-secondary)',
              color: selectedCategory === cat ? 'var(--accent-inverse)' : 'var(--text-primary)',
              border: `1px solid ${selectedCategory === cat ? 'var(--text-primary)' : 'var(--border-color)'}`
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {[1, 2].map((n) => (
            <div 
              key={n}
              className="loop-card skeleton-pulse"
              style={{
                padding: '2.4rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                borderRadius: '20px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                minHeight: '260px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ height: '1.5rem', width: '120px', backgroundColor: 'var(--border-color)', borderRadius: '12px' }} />
                <div style={{ height: '1rem', width: '80px', backgroundColor: 'var(--border-color)', borderRadius: '4px' }} />
              </div>
              <div>
                <div style={{ height: '1.8rem', width: '60%', backgroundColor: 'var(--border-color)', borderRadius: '4px', marginBottom: '0.75rem' }} />
                <div style={{ height: '1.2rem', width: '90%', backgroundColor: 'var(--border-color)', borderRadius: '4px', marginBottom: '0.5rem' }} />
                <div style={{ height: '1.2rem', width: '80%', backgroundColor: 'var(--border-color)', borderRadius: '4px' }} />
              </div>
              <div style={{ height: '120px', backgroundColor: 'var(--border-color)', borderRadius: '12px' }} />
            </div>
          ))}
        </div>
      ) : sortedAndFilteredAchievements.length > 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2.5rem'
        }}>
          {sortedAndFilteredAchievements.map((item) => (
            <article 
              key={item.id} 
              onClick={() => navigate(`/achievements/${item.id}`)}
              className="loop-card achievement-card"
              style={{
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                cursor: 'pointer',
                borderRadius: '20px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                transition: 'all 0.3s ease'
              }}
            >
              {/* Card Header (Meta Info) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span 
                  className="badge"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '0.3rem 0.8rem',
                    borderRadius: '12px'
                  }}
                >
                  {item.category}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={12} style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {new Date(item.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h3 style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  lineHeight: '1.3',
                  marginBottom: '0.75rem',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-display)'
                }}>
                  {item.title}
                </h3>
                <p style={{
                  fontSize: '0.92rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6',
                  margin: 0
                }}>
                  {item.description && item.description.length > 180 
                    ? item.description.slice(0, 180) + '...' 
                    : item.description}
                </p>
              </div>

              {/* Image under text */}
              <div style={{
                width: '100%',
                aspectRatio: '2.42 / 1',
                overflow: 'hidden',
                borderRadius: '12px',
                position: 'relative',
                backgroundColor: 'var(--bg-secondary)'
              }}>
                {(() => {
                  const isCrop = item.imageFit === 'crop' && item.imagePosition && item.imagePosition.startsWith('crop:');
                  if (isCrop) {
                    const cropData = parseCrop(item.imagePosition);
                    const { x, y, w, h } = cropData.outer;
                    return (
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        style={{
                          position: 'absolute',
                          width: `${10000 / w}%`,
                          height: `${10000 / h}%`,
                          left: `${-x * (100 / w)}%`,
                          top: `${-y * (100 / h)}%`,
                          objectFit: 'cover',
                          transition: 'transform 0.5s ease',
                          transformOrigin: 'center',
                          '--zoom-scale': 1.0,
                          transform: 'scale(var(--zoom-scale))'
                        }}
                        className="achievement-image"
                      />
                    );
                  }
                  if (item.imageFit === 'cover') {
                    const slidersData = parseSliders(item.imagePosition);
                    const p = slidersData.outer;
                    return (
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        style={{
                          position: 'absolute',
                          width: `${p.zoom * 100}%`,
                          height: `${p.zoom * 100}%`,
                          left: `${-p.x * (p.zoom - 1)}%`,
                          top: `${-p.y * (p.zoom - 1)}%`,
                          objectFit: 'cover',
                          objectPosition: `${p.x}% ${p.y}%`,
                          transition: 'transform 0.5s ease',
                          transformOrigin: 'center',
                          '--zoom-scale': 1.0,
                          transform: 'scale(var(--zoom-scale))'
                        }}
                        className="achievement-image"
                      />
                    );
                  }
                  const p = parsePosition(item.imagePosition);
                  return (
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: item.imageFit || 'cover',
                        objectPosition: `${p.x}% ${p.y}%`,
                        transition: 'transform 0.5s ease',
                        transformOrigin: 'center',
                        '--zoom-scale': p.zoom,
                        transform: 'scale(var(--zoom-scale))'
                      }}
                      className="achievement-image"
                    />
                  );
                })()}
              </div>

              {/* Footer action */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
                fontWeight: 600
              }}>
                <span>Tap to open</span>
                <ArrowUpRight size={14} />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="glass-panel" style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          borderRadius: '20px',
          color: 'var(--text-secondary)'
        }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No achievements found matching your criteria.</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            {selectedCategory !== 'ALL' && (
              <button onClick={() => setSelectedCategory('ALL')} className="btn btn-secondary">
                Reset Category
              </button>
            )}
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="btn btn-secondary">
                Clear Search
              </button>
            )}
          </div>
        </div>
      )}

       {/* CSS Effects */}
      <style>{`
        .achievement-card {
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .achievement-card:hover {
          transform: translateY(-4px);
          border-color: var(--text-secondary);
          box-shadow: var(--card-shadow);
        }
        .achievement-card:hover .achievement-image {
          transform: scale(calc(var(--zoom-scale, 1) * 1.02)) !important;
        }
        .search-input:focus {
          border-color: var(--text-primary) !important;
          box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.05);
        }
      `}</style>
    </div>
  );
}
