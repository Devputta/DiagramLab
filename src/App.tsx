import React, { useState, useEffect } from 'react';
import { DiagramProject } from './types/diagram';
import {
  loadProjects,
  saveProject,
  getProject,
  getActiveProjectId,
  createNewProject,
  duplicateProject,
  deleteProject,
} from './lib/storage';
import { TEMPLATE_CATALOG } from './templates/catalog';
import { LandingView } from './components/views/LandingView';
import { DashboardView } from './components/views/DashboardView';
import { EditorView } from './components/views/EditorView';
import { TemplatesModal } from './components/dialogs/TemplatesModal';
import { DiagramLabLogo } from './components/common/DiagramLabLogo';
import { Sun, Moon } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'editor' | 'dashboard' | 'landing'>('editor');
  const [projects, setProjects] = useState<DiagramProject[]>([]);
  const [currentProject, setCurrentProject] = useState<DiagramProject | null>(null);
  const [globalTemplatesOpen, setGlobalTemplatesOpen] = useState(false);

  // Global Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('diagramlab_theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('diagramlab_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  // Initialize projects on load
  useEffect(() => {
    const loaded = loadProjects();
    setProjects(loaded);

    const activeId = getActiveProjectId();
    const active = loaded.find((p) => p.id === activeId) || loaded[0] || createNewProject();
    setCurrentProject(active);
  }, []);

  const handleCreateNewProject = () => {
    const newProj = createNewProject('New Technical Diagram');
    saveProject(newProj);
    const updated = loadProjects();
    setProjects(updated);
    setCurrentProject(newProj);
    setView('editor');
  };

  const handleOpenProject = (id: string) => {
    const target = getProject(id);
    if (target) {
      setCurrentProject(target);
      setView('editor');
    }
  };

  const handleDuplicateProject = (id: string) => {
    const copy = duplicateProject(id);
    if (copy) {
      const updated = loadProjects();
      setProjects(updated);
    }
  };

  const handleDeleteProject = (id: string) => {
    deleteProject(id);
    const updated = loadProjects();
    setProjects(updated);
    if (currentProject?.id === id) {
      setCurrentProject(updated[0] || null);
    }
  };

  const handleRenameProject = (id: string, newName: string) => {
    const target = getProject(id);
    if (target) {
      const updatedProj = { ...target, name: newName, updatedAt: new Date().toISOString() };
      saveProject(updatedProj);
      const updatedList = loadProjects();
      setProjects(updatedList);
      if (currentProject?.id === id) {
        setCurrentProject(updatedProj);
      }
    }
  };

  const handleImportProject = (imported: DiagramProject) => {
    saveProject(imported);
    const updated = loadProjects();
    setProjects(updated);
    setCurrentProject(imported);
    setView('editor');
  };

  const handleSelectTemplateFromLanding = (templateId: string) => {
    const tpl = TEMPLATE_CATALOG.find((t) => t.id === templateId) || TEMPLATE_CATALOG[0];
    const newProj = createNewProject(
      tpl.name,
      JSON.parse(JSON.stringify(tpl.page))
    );
    saveProject(newProj);
    const updated = loadProjects();
    setProjects(updated);
    setCurrentProject(newProj);
    setView('editor');
  };

  if (!currentProject) {
    return (
      <div
        className={`w-screen h-screen flex items-center justify-center text-xs font-mono transition-colors ${
          isDarkMode ? 'bg-slate-950 text-slate-400' : 'bg-slate-50 text-slate-600'
        }`}
      >
        Initializing DiagramLab engine...
      </div>
    );
  }

  return (
    <div
      className={`w-screen h-screen overflow-hidden flex flex-col font-sans transition-colors ${
        isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'
      }`}
    >
      {view === 'landing' ? (
        <LandingView
          onOpenEditor={() => setView('editor')}
          onOpenDashboard={() => setView('dashboard')}
          onSelectTemplate={handleSelectTemplateFromLanding}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
        />
      ) : view === 'dashboard' ? (
        <div className="flex flex-col h-full">
          {/* Dashboard Mini Top Bar */}
          <header
            className={`h-13 border-b px-4 flex items-center justify-between shrink-0 transition-colors ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView('landing')}
                className="hover:opacity-90 transition-opacity"
                title="Return to Home"
              >
                <DiagramLabLogo size="sm" isDarkMode={isDarkMode} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleDarkMode}
                className={`p-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-750'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
                }`}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setView('editor')}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                  isDarkMode
                    ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-750'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Return to Canvas
              </button>
              <button
                onClick={handleCreateNewProject}
                className="text-xs px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold transition-colors shadow-xs"
              >
                + New Diagram
              </button>
            </div>
          </header>

          <DashboardView
            projects={projects}
            onOpenProject={handleOpenProject}
            onCreateProject={handleCreateNewProject}
            onDuplicateProject={handleDuplicateProject}
            onDeleteProject={handleDeleteProject}
            onRenameProject={handleRenameProject}
            onImportProject={handleImportProject}
            onOpenTemplates={() => setGlobalTemplatesOpen(true)}
            isDarkMode={isDarkMode}
          />
        </div>
      ) : (
        <EditorView
          project={currentProject}
          onUpdateProject={(updated) => {
            setCurrentProject(updated);
            setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          }}
          onNavigateView={setView}
        />
      )}

      {/* Global Templates Modal when called from Dashboard */}
      <TemplatesModal
        isOpen={globalTemplatesOpen}
        onClose={() => setGlobalTemplatesOpen(false)}
        onApplyTemplate={(template) => {
          handleSelectTemplateFromLanding(template.id);
          setGlobalTemplatesOpen(false);
        }}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
