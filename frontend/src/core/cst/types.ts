export interface SourceRange {
  start: number;
  end: number;
  startLine: number;
  endLine: number;
  startCol: number;
  endCol: number;
}

export type TokenType =
  | 'BlockOpen'
  | 'BlockClose'
  | 'Newline'
  | 'String'
  | 'Word'
  | 'Comment'
  | 'Blank'
  | 'Whitespace';

export interface Token {
  type: TokenType;
  raw: string;
  range: SourceRange;
  value?: string;
}

export type CSTNodeType =
  | 'Document'
  | 'Block'
  | 'Property'
  | 'Row'
  | 'CommentLine'
  | 'BlankLine';

export interface CSTNode {
  type: CSTNodeType;
  name: string;
  tokens: Token[];
  children: CSTNode[];
  range: SourceRange;
  raw: string;
  dirty: boolean;
  semanticValue?: string;
  blockType?: 'Group' | 'List';
}

export function mergeRange(a: SourceRange, b: SourceRange): SourceRange {
  return {
    start: Math.min(a.start, b.start),
    end: Math.max(a.end, b.end),
    startLine: Math.min(a.startLine, b.startLine),
    endLine: Math.max(a.endLine, b.endLine),
    startCol: a.start < b.start ? a.startCol : b.startCol,
    endCol: a.end > b.end ? a.endCol : b.endCol,
  };
}

export function rangeFromToken(token: Token): SourceRange {
  return { ...token.range };
}
