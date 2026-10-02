import React from 'react';
import { DiagramNode } from '../types/diagram';

interface ShapeSvgProps {
  node: DiagramNode;
}

export function RenderShapeSvg({ node }: ShapeSvgProps) {
  const {
    type,
    width,
    height,
    fill,
    stroke,
    strokeWidth,
    strokeStyle,
    cornerRadius = 6,
    opacity = 1,
    is3D,
    depth3D = 12,
  } = node;

  const strokeDash =
    strokeStyle === 'dashed' ? '6 4' : strokeStyle === 'dotted' ? '2 3' : undefined;

  // 3D Extrusion Helpers
  // If node.is3D is active or if the node type is inherently 3d
  const effective3D = is3D || type.startsWith('3d-');
  const d = Math.max(4, Math.min(30, depth3D));

  // Compute a slightly darker/tinted color for the 3D depth face
  const depthFill = getDarkenedColor(fill, 0.18);
  const topDepthFill = getDarkenedColor(fill, 0.08);

  switch (type) {
    // ==========================================
    // 3D TECHNICAL SHAPES (VECTOR FACES)
    // ==========================================
    case '3d-box': {
      // Isometric technical box with top face, side face, front face
      return (
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible"
          style={{ opacity }}
        >
          {/* Subtle drop shadow */}
          <polygon
            points={`${d},${height} ${width},${height} ${width + d * 0.7},${height + d * 0.5} ${d * 1.5},${height + d * 0.5}`}
            fill="#000000"
            fillOpacity="0.08"
          />
          {/* Top Face */}
          <polygon
            points={`0,${d} ${d},0 ${width},0 ${width - d},${d}`}
            fill={topDepthFill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
            strokeLinejoin="round"
          />
          {/* Right Side Face */}
          <polygon
            points={`${width - d},${d} ${width},0 ${width},${height - d} ${width - d},${height}`}
            fill={depthFill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
            strokeLinejoin="round"
          />
          {/* Front Face */}
          <rect
            x={0}
            y={d}
            width={width - d}
            height={height - d}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
            rx={2}
          />
          {/* Technical server line vents */}
          <line
            x1={12}
            y1={d + 16}
            x2={width - d - 12}
            y2={d + 16}
            stroke={stroke}
            strokeWidth={1}
            strokeOpacity={0.25}
          />
          <circle cx={14} cy={d + 8} r={2} fill={stroke} fillOpacity={0.4} />
          <circle cx={22} cy={d + 8} r={2} fill={stroke} fillOpacity={0.4} />
        </svg>
      );
    }

    case '3d-cylinder': {
      const rx = (width - d * 0.5) / 2;
      const ry = 14;
      const cx = rx;
      const cyTop = ry + 2;
      const cyBottom = height - ry - 2;

      return (
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible"
          style={{ opacity }}
        >
          {/* Shadow */}
          <ellipse
            cx={cx + d * 0.4}
            cy={cyBottom + d * 0.3}
            rx={rx}
            ry={ry}
            fill="#000000"
            fillOpacity="0.08"
          />
          {/* Body Path */}
          <path
            d={`M 0,${cyTop} L 0,${cyBottom} A ${rx} ${ry} 0 0 0 ${width - d * 0.5},${cyBottom} L ${width - d * 0.5},${cyTop} Z`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
          {/* Shading stripe on right edge of cylinder */}
          <path
            d={`M ${width - d * 0.5 - 16},${cyTop + 1} L ${width - d * 0.5 - 16},${cyBottom} A ${rx} ${ry} 0 0 0 ${width - d * 0.5},${cyBottom} L ${width - d * 0.5},${cyTop} Z`}
            fill={depthFill}
            fillOpacity="0.4"
          />
          {/* Top Elliptical Surface */}
          <ellipse
            cx={cx}
            cy={cyTop}
            rx={rx}
            ry={ry}
            fill={topDepthFill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
          {/* Mid cylinder tier line for database look */}
          <path
            d={`M 0,${cyTop + (cyBottom - cyTop) * 0.5} A ${rx} ${ry} 0 0 0 ${width - d * 0.5},${cyTop + (cyBottom - cyTop) * 0.5}`}
            fill="none"
            stroke={stroke}
            strokeWidth={1}
            strokeOpacity={0.4}
            strokeDasharray="3 3"
          />
        </svg>
      );
    }

    case '3d-platform': {
      return (
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible"
          style={{ opacity }}
        >
          {/* Platform Base Extrusion */}
          <polygon
            points={`0,${height - d} ${width * 0.5},${height} ${width},${height - d} ${width},${height - d * 0.3} ${width * 0.5},${height + d * 0.7} 0,${height - d * 0.3}`}
            fill={depthFill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          {/* Top Isometric Diamond Plane */}
          <polygon
            points={`${width * 0.5},0 ${width},${(height - d) * 0.5} ${width * 0.5},${height - d} 0,${(height - d) * 0.5}`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        </svg>
      );
    }

    case '3d-microservice': {
      return (
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible"
          style={{ opacity }}
        >
          {/* Top Face */}
          <polygon
            points={`0,${d} ${d},0 ${width},0 ${width - d},${d}`}
            fill={topDepthFill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          {/* Right Face */}
          <polygon
            points={`${width - d},${d} ${width},0 ${width},${height - d} ${width - d},${height}`}
            fill={depthFill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          {/* Front Face */}
          <rect
            x={0}
            y={d}
            width={width - d}
            height={height - d}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            rx={2}
          />
          {/* Microservice port interface square */}
          <rect
            x={10}
            y={d + 10}
            width={16}
            height={16}
            fill="#e0e7ff"
            stroke={stroke}
            strokeWidth={1}
            rx={2}
          />
        </svg>
      );
    }

    // ==========================================
    // BASIC SHAPES
    // ==========================================
    case 'rectangle': {
      if (effective3D) {
        return (
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
            <polygon
              points={`0,${d} ${d},0 ${width},0 ${width - d},${d}`}
              fill={topDepthFill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
            <polygon
              points={`${width - d},${d} ${width},0 ${width},${height - d} ${width - d},${height}`}
              fill={depthFill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
            <rect
              x={0}
              y={d}
              width={width - d}
              height={height - d}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDash}
            />
          </svg>
        );
      }
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={width - strokeWidth}
            height={height - strokeWidth}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        </svg>
      );
    }

    case 'rounded-rectangle': {
      if (effective3D) {
        return (
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
            <polygon
              points={`0,${d} ${d},0 ${width},0 ${width - d},${d}`}
              fill={topDepthFill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
            <polygon
              points={`${width - d},${d} ${width},0 ${width},${height - d} ${width - d},${height}`}
              fill={depthFill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
            <rect
              x={0}
              y={d}
              width={width - d}
              height={height - d}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDash}
              rx={cornerRadius}
            />
          </svg>
        );
      }
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={width - strokeWidth}
            height={height - strokeWidth}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
            rx={cornerRadius}
          />
        </svg>
      );
    }

    case 'circle': {
      const radius = Math.min(width, height) / 2 - strokeWidth / 2;
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <circle
            cx={width / 2}
            cy={height / 2}
            r={radius}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        </svg>
      );
    }

    case 'ellipse': {
      const rx = width / 2 - strokeWidth / 2;
      const ry = height / 2 - strokeWidth / 2;
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <ellipse
            cx={width / 2}
            cy={height / 2}
            rx={rx}
            ry={ry}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        </svg>
      );
    }

    case 'triangle': {
      const points = `${width / 2},${strokeWidth} ${width - strokeWidth},${height - strokeWidth} ${strokeWidth},${height - strokeWidth}`;
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <polygon
            points={points}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
            strokeLinejoin="round"
          />
        </svg>
      );
    }

    case 'diamond':
    case 'flow-decision': {
      const points = `${width / 2},${strokeWidth} ${width - strokeWidth},${height / 2} ${width / 2},${height - strokeWidth} ${strokeWidth},${height / 2}`;
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <polygon
            points={points}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
            strokeLinejoin="round"
          />
        </svg>
      );
    }

    case 'hexagon': {
      const offset = width * 0.22;
      const points = `${offset},${strokeWidth} ${width - offset},${strokeWidth} ${width - strokeWidth},${height / 2} ${width - offset},${height - strokeWidth} ${offset},${height - strokeWidth} ${strokeWidth},${height / 2}`;
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <polygon
            points={points}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
            strokeLinejoin="round"
          />
        </svg>
      );
    }

    case 'pentagon': {
      const points = `${width / 2},${strokeWidth} ${width - strokeWidth},${height * 0.38} ${width * 0.8},${height - strokeWidth} ${width * 0.2},${height - strokeWidth} ${strokeWidth},${height * 0.38}`;
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <polygon
            points={points}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
            strokeLinejoin="round"
          />
        </svg>
      );
    }

    case 'parallelogram':
    case 'flow-input-output': {
      const offset = width * 0.18;
      const points = `${offset},${strokeWidth} ${width - strokeWidth},${strokeWidth} ${width - offset},${height - strokeWidth} ${strokeWidth},${height - strokeWidth}`;
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <polygon
            points={points}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
            strokeLinejoin="round"
          />
        </svg>
      );
    }

    case 'cylinder':
    case 'flow-database':
    case 'soft-database': {
      const rx = width / 2 - strokeWidth / 2;
      const ry = 14;
      const topY = ry + strokeWidth;
      const bottomY = height - ry - strokeWidth;

      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <path
            d={`M ${strokeWidth},${topY} L ${strokeWidth},${bottomY} A ${rx} ${ry} 0 0 0 ${width - strokeWidth},${bottomY} L ${width - strokeWidth},${topY} Z`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
          <ellipse
            cx={width / 2}
            cy={topY}
            rx={rx}
            ry={ry}
            fill={topDepthFill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
          {/* Middle tier disk indicator */}
          <path
            d={`M ${strokeWidth},${topY + (bottomY - topY) * 0.48} A ${rx} ${ry} 0 0 0 ${width - strokeWidth},${topY + (bottomY - topY) * 0.48}`}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth * 0.8}
            strokeOpacity={0.35}
          />
        </svg>
      );
    }

    case 'document': {
      const fold = 16;
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <path
            d={`M ${strokeWidth},${strokeWidth} L ${width - fold},${strokeWidth} L ${width - strokeWidth},${fold} L ${width - strokeWidth},${height - 12} Q ${width * 0.75},${height - 4} ${width * 0.5},${height - 12} T ${strokeWidth},${height - 12} Z`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
          <polyline
            points={`${width - fold},${strokeWidth} ${width - fold},${fold} ${width - strokeWidth},${fold}`}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </svg>
      );
    }

    case 'folder': {
      const tabW = width * 0.4;
      const tabH = 14;
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <path
            d={`M ${strokeWidth},${tabH} L ${tabW},${tabH} L ${tabW + 10},${strokeWidth} L ${width - strokeWidth},${strokeWidth} L ${width - strokeWidth},${height - strokeWidth} L ${strokeWidth},${height - strokeWidth} Z`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
            rx={3}
          />
        </svg>
      );
    }

    case 'cloud':
    case 'soft-cloud':
    case 'net-internet': {
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <path
            d={`M ${width * 0.22},${height * 0.76} 
               C ${width * 0.08},${height * 0.76} ${strokeWidth},${height * 0.62} ${strokeWidth},${height * 0.46}
               C ${strokeWidth},${height * 0.32} ${width * 0.12},${height * 0.22} ${width * 0.26},${height * 0.22}
               C ${width * 0.32},${height * 0.08} ${width * 0.52},${height * 0.06} ${width * 0.65},${height * 0.16}
               C ${width * 0.78},${height * 0.1} ${width * 0.94},${height * 0.22} ${width * 0.94},${height * 0.42}
               C ${width - strokeWidth},${height * 0.48} ${width - strokeWidth},${height * 0.76} ${width * 0.8},${height * 0.76}
               Z`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        </svg>
      );
    }

    // ==========================================
    // FLOWCHART SHAPES
    // ==========================================
    case 'flow-start-end': {
      const radius = height / 2 - strokeWidth;
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={width - strokeWidth}
            height={height - strokeWidth}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
            rx={radius}
          />
        </svg>
      );
    }

    case 'flow-process': {
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={width - strokeWidth}
            height={height - strokeWidth}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
            rx={3}
          />
        </svg>
      );
    }

    case 'flow-predefined-process': {
      const barW = 14;
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={width - strokeWidth}
            height={height - strokeWidth}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
          <line
            x1={barW}
            y1={strokeWidth}
            x2={barW}
            y2={height - strokeWidth}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          <line
            x1={width - barW}
            y1={strokeWidth}
            x2={width - barW}
            y2={height - strokeWidth}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </svg>
      );
    }

    case 'flow-manual-input': {
      const slant = 18;
      const points = `${strokeWidth},${slant} ${width - strokeWidth},${strokeWidth} ${width - strokeWidth},${height - strokeWidth} ${strokeWidth},${height - strokeWidth}`;
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <polygon
            points={points}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        </svg>
      );
    }

    case 'flow-data': {
      const wave = 10;
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <path
            d={`M ${strokeWidth},${strokeWidth} L ${width - strokeWidth},${strokeWidth} L ${width - strokeWidth},${height - wave} Q ${width * 0.75},${height} ${width * 0.5},${height - wave} T ${strokeWidth},${height - wave} Z`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        </svg>
      );
    }

    case 'flow-delay': {
      const radius = height / 2 - strokeWidth;
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <path
            d={`M ${strokeWidth},${strokeWidth} L ${width - radius},${strokeWidth} A ${radius} ${radius} 0 0 1 ${width - radius},${height - strokeWidth} L ${strokeWidth},${height - strokeWidth} Z`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        </svg>
      );
    }

    case 'flow-connector': {
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <circle
            cx={width / 2}
            cy={height / 2}
            r={width / 2 - strokeWidth}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </svg>
      );
    }

    // ==========================================
    // SOFTWARE ARCHITECTURE SHAPES
    // ==========================================
    case 'soft-browser': {
      const headerH = 22;
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          {/* Main Window */}
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={width - strokeWidth}
            height={height - strokeWidth}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
            rx={cornerRadius}
          />
          {/* Top Title Bar */}
          <path
            d={`M ${strokeWidth / 2},${cornerRadius + strokeWidth / 2} A ${cornerRadius} ${cornerRadius} 0 0 1 ${cornerRadius + strokeWidth / 2},${strokeWidth / 2} L ${width - cornerRadius - strokeWidth / 2},${strokeWidth / 2} A ${cornerRadius} ${cornerRadius} 0 0 1 ${width - strokeWidth / 2},${cornerRadius + strokeWidth / 2} L ${width - strokeWidth / 2},${headerH} L ${strokeWidth / 2},${headerH} Z`}
            fill="#f1f5f9"
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          {/* Window Control Dots */}
          <circle cx={14} cy={11} r={3} fill="#ef4444" />
          <circle cx={24} cy={11} r={3} fill="#f59e0b" />
          <circle cx={34} cy={11} r={3} fill="#10b981" />
          {/* URL bar placeholder */}
          <rect
            x={44}
            y={5}
            width={width - 56}
            height={12}
            rx={3}
            fill="#ffffff"
            stroke="#cbd5e1"
            strokeWidth={1}
          />
        </svg>
      );
    }

    case 'soft-mobile': {
      const bezel = 6;
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          {/* Phone Body */}
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={width - strokeWidth}
            height={height - strokeWidth}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
            rx={16}
          />
          {/* Screen */}
          <rect
            x={bezel}
            y={16}
            width={width - bezel * 2}
            height={height - 32}
            fill="#ffffff"
            stroke={stroke}
            strokeWidth={1}
            rx={4}
          />
          {/* Camera speaker notch */}
          <rect x={width / 2 - 12} y={7} width={24} height={4} rx={2} fill="#94a3b8" />
          {/* Home indicator bar */}
          <rect x={width / 2 - 16} y={height - 10} width={32} height={3} rx={1.5} fill="#94a3b8" />
        </svg>
      );
    }

    case 'soft-user':
    case 'uml-actor': {
      const cx = width / 2;
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          {/* Head */}
          <circle
            cx={cx}
            cy={18}
            r={12}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          {/* Body spine */}
          <line x1={cx} y1={30} x2={cx} y2={60} stroke={stroke} strokeWidth={strokeWidth} />
          {/* Arms */}
          <line
            x1={cx - 24}
            y1={42}
            x2={cx + 24}
            y2={42}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          {/* Legs */}
          <line
            x1={cx}
            y1={60}
            x2={cx - 18}
            y2={height - 8}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          <line
            x1={cx}
            y1={60}
            x2={cx + 18}
            y2={height - 8}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </svg>
      );
    }

    case 'soft-server':
    case 'net-server': {
      const slotH = (height - strokeWidth * 2 - 8) / 3;
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={width - strokeWidth}
            height={height - strokeWidth}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
            rx={4}
          />
          {/* 3 rack unit slots */}
          {[0, 1, 2].map((i) => {
            const slotY = strokeWidth + 4 + i * slotH;
            return (
              <g key={i}>
                <rect
                  x={8}
                  y={slotY}
                  width={width - 16}
                  height={slotH - 4}
                  fill="#f1f5f9"
                  stroke={stroke}
                  strokeWidth={1}
                  rx={2}
                />
                <circle cx={16} cy={slotY + (slotH - 4) / 2} r={2.5} fill="#10b981" />
                <circle cx={24} cy={slotY + (slotH - 4) / 2} r={2.5} fill="#3b82f6" />
                <line
                  x1={34}
                  y1={slotY + (slotH - 4) / 2}
                  x2={width - 24}
                  y2={slotY + (slotH - 4) / 2}
                  stroke={stroke}
                  strokeWidth={1}
                  strokeDasharray="2 3"
                />
              </g>
            );
          })}
        </svg>
      );
    }

    case 'soft-queue': {
      // Pipe/Queue with message packets
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={width - strokeWidth}
            height={height - strokeWidth}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
            rx={6}
          />
          {/* Internal queue segments */}
          {[1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1={(width / 5) * i}
              y1={strokeWidth}
              x2={(width / 5) * i}
              y2={height - strokeWidth}
              stroke={stroke}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          ))}
          {/* Directional arrow in background */}
          <path
            d={`M ${width * 0.2},${height * 0.5} L ${width * 0.8},${height * 0.5} M ${width * 0.72},${height * 0.5 - 6} L ${width * 0.8},${height * 0.5} L ${width * 0.72},${height * 0.5 + 6}`}
            fill="none"
            stroke={stroke}
            strokeWidth={1.5}
            strokeOpacity={0.4}
          />
        </svg>
      );
    }

    case 'soft-cache': {
      // Fast memory chip/cache icon badge
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <rect
            x={10}
            y={strokeWidth / 2}
            width={width - 20}
            height={height - strokeWidth}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
            rx={4}
          />
          {/* Left Pins */}
          {[0.25, 0.5, 0.75].map((pct, i) => (
            <line
              key={`lp-${i}`}
              x1={0}
              y1={height * pct}
              x2={10}
              y2={height * pct}
              stroke={stroke}
              strokeWidth={2}
            />
          ))}
          {/* Right Pins */}
          {[0.25, 0.5, 0.75].map((pct, i) => (
            <line
              key={`rp-${i}`}
              x1={width - 10}
              y1={height * pct}
              x2={width}
              y2={height * pct}
              stroke={stroke}
              strokeWidth={2}
            />
          ))}
        </svg>
      );
    }

    case 'soft-storage': {
      // Storage bucket / barrel
      const rx = width / 2 - strokeWidth;
      const ry = 12;
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <path
            d={`M ${strokeWidth},${ry} L ${strokeWidth * 2 + 10},${height - strokeWidth} L ${width - strokeWidth * 2 - 10},${height - strokeWidth} L ${width - strokeWidth},${ry} Z`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
          <ellipse
            cx={width / 2}
            cy={ry}
            rx={rx}
            ry={ry}
            fill={topDepthFill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </svg>
      );
    }

    case 'soft-auth': {
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={width - strokeWidth}
            height={height - strokeWidth}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
            rx={cornerRadius}
          />
          {/* Small Keyhole / Badge symbol */}
          <circle cx={20} cy={20} r={6} fill="none" stroke={stroke} strokeWidth={2} />
          <path
            d="M 18,24 L 22,24 L 23,30 L 17,30 Z"
            fill={stroke}
            stroke={stroke}
            strokeWidth={1}
          />
        </svg>
      );
    }

    case 'soft-load-balancer': {
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={width - strokeWidth}
            height={height - strokeWidth}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
            rx={cornerRadius}
          />
          {/* 1 to 3 split arrow branches */}
          <circle cx={20} cy={height / 2} r={4} fill={stroke} />
          <path
            d={`M 24,${height / 2} L 36,${height / 2} M 36,${height / 2} L 50,${height * 0.25} L ${width - 16},${height * 0.25}
               M 36,${height / 2} L ${width - 16},${height / 2}
               M 36,${height / 2} L 50,${height * 0.75} L ${width - 16},${height * 0.75}`}
            fill="none"
            stroke={stroke}
            strokeWidth={1.5}
            strokeDasharray="2 2"
          />
        </svg>
      );
    }

    // ==========================================
    // UML DIAGRAM SHAPES
    // ==========================================
    case 'uml-use-case': {
      const rx = width / 2 - strokeWidth;
      const ry = height / 2 - strokeWidth;
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <ellipse
            cx={width / 2}
            cy={height / 2}
            rx={rx}
            ry={ry}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        </svg>
      );
    }

    case 'uml-class': {
      const headerH = 34;
      const attrH = Math.max(30, (height - headerH) * 0.5);

      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          {/* Outer Box */}
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={width - strokeWidth}
            height={height - strokeWidth}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
          {/* Header Divider */}
          <line
            x1={strokeWidth / 2}
            y1={headerH}
            x2={width - strokeWidth / 2}
            y2={headerH}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          {/* Attributes Divider */}
          <line
            x1={strokeWidth / 2}
            y1={headerH + attrH}
            x2={width - strokeWidth / 2}
            y2={headerH + attrH}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </svg>
      );
    }

    case 'uml-component': {
      const tabW = 16;
      const tabH = 10;
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={width - strokeWidth}
            height={height - strokeWidth}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
          {/* Left protruding component plugs */}
          <rect
            x={0}
            y={height * 0.25}
            width={tabW}
            height={tabH}
            fill="#ffffff"
            stroke={stroke}
            strokeWidth={1.5}
          />
          <rect
            x={0}
            y={height * 0.65}
            width={tabW}
            height={tabH}
            fill="#ffffff"
            stroke={stroke}
            strokeWidth={1.5}
          />
        </svg>
      );
    }

    case 'uml-package': {
      const tabW = width * 0.45;
      const tabH = 18;
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          {/* Package Top Tab */}
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={tabW}
            height={tabH}
            fill="#f1f5f9"
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          {/* Main Body */}
          <rect
            x={strokeWidth / 2}
            y={tabH}
            width={width - strokeWidth}
            height={height - tabH - strokeWidth / 2}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        </svg>
      );
    }

    case 'uml-state':
    case 'uml-activity': {
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={width - strokeWidth}
            height={height - strokeWidth}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
            rx={cornerRadius || 16}
          />
        </svg>
      );
    }

    // ==========================================
    // NETWORK TOPOLOGY SHAPES
    // ==========================================
    case 'net-router': {
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <ellipse
            cx={width / 2}
            cy={height / 2}
            rx={width / 2 - strokeWidth}
            ry={height / 2 - strokeWidth}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
          {/* 4 technical arrows inward/outward */}
          <path
            d={`M ${width * 0.3},${height * 0.3} L ${width * 0.7},${height * 0.7} M ${width * 0.7},${height * 0.3} L ${width * 0.3},${height * 0.7}`}
            stroke={stroke}
            strokeWidth={2}
          />
        </svg>
      );
    }

    case 'net-switch': {
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={width - strokeWidth}
            height={height - strokeWidth}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
            rx={3}
          />
          {/* Switch port lines */}
          <line
            x1={16}
            y1={height / 2}
            x2={width - 16}
            y2={height / 2}
            stroke={stroke}
            strokeWidth={1.5}
          />
          <path
            d={`M 24,${height * 0.3} L ${width - 24},${height * 0.7} M ${width - 24},${height * 0.3} L 24,${height * 0.7}`}
            stroke={stroke}
            strokeWidth={1}
            strokeOpacity={0.5}
          />
        </svg>
      );
    }

    case 'net-firewall': {
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={width - strokeWidth}
            height={height - strokeWidth}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
            rx={2}
          />
          {/* Brick wall pattern */}
          <line
            x1={strokeWidth}
            y1={height * 0.33}
            x2={width - strokeWidth}
            y2={height * 0.33}
            stroke={stroke}
            strokeWidth={1}
          />
          <line
            x1={strokeWidth}
            y1={height * 0.66}
            x2={width - strokeWidth}
            y2={height * 0.66}
            stroke={stroke}
            strokeWidth={1}
          />
          <line
            x1={width * 0.5}
            y1={strokeWidth}
            x2={width * 0.5}
            y2={height * 0.33}
            stroke={stroke}
            strokeWidth={1}
          />
          <line
            x1={width * 0.25}
            y1={height * 0.33}
            x2={width * 0.25}
            y2={height * 0.66}
            stroke={stroke}
            strokeWidth={1}
          />
          <line
            x1={width * 0.75}
            y1={height * 0.33}
            x2={width * 0.75}
            y2={height * 0.66}
            stroke={stroke}
            strokeWidth={1}
          />
          <line
            x1={width * 0.5}
            y1={height * 0.66}
            x2={width * 0.5}
            y2={height - strokeWidth}
            stroke={stroke}
            strokeWidth={1}
          />
        </svg>
      );
    }

    case 'net-desktop': {
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          {/* Monitor Screen */}
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={width - strokeWidth}
            height={height - 20}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
            rx={4}
          />
          {/* Stand neck */}
          <rect x={width / 2 - 4} y={height - 20} width={8} height={12} fill={stroke} />
          {/* Stand base */}
          <rect x={width / 2 - 20} y={height - 8} width={40} height={6} rx={2} fill={stroke} />
        </svg>
      );
    }

    case 'net-laptop': {
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          {/* Screen */}
          <rect
            x={12}
            y={strokeWidth / 2}
            width={width - 24}
            height={height - 18}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            rx={3}
          />
          {/* Keyboard base */}
          <polygon
            points={`0,${height - 10} ${width},${height - 10} ${width - 8},${height - 2} 8,${height - 2}`}
            fill="#e2e8f0"
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </svg>
      );
    }

    // ==========================================
    // DATABASE / ER SHAPES
    // ==========================================
    case 'er-entity': {
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={width - strokeWidth}
            height={height - strokeWidth}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        </svg>
      );
    }

    case 'er-attribute': {
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <ellipse
            cx={width / 2}
            cy={height / 2}
            rx={width / 2 - strokeWidth}
            ry={height / 2 - strokeWidth}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        </svg>
      );
    }

    case 'er-relationship': {
      const points = `${width / 2},${strokeWidth} ${width - strokeWidth},${height / 2} ${width / 2},${height - strokeWidth} ${strokeWidth},${height / 2}`;
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <polygon
            points={points}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
            strokeLinejoin="round"
          />
        </svg>
      );
    }

    case 'er-table': {
      const headerH = 32;
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={width - strokeWidth}
            height={height - strokeWidth}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
          {/* Header Bar */}
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={width - strokeWidth}
            height={headerH}
            fill="#f8fafc"
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </svg>
      );
    }

    // Default fallback
    default: {
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={width - strokeWidth}
            height={height - strokeWidth}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
            rx={cornerRadius}
          />
        </svg>
      );
    }
  }
}

// Utility to calculate a darker shaded face color for 3D extrusion
function getDarkenedColor(colorStr: string, factor: number): string {
  if (!colorStr.startsWith('#')) return '#e2e8f0';

  let hex = colorStr.replace('#', '');
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const darkR = Math.max(0, Math.floor(r * (1 - factor)));
  const darkG = Math.max(0, Math.floor(g * (1 - factor)));
  const darkB = Math.max(0, Math.floor(b * (1 - factor)));

  return `#${darkR.toString(16).padStart(2, '0')}${darkG.toString(16).padStart(2, '0')}${darkB.toString(16).padStart(2, '0')}`;
}
