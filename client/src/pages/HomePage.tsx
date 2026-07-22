import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, TrendingUp, Users, Rocket, Star, ChevronRight, Code, Layout, Globe, Cpu, Blocks, Cpu as CpuIcon, Database, Server } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/client';
import type { Project, User } from '../store/useAppStore';
import { useAppStore } from '../store/useAppStore';
import ProjectCard from '../components/ProjectCard';
import { GithubIcon } from '../components/GithubIcon';
import IntroLoader from '../components/IntroLoader';
import { useTour } from '../context/TourContext';
import './HomePage.css';

const CATEGORIES = [
  { id: '', label: 'All Projects' },
  { id: 'Web Development', label: 'Web' },
  { id: 'Mobile App', label: 'Mobile' },
  { id: 'Machine Learning', label: 'ML / AI' },
  { id: 'Data Science', label: 'Data' },
  { id: 'DevOps', label: 'DevOps' },
  { id: 'Game Development', label: 'Games' },
  { id: 'Blockchain', label: 'Blockchain' },
  { id: 'Security', label: 'Security' },
];

export default function HomePage() {
  const { user } = useAppStore();
  const { isTourActive } = useTour();
  const [trending, setTrending] = useState<Project[]>([]);
  const [recent, setRecent] = useState<Project[]>([]);
  const [featured, setFeatured] = useState<Project[]>([]);
  const [creators, setCreators] = useState<User[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [introFinished, setIntroFinished] = useState(() => {
    // Only play intro once per browser session
    return sessionStorage.getItem('lookupon_intro_seen') === 'true';
  });

  const handleIntroComplete = () => {
    sessionStorage.setItem('lookupon_intro_seen', 'true');
    setIntroFinished(true);
  };

  useEffect(() => {
    document.title = 'Lookupon — Premium Discovery';
    fetchData();
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [activeCategory]);

  async function fetchData() {
    try {
      const [trendRes, featuredRes, creatorsRes] = await Promise.allSettled([
        api.get('/projects/trending'),
        api.get('/projects/featured'),
        api.get('/users?limit=4'),
      ]);
      if (trendRes.status === 'fulfilled') setTrending(trendRes.value.data.slice(0, 4)); // Top 4 trending
      if (featuredRes.status === 'fulfilled') setFeatured(featuredRes.value.data);
      if (creatorsRes.status === 'fulfilled') setCreators(creatorsRes.value.data);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProjects() {
    try {
      const params: any = { sort: 'newest', limit: 12 };
      if (activeCategory) params.category = activeCategory;
      const { data } = await api.get('/projects', { params });
      setRecent(data);
    } catch {}
  }

  const dummyProject = {
    id: 'dummy-project',
    title: 'LOOKUPON Platform',
    tagline: 'The ultimate showcase platform for developers.',
    description: 'A beautiful place to share your work. Use the platform to build your portfolio and connect with other creators.',
    repository_url: 'https://github.com',
    creator_id: 'dummy',
    created_at: new Date().toISOString(),
    likes_count: 42,
    bookmarks_count: 15,
    views_count: 150,
    tags: ['React', 'TypeScript'],
    media_urls: [],
    creator: {
      id: 'dummy-creator',
      name: 'Lookupon Team',
      username: 'lookupon',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lookupon'
    }
  } as unknown as Project;

  const dummyCreator = {
    id: 'dummy-creator',
    name: 'Lookupon Team',
    username: 'lookupon',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lookupon',
    followers_count: 100,
    total_likes: 42
  } as unknown as User;

  const displayTrending = trending.length > 0 ? trending : (isTourActive ? [dummyProject] : []);
  const displayRecent = recent.length > 0 ? recent : (isTourActive ? [dummyProject] : []);
  const displayCreators = creators.length > 0 ? creators : (isTourActive ? [dummyCreator] : []);

  const mainFeatured = featured[0] || displayTrending.find(p => (p.username || (p as any).creator?.username) !== 'lookupon');

  const containerVariants: any = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <>
      <Helmet>
        <title>Lookupon — Developer Project Sharing Platform</title>
        <meta name="description" content="Discover amazing projects from creators around the world. Showcase your work, find collaborators, and get inspired." />
        <link rel="canonical" href="https://lookupon.vercel.app/" />
      </Helmet>
      {!introFinished && <IntroLoader onComplete={handleIntroComplete} />}
      
      <motion.div 
        className="home-page"
        initial={introFinished ? false : { filter: 'blur(20px) brightness(0.4) saturate(0.5)' }}
        animate={{ filter: 'blur(0px) brightness(1) saturate(1)' }}
        transition={{ duration: 1.2, delay: introFinished ? 0 : 2.8, ease: "easeOut" }}
      >
        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="hero-section">
        <div className="hero-bg" />
        <div className="hero-glow-1" />
        <div className="hero-glow-2" />

        <div className="container">
          <motion.div 
            className="hero-content"
            initial="hidden" animate="show" variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="hero-badge">
              <Sparkles size={14} /> The Developer Showcase
            </motion.div>

            <motion.h1 variants={itemVariants} className="hero-title font-display">
              Discover Software<br />
              That Defines the Future.
            </motion.h1>

            <motion.p variants={itemVariants} className="hero-subtitle">
              The ultimate platform for developers to launch, showcase, and explore the next generation of digital products.
            </motion.p>

            <motion.div variants={itemVariants} className="hero-actions">
              {user ? (
                <Link to="/dashboard" className="btn btn-primary btn-lg">
                  <Rocket size={18} /> Launch a Project
                </Link>
              ) : (
                <a href="http://localhost:3001/auth/github" className="btn btn-primary btn-lg">
                  Continue with GitHub
                </a>
              )}
              <Link to="/explore" className="btn btn-secondary btn-lg">
                Explore Projects
              </Link>
            </motion.div>
          </motion.div>

          {/* Featured Hero Card */}
          {mainFeatured && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link to={`/projects/${mainFeatured.id}`} className="hero-featured-card">
                {mainFeatured.thumbnail_url || mainFeatured.screenshots?.[0] ? (
                  <img 
                    src={mainFeatured.thumbnail_url || mainFeatured.screenshots[0]} 
                    alt={mainFeatured.title} 
                    className="hero-featured-image" 
                  />
                ) : (
                  <div className="hero-featured-image" style={{ background: 'var(--bg-secondary)' }} />
                )}
                <div className="hero-featured-overlay">
                  <div className="hero-featured-content">
                    <span className="hero-featured-label">Featured Launch</span>
                    <h2 className="hero-featured-title font-display">{mainFeatured.title}</h2>
                    <p className="hero-featured-desc">{mainFeatured.tagline || mainFeatured.description?.slice(0, 100)}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── How it Works ─────────────────────────────────── */}
      <section className="home-section" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 className="font-display" style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>How Lookupon Works</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto' }}>From your local machine to a beautifully presented portfolio in three simple steps.</p>
          </div>
          
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon"><GithubIcon size={24} /></div>
              <h3 className="font-display step-title">Connect GitHub</h3>
              <p className="step-desc">Sync your repositories instantly. We'll automatically pull in your README, languages, and stars.</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon"><Sparkles size={24} /></div>
              <h3 className="font-display step-title">AI Enhancement</h3>
              <p className="step-desc">Our AI analyzes your code to generate summaries, extract key features, and suggest improvements.</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon"><Globe size={24} /></div>
              <h3 className="font-display step-title">Publish & Share</h3>
              <p className="step-desc">Add screenshots and a demo video, then launch to our community of developers and recruiters.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Platform Features (Bento Grid) ───────────────── */}
      <section className="home-section">
        <div className="container">
          <div className="section-header" style={{ justifyContent: 'center', textAlign: 'center', marginBottom: '3rem' }}>
            <h2 className="section-title font-display">Designed for Developers</h2>
          </div>
          
          <div className="bento-grid">
            <div className="bento-card bento-large">
              <div className="bento-content">
                <Code size={32} className="bento-icon text-gradient-brand" />
                <h3 className="font-display">Beautiful Code Showcases</h3>
                <p>Don't just share a repository link. Build a narrative around your code with embedded videos, architecture diagrams, and rich typography.</p>
              </div>
              <div className="bento-bg bg-code" />
            </div>
            
            <div className="bento-card">
              <div className="bento-content">
                <Users size={28} className="bento-icon" style={{ color: '#ec4899' }} />
                <h3 className="font-display">Vibrant Community</h3>
                <p>Follow top creators, leave comments, and get inspired by what others are building.</p>
              </div>
            </div>
            
            <div className="bento-card">
              <div className="bento-content">
                <Cpu size={28} className="bento-icon" style={{ color: '#8b5cf6' }} />
                <h3 className="font-display">Smart AI Analysis</h3>
                <p>Let AI write your project summaries and extract tags automatically.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trending ─────────────────────────────────────── */}
      <section className="home-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title font-display">
                <TrendingUp size={20} className="section-icon" /> Trending Launches
              </h2>
            </div>
            <Link to="/explore?sort=trending" className="btn btn-ghost btn-sm">
              View all <ChevronRight size={16} />
            </Link>
          </div>
          {displayTrending.length > 0 ? (
            <motion.div 
              className="projects-grid"
              initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }}
              variants={containerVariants}
            >
              {displayTrending.map((p) => (
                <motion.div key={p.id} variants={itemVariants}>
                  <ProjectCard project={p} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <TrendingUp size={48} style={{ color: 'var(--border)' }} />
              <h3 className="font-display">No Trending Launches</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Looks like things are quiet right now. Check back later!</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Featured Creators ─────────────────────────────── */}
      <section className="home-section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title font-display">
                <Users size={20} className="section-icon" /> Recommended Creators
              </h2>
            </div>
            <Link to="/creators" className="btn btn-ghost btn-sm">
              See all <ChevronRight size={16} />
            </Link>
          </div>
          {displayCreators.length > 0 ? (
            <motion.div 
              className="creators-grid"
              initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }}
              variants={containerVariants}
            >
              {displayCreators.map((creator) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </motion.div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <Users size={48} style={{ color: 'var(--border)' }} />
              <h3 className="font-display">No Creators Found</h3>
              <p style={{ color: 'var(--text-secondary)' }}>The community is just getting started.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Trending Tech Stacks (Marquee) ──────────────── */}
      <section className="home-section" style={{ padding: '4rem 0', overflow: 'hidden', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2rem' }}>
            POWERED BY MODERN TECHNOLOGIES
          </p>
        </div>
        <div className="tech-marquee-wrapper">
          <div className="tech-marquee">
            <div className="tech-marquee-content">
              {['React', 'TypeScript', 'Node.js', 'Python', 'Rust', 'Go', 'Next.js', 'PostgreSQL', 'Docker', 'GraphQL'].map((tech) => (
                <div key={tech} className="tech-tag">
                  <Blocks size={16} /> {tech}
                </div>
              ))}
              {/* Duplicate for infinite scroll */}
              {['React', 'TypeScript', 'Node.js', 'Python', 'Rust', 'Go', 'Next.js', 'PostgreSQL', 'Docker', 'GraphQL'].map((tech) => (
                <div key={tech + '-dup'} className="tech-tag">
                  <Blocks size={16} /> {tech}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Browse by Category ────────────────────────────── */}
      <section className="home-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title font-display">Explore Categories</h2>
            </div>
          </div>

          <div className="category-pills">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {loading ? (
            <motion.div className="projects-grid" initial="hidden" animate="show" variants={containerVariants}>
              {Array.from({ length: 6 }).map((_, i) => <ProjectSkeleton key={i} />)}
            </motion.div>
          ) : displayRecent.length > 0 ? (
            <motion.div 
              className="projects-grid"
              initial="hidden" animate="show"
              variants={containerVariants}
              key={activeCategory} // Force re-animation on category change
            >
              {displayRecent.map((p) => (
                <motion.div key={p.id} variants={itemVariants}>
                  <ProjectCard project={p} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
              <Blocks size={48} style={{ color: 'var(--border)' }} />
              <h3 className="font-display">No Projects Available</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Be the first to launch a project in this category!</p>
            </div>
          )}

          {displayRecent.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
              <Link to="/explore" className="btn btn-secondary btn-lg">
                View All Projects <ArrowRight size={18} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Section ───────────────────────────────────── */}
      <section className="cta-section">
        <div className="container">
          <motion.div 
            className="cta-card"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="cta-content">
              {user ? (
                <>
                  <h2 className="cta-title font-display">Build Something Amazing</h2>
                  <p className="cta-subtitle">
                    Ready to show the world your latest creation? Launch your next project today.
                  </p>
                  <div className="cta-actions">
                    <Link to="/dashboard/create" className="btn btn-primary btn-lg">
                      <Rocket size={18} /> Launch a Project
                    </Link>
                    <Link to="/dashboard" className="btn btn-secondary btn-lg">
                      Go to Dashboard
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="cta-title font-display">Ready to Launch?</h2>
                  <p className="cta-subtitle">
                    Join the platform where elite developers showcase their products to the world.
                  </p>
                  <div className="cta-actions">
                    <a href="http://localhost:3001/auth/github" className="btn btn-primary btn-lg">
                      Join via GitHub
                    </a>
                    <Link to="/explore" className="btn btn-secondary btn-lg">
                      Explore First
                    </Link>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>
      </motion.div>
    </>
  );
}

function CreatorCard({ creator }: { creator: any }) {
  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
      <Link to={`/profile/${creator.username}`} className="creator-card">
        <img src={creator.avatar_url} alt={creator.name} className="avatar creator-avatar" />
        <div className="creator-info">
          <div className="creator-name font-display">{creator.name}</div>
          <div className="creator-username">@{creator.username}</div>
          <div className="creator-stats">
            <span><Star size={13} /> {creator.followers_count}</span>
            <span><Sparkles size={13} /> {creator.total_likes || 0}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function ProjectSkeleton() {
  return (
    <div className="project-card" style={{ pointerEvents: 'none' }}>
      <div className="skeleton" style={{ aspectRatio: '16/9', borderRadius: 0 }} />
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="skeleton" style={{ height: '14px', width: '60%' }} />
        <div className="skeleton" style={{ height: '24px', width: '90%' }} />
        <div className="skeleton" style={{ height: '14px', width: '100%' }} />
        <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: '24px', width: '64px', borderRadius: '999px' }} />)}
        </div>
      </div>
    </div>
  );
}
