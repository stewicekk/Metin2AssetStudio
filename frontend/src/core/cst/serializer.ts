import type { CSTNode } from './types';
import type { Emitter } from '../../types';
import { buildMSE } from '../../utils/mseExporter';

export interface SerializeOptions {
  precision: number;
  effectName: string;
}

export function serializeCST(root: CSTNode, emitters?: Emitter[], opts?: SerializeOptions): string {
  const lines: string[] = [];

  for (const child of root.children) {
    lines.push(serializeNode(child, emitters, opts));
  }

  return lines.join('');
}

function serializeNode(node: CSTNode, emitters?: Emitter[], opts?: SerializeOptions): string {
  if (node.type === 'BlankLine' || node.type === 'CommentLine') {
    return node.raw;
  }

  if (node.type === 'Block') {
    if (node.dirty && emitters && opts) {
      return serializeDirtyBlock(node, emitters, opts);
    }
    let result = node.raw;
    for (const child of node.children) {
      if (child.dirty) {
        result = replaceChildRaw(result, child, serializeNode(child, emitters, opts));
      }
    }
    return result;
  }

  if (node.type === 'Property' || node.type === 'Row') {
    if (node.dirty) {
      return serializeDirtyProperty(node, opts);
    }
    return node.raw;
  }

  return node.raw;
}

function serializeDirtyBlock(node: CSTNode, emitters: Emitter[], opts: SerializeOptions): string {
  if (emitters && emitters.length > 0) {
    const globalMSE = buildMSE(emitters, opts);

    const systemBlocks = globalMSE.split('StartParticleSystem');
    if (systemBlocks.length > 1) {
      const emitterIdx = emitters.findIndex(e => e.name === node.name);
      if (emitterIdx >= 0 && emitterIdx + 1 < systemBlocks.length) {
        let block = 'StartParticleSystem' + systemBlocks[emitterIdx + 1];
        const endIdx = block.indexOf('EndParticleSystem');
        if (endIdx >= 0) {
          block = block.substring(0, endIdx + 'EndParticleSystem'.length);
        }
        block += '\n\n';
        return block;
      }
    }
  }

  return node.raw;
}

function serializeDirtyProperty(node: CSTNode, _opts?: SerializeOptions): string {
  if (node.semanticValue !== undefined) {
    return node.semanticValue;
  }
  return node.raw;
}

function replaceChildRaw(parentRaw: string, child: CSTNode, newRaw: string): string {
  const childRaw = child.raw;
  const idx = parentRaw.indexOf(childRaw);
  if (idx >= 0) {
    return parentRaw.substring(0, idx) + newRaw + parentRaw.substring(idx + childRaw.length);
  }
  return parentRaw;
}

export function markDirty(node: CSTNode, path: string[]): void {
  if (path.length === 0) {
    node.dirty = true;
    return;
  }

  const [head, ...rest] = path;
  for (const child of node.children) {
    if (child.name.toLowerCase() === head.toLowerCase()) {
      markDirty(child, rest);
      return;
    }
  }
}

export function rebuildCSTFromEmitters(root: CSTNode, emitters: Emitter[]): CSTNode {
  const emitterBlocks = root.children.filter(c => c.type === 'Block');
  emitterBlocks.forEach(block => {
    const matchingEmitter = emitters.find(e => e.name === block.name);
    if (matchingEmitter) {
      block.dirty = true;
    }
  });
  return root;
}
