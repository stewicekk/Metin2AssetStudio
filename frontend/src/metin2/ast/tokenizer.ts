export interface SourceToken {
  kind: 'identifier' | 'string' | 'brace' | 'comment' | 'newline';
  value: string;
  line: number;
  column: number;
}

export function tokenizeMetin2Text(source: string): SourceToken[] {
  const tokens: SourceToken[] = [];
  source.split(/\r?\n/).forEach((line, lineIndex) => {
    const trimmed = line.trimStart();
    if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
      tokens.push({ kind: 'comment', value: trimmed, line: lineIndex + 1, column: line.length - trimmed.length + 1 });
      tokens.push({ kind: 'newline', value: '\n', line: lineIndex + 1, column: line.length + 1 });
      return;
    }

    const matches = line.matchAll(/"[^"]*"|[{}]|[^\s{}]+/g);
    for (const match of matches) {
      const value = match[0];
      const column = (match.index ?? 0) + 1;
      tokens.push({
        kind: value === '{' || value === '}' ? 'brace' : value.startsWith('"') ? 'string' : 'identifier',
        value,
        line: lineIndex + 1,
        column,
      });
    }
    tokens.push({ kind: 'newline', value: '\n', line: lineIndex + 1, column: line.length + 1 });
  });
  return tokens;
}
