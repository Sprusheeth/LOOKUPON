import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Globe, Users, Heart, Eye, Plus, UserMinus, UserPlus } from 'lucide-react';
import { GithubIcon } from '../components/GithubIcon';
import { TwitterIcon } from '../components/TwitterIcon';
import { LinkedinIcon } from '../components/LinkedinIcon';
import api from '../api/client';
import type { Project } from '../store/useAppStore';
import { useAppStore } from '../store/useAppStore';
import ProjectCard from '../components/ProjectCard';
import './ProfilePage.css';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: me, addToast } = useAppStore();
  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'projects' | 'about'>('projects');

  useEffect(() => {
    if (username) fetchProfile();
  }, [username]);

  async function fetchProfile() {
    try {
      const [profileRes, projectsRes] = await Promise.allSettled([
        api.get(`/users/${username}`),
        api.get(`/users/${username}/projects`),
      ]);
      if (profileRes.status === 'fulfilled') {
        setProfile(profileRes.value.data);
        setFollowing(profileRes.value.data.isFollowing || false);
      }
      if (projectsRes.status === 'fulfilled') setProjects(projectsRes.value.data);
    } finally {
      setLoading(false);
    }
  }

  const handleFollow = async () => {
    if (!me) { addToast('Sign in to follow', 'info'); return; }
    const prev = following;
    setFollowing(!following);
    try {
      await api.post(`/users/${profile.id}/follow`);
      addToast(following ? 'Unfollowed' : `Following ${profile.name}!`, 'success');
    } catch {
      setFollowing(prev);
    }
  };

  if (loading) return (
    <div className="profile-page">
      <div className="profile-page-inner container">
        <div className="skeleton profile-header-skeleton" />
      </div>
    </div>
  );

  if (!profile) return (
    <div className="profile-page">
      <div className="container" style={{ paddingTop: '8rem', textAlign: 'center' }}>
        <h2>User not found</h2>
      </div>
    </div>
  );

  const skills: string[] = typeof profile.skills === 'string' ? JSON.parse(profile.skills) : profile.skills || [];
  const badges: string[] = typeof profile.badges === 'string' ? JSON.parse(profile.badges) : profile.badges || [];
  const isOwn = me?.username === username;
  const published = projects.filter((p) => p.status === 'published');
  const totalLikes = projects.reduce((sum, p) => sum + (p.likes_count || 0), 0);
  const totalViews = projects.reduce((sum, p) => sum + (p.views || 0), 0);

  return (
    <div className="profile-page">
      {/* Banner */}
      <div className="profile-banner">
        <div className="profile-banner-gradient" />
      </div>

      <div className="container profile-page-inner">
        {/* Header */}
        <div className="profile-header">
          <div className="profile-avatar-wrap">
            <img src={profile.avatar_url} alt={profile.name} className="profile-avatar" />
          </div>

          <div className="profile-info">
            <div className="profile-name-row">
              <h1 className="profile-name font-display">{profile.name}</h1>
              {isOwn ? (
                <Link to="/dashboard/settings" className="btn btn-secondary btn-sm">Edit Profile</Link>
              ) : me ? (
                <button className={`btn btn-sm ${following ? 'btn-secondary' : 'btn-primary'}`} onClick={handleFollow}>
                  {following ? <><UserMinus size={15} /> Unfollow</> : <><UserPlus size={15} /> Follow</>}
                </button>
              ) : null}
            </div>
            <div className="profile-username">@{profile.username}</div>
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            <div className="profile-meta">
              {profile.location && <span><MapPin size={14} /> {profile.location}</span>}
              {profile.website && <a href={profile.website} target="_blank" rel="noopener noreferrer"><Globe size={14} /> Website</a>}
              {profile.twitter && <a href={`https://twitter.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer"><TwitterIcon size={14} /> Twitter</a>}
              {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"><LinkedinIcon size={14} /> LinkedIn</a>}
              {profile.github_url && <a href={profile.github_url} target="_blank" rel="noopener noreferrer"><GithubIcon size={14} /> GitHub</a>}
            </div>
          </div>

          {/* Stats */}
          <div className="profile-stats-row">
            <div className="profile-stat">
              <div className="profile-stat-value font-display">{published.length}</div>
              <div className="profile-stat-label">Projects</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value font-display">{profile.followers_count}</div>
              <div className="profile-stat-label">Followers</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value font-display">{profile.following_count}</div>
              <div className="profile-stat-label">Following</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value font-display">{totalLikes}</div>
              <div className="profile-stat-label">Total Likes</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value font-display">{totalViews}</div>
              <div className="profile-stat-label">Total Views</div>
            </div>
          </div>
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="profile-skills">
            {skills.map((s) => <span key={s} className="badge badge-purple">{s}</span>)}
          </div>
        )}

        {/* Tabs */}
        <div className="profile-tabs">
          <button className={`profile-tab ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}>
            Projects ({published.length})
          </button>
          <button className={`profile-tab ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}>
            About
          </button>
        </div>

        {/* Content */}
        {activeTab === 'projects' && (
          <div className="profile-projects-grid">
            {isOwn && (
              <Link to="/dashboard/create" className="add-project-card">
                <Plus size={32} />
                <span>Add New Project</span>
              </Link>
            )}
            {published.map((p) => <ProjectCard key={p.id} project={p} />)}
            {published.length === 0 && !isOwn && (
              <div className="profile-empty">No published projects yet</div>
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="profile-about">
            <div className="card">
              <h3 className="about-section-title">Bio</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {profile.bio || 'No bio provided.'}
              </p>
            </div>
            {badges.length > 0 && (
              <div className="card">
                <h3 className="about-section-title">Achievements & Badges</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {badges.map((b) => <span key={b} className="badge badge-orange">🏆 {b}</span>)}
                </div>
              </div>
            )}
            <div className="card">
              <h3 className="about-section-title">Member Since</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
