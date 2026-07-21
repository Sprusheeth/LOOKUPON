import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import api from '../api/client';
import type { Project } from '../store/useAppStore';
import ProjectCard from '../components/ProjectCard';
import { useTour } from '../context/TourContext';
import './ExplorePage.css';

const CATEGORIES = ['Web Development','Mobile App','Machine Learning','Data Science','DevOps','Game Development','IoT','Blockchain','Security','Research','Design','Other'];
const DIFFICULTIES = ['Beginner','Intermediate','Advanced','Expert'];
const SORT_OPTIONS = [
  { value: 'trending', label: 'Trending' },
  { value: 'newest', label: 'Newest' },
  { value: 'most-liked', label: ' Most Liked' },
  { value: 'most-viewed', label: ' Most Viewed' },
];
const POPULAR_TECHS = ['JavaScript','TypeScript','Python','React','Node.js','Next.js','Go','Rust','Kotlin','Swift','Flutter','Vue'];

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const { isTourActive } = useTour();

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const difficulty = searchParams.get('difficulty') || '';
  const technology = searchParams.get('technology') || '';
  const sort = searchParams.get('sort') || 'trending';

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchParams(search ? { search } : {});
    setPage(1);
  };

  const hasFilters = !!(category || difficulty || technology);

  const fetchProjects = useCallback(async (pageNum = 1, append = false) => {
    setLoading(true);
    try {
      const params: any = { page: pageNum, limit: 20, sort };
      if (search) params.search = search;
      if (category) params.category = category;
      if (difficulty) params.difficulty = difficulty;
      if (technology) params.technology = technology;

      const { data } = await api.get('/projects', { params });
      if (append) setProjects((p) => [...p, ...data]);
      else setProjects(data);
      setHasMore(data.length === 20);
    } finally {
      setLoading(false);
    }
  }, [search, category, difficulty, technology, sort]);

  useEffect(() => {
    document.title = 'Explore — Lookupon';
    fetchProjects(1, false);
    setPage(1);
  }, [fetchProjects]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchProjects(next, true);
  };

  return (
    <div className="explore-page">
      {/* Header */}
      <div className="explore-header">
        <div className="container">
          <h1 className="explore-title font-display">Explore Projects</h1>
          <p className="explore-subtitle">Discover {projects.length > 0 ? 'amazing' : ''} projects from creators around the world</p>

          {/* Search bar */}
          <div className="explore-search-bar">
            <Search size={18} className="explore-search-icon" />
            <input
              type="text"
              className="explore-search-input"
              placeholder="Search projects, technologies, creators..."
              defaultValue={search}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setParam('search', (e.target as HTMLInputElement).value);
              }}
            />
            <button
              className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal size={16} />
              Filters
              {hasFilters && <span className="filter-count">●</span>}
            </button>
          </div>

          {/* Sort tabs */}
          <div className="sort-tabs">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`sort-tab ${sort === opt.value ? 'active' : ''}`}
                onClick={() => setParam('sort', opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container explore-body">
        {/* Sidebar filters */}
        <aside className={`filter-sidebar ${showFilters ? 'open' : ''}`}>
          <div className="filter-sidebar-header">
            <span className="filter-sidebar-title">Filters</span>
            {hasFilters && (
              <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                <X size={14} /> Clear all
              </button>
            )}
          </div>

          <FilterGroup label="Category">
            <div className="filter-options">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  className={`filter-option ${category === c ? 'active' : ''}`}
                  onClick={() => setParam('category', category === c ? '' : c)}
                >
                  {c} {category === c && <X size={12} />}
                </button>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup label="Difficulty">
            <div className="filter-options">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  className={`filter-option diff-opt diff-opt-${d.toLowerCase()} ${difficulty === d ? 'active' : ''}`}
                  onClick={() => setParam('difficulty', difficulty === d ? '' : d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup label="Technology">
            <div className="filter-options">
              {POPULAR_TECHS.map((t) => (
                <button
                  key={t}
                  className={`filter-option ${technology === t ? 'active' : ''}`}
                  onClick={() => setParam('technology', technology === t ? '' : t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </FilterGroup>
        </aside>

        {/* Main content */}
        <main className="explore-main">
          {/* Active filters */}
          {hasFilters && (
            <div className="active-filters">
              {category && <FilterChip label={category} onRemove={() => setParam('category', '')} />}
              {difficulty && <FilterChip label={difficulty} onRemove={() => setParam('difficulty', '')} />}
              {technology && <FilterChip label={technology} onRemove={() => setParam('technology', '')} />}
            </div>
          )}

          {loading && projects.length === 0 ? (
            <div className="explore-grid">
              {Array.from({ length: 12 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (() => {
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
            
            const displayProjects = projects.length > 0 ? projects : (isTourActive ? [dummyProject] : []);
            
            if (displayProjects.length === 0) {
              return (
                <div className="explore-empty">
                  <div className="empty-icon">🔍</div>
                  <h3>No projects found</h3>
                  <p>Try adjusting your search or filters</p>
                  <button className="btn btn-secondary" onClick={clearFilters}>Clear filters</button>
                </div>
              );
            }
            
            return (
              <>
                <div className="explore-results-count">
                  {projects.length > 0 ? `${projects.length} project${projects.length !== 1 ? 's' : ''} found` : 'Dummy project'}
                </div>
                <div className="explore-grid">
                  {displayProjects.map((p, i) => (
                    <div key={p.id} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(i, 5) * 60}ms` }}>
                      <ProjectCard project={p} />
                    </div>
                  ))}
                </div>
                {hasMore && projects.length > 0 && (
                  <div className="load-more">
                    <button className="btn btn-secondary btn-lg" onClick={loadMore} disabled={loading}>
                      {loading ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </main>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="filter-group">
      <button className="filter-group-header" onClick={() => setOpen(!open)}>
        <span>{label}</span>
        <ChevronDown size={16} className={`filter-chevron ${open ? 'open' : ''}`} />
      </button>
      {open && <div className="filter-group-body">{children}</div>}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="filter-chip">
      {label}
      <button onClick={onRemove}><X size={12} /></button>
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="project-card" style={{ pointerEvents: 'none' }}>
      <div className="skeleton" style={{ aspectRatio: '16/9', borderRadius: 0 }} />
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div className="skeleton" style={{ height: '12px', width: '50%' }} />
        <div className="skeleton" style={{ height: '18px', width: '85%' }} />
        <div className="skeleton" style={{ height: '13px', width: '100%' }} />
        <div style={{ display: 'flex', gap: '6px' }}>
          {[1, 2].map((i) => <div key={i} className="skeleton" style={{ height: '22px', width: '60px', borderRadius: '999px' }} />)}
        </div>
      </div>
    </div>
  );
}
