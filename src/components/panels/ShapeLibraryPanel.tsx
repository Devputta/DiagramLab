import React, { useState } from 'react';
import { Search, ChevronDown, ChevronRight, Plus, Box, Layers, LayoutGrid, Sparkles } from 'lucide-react';
import { SHAPE_CATEGORIES, SHAPE_REGISTRY } from '../../shapes/registry';
import { ShapeCategory, ShapeType } from '../../types/diagram';
import { RenderShapeSvg } from '../../shapes/renderers';

interface ShapeLibraryPanelProps {
  onAddShape: (shapeType: ShapeType) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  onOpenTemplates?: () => void;
  onOpenAiAssistant?: () => void;
  isDarkMode?: boolean;
}

export const ShapeLibraryPanel: React.FC<ShapeLibraryPanelProps> = ({
  onAddShape,
  isOpen,
  onToggleOpen,
  onOpenTemplates,
  onOpenAiAssistant,
  isDarkMode = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ShapeCategory | 'all'>('all');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    software: true,
    flowchart: true,
    'technical-3d': true,
    database: true,
    uml: false,
    network: false,
    basic: false,
  });

  const allShapes = Object.values(SHAPE_REGISTRY);

  const filteredShapes = allShapes.filter((shape) => {
    const matchesCategory = selectedCategory === 'all' || shape.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      shape.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shape.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleCategoryExpand = (catId: string) => {
    setExpandedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  if (!isOpen) {
    return (
      <div
        className={`w-10 border-r flex flex-col items-center py-3 shrink-0 transition-colors ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <button
          onClick={onToggleOpen}
          className={`p-1.5 rounded-lg transition-colors ${
            isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-600'
          }`}
          title="Open Shape Library"
        >
          <Box className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <aside
      className={`w-68 border-r flex flex-col h-full shrink-0 z-20 transition-colors ${
        isDarkMode
          ? 'bg-slate-900 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Search Input Bar */}
      <div className={`p-3 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
        <div className="relative">
          <Search
            className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${
              isDarkMode ? 'text-slate-500' : 'text-slate-400'
            }`}
          />
          <input
            type="text"
            placeholder="Search architecture shapes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border outline-none transition-colors ${
              isDarkMode
                ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500 focus:border-sky-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-sky-500'
            }`}
          />
        </div>
      </div>

      {/* Category Pills Filter Bar */}
      <div
        className={`px-3 py-2 border-b flex gap-1 overflow-x-auto text-[11px] no-scrollbar shrink-0 ${
          isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'
        }`}
      >
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
            selectedCategory === 'all'
              ? isDarkMode
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                : 'bg-sky-100 text-sky-800 font-semibold'
              : isDarkMode
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          All
        </button>
        {SHAPE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? isDarkMode
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                  : 'bg-sky-100 text-sky-800 font-semibold'
                : isDarkMode
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Shape Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {selectedCategory === 'all' && !searchQuery ? (
          // Grouped by Category Accordion
          SHAPE_CATEGORIES.map((cat) => {
            const catShapes = allShapes.filter((s) => s.category === cat.id);
            if (catShapes.length === 0) return null;
            const isExpanded = expandedCategories[cat.id] ?? false;

            return (
              <div key={cat.id} className="space-y-1.5">
                <button
                  onClick={() => toggleCategoryExpand(cat.id)}
                  className={`w-full flex items-center justify-between text-xs font-bold py-1 px-1.5 rounded-md transition-colors ${
                    isDarkMode
                      ? 'text-slate-300 hover:bg-slate-800/80'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>{cat.name}</span>
                    <span className="text-[10px] font-normal text-slate-400">
                      ({catShapes.length})
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {catShapes.map((shape) => (
                      <button
                        key={shape.id}
                        onClick={() => onAddShape(shape.id)}
                        className={`group relative flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all ${
                          isDarkMode
                            ? 'border-slate-800 bg-slate-800/50 hover:bg-slate-800 hover:border-sky-500 shadow-xs'
                            : 'border-slate-200/90 bg-white hover:border-sky-500 hover:shadow-xs'
                        }`}
                        title={`${shape.name} — ${shape.description}`}
                      >
                        {/* Mini SVG Preview */}
                        <div className="w-12 h-10 flex items-center justify-center mb-1.5 pointer-events-none group-hover:scale-105 transition-transform">
                          <RenderShapeSvg
                            node={{
                              id: 'preview',
                              type: shape.id,
                              category: shape.category,
                              label: '',
                              x: 0,
                              y: 0,
                              width: 44,
                              height: 34,
                              fill: isDarkMode ? '#1e293b' : shape.defaultFill,
                              stroke: isDarkMode ? '#64748b' : shape.defaultStroke,
                              strokeWidth: 1.5,
                              strokeStyle: 'solid',
                              zIndex: 1,
                              is3D: shape.is3DSupported && shape.id.startsWith('3d-'),
                              depth3D: 6,
                            }}
                          />
                        </div>
                        <span
                          className={`text-[11px] font-medium leading-tight truncate max-w-full ${
                            isDarkMode ? 'text-slate-300 group-hover:text-sky-300' : 'text-slate-700 group-hover:text-sky-900'
                          }`}
                        >
                          {shape.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          // Flattened Filter Results
          <div className="grid grid-cols-2 gap-2">
            {filteredShapes.length === 0 ? (
              <div className="col-span-2 py-8 text-center text-slate-400 text-xs">
                No shapes matching "{searchQuery}"
              </div>
            ) : (
              filteredShapes.map((shape) => (
                <button
                  key={shape.id}
                  onClick={() => onAddShape(shape.id)}
                  className={`group relative flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all ${
                    isDarkMode
                      ? 'border-slate-800 bg-slate-800/50 hover:bg-slate-800 hover:border-sky-500 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-sky-500 hover:shadow-xs'
                  }`}
                  title={`${shape.name} — ${shape.description}`}
                >
                  <div className="w-12 h-10 flex items-center justify-center mb-1.5 pointer-events-none group-hover:scale-105 transition-transform">
                    <RenderShapeSvg
                      node={{
                        id: 'preview',
                        type: shape.id,
                        category: shape.category,
                        label: '',
                        x: 0,
                        y: 0,
                        width: 44,
                        height: 34,
                        fill: isDarkMode ? '#1e293b' : shape.defaultFill,
                        stroke: isDarkMode ? '#64748b' : shape.defaultStroke,
                        strokeWidth: 1.5,
                        strokeStyle: 'solid',
                        zIndex: 1,
                        is3D: shape.is3DSupported && shape.id.startsWith('3d-'),
                        depth3D: 6,
                      }}
                    />
                  </div>
                  <span
                    className={`text-[11px] font-medium leading-tight truncate max-w-full ${
                      isDarkMode ? 'text-slate-300 group-hover:text-sky-300' : 'text-slate-700 group-hover:text-sky-900'
                    }`}
                  >
                    {shape.name}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer Tools & Collapse Button */}
      <div className={`p-2 border-t flex items-center justify-between gap-1.5 ${isDarkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50/60'}`}>
        <div className="flex items-center gap-1">
          {onOpenTemplates && (
            <button
              onClick={onOpenTemplates}
              className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded transition-colors font-medium ${
                isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              title="Browse Architecture Templates"
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Templates</span>
            </button>
          )}
          {onOpenAiAssistant && (
            <button
              onClick={onOpenAiAssistant}
              className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded transition-colors font-medium ${
                isDarkMode ? 'text-sky-400 hover:text-sky-300 hover:bg-sky-950/50' : 'text-sky-700 hover:text-sky-900 hover:bg-sky-100'
              }`}
              title="Generate diagram with AI"
            >
              <Sparkles className="w-3 h-3" />
              <span>AI</span>
            </button>
          )}
        </div>
        <button
          onClick={onToggleOpen}
          className={`text-[11px] px-2 py-1 rounded transition-colors ${
            isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
          }`}
        >
          Collapse
        </button>
      </div>
    </aside>
  );
};
