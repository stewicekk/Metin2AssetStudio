import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { config } from '../config.js';
import { logger } from '../logger.js';

const router = Router();

function ensureProjectsDir() {
  if (!fs.existsSync(config.paths.projects)) {
    fs.mkdirSync(config.paths.projects, { recursive: true });
  }
}

function projectPath(id) {
  return path.join(config.paths.projects, `${id}.json`);
}

router.get('/', (req, res) => {
  try {
    ensureProjectsDir();
    const projectFiles = fs.readdirSync(config.paths.projects)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse();

    const projects = projectFiles.map(f => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(config.paths.projects, f), 'utf-8'));
        return {
          id: f.replace('.json', ''),
          name: data.name || f.replace('.json', ''),
          emitterCount: data.emitters?.length || 0,
          updatedAt: data.updatedAt || fs.statSync(path.join(config.paths.projects, f)).mtime,
          createdAt: data.createdAt,
        };
      } catch {
        return null;
      }
    }).filter(Boolean);

    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const p = projectPath(req.params.id);
    if (!fs.existsSync(p)) return res.status(404).json({ error: 'Project not found' });
    const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    ensureProjectsDir();
    const { name, emitters, settings } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name required' });

    const id = name.toLowerCase().replace(/[^a-z0-9_-]/g, '_') + '_' + Date.now();
    const project = {
      id,
      name,
      emitters: emitters || [],
      settings: settings || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0.0',
    };

    fs.writeFileSync(projectPath(id), JSON.stringify(project, null, 2), 'utf-8');
    logger.info(`Project saved: ${id}`);
    res.status(201).json({ id, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const p = projectPath(req.params.id);
    if (!fs.existsSync(p)) return res.status(404).json({ error: 'Project not found' });

    const existing = JSON.parse(fs.readFileSync(p, 'utf-8'));
    const updated = {
      ...existing,
      ...req.body,
      id: req.params.id,
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(p, JSON.stringify(updated, null, 2), 'utf-8');
    logger.info(`Project updated: ${req.params.id}`);
    res.json({ id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const p = projectPath(req.params.id);
    if (!fs.existsSync(p)) return res.status(404).json({ error: 'Project not found' });
    fs.unlinkSync(p);
    logger.info(`Project deleted: ${req.params.id}`);
    res.json({ deleted: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
