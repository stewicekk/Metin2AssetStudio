import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  isDev: process.env.NODE_ENV !== 'production',

  paths: {
    root: ROOT,
    dist: path.resolve(ROOT, '..', 'frontend', 'dist'),
    analyzeMse: path.resolve(ROOT, '..', 'frontend', 'public', 'analyze-mse'),
    projects: path.resolve(ROOT, 'projects'),
    logs: path.resolve(ROOT, 'logs'),
    server: ROOT,
  },

  limits: {
    maxUploadSize: '50mb',
    maxEmitters: 512,
    maxParticles: 8192,
    maxProjects: 100,
    maxExportSize: 10 * 1024 * 1024,
  },

  features: {
    websocket: true,
    backgroundWorkers: true,
    projectStorage: true,
    assetIndexing: true,
    autosave: true,
  },
};
