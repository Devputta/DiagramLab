import React from 'react';
import {
  FileText,
  Box,
  ArrowRight,
  GitBranch,
  Sparkles,
  Github,
  Sun,
  Moon,
} from 'lucide-react';
import { TEMPLATE_CATALOG } from '../../templates/catalog';
import { DiagramLabLogo } from '../common/DiagramLabLogo';

interface LandingViewProps {
  onOpenEditor: () => void;
  onOpenDashboard: () => void;
  onSelectTemplate: (templateId: string) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onOpenEditor,
  onOpenDashboard,
  onSelectTemplate,
  isDarkMode = false,
  onToggleDarkMode,
}) => {
  return (
    <div
      className={`min-h-screen font-sans flex flex-col transition-colors ${
        isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
      }`}
    >
      {/* Top Header */}
      <header
        className={`h-14 border-b px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 transition-colors ${
          isDarkMode ? 'border-slate-800 bg-slate-900/95 backdrop-blur-md' : 'border-slate-200 bg-white'
        }`}
      >
        <DiagramLabLogo size="md" showSubtitle isDarkMode={isDarkMode} />

        <div className="flex items-center gap-3">
          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              className={`p-1.5 rounded-lg border text-xs font-semibold transition-all ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-750'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
              }`}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          )}

          <a
            href="https://github.com/Devputta/DiagramLab.git"
            target="_blank"
            rel="noopener noreferrer"
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors shadow-2xs flex items-center gap-1.5 ${
              isDarkMode
                ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-750'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title="DiagramLab Repository on GitHub"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>
          <button
            onClick={onOpenDashboard}
            className={`text-xs font-medium px-3 py-1.5 rounded transition-colors ${
              isDarkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Projects
          </button>
          <button
            onClick={onOpenEditor}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-500 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <span>Launch Canvas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12 space-y-16">
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto space-y-5">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full border text-xs font-medium shadow-2xs ${
              isDarkMode
                ? 'border-slate-800 bg-slate-900 text-slate-300'
                : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Human-first technical diagrams for software architectures & reports</span>
          </div>

          <h1
            className={`text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            Real objects. Editable connectors. <br />
            <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
              Precision Architecture Engine.
            </span>
          </h1>

          <p className={`text-base leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            DiagramLab is a high-precision diagram and flowchart editor. Build technical architectures,
            flowcharts, UML diagrams, and database schemas with interactive reconnection, snap handles,
            and publication-ready export for academic papers and production teams.
          </p>

          <div className="flex items-center justify-center gap-3 pt-3">
            <button
              onClick={onOpenEditor}
              className="px-6 py-3 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-500 transition-all shadow-md flex items-center gap-2"
            >
              <span>Open Diagram Canvas</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenDashboard}
              className={`px-6 py-3 rounded-xl border font-semibold text-sm transition-colors ${
                isDarkMode
                  ? 'border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-850'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Browse Templates & Projects
            </button>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            className={`p-6 rounded-2xl border shadow-2xs space-y-3 ${
              isDarkMode ? 'border-slate-800 bg-slate-900 text-slate-200' : 'border-slate-200 bg-white'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Academic & Tech Reports
            </h3>
            <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Format diagrams directly for standard A4, Letter, and A3 documents with IEEE/ACM-compliant
              figure numbering, captions, and publication-ready vector exports.
            </p>
          </div>

          <div
            className={`p-6 rounded-2xl border shadow-2xs space-y-3 ${
              isDarkMode ? 'border-slate-800 bg-slate-900 text-slate-200' : 'border-slate-200 bg-white'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <GitBranch className="w-5 h-5" />
            </div>
            <h3 className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Interactive Flow & Reconnect
            </h3>
            <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Easily connect nodes with live smart guides, drag terminal handles to reconnect any edge,
              swap directions, and customize orthogonal, curved, or straight line routes.
            </p>
          </div>

          <div
            className={`p-6 rounded-2xl border shadow-2xs space-y-3 ${
              isDarkMode ? 'border-slate-800 bg-slate-900 text-slate-200' : 'border-slate-200 bg-white'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Box className="w-5 h-5" />
            </div>
            <h3 className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Over 50 Architecture Shapes
            </h3>
            <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Comprehensive shape library including Microservices, Cloud, Databases, UML classes, Network
              nodes, and 3D isometric platforms crafted with pure SVG vector geometry.
            </p>
          </div>
        </section>

        {/* Featured Templates Showcase */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Report-Ready Templates
              </h2>
              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Start from vetted computer science project baselines
              </p>
            </div>
            <button
              onClick={onOpenDashboard}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
            >
              View All Templates <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TEMPLATE_CATALOG.slice(0, 3).map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => onSelectTemplate(tpl.id)}
                className={`group p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isDarkMode
                    ? 'border-slate-800 bg-slate-900 hover:border-sky-500 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-sky-500 hover:shadow-xs'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${
                        isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tpl.category}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {tpl.preset} {tpl.orientation}
                    </span>
                  </div>
                  <h3
                    className={`font-bold text-sm transition-colors ${
                      isDarkMode ? 'text-white group-hover:text-sky-400' : 'text-slate-900 group-hover:text-sky-700'
                    }`}
                  >
                    {tpl.name}
                  </h3>
                  <p className={`text-xs leading-relaxed line-clamp-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {tpl.description}
                  </p>
                </div>

                <div
                  className={`pt-4 border-t mt-4 flex items-center justify-between text-xs ${
                    isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'
                  }`}
                >
                  <span className="font-serif italic text-[11px] truncate max-w-[200px]">
                    {tpl.figureNumber}
                  </span>
                  <span className="font-medium text-sky-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Use <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI Synthesis Notice */}
        <section
          className={`p-6 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            isDarkMode
              ? 'border-slate-800 bg-slate-900/80 text-slate-200'
              : 'border-slate-200 bg-slate-100/70 text-slate-800'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <h3 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                AI Architecture Synthesis
              </h3>
            </div>
            <p className={`text-xs max-w-2xl leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Describe your system architecture in plain English. The AI engine synthesizes real editable vector
              nodes and connected edges into your canvas — never static raster images or flattened diagrams.
            </p>
          </div>
          <button
            onClick={onOpenEditor}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 shadow-2xs ${
              isDarkMode
                ? 'bg-slate-800 border border-slate-700 text-white hover:bg-slate-750'
                : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-50'
            }`}
          >
            Try in Canvas
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer
        className={`border-t py-6 px-6 text-center text-xs transition-colors ${
          isDarkMode ? 'border-slate-800 bg-slate-900 text-slate-400' : 'border-slate-200 bg-white text-slate-500'
        }`}
      >
        <p>DiagramLab — Professional Visual Diagram & Architecture Flow Engine</p>
      </footer>
    </div>
  );
};
