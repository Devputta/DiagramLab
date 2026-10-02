import React, { useState } from 'react';
import { DiagramPage, DiagramProject, CanvasTool, PagePreset, PageOrientation } from '../../types/diagram';
import {
  Plus,
  Copy,
  Trash2,
  Edit2,
  Check,
  MousePointer2,
  Hand,
  Cable,
  Magnet,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Sun,
  Moon,
} from 'lucide-react';

interface PageTabsProps {
  project: DiagramProject;
  activePageId: string;
  onSelectPage: (pageId: string) => void;
  onAddPage: () => void;
  onDuplicatePage: (pageId: string) => void;
  onDeletePage: (pageId: string) => void;
  onRenamePage: (pageId: string, newName: string) => void;
  nodeCount: number;
  edgeCount: number;
  zoomPercent: number;
  activePage: DiagramPage;
  tool: CanvasTool;
  onToolChange: (tool: CanvasTool) => void;
  onToggleSnap: () => void;
  onTogglePreset: (preset: PagePreset, orientation: PageOrientation) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const PageTabs: React.FC<PageTabsProps> = ({
  project,
  activePageId,
  onSelectPage,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
  onRenamePage,
  nodeCount,
  edgeCount,
  zoomPercent,
  activePage,
  tool,
  onToolChange,
  onToggleSnap,
  onTogglePreset,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  isDarkMode = false,
  onToggleDarkMode,
}) => {
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const startRename = (page: DiagramPage) => {
    setEditingPageId(page.id);
    setEditName(page.name);
  };

  const handleFinishRename = (pageId: string) => {
    if (editName.trim()) {
      onRenamePage(pageId, editName.trim());
    }
    setEditingPageId(null);
  };

  return (
    <footer
      className={`h-11 border-t px-3 flex items-center justify-between gap-2 z-30 shrink-0 transition-colors ${
        isDarkMode
          ? 'bg-slate-900 border-slate-800 text-slate-300'
          : 'bg-white border-slate-200 text-slate-700'
      }`}
    >
      {/* Left: Diagram Page Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 mr-2">
        {project.pages.map((p) => {
          const isActive = p.id === activePageId;
          const isEditing = p.id === editingPageId;

          return (
            <div
              key={p.id}
              onClick={() => onSelectPage(p.id)}
              className={`group flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold cursor-pointer border transition-all shrink-0 ${
                isActive
                  ? isDarkMode
                    ? 'border-sky-500 bg-slate-800 text-sky-400 shadow-2xs'
                    : 'border-sky-500 bg-sky-50/70 text-sky-900 shadow-2xs'
                  : isDarkMode
                  ? 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFinishRename(p.id);
                      if (e.key === 'Escape') setEditingPageId(null);
                    }}
                    onBlur={() => handleFinishRename(p.id)}
                    className="w-24 text-xs font-semibold bg-transparent border-b border-sky-500 outline-none text-white"
                  />
                  <button
                    onClick={() => handleFinishRename(p.id)}
                    className="text-emerald-500 hover:text-emerald-400"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <span
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    startRename(p);
                  }}
                  className="truncate max-w-[110px]"
                >
                  {p.name}
                </span>
              )}

              {/* Tab Actions */}
              {isActive && !isEditing && (
                <div className="flex items-center gap-0.5 ml-1 opacity-70 group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startRename(p);
                    }}
                    className={`p-0.5 rounded transition-colors ${
                      isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title="Rename Page"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicatePage(p.id);
                    }}
                    className={`p-0.5 rounded transition-colors ${
                      isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title="Duplicate Page"
                  >
                    <Copy className="w-2.5 h-2.5" />
                  </button>
                  {project.pages.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePage(p.id);
                      }}
                      className="p-0.5 text-slate-400 hover:text-rose-400 rounded"
                      title="Delete Page"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <button
          onClick={onAddPage}
          className={`flex items-center gap-1 px-2 py-1 rounded transition-colors text-xs shrink-0 ${
            isDarkMode
              ? 'text-slate-400 hover:text-white hover:bg-slate-800'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Add New Diagram Page"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Page</span>
        </button>
      </div>

      {/* Center: Explicit Mode Control Bar at Bottom */}
      <div
        className={`flex items-center gap-1 p-0.5 rounded-lg border ${
          isDarkMode
            ? 'bg-slate-800/80 border-slate-700/80 text-slate-300'
            : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}
      >
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1.5 select-none">
          Mode:
        </span>
        <button
          onClick={() => onToolChange('select')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
            tool === 'select'
              ? isDarkMode
                ? 'bg-slate-700 text-sky-400 shadow-xs'
                : 'bg-white text-sky-800 shadow-2xs border border-slate-200/80'
              : isDarkMode
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
          title="Select & Move Mode (V) - Click and drag shapes"
        >
          <MousePointer2 className="w-3.5 h-3.5 text-sky-500" />
          <span>Select</span>
        </button>

        <button
          onClick={() => onToolChange('connect')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
            tool === 'connect'
              ? isDarkMode
                ? 'bg-sky-600 text-white shadow-xs font-bold'
                : 'bg-sky-500 text-white shadow-xs font-bold'
              : isDarkMode
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
          title="Connect Mode (C) - Drag between shapes to connect"
        >
          <Cable className="w-3.5 h-3.5 text-inherit" />
          <span>Connect</span>
        </button>

        <button
          onClick={() => onToolChange('pan')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
            tool === 'pan'
              ? isDarkMode
                ? 'bg-slate-700 text-sky-400 shadow-xs'
                : 'bg-white text-sky-800 shadow-2xs border border-slate-200/80'
              : isDarkMode
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
          title="Pan Mode (H) - Drag to scroll canvas"
        >
          <Hand className="w-3.5 h-3.5" />
          <span>Pan</span>
        </button>
      </div>

      {/* Right: Snapping, Preset & Zoom Controls */}
      <div className="flex items-center gap-2 text-xs shrink-0">
        {/* Snap to Grid Toggle */}
        <button
          onClick={onToggleSnap}
          className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] transition-colors ${
            activePage.snapToGrid
              ? isDarkMode
                ? 'border-sky-500 bg-sky-950/60 text-sky-300 font-medium'
                : 'border-sky-500 bg-sky-50 text-sky-800 font-medium'
              : isDarkMode
              ? 'border-slate-800 text-slate-500 hover:bg-slate-800'
              : 'border-slate-200 text-slate-500 hover:bg-slate-50'
          }`}
          title="Toggle Grid Snapping"
        >
          <Magnet className="w-3 h-3 text-sky-400" />
          <span>Snap: {activePage.snapToGrid ? 'ON' : 'OFF'}</span>
        </button>

        {/* Quick Page Preset Selector */}
        <select
          value={`${activePage.preset}-${activePage.orientation}`}
          onChange={(e) => {
            const [preset, orientation] = e.target.value.split('-') as [
              PagePreset,
              PageOrientation,
            ];
            onTogglePreset(preset, orientation);
          }}
          className={`text-[11px] font-mono px-2 py-1 rounded-md border outline-none ${
            isDarkMode
              ? 'bg-slate-800 border-slate-700 text-slate-200'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <option value="A4-landscape">A4 Landscape</option>
          <option value="A4-portrait">A4 Portrait</option>
          <option value="Letter-landscape">Letter Landscape</option>
          <option value="A3-landscape">A3 Landscape</option>
          <option value="Infinite-landscape">Infinite Canvas</option>
        </select>

        {/* Dark Mode Toggle at Footer */}
        {onToggleDarkMode && (
          <button
            onClick={onToggleDarkMode}
            className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] font-semibold transition-all ${
              isDarkMode
                ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-750 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:text-slate-900 shadow-2xs'
            }`}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>
        )}

        {/* Zoom Controls */}
        <div
          className={`flex items-center border rounded-md p-0.5 ${
            isDarkMode
              ? 'border-slate-700 bg-slate-800 text-slate-300'
              : 'border-slate-200 bg-slate-50 text-slate-700'
          }`}
        >
          <button
            onClick={onZoomOut}
            className={`p-1 rounded transition-colors ${
              isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-white'
            }`}
            title="Zoom Out"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="font-mono text-[11px] px-1 min-w-[34px] text-center">
            {zoomPercent}%
          </span>
          <button
            onClick={onZoomIn}
            className={`p-1 rounded transition-colors ${
              isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-white'
            }`}
            title="Zoom In"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
          <button
            onClick={onZoomFit}
            className={`p-1 rounded border-l ml-0.5 transition-colors ${
              isDarkMode ? 'border-slate-700 hover:bg-slate-700' : 'border-slate-200 hover:bg-white'
            }`}
            title="Fit to Screen"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </footer>
  );
};
