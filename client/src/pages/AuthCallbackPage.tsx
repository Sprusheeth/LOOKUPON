import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken, fetchMe, addToast } = useAppStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      addToast('Login failed. Please try again.', 'error');
      navigate('/login');
      return;
    }

    if (token) {
      setToken(token);
      fetchMe().then(() => {
        addToast('Welcome to Lookupon!', 'success');
        const currentUser = useAppStore.getState().user;
        if (currentUser && !currentUser.bio) {
          navigate('/onboarding', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      });
    } else {
      navigate('/login');
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
    }}>
      <div className="animate-spin" style={{ width: 40, height: 40, border: '3px solid rgba(139,92,246,0.3)', borderTop: '3px solid var(--accent-purple)', borderRadius: '50%' }} />
      <p style={{ color: 'var(--text-secondary)' }}>Signing you in...</p>
    </div>
  );
}
