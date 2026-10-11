'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import {
  Voicemail,
  Edit2,
  Mail,
  Bell,
  Key,
  Check,
  RefreshCw,
  Phone,
  FileAudio,
  ShieldCheck,
  CheckCircle2,
  X,
  Send,
} from 'lucide-react';

interface VoicemailItem {
  id: string;
  mailbox: string;
  pin: string;
  emailNotification?: string | null;
  attachAudio: boolean;
  messageCount?: number;
  extension?: {
    id: string;
    extensionNumber: string;
    displayName: string;
    department?: {
      name: string;
    } | null;
  } | null;
}

export default function VoicemailPage() {
  const { showToast } = useToast();
  const [boxes, setBoxes] = useState<VoicemailItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit modal
  const [editingBox, setEditingBox] = useState<VoicemailItem | null>(null);
  const [form, setForm] = useState({
    pin: '',
    emailNotification: '',
    attachAudio: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  const loadBoxes = async () => {
    setLoading(true);
    try {
      const data = await api.getVoicemailBoxes();
      setBoxes(data.voicemailBoxes || []);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load voicemail mailboxes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoxes();
  }, []);

  const handleOpenEdit = (box: VoicemailItem) => {
    setEditingBox(box);
    setForm({
      pin: box.pin || '1234',
      emailNotification: box.emailNotification || '',
      attachAudio: box.attachAudio ?? true,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBox) return;
    setIsSaving(true);
    try {
      await api.updateVoicemailBox(editingBox.id, form);
      showToast(`Mailbox ${editingBox.mailbox} updated successfully`, 'success');
      setEditingBox(null);
      await loadBoxes();
    } catch (err: any) {
      showToast(err.message || 'Failed to update voicemail settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const emailForwardCount = boxes.filter((b) => Boolean(b.emailNotification)).length;
  const wavAttachCount = boxes.filter((b) => b.attachAudio).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Voicemail Administration
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80">
              {boxes.length} Mailboxes
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure Asterisk app_voicemail storage, access PINs, email notifications, and WAV attachments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('pbx:dial', { detail: { target: '*97' } }));
              showToast('Dialing *97 (Voice Mailbox Access)', 'info');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200/80 text-sky-700 text-xs font-semibold shadow-xs transition"
            title="Dial *97 to check voicemail on current extension"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Dial *97 Access</span>
          </button>

          <button
            onClick={loadBoxes}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition hover:border-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metric Summary Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Total Mailboxes</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{boxes.length}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600">
            <Voicemail className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Email Notifications</div>
            <div className="text-xl font-bold text-emerald-600 mt-0.5">{emailForwardCount}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600">
            <Mail className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">WAV Attachments</div>
            <div className="text-xl font-bold text-indigo-600 mt-0.5">{wavAttachCount}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600">
            <FileAudio className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Asterisk Feature</div>
            <div className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              *97 / *98 Active
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Grid of Voicemail Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full bg-white border border-slate-200/90 rounded-xl p-12 text-center text-slate-400 shadow-xs">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium">Loading voicemail mailboxes...</span>
            </div>
          </div>
        ) : boxes.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200/90 rounded-xl p-12 text-center text-slate-400 shadow-xs">
            <Voicemail className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-800 text-sm">No voicemail boxes configured</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Enable voicemail when provisioning or editing SIP extensions to create mailbox storage.
            </p>
          </div>
        ) : (
          boxes.map((box) => (
            <div
              key={box.id}
              className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600 shrink-0">
                      <Voicemail className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">Box {box.mailbox}</h3>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-50 text-sky-700 border border-sky-200/60 font-mono">
                          Ext {box.extension?.extensionNumber || box.mailbox}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {box.extension?.displayName || 'User Mailbox'}
                        {box.extension?.department?.name ? ` • ${box.extension.department.name}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        window.dispatchEvent(
                          new CustomEvent('pbx:dial', { detail: { target: box.mailbox } })
                        );
                        showToast(`Calling Voicemail Box ${box.mailbox}`, 'info');
                      }}
                      className="p-1.5 bg-slate-50 hover:bg-sky-50 text-slate-500 hover:text-sky-600 border border-slate-200 rounded-lg transition"
                      title={`Call Mailbox ${box.mailbox}`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(box)}
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg transition"
                      title="Edit Voicemail Settings"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-slate-50/80 rounded-lg border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Key className="w-3.5 h-3.5 text-slate-400" />
                      <span>Security PIN:</span>
                    </span>
                    <span className="font-mono text-slate-900 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                      •••• ({box.pin?.length || 4} digits)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>Email Delivery:</span>
                    </span>
                    <span
                      className={`truncate max-w-[150px] font-mono text-[11px] ${
                        box.emailNotification ? 'text-sky-700 font-medium' : 'text-slate-400 italic'
                      }`}
                      title={box.emailNotification || 'Disabled'}
                    >
                      {box.emailNotification || 'Disabled'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <FileAudio className="w-3.5 h-3.5 text-slate-400" />
                      <span>Audio Attachment:</span>
                    </span>
                    <span
                      className={`font-semibold text-[10px] px-1.5 py-0.2 rounded border ${
                        box.attachAudio
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {box.attachAudio ? 'WAV Attached' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Asterisk Context: default</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingBox && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Voicemail className="w-4 h-4 text-sky-600" />
                <span>Configure Mailbox {editingBox.mailbox}</span>
              </h3>
              <button
                onClick={() => setEditingBox(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">
                  Mailbox Access PIN (Numeric) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1234"
                  value={form.pin}
                  onChange={(e) => setForm({ ...form, pin: e.target.value })}
                  className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-sky-500 transition"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Used by telephone caller when pressing * to check messages
                </span>
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">
                  Notification Email Address
                </label>
                <input
                  type="email"
                  placeholder="agent@company.com"
                  value={form.emailNotification}
                  onChange={(e) => setForm({ ...form, emailNotification: e.target.value })}
                  className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 transition"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Leave blank to disable email notifications
                </span>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <label htmlFor="attachAudio" className="text-xs font-semibold text-slate-800 block cursor-pointer">
                    Attach WAV Audio File
                  </label>
                  <span className="text-[10px] text-slate-500">Include recorded message audio in email</span>
                </div>
                <input
                  type="checkbox"
                  id="attachAudio"
                  checked={form.attachAudio}
                  onChange={(e) => setForm({ ...form, attachAudio: e.target.checked })}
                  className="w-4 h-4 rounded text-sky-600 border-slate-300 accent-sky-600 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBox(null)}
                  disabled={isSaving}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs shadow-sky-600/20 transition flex items-center gap-1.5 active:scale-95"
                >
                  {isSaving && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>Save Mailbox</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
