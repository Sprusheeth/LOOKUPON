const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

function getClient() {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key') return null;
  return new GoogleGenerativeAI(GEMINI_API_KEY);
}

async function analyzeProject(req, res) {
  const { title, description, readme, technologies, repoUrl } = req.body;

  const client = getClient();
  if (!client) {
    // Return mock analysis if no API key
    return res.json({
      summary: `${title} is an innovative project that ${description || 'showcases technical excellence'}. It demonstrates strong engineering principles and practical problem-solving.`,
      technologies: technologies || [],
      frameworks: [],
      difficulty: 'Intermediate',
      tags: ['open-source', 'showcase'],
      category: 'Web Development',
      keyFeatures: ['Clean architecture', 'Modern tech stack', 'Well-documented'],
      improvements: ['Add unit tests', 'Improve documentation', 'Add CI/CD pipeline'],
      aiGenerated: false,
    });
  }

  try {
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are an expert software project analyst. Analyze the following project and return a JSON response.

Project Title: ${title}
Description: ${description || 'Not provided'}
Technologies: ${(technologies || []).join(', ') || 'Not specified'}
Repository URL: ${repoUrl || 'Not provided'}
README (first 3000 chars): ${(readme || '').substring(0, 3000)}

Return a JSON object with these exact keys:
{
  "summary": "A compelling 2-3 sentence professional summary of what this project does and why it matters",
  "technologies": ["array of detected technologies/languages"],
  "frameworks": ["array of detected frameworks and libraries"],
  "difficulty": "Beginner | Intermediate | Advanced | Expert",
  "tags": ["array of 5-8 relevant tags"],
  "category": "one of: Web Development | Mobile App | Data Science | Machine Learning | DevOps | Game Development | IoT | Blockchain | Security | Research | Design | Other",
  "keyFeatures": ["array of 3-5 key features or highlights"],
  "improvements": ["array of 3-5 specific, actionable improvement suggestions"]
}

Return ONLY valid JSON, no markdown, no extra text.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    // Strip markdown code blocks if present
    const cleaned = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(cleaned);

    res.json({ ...parsed, aiGenerated: true });
  } catch (err) {
    console.error('Gemini AI error:', err);
    res.status(500).json({ error: 'AI analysis failed', details: err.message });
  }
}

async function analyzeFromUrl(req, res) {
  const { repoUrl } = req.body;
  if (!repoUrl) return res.status(400).json({ error: 'repoUrl required' });

  // Extract owner/repo from URL
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return res.status(400).json({ error: 'Invalid GitHub URL' });

  req.body.title = match[2];
  return analyzeProject(req, res);
}

module.exports = { analyzeProject, analyzeFromUrl };
