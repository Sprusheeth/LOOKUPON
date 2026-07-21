const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const CATEGORIES = ['Web Development','Mobile App','Machine Learning','Data Science','DevOps','Game Development','IoT','Blockchain','Security','Research','Design','Other'];

async function seed() {
  try {
    // 1. Create a dummy user
    const userId = uuidv4();
    await pool.query(`
      INSERT INTO users (id, username, name, email, avatar_url, bio, skills, total_views, total_likes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (username) DO NOTHING
    `, [
      userId, 
      'lookupon', 
      'Lookupon Team', 
      'team@lookupon.dev', 
      'https://api.dicebear.com/7.x/avataaars/svg?seed=lookupon', 
      'We are the official team behind the Lookupon Platform.',
      JSON.stringify(['Community', 'Platform']),
      1000,
      42
    ]);

    // get the user id in case it already existed
    const userRes = await pool.query('SELECT id FROM users WHERE username = $1', ['lookupon']);
    const actualUserId = userRes.rows[0].id;

    // 2. Create projects
    for (const cat of CATEGORIES) {
      const projectId = uuidv4();
      await pool.query(`
        INSERT INTO projects (
          id, user_id, title, tagline, description, category, difficulty, 
          status, technologies, tags, likes_count, bookmarks_count, views, trending_score
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        projectId,
        actualUserId,
        `Lookupon Project - ${cat}`,
        `An amazing example of a ${cat} project on the platform.`,
        `This is a placeholder project created by the Lookupon team to showcase the **${cat}** category. You can explore its features, see how cards are displayed, and use it as a reference when building your own projects!`,
        cat,
        'Beginner',
        'published',
        JSON.stringify(['React', 'TypeScript']),
        JSON.stringify(['lookupon', 'demo', cat.toLowerCase()]),
        42,
        15,
        150,
        Math.random() * 100 // randomize trending score
      ]);
      console.log(`Inserted project for ${cat}`);
    }

    console.log('Seed completed successfully!');
  } catch (err) {
    console.error('Error seeding DB:', err);
  } finally {
    pool.end();
  }
}

seed();
