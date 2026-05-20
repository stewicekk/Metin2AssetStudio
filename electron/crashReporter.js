const fs = require('fs');
const path = require('path');
const os = require('os');
const { app } = require('electron');

const CRASH_LOG_DIR = path.join(app.getPath('userData'), 'crash-logs');

function ensureLogDir() {
  if (!fs.existsSync(CRASH_LOG_DIR)) {
    fs.mkdirSync(CRASH_LOG_DIR, { recursive: true });
  }
}

function collectSystemInfo() {
  return {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    electronVersion: process.versions.electron,
    chromeVersion: process.versions.chrome,
    appVersion: app.getVersion(),
    osInfo: {
      hostname: os.hostname(),
      platform: os.platform(),
      release: os.release(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpus: os.cpus().length,
    },
    userData: app.getPath('userData'),
    time: new Date().toISOString(),
  };
}

function logCrash(report) {
  ensureLogDir();
  const timestamp = Date.now();
  const logFile = path.join(CRASH_LOG_DIR, `crash-${timestamp}.json`);

  const crashData = {
    timestamp: new Date().toISOString(),
    systemInfo: collectSystemInfo(),
    error: {
      message: report.message || 'Unknown error',
      stack: report.stack || '',
      name: report.name || 'Error',
    },
    context: report.context || {},
    appState: report.appState || {},
  };

  try {
    fs.writeFileSync(logFile, JSON.stringify(crashData, null, 2), 'utf8');
    console.log(`[crashReporter] Crash logged to ${logFile}`);
    return { logged: true, logFile };
  } catch (e) {
    console.error('[crashReporter] Failed to log crash:', e.message);
    return { logged: false, error: e.message };
  }
}

function getCrashLogs() {
  ensureLogDir();
  try {
    const files = fs.readdirSync(CRASH_LOG_DIR)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, 20);

    return files.map(f => {
      try {
        const content = fs.readFileSync(path.join(CRASH_LOG_DIR, f), 'utf8');
        return JSON.parse(content);
      } catch (e) {
        return { file: f, parseError: e.message };
      }
    });
  } catch (e) {
    return [];
  }
}

function sendCrashReport(report, endpoint) {
  const http = require('http');
  const https = require('https');

  const crashData = {
    timestamp: new Date().toISOString(),
    systemInfo: collectSystemInfo(),
    error: {
      message: report.message || 'Unknown error',
      stack: report.stack || '',
      name: report.name || 'Error',
    },
    context: report.context || {},
  };

  const body = JSON.stringify(crashData);
  const url = new URL(endpoint || 'https://crash-report.metin2-asset-studio.app/api/crash');

  return new Promise((resolve) => {
    const transport = url.protocol === 'https:' ? https : http;
    const req = transport.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: 10000,
      },
      (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({ sent: true, status: res.statusCode, response: data });
        });
      }
    );

    req.on('error', (e) => {
      resolve({ sent: false, error: e.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ sent: false, error: 'Timeout' });
    });

    req.write(body);
    req.end();
  });
}

function init() {
  ensureLogDir();
  console.log(`[crashReporter] Initialized. Crash logs: ${CRASH_LOG_DIR}`);

  process.on('uncaughtException', (error) => {
    console.error('[crashReporter] Uncaught exception:', error);
    logCrash({
      message: error.message,
      stack: error.stack,
      name: 'UncaughtException',
      context: { type: 'uncaughtException' },
    });
  });

  process.on('unhandledRejection', (reason) => {
    console.error('[crashReporter] Unhandled rejection:', reason);
    logCrash({
      message: reason?.message || String(reason),
      stack: reason?.stack || '',
      name: 'UnhandledRejection',
      context: { type: 'unhandledRejection' },
    });
  });
}

module.exports = {
  init,
  logCrash,
  getCrashLogs,
  sendCrashReport,
  collectSystemInfo,
};
