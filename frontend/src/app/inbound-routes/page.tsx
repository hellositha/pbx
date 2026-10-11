'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import {
  PhoneIncoming,
  Plus,
  Trash2,
  Clock,
  GitFork,
  PhoneCall,
  Layers,
  Users2,
  Voicemail,
  Search,
  X,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function InboundRoutesPage() {
  const toast = useToast();
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
  }>({
    isOpen: false,
    id: '',
    name: '',
  });
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    didPattern: '',
    destinationType: 'IVR',
    destinationTarget: '7000',
    afterHoursDestType: 'VOICEMAIL',
    afterHoursTarget: '1000',
    businessHoursStart: '09:00',
    businessHoursEnd: '17:00',
    enabled: true,
  });

  const loadRoutes = async () => {
    try {
      const data = await api.getInboundRoutes();
      setRoutes(data.routes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createInboundRoute(form);
      setShowModal(false);
      toast.success(`Inbound route for DID "${form.didPattern || 'Catch-All'}" created`, 'Route Added');
      setForm({
        name: '',
        didPattern: '',
        destinationType: 'IVR',
        destinationTarget: '7000',
        afterHoursDestType: 'VOICEMAIL',
        afterHoursTarget: '1000',
        businessHoursStart: '09:00',
        businessHoursEnd: '17:00',
        enabled: true,
      });
      loadRoutes();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create inbound route');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm.id) return;
    setDeleting(true);
    try {
      await api.deleteInboundRoute(deleteConfirm.id);
      toast.success(`Inbound route "${deleteConfirm.name}" removed`, 'Route Deleted');
      setDeleteConfirm({ isOpen: false, id: '', name: '' });
      loadRoutes();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete route');
    } finally {
      setDeleting(false);
    }
  };

  const getDestIcon = (type: string) => {
    switch (type) {
      case 'IVR':
        return <GitFork className="w-3.5 h-3.5 text-purple-600" />;
      case 'RING_GROUP':
        return <PhoneCall className="w-3.5 h-3.5 text-sky-600" />;
      case 'QUEUE':
        return <Layers className="w-3.5 h-3.5 text-amber-600" />;
      case 'VOICEMAIL':
        return <Voicemail className="w-3.5 h-3.5 text-indigo-600" />;
      default:
        return <Users2 className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  const filteredRoutes = routes.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      (r.didPattern && r.didPattern.toLowerCase().includes(q)) ||
      (r.destinationTarget && r.destinationTarget.includes(q))
    );
  });

  return (
    <div className="space-y-5">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Inbound Call Routing (DID Mappings)
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80">
              {routes.length} Active Rules
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Direct incoming DID numbers to Auto-Attendants, Ring Groups, Queues, or Extensions with time-of-day schedules
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-xs shadow-sky-600/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Inbound Route</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 flex items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by DID, rule name, or destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 transition"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          Showing {filteredRoutes.length} of {routes.length} rules
        </div>
      </div>

      {/* Inbound Routes Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 text-slate-500 font-semibold border-b border-slate-200/80 text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-4">DID Pattern / Number</th>
              <th className="py-2.5 px-4">Rule Name</th>
              <th className="py-2.5 px-4">Business Hours Destination</th>
              <th className="py-2.5 px-4">After-Hours Destination</th>
              <th className="py-2.5 px-4">Time Window</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRoutes.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <PhoneIncoming className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-semibold text-slate-700">No inbound routing rules found</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Click &quot;Add Inbound Route&quot; to configure your incoming phone numbers.</p>
                </td>
              </tr>
            ) : (
              filteredRoutes.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-4">
                    <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/60">
                      {r.didPattern || 'Catch-All (Any DID)'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">
                    {r.name}
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px]">
                      {getDestIcon(r.destinationType)}
                      <span className="font-semibold text-slate-700">{r.destinationType}:</span>
                      <span className="font-mono text-slate-900 font-bold">{r.destinationTarget}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px]">
                      {getDestIcon(r.afterHoursDestType)}
                      <span className="font-semibold text-slate-700">{r.afterHoursDestType}:</span>
                      <span className="font-mono text-slate-900 font-bold">{r.afterHoursTarget}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{r.businessHoursStart || '09:00'} - {r.businessHoursEnd || '17:00'}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => setDeleteConfirm({ isOpen: true, id: r.id, name: r.name })}
                      className="p-1.5 bg-white hover:bg-rose-50 border border-slate-200 text-slate-400 hover:text-rose-600 rounded-lg transition shadow-2xs"
                      title="Delete Inbound Route"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600">
                  <PhoneIncoming className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Add Inbound Routing Rule</h2>
                  <p className="text-[11px] text-slate-500">Route incoming DIDs based on time of day</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">Route Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Main Line DID"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">DID Pattern</label>
                  <input
                    type="text"
                    placeholder="e.g. +18005550100 or leave empty"
                    value={form.didPattern}
                    onChange={(e) => setForm({ ...form, didPattern: e.target.value })}
                    className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              {/* Business Hours Destination */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <span className="text-xs font-bold text-slate-800 block">
                  Business Hours Target
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">Destination Type</label>
                    <select
                      value={form.destinationType}
                      onChange={(e) => setForm({ ...form, destinationType: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                    >
                      <option value="IVR">IVR Auto-Attendant</option>
                      <option value="RING_GROUP">Ring Group</option>
                      <option value="QUEUE">ACD Queue</option>
                      <option value="EXTENSION">Extension</option>
                      <option value="VOICEMAIL">Voicemail</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">Target Number / Ext</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 7000 or 1001"
                      value={form.destinationTarget}
                      onChange={(e) => setForm({ ...form, destinationTarget: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* After Hours Destination */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <span className="text-xs font-bold text-slate-800 block">
                  After-Hours Target
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">Destination Type</label>
                    <select
                      value={form.afterHoursDestType}
                      onChange={(e) => setForm({ ...form, afterHoursDestType: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                    >
                      <option value="VOICEMAIL">Voicemail</option>
                      <option value="IVR">After-Hours IVR</option>
                      <option value="EXTENSION">Extension</option>
                      <option value="RING_GROUP">Emergency Ring Group</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">Target Number / Ext</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1000"
                      value={form.afterHoursTarget}
                      onChange={(e) => setForm({ ...form, afterHoursTarget: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Schedule Hours */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">Business Hours Start</label>
                  <input
                    type="time"
                    value={form.businessHoursStart}
                    onChange={(e) => setForm({ ...form, businessHoursStart: e.target.value })}
                    className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">Business Hours End</label>
                  <input
                    type="time"
                    value={form.businessHoursEnd}
                    onChange={(e) => setForm({ ...form, businessHoursEnd: e.target.value })}
                    className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
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
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{saving ? 'Saving...' : 'Deploy Route'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Inbound Route"
        message={`Are you sure you want to delete inbound rule "${deleteConfirm.name}"? Inbound calls matching this DID will no longer be routed.`}
        confirmText="Delete Route"
        variant="danger"
        isLoading={deleting}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
      />
    </div>
  );
}
