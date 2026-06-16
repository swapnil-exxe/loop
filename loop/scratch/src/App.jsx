import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Stories from './pages/Stories';
import StoryDetail from './pages/StoryDetail';
import Resources from './pages/Resources';
import Achievements from './pages/Achievements';
import AchievementDetail from './pages/AchievementDetail';
import AdminDashboard from './pages/AdminDashboard';

// Route Guard Component
function ProtectedRoute({ children }) {
  const userSession = localStorage.getItem('loop_current_user');
  const location = useLocation();

  if (!userSession) {
    // Redirect to login while saving the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Layout wrapper to easily render footer and manage pages
function AppLayout() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)'
    }}>
      <Navbar />
      
      <main style={{ flexGrow: 1 }}>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/stories" element={
            <ProtectedRoute>
              <Stories />
            </ProtectedRoute>
          } />
          <Route path="/stories/:id" element={
            <ProtectedRoute>
              <StoryDetail />
            </ProtectedRoute>
          } />
          <Route path="/resources" element={
            <ProtectedRoute>
              <Resources />
            </ProtectedRoute>
          } />
           <Route path="/achievements" element={
            <ProtectedRoute>
              <Achievements />
            </ProtectedRoute>
          } />
          <Route path="/achievements/:id" element={
            <ProtectedRoute>
              <AchievementDetail />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Modern Monochrome Footer */}
      {!isLoginPage && (
        <footer style={{
          borderTop: '1px solid var(--border-color)',
          padding: '3rem 0',
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-secondary)',
          fontSize: '0.85rem'
        }}>
          <div className="container" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem'
          }}>
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Loop — SPIT Senior Network
              </p>
              <p>Designed for educational mentoring and professional peer guidance.</p>
            </div>
            
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <a href="#" className="btn-text">Privacy Policy</a>
              <a href="#" className="btn-text">Terms of Use</a>
              <a href="#" className="btn-text">SPIT Portal</a>
            </div>
          </div>
          <div className="container" style={{ marginTop: '2rem', fontSize: '0.75rem', opacity: 0.6 }}>
            <p>© {new Date().getFullYear()} Loop. Created exclusively for Sardar Patel Institute of Technology.</p>
          </div>
        </footer>
      )}
    </div>
  );
}

function SplashIntro() {
  const [visible, setVisible] = React.useState(true);
  const [fading, setFading] = React.useState(false);

  React.useEffect(() => {
    // Hide scrollbar on mount to avoid the right white line (scrollbar gutter) during splash animation
    document.body.style.overflow = 'hidden';

    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 2000);

    const removeTimer = setTimeout(() => {
      setVisible(false);
      // Restore scrollbar once splash is fully removed
      document.body.style.overflow = '';
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
      document.body.style.overflow = '';
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`splash-container ${fading ? 'fade-out' : ''}`}>
      <div className="splash-logo">LOOP</div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <SplashIntro />
      <AppLayout />
    </Router>
  );
}
