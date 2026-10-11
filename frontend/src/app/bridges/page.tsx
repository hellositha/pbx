'use client';

import React, { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import {
  Network,
  Plus,
  Radio,
  CheckCircle2,
  ShieldCheck,
  Globe,
  Trash2,
  Activity,
  ArrowRight,
  Server,
  X,
} from 'lucide-react';

export default function BridgesPage() {
  const toast = useToast();
  const [bridges, setBridges] = useState([
    {
      id: 'br-1',
      name: 'London HQ PBX Gateway',
      remoteHost: 'lon-pbx.eclypetechnology.local:5060',
      prefix: '8',
      status: 'CONNECTED',
      type: 'PJSIP Master-Slave Trunk',
      latency: '24ms',
      channels: '8 / 16 Channels Active',
      percent: 50,
      encryption: 'TLS 1.3 / SRTP',
    },
    {
      id: 'br-2',
      name: 'Tokyo Branch Office PBX',
      remoteHost: 'tyo-pbx.eclypetechnology.local:5060',
      prefix: '7',
      status: 'STANDBY',
      type: 'Direct PJSIP Peer',
      latency: '118ms',
      channels: '0 / 8 Channels Active',
      percent: 0,
      encryption: 'TLS 1.3 / SRTP',
    },
    {
      id: 'br-3',
      name: 'Frankfurt European Hub',
      remoteHost: 'fra-pbx.eclypetechnology.local:5060',
      prefix: '6',
      status: 'CONNECTED',
      type: 'Bi-Directional SIP Bridge',
      latency: '16ms',
      channels: '4 / 12 Channels Active',
      percent: 33,
      encryption: 'TLS 1.3 / SRTP',
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [newBridge, setNewBridge] = useState({
    name: '',
    remoteHost: '',
    prefix: '',
    type: 'PJSIP Master-Slave Trunk',
    maxChannels: 10,
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
  }>({
    isOpen: false,
    id: '',
    name: '',
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setBridges([
      ...bridges,
      {
        id: 'br-' + Date.now(),
        name: newBridge.name,
        remoteHost: newBridge.remoteHost,
        prefix: newBridge.prefix,
        status: 'CONNECTED',
        type: newBridge.type,
        latency: '32ms',
        channels: `0 / ${newBridge.maxChannels} Channels Active`,
        percent: 0,
        encryption: 'TLS 1.3 / SRTP',
      },
    ]);
    setShowModal(false);
    toast.success(`PBX Bridge "${newBridge.name}" connected via PJSIP`, 'Bridge Deployed');
    setNewBridge({ name: '', remoteHost: '', prefix: '', type: 'PJSIP Master-Slave Trunk', maxChannels: 10 });
  };

  const handleDeleteConfirmed = () => {
    setBridges(bridges.filter((b) => b.id !== deleteConfirm.id));
    toast.success(`Bridge "${deleteConfirm.name}" removed`, 'Bridge Disconnected');
    setDeleteConfirm({ isOpen: false, id: '', name: '' });
  };

  return (
    <div className="space-y-5">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Multi-Site PBX Bridges & Mesh
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80">
              {bridges.length} Bridges Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Interconnect branch office PBX installations with inter-office 4-digit dialing and peer presence routing
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-xs shadow-sky-600/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add PBX Bridge</span>
        </button>
      </div>

      {/* Bridges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bridges.map((b) => (
          <div
            key={b.id}
            className="bg-white border border-slate-200/90 hover:border-sky-300 rounded-xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 group"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600 shadow-2xs">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-sky-700 transition-colors">
                      {b.name}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      {b.type}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1.5 ${
                    b.status === 'CONNECTED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                      : 'bg-amber-50 text-amber-700 border border-amber-200/80'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      b.status === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  {b.status}
                </span>
              </div>

              {/* Specs */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1.5 text-xs font-mono mt-3">
                <div className="flex justify-between text-slate-500">
                  <span className="font-sans text-[11px]">Remote Endpoint:</span>
                  <span className="text-slate-800 font-bold">{b.remoteHost}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span className="font-sans text-[11px]">Dialing Prefix:</span>
                  <span className="text-sky-700 font-bold">{b.prefix}xxxx</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span className="font-sans text-[11px]">Latency:</span>
                  <span className="text-emerald-700 font-bold">{b.latency}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span className="font-sans text-[11px]">Security:</span>
                  <span className="text-slate-700">{b.encryption}</span>
                </div>
              </div>

              {/* Channel utilization bar */}
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Channel Capacity</span>
                  <span className="font-mono text-slate-800 font-bold">{b.channels}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-sky-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(4, b.percent)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono">Asterisk PJSIP Trunk</span>
              <button
                onClick={() => setDeleteConfirm({ isOpen: true, id: b.id, name: b.name })}
                className="p-1.5 bg-white hover:bg-rose-50 border border-slate-200 text-slate-400 hover:text-rose-600 rounded-lg transition"
                title="Disconnect Bridge"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Bridge Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600">
                  <Network className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Connect Remote PBX Bridge</h2>
                  <p className="text-[11px] text-slate-500">Link another Asterisk instance via secure PJSIP peer</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">Bridge Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New York Branch PBX"
                  value={newBridge.name}
                  onChange={(e) => setNewBridge({ ...newBridge, name: e.target.value })}
                  className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">Remote Server Host:Port</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. nyc-pbx.domain.com:5060"
                  value={newBridge.remoteHost}
                  onChange={(e) => setNewBridge({ ...newBridge, remoteHost: e.target.value })}
                  className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">Dial Prefix</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5"
                    value={newBridge.prefix}
                    onChange={(e) => setNewBridge({ ...newBridge, prefix: e.target.value })}
                    className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">Max Channels</label>
                  <input
                    type="number"
                    value={newBridge.maxChannels}
                    onChange={(e) => setNewBridge({ ...newBridge, maxChannels: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-xs transition"
                >
                  Deploy Bridge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Disconnect PBX Bridge"
        message={`Are you sure you want to disconnect PBX bridge "${deleteConfirm.name}"? Inter-office dialing to this site will become unavailable.`}
        confirmText="Disconnect"
        variant="danger"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
      />
    </div>
  );
}
