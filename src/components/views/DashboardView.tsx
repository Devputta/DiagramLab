import React, { useState, useRef } from 'react';
import { DiagramProject } from '../../types/diagram';
import {
  Plus,
  Search,
  Upload,
  Copy,
  Trash2,
  FolderOpen,
  Calendar,
  LayoutGrid,
  Download,
  Edit2,
  Check,
} from 'lucide-react';
import { exportProjectToJsonFile, parseProjectJsonFile } from '../../lib/storage';

interface DashboardViewProps {
  projects: DiagramProject[];
  onOpenProject: (projectId: string) => void;
  onCreateProject: () => void;
  onDuplicateProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onRenameProject: (projectId: string, newName: string) => void;
  onImportProject: (project: DiagramProject) => void;
  onOpenTemplates: () => void;
  isDarkMode?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  onOpenProject,
  onCreateProject,
  onDuplicateProject,
  onDeleteProject,
  onRenameProject,
  onImportProject,
  onOpenTemplates,
  isDarkMode = false,
}) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name'>('recent');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredProjects = projects
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const handleStartRename = (project: DiagramProject) => {
    setEditingId(project.id);
    setEditingName(project.name);
  };

  const handleFinishRename = (projectId: string) => {
    if (editingName.trim()) {
      onRenameProject(projectId, editingName.trim());
    }
    setEditingId(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const project = parseProjectJsonFile(content);
        onImportProject(project);
      } catch (err: any) {
        console.error(err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      className={`flex-1 overflow-y-auto p-6 flex flex-col transition-colors ${
        isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
      }`}
    >
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Top Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Projects & Diagrams
            </h1>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Saved technical architecture diagrams, flowcharts, and schema models
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".diagramlab,.json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 shadow-2xs ${
                isDarkMode
                  ? 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200'
                  : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
              }`}
              title="Import .diagramlab JSON project file"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>Import File</span>
            </button>

            <button
              onClick={onOpenTemplates}
              className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 shadow-2xs ${
                isDarkMode
                  ? 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200'
                  : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
              <span>Templates</span>
            </button>

            <button
              onClick={onCreateProject}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Diagram</span>
            </button>
          </div>
        </div>

        {/* Search & Sort Bar */}
        <div
          className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border ${
            isDarkMode
              ? 'bg-slate-900 border-slate-800 text-slate-200'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search diagrams by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full text-xs pl-9 pr-3 py-1.5 rounded-lg border outline-none ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-sky-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-sky-500'
              }`}
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`px-2.5 py-1.5 rounded-lg text-xs border outline-none ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="recent">Recently Modified</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Project Grid / Cards */}
        {filteredProjects.length === 0 ? (
          <div
            className={`p-12 text-center rounded-2xl border space-y-3 ${
              isDarkMode
                ? 'bg-slate-900 border-slate-800 text-slate-300'
                : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-400'
              }`}
            >
              <FolderOpen className="w-6 h-6" />
            </div>
            <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              No diagrams found
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Start with a blank diagram, choose an architecture template, or import a JSON file.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                onClick={onCreateProject}
                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
              >
                Create Blank Diagram
              </button>
              <button
                onClick={onOpenTemplates}
                className={`px-4 py-2 rounded-lg border text-xs font-semibold ${
                  isDarkMode
                    ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Browse Templates
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredProjects.map((project) => {
              const pageCount = project.pages.length;
              const totalNodes = project.pages.reduce((acc, p) => acc + p.nodes.length, 0);
              const totalEdges = project.pages.reduce((acc, p) => acc + p.edges.length, 0);
              const formattedDate = new Date(project.updatedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              const isEditing = editingId === project.id;

              return (
                <div
                  key={project.id}
                  className={`group rounded-xl border transition-all flex flex-col justify-between p-4 ${
                    isDarkMode
                      ? 'bg-slate-900 border-slate-800 hover:border-sky-500 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-sky-500 hover:shadow-xs'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header line with date */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-sky-400" />
                        {formattedDate}
                      </span>
                      <span
                        className={`font-mono px-1.5 py-0.5 rounded text-[10px] ${
                          isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {pageCount} {pageCount === 1 ? 'page' : 'pages'}
                      </span>
                    </div>

                    {/* Project Title */}
                    <div>
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            autoFocus
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={() => handleFinishRename(project.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleFinishRename(project.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            className={`w-full text-sm font-bold px-2 py-1 border border-sky-500 rounded outline-none ${
                              isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'
                            }`}
                          />
                          <button
                            onClick={() => handleFinishRename(project.id)}
                            className="text-emerald-500 p-1"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <h3
                          onClick={() => onOpenProject(project.id)}
                          className={`font-bold text-sm cursor-pointer truncate ${
                            isDarkMode
                              ? 'text-white hover:text-sky-400'
                              : 'text-slate-900 hover:text-sky-700'
                          }`}
                          title={project.name}
                        >
                          {project.name}
                        </h3>
                      )}
                      <p className={`text-[11px] mt-1 line-clamp-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {totalNodes} components · {totalEdges} connections
                      </p>
                    </div>

                    {/* Preview page thumbnail tags */}
                    <div className="flex items-center gap-1 flex-wrap pt-1">
                      {project.pages.slice(0, 2).map((p) => (
                        <span
                          key={p.id}
                          className={`text-[10px] px-2 py-0.5 rounded truncate max-w-[120px] ${
                            isDarkMode
                              ? 'bg-slate-800 border border-slate-700 text-slate-300'
                              : 'bg-slate-50 border border-slate-100 text-slate-600'
                          }`}
                        >
                          {p.name}
                        </span>
                      ))}
                      {project.pages.length > 2 && (
                        <span className="text-[10px] text-slate-400">
                          +{project.pages.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div
                    className={`pt-4 border-t mt-4 flex items-center justify-between ${
                      isDarkMode ? 'border-slate-800' : 'border-slate-100'
                    }`}
                  >
                    <button
                      onClick={() => onOpenProject(project.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                        isDarkMode
                          ? 'bg-slate-800 hover:bg-sky-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800'
                      }`}
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Open Canvas</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartRename(project)}
                        className={`p-1.5 rounded transition-colors ${
                          isDarkMode
                            ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                        title="Rename Diagram"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDuplicateProject(project.id)}
                        className={`p-1.5 rounded transition-colors ${
                          isDarkMode
                            ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                        title="Duplicate Diagram"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => exportProjectToJsonFile(project)}
                        className={`p-1.5 rounded transition-colors ${
                          isDarkMode
                            ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                        title="Download .diagramlab File"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      {projects.length > 1 && (
                        <button
                          onClick={() => onDeleteProject(project.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-950"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
