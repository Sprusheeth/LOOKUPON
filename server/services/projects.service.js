const { query, uuidv4 } = require('../db/database');

function parseProject(p) {
  if (!p) return null;
  return {
    ...p,
    screenshots: typeof p.screenshots === 'string' ? JSON.parse(p.screenshots || '[]') : p.screenshots,
    technologies: typeof p.technologies === 'string' ? JSON.parse(p.technologies || '[]') : p.technologies,
    tags: typeof p.tags === 'string' ? JSON.parse(p.tags || '[]') : p.tags,
    features: typeof p.features === 'string' ? JSON.parse(p.features || '[]') : p.features,
    learning_outcomes: typeof p.learning_outcomes === 'string' ? JSON.parse(p.learning_outcomes || '[]') : p.learning_outcomes,
    contributors: typeof p.contributors === 'string' ? JSON.parse(p.contributors || '[]') : p.contributors,
    ai_tags: typeof p.ai_tags === 'string' ? JSON.parse(p.ai_tags || '[]') : p.ai_tags,
    ai_improvements: typeof p.ai_improvements === 'string' ? JSON.parse(p.ai_improvements || '[]') : p.ai_improvements,
  };
}

async function getProjects(req, res) {
  const {
    search, category, difficulty, technology, tag, sort = 'trending',
    page = 1, limit = 20, userId
  } = req.query;

  let sql = `
    SELECT p.*, u.username, u.name as author_name, u.avatar_url as author_avatar
    FROM projects p
    JOIN users u ON p.user_id = u.id
    WHERE p.status = 'published'
  `;
  const params = [];

  if (search) {
    sql += ` AND (p.title ILIKE ? OR p.description ILIKE ? OR p.tagline ILIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  if (category) { sql += ` AND p.category = ?`; params.push(category); }
  if (difficulty) { sql += ` AND p.difficulty = ?`; params.push(difficulty); }
  if (technology) { sql += ` AND p.technologies ILIKE ?`; params.push(`%${technology}%`); }
  if (tag) { sql += ` AND p.tags ILIKE ?`; params.push(`%${tag}%`); }
  if (userId) { sql += ` AND p.user_id = ?`; params.push(userId); }

  const sortMap = {
    trending: 'p.trending_score DESC, p.views DESC',
    newest: 'p.published_at DESC',
    'most-liked': 'p.likes_count DESC',
    'most-viewed': 'p.views DESC',
  };
  sql += ` ORDER BY ${sortMap[sort] || sortMap.trending}`;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  sql += ` LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  try {
    const result = await query(sql, params);
    const projects = result.rows.map(parseProject);

    if (req.userId) {
      for (const p of projects) {
        const likeRes = await query('SELECT 1 FROM likes WHERE user_id=? AND project_id=?', [req.userId, p.id]);
        p.isLiked = likeRes.rows.length > 0;
        const bmRes = await query('SELECT 1 FROM bookmarks WHERE user_id=? AND project_id=?', [req.userId, p.id]);
        p.isBookmarked = bmRes.rows.length > 0;
      }
    }
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getProject(req, res) {
  const { id } = req.params;
  try {
    const pRes = await query(`
      SELECT p.*, u.username, u.name as author_name, u.avatar_url as author_avatar, u.bio as author_bio
      FROM projects p JOIN users u ON p.user_id = u.id
      WHERE p.id = ? AND (p.status = 'published' OR p.user_id = ?)
    `, [id, req.userId || '']);
    
    if (pRes.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    
    await query(`UPDATE projects SET views = views + 1, trending_score = trending_score + 0.1 WHERE id = ?`, [id]);
    
    const project = parseProject(pRes.rows[0]);
    if (req.userId) {
      const likeRes = await query('SELECT 1 FROM likes WHERE user_id=? AND project_id=?', [req.userId, id]);
      project.isLiked = likeRes.rows.length > 0;
      const bmRes = await query('SELECT 1 FROM bookmarks WHERE user_id=? AND project_id=?', [req.userId, id]);
      project.isBookmarked = bmRes.rows.length > 0;
      const rateRes = await query('SELECT score FROM ratings WHERE user_id=? AND project_id=?', [req.userId, id]);
      project.myRating = rateRes.rows[0]?.score || 0;
    }

    const avgRes = await query('SELECT AVG(score) as avg, COUNT(*) as cnt FROM ratings WHERE project_id=?', [id]);
    project.avgRating = Math.round((parseFloat(avgRes.rows[0]?.avg) || 0) * 10) / 10;
    project.ratingCount = parseInt(avgRes.rows[0]?.cnt) || 0;

    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function createProject(req, res) {
  const id = uuidv4();
  const {
    title, tagline, description, story, problem_statement, solution, impact,
    readme, thumbnail_url, screenshots, demo_video_url, live_demo_url,
    repo_url, docs_url, architecture_diagram_url, technologies, tags,
    category, difficulty, features, learning_outcomes, contributors,
    hackathon, license, github_repo_id, github_stars, github_forks,
    github_language, ai_summary, ai_tags, ai_difficulty, ai_improvements,
    status = 'draft',
  } = req.body;

  try {
    await query(`
      INSERT INTO projects (
        id, user_id, title, tagline, description, story, problem_statement, solution, impact,
        readme, thumbnail_url, screenshots, demo_video_url, live_demo_url, repo_url,
        docs_url, architecture_diagram_url, technologies, tags, category, difficulty,
        features, learning_outcomes, contributors, hackathon, license,
        github_repo_id, github_stars, github_forks, github_language,
        ai_summary, ai_tags, ai_difficulty, ai_improvements, status, published_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `, [
      id, req.userId, title, tagline, description, story, problem_statement, solution, impact,
      readme, thumbnail_url,
      JSON.stringify(screenshots || []),
      demo_video_url, live_demo_url, repo_url, docs_url, architecture_diagram_url,
      JSON.stringify(technologies || []),
      JSON.stringify(tags || []),
      category, difficulty,
      JSON.stringify(features || []),
      JSON.stringify(learning_outcomes || []),
      JSON.stringify(contributors || []),
      hackathon, license, github_repo_id, github_stars || 0, github_forks || 0, github_language,
      ai_summary,
      JSON.stringify(ai_tags || []),
      ai_difficulty,
      JSON.stringify(ai_improvements || []),
      status,
      status === 'published' ? new Date().toISOString() : null
    ]);
    res.status(201).json({ id });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function updateProject(req, res) {
  const { id } = req.params;
  try {
    const pRes = await query('SELECT * FROM projects WHERE id=? AND user_id=?', [id, req.userId]);
    if (pRes.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    const project = pRes.rows[0];

    const fields = [
      'title', 'tagline', 'description', 'story', 'problem_statement', 'solution', 'impact',
      'readme', 'thumbnail_url', 'demo_video_url', 'live_demo_url', 'repo_url',
      'docs_url', 'architecture_diagram_url', 'category', 'difficulty', 'hackathon', 'license',
      'ai_summary', 'ai_difficulty', 'status',
    ];
    const jsonFields = ['screenshots', 'technologies', 'tags', 'features', 'learning_outcomes', 'contributors', 'ai_tags', 'ai_improvements'];

    const updates = [];
    const params = [];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = ?`);
        params.push(req.body[f]);
      }
    });

    jsonFields.forEach((f) => {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = ?`);
        params.push(JSON.stringify(req.body[f]));
      }
    });

    if (req.body.status === 'published' && project.status !== 'published') {
      updates.push(`published_at = CURRENT_TIMESTAMP`);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id, req.userId);

    if (updates.length > 1) { // 1 is updated_at
      await query(`UPDATE projects SET ${updates.join(', ')} WHERE id=? AND user_id=?`, params);
    }
    res.json({ success: true });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function deleteProject(req, res) {
  const { id } = req.params;
  try {
    await query('DELETE FROM projects WHERE id=? AND user_id=?', [id, req.userId]);
    res.json({ success: true });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getUserProjects(req, res) {
  const { username } = req.params;
  try {
    const uRes = await query('SELECT id FROM users WHERE username=?', [username]);
    if (uRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = uRes.rows[0];

    const isOwner = req.userId === user.id;
    const sql = isOwner
      ? 'SELECT * FROM projects WHERE user_id=? ORDER BY updated_at DESC'
      : "SELECT * FROM projects WHERE user_id=? AND status='published' ORDER BY published_at DESC";

    const pRes = await query(sql, [user.id]);
    res.json(pRes.rows.map(parseProject));
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getTrending(req, res) {
  try {
    const pRes = await query(`
      SELECT p.*, u.username, u.name as author_name, u.avatar_url as author_avatar
      FROM projects p JOIN users u ON p.user_id = u.id
      WHERE p.status = 'published'
      ORDER BY p.trending_score DESC, p.likes_count DESC
      LIMIT 12
    `);
    res.json(pRes.rows.map(parseProject));
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getFeatured(req, res) {
  try {
    const pRes = await query(`
      SELECT p.*, u.username, u.name as author_name, u.avatar_url as author_avatar
      FROM projects p JOIN users u ON p.user_id = u.id
      WHERE p.status = 'published' AND p.featured = 1
      ORDER BY p.published_at DESC LIMIT 6
    `);
    res.json(pRes.rows.map(parseProject));
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getProjects, getProject, createProject, updateProject, deleteProject, getUserProjects, getTrending, getFeatured };
