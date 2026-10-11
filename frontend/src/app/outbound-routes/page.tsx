'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import {
  PhoneOutgoing,
  Plus,
  Trash2,
  ShieldAlert,
  Search,
  X,
  Radio,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';

export default function OutboundRoutesPage() {
  const toast = useToast();
  const [routes, setRoutes] = useState<any[]>([]);
  const [trunks, setTrunks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Dial Simulator State
  const [testNumber, setTestNumber] = useState('918005550199');

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
    matchPattern: '^9(\\d+)$',
    stripDigits: 1,
    prependDigits: '',
    priority: 1,
    primaryTrunkId: '',
    failoverTrunkId: '',
    outboundClass: 'LOCAL',
    enabled: true,
  });

  const loadData = async () => {
    try {
      const [routeData, trunkData] = await Promise.all([
        api.getOutboundRoutes(),
        api.getTrunks(),
      ]);
      setRoutes(routeData.routes || []);
      setTrunks(trunkData.trunks || []);
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
      await api.createOutboundRoute(form);
      setShowModal(false);
      toast.success(`Outbound route "${form.name}" created`, 'Route Added');
      setForm({
        name: '',
        matchPattern: '^9(\\d+)$',
        stripDigits: 1,
        prependDigits: '',
        priority: (routes.length || 0) + 1,
        primaryTrunkId: trunks[0]?.id || '',
        failoverTrunkId: '',
        outboundClass: 'LOCAL',
        enabled: true,
      });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create route');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm.id) return;
    setDeleting(true);
    try {
      await api.deleteOutboundRoute(deleteConfirm.id);
      toast.success(`Outbound route "${deleteConfirm.name}" removed`, 'Route Deleted');
      setDeleteConfirm({ isOpen: false, id: '', name: '' });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete route');
    } finally {
      setDeleting(false);
    }
  };

  // Dial Simulator Calculation
  const simulateDial = (input: string) => {
    if (!input) return null;
    const sorted = [...routes].sort((a, b) => a.priority - b.priority);
    for (const r of sorted) {
      try {
        const regex = new RegExp(r.matchPattern);
        if (regex.test(input)) {
          let dialed = input;
          if (r.stripDigits > 0) {
            dialed = dialed.slice(r.stripDigits);
          }
          if (r.prependDigits) {
            dialed = r.prependDigits + dialed;
          }
          const trunkName = trunks.find((t) => t.id === r.primaryTrunkId)?.name || 'Primary Trunk';
          return {
            matched: true,
            routeName: r.name,
            trunkName,
            finalDialedNumber: dialed,
            priority: r.priority,
          };
        }
      } catch (e) {}
    }
    return { matched: false };
  };

  const simResult = simulateDial(testNumber);

  return (
    <div className="space-y-5">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Outbound Dial Plans & Routing
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80">
              {routes.length} Plans Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Define dial patterns, digit stripping, carrier trunk selection, and cost/destination restrictions
          </p>
        </div>

        <button
          onClick={() => {
            setForm({
              ...form,
              primaryTrunkId: trunks[0]?.id || '',
              priority: (routes.length || 0) + 1,
            });
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-xs shadow-sky-600/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Outbound Route</span>
        </button>
      </div>

      {/* Dial Pattern Test Simulator */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-900">
              Interactive Dial Plan Simulator
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Asterisk PJSIP Pattern Tester</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={testNumber}
              onChange={(e) => setTestNumber(e.target.value)}
              placeholder="Test number to dial (e.g. 918005550199)..."
              className="w-full pl-3 pr-4 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="w-full sm:w-auto">
            {simResult?.matched ? (
              <div className="p-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-mono">
                <span className="font-bold text-emerald-700">Matches [{simResult.routeName}]</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-bold text-emerald-950">Dials: {simResult.finalDialedNumber}</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                  via {simResult.trunkName}
                </span>
              </div>
            ) : (
              <div className="p-2 px-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 font-mono">
                <span>No matching outbound route for this number</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Outbound Routes Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 text-slate-500 font-semibold border-b border-slate-200/80 text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-4 w-20">Priority</th>
              <th className="py-2.5 px-4">Route Name</th>
              <th className="py-2.5 px-4">Dial Match Pattern</th>
              <th className="py-2.5 px-4">Digit Transformations</th>
              <th className="py-2.5 px-4">Primary Gateway</th>
              <th className="py-2.5 px-4">Class of Service</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {routes.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <PhoneOutgoing className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-semibold text-slate-700">No outbound dial plans configured</p>
                </td>
              </tr>
            ) : (
              routes.map((r) => {
                const trunk = trunks.find((t) => t.id === r.primaryTrunkId);
                return (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                      #{r.priority}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      {r.name}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-sky-700 font-bold bg-sky-50/50">
                      {r.matchPattern}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 font-mono text-[11px]">
                      Strip: {r.stripDigits || 0} | Prepend: &quot;{r.prependDigits || ''}&quot;
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px]">
                        <Radio className="w-3 h-3 text-sky-600" />
                        <span className="font-semibold text-slate-800">
                          {trunk?.name || 'Assigned Trunk'}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {r.outboundClass}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => setDeleteConfirm({ isOpen: true, id: r.id, name: r.name })}
                        className="p-1.5 bg-white hover:bg-rose-50 border border-slate-200 text-slate-400 hover:text-rose-600 rounded-lg transition shadow-2xs"
                        title="Delete Outbound Route"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
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
                  <PhoneOutgoing className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Add Outbound Dial Route</h2>
                  <p className="text-[11px] text-slate-500">Configure pattern match rules and carrier trunk gateway</p>
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
                    placeholder="e.g. Standard Outbound (Prefix 9)"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">Priority Order</label>
                  <input
                    type="number"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">Regex Match Pattern</label>
                <input
                  type="text"
                  required
                  placeholder="^9(\\d+)$ or ^(\\d{10})$"
                  value={form.matchPattern}
                  onChange={(e) => setForm({ ...form, matchPattern: e.target.value })}
                  className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">Strip Leading Digits</label>
                  <input
                    type="number"
                    value={form.stripDigits}
                    onChange={(e) => setForm({ ...form, stripDigits: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">Prepend Digits</label>
                  <input
                    type="text"
                    placeholder="e.g. +1"
                    value={form.prependDigits}
                    onChange={(e) => setForm({ ...form, prependDigits: e.target.value })}
                    className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">Primary Trunk</label>
                  <select
                    value={form.primaryTrunkId}
                    onChange={(e) => setForm({ ...form, primaryTrunkId: e.target.value })}
                    className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                  >
                    {trunks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.provider})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">Class of Service</label>
                  <select
                    value={form.outboundClass}
                    onChange={(e) => setForm({ ...form, outboundClass: e.target.value })}
                    className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                  >
                    <option value="LOCAL">Local Calling Only</option>
                    <option value="DOMESTIC">Domestic National</option>
                    <option value="INTERNATIONAL">International Unrestricted</option>
                  </select>
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
        title="Delete Outbound Route"
        message={`Are you sure you want to delete dial plan rule "${deleteConfirm.name}"? Calls matching this pattern may be rejected.`}
        confirmText="Delete Route"
        variant="danger"
        isLoading={deleting}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
      />
    </div>
  );
}
