import fs from 'fs';
import path from 'path';
import { config } from './config.js';

const levels = { error: 0, warn: 1, info: 2, debug: 3 };

let logStream = null;

function ensureLogStream() {
  if (!logStream) {
    const logFile = path.join(config.paths.logs, `server-${new Date().toISOString().slice(0, 10)}.log`);
    try {
      logStream = fs.createWriteStream(logFile, { flags: 'a' });
    } catch {
      logStream = null;
    }
  }
}

function formatMessage(level, msg, meta) {
  const ts = new Date().toISOString();
  const metaStr = meta ? ' ' + JSON.stringify(meta) : '';
  return `[${ts}] [${level.toUpperCase()}] ${msg}${metaStr}\n`;
}

function write(level, msg, meta) {
  if (levels[level] > levels[config.isDev ? 'debug' : 'info']) return;
  const formatted = formatMessage(level, msg, meta);
  if (level === 'error') process.stderr.write(formatted);
  else process.stdout.write(formatted);
  ensureLogStream();
  if (logStream) {
    logStream.write(formatted);
  }
}

export const logger = {
  error: (msg, meta) => write('error', msg, meta),
  warn: (msg, meta) => write('warn', msg, meta),
  info: (msg, meta) => write('info', msg, meta),
  debug: (msg, meta) => write('debug', msg, meta),
};
