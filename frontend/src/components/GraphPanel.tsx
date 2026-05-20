import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { buildEffectGraph } from '../editor/nodeGraph/model';
import { buildDependencyGraph } from '../metin2/dependencies';
import { useAppStore } from '../store/useAppStore';
import { t } from '../i18n';

interface NodePosition { [nodeId: string]: { x: number; y: number } }

export function GraphPanel() {
  const emitters = useAppStore(s => s.emitters);
  const importedEffects = useAppStore(s => s.importedEffects);
  const activeEmitterId = useAppStore(s => s.activeEmitterId);
  const selectEmitter = useAppStore(s => s.selectEmitter);

  const latest = importedEffects.at(-1)?.rawData;
  const dependencyGraph = useMemo(() => latest ? buildDependencyGraph(latest) : undefined, [latest]);
  const graph = useMemo(() => buildEffectGraph(emitters, importedEffects, dependencyGraph), [emitters, importedEffects, dependencyGraph]);

  const initialPositions = useMemo(() => {
    const pos: NodePosition = {};
    graph.nodes.forEach(node => { pos[node.id] = { x: node.x, y: node.y }; });
    return pos;
  }, []);

  const [positions, setPositions] = useState<NodePosition>(initialPositions);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPositions(prev => {
      const next = { ...prev };
      let changed = false;
      graph.nodes.forEach(node => {
        if (!(node.id in next)) {
          next[node.id] = { x: node.x, y: node.y };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [graph.nodes.length]);

  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    setDragging(nodeId);
    setDragOffset({ x: e.clientX - positions[nodeId].x, y: e.clientY - positions[nodeId].y });
    setSelectedNode(nodeId);
  }, [positions]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setPositions(prev => ({
      ...prev,
      [dragging]: {
        x: Math.max(0, e.clientX - rect.left - dragOffset.x),
        y: Math.max(0, e.clientY - rect.top - dragOffset.y),
      }
    }));
  }, [dragging, dragOffset]);

  const handleMouseUp = useCallback(() => setDragging(null), []);

  const handleNodeClick = useCallback((nodeId: string) => {
    const node = graph.nodes.find(n => n.id === nodeId);
    if (node?.astPath?.startsWith('emitters/')) {
      const m = node.astPath.match(/emitters\/(\d+)/);
      if (m && emitters[parseInt(m[1])]) selectEmitter(emitters[parseInt(m[1])].uid);
    }
  }, [graph.nodes, emitters, selectEmitter]);

  const selectedEmitter = activeEmitterId ? emitters.find(e => e.uid === activeEmitterId) : null;

  return (
    <div className="studio-card graph-panel">
      <div className="studio-card__header">
        <span>{t('graph_title')}</span>
        <span className="muted">{graph.nodes.length} {t('graph_nodes')} / {graph.links.length} {t('graph_links')}</span>
      </div>
      <div
        className="graph-canvas"
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg className="graph-links">
          {graph.links.map((link) => {
            const fromPos = positions[link.from];
            const toPos = positions[link.to];
            if (!fromPos || !toPos) return null;
            return (
              <line
                key={`${link.from}-${link.to}`}
                x1={fromPos.x + 60} y1={fromPos.y + 15}
                x2={toPos.x} y2={toPos.y + 15}
                stroke="var(--border)" strokeWidth="1"
              />
            );
          })}
        </svg>
        {graph.nodes.map((node) => (
          <div
            key={node.id}
            className={`graph-node graph-node--${node.kind} ${selectedNode === node.id ? 'selected' : ''}`}
            style={{ left: positions[node.id]?.x ?? node.x, top: positions[node.id]?.y ?? node.y }}
            onMouseDown={(e) => handleMouseDown(e, node.id)}
            onClick={() => handleNodeClick(node.id)}
          >
            <b>{node.label}</b>
            <span className="node-kind">{node.kind}</span>
          </div>
        ))}
      </div>
      {selectedEmitter && (
        <div className="graph-properties" style={{ padding: 6, borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--text2)' }}>
          {selectedEmitter.name} &mdash; {t('graph_blend')}: {selectedEmitter.blend}, {t('graph_shape')}: {selectedEmitter.shape}
        </div>
      )}
    </div>
  );
}
