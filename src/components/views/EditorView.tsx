import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  DiagramProject,
  DiagramPage,
  DiagramNode,
  DiagramEdge,
  CanvasTool,
  ViewportTransform,
  ShapeType,
  HandlePosition,
} from '../../types/diagram';
import { TopNavbar } from '../navbar/TopNavbar';
import { ShapeLibraryPanel } from '../panels/ShapeLibraryPanel';
import { DiagramCanvas } from '../canvas/DiagramCanvas';
import { PropertiesPanel } from '../panels/PropertiesPanel';
import { PageTabs } from '../panels/PageTabs';
import { ExportModal } from '../dialogs/ExportModal';
import { TemplatesModal } from '../dialogs/TemplatesModal';
import { AiAssistantModal } from '../dialogs/AiAssistantModal';
import { SHAPE_REGISTRY } from '../../shapes/registry';
import { UndoRedoStackManager } from '../../lib/history';
import { saveProject, getDefaultNewPage } from '../../lib/storage';
import { TemplateDefinition } from '../../templates/catalog';
import { computeBoundingBox } from '../../lib/geometry';
import {
  copyPngToClipboard,
  copySvgToClipboard,
  downloadPng,
  downloadSvg,
  printAcademicPdf,
} from '../../lib/export';

interface EditorViewProps {
  project: DiagramProject;
  onUpdateProject: (project: DiagramProject) => void;
  onNavigateView: (view: 'editor' | 'dashboard' | 'landing') => void;
}

export const EditorView: React.FC<EditorViewProps> = ({
  project,
  onUpdateProject,
  onNavigateView,
}) => {
  // Active Page resolution
  const activePage =
    project.pages.find((p) => p.id === project.activePageId) || project.pages[0];

  // Undo/Redo Stack Manager for tracking changes & reverting mistakes
  const stackManagerRef = useRef<UndoRedoStackManager | null>(null);
  if (!stackManagerRef.current) {
    stackManagerRef.current = new UndoRedoStackManager(activePage);
  }

  // Version counter to trigger re-renders when history state updates
  const [, setHistoryVersion] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showHistoryToast = (msg: string) => {
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 1600);
  };

  useEffect(() => {
    const unsub = stackManagerRef.current?.subscribe(() => {
      setHistoryVersion((v) => v + 1);
    });
    return unsub;
  }, []);

  // Canvas Viewport transform
  const [transform, setTransform] = useState<ViewportTransform>({
    x: 80,
    y: 60,
    zoom: 0.95,
  });

  // Current canvas tool
  const [tool, setTool] = useState<CanvasTool>('select');

  // Selection states
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Clipboard for copy/paste
  const clipboardRef = useRef<DiagramNode[]>([]);

  // Panel Toggles
  const [shapePanelOpen, setShapePanelOpen] = useState(true);
  const [propsPanelOpen, setPropsPanelOpen] = useState(true);

  // Dialog Modals
  const [exportOpen, setExportOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);

  // Light / Dark Theme State (persisted in localStorage)
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

  // Sync history when active page changes
  useEffect(() => {
    stackManagerRef.current?.reset(activePage);
    setSelectedNodeIds([]);
    setSelectedEdgeId(null);
  }, [project.activePageId]);

  // Master function to commit a page state change to history & project
  const commitPageChange = useCallback(
    (newPage: DiagramPage, recordHistory = true, actionName = 'Edit Diagram') => {
      if (recordHistory) {
        stackManagerRef.current?.push(newPage, actionName);
      }

      const updatedPages = project.pages.map((p) => (p.id === newPage.id ? newPage : p));
      const updatedProject: DiagramProject = {
        ...project,
        pages: updatedPages,
        updatedAt: new Date().toISOString(),
      };

      onUpdateProject(updatedProject);
      saveProject(updatedProject);
    },
    [project, onUpdateProject]
  );

  const canUndo = stackManagerRef.current?.canUndo() ?? false;
  const canRedo = stackManagerRef.current?.canRedo() ?? false;

  // Undo / Redo Handlers
  const handleUndo = useCallback(() => {
    const actionName = stackManagerRef.current?.getUndoActionName() || 'Revert';
    const previousPage = stackManagerRef.current?.undo();
    if (!previousPage) return;

    commitPageChange(previousPage, false);
    showHistoryToast(`Undone: ${actionName}`);
  }, [commitPageChange]);

  const handleRedo = useCallback(() => {
    const actionName = stackManagerRef.current?.getRedoActionName() || 'Action';
    const nextPage = stackManagerRef.current?.redo();
    if (!nextPage) return;

    commitPageChange(nextPage, false);
    showHistoryToast(`Redone: ${actionName}`);
  }, [commitPageChange]);

  // Start continuous batch (e.g. before dragging nodes or resizing)
  const handleStartBatch = useCallback(() => {
    stackManagerRef.current?.startBatch();
  }, []);

  // End continuous batch (e.g. on mouse up)
  const handleEndBatch = useCallback(
    (actionName = 'Modify Shapes') => {
      const changed = stackManagerRef.current?.endBatch(activePage, actionName);
      if (changed) {
        saveProject(project);
        setHistoryVersion((v) => v + 1);
      }
    },
    [activePage, project]
  );

  // Global Keyboard Shortcuts for Undo (Ctrl+Z / Cmd+Z) and Redo (Ctrl+Y / Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if (isInput) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const mod = isMac ? e.metaKey : e.ctrlKey;

      if (mod && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (
        (mod && e.shiftKey && e.key.toLowerCase() === 'z') ||
        (mod && e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Add Shape from Library
  const handleAddShape = (shapeType: ShapeType) => {
    const def = SHAPE_REGISTRY[shapeType];
    if (!def) return;

    // Position near viewport center or staggered
    const centerX = Math.max(60, Math.round(-transform.x / transform.zoom + 300));
    const centerY = Math.max(60, Math.round(-transform.y / transform.zoom + 200));

    const newNode: DiagramNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      type: shapeType,
      category: def.category,
      label: def.name,
      subLabel: '',
      x: centerX,
      y: centerY,
      width: def.defaultWidth,
      height: def.defaultHeight,
      fill: def.defaultFill,
      stroke: def.defaultStroke,
      strokeWidth: 2,
      strokeStyle: 'solid',
      zIndex: activePage.nodes.length + 1,
      is3D: def.is3DSupported && shapeType.startsWith('3d-'),
      depth3D: 12,
    };

    const newPage: DiagramPage = {
      ...activePage,
      nodes: [...activePage.nodes, newNode],
    };

    commitPageChange(newPage, true, `Add ${def.name}`);
    setSelectedNodeIds([newNode.id]);
    setSelectedEdgeId(null);
  };

  // Create Edge between two node handles
  const handleCreateEdge = (
    sourceId: string,
    targetId: string,
    sourceHandle: HandlePosition,
    targetHandle: HandlePosition
  ) => {
    // Avoid duplicate parallel edge
    const exists = activePage.edges.some(
      (e) => e.source === sourceId && e.target === targetId
    );
    if (exists) return;

    const newEdge: DiagramEdge = {
      id: `edge-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      source: sourceId,
      target: targetId,
      sourceHandle,
      targetHandle,
      label: '',
      lineType: 'orthogonal',
      arrowType: 'arrow',
      stroke: '#334155',
      strokeWidth: 1.5,
      strokeStyle: 'solid',
    };

    const newPage: DiagramPage = {
      ...activePage,
      edges: [...activePage.edges, newEdge],
    };

    commitPageChange(newPage, true, 'Add Connection');
    setSelectedEdgeId(newEdge.id);
    setSelectedNodeIds([]);
  };

  // Duplicate Selected Nodes
  const handleDuplicateNodes = (nodeIds: string[]) => {
    if (nodeIds.length === 0) return;

    const duplicates: DiagramNode[] = [];
    const idMap = new Map<string, string>();

    nodeIds.forEach((id) => {
      const original = activePage.nodes.find((n) => n.id === id);
      if (!original) return;

      const newId = `node-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
      idMap.set(id, newId);

      duplicates.push({
        ...JSON.parse(JSON.stringify(original)),
        id: newId,
        x: original.x + 30,
        y: original.y + 30,
        zIndex: activePage.nodes.length + duplicates.length + 1,
      });
    });

    const newPage: DiagramPage = {
      ...activePage,
      nodes: [...activePage.nodes, ...duplicates],
    };

    commitPageChange(newPage, true, 'Duplicate Shapes');
    setSelectedNodeIds(duplicates.map((d) => d.id));
    setSelectedEdgeId(null);
  };

  // Delete Selected items
  const handleDeleteSelected = useCallback(() => {
    if (selectedNodeIds.length > 0) {
      const remainingNodes = activePage.nodes.filter(
        (n) => !selectedNodeIds.includes(n.id)
      );
      // Remove any edges connected to deleted nodes
      const remainingEdges = activePage.edges.filter(
        (e) =>
          !selectedNodeIds.includes(e.source) && !selectedNodeIds.includes(e.target)
      );

      const newPage: DiagramPage = {
        ...activePage,
        nodes: remainingNodes,
        edges: remainingEdges,
      };

      commitPageChange(newPage, true, 'Delete Shapes');
      setSelectedNodeIds([]);
    } else if (selectedEdgeId) {
      const remainingEdges = activePage.edges.filter((e) => e.id !== selectedEdgeId);
      const newPage: DiagramPage = {
        ...activePage,
        edges: remainingEdges,
      };

      commitPageChange(newPage, true, 'Delete Connection');
      setSelectedEdgeId(null);
    }
  }, [selectedNodeIds, selectedEdgeId, activePage, commitPageChange]);

  // Fit to screen zoom
  const handleZoomFit = () => {
    if (activePage.nodes.length === 0) {
      setTransform({ x: 80, y: 60, zoom: 0.95 });
      return;
    }

    const bbox = computeBoundingBox(activePage.nodes);
    const padding = 100;
    const availableW = window.innerWidth - 320 - 280;
    const availableH = window.innerHeight - 60 - 40;

    const scaleX = (availableW - padding * 2) / bbox.width;
    const scaleY = (availableH - padding * 2) / bbox.height;
    const fitZoom = Math.min(1.4, Math.max(0.35, Math.min(scaleX, scaleY)));

    const newX = (availableW - bbox.width * fitZoom) / 2 - bbox.minX * fitZoom + 260;
    const newY = (availableH - bbox.height * fitZoom) / 2 - bbox.minY * fitZoom + 60;

    setTransform({ x: newX, y: newY, zoom: fitZoom });
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(
          (e.target as HTMLElement)?.tagName || ''
        )
      ) {
        return;
      }

      // Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteSelected();
        return;
      }

      // Undo (Ctrl+Z or Cmd+Z)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Redo (Ctrl+Y or Cmd+Shift+Z)
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Duplicate (Ctrl+D or Cmd+D)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicateNodes(selectedNodeIds);
        return;
      }

      // Select All (Ctrl+A or Cmd+A)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setSelectedNodeIds(activePage.nodes.map((n) => n.id));
        return;
      }

      // Copy (Ctrl+C / Cmd+C)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        const toCopy = activePage.nodes.filter((n) => selectedNodeIds.includes(n.id));
        clipboardRef.current = toCopy;
        return;
      }

      // Paste (Ctrl+V / Cmd+V)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        if (clipboardRef.current.length > 0) {
          const pastedNodes = clipboardRef.current.map((n) => ({
            ...JSON.parse(JSON.stringify(n)),
            id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            x: n.x + 30,
            y: n.y + 30,
          }));
          const newPage = {
            ...activePage,
            nodes: [...activePage.nodes, ...pastedNodes],
          };
          commitPageChange(newPage);
          setSelectedNodeIds(pastedNodes.map((n) => n.id));
        }
        return;
      }

      // Escape (Clear selection)
      if (e.key === 'Escape') {
        setSelectedNodeIds([]);
        setSelectedEdgeId(null);
        return;
      }

      // Tool shortcuts
      if (e.key.toLowerCase() === 'v') setTool('select');
      if (e.key.toLowerCase() === 'c') setTool('connect');
      if (e.key.toLowerCase() === 'h') setTool('pan');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedNodeIds,
    selectedEdgeId,
    activePage,
    handleDeleteSelected,
    handleUndo,
    handleRedo,
    commitPageChange,
  ]);

  // Page Management Handlers
  const handleAddPage = () => {
    const newPage = getDefaultNewPage();
    newPage.name = `Page ${project.pages.length + 1}`;
    newPage.figureNumber = `Figure ${project.pages.length + 1}.1`;

    const updatedProject: DiagramProject = {
      ...project,
      pages: [...project.pages, newPage],
      activePageId: newPage.id,
      updatedAt: new Date().toISOString(),
    };

    onUpdateProject(updatedProject);
    saveProject(updatedProject);
  };

  const handleDuplicatePage = (pageId: string) => {
    const sourcePage = project.pages.find((p) => p.id === pageId);
    if (!sourcePage) return;

    const copyPage: DiagramPage = {
      ...JSON.parse(JSON.stringify(sourcePage)),
      id: `page-${Date.now()}`,
      name: `${sourcePage.name} (Copy)`,
    };

    const updatedProject: DiagramProject = {
      ...project,
      pages: [...project.pages, copyPage],
      activePageId: copyPage.id,
      updatedAt: new Date().toISOString(),
    };

    onUpdateProject(updatedProject);
    saveProject(updatedProject);
  };

  const handleDeletePage = (pageId: string) => {
    if (project.pages.length <= 1) return;
    const remainingPages = project.pages.filter((p) => p.id !== pageId);
    const newActiveId =
      project.activePageId === pageId ? remainingPages[0].id : project.activePageId;

    const updatedProject: DiagramProject = {
      ...project,
      pages: remainingPages,
      activePageId: newActiveId,
      updatedAt: new Date().toISOString(),
    };

    onUpdateProject(updatedProject);
    saveProject(updatedProject);
  };

  const handleRenamePage = (pageId: string, newName: string) => {
    const updatedPages = project.pages.map((p) =>
      p.id === pageId ? { ...p, name: newName } : p
    );
    const updatedProject = {
      ...project,
      pages: updatedPages,
      updatedAt: new Date().toISOString(),
    };
    onUpdateProject(updatedProject);
    saveProject(updatedProject);
  };

  // Apply Template
  const handleApplyTemplate = (template: TemplateDefinition, mode: 'new-page' | 'replace') => {
    if (mode === 'new-page') {
      const newPage: DiagramPage = {
        ...JSON.parse(JSON.stringify(template.page)),
        id: `page-${Date.now()}`,
        name: template.name,
      };

      const updatedProject: DiagramProject = {
        ...project,
        pages: [...project.pages, newPage],
        activePageId: newPage.id,
        updatedAt: new Date().toISOString(),
      };

      onUpdateProject(updatedProject);
      saveProject(updatedProject);
    } else {
      // Replace current page contents
      const replacedPage: DiagramPage = {
        ...JSON.parse(JSON.stringify(template.page)),
        id: activePage.id,
        name: activePage.name,
      };
      commitPageChange(replacedPage);
    }
  };

  // Apply Synthesized Diagram from AI Assistant
  const handleApplySynthesizedDiagram = (
    title: string,
    nodes: DiagramNode[],
    edges: DiagramEdge[],
    mode: 'insert' | 'new-page'
  ) => {
    if (mode === 'new-page') {
      const newPage: DiagramPage = {
        ...getDefaultNewPage(),
        id: `page-${Date.now()}`,
        name: title || 'Synthesized Diagram',
        figureCaption: title,
        nodes,
        edges,
      };

      const updatedProject: DiagramProject = {
        ...project,
        pages: [...project.pages, newPage],
        activePageId: newPage.id,
        updatedAt: new Date().toISOString(),
      };

      onUpdateProject(updatedProject);
      saveProject(updatedProject);
    } else {
      // Insert into current canvas
      const newPage: DiagramPage = {
        ...activePage,
        nodes: [...activePage.nodes, ...nodes],
        edges: [...activePage.edges, ...edges],
      };
      commitPageChange(newPage);
      setSelectedNodeIds(nodes.map((n) => n.id));
    }
  };

  const handleCopyDiagram = async (fmt: 'png' | 'svg' = 'png') => {
    try {
      if (fmt === 'svg') {
        const ok = await copySvgToClipboard(activePage, {
          background: 'transparent',
          cropToDiagram: true,
        });
        if (ok) {
          showHistoryToast('Copied SVG code (transparent, without background)!');
        } else {
          showHistoryToast('Failed to copy SVG to clipboard.');
        }
      } else {
        const ok = await copyPngToClipboard(activePage, {
          background: 'transparent',
          cropToDiagram: true,
          scale: 2,
        });
        if (ok) {
          showHistoryToast('Copied PNG diagram (transparent, without background)!');
        } else {
          showHistoryToast('Failed to copy PNG to clipboard.');
        }
      }
    } catch (err) {
      console.error(err);
      showHistoryToast('Clipboard copy failed.');
    }
  };

  const handleQuickExport = async (fmt: 'png' | 'svg' | 'pdf') => {
    try {
      const filename = `${project.name}-${activePage.name}-diagram`;
      if (fmt === 'png') {
        await downloadPng(activePage, {
          background: 'transparent',
          cropToDiagram: true,
          scale: 2,
          filename,
        });
        showHistoryToast('Exported diagram as transparent PNG (no background)!');
      } else if (fmt === 'svg') {
        downloadSvg(activePage, {
          background: 'transparent',
          cropToDiagram: true,
          filename,
        });
        showHistoryToast('Exported diagram as vector SVG (no background)!');
      } else if (fmt === 'pdf') {
        printAcademicPdf(activePage);
      }
    } catch (err) {
      console.error('Quick export failed:', err);
      showHistoryToast('Export failed. Try opening Export dialog.');
    }
  };

  return (
    <div
      className={`flex flex-col h-screen w-screen overflow-hidden select-none transition-colors ${
        isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'
      }`}
    >
      {/* Top Navbar */}
      <TopNavbar
        projectName={project.name}
        onRenameProject={(name) => {
          const updated = { ...project, name, updatedAt: new Date().toISOString() };
          onUpdateProject(updated);
          saveProject(updated);
        }}
        currentView="editor"
        onChangeView={onNavigateView}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenTemplates={() => setTemplatesOpen(true)}
        onOpenAiAssistant={() => setAiAssistantOpen(true)}
        onOpenExport={() => setExportOpen(true)}
        onCopyDiagram={handleCopyDiagram}
        onQuickExport={handleQuickExport}
        isDarkMode={isDarkMode}
      />

      {/* Undo/Redo Action Notification Toast */}
      {toastMessage && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3.5 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-semibold shadow-lg backdrop-blur-xs flex items-center gap-1.5 border border-slate-700/60">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Workbench Layout: Left Shape Panel | Canvas | Right Inspector */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Shape Drawer */}
        <ShapeLibraryPanel
          isOpen={shapePanelOpen}
          onToggleOpen={() => setShapePanelOpen((prev) => !prev)}
          onAddShape={handleAddShape}
          onOpenTemplates={() => setTemplatesOpen(true)}
          onOpenAiAssistant={() => setAiAssistantOpen(true)}
          isDarkMode={isDarkMode}
        />

        {/* Center Canvas */}
        <main
          className={`flex-1 h-full relative overflow-hidden transition-colors ${
            isDarkMode ? 'bg-slate-950' : 'bg-slate-200/70'
          }`}
        >
          <DiagramCanvas
            page={activePage}
            tool={tool}
            selectedNodeIds={selectedNodeIds}
            selectedEdgeId={selectedEdgeId}
            transform={transform}
            onTransformChange={setTransform}
            onSelectNode={(id, multi) => {
              if (multi) {
                setSelectedNodeIds((prev) =>
                  prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
                );
              } else {
                setSelectedNodeIds([id]);
              }
              setSelectedEdgeId(null);
            }}
            onSelectEdge={(id) => {
              setSelectedEdgeId(id);
              setSelectedNodeIds([]);
            }}
            onClearSelection={() => {
              setSelectedNodeIds([]);
              setSelectedEdgeId(null);
            }}
            onUpdateNodes={(updatedNodes, recordHistory = false) => {
              commitPageChange(
                { ...activePage, nodes: updatedNodes },
                recordHistory,
                'Move Shapes'
              );
            }}
            onUpdateEdges={(updatedEdges, recordHistory = false) => {
              commitPageChange(
                { ...activePage, edges: updatedEdges },
                recordHistory,
                'Update Link'
              );
            }}
            onStartBatch={handleStartBatch}
            onCommitChange={handleEndBatch}
            onCreateEdge={handleCreateEdge}
            onDeleteSelected={handleDeleteSelected}
            isDarkMode={isDarkMode}
          />
        </main>

        {/* Right Properties & Layers Panel */}
        <PropertiesPanel
          page={activePage}
          selectedNodeIds={selectedNodeIds}
          selectedEdgeId={selectedEdgeId}
          onUpdateNodes={(updatedNodes) => {
            commitPageChange({ ...activePage, nodes: updatedNodes }, true, 'Format Shape');
          }}
          onUpdateEdges={(updatedEdges) => {
            commitPageChange({ ...activePage, edges: updatedEdges }, true, 'Format Link');
          }}
          onUpdatePage={(updatedPage) => {
            commitPageChange(updatedPage, true, 'Page Setup');
          }}
          onDuplicateNodes={handleDuplicateNodes}
          onDeleteSelected={handleDeleteSelected}
          onSelectNode={(id) => {
            setSelectedNodeIds([id]);
            setSelectedEdgeId(null);
          }}
          onSelectEdge={(id) => {
            setSelectedEdgeId(id);
            setSelectedNodeIds([]);
          }}
          isOpen={propsPanelOpen}
          onToggleOpen={() => setPropsPanelOpen((prev) => !prev)}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Bottom Page Tabs & Status Bar */}
      <PageTabs
        project={project}
        activePageId={activePage.id}
        onSelectPage={(pageId) => {
          const updated = { ...project, activePageId: pageId };
          onUpdateProject(updated);
          saveProject(updated);
        }}
        onAddPage={handleAddPage}
        onDuplicatePage={handleDuplicatePage}
        onDeletePage={handleDeletePage}
        onRenamePage={handleRenamePage}
        nodeCount={activePage.nodes.length}
        edgeCount={activePage.edges.length}
        zoomPercent={Math.round(transform.zoom * 100)}
        activePage={activePage}
        tool={tool}
        onToolChange={setTool}
        onToggleSnap={() =>
          commitPageChange({ ...activePage, snapToGrid: !activePage.snapToGrid })
        }
        onTogglePreset={(preset, orientation) => {
          let w = 1123;
          let h = 794;
          if (preset === 'A4') {
            w = orientation === 'portrait' ? 794 : 1123;
            h = orientation === 'portrait' ? 1123 : 794;
          } else if (preset === 'A3') {
            w = orientation === 'portrait' ? 1123 : 1587;
            h = orientation === 'portrait' ? 1587 : 1123;
          } else if (preset === 'Letter') {
            w = orientation === 'portrait' ? 816 : 1056;
            h = orientation === 'portrait' ? 1056 : 816;
          } else if (preset === 'Infinite') {
            w = 4000;
            h = 4000;
          }
          commitPageChange({ ...activePage, preset, orientation, width: w, height: h });
        }}
        onZoomIn={() =>
          setTransform((prev) => ({ ...prev, zoom: Math.min(2.5, prev.zoom * 1.15) }))
        }
        onZoomOut={() =>
          setTransform((prev) => ({ ...prev, zoom: Math.max(0.25, prev.zoom * 0.85) }))
        }
        onZoomFit={handleZoomFit}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Dialog Modals */}
      <ExportModal
        page={activePage}
        project={project}
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        isDarkMode={isDarkMode}
      />

      <TemplatesModal
        isOpen={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onApplyTemplate={handleApplyTemplate}
        isDarkMode={isDarkMode}
      />

      <AiAssistantModal
        isOpen={aiAssistantOpen}
        onClose={() => setAiAssistantOpen(false)}
        onApplySynthesizedDiagram={handleApplySynthesizedDiagram}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};
