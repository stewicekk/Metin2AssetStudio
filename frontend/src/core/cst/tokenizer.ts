import type { Token, TokenType } from './types';

export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  let line = 1;
  let col = 1;
  const len = text.length;

  function advance(n: number): void {
    for (let i = 0; i < n; i++) {
      if (pos < len && text[pos] === '\n') {
        line++;
        col = 1;
      } else {
        col++;
      }
      pos++;
    }
  }

  function peek(offset = 0): string {
    return pos + offset < len ? text[pos + offset] : '\0';
  }

  function addToken(type: TokenType, raw: string): void {
    const startPos = pos;
    const startLine = line;
    const startCol = col;
    advance(raw.length);
    tokens.push({
      type,
      raw,
      value: type === 'String' ? raw.slice(1, -1) : raw.trim(),
      range: {
        start: startPos,
        end: pos,
        startLine,
        endLine: line,
        startCol,
        endCol: col,
      },
    });
  }

  while (pos < len) {
    const startPos = pos;
    const ch = text[pos];

    if (ch === '\n') {
      addToken('Newline', '\n');
      continue;
    }

    if (ch === '\r') {
      if (peek(1) === '\n') {
        addToken('Newline', '\r\n');
      } else {
        addToken('Newline', '\r');
      }
      continue;
    }

    if (ch === ' ' || ch === '\t') {
      let ws = '';
      while (pos < len && (text[pos] === ' ' || text[pos] === '\t')) {
        ws += text[pos];
        advance(1);
      }
      const endPos = pos;
      tokens.push({
        type: 'Whitespace',
        raw: ws,
        range: {
          start: startPos,
          end: endPos,
          startLine: line,
          endLine: line,
          startCol: col - ws.length,
          endCol: col,
        },
      });
      continue;
    }

    if (ch === '{') {
      addToken('BlockOpen', '{');
      continue;
    }

    if (ch === '}') {
      addToken('BlockClose', '}');
      continue;
    }

    if (ch === '/' && peek(1) === '/') {
      let comment = '';
      while (pos < len && text[pos] !== '\n' && text[pos] !== '\r') {
        comment += text[pos];
        advance(1);
      }
      const endPos = pos;
      tokens.push({
        type: 'Comment',
        raw: comment,
        value: comment.replace(/^\/\//, '').trim(),
        range: {
          start: startPos,
          end: endPos,
          startLine: line,
          endLine: line,
          startCol: col - comment.length,
          endCol: col,
        },
      });
      continue;
    }

    if (ch === '#') {
      let comment = '';
      while (pos < len && text[pos] !== '\n' && text[pos] !== '\r') {
        comment += text[pos];
        advance(1);
      }
      const endPos = pos;
      tokens.push({
        type: 'Comment',
        raw: comment,
        value: comment.replace(/^#/, '').trim(),
        range: {
          start: startPos,
          end: endPos,
          startLine: line,
          endLine: line,
          startCol: col - comment.length,
          endCol: col,
        },
      });
      continue;
    }

    if (ch === '"') {
      let str = '"';
      advance(1);
      while (pos < len && text[pos] !== '"') {
        if (text[pos] === '\\' && peek(1) === '"') {
          str += '\\"';
          advance(2);
        } else {
          str += text[pos];
          advance(1);
        }
      }
      if (pos < len) {
        str += '"';
        advance(1);
      }
      const endPos = pos;
      tokens.push({
        type: 'String',
        raw: str,
        value: str.slice(1, -1),
        range: {
          start: startPos,
          end: endPos,
          startLine: line,
          endLine: line,
          startCol: col - str.length,
          endCol: col,
        },
      });
      continue;
    }

    let word = '';
    while (pos < len && !isDelimiter(text[pos])) {
      word += text[pos];
      advance(1);
    }
    if (word) {
      const endPos = pos;
      tokens.push({
        type: 'Word',
        raw: word,
        value: word,
        range: {
          start: startPos,
          end: endPos,
          startLine: line,
          endLine: line,
          startCol: col - word.length,
          endCol: col,
        },
      });
      continue;
    }

    advance(1);
  }

  return tokens;
}

function isDelimiter(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '{' || ch === '}' || ch === '"';
}

export function tokensToText(tokens: Token[]): string {
  return tokens.map(t => t.raw).join('');
}
