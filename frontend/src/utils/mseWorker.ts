import { parseMSE } from '../core/mseParser';
import { buildMSE } from './mseExporter';
import type { MSEExportOptions } from './mseExporter';

self.onmessage = (e: MessageEvent) => {
  const { type, data } = e.data;
  if (type === 'parse') {
    const result = parseMSE(data.text);
    self.postMessage({ type: 'parseResult', data: result });
  } else if (type === 'export') {
    const result = buildMSE(data.emitters, data.options as Partial<MSEExportOptions>);
    self.postMessage({ type: 'exportResult', data: result });
  }
};
