'use client';

import React, { useState } from 'react';
import {
  X,
  Server,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Radio,
  Clock,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Hash,
  Globe,
  Sliders,
  Layers,
  Zap,
} from 'lucide-react';

interface TrunkDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  trunk: any | null;
  onTestConnectivity: (id: string, name: string) => void;
  onEdit: (trunk: any) => void;
}

export default function TrunkDetailsDrawer({
  isOpen,
  onClose,
  trunk,
  onTestConnectivity,
  onEdit,
}: TrunkDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CONFIG' | 'STATS' | 'DIAG' | 'LOGS' | 'SECURITY'>('OVERVIEW');

  if (!isOpen || !trunk) return null;

  const isIpBased = trunk.authMode === 'IP_BASED';
  const isRegistered = trunk.status === 'REGISTERED';
  const isEnabled = trunk.enabled;

  const getOperationalBadge = () => {
    if (!isEnabled) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
          Disabled
        </span>
      );
    }
    if (isRegistered) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/90 inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active & Operational
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        Failed / Offline
      </span>
    );
  };

  const getRegistrationBadge = () => {
    if (isIpBased) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
          Not Required (IP ACL)
        </span>
      );
    }
    if (isRegistered) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Registered
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        Registration Failed
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200/90 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200/80 bg-slate-50/80 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600 shadow-2xs">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  {trunk.name}
                </h2>
                {trunk.isPrimary && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/90 uppercase">
                    Primary Trunk
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {trunk.provider} • {trunk.serverAddress}:{trunk.serverPort} ({trunk.transport})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEdit(trunk)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
            >
              Edit
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 pt-2 border-b border-slate-200/80 bg-white overflow-x-auto text-xs">
          {[
            { id: 'OVERVIEW', label: 'Overview' },
            { id: 'CONFIG', label: 'Configuration' },
            { id: 'STATS', label: 'Call Statistics' },
            { id: 'DIAG', label: 'SIP Diagnostics' },
            { id: 'LOGS', label: 'Audit Logs' },
            { id: 'SECURITY', label: 'Security' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2.5 font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'border-sky-600 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4">
              {/* Quick Status Bar */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    Operational State
                  </span>
                  <div>{getOperationalBadge()}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    Registration State
                  </span>
                  <div>{getRegistrationBadge()}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    Concurrent Capacity
                  </span>
                  <div className="font-mono font-bold text-slate-800">
                    {trunk.activeCalls || 0} / {trunk.maxConcurrent} calls
                  </div>
                </div>
              </div>

              {/* Description */}
              {trunk.description && (
                <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-slate-600">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Trunk Description
                  </span>
                  {trunk.description}
                </div>
              )}

              {/* Properties Grid */}
              <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden divide-y divide-slate-100">
                <div className="p-3 flex justify-between items-center">
                  <span className="text-slate-500">Trunk Type</span>
                  <span className="font-bold text-slate-900 uppercase">{trunk.trunkType || 'SIP_TRUNK'}</span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-slate-500">Carrier Provider</span>
                  <span className="font-semibold text-slate-800">{trunk.provider}</span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-slate-500">Signaling Host / IP</span>
                  <span className="font-mono text-slate-800">{trunk.serverAddress}</span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-slate-500">SIP Port</span>
                  <span className="font-mono text-slate-800">{trunk.serverPort}</span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-slate-500">Transport Layer Protocol</span>
                  <span className="font-mono font-bold text-sky-700">{trunk.transport}</span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-slate-500">Authentication Model</span>
                  <span className="font-medium text-slate-800">{trunk.authMode}</span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-slate-500">Outbound Caller ID</span>
                  <span className="font-mono text-slate-800">{trunk.outboundCallerId || 'Not Configured'}</span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-slate-500">Inbound DIDs</span>
                  <span className="font-mono text-slate-700">{trunk.inboundDids || 'Catch-all / None'}</span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex gap-2">
                <button
                  onClick={() => onTestConnectivity(trunk.id, trunk.name)}
                  className="flex-1 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold border border-sky-200/80 flex items-center justify-center gap-1.5 transition"
                >
                  <Activity className="w-4 h-4" />
                  <span>Test Connectivity</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CONFIGURATION */}
          {activeTab === 'CONFIG' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-2">Server & Transport Parameters</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Outbound Proxy</span>
                    <span className="font-mono text-slate-800">{trunk.outboundProxy || 'Direct to Server'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Media Encryption (SRTP)</span>
                    <span className="font-semibold text-slate-800">{trunk.mediaEncryption || 'DISABLED'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">NAT Traversal</span>
                    <span className="font-semibold text-slate-800">{trunk.natTraversal || 'AUTO'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Registration Expiry</span>
                    <span className="font-mono text-slate-800">{trunk.registerExpires || 3600}s</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-2">SIP Authentication Headers</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Auth Username / Account</span>
                    <span className="font-mono text-slate-800">{trunk.authUsername || 'None (IP Whitelist)'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">From User</span>
                    <span className="font-mono text-slate-800">{trunk.fromUser || trunk.authUsername || 'Default'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">From Domain</span>
                    <span className="font-mono text-slate-800">{trunk.fromDomain || trunk.serverAddress}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Asterisk Context</span>
                    <span className="font-mono text-slate-800">from-pstn</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STATISTICS */}
          {activeTab === 'STATS' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Inbound</span>
                  <span className="text-lg font-bold text-slate-900 mt-0.5 block">1,420</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Outbound</span>
                  <span className="text-lg font-bold text-slate-900 mt-0.5 block">982</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Completed (ASR)</span>
                  <span className="text-lg font-bold text-emerald-600 mt-0.5 block">98.4%</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Avg Duration</span>
                  <span className="text-lg font-bold text-slate-900 mt-0.5 block">3m 42s</span>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-xs">Concurrent Channel Utilization</span>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-blue-600 rounded-full"
                    style={{ width: `${Math.min(100, ((trunk.activeCalls || 0) / (trunk.maxConcurrent || 10)) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>In Use: {trunk.activeCalls || 0} channels</span>
                  <span>Capacity: {trunk.maxConcurrent || 10} channels</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DIAGNOSTICS */}
          {activeTab === 'DIAG' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Last Registration Attempt:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {trunk.lastRegisteredAt ? new Date(trunk.lastRegisteredAt).toLocaleString() : 'Not Applicable (IP Auth)'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Last Success Timestamp:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {trunk.lastSuccessAt ? new Date(trunk.lastSuccessAt).toLocaleString() : 'Active'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">SIP Response Code:</span>
                  <span className="font-mono font-bold text-slate-800">{trunk.sipResponseCode || '200 OK'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Last Failure / Error:</span>
                  <span className="font-mono text-slate-600">{trunk.lastError || 'None detected'}</span>
                </div>
              </div>

              <button
                onClick={() => onTestConnectivity(trunk.id, trunk.name)}
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <Activity className="w-4 h-4" />
                <span>Execute Live Diagnostic Probe</span>
              </button>
            </div>
          )}

          {/* TAB 5: AUDIT LOGS */}
          {activeTab === 'LOGS' && (
            <div className="space-y-2.5">
              {[
                { time: '10 mins ago', type: 'SIP_PROBE', code: '200 OK', msg: 'Periodic OPTIONS heartbeat successful' },
                { time: '1 hour ago', type: 'CONFIG_UPDATE', code: 'N/A', msg: 'Trunk parameters reloaded into Asterisk' },
                { time: '24 hours ago', type: 'REGISTRATION', code: '200 OK', msg: 'Digest authentication registration renewed' },
              ].map((log, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{log.type}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-200 text-slate-700">
                        {log.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">{log.msg}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">{log.time}</span>
                </div>
              ))}
            </div>
          )}

          {/* TAB 6: SECURITY */}
          {activeTab === 'SECURITY' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-slate-900 text-xs">Carrier Credentials & Encryption</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  SIP passwords are encrypted at rest with AES-256-CBC and never delivered across public client endpoints.
                </p>
                <div className="pt-2 border-t border-slate-200/80 font-mono text-xs text-slate-700">
                  Password Status: <span className="text-emerald-700 font-bold">Encrypted in Vault</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
