import type { DependencyGraph } from '../../metin2/dependencies';
import type { Emitter, MseEffect } from '../../types';

export type GraphNodeKind = 'effect-root' | 'particle-group' | 'mesh-group' | 'texture-resource' | 'time-event-curve' | 'material-blend' | 'reroute' | 'output';

export interface GraphNode {
  id: string;
  kind: GraphNodeKind;
  label: string;
  astPath?: string;
  x: number;
  y: number;
}

export interface GraphLink {
  from: string;
  to: string;
  label: string;
}

export interface EffectGraph {
  nodes: GraphNode[];
  links: GraphLink[];
}

export function buildEffectGraph(emitters: Emitter[], importedEffects: MseEffect[], dependencyGraph?: DependencyGraph): EffectGraph {
  const nodes: GraphNode[] = [{ id: 'root', kind: 'effect-root', label: 'Effect Root', x: 24, y: 80 }];
  const links: GraphLink[] = [];

  emitters.forEach((emitter, index) => {
    const particleId = `particle:${emitter.uid}`;
    nodes.push({ id: particleId, kind: 'particle-group', label: emitter.name, astPath: `emitters/${index}`, x: 220, y: 32 + index * 96 });
    nodes.push({ id: `curve:${emitter.uid}:alpha`, kind: 'time-event-curve', label: 'Alpha Curve', astPath: `emitters/${index}/alphaCurve`, x: 430, y: 20 + index * 96 });
    nodes.push({ id: `texture:${emitter.uid}`, kind: 'texture-resource', label: emitter.texPath || emitter.builtinTex, astPath: `emitters/${index}/texPath`, x: 430, y: 58 + index * 96 });
    nodes.push({ id: `blend:${emitter.uid}`, kind: 'material-blend', label: emitter.blend.toUpperCase(), astPath: `emitters/${index}/blend`, x: 590, y: 42 + index * 96 });
    links.push({ from: 'root', to: particleId, label: 'contains' });
    links.push({ from: particleId, to: `curve:${emitter.uid}:alpha`, label: 'time-event' });
    links.push({ from: particleId, to: `texture:${emitter.uid}`, label: 'texture' });
    links.push({ from: particleId, to: `blend:${emitter.uid}`, label: 'material' });
  });

  importedEffects.forEach((effect, index) => {
    const id = `import:${effect.uid}`;
    nodes.push({ id, kind: 'effect-root', label: effect.name, astPath: `importedEffects/${index}`, x: 24, y: 220 + index * 72 });
    links.push({ from: id, to: 'root', label: 'source' });
  });

  dependencyGraph?.nodes.filter((node) => node.type === 'mesh').forEach((node, index) => {
    nodes.push({ id: `mesh:${index}`, kind: 'mesh-group', label: node.label, astPath: node.id, x: 590, y: 260 + index * 48 });
  });

  nodes.push({ id: 'output:mse', kind: 'output', label: 'MSE Export', x: 760, y: 80 });
  links.push({ from: 'root', to: 'output:mse', label: 'serialize' });
  return { nodes, links };
}
