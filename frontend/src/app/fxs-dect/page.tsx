'use client';

import React, { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import {
  Cpu,
  Plus,
  Radio,
  Server,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Zap,
  Phone,
  Printer,
  X,
} from 'lucide-react';

export default function FxsDectPage() {
  const toast = useToast();
  const [gateways, setGateways] = useState([
    {
      id: 'gw-1',
      model: 'Grandstream HT818',
      type: '8-Port FXS Gateway',
      category: 'ANALOG_FXS',
      ports: '8 FXS Ports',
      assigned: 'Fax Room (Ext 1009), Warehouse 1-7',
      ip: '192.168.1.180',
      mac: '00:0B:82:94:C1:22',
      status: 'ONLINE',
      portStatus: [
        { port: 1, label: 'Fax Machine', ext: '1009', state: 'ON_HOOK' },
        { port: 2, label: 'Warehouse Bell', ext: '1012', state: 'ON_HOOK' },
        { port: 3, label: 'Front Gate Intercom', ext: '1013', state: 'ON_HOOK' },
        { port: 4, label: 'Elevator Emergency', ext: '1014', state: 'ON_HOOK' },
        { port: 5, label: 'Security Desk', ext: '1015', state: 'ON_HOOK' },
        { port: 6, label: 'Breakroom', ext: '1016', state: 'ON_HOOK' },
        { port: 7, label: 'Loading Dock', ext: '1017', state: 'ON_HOOK' },
        { port: 8, label: 'Spare Port', ext: 'Unassigned', state: 'IDLE' },
      ],
    },
    {
      id: 'gw-2',
      model: 'Yealink W70B',
      type: 'Cordless DECT Base Station',
      category: 'DECT_WIRELESS',
      ports: '10 Handsets Capacity',
      assigned: 'Factory Floor (Ext 1008)',
      ip: '192.168.1.185',
      mac: '80:5E:0C:44:E2:10',
      status: 'ONLINE',
      portStatus: [
        { port: 1, label: 'Floor Manager Handset', ext: '1008', state: 'ON_HOOK' },
        { port: 2, label: 'Inventory Roamer 1', ext: '1018', state: 'ON_HOOK' },
        { port: 3, label: 'Inventory Roamer 2', ext: '1019', state: 'ON_HOOK' },
      ],
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [newGw, setNewGw] = useState({
    model: 'Grandstream HT802 (2-Port FXS)',
    type: 'Analog FXS Adapter',
    category: 'ANALOG_FXS',
    ports: '2 FXS Ports',
    assigned: 'Office Fax Line',
    ip: '192.168.1.190',
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: string;
    model: string;
  }>({
    isOpen: false,
    id: '',
    model: '',
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setGateways([
      ...gateways,
      {
        id: 'gw-' + Date.now(),
        model: newGw.model,
        type: newGw.type,
        category: newGw.category,
        ports: newGw.ports,
        assigned: newGw.assigned,
        ip: newGw.ip,
        mac: '00:0B:82:' + Math.random().toString(16).substr(2, 6).toUpperCase(),
        status: 'ONLINE',
        portStatus: [
          { port: 1, label: 'Line 1', ext: '1020', state: 'ON_HOOK' },
          { port: 2, label: 'Line 2', ext: '1021', state: 'ON_HOOK' },
        ],
      },
    ]);
    setShowModal(false);
    toast.success(`Adapter "${newGw.model}" provisioned successfully`, 'Gateway Added');
  };

  const handleDeleteConfirmed = () => {
    setGateways(gateways.filter((g) => g.id !== deleteConfirm.id));
    toast.success(`Adapter "${deleteConfirm.model}" removed`, 'Gateway Disconnected');
    setDeleteConfirm({ isOpen: false, id: '', model: '' });
  };

  return (
    <div className="space-y-5">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Analog FXS Adapters & DECT Stations
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80">
              {gateways.length} Units Deployed
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage legacy PSTN adapters, analog fax machines, emergency elevators, and cordless DECT wireless multi-cell stations
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-xs shadow-sky-600/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add FXS / DECT Station</span>
        </button>
      </div>

      {/* Gateways Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {gateways.map((g) => (
          <div
            key={g.id}
            className="bg-white border border-slate-200/90 hover:border-sky-300 rounded-xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 group"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600 shadow-2xs">
                    <Cpu className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-sky-700 transition-colors">
                      {g.model}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {g.type} • MAC {g.mac}
                    </span>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {g.status}
                </span>
              </div>

              {/* Hardware Specs */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 mt-3">
                <div>
                  <span className="font-sans text-[11px] text-slate-400 block">IP Address:</span>
                  <span className="text-slate-800 font-bold">{g.ip}</span>
                </div>
                <div>
                  <span className="font-sans text-[11px] text-slate-400 block">Port Count:</span>
                  <span className="text-slate-800 font-bold">{g.ports}</span>
                </div>
              </div>

              {/* Visual RJ11 / Handset Ports Matrix */}
              <div className="mt-3.5 space-y-2">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                  Port Mapping & Line Status
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {g.portStatus.map((p) => (
                    <div
                      key={p.port}
                      className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] font-bold text-slate-500">
                          Port {p.port}
                        </span>
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            p.state === 'ON_HOOK' ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        />
                      </div>
                      <div className="text-[11px] font-semibold text-slate-800 truncate" title={p.label}>
                        {p.label}
                      </div>
                      <div className="text-[10px] text-sky-600 font-mono font-bold mt-0.5">
                        {p.ext}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono">SIP Provisioning Profile</span>
              <button
                onClick={() => setDeleteConfirm({ isOpen: true, id: g.id, model: g.model })}
                className="p-1.5 bg-white hover:bg-rose-50 border border-slate-200 text-slate-400 hover:text-rose-600 rounded-lg transition"
                title="Remove Gateway"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Provision Analog / DECT Adapter</h2>
                  <p className="text-[11px] text-slate-500">Auto-generate Asterisk PJSIP configuration profile</p>
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
                <label className="text-xs text-slate-700 font-semibold block mb-1">Hardware Model</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grandstream HT818 or Yealink W70B"
                  value={newGw.model}
                  onChange={(e) => setNewGw({ ...newGw, model: e.target.value })}
                  className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">Device Type</label>
                <select
                  value={newGw.type}
                  onChange={(e) => setNewGw({ ...newGw, type: e.target.value })}
                  className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                >
                  <option value="Analog FXS Gateway (PSTN/Fax)">Analog FXS Gateway (PSTN/Fax)</option>
                  <option value="Cordless DECT Base Station">Cordless DECT Base Station</option>
                  <option value="Analog FXO Gateway (CO Lines)">Analog FXO Gateway (CO Lines)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">IP Address</label>
                  <input
                    type="text"
                    required
                    placeholder="192.168.1.180"
                    value={newGw.ip}
                    onChange={(e) => setNewGw({ ...newGw, ip: e.target.value })}
                    className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">Port Count</label>
                  <input
                    type="text"
                    value={newGw.ports}
                    onChange={(e) => setNewGw({ ...newGw, ports: e.target.value })}
                    className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">Assigned Extensions / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Fax Room (Ext 1009)"
                  value={newGw.assigned}
                  onChange={(e) => setNewGw({ ...newGw, assigned: e.target.value })}
                  className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                />
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
                  Deploy Adapter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Remove Hardware Gateway"
        message={`Are you sure you want to remove adapter "${deleteConfirm.model}"? Connected analog lines or DECT handsets will be disconnected.`}
        confirmText="Remove Gateway"
        variant="danger"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: '', model: '' })}
      />
    </div>
  );
}
