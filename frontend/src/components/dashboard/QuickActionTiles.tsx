'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Radio,
  Smartphone,
  ShieldAlert,
  FileText,
  History,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function QuickActionTiles() {
  const [reloading, setReloading] = useState(false);
  const [reloadMsg, setReloadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleReload = async () => {
    setReloading(true);
    setReloadMsg(null);
    try {
      const res = await api.reloadTelephonyConfig();
      setReloadMsg({ type: 'success', text: res.message || 'Asterisk PJSIP dialplans and endpoints reloaded successfully!' });
      setTimeout(() => setReloadMsg(null), 4000);
    } catch (err: any) {
      setReloadMsg({ type: 'error', text: 'Telephony reload failed: ' + err.message });
      setTimeout(() => setReloadMsg(null), 5000);
    } finally {
      setReloading(false);
    }
  };

  const tiles = [
    {
      label: 'SIP Trunks',
      desc: 'Carrier Gateways',
      icon: Radio,
      href: '/trunks',
      badgeClass: 'bg-sky-50 text-sky-600 border border-sky-200/80',
    },
    {
      label: 'Phones & Devices',
      desc: 'Provision Endpoints',
      icon: Smartphone,
      href: '/phones',
      badgeClass: 'bg-indigo-50 text-indigo-600 border border-indigo-200/80',
    },
    {
      label: 'IP Blacklist',
      desc: 'Firewall & Jails',
      icon: ShieldAlert,
      href: '/security',
      badgeClass: 'bg-rose-50 text-rose-600 border border-rose-200/80',
    },
    {
      label: 'Event Logs',
      desc: 'System Telemetry',
      icon: FileText,
      href: '#event-log',
      badgeClass: 'bg-amber-50 text-amber-600 border border-amber-200/80',
    },
    {
      label: 'Call Detail Logs',
      desc: 'CDR Audit Records',
      icon: History,
      href: '/cdr',
      badgeClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200/80',
    },
  ];

  return (
    <div className="space-y-3">
      {reloadMsg && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between border shadow-xs animate-in fade-in duration-150 ${
            reloadMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {reloadMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{reloadMsg.text}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Asterisk PJSIP Core</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.label}
              href={tile.href}
              className="bg-white hover:bg-slate-50/90 border border-slate-200/90 hover:border-sky-300 rounded-xl p-3 flex flex-col justify-between shadow-xs hover:shadow-sm hover:-translate-y-0.5 transition-all duration-150 group cursor-pointer h-[88px]"
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${tile.badgeClass} transition-transform group-hover:scale-105`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-600 transition-colors" />
              </div>
              <div className="text-left mt-1.5">
                <div className="text-xs font-bold text-slate-800 group-hover:text-sky-700 leading-tight">
                  {tile.label}
                </div>
                <div className="text-[10px] text-slate-400 group-hover:text-slate-500 font-medium leading-normal mt-0.5 truncate">
                  {tile.desc}
                </div>
              </div>
            </Link>
          );
        })}

        {/* 6th Tile: Reload Telephony Action */}
        <button
          onClick={handleReload}
          disabled={reloading}
          className="bg-white hover:bg-slate-50/90 border border-slate-200/90 hover:border-violet-300 disabled:opacity-60 rounded-xl p-3 flex flex-col justify-between shadow-xs hover:shadow-sm hover:-translate-y-0.5 transition-all duration-150 group cursor-pointer h-[88px] text-left"
          title="Reload Asterisk PJSIP Telephony"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-violet-50 text-violet-600 border border-violet-200/80 transition-transform group-hover:scale-105">
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  reloading ? 'animate-spin text-violet-700' : 'group-hover:rotate-45 transition-transform'
                }`}
              />
            </div>
            <span
              className={`w-2 h-2 rounded-full ${
                reloading ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'
              }`}
            />
          </div>
          <div className="text-left mt-1.5">
            <div className="text-xs font-bold text-slate-800 group-hover:text-violet-700 leading-tight">
              {reloading ? 'Reloading...' : 'Reload Engine'}
            </div>
            <div className="text-[10px] text-slate-400 group-hover:text-slate-500 font-medium leading-normal mt-0.5 truncate">
              Asterisk PJSIP
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
