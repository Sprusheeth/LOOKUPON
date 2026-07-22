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

const apiRouter = express.Router();

// ─── Auth Routes ─────────────────────────────────────────────────────────────
apiRouter.post('/auth/register', authService.register);
apiRouter.get('/auth/check-username', authService.checkUsername);
apiRouter.get('/auth/check-email', authService.checkEmail);
apiRouter.post('/auth/login', authService.login);
apiRouter.get('/auth/github', authService.githubLogin);
apiRouter.get('/auth/github/callback', authService.githubCallback);
apiRouter.get('/auth/me', authMiddleware, authService.getMe);
apiRouter.put('/auth/me', authMiddleware, authService.updateProfile);

// ─── GitHub Routes ────────────────────────────────────────────────────────────
apiRouter.get('/github/repos', authMiddleware, githubService.getUserRepos);
apiRouter.post('/github/import', authMiddleware, githubService.importRepo);

// ─── AI Routes ────────────────────────────────────────────────────────────────
apiRouter.post('/ai/analyze', authMiddleware, aiService.analyzeProject);
apiRouter.post('/ai/analyze-url', authMiddleware, aiService.analyzeFromUrl);

// ─── Project Routes ───────────────────────────────────────────────────────────
apiRouter.get('/projects', optionalAuth, projectsService.getProjects);
apiRouter.get('/projects/trending', optionalAuth, projectsService.getTrending);
apiRouter.get('/projects/featured', optionalAuth, projectsService.getFeatured);
apiRouter.get('/projects/:id', optionalAuth, projectsService.getProject);
apiRouter.post('/projects', authMiddleware, projectsService.createProject);
apiRouter.put('/projects/:id', authMiddleware, projectsService.updateProject);
apiRouter.delete('/projects/:id', authMiddleware, projectsService.deleteProject);

// ─── User Routes ──────────────────────────────────────────────────────────────
apiRouter.get('/users', optionalAuth, socialService.getUsers);
apiRouter.get('/users/:username', optionalAuth, socialService.getUser);
apiRouter.get('/users/:username/projects', optionalAuth, projectsService.getUserProjects);
apiRouter.get('/users/:username/collections', optionalAuth, socialService.getCollections);

// ─── Social Routes ────────────────────────────────────────────────────────────
apiRouter.post('/projects/:projectId/like', authMiddleware, socialService.toggleLike);
apiRouter.post('/projects/:projectId/bookmark', authMiddleware, socialService.toggleBookmark);
apiRouter.post('/projects/:projectId/rate', authMiddleware, socialService.rateProject);
apiRouter.get('/projects/:projectId/comments', optionalAuth, socialService.getComments);
apiRouter.post('/projects/:projectId/comments', authMiddleware, socialService.addComment);
apiRouter.post('/comments/:commentId/upvote', authMiddleware, socialService.upvoteComment);

apiRouter.post('/users/:userId/follow', authMiddleware, socialService.toggleFollow);
apiRouter.get('/users/:userId/following', authMiddleware, socialService.isFollowing);

apiRouter.get('/bookmarks', authMiddleware, socialService.getBookmarks);
apiRouter.get('/notifications', authMiddleware, socialService.getNotifications);
apiRouter.post('/notifications/read', authMiddleware, socialService.markNotificationsRead);

apiRouter.post('/collections', authMiddleware, socialService.createCollection);
apiRouter.post('/collections/:collectionId/projects/:projectId', authMiddleware, socialService.addToCollection);

app.use('/api', apiRouter);

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`   GitHub OAuth: http://localhost:${PORT}/auth/github`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});
