import { logger } from '../logger.js';

const jobs = new Map();
const queue = [];
let processing = false;
let jobCounter = 0;

export function createJob(type, data) {
  const id = `job_${++jobCounter}_${Date.now()}`;
  const job = {
    id,
    type,
    data,
    status: 'queued',
    progress: 0,
    result: null,
    error: null,
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
  };
  jobs.set(id, job);
  queue.push(job);
  logger.debug(`Job created: ${id} (${type})`);
  processQueue();
  return id;
}

export function getJob(id) {
  return jobs.get(id) || null;
}

export function getJobs(type, limit = 20) {
  const sorted = Array.from(jobs.values())
    .filter(j => !type || j.type === type)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return sorted.slice(0, limit);
}

async function processQueue() {
  if (processing || queue.length === 0) return;
  processing = true;

  const job = queue.shift();
  if (!job) { processing = false; return; }

  job.status = 'processing';
  job.startedAt = new Date().toISOString();

  try {
    const result = await executeJob(job);
    job.status = 'completed';
    job.result = result;
    job.completedAt = new Date().toISOString();
    job.progress = 100;
  } catch (err) {
    job.status = 'failed';
    job.error = err.message;
    job.completedAt = new Date().toISOString();
    logger.error(`Job failed: ${job.id}`, { type: job.type, error: err.message });
  }

  processing = false;
  processQueue();
}

async function executeJob(job) {
  switch (job.type) {
    case 'validate':
      return validateContent(job.data);
    case 'export':
      return exportMSE(job.data);
    default:
      throw new Error(`Unknown job type: ${job.type}`);
  }
}

function validateContent(data) {
  const { content } = data;
  if (!content || typeof content !== 'string') throw new Error('Missing content');
  const issues = [];
  const lines = content.split('\n');
  let hasEffectName = false;
  let hasParticleSystem = false;
  let openBraces = 0;
  let closeBraces = 0;
  let errorLine = null;

  lines.forEach((line, i) => {
    if (line.includes('EffectName')) hasEffectName = true;
    if (line.includes('StartParticleSystem') || line.includes('ParticleSystemCount')) hasParticleSystem = true;
    if (line.includes('{')) openBraces++;
    if (line.includes('}')) closeBraces++;
  });

  if (!hasEffectName) issues.push({ line: 1, severity: 'error', message: 'Missing EffectName header' });
  if (!hasParticleSystem) issues.push({ line: 1, severity: 'error', message: 'Missing particle system definition' });
  if (openBraces !== closeBraces) issues.push({
    line: lines.length,
    severity: 'error',
    message: `Unmatched braces: ${openBraces} open, ${closeBraces} closed`,
  });

  const braceDiff = openBraces - closeBraces;
  if (braceDiff > 0) issues.push({
    line: lines.length,
    severity: 'warn',
    message: `${braceDiff} block(s) not closed`,
  });

  return { valid: issues.filter(i => i.severity === 'error').length === 0, issues };
}

function exportMSE(data) {
  return { exported: true, format: 'mse', preview: data.content?.substring(0, 200) };
}
