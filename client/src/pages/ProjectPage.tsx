import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart, Bookmark, Star, Eye, ExternalLink, MessageSquare,
  Share2, ArrowLeft, Users, Lightbulb, Target, Sparkles, Award, BookOpen,
  ChevronLeft, ChevronRight, X, Send, ThumbsUp, Edit, Trash2, Globe, Rocket,
  Box, Video, Scale, MessageCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import api from '../api/client';
import type { Project } from '../store/useAppStore';
import { useAppStore } from '../store/useAppStore';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { GithubIcon } from '../components/GithubIcon';
import './ProjectPage.css';

const LANG_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5', Rust: '#dea584',
  Go: '#00ADD8', Java: '#b07219', 'C++': '#f34b7d', Ruby: '#701516',
  Swift: '#ffac45', Kotlin: '#A97BFF', Dart: '#00B4AB', 'C#': '#178600',
};

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, addToast } = useAppStore();
  const { requireAuth } = useAuthGuard();
  const [project, setProject] = useState<Project | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'readme' | 'comments'>('overview');

  useEffect(() => {
    if (id) {
      fetchProject();
      fetchComments();
    }
  }, [id]);

  async function fetchProject() {
    try {
      const { data } = await api.get(`/projects/${id}`);
      setProject(data);
      setLiked(data.isLiked || false);
      setLikesCount(data.likes_count || 0);
      setBookmarked(data.isBookmarked || false);
      setMyRating(data.myRating || 0);
      setAvgRating(data.avgRating || 0);
      setRatingCount(data.ratingCount || 0);
      document.title = `${data.title} — Lookupon`;
    } catch {
      addToast('Project not found', 'error');
      navigate('/explore');
    } finally {
      setLoading(false);
    }
  }

  async function fetchComments() {
    try {
      const { data } = await api.get(`/projects/${id}/comments`);
      setComments(data);
    } catch {}
  }

  const handleLike = () => {
    requireAuth(async () => {
      const prev = liked;
      setLiked(!liked);
      setLikesCount(liked ? likesCount - 1 : likesCount + 1);
      try {
        await api.post(`/projects/${id}/like`);
      } catch {
        setLiked(prev);
        setLikesCount(likesCount);
      }
    });
  };

  const handleBookmark = () => {
    requireAuth(async () => {
      const prev = bookmarked;
      setBookmarked(!bookmarked);
      try {
        await api.post(`/projects/${id}/bookmark`);
        addToast(bookmarked ? 'Removed from bookmarks' : 'Saved to bookmarks!', 'success');
      } catch {
        setBookmarked(prev);
      }
    });
  };

  const handleRate = (score: number) => {
    requireAuth(async () => {
      try {
        const { data } = await api.post(`/projects/${id}/rate`, { score });
        setMyRating(data.myRating);
        setAvgRating(data.avgRating);
        setRatingCount(data.ratingCount);
        addToast('Rating saved!', 'success');
      } catch {}
    });
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    requireAuth(async () => {
      if (!commentText.trim()) return;
      try {
        const { data } = await api.post(`/projects/${id}/comments`, {
          content: commentText,
          parentId: replyTo,
        });
        if (replyTo) {
          setComments((c) => c.map((cm) => cm.id === replyTo ? { ...cm, replies: [...(cm.replies || []), data] } : cm));
        } else {
          setComments((c) => [data, ...c]);
        }
        setCommentText('');
        setReplyTo(null);
        addToast('Comment added!', 'success');
      } catch {}
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: project?.title, url });
    } else {
      navigator.clipboard.writeText(url);
      addToast('Link copied!', 'success');
    }
  };

  if (loading) return <ProjectPageSkeleton />;
  if (!project) return null;

  const allMedia = [...(project.screenshots || [])];
  if (project.thumbnail_url && !allMedia.includes(project.thumbnail_url)) {
    allMedia.unshift(project.thumbnail_url);
  }

  const isOwner = user?.id === project.user_id;

  return (
    <div className="project-page">
      <Helmet>
        <title>{project.title} | Lookupon</title>
        <meta name="description" content={project.tagline || project.description?.slice(0, 160) || `Check out ${project.title} on Lookupon.`} />
        <link rel="canonical" href={`https://lookupon-n4gs.vercel.app/projects/${project.id}`} />
        <meta property="og:site_name" content="Lookupon" />
        <meta property="og:title" content={`${project.title} | Lookupon`} />
        {project.thumbnail_url && <meta property="og:image" content={project.thumbnail_url} />}
      </Helmet>
      {/* Back nav */}
      <div className="project-page-top">
        <div className="container">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="project-hero">
        {allMedia.length > 0 ? (
          <div className="project-hero-media">
            <img
              src={allMedia[0]}
              alt={project.title}
              className="project-hero-img"
              onClick={() => setLightboxIdx(0)}
            />
            {allMedia.length > 1 && (
              <div className="media-thumbs scroll-row">
                {allMedia.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className={`media-thumb ${i === 0 ? 'active' : ''}`}
                    onClick={() => setLightboxIdx(i)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="project-hero-placeholder">
            <span className="hero-placeholder-emoji"><Rocket size={48} /></span>
          </div>
        )}
        <div className="project-hero-overlay" />
      </div>

      {/* Main content */}
      <div className="container project-body">
        {/* Left: main info */}
        <div className="project-main">
          {/* Title area */}
          <div className="project-title-area">
            {project.category && (
              <span className="badge badge-purple">{project.category}</span>
            )}
            {project.difficulty && (
              <span className={`badge diff-badge-${project.difficulty.toLowerCase()}`}>{project.difficulty}</span>
            )}
            {project.hackathon && (
              <span className="badge badge-orange"><Award size={11} /> {project.hackathon}</span>
            )}
          </div>

          <h1 className="project-title font-display">{project.title}</h1>
          {project.tagline && <p className="project-tagline">{project.tagline}</p>}

          {/* Action bar */}
          <div className="project-action-bar">
            <button className={`action-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
              <Heart size={17} fill={liked ? 'currentColor' : 'none'} />
              <span>{likesCount}</span>
            </button>
            <button className={`action-btn ${bookmarked ? 'bookmarked' : ''}`} onClick={handleBookmark}>
              <Bookmark size={17} fill={bookmarked ? 'currentColor' : 'none'} />
              <span>{bookmarked ? 'Saved' : 'Save'}</span>
            </button>
            <button className="action-btn" onClick={handleShare}>
              <Share2 size={17} />
              <span>Share</span>
            </button>
            <div className="action-btn" style={{ cursor: 'default' }}>
              <Eye size={17} />
              <span>{project.views}</span>
            </div>
            {isOwner && (
              <Link to={`/dashboard/edit/${project.id}`} className="action-btn action-btn-edit">
                <Edit size={17} /> Edit
              </Link>
            )}
          </div>

          {/* Tabs */}
          <div className="project-tabs">
            {(['overview', 'readme', 'comments'] as const).map((tab) => (
              <button
                key={tab}
                className={`project-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'overview' && <><Target size={15} /> Overview</>}
                {tab === 'readme' && <><BookOpen size={15} /> README</>}
                {tab === 'comments' && <><MessageCircle size={15} /> Comments ({project.comments_count})</>}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'overview' && (
            <div className="tab-content">
              {/* Description */}
              {project.description && (
                <section className="project-section">
                  <h2 className="project-section-title"><Lightbulb size={18} /> About</h2>
                  <p className="project-description">{project.description}</p>
                </section>
              )}

              {/* Problem / Solution / Impact */}
              {(project.problem_statement || project.solution || project.impact) && (
                <section className="project-section">
                  <h2 className="project-section-title"><Target size={18} /> Problem & Solution</h2>
                  <div className="psi-grid">
                    {project.problem_statement && (
                      <div className="psi-card psi-problem">
                        <div className="psi-label"><Target size={16} /> Problem</div>
                        <p>{project.problem_statement}</p>
                      </div>
                    )}
                    {project.solution && (
                      <div className="psi-card psi-solution">
                        <div className="psi-label"><Lightbulb size={16} /> Solution</div>
                        <p>{project.solution}</p>
                      </div>
                    )}
                    {project.impact && (
                      <div className="psi-card psi-impact">
                        <div className="psi-label"><Rocket size={16} /> Impact</div>
                        <p>{project.impact}</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Story */}
              {project.story && (
                <section className="project-section">
                  <h2 className="project-section-title"><BookOpen size={18} /> Project Story</h2>
                  <div className="project-story">{project.story}</div>
                </section>
              )}

              {/* Features */}
              {project.features?.length > 0 && (
                <section className="project-section">
                  <h2 className="project-section-title"><Sparkles size={18} /> Key Features</h2>
                  <ul className="features-list">
                    {project.features.map((f, i) => (
                      <li key={i} className="feature-item"><span className="feature-dot" />{f}</li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Learning outcomes */}
              {project.learning_outcomes?.length > 0 && (
                <section className="project-section">
                  <h2 className="project-section-title"><Award size={18} /> Learning Outcomes</h2>
                  <ul className="features-list">
                    {project.learning_outcomes.map((l, i) => (
                      <li key={i} className="feature-item"><span className="feature-dot green" />{l}</li>
                    ))}
                  </ul>
                </section>
              )}

              {/* AI Summary */}
              {project.ai_summary && (
                <section className="project-section">
                  <div className="ai-summary-card">
                    <div className="ai-summary-header">
                      <span className="ai-badge"><Sparkles size={12} /> AI Analysis</span>
                    </div>
                    <p className="ai-summary-text">{project.ai_summary}</p>
                    {project.ai_improvements?.length > 0 && (
                      <div className="ai-improvements">
                        <div className="ai-improvements-label"><Lightbulb size={16} /> Suggested improvements:</div>
                        <ul>
                          {project.ai_improvements.map((imp, i) => (
                            <li key={i}>{imp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Architecture diagram */}
              {project.architecture_diagram_url && (
                <section className="project-section">
                  <h2 className="project-section-title"><Box size={24} /> Architecture</h2>
                  <img
                    src={project.architecture_diagram_url}
                    alt="Architecture diagram"
                    className="arch-diagram"
                  />
                </section>
              )}

              {/* Demo video */}
              {project.demo_video_url && (
                <section className="project-section">
                  <h2 className="project-section-title"><Video size={24} /> Demo Video</h2>
                  <div className="video-wrapper">
                    <iframe
                      src={project.demo_video_url.replace('watch?v=', 'embed/')}
                      title="Demo video"
                      allowFullScreen
                      className="demo-video"
                    />
                  </div>
                </section>
              )}
            </div>
          )}

          {activeTab === 'readme' && project.readme && (
            <div className="tab-content">
              <div className="readme-container markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {project.readme}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="tab-content">
              {/* Rating */}
              <div className="rating-section">
                <div className="rating-display">
                  <div className="avg-rating">
                    <Star size={20} fill="currentColor" className="rating-star-icon" />
                    <span className="avg-rating-value">{avgRating || '–'}</span>
                    <span className="avg-rating-count">{ratingCount > 0 ? `(${ratingCount})` : 'No ratings yet'}</span>
                  </div>
                </div>
                {user && (
                  <div className="rate-widget">
                    <span className="rate-label">Your rating:</span>
                    <div className="stars">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} className={`star-btn ${s <= myRating ? 'filled' : ''}`} onClick={() => handleRate(s)}>
                          <Star size={20} fill={s <= myRating ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Comment form */}
              {user ? (
                <form className="comment-form" onSubmit={handleComment}>
                  {replyTo && (
                    <div className="reply-banner">
                      Replying to comment
                      <button type="button" onClick={() => setReplyTo(null)}><X size={14} /></button>
                    </div>
                  )}
                  <div className="comment-input-row">
                    <img src={user.avatar_url} alt={user.name} className="avatar avatar-sm" />
                    <textarea
                      className="comment-textarea"
                      placeholder="Share your thoughts..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="comment-form-footer">
                    <button type="submit" className="btn btn-primary btn-sm" disabled={!commentText.trim()}>
                      <Send size={14} /> Post Comment
                    </button>
                  </div>
                </form>
              ) : (
                <div className="comment-login-prompt">
                  <Link to="/login" className="btn btn-secondary">Sign in to comment</Link>
                </div>
              )}

              {/* Comments list */}
              <div className="comments-list">
                {comments.length === 0 ? (
                  <div className="comments-empty">
                    <MessageCircle size={32} />
                    <p>No comments yet. Be the first!</p>
                  </div>
                ) : (
                  comments.map((c) => (
                    <CommentItem
                      key={c.id}
                      comment={c}
                      onReply={() => setReplyTo(c.id)}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <aside className="project-sidebar">
          {/* Author */}
          <div className="sidebar-card">
            <div className="sidebar-section-label">Created by</div>
            <Link to={`/profile/${project.username}`} className="author-row">
              <img src={project.author_avatar} alt={project.author_name} className="avatar avatar-md" />
              <div>
                <div className="author-sidebar-name">{project.author_name}</div>
                <div className="author-sidebar-username">@{project.username}</div>
              </div>
            </Link>
            {project.author_bio && <p className="author-sidebar-bio">{project.author_bio}</p>}
          </div>

          {/* Links */}
          <div className="sidebar-card">
            <div className="sidebar-section-label">Project Links</div>
            <div className="project-links">
              {project.live_demo_url && (
                <a href={project.live_demo_url} target="_blank" rel="noopener noreferrer" className="project-link-btn live">
                  <Globe size={16} /> Live Demo
                  <ExternalLink size={13} />
                </a>
              )}
              {project.repo_url && (
                <a href={project.repo_url} target="_blank" rel="noopener noreferrer" className="project-link-btn repo">
                  <GithubIcon size={16} /> Source Code
                  <ExternalLink size={13} />
                </a>
              )}
              {project.docs_url && (
                <a href={project.docs_url} target="_blank" rel="noopener noreferrer" className="project-link-btn docs">
                  <BookOpen size={16} /> Documentation
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>

          {/* Tech Stack */}
          {project.technologies?.length > 0 && (
            <div className="sidebar-card">
              <div className="sidebar-section-label">Tech Stack</div>
              <div className="sidebar-tech-list">
                {project.technologies.map((tech) => (
                  <span key={tech} className="sidebar-tech-pill">
                    <span className="lang-dot" style={{ background: LANG_COLORS[tech] || '#8b5cf6' }} />
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {(project.tags?.length > 0 || project.ai_tags?.length > 0) && (
            <div className="sidebar-card">
              <div className="sidebar-section-label">Tags</div>
              <div className="sidebar-tags">
                {[...new Set([...(project.tags || []), ...(project.ai_tags || [])])].map((tag) => (
                  <Link key={tag} to={`/explore?tag=${tag}`} className="badge badge-gray">{tag}</Link>
                ))}
              </div>
            </div>
          )}

          {/* GitHub stats */}
          {(project.github_stars > 0 || project.github_forks > 0) && (
            <div className="sidebar-card">
              <div className="sidebar-section-label">GitHub</div>
              <div className="gh-stats">
                <span className="gh-stat"><Star size={14} /> {project.github_stars} stars</span>
                <span className="gh-stat"><Users size={14} /> {project.github_forks} forks</span>
                {project.license && <span className="gh-stat"><Scale size={14} style={{ marginRight: '4px' }} /> {project.license}</span>}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="sidebar-card">
            <div className="sidebar-section-label">Stats</div>
            <div className="sidebar-stats">
              <div className="sidebar-stat"><Eye size={15} /><span>{project.views}</span><span className="stat-label">views</span></div>
              <div className="sidebar-stat"><Heart size={15} /><span>{likesCount}</span><span className="stat-label">likes</span></div>
              <div className="sidebar-stat"><Bookmark size={15} /><span>{project.bookmarks_count}</span><span className="stat-label">saves</span></div>
              <div className="sidebar-stat"><MessageCircle size={15} /><span>{project.comments_count}</span><span className="stat-label">comments</span></div>
            </div>
          </div>
        </aside>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && allMedia.length > 0 && (
        <div className="lightbox" onClick={() => setLightboxIdx(null)}>
          <button className="lightbox-close"><X size={24} /></button>
          {lightboxIdx > 0 && (
            <button className="lightbox-nav left" onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}>
              <ChevronLeft size={28} />
            </button>
          )}
          <img src={allMedia[lightboxIdx]} alt="" onClick={(e) => e.stopPropagation()} />
          {lightboxIdx < allMedia.length - 1 && (
            <button className="lightbox-nav right" onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}>
              <ChevronRight size={28} />
            </button>
          )}
          <div className="lightbox-counter">{lightboxIdx + 1} / {allMedia.length}</div>
        </div>
      )}
    </div>
  );
}

function CommentItem({ comment, onReply }: { comment: any; onReply: () => void }) {
  const { user } = useAppStore();
  const [upvoted, setUpvoted] = useState(comment.hasUpvoted || false);
  const [upvotes, setUpvotes] = useState(comment.upvotes || 0);

  const handleUpvote = async () => {
    if (!user) return;
    setUpvoted(!upvoted);
    setUpvotes(upvoted ? upvotes - 1 : upvotes + 1);
    try {
      await api.post(`/comments/${comment.id}/upvote`);
    } catch {
      setUpvoted(upvoted);
      setUpvotes(upvotes);
    }
  };

  return (
    <div className="comment-item">
      <img src={comment.avatar_url} alt={comment.name} className="avatar avatar-sm" />
      <div className="comment-body">
        <div className="comment-header">
          <span className="comment-author">{comment.name}</span>
          <span className="comment-username">@{comment.username}</span>
          <span className="comment-date">{new Date(comment.created_at).toLocaleDateString()}</span>
        </div>
        <p className="comment-content">{comment.content}</p>
        <div className="comment-actions">
          <button className={`comment-action-btn ${upvoted ? 'upvoted' : ''}`} onClick={handleUpvote}>
            <ThumbsUp size={13} /> {upvotes}
          </button>
          {user && <button className="comment-action-btn" onClick={onReply}>Reply</button>}
        </div>
        {comment.replies?.map((r: any) => (
          <div key={r.id} className="comment-reply">
            <img src={r.avatar_url} alt={r.name} className="avatar avatar-sm" style={{ width: 28, height: 28 }} />
            <div className="comment-body">
              <div className="comment-header">
                <span className="comment-author">{r.name}</span>
                <span className="comment-date">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <p className="comment-content">{r.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectPageSkeleton() {
  return (
    <div className="project-page">
      <div style={{ height: '400px' }} className="skeleton" />
      <div className="container project-body" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
          <div className="skeleton" style={{ height: '40px', width: '60%' }} />
          <div className="skeleton" style={{ height: '20px', width: '80%' }} />
          <div className="skeleton" style={{ height: '200px' }} />
        </div>
      </div>
    </div>
  );
}
