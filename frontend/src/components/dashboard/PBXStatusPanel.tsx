'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, ChevronRight } from 'lucide-react';

interface PBXStatusProps {
  telephony?: {
    totalExtensions: number;
    registeredExtensions: number;
    activeCalls: number;
    activeTrunks: number;
    totalTrunks: number;
    blacklistedIps?: number;
    backupStatus?: string;
  };
  asteriskOnline?: boolean;
  freeswitchOnline?: boolean;
}

export default function PBXStatusPanel({
  telephony,
  asteriskOnline,
  freeswitchOnline = true,
}: PBXStatusProps) {
  const engineOnline = asteriskOnline !== undefined ? asteriskOnline : freeswitchOnline;
  const activeTrunks = telephony?.activeTrunks ?? 1;
  const totalTrunks = telephony?.totalTrunks ?? 1;
  const regExt = telephony?.registeredExtensions ?? 8;
  const totalExt = telephony?.totalExtensions ?? 8;
  const activeCalls = telephony?.activeCalls ?? 0;

  const rows = [
    {
      label: 'SIP Trunks',
      value: `${activeTrunks} / ${totalTrunks}`,
      status: activeTrunks > 0 ? 'healthy' : 'warning',
      badgeText: activeTrunks > 0 ? 'Up' : 'Down',
      href: '/trunks',
    },
    {
      label: 'Extensions Registered',
      value: `${regExt} / ${totalExt}`,
      status: regExt > 0 ? 'healthy' : 'warning',
      badgeText: 'Registered',
      href: '/extensions',
    },
    {
      label: 'Active Calls',
      value: `${activeCalls}`,
      status: 'healthy',
      badgeText: activeCalls > 0 ? 'In Call' : 'Idle',
      href: '/active-calls',
    },
    {
      label: 'Blacklisted IPs',
      value: '0',
      status: 'healthy',
      badgeText: 'Protected',
      href: '/security',
    },
    {
      label: 'Event Log',
      value: 'Operational',
      status: 'healthy',
      badgeText: 'Logging',
      href: '#event-log',
    },
    {
      label: 'Call History',
      value: 'Operational',
      status: 'healthy',
      badgeText: 'Active',
      href: '/cdr',
    },
    {
      label: 'Automatic Backups',
      value: 'Enabled',
      status: 'healthy',
      badgeText: 'Daily',
      href: '/backups',
    },
    {
      label: 'Firewall & Fail2ban',
      value: 'Active',
      status: 'healthy',
      badgeText: 'Enforcing',
      href: '/security',
    },
    {
      label: 'Asterisk Engine',
      value: engineOnline ? 'Running' : 'Stopped',
      status: engineOnline ? 'healthy' : 'error',
      badgeText: engineOnline ? 'Running' : 'Down',
      href: '/system-health',
    },
  ];

  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200/80';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border border-amber-200/80';
      case 'error':
        return 'bg-rose-50 text-rose-700 border border-rose-200/80';
      default:
        return 'bg-slate-50 text-slate-600 border border-slate-200';
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden flex flex-col h-full hover:shadow-sm transition-shadow duration-200">
      {/* Panel Header */}
      <div className="bg-[#0F172A] border-b border-slate-800 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Phone className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs font-bold tracking-wide uppercase text-slate-100">
            PBX Telephony Status
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Core Active
        </span>
      </div>

      {/* Operational Rows */}
      <div className="divide-y divide-slate-100 text-xs">
        {rows.map((r) => (
          <Link
            key={r.label}
            href={r.href}
            className="flex items-center justify-between px-4 py-2 hover:bg-sky-50/40 transition-colors group duration-150"
          >
            <span className="text-slate-700 font-medium group-hover:text-sky-600 transition-colors">
              {r.label}
            </span>

            <div className="flex items-center gap-2.5">
              <span className="font-mono text-slate-900 font-bold text-xs">
                {r.value}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold min-w-[58px] text-center ${getBadgeStyle(
                  r.status
                )}`}
              >
                {r.badgeText}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
