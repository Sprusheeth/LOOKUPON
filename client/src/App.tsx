import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, ReactNode } from 'react';
import { Rocket } from 'lucide-react';
import Navbar from './components/Navbar';
import ToastContainer from './components/ToastContainer';
import AuthModal from './components/AuthModal';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import ProjectPage from './pages/ProjectPage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import CreateProjectPage from './pages/CreateProjectPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import CreatorsPage from './pages/CreatorsPage';
import OnboardingPage from './pages/OnboardingPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import GuidedTour from './components/GuidedTour';
import { useAppStore } from './store/useAppStore';
import { TourProvider } from './context/TourContext';

function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
      <div style={{ color: 'var(--accent-purple)' }}><Rocket size={96} /></div>
      <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 800 }}>Page not found</h1>
      <p style={{ color: 'var(--text-secondary)' }}>The page you're looking for doesn't exist.</p>
      <a href="/" className="btn btn-primary">Go Home</a>
    </div>
  );
}

function BookmarksPage() {
  return (
    <div style={{ minHeight: '100vh', paddingTop: 'calc(var(--nav-height) + 2rem)' }}>
      <div className="container">
        <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem' }}>Your Bookmarks</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Bookmarks feature available. View your saved projects here.</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = useAppStore(state => state.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  const { theme, token, fetchMe } = useAppStore();

  useEffect(() => {
    // Rehydrate user from token
    if (token) fetchMe();
  }, []);

  useEffect(() => {
    const applyTheme = () => {
      let activeTheme = theme;
      if (theme === 'system') {
        activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', activeTheme);
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') applyTheme();
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  return (
    <TourProvider>
      <BrowserRouter>
        <div className="app">
          <Navbar />
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/projects/:id" element={<ProjectPage />} />
              <Route path="/profile/:username" element={<ProfilePage />} />
              <Route path="/creators" element={<CreatorsPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/dashboard/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="/dashboard/create" element={<ProtectedRoute><CreateProjectPage /></ProtectedRoute>} />
              <Route path="/dashboard/edit/:id" element={<ProtectedRoute><CreateProjectPage /></ProtectedRoute>} />
              <Route path="/bookmarks" element={<ProtectedRoute><BookmarksPage /></ProtectedRoute>} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/onboarding" element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
          <ToastContainer />
          <AuthModal />
          <GuidedTour />
        </div>
      </BrowserRouter>
    </TourProvider>
  );
}
