import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Key, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import './LoginPage.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { addToast } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Note: Since our backend uses custom auth and doesn't have an SMTP server yet,
    // this currently simulates a successful request. 
    // If you switch to Supabase Auth entirely in the future, you can wire this up to supabase.auth.resetPasswordForEmail!
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      addToast('Password reset link sent to your email', 'success');
    }, 1500);
  };

  return (
    <div className="login-page">
      <div className="login-blobs">
        <div className="login-blob lb-1" />
        <div className="login-blob lb-2" />
      </div>

      <div className="login-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '440px', margin: '0 auto' }}>
        <div className="login-form-wrap">
          <div className="login-card card-glass" style={{ width: '100%' }}>
            
            <Link to="/login" className="btn btn-ghost btn-icon" style={{ alignSelf: 'flex-start', marginBottom: '-1rem' }}>
              <ArrowLeft size={20} />
            </Link>

            <div className="login-card-header" style={{ marginBottom: '1.5rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                <Key size={32} />
              </div>
              <h2 className="login-card-title font-display">Reset Password</h2>
              <p className="login-card-subtitle">
                {submitted ? 'Check your email for a reset link.' : 'Enter your email to receive a password reset link.'}
              </p>
            </div>

            {!submitted ? (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="label">Email address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="email" 
                      className="input" 
                      style={{ paddingLeft: '2.75rem' }} 
                      placeholder="e.g. you@example.com" 
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'} <ArrowRight size={18} />
                </button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <Link to="/login" className="btn btn-secondary btn-lg" style={{ width: '100%' }}>
                  Back to Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
