import type { Dependency } from '../types';

export type MSEBlockType = 'Root' | 'Group' | 'List' | 'Property' | 'Row' | 'Comment' | 'Blank';

export interface MSEBlock {
  type: MSEBlockType;
  name: string;
  value?: string;
  values?: string[];
  children: MSEBlock[];
  line: number;
  id?: string;
  span?: { startLine: number; endLine: number };
  raw?: string;
}

export interface MSEDocument {
  type: 'Group';
  name: 'root';
  children: MSEBlock[];
  groups: MSEBlock[];
  dependencies: Dependency[];
  diagnostics: string[];
  raw: string;
  line: number;
  id?: string;
  span?: { startLine: number; endLine: number };
}

const blockHeader = /^(Group|List)\s+(.+)$/i;
const referenceExtensions = [
  ['.mde', 'mesh'],
  ['.gr2', 'mesh'],
  ['.dds', 'texture'],
  ['.tga', 'texture'],
  ['.bmp', 'texture'],
  ['.png', 'texture'],
  ['.jpg', 'texture'],
  ['.jpeg', 'texture'],
] as const;

function splitValues(text: string): string[] {
  return text.match(/"[^"]*"|[^\s]+/g)?.map((part) => part.replace(/^"|"$/g, '')) ?? [];
}

function createNode(type: MSEBlockType, name: string, line: number, value?: string, raw?: string): MSEBlock {
  return { type, name, value, values: value ? splitValues(value) : undefined, children: [], line, raw };
}

function collectGroups(node: MSEBlock, groups: MSEBlock[]): void {
  if (node.type === 'Group') groups.push(node);
  node.children.forEach((child) => collectGroups(child, groups));
}

function collectDependencies(node: MSEBlock, dependencies: Dependency[]): void {
  const values = node.values ?? (node.value ? splitValues(node.value) : []);
  for (const value of values) {
    const lower = value.toLowerCase();
    const match = referenceExtensions.find(([ext]) => lower.endsWith(ext));
    if (match) dependencies.push({ path: value, type: match[1] });
  }
  node.children.forEach((child) => collectDependencies(child, dependencies));
}

function dedupeDependencies(dependencies: Dependency[]): Dependency[] {
  const seen = new Set<string>();
  return dependencies.filter((dependency) => {
    const key = `${dependency.type}:${dependency.path.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function assignStableIds(node: MSEBlock, path: string): void {
  node.children.forEach((child, index) => {
    child.id = `${path}/${child.type}:${child.name}:${index}`;
    child.span = { startLine: child.line, endLine: child.children.at(-1)?.span?.endLine ?? child.line };
    assignStableIds(child, child.id);
  });
}

export function parseMSE(text: string): MSEDocument {
  const root: MSEDocument = {
    type: 'Group',
    name: 'root',
    children: [],
    groups: [],
    dependencies: [],
    diagnostics: [],
    raw: text,
    line: 0,
  };
  const stack: MSEBlock[] = [root as MSEBlock];
  let pendingBlock: MSEBlock | null = null;

  text.split(/\r?\n/).forEach((sourceLine, index) => {
    const lineNumber = index + 1;
    const trimmed = sourceLine.trim();
    if (!trimmed) {
      stack[stack.length - 1].children.push(createNode('Blank', 'blank', lineNumber, '', sourceLine));
      return;
    }

    if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
      stack[stack.length - 1].children.push(createNode('Comment', 'comment', lineNumber, trimmed, sourceLine));
      return;
    }

    const withoutComment = sourceLine.replace(/\/\/.*$/, '').trim();
    if (!withoutComment) return;

    if (withoutComment === '{') {
      if (pendingBlock) {
        stack[stack.length - 1].children.push(pendingBlock);
        stack.push(pendingBlock);
        pendingBlock = null;
      }
      return;
    }

    if (withoutComment === '}') {
      if (stack.length > 1) {
        const closed = stack.pop();
        if (closed) closed.span = { startLine: closed.line, endLine: lineNumber };
      } else {
        root.diagnostics.push(`Unexpected closing brace at line ${lineNumber}`);
      }
      pendingBlock = null;
      return;
    }

    const inlineBlock = withoutComment.match(/^(Group|List)\s+(.+?)\s*\{$/i);
    if (inlineBlock) {
      const node = createNode(inlineBlock[1].toLowerCase() === 'group' ? 'Group' : 'List', inlineBlock[2].trim(), lineNumber, undefined, sourceLine);
      stack[stack.length - 1].children.push(node);
      stack.push(node);
      pendingBlock = null;
      return;
    }

    const header = withoutComment.match(blockHeader);
    if (header) {
      pendingBlock = createNode(header[1].toLowerCase() === 'group' ? 'Group' : 'List', header[2].trim(), lineNumber, undefined, sourceLine);
      return;
    }

    if (pendingBlock) {
      stack[stack.length - 1].children.push(pendingBlock);
      pendingBlock = null;
    }

    const parts = splitValues(withoutComment);
    if (parts.length === 0) return;

    if (stack[stack.length - 1].type === 'List') {
      stack[stack.length - 1].children.push(createNode('Row', parts[0] ?? 'row', lineNumber, parts.join(' '), sourceLine));
      return;
    }

    const [name, ...rest] = parts;
    stack[stack.length - 1].children.push(createNode('Property', name, lineNumber, rest.join(' '), sourceLine));
  });

  const groups: MSEBlock[] = [];
  const dependencies: Dependency[] = [];
  root.children.forEach((child) => {
    collectGroups(child, groups);
    collectDependencies(child, dependencies);
  });
  if (stack.length > 1) root.diagnostics.push(`${stack.length - 1} block(s) were not closed`);
  assignStableIds(root as MSEBlock, 'root');
  root.groups = groups;
  root.dependencies = dedupeDependencies(dependencies);
  return root;
}

function quoteValue(value: string): string {
  return /\s/.test(value) || value.includes('\\') || value.includes('/') ? `"${value}"` : value;
}

export function exportMSE(node: MSEBlock | MSEDocument, indent = ''): string {
  return node.children.map((child) => {
    if (child.type === 'Comment') return `${indent}${child.raw?.trim() ?? child.value ?? ''}\n`;
    if (child.type === 'Blank') return '\n';

    if (child.type === 'Group' || child.type === 'List') {
      return `${indent}${child.type} ${child.name}\n${indent}{\n${exportMSE(child, `${indent}    `)}${indent}}\n`;
    }

    if (child.type === 'Row') {
      const values = child.values?.map(quoteValue).join(' ') ?? child.value ?? '';
      return `${indent}${values}\n`;
    }

    return `${indent}${child.name}${child.value ? `\t${child.values?.map(quoteValue).join(' ') ?? child.value}` : ''}\n`;
  }).join('');
}

export function findChild(node: MSEBlock, type: MSEBlockType, name: string): MSEBlock | undefined {
  return node.children.find((child) => child.type === type && child.name.toLowerCase() === name.toLowerCase());
}

export function readNumberProperty(node: MSEBlock, name: string, fallback: number): number {
  const found = findChild(node, 'Property', name);
  const parsed = Number(found?.values?.[0]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function readListNumber(node: MSEBlock, listName: string, fallback: number): number {
  const list = findChild(node, 'List', listName);
  const row = list?.children.find((child) => child.type === 'Row');
  const last = row?.values?.[row.values.length - 1];
  const parsed = Number(last);
  return Number.isFinite(parsed) ? parsed : fallback;
}
