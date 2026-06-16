import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Shield, Menu, X } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(() => {
    const currentUser = localStorage.getItem('loop_current_user');
    return currentUser ? JSON.parse(currentUser) : null;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check for user session
    const currentUser = localStorage.getItem('loop_current_user');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(currentUser ? JSON.parse(currentUser) : null);

    // Enforce light theme by default, just like Hinge
    document.documentElement.setAttribute('data-theme', 'light');
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('loop_current_user');
    setUser(null);
    navigate('/login');
  };

  // Do not display navbar on login page
  if (location.pathname === '/login') {
    return null;
  }

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="glass-panel" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      borderBottom: '1px solid var(--border-color)',
      padding: '1.25rem 0',
      transition: 'all 0.3s ease'
    }}>
      <div className="container navbar-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        width: '100%'
      }}>
        
        {/* COLUMN 1: LEFT NAV LINKS (Desktop only) */}
        <div className="nav-col-left" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
          fontFamily: 'var(--font-display)',
          fontSize: '0.9rem',
          fontWeight: 600,
          letterSpacing: '0.03em'
        }}>
          <Link to="/stories" style={{
            color: isActive('/stories') ? 'var(--text-primary)' : 'var(--text-secondary)',
            position: 'relative',
            transition: 'color 0.2s ease'
          }}>
            Stories
            {isActive('/stories') && <span style={{ position: 'absolute', bottom: '-21px', left: 0, right: 0, height: '2.5px', backgroundColor: 'var(--text-primary)' }} />}
          </Link>
          
          <Link to="/resources" style={{
            color: isActive('/resources') ? 'var(--text-primary)' : 'var(--text-secondary)',
            position: 'relative',
            transition: 'color 0.2s ease'
          }}>
            Resources
            {isActive('/resources') && <span style={{ position: 'absolute', bottom: '-21px', left: 0, right: 0, height: '2.5px', backgroundColor: 'var(--text-primary)' }} />}
          </Link>
        </div>

        {/* COLUMN 2: CENTER LOGO */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Link to="/" style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginRight: '-0.2em' // Offset letter-spacing offset
          }}>
            Loop
            <span style={{
              fontSize: '0.55rem',
              letterSpacing: '0.02em',
              padding: '1px 5px',
              border: '1px solid var(--text-primary)',
              borderRadius: '4px',
              fontWeight: '700'
            }}>SPIT</span>
          </Link>
        </div>

        {/* COLUMN 3: RIGHT NAV ACTIONS (Desktop only) */}
        <div className="nav-col-right" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '1.5rem',
          fontFamily: 'var(--font-display)',
          fontSize: '0.9rem',
          fontWeight: 600
        }}>
          <Link to="/achievements" style={{
            color: isActive('/achievements') ? 'var(--text-primary)' : 'var(--text-secondary)',
            position: 'relative',
            transition: 'color 0.2s ease'
          }}>
            Achievements
            {isActive('/achievements') && <span style={{ position: 'absolute', bottom: '-21px', left: 0, right: 0, height: '2.5px', backgroundColor: 'var(--text-primary)' }} />}
          </Link>

          {user?.isAdmin && (
            <Link to="/admin" style={{
              color: isActive('/admin') ? 'var(--text-primary)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '4px 10px',
              border: '1px dashed var(--border-color)',
              borderRadius: '8px',
              fontSize: '0.85rem'
            }}>
              <Shield size={13} />
              Admin
            </Link>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            borderLeft: '1px solid var(--border-color)',
            paddingLeft: '1.25rem'
          }}>


            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="badge" style={{ textTransform: 'lowercase', fontSize: '0.65rem', padding: '0.2rem 0.5rem' }}>
                  {user.email.split('@')[0]}
                </span>
                <button 
                  onClick={handleLogout} 
                  className="btn btn-secondary" 
                  style={{ padding: '0.45rem 0.85rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}
                >
                  <LogOut size={12} />
                  <span>Exit</span>
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary" style={{ padding: '0.45rem 1.1rem', borderRadius: '20px', fontSize: '0.8rem' }}>
                Login
              </Link>
            )}
          </div>
        </div>

        {/* MOBILE MENU TOGGLE (Mobile only) */}
        <div className="mobile-nav-toggle" style={{ display: 'none' }}>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn btn-secondary" 
            style={{ padding: '0.5rem', borderRadius: '50%', border: 'none' }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {mobileMenuOpen && (
        <div className="glass-panel animate-fade-in" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          borderBottom: '1px solid var(--border-color)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          backdropFilter: 'var(--glass-blur)'
        }}>
          <Link to="/stories" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.1rem', fontWeight: 600 }}>
            Stories
          </Link>
          <Link to="/resources" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.1rem', fontWeight: 600 }}>
            Resources
          </Link>
          <Link to="/achievements" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.1rem', fontWeight: 600 }}>
            Achievements
          </Link>

          {user?.isAdmin && (
            <Link to="/admin" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={16} /> Admin Panel
            </Link>
          )}
          <hr style={{ border: 0, borderTop: '1px solid var(--border-color)' }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            {user ? (
              <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                Logout
              </button>
            ) : (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                Login
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Inline styles for responsive grid */}
      <style>{`
        @media (max-width: 900px) {
          .navbar-grid {
            grid-template-columns: 1fr auto !important;
          }
          .nav-col-left, .nav-col-right {
            display: none !important;
          }
          .mobile-nav-toggle {
            display: flex !important;
            justify-content: flex-end;
          }
        }
      `}</style>
    </nav>
  );
}
