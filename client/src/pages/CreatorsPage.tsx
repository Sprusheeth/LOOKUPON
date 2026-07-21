import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users as UsersIcon, Star } from 'lucide-react';
import api from '../api/client';
import { useTour } from '../context/TourContext';
import './CreatorsPage.css';

export default function CreatorsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { isTourActive } = useTour();

  useEffect(() => {
    document.title = 'Creators — Lookupon';
    fetchUsers();
  }, []);

  const fetchUsers = async (q = '') => {
    try {
      const { data } = await api.get('/users', { params: { search: q, limit: 40 } });
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="creators-page">
      <div className="creators-page-header">
        <div className="container">
          <h1 className="font-display creators-page-title">Featured Creators</h1>
          <p className="creators-page-sub">Discover talented developers, designers, and researchers</p>
          <div className="creators-search">
            <Search size={17} />
            <input
              type="text"
              placeholder="Search by name or username..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); fetchUsers(e.target.value); }}
              className="creators-search-input"
            />
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '3rem 1.5rem 5rem' }}>
        {loading ? (
          <div className="creators-full-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '220px', borderRadius: '16px' }} />
            ))}
          </div>
        ) : (() => {
          const dummyCreator = {
            id: 'dummy-creator',
            name: 'Lookupon Team',
            username: 'lookupon',
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lookupon',
            followers_count: 100,
            total_likes: 42
          };
          const displayUsers = users.length > 0 ? users : (isTourActive ? [dummyCreator] : []);

          if (displayUsers.length === 0) {
            return (
              <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
                <UsersIcon size={48} />
                <p>No creators found</p>
              </div>
            );
          }

          return (
            <div className="creators-full-grid">
              {displayUsers.map((u, i) => {
                const skills = typeof u.skills === 'string' ? JSON.parse(u.skills || '[]') : (u.skills || []);
                return (
                  <Link key={u.id} to={`/profile/${u.username}`} className="creator-full-card card animate-fade-in-up" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
                    <img src={u.avatar_url} alt={u.name} className="avatar avatar-xl" style={{ margin: '0 auto', border: '3px solid rgba(139,92,246,0.3)' }} />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '3px' }}>{u.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{u.username}</div>
                    </div>
                    {u.bio && <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{u.bio}</p>}
                    {skills.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
                        {skills.slice(0, 3).map((s: string) => <span key={s} className="badge badge-purple">{s}</span>)}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><UsersIcon size={13} /> {u.followers_count}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Star size={13} /> {u.total_likes || 0}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
