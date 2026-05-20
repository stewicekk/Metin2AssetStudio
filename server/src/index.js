import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { config } from './config.js';
import { logger } from './logger.js';
import { setupWebSocket, getClientCount } from './websocket.js';

import fixtureRoutes from './routes/fixtures.js';
import projectRoutes from './routes/projects.js';
import validateRoutes from './routes/validate.js';
import exportRoutes from './routes/export.js';

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json({ limit: config.limits.maxUploadSize }));
app.use(express.static(config.paths.dist));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api/')) {
      logger.debug(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    }
  });
  next();
});

app.use('/api/fixtures', fixtureRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/validate', validateRoutes);
app.use('/api/export', exportRoutes);

app.get('/api/stats', (req, res) => {
  const fixtureCount = fs.existsSync(config.paths.analyzeMse)
    ? fs.readdirSync(config.paths.analyzeMse).filter(f => f.endsWith('.mse')).length
    : 0;

  res.json({
    version: '1.1.0',
    app: 'Metin2 Asset Studio',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    platform: process.platform,
    nodeVersion: process.version,
    fixtures: fixtureCount,
    distExists: fs.existsSync(config.paths.dist),
    wsClients: getClientCount(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.1.0',
    ws: getClientCount() > 0 ? 'connected' : 'idle',
    uptime: process.uptime(),
  });
});

app.get('/{*path}', (req, res) => {
  const indexPath = path.join(config.paths.dist, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send(`
      <!DOCTYPE html><html lang="en"><head>
      <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Metin2 Asset Studio</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box;}
        body{background:#07090d;color:#d8e4f0;font-family:system-ui;display:flex;
             align-items:center;justify-content:center;height:100vh;text-align:center;}
        .title{color:#c89b3c;font-size:28px;font-weight:700;margin-bottom:8px;}
        .sub{color:#506070;font-size:14px;line-height:1.6;}
        .highlight{color:#8ab4d8;}
      </style></head><body>
      <div><div class="title">⚔ Metin2 Asset Studio</div>
      <div class="sub">Server running on port ${config.port}</div>
      <div class="sub">WS: ${getClientCount()} client(s) connected</div>
      <div class="sub"><span class="highlight">cd frontend && npm run build</span> to build SPA</div></div></body></html>
    `);
  }
});

app.use((err, req, res, next) => {
  logger.error(`Unhandled error on ${req.method} ${req.path}`, { error: err.message });
  res.status(500).json({ error: 'Internal server error' });
});

setupWebSocket(server);

server.listen(config.port, config.host, () => {
  console.log(`\n  ⚔  Metin2 Asset Studio Server ${config.isDev ? '(dev)' : '(production)'}`);
  console.log(`  ─────────────────────────────────────────────`);
  console.log(`  Local:   http://localhost:${config.port}/`);
  console.log(`  API:     http://localhost:${config.port}/api/health`);
  console.log(`  WS:      ws://localhost:${config.port}/ws`);
  console.log(`  Static:  ${config.paths.dist}`);
  console.log(`  Fixtures: ${config.paths.analyzeMse}`);
  console.log(`  Projects: ${config.paths.projects}`);
  console.log(`\n`);
  logger.info(`Server started on port ${config.port}`);
});
