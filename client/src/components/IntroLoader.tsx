import { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import './IntroLoader.css';

interface IntroLoaderProps {
  onComplete: () => void;
}

export default function IntroLoader({ onComplete }: IntroLoaderProps) {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // 3-second cinematic sequence, plus time for final dissolve
    const timer = setTimeout(() => {
      onComplete();
    }, 3800); // 3.8s total interaction blocking
    
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (prefersReducedMotion) {
    return (
      <motion.div 
        className="intro-loader-container"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 1, delay: 0.5, ease: 'easeInOut' }}
        onAnimationComplete={() => onComplete()}
      >
        <div className="intro-fallback-logo font-display">Lookupon</div>
      </motion.div>
    );
  }

  // Orchestrated motion sequence
  return (
    <motion.div 
      className="intro-loader-container"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.8, delay: 3.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="intro-3d-scene">
        {/* Deep ambient glow */}
        <motion.div 
          className="intro-ambient-glow"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 0.5, 0], scale: [0, 1.5, 2] }}
          transition={{ duration: 3.5, ease: "easeOut" }}
        />

        {/* Floating Ring 1 */}
        <motion.div 
          className="intro-ring intro-ring-1"
          initial={{ rotateX: 60, rotateY: 0, scale: 0, opacity: 0 }}
          animate={{ 
            rotateX: [60, 75, 45], 
            rotateY: [0, 180, 360], 
            scale: [0, 1, 1.2],
            opacity: [0, 1, 0] 
          }}
          transition={{ duration: 3.6, ease: [0.25, 0.1, 0.25, 1] }}
        />

        {/* Floating Ring 2 */}
        <motion.div 
          className="intro-ring intro-ring-2"
          initial={{ rotateX: 45, rotateY: 90, scale: 0, opacity: 0 }}
          animate={{ 
            rotateX: [45, 15, 60], 
            rotateY: [90, 270, 450], 
            scale: [0, 0.8, 1.5],
            opacity: [0, 0.8, 0] 
          }}
          transition={{ duration: 3.4, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
        />

        {/* Inner Core */}
        <motion.div
          className="intro-core"
          initial={{ scale: 0, opacity: 0, rotateZ: 0 }}
          animate={{ 
            scale: [0, 1, 0.5], 
            opacity: [0, 1, 0],
            rotateZ: [0, 90]
          }}
          transition={{ duration: 3.2, delay: 0.2, ease: "easeInOut" }}
        >
          <div className="intro-core-inner" />
        </motion.div>

        {/* Particles */}
        <motion.div 
          className="intro-particle ip-1"
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{ x: -100, y: -150, opacity: [0, 1, 0], scale: [0.5, 1.5, 0] }}
          transition={{ duration: 3, delay: 0.3 }}
        />
        <motion.div 
          className="intro-particle ip-2"
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{ x: 120, y: -80, opacity: [0, 1, 0], scale: [0.5, 1, 0] }}
          transition={{ duration: 3.2, delay: 0.4 }}
        />
        <motion.div 
          className="intro-particle ip-3"
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{ x: -80, y: 120, opacity: [0, 0.8, 0], scale: [0.5, 1.2, 0] }}
          transition={{ duration: 2.8, delay: 0.5 }}
        />
      </div>
    </motion.div>
  );
}
