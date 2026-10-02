import React from 'react';

interface DiagramLabLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
  isDarkMode?: boolean;
}

export const DiagramLabLogo: React.FC<DiagramLabLogoProps> = ({
  size = 'md',
  showSubtitle = false,
  className = '',
  isDarkMode = false,
}) => {
  const iconSize = size === 'sm' ? 28 : size === 'lg' ? 44 : 36;
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-xl' : 'text-sm';
  const subtitleSize = size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-xs' : 'text-[10px]';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Geometric Technical Icon */}
      <div
        style={{ width: iconSize, height: iconSize }}
        className="relative rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-sm bg-gradient-to-br from-slate-900 via-slate-850 to-sky-950 border border-slate-700/50 group"
      >
        {/* Subtle grid backdrop inside icon */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:6px_6px]" />

        {/* Technical Flow & Node SVG Glyph */}
        <svg
          width={iconSize - 6}
          height={iconSize - 6}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
        >
          <defs>
            <linearGradient id="logo-line-grad" x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" />
              <stop offset="0.5" stopColor="#0284c7" />
              <stop offset="1" stopColor="#06b6d4" />
            </linearGradient>
            <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Orthogonal Architecture Bus Line */}
          <path
            d="M 8 10 L 8 18 Q 8 22 12 22 L 22 22"
            stroke="url(#logo-line-grad)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Branch connector */}
          <path
            d="M 8 15 L 20 15 Q 24 15 24 11 L 24 10"
            stroke="#38bdf8"
            strokeWidth="1.6"
            strokeDasharray="2 2"
            strokeLinecap="round"
            strokeOpacity="0.8"
          />

          {/* Source Node: Client / Microservice */}
          <rect
            x="5"
            y="5"
            width="7"
            height="7"
            rx="2"
            fill="#0ea5e9"
            stroke="#e0f2fe"
            strokeWidth="1.5"
          />

          {/* Branch Node: Gateway */}
          <circle cx="24" cy="8" r="3" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.2" />

          {/* Target Terminal: Database / Cloud Cluster */}
          <rect
            x="20"
            y="18"
            width="8"
            height="8"
            rx="2.5"
            fill="#0284c7"
            stroke="#38bdf8"
            strokeWidth="1.5"
          />

          {/* Data dot flow indicator */}
          <circle cx="16" cy="22" r="1.8" fill="#38bdf8" filter="url(#logo-glow)" />
        </svg>
      </div>

      {/* Brand Wordmark & High-Tech Badge */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={`font-extrabold tracking-tight transition-colors ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            } ${textSize}`}
          >
            Diagram<span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">Lab</span>
          </span>
          <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-md font-bold bg-sky-500/10 text-sky-400 border border-sky-400/30">
            FLOW
          </span>
        </div>
        {showSubtitle && (
          <span
            className={`font-medium tracking-tight mt-0.5 transition-colors ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            } ${subtitleSize}`}
          >
            Visual Architecture & Diagram Engine
          </span>
        )}
      </div>
    </div>
  );
};
