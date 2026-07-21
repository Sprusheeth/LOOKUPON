require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { authMiddleware, optionalAuth } = require('./middleware/auth');
const authService = require('./services/auth.service');
const projectsService = require('./services/projects.service');
const githubService = require('./services/github.service');
const aiService = require('./services/ai.service');
const socialService = require('./services/social.service');

require('./db/database');

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(cors({ 
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow any localhost, any vercel.app domain, or the exact CLIENT_URL
    if (origin.includes('localhost') || 
        origin.endsWith('.vercel.app') || 
        origin === CLIENT_URL || 
        origin === CLIENT_URL + '/') {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true 
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use(limiter);

// ─── Auth Routes ─────────────────────────────────────────────────────────────
app.post('/auth/register', authService.register);
app.get('/auth/check-username', authService.checkUsername);
app.get('/auth/check-email', authService.checkEmail);
app.post('/auth/login', authService.login);
app.get('/auth/github', authService.githubLogin);
app.get('/auth/github/callback', authService.githubCallback);
app.get('/auth/me', authMiddleware, authService.getMe);
app.put('/auth/me', authMiddleware, authService.updateProfile);

// ─── GitHub Routes ────────────────────────────────────────────────────────────
app.get('/github/repos', authMiddleware, githubService.getUserRepos);
app.post('/github/import', authMiddleware, githubService.importRepo);

// ─── AI Routes ────────────────────────────────────────────────────────────────
app.post('/ai/analyze', authMiddleware, aiService.analyzeProject);
app.post('/ai/analyze-url', authMiddleware, aiService.analyzeFromUrl);

// ─── Project Routes ───────────────────────────────────────────────────────────
app.get('/projects', optionalAuth, projectsService.getProjects);
app.get('/projects/trending', optionalAuth, projectsService.getTrending);
app.get('/projects/featured', optionalAuth, projectsService.getFeatured);
app.get('/projects/:id', optionalAuth, projectsService.getProject);
app.post('/projects', authMiddleware, projectsService.createProject);
app.put('/projects/:id', authMiddleware, projectsService.updateProject);
app.delete('/projects/:id', authMiddleware, projectsService.deleteProject);

// ─── User Routes ──────────────────────────────────────────────────────────────
app.get('/users', optionalAuth, socialService.getUsers);
app.get('/users/:username', optionalAuth, socialService.getUser);
app.get('/users/:username/projects', optionalAuth, projectsService.getUserProjects);
app.get('/users/:username/collections', optionalAuth, socialService.getCollections);

// ─── Social Routes ────────────────────────────────────────────────────────────
app.post('/projects/:projectId/like', authMiddleware, socialService.toggleLike);
app.post('/projects/:projectId/bookmark', authMiddleware, socialService.toggleBookmark);
app.post('/projects/:projectId/rate', authMiddleware, socialService.rateProject);
app.get('/projects/:projectId/comments', optionalAuth, socialService.getComments);
app.post('/projects/:projectId/comments', authMiddleware, socialService.addComment);
app.post('/comments/:commentId/upvote', authMiddleware, socialService.upvoteComment);

app.post('/users/:userId/follow', authMiddleware, socialService.toggleFollow);
app.get('/users/:userId/following', authMiddleware, socialService.isFollowing);

app.get('/bookmarks', authMiddleware, socialService.getBookmarks);
app.get('/notifications', authMiddleware, socialService.getNotifications);
app.post('/notifications/read', authMiddleware, socialService.markNotificationsRead);

app.post('/collections', authMiddleware, socialService.createCollection);
app.post('/collections/:collectionId/projects/:projectId', authMiddleware, socialService.addToCollection);

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`   GitHub OAuth: http://localhost:${PORT}/auth/github`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});
