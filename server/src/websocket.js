import { WebSocketServer } from 'ws';
import { logger } from './logger.js';

let wss = null;
const clients = new Map();

export function setupWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const clientId = crypto.randomUUID();
    clients.set(clientId, ws);
    logger.info(`WS client connected: ${clientId}`);

    ws.send(JSON.stringify({ type: 'connected', clientId }));

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        handleMessage(clientId, ws, msg);
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      clients.delete(clientId);
      logger.info(`WS client disconnected: ${clientId}`);
    });

    ws.on('error', (err) => {
      logger.error(`WS error [${clientId}]: ${err.message}`);
      clients.delete(clientId);
    });
  });

  logger.info('WebSocket server ready on /ws');
  return wss;
}

function handleMessage(clientId, ws, msg) {
  switch (msg.type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;
    case 'subscribe':
      ws.send(JSON.stringify({ type: 'subscribed', channel: msg.channel }));
      break;
    default:
      ws.send(JSON.stringify({ type: 'echo', original: msg }));
  }
}

export function broadcast(event, data) {
  if (!wss) return;
  const payload = JSON.stringify({ type: event, ...data, timestamp: Date.now() });
  clients.forEach((ws) => {
    if (ws.readyState === 1) ws.send(payload);
  });
}

export function getClientCount() {
  return clients.size;
}
