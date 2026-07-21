import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  ChevronRight, ChevronLeft, Sparkles, Plus, X, Upload, Wand2,
  Check, Eye, Globe, BookOpen, Tag,
} from 'lucide-react';
import { GithubIcon } from '../components/GithubIcon';
import api from '../api/client';
import { useAppStore } from '../store/useAppStore';
import './CreateProjectPage.css';

const STEPS = ['Basic Info', 'Media', 'Details', 'Links', 'Tags & Publish'];
const CATEGORIES = ['Web Development','Mobile App','Machine Learning','Data Science','DevOps','Game Development','IoT','Blockchain','Security','Research','Design','Other'];
const DIFFICULTIES = ['Beginner','Intermediate','Advanced','Expert'];

interface FormData {
  title: string;
  tagline: string;
  description: string;
  story: string;
  problem_statement: string;
  solution: string;
  impact: string;
  thumbnail_url: string;
  screenshots: string[];
  demo_video_url: string;
  live_demo_url: string;
  repo_url: string;
  docs_url: string;
  architecture_diagram_url: string;
  technologies: string[];
  tags: string[];
  category: string;
  difficulty: string;
  features: string[];
  learning_outcomes: string[];
  hackathon: string;
  status: 'draft' | 'published';
  readme: string;
  github_repo_id: string;
  github_stars: number;
  github_forks: number;
  github_language: string;
  license: string;
  ai_summary: string;
  ai_tags: string[];
  ai_difficulty: string;
  ai_improvements: string[];
}

const DEFAULT_FORM: FormData = {
  title: '', tagline: '', description: '', story: '',
  problem_statement: '', solution: '', impact: '',
  thumbnail_url: '', screenshots: [], demo_video_url: '',
  live_demo_url: '', repo_url: '', docs_url: '', architecture_diagram_url: '',
  technologies: [], tags: [], category: '', difficulty: '',
  features: [], learning_outcomes: [], hackathon: '',
  status: 'draft', readme: '',
  github_repo_id: '', github_stars: 0, github_forks: 0, github_language: '', license: '',
  ai_summary: '', ai_tags: [], ai_difficulty: '', ai_improvements: [],
};

export default function CreateProjectPage() {
  const { user, addToast } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { id: editId } = useParams<{ id?: string }>();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newTech, setNewTech] = useState('');
  const [newFeature, setNewFeature] = useState('');
  const [newScreenshot, setNewScreenshot] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    // Pre-fill from GitHub import
    if (location.state?.prefill) {
      const p = location.state.prefill;
      setForm((f) => ({
        ...f,
        title: p.title || '',
        description: p.description || '',
        technologies: p.technologies || [],
        tags: p.tags || [],
        repo_url: p.repoUrl || '',
        live_demo_url: p.liveDemoUrl || '',
        license: p.license || '',
        github_repo_id: p.githubRepoId || '',
        github_stars: p.githubStars || 0,
        github_forks: p.githubForks || 0,
        github_language: p.githubLanguage || '',
        readme: p.readme || '',
      }));
    }
    // Load existing project for edit
    if (editId) {
      api.get(`/projects/${editId}`).then(({ data }) => {
        setForm({
          ...DEFAULT_FORM,
          ...data,
          technologies: data.technologies || [],
          tags: data.tags || [],
          features: data.features || [],
          learning_outcomes: data.learning_outcomes || [],
          screenshots: data.screenshots || [],
          ai_tags: data.ai_tags || [],
          ai_improvements: data.ai_improvements || [],
        });
      });
    }
    document.title = editId ? 'Edit Project — Lookupon' : 'Create Project — Lookupon';
  }, [user, editId]);

  const set = (field: keyof FormData, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const runAiAnalysis = async () => {
    setAiLoading(true);
    try {
      const { data } = await api.post('/ai/analyze', {
        title: form.title,
        description: form.description,
        readme: form.readme,
        technologies: form.technologies,
        repoUrl: form.repo_url,
      });
      setForm((f) => ({
        ...f,
        ai_summary: data.summary || '',
        ai_tags: data.tags || [],
        ai_difficulty: data.difficulty || '',
        ai_improvements: data.improvements || [],
        technologies: data.technologies?.length > 0 ? [...new Set([...f.technologies, ...data.technologies])] : f.technologies,
        category: data.category || f.category,
        difficulty: data.difficulty || f.difficulty,
      }));
      addToast('AI analysis complete!', 'success');
    } catch {
      addToast('AI analysis failed', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (publish = false) => {
    if (!form.title.trim()) { addToast('Title is required', 'error'); setStep(0); return; }
    setSaving(true);
    try {
      const payload = { ...form, status: publish ? 'published' : 'draft' };
      if (editId) {
        await api.put(`/projects/${editId}`, payload);
        addToast(publish ? 'Project published!' : 'Changes saved!', 'success');
        navigate(`/projects/${editId}`);
      } else {
        const { data } = await api.post('/projects', payload);
        addToast(publish ? 'Project published!' : 'Draft saved!', 'success');
        navigate(`/projects/${data.id}`);
      }
    } catch {
      addToast('Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="create-page">
      <div className="container create-inner">
        {/* Header */}
        <div className="create-header">
          <h1 className="create-title font-display">
            {editId ? 'Edit Project' : 'Create Project'}
          </h1>
          <div className="create-steps">
            {STEPS.map((s, i) => (
              <button
                key={i}
                className={`step-indicator ${i === step ? 'active' : i < step ? 'done' : ''}`}
                onClick={() => setStep(i)}
              >
                <span className="step-num">{i < step ? <Check size={12} /> : i + 1}</span>
                <span className="step-label hide-mobile">{s}</span>
              </button>
            ))}
          </div>
          <div className="progress" style={{ width: '100%', marginTop: '1rem' }}>
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Form body */}
        <div className="create-body">
          {/* Step 0: Basic Info */}
          {step === 0 && (
            <div className="form-step">
              <h2 className="step-title">Basic Information</h2>
              <div className="form-group">
                <label className="label">Project Title *</label>
                <input className="input" placeholder="My Awesome Project" value={form.title} onChange={(e) => set('title', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Tagline</label>
                <input className="input" placeholder="One sentence that captures what your project does" value={form.tagline} onChange={(e) => set('tagline', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Description</label>
                <textarea className="textarea" rows={5} placeholder="Describe your project in detail..." value={form.description} onChange={(e) => set('description', e.target.value)} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="label">Problem Statement</label>
                  <textarea className="textarea" rows={3} placeholder="What problem does this solve?" value={form.problem_statement} onChange={(e) => set('problem_statement', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="label">Solution</label>
                  <textarea className="textarea" rows={3} placeholder="How does your project solve it?" value={form.solution} onChange={(e) => set('solution', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="label">Impact</label>
                <textarea className="textarea" rows={3} placeholder="What is the real-world impact?" value={form.impact} onChange={(e) => set('impact', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Project Story</label>
                <textarea className="textarea" rows={5} placeholder="Tell the story behind the project – motivation, journey, challenges..." value={form.story} onChange={(e) => set('story', e.target.value)} />
              </div>
            </div>
          )}

          {/* Step 1: Media */}
          {step === 1 && (
            <div className="form-step">
              <h2 className="step-title">Media & Demo</h2>
              <div className="form-group">
                <label className="label">Thumbnail URL</label>
                <input className="input" placeholder="https://..." value={form.thumbnail_url} onChange={(e) => set('thumbnail_url', e.target.value)} />
                {form.thumbnail_url && (
                  <img src={form.thumbnail_url} alt="Thumbnail preview" className="media-preview" />
                )}
              </div>
              <div className="form-group">
                <label className="label">Screenshots</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input className="input" placeholder="https://screenshot-url.jpg" value={newScreenshot} onChange={(e) => setNewScreenshot(e.target.value)} />
                  <button className="btn btn-secondary" onClick={() => {
                    if (newScreenshot.trim()) { set('screenshots', [...form.screenshots, newScreenshot.trim()]); setNewScreenshot(''); }
                  }}>Add</button>
                </div>
                {form.screenshots.length > 0 && (
                  <div className="screenshots-preview">
                    {form.screenshots.map((url, i) => (
                      <div key={i} className="screenshot-item">
                        <img src={url} alt="" />
                        <button className="screenshot-remove" onClick={() => set('screenshots', form.screenshots.filter((_, j) => j !== i))}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="label">Demo Video URL (YouTube, Vimeo, etc.)</label>
                <input className="input" placeholder="https://youtube.com/watch?v=..." value={form.demo_video_url} onChange={(e) => set('demo_video_url', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Architecture Diagram URL</label>
                <input className="input" placeholder="https://..." value={form.architecture_diagram_url} onChange={(e) => set('architecture_diagram_url', e.target.value)} />
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="form-step">
              <h2 className="step-title">Project Details</h2>
              <div className="form-group">
                <label className="label">Technologies / Languages</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input className="input" placeholder="e.g. React, Python, Node.js" value={newTech} onChange={(e) => setNewTech(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && newTech.trim()) { set('technologies', [...form.technologies, newTech.trim()]); setNewTech(''); e.preventDefault(); }}} />
                  <button className="btn btn-secondary" onClick={() => { if (newTech.trim()) { set('technologies', [...form.technologies, newTech.trim()]); setNewTech(''); }}}>Add</button>
                </div>
                <div className="tag-chips">
                  {form.technologies.map((t, i) => (
                    <span key={i} className="tag-chip">
                      {t} <button onClick={() => set('technologies', form.technologies.filter((_, j) => j !== i))}><X size={11} /></button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="label">Category</label>
                  <select className="select input" value={form.category} onChange={(e) => set('category', e.target.value)}>
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Difficulty</label>
                  <select className="select input" value={form.difficulty} onChange={(e) => set('difficulty', e.target.value)}>
                    <option value="">Select difficulty</option>
                    {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="label">Key Features</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input className="input" placeholder="A feature of your project" value={newFeature} onChange={(e) => setNewFeature(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && newFeature.trim()) { set('features', [...form.features, newFeature.trim()]); setNewFeature(''); e.preventDefault(); }}} />
                  <button className="btn btn-secondary" onClick={() => { if (newFeature.trim()) { set('features', [...form.features, newFeature.trim()]); setNewFeature(''); }}}>Add</button>
                </div>
                <div className="tag-chips">
                  {form.features.map((f, i) => (
                    <span key={i} className="tag-chip tag-chip-feature">
                      {f} <button onClick={() => set('features', form.features.filter((_, j) => j !== i))}><X size={11} /></button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="label">Hackathon / Event (optional)</label>
                <input className="input" placeholder="e.g. HackMIT 2024, MLH Fellowship" value={form.hackathon} onChange={(e) => set('hackathon', e.target.value)} />
              </div>
            </div>
          )}

          {/* Step 3: Links */}
          {step === 3 && (
            <div className="form-step">
              <h2 className="step-title">Links & Resources</h2>
              <div className="form-group">
                <label className="label"><Globe size={14} /> Live Demo URL</label>
                <input className="input" placeholder="https://yourproject.com" value={form.live_demo_url} onChange={(e) => set('live_demo_url', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label"><GithubIcon size={14} /> Repository URL</label>
                <input className="input" placeholder="https://github.com/..." value={form.repo_url} onChange={(e) => set('repo_url', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label"><BookOpen size={14} /> Documentation URL</label>
                <input className="input" placeholder="https://docs.yourproject.com" value={form.docs_url} onChange={(e) => set('docs_url', e.target.value)} />
              </div>
            </div>
          )}

          {/* Step 4: Tags & Publish */}
          {step === 4 && (
            <div className="form-step">
              <h2 className="step-title">Tags & AI Analysis</h2>

              {/* AI Analysis */}
              <div className="ai-panel">
                <div className="ai-panel-header">
                  <div>
                    <div className="ai-panel-title"><Wand2 size={18} /> AI Project Analysis</div>
                    <div className="ai-panel-subtitle">Let AI analyze your project and generate a summary, extract technologies, estimate difficulty, and suggest improvements</div>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={runAiAnalysis}
                    disabled={aiLoading || !form.title}
                  >
                    {aiLoading ? <><Sparkles size={15} className="animate-spin" /> Analyzing...</> : <><Wand2 size={15} /> Analyze with AI</>}
                  </button>
                </div>
                {form.ai_summary && (
                  <div className="ai-result">
                    <div className="ai-result-section">
                      <div className="ai-result-label">AI Summary</div>
                      <p>{form.ai_summary}</p>
                    </div>
                    {form.ai_difficulty && (
                      <div className="ai-result-section">
                        <div className="ai-result-label">Estimated Difficulty</div>
                        <span className={`badge badge-${form.ai_difficulty === 'Beginner' ? 'green' : form.ai_difficulty === 'Intermediate' ? 'orange' : 'red'}`}>
                          {form.ai_difficulty}
                        </span>
                      </div>
                    )}
                    {form.ai_improvements?.length > 0 && (
                      <div className="ai-result-section">
                        <div className="ai-result-label">Suggested Improvements</div>
                        <ul>
                          {form.ai_improvements.map((imp, i) => <li key={i}>{imp}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label className="label"><Tag size={14} /> Tags</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input className="input" placeholder="Add a tag" value={newTag} onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && newTag.trim()) { set('tags', [...new Set([...form.tags, newTag.trim().toLowerCase()])]); setNewTag(''); e.preventDefault(); }}} />
                  <button className="btn btn-secondary" onClick={() => { if (newTag.trim()) { set('tags', [...new Set([...form.tags, newTag.trim().toLowerCase()])]); setNewTag(''); }}}>Add</button>
                </div>
                {form.ai_tags?.length > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>AI suggested:</span>
                    {form.ai_tags.map((t) => (
                      <button key={t} className="tag-chip" onClick={() => set('tags', [...new Set([...form.tags, t])])}>
                        + {t}
                      </button>
                    ))}
                  </div>
                )}
                <div className="tag-chips">
                  {form.tags.map((t, i) => (
                    <span key={i} className="tag-chip">
                      #{t} <button onClick={() => set('tags', form.tags.filter((_, j) => j !== i))}><X size={11} /></button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="publish-summary">
                <h3>Review</h3>
                <div className="review-grid">
                  <div className="review-item"><span>Title</span><strong>{form.title || '—'}</strong></div>
                  <div className="review-item"><span>Category</span><strong>{form.category || '—'}</strong></div>
                  <div className="review-item"><span>Difficulty</span><strong>{form.difficulty || form.ai_difficulty || '—'}</strong></div>
                  <div className="review-item"><span>Technologies</span><strong>{form.technologies.join(', ') || '—'}</strong></div>
                  <div className="review-item"><span>Tags</span><strong>{form.tags.join(', ') || '—'}</strong></div>
                  <div className="review-item"><span>Live Demo</span><strong>{form.live_demo_url || '—'}</strong></div>
                </div>
              </div>

              {/* Publish actions */}
              <div className="publish-actions">
                <button className="btn btn-secondary btn-lg" onClick={() => handleSubmit(false)} disabled={saving}>
                  💾 Save as Draft
                </button>
                <button className="btn btn-primary btn-lg" onClick={() => handleSubmit(true)} disabled={saving || !form.title}>
                  {saving ? 'Publishing...' : <><Eye size={17} /> Publish Project</>}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="create-nav">
          <button className="btn btn-secondary" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
            <ChevronLeft size={18} /> Previous
          </button>
          <span className="step-counter">{step + 1} / {STEPS.length}</span>
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setStep(step + 1)}>
              Next <ChevronRight size={18} />
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => handleSubmit(true)} disabled={saving}>
              {saving ? 'Publishing...' : 'Publish'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
