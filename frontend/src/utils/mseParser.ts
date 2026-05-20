import { parseMSE } from '../core/mseParser';

/**
 * Compatibility wrapper retained for older imports.
 * New code should import from src/metin2/ast or src/core/mseParser directly.
 */
export class MseParser {
  static parse(content: string): ReturnType<typeof parseMSE> {
    return parseMSE(content);
  }
}
