'use client';

import React, { useState, useEffect } from 'react';
import { api, getAuthToken } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import {
  BarChart3,
  Download,
  Calendar,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneOff,
  Clock,
  Users,
  Filter,
  CheckCircle2,
  TrendingUp,
  Award,
  Zap,
} from 'lucide-react';

export default function ReportsPage() {
  const toast = useToast();
  const [cdrs, setCdrs] = useState<any[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getCdr().catch(() => ({ records: [] })),
      api.getExtensions().catch(() => ({ extensions: [] })),
    ]).then(([cdrRes, extRes]) => {
      if (cdrRes?.records) setCdrs(cdrRes.records);
      if (extRes?.extensions) setExtensions(extRes.extensions);
      setLoading(false);
    });
  }, []);

  const totalCalls = cdrs.length;
  const answered = cdrs.filter((c) => c.disposition === 'ANSWERED').length;
  const missed = totalCalls - answered;
  const answerRate = totalCalls > 0 ? Math.round((answered / totalCalls) * 100) : 100;

  const totalBillsec = cdrs.reduce((acc, c) => acc + (c.billsec || 0), 0);
  const avgTalkTimeSec = answered > 0 ? Math.round(totalBillsec / answered) : 0;
  const avgTalkTimeStr = avgTalkTimeSec > 0 ? `${Math.floor(avgTalkTimeSec / 60)}m ${avgTalkTimeSec % 60}s` : '0s';

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error('Session expired, please sign in again');
        return;
      }

      const res = await fetch(`/api/cdr/export?token=${encodeURIComponent(token)}`);
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eclypetech_pbx_analytics_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Call detail record archive downloaded', 'Export Complete');
    } catch (err: any) {
      toast.error(err.message || 'Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  // Compute real extension breakdown
  const extBreakdown = extensions.map((ext) => {
    const num = ext.extensionNumber;
    const inCalls = cdrs.filter((c) => c.destination === num).length;
    const outCalls = cdrs.filter((c) => c.sourceExtension === num || c.callerIdNum === num).length;
    const handledCalls = inCalls + outCalls;
    const answeredCalls = cdrs.filter(
      (c) => (c.destination === num || c.sourceExtension === num || c.callerIdNum === num) && c.disposition === 'ANSWERED'
    ).length;
    const durSec = cdrs
      .filter((c) => c.destination === num || c.sourceExtension === num || c.callerIdNum === num)
      .reduce((sum, c) => sum + (c.billsec || 0), 0);
    const durFormatted = `${Math.floor(durSec / 60)}m ${durSec % 60}s`;
    const slaVal = handledCalls > 0 ? Math.round((answeredCalls / handledCalls) * 100) : 100;

    return {
      ext: num,
      name: ext.displayName || `Ext ${num}`,
      dept: ext.department?.name || 'General Staff',
      in: inCalls,
      out: outCalls,
      total: handledCalls,
      dur: durFormatted,
      sla: slaVal,
    };
  });

  return (
    <div className="space-y-5">
      {/* Page Title & Operational Status Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Telephony Analytics & Performance
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              Live Metrics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Executive summaries of call volume, extension SLA adherence, and traffic distribution
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={exporting}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 font-semibold text-xs shadow-xs transition hover:border-slate-300 disabled:opacity-50"
        >
          {exporting ? (
            <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-sky-600 rounded-full animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5 text-sky-600" />
          )}
          <span>{exporting ? 'Generating CSV...' : 'Export Summary CSV'}</span>
        </button>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Total Call Volume</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{totalCalls}</span>
            <span className="text-[11px] text-slate-500 font-medium">calls recorded</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Answered Calls</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <PhoneIncoming className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 font-mono">{answered}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70">
              {answerRate}% SLA
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Abandoned / Missed</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
              <PhoneOff className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600 font-mono">{missed}</span>
            <span className="text-[11px] text-slate-500 font-medium">unanswered</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Average Talk Time</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{avgTalkTimeStr}</span>
            <span className="text-[11px] text-slate-500 font-medium">per conversation</span>
          </div>
        </div>
      </div>

      {/* Traffic & Answer Rate Breakdown Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-600" />
            Service Level Agreement (SLA) Adherence
          </span>
          <span className="font-mono text-xs font-bold text-slate-900">
            {answered} answered of {totalCalls || 1} total ({answerRate}%)
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/50 flex">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.max(2, answerRate)}%` }}
            title={`Answered: ${answered}`}
          />
        </div>
      </div>

      {/* Reports Table Card */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
        <div className="bg-[#0F172A] text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Award className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wide text-white">
                Extension Productivity & Performance
              </h2>
              <p className="text-[10px] text-slate-400">Call handling, talk time, and response rates by extension</p>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
            {extBreakdown.length} Extensions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-500 font-semibold border-b border-slate-200/80 text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-4">Extension</th>
                <th className="py-2.5 px-4">Agent Name</th>
                <th className="py-2.5 px-4">Department</th>
                <th className="py-2.5 px-4">Inbound Handled</th>
                <th className="py-2.5 px-4">Outbound Placed</th>
                <th className="py-2.5 px-4">Total Calls</th>
                <th className="py-2.5 px-4">Total Duration</th>
                <th className="py-2.5 px-4 text-right">SLA Answer Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {extBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-700">No extensions registered to analyze</p>
                  </td>
                </tr>
              ) : (
                extBreakdown.map((row) => (
                  <tr key={row.ext} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-sky-600">
                      {row.ext}
                    </td>
                    <td className="py-2.5 px-4 text-slate-800 font-semibold">
                      {row.name}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 text-xs">
                      {row.dept}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-700">
                      {row.in}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-700">
                      {row.out}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                      {row.total}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">
                      {row.dur}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                          row.sla >= 80
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : row.sla >= 50
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {row.sla}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
