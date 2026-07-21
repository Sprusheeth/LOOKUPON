const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initSchema() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        github_id TEXT UNIQUE,
        username TEXT UNIQUE NOT NULL,
        name TEXT,
        email TEXT,
        password_hash TEXT,
        avatar_url TEXT,
        bio TEXT,
        location TEXT,
        website TEXT,
        github_url TEXT,
        twitter TEXT,
        linkedin TEXT,
        skills TEXT DEFAULT '[]',
        badges TEXT DEFAULT '[]',
        github_access_token TEXT,
        followers_count INTEGER DEFAULT 0,
        following_count INTEGER DEFAULT 0,
        total_views INTEGER DEFAULT 0,
        total_likes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        tagline TEXT,
        description TEXT,
        story TEXT,
        problem_statement TEXT,
        solution TEXT,
        impact TEXT,
        readme TEXT,
        thumbnail_url TEXT,
        screenshots TEXT DEFAULT '[]',
        demo_video_url TEXT,
        live_demo_url TEXT,
        repo_url TEXT,
        docs_url TEXT,
        architecture_diagram_url TEXT,
        technologies TEXT DEFAULT '[]',
        tags TEXT DEFAULT '[]',
        category TEXT,
        difficulty TEXT,
        status TEXT DEFAULT 'draft',
        features TEXT DEFAULT '[]',
        learning_outcomes TEXT DEFAULT '[]',
        contributors TEXT DEFAULT '[]',
        hackathon TEXT,
        license TEXT,
        github_repo_id TEXT,
        github_stars INTEGER DEFAULT 0,
        github_forks INTEGER DEFAULT 0,
        github_language TEXT,
        ai_summary TEXT,
        ai_tags TEXT DEFAULT '[]',
        ai_difficulty TEXT,
        ai_improvements TEXT DEFAULT '[]',
        views INTEGER DEFAULT 0,
        likes_count INTEGER DEFAULT 0,
        bookmarks_count INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        featured INTEGER DEFAULT 0,
        trending_score REAL DEFAULT 0,
        published_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS likes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, project_id)
      );

      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, project_id)
      );

      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        parent_id TEXT,
        content TEXT NOT NULL,
        upvotes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS comment_upvotes (
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, comment_id)
      );

      CREATE TABLE IF NOT EXISTS follows (
        follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (follower_id, following_id)
      );

      CREATE TABLE IF NOT EXISTS collections (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        cover_url TEXT,
        is_public INTEGER DEFAULT 1,
        projects_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS collection_projects (
        collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (collection_id, project_id)
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        link TEXT,
        read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ratings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, project_id)
      );

      CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
      CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
      CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
      CREATE INDEX IF NOT EXISTS idx_projects_trending ON projects(trending_score DESC);
      CREATE INDEX IF NOT EXISTS idx_comments_project ON comments(project_id);
      CREATE INDEX IF NOT EXISTS idx_likes_project ON likes(project_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    `);
    console.log('PostgreSQL Schema initialized.');
  } catch (err) {
    console.error('Error initializing schema:', err);
  } finally {
    client.release();
  }
}

// Ensure the schema initializes on startup
if (process.env.DATABASE_URL) {
  initSchema();
} else {
  console.warn('⚠️ No DATABASE_URL provided. Schema not initialized.');
}

async function query(text, params = []) {
  let counter = 1;
  const pgText = text.replace(/\?/g, () => `$${counter++}`);
  return pool.query(pgText, params);
}

module.exports = {
  query,
  uuidv4
};
