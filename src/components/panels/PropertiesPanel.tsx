import React, { useState } from 'react';
import {
  DiagramPage,
  DiagramNode,
  DiagramEdge,
  HandlePosition,
  PagePreset,
  PageOrientation,
  ConnectorType,
  ArrowType,
  StrokeStyle,
} from '../../types/diagram';
import { LayersPanel } from './LayersPanel';
import { shouldRenderLabelUnderShape } from '../../lib/geometry';
import {
  Sliders,
  Layers,
  Lock,
  Unlock,
  Copy,
  Trash2,
  Box,
  FileText,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Magnet,
  Maximize2,
  Type,
  Palette,
  X,
  ArrowLeftRight,
  Waypoints,
  CornerDownRight,
  Spline,
  Slash,
} from 'lucide-react';

interface PropertiesPanelProps {
  page: DiagramPage;
  selectedNodeIds: string[];
  selectedEdgeId: string | null;
  onUpdateNodes: (nodes: DiagramNode[]) => void;
  onUpdateEdges: (edges: DiagramEdge[]) => void;
  onUpdatePage: (page: DiagramPage) => void;
  onDuplicateNodes: (nodeIds: string[]) => void;
  onDeleteSelected: () => void;
  onSelectNode: (id: string, multiSelect: boolean) => void;
  onSelectEdge: (id: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  isDarkMode?: boolean;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  page,
  selectedNodeIds,
  selectedEdgeId,
  onUpdateNodes,
  onUpdateEdges,
  onUpdatePage,
  onDuplicateNodes,
  onDeleteSelected,
  onSelectNode,
  onSelectEdge,
  isOpen,
  onToggleOpen,
  isDarkMode = false,
}) => {
  const [activeTab, setActiveTab] = useState<'properties' | 'layers'>('properties');

  if (!isOpen) {
    return (
      <div
        className={`w-10 border-l flex flex-col items-center py-3 shrink-0 transition-colors ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <button
          onClick={onToggleOpen}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode
              ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
          title="Open Properties Panel"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const primaryNode = page.nodes.find((n) => n.id === selectedNodeIds[0]);
  const primaryEdge = page.edges.find((e) => e.id === selectedEdgeId);

  const updatePrimaryNode = (updates: Partial<DiagramNode>) => {
    if (!primaryNode) return;
    const updated = page.nodes.map((n) =>
      selectedNodeIds.includes(n.id) ? { ...n, ...updates } : n
    );
    onUpdateNodes(updated);
  };

  const updatePrimaryEdge = (updates: Partial<DiagramEdge>) => {
    if (!primaryEdge) return;
    const updated = page.edges.map((e) => (e.id === primaryEdge.id ? { ...e, ...updates } : e));
    onUpdateEdges(updated);
  };

  const swapEdgeDirection = () => {
    if (!primaryEdge) return;
    updatePrimaryEdge({
      source: primaryEdge.target,
      target: primaryEdge.source,
      sourceHandle: primaryEdge.targetHandle,
      targetHandle: primaryEdge.sourceHandle,
    });
  };

  // Curated technical palette
  const COLOR_PALETTE = [
    '#ffffff',
    '#f8fafc',
    '#f0f9ff',
    '#f0fdf4',
    '#fffbeb',
    '#fef2f2',
    '#faf5ff',
    '#0f172a',
    '#334155',
    '#0284c7',
    '#16a34a',
    '#d97706',
    '#dc2626',
    '#7c3aed',
  ];

  const handlesList: HandlePosition[] = ['top', 'right', 'bottom', 'left'];

  return (
    <aside
      className={`w-80 border-l flex flex-col h-full shrink-0 z-20 shadow-xs transition-colors ${
        isDarkMode
          ? 'bg-slate-900 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Top Header: Clean Segmented Tab Switcher */}
      <div
        className={`h-12 border-b flex items-center justify-between px-4 shrink-0 transition-colors ${
          isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
        }`}
      >
        <div
          className={`flex items-center gap-1 p-1 rounded-lg text-xs font-semibold ${
            isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
          }`}
        >
          <button
            onClick={() => setActiveTab('properties')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'properties'
                ? isDarkMode
                  ? 'bg-slate-700 text-white shadow-xs font-bold'
                  : 'bg-white text-slate-900 shadow-2xs font-bold'
                : isDarkMode
                ? 'hover:text-slate-200'
                : 'hover:text-slate-900'
            }`}
          >
            Properties
          </button>
          <button
            onClick={() => setActiveTab('layers')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'layers'
                ? isDarkMode
                  ? 'bg-slate-700 text-white shadow-xs font-bold'
                  : 'bg-white text-slate-900 shadow-2xs font-bold'
                : isDarkMode
                ? 'hover:text-slate-200'
                : 'hover:text-slate-900'
            }`}
          >
            Layers
          </button>
        </div>

        <button
          onClick={onToggleOpen}
          className={`p-1.5 rounded-lg transition-colors ${
            isDarkMode
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
          }`}
          title="Collapse Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Panel Scroll Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {activeTab === 'layers' ? (
          <LayersPanel
            nodes={page.nodes}
            edges={page.edges}
            selectedNodeIds={selectedNodeIds}
            selectedEdgeId={selectedEdgeId}
            onSelectNode={onSelectNode}
            onSelectEdge={onSelectEdge}
            onToggleLockNode={(id) => {
              const target = page.nodes.find((n) => n.id === id);
              if (target) {
                const updated = page.nodes.map((n) =>
                  n.id === id ? { ...n, locked: !n.locked } : n
                );
                onUpdateNodes(updated);
              }
            }}
            onToggleHideNode={(id) => {
              const target = page.nodes.find((n) => n.id === id);
              if (target) {
                const updated = page.nodes.map((n) =>
                  n.id === id ? { ...n, hidden: !n.hidden } : n
                );
                onUpdateNodes(updated);
              }
            }}
            onReorderNodes={(newOrder) => onUpdateNodes(newOrder)}
            isDarkMode={isDarkMode}
          />
        ) : primaryNode ? (
          // ==========================================
          // 1. NODE PROPERTIES
          // ==========================================
          <div className="space-y-4">
            {/* Action Bar */}
            <div className={`flex items-center justify-between pb-3 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-1.5">
                <span className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {primaryNode.label || 'Selected Shape'}
                </span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase ${
                  isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                }`}>
                  {primaryNode.category}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => updatePrimaryNode({ locked: !primaryNode.locked })}
                  className={`p-1.5 rounded-lg transition-colors ${
                    primaryNode.locked
                      ? 'text-amber-500 bg-amber-500/10'
                      : isDarkMode
                      ? 'text-slate-400 hover:bg-slate-800'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                  title={primaryNode.locked ? 'Unlock Shape' : 'Lock Shape'}
                >
                  {primaryNode.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => onDuplicateNodes(selectedNodeIds)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                  title="Duplicate Shape (Ctrl+D)"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onDeleteSelected}
                  className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Delete Shape (Delete)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Typography & Content */}
            <div className="space-y-2">
              <span className={`font-semibold text-xs block ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Label & Details
              </span>
              <input
                type="text"
                value={primaryNode.label}
                onChange={(e) => updatePrimaryNode({ label: e.target.value })}
                placeholder="Main label"
                className={`w-full text-xs px-3 py-1.5 rounded-lg border outline-none ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-sky-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-sky-500'
                }`}
              />
              <input
                type="text"
                value={primaryNode.subLabel || ''}
                onChange={(e) => updatePrimaryNode({ subLabel: e.target.value })}
                placeholder="Sub-label (port, tech stack, role)"
                className={`w-full text-xs px-3 py-1.5 rounded-lg border outline-none ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-sky-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-sky-500'
                }`}
              />
              {/* Label Position */}
              <div className="pt-1">
                <span className={`text-[11px] font-medium block mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Label Position
                </span>
                <div
                  className={`grid grid-cols-3 gap-1 p-0.5 rounded-lg border ${
                    isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  <button
                    onClick={() => updatePrimaryNode({ labelPosition: 'bottom' })}
                    className={`py-1 text-[11px] font-medium rounded-md transition-all ${
                      (primaryNode.labelPosition === 'bottom' ||
                        (!primaryNode.labelPosition && shouldRenderLabelUnderShape(primaryNode)))
                        ? isDarkMode
                          ? 'bg-sky-600 text-white shadow-xs font-semibold'
                          : 'bg-white text-sky-700 shadow-xs font-semibold'
                        : isDarkMode
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Under Shape (avoids overlapping icons & geometry)"
                  >
                    Under Shape
                  </button>
                  <button
                    onClick={() => updatePrimaryNode({ labelPosition: 'inside' })}
                    className={`py-1 text-[11px] font-medium rounded-md transition-all ${
                      primaryNode.labelPosition === 'inside' ||
                      (!primaryNode.labelPosition && !shouldRenderLabelUnderShape(primaryNode))
                        ? isDarkMode
                          ? 'bg-sky-600 text-white shadow-xs font-semibold'
                          : 'bg-white text-sky-700 shadow-xs font-semibold'
                        : isDarkMode
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Inside Center of Shape"
                  >
                    Inside
                  </button>
                  <button
                    onClick={() => updatePrimaryNode({ labelPosition: 'top' })}
                    className={`py-1 text-[11px] font-medium rounded-md transition-all ${
                      primaryNode.labelPosition === 'top'
                        ? isDarkMode
                          ? 'bg-sky-600 text-white shadow-xs font-semibold'
                          : 'bg-white text-sky-700 shadow-xs font-semibold'
                        : isDarkMode
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Above Shape"
                  >
                    Above
                  </button>
                </div>

                {(Boolean(primaryNode.labelOffsetX) || Boolean(primaryNode.labelOffsetY)) && (
                  <div className={`flex items-center justify-between mt-2 pt-1.5 border-t text-[11px] ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                    <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                      Dragged offset: {primaryNode.labelOffsetX || 0}, {primaryNode.labelOffsetY || 0}
                    </span>
                    <button
                      onClick={() => updatePrimaryNode({ labelOffsetX: 0, labelOffsetY: 0 })}
                      className="text-sky-500 hover:underline font-semibold"
                    >
                      Reset Position
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Fill Color */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`font-semibold text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Fill Color
                </span>
                <input
                  type="color"
                  value={primaryNode.fill || '#ffffff'}
                  onChange={(e) => updatePrimaryNode({ fill: e.target.value })}
                  className="w-6 h-6 p-0 border border-slate-700 rounded-md cursor-pointer"
                />
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {COLOR_PALETTE.map((color) => (
                  <button
                    key={color}
                    onClick={() => updatePrimaryNode({ fill: color })}
                    style={{ backgroundColor: color }}
                    className={`h-6 rounded-md border transition-transform ${
                      primaryNode.fill === color ? 'border-sky-500 ring-2 ring-sky-500/20 scale-105' : 'border-slate-700/60'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Stroke Width & Style */}
            <div className="space-y-2">
              <span className={`font-semibold text-xs block ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Border Stroke
              </span>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={primaryNode.strokeWidth}
                  onChange={(e) => updatePrimaryNode({ strokeWidth: Number(e.target.value) })}
                  className={`w-full text-xs px-2.5 py-1.5 rounded-lg border outline-none ${
                    isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value={1}>1px Line</option>
                  <option value={1.5}>1.5px Standard</option>
                  <option value={2}>2px Bold</option>
                  <option value={3}>3px Heavy</option>
                </select>

                <select
                  value={primaryNode.strokeStyle}
                  onChange={(e) => updatePrimaryNode({ strokeStyle: e.target.value as StrokeStyle })}
                  className={`w-full text-xs px-2.5 py-1.5 rounded-lg border outline-none ${
                    isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                </select>
              </div>
            </div>

            {/* Dimensions */}
            <div className="space-y-2">
              <span className={`font-semibold text-xs block ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Size & Position
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <span className="text-slate-500 font-mono">W:</span>
                  <input
                    type="number"
                    value={Math.round(primaryNode.width)}
                    onChange={(e) => updatePrimaryNode({ width: Math.max(30, Number(e.target.value)) })}
                    className="w-full bg-transparent outline-none font-mono"
                  />
                </div>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <span className="text-slate-500 font-mono">H:</span>
                  <input
                    type="number"
                    value={Math.round(primaryNode.height)}
                    onChange={(e) => updatePrimaryNode({ height: Math.max(30, Number(e.target.value)) })}
                    className="w-full bg-transparent outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : primaryEdge ? (
          // ==========================================
          // 2. CONNECTOR PROPERTIES (WITH RECONNECTING!)
          // ==========================================
          <div className="space-y-5">
            <div className={`flex items-center justify-between pb-3 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-1.5">
                <Waypoints className="w-4 h-4 text-sky-400" />
                <span className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Connection Link
                </span>
              </div>
              <button
                onClick={onDeleteSelected}
                className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                title="Delete Link (Del)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Label Text */}
            <div>
              <span className={`font-semibold text-xs block mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Link Label / Protocol
              </span>
              <input
                type="text"
                value={primaryEdge.label || ''}
                onChange={(e) => updatePrimaryEdge({ label: e.target.value })}
                placeholder="e.g. HTTPS / REST API / SQL / Events"
                className={`w-full text-xs px-3 py-2 rounded-lg border outline-none ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-sky-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-sky-500'
                }`}
              />
            </div>

            {/* RECONNECT & TERMINAL CONTROL (User can reconnect source and target!) */}
            <div className={`p-3 rounded-xl border space-y-3 ${isDarkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-sky-400 flex items-center gap-1">
                  <span>Reconnect Endpoints</span>
                </span>
                <button
                  onClick={swapEdgeDirection}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                    isDarkMode
                      ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Swap connection direction"
                >
                  <ArrowLeftRight className="w-3 h-3 text-sky-400" />
                  <span>Swap</span>
                </button>
              </div>

              {/* Source Node Selector */}
              <div className="space-y-1">
                <span className={`text-[11px] font-semibold block ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Source Node (Origin):
                </span>
                <select
                  value={primaryEdge.source}
                  onChange={(e) => updatePrimaryEdge({ source: e.target.value })}
                  className={`w-full text-xs px-2.5 py-1.5 rounded-lg border outline-none ${
                    isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  {page.nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label || `Shape (${n.type})`}
                    </option>
                  ))}
                </select>

                {/* Source Port Buttons */}
                <div className="flex items-center gap-1 pt-1">
                  <span className="text-[10px] text-slate-400 mr-1">Port:</span>
                  {handlesList.map((h) => (
                    <button
                      key={h}
                      onClick={() => updatePrimaryEdge({ sourceHandle: h })}
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono transition-colors ${
                        primaryEdge.sourceHandle === h
                          ? 'bg-sky-500 text-white font-bold'
                          : isDarkMode
                          ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Node Selector */}
              <div className="space-y-1 pt-2 border-t border-slate-700/50">
                <span className={`text-[11px] font-semibold block ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Target Node (Arrow Destination):
                </span>
                <select
                  value={primaryEdge.target}
                  onChange={(e) => updatePrimaryEdge({ target: e.target.value })}
                  className={`w-full text-xs px-2.5 py-1.5 rounded-lg border outline-none ${
                    isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  {page.nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label || `Shape (${n.type})`}
                    </option>
                  ))}
                </select>

                {/* Target Port Buttons */}
                <div className="flex items-center gap-1 pt-1">
                  <span className="text-[10px] text-slate-400 mr-1">Port:</span>
                  {handlesList.map((h) => (
                    <button
                      key={h}
                      onClick={() => updatePrimaryEdge({ targetHandle: h })}
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono transition-colors ${
                        primaryEdge.targetHandle === h
                          ? 'bg-sky-500 text-white font-bold'
                          : isDarkMode
                          ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-slate-400 italic pt-1">
                Tip: You can also drag the circular terminal handles directly on the canvas to reconnect!
              </p>
            </div>

            {/* Routing & Arrowheads */}
            <div className="space-y-2">
              <span className={`font-semibold text-xs block ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Routing & Direction
              </span>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={primaryEdge.lineType}
                  onChange={(e) =>
                    updatePrimaryEdge({ lineType: e.target.value as ConnectorType })
                  }
                  className={`w-full text-xs px-2.5 py-1.5 rounded-lg border outline-none ${
                    isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="orthogonal">Orthogonal / Elbow</option>
                  <option value="straight">Straight Line</option>
                  <option value="curved">Curved Bézier</option>
                </select>

                <select
                  value={primaryEdge.arrowType}
                  onChange={(e) => updatePrimaryEdge({ arrowType: e.target.value as ArrowType })}
                  className={`w-full text-xs px-2.5 py-1.5 rounded-lg border outline-none ${
                    isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="arrow">Single Arrow (→)</option>
                  <option value="double-arrow">Bidirectional (⇄)</option>
                  <option value="none">Plain Line (—)</option>
                </select>
              </div>
            </div>

            {/* Stroke Width, Style & Color */}
            <div className="space-y-2">
              <span className={`font-semibold text-xs block ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Stroke Style & Color
              </span>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={primaryEdge.strokeWidth || 1.5}
                  onChange={(e) => updatePrimaryEdge({ strokeWidth: Number(e.target.value) })}
                  className={`w-full text-xs px-2.5 py-1.5 rounded-lg border outline-none ${
                    isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value={1}>1px Thin</option>
                  <option value={1.5}>1.5px Standard</option>
                  <option value={2.5}>2.5px Bold</option>
                  <option value={4}>4px Heavy</option>
                </select>

                <select
                  value={primaryEdge.strokeStyle || 'solid'}
                  onChange={(e) => updatePrimaryEdge({ strokeStyle: e.target.value as StrokeStyle })}
                  className={`w-full text-xs px-2.5 py-1.5 rounded-lg border outline-none ${
                    isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                </select>
              </div>

              <div className="grid grid-cols-7 gap-1.5 pt-1">
                {['#38bdf8', '#0284c7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', isDarkMode ? '#94a3b8' : '#334155'].map((color) => (
                  <button
                    key={color}
                    onClick={() => updatePrimaryEdge({ stroke: color })}
                    style={{ backgroundColor: color }}
                    className={`h-6 rounded-md border transition-transform ${
                      primaryEdge.stroke === color ? 'border-white ring-2 ring-sky-500 scale-105' : 'border-slate-700/60'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          // ==========================================
          // 3. PAGE & REPORT PROPERTIES
          // ==========================================
          <div className="space-y-5">
            {/* Header */}
            <div className="pb-1">
              <h3 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Page & Document
              </h3>
              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Layout presets, alignment grid, and report metadata
              </p>
            </div>

            {/* Document Size Presets */}
            <div className="space-y-2">
              <span className={`font-semibold text-xs block ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Page Preset
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'A4', label: 'A4 Report', desc: 'Standard Paper' },
                  { id: 'Letter', label: 'Letter', desc: 'US Document' },
                  { id: 'A3', label: 'A3 Poster', desc: 'Wide Architecture' },
                  { id: 'Infinite', label: 'Infinite', desc: 'Free Canvas' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      const preset = item.id as PagePreset;
                      let w = 1123;
                      let h = 794;
                      if (preset === 'A4') {
                        w = page.orientation === 'portrait' ? 794 : 1123;
                        h = page.orientation === 'portrait' ? 1123 : 794;
                      } else if (preset === 'A3') {
                        w = page.orientation === 'portrait' ? 1123 : 1587;
                        h = page.orientation === 'portrait' ? 1587 : 1123;
                      } else if (preset === 'Letter') {
                        w = page.orientation === 'portrait' ? 816 : 1056;
                        h = page.orientation === 'portrait' ? 1056 : 816;
                      } else if (preset === 'Infinite') {
                        w = 4000;
                        h = 4000;
                      }
                      onUpdatePage({ ...page, preset, width: w, height: h });
                    }}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      page.preset === item.id
                        ? isDarkMode
                          ? 'border-sky-500 bg-sky-950/40 text-white'
                          : 'border-sky-500 bg-sky-50/60 shadow-2xs'
                        : isDarkMode
                        ? 'border-slate-800 bg-slate-850/60 hover:bg-slate-800 text-slate-300'
                        : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 text-slate-600'
                    }`}
                  >
                    <span className={`font-semibold text-xs block ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {item.label}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Grid & Alignment Settings */}
            <div className="space-y-2 pt-2 border-t border-slate-700/50">
              <span className={`font-semibold text-xs block ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Alignment & Grid
              </span>
              <div className="space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Show Grid Dots
                  </span>
                  <input
                    type="checkbox"
                    checked={page.gridEnabled}
                    onChange={(e) => onUpdatePage({ ...page, gridEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-sky-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Snap to Grid
                  </span>
                  <input
                    type="checkbox"
                    checked={page.snapToGrid}
                    onChange={(e) => onUpdatePage({ ...page, snapToGrid: e.target.checked })}
                    className="w-4 h-4 rounded text-sky-500"
                  />
                </label>
              </div>
            </div>

            {/* Academic Report Caption */}
            <div className="space-y-2 pt-2 border-t border-slate-700/50">
              <span className={`font-semibold text-xs block ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Academic Report Caption
              </span>
              <input
                type="text"
                value={page.figureNumber || ''}
                onChange={(e) => onUpdatePage({ ...page, figureNumber: e.target.value })}
                placeholder="e.g. Figure 4.2"
                className={`w-full text-xs px-3 py-1.5 rounded-lg border outline-none ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
              <textarea
                value={page.figureCaption || ''}
                onChange={(e) => onUpdatePage({ ...page, figureCaption: e.target.value })}
                placeholder="Caption description for university thesis or paper report..."
                rows={2}
                className={`w-full text-xs px-3 py-1.5 rounded-lg border outline-none ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
