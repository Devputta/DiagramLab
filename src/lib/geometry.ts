import { DiagramNode, DiagramEdge, HandlePosition, AlignmentGuide } from '../types/diagram';

export interface Point {
  x: number;
  y: number;
}

export function getHandleCoordinates(node: DiagramNode, handle: HandlePosition): Point {
  const { x, y, width, height } = node;

  switch (handle) {
    case 'top':
      return { x: x + width / 2, y };
    case 'right':
      return { x: x + width, y: y + height / 2 };
    case 'bottom':
      return { x: x + width / 2, y: y + height };
    case 'left':
      return { x, y: y + height / 2 };
  }
}

export function snap(val: number, gridSize: number): number {
  if (!gridSize || gridSize <= 1) return val;
  return Math.round(val / gridSize) * gridSize;
}

export function getPolylineMidpoint(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return { ...points[0] };
  if (points.length === 2) {
    return {
      x: (points[0].x + points[1].x) / 2,
      y: (points[0].y + points[1].y) / 2,
    };
  }

  let totalDist = 0;
  const dists: number[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const d = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
    dists.push(d);
    totalDist += d;
  }

  const targetDist = totalDist / 2;
  let accumulated = 0;

  for (let i = 0; i < dists.length; i++) {
    if (accumulated + dists[i] >= targetDist) {
      const remaining = targetDist - accumulated;
      const t = dists[i] > 0 ? remaining / dists[i] : 0.5;
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * t,
        y: points[i].y + (points[i + 1].y - points[i].y) * t,
      };
    }
    accumulated += dists[i];
  }

  return {
    x: (points[0].x + points[points.length - 1].x) / 2,
    y: (points[0].y + points[points.length - 1].y) / 2,
  };
}

export function computeOrthogonalPath(
  start: Point,
  end: Point,
  startHandle: HandlePosition,
  endHandle: HandlePosition
): { pathString: string; labelPoint: Point } {
  const padding = 24;

  // Initial stub vectors based on handle directions
  let p1: Point = { ...start };
  if (startHandle === 'top') p1.y -= padding;
  else if (startHandle === 'bottom') p1.y += padding;
  else if (startHandle === 'left') p1.x -= padding;
  else if (startHandle === 'right') p1.x += padding;

  let p2: Point = { ...end };
  if (endHandle === 'top') p2.y -= padding;
  else if (endHandle === 'bottom') p2.y += padding;
  else if (endHandle === 'left') p2.x -= padding;
  else if (endHandle === 'right') p2.x += padding;

  // Build clean segments
  const points: Point[] = [start, p1];

  if (startHandle === 'right' && endHandle === 'left' && p1.x <= p2.x) {
    const midX = (p1.x + p2.x) / 2;
    points.push({ x: midX, y: p1.y }, { x: midX, y: p2.y });
  } else if (startHandle === 'bottom' && endHandle === 'top' && p1.y <= p2.y) {
    const midY = (p1.y + p2.y) / 2;
    points.push({ x: p1.x, y: midY }, { x: p2.x, y: midY });
  } else if (startHandle === 'left' && endHandle === 'right' && p1.x >= p2.x) {
    const midX = (p1.x + p2.x) / 2;
    points.push({ x: midX, y: p1.y }, { x: midX, y: p2.y });
  } else if (startHandle === 'top' && endHandle === 'bottom' && p1.y >= p2.y) {
    const midY = (p1.y + p2.y) / 2;
    points.push({ x: p1.x, y: midY }, { x: p2.x, y: midY });
  } else {
    // General corner routing
    if (['left', 'right'].includes(startHandle)) {
      points.push({ x: p2.x, y: p1.y });
    } else {
      points.push({ x: p1.x, y: p2.y });
    }
  }

  points.push(p2, end);

  // Eliminate redundant collinear points
  const simplified: Point[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = simplified[simplified.length - 1];
    const curr = points[i];
    if (Math.abs(curr.x - prev.x) > 0.5 || Math.abs(curr.y - prev.y) > 0.5) {
      simplified.push(curr);
    }
  }

  const labelPoint = getPolylineMidpoint(simplified);

  if (simplified.length < 2) {
    return { pathString: `M ${start.x} ${start.y} L ${end.x} ${end.y}`, labelPoint };
  }

  // Draw clean rounded corners with 8px radius
  const radius = 8;
  let d = `M ${simplified[0].x} ${simplified[0].y}`;

  for (let i = 1; i < simplified.length - 1; i++) {
    const prev = simplified[i - 1];
    const curr = simplified[i];
    const next = simplified[i + 1];

    const dPrev = Math.hypot(curr.x - prev.x, curr.y - prev.y);
    const dNext = Math.hypot(next.x - curr.x, next.y - curr.y);
    const r = Math.min(radius, dPrev / 2, dNext / 2);

    if (r > 1) {
      const prevX = curr.x - ((curr.x - prev.x) / dPrev) * r;
      const prevY = curr.y - ((curr.y - prev.y) / dPrev) * r;
      const nextX = curr.x + ((next.x - curr.x) / dNext) * r;
      const nextY = curr.y + ((next.y - curr.y) / dNext) * r;

      d += ` L ${prevX} ${prevY} Q ${curr.x} ${curr.y}, ${nextX} ${nextY}`;
    } else {
      d += ` L ${curr.x} ${curr.y}`;
    }
  }

  d += ` L ${simplified[simplified.length - 1].x} ${simplified[simplified.length - 1].y}`;

  return { pathString: d, labelPoint };
}

export function computeCurvedPath(
  start: Point,
  end: Point,
  startHandle: HandlePosition,
  endHandle: HandlePosition
): string {
  const dx = Math.abs(end.x - start.x) * 0.5;
  const dy = Math.abs(end.y - start.y) * 0.5;
  const dist = Math.max(30, Math.sqrt(dx * dx + dy * dy) * 0.5);

  let cp1: Point = { ...start };
  if (startHandle === 'right') cp1.x += dist;
  else if (startHandle === 'left') cp1.x -= dist;
  else if (startHandle === 'bottom') cp1.y += dist;
  else if (startHandle === 'top') cp1.y -= dist;

  let cp2: Point = { ...end };
  if (endHandle === 'right') cp2.x += dist;
  else if (endHandle === 'left') cp2.x -= dist;
  else if (endHandle === 'bottom') cp2.y += dist;
  else if (endHandle === 'top') cp2.y -= dist;

  return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
}

export function computeEdgePath(
  edge: DiagramEdge,
  sourceNode: DiagramNode,
  targetNode: DiagramNode
): { pathString: string; labelPoint: Point; startPoint: Point; endPoint: Point } {
  const start = getHandleCoordinates(sourceNode, edge.sourceHandle);
  const end = getHandleCoordinates(targetNode, edge.targetHandle);

  let pathString = '';
  let labelPoint: Point = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };

  if (edge.lineType === 'straight') {
    pathString = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  } else if (edge.lineType === 'curved') {
    pathString = computeCurvedPath(start, end, edge.sourceHandle, edge.targetHandle);
  } else {
    const res = computeOrthogonalPath(start, end, edge.sourceHandle, edge.targetHandle);
    pathString = res.pathString;
    labelPoint = res.labelPoint;
  }

  return { pathString, labelPoint, startPoint: start, endPoint: end };
}

export function computeEdgePathToPoint(
  fixedNode: DiagramNode,
  fixedHandle: HandlePosition,
  freePoint: Point,
  fixedIsSource: boolean,
  lineType: 'orthogonal' | 'straight' | 'curved' = 'orthogonal'
): { pathString: string; labelPoint: Point } {
  const fixedPt = getHandleCoordinates(fixedNode, fixedHandle);
  const start = fixedIsSource ? fixedPt : freePoint;
  const end = fixedIsSource ? freePoint : fixedPt;
  const startHandle = fixedIsSource ? fixedHandle : 'right';
  const endHandle = fixedIsSource ? 'left' : fixedHandle;

  if (lineType === 'straight') {
    return {
      pathString: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
      labelPoint: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
    };
  } else if (lineType === 'curved') {
    return {
      pathString: computeCurvedPath(start, end, startHandle, endHandle),
      labelPoint: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
    };
  } else {
    return computeOrthogonalPath(start, end, startHandle, endHandle);
  }
}

export function shouldRenderLabelUnderShape(node: DiagramNode): boolean {
  if (node.labelPosition === 'bottom') return true;
  if (node.labelPosition === 'inside') return false;
  if (node.labelPosition === 'top') return false;

  // Shapes with internal graphics/icons/3D perspective where center text overlaps:
  if (
    node.category === 'software' ||
    node.category === 'network' ||
    node.category === 'technical-3d' ||
    node.category === 'database' ||
    node.is3D ||
    [
      'cylinder',
      'cloud',
      'folder',
      'document',
      'uml-actor',
      'uml-component',
      'uml-object',
      'uml-package',
    ].includes(node.type)
  ) {
    return true;
  }

  return false;
}

export function computeBoundingBox(nodes: DiagramNode[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const n of nodes) {
    const isUnder = shouldRenderLabelUnderShape(n);
    const isAbove = n.labelPosition === 'top';
    const offX = n.labelOffsetX || 0;
    const offY = n.labelOffsetY || 0;

    const baseTop = isUnder ? n.height + 6 : isAbove ? -22 : n.height / 2;
    const labelCenterX = n.x + n.width / 2 + offX;
    const labelTopY = n.y + baseTop + offY;
    const estLabelW = (n.label?.length || 0) * 7.5 + 16;
    const labelLeft = labelCenterX - estLabelW / 2;
    const labelRight = labelCenterX + estLabelW / 2;
    const labelBottom = labelTopY + (n.subLabel ? 34 : 20);

    // Node shape bounds
    if (n.x < minX) minX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.x + n.width > maxX) maxX = n.x + n.width;
    if (n.y + n.height > maxY) maxY = n.y + n.height;

    // Draggable label bounds
    if (labelLeft < minX) minX = labelLeft;
    if (labelTopY < minY) minY = labelTopY;
    if (labelRight > maxX) maxX = labelRight;
    if (labelBottom > maxY) maxY = labelBottom;
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(100, maxX - minX),
    height: Math.max(100, maxY - minY),
  };
}

export function computeSmartGuides(
  draggingNodeId: string,
  targetX: number,
  targetY: number,
  targetW: number,
  targetH: number,
  otherNodes: DiagramNode[],
  threshold = 6
): {
  snappedX: number;
  snappedY: number;
  guides: AlignmentGuide[];
} {
  let snappedX = targetX;
  let snappedY = targetY;
  const guides: AlignmentGuide[] = [];

  const dragLeft = targetX;
  const dragCenter = targetX + targetW / 2;
  const dragRight = targetX + targetW;

  const dragTop = targetY;
  const dragMiddle = targetY + targetH / 2;
  const dragBottom = targetY + targetH;

  for (const n of otherNodes) {
    if (n.id === draggingNodeId) continue;

    const nLeft = n.x;
    const nCenter = n.x + n.width / 2;
    const nRight = n.x + n.width;

    const nTop = n.y;
    const nMiddle = n.y + n.height / 2;
    const nBottom = n.y + n.height;

    // Vertical alignments (X-axis)
    if (Math.abs(dragLeft - nLeft) < threshold) {
      snappedX = nLeft;
      guides.push({ type: 'vertical', position: nLeft });
    } else if (Math.abs(dragCenter - nCenter) < threshold) {
      snappedX = nCenter - targetW / 2;
      guides.push({ type: 'vertical', position: nCenter });
    } else if (Math.abs(dragRight - nRight) < threshold) {
      snappedX = nRight - targetW;
      guides.push({ type: 'vertical', position: nRight });
    }

    // Horizontal alignments (Y-axis)
    if (Math.abs(dragTop - nTop) < threshold) {
      snappedY = nTop;
      guides.push({ type: 'horizontal', position: nTop });
    } else if (Math.abs(dragMiddle - nMiddle) < threshold) {
      snappedY = nMiddle - targetH / 2;
      guides.push({ type: 'horizontal', position: nMiddle });
    } else if (Math.abs(dragBottom - nBottom) < threshold) {
      snappedY = nBottom - targetH;
      guides.push({ type: 'horizontal', position: nBottom });
    }
  }

  return { snappedX, snappedY, guides };
}
