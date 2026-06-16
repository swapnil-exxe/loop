import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

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

    // Mock validation delays for premium feel
    setTimeout(() => {
      setLoading(false);
      
      const isAdmin = trimmedEmail === 'admin@spit.ac.in' && password === 'admin123';
      
      if (trimmedEmail === 'admin@spit.ac.in' && password !== 'admin123') {
        setError('Incorrect password for administrator');
        return;
      }

      // Save user session
      const userData = {
        email: trimmedEmail,
        isAdmin: isAdmin
      };
      
      localStorage.setItem('loop_current_user', JSON.stringify(userData));
      
      // Redirect to landing page
      navigate('/');
    }, 800);
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
            Continue to the SPIT Senior Network
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{
              backgroundColor: 'rgba(255, 0, 0, 0.1)',
              border: '1px solid rgba(255, 0, 0, 0.2)',
              color: '#ff453a',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              fontSize: '0.85rem',
              textAlign: 'left'
            }}>
              {error}
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
              fontWeight: '600'
            }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Demo Helper Panel */}
        <div className="glass-panel" style={{
          marginTop: '2rem',
          padding: '1rem',
          borderRadius: '12px',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-color)',
          textAlign: 'left'
        }}>
          <p style={{ fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>Testing Credentials:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <p>• Student: <code style={{ color: 'var(--text-primary)' }}>student@spit.ac.in</code> (Any password)</p>
            <p>• Admin: <code style={{ color: 'var(--text-primary)' }}>admin@spit.ac.in</code> / password: <code style={{ color: 'var(--text-primary)' }}>admin123</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
