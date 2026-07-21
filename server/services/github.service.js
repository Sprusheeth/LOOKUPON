const fetch = require('node-fetch');
const { query } = require('../db/database');

async function getUserRepos(req, res) {
  try {
    const userRes = await query('SELECT github_access_token FROM users WHERE id = ?', [req.userId]);
    const user = userRes.rows[0];
    if (!user || !user.github_access_token) {
      return res.status(400).json({ error: 'No GitHub access token. Please log in with GitHub.' });
    }

    const repos = [];
    let page = 1;
    while (page <= 5) {
      const r = await fetch(`https://api.github.com/user/repos?sort=updated&per_page=100&page=${page}`, {
        headers: { Authorization: `Bearer ${user.github_access_token}`, 'User-Agent': 'ProjectShowcase' },
      });
      const data = await r.json();
      if (!Array.isArray(data) || data.length === 0) break;
      repos.push(...data);
      if (data.length < 100) break;
      page++;
    }

    const formatted = repos.map((repo) => ({
      id: String(repo.id),
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      homepage: repo.homepage,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      topics: repo.topics || [],
      license: repo.license?.name,
      updatedAt: repo.updated_at,
      isPrivate: repo.private,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('GitHub repos fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
}

async function importRepo(req, res) {
  const { owner, repo } = req.body;
  if (!owner || !repo) return res.status(400).json({ error: 'owner and repo required' });

  try {
    const userRes = await query('SELECT github_access_token FROM users WHERE id = ?', [req.userId]);
    const user = userRes.rows[0];
    if (!user || !user.github_access_token) {
      return res.status(400).json({ error: 'No GitHub access token' });
    }

    const headers = { Authorization: `Bearer ${user.github_access_token}`, 'User-Agent': 'ProjectShowcase' };

    const [repoRes, langRes, readmeRes] = await Promise.allSettled([
      fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers }),
    ]);

    const repoData = repoRes.status === 'fulfilled' ? await repoRes.value.json() : {};
    const langData = langRes.status === 'fulfilled' ? await langRes.value.json() : {};
    let readmeContent = '';
    if (readmeRes.status === 'fulfilled') {
      const rd = await readmeRes.value.json();
      if (rd.content) {
        readmeContent = Buffer.from(rd.content, 'base64').toString('utf-8');
      }
    }

    const technologies = Object.keys(langData);

    res.json({
      title: repoData.name || repo,
      description: repoData.description || '',
      readme: readmeContent,
      technologies,
      tags: repoData.topics || [],
      repoUrl: repoData.html_url,
      liveDemoUrl: repoData.homepage || '',
      license: repoData.license?.name || '',
      githubRepoId: String(repoData.id),
      githubStars: repoData.stargazers_count || 0,
      githubForks: repoData.forks_count || 0,
      githubLanguage: repoData.language || '',
    });
  } catch (err) {
    console.error('Import repo error:', err);
    res.status(500).json({ error: 'Failed to import repository' });
  }
}

module.exports = { getUserRepos, importRepo };
