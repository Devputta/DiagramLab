import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  DiagramPage,
  DiagramNode,
  DiagramEdge,
  HandlePosition,
  CanvasTool,
  ViewportTransform,
  AlignmentGuide,
} from '../../types/diagram';
import { NodeRenderer } from './NodeRenderer';
import { EdgeRenderer } from './EdgeRenderer';
import {
  getHandleCoordinates,
  computeSmartGuides,
  snap,
  computeBoundingBox,
  computeEdgePathToPoint,
} from '../../lib/geometry';

interface DiagramCanvasProps {
  page: DiagramPage;
  tool: CanvasTool;
  selectedNodeIds: string[];
  selectedEdgeId: string | null;
  transform: ViewportTransform;
  onTransformChange: (transform: ViewportTransform) => void;
  onSelectNode: (id: string, multiSelect: boolean) => void;
  onSelectEdge: (id: string) => void;
  onClearSelection: () => void;
  onUpdateNodes: (nodes: DiagramNode[], recordHistory?: boolean) => void;
  onUpdateEdges: (edges: DiagramEdge[], recordHistory?: boolean) => void;
  onCreateEdge: (
    source: string,
    target: string,
    sourceHandle: HandlePosition,
    targetHandle: HandlePosition
  ) => void;
  onDeleteSelected: () => void;
  onCommitChange?: (actionName?: string) => void;
  onStartBatch?: () => void;
  isDarkMode?: boolean;
}

export const DiagramCanvas: React.FC<DiagramCanvasProps> = ({
  page,
  tool,
  selectedNodeIds,
  selectedEdgeId,
  transform,
  onTransformChange,
  onSelectNode,
  onSelectEdge,
  onClearSelection,
  onUpdateNodes,
  onUpdateEdges,
  onCreateEdge,
  onDeleteSelected,
  onCommitChange,
  onStartBatch,
  isDarkMode = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Dragging node state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const nodeStartPositions = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Resizing state
  const [resizingInfo, setResizingInfo] = useState<{
    nodeId: string;
    handle: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialW: number;
    initialH: number;
  } | null>(null);

  // Active connection creation
  const [connectionDraft, setConnectionDraft] = useState<{
    sourceNodeId: string;
    sourceHandle: HandlePosition;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Active Reconnecting Existing Connection Terminal
  const [reconnectingTerminal, setReconnectingTerminal] = useState<{
    edgeId: string;
    terminal: 'source' | 'target';
    currentX: number;
    currentY: number;
  } | null>(null);

  // Candidate snap target for connecting or reconnecting
  const [snapCandidate, setSnapCandidate] = useState<{
    nodeId: string;
    handle: HandlePosition;
  } | null>(null);

  // Pan interaction
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Marquee selection
  const [marquee, setMarquee] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Smart guides
  const [activeGuides, setActiveGuides] = useState<AlignmentGuide[]>([]);

  // Native non-passive Wheel & Touch Pinch-to-Zoom handlers
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Mouse Wheel Zoom (centered at mouse cursor) & Trackpad Pan
    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Pinch-to-zoom gesture on trackpad or mouse wheel with Ctrl/Meta key
      if (e.ctrlKey || e.metaKey) {
        const zoomDelta = -e.deltaY * 0.01;
        const zoomFactor = Math.exp(zoomDelta);
        const newZoom = Math.min(3.0, Math.max(0.2, transform.zoom * zoomFactor));

        const newX = mouseX - (mouseX - transform.x) * (newZoom / transform.zoom);
        const newY = mouseY - (mouseY - transform.y) * (newZoom / transform.zoom);

        onTransformChange({ x: newX, y: newY, zoom: newZoom });
      } else if (Math.abs(e.deltaX) > 0 || (e.shiftKey && Math.abs(e.deltaY) > 0)) {
        // Two-finger trackpad horizontal / vertical pan
        const dx = e.shiftKey ? -e.deltaY : -e.deltaX;
        const dy = e.shiftKey ? 0 : -e.deltaY;
        onTransformChange({
          ...transform,
          x: transform.x + dx,
          y: transform.y + dy,
        });
      } else {
        // Standard mouse wheel: smooth scroll-to-zoom centered towards cursor
        const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
        const newZoom = Math.min(3.0, Math.max(0.2, transform.zoom * zoomFactor));

        const newX = mouseX - (mouseX - transform.x) * (newZoom / transform.zoom);
        const newY = mouseY - (mouseY - transform.y) * (newZoom / transform.zoom);

        onTransformChange({ x: newX, y: newY, zoom: newZoom });
      }
    };

    // 2. Multi-touch Pinch-to-Zoom
    let initialTouchDistance = 0;
    let initialTouchZoom = transform.zoom;
    let initialTouchMidpoint = { x: 0, y: 0 };
    let initialTouchTransform = { ...transform };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        initialTouchDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        initialTouchZoom = transform.zoom;
        initialTouchTransform = { ...transform };

        const rect = container.getBoundingClientRect();
        initialTouchMidpoint = {
          x: (t1.clientX + t2.clientX) / 2 - rect.left,
          y: (t1.clientY + t2.clientY) / 2 - rect.top,
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialTouchDistance > 0) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const scale = currentDistance / initialTouchDistance;

        const newZoom = Math.min(3.0, Math.max(0.2, initialTouchZoom * scale));
        const rect = container.getBoundingClientRect();
        const currentMidpoint = {
          x: (t1.clientX + t2.clientX) / 2 - rect.left,
          y: (t1.clientY + t2.clientY) / 2 - rect.top,
        };

        const newX =
          currentMidpoint.x -
          (initialTouchMidpoint.x - initialTouchTransform.x) * (newZoom / initialTouchZoom);
        const newY =
          currentMidpoint.y -
          (initialTouchMidpoint.y - initialTouchTransform.y) * (newZoom / initialTouchZoom);

        onTransformChange({ x: newX, y: newY, zoom: newZoom });
      }
    };

    const handleTouchEnd = () => {
      initialTouchDistance = 0;
    };

    container.addEventListener('wheel', handleNativeWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      container.removeEventListener('wheel', handleNativeWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [transform, onTransformChange]);

  // Handle Drag Start
  const handleNodeDragStart = (nodeId: string, e: React.MouseEvent) => {
    onStartBatch?.();
    setDraggingNodeId(nodeId);
    dragStartPos.current = { x: e.clientX, y: e.clientY };

    const map = new Map<string, { x: number; y: number }>();
    const idsToMove = selectedNodeIds.includes(nodeId) ? selectedNodeIds : [nodeId];
    idsToMove.forEach((id) => {
      const n = page.nodes.find((item) => item.id === id);
      if (n) map.set(id, { x: n.x, y: n.y });
    });
    nodeStartPositions.current = map;
  };

  // Handle Resize Start
  const handleResizeStart = (nodeId: string, handle: string, e: React.MouseEvent) => {
    onStartBatch?.();
    const node = page.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    setResizingInfo({
      nodeId,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialX: node.x,
      initialY: node.y,
      initialW: node.width,
      initialH: node.height,
    });
  };

  // Helper to find the best node and port for a canvas point
  const findSnapTarget = useCallback(
    (canvasX: number, canvasY: number, excludeNodeId?: string) => {
      let bestNode: DiagramNode | null = null;
      let bestHandle: HandlePosition = 'left';
      let minDistance = 45; // snap threshold distance

      page.nodes.forEach((n) => {
        if (excludeNodeId && n.id === excludeNodeId) return;

        // Check distance to node bounds first
        const isInside =
          canvasX >= n.x - 20 &&
          canvasX <= n.x + n.width + 20 &&
          canvasY >= n.y - 20 &&
          canvasY <= n.y + n.height + 20;

        const candidateHandles: HandlePosition[] = ['left', 'top', 'right', 'bottom'];
        candidateHandles.forEach((h) => {
          const pt = getHandleCoordinates(n, h);
          const dist = Math.hypot(pt.x - canvasX, pt.y - canvasY);
          if (dist < minDistance || (isInside && dist < minDistance * 1.5)) {
            minDistance = dist;
            bestNode = n;
            bestHandle = h;
          }
        });
      });

      return bestNode ? { nodeId: (bestNode as DiagramNode).id, handle: bestHandle } : null;
    },
    [page.nodes]
  );

  // Handle Connection Drag Start
  const handleConnectStart = (nodeId: string, handle: HandlePosition, e: React.MouseEvent) => {
    const node = page.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const startPt = getHandleCoordinates(node, handle);

    setConnectionDraft({
      sourceNodeId: nodeId,
      sourceHandle: handle,
      currentX: startPt.x,
      currentY: startPt.y,
    });
  };

  // Handle Connection Drag End (Drop onto target node handle)
  const handleConnectEnd = (targetNodeId: string, targetHandle: HandlePosition) => {
    if (!connectionDraft) return;
    if (connectionDraft.sourceNodeId !== targetNodeId) {
      onCreateEdge(
        connectionDraft.sourceNodeId,
        targetNodeId,
        connectionDraft.sourceHandle,
        targetHandle
      );
    }
    setConnectionDraft(null);
    setSnapCandidate(null);
  };

  // Start Terminal Reconnect Dragging (from EdgeRenderer)
  const handleStartTerminalDrag = (
    edgeId: string,
    terminal: 'source' | 'target',
    e: React.MouseEvent
  ) => {
    onStartBatch?.();
    const edge = page.edges.find((e) => e.id === edgeId);
    if (!edge) return;

    const sourceNode = page.nodes.find((n) => n.id === edge.source);
    const targetNode = page.nodes.find((n) => n.id === edge.target);
    if (!sourceNode || !targetNode) return;

    const startPt =
      terminal === 'source'
        ? getHandleCoordinates(sourceNode, edge.sourceHandle)
        : getHandleCoordinates(targetNode, edge.targetHandle);

    setReconnectingTerminal({
      edgeId,
      terminal,
      currentX: startPt.x,
      currentY: startPt.y,
    });
  };

  // Global mouse move & up
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // 1. Panning
      if (isPanning) {
        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;
        onTransformChange({
          ...transform,
          x: transform.x + dx,
          y: transform.y + dy,
        });
        panStart.current = { x: e.clientX, y: e.clientY };
        return;
      }

      // 2. Marquee Selection
      if (marquee) {
        setMarquee((prev) =>
          prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null
        );
        return;
      }

      // 3. Node Dragging
      if (draggingNodeId) {
        const dx = (e.clientX - dragStartPos.current.x) / transform.zoom;
        const dy = (e.clientY - dragStartPos.current.y) / transform.zoom;

        const mainNodeInitial = nodeStartPositions.current.get(draggingNodeId);
        if (!mainNodeInitial) return;

        let targetX = mainNodeInitial.x + dx;
        let targetY = mainNodeInitial.y + dy;

        if (page.snapToGrid) {
          targetX = snap(targetX, page.gridSize);
          targetY = snap(targetY, page.gridSize);
        }

        const mainNode = page.nodes.find((n) => n.id === draggingNodeId);
        if (mainNode) {
          const { snappedX, snappedY, guides } = computeSmartGuides(
            draggingNodeId,
            targetX,
            targetY,
            mainNode.width,
            mainNode.height,
            page.nodes
          );
          targetX = snappedX;
          targetY = snappedY;
          setActiveGuides(guides);
        }

        const deltaXApplied = targetX - mainNodeInitial.x;
        const deltaYApplied = targetY - mainNodeInitial.y;

        const updatedNodes = page.nodes.map((n) => {
          const initPos = nodeStartPositions.current.get(n.id);
          if (initPos) {
            return {
              ...n,
              x: initPos.x + deltaXApplied,
              y: initPos.y + deltaYApplied,
            };
          }
          return n;
        });

        onUpdateNodes(updatedNodes, false);
        return;
      }

      // 4. Node Resizing
      if (resizingInfo) {
        const dx = (e.clientX - resizingInfo.startX) / transform.zoom;
        const dy = (e.clientY - resizingInfo.startY) / transform.zoom;

        let { initialX, initialY, initialW, initialH, handle } = resizingInfo;
        let newX = initialX;
        let newY = initialY;
        let newW = initialW;
        let newH = initialH;

        if (handle.includes('e')) newW = Math.max(40, initialW + dx);
        if (handle.includes('s')) newH = Math.max(30, initialH + dy);
        if (handle.includes('w')) {
          const proposedW = initialW - dx;
          if (proposedW >= 40) {
            newW = proposedW;
            newX = initialX + dx;
          }
        }
        if (handle.includes('n')) {
          const proposedH = initialH - dy;
          if (proposedH >= 30) {
            newH = proposedH;
            newY = initialY + dy;
          }
        }

        if (page.snapToGrid) {
          newW = snap(newW, page.gridSize);
          newH = snap(newH, page.gridSize);
          newX = snap(newX, page.gridSize);
          newY = snap(newY, page.gridSize);
        }

        const updatedNodes = page.nodes.map((n) =>
          n.id === resizingInfo.nodeId
            ? { ...n, x: newX, y: newY, width: newW, height: newH }
            : n
        );
        onUpdateNodes(updatedNodes, false);
        return;
      }

      // 5. Connection Line Dragging (Creating new edge)
      if (connectionDraft && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const canvasX = (e.clientX - rect.left - transform.x) / transform.zoom;
        const canvasY = (e.clientY - rect.top - transform.y) / transform.zoom;

        setConnectionDraft((prev) =>
          prev ? { ...prev, currentX: canvasX, currentY: canvasY } : null
        );

        const target = findSnapTarget(canvasX, canvasY, connectionDraft.sourceNodeId);
        setSnapCandidate(target);
        return;
      }

      // 6. Terminal Reconnect Dragging (Modifying existing edge endpoints)
      if (reconnectingTerminal && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const canvasX = (e.clientX - rect.left - transform.x) / transform.zoom;
        const canvasY = (e.clientY - rect.top - transform.y) / transform.zoom;

        setReconnectingTerminal((prev) =>
          prev ? { ...prev, currentX: canvasX, currentY: canvasY } : null
        );

        const currentEdge = page.edges.find((item) => item.id === reconnectingTerminal.edgeId);
        const fixedNodeId =
          reconnectingTerminal.terminal === 'source' ? currentEdge?.target : currentEdge?.source;

        const target = findSnapTarget(canvasX, canvasY, fixedNodeId);
        setSnapCandidate(target);
      }
    };

    const handleMouseUp = () => {
      if (isPanning) setIsPanning(false);

      if (marquee && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x1 = Math.min(marquee.startX, marquee.currentX) - rect.left;
        const x2 = Math.max(marquee.startX, marquee.currentX) - rect.left;
        const y1 = Math.min(marquee.startY, marquee.currentY) - rect.top;
        const y2 = Math.max(marquee.startY, marquee.currentY) - rect.top;

        const canvasX1 = (x1 - transform.x) / transform.zoom;
        const canvasX2 = (x2 - transform.x) / transform.zoom;
        const canvasY1 = (y1 - transform.y) / transform.zoom;
        const canvasY2 = (y2 - transform.y) / transform.zoom;

        const selected = page.nodes
          .filter(
            (n) =>
              n.x + n.width >= canvasX1 &&
              n.x <= canvasX2 &&
              n.y + n.height >= canvasY1 &&
              n.y <= canvasY2
          )
          .map((n) => n.id);

        if (selected.length > 0) {
          selected.forEach((id, idx) => onSelectNode(id, idx > 0));
        }
        setMarquee(null);
      }

      if (draggingNodeId || resizingInfo) {
        onCommitChange?.(draggingNodeId ? 'Move Shapes' : 'Resize Shape');
        setDraggingNodeId(null);
        setResizingInfo(null);
        setActiveGuides([]);
      }

      // Finish connection draft
      if (connectionDraft) {
        if (snapCandidate) {
          onCreateEdge(
            connectionDraft.sourceNodeId,
            snapCandidate.nodeId,
            connectionDraft.sourceHandle,
            snapCandidate.handle
          );
        } else {
          // Check if released within any node
          const fallback = findSnapTarget(
            connectionDraft.currentX,
            connectionDraft.currentY,
            connectionDraft.sourceNodeId
          );
          if (fallback) {
            onCreateEdge(
              connectionDraft.sourceNodeId,
              fallback.nodeId,
              connectionDraft.sourceHandle,
              fallback.handle
            );
          }
        }
        setConnectionDraft(null);
        setSnapCandidate(null);
      }

      // Finish terminal reconnection (User reconnected an existing edge!)
      if (reconnectingTerminal) {
        const target = snapCandidate || findSnapTarget(
          reconnectingTerminal.currentX,
          reconnectingTerminal.currentY
        );

        if (target) {
          const edgeId = reconnectingTerminal.edgeId;
          const terminal = reconnectingTerminal.terminal;

          const updatedEdges = page.edges.map((e) => {
            if (e.id === edgeId) {
              if (terminal === 'source') {
                return { ...e, source: target.nodeId, sourceHandle: target.handle };
              } else {
                return { ...e, target: target.nodeId, targetHandle: target.handle };
              }
            }
            return e;
          });

          onUpdateEdges(updatedEdges, true);
          onCommitChange?.('Reconnect Link');
        }

        setReconnectingTerminal(null);
        setSnapCandidate(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    isPanning,
    marquee,
    draggingNodeId,
    resizingInfo,
    connectionDraft,
    reconnectingTerminal,
    snapCandidate,
    transform,
    page.nodes,
    page.edges,
    page.snapToGrid,
    page.gridSize,
    onTransformChange,
    onUpdateNodes,
    onUpdateEdges,
    onCreateEdge,
    onSelectNode,
    onCommitChange,
    findSnapTarget,
  ]);

  // Update node text
  const handleUpdateNodeText = (nodeId: string, newLabel: string, newSubLabel?: string) => {
    const updated = page.nodes.map((n) =>
      n.id === nodeId ? { ...n, label: newLabel, subLabel: newSubLabel } : n
    );
    onUpdateNodes(updated, true);
  };

  // Update node label offset (draggable label repositioning)
  const handleUpdateLabelOffset = (
    nodeId: string,
    offsetX: number,
    offsetY: number,
    commit = false
  ) => {
    const updated = page.nodes.map((n) =>
      n.id === nodeId ? { ...n, labelOffsetX: offsetX, labelOffsetY: offsetY } : n
    );
    onUpdateNodes(updated, true);
    if (commit) {
      onCommitChange?.('Reposition Label');
    }
  };

  // Update edge with partial updates
  const handleUpdateEdge = (edgeId: string, updates: Partial<DiagramEdge>) => {
    const updated = page.edges.map((e) => (e.id === edgeId ? { ...e, ...updates } : e));
    onUpdateEdges(updated, true);
    onCommitChange?.('Format Link');
  };

  // Delete specific edge
  const handleDeleteEdge = (edgeId: string) => {
    const updated = page.edges.filter((e) => e.id !== edgeId);
    onUpdateEdges(updated, true);
    if (selectedEdgeId === edgeId) {
      onSelectEdge('');
    }
    onCommitChange?.('Delete Link');
  };

  // Reverse edge direction
  const handleReverseEdge = (edgeId: string) => {
    const updated = page.edges.map((e) => {
      if (e.id === edgeId) {
        return {
          ...e,
          source: e.target,
          target: e.source,
          sourceHandle: e.targetHandle,
          targetHandle: e.sourceHandle,
        };
      }
      return e;
    });
    onUpdateEdges(updated, true);
    onCommitChange?.('Reverse Link Direction');
  };

  // Quick sprout: instant creation of next step in flow
  const handleQuickSprout = (nodeId: string, direction: 'right' | 'bottom') => {
    const srcNode = page.nodes.find((n) => n.id === nodeId);
    if (!srcNode) return;

    const newNodeId = `node-${Date.now()}`;
    const spacingX = direction === 'right' ? srcNode.width + 80 : 0;
    const spacingY = direction === 'bottom' ? srcNode.height + 60 : 0;

    const newNode: DiagramNode = {
      ...srcNode,
      id: newNodeId,
      label: 'Next Step',
      subLabel: '',
      x: srcNode.x + spacingX,
      y: srcNode.y + spacingY,
      zIndex: page.nodes.length + 1,
    };

    const newEdgeId = `edge-${Date.now()}`;
    const newEdge: DiagramEdge = {
      id: newEdgeId,
      source: srcNode.id,
      target: newNodeId,
      sourceHandle: direction === 'right' ? 'right' : 'bottom',
      targetHandle: direction === 'right' ? 'left' : 'top',
      label: '',
      lineType: 'orthogonal',
      arrowType: 'arrow',
      strokeStyle: 'solid',
      stroke: isDarkMode ? '#94a3b8' : '#334155',
      strokeWidth: 1.5,
    };

    onUpdateNodes([...page.nodes, newNode], true);
    onUpdateEdges([...page.edges, newEdge], true);
    onSelectNode(newNodeId, false);
    onCommitChange?.('Add Flow Step');
  };

  // Map of nodes for fast lookup
  const nodeMap = new Map<string, DiagramNode>(page.nodes.map((n) => [n.id, n]));

  // Live Draft connection line path (creating new edge)
  let draftConnectionPath = '';
  if (connectionDraft) {
    const sourceNode = nodeMap.get(connectionDraft.sourceNodeId);
    if (sourceNode) {
      const snapTargetNode = snapCandidate ? nodeMap.get(snapCandidate.nodeId) : null;
      const targetPoint = snapTargetNode
        ? getHandleCoordinates(snapTargetNode, snapCandidate!.handle)
        : { x: connectionDraft.currentX, y: connectionDraft.currentY };

      const res = computeEdgePathToPoint(
        sourceNode,
        connectionDraft.sourceHandle,
        targetPoint,
        true,
        'orthogonal'
      );
      draftConnectionPath = res.pathString;
    }
  }

  // Live Reconnecting terminal path (reconnecting existing edge)
  let reconnectingLivePath = '';
  if (reconnectingTerminal) {
    const edge = page.edges.find((e) => e.id === reconnectingTerminal.edgeId);
    if (edge) {
      const isDraggingSource = reconnectingTerminal.terminal === 'source';
      const fixedNode = nodeMap.get(isDraggingSource ? edge.target : edge.source);
      const fixedHandle = isDraggingSource ? edge.targetHandle : edge.sourceHandle;

      if (fixedNode) {
        const snapTargetNode = snapCandidate ? nodeMap.get(snapCandidate.nodeId) : null;
        const targetPoint = snapTargetNode
          ? getHandleCoordinates(snapTargetNode, snapCandidate!.handle)
          : { x: reconnectingTerminal.currentX, y: reconnectingTerminal.currentY };

        const res = computeEdgePathToPoint(
          fixedNode,
          fixedHandle,
          targetPoint,
          !isDraggingSource, // if dragging source, fixedNode is target (isSource = false)
          edge.lineType
        );
        reconnectingLivePath = res.pathString;
      }
    }
  }

  const isInfinite = page.preset === 'Infinite';

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={`relative w-full h-full overflow-hidden select-none outline-none transition-colors duration-150 ${
        isDarkMode ? 'bg-slate-950' : 'bg-slate-100'
      } ${
        tool === 'pan' || isPanning
          ? 'cursor-grab active:cursor-grabbing'
          : tool === 'connect'
          ? 'cursor-crosshair'
          : 'cursor-default'
      }`}
      onMouseDown={(e) => {
        // Middle mouse or pan tool triggers pan
        if (e.button === 1 || tool === 'pan') {
          setIsPanning(true);
          panStart.current = { x: e.clientX, y: e.clientY };
          return;
        }

        // Left click on background starts marquee or clears selection
        if (e.button === 0 && e.target === containerRef.current) {
          onClearSelection();
          if (tool === 'select') {
            setMarquee({
              startX: e.clientX,
              startY: e.clientY,
              currentX: e.clientX,
              currentY: e.clientY,
            });
          }
        }
      }}
    >
      {/* Canvas Viewport Container */}
      <div
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
          transformOrigin: '0 0',
        }}
        className="absolute top-0 left-0 transition-transform duration-75 ease-out"
      >
        {/* Academic Page Paper Outline */}
        <div
          style={{
            width: isInfinite ? '4000px' : `${page.width}px`,
            height: isInfinite ? '4000px' : `${page.height}px`,
            backgroundColor:
              page.background && page.background !== '#ffffff'
                ? page.background
                : isDarkMode
                ? '#0f172a'
                : '#ffffff',
          }}
          className={`relative border transition-colors ${
            isDarkMode
              ? 'border-slate-800 shadow-[0_0_35px_rgba(0,0,0,0.6)] text-slate-100'
              : 'border-slate-300 shadow-md text-slate-900'
          }`}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              onClearSelection();
              if (tool === 'select') {
                setMarquee({
                  startX: e.clientX,
                  startY: e.clientY,
                  currentX: e.clientX,
                  currentY: e.clientY,
                });
              }
            }
          }}
        >
          {/* Subtle Grid Dots / Lines SVG Pattern */}
          {page.gridEnabled && (
            <svg
              className="absolute inset-0 pointer-events-none w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern
                  id="canvas-grid-pattern"
                  width={page.gridSize}
                  height={page.gridSize}
                  patternUnits="userSpaceOnUse"
                >
                  <circle
                    cx="1.2"
                    cy="1.2"
                    r="1.2"
                    fill={isDarkMode ? '#334155' : '#cbd5e1'}
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#canvas-grid-pattern)" />
            </svg>
          )}

          {/* Academic Report Figure Caption */}
          {page.figureCaption && (
            <div
              className={`absolute left-0 right-0 px-8 text-center pointer-events-none select-none ${
                page.captionPosition === 'above' ? 'top-4' : 'bottom-5'
              }`}
            >
              <p
                className={`text-sm font-serif italic tracking-wide ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-800'
                }`}
              >
                <span
                  className={`font-bold not-italic mr-2 ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {page.figureNumber || 'Figure 1'} —
                </span>
                {page.figureCaption}
              </p>
            </div>
          )}

          {/* SVG Overlay for Edges, Reconnection, and Markers */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-10">
            <defs>
              <marker
                id="arrowhead"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path
                  d="M 0 1.5 L 10 5 L 0 8.5 z"
                  fill={isDarkMode ? '#94a3b8' : '#334155'}
                />
              </marker>
              <marker
                id="arrowhead-start"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path
                  d="M 0 1.5 L 10 5 L 0 8.5 z"
                  fill={isDarkMode ? '#94a3b8' : '#334155'}
                />
              </marker>
              <marker
                id="arrowhead-cyan"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#38bdf8" />
              </marker>
            </defs>

            {/* Render Diagram Edges */}
            {page.edges.map((edge) => {
              // If this edge is currently being reconnected, hide its static version so live path shows
              if (reconnectingTerminal?.edgeId === edge.id) return null;

              const sNode = nodeMap.get(edge.source);
              const tNode = nodeMap.get(edge.target);
              if (!sNode || !tNode) return null;

              return (
                <g key={edge.id} className="pointer-events-auto">
                  <EdgeRenderer
                    edge={edge}
                    sourceNode={sNode}
                    targetNode={tNode}
                    isSelected={selectedEdgeId === edge.id}
                    onSelect={(id) => onSelectEdge(id)}
                    onUpdateEdge={handleUpdateEdge}
                    onDeleteEdge={handleDeleteEdge}
                    onReverseEdge={handleReverseEdge}
                    onStartTerminalDrag={handleStartTerminalDrag}
                    isDarkMode={isDarkMode}
                  />
                </g>
              );
            })}

            {/* Live New Connection Line Preview */}
            {connectionDraft && (
              <g>
                <path
                  d={draftConnectionPath}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  strokeDasharray="5 4"
                  markerEnd="url(#arrowhead-cyan)"
                  className="animate-[dash_1s_linear_infinite]"
                />
              </g>
            )}

            {/* Live Reconnecting Edge Line Preview */}
            {reconnectingTerminal && (
              <g>
                <path
                  d={reconnectingLivePath}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  strokeDasharray="6 4"
                  markerEnd="url(#arrowhead-cyan)"
                />
                <circle
                  cx={reconnectingTerminal.currentX}
                  cy={reconnectingTerminal.currentY}
                  r={8}
                  fill="#0284c7"
                  stroke="#ffffff"
                  strokeWidth={2}
                  className="animate-pulse"
                />
              </g>
            )}
          </svg>

          {/* Render Diagram Nodes */}
          {page.nodes.map((node) => {
            const isSnapCandidate = snapCandidate?.nodeId === node.id;
            return (
              <NodeRenderer
                key={node.id}
                node={node}
                isSelected={selectedNodeIds.includes(node.id)}
                zoom={transform.zoom}
                onSelect={(id, e) => onSelectNode(id, e.shiftKey || e.ctrlKey || e.metaKey)}
                onDragStart={handleNodeDragStart}
                onResizeStart={handleResizeStart}
                onConnectStart={handleConnectStart}
                onConnectEnd={handleConnectEnd}
                onUpdateText={handleUpdateNodeText}
                onUpdateLabelOffset={handleUpdateLabelOffset}
                onQuickSprout={handleQuickSprout}
                isDarkMode={isDarkMode}
                isConnectToolActive={tool === 'connect'}
                snapHighlightHandle={isSnapCandidate ? snapCandidate.handle : null}
              />
            );
          })}

          {/* Smart Alignment Guide Lines */}
          {activeGuides.map((guide, idx) => {
            if (guide.type === 'vertical') {
              return (
                <div
                  key={`guide-v-${idx}`}
                  style={{
                    position: 'absolute',
                    left: `${guide.position}px`,
                    top: 0,
                    bottom: 0,
                    width: '1px',
                  }}
                  className="border-l border-dashed border-sky-400 pointer-events-none z-40"
                />
              );
            }
            return (
              <div
                key={`guide-h-${idx}`}
                style={{
                  position: 'absolute',
                  top: `${guide.position}px`,
                  left: 0,
                  right: 0,
                  height: '1px',
                }}
                className="border-t border-dashed border-sky-400 pointer-events-none z-40"
              />
            );
          })}
        </div>
      </div>

      {/* Reconnecting / Connecting Floating Hint Banner */}
      {(reconnectingTerminal || connectionDraft) && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="px-4 py-2 rounded-full bg-slate-900/90 text-white text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 border border-sky-500/50">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            <span>
              {reconnectingTerminal
                ? snapCandidate
                  ? `Release to snap to ${nodeMap.get(snapCandidate.nodeId)?.label || 'node'} (${snapCandidate.handle})`
                  : 'Drag terminal and drop onto any node port to reconnect'
                : snapCandidate
                ? `Release to connect to ${nodeMap.get(snapCandidate.nodeId)?.label || 'node'} (${snapCandidate.handle})`
                : 'Drag and release over any target node to create link'}
            </span>
          </div>
        </div>
      )}

      {/* Marquee Selection Drag Box */}
      {marquee && containerRef.current && (
        <div
          style={{
            position: 'absolute',
            left: `${Math.min(marquee.startX, marquee.currentX) - containerRef.current.getBoundingClientRect().left}px`,
            top: `${Math.min(marquee.startY, marquee.currentY) - containerRef.current.getBoundingClientRect().top}px`,
            width: `${Math.abs(marquee.currentX - marquee.startX)}px`,
            height: `${Math.abs(marquee.currentY - marquee.startY)}px`,
          }}
          className="border border-sky-400 bg-sky-500/15 pointer-events-none z-50 rounded-xs"
        />
      )}
    </div>
  );
};
