import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DiagramPage, DiagramNode, DiagramEdge } from '../types/diagram';
import { computeEdgePath, computeBoundingBox, shouldRenderLabelUnderShape } from './geometry';
import { RenderShapeSvg } from '../shapes/renderers';

export interface ExportOptions {
  format?: 'svg' | 'png' | 'pdf' | 'json';
  scale?: 1 | 2 | 3;
  background?: 'white' | 'transparent';
  cropToDiagram?: boolean;
  includeAcademicCaption?: boolean;
  filename?: string;
}

export function buildStandaloneSvgString(
  page: DiagramPage,
  options: {
    background?: 'white' | 'transparent';
    cropToDiagram?: boolean;
    includeAcademicCaption?: boolean;
  } = {}
): string {
  const { width, height, nodes, edges, figureNumber, figureCaption, captionPosition } = page;
  const isTransparent = options.background !== 'white'; // Default to transparent (no background)
  const cropToDiagram = options.cropToDiagram !== false; // Default to true (only diagram!)
  const includeCaption = options.includeAcademicCaption && figureCaption && !cropToDiagram;

  const visibleNodes = nodes.filter((n) => !n.hidden);

  let exportWidth = width;
  let exportHeight = height;
  let offsetX = 0;
  let offsetY = 0;

  if (cropToDiagram && visibleNodes.length > 0) {
    const bbox = computeBoundingBox(visibleNodes);
    const padding = 28; // tight neat padding around only the diagram components
    exportWidth = Math.max(80, Math.round(bbox.width + padding * 2));
    exportHeight = Math.max(60, Math.round(bbox.height + padding * 2));
    offsetX = -bbox.minX + padding;
    offsetY = -bbox.minY + padding;
  } else if (includeCaption) {
    const captionHeight = 48;
    exportHeight = height + captionHeight;
    offsetY = captionPosition === 'above' ? captionHeight : 0;
  }

  // Arrow markers and styles
  const defs = `
    <defs>
      <marker id="dl-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#334155" />
      </marker>
      <marker id="dl-arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#0284c7" />
      </marker>
      <marker id="dl-circle" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6">
        <circle cx="5" cy="5" r="3.5" fill="#334155" />
      </marker>
      <style>
        .dl-text { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
        .dl-caption { font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; }
      </style>
    </defs>
  `;

  // Background rect - OMITTED when transparent or diagram only!
  const bg = isTransparent
    ? ''
    : `<rect width="${exportWidth}" height="${exportHeight}" fill="${page.background || '#ffffff'}" />`;

  // Render Edges
  const nodeMap = new Map<string, DiagramNode>(nodes.map((n) => [n.id, n]));
  const edgesSvg = edges
    .map((edge: DiagramEdge) => {
      const sNode = nodeMap.get(edge.source);
      const tNode = nodeMap.get(edge.target);
      if (!sNode || !tNode) return '';

      const { pathString, labelPoint } = computeEdgePath(edge, sNode, tNode);
      const dash =
        edge.strokeStyle === 'dashed'
          ? 'stroke-dasharray="6,4"'
          : edge.strokeStyle === 'dotted'
          ? 'stroke-dasharray="2,3"'
          : '';
      const markerEnd = edge.arrowType !== 'none' ? 'marker-end="url(#dl-arrow)"' : '';
      const markerStart =
        edge.arrowType === 'double-arrow' ? 'marker-start="url(#dl-arrow)"' : '';

      let labelSvg = '';
      if (edge.label) {
        const textW = Math.max(40, edge.label.length * 7.5 + 16);
        labelSvg = `
          <g transform="translate(${labelPoint.x + offsetX}, ${labelPoint.y + offsetY})">
            <rect x="${-textW / 2}" y="-10" width="${textW}" height="20" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
            <text class="dl-text" x="0" y="4" text-anchor="middle" font-size="11" fill="#334155" font-weight="600">${escapeXml(edge.label)}</text>
          </g>
        `;
      }

      return `
        <g class="dl-edge">
          <path d="${pathString}" fill="none" stroke="${edge.stroke || '#334155'}" stroke-width="${edge.strokeWidth || 1.5}" ${dash} ${markerEnd} ${markerStart} transform="translate(${offsetX}, ${offsetY})" />
          ${labelSvg}
        </g>
      `;
    })
    .join('\n');

  // Render Nodes with 100% precision shape geometry using RenderShapeSvg
  const nodesSvg = visibleNodes
    .sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1))
    .map((node: DiagramNode) => {
      const nodeX = node.x + offsetX;
      const nodeY = node.y + offsetY;
      const w = node.width;
      const h = node.height;

      // Render accurate SVG vector geometry
      const shapeMarkup = renderToStaticMarkup(React.createElement(RenderShapeSvg, { node }));

      // Text labels (positioned under shapes or inside, with draggable offsets)
      const hasSub = Boolean(node.subLabel);
      const isUnderShape = shouldRenderLabelUnderShape(node);
      const isAboveShape = node.labelPosition === 'top';
      const offX = node.labelOffsetX || 0;
      const offY = node.labelOffsetY || 0;

      const textX = w / 2 + offX;
      let mainY = 0;
      let subY = 0;

      if (isUnderShape) {
        mainY = h + 15 + offY;
        subY = h + 29 + offY;
      } else if (isAboveShape) {
        mainY = (hasSub ? -18 : -8) + offY;
        subY = -6 + offY;
      } else {
        mainY = (hasSub ? h / 2 - 4 : h / 2 + 4) + offY;
        subY = h / 2 + 14 + offY;
      }

      const textSvg = `
        <text class="dl-text" x="${textX}" y="${mainY}" text-anchor="middle" font-size="${node.fontSize || 12}" font-weight="${node.fontWeight === 'bold' ? '700' : '600'}" fill="${node.textColor || '#0f172a'}">${escapeXml(node.label)}</text>
        ${hasSub ? `<text class="dl-text" x="${textX}" y="${subY}" text-anchor="middle" font-size="10.5" font-weight="400" fill="#64748b">${escapeXml(node.subLabel || '')}</text>` : ''}
      `;

      return `
        <g class="dl-node" transform="translate(${nodeX}, ${nodeY})">
          ${shapeMarkup}
          ${textSvg}
        </g>
      `;
    })
    .join('\n');

  // Academic Caption (Only when exporting full paper)
  let captionSvg = '';
  if (includeCaption) {
    const captionY = captionPosition === 'above' ? 32 : height + 32;
    captionSvg = `
      <g class="dl-academic-caption" transform="translate(${width / 2}, ${captionY})">
        <text class="dl-caption" text-anchor="middle" font-size="14" fill="#0f172a" font-style="italic">
          <tspan font-weight="bold" font-style="normal">${escapeXml(figureNumber || 'Figure 1')} — </tspan>
          ${escapeXml(figureCaption || '')}
        </text>
      </g>
    `;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${exportWidth}" height="${exportHeight}" viewBox="0 0 ${exportWidth} ${exportHeight}">
  ${defs}
  ${bg}
  ${edgesSvg}
  ${nodesSvg}
  ${captionSvg}
</svg>`;
}

// Download Vector SVG (Diagram only without background by default)
export function downloadSvg(
  page: DiagramPage,
  options?: {
    filename?: string;
    background?: 'white' | 'transparent';
    cropToDiagram?: boolean;
  }
) {
  const background = options?.background ?? 'transparent';
  const cropToDiagram = options?.cropToDiagram ?? true;
  const filename = options?.filename || `${page.name || 'diagram'}-diagram`;

  const svgStr = buildStandaloneSvgString(page, {
    background,
    cropToDiagram,
    includeAcademicCaption: false,
  });

  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Download High-DPI PNG (Diagram only without background by default)
export async function downloadPng(
  page: DiagramPage,
  options?: {
    scale?: 1 | 2 | 3;
    background?: 'white' | 'transparent';
    cropToDiagram?: boolean;
    filename?: string;
  }
): Promise<void> {
  const scale = options?.scale ?? 2;
  const background = options?.background ?? 'transparent';
  const cropToDiagram = options?.cropToDiagram ?? true;
  const filename = options?.filename || `${page.name || 'diagram'}-diagram`;

  const svgStr = buildStandaloneSvgString(page, {
    background,
    cropToDiagram,
    includeAcademicCaption: false,
  });

  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not obtain canvas context');

        if (background === 'white') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create PNG blob'));
            return;
          }
          const pngUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = pngUrl;
          a.download = `${filename}-${scale}x.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(pngUrl);
          resolve();
        }, 'image/png');
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to render SVG image to Canvas for PNG export'));
    };

    img.src = url;
  });
}

// 1-Click Copy Transparent PNG to Clipboard (Only diagram, without background)
export async function copyPngToClipboard(
  page: DiagramPage,
  options?: {
    scale?: number;
    background?: 'transparent' | 'white';
    cropToDiagram?: boolean;
  }
): Promise<boolean> {
  const scale = options?.scale ?? 2;
  const background = options?.background ?? 'transparent'; // No background!
  const cropToDiagram = options?.cropToDiagram ?? true; // Only diagram!

  const svgStr = buildStandaloneSvgString(page, {
    background,
    cropToDiagram,
    includeAcademicCaption: false,
  });

  return new Promise((resolve) => {
    const img = new Image();
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve(false);
          return;
        }

        if (background === 'white') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        canvas.toBlob(async (blob) => {
          if (!blob) {
            resolve(false);
            return;
          }
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob }),
            ]);
            resolve(true);
          } catch (clipErr) {
            console.warn('Clipboard write error:', clipErr);
            // Fallback: Copy SVG text
            try {
              await navigator.clipboard.writeText(svgStr);
              resolve(true);
            } catch {
              resolve(false);
            }
          }
        }, 'image/png');
      } catch (err) {
        URL.revokeObjectURL(url);
        resolve(false);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };

    img.src = url;
  });
}

// 1-Click Copy SVG Code to Clipboard (Only diagram, without background)
export async function copySvgToClipboard(
  page: DiagramPage,
  options?: { cropToDiagram?: boolean; background?: 'transparent' | 'white' }
): Promise<boolean> {
  const svgStr = buildStandaloneSvgString(page, {
    background: options?.background ?? 'transparent',
    cropToDiagram: options?.cropToDiagram ?? true,
    includeAcademicCaption: false,
  });

  try {
    await navigator.clipboard.writeText(svgStr);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

// Academic PDF Print
export function printAcademicPdf(page: DiagramPage) {
  const svgStr = buildStandaloneSvgString(page, {
    background: 'white',
    cropToDiagram: false,
    includeAcademicCaption: true,
  });

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to open the academic report print dialog.');
    return;
  }

  const orientation = page.orientation || 'landscape';
  const size = page.preset === 'Infinite' || page.preset === 'Custom' ? 'A4' : page.preset;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${escapeXml(page.figureNumber || 'Figure')} - ${escapeXml(page.figureCaption || page.name)}</title>
        <style>
          @page {
            size: ${size} ${orientation};
            margin: 15mm;
          }
          body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .svg-container {
            width: 100%;
            max-width: 100%;
            height: auto;
            text-align: center;
          }
          svg {
            max-width: 100%;
            height: auto;
          }
        </style>
      </head>
      <body>
        <div class="svg-container">
          ${svgStr}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
