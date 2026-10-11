'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import {
  PhoneCall,
  Plus,
  Trash2,
  Edit2,
  Users,
  Clock,
  Search,
  X,
  PhoneForwarded,
  ArrowRight,
} from 'lucide-react';

export default function RingGroupsPage() {
  const toast = useToast();
  const [ringGroups, setRingGroups] = useState<any[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
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
    groupNumber: '',
    name: '',
    strategy: 'SIMULTANEOUS',
    ringTimeout: 20,
    fallbackDestType: 'VOICEMAIL',
    fallbackTarget: '1000',
    memberExtensionIds: [] as string[],
    enabled: true,
  });

  const loadData = async () => {
    try {
      const [rgData, extData] = await Promise.all([
        api.getRingGroups(),
        api.getExtensions(),
      ]);
      setRingGroups(rgData.ringGroups || []);
      setExtensions(extData.extensions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createRingGroup(form);
      setShowModal(false);
      toast.success(`Ring Group "${form.name}" deployed at Ext ${form.groupNumber}`, 'Ring Group Created');
      setForm({
        groupNumber: '',
        name: '',
        strategy: 'SIMULTANEOUS',
        ringTimeout: 20,
        fallbackDestType: 'VOICEMAIL',
        fallbackTarget: '1000',
        memberExtensionIds: [],
        enabled: true,
      });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create ring group');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm.id) return;
    setDeleting(true);
    try {
      await api.deleteRingGroup(deleteConfirm.id);
      toast.success(`Ring Group "${deleteConfirm.name}" removed`, 'Ring Group Deleted');
      setDeleteConfirm({ isOpen: false, id: '', name: '' });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete ring group');
    } finally {
      setDeleting(false);
    }
  };

  const toggleExt = (id: string) => {
    if (form.memberExtensionIds.includes(id)) {
      setForm({
        ...form,
        memberExtensionIds: form.memberExtensionIds.filter((x) => x !== id),
      });
    } else {
      setForm({
        ...form,
        memberExtensionIds: [...form.memberExtensionIds, id],
      });
    }
  };

  const filteredGroups = ringGroups.filter((g) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return g.name.toLowerCase().includes(s) || g.groupNumber.includes(s);
  });

  return (
    <div className="space-y-5">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Ring Groups (Hunt Groups)
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80">
              {ringGroups.length} Groups Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Distribute inbound calls across extension teams using simultaneous, sequential, or round-robin strategies
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-xs shadow-sky-600/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Ring Group</span>
        </button>
      </div>

      {/* Search / Filter Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 flex items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by group name or number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 transition"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          Showing {filteredGroups.length} of {ringGroups.length} ring groups
        </div>
      </div>

      {/* Grid of Groups */}
      {filteredGroups.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mx-auto mb-3">
            <PhoneCall className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Ring Groups Configured</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Create a ring group to ring multiple deskphones simultaneously or in sequence when a specific number is dialed.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-xs"
          >
            Add First Ring Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((g) => (
            <div
              key={g.id}
              className="bg-white border border-slate-200/90 hover:border-sky-300 rounded-xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 group"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600 shadow-2xs">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-sky-700 transition-colors">
                        {g.name}
                      </h3>
                      <span className="text-[11px] font-mono font-bold text-sky-600">
                        Group Ext #{g.groupNumber}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200/80 uppercase">
                    {g.strategy || 'SIMULTANEOUS'}
                  </span>
                </div>

                {/* Specs */}
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1 text-xs font-mono mt-3">
                  <div className="flex justify-between text-slate-500">
                    <span className="font-sans text-[11px]">Ring Timeout:</span>
                    <span className="text-slate-800 font-bold">{g.ringTimeout}s</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span className="font-sans text-[11px]">Fallback If Unanswered:</span>
                    <span className="text-sky-700 font-bold">{g.fallbackDestType} ({g.fallbackTarget})</span>
                  </div>
                </div>

                {/* Member Extensions */}
                <div className="mt-3.5 space-y-2">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                    Group Extension Members ({g.members?.length || 0})
                  </span>

                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {(!g.members || g.members.length === 0) ? (
                      <span className="text-xs text-slate-400 italic">No extensions assigned</span>
                    ) : (
                      g.members.map((m: any) => (
                        <span
                          key={m.id}
                          className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] font-semibold text-slate-800 inline-flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{m.extension?.displayName || m.extension?.extensionNumber}</span>
                          <span className="text-slate-400 font-mono text-[10px]">
                            ({m.extension?.extensionNumber})
                          </span>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">Asterisk Dialplan Core</span>
                <button
                  onClick={() => setDeleteConfirm({ isOpen: true, id: g.id, name: g.name })}
                  className="p-1.5 bg-white hover:bg-rose-50 border border-slate-200 text-slate-400 hover:text-rose-600 rounded-lg transition"
                  title="Delete Ring Group"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Add Ring Group (Hunt Group)</h2>
                  <p className="text-[11px] text-slate-500">Ring multiple extensions simultaneously or in order</p>
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
                  <label className="text-xs text-slate-700 font-semibold block mb-1">Group Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sales Department Ring"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">Group Extension Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 8000"
                    value={form.groupNumber}
                    onChange={(e) => setForm({ ...form, groupNumber: e.target.value })}
                    className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">Ring Strategy</label>
                  <select
                    value={form.strategy}
                    onChange={(e) => setForm({ ...form, strategy: e.target.value })}
                    className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                  >
                    <option value="SIMULTANEOUS">Simultaneous (Ring All)</option>
                    <option value="SEQUENTIAL">Sequential (Ring in Order)</option>
                    <option value="ROUND_ROBIN">Round Robin</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">Ring Timeout (sec)</label>
                  <input
                    type="number"
                    value={form.ringTimeout}
                    onChange={(e) => setForm({ ...form, ringTimeout: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">Fallback Destination</label>
                  <select
                    value={form.fallbackDestType}
                    onChange={(e) => setForm({ ...form, fallbackDestType: e.target.value })}
                    className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                  >
                    <option value="VOICEMAIL">Voicemail</option>
                    <option value="IVR">IVR Menu</option>
                    <option value="EXTENSION">Extension</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">Fallback Target</label>
                  <input
                    type="text"
                    value={form.fallbackTarget}
                    onChange={(e) => setForm({ ...form, fallbackTarget: e.target.value })}
                    className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              {/* Member Extensions Picker */}
              <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-xs font-bold text-slate-800 block">
                  Select Member Extensions
                </span>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {extensions.map((ext) => {
                    const isSelected = form.memberExtensionIds.includes(ext.id);
                    return (
                      <button
                        type="button"
                        key={ext.id}
                        onClick={() => toggleExt(ext.id)}
                        className={`p-2 rounded-xl border text-left text-xs transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-sky-50 border-sky-300 text-sky-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{ext.displayName}</span>
                        <span className="font-mono text-[10px] text-slate-400">{ext.extensionNumber}</span>
                      </button>
                    );
                  })}
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
                  <span>{saving ? 'Creating...' : 'Deploy Ring Group'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Ring Group"
        message={`Are you sure you want to delete ring group "${deleteConfirm.name}"? Calls to this group will no longer be routed.`}
        confirmText="Delete Group"
        variant="danger"
        isLoading={deleting}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
      />
    </div>
  );
}
