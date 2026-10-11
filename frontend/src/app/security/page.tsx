'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  History,
  Filter,
  Lock,
  Radio,
  UserX,
  Search,
  RefreshCw,
  X,
  Check,
} from 'lucide-react';

export default function SecurityPage() {
  const toast = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'EVENTS' | 'AUDIT'>('EVENTS');
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      const [evData, auditData] = await Promise.all([
        api.getSecurityEvents(),
        api.getAuditLogs(1),
      ]);
      setEvents(evData.events || []);
      setAuditLogs(auditData.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolveEvent = async (id: string) => {
    try {
      await api.resolveSecurityEvent(id);
      toast.success('Security threat status marked as resolved', 'Threat Mitigated');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to resolve threat event');
    }
  };

  const filteredEvents = events.filter((e) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      (e.eventType && e.eventType.toLowerCase().includes(s)) ||
      (e.sourceIp && e.sourceIp.includes(s)) ||
      (e.description && e.description.toLowerCase().includes(s))
    );
  });

  const filteredLogs = auditLogs.filter((l) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      (l.action && l.action.toLowerCase().includes(s)) ||
      (l.username && l.username.toLowerCase().includes(s)) ||
      (l.ipAddress && l.ipAddress.includes(s)) ||
      (l.resource && l.resource.toLowerCase().includes(s))
    );
  });

  return (
    <div className="space-y-5">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Security Operations & Firewall (SOC)
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              Firewall Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            SIP toll fraud prevention, brute-force intrusion telemetry, Fail2ban jails, and compliance activity logs
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 font-semibold text-xs shadow-xs transition hover:border-slate-300"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-600' : 'text-slate-400'}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Security Threat Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700">SIP Intrusion Defense</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 font-mono">0</span>
            <span className="text-[11px] text-slate-500 font-medium">active attacks</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Fail2ban Jails</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">3</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/70">
              Asterisk/SSH/API
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Threat Alerts</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{events.length}</span>
            <span className="text-[11px] text-slate-500 font-medium">logged</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Audit Logs</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{auditLogs.length}</span>
            <span className="text-[11px] text-slate-500 font-medium">audit trails</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setTab('EVENTS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              tab === 'EVENTS'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Threat Events ({events.length})</span>
          </button>
          <button
            onClick={() => setTab('AUDIT')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              tab === 'AUDIT'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Administrative Audit Trail ({auditLogs.length})</span>
          </button>
        </div>

        <div className="relative max-w-xs w-full hidden sm:block">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {tab === 'EVENTS' ? (
        <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-500 font-semibold border-b border-slate-200/80 text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-4 w-44">Timestamp</th>
                <th className="py-2.5 px-4">Event Type</th>
                <th className="py-2.5 px-4">Severity</th>
                <th className="py-2.5 px-4">Source IP</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                    <p className="text-xs font-semibold text-slate-800">No active security threat events</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      SIP digest authentication and firewall filters are enforcing zero toll fraud.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                      {new Date(e.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      {e.eventType}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          e.severity === 'CRITICAL' || e.severity === 'HIGH'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : e.severity === 'MEDIUM'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-sky-50 text-sky-700 border-sky-200'
                        }`}
                      >
                        {e.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-700">
                      {e.sourceIp || 'Internal'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {e.description || e.details || 'Event logged by filter'}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-semibold text-slate-600 text-[11px]">
                        {e.status || 'LOGGED'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {e.status !== 'RESOLVED' && (
                        <button
                          onClick={() => handleResolveEvent(e.id)}
                          className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200/80 transition"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Audit Trail Table */
        <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-500 font-semibold border-b border-slate-200/80 text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-4 w-44">Timestamp</th>
                <th className="py-2.5 px-4">Administrator</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Resource Target</th>
                <th className="py-2.5 px-4">Client IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-700">No administrative audit logs recorded</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">
                      {log.username || 'System Admin'}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-mono text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded border border-sky-200/60 text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">
                      {log.resource} {log.resourceId ? `(${log.resourceId.slice(0, 8)})` : ''}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-500 text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
