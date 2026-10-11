'use client';

import React from 'react';

interface ResourceUsageChartProps {
  cpuHistory?: number[];
  memoryHistory?: number[];
}

export default function ResourceUsageChart({
  cpuHistory = [12, 14, 10, 15, 8, 12, 18, 14, 11, 9, 13, 10],
  memoryHistory = [18, 18, 19, 18, 18, 18, 19, 18, 18, 18, 18, 18],
}: ResourceUsageChartProps) {
  const width = 380;
  const height = 110;
  const padding = 20;

  const pointsCount = cpuHistory.length;
  const getX = (index: number) =>
    padding + (index / (pointsCount - 1)) * (width - padding * 2);
  const getY = (val: number) =>
    height - padding - (Math.min(100, Math.max(0, val)) / 100) * (height - padding * 2);

  const cpuPoints = cpuHistory.map((val, idx) => `${getX(idx)},${getY(val)}`).join(' ');
  const memPoints = memoryHistory.map((val, idx) => `${getX(idx)},${getY(val)}`).join(' ');

  // Closed path for subtle area fill
  const cpuArea = `${padding},${height - padding} ${cpuPoints} ${width - padding},${height - padding}`;
  const memArea = `${padding},${height - padding} ${memPoints} ${width - padding},${height - padding}`;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 px-0.5">
        <span className="font-semibold text-slate-700">Real-Time Load (10m)</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-sky-500 rounded-full inline-block ring-2 ring-sky-500/20" />
            <span className="text-[10px] font-semibold text-slate-600">CPU</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block ring-2 ring-emerald-500/20" />
            <span className="text-[10px] font-semibold text-slate-600">Memory</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2 relative overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-24 overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="cpuGradientModern" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284C7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="memGradientModern" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          <line
            x1={padding}
            y1={getY(0)}
            x2={width - padding}
            y2={getY(0)}
            stroke="#E2E8F0"
            strokeWidth="1"
          />
          <line
            x1={padding}
            y1={getY(50)}
            x2={width - padding}
            y2={getY(50)}
            stroke="#E2E8F0"
            strokeDasharray="2 3"
            strokeWidth="1"
          />
          <line
            x1={padding}
            y1={getY(100)}
            x2={width - padding}
            y2={getY(100)}
            stroke="#E2E8F0"
            strokeWidth="1"
          />

          {/* Y Axis Labels */}
          <text x={2} y={getY(100) + 3} fontSize="8" fill="#94A3B8" fontWeight="600">
            100%
          </text>
          <text x={2} y={getY(50) + 3} fontSize="8" fill="#94A3B8" fontWeight="600">
            50%
          </text>
          <text x={4} y={getY(0) + 3} fontSize="8" fill="#94A3B8" fontWeight="600">
            0%
          </text>

          {/* Area Fills with gradients */}
          <polygon points={memArea} fill="url(#memGradientModern)" />
          <polygon points={cpuArea} fill="url(#cpuGradientModern)" />

          {/* Lines */}
          <polyline
            points={memPoints}
            fill="none"
            stroke="#10B981"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points={cpuPoints}
            fill="none"
            stroke="#0284C7"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Live Pulse Markers */}
          <circle
            cx={getX(pointsCount - 1)}
            cy={getY(memoryHistory[pointsCount - 1] || 0)}
            r="3.5"
            fill="#10B981"
            className="ring-2 ring-white"
          />
          <circle
            cx={getX(pointsCount - 1)}
            cy={getY(cpuHistory[pointsCount - 1] || 0)}
            r="3.5"
            fill="#0284C7"
            className="ring-2 ring-white"
          />
        </svg>

        <div className="flex justify-between text-[10px] text-slate-400 font-mono px-2 pt-1 border-t border-slate-100">
          <span>-10 min</span>
          <span>-5 min</span>
          <span className="font-semibold text-slate-600">Live</span>
        </div>
      </div>
    </div>
  );
}
