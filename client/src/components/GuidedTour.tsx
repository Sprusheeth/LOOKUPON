import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Map, Search, Layout, BookOpen, Bookmark, UserPlus, Rocket } from 'lucide-react';
import { useTour } from '../context/TourContext';
import { useAppStore } from '../store/useAppStore';
import { useNavigate, useLocation } from 'react-router-dom';
import './GuidedTour.css';

export default function GuidedTour() {
  const { user } = useAppStore();
  const { isTourActive, currentStep, hasSeenTour, startTour, skipTour, nextStep, prevStep, endTour } = useTour();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const TOUR_STEPS = [
    {
      id: 'welcome',
      title: 'Welcome to LOOKUPON',
      content: 'Discover exceptional software projects, connect with elite creators, and showcase your own work.',
      icon: <Map size={24} />,
      selector: null,
      path: '/'
    },
    {
      id: 'search',
      title: 'Search Projects',
      content: 'Quickly find repositories, developers, or technologies using our lightning-fast search.',
      icon: <Search size={24} />,
      selector: '.navbar-search',
      path: '/'
    },
    {
      id: 'explore',
      title: 'Explore',
      content: 'Browse the latest and trending projects submitted by the community.',
      icon: <Map size={24} />,
      selector: 'a[href="/explore"]',
      path: '/explore'
    },
    {
      id: 'creators',
      title: 'Creators',
      content: 'Discover top developers and see what they are building.',
      icon: <UserPlus size={24} />,
      selector: 'a[href="/creators"]',
      path: '/creators'
    },
    {
      id: 'categories',
      title: 'Explore Categories',
      content: 'Filter projects by your favorite domains like AI, Web, DevOps, and more.',
      icon: <Layout size={24} />,
      selector: '.filter-group',
      path: '/explore'
    },
    {
      id: 'view',
      title: 'View Project Pages',
      content: 'Click any card to dive deep into a project’s README, AI analysis, and source code.',
      icon: <BookOpen size={24} />,
      selector: '.project-card',
      path: '/explore'
    },
    {
      id: 'bookmark',
      title: 'Bookmark & Save',
      content: 'Save inspiring projects to your personal collection to reference later.',
      icon: <Bookmark size={24} />,
      selector: '.project-card-actions',
      path: '/explore'
    },
    {
      id: 'follow',
      title: 'Follow Creators',
      content: 'Keep up with top developers and get notified when they launch new products.',
      icon: <UserPlus size={24} />,
      selector: '.creator-card',
      path: '/creators'
    },
    ...(user ? [
      {
        id: 'dashboard',
        title: 'Your Dashboard',
        content: 'Manage your projects, settings, and view analytics all in one place.',
        icon: <Layout size={24} />,
        selector: '.user-avatar-btn', 
        path: '/dashboard'
      },
      {
        id: 'publish',
        title: 'Publish Your Work',
        content: 'Ready to share? Launch your own projects and build your developer portfolio.',
        icon: <Rocket size={24} />,
        selector: 'a[href="/dashboard/create"]',
        path: '/dashboard/create'
      }
    ] : [
      {
        id: 'publish',
        title: 'Publish Your Work',
        content: 'Ready to share? Launch your own projects and build your developer portfolio.',
        icon: <Rocket size={24} />,
        selector: 'a[href="/dashboard/create"]', 
        path: '/'
      }
    ])
  ];

  // Show welcome modal if haven't seen tour
  const [showPrompt, setShowPrompt] = useState(false);
  
  useEffect(() => {
    // Only show prompt after a short delay to let intro loader finish, and ONLY if the user is logged in
    if (!hasSeenTour && user) {
      const timer = setTimeout(() => setShowPrompt(true), 4000);
      return () => clearTimeout(timer);
    }
  }, [hasSeenTour, user]);

  // Navigate and update spotlight rect when step changes
  useEffect(() => {
    if (!isTourActive) return;
    
    const step = TOUR_STEPS[currentStep];

    // Change page if needed
    if (step.path && location.pathname !== step.path) {
      navigate(step.path);
      // Wait for page transition before recalculating rect
      setTimeout(() => setTargetRect(null), 50);
    }
    
    if (currentStep === 0) return;

    // A helper function to find and focus element
    const findAndFocus = () => {
      if (step.selector) {
        const el = document.querySelector(step.selector);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => {
            setTargetRect(el.getBoundingClientRect());
          }, 500);
          return true;
        }
      }
      return false;
    };

    // Try finding element immediately, and also try after a short delay in case of page transition
    if (!findAndFocus()) {
      setTargetRect(null);
      setTimeout(findAndFocus, 600); // Check again after route transition
    }

    // Handle window resize
    const handleResize = () => {
      if (step.selector) {
        const el = document.querySelector(step.selector);
        if (el) setTargetRect(el.getBoundingClientRect());
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [currentStep, isTourActive, location.pathname, navigate]);

  // Add a class to body when tour is active to reveal hover states (like bookmark actions)
  useEffect(() => {
    if (isTourActive) {
      document.body.classList.add('tour-active');
    } else {
      document.body.classList.remove('tour-active');
    }
    return () => document.body.classList.remove('tour-active');
  }, [isTourActive]);


  if (!hasSeenTour && showPrompt && !isTourActive) {
    return (
      <AnimatePresence>
        <div className="tour-overlay prompt">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="tour-prompt-card"
          >
            <div className="tour-prompt-icon"><Map size={32} /></div>
            <h2 className="font-display">Welcome to LOOKUPON</h2>
            <p>Would you like a quick 60-second tour to see how everything works?</p>
            <div className="tour-prompt-actions">
              <button className="btn btn-secondary" onClick={() => { setShowPrompt(false); skipTour(); }}>Skip</button>
              <button className="btn btn-primary" onClick={() => { setShowPrompt(false); startTour(); }}>Start Tour</button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  if (!isTourActive) return null;

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;

  // Render Spotlight and Tooltip
  return (
    <AnimatePresence>
      <div className="tour-overlay active">
        {/* Spotlight Effect using massive box-shadow */}
        <motion.div 
          className="tour-spotlight"
          animate={{
            top: targetRect ? targetRect.top - 10 : window.innerHeight / 2 - 50,
            left: targetRect ? targetRect.left - 10 : window.innerWidth / 2 - 50,
            width: targetRect ? targetRect.width + 20 : 100,
            height: targetRect ? targetRect.height + 20 : 100,
            opacity: targetRect ? 1 : 0
          }}
          transition={{ type: "spring", damping: 25, stiffness: 120 }}
        />

        {/* Tooltip Dialog */}
        <motion.div 
          className="tour-tooltip"
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'absolute',
            top: targetRect ? Math.min(targetRect.bottom + 30, window.innerHeight - 200) : '50%',
            left: targetRect ? Math.max(20, Math.min(targetRect.left, window.innerWidth - 350)) : '50%',
            transform: targetRect ? 'none' : 'translate(-50%, -50%)'
          }}
        >
          <div className="tour-tooltip-header">
            <div className="tour-tooltip-icon">{step.icon}</div>
            <div className="tour-progress">Step {currentStep} of {TOUR_STEPS.length - 1}</div>
            <button className="tour-close-btn" onClick={endTour}><X size={16} /></button>
          </div>
          
          <h3 className="tour-tooltip-title">{step.title}</h3>
          <p className="tour-tooltip-content">{step.content}</p>
          
          <div className="tour-tooltip-footer">
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={currentStep === 1 ? endTour : prevStep}
            >
              {currentStep === 1 ? 'Skip Tour' : 'Previous'}
            </button>
            <button 
              className="btn btn-primary btn-sm" 
              onClick={isLast ? endTour : nextStep}
            >
              {isLast ? "You're Ready!" : 'Next'} <ChevronRight size={16} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
