import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GithubIcon } from '../components/GithubIcon';
import { useAppStore } from '../store/useAppStore';
import { ChevronRight, Sparkles, CheckCircle2, User, Globe, MapPin, AlignLeft, Briefcase, Link as LinkIcon, Download } from 'lucide-react';
import api, { API_BASE_URL } from '../api/client';
import './OnboardingPage.css';

const INTERESTS = [
  'AI', 'Web', 'DevOps', 'Blockchain', 'Game Development', 
  'Machine Learning', 'Research', 'Cybersecurity', 'Design'
];

export default function OnboardingPage() {
  const { user, fetchMe } = useAppStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  
  // Profile state
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');

  const handleNext = () => setStep(s => s + 1);

  const handleFinish = async () => {
    // Generate personalized homepage step
    setStep(5);
    
    // Save profile and interests
    try {
      await api.patch('/users/profile', {
        bio,
        location,
        website,
        interests: selectedInterests
      });
      await fetchMe();
    } catch (e) {
      console.error(e);
    }

    setTimeout(() => {
      navigate('/dashboard');
    }, 3000);
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        
        {/* Progress indicator */}
        {step < 5 && (
          <div className="onboarding-progress">
            {[1,2,3,4].map(i => (
              <div key={i} className={`progress-dot ${step >= i ? 'active' : ''}`} />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="onboarding-step"
            >
              <div className="onboarding-icon"><GithubIcon size={48} /></div>
              <h1 className="font-display">Connect your GitHub</h1>
              <p>Import your repositories with one click and showcase your open source contributions.</p>
              
              <div className="onboarding-actions">
                <a href={`${API_BASE_URL}/auth/github?import=true`} className="btn btn-primary btn-lg">
                  <GithubIcon size={18} /> Connect GitHub
                </a>
                <button className="btn btn-secondary btn-lg" onClick={handleNext}>Skip for now</button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="onboarding-step"
            >
              <div className="onboarding-icon"><Download size={48} /></div>
              <h1 className="font-display">Import Projects</h1>
              <p>Instantly create beautiful project pages from your existing GitHub repositories.</p>
              
              <div className="onboarding-actions">
                <button className="btn btn-primary btn-lg" onClick={handleNext}>
                  <Sparkles size={18} /> Auto-Import Top Projects
                </button>
                <button className="btn btn-secondary btn-lg" onClick={handleNext}>I'll do this later</button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="onboarding-step"
            >
              <div className="onboarding-icon"><User size={48} /></div>
              <h1 className="font-display">Complete Profile</h1>
              <p>Tell the community a bit about yourself.</p>
              
              <div className="onboarding-form">
                <div className="form-group">
                  <label><AlignLeft size={16} /> Bio</label>
                  <textarea 
                    placeholder="I am a full-stack developer passionate about..." 
                    value={bio} onChange={e => setBio(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label><MapPin size={16} /> Location</label>
                    <input type="text" placeholder="San Francisco, CA" value={location} onChange={e => setLocation(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label><LinkIcon size={16} /> Website</label>
                    <input type="url" placeholder="https://yourdomain.com" value={website} onChange={e => setWebsite(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="onboarding-actions single">
                <button className="btn btn-primary btn-lg" onClick={handleNext}>
                  Continue <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="onboarding-step"
            >
              <div className="onboarding-icon"><Globe size={48} /></div>
              <h1 className="font-display">Choose Interests</h1>
              <p>Select topics to personalize your feed and discover relevant projects.</p>
              
              <div className="interests-grid">
                {INTERESTS.map(interest => (
                  <button 
                    key={interest}
                    className={`interest-pill ${selectedInterests.includes(interest) ? 'active' : ''}`}
                    onClick={() => toggleInterest(interest)}
                  >
                    {selectedInterests.includes(interest) && <CheckCircle2 size={14} />}
                    {interest}
                  </button>
                ))}
              </div>

              <div className="onboarding-actions single">
                <button className="btn btn-primary btn-lg" onClick={handleFinish}>
                  Finish Setup <Sparkles size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div 
              key="step5"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="onboarding-step generating"
            >
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="onboarding-icon glow"
              >
                <Sparkles size={64} />
              </motion.div>
              <h1 className="font-display">Personalizing your experience...</h1>
              <p>Generating your custom homepage feed.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
