import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, Edit, Eye, EyeOff, BarChart2,
  Upload, RefreshCw, Star, GitFork, CheckCircle, Sparkles, Rocket,
} from 'lucide-react';
import { GithubIcon } from '../components/GithubIcon';
import api from '../api/client';
import type { Project } from '../store/useAppStore';
import { useAppStore } from '../store/useAppStore';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAppStore();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [activeTab, setActiveTab] = useState<'projects' | 'import'>('projects');
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState<string | null>(null);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    document.title = 'Dashboard — Lookupon';
    fetchProjects();
  }, [user]);

  async function fetchProjects() {
    try {
      const { data } = await api.get(`/users/${user!.username}/projects`);
      setProjects(data);
      setImportedIds(new Set(data.filter((p: Project) => p.github_repo_id).map((p: Project) => p.github_repo_id!)));
    } finally {
      setLoading(false);
    }
  }

  async function fetchRepos() {
    setLoadingRepos(true);
    try {
      const { data } = await api.get('/github/repos');
      setRepos(data);
    } catch {
      useAppStore.getState().addToast('Failed to fetch repos. Make sure you logged in with GitHub.', 'error');
    } finally {
      setLoadingRepos(false);
    }
  }

  async function importRepo(repo: any) {
    setImporting(repo.id);
    try {
      const [owner, repoName] = repo.fullName.split('/');
      const { data: importData } = await api.post('/github/import', { owner, repo: repoName });
      // Navigate to create page with prefilled data
      navigate('/dashboard/create', { state: { prefill: importData } });
    } catch {
      useAppStore.getState().addToast('Import failed', 'error');
    } finally {
      setImporting(null);
    }
  }

  async function togglePublish(p: Project) {
    const newStatus = p.status === 'published' ? 'draft' : 'published';
    try {
      await api.put(`/projects/${p.id}`, { status: newStatus });
      setProjects((prev) => prev.map((proj) => proj.id === p.id ? { ...proj, status: newStatus } : proj));
      useAppStore.getState().addToast(newStatus === 'published' ? 'Project published!' : 'Project unpublished', 'success');
    } catch {}
  }

  async function deleteProject(id: string) {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects((p) => p.filter((proj) => proj.id !== id));
      useAppStore.getState().addToast('Project deleted', 'success');
    } catch {}
  }

  const published = projects.filter((p) => p.status === 'published');
  const drafts = projects.filter((p) => p.status === 'draft');
  const totalViews = projects.reduce((s, p) => s + p.views, 0);
  const totalLikes = projects.reduce((s, p) => s + p.likes_count, 0);

  return (
    <div className="dashboard-page">
      <div className="container dashboard-inner">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <div className="sidebar-user">
            <img src={user?.avatar_url} alt={user?.name} className="avatar avatar-md" />
            <div>
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-username">@{user?.username}</div>
            </div>
          </div>

          <div className="sidebar-stats-mini">
            <div className="mini-stat"><span className="mini-stat-value">{published.length}</span><span>Published</span></div>
            <div className="mini-stat"><span className="mini-stat-value">{drafts.length}</span><span>Drafts</span></div>
            <div className="mini-stat"><span className="mini-stat-value">{totalViews}</span><span>Views</span></div>
            <div className="mini-stat"><span className="mini-stat-value">{totalLikes}</span><span>Likes</span></div>
          </div>

          <nav className="sidebar-nav">
            <button
              className={`sidebar-nav-item ${activeTab === 'projects' ? 'active' : ''}`}
              onClick={() => setActiveTab('projects')}
            >
              <BarChart2 size={17} /> My Projects
            </button>
            <button
              className={`sidebar-nav-item ${activeTab === 'import' ? 'active' : ''}`}
              onClick={() => { setActiveTab('import'); if (repos.length === 0) fetchRepos(); }}
            >
              <GithubIcon size={17} /> Import from GitHub
            </button>
          </nav>

          <Link to="/dashboard/create" className="btn btn-primary" style={{ marginTop: 'auto' }}>
            <Plus size={16} /> Create Project
          </Link>
        </aside>

        {/* Main */}
        <main className="dashboard-main">
          {activeTab === 'projects' && (
            <>
              <div className="dashboard-main-header">
                <h1 className="dashboard-title font-display">My Projects</h1>
                <Link to="/dashboard/create" className="btn btn-primary btn-sm">
                  <Plus size={15} /> New Project
                </Link>
              </div>

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '12px' }} />)}
                </div>
              ) : projects.length === 0 ? (
                <div className="dashboard-empty">
                  <div className="empty-icon"><Rocket size={48} /></div>
                  <h3>No projects yet</h3>
                  <p>Create your first project or import from GitHub</p>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link to="/dashboard/create" className="btn btn-primary">Create Project</Link>
                    <button className="btn btn-secondary" onClick={() => { setActiveTab('import'); fetchRepos(); }}>
                      <GithubIcon size={16} /> Import from GitHub
                    </button>
                  </div>
                </div>
              ) : (
                <div className="project-table">
                  {projects.map((p) => (
                    <div key={p.id} className="project-row">
                      <div className="project-row-info">
                        <div className="project-row-title">{p.title}</div>
                        <div className="project-row-meta">
                          <span className={`status-pill ${p.status}`}>{p.status}</span>
                          <span className="stat-chip"><Eye size={13} /> {p.views}</span>
                          <span className="stat-chip" style={{ color: '#f472b6' }}>♥ {p.likes_count}</span>
                          {p.github_stars > 0 && <span className="stat-chip"><Star size={13} /> {p.github_stars}</span>}
                        </div>
                      </div>
                      <div className="project-row-actions">
                        <Link to={`/dashboard/edit/${p.id}`} className="btn btn-ghost btn-sm"><Edit size={14} /> Edit</Link>
                        <Link to={`/projects/${p.id}`} className="btn btn-ghost btn-sm"><Eye size={14} /> View</Link>
                        <button
                          className={`btn btn-sm ${p.status === 'published' ? 'btn-secondary' : 'btn-primary'}`}
                          onClick={() => togglePublish(p)}
                        >
                          {p.status === 'published' ? <><EyeOff size={14} /> Unpublish</> : <><CheckCircle size={14} /> Publish</>}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteProject(p.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'import' && (
            <>
              <div className="dashboard-main-header">
                <h1 className="dashboard-title font-display">Import from GitHub</h1>
                <button className="btn btn-secondary btn-sm" onClick={fetchRepos} disabled={loadingRepos}>
                  <RefreshCw size={15} className={loadingRepos ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>
              <p className="dashboard-subtitle">Select repositories to import and enhance with AI</p>

              {loadingRepos ? (
                <div className="repos-loading">
                  {[1,2,3,4,5,6].map((i) => <div key={i} className="skeleton repo-skeleton" />)}
                </div>
              ) : repos.length === 0 ? (
                <div className="dashboard-empty">
                  <GithubIcon size={48} />
                  <h3>No repositories found</h3>
                  <p>Make sure you logged in with GitHub and have public repositories</p>
                  <button className="btn btn-secondary" onClick={fetchRepos}>Try Again</button>
                </div>
              ) : (
                <div className="repos-grid">
                  {repos.map((repo) => {
                    const alreadyImported = importedIds.has(repo.id);
                    return (
                      <div key={repo.id} className={`repo-card ${alreadyImported ? 'imported' : ''}`}>
                        <div className="repo-card-header">
                          <GithubIcon size={16} />
                          <span className="repo-name">{repo.name}</span>
                          {repo.isPrivate && <span className="badge badge-gray" style={{ fontSize: '0.65rem' }}>Private</span>}
                          {alreadyImported && <span className="badge badge-green">✓ Imported</span>}
                        </div>
                        {repo.description && <p className="repo-desc">{repo.description}</p>}
                        <div className="repo-meta">
                          {repo.language && (
                            <span className="repo-lang">
                              <span className="lang-dot" style={{ background: '#8b5cf6' }} />
                              {repo.language}
                            </span>
                          )}
                          <span className="stat-chip"><Star size={12} /> {repo.stars}</span>
                          <span className="stat-chip"><GitFork size={12} /> {repo.forks}</span>
                        </div>
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={!!importing || alreadyImported}
                          onClick={() => importRepo(repo)}
                        >
                          {importing === repo.id ? (
                            <><RefreshCw size={13} className="animate-spin" /> Importing...</>
                          ) : alreadyImported ? (
                            <><CheckCircle size={13} /> Imported</>
                          ) : (
                            <><Sparkles size={13} /> Import & Enhance</>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
