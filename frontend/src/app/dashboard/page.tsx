'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { wsClient } from '@/lib/websocket';
import SystemStatusPanel from '@/components/dashboard/SystemStatusPanel';
import PBXStatusPanel from '@/components/dashboard/PBXStatusPanel';
import SystemInformationPanel from '@/components/dashboard/SystemInformationPanel';
import QuickActionTiles from '@/components/dashboard/QuickActionTiles';
import EventLogPanel from '@/components/dashboard/EventLogPanel';

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const sum = await api.getDashboardSummary();
      setSummary(sum);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Live Telephony WebSockets subscription
    const unsubscribe = wsClient.subscribe((msg) => {
      if (
        msg.type === 'CHANNEL_CREATE' ||
        msg.type === 'CHANNEL_ANSWER' ||
        msg.type === 'CHANNEL_HANGUP' ||
        msg.type === 'CHANNEL_BRIDGE'
      ) {
        fetchDashboardData();
      }
    });

    const interval = setInterval(fetchDashboardData, 6000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-5">
      {/* Page Title & Operational Status Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Telephony Operations Console
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            ECLYPETECH PBX • Asterisk Engine v22.5 LTS • Host Mode
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition hover:border-slate-300"
          >
            <div className={`w-3.5 h-3.5 border-2 border-slate-400 border-t-sky-600 rounded-full ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* 3 Status Panels Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Panel A: System Status */}
        <SystemStatusPanel system={summary?.system} />

        {/* Panel B: PBX Status */}
        <PBXStatusPanel
          telephony={summary?.telephony}
          asteriskOnline={summary?.system?.services?.asterisk ?? true}
        />

        {/* Panel C: Information */}
        <SystemInformationPanel
          system={summary?.system}
          telephony={summary?.telephony}
        />
      </div>

      {/* Quick Action Tiles */}
      <div className="pt-1">
        <QuickActionTiles />
      </div>

      {/* Event Log Panel */}
      <div className="pt-1">
        <EventLogPanel />
      </div>
    </div>
  );
}
