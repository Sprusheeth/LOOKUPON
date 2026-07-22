import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = 'https://lookupon.onrender.com';
const DOMAIN = 'https://lookupon-n4gs.vercel.app';

async function generateSitemap() {
  const urls = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/explore', changefreq: 'daily', priority: '0.9' },
    { loc: '/creators', changefreq: 'daily', priority: '0.9' },
    { loc: '/login', changefreq: 'monthly', priority: '0.5' },
    { loc: '/forgot-password', changefreq: 'monthly', priority: '0.3' }
  ];

  try {
    const res = await fetch(`${API_URL}/api/projects?limit=100&sort=trending`);
    if (res.ok) {
      const data = await res.json();
      data.projects?.forEach(project => {
        urls.push({
          loc: `/projects/${project.id}`,
          changefreq: 'weekly',
          priority: '0.8'
        });
      });
    }
  } catch (error) {
    console.warn('Failed to fetch projects for sitemap, continuing with static routes.');
  }

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  urls.forEach(({ loc, changefreq, priority }) => {
    xml += '  <url>\n';
    xml += `    <loc>${DOMAIN}${loc}</loc>\n`;
    xml += `    <changefreq>${changefreq}</changefreq>\n`;
    xml += `    <priority>${priority}</priority>\n`;
    xml += '  </url>\n';
  });
  
  xml += '</urlset>';

  const publicDir = path.join(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml);
  console.log('✅ sitemap.xml generated successfully!');
}

generateSitemap();
