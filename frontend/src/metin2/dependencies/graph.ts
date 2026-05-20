import type { Dependency } from '../../types';
import type { MSEBlock, MSEDocument } from '../ast';

export interface DependencyNode {
  id: string;
  label: string;
  type: 'effect' | 'group' | 'texture' | 'mesh' | 'animation' | 'other' | 'runtime' | 'editor';
  path?: string;
  missing?: boolean;
}

export interface DependencyEdge {
  from: string;
  to: string;
  label: string;
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  missing: Dependency[];
  duplicates: Dependency[];
  circular: string[];
}

function scanGroups(parentId: string, groups: MSEBlock[], nodes: DependencyNode[], edges: DependencyEdge[]): void {
  groups.forEach((group, index) => {
    const id = group.id ?? `${parentId}/group:${index}`;
    nodes.push({ id, label: group.name, type: group.name.toLowerCase().includes('mesh') ? 'mesh' : 'group' });
    edges.push({ from: parentId, to: id, label: 'ordered-group' });
  });
}

function dependencyId(type: string, path: string): string {
  return `${type}:${path.replace(/\\/g, '/').toLowerCase()}`;
}

export function buildDependencyGraph(document: MSEDocument, assetRoot = ''): DependencyGraph {
  const rootId = 'effect:root';
  const nodes: DependencyNode[] = [{ id: rootId, label: 'Effect Root', type: 'effect' }];
  const edges: DependencyEdge[] = [];
  const seen = new Map<string, Dependency>();
  const duplicates: Dependency[] = [];

  scanGroups(rootId, document.groups, nodes, edges);

  document.dependencies.forEach((dependency) => {
    const id = dependencyId(dependency.type, dependency.path);
    if (seen.has(id)) duplicates.push(dependency);
    seen.set(id, dependency);
    nodes.push({
      id,
      label: dependency.path,
      path: assetRoot ? `${assetRoot}/${dependency.path}`.replace(/\\/g, '/') : dependency.path,
      type: dependency.type,
      missing: dependency.resolved === false,
    });
    edges.push({ from: rootId, to: id, label: 'asset-ref' });
  });

  nodes.push({ id: 'runtime:preview', label: 'Three.js Preview Runtime', type: 'runtime' });
  nodes.push({ id: 'editor:binding', label: 'Inspector/Timeline Binding', type: 'editor' });
  edges.push({ from: rootId, to: 'runtime:preview', label: 'runtime-binding' });
  edges.push({ from: rootId, to: 'editor:binding', label: 'editor-binding' });

  return {
    nodes,
    edges,
    missing: document.dependencies.filter((dependency) => dependency.resolved === false),
    duplicates,
    circular: [],
  };
}
