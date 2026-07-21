import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/client';

export interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  avatar_url: string;
  banner_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  github_url?: string;
  twitter?: string;
  linkedin?: string;
  skills: string[];
  badges: string[];
  followers_count: number;
  following_count: number;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  tagline?: string;
  description?: string;
  story?: string;
  problem_statement?: string;
  solution?: string;
  impact?: string;
  readme?: string;
  thumbnail_url?: string;
  screenshots: string[];
  demo_video_url?: string;
  live_demo_url?: string;
  repo_url?: string;
  docs_url?: string;
  architecture_diagram_url?: string;
  technologies: string[];
  tags: string[];
  category?: string;
  difficulty?: string;
  status: 'draft' | 'published';
  features: string[];
  learning_outcomes: string[];
  contributors: any[];
  hackathon?: string;
  license?: string;
  github_repo_id?: string;
  github_stars: number;
  github_forks: number;
  github_language?: string;
  ai_summary?: string;
  ai_tags: string[];
  ai_difficulty?: string;
  ai_improvements: string[];
  views: number;
  likes_count: number;
  bookmarks_count: number;
  comments_count: number;
  featured: boolean;
  trending_score: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  username?: string;
  author_name?: string;
  author_avatar?: string;
  author_bio?: string;
  // Viewer state
  isLiked?: boolean;
  isBookmarked?: boolean;
  myRating?: number;
  avgRating?: number;
  ratingCount?: number;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppState {
  user: User | null;
  token: string | null;
  theme: 'dark' | 'light' | 'system';
  toasts: Toast[];
  notifications: any[];
  unreadCount: number;
  authModalOpen: boolean;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setAuthModalOpen: (open: boolean) => void;
  logout: () => void;
  fetchMe: () => Promise<void>;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  fetchNotifications: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      theme: 'system',
      toasts: [],
      notifications: [],
      unreadCount: 0,
      authModalOpen: false,

      setUser: (user) => set({ user }),
      setToken: (token) => {
        if (token) localStorage.setItem('token', token);
        else localStorage.removeItem('token');
        set({ token });
      },
      setAuthModalOpen: (open) => set({ authModalOpen: open }),
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
      },
      fetchMe: async () => {
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data });
        } catch {
          get().logout();
        }
      },
      setTheme: (theme) => set({ theme }),
      addToast: (message, type = 'info') => {
        const id = Math.random().toString(36).slice(2);
        set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
        setTimeout(() => get().removeToast(id), 4000);
      },
      removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      fetchNotifications: async () => {
        try {
          const { data } = await api.get('/notifications');
          const unread = data.filter((n: any) => !n.read).length;
          set({ notifications: data, unreadCount: unread });
        } catch {}
      },
    }),
    {
      name: 'showcase-app',
      partialize: (s) => ({ user: s.user, token: s.token, theme: s.theme }),
    }
  )
);
