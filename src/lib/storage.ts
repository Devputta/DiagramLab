import { DiagramProject, DiagramPage } from '../types/diagram';
import { TEMPLATE_CATALOG } from '../templates/catalog';

const STORAGE_KEY_PROJECTS = 'diagramlab_projects_v1';
const STORAGE_KEY_ACTIVE = 'diagramlab_active_project_id';

export function getDefaultNewPage(): DiagramPage {
  return {
    id: `page-${Date.now()}`,
    name: 'Diagram Page 1',
    preset: 'A4',
    orientation: 'landscape',
    width: 1123,
    height: 794,
    background: '#ffffff',
    gridEnabled: true,
    gridSize: 20,
    snapToGrid: true,
    figureNumber: 'Figure 1.1',
    figureCaption: 'System Architectural Overview',
    captionPosition: 'below',
    nodes: [],
    edges: [],
  };
}

export function createNewProject(
  name = 'Untitled Technical Diagram',
  initialPage?: DiagramPage
): DiagramProject {
  const page = initialPage || getDefaultNewPage();
  const now = new Date().toISOString();

  return {
    schemaVersion: 1,
    id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name,
    createdAt: now,
    updatedAt: now,
    pages: [page],
    activePageId: page.id,
  };
}

export function loadProjects(): DiagramProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (!raw) {
      // Seed with initial template so user has immediate realistic projects
      const initial = createNewProject(
        'Full-Stack Architecture',
        JSON.parse(JSON.stringify(TEMPLATE_CATALOG[0].page))
      );
      saveProject(initial);
      return [initial];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((p) => migrateProject(p));
    }
    return [];
  } catch (err) {
    console.error('Failed to load projects from storage:', err);
    return [];
  }
}

export function saveProject(project: DiagramProject): void {
  try {
    const projects = loadProjects().filter((p) => p.id !== project.id);
    const updated = {
      ...project,
      updatedAt: new Date().toISOString(),
    };
    projects.unshift(updated);
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
    localStorage.setItem(STORAGE_KEY_ACTIVE, updated.id);
  } catch (err) {
    console.error('Failed to save project:', err);
  }
}

export function getProject(id: string): DiagramProject | undefined {
  const projects = loadProjects();
  return projects.find((p) => p.id === id);
}

export function getActiveProjectId(): string | null {
  return localStorage.getItem(STORAGE_KEY_ACTIVE);
}

export function setActiveProjectId(id: string): void {
  localStorage.setItem(STORAGE_KEY_ACTIVE, id);
}

export function deleteProject(id: string): void {
  const projects = loadProjects().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
  if (getActiveProjectId() === id && projects.length > 0) {
    setActiveProjectId(projects[0].id);
  }
}

export function duplicateProject(id: string): DiagramProject | null {
  const source = getProject(id);
  if (!source) return null;

  const copy: DiagramProject = {
    ...JSON.parse(JSON.stringify(source)),
    id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: `${source.name} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveProject(copy);
  return copy;
}

export function migrateProject(raw: any): DiagramProject {
  // Safe schema migration wrapper
  if (!raw || typeof raw !== 'object') {
    return createNewProject();
  }

  const project: DiagramProject = {
    schemaVersion: 1,
    id: raw.id || `proj-${Date.now()}`,
    name: raw.name || 'Untitled Diagram',
    description: raw.description || '',
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
    pages: Array.isArray(raw.pages) && raw.pages.length > 0 ? raw.pages : [getDefaultNewPage()],
    activePageId: raw.activePageId || (raw.pages?.[0]?.id ?? 'page-1'),
  };

  return project;
}

export function exportProjectToJsonFile(project: DiagramProject) {
  const jsonStr = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'diagram'}.diagramlab`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseProjectJsonFile(fileContent: string): DiagramProject {
  try {
    const parsed = JSON.parse(fileContent);
    if (!parsed.pages || !Array.isArray(parsed.pages)) {
      throw new Error('Invalid DiagramLab project file: missing pages array.');
    }
    return migrateProject(parsed);
  } catch (err: any) {
    throw new Error(`Failed to parse DiagramLab project: ${err?.message || 'Invalid JSON format'}`);
  }
}
