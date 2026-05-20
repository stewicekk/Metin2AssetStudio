/**
 * Metin2 Compatibility Validator
 * Checks parsed assets against engine constraints.
 */

export interface ValidationResult {
  status: 'SAFE' | 'RISKY' | 'INVALID';
  issues: string[];
}

export class Validator {
  static validateMse(obj: unknown): ValidationResult {
    const issues: string[] = [];
    let status: 'SAFE' | 'RISKY' | 'INVALID' = 'SAFE';

    // Rule: Max particles should be reasonable
    this.walk(obj, (key, value) => {
      if (key === 'MaxParticleCount' || key === 'maxP') {
        if (typeof value === 'number' && value > 2048) {
          issues.push(`High particle count: ${value}`);
          if (status !== 'INVALID') status = 'RISKY';
        }
      }
    });

    // Rule: Texture paths should be relative to 'd:/ymir work/' usually
    // But we'll just check for absolute paths
    this.walk(obj, (_key, value) => {
      if (typeof value === 'string' && (value.includes('C:') || value.includes('Users'))) {
        issues.push(`Absolute path detected: ${value}`);
        if (status !== 'INVALID') status = 'RISKY';
      }
    });

    return { status, issues };
  }

  private static walk(obj: unknown, callback: (key: string, value: unknown) => void): void {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      obj.forEach(item => this.walk(item, callback));
      return;
    }

    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      callback(key, value);
      this.walk(value, callback);
    }
  }
}
