import React from 'react';
import { DiagramNode, DiagramEdge } from '../../types/diagram';
import { Eye, EyeOff, Lock, Unlock, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface LayersPanelProps {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  selectedNodeIds: string[];
  selectedEdgeId: string | null;
  onSelectNode: (id: string, multiSelect: boolean) => void;
  onSelectEdge: (id: string) => void;
  onToggleLockNode: (id: string) => void;
  onToggleHideNode: (id: string) => void;
  onReorderNode?: (id: string, direction: 'up' | 'down') => void;
  onReorderNodes?: (newOrder: DiagramNode[]) => void;
  onDeleteNode?: (id: string) => void;
  onDeleteEdge?: (id: string) => void;
  isDarkMode?: boolean;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  nodes,
  edges,
  selectedNodeIds,
  selectedEdgeId,
  onSelectNode,
  onSelectEdge,
  onToggleLockNode,
  onToggleHideNode,
  onReorderNode,
  onReorderNodes,
  onDeleteNode,
  onDeleteEdge,
  isDarkMode = false,
}) => {
  // Sort nodes in descending z-index (top layer first)
  const sortedNodes = [...nodes].sort((a, b) => (b.zIndex || 1) - (a.zIndex || 1));

  const handleReorder = (id: string, direction: 'up' | 'down') => {
    if (onReorderNode) {
      onReorderNode(id, direction);
      return;
    }
    if (onReorderNodes) {
      const idx = sortedNodes.findIndex((n) => n.id === id);
      if (idx < 0) return;
      if (direction === 'up' && idx > 0) {
        const next = [...sortedNodes];
        const temp = next[idx - 1];
        next[idx - 1] = next[idx];
        next[idx] = temp;
        // reassign zIndex
        const reindexed = next.map((n, i) => ({ ...n, zIndex: next.length - i }));
        onReorderNodes(reindexed);
      } else if (direction === 'down' && idx < sortedNodes.length - 1) {
        const next = [...sortedNodes];
        const temp = next[idx + 1];
        next[idx + 1] = next[idx];
        next[idx] = temp;
        const reindexed = next.map((n, i) => ({ ...n, zIndex: next.length - i }));
        onReorderNodes(reindexed);
      }
    }
  };

  return (
    <div className={`flex flex-col h-full overflow-y-auto p-2 space-y-4 text-xs ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
      {/* Nodes Section */}
      <div>
        <div className={`flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-2 px-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          <span>Components ({nodes.length})</span>
        </div>

        {nodes.length === 0 ? (
          <p className="text-slate-400 italic px-2 py-3 text-center">No shapes on canvas</p>
        ) : (
          <div className="space-y-1">
            {sortedNodes.map((node) => {
              const isSelected = selectedNodeIds.includes(node.id);
              return (
                <div
                  key={node.id}
                  onClick={() => onSelectNode(node.id, false)}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? isDarkMode
                        ? 'bg-sky-950/70 border border-sky-500 text-white font-medium'
                        : 'bg-sky-50 border border-sky-300 text-sky-900 font-medium'
                      : isDarkMode
                      ? 'hover:bg-slate-800 text-slate-300'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate flex-1 mr-2">
                    <span
                      className="w-2.5 h-2.5 rounded-xs shrink-0 border border-slate-600"
                      style={{ backgroundColor: node.fill || '#ffffff' }}
                    />
                    <span className="truncate">{node.label || node.type}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReorder(node.id, 'up');
                      }}
                      className={`p-1 rounded transition-colors ${
                        isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                      }`}
                      title="Bring Forward"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReorder(node.id, 'down');
                      }}
                      className={`p-1 rounded transition-colors ${
                        isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                      }`}
                      title="Send Backward"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleHideNode(node.id);
                      }}
                      className={`p-1 rounded transition-colors ${
                        isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                      }`}
                      title={node.hidden ? 'Show' : 'Hide'}
                    >
                      {node.hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLockNode(node.id);
                      }}
                      className={`p-1 rounded transition-colors ${
                        isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                      }`}
                      title={node.locked ? 'Unlock' : 'Lock'}
                    >
                      {node.locked ? (
                        <Lock className="w-3 h-3 text-amber-500" />
                      ) : (
                        <Unlock className="w-3 h-3" />
                      )}
                    </button>
                    {onDeleteNode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteNode(node.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-950"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edges / Connections Section */}
      <div>
        <div className={`flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-2 px-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          <span>Connections ({edges.length})</span>
        </div>

        {edges.length === 0 ? (
          <p className="text-slate-400 italic px-2 py-3 text-center">No connections</p>
        ) : (
          <div className="space-y-1">
            {edges.map((edge) => {
              const isSelected = selectedEdgeId === edge.id;
              const sNode = nodes.find((n) => n.id === edge.source);
              const tNode = nodes.find((n) => n.id === edge.target);

              return (
                <div
                  key={edge.id}
                  onClick={() => onSelectEdge(edge.id)}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? isDarkMode
                        ? 'bg-sky-950/70 border border-sky-500 text-white font-medium'
                        : 'bg-sky-50 border border-sky-300 text-sky-900 font-medium'
                      : isDarkMode
                      ? 'hover:bg-slate-800 text-slate-300'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="truncate flex-1 mr-2 text-[11px]">
                    <span className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                      {sNode?.label || 'Source'}
                    </span>
                    <span className="text-sky-400 mx-1">→</span>
                    <span className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                      {tNode?.label || 'Target'}
                    </span>
                    {edge.label && (
                      <span className="text-slate-400 ml-1.5 italic">({edge.label})</span>
                    )}
                  </div>

                  {onDeleteEdge && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEdge(edge.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-950 shrink-0"
                      title="Delete Connector"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
