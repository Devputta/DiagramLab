import React, { useState } from 'react';
import { DiagramNode, DiagramEdge } from '../../types/diagram';
import { Wand2, Terminal, ArrowRight, Plus, RefreshCw, X, AlertCircle } from 'lucide-react';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySynthesizedDiagram: (
    title: string,
    nodes: DiagramNode[],
    edges: DiagramEdge[],
    mode: 'insert' | 'new-page'
  ) => void;
  isDarkMode?: boolean;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  onApplySynthesizedDiagram,
  isDarkMode = false,
}) => {
  const [prompt, setPrompt] = useState('');
  const [diagramType, setDiagramType] = useState<'architecture' | 'flowchart' | 'pipeline'>('architecture');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<{
    title: string;
    description: string;
    nodes: DiagramNode[];
    edges: DiagramEdge[];
    source: 'gemini-api' | 'local-engine';
  } | null>(null);

  if (!isOpen) return null;

  const EXAMPLE_PROMPTS = [
    {
      title: 'College Event Registration & Attendance',
      type: 'flowchart' as const,
      prompt:
        'Student logs in, browses events, registers for a workshop, backend generates HMAC signed QR code, organizer mobile scanner verifies QR at gate, and attendance database records log.',
    },
    {
      title: 'Cloud Microservices & Kafka Queue',
      type: 'architecture' as const,
      prompt:
        'Client web browser sends API requests through Kong Gateway to Order Service and User Service. Order Service publishes order events to Kafka broker, consumed by Notification Worker and Analytics Service.',
    },
    {
      title: 'E-Commerce Order Processing Pipeline',
      type: 'pipeline' as const,
      prompt:
        'Cart checkout triggers Payment Webhook, verifies credit card via Stripe, updates PostgreSQL inventory, enqueues shipping label task in Redis queue, and delivers PDF invoice to S3.',
    },
  ];

  const handleSynthesize = async () => {
    if (!prompt.trim()) {
      setErrorMsg('Please enter a description of the system or workflow.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      // 1. Attempt server-side Gemini API call
      const response = await fetch('/api/ai/generate-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), diagramType }),
      });

      if (response.ok) {
        const data = await response.json();
        // Normalize nodes into DiagramNode schema
        const synthesizedNodes: DiagramNode[] = data.nodes.map((n: any, idx: number) => ({
          id: n.id || `ai-node-${idx + 1}`,
          type: n.shapeType || 'rounded-rectangle',
          category: diagramType === 'flowchart' ? 'flowchart' : 'software',
          label: n.label,
          subLabel: n.subLabel || '',
          x: Number(n.x) || (80 + (idx % 3) * 220),
          y: Number(n.y) || (100 + Math.floor(idx / 3) * 140),
          width: Number(n.width) || 160,
          height: Number(n.height) || 80,
          fill: n.fill || '#ffffff',
          stroke: n.stroke || '#334155',
          strokeWidth: 2,
          strokeStyle: 'solid',
          zIndex: idx + 1,
        }));

        const synthesizedEdges: DiagramEdge[] = data.edges.map((e: any, idx: number) => ({
          id: e.id || `ai-edge-${idx + 1}`,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle || 'right',
          targetHandle: e.targetHandle || 'left',
          label: e.label || '',
          lineType: e.lineType || 'orthogonal',
          arrowType: e.arrowType || 'arrow',
          stroke: '#334155',
          strokeWidth: 1.5,
          strokeStyle: 'solid',
        }));

        setResult({
          title: data.title || 'Synthesized Diagram',
          description: data.description || 'Generated from your workflow specification.',
          nodes: synthesizedNodes,
          edges: synthesizedEdges,
          source: 'gemini-api',
        });
      } else {
        // Fallback to local semantic graph synthesis engine
        const fallback = synthesizeLocalWorkflow(prompt, diagramType);
        setResult({
          ...fallback,
          source: 'local-engine',
        });
      }
    } catch {
      // Local fallback
      const fallback = synthesizeLocalWorkflow(prompt, diagramType);
      setResult({
        ...fallback,
        source: 'local-engine',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className={`rounded-2xl border shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[85vh] ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b shrink-0 ${
            isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-sky-500" />
            <div>
              <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Diagram Architecture Generator
              </h3>
              <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Generates complete, fully editable visual diagrams from technical workflow descriptions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
          {/* Preset Prompts Pills */}
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
              Quick Technical Prompts
            </span>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_PROMPTS.map((ex, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(ex.prompt);
                    setDiagramType(ex.type);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors text-left border ${
                    isDarkMode
                      ? 'border-slate-800 bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white'
                      : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {ex.title}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                Describe your architecture or workflow
              </label>
              <select
                value={diagramType}
                onChange={(e) => setDiagramType(e.target.value as any)}
                className={`text-[11px] px-2 py-0.5 rounded-lg border outline-none ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-200'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="architecture">Software Architecture</option>
                <option value="flowchart">Process Flowchart</option>
                <option value="pipeline">Data Pipeline</option>
              </select>
            </div>

            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. User submits login credentials to Node.js backend. Service checks JWT against Redis cache, verifies password hash in PostgreSQL, and returns auth token."
              className={`w-full text-xs p-3 rounded-xl border outline-none leading-relaxed font-sans ${
                isDarkMode
                  ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-400 focus:border-sky-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-sky-500'
              }`}
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Results Preview Box */}
          {result && (
            <div className={`p-4 rounded-xl border space-y-3 ${isDarkMode ? 'border-sky-500/40 bg-sky-950/30' : 'border-sky-200 bg-sky-50/50'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`font-bold text-xs ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{result.title}</h4>
                  <p className={`text-[11px] mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{result.description}</p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded">
                  {result.source === 'gemini-api' ? 'Gemini 3.8 Flash' : 'Semantic Engine'}
                </span>
              </div>

              {/* Stats badges */}
              <div className={`flex items-center gap-3 text-[11px] ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                <span>
                  <strong>{result.nodes.length}</strong> editable shapes created
                </span>
                <span>·</span>
                <span>
                  <strong>{result.edges.length}</strong> vector connectors linked
                </span>
              </div>

              {/* Node preview chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {result.nodes.map((n) => (
                  <span
                    key={n.id}
                    className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    {n.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-5 py-3 border-t flex items-center justify-between shrink-0 ${
            isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <span className="text-[11px] text-slate-400">
            Never generates static images — outputs 100% editable nodes.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Cancel
            </button>

            {!result ? (
              <button
                onClick={handleSynthesize}
                disabled={isLoading}
                className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors shadow-xs flex items-center gap-1.5"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5 text-white" />
                    <span>Generate Diagram</span>
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    onApplySynthesizedDiagram(result.title, result.nodes, result.edges, 'new-page');
                    onClose();
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    isDarkMode ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insert as New Page</span>
                </button>
                <button
                  onClick={() => {
                    onApplySynthesizedDiagram(result.title, result.nodes, result.edges, 'insert');
                    onClose();
                  }}
                  className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <span>Insert to Canvas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Deterministic semantic workflow synthesis engine for offline/fallback use
function synthesizeLocalWorkflow(
  prompt: string,
  diagramType: 'architecture' | 'flowchart' | 'pipeline'
): { title: string; description: string; nodes: DiagramNode[]; edges: DiagramEdge[] } {
  // Parse steps by delimiters like commas, "then", "->", "and"
  const rawParts = prompt
    .split(/[,;\n]|\bthen\b|\band then\b|\b->\b/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  const steps = rawParts.length >= 2 ? rawParts.slice(0, 7) : [
    'User Action Entry',
    'Authentication & Validation',
    'Core Processing Service',
    'Database Storage & Log',
  ];

  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];

  const startX = 80;
  const startY = 160;
  const stepX = 220;

  steps.forEach((step, idx) => {
    const id = `node-ai-${idx + 1}`;
    let shapeType = 'rounded-rectangle';
    let fill = '#ffffff';
    let stroke = '#334155';
    let subLabel = '';

    const lower = step.toLowerCase();
    if (lower.includes('user') || lower.includes('client') || lower.includes('student')) {
      shapeType = 'soft-user';
      stroke = '#334155';
    } else if (lower.includes('db') || lower.includes('database') || lower.includes('sql') || lower.includes('postgres')) {
      shapeType = '3d-cylinder';
      fill = '#f0f9ff';
      stroke = '#0284c7';
      subLabel = 'Persistent Storage';
    } else if (lower.includes('server') || lower.includes('backend') || lower.includes('api') || lower.includes('service')) {
      shapeType = 'soft-backend';
      fill = '#ffffff';
      stroke = '#16a34a';
      subLabel = 'Core Engine';
    } else if (lower.includes('queue') || lower.includes('kafka') || lower.includes('redis') || lower.includes('bus')) {
      shapeType = 'soft-queue';
      fill = '#faf5ff';
      stroke = '#7c3aed';
    } else if (diagramType === 'flowchart' && idx === 0) {
      shapeType = 'flow-start-end';
      fill = '#f1f5f9';
      stroke = '#0f172a';
    } else if (diagramType === 'flowchart' && idx === steps.length - 1) {
      shapeType = 'flow-start-end';
      fill = '#f1f5f9';
      stroke = '#0f172a';
    } else if (diagramType === 'flowchart' && (lower.includes('check') || lower.includes('if') || lower.includes('valid'))) {
      shapeType = 'flow-decision';
      fill = '#ffffff';
      stroke = '#d97706';
    }

    nodes.push({
      id,
      type: shapeType as any,
      category: diagramType === 'flowchart' ? 'flowchart' : 'software',
      label: step.charAt(0).toUpperCase() + step.slice(1),
      subLabel,
      x: startX + (idx % 4) * stepX,
      y: startY + Math.floor(idx / 4) * 160,
      width: 160,
      height: 75,
      fill,
      stroke,
      strokeWidth: 2,
      strokeStyle: 'solid',
      zIndex: idx + 1,
    });

    if (idx > 0) {
      const prevId = `node-ai-${idx}`;
      edges.push({
        id: `edge-ai-${idx}`,
        source: prevId,
        target: id,
        sourceHandle: 'right',
        targetHandle: 'left',
        label: idx === 1 ? 'Invoke' : 'Transmit',
        lineType: 'orthogonal',
        arrowType: 'arrow',
        stroke: '#334155',
        strokeWidth: 1.5,
        strokeStyle: 'solid',
      });
    }
  });

  return {
    title: 'Synthesized Architecture',
    description: `Structured sequence of ${nodes.length} connected technical operations.`,
    nodes,
    edges,
  };
}
