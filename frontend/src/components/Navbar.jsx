import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Shield, Menu, X, User as UserIcon, GraduationCap, BookOpen, Calendar, ChevronDown } from 'lucide-react';
import { requestProfileEdit } from '../utils/db';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(() => {
    const currentUser = localStorage.getItem('loop_current_user');
    return currentUser ? JSON.parse(currentUser) : null;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Profile modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Student');
  const [branch, setBranch] = useState('CSE');
  const [cseSpecialization, setCseSpecialization] = useState('CSE');
  const [currentYear, setCurrentYear] = useState('First Year');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize profile form values when modal opens or user updates
  useEffect(() => {
    if (user && showProfileModal) {
      const activeBranch = user.hasPendingEdit ? user.pendingBranch : user.branch;
      const isCse = ['CSE', 'CSE AI', 'CSE DS'].includes(activeBranch);
      
      setName(user.hasPendingEdit ? user.pendingName : (user.name || ''));
      setRole(user.hasPendingEdit ? user.pendingRole : (user.role || 'Student'));
      setBranch(isCse ? 'CSE' : (activeBranch || 'CSE'));
      setCseSpecialization(isCse ? activeBranch : 'CSE');
      setCurrentYear(user.hasPendingEdit ? user.pendingCurrentYear : (user.currentYear || 'First Year'));
    }
  }, [user, showProfileModal]);

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

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await requestProfileEdit(user.email, {
        name: name.trim(),
        role,
        branch: branch === 'CSE' ? cseSpecialization : branch,
        currentYear
      });

      // Update local storage session
      localStorage.setItem('loop_current_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setSuccess('Your profile edit request has been submitted to the administrator for approval.');
    } catch (err) {
      setError(err.message || 'Failed to submit edit request.');
    } finally {
      setLoading(false);
    }
  };

  // Do not display navbar on login page or onboarding page
  if (location.pathname === '/login' || location.pathname === '/onboarding') {
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
          fontFamily: 'var(--font-sans)',
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
            fontFamily: 'var(--font-sans)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginRight: '-0.2em' // Offset letter-spacing offset
          }}>
            <img 
              src="/favicon.png" 
              alt="LOOP Logo" 
              style={{ 
                height: '26px', 
                width: 'auto', 
                filter: 'var(--logo-filter)',
                marginRight: '0.2rem'
              }} 
            />
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
          fontFamily: 'var(--font-sans)',
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
                <span 
                  onClick={() => setShowProfileModal(true)}
                  className="badge" 
                  style={{ 
                    textTransform: 'none', 
                    fontSize: '0.85rem', 
                    padding: '0.25rem 0.75rem', 
                    cursor: 'pointer',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    borderRadius: '20px',
                    transition: 'all 0.2s ease',
                    fontWeight: 500
                  }}
                  title="Click to view/edit profile"
                >
                  {user.name || user.email.split('@')[0]}
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
          backdropFilter: 'var(--glass-blur)',
          maxHeight: 'calc(100vh - 80px)',
          overflowY: 'auto'
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

      {/* Profile Modal */}
      {showProfileModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            width: '100%',
            maxWidth: '450px',
            padding: '2.5rem 2rem',
            borderRadius: '24px',
            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.4)',
            position: 'relative'
          }}>
            <button 
              onClick={() => { setShowProfileModal(false); setError(''); setSuccess(''); }}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                User Profile
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                {user.email}
              </p>
            </div>

            {user.hasPendingEdit && (
              <div style={{
                backgroundColor: 'rgba(255, 149, 0, 0.1)',
                border: '1px solid rgba(255, 149, 0, 0.2)',
                color: '#ff9500',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                fontSize: '0.8rem',
                marginBottom: '1.25rem',
                textAlign: 'center',
                fontWeight: 500
              }}>
                Your profile edit request is pending administrator approval.
              </div>
            )}

            {error && (
              <div style={{
                backgroundColor: 'rgba(255, 69, 58, 0.1)',
                border: '1px solid rgba(255, 69, 58, 0.2)',
                color: '#ff453a',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                textAlign: 'left'
              }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{
                backgroundColor: 'rgba(52, 199, 89, 0.1)',
                border: '1px solid rgba(52, 199, 89, 0.2)',
                color: '#34c759',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                textAlign: 'center',
                fontWeight: 500
              }}>
                {success}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Name field */}
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <UserIcon size={16} style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-secondary)',
                    pointerEvents: 'none'
                  }} />
                  <input
                    type="text"
                    className="input-field"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ paddingLeft: '2.75rem' }}
                    disabled={loading || user.hasPendingEdit}
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              {/* Role select */}
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Role</label>
                <div style={{ position: 'relative' }}>
                  <GraduationCap size={16} style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-secondary)',
                    pointerEvents: 'none'
                  }} />
                  <select
                    className="input-field"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{ 
                      paddingLeft: '2.75rem',
                      paddingRight: '2.5rem',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      cursor: user.hasPendingEdit ? 'not-allowed' : 'pointer'
                    }}
                    disabled={loading || user.hasPendingEdit}
                  >
                    <option value="Student">Student</option>
                    <option value="Senior / Contributor">Senior / Contributor</option>
                    <option value="Alumni / Contributor">Alumni / Contributor</option>
                  </select>
                  <ChevronDown size={16} style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-secondary)',
                    pointerEvents: 'none'
                  }} />
                </div>
              </div>

              {/* Branch select */}
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Branch</label>
                <div style={{ position: 'relative' }}>
                  <BookOpen size={16} style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-secondary)',
                    pointerEvents: 'none'
                  }} />
                  <select
                    className="input-field"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    style={{ 
                      paddingLeft: '2.75rem',
                      paddingRight: '2.5rem',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      cursor: user.hasPendingEdit ? 'not-allowed' : 'pointer'
                    }}
                    disabled={loading || user.hasPendingEdit}
                  >
                    <option value="CSE">CSE</option>
                    <option value="CE">CE</option>
                    <option value="EXTC">EXTC</option>
                  </select>
                  <ChevronDown size={16} style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-secondary)',
                    pointerEvents: 'none'
                  }} />
                </div>
              </div>

              {/* Specialization (if CSE) */}
              {branch === 'CSE' && (
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Specialization</label>
                  <div style={{ position: 'relative' }}>
                    <BookOpen size={16} style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-secondary)',
                      pointerEvents: 'none'
                    }} />
                    <select
                      className="input-field"
                      value={cseSpecialization}
                      onChange={(e) => setCseSpecialization(e.target.value)}
                      style={{ 
                        paddingLeft: '2.75rem',
                        paddingRight: '2.5rem',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        cursor: user.hasPendingEdit ? 'not-allowed' : 'pointer'
                      }}
                      disabled={loading || user.hasPendingEdit}
                    >
                      <option value="CSE">CSE</option>
                      <option value="CSE AI">CSE AI</option>
                      <option value="CSE DS">CSE DS</option>
                    </select>
                    <ChevronDown size={16} style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-secondary)',
                      pointerEvents: 'none'
                    }} />
                  </div>
                </div>
              )}

              {/* Current Year select */}
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Current Year</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-secondary)',
                    pointerEvents: 'none'
                  }} />
                  <select
                    className="input-field"
                    value={currentYear}
                    onChange={(e) => setCurrentYear(e.target.value)}
                    style={{ 
                      paddingLeft: '2.75rem',
                      paddingRight: '2.5rem',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      cursor: user.hasPendingEdit ? 'not-allowed' : 'pointer'
                    }}
                    disabled={loading || user.hasPendingEdit}
                  >
                    <option value="First Year">First Year</option>
                    <option value="Second Year">Second Year</option>
                    <option value="Third Year">Third Year</option>
                    <option value="Fourth Year">Fourth Year</option>
                    <option value="Alumnus / Graduate">Alumnus / Graduate</option>
                  </select>
                  <ChevronDown size={16} style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-secondary)',
                    pointerEvents: 'none'
                  }} />
                </div>
              </div>

              {!user.hasPendingEdit && (
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.8rem',
                    borderRadius: '12px',
                    width: '100%',
                    border: 'none',
                    backgroundColor: 'var(--accent-color)',
                    color: 'var(--accent-inverse)',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Request Profile Edit'}
                </button>
              )}
            </form>
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
