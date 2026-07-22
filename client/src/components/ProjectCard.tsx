import { Link } from 'react-router-dom';
import { Star, Heart, Bookmark, Eye, Box, Monitor, Database, Settings, Shield, Beaker, PenTool, Rocket, Cloud, Layout, ExternalLink, Cpu } from 'lucide-react';
import { GithubIcon } from './GithubIcon';
import { useState, ReactNode } from 'react';
import type { Project } from '../store/useAppStore';
import { useAppStore } from '../store/useAppStore';
import { useAuthGuard } from '../hooks/useAuthGuard';
import api from '../api/client';
import './ProjectCard.css';

const LANG_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
  Rust: '#dea584', Go: '#00ADD8', Java: '#b07219', 'C++': '#f34b7d',
  C: '#555555', Ruby: '#701516', PHP: '#4F5D95', Swift: '#ffac45',
  Kotlin: '#A97BFF', Dart: '#00B4AB', 'C#': '#178600',
  HTML: '#e34c26', CSS: '#563d7c', Vue: '#41b883', Svelte: '#ff3e00',
  Shell: '#89e051', Scala: '#c22d40', R: '#198CE7',
};

const CATEGORY_ICONS: Record<string, ReactNode> = {
  'Web Development': <Layout size={16} />, 'Mobile App': <Monitor size={16} />,
  'Data Science': <Database size={16} />, 'Machine Learning': <Cpu size={16} />,
  'DevOps': <Settings size={16} />, 'Game Development': <Box size={16} />,
  'IoT': <Cloud size={16} />, 'Blockchain': <Box size={16} />,
  'Security': <Shield size={16} />, 'Research': <Beaker size={16} />,
  'Design': <PenTool size={16} />, 'Other': <Rocket size={16} />,
};

interface Props {
  project: Project;
  onLikeChange?: (id: string, liked: boolean) => void;
}

export default function ProjectCard({ project, onLikeChange }: Props) {
  const { user, addToast } = useAppStore();
  const { requireAuth } = useAuthGuard();
  const [liked, setLiked] = useState(project.isLiked || false);
  const [likesCount, setLikesCount] = useState(project.likes_count || 0);
  const [bookmarked, setBookmarked] = useState(project.isBookmarked || false);
  const [loading, setLoading] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    requireAuth(async () => {
      setLiked(!liked);
      setLikesCount(liked ? likesCount - 1 : likesCount + 1);
      try {
        const { data } = await api.post(`/projects/${project.id}/like`);
        setLiked(data.liked);
        onLikeChange?.(project.id, data.liked);
      } catch {
        setLiked(liked);
        setLikesCount(likesCount);
      }
    });
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    requireAuth(async () => {
      setBookmarked(!bookmarked);
      try {
        await api.post(`/projects/${project.id}/bookmark`);
        addToast(bookmarked ? 'Removed from bookmarks' : 'Saved to bookmarks!', 'success');
      } catch {
        setBookmarked(bookmarked);
      }
    });
  };

  const thumbnail = project.thumbnail_url || project.screenshots?.[0];
  const categoryIcon = CATEGORY_ICONS[project.category || ''] || <Rocket size={16} />;
  const langColor = LANG_COLORS[project.github_language || ''] || LANG_COLORS[project.technologies?.[0] || ''] || '#8b5cf6';

  return (
    <Link to={`/projects/${project.id}`} className="project-card">
      {/* Thumbnail */}
      <div className="project-card-thumb">
        {thumbnail ? (
          <img src={thumbnail} alt={project.title} loading="lazy" decoding="async" />
        ) : (
          <div className="project-card-thumb-placeholder">
            <span>{categoryIcon}</span>
          </div>
        )}
        <div className="project-card-thumb-overlay">
          <div className="project-card-actions">
            <button className={`card-action-btn ${liked ? 'active-like' : ''}`} onClick={handleLike} aria-label={liked ? "Unlike project" : "Like project"}>
              <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
              <span>{likesCount}</span>
            </button>
            <button className={`card-action-btn ${bookmarked ? 'active-bookmark' : ''}`} onClick={handleBookmark} aria-label={bookmarked ? "Remove bookmark" : "Bookmark project"}>
              <Bookmark size={15} fill={bookmarked ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
        {project.featured && <div className="featured-ribbon">Featured</div>}
        {project.difficulty && (
          <div className={`difficulty-chip diff-${project.difficulty?.toLowerCase()}`}>{project.difficulty}</div>
        )}
      </div>

      {/* Body */}
      <div className="project-card-body">
        <div className="project-card-meta">
          <span className="project-category">{categoryIcon} {project.category || 'Project'}</span>
          {project.avgRating && project.avgRating > 0 && (
            <span className="project-rating">
              <Star size={12} fill="currentColor" /> {project.avgRating}
            </span>
          )}
        </div>

        <h3 className="project-card-title">{project.title}</h3>
        {project.tagline && <p className="project-card-tagline">{project.tagline}</p>}
        {!project.tagline && project.description && (
          <p className="project-card-tagline">{project.description.slice(0, 100)}{project.description.length > 100 ? '...' : ''}</p>
        )}

        {/* Tech stack */}
        {project.technologies?.length > 0 && (
          <div className="project-tech-row">
            {project.technologies.slice(0, 4).map((tech) => (
              <span key={tech} className="tech-pill" style={{ '--lang-color': LANG_COLORS[tech] || '#8b5cf6' } as any}>
                <span className="lang-dot" />
                {tech}
              </span>
            ))}
            {project.technologies.length > 4 && (
              <span className="tech-pill more">+{project.technologies.length - 4}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="project-card-footer">
          <div className="project-author">
            {project.author_avatar && (
              <img src={project.author_avatar} alt={`${project.author_name}'s avatar`} className="avatar avatar-sm" loading="lazy" decoding="async" />
            )}
            <span className="author-name">{project.author_name || project.username}</span>
          </div>
          <div className="project-stats">
            <span className="stat-chip"><Eye size={13} /> {project.views}</span>
            <span className="stat-chip"><Heart size={13} /> {likesCount}</span>
          </div>
        </div>

        {/* Links */}
        <div className="project-card-links">
          {project.live_demo_url && (
            <a href={project.live_demo_url} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()} className="card-link-btn">
              <ExternalLink size={13} /> Demo
            </a>
          )}
          {project.repo_url && (
            <a href={project.repo_url} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()} className="card-link-btn">
              <GithubIcon size={13} /> Repo
            </a>
          )}
          {project.github_stars > 0 && (
            <span className="card-stars"><Star size={12} /> {project.github_stars}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
