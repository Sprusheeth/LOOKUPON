const { query, uuidv4 } = require('../db/database');

// Likes
async function toggleLike(req, res) {
  const { projectId } = req.params;
  try {
    const existing = await query('SELECT id FROM likes WHERE user_id=? AND project_id=?', [req.userId, projectId]);
    if (existing.rows.length > 0) {
      await query('DELETE FROM likes WHERE user_id=? AND project_id=?', [req.userId, projectId]);
      await query('UPDATE projects SET likes_count=GREATEST(0,likes_count-1), trending_score=GREATEST(0,trending_score-1) WHERE id=?', [projectId]);
      return res.json({ liked: false });
    }
    await query('INSERT INTO likes (id,user_id,project_id) VALUES (?,?,?)', [uuidv4(), req.userId, projectId]);
    await query('UPDATE projects SET likes_count=likes_count+1, trending_score=trending_score+2 WHERE id=?', [projectId]);
    
    // Notify project owner
    const projectRes = await query('SELECT user_id, title FROM projects WHERE id=?', [projectId]);
    const project = projectRes.rows[0];
    if (project && project.user_id !== req.userId) {
      const meRes = await query('SELECT username FROM users WHERE id=?', [req.userId]);
      const me = meRes.rows[0];
      await query('INSERT INTO notifications (id,user_id,type,message,link) VALUES (?,?,?,?,?)', [
        uuidv4(), project.user_id, 'like', `${me?.username} liked your project "${project.title}"`, `/projects/${projectId}`
      ]);
    }
    res.json({ liked: true });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

// Bookmarks
async function toggleBookmark(req, res) {
  const { projectId } = req.params;
  try {
    const existing = await query('SELECT id FROM bookmarks WHERE user_id=? AND project_id=?', [req.userId, projectId]);
    if (existing.rows.length > 0) {
      await query('DELETE FROM bookmarks WHERE user_id=? AND project_id=?', [req.userId, projectId]);
      await query('UPDATE projects SET bookmarks_count=GREATEST(0,bookmarks_count-1) WHERE id=?', [projectId]);
      return res.json({ bookmarked: false });
    }
    await query('INSERT INTO bookmarks (id,user_id,project_id) VALUES (?,?,?)', [uuidv4(), req.userId, projectId]);
    await query('UPDATE projects SET bookmarks_count=bookmarks_count+1 WHERE id=?', [projectId]);
    res.json({ bookmarked: true });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getBookmarks(req, res) {
  try {
    const result = await query(`
      SELECT p.*, u.username, u.name as author_name, u.avatar_url as author_avatar
      FROM bookmarks b
      JOIN projects p ON b.project_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE b.user_id = ? AND p.status = 'published'
      ORDER BY b.created_at DESC
    `, [req.userId]);
    const projects = result.rows.map(p => ({
      ...p,
      screenshots: typeof p.screenshots === 'string' ? JSON.parse(p.screenshots || '[]') : p.screenshots,
      technologies: typeof p.technologies === 'string' ? JSON.parse(p.technologies || '[]') : p.technologies,
      tags: typeof p.tags === 'string' ? JSON.parse(p.tags || '[]') : p.tags,
    }));
    res.json(projects);
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

// Comments
async function getComments(req, res) {
  const { projectId } = req.params;
  try {
    const commentsRes = await query(`
      SELECT c.*, u.username, u.name, u.avatar_url
      FROM comments c JOIN users u ON c.user_id = u.id
      WHERE c.project_id = ? AND c.parent_id IS NULL
      ORDER BY c.created_at DESC
    `, [projectId]);
    
    const comments = commentsRes.rows;

    for (const c of comments) {
      const repliesRes = await query(`
        SELECT c.*, u.username, u.name, u.avatar_url
        FROM comments c JOIN users u ON c.user_id = u.id
        WHERE c.parent_id = ?
        ORDER BY c.created_at ASC
      `, [c.id]);
      c.replies = repliesRes.rows;
      if (req.userId) {
        const upRes = await query('SELECT 1 FROM comment_upvotes WHERE user_id=? AND comment_id=?', [req.userId, c.id]);
        c.hasUpvoted = upRes.rows.length > 0;
      }
    }

    res.json(comments);
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function addComment(req, res) {
  const { projectId } = req.params;
  const { content, parentId } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Content required' });

  const id = uuidv4();
  try {
    await query('INSERT INTO comments (id,user_id,project_id,parent_id,content) VALUES (?,?,?,?,?)', [
      id, req.userId, projectId, parentId || null, content.trim()
    ]);
    await query('UPDATE projects SET comments_count=comments_count+1 WHERE id=?', [projectId]);

    const projRes = await query('SELECT user_id, title FROM projects WHERE id=?', [projectId]);
    const project = projRes.rows[0];
    if (project && project.user_id !== req.userId) {
      const meRes = await query('SELECT username FROM users WHERE id=?', [req.userId]);
      const me = meRes.rows[0];
      await query('INSERT INTO notifications (id,user_id,type,message,link) VALUES (?,?,?,?,?)', [
        uuidv4(), project.user_id, 'comment', `${me?.username} commented on "${project.title}"`, `/projects/${projectId}`
      ]);
    }

    const cRes = await query(`SELECT c.*,u.username,u.name,u.avatar_url FROM comments c JOIN users u ON c.user_id=u.id WHERE c.id=?`, [id]);
    res.status(201).json({ ...cRes.rows[0], replies: [] });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function upvoteComment(req, res) {
  const { commentId } = req.params;
  try {
    const existing = await query('SELECT 1 FROM comment_upvotes WHERE user_id=? AND comment_id=?', [req.userId, commentId]);
    if (existing.rows.length > 0) {
      await query('DELETE FROM comment_upvotes WHERE user_id=? AND comment_id=?', [req.userId, commentId]);
      await query('UPDATE comments SET upvotes=GREATEST(0,upvotes-1) WHERE id=?', [commentId]);
      return res.json({ upvoted: false });
    }
    await query('INSERT INTO comment_upvotes (user_id,comment_id) VALUES (?,?)', [req.userId, commentId]);
    await query('UPDATE comments SET upvotes=upvotes+1 WHERE id=?', [commentId]);
    res.json({ upvoted: true });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

// Follow
async function toggleFollow(req, res) {
  const { userId: targetId } = req.params;
  if (targetId === req.userId) return res.status(400).json({ error: 'Cannot follow yourself' });

  try {
    const existing = await query('SELECT 1 FROM follows WHERE follower_id=? AND following_id=?', [req.userId, targetId]);
    if (existing.rows.length > 0) {
      await query('DELETE FROM follows WHERE follower_id=? AND following_id=?', [req.userId, targetId]);
      await query('UPDATE users SET followers_count=GREATEST(0,followers_count-1) WHERE id=?', [targetId]);
      await query('UPDATE users SET following_count=GREATEST(0,following_count-1) WHERE id=?', [req.userId]);
      return res.json({ following: false });
    }
    await query('INSERT INTO follows (follower_id,following_id) VALUES (?,?)', [req.userId, targetId]);
    await query('UPDATE users SET followers_count=followers_count+1 WHERE id=?', [targetId]);
    await query('UPDATE users SET following_count=following_count+1 WHERE id=?', [req.userId]);
    res.json({ following: true });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function isFollowing(req, res) {
  const { userId: targetId } = req.params;
  try {
    const resFollow = await query('SELECT 1 FROM follows WHERE follower_id=? AND following_id=?', [req.userId, targetId]);
    res.json({ following: resFollow.rows.length > 0 });
  } catch(err) {
    res.status(500).json({ error: 'Server error' });
  }
}

// Ratings
async function rateProject(req, res) {
  const { projectId } = req.params;
  const { score } = req.body;
  if (!score || score < 1 || score > 5) return res.status(400).json({ error: 'Score must be 1-5' });

  try {
    await query(`
      INSERT INTO ratings (id,user_id,project_id,score) 
      VALUES (?,?,?,?)
      ON CONFLICT (user_id, project_id) DO UPDATE SET score = EXCLUDED.score
    `, [uuidv4(), req.userId, projectId, score]);
    
    const avgRes = await query('SELECT AVG(score) as avg, COUNT(*) as cnt FROM ratings WHERE project_id=?', [projectId]);
    res.json({ avgRating: Math.round(parseFloat(avgRes.rows[0]?.avg || 0) * 10) / 10, ratingCount: parseInt(avgRes.rows[0]?.cnt || 0), myRating: score });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

// Collections
async function getCollections(req, res) {
  const { username } = req.params;
  try {
    const uRes = await query('SELECT id FROM users WHERE username=?', [username]);
    if (uRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const cols = await query('SELECT * FROM collections WHERE user_id=? ORDER BY created_at DESC', [uRes.rows[0].id]);
    res.json(cols.rows);
  } catch(err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function createCollection(req, res) {
  const { name, description, is_public = 1 } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const id = uuidv4();
  try {
    await query('INSERT INTO collections (id,user_id,name,description,is_public) VALUES (?,?,?,?,?)', [id, req.userId, name, description, is_public ? 1 : 0]);
    res.status(201).json({ id });
  } catch(err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function addToCollection(req, res) {
  const { collectionId, projectId } = req.params;
  try {
    const col = await query('SELECT id FROM collections WHERE id=? AND user_id=?', [collectionId, req.userId]);
    if (col.rows.length === 0) return res.status(404).json({ error: 'Collection not found' });
    await query('INSERT INTO collection_projects (collection_id,project_id) VALUES (?,?) ON CONFLICT DO NOTHING', [collectionId, projectId]);
    await query('UPDATE collections SET projects_count=(SELECT COUNT(*) FROM collection_projects WHERE collection_id=?) WHERE id=?', [collectionId, collectionId]);
    res.json({ success: true });
  } catch(err) {
    res.status(500).json({ error: 'Server error' });
  }
}

// Notifications
async function getNotifications(req, res) {
  try {
    const notifs = await query('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50', [req.userId]);
    res.json(notifs.rows);
  } catch(err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function markNotificationsRead(req, res) {
  try {
    await query("UPDATE notifications SET read=1 WHERE user_id=?", [req.userId]);
    res.json({ success: true });
  } catch(err) {
    res.status(500).json({ error: 'Server error' });
  }
}

// Users list
async function getUsers(req, res) {
  const { search, page = 1, limit = 20 } = req.query;
  let sql = 'SELECT id,username,name,avatar_url,bio,skills,followers_count,total_likes FROM users';
  const params = [];
  if (search) { sql += ' WHERE username ILIKE ? OR name ILIKE ?'; params.push(`%${search}%`, `%${search}%`); }
  sql += ' ORDER BY followers_count DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
  
  try {
    const uRes = await query(sql, params);
    const users = uRes.rows.map(u => ({ ...u, skills: typeof u.skills === 'string' ? JSON.parse(u.skills || '[]') : u.skills }));
    res.json(users);
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getUser(req, res) {
  const { username } = req.params;
  try {
    const uRes = await query('SELECT id,username,name,avatar_url,bio,location,website,twitter,linkedin,skills,badges,followers_count,following_count,total_views,total_likes,created_at FROM users WHERE username=?', [username]);
    if (uRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = uRes.rows[0];
    user.skills = typeof user.skills === 'string' ? JSON.parse(user.skills || '[]') : user.skills;
    user.badges = typeof user.badges === 'string' ? JSON.parse(user.badges || '[]') : user.badges;
    if (req.userId) {
      const fRes = await query('SELECT 1 FROM follows WHERE follower_id=? AND following_id=?', [req.userId, user.id]);
      user.isFollowing = fRes.rows.length > 0;
    }
    res.json(user);
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  toggleLike, toggleBookmark, getBookmarks,
  getComments, addComment, upvoteComment,
  toggleFollow, isFollowing,
  rateProject,
  getCollections, createCollection, addToCollection,
  getNotifications, markNotificationsRead,
  getUsers, getUser,
};
