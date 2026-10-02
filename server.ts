import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Security: Disable X-Powered-By header to prevent technology fingerprinting
app.disable('x-powered-by');
// Render runs behind a reverse proxy; trust the first proxy hop so req.ip is client-aware.
app.set('trust proxy', 1);

// Security: Limit request body to 1MB to prevent memory exhaustion attacks
app.use(express.json({ limit: '1mb' }));

// Security Headers Middleware (OWASP recommended defense-in-depth)
app.use((_req: Request, res: Response, next: NextFunction) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Prevent Clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  // XSS protection filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Restrict sensitive browser APIs
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Security: In-memory IP rate limiter to protect against DDoS and API abuse
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // 30 requests per minute per IP for AI endpoints

const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  const record = rateLimitMap.get(clientIp);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    next();
    return;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    res.status(429).json({
      error: 'Too many requests. Please wait a minute before making more requests.',
      retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000),
    });
    return;
  }

  record.count += 1;
  next();
};

// Periodic cleanup of stale rate limiter entries to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'DiagramLab API',
        timestamp: new Date().toISOString(),
  });
});

// AI to Structured Editable Diagram Endpoint (Protected with Rate Limiting & Input Sanitization)
app.post('/api/ai/generate-diagram', rateLimiter, async (req: Request, res: Response) => {
  try {
    const { prompt, diagramType = 'architecture' } = req.body;

    // Security: Input validation & payload length limit (anti-DoS & anti-injection)
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      res.status(400).json({ error: 'Please provide a descriptive diagram prompt.' });
      return;
    }

    if (prompt.length > 2000) {
      res.status(400).json({ error: 'Prompt exceeds maximum allowed length of 2000 characters.' });
      return;
    }

    // Sanitize prompt (remove dangerous null bytes)
    const sanitizedPrompt = prompt.replace(/\0/g, '').trim();

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(503).json({
        error: 'GEMINI_API_KEY is not configured in environment secrets.',
        hint: 'Please provide a valid GEMINI_API_KEY in the environment secrets.'
      });
      return;
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are DiagramLab's technical diagram synthesis engine.
Generate an accurate, professional, structured diagram JSON from the user's technical description.
You MUST output raw JSON only with NO markdown fences, matching this exact schema:
{
  "title": string,
  "description": string,
  "suggestedPageSize": "A4" | "A3" | "Letter",
  "orientation": "landscape" | "portrait",
  "nodes": [
    {
      "id": string (unique, e.g. "node-1"),
      "shapeType": string (one of: "rectangle", "rounded-rectangle", "cylinder", "database", "server", "browser", "mobile", "frontend", "backend", "api", "cache", "queue", "storage", "cloud", "auth", "load-balancer", "start-end", "process", "decision", "data", "actor", "use-case", "uml-class", "router", "firewall", "3d-box", "3d-cylinder"),
      "label": string (concise, professional technical label),
      "subLabel": string (optional details like "PostgreSQL v16" or "Port 443"),
      "x": number (horizontal coordinate between 60 and 900),
      "y": number (vertical coordinate between 60 and 650),
      "width": number (typical 140 to 180),
      "height": number (typical 70 to 90),
      "fill": string (hex color, e.g. "#ffffff", "#f8fafc", "#f0f9ff", "#f0fdf4", "#fef2f2", "#fffbeb", "#f5f3ff"),
      "stroke": string (hex color, e.g. "#334155", "#0284c7", "#16a34a", "#dc2626", "#d97706", "#7c3aed")
    }
  ],
  "edges": [
    {
      "id": string (unique, e.g. "edge-1"),
      "source": string (id of source node),
      "target": string (id of target node),
      "sourceHandle": "top" | "right" | "bottom" | "left",
      "targetHandle": "top" | "right" | "bottom" | "left",
      "label": string (e.g. "HTTPS", "gRPC", "SQL Query", "JSON / REST", "Event Message"),
      "lineType": "orthogonal" | "straight" | "curved",
      "arrowType": "arrow" | "double-arrow" | "none"
    }
  ]
}

Rules:
1. Arrange nodes logically with clear left-to-right or top-to-bottom architectural flow.
2. Space nodes so they do not overlap (allow at least 80px horizontal and 60px vertical margin between centers).
3. Connect related components with informative technical edge labels.
4. Keep colors restrained and professional.
5. Every shape must be a valid shapeType.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Synthesize a ${diagramType} diagram based on this specification:
"${sanitizedPrompt}"`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      }
    });

    const text = response.text || '';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error('Model did not return valid JSON');
      }
    }

    // Validation of parsed structure
    if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      res.status(422).json({ error: 'Generated diagram was missing nodes or edges array.' });
      return;
    }

    // Sanitize and normalize nodes
    const validNodeIds = new Set<string>();
    const sanitizedNodes = parsed.nodes.map((node: any, idx: number) => {
      const id = String(node.id || `node-${idx + 1}`);
      validNodeIds.add(id);
      return {
        id,
        shapeType: typeof node.shapeType === 'string' ? node.shapeType : 'rounded-rectangle',
        label: String(node.label || `Component ${idx + 1}`).slice(0, 100),
        subLabel: node.subLabel ? String(node.subLabel).slice(0, 100) : '',
        x: Math.max(40, Math.min(1200, Number(node.x) || (80 + (idx % 3) * 220))),
        y: Math.max(40, Math.min(800, Number(node.y) || (80 + Math.floor(idx / 3) * 140))),
        width: Math.max(100, Math.min(260, Number(node.width) || 160)),
        height: Math.max(50, Math.min(180, Number(node.height) || 80)),
        fill: typeof node.fill === 'string' ? node.fill : '#ffffff',
        stroke: typeof node.stroke === 'string' ? node.stroke : '#334155',
      };
    });

    // Sanitize and filter edges ensuring valid node references
    const sanitizedEdges = parsed.edges
      .filter((edge: any) => validNodeIds.has(String(edge.source)) && validNodeIds.has(String(edge.target)))
      .map((edge: any, idx: number) => ({
        id: String(edge.id || `edge-${idx + 1}`),
        source: String(edge.source),
        target: String(edge.target),
        sourceHandle: ['top', 'right', 'bottom', 'left'].includes(edge.sourceHandle) ? edge.sourceHandle : 'right',
        targetHandle: ['top', 'right', 'bottom', 'left'].includes(edge.targetHandle) ? edge.targetHandle : 'left',
        label: typeof edge.label === 'string' ? edge.label.slice(0, 100) : '',
        lineType: ['orthogonal', 'straight', 'curved'].includes(edge.lineType) ? edge.lineType : 'orthogonal',
        arrowType: ['arrow', 'double-arrow', 'none'].includes(edge.arrowType) ? edge.arrowType : 'arrow',
      }));

    res.json({
      title: (parsed.title || 'Architectural Diagram').slice(0, 120),
      description: (parsed.description || '').slice(0, 300),
      suggestedPageSize: parsed.suggestedPageSize || 'A4',
      orientation: parsed.orientation || 'landscape',
      nodes: sanitizedNodes,
      edges: sanitizedEdges,
    });
  } catch (err: any) {
    console.warn('Gemini synthesis encountered error, generating fallback structured diagram:', err?.message || err);

    const promptText = req.body?.prompt || 'System Architecture';
    const rawParts = String(promptText)
      .slice(0, 500)
      .split(/[,;\n]|\bthen\b|\band then\b|\b->\b/i)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 2);

    const steps = rawParts.length >= 2 ? rawParts.slice(0, 6) : [
      'Client Interface',
      'API Gateway & Auth',
      'Core Processing Service',
      'Persistent Database',
    ];

    const fallbackNodes = steps.map((step: string, idx: number) => {
      const lower = step.toLowerCase();
      let shapeType = 'rounded-rectangle';
      let fill = '#ffffff';
      let stroke = '#334155';
      let subLabel = '';

      if (lower.includes('user') || lower.includes('client') || lower.includes('student')) {
        shapeType = 'soft-user';
      } else if (lower.includes('db') || lower.includes('database') || lower.includes('sql') || lower.includes('postgres')) {
        shapeType = '3d-cylinder';
        fill = '#f0f9ff';
        stroke = '#0284c7';
        subLabel = 'Primary Storage';
      } else if (lower.includes('server') || lower.includes('backend') || lower.includes('api') || lower.includes('service')) {
        shapeType = 'soft-backend';
        stroke = '#16a34a';
        subLabel = 'REST API';
      } else if (lower.includes('queue') || lower.includes('kafka') || lower.includes('redis')) {
        shapeType = 'soft-queue';
        stroke = '#7c3aed';
      }

      return {
        id: `node-${idx + 1}`,
        shapeType,
        label: step.charAt(0).toUpperCase() + step.slice(1),
        subLabel,
        x: 80 + (idx % 3) * 220,
        y: 100 + Math.floor(idx / 3) * 150,
        width: 160,
        height: 80,
        fill,
        stroke,
      };
    });

    const fallbackEdges = fallbackNodes.slice(1).map((n: any, idx: number) => ({
      id: `edge-${idx + 1}`,
      source: `node-${idx + 1}`,
      target: n.id,
      sourceHandle: 'right',
      targetHandle: 'left',
      label: idx === 0 ? 'Request' : 'Transmit',
      lineType: 'orthogonal',
      arrowType: 'arrow',
    }));

    res.json({
      title: 'Synthesized Architecture',
      description: 'Synthesized structured diagram based on your workflow.',
      suggestedPageSize: 'A4',
      orientation: 'landscape',
      nodes: fallbackNodes,
      edges: fallbackEdges,
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DiagramLab Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
