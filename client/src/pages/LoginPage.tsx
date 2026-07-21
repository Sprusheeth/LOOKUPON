import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Star, Users, Globe, Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';
import { GithubIcon } from '../components/GithubIcon';
import { useAppStore } from '../store/useAppStore';
import api from '../api/client';
import './LoginPage.css';

const FEATURES = [
  { icon: <Sparkles size={20} />, title: 'AI-Powered Analysis', desc: 'Auto-generate summaries, tags, and insights for your projects' },
  { icon: <GithubIcon size={20} />, title: 'GitHub Integration', desc: 'Import repos with one click and enhance with rich content' },
  { icon: <Users size={20} />, title: 'Community', desc: 'Follow creators, collaborate, and discover inspiring work' },
  { icon: <Star size={20} />, title: 'Showcase Portfolio', desc: 'Beautiful project pages that go beyond source code' },
];

export default function LoginPage() {
  const { user, setToken, setUser, addToast } = useAppStore();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    name: ''
  });
  
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameMsg, setUsernameMsg] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailMsg, setEmailMsg] = useState('');

  useEffect(() => {
    if (!isSignUp || formData.username.length < 3) {
      setUsernameAvailable(null);
      setSuggestions([]);
      setUsernameMsg('');
      return;
    }

    setUsernameChecking(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const { data } = await api.get(`/auth/check-username?username=${formData.username}`);
        setUsernameAvailable(data.available);
        if (data.available) {
          setUsernameMsg('Username is available!');
          setSuggestions([]);
        } else {
          setUsernameMsg(data.message || 'Username is taken.');
          setSuggestions(data.suggestions || []);
        }
      } catch (err) {
        setUsernameAvailable(null);
        setUsernameMsg('');
      } finally {
        setUsernameChecking(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [formData.username, isSignUp]);

  useEffect(() => {
    if (!isSignUp || !formData.email.includes('@')) {
      setEmailAvailable(null);
      setEmailMsg('');
      return;
    }

    setEmailChecking(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const { data } = await api.get(`/auth/check-email?email=${formData.email}`);
        setEmailAvailable(data.available);
        if (data.available) {
          setEmailMsg('Email is available!');
        } else {
          setEmailMsg(data.message || 'Email is taken.');
        }
      } catch (err) {
        setEmailAvailable(null);
        setEmailMsg('');
      } finally {
        setEmailChecking(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [formData.email, isSignUp]);

  useEffect(() => {
    document.title = isSignUp ? 'Sign Up — Lookupon' : 'Sign In — Lookupon';
  }, [isSignUp]);

  if (user) {
    return (
      <div className="login-page">
        <div className="login-card">
          <p>You are already signed in as <strong>{user.name}</strong></p>
          <Link to="/dashboard" className="btn btn-primary btn-lg">Go to Dashboard</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isSignUp ? '/auth/register' : '/auth/login';
      const { data } = await api.post(endpoint, formData);
      setToken(data.token);
      setUser(data.user);
      addToast(isSignUp ? 'Account created successfully!' : 'Signed in successfully!', 'success');
      
      if (!data.user.bio) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="login-page">
      <div className="login-blobs">
        <div className="login-blob lb-1" />
        <div className="login-blob lb-2" />
      </div>

      <div className="login-grid">
        {/* Left: branding */}
        <div className="login-brand">
          <Link to="/" className="login-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src="/logo-light.png" alt="Lookupon" className="logo-img logo-light-only" style={{ height: '48px' }} />
            <img src="/logo-dark.png" alt="Lookupon" className="logo-img logo-dark-only" style={{ height: '48px' }} />
            <span className="font-display" style={{ fontSize: '1.75rem', fontWeight: 800 }}>Lookupon</span>
          </Link>
          <h1 className="login-brand-title font-display">
            Showcase your projects.<br />
            <span className="text-gradient-brand">Inspire the world.</span>
          </h1>
          <p className="login-brand-subtitle">
            Join thousands of developers, students, and makers who use Lookupon
            to share their work and build their portfolio.
          </p>
          <div className="login-features">
            {FEATURES.map((f) => (
              <div key={f.title} className="login-feature">
                <div className="login-feature-icon">{f.icon}</div>
                <div>
                  <div className="login-feature-title">{f.title}</div>
                  <div className="login-feature-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: form */}
        <div className="login-form-wrap">
          <div className="login-card card-glass">
            <div className="login-card-header" style={{ marginBottom: '1.5rem' }}>
              <h2 className="login-card-title font-display">{isSignUp ? 'Create an Account' : 'Welcome Back'}</h2>
              <p className="login-card-subtitle">{isSignUp ? 'Sign up to start launching' : 'Sign in to continue'}</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {isSignUp && (
                <>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label">Username</label>
                    <div style={{ position: 'relative' }}>
                      <UserIcon size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input 
                        type="text" 
                        name="username" 
                        className="input" 
                        style={{ 
                          paddingLeft: '2.75rem', 
                          borderColor: usernameAvailable === false ? 'var(--accent-red)' : usernameAvailable === true ? 'var(--accent-green)' : '' 
                        }} 
                        placeholder="e.g. johndoe" 
                        required 
                        value={formData.username}
                        onChange={handleInput}
                      />
                    </div>
                    {isSignUp && formData.username.length > 2 && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                        {usernameChecking ? (
                          <span style={{ color: 'var(--text-muted)' }}>Checking availability...</span>
                        ) : (
                          <>
                            <span style={{ color: usernameAvailable ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                              {usernameMsg}
                            </span>
                            {suggestions.length > 0 && (
                              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                {suggestions.map(s => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, username: s }))}
                                    style={{
                                      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                      padding: '4px 10px', borderRadius: '100px', cursor: 'pointer',
                                      fontSize: '0.8rem', color: 'var(--text-primary)'
                                    }}
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label">Full Name</label>
                    <div style={{ position: 'relative' }}>
                      <UserIcon size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input 
                        type="text" 
                        name="name" 
                        className="input" 
                        style={{ paddingLeft: '2.75rem' }} 
                        placeholder="e.g. John Doe" 
                        required 
                        value={formData.name}
                        onChange={handleInput}
                      />
                    </div>
                  </div>
                </>
              )}
              
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label">Email</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input 
                        type="email" 
                        name="email" 
                        className="input" 
                        style={{ 
                          paddingLeft: '2.75rem',
                          borderColor: isSignUp && emailAvailable === false ? 'var(--accent-red)' : isSignUp && emailAvailable === true ? 'var(--accent-green)' : '' 
                        }} 
                        placeholder="e.g. you@example.com" 
                        required 
                        value={formData.email}
                        onChange={handleInput}
                      />
                    </div>
                    {isSignUp && formData.email.includes('@') && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                        {emailChecking ? (
                          <span style={{ color: 'var(--text-muted)' }}>Checking email...</span>
                        ) : (
                          <span style={{ color: emailAvailable ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                            {emailMsg}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="label" style={{ marginBottom: 0 }}>Password</label>
                  {!isSignUp && (
                    <Link to="/forgot-password" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div style={{ position: 'relative', marginTop: '0.5rem' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="password" 
                    name="password" 
                    className="input" 
                    style={{ paddingLeft: '2.75rem' }} 
                    placeholder="••••••••" 
                    required 
                    minLength={6}
                    value={formData.password}
                    onChange={handleInput}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
                {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')} <ArrowRight size={18} />
              </button>
            </form>

            <div className="login-divider"><span>or</span></div>

            <a href="http://localhost:3001/auth/github" className="btn btn-secondary btn-lg github-login-btn" style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <GithubIcon size={20} />
              Continue with GitHub
            </a>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button 
                type="button" 
                onClick={() => setIsSignUp(!isSignUp)}
                style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </div>

            <p className="login-terms" style={{ marginTop: '1.5rem' }}>
              By continuing, you agree to our{' '}
              <Link to="/terms" style={{ color: 'var(--text-primary)' }}>Terms</Link> and{' '}
              <Link to="/privacy" style={{ color: 'var(--text-primary)' }}>Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
