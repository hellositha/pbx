'use client';

import React from 'react';
import ResourceUsageChart from './ResourceUsageChart';
import { Cpu, HardDrive, Server, Activity, CheckCircle2 } from 'lucide-react';

interface SystemStatusProps {
  system?: {
    cpuUsage: number;
    memory: { percentUsed: number; usedBytes: number; totalBytes: number };
    disk: { percentUsed: number; usedBytes: number; totalBytes: number };
    uptimeSeconds: number;
    services?: { asterisk?: boolean; freeswitch?: boolean; postgres: boolean; nginx: boolean };
    loadAverage?: number[];
  };
}

export default function SystemStatusPanel({ system }: SystemStatusProps) {
  const cpu = system?.cpuUsage ?? 1;
  const memUsed = system?.memory?.usedBytes ?? 1422581760;
  const memTotal = system?.memory?.totalBytes ?? 7782506496;
  const memPercent = system?.memory?.percentUsed ?? 18;

  const diskUsed = system?.disk?.usedBytes ?? 6195888128;
  const diskTotal = system?.disk?.totalBytes ?? 19078512640;
  const diskPercent = system?.disk?.percentUsed ?? 35;
  const diskFreeGb = ((diskTotal - diskUsed) / (1024 * 1024 * 1024)).toFixed(1);

  const uptimeSec = system?.uptimeSeconds ?? 11800;
  const formatUptime = (sec: number) => {
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    return `${h}h ${m}m`;
  };

  const toGb = (bytes: number) => (bytes / (1024 * 1024 * 1024)).toFixed(1);

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden flex flex-col h-full hover:shadow-sm transition-shadow duration-200">
      {/* Panel Header */}
      <div className="bg-[#0F172A] border-b border-slate-800 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs font-bold tracking-wide uppercase text-slate-100">
            System Telemetry
          </h2>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/80 font-mono text-[10px] text-slate-300 font-medium">
          Uptime: {formatUptime(uptimeSec)}
        </span>
      </div>

      {/* Panel Content */}
      <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
        {/* Resource Line Chart */}
        <ResourceUsageChart
          cpuHistory={[10, 12, 14, 11, 8, 15, 12, 9, 11, 14, 10, cpu]}
          memoryHistory={[18, 18, 18, 19, 18, 18, 18, 18, 19, 18, 18, memPercent]}
        />

        {/* Utilization Indicators */}
        <div className="space-y-3 pt-1">
          {/* CPU Usage */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-700 font-semibold flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-sky-600" />
                CPU Core Load
              </span>
              <span className="font-mono font-bold text-slate-900">{cpu}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden p-0.5 border border-slate-200/50">
              <div
                className="bg-gradient-to-r from-sky-500 to-blue-600 h-full rounded-full transition-all duration-300 shadow-xs"
                style={{ width: `${Math.max(3, Math.min(100, cpu))}%` }}
              />
            </div>
          </div>

          {/* Memory Usage */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-700 font-semibold flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-emerald-600" />
                Physical RAM
              </span>
              <span className="font-mono text-xs text-slate-500">
                <strong className="text-slate-900 font-bold">{memPercent}%</strong> ({toGb(memUsed)} GB / {toGb(memTotal)} GB)
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden p-0.5 border border-slate-200/50">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-300 shadow-xs"
                style={{ width: `${Math.max(3, Math.min(100, memPercent))}%` }}
              />
            </div>
          </div>

          {/* Disk Usage */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-700 font-semibold flex items-center gap-2">
                <HardDrive className="w-3.5 h-3.5 text-amber-500" />
                Root Storage
              </span>
              <span className="font-mono text-xs text-slate-500">
                <strong className="text-slate-900 font-bold">{diskPercent}%</strong> ({diskFreeGb} GB free)
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden p-0.5 border border-slate-200/50">
              <div
                className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all duration-300 shadow-xs"
                style={{ width: `${Math.max(3, Math.min(100, diskPercent))}%` }}
              />
            </div>
          </div>
        </div>

        {/* System Details Footer */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-500">
          <div>
            <span>Free Storage:</span>
            <span className="font-mono font-bold text-slate-900 ml-1">{diskFreeGb} GB</span>
          </div>
          <div className="text-right">
            <span>SIP Traffic:</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Healthy
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
