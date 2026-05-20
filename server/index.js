import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'frontend', 'dist');
const ANALYZE_MSE = path.join(ROOT, 'frontend', 'fixtures');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(DIST));

function getFixtureFiles() {
  return fs.readdirSync(ANALYZE_MSE).filter(f => f.endsWith('.mse')).sort();
}

// API: List available .mse fixtures with optional search
app.get('/api/fixtures', (req, res) => {
  try {
    const search = req.query.search?.toString().toLowerCase() || '';
    let files = getFixtureFiles();
    if (search) {
      files = files.filter(f => f.toLowerCase().includes(search));
    }
    res.json({ count: files.length, files, search });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Get fixture categories
app.get('/api/categories', (req, res) => {
  try {
    const files = getFixtureFiles();
    const categories = {};
    files.forEach(f => {
      const base = f.replace(/_\d+\.mse$/, '').replace(/\.mse$/, '');
      const cat = base.replace(/[0-9]+.*$/, '').replace(/_[a-z]+$/, '') || 'other';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(f);
    });
    res.json({ categories, total: files.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Get content of a specific .mse fixture
app.get('/api/fixtures/:name', (req, res) => {
  try {
    const filePath = path.join(ANALYZE_MSE, req.params.name);
    if (!filePath.startsWith(ANALYZE_MSE)) {
      return res.status(403).json({ error: 'Path traversal denied' });
    }
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Fixture not found' });
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({ name: req.params.name, content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Server stats
app.get('/api/stats', (req, res) => {
  const files = getFixtureFiles();
  const stats = {
    fixtures: files.length,
    distExists: fs.existsSync(DIST),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version,
    platform: process.platform,
  };
  res.json(stats);
});

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    app: 'Metin2 Asset Studio',
    fixturesDir: fs.existsSync(ANALYZE_MSE),
    distExists: fs.existsSync(DIST),
    timestamp: new Date().toISOString(),
  });
});

// API: Validate MSE content
app.post('/api/validate', (req, res) => {
  const { content } = req.body;
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Missing content' });
  }
  const issues = [];
  const lines = content.split('\n');
  let hasEffectName = false;
  let hasParticleSystem = false;
  lines.forEach((line) => {
    if (line.includes('EffectName')) hasEffectName = true;
    if (line.includes('StartParticleSystem') || line.includes('ParticleSystemCount')) hasParticleSystem = true;
  });
  if (!hasEffectName) issues.push('Missing EffectName header');
  if (!hasParticleSystem) issues.push('Missing particle system definition');
  res.json({ valid: issues.length === 0, issues });
});

// SPA fallback — serve index.html for all non-API, non-static routes
app.get('/{*path}', (req, res) => {
  const indexPath = path.join(DIST, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send(`
      <!DOCTYPE html><html lang="en"><head>
      <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Metin2 Asset Studio</title>
      <style>body{background:#07090d;color:#d8e4f0;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center;}
      .s{color:#c89b3c;font-size:28px;font-weight:700;}.h{color:#506070;font-size:14px;}
      </style></head><body>
      <div><div class="s">Metin2 Asset Studio</div>
      <div class="h">Status: Server running on port ${PORT}</div>
      <div class="h">Build frontend with: cd frontend && npm run build</div></div></body></html>
    `);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  ⚔  Metin2 Asset Studio Server`);
  console.log(`  ───────────────────────────────`);
  console.log(`  Local:   http://localhost:${PORT}/`);
  console.log(`  API:     http://localhost:${PORT}/api/health`);
  console.log(`  Fixtures: ${ANALYZE_MSE}`);
  console.log(`  Static:  ${DIST}\n`);
});
