import { useState, useEffect } from 'react';
import { Settings, Save, User as UserIcon, Link as LinkIcon, MapPin, Briefcase, Image as ImageIcon, Map } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useTour } from '../context/TourContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import './DashboardPage.css'; // Reuse dashboard styles for layout

export default function SettingsPage() {
  const { user, fetchMe, addToast } = useAppStore();
  const { startTour } = useTour();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    website: '',
    twitter: '',
    linkedin: '',
    skills: '',
    avatar_url: '',
    banner_url: ''
  });

  useEffect(() => {
    document.title = 'Settings — Lookupon';
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        twitter: user.twitter || '',
        linkedin: user.linkedin || '',
        skills: Array.isArray(user.skills) ? user.skills.join(', ') : (typeof user.skills === 'string' ? user.skills : ''),
        avatar_url: user.avatar_url || '',
        banner_url: user.banner_url || ''
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
      await api.put('/auth/me', {
        ...formData,
        skills: skillsArray
      });
      await fetchMe();
      addToast('Profile updated successfully!', 'success');
    } catch (err) {
      addToast('Failed to update profile.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="container dashboard-header">
        <h1 className="dashboard-title font-display">
          <Settings size={28} /> Account Settings
        </h1>
        <p className="dashboard-subtitle" style={{ color: 'var(--text-secondary)' }}>
          Manage your public profile and preferences.
        </p>
      </div>

      <div className="container" style={{ paddingBottom: 'var(--space-16)' }}>
        
        {/* Retake Tour Container */}
        <div className="card card-glass" style={{ maxWidth: '800px', margin: '0 auto var(--space-8) auto', padding: 'var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Platform Tour</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Explore LOOKUPON features and get a guided walkthrough of the platform.</p>
          </div>
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              navigate('/');
              setTimeout(() => {
                startTour();
              }, 500);
            }}
          >
            <Map size={16} /> Retake Tour
          </button>
        </div>

        <div className="card card-glass" style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--space-8)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label"><UserIcon size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }}/> Display Name</label>
              <input type="text" name="name" className="input" value={formData.name} onChange={handleChange} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label"><ImageIcon size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }}/> Profile Picture URL</label>
                <input type="url" name="avatar_url" className="input" value={formData.avatar_url} onChange={handleChange} placeholder="https://..." />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label"><ImageIcon size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }}/> Background Banner URL</label>
                <input type="url" name="banner_url" className="input" value={formData.banner_url} onChange={handleChange} placeholder="https://..." />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">Bio</label>
              <textarea name="bio" className="input" rows={4} value={formData.bio} onChange={handleChange} placeholder="Tell the community about yourself..." />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label"><MapPin size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }}/> Location</label>
                <input type="text" name="location" className="input" value={formData.location} onChange={handleChange} placeholder="e.g. San Francisco, CA" />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label"><LinkIcon size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }}/> Personal Website</label>
                <input type="url" name="website" className="input" value={formData.website} onChange={handleChange} placeholder="https://yourdomain.com" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Twitter Handle</label>
                <input type="text" name="twitter" className="input" value={formData.twitter} onChange={handleChange} placeholder="e.g. yourhandle" />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">LinkedIn Handle</label>
                <input type="text" name="linkedin" className="input" value={formData.linkedin} onChange={handleChange} placeholder="e.g. in/yourhandle" />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label"><Briefcase size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }}/> Skills (comma separated)</label>
              <input type="text" name="skills" className="input" value={formData.skills} onChange={handleChange} placeholder="React, Node.js, Python..." />
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 'var(--space-2) 0' }} />

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : <><Save size={16} /> Save Changes</>}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
