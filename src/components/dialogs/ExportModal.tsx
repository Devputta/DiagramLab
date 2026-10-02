import React, { useState } from 'react';
import { DiagramPage, DiagramProject } from '../../types/diagram';
import {
  downloadSvg,
  downloadPng,
  printAcademicPdf,
  copyPngToClipboard,
  copySvgToClipboard,
} from '../../lib/export';
import { exportProjectToJsonFile } from '../../lib/storage';
import {
  Download,
  FileCode2,
  Image,
  Printer,
  FileJson,
  X,
  Check,
  Copy,
  Sparkles,
  Crop,
} from 'lucide-react';

interface ExportModalProps {
  page: DiagramPage;
  project: DiagramProject;
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  page,
  project,
  isOpen,
  onClose,
  isDarkMode = false,
}) => {
  const [format, setFormat] = useState<'svg' | 'png' | 'pdf' | 'json'>('svg');
  const [cropToDiagramOnly, setCropToDiagramOnly] = useState(true); // Default: ONLY diagram, without background!
  const [pngScale, setPngScale] = useState<1 | 2 | 3>(2);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [copiedType, setCopiedType] = useState<'png' | 'svg' | null>(null);

  if (!isOpen) return null;

  const handleCopyPng = async () => {
    const ok = await copyPngToClipboard(page, {
      scale: pngScale,
      background: 'transparent',
      cropToDiagram: cropToDiagramOnly,
    });
    if (ok) {
      setCopiedType('png');
      setTimeout(() => setCopiedType(null), 2500);
    }
  };

  const handleCopySvg = async () => {
    const ok = await copySvgToClipboard(page, {
      background: 'transparent',
      cropToDiagram: cropToDiagramOnly,
    });
    if (ok) {
      setCopiedType('svg');
      setTimeout(() => setCopiedType(null), 2500);
    }
  };

  const handleExecuteExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      const filename = `${project.name}-${page.name}-diagram`;

      if (format === 'svg') {
        downloadSvg(page, {
          filename,
          background: cropToDiagramOnly ? 'transparent' : 'white',
          cropToDiagram: cropToDiagramOnly,
        });
      } else if (format === 'png') {
        await downloadPng(page, {
          scale: pngScale,
          background: cropToDiagramOnly ? 'transparent' : 'white',
          cropToDiagram: cropToDiagramOnly,
          filename,
        });
      } else if (format === 'pdf') {
        printAcademicPdf(page);
      } else if (format === 'json') {
        exportProjectToJsonFile(project);
      }

      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
      }, 2500);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className={`rounded-2xl border shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100 ${
          isDarkMode
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${
            isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-sky-400" />
            <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Export / Copy Diagram
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDarkMode
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 text-xs">
          {/* Quick Copy to Clipboard Section */}
          <div
            className={`p-3.5 rounded-xl border space-y-2.5 ${
              isDarkMode ? 'bg-slate-850 border-slate-700/80' : 'bg-sky-50/60 border-sky-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`font-bold text-xs flex items-center gap-1.5 ${isDarkMode ? 'text-sky-300' : 'text-sky-900'}`}>
                <Copy className="w-3.5 h-3.5" />
                <span>1-Click Copy (Diagram Only, No Background)</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-500 font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10">
                Transparent
              </span>
            </div>
            <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Instantly copies the diagram without canvas background so you can paste directly into Docs, Slack, Notion, Word, or Figma.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleCopyPng}
                className={`py-2 px-3 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                  copiedType === 'png'
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750 hover:text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {copiedType === 'png' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied PNG!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-sky-400" />
                    <span>Copy PNG Image</span>
                  </>
                )}
              </button>

              <button
                onClick={handleCopySvg}
                className={`py-2 px-3 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                  copiedType === 'svg'
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750 hover:text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {copiedType === 'svg' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied SVG!</span>
                  </>
                ) : (
                  <>
                    <FileCode2 className="w-3.5 h-3.5 text-sky-400" />
                    <span>Copy SVG Code</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Diagram Only / Background Mode Toggle */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
              cropToDiagramOnly
                ? isDarkMode
                  ? 'border-sky-500/60 bg-sky-950/20'
                  : 'border-sky-400 bg-sky-50/50'
                : isDarkMode
                ? 'border-slate-800 bg-slate-850'
                : 'border-slate-200 bg-slate-50'
            }`}
            onClick={() => setCropToDiagramOnly((prev) => !prev)}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  cropToDiagramOnly ? 'bg-sky-500 text-white' : 'bg-slate-700 text-slate-300'
                }`}
              >
                <Crop className="w-4 h-4" />
              </div>
              <div>
                <span className={`font-bold block text-xs ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Only Diagram (Without Background)
                </span>
                <span className="text-[11px] text-slate-400">
                  Crops tightly around shapes with clean transparent background
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={cropToDiagramOnly}
              onChange={(e) => setCropToDiagramOnly(e.target.checked)}
              className="w-4 h-4 rounded text-sky-500 cursor-pointer"
            />
          </div>

          {/* Format Selection Cards */}
          <div>
            <label className={`text-[11px] font-bold uppercase tracking-wider mb-2 block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Download File Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              {/* SVG */}
              <button
                onClick={() => setFormat('svg')}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  format === 'svg'
                    ? 'border-sky-500 bg-sky-500/10 shadow-xs'
                    : isDarkMode
                    ? 'border-slate-800 bg-slate-850 hover:border-slate-700'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <FileCode2 className={`w-4 h-4 ${format === 'svg' ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                    isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}>
                    Vector
                  </span>
                </div>
                <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  SVG Vector
                </span>
                <span className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Scalable vector, no quality loss
                </span>
              </button>

              {/* PNG */}
              <button
                onClick={() => setFormat('png')}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  format === 'png'
                    ? 'border-sky-500 bg-sky-500/10 shadow-xs'
                    : isDarkMode
                    ? 'border-slate-800 bg-slate-850 hover:border-slate-700'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Image className={`w-4 h-4 ${format === 'png' ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                    isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}>
                    PNG Image
                  </span>
                </div>
                <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  PNG Image
                </span>
                <span className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Transparent alpha background
                </span>
              </button>

              {/* PDF */}
              <button
                onClick={() => setFormat('pdf')}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  format === 'pdf'
                    ? 'border-sky-500 bg-sky-500/10 shadow-xs'
                    : isDarkMode
                    ? 'border-slate-800 bg-slate-850 hover:border-slate-700'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Printer className={`w-4 h-4 ${format === 'pdf' ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                    isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}>
                    Print
                  </span>
                </div>
                <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Academic PDF
                </span>
                <span className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Print layout with report caption
                </span>
              </button>

              {/* JSON */}
              <button
                onClick={() => setFormat('json')}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  format === 'json'
                    ? 'border-sky-500 bg-sky-500/10 shadow-xs'
                    : isDarkMode
                    ? 'border-slate-800 bg-slate-850 hover:border-slate-700'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <FileJson className={`w-4 h-4 ${format === 'json' ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                    isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}>
                    Backup
                  </span>
                </div>
                <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  JSON Workspace
                </span>
                <span className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Complete editable project file
                </span>
              </button>
            </div>
          </div>

          {/* Options for PNG */}
          {format === 'png' && (
            <div className={`p-3 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Resolution Density:
              </span>
              <div className="flex gap-1">
                {[1, 2, 3].map((scale) => (
                  <button
                    key={scale}
                    onClick={() => setPngScale(scale as any)}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors ${
                      pngScale === scale
                        ? 'bg-sky-600 text-white font-bold'
                        : isDarkMode
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-white border text-slate-600'
                    }`}
                  >
                    {scale}x
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Download Action Button */}
          <div className="pt-2">
            <button
              onClick={handleExecuteExport}
              disabled={isExporting}
              className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
            >
              {exportSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Download Complete!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>
                    {isExporting
                      ? 'Generating file...'
                      : `Download ${format.toUpperCase()} ${cropToDiagramOnly ? '(Without Background)' : ''}`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
