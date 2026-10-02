import React, { useState, useRef } from 'react';
import { DiagramNode, HandlePosition } from '../../types/diagram';
import { RenderShapeSvg } from '../../shapes/renderers';
import { shouldRenderLabelUnderShape } from '../../lib/geometry';
import { Lock, Plus } from 'lucide-react';

interface NodeRendererProps {
  node: DiagramNode;
  isSelected: boolean;
  zoom: number;
  onSelect: (nodeId: string, e: React.MouseEvent) => void;
  onDragStart: (nodeId: string, e: React.MouseEvent) => void;
  onResizeStart: (nodeId: string, handle: string, e: React.MouseEvent) => void;
  onConnectStart: (nodeId: string, handle: HandlePosition, e: React.MouseEvent) => void;
  onConnectEnd: (nodeId: string, handle: HandlePosition) => void;
  onUpdateText: (nodeId: string, newLabel: string, newSubLabel?: string) => void;
  onUpdateLabelOffset?: (
    nodeId: string,
    offsetX: number,
    offsetY: number,
    commit?: boolean
  ) => void;
  onQuickSprout?: (nodeId: string, direction: 'right' | 'bottom') => void;
  isDarkMode?: boolean;
  isConnectToolActive?: boolean;
  snapHighlightHandle?: HandlePosition | null;
}

export const NodeRenderer: React.FC<NodeRendererProps> = ({
  node,
  isSelected,
  zoom,
  onSelect,
  onDragStart,
  onResizeStart,
  onConnectStart,
  onConnectEnd,
  onUpdateText,
  onUpdateLabelOffset,
  onQuickSprout,
  isDarkMode = false,
  isConnectToolActive = false,
  snapHighlightHandle = null,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDraggingLabel, setIsDraggingLabel] = useState(false);
  const [labelText, setLabelText] = useState(node.label);
  const [subLabelText, setSubLabelText] = useState(node.subLabel || '');
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // High quality dark mode adaptations
  const displayNode = isDarkMode
    ? {
        ...node,
        fill:
          node.fill === '#ffffff' || !node.fill || node.fill === '#fff'
            ? '#1e293b'
            : node.fill === '#f8fafc'
            ? '#1e293b'
            : node.fill === '#f0f9ff'
            ? '#082f49'
            : node.fill === '#f0fdf4'
            ? '#064e3b'
            : node.fill === '#fffbeb'
            ? '#451a03'
            : node.fill === '#fef2f2'
            ? '#450a0a'
            : node.fill === '#faf5ff'
            ? '#3b0764'
            : node.fill,
        stroke:
          node.stroke === '#334155' || !node.stroke
            ? '#64748b'
            : node.stroke === '#0f172a'
            ? '#94a3b8'
            : node.stroke,
        textColor:
          node.textColor === '#0f172a' || !node.textColor || node.textColor === '#334155'
            ? '#f8fafc'
            : node.textColor,
      }
    : node;

  const handleFinishEditing = () => {
    setIsEditing(false);
    onUpdateText(node.id, labelText, subLabelText);
  };

  // Draggable label repositioning
  const handleLabelMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || isEditing || node.locked) return;
    e.stopPropagation();
    onSelect(node.id, e);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialOffsetX = node.labelOffsetX || 0;
    const initialOffsetY = node.labelOffsetY || 0;
    let moved = false;

    const onMouseMove = (moveEvt: MouseEvent) => {
      const dx = (moveEvt.clientX - startX) / zoom;
      const dy = (moveEvt.clientY - startY) / zoom;
      if (Math.abs(dx) > 1.5 || Math.abs(dy) > 1.5) {
        moved = true;
        setIsDraggingLabel(true);
      }
      if (moved && onUpdateLabelOffset) {
        onUpdateLabelOffset(
          node.id,
          Math.round(initialOffsetX + dx),
          Math.round(initialOffsetY + dy),
          false
        );
      }
    };

    const onMouseUp = (upEvt: MouseEvent) => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      setIsDraggingLabel(false);

      if (moved && onUpdateLabelOffset) {
        const dx = (upEvt.clientX - startX) / zoom;
        const dy = (upEvt.clientY - startY) / zoom;
        onUpdateLabelOffset(
          node.id,
          Math.round(initialOffsetX + dx),
          Math.round(initialOffsetY + dy),
          true
        );
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handles: HandlePosition[] = ['top', 'right', 'bottom', 'left'];

  // Handle anchor coordinates with responsive hitboxes
  const getHandlePositionStyles = (pos: HandlePosition) => {
    switch (pos) {
      case 'top':
        return { top: -8, left: '50%', transform: 'translateX(-50%)' };
      case 'right':
        return { top: '50%', right: -8, transform: 'translateY(-50%)' };
      case 'bottom':
        return { bottom: -8, left: '50%', transform: 'translateX(-50%)' };
      case 'left':
        return { top: '50%', left: -8, transform: 'translateY(-50%)' };
    }
  };

  const showHandles = (isHovered || isSelected || isConnectToolActive) && !node.locked;

  return (
    <div
      ref={containerRef}
      id={`node-${node.id}`}
      style={{
        position: 'absolute',
        left: `${node.x}px`,
        top: `${node.y}px`,
        width: `${node.width}px`,
        height: `${node.height}px`,
        transform: node.rotation ? `rotate(${node.rotation}deg)` : undefined,
        zIndex: node.zIndex || 1,
        cursor: node.locked
          ? 'default'
          : isConnectToolActive
          ? 'crosshair'
          : isEditing
          ? 'text'
          : 'grab',
        touchAction: 'none',
      }}
      className={`group select-none active:cursor-grabbing transition-shadow ${
        node.hidden ? 'hidden' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        e.stopPropagation();

        if (isConnectToolActive) {
          // Connect tool starts connection immediately from nearest handle or right handle
          const rect = containerRef.current?.getBoundingClientRect();
          let bestHandle: HandlePosition = 'right';
          if (rect) {
            const relX = (e.clientX - rect.left) / rect.width;
            const relY = (e.clientY - rect.top) / rect.height;
            if (relX > 0.7) bestHandle = 'right';
            else if (relX < 0.3) bestHandle = 'left';
            else if (relY > 0.7) bestHandle = 'bottom';
            else if (relY < 0.3) bestHandle = 'top';
          }
          onConnectStart(node.id, bestHandle, e);
          return;
        }

        onSelect(node.id, e);
        if (!node.locked && !isEditing) {
          onDragStart(node.id, e);
        }
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (!node.locked) {
          setIsEditing(true);
        }
      }}
    >
      {/* Selection Bounding Box */}
      {isSelected && (
        <div
          className="absolute inset-0 border-2 border-sky-400 pointer-events-none rounded-sm shadow-[0_0_8px_rgba(56,189,248,0.35)]"
          style={{ margin: -3 }}
        />
      )}

      {/* Target Snapping Highlight (when candidate target for connection/reconnection) */}
      {snapHighlightHandle && (
        <div
          className="absolute inset-0 border-2 border-emerald-400 pointer-events-none rounded-md animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.5)]"
          style={{ margin: -4 }}
        />
      )}

      {/* SVG Shape Geometry */}
      <div className="absolute inset-0 pointer-events-none">
        <RenderShapeSvg node={displayNode} />
      </div>

      {/* Text Container: Freely Draggable Anywhere relative to shape */}
      {(() => {
        const isUnderShape = shouldRenderLabelUnderShape(node);
        const isAboveShape = node.labelPosition === 'top';

        // Calculate base position
        const baseLeft = node.width / 2;
        const baseTop = isUnderShape ? node.height + 6 : isAboveShape ? -22 : node.height / 2;

        const currentOffsetX = node.labelOffsetX || 0;
        const currentOffsetY = node.labelOffsetY || 0;

        return (
          <div
            style={{
              position: 'absolute',
              left: `${baseLeft + currentOffsetX}px`,
              top: `${baseTop + currentOffsetY}px`,
              transform: isUnderShape || isAboveShape ? 'translateX(-50%)' : 'translate(-50%, -50%)',
              color: displayNode.textColor || (isDarkMode ? '#f8fafc' : '#0f172a'),
              fontSize: `${node.fontSize || (node.label.length > 20 ? 11 : 12)}px`,
              fontWeight:
                node.fontWeight === 'bold' ? 700 : node.fontWeight === 'medium' ? 600 : 500,
              fontFamily:
                node.fontFamily === 'mono'
                  ? 'ui-monospace, monospace'
                  : node.fontFamily === 'serif'
                  ? 'Georgia, serif'
                  : 'inherit',
              textAlign: node.textAlign || 'center',
              cursor: isEditing ? 'text' : isDraggingLabel ? 'grabbing' : 'grab',
              touchAction: 'none',
              zIndex: 35,
            }}
            className={`pointer-events-auto select-none rounded p-1 transition-shadow duration-75 flex flex-col items-center justify-center max-w-[280px] w-max group/label ${
              isDraggingLabel
                ? 'ring-2 ring-sky-400 bg-sky-500/20 shadow-md'
                : 'hover:ring-1 hover:ring-sky-400/80 hover:bg-sky-500/10'
            }`}
            title="Drag to reposition label • Double-click to edit text"
            onMouseDown={handleLabelMouseDown}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (!node.locked) setIsEditing(true);
            }}
          >
            {isEditing ? (
              <div
                className={`pointer-events-auto flex flex-col gap-1 w-52 p-2 rounded-xl shadow-2xl border-2 border-sky-500 z-40 ${
                  isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'
                }`}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  autoFocus
                  value={labelText}
                  onChange={(e) => setLabelText(e.target.value)}
                  className={`text-xs font-semibold text-center border-b outline-none px-1 py-1 bg-transparent ${
                    isDarkMode ? 'border-slate-700 text-white' : 'border-slate-200 text-slate-900'
                  }`}
                  placeholder="Node label"
                />
                <input
                  type="text"
                  value={subLabelText}
                  onChange={(e) => setSubLabelText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFinishEditing();
                    if (e.key === 'Escape') setIsEditing(false);
                  }}
                  onBlur={handleFinishEditing}
                  className={`text-[11px] text-center outline-none px-1 py-0.5 bg-transparent ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                  placeholder="Details / Sub-label (optional)"
                />
              </div>
            ) : (
              <div className="px-1.5 py-0.5 text-center flex flex-col items-center pointer-events-none">
                <span
                  className={`leading-tight font-semibold block text-xs tracking-tight select-none ${
                    isDarkMode ? 'text-slate-100' : 'text-slate-900'
                  }`}
                >
                  {node.label}
                </span>
                {node.subLabel && (
                  <span
                    className={`text-[10.5px] leading-tight mt-0.5 truncate max-w-full block font-normal select-none ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    {node.subLabel}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Lock Status Badge */}
      {node.locked && (
        <div
          className={`absolute top-1 right-1 p-0.5 rounded pointer-events-none ${
            isDarkMode ? 'bg-slate-800/90 text-slate-400' : 'bg-slate-100/90 text-slate-500'
          }`}
        >
          <Lock className="w-3 h-3" />
        </div>
      )}

      {/* Connection Points (Handles) with Generous Hit Area */}
      {showHandles && (
        <>
          {handles.map((h) => {
            const isTargetHighlight = snapHighlightHandle === h;
            return (
              <div
                key={h}
                style={getHandlePositionStyles(h)}
                className="absolute w-5 h-5 flex items-center justify-center z-30 cursor-crosshair group/h"
                title={`Connect from ${h}`}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onConnectStart(node.id, h, e);
                }}
                onMouseUp={(e) => {
                  e.stopPropagation();
                  onConnectEnd(node.id, h);
                }}
              >
                {/* Visual Circle */}
                <div
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all flex items-center justify-center shadow-md ${
                    isTargetHighlight
                      ? 'bg-emerald-400 border-white scale-140 shadow-emerald-500/50'
                      : isDarkMode
                      ? 'bg-slate-900 border-sky-400 group-hover/h:scale-130 group-hover/h:bg-sky-400 group-hover/h:border-white shadow-sky-500/30'
                      : 'bg-white border-sky-600 group-hover/h:scale-130 group-hover/h:bg-sky-500 group-hover/h:border-sky-700'
                  }`}
                >
                  <span
                    className={`w-1 h-1 rounded-full ${
                      isTargetHighlight
                        ? 'bg-white'
                        : isDarkMode
                        ? 'bg-sky-400 group-hover/h:bg-white'
                        : 'bg-sky-600 group-hover/h:bg-white'
                    }`}
                  />
                </div>
              </div>
            );
          })}

          {/* Quick Flow Sprout Buttons: Instant Link to Next Step */}
          {isSelected && onQuickSprout && !isConnectToolActive && (
            <>
              {/* Right Sprout Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickSprout(node.id, 'right');
                }}
                className="absolute -right-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-115 z-30 group/btn"
                title="Add connected step to right"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </button>

              {/* Bottom Sprout Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickSprout(node.id, 'bottom');
                }}
                style={{
                  bottom: [
                    'soft-user',
                    'uml-actor',
                    'actor',
                    'user',
                    'net-router',
                    'net-firewall',
                  ].includes(node.type)
                    ? -46
                    : -32,
                }}
                className="absolute left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-115 z-30 group/btn"
                title="Add connected step below"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </>
          )}
        </>
      )}

      {/* Resize Handles (When Selected & Not Locked & Not in Connect Tool) */}
      {isSelected && !node.locked && !isConnectToolActive && (
        <>
          {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((handle) => {
            let cursor = 'default';
            let style: React.CSSProperties = {};

            switch (handle) {
              case 'nw':
                cursor = 'nwse-resize';
                style = { top: -4, left: -4 };
                break;
              case 'n':
                cursor = 'ns-resize';
                style = { top: -4, left: '50%', transform: 'translateX(-50%)' };
                break;
              case 'ne':
                cursor = 'nesw-resize';
                style = { top: -4, right: -4 };
                break;
              case 'e':
                cursor = 'ew-resize';
                style = { top: '50%', right: -4, transform: 'translateY(-50%)' };
                break;
              case 'se':
                cursor = 'nwse-resize';
                style = { bottom: -4, right: -4 };
                break;
              case 's':
                cursor = 'ns-resize';
                style = { bottom: -4, left: '50%', transform: 'translateX(-50%)' };
                break;
              case 'sw':
                cursor = 'nesw-resize';
                style = { bottom: -4, left: -4 };
                break;
              case 'w':
                cursor = 'ew-resize';
                style = { top: '50%', left: -4, transform: 'translateY(-50%)' };
                break;
            }

            return (
              <div
                key={handle}
                style={{ ...style, cursor }}
                className={`absolute w-2 h-2 rounded-2xs border z-30 ${
                  isDarkMode ? 'bg-slate-900 border-sky-400' : 'bg-white border-sky-600'
                }`}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onResizeStart(node.id, handle, e);
                }}
              />
            );
          })}
        </>
      )}
    </div>
  );
};
