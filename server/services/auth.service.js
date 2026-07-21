const fetch = require('node-fetch');
const bcrypt = require('bcryptjs');
const { query, uuidv4 } = require('../db/database');
const { generateToken } = require('../middleware/auth');

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/auth/github/callback';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

async function register(req, res) {
  const { username, email, password, name } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  const id = uuidv4();
  const password_hash = await bcrypt.hash(password, 10);
  const avatar_url = 'https://api.dicebear.com/7.x/notionists/svg?seed=' + username;

  try {
    const exist = await query('SELECT username, email FROM users WHERE username = ? OR email = ?', [username, email]);
    if (exist.rows.length > 0) {
      const isEmail = exist.rows.some(r => r.email === email);
      const isUsername = exist.rows.some(r => r.username === username);
      if (isEmail) return res.status(400).json({ error: 'Email already exists' });
      if (isUsername) return res.status(400).json({ error: 'Username already exists' });
    }

    await query(`
      INSERT INTO users (id, username, email, password_hash, avatar_url, name)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, username, email, password_hash, avatar_url, name || username]);
    const jwtToken = generateToken(id);
    res.json({ token: jwtToken, user: { id, username, email, avatar_url, name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  try {
    const result = await query('SELECT * FROM users WHERE email = ?', [email]);
    const user = result.rows[0];
    if (!user || !user.password_hash) return res.status(400).json({ error: 'Invalid credentials' });
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(400).json({ error: 'Invalid credentials' });
    
    const jwtToken = generateToken(user.id);
    const { password_hash, github_access_token, ...safeUser } = user;
    res.json({ token: jwtToken, user: safeUser });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function githubLogin(req, res) {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_CALLBACK_URL,
    scope: 'read:user user:email repo',
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
}

async function githubCallback(req, res) {
  const { code } = req.query;
  if (!code) return res.redirect(`${CLIENT_URL}/login?error=no_code`);

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code }),
    });
    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error_description);

    const accessToken = tokenData.access_token;

    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'ProjectShowcase' },
    });
    const ghUser = await userRes.json();

    let email = ghUser.email;
    if (!email) {
      const emailRes = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'ProjectShowcase' },
      });
      const emails = await emailRes.json();
      const primary = emails.find((e) => e.primary && e.verified);
      email = primary ? primary.email : null;
    }

    let result = await query('SELECT * FROM users WHERE github_id = ?', [String(ghUser.id)]);
    let user = result.rows[0];

    if (!user) {
      const id = uuidv4();
      await query(`
        INSERT INTO users (id, github_id, username, name, email, avatar_url, bio, location, website, github_url, github_access_token)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, String(ghUser.id), ghUser.login, ghUser.name || ghUser.login, email,
        ghUser.avatar_url, ghUser.bio, ghUser.location, ghUser.blog, ghUser.html_url, accessToken
      ]);
      result = await query('SELECT * FROM users WHERE id = ?', [id]);
      user = result.rows[0];
    } else {
      await query(`
        UPDATE users SET name=?, email=?, avatar_url=?, bio=?, location=?, website=?, github_access_token=?, updated_at=CURRENT_TIMESTAMP
        WHERE github_id=?
      `, [ghUser.name || ghUser.login, email, ghUser.avatar_url, ghUser.bio, ghUser.location, ghUser.blog, accessToken, String(ghUser.id)]);
    }

    const jwtToken = generateToken(user.id);
    res.redirect(`${CLIENT_URL}/auth/callback?token=${jwtToken}&userId=${user.id}`);
  } catch (err) {
    console.error('GitHub OAuth error:', err);
    res.redirect(`${CLIENT_URL}/login?error=oauth_failed`);
  }
}

async function getMe(req, res) {
  const result = await query('SELECT * FROM users WHERE id = ?', [req.userId]);
  const user = result.rows[0];
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { github_access_token, password_hash, ...safeUser } = user;
  safeUser.skills = JSON.parse(safeUser.skills || '[]');
  safeUser.badges = JSON.parse(safeUser.badges || '[]');
  res.json(safeUser);
}

async function updateProfile(req, res) {
  const { name, bio, location, website, twitter, linkedin, skills } = req.body;
  await query(`
    UPDATE users SET name=?, bio=?, location=?, website=?, twitter=?, linkedin=?, skills=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `, [name, bio, location, website, twitter, linkedin, JSON.stringify(skills || []), req.userId]);
  
  const result = await query('SELECT * FROM users WHERE id = ?', [req.userId]);
  const user = result.rows[0];
  const { github_access_token, password_hash, ...safeUser } = user;
  safeUser.skills = JSON.parse(safeUser.skills || '[]');
  safeUser.badges = JSON.parse(safeUser.badges || '[]');
  res.json(safeUser);
}

async function checkUsername(req, res) {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: 'Username is required' });
  
  try {
    const result = await query('SELECT username FROM users WHERE username = ?', [username]);
    if (result.rows.length === 0) {
      return res.json({ available: true });
    }
    
    // If taken, generate suggestions
    const suggestions = [];
    const base = username.replace(/[0-9]+$/, ''); // remove trailing numbers
    
    for (let i = 0; i < 3; i++) {
      const suffix = Math.floor(Math.random() * 10000);
      const suggestedName = `${base}${suffix}`;
      // Just assume they are available for speed, or we could check them
      suggestions.push(suggestedName);
    }
    
    return res.json({ 
      available: false, 
      message: 'Username is already taken. Try modifying it or use one of these:',
      suggestions 
    });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function checkEmail(req, res) {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  
  try {
    const result = await query('SELECT email FROM users WHERE email = ?', [email]);
    if (result.rows.length === 0) {
      return res.json({ available: true });
    }
    
    return res.json({ 
      available: false, 
      message: 'This email is already registered.' 
    });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  register,
  login,
  githubLogin,
  githubCallback,
  getMe,
  updateProfile,
  checkUsername,
  checkEmail
};
