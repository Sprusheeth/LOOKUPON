import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import {
  Search, Bell, Menu, X, Plus, LogOut,
  User, BookmarkCheck, LayoutDashboard, Compass,
  Sun, Moon, Monitor, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import api from '../api/client';
import './Navbar.css';

export default function Navbar() {
  const { user, theme, setTheme, logout, unreadCount, fetchNotifications, notifications } = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/explore?search=${encodeURIComponent(search.trim())}`);
  };

  const handleMarkRead = async () => {
    await api.post('/notifications/read');
    fetchNotifications();
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <div className="nav-container">
          <div className="nav-brand">
            <Link to="/" className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <img src="/favicon.svg" alt="Lookupon" style={{ height: '28px', width: '28px' }} />
              <span className="logo-text font-display" style={{ fontSize: '1.25rem', fontWeight: 800 }}>Lookupon</span>
            </Link>
          </div>
        </div>

        {/* Search — desktop */}
        <form className="navbar-search hide-mobile" onSubmit={handleSearch}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search projects, creators, topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          {search && (
            <button type="button" className="search-clear" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </form>

        {/* Nav links — desktop */}
        <div className="navbar-links hide-mobile">
          <Link to="/explore" className={`nav-link ${location.pathname === '/explore' ? 'active' : ''}`}>
            <Compass size={16} /> Explore
          </Link>
          <Link to="/creators" className={`nav-link ${location.pathname === '/creators' ? 'active' : ''}`}>
            <User size={16} /> Creators
          </Link>
        </div>

        {/* Right actions */}
        <div className="navbar-actions">
          <button 
            className="btn btn-icon btn-ghost" 
            onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
            title={`Theme: ${theme}`}
          >
            {theme === 'dark' ? <Moon size={18} /> : theme === 'light' ? <Sun size={18} /> : <Monitor size={18} />}
          </button>

          {user ? (
            <>
              {/* Create */}
              <Link to="/dashboard/create" className="btn btn-primary btn-sm hide-mobile">
                <Plus size={16} /> Create
              </Link>

              {/* Notifications */}
              <div className="notif-wrapper" ref={notifRef}>
                <button className="btn btn-icon btn-ghost notif-btn" onClick={() => setNotifOpen(!notifOpen)}>
                  <Bell size={18} />
                  {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </button>
                <AnimatePresence>
                {notifOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="notif-dropdown"
                  >
                    <div className="notif-header">
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <button className="btn btn-ghost btn-sm" onClick={handleMarkRead}>Mark all read</button>
                      )}
                    </div>
                    <div className="notif-list">
                      {notifications.length === 0 ? (
                        <div className="notif-empty">No notifications yet</div>
                      ) : (
                        notifications.slice(0, 10).map((n: any) => (
                          <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`}
                            onClick={() => { if (n.link) navigate(n.link); setNotifOpen(false); }}>
                            <div className="notif-message">{n.message}</div>
                            <div className="notif-time">{new Date(n.created_at).toLocaleDateString()}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>

              {/* User menu */}
              <div className="user-menu-wrapper" ref={userMenuRef}>
                <button className="user-avatar-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                  <img src={user.avatar_url} alt={user.name} className="avatar avatar-sm" />
                </button>
                <AnimatePresence>
                {userMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="user-dropdown"
                  >
                    <div className="user-dropdown-header">
                      <img src={user.avatar_url} alt={user.name} className="avatar avatar-md" />
                      <div>
                        <div className="user-dropdown-name">{user.name}</div>
                        <div className="user-dropdown-username">@{user.username}</div>
                      </div>
                    </div>
                    <div className="user-dropdown-divider" />
                    <Link to={`/profile/${user.username}`} className="user-dropdown-item">
                      <User size={15} /> Profile
                    </Link>
                    <Link to="/dashboard" className="user-dropdown-item">
                      <LayoutDashboard size={15} /> Dashboard
                    </Link>
                    <Link to="/dashboard/settings" className="user-dropdown-item">
                      <Settings size={15} /> Settings
                    </Link>
                    <Link to="/bookmarks" className="user-dropdown-item">
                      <BookmarkCheck size={15} /> Bookmarks
                    </Link>
                    <div className="user-dropdown-divider" />
                    <button className="user-dropdown-item danger" onClick={logout}>
                      <LogOut size={15} /> Sign out
                    </button>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
              <Link to="/login" className="btn btn-primary btn-sm hide-mobile">Get Started</Link>
            </>
          )}

          {/* Mobile menu */}
          <button className="btn btn-icon btn-ghost show-mobile-only" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
      {menuOpen && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mobile-menu"
        >
          <form className="mobile-search" onSubmit={handleSearch}>
            <Search size={16} />
            <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </form>
          <Link to="/explore" className="mobile-nav-link">Explore</Link>
          <Link to="/creators" className="mobile-nav-link">Creators</Link>
          {user && <Link to="/dashboard" className="mobile-nav-link">Dashboard</Link>}
          {user && <Link to="/dashboard/create" className="mobile-nav-link">Create Project</Link>}
        </motion.div>
      )}
      </AnimatePresence>
    </nav>
  );
}
