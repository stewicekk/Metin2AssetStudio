import type { Token, CSTNode, SourceRange } from './types';
import { mergeRange } from './types';
import { tokenize, tokensToText } from './tokenizer';

function rangeFromTokens(tokens: Token[]): SourceRange {
  if (tokens.length === 0) {
    return { start: 0, end: 0, startLine: 1, endLine: 1, startCol: 1, endCol: 1 };
  }
  let range = { ...tokens[0].range };
  for (let i = 1; i < tokens.length; i++) {
    range = mergeRange(range, tokens[i].range);
  }
  return range;
}

function isNewline(t: Token): boolean {
  return t.type === 'Newline';
}

function isWhitespace(t: Token): boolean {
  return t.type === 'Whitespace';
}

interface LineResult {
  tokens: Token[];
  next: number;
}

function readLine(tokens: Token[], start: number): LineResult {
  const line: Token[] = [];
  let i = start;
  while (i < tokens.length && !isNewline(tokens[i])) {
    line.push(tokens[i]);
    i++;
  }
  if (i < tokens.length && isNewline(tokens[i])) {
    line.push(tokens[i]);
    i++;
  }
  return { tokens: line, next: i };
}

function isCommentOrBlank(tokens: Token[]): 'comment' | 'blank' | 'property' | 'row' | 'blockHeader' | 'blockClose' | null {
  const nonWs = tokens.filter(t => !isWhitespace(t) && !isNewline(t));
  if (nonWs.length === 0) return 'blank';
  const first = nonWs[0];
  if (first.type === 'Comment') return 'comment';
  if (first.type === 'BlockClose') return 'blockClose';
  if (first.type === 'BlockOpen') return null;
  if (nonWs.length >= 2 && nonWs[0].type === 'Word' && (nonWs[0].value === 'Group' || nonWs[0].value === 'List') && nonWs[1].type === 'Word') {
    return 'blockHeader';
  }
  return 'property';
}

interface BlockInfo {
  headerTokens: Token[];
  bodyTokens: Token[];
  closeTokens: Token[];
  endIndex: number;
}

function parseBlockContent(tokens: Token[], start: number): BlockInfo | null {
  const headerTokens: Token[] = [];
  let i = start;

  while (i < tokens.length && !isNewline(tokens[i])) {
    headerTokens.push(tokens[i]);
    i++;
  }
  if (i < tokens.length && isNewline(tokens[i])) {
    headerTokens.push(tokens[i]);
    i++;
  }

  while (i < tokens.length && isWhitespace(tokens[i]) && isNewline(tokens[i+1])) {
    i++;
  }

  const bodyTokens: Token[] = [];
  let depth = 0;
  let foundOpen = false;

  while (i < tokens.length) {
    const firstNonWsIdx = tokens.findIndex((t, idx) => idx >= i && !isWhitespace(t) && !isNewline(t));

    if (firstNonWsIdx >= 0 && tokens[firstNonWsIdx].type === 'BlockOpen') {
      if (!foundOpen) {
        foundOpen = true;
        bodyTokens.push(tokens[i]);
        i++;
        continue;
      }
      depth++;
      bodyTokens.push(tokens[i]);
      i++;
      continue;
    }

    if (firstNonWsIdx >= 0 && tokens[firstNonWsIdx].type === 'BlockClose') {
      if (depth === 0 && foundOpen) {
        i++;
        const closeTokens: Token[] = [tokens[i - 1]];
        while (i < tokens.length && isNewline(tokens[i])) {
          closeTokens.push(tokens[i]);
          i++;
        }
        return { headerTokens, bodyTokens, closeTokens, endIndex: i };
      }
      if (depth > 0) {
        depth--;
        bodyTokens.push(tokens[i]);
        i++;
        continue;
      }
    }

    bodyTokens.push(tokens[i]);
    i++;
  }

  return null;
}

export function parseCST(text: string): CSTNode {
  const allTokens = tokenize(text);
  return buildDocument(allTokens, 0).node;
}

interface ParseResult {
  node: CSTNode;
  next: number;
}

function buildDocument(tokens: Token[], start: number): ParseResult {
  const children: CSTNode[] = [];
  const documentTokens: Token[] = [];
  let i = start;

  while (i < tokens.length) {
    const line = readLine(tokens, i);
    const kind = isCommentOrBlank(line.tokens);
    const nonWs = line.tokens.filter(t => !isWhitespace(t) && !isNewline(t));

    if (kind === 'blank') {
      children.push(createLineNode('BlankLine', 'blank', line.tokens));
      documentTokens.push(...line.tokens);
      i = line.next;
      continue;
    }

    if (kind === 'comment') {
      children.push(createLineNode('CommentLine', 'comment', line.tokens));
      documentTokens.push(...line.tokens);
      i = line.next;
      continue;
    }

    if (kind === 'blockHeader') {
      const info = parseBlockContent(tokens, i);
      if (info) {
        const blockName = info.headerTokens.find(t => !isWhitespace(t) && !isNewline(t) && t.type === 'Word' && t.value !== 'Group' && t.value !== 'List')?.value || '';
        const blockType = info.headerTokens.find(t => t.type === 'Word' && (t.value === 'Group' || t.value === 'List'))?.value as 'Group' | 'List' | undefined;

        const subResult = buildDocument(info.bodyTokens, 0);
        const allBlockTokens = [...info.headerTokens, ...info.bodyTokens, ...info.closeTokens];

        const childNode: CSTNode = {
          type: 'Block',
          name: blockName,
          tokens: allBlockTokens,
          children: subResult.node.children,
          range: rangeFromTokens(allBlockTokens),
          raw: tokensToText(allBlockTokens),
          dirty: false,
          blockType: blockType || 'Group',
        };

        children.push(childNode);
        documentTokens.push(...allBlockTokens);
        i = info.endIndex;
        continue;
      }
    }

    if (kind === 'blockClose') {
      const child = createLineNode('Property', tokens[i]?.value || '', line.tokens);
      children.push(child);
      documentTokens.push(...line.tokens);
      i = line.next;
      continue;
    }

    if (kind === 'property') {
      const parent = children.length > 0 ? children[children.length - 1] : null;
      if (parent && (parent.type === 'Property' || parent.type === 'Row')) {
        parent.tokens.push(...line.tokens);
        parent.raw = tokensToText(parent.tokens);
        parent.range = rangeFromTokens(parent.tokens);
      } else {
        const name = nonWs.find(t => t.type === 'Word' || t.type === 'String')?.value || '';
        const nodeType = 'Property';
        children.push(createLineNode(nodeType as any, name, line.tokens));
      }
      documentTokens.push(...line.tokens);
      i = line.next;
      continue;
    }

    documentTokens.push(...line.tokens);
    i = line.next;
  }

  const root: CSTNode = {
    type: 'Document',
    name: 'root',
    tokens: documentTokens,
    children,
    range: rangeFromTokens(documentTokens),
    raw: tokensToText(documentTokens),
    dirty: false,
  };

  return { node: root, next: tokens.length };
}

function createLineNode(type: CSTNode['type'], name: string, tokens: Token[]): CSTNode {
  return {
    type,
    name,
    tokens,
    children: [],
    range: rangeFromTokens(tokens),
    raw: tokensToText(tokens),
    dirty: false,
  };
}
