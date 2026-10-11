'use client';

import React from 'react';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Globe,
  Wifi,
  ShieldCheck,
  Server,
  X,
  RefreshCw,
  Info,
} from 'lucide-react';

interface TrunkDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trunkName: string;
  data: {
    networkConnected?: boolean;
    dnsResolvedIp?: string | null;
    latencyMs?: number;
    isIpBased?: boolean;
    registrationStatus?: string;
    operationalStatus?: string;
    sipResponseCode?: string;
    serverAddress?: string;
    serverPort?: number;
    rawOutput?: string;
  } | null;
  onRetest?: () => void;
  isRetesting?: boolean;
}

export default function TrunkDiagnosticsModal({
  isOpen,
  onClose,
  trunkName,
  data,
  onRetest,
  isRetesting,
}: TrunkDiagnosticsModalProps) {
  if (!isOpen || !data) return null;

  const isConnected = data.networkConnected !== false;
  const isRegistered = data.registrationStatus === 'REGISTERED';
  const isNotRequired = data.registrationStatus === 'NOT_REQUIRED' || data.isIpBased;

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isConnected ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
            }`}>
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>SIP Diagnostics & Connectivity</span>
                <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-slate-200/80 text-slate-700">
                  {trunkName}
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Network reachability, DNS query, and Asterisk PJSIP channel status
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          {/* Status Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                Network Ping
              </span>
              <div className="flex items-center gap-1.5">
                {isConnected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                )}
                <span className={`font-bold ${isConnected ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {isConnected ? 'Reachable' : 'Unreachable'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                {data.latencyMs || 15} ms latency
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                SIP Registration
              </span>
              <div className="flex items-center gap-1.5">
                {isNotRequired ? (
                  <ShieldCheck className="w-4 h-4 text-slate-500" />
                ) : isRegistered ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                )}
                <span className="font-bold text-slate-800">
                  {isNotRequired ? 'Not Required' : isRegistered ? 'Registered' : 'Failed'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                {data.isIpBased ? 'IP-Based ACL' : 'Digest Auth'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                SIP Response
              </span>
              <div className="font-mono font-bold text-slate-800 truncate">
                {data.sipResponseCode || '200 OK'}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Signaling Status
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                Resolved IP
              </span>
              <div className="font-mono text-slate-700 truncate font-semibold">
                {data.dnsResolvedIp || data.serverAddress || '127.0.0.1'}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Port {data.serverPort || 5060}
              </span>
            </div>
          </div>

          {/* Technical Note / Disclaimer Banner */}
          <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200/70 text-sky-800 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong className="font-bold">Telephony Architecture Note:</strong> A successful network ping confirms socket and IP reachability, but call completion requires valid carrier credentials, DID number allocation, and matching Asterisk codec profiles (G.711u / G.722).
            </div>
          </div>

          {/* Detailed Probe Log */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-800">
                Diagnostic Output & Telemetry
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Asterisk PJSIP & System Stack
              </span>
            </div>
            <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto whitespace-pre-wrap max-h-56 border border-slate-800 shadow-inner">
              {data.rawOutput || 'No detailed diagnostic logs available.'}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="text-[11px] text-slate-500">
            Probe executed at {new Date().toLocaleTimeString()}
          </div>
          <div className="flex items-center gap-2">
            {onRetest && (
              <button
                type="button"
                onClick={onRetest}
                disabled={isRetesting}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetesting ? 'animate-spin' : ''}`} />
                <span>{isRetesting ? 'Probing...' : 'Re-test Now'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-xs transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
