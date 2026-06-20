import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, UserPlus, LogIn } from 'lucide-react';
import { loginUser, requestRegistration } from '../utils/db';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  useEffect(() => {
    const userSession = localStorage.getItem('loop_current_user');
    if (userSession) {
      const parsed = JSON.parse(userSession);
      if (parsed.onboarded) {
        navigate('/');
      } else {
        navigate('/onboarding');
      }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Validate email
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Email is required');
      return;
    }

    if (!trimmedEmail.endsWith('@spit.ac.in')) {
      setError('Please use your official SPIT email address (@spit.ac.in)');
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);

    try {
      if (isRegisterMode) {
        await requestRegistration(trimmedEmail, password);
        setSuccessMsg('Access request submitted successfully! Please wait for administrator approval.');
        setEmail('');
        setPassword('');
        setIsRegisterMode(false);
      } else {
        const userData = await loginUser(trimmedEmail, password);
        
        // Save user session
        localStorage.setItem('loop_current_user', JSON.stringify(userData));
        
        // Redirect based on onboarding status or admin status
        if (userData.onboarded || userData.isAdmin) {
          navigate('/');
        } else {
          navigate('/onboarding');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-primary)',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Decorative Blur */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Login Card */}
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '400px',
        padding: '2.5rem 2rem',
        borderRadius: '24px',
        boxShadow: '0 30px 60px rgba(0, 0, 0, 0.4)',
        zIndex: 1,
        position: 'relative'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '2.5rem'
        }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '800',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
            fontFamily: 'var(--font-display)'
          }}>
            Loop
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            fontWeight: 400
          }}>
            {isRegisterMode ? 'Request access to senior network' : 'Continue to the SPIT Senior Network'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{
              backgroundColor: 'rgba(255, 69, 58, 0.1)',
              border: '1px solid rgba(255, 69, 58, 0.2)',
              color: '#ff453a',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              fontSize: '0.85rem',
              textAlign: 'left'
            }}>
              {error}
              {!isRegisterMode && error.includes('User not found') && (
                <div style={{ marginTop: '0.5rem' }}>
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
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              fontSize: '0.85rem',
              textAlign: 'left'
            }}>
              {successMsg}
            </div>
          )}

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label" htmlFor="email-input">SPIT Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)',
                pointerEvents: 'none'
              }} />
              <input
                id="email-input"
                type="email"
                className="input-field"
                placeholder="username@spit.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.75rem' }}
                disabled={loading}
              />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label" htmlFor="password-input">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)',
                pointerEvents: 'none'
              }} />
              <input
                id="password-input"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.75rem' }}
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              marginTop: '0.5rem',
              padding: '0.9rem',
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
              cursor: 'pointer'
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

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.25rem', fontSize: '0.9rem' }}>
          {isRegisterMode ? (
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setError('');
                setSuccessMsg('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-color)',
                cursor: 'pointer',
                fontWeight: '500',
                padding: 0,
                textDecoration: 'underline'
              }}
            >
              Back to Sign In
            </button>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>
              Don't have access?{' '}
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
                  fontWeight: '500',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                Request account access
              </button>
            </p>
          )}
        </div>




      </div>
    </div>
  );
}
