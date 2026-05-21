import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  isDev: process.env.NODE_ENV !== 'production',

  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000').split(',').map(s => s.trim()),

  paths: {
    root: ROOT,
    dist: path.resolve(ROOT, '..', 'frontend', 'dist'),
    analyzeMse: path.resolve(ROOT, '..', 'frontend', 'fixtures'),
    projects: path.resolve(ROOT, 'projects'),
    logs: path.resolve(ROOT, 'logs'),
    server: ROOT,
    uploads: path.resolve(ROOT, 'projects', 'uploads'),
  },

  limits: {
    maxUploadSize: '50mb',
    maxEmitters: 512,
    maxParticles: 8192,
    maxProjects: 100,
    maxExportSize: 10 * 1024 * 1024,
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    uploadMaxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760', 10),
  },

  features: {
    websocket: true,
    backgroundWorkers: true,
    projectStorage: true,
    assetIndexing: true,
    autosave: true,
  },
};
