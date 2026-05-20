import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

const router = Router();

function getFixtureFiles() {
  return fs.readdirSync(config.paths.analyzeMse)
    .filter(f => f.endsWith('.mse'))
    .sort();
}

router.get('/', (req, res) => {
  try {
    const search = req.query.search?.toString().toLowerCase() || '';
    let files = getFixtureFiles();
    if (search) files = files.filter(f => f.toLowerCase().includes(search));
    res.json({ count: files.length, files, search });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/categories', (req, res) => {
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

router.get('/:name', (req, res) => {
  try {
    const filePath = path.join(config.paths.analyzeMse, req.params.name);
    if (!filePath.startsWith(config.paths.analyzeMse)) {
      return res.status(403).json({ error: 'Path traversal denied' });
    }
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Fixture not found' });
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({ name: req.params.name, content, size: content.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
