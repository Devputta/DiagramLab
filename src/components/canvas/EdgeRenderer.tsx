import React, { useState } from 'react';
import {
  DiagramEdge,
  DiagramNode,
  ConnectorType,
  ArrowType,
  StrokeStyle,
} from '../../types/diagram';
import { computeEdgePath } from '../../lib/geometry';
import {
  ArrowRight,
  ArrowLeftRight,
  Minus,
  CornerDownRight,
  Spline,
  Slash,
  Trash2,
  RefreshCw,
  Edit2,
  Check,
  Waypoints,
} from 'lucide-react';

interface EdgeRendererProps {
  edge: DiagramEdge;
  sourceNode: DiagramNode;
  targetNode: DiagramNode;
  isSelected: boolean;
  onSelect: (edgeId: string, e: React.MouseEvent) => void;
  onUpdateEdge: (edgeId: string, updates: Partial<DiagramEdge>) => void;
  onDeleteEdge: (edgeId: string) => void;
  onReverseEdge?: (edgeId: string) => void;
  onStartTerminalDrag?: (edgeId: string, terminal: 'source' | 'target', e: React.MouseEvent) => void;
  isDarkMode?: boolean;
}

export const EdgeRenderer: React.FC<EdgeRendererProps> = ({
  edge,
  sourceNode,
  targetNode,
  isSelected,
  onSelect,
  onUpdateEdge,
  onDeleteEdge,
  onReverseEdge,
  onStartTerminalDrag,
  isDarkMode = false,
}) => {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelText, setLabelText] = useState(edge.label || '');

  const { pathString, labelPoint, startPoint, endPoint } = computeEdgePath(
    edge,
    sourceNode,
    targetNode
  );

  const strokeDash =
    edge.strokeStyle === 'dashed' ? '6 4' : edge.strokeStyle === 'dotted' ? '2 3' : undefined;

  const markerEnd = edge.arrowType !== 'none' ? 'url(#arrowhead)' : undefined;
  const markerStart = edge.arrowType === 'double-arrow' ? 'url(#arrowhead-start)' : undefined;

  const handleLabelSubmit = () => {
    setIsEditingLabel(false);
    onUpdateEdge(edge.id, { label: labelText });
  };

  const QUICK_COLORS = ['#0284c7', '#38bdf8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

  // Base stroke color with high contrast for dark mode
  const resolvedStrokeColor = isSelected
    ? '#38bdf8'
    : edge.stroke && edge.stroke !== '#334155'
    ? edge.stroke
    : isDarkMode
    ? '#94a3b8'
    : '#334155';

  return (
    <g
      className="group cursor-pointer select-none"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(edge.id, e);
      }}
    >
      {/* Invisible wider hit area for easy clicking */}
      <path
        d={pathString}
        fill="none"
        stroke="transparent"
        strokeWidth={22}
        className="cursor-pointer"
        onDoubleClick={(e) => {
          e.stopPropagation();
          setLabelText(edge.label || '');
          setIsEditingLabel(true);
        }}
      />

      {/* Halo highlight when selected */}
      {isSelected && (
        <path
          d={pathString}
          fill="none"
          stroke="#38bdf8"
          strokeWidth={(edge.strokeWidth || 1.5) + 6}
          strokeOpacity={0.35}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Main connector stroke */}
      <path
        d={pathString}
        fill="none"
        stroke={resolvedStrokeColor}
        strokeWidth={
          isSelected ? Math.max(edge.strokeWidth || 1.5, 2.5) : edge.strokeWidth || 1.5
        }
        strokeDasharray={strokeDash}
        strokeLinecap="round"
        strokeLinejoin="round"
        markerEnd={markerEnd}
        markerStart={markerStart}
        className="transition-colors"
      />

      {/* Interactive Draggable Terminal Handles when Selected (Allows reconnecting!) */}
      {isSelected && (
        <g className="pointer-events-auto">
          {/* Source Terminal Handle (Start of edge) */}
          <g
            transform={`translate(${startPoint.x}, ${startPoint.y})`}
            className="cursor-crosshair group/source"
            onMouseDown={(e) => {
              e.stopPropagation();
              onStartTerminalDrag?.(edge.id, 'source', e);
            }}
          >
            {/* Outer pulsating ring */}
            <circle
              r={9}
              fill="#0ea5e9"
              fillOpacity={0.2}
              className="animate-ping group-hover/source:opacity-100"
            />
            <circle
              r={7}
              fill={isDarkMode ? '#0f172a' : '#ffffff'}
              stroke="#0284c7"
              strokeWidth={2.5}
              className="transition-transform group-hover/source:scale-125 shadow-md"
            />
            <circle r={3} fill="#38bdf8" />
            <title>Drag to reconnect start of connection</title>
          </g>

          {/* Target Terminal Handle (Arrowhead end of edge) */}
          <g
            transform={`translate(${endPoint.x}, ${endPoint.y})`}
            className="cursor-crosshair group/target"
            onMouseDown={(e) => {
              e.stopPropagation();
              onStartTerminalDrag?.(edge.id, 'target', e);
            }}
          >
            {/* Outer pulsating ring */}
            <circle
              r={10}
              fill="#38bdf8"
              fillOpacity={0.25}
              className="animate-ping group-hover/target:opacity-100"
            />
            <circle
              r={8}
              fill={isDarkMode ? '#0f172a' : '#ffffff'}
              stroke="#38bdf8"
              strokeWidth={2.5}
              className="transition-transform group-hover/target:scale-125 shadow-md"
            />
            <circle r={3.5} fill="#0284c7" />
            <title>Drag to reconnect arrow to another node</title>
          </g>
        </g>
      )}

      {/* Edge Label Badge or Inline Input */}
      {edge.label || isEditingLabel ? (
        <g
          transform={`translate(${labelPoint.x}, ${labelPoint.y})`}
          className="cursor-pointer"
          onDoubleClick={(e) => {
            e.stopPropagation();
            setLabelText(edge.label || '');
            setIsEditingLabel(true);
          }}
        >
          {isEditingLabel ? (
            <foreignObject x={-85} y={-18} width={170} height={36}>
              <div
                className={`flex items-center gap-1 p-1 rounded-lg border-2 border-sky-500 shadow-xl ${
                  isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'
                }`}
              >
                <input
                  type="text"
                  autoFocus
                  value={labelText}
                  onChange={(e) => setLabelText(e.target.value)}
                  onBlur={handleLabelSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLabelSubmit();
                    if (e.key === 'Escape') setIsEditingLabel(false);
                  }}
                  className="w-full text-center text-xs font-semibold px-1 py-0.5 outline-none bg-transparent"
                  placeholder="Link label..."
                />
                <button
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleLabelSubmit();
                  }}
                  className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            </foreignObject>
          ) : edge.label ? (
            <>
              {/* Clean readable pill backdrop */}
              <rect
                x={-(edge.label.length * 3.8 + 14)}
                y={-11}
                width={edge.label.length * 7.6 + 28}
                height={22}
                rx={11}
                fill={isDarkMode ? '#0f172a' : '#ffffff'}
                stroke={isSelected ? '#38bdf8' : isDarkMode ? '#334155' : '#cbd5e1'}
                strokeWidth={isSelected ? 1.5 : 1}
                className="shadow-xs transition-colors"
              />
              <text
                x={0}
                y={4}
                textAnchor="middle"
                className={`text-[11px] font-semibold pointer-events-none select-none ${
                  isDarkMode ? 'fill-slate-100' : 'fill-slate-800'
                }`}
              >
                {edge.label}
              </text>
            </>
          ) : null}
        </g>
      ) : null}

      {/* Floating In-Canvas Quick Editor Toolbar (Visible when selected) */}
      {isSelected && !isEditingLabel && (
        <foreignObject
          x={labelPoint.x - 165}
          y={labelPoint.y - 52}
          width={330}
          height={44}
          className="overflow-visible pointer-events-auto"
        >
          <div
            className={`flex items-center gap-1.5 p-1.5 rounded-xl shadow-2xl border text-xs select-none backdrop-blur-md ${
              isDarkMode
                ? 'bg-slate-900/95 text-white border-slate-700/80 shadow-slate-950/80'
                : 'bg-slate-900 text-white border-slate-700 shadow-xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Quick Edit Label Button */}
            <button
              onClick={() => {
                setLabelText(edge.label || '');
                setIsEditingLabel(true);
              }}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1 transition-colors"
              title="Edit Label Text"
            >
              <Edit2 className="w-3 h-3 text-sky-400" />
              <span>{edge.label ? 'Edit' : '+ Label'}</span>
            </button>

            <div className="w-px h-4 bg-slate-700 mx-0.5" />

            {/* Route Type */}
            <button
              onClick={() =>
                onUpdateEdge(edge.id, {
                  lineType:
                    edge.lineType === 'orthogonal'
                      ? 'curved'
                      : edge.lineType === 'curved'
                      ? 'straight'
                      : 'orthogonal',
                })
              }
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title={`Routing: ${edge.lineType} (Click to switch)`}
            >
              {edge.lineType === 'orthogonal' ? (
                <CornerDownRight className="w-3.5 h-3.5 text-sky-400" />
              ) : edge.lineType === 'curved' ? (
                <Spline className="w-3.5 h-3.5 text-sky-400" />
              ) : (
                <Slash className="w-3.5 h-3.5 text-sky-400" />
              )}
            </button>

            {/* Arrow Type */}
            <button
              onClick={() =>
                onUpdateEdge(edge.id, {
                  arrowType:
                    edge.arrowType === 'arrow'
                      ? 'double-arrow'
                      : edge.arrowType === 'double-arrow'
                      ? 'none'
                      : 'arrow',
                })
              }
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title={`Arrow: ${edge.arrowType} (Click to switch)`}
            >
              {edge.arrowType === 'arrow' ? (
                <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
              ) : edge.arrowType === 'double-arrow' ? (
                <ArrowLeftRight className="w-3.5 h-3.5 text-sky-400" />
              ) : (
                <Minus className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {/* Stroke Style */}
            <button
              onClick={() =>
                onUpdateEdge(edge.id, {
                  strokeStyle:
                    edge.strokeStyle === 'solid'
                      ? 'dashed'
                      : edge.strokeStyle === 'dashed'
                      ? 'dotted'
                      : 'solid',
                })
              }
              className="px-1.5 py-1 rounded-lg hover:bg-slate-800 text-slate-300 text-[10px] font-mono transition-colors"
              title={`Style: ${edge.strokeStyle || 'solid'} (Click to cycle)`}
            >
              {edge.strokeStyle === 'dashed'
                ? '---'
                : edge.strokeStyle === 'dotted'
                ? '···'
                : '——'}
            </button>

            <div className="w-px h-4 bg-slate-700 mx-0.5" />

            {/* Color Palette Dots */}
            <div className="flex items-center gap-1">
              {QUICK_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => onUpdateEdge(edge.id, { stroke: color })}
                  style={{ backgroundColor: color }}
                  className={`w-3.5 h-3.5 rounded-full border transition-all ${
                    edge.stroke === color
                      ? 'border-white scale-125'
                      : 'border-slate-600 hover:scale-110'
                  }`}
                  title={color}
                />
              ))}
            </div>

            <div className="w-px h-4 bg-slate-700 mx-0.5" />

            {/* Reverse Direction (Swap Start & End) */}
            {onReverseEdge && (
              <button
                onClick={() => onReverseEdge(edge.id)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                title="Swap Direction (⇄ Start & End)"
              >
                <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
              </button>
            )}

            {/* Delete Edge */}
            <button
              onClick={() => onDeleteEdge(edge.id)}
              className="p-1.5 rounded-lg hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
              title="Delete Link (Del)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </foreignObject>
      )}
    </g>
  );
};
