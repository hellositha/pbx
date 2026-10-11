'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  Users2,
  Plus,
  Search,
  Key,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Phone,
  Shield,
  Voicemail,
  Copy,
  Check,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  Server,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface ExtensionItem {
  id: string;
  extensionNumber: string;
  displayName: string;
  enabled: boolean;
  callWaiting: boolean;
  maxCalls: number;
  outboundClass: string;
  dnd: boolean;
  recordCalls: string;
  department?: { id: string; name: string; code: string } | null;
  user?: { id: string; username: string; email: string; firstName: string; lastName: string } | null;
  voicemailBox?: { id: string; mailbox: string; messageCount: number } | null;
  status: 'ONLINE' | 'OFFLINE';
  ipAddress?: string | null;
  registration?: {
    contact?: string;
    ip?: string;
    port?: number;
    agent?: string;
    status?: string;
  } | null;
  createdAt: string;
}

export default function ExtensionsPage() {
  const { showToast } = useToast();
  const [extensions, setExtensions] = useState<ExtensionItem[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Form Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Confirm Modal State
  const [pendingAction, setPendingAction] = useState<{
    type: 'reset' | 'delete';
    id: string;
    num: string;
  } | null>(null);

  // Credential Notification Modal State
  const [credentialModal, setCredentialModal] = useState<{
    isOpen: boolean;
    credentials: {
      extensionNumber: string;
      sipPassword?: string;
      realm?: string;
      displayName?: string;
    } | null;
    isReset?: boolean;
  }>({
    isOpen: false,
    credentials: null,
    isReset: false,
  });

  const [showPlainPassword, setShowPlainPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form Fields State
  const [form, setForm] = useState({
    extensionNumber: '',
    displayName: '',
    password: '',
    departmentId: '',
    userId: '',
    outboundClass: 'INTERNAL',
    maxSimultaneousCalls: 2,
    callWaiting: true,
    forwardAlways: '',
    forwardBusy: '',
    forwardNoAnswer: '',
    voicemailEnabled: true,
    voicemailPin: '1234',
  });

  const loadData = async () => {
    try {
      const [extData, deptData, userData] = await Promise.all([
        api.getExtensions(),
        api.getDepartments(),
        api.getUsers(),
      ]);
      setExtensions(extData.extensions || []);
      setDepartments(deptData.departments || []);
      setUsers(userData.users || []);
    } catch (err) {
      console.error('Failed to load extensions data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormError(null);
    setForm({
      extensionNumber: '',
      displayName: '',
      password: '',
      departmentId: departments[0]?.id || '',
      userId: '',
      outboundClass: 'INTERNAL',
      maxSimultaneousCalls: 2,
      callWaiting: true,
      forwardAlways: '',
      forwardBusy: '',
      forwardNoAnswer: '',
      voicemailEnabled: true,
      voicemailPin: '1234',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (ext: ExtensionItem) => {
    setIsEditing(true);
    setEditingId(ext.id);
    setFormError(null);
    setForm({
      extensionNumber: ext.extensionNumber,
      displayName: ext.displayName,
      password: '',
      departmentId: ext.department?.id || '',
      userId: ext.user?.id || '',
      outboundClass: ext.outboundClass || 'INTERNAL',
      maxSimultaneousCalls: ext.maxCalls || 2,
      callWaiting: ext.callWaiting ?? true,
      forwardAlways: '',
      forwardBusy: '',
      forwardNoAnswer: '',
      voicemailEnabled: !!ext.voicemailBox,
      voicemailPin: ext.voicemailBox?.mailbox ? '1234' : '1234',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      if (isEditing && editingId) {
        await api.updateExtension(editingId, {
          displayName: form.displayName,
          departmentId: form.departmentId || null,
          userId: form.userId || null,
          outboundClass: form.outboundClass,
          maxCalls: Number(form.maxSimultaneousCalls),
          callWaiting: form.callWaiting,
          voicemailEnabled: form.voicemailEnabled,
          voicemailPin: form.voicemailPin,
        });
        setShowModal(false);
        showToast(`Extension ${form.extensionNumber} updated successfully`, 'success');
        await loadData();
      } else {
        const res = await api.createExtension({
          extensionNumber: form.extensionNumber.trim(),
          displayName: form.displayName.trim(),
          password: form.password.trim() || undefined,
          departmentId: form.departmentId || null,
          userId: form.userId || null,
          outboundClass: form.outboundClass,
          callWaiting: form.callWaiting,
          maxCalls: Number(form.maxSimultaneousCalls),
          vmPassword: form.voicemailPin || form.extensionNumber,
        });

        setShowModal(false);
        showToast(`Extension ${form.extensionNumber} provisioned on PBX core`, 'success');

        // Open Credential Modal with provisioned SIP credentials
        if (res.initialCredentials) {
          setShowPlainPassword(false);
          setCredentialModal({
            isOpen: true,
            credentials: {
              extensionNumber: res.initialCredentials.extensionNumber,
              sipPassword: res.initialCredentials.sipPassword,
              realm: res.initialCredentials.realm,
              displayName: form.displayName,
            },
            isReset: false,
          });
        }

        await loadData();
      }
    } catch (err: any) {
      setFormError(err.message || 'Operation failed. Please review input.');
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSecret = (id: string, num: string) => {
    setPendingAction({ type: 'reset', id, num });
  };

  const handleDelete = (id: string, num: string) => {
    setPendingAction({ type: 'delete', id, num });
  };

  const handleExecutePendingAction = async () => {
    if (!pendingAction) return;
    const { type, id, num } = pendingAction;
    setPendingAction(null);

    if (type === 'reset') {
      try {
        const res = await api.resetExtensionSecret(id);
        setShowPlainPassword(false);
        setCredentialModal({
          isOpen: true,
          credentials: {
            extensionNumber: num,
            sipPassword: res.credentials?.newPassword || res.newPassword,
            realm: res.credentials?.realm || '49.156.43.92',
          },
          isReset: true,
        });
        showToast(`SIP secret regenerated for Extension ${num}`, 'success');
        await loadData();
      } catch (err: any) {
        showToast(err.message || 'Failed to reset password', 'error');
      }
    } else if (type === 'delete') {
      try {
        await api.deleteExtension(id);
        showToast(`Extension ${num} permanently deleted`, 'success');
        await loadData();
      } catch (err: any) {
        showToast(err.message || 'Failed to delete extension', 'error');
      }
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleCopyAllCredentials = () => {
    if (!credentialModal.credentials) return;
    const cred = credentialModal.credentials;
    const content = [
      `Eclype Technology PBX - SIP Credentials`,
      `=================================`,
      `Extension / User : ${cred.extensionNumber}`,
      `SIP Username     : ${cred.extensionNumber}`,
      `SIP Password     : ${cred.sipPassword || 'N/A'}`,
      `Domain / Realm   : ${cred.realm || '49.156.43.92'}`,
      `SIP Port         : 5060 (UDP/TCP), 5066 (WSS WebRTC)`,
      `Transport        : UDP / TCP / WSS`,
      `Generated At     : ${new Date().toISOString()}`,
    ].join('\n');

    handleCopy(content, 'all');
  };

  // Safe search filtering with full null-guards
  const term = (search || '').trim().toLowerCase();
  const filtered = extensions.filter((e) => {
    if (!e) return false;
    const num = String(e.extensionNumber || '').toLowerCase();
    const name = String(e.displayName || '').toLowerCase();
    const dept = String(e.department?.name || '').toLowerCase();
    return num.includes(term) || name.includes(term) || dept.includes(term);
  });

  return (
    <div className="space-y-4">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              SIP Extension Directory
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80">
              {filtered.length} Endpoints
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure SIP user endpoints, digest credentials, call forwarding, and voicemail boxes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition border border-slate-200/90 shadow-xs hover:border-slate-300"
            title="Refresh extension list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-600' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-xs shadow-sky-600/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Provision Extension</span>
          </button>
        </div>
      </div>

      {/* Metric Summary Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Total Endpoints</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{extensions.length}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600">
            <Users2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Registered Online</div>
            <div className="text-xl font-bold text-emerald-600 mt-0.5">
              {extensions.filter((e) => e.status === 'ONLINE').length}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Offline Endpoints</div>
            <div className="text-xl font-bold text-slate-600 mt-0.5">
              {extensions.filter((e) => e.status !== 'ONLINE').length}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
            <XCircle className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Voicemail Active</div>
            <div className="text-xl font-bold text-indigo-600 mt-0.5">
              {extensions.filter((e) => e.voicemailBox).length}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600">
            <Voicemail className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 flex items-center gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search extension by number, name, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 transition"
          />
        </div>
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-xs text-slate-500 hover:text-slate-800 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg"
          >
            Clear
          </button>
        )}
      </div>

      {/* Extension Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 text-slate-500 font-semibold border-b border-slate-200/80 text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-3.5">Extension</th>
              <th className="py-2.5 px-3.5">Display Name</th>
              <th className="py-2.5 px-3.5">Department</th>
              <th className="py-2.5 px-3.5">Registration</th>
              <th className="py-2.5 px-3.5">Device IP / Agent</th>
              <th className="py-2.5 px-3.5">Outbound Class</th>
              <th className="py-2.5 px-3.5">Voicemail</th>
              <th className="py-2.5 px-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-medium">Loading SIP extensions...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users2 className="w-8 h-8 text-slate-300" />
                    <p className="font-semibold text-slate-800 text-sm">No extensions found</p>
                    <p className="text-xs text-slate-500 max-w-sm">
                      {search
                        ? `No extensions matching "${search}". Try searching by a different term.`
                        : "No SIP extensions currently provisioned. Click 'Provision Extension' to create your first phone endpoint."}
                    </p>
                    {search && (
                      <button
                        onClick={() => setSearch('')}
                        className="mt-2 px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs"
                      >
                        Clear Filter
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((ext) => (
                <tr key={ext.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3.5">
                    <button
                      type="button"
                      onClick={() => {
                        window.dispatchEvent(
                          new CustomEvent('pbx:dial', { detail: { target: ext.extensionNumber } })
                        );
                        showToast(`Calling Ext ${ext.extensionNumber} (${ext.displayName})`, 'info');
                      }}
                      className="font-mono font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 hover:text-sky-800 px-2 py-0.5 rounded border border-sky-200/70 inline-flex items-center gap-1.5 transition group cursor-pointer shadow-2xs"
                      title={`Click to dial Extension ${ext.extensionNumber} via WebRTC`}
                    >
                      <Phone className="w-3 h-3 text-sky-500 group-hover:scale-110 transition-transform" />
                      <span>{ext.extensionNumber}</span>
                    </button>
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-900 font-semibold">
                    {ext.displayName}
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-500">
                    {ext.department?.name || <span className="text-slate-400 italic">Unassigned</span>}
                  </td>
                  <td className="py-2.5 px-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ext.status === 'ONLINE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          ext.status === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                        }`}
                      />
                      {ext.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 font-mono text-[11px]">
                    {ext.registration?.ip ? (
                      <div>
                        <span className="text-slate-800 font-medium">
                          {ext.registration.ip}:{ext.registration.port || 5060}
                        </span>
                        {ext.registration.agent && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[130px]" title={ext.registration.agent}>
                            {ext.registration.agent}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">None / Offline</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60 text-[10px] font-bold">
                      {ext.outboundClass}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-500">
                    {ext.voicemailBox ? `Box ${ext.extensionNumber}` : 'Disabled'}
                  </td>
                  <td className="py-2.5 px-3.5 text-right space-x-1.5">
                    <button
                      onClick={() => handleResetSecret(ext.id, ext.extensionNumber)}
                      className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-sky-600 rounded-lg transition shadow-2xs"
                      title="Reset SIP Password"
                    >
                      <Key className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(ext)}
                      className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-sky-600 rounded-lg transition shadow-2xs"
                      title="Edit Extension"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(ext.id, ext.extensionNumber)}
                      className="p-1.5 bg-white hover:bg-rose-50 border border-slate-200 text-slate-500 hover:text-rose-600 rounded-lg transition shadow-2xs"
                      title="Delete Extension"
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

      {/* SUCCESS / CREDENTIAL CONFIRMATION MODAL */}
      {credentialModal.isOpen && credentialModal.credentials && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${credentialModal.isReset ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                  {credentialModal.isReset ? <Key className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {credentialModal.isReset ? 'SIP Credentials Regenerated' : 'Extension Provisioned Successfully'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {credentialModal.isReset
                      ? `New SIP authentication secret created for Ext ${credentialModal.credentials.extensionNumber}`
                      : `Extension ${credentialModal.credentials.extensionNumber} is live on Asterisk PBX`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCredentialModal({ isOpen: false, credentials: null })}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Credential Details Card */}
            <div className="bg-slate-50/80 rounded-xl border border-slate-200/90 p-4 space-y-3 font-mono text-xs">
              {credentialModal.credentials.displayName && (
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 font-sans">
                  <span className="text-slate-500 text-xs">Display Name:</span>
                  <span className="text-slate-900 font-semibold text-xs">{credentialModal.credentials.displayName}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-sans">Extension / User:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sky-700 font-bold text-xs bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200">
                    {credentialModal.credentials.extensionNumber}
                  </span>
                  <button
                    onClick={() => handleCopy(credentialModal.credentials!.extensionNumber, 'ext')}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition"
                    title="Copy Extension Number"
                  >
                    {copiedKey === 'ext' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-sans">SIP Password:</span>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-800 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 select-all font-mono">
                    {showPlainPassword
                      ? credentialModal.credentials.sipPassword
                      : '••••••••••••••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPlainPassword(!showPlainPassword)}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition"
                    title={showPlainPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showPlainPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleCopy(credentialModal.credentials!.sipPassword || '', 'pass')}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition"
                    title="Copy Password"
                  >
                    {copiedKey === 'pass' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-sans">Domain / Realm:</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-800 font-medium">
                    {credentialModal.credentials.realm || '49.156.43.92'}
                  </span>
                  <button
                    onClick={() => handleCopy(credentialModal.credentials?.realm || '49.156.43.92', 'realm')}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition"
                    title="Copy Realm"
                  >
                    {copiedKey === 'realm' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-slate-500 text-[11px] pt-2 border-t border-slate-200 font-sans">
                <span>SIP Ports / Transport:</span>
                <span className="text-slate-800 font-mono font-medium">5060 (UDP/TCP) | 5066 (WSS WebRTC)</span>
              </div>
            </div>

            {/* Security Alert */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-amber-800 leading-relaxed">
                <strong className="font-semibold text-amber-900">Security Note: </strong>
                SIP passwords are encrypted in PostgreSQL using AES-256 and will not be displayed again. Please copy and store them now to configure your IP phone or softphone client.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={handleCopyAllCredentials}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition"
              >
                {copiedKey === 'all' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied All Settings!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy All Credentials</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setCredentialModal({ isOpen: false, credentials: null })}
                className="px-5 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-xs shadow-sky-600/20 transition active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600">
                  <Phone className="w-4 h-4" />
                </div>
                <span>{isEditing ? `Edit Extension ${form.extensionNumber}` : 'Provision New SIP Extension'}</span>
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">
                    Extension Number *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isEditing}
                    placeholder="e.g. 1007"
                    value={form.extensionNumber}
                    onChange={(e) => setForm({ ...form, extensionNumber: e.target.value })}
                    className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-500 transition"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Support Desk"
                    value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                    className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
              </div>

              {!isEditing && (
                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">
                    Custom SIP Password (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Leave empty to auto-generate a secure password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:border-sky-500 transition"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    If left blank, a strong cryptographic secret will be generated automatically.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">
                    Department
                  </label>
                  <select
                    value={form.departmentId}
                    onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                    className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 transition"
                  >
                    <option value="">None (Unassigned)</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">
                    Outbound Calling Class
                  </label>
                  <select
                    value={form.outboundClass}
                    onChange={(e) => setForm({ ...form, outboundClass: e.target.value })}
                    className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 transition"
                  >
                    <option value="INTERNAL">INTERNAL ONLY</option>
                    <option value="LOCAL">LOCAL CALLS</option>
                    <option value="DOMESTIC">DOMESTIC LONG DISTANCE</option>
                    <option value="INTERNATIONAL">INTERNATIONAL</option>
                    <option value="UNRESTRICTED">UNRESTRICTED</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/90 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-semibold text-slate-800 block">Voicemail Box</label>
                    <span className="text-[10px] text-slate-500">Enable Asterisk voicemail answering</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.voicemailEnabled}
                    onChange={(e) => setForm({ ...form, voicemailEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-sky-600 border-slate-300 accent-sky-600"
                  />
                </div>
                {form.voicemailEnabled && (
                  <div className="pt-2.5 border-t border-slate-200">
                    <label className="text-[10px] text-slate-500 block mb-1">Mailbox PIN (Numeric)</label>
                    <input
                      type="text"
                      value={form.voicemailPin}
                      onChange={(e) => setForm({ ...form, voicemailPin: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs shadow-sky-600/20 transition flex items-center gap-1.5 active:scale-95"
                >
                  {isSubmitting && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{isEditing ? 'Save Changes' : 'Provision Extension'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={!!pendingAction}
        title={
          pendingAction?.type === 'reset'
            ? `Regenerate SIP Secret (Ext ${pendingAction?.num})`
            : `Delete SIP Extension ${pendingAction?.num}`
        }
        message={
          pendingAction?.type === 'reset'
            ? `Regenerate the SIP authentication password for Extension ${pendingAction?.num}? The current credentials on any connected phone will immediately become invalid.`
            : `Are you sure you want to permanently remove Extension ${pendingAction?.num}? This will delete the endpoint and remove the Asterisk PJSIP dialplan binding.`
        }
        confirmText={pendingAction?.type === 'reset' ? 'Regenerate Secret' : 'Delete Extension'}
        confirmVariant={pendingAction?.type === 'reset' ? 'primary' : 'danger'}
        onConfirm={handleExecutePendingAction}
        onClose={() => setPendingAction(null)}
      />
    </div>
  );
}
