export type ShapeCategory =
  | 'basic'
  | 'flowchart'
  | 'software'
  | 'uml'
  | 'network'
  | 'database'
  | 'technical-3d';

export type ShapeType =
  // Basic
  | 'rectangle'
  | 'rounded-rectangle'
  | 'circle'
  | 'ellipse'
  | 'triangle'
  | 'diamond'
  | 'hexagon'
  | 'pentagon'
  | 'parallelogram'
  | 'cylinder'
  | 'document'
  | 'folder'
  | 'cloud'
  // Flowchart
  | 'flow-start-end'
  | 'flow-process'
  | 'flow-decision'
  | 'flow-input-output'
  | 'flow-predefined-process'
  | 'flow-manual-input'
  | 'flow-data'
  | 'flow-database'
  | 'flow-delay'
  | 'flow-connector'
  // Software Architecture
  | 'soft-user'
  | 'soft-browser'
  | 'soft-mobile'
  | 'soft-frontend'
  | 'soft-backend'
  | 'soft-api'
  | 'soft-server'
  | 'soft-database'
  | 'soft-cache'
  | 'soft-queue'
  | 'soft-storage'
  | 'soft-auth'
  | 'soft-cloud'
  | 'soft-load-balancer'
  | 'soft-service'
  // UML
  | 'uml-actor'
  | 'uml-use-case'
  | 'uml-class'
  | 'uml-interface'
  | 'uml-object'
  | 'uml-component'
  | 'uml-package'
  | 'uml-state'
  | 'uml-activity'
  // Network
  | 'net-router'
  | 'net-switch'
  | 'net-firewall'
  | 'net-server'
  | 'net-desktop'
  | 'net-laptop'
  | 'net-mobile'
  | 'net-internet'
  | 'net-gateway'
  // Database / ER
  | 'er-entity'
  | 'er-attribute'
  | 'er-relationship'
  | 'er-table'
  // 3D Technical
  | '3d-box'
  | '3d-cylinder'
  | '3d-platform'
  | '3d-microservice';

export type HandlePosition = 'top' | 'right' | 'bottom' | 'left';

export type ConnectorType = 'orthogonal' | 'straight' | 'curved';
export type ArrowType = 'none' | 'arrow' | 'double-arrow' | 'stealth' | 'circle';
export type StrokeStyle = 'solid' | 'dashed' | 'dotted';

export interface UmlClassData {
  className: string;
  stereotype?: string;
  attributes: string[];
  methods: string[];
}

export interface ErTableField {
  name: string;
  type: string;
  isPk?: boolean;
  isFk?: boolean;
}

export interface DiagramNode {
  id: string;
  type: ShapeType;
  category: ShapeCategory;
  label: string;
  subLabel?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  cornerRadius?: number;
  opacity?: number;
  textColor?: string;
  fontSize?: number;
  labelPosition?: 'inside' | 'bottom' | 'top';
  labelOffsetX?: number;
  labelOffsetY?: number;
  fontWeight?: 'normal' | 'medium' | 'bold';
  fontFamily?: 'inter' | 'mono' | 'serif';
  textAlign?: 'left' | 'center' | 'right';
  is3D?: boolean;
  depth3D?: number;
  perspectiveAngle?: number;
  locked?: boolean;
  hidden?: boolean;
  zIndex: number;
  metadata?: {
    uml?: UmlClassData;
    erFields?: ErTableField[];
    notes?: string;
  };
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: HandlePosition;
  targetHandle: HandlePosition;
  label?: string;
  lineType: ConnectorType;
  arrowType: ArrowType;
  stroke: string;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  animated?: boolean;
}

export type PagePreset = 'A4' | 'A3' | 'Letter' | 'Custom' | 'Infinite';
export type PageOrientation = 'landscape' | 'portrait';

export interface DiagramPage {
  id: string;
  name: string;
  preset: PagePreset;
  orientation: PageOrientation;
  width: number;
  height: number;
  background: string;
  gridEnabled: boolean;
  gridSize: number;
  snapToGrid: boolean;
  showRulers?: boolean;
  figureNumber?: string;
  figureCaption?: string;
  captionPosition?: 'below' | 'above';
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export interface DiagramProject {
  schemaVersion: 1;
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  pages: DiagramPage[];
  activePageId: string;
}

export interface ShapeDefinition {
  id: ShapeType;
  name: string;
  category: ShapeCategory;
  defaultWidth: number;
  defaultHeight: number;
  description: string;
  connectionPoints: HandlePosition[];
  defaultFill: string;
  defaultStroke: string;
  is3DSupported?: boolean;
}

export type CanvasTool = 'select' | 'pan' | 'connect';

export interface ViewportTransform {
  x: number;
  y: number;
  zoom: number;
}

export interface AlignmentGuide {
  type: 'horizontal' | 'vertical';
  position: number;
}
