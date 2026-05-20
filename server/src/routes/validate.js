import { Router } from 'express';
import { createJob, getJob } from '../services/queue.js';

const router = Router();

router.post('/', (req, res) => {
  const { content } = req.body;
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Missing content' });
  }

  const issues = [];
  const lines = content.split('\n');
  let hasEffectName = false;
  let hasParticleSystem = false;
  let openBraces = 0;
  let closeBraces = 0;
  let braceLine = 0;

  lines.forEach((line, i) => {
    if (line.includes('EffectName')) hasEffectName = true;
    if (line.includes('StartParticleSystem')) hasParticleSystem = true;
    if (line.includes('ParticleSystemCount')) hasParticleSystem = true;
    line.split('').forEach(ch => {
      if (ch === '{') { openBraces++; braceLine = i + 1; }
      if (ch === '}') { closeBraces++; braceLine = i + 1; }
    });
  });

  if (!hasEffectName) issues.push({ line: 1, severity: 'error', message: 'Missing EffectName header' });
  if (!hasParticleSystem) issues.push({ line: 1, severity: 'error', message: 'No particle systems found' });
  if (openBraces !== closeBraces) {
    const diff = openBraces - closeBraces;
    issues.push({
      line: braceLine,
      severity: 'error',
      message: `Unmatched braces: ${openBraces} opening vs ${closeBraces} closing (${diff > 0 ? 'unclosed' : 'extra closing'})`,
    });
  }

  issues.push({
    severity: 'info',
    message: `Found ${openBraces} blocks in ${lines.length} lines`,
  });

  res.json({
    valid: issues.filter(i => i.severity === 'error').length === 0,
    issues,
    stats: { lines: lines.length, blocks: openBraces, systems: hasParticleSystem ? 1 : 0 },
  });
});

router.post('/async', (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Missing content' });
  const jobId = createJob('validate', { content });
  res.status(202).json({ jobId, status: 'queued' });
});

router.get('/job/:id', (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

export default router;
