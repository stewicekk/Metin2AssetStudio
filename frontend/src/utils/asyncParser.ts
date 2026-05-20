import type { Emitter } from '../types';
import type { MSEDocument } from '../core/mseParser';
import type { MSEExportOptions } from './mseExporter';

type WorkerMessage = {
  type: 'parseResult' | 'exportResult';
  data: MSEDocument | string;
};

export function parseMSEAsync(text: string): Promise<MSEDocument> {
  return new Promise((resolve, reject) => {
    try {
      const worker = new Worker(new URL('./mseWorker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
        if (e.data.type === 'parseResult') {
          resolve(e.data.data as MSEDocument);
        }
        worker.terminate();
      };
      worker.onerror = (err) => {
        reject(err);
        worker.terminate();
      };
      worker.postMessage({ type: 'parse', data: { text } });
    } catch (err) {
      reject(err);
    }
  });
}

export function exportMSEAsync(emitters: Emitter[], options: Partial<MSEExportOptions>): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const worker = new Worker(new URL('./mseWorker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
        if (e.data.type === 'exportResult') {
          resolve(e.data.data as string);
        }
        worker.terminate();
      };
      worker.onerror = (err) => {
        reject(err);
        worker.terminate();
      };
      worker.postMessage({ type: 'export', data: { emitters, options } });
    } catch (err) {
      reject(err);
    }
  });
}
