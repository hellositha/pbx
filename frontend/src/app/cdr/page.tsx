'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import {
  History,
  Search,
  Download,
  Filter,
  FileAudio,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneCall,
  Play,
  Volume2,
  X,
  RefreshCw,
} from 'lucide-react';

interface CallRecord {
  id: string;
  uuid?: string;
  callUuid?: string;
  direction: string;
  callerIdNum: string;
  callerIdName?: string | null;
  destination: string;
  startTime: string;
  answerTime?: string | null;
  endTime?: string | null;
  durationSeconds?: number;
  duration?: number;
  billsecSeconds?: number;
  billsec?: number;
  disposition: string;
  hangupCause?: string | null;
  recording?: {
    id: string;
    duration?: number;
    fileSize?: number;
    format?: string;
  } | null;
  trunk?: {
    id: string;
    name: string;
  } | null;
}

export default function CdrPage() {
  const { showToast } = useToast();
  const [cdrs, setCdrs] = useState<CallRecord[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [direction, setDirection] = useState('');
  const [disposition, setDisposition] = useState('');
  const [page, setPage] = useState(1);

  // Audio Playback modal
  const [activePlayback, setActivePlayback] = useState<{
    cdr: CallRecord;
    streamUrl: string;
  } | null>(null);

  const loadCdr = async (isManual = false) => {
    setLoading(true);
    try {
      const query: Record<string, string> = { page: String(page), limit: '25' };
      if (search.trim()) query.search = search.trim();
      if (direction) query.direction = direction;
      if (disposition) query.disposition = disposition;

      const data = await api.getCdr(query);
      setCdrs(data.records || []);
      setPagination(data.pagination || {});
      if (isManual) showToast('Call records refreshed', 'info');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load call detail records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCdr();
  }, [page, direction, disposition]);

  const handleExportCsv = () => {
    if (cdrs.length === 0) {
      showToast('No call records available to export', 'warning');
      return;
    }
    try {
      const headers = [
        'Call UUID',
        'Direction',
        'Caller Number',
        'Caller Name',
        'Destination',
        'Start Time',
        'Duration (Sec)',
        'Billable (Sec)',
        'Disposition',
        'Hangup Cause',
      ];
      const rows = cdrs.map((c) => [
        `"${c.uuid || c.callUuid || c.id}"`,
        `"${c.direction}"`,
        `"${c.callerIdNum || ''}"`,
        `"${c.callerIdName || ''}"`,
        `"${c.destination || ''}"`,
        `"${c.startTime || ''}"`,
        c.durationSeconds ?? c.duration ?? 0,
        c.billsecSeconds ?? c.billsec ?? 0,
        `"${c.disposition || ''}"`,
        `"${c.hangupCause || ''}"`,
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `eclype_pbx_cdr_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Exported ${cdrs.length} records to CSV`, 'success');
    } catch (err: any) {
      showToast('Failed to export CSV: ' + err.message, 'error');
    }
  };

  const formatSeconds = (sec: number = 0) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handlePlayAudio = (cdr: CallRecord) => {
    if (!cdr.recording?.id) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const streamUrl = `/api/recordings/${cdr.recording.id}/stream?token=${encodeURIComponent(token || '')}`;
    setActivePlayback({ cdr, streamUrl });
  };

  const totalAnswered = cdrs.filter((c) => c.disposition === 'ANSWERED').length;
  const totalDuration = cdrs.reduce((acc, c) => acc + (c.billsecSeconds ?? c.billsec ?? c.durationSeconds ?? 0), 0);
  const totalRecorded = cdrs.filter((c) => c.recording).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Call Detail Records (CDR)
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80">
              {pagination.total ?? cdrs.length} Total Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Enterprise call accounting, Asterisk AMI disposition logs, duration metrics, and media archives
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadCdr(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition hover:border-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs shadow-xs transition hover:border-slate-300"
          >
            <Download className="w-3.5 h-3.5 text-sky-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Page Records</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{cdrs.length}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600">
            <History className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Answered Calls</div>
            <div className="text-xl font-bold text-emerald-600 mt-0.5">{totalAnswered}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Total Talk Time</div>
            <div className="text-xl font-bold text-slate-700 mt-0.5">{formatSeconds(totalDuration)}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Audio Recordings</div>
            <div className="text-xl font-bold text-indigo-600 mt-0.5">{totalRecorded}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600">
            <FileAudio className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 flex flex-wrap items-center gap-3 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by caller ID or destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadCdr()}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <select
          value={direction}
          onChange={(e) => {
            setDirection(e.target.value);
            setPage(1);
          }}
          className="bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-sky-500 transition font-medium"
        >
          <option value="">All Call Directions</option>
          <option value="INBOUND">Inbound Calls</option>
          <option value="OUTBOUND">Outbound Calls</option>
          <option value="INTERNAL">Internal Extension Calls</option>
        </select>

        <select
          value={disposition}
          onChange={(e) => {
            setDisposition(e.target.value);
            setPage(1);
          }}
          className="bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-sky-500 transition font-medium"
        >
          <option value="">All Dispositions</option>
          <option value="ANSWERED">Answered</option>
          <option value="NO_ANSWER">No Answer</option>
          <option value="BUSY">Busy</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* CDR Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-500 font-semibold border-b border-slate-200/80 text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3.5">Start Time</th>
                <th className="py-2.5 px-3.5">Direction</th>
                <th className="py-2.5 px-3.5">Caller ID</th>
                <th className="py-2.5 px-3.5">Destination</th>
                <th className="py-2.5 px-3.5">Duration</th>
                <th className="py-2.5 px-3.5">Disposition</th>
                <th className="py-2.5 px-3.5">Hangup Cause</th>
                <th className="py-2.5 px-3.5 text-right">Media Audio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium">Loading call records...</span>
                    </div>
                  </td>
                </tr>
              ) : cdrs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-700">No call records found matching criteria</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Calls will automatically appear here as they are processed by Asterisk</p>
                  </td>
                </tr>
              ) : (
                cdrs.map((cdr) => (
                  <tr key={cdr.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3.5 text-slate-700 font-mono text-[11px]">
                      {new Date(cdr.startTime).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          cdr.direction === 'INBOUND'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : cdr.direction === 'OUTBOUND'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {cdr.direction === 'INBOUND' && <PhoneIncoming className="w-3 h-3" />}
                        {cdr.direction === 'OUTBOUND' && <PhoneOutgoing className="w-3 h-3" />}
                        {cdr.direction === 'INTERNAL' && <PhoneCall className="w-3 h-3" />}
                        <span>{cdr.direction}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-800 font-semibold">
                      <button
                        type="button"
                        onClick={() => {
                          window.dispatchEvent(
                            new CustomEvent('pbx:dial', { detail: { target: cdr.callerIdNum } })
                          );
                          showToast(`Calling ${cdr.callerIdNum}`, 'info');
                        }}
                        className="hover:text-sky-600 transition flex items-center gap-1 group text-left cursor-pointer"
                        title={`Click to call ${cdr.callerIdNum}`}
                      >
                        <Phone className="w-3 h-3 text-slate-400 group-hover:text-sky-600" />
                        <span>{cdr.callerIdNum}</span>
                        {cdr.callerIdName && (
                          <span className="text-[11px] text-slate-500 font-normal">
                            ({cdr.callerIdName})
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="py-2.5 px-3.5">
                      <button
                        type="button"
                        onClick={() => {
                          window.dispatchEvent(
                            new CustomEvent('pbx:dial', { detail: { target: cdr.destination } })
                          );
                          showToast(`Calling ${cdr.destination}`, 'info');
                        }}
                        className="font-mono font-bold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded border border-sky-200/70 inline-flex items-center gap-1 transition cursor-pointer"
                        title={`Click to call ${cdr.destination}`}
                      >
                        <span>{cdr.destination}</span>
                      </button>
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-700 font-mono text-[11px]">
                      {formatSeconds(cdr.billsecSeconds ?? cdr.billsec ?? cdr.durationSeconds ?? cdr.duration ?? 0)}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          cdr.disposition === 'ANSWERED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                            : cdr.disposition === 'NO_ANSWER'
                            ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                            : 'bg-rose-50 text-rose-700 border-rose-200/80'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            cdr.disposition === 'ANSWERED'
                              ? 'bg-emerald-500'
                              : cdr.disposition === 'NO_ANSWER'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        {cdr.disposition}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-500 text-[11px] font-mono">
                      {cdr.hangupCause || 'Normal Clearing'}
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      {cdr.recording ? (
                        <button
                          type="button"
                          onClick={() => handlePlayAudio(cdr)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[10px] font-semibold transition"
                          title="Listen to call audio recording"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Play</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[10px]">None</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {pagination.totalPages > 1 && (
          <div className="p-3 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition shadow-xs"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition shadow-xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Audio Playback Modal */}
      {activePlayback && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Call Audio Recording</h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {activePlayback.cdr.callerIdNum} &rarr; {activePlayback.cdr.destination}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActivePlayback(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Date & Time:</span>
                <span className="font-mono text-slate-900">{new Date(activePlayback.cdr.startTime).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Duration:</span>
                <span className="font-mono text-slate-900 font-bold">
                  {formatSeconds(activePlayback.cdr.durationSeconds ?? activePlayback.cdr.duration ?? 0)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Format:</span>
                <span className="font-mono text-slate-900">Asterisk WAV (16-bit PCM / 8kHz)</span>
              </div>
            </div>

            <audio
              controls
              autoPlay
              src={activePlayback.streamUrl}
              className="w-full rounded-lg outline-none"
            >
              Your browser does not support the audio element.
            </audio>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setActivePlayback(null)}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition"
              >
                Close Player
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
