import React, { useState } from 'react';
import { TEMPLATE_CATALOG, TemplateDefinition } from '../../templates/catalog';
import {
  X,
  Search,
  Check,
  Plus,
} from 'lucide-react';
import { DiagramLabLogo } from '../common/DiagramLabLogo';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (template: TemplateDefinition, mode: 'new-page' | 'replace') => void;
  isDarkMode?: boolean;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onApplyTemplate,
  isDarkMode = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const categories = [
    { id: 'all', name: 'All Templates' },
    { id: 'software', name: 'Software Architecture' },
    { id: 'flowchart', name: 'Flowcharts' },
    { id: 'database', name: 'Database & ER' },
  ];

  const filteredTemplates = TEMPLATE_CATALOG.filter((t) => {
    const matchesCat = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className={`rounded-2xl border shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[85vh] ${
          isDarkMode
            ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-slate-950/90'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
            isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <DiagramLabLogo size="sm" isDarkMode={isDarkMode} />
            <div className={`h-4 w-px ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
            <div>
              <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Architecture & Flow Templates
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Choose an architectural pattern or flowchart baseline to insert or replace
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Toolbar */}
        <div
          className={`px-6 py-3 border-b flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
            isDarkMode ? 'border-slate-800 bg-slate-850' : 'border-slate-100 bg-slate-50'
          }`}
        >
          {/* Segmented Category Buttons */}
          <div
            className={`flex items-center gap-1 p-1 rounded-lg border w-full sm:w-auto ${
              isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  selectedCategory === c.id
                    ? isDarkMode
                      ? 'bg-sky-600 text-white shadow-xs font-bold'
                      : 'bg-slate-900 text-white shadow-xs'
                    : isDarkMode
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-750'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border outline-none ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-sky-500'
                  : 'bg-white border-slate-200 rounded-lg outline-none focus:border-sky-500'
              }`}
            />
          </div>
        </div>

        {/* Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map((template) => {
              const nodeCount = template.page.nodes.length;
              const edgeCount = template.page.edges.length;

              return (
                <div
                  key={template.id}
                  className={`group rounded-xl border transition-all p-5 flex flex-col justify-between ${
                    isDarkMode
                      ? 'bg-slate-850/80 border-slate-800 hover:border-sky-500 hover:shadow-lg'
                      : 'bg-white border-slate-200 hover:border-sky-500 hover:shadow-md'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sky-400 capitalize">
                          {template.category}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{template.preset} {template.orientation}</span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">
                        {nodeCount} shapes · {edgeCount} links
                      </span>
                    </div>

                    <h4
                      className={`font-bold text-base transition-colors ${
                        isDarkMode ? 'text-white group-hover:text-sky-400' : 'text-slate-900 group-hover:text-sky-700'
                      }`}
                    >
                      {template.name}
                    </h4>

                    <p className={`text-xs leading-relaxed line-clamp-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      {template.description}
                    </p>

                    {template.page.figureCaption && (
                      <p className="font-serif italic text-[11px] text-slate-400 border-l-2 border-slate-700 pl-2">
                        {template.page.figureNumber || 'Figure'}: {template.page.figureCaption}
                      </p>
                    )}
                  </div>

                  <div
                    className={`pt-4 border-t mt-4 flex items-center justify-between gap-2 ${
                      isDarkMode ? 'border-slate-800' : 'border-slate-100'
                    }`}
                  >
                    <button
                      onClick={() => onApplyTemplate(template, 'new-page')}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors flex items-center gap-1.5 ${
                        isDarkMode
                          ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-750'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add as New Page</span>
                    </button>
                    <button
                      onClick={() => onApplyTemplate(template, 'replace')}
                      className="text-xs px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply to Canvas</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
