import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { API_BASE_URL } from '../api/client';
import { GithubIcon } from './GithubIcon';
import './AuthModal.css';

export default function AuthModal() {
  const { authModalOpen, setAuthModalOpen } = useAppStore();

  if (!authModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="auth-modal-overlay">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="auth-modal-backdrop"
          onClick={() => setAuthModalOpen(false)}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="auth-modal-content"
        >
          <button className="auth-modal-close" onClick={() => setAuthModalOpen(false)}>
            <X size={20} />
          </button>
          
          <div className="auth-modal-header">
            <div className="auth-modal-icon">
              <Lock size={24} />
            </div>
            <h2 className="auth-modal-title font-display">Join LOOKUPON</h2>
            <p className="auth-modal-subtitle">
              Create your LOOKUPON account to save projects, publish your work, follow creators, and personalize your experience.
            </p>
          </div>
          
          <div className="auth-modal-actions">
            <a href={`${API_BASE_URL}/auth/github`} className="btn btn-primary auth-modal-btn">
              <GithubIcon size={18} /> Continue with GitHub
            </a>
            <div className="auth-modal-divider">
              <span>or</span>
            </div>
            <Link 
              to="/login" 
              className="btn btn-secondary auth-modal-btn"
              onClick={() => setAuthModalOpen(false)}
            >
              Sign In with Email <ArrowRight size={16} />
            </Link>
          </div>
          
          <p className="auth-modal-footer">
            Don't have an account? <Link to="/login" onClick={() => setAuthModalOpen(false)}>Create one</Link>
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
