import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Lock, Mail, UserPlus, LogIn, Eye, EyeOff, ShieldCheck, Sparkles, Check } from 'lucide-react';
import { loginUser, requestRegistration } from '../utils/db';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isRegisterMode = searchParams.get('mode') === 'register';
  const setIsRegisterMode = (isReg) => {
    setSearchParams(isReg ? { mode: 'register' } : {});
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Dual Video Architecture for Butter-Smooth Transitions
  // IDLE: idle-butterfly.mp4 (4.0s seamless loop of character watching butterfly)
  // ACTIVE: character-login.mp4 (1.5-4.5s Email | 4.5-7.5s Password | 7.5-10.0s Login)
  const [characterState, setCharacterState] = useState('IDLE');
  const idleVideoRef = useRef(null);
  const actionVideoRef = useRef(null);
  const stateRef = useRef('IDLE');

  // Trigger video transitions smoothly
  const triggerCharacterState = useCallback((newState) => {
    if (stateRef.current === newState) return;
    
    stateRef.current = newState;
    setCharacterState(newState);

    const idleVideo = idleVideoRef.current;
    const actionVideo = actionVideoRef.current;

    try {
      if (newState === 'IDLE') {
        if (idleVideo) {
          idleVideo.play().catch(() => {});
        }
      } else {
        if (actionVideo) {
          if (newState === 'EMAIL_ACTIVE') {
            actionVideo.currentTime = 1.5;
          } else if (newState === 'PASSWORD_ACTIVE') {
            actionVideo.currentTime = 4.5;
          } else if (newState === 'LOGIN_SUBMITTED') {
            actionVideo.currentTime = 7.5;
          }
          actionVideo.play().catch(() => {});
        }
      }
    } catch (e) {
      console.warn("Media transition error:", e);
    }
  }, []);

  // Frame-accurate 60fps loop controller for both video sources
  useEffect(() => {
    let animId = null;

    const checkSegmentLoop = () => {
      const current = stateRef.current;
      const idleVideo = idleVideoRef.current;
      const actionVideo = actionVideoRef.current;

      if (current === 'IDLE') {
        if (idleVideo && !idleVideo.paused) {
          if (idleVideo.currentTime >= 3.9) {
            idleVideo.currentTime = 0.05;
            idleVideo.play().catch(() => {});
          }
        }
      } else {
        if (actionVideo && !actionVideo.paused) {
          const t = actionVideo.currentTime;

          if (current === 'EMAIL_ACTIVE') {
            // 1.5-4.5s: Email typing video loop
            if (t >= 4.45) {
              actionVideo.currentTime = 1.6;
              actionVideo.play().catch(() => {});
            }
          } else if (current === 'PASSWORD_ACTIVE') {
            // 4.5-7.5s: Password looking-away video loop
            if (t >= 7.45) {
              actionVideo.currentTime = 4.8;
              actionVideo.play().catch(() => {});
            }
          } else if (current === 'LOGIN_SUBMITTED') {
            // 7.5-10.0s: Login reaction nod video loop
            if (t >= 9.9) {
              actionVideo.currentTime = 7.8;
              actionVideo.play().catch(() => {});
            }
          }
        }
      }

      animId = requestAnimationFrame(checkSegmentLoop);
    };

    animId = requestAnimationFrame(checkSegmentLoop);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  // Input Focus & Blur Handlers
  const handleEmailFocus = () => {
    if (stateRef.current !== 'LOGIN_SUBMITTED') {
      triggerCharacterState('EMAIL_ACTIVE');
    }
  };

  const handlePasswordFocus = () => {
    if (stateRef.current !== 'LOGIN_SUBMITTED') {
      triggerCharacterState('PASSWORD_ACTIVE');
    }
  };

  const handleInputBlur = (e) => {
    // If focus moved to another input inside our form, don't reset to idle
    const nextTarget = e.relatedTarget;
    if (
      nextTarget &&
      (nextTarget.id === 'email-input' || nextTarget.id === 'password-input')
    ) {
      return;
    }

    // Return to IDLE if blurred outside
    if (!loading && stateRef.current !== 'LOGIN_SUBMITTED') {
      triggerCharacterState('IDLE');
    }
  };

  // Helper to resolve redirect destination
  const getRedirectUrl = () => {
    let target = null;
    const fromState = location.state?.from;
    if (fromState) {
      if (typeof fromState === 'string') {
        target = fromState;
      } else if (fromState.pathname) {
        target = fromState.pathname + (fromState.search || '') + (fromState.hash || '');
      }
    }

    if (!target) {
      target = searchParams.get('redirect') || searchParams.get('returnUrl');
    }

    if (!target) {
      try {
        target = sessionStorage.getItem('loop_redirect_after_login');
      } catch (e) {}
    }

    try {
      sessionStorage.removeItem('loop_redirect_after_login');
    } catch (e) {}

    if (!target || target === '/login' || target === '/') {
      return '/home';
    }

    return target;
  };

  useEffect(() => {
    const fromState = location.state?.from;
    if (fromState) {
      const path = typeof fromState === 'string' ? fromState : fromState.pathname + (fromState.search || '') + (fromState.hash || '');
      if (path && path !== '/login' && path !== '/') {
        try {
          sessionStorage.setItem('loop_redirect_after_login', path);
        } catch (e) {}
      }
    }
    const redirectParam = searchParams.get('redirect') || searchParams.get('returnUrl');
    if (redirectParam && redirectParam !== '/login' && redirectParam !== '/') {
      try {
        sessionStorage.setItem('loop_redirect_after_login', redirectParam);
      } catch (e) {}
    }
  }, [location.state, searchParams]);

  useEffect(() => {
    document.title = isRegisterMode ? 'LOOP | Register' : 'LOOP | Login';
  }, [isRegisterMode]);

  useEffect(() => {
    const userSession = localStorage.getItem('loop_current_user');
    if (userSession) {
      const parsed = JSON.parse(userSession);
      const targetUrl = getRedirectUrl();
      if (parsed.onboarded || parsed.isAdmin) {
        navigate(targetUrl, { replace: true });
      } else {
        navigate('/onboarding', { replace: true, state: { redirectAfter: targetUrl } });
      }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Email is required');
      triggerCharacterState('IDLE');
      return;
    }

    if (!trimmedEmail.endsWith('@spit.ac.in')) {
      setError('Please use your official SPIT email address (@spit.ac.in)');
      triggerCharacterState('IDLE');
      return;
    }

    if (!password) {
      setError('Password is required');
      triggerCharacterState('IDLE');
      return;
    }

    setLoading(true);
    triggerCharacterState('LOGIN_SUBMITTED');

    try {
      if (isRegisterMode) {
        await requestRegistration(trimmedEmail, password);
        setSuccessMsg('Access request submitted successfully! Please wait for administrator approval.');
        setEmail('');
        setPassword('');
        setIsRegisterMode(false);
        triggerCharacterState('IDLE');
      } else {
        const userData = await loginUser(trimmedEmail, password);
        localStorage.setItem('loop_current_user', JSON.stringify(userData));
        
        setTimeout(() => {
          const targetUrl = getRedirectUrl();
          if (userData.onboarded || userData.isAdmin) {
            navigate(targetUrl, { replace: true });
          } else {
            navigate('/onboarding', { replace: true, state: { redirectAfter: targetUrl } });
          }
        }, 500);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
      triggerCharacterState('IDLE');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setSuccessMsg('');
    setLoading(true);
    triggerCharacterState('LOGIN_SUBMITTED');

    try {
      const userData = await loginUser(demoEmail, demoPassword);
      localStorage.setItem('loop_current_user', JSON.stringify(userData));
      setTimeout(() => {
        const targetUrl = getRedirectUrl();
        if (userData.onboarded || userData.isAdmin) {
          navigate(targetUrl, { replace: true });
        } else {
          navigate('/onboarding', { replace: true, state: { redirectAfter: targetUrl } });
        }
      }, 500);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
      triggerCharacterState('IDLE');
    } finally {
      setLoading(false);
    }
  };

  // Status Badge Indicator
  const getStatusBadge = () => {
    switch (characterState) {
      case 'EMAIL_ACTIVE':
        return {
          icon: <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0071E3', boxShadow: '0 0 8px #0071E3' }} />,
          label: 'Watching Email Input',
          color: '#0071E3'
        };
      case 'PASSWORD_ACTIVE':
        return {
          icon: <ShieldCheck size={12} strokeWidth={2.4} style={{ color: '#34C759' }} />,
          label: 'Privacy Mode • Looking Away 🙈',
          color: '#34C759'
        };
      case 'LOGIN_SUBMITTED':
        return {
          icon: <Sparkles size={12} strokeWidth={2.4} style={{ color: '#AF52DE' }} />,
          label: 'Authenticating...',
          color: '#AF52DE'
        };
      case 'IDLE':
      default:
        return {
          icon: <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#8E8E93' }} />,
          label: 'Senior Guide • Ready',
          color: 'var(--text-secondary)'
        };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="login-split-page" style={{
      width: '100vw',
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: 'var(--bg-surface)',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* LEFT HALF (50%): FULL-BLEED VIDEO HERO PANEL (NO BOX) */}
      <div className="login-media-half" style={{
        width: '50%',
        flex: '0 0 50%',
        height: '100vh',
        position: 'sticky',
        top: 0,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        {/* Full-Bleed Stacked Dual-Video Elements with Seamless Transition */}
        {/* 1. Idle Butterfly Video (Natural loop while idle) */}
        <video
          ref={idleVideoRef}
          src="/idle-butterfly.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            pointerEvents: 'none',
            userSelect: 'none',
            opacity: characterState === 'IDLE' ? 1 : 0,
            transition: 'opacity 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'block',
            zIndex: characterState === 'IDLE' ? 1 : 0
          }}
        />

        {/* 2. Active Interaction Video (Email typing, Password privacy, Login reaction) */}
        <video
          ref={actionVideoRef}
          src="/character-login.mp4"
          muted
          playsInline
          preload="auto"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            pointerEvents: 'none',
            userSelect: 'none',
            opacity: characterState !== 'IDLE' ? 1 : 0,
            transition: 'opacity 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'block',
            zIndex: characterState !== 'IDLE' ? 1 : 0
          }}
        />

        {/* Top Header Overlay on Video */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          padding: '2.5rem 3rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.4rem 0.85rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
            border: '1px solid rgba(0,0,0,0.06)'
          }}>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#1d1d1f'
            }}>
              Senior Network
            </span>
          </div>

          {/* Live Privacy & Focus Indicator */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.4rem 0.85rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            fontSize: '0.76rem',
            fontWeight: 600,
            color: statusBadge.color,
            border: '1px solid rgba(0,0,0,0.06)'
          }}>
            {statusBadge.icon}
            <span>{statusBadge.label}</span>
          </div>
        </div>

        {/* Bottom Quote Overlay on Video, matching the reference image */}
        <div className="login-quote-overlay" style={{
          position: 'relative',
          zIndex: 2,
          padding: '4rem 3rem 3rem',
          background: 'linear-gradient(to top, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.82) 60%, rgba(255,255,255,0) 100%)',
          pointerEvents: 'none'
        }}>
          <h2 style={{
            fontSize: '2.4rem',
            fontWeight: 800,
            letterSpacing: '-0.035em',
            color: '#111111',
            lineHeight: 1.15,
            marginBottom: '0.55rem',
            fontFamily: 'var(--font-sans)'
          }}>
            Get Everything You Want
          </h2>
          <p style={{
            fontSize: '0.94rem',
            color: '#555555',
            lineHeight: 1.55,
            maxWidth: '430px'
          }}>
            Real interview journeys, departmental resources, and peer guidance from SPIT seniors.
          </p>
        </div>
      </div>

      {/* RIGHT HALF (50%): FULL LOGIN FORM & AUTHENTICATION LOGIC */}
      <div className="login-form-half" style={{
        width: '50%',
        flex: '0 0 50%',
        minHeight: '100vh',
        height: '100vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '3rem 4rem',
        backgroundColor: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border-color)',
        boxSizing: 'border-box'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '430px',
          display: 'flex',
          flexDirection: 'column',
          margin: 'auto 0'
        }}>
          {/* Top Logo and Branding */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            gap: '0.45rem',
            marginBottom: '2.5rem'
          }}>
            <img 
              src="/favicon.png" 
              alt="LOOP Logo" 
              style={{ 
                height: '24px', 
                width: 'auto', 
                filter: 'var(--logo-filter)',
                marginRight: '0.2rem'
              }} 
            />
            <span style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-display)'
            }}>
              Loop
            </span>
            <span style={{
              fontSize: '0.55rem',
              letterSpacing: '0.04em',
              padding: '1px 5px',
              border: '1px solid var(--text-primary)',
              borderRadius: '4px',
              fontWeight: '700'
            }}>SPIT</span>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{
              fontSize: '2.1rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              marginBottom: '0.4rem',
              color: 'var(--text-primary)',
              lineHeight: 1.15
            }}>
              {isRegisterMode ? 'Request Account' : 'Welcome Back'}
            </h1>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.92rem',
              fontWeight: 400,
              lineHeight: 1.45
            }}>
              {isRegisterMode ? 'Submit your SPIT credentials to request verified access' : 'Enter your email and password to access your account'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {error && (
              <div style={{
                backgroundColor: 'rgba(255, 69, 58, 0.1)',
                border: '1px solid rgba(255, 69, 58, 0.2)',
                color: '#ff453a',
                borderRadius: '12px',
                padding: '0.8rem 1rem',
                fontSize: '0.85rem',
                textAlign: 'left'
              }}>
                {error}
                {!isRegisterMode && error.includes('User not found') && (
                  <div style={{ marginTop: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegisterMode(true);
                        setError('');
                        setSuccessMsg('');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-color)',
                        cursor: 'pointer',
                        fontWeight: '600',
                        padding: 0,
                        textDecoration: 'underline',
                        fontSize: '0.85rem'
                      }}
                    >
                      Click here to request account access
                    </button>
                  </div>
                )}
              </div>
            )}

            {successMsg && (
              <div style={{
                backgroundColor: 'rgba(48, 209, 88, 0.1)',
                border: '1px solid rgba(48, 209, 88, 0.2)',
                color: '#30d158',
                borderRadius: '12px',
                padding: '0.8rem 1rem',
                fontSize: '0.85rem',
                textAlign: 'left'
              }}>
                {successMsg}
              </div>
            )}

            {/* Email Field */}
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" htmlFor="email-input" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="email-input"
                  type="email"
                  className="input-field"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={handleEmailFocus}
                  onBlur={handleInputBlur}
                  style={{
                    height: '48px',
                    borderRadius: '12px',
                    fontSize: '0.92rem',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    paddingLeft: '1.1rem'
                  }}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" htmlFor="password-input" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  className="input-field"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={handlePasswordFocus}
                  onBlur={handleInputBlur}
                  style={{
                    height: '48px',
                    borderRadius: '12px',
                    fontSize: '0.92rem',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    paddingLeft: '1.1rem',
                    paddingRight: '2.75rem'
                  }}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  tabIndex="-1"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me & Notice Row */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', userSelect: 'none' }}>
                <input 
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ cursor: 'pointer', accentColor: 'var(--accent-color)' }}
                />
                <span>Remember me</span>
              </label>

              <span style={{ fontSize: '0.78rem', color: '#34C759', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <ShieldCheck size={12} strokeWidth={2.4} /> Privacy Protected
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                marginTop: '0.35rem',
                height: '48px',
                borderRadius: '12px',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem',
                border: 'none',
                backgroundColor: 'var(--accent-color)',
                color: 'var(--accent-inverse)',
                fontWeight: '600',
                fontSize: '0.94rem',
                cursor: loading ? 'wait' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)'
              }}
              disabled={loading}
            >
              {loading ? (isRegisterMode ? 'Submitting Request...' : 'Authenticating...') : (
                <>
                  <span>{isRegisterMode ? 'Request Access' : 'Sign In'}</span>
                  {isRegisterMode ? <UserPlus size={16} /> : <LogIn size={16} />}
                </>
              )}
            </button>
          </form>

          {/* 1-Click Demo Logins */}
          {!isRegisterMode && (
            <div style={{
              marginTop: '1.25rem',
              display: 'flex',
              gap: '0.65rem'
            }}>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('student@spit.ac.in', 'student123')}
                style={{
                  flex: 1,
                  height: '42px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: loading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.18s ease'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.borderColor = 'var(--text-primary)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <span>🎓</span> {loading ? '...' : 'Student Demo'}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('admin@spit.ac.in', 'admin123')}
                style={{
                  flex: 1,
                  height: '42px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: loading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.18s ease'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.borderColor = 'var(--text-primary)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <span>🛡️</span> {loading ? '...' : 'Admin Demo'}
              </button>
            </div>
          )}

          {/* Toggle Register / Login */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.75rem', fontSize: '0.88rem' }}>
            {isRegisterMode ? (
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(false);
                  setError('');
                  setSuccessMsg('');
                  triggerCharacterState('IDLE');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-color)',
                  cursor: 'pointer',
                  fontWeight: '600',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                Back to Sign In
              </button>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(true);
                    setError('');
                    setSuccessMsg('');
                    triggerCharacterState('IDLE');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-color)',
                    cursor: 'pointer',
                    fontWeight: '700',
                    padding: 0,
                    textDecoration: 'underline'
                  }}
                >
                  Sign Up
                </button>
              </p>
            )}
          </div>

        </div>
      </div>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 960px) {
          .login-split-page {
            flex-direction: column !important;
            overflow-y: auto !important;
          }
          .login-media-half {
            width: 100% !important;
            flex: none !important;
            height: 320px !important;
            position: relative !important;
            top: 0 !important;
          }
          .login-media-half video {
            object-position: center 12% !important;
          }
          .login-quote-overlay {
            display: none !important;
          }
          .login-form-half {
            width: 100% !important;
            flex: none !important;
            height: auto !important;
            min-height: auto !important;
            padding: 2.5rem 1.5rem !important;
            border-left: none !important;
            border-top: 1px solid var(--border-color) !important;
            overflow-y: visible !important;
          }
        }
      `}</style>
    </div>
  );
}
