import React, { useState, useRef, useEffect } from 'react';
import { DiagramLabLogo } from '../common/DiagramLabLogo';
import {
  Undo2,
  Redo2,
  Copy,
  Download,
  Check,
  ChevronDown,
  FileCode2,
  Image as ImageIcon,
  Printer,
  SlidersHorizontal,
  Github,
  LayoutGrid,
  Wand2,
} from 'lucide-react';

interface TopNavbarProps {
  projectName: string;
  onRenameProject: (name: string) => void;
  currentView: 'editor' | 'dashboard' | 'landing';
  onChangeView: (view: 'editor' | 'dashboard' | 'landing') => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenExport: () => void;
  onCopyDiagram: (format?: 'png' | 'svg') => void;
  onQuickExport?: (format: 'png' | 'svg' | 'pdf') => void;
  onOpenTemplates?: () => void;
  onOpenAiAssistant?: () => void;
  isDarkMode?: boolean;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  projectName,
  onRenameProject,
  currentView,
  onChangeView,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenExport,
  onCopyDiagram,
  onQuickExport,
  onOpenTemplates,
  onOpenAiAssistant,
  isDarkMode = false,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(projectName);
  const [copiedRecently, setCopiedRecently] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState<'png' | 'svg'>('png');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isCopyMenuOpen, setIsCopyMenuOpen] = useState(false);

  const exportMenuRef = useRef<HTMLDivElement>(null);
  const copyMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
      if (copyMenuRef.current && !copyMenuRef.current.contains(e.target as Node)) {
        setIsCopyMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleNameSubmit = () => {
    setIsEditingName(false);
    if (nameInput.trim()) {
      onRenameProject(nameInput.trim());
    }
  };

  const handleTriggerCopy = (fmt: 'png' | 'svg' = 'png') => {
    setIsCopyMenuOpen(false);
    setCopiedFormat(fmt);
    onCopyDiagram(fmt);
    setCopiedRecently(true);
    setTimeout(() => setCopiedRecently(false), 2200);
  };

  const handleTriggerExport = (fmt: 'png' | 'svg' | 'pdf') => {
    setIsExportMenuOpen(false);
    if (onQuickExport) {
      onQuickExport(fmt);
    } else {
      onOpenExport();
    }
  };

  return (
    <header
      className={`h-13 border-b px-4 flex items-center justify-between gap-3 z-40 shrink-0 transition-colors ${
        isDarkMode
          ? 'bg-slate-900 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Left: Brand Wordmark, View Switcher & Project Name */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChangeView('landing')}
          className="group hover:opacity-90 transition-opacity"
          title="DiagramLab Home"
        >
          <DiagramLabLogo size="sm" isDarkMode={isDarkMode} />
        </button>

        <div className={`h-5 w-px mx-1 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />

        {/* View Switcher Tabs */}
        <div
          className={`flex items-center gap-1 p-0.5 rounded-lg text-xs font-semibold ${
            isDarkMode ? 'bg-slate-800/90 text-slate-400' : 'bg-slate-100 text-slate-600'
          }`}
        >
          <button
            onClick={() => onChangeView('editor')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              currentView === 'editor'
                ? isDarkMode
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-white text-slate-900 shadow-xs'
                : isDarkMode
                ? 'hover:text-slate-200'
                : 'hover:text-slate-900'
            }`}
          >
            Editor
          </button>
          <button
            onClick={() => onChangeView('dashboard')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              currentView === 'dashboard'
                ? isDarkMode
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-white text-slate-900 shadow-xs'
                : isDarkMode
                ? 'hover:text-slate-200'
                : 'hover:text-slate-900'
            }`}
          >
            Projects
          </button>
        </div>

        {/* Editable Project Name */}
        {currentView === 'editor' && (
          <div className="ml-2 flex items-center gap-1">
            {isEditingName ? (
              <input
                type="text"
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={handleNameSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameSubmit();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
                className={`text-xs font-semibold px-2 py-1 border border-sky-500 rounded-md outline-none w-48 ${
                  isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'
                }`}
              />
            ) : (
              <button
                onClick={() => {
                  setNameInput(projectName);
                  setIsEditingName(true);
                }}
                className={`text-xs font-semibold px-2 py-1 rounded-md transition-colors truncate max-w-[220px] ${
                  isDarkMode
                    ? 'text-slate-200 hover:text-sky-400 hover:bg-slate-800'
                    : 'text-slate-800 hover:text-sky-700 hover:bg-slate-50'
                }`}
                title="Click to rename diagram"
              >
                {projectName}
              </button>
            )}
            <span className="flex items-center gap-1 text-[11px] text-slate-400 font-normal ml-1">
              <Check className="w-3 h-3 text-emerald-500" />
              Saved
            </span>
          </div>
        )}
      </div>

      {/* Center: Clean Undo / Redo controls */}
      {currentView === 'editor' && (
        <div className="flex items-center gap-1">
          <div
            className={`flex items-center border rounded-lg p-0.5 ${
              isDarkMode
                ? 'bg-slate-800/80 border-slate-700 text-slate-200'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-1.5 rounded-md transition-colors ${
                canUndo
                  ? isDarkMode
                    ? 'text-slate-200 hover:bg-slate-700 hover:text-white'
                    : 'text-slate-700 hover:bg-white hover:shadow-xs'
                  : isDarkMode
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-300 cursor-not-allowed'
              }`}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-1.5 rounded-md transition-colors ${
                canRedo
                  ? isDarkMode
                    ? 'text-slate-200 hover:bg-slate-700 hover:text-white'
                    : 'text-slate-700 hover:bg-white hover:shadow-xs'
                  : isDarkMode
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-300 cursor-not-allowed'
              }`}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2">
        {/* GitHub Repository Link */}
        <a
          href="https://github.com/Devputta/DiagramLab.git"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors shadow-2xs group ${
            isDarkMode
              ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-750 hover:text-white'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
          }`}
          title="DiagramLab Repository on GitHub"
        >
          <Github className={`w-3.5 h-3.5 group-hover:scale-110 transition-transform ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`} />
          <span className="hidden md:inline">GitHub</span>
        </a>

        {/* Templates Button */}
        {onOpenTemplates && (
          <button
            onClick={onOpenTemplates}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              isDarkMode
                ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-750 hover:text-white'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
            }`}
            title="Browse Technical Architecture Templates"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
            <span>Templates</span>
          </button>
        )}

        {/* Diagram Generator (Clean engineering workflow, not looking like a cheesy AI bot) */}
        {onOpenAiAssistant && (
          <button
            onClick={onOpenAiAssistant}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
              isDarkMode
                ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-750 hover:text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
            }`}
            title="Auto-generate architecture diagrams from system description"
          >
            <Wand2 className="w-3.5 h-3.5 text-sky-500" />
            <span className="hidden sm:inline">Diagram Generator</span>
            <span className="sm:hidden">Generator</span>
          </button>
        )}

        {/* 1. Copy Button with Split Dropdown (Diagram Only, Without Background) */}
        <div className="relative inline-flex items-center" ref={copyMenuRef}>
          <button
            onClick={() => handleTriggerCopy('png')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-l-lg border-y border-l text-xs font-semibold transition-all shadow-2xs ${
              copiedRecently
                ? 'bg-emerald-600 text-white border-emerald-600'
                : isDarkMode
                ? 'border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-750 hover:text-white'
                : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
            }`}
            title="Copy diagram only (transparent, without background) to clipboard"
          >
            {copiedRecently ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Copied {copiedFormat.toUpperCase()}!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-sky-400" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsCopyMenuOpen((prev) => !prev)}
            className={`px-1.5 py-1.5 rounded-r-lg border text-xs transition-colors shadow-2xs ${
              copiedRecently
                ? 'bg-emerald-600 text-white border-emerald-600'
                : isDarkMode
                ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
            title="Copy format options (without background)"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {/* Copy Dropdown Menu */}
          {isCopyMenuOpen && (
            <div
              className={`absolute top-full right-0 mt-1.5 w-60 rounded-xl border shadow-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-75 ${
                isDarkMode ? 'bg-slate-850 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Copy without background
              </div>
              <button
                onClick={() => handleTriggerCopy('png')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-lg text-left transition-colors ${
                  isDarkMode ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-50 text-slate-800'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <div className="font-semibold">Copy PNG Image</div>
                  <div className="text-[10px] text-slate-400">Transparent raster, paste directly into Docs/Slack/Notion</div>
                </div>
              </button>
              <button
                onClick={() => handleTriggerCopy('svg')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-lg text-left transition-colors ${
                  isDarkMode ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-50 text-slate-800'
                }`}
              >
                <FileCode2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-semibold">Copy SVG Vector Code</div>
                  <div className="text-[10px] text-slate-400">Infinite scalable vector markup</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* 2. Export As Button with Dropdown (Diagram Only, Without Background) */}
        <div className="relative inline-flex items-center" ref={exportMenuRef}>
          <button
            onClick={() => setIsExportMenuOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs bg-sky-600 hover:bg-sky-500 text-white"
            title="Export diagram without background"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export As</span>
            <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-80" />
          </button>

          {/* Export Dropdown Menu */}
          {isExportMenuOpen && (
            <div
              className={`absolute top-full right-0 mt-1.5 w-64 rounded-xl border shadow-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-75 ${
                isDarkMode ? 'bg-slate-850 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Export (No Background)
              </div>

              <button
                onClick={() => handleTriggerExport('png')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-lg text-left transition-colors ${
                  isDarkMode ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="w-6 h-6 rounded-md bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold">PNG Image (.png)</div>
                  <div className="text-[10px] text-slate-400">Crisp transparent, diagram only</div>
                </div>
              </button>

              <button
                onClick={() => handleTriggerExport('svg')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-lg text-left transition-colors ${
                  isDarkMode ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <FileCode2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold">SVG Vector (.svg)</div>
                  <div className="text-[10px] text-slate-400">Sharp vector graphics, no background</div>
                </div>
              </button>

              <button
                onClick={() => handleTriggerExport('pdf')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-lg text-left transition-colors ${
                  isDarkMode ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                  <Printer className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold">PDF Academic Report (.pdf)</div>
                  <div className="text-[10px] text-slate-400">Printable figure with academic caption</div>
                </div>
              </button>

              <div className={`h-px my-1 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`} />

              <button
                onClick={() => {
                  setIsExportMenuOpen(false);
                  onOpenExport();
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg text-left font-medium transition-colors ${
                  isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <span>More Export Settings & Formats...</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
