'use client';

import React from 'react';
import { Info } from 'lucide-react';

interface SystemInfoProps {
  system?: {
    hostname?: string;
    uptimeSeconds?: number;
    publicIp?: string;
    lanIp?: string;
  };
  telephony?: {
    totalExtensions?: number;
    totalTrunks?: number;
  };
}

export default function SystemInformationPanel({ system, telephony }: SystemInfoProps) {
  const formatUptime = (sec: number = 11800) => {
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    return `${h}h ${m}m`;
  };

  const infoRows = [
    { label: 'PBX Hostname', value: system?.hostname || 'eclype-pbx.local' },
    { label: 'IPv4 Address (LAN)', value: '127.0.0.1' },
    { label: 'IPv4 Address (Public)', value: '49.156.43.92' },
    { label: 'Asterisk Engine', value: 'v22.5 LTS (PJSIP / AMI)' },
    { label: 'Application Version', value: 'ECLYPETECH PBX v2.4' },
    {
      label: 'License Status',
      value: 'Enterprise Active',
      isBadge: true,
      badgeColor: 'bg-[#EAF8EE] text-[#20B45A] border-[#20B45A]/30',
    },
    { label: 'Last Snapshot Backup', value: 'Today (Verified)' },
    { label: 'System Uptime', value: formatUptime(system?.uptimeSeconds) },
    { label: 'Configured Time Zone', value: 'UTC (+00:00)' },
    { label: 'Provisioned Extensions', value: `${telephony?.totalExtensions ?? 8} Extensions` },
    { label: 'Carrier SIP Trunks', value: `${telephony?.totalTrunks ?? 1} Gateway` },
    { label: 'Outbound Dial Plans', value: '1 Default Outbound' },
  ];

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden flex flex-col h-full hover:shadow-sm transition-shadow duration-200">
      {/* Panel Header */}
      <div className="bg-[#0F172A] border-b border-slate-800 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Info className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs font-bold tracking-wide uppercase text-slate-100">
            System & Infrastructure
          </h2>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/80 font-mono text-[10px] text-slate-300 font-medium">
          Node.js 22 LTS
        </span>
      </div>

      {/* Info Rows */}
      <div className="divide-y divide-slate-100 text-xs flex-1">
        {infoRows.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between px-4 py-2 hover:bg-slate-50/70 transition-colors"
          >
            <span className="text-slate-500 font-medium">{item.label}</span>
            {item.isBadge ? (
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {item.value}
              </span>
            ) : (
              <span className="font-mono text-slate-900 font-semibold text-xs">
                {item.value}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
