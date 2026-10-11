'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Users,
  Clock,
  Shield,
  Search,
  X,
  UserCheck,
  UserX,
  Sparkles,
} from 'lucide-react';

export default function QueuesPage() {
  const toast = useToast();
  const [queues, setQueues] = useState<any[]>([]);
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
    queueNumber: '',
    name: '',
    strategy: 'LONGEST_IDLE_AGENT',
    maxWaitTime: 300,
    maxQueueSize: 20,
    wrapUpTime: 15,
    overflowDestType: 'VOICEMAIL',
    overflowTarget: '1000',
    agentExtensionIds: [] as string[],
    enabled: true,
  });

  const loadData = async () => {
    try {
      const [qData, extData] = await Promise.all([
        api.getQueues(),
        api.getExtensions(),
      ]);
      setQueues(qData.queues || []);
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
      await api.createQueue(form);
      setShowModal(false);
      toast.success(`Call Center Queue "${form.name}" created at Ext ${form.queueNumber}`, 'Queue Deployed');
      setForm({
        queueNumber: '',
        name: '',
        strategy: 'LONGEST_IDLE_AGENT',
        maxWaitTime: 300,
        maxQueueSize: 20,
        wrapUpTime: 15,
        overflowDestType: 'VOICEMAIL',
        overflowTarget: '1000',
        agentExtensionIds: [],
        enabled: true,
      });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create queue');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAgentStatus = async (queueId: string, extId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'LOGGED_IN' ? 'PAUSED' : 'LOGGED_IN';
    try {
      await api.updateAgentStatus(queueId, extId, nextStatus);
      toast.info(`Agent status updated to ${nextStatus}`, 'Agent Roster');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update agent status');
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm.id) return;
    setDeleting(true);
    try {
      await api.deleteQueue(deleteConfirm.id);
      toast.success(`Queue "${deleteConfirm.name}" removed`, 'Queue Deleted');
      setDeleteConfirm({ isOpen: false, id: '', name: '' });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete queue');
    } finally {
      setDeleting(false);
    }
  };

  const toggleExt = (id: string) => {
    if (form.agentExtensionIds.includes(id)) {
      setForm({
        ...form,
        agentExtensionIds: form.agentExtensionIds.filter((x) => x !== id),
      });
    } else {
      setForm({
        ...form,
        agentExtensionIds: [...form.agentExtensionIds, id],
      });
    }
  };

  const filteredQueues = queues.filter((q) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return q.name.toLowerCase().includes(s) || q.queueNumber.includes(s);
  });

  return (
    <div className="space-y-5">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Call Center Queues (ACD)
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80">
              {queues.length} Queues Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automatic Call Distribution with agent tiers, skill dispatching, and SLA wait time enforcement
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-xs shadow-sky-600/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Create Call Queue</span>
        </button>
      </div>

      {/* Search / Filter Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 flex items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by queue name or number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 transition"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          Showing {filteredQueues.length} of {queues.length} queues
        </div>
      </div>

      {/* Grid of Queues */}
      {filteredQueues.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mx-auto mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Call Center Queues Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Create an ACD Queue to distribute inbound customer calls across teams of support or sales agents.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-xs"
          >
            Create First Queue
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQueues.map((q) => (
            <div
              key={q.id}
              className="bg-white border border-slate-200/90 hover:border-amber-300 rounded-xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 group"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-2xs">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-amber-700 transition-colors">
                        {q.name}
                      </h3>
                      <span className="text-[11px] font-mono font-bold text-sky-600">
                        Queue #{q.queueNumber}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 uppercase">
                    {q.strategy?.replace(/_/g, ' ') || 'ROUND ROBIN'}
                  </span>
                </div>

                {/* Queue Specs */}
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1 text-xs font-mono mt-3">
                  <div className="flex justify-between text-slate-500">
                    <span className="font-sans text-[11px]">Max Wait Time:</span>
                    <span className="text-slate-800 font-bold">{q.maxWaitTime}s</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span className="font-sans text-[11px]">Wrap-up Window:</span>
                    <span className="text-slate-800 font-medium">{q.wrapUpTime}s</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span className="font-sans text-[11px]">Overflow Route:</span>
                    <span className="text-sky-700 font-bold">{q.overflowDestType} ({q.overflowTarget})</span>
                  </div>
                </div>

                {/* Agent Members */}
                <div className="mt-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      Assigned Agent Roster ({q.agents?.length || 0})
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {(!q.agents || q.agents.length === 0) ? (
                      <div className="p-3 rounded-lg bg-slate-50 text-slate-400 text-center text-xs">
                        No agents assigned to this queue
                      </div>
                    ) : (
                      q.agents.map((agent: any) => (
                        <div
                          key={agent.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                agent.status === 'LOGGED_IN' ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                            />
                            <span className="font-semibold text-slate-800">
                              {agent.extension?.displayName || `Ext ${agent.extension?.extensionNumber}`}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              (Ext {agent.extension?.extensionNumber})
                            </span>
                          </div>

                          <button
                            onClick={() => handleToggleAgentStatus(q.id, agent.extensionId, agent.status)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition ${
                              agent.status === 'LOGGED_IN'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                            }`}
                            title="Click to toggle agent status"
                          >
                            {agent.status === 'LOGGED_IN' ? 'Active' : 'Paused'}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Delete Action */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">Asterisk ACD Core</span>
                <button
                  onClick={() => setDeleteConfirm({ isOpen: true, id: q.id, name: q.name })}
                  className="p-1.5 bg-white hover:bg-rose-50 border border-slate-200 text-slate-400 hover:text-rose-600 rounded-lg transition"
                  title="Delete Queue"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Queue Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Create Call Queue (ACD)</h2>
                  <p className="text-[11px] text-slate-500">Configure strategy, overflow target, and agents</p>
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
                  <label className="text-xs text-slate-700 font-semibold block mb-1">Queue Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tier 1 Support"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">Queue Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 6000"
                    value={form.queueNumber}
                    onChange={(e) => setForm({ ...form, queueNumber: e.target.value })}
                    className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">Dispatch Strategy</label>
                <select
                  value={form.strategy}
                  onChange={(e) => setForm({ ...form, strategy: e.target.value })}
                  className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                >
                  <option value="LONGEST_IDLE_AGENT">Longest Idle Agent First</option>
                  <option value="ROUND_ROBIN">Round Robin</option>
                  <option value="RING_ALL">Ring All Agents</option>
                  <option value="FEWEST_CALLS">Fewest Handled Calls</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">Max Wait Time (sec)</label>
                  <input
                    type="number"
                    value={form.maxWaitTime}
                    onChange={(e) => setForm({ ...form, maxWaitTime: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">Wrap-Up Time (sec)</label>
                  <input
                    type="number"
                    value={form.wrapUpTime}
                    onChange={(e) => setForm({ ...form, wrapUpTime: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">Overflow Destination</label>
                  <select
                    value={form.overflowDestType}
                    onChange={(e) => setForm({ ...form, overflowDestType: e.target.value })}
                    className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                  >
                    <option value="VOICEMAIL">Voicemail</option>
                    <option value="IVR">IVR Menu</option>
                    <option value="RING_GROUP">Fallback Ring Group</option>
                    <option value="EXTENSION">Extension</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">Overflow Target</label>
                  <input
                    type="text"
                    value={form.overflowTarget}
                    onChange={(e) => setForm({ ...form, overflowTarget: e.target.value })}
                    className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              {/* Agent Picker */}
              <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-xs font-bold text-slate-800 block">
                  Select Member Extension Agents
                </span>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {extensions.map((ext) => {
                    const isSelected = form.agentExtensionIds.includes(ext.id);
                    return (
                      <button
                        type="button"
                        key={ext.id}
                        onClick={() => toggleExt(ext.id)}
                        className={`p-2 rounded-xl border text-left text-xs transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
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
                  <span>{saving ? 'Creating...' : 'Deploy Queue'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Call Queue"
        message={`Are you sure you want to delete call queue "${deleteConfirm.name}"? Inbound routes pointing to this queue will fail.`}
        confirmText="Delete Queue"
        variant="danger"
        isLoading={deleting}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
      />
    </div>
  );
}
