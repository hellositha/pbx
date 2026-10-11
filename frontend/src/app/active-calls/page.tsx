'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { wsClient } from '@/lib/websocket';
import { useToast } from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import {
  PhoneCall,
  PhoneOff,
  CornerDownRight,
  Headphones,
  X,
  Radio,
  ArrowRight,
  PhoneForwarded,
  Activity,
  Volume2,
  Mic,
  Users2,
  RefreshCw,
} from 'lucide-react';

export default function ActiveCallsPage() {
  const toast = useToast();
  const [channels, setChannels] = useState<any[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Originate
  const [originateForm, setOriginateForm] = useState({
    callerExtension: '1001',
    destination: '1010',
  });
  const [originating, setOriginating] = useState(false);

  // Transfer Modal
  const [transferModal, setTransferModal] = useState<{ open: boolean; uuid: string }>({
    open: false,
    uuid: '',
  });
  const [transferTarget, setTransferTarget] = useState('');

  // Spy / Whisper Modal
  const [spyModal, setSpyModal] = useState<{ open: boolean; uuid: string }>({
    open: false,
    uuid: '',
  });
  const [spySupervisor, setSpySupervisor] = useState('1001');
  const [spyMode, setSpyMode] = useState<'SPY' | 'WHISPER' | 'BARGE'>('SPY');

  // Terminate confirm modal
  const [hangupConfirm, setHangupConfirm] = useState<{ open: boolean; uuid: string }>({
    open: false,
    uuid: '',
  });
  const [hangingUp, setHangingUp] = useState(false);

  const loadData = async () => {
    try {
      const [chData, extData] = await Promise.all([
        api.getLiveChannels(),
        api.getExtensions(),
      ]);
      setChannels(chData.channels || chData.calls || []);
      setExtensions(extData.extensions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const unsubscribe = wsClient.subscribe((msg) => {
      if (
        msg.type === 'CHANNEL_CREATE' ||
        msg.type === 'CHANNEL_ANSWER' ||
        msg.type === 'CHANNEL_HANGUP' ||
        msg.type === 'CHANNEL_BRIDGE'
      ) {
        loadData();
      }
    });

    const interval = setInterval(loadData, 4000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleOriginate = async (e: React.FormEvent) => {
    e.preventDefault();
    setOriginating(true);
    try {
      await api.originateCall(originateForm);
      toast.success(
        `Call dispatched from Ext ${originateForm.callerExtension} to ${originateForm.destination}`,
        'Call Originated'
      );
      loadData();
    } catch (err: any) {
      toast.error('Originate failed: ' + err.message);
    } finally {
      setOriginating(false);
    }
  };

  const handleTerminateConfirmed = async () => {
    if (!hangupConfirm.uuid) return;
    setHangingUp(true);
    try {
      await api.terminateCall(hangupConfirm.uuid);
      toast.info(`Channel ${hangupConfirm.uuid.slice(0, 8)} terminated`, 'Call Hangup');
      setHangupConfirm({ open: false, uuid: '' });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to hangup call');
    } finally {
      setHangingUp(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferModal.uuid || !transferTarget) return;
    try {
      await api.transferCall(transferModal.uuid, transferTarget);
      toast.success(`Call transferred to ${transferTarget}`, 'Call Transferred');
      setTransferModal({ open: false, uuid: '' });
      setTransferTarget('');
      loadData();
    } catch (err: any) {
      toast.error('Transfer failed: ' + err.message);
    }
  };

  const handleEavesdrop = async () => {
    if (!spyModal.uuid || !spySupervisor) return;
    try {
      await api.eavesdropCall(spyModal.uuid, spySupervisor, spyMode);
      toast.success(
        `Supervisor Ext ${spySupervisor} connected in ${spyMode} mode`,
        'Eavesdrop Dispatched'
      );
      setSpyModal({ open: false, uuid: '' });
      loadData();
    } catch (err: any) {
      toast.error('Eavesdrop dispatch failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Live Active Channels Console
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {channels.length} Live Channels
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time Asterisk 22 LTS bridge matrix, supervisor whisper/barge, and call intercept
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 font-semibold text-xs shadow-xs transition hover:border-slate-300"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-600' : 'text-slate-400'}`} />
          <span>Refresh Channels</span>
        </button>
      </div>

      {/* Quick Originate Box */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
            <PhoneForwarded className="w-3.5 h-3.5 text-sky-600" />
            Quick Call Dispatcher (Click-to-Call)
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Asterisk AMI Originate</span>
        </div>

        <form onSubmit={handleOriginate} className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600 font-semibold">From Ext:</label>
            <input
              type="text"
              value={originateForm.callerExtension}
              onChange={(e) => setOriginateForm({ ...originateForm, callerExtension: e.target.value })}
              className="bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono w-28 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600 font-semibold">To Dest:</label>
            <input
              type="text"
              value={originateForm.destination}
              onChange={(e) => setOriginateForm({ ...originateForm, destination: e.target.value })}
              className="bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono w-36 focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={originating}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {originating ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <PhoneCall className="w-3.5 h-3.5" />}
            <span>Originate Call</span>
          </button>
        </form>
      </div>

      {/* Active Channels Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 text-slate-500 font-semibold border-b border-slate-200/80 text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-4">Channel UUID</th>
              <th className="py-2.5 px-4">Caller Ext</th>
              <th className="py-2.5 px-4">Destination Target</th>
              <th className="py-2.5 px-4">Bridge State</th>
              <th className="py-2.5 px-4">Duration</th>
              <th className="py-2.5 px-4 text-right">Supervisory Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {channels.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <PhoneCall className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-semibold text-slate-700">No active calls in progress</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Telephony channels will appear here in real time when calls are placed.</p>
                </td>
              </tr>
            ) : (
              channels.map((c) => (
                <tr key={c.uuid || c.channel} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                    {(c.uuid || c.channel || '').slice(0, 12)}
                  </td>
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                    {c.callerIdNum || c.caller || c.source || 'Unknown'}
                  </td>
                  <td className="py-2.5 px-4 font-mono font-bold text-sky-700">
                    {c.destination || c.target || 'N/A'}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {c.state || 'BRIDGED'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-700">
                    {c.durationSeconds ?? c.duration ?? 0}s
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setTransferModal({ open: true, uuid: c.uuid || c.channel })}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs transition"
                        title="Transfer Call"
                      >
                        Transfer
                      </button>
                      <button
                        onClick={() => setSpyModal({ open: true, uuid: c.uuid || c.channel })}
                        className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-xs font-semibold shadow-2xs transition"
                        title="Supervisor Spy/Whisper/Barge"
                      >
                        Barge
                      </button>
                      <button
                        onClick={() => setHangupConfirm({ open: true, uuid: c.uuid || c.channel })}
                        className="p-1.5 bg-white hover:bg-rose-50 border border-slate-200 text-slate-400 hover:text-rose-600 rounded-lg transition"
                        title="Force Hangup"
                      >
                        <PhoneOff className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Transfer Modal */}
      {transferModal.open && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Transfer Live Call</h3>
              <button
                onClick={() => setTransferModal({ open: false, uuid: '' })}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1">Target Extension</label>
              <input
                type="text"
                placeholder="e.g. 1010"
                value={transferTarget}
                onChange={(e) => setTransferTarget(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setTransferModal({ open: false, uuid: '' })}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-xs"
              >
                Dispatch Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Eavesdrop / Barge Modal */}
      {spyModal.open && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Supervisor Telephony Intercept</h3>
              <button
                onClick={() => setSpyModal({ open: false, uuid: '' })}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">Supervisor Extension</label>
                <input
                  type="text"
                  value={spySupervisor}
                  onChange={(e) => setSpySupervisor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">Supervision Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['SPY', 'WHISPER', 'BARGE'] as const).map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setSpyMode(m)}
                      className={`py-1.5 rounded-xl text-xs font-bold border transition ${
                        spyMode === m
                          ? 'bg-sky-600 text-white border-sky-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSpyModal({ open: false, uuid: '' })}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleEavesdrop}
                className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-xs"
              >
                Dispatch Intercept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hangup Confirm Modal */}
      <ConfirmModal
        isOpen={hangupConfirm.open}
        title="Force Terminate Call"
        message={`Are you sure you want to forcibly hang up channel ${hangupConfirm.uuid.slice(0, 8)}? The ongoing audio stream will be disconnected immediately.`}
        confirmText="Terminate Call"
        variant="danger"
        isLoading={hangingUp}
        onConfirm={handleTerminateConfirmed}
        onCancel={() => setHangupConfirm({ open: false, uuid: '' })}
      />
    </div>
  );
}
