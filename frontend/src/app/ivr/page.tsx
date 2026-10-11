'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import {
  GitFork,
  Plus,
  Trash2,
  Edit2,
  Play,
  Pause,
  Volume2,
  Search,
  X,
  PhoneCall,
  Layers,
  Users2,
  Voicemail,
  Clock,
  ArrowRight,
  UploadCloud,
} from 'lucide-react';
import AudioUploadModal from '@/components/audio/AudioUploadModal';
import { useAudioPlayer } from '@/components/audio/AudioPlayerContext';

export default function IvrPage() {
  const toast = useToast();
  const audioPlayer = useAudioPlayer();
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Audio prompt playing and upload
  const [playingPrompt, setPlayingPrompt] = useState<string | null>(null);
  const [audioPrompts, setAudioPrompts] = useState<any[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);

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
    extensionNumber: '',
    audioPromptFile: 'ivr/welcome_main.wav',
    timeout: 5,
    maxAttempts: 3,
    timeoutDestType: 'VOICEMAIL',
    timeoutTarget: '1000',
    invalidDestType: 'VOICEMAIL',
    invalidTarget: '1000',
    options: [
      { digit: '1', destinationType: 'QUEUE', destinationTarget: '6000', description: 'Sales Queue' },
      { digit: '2', destinationType: 'RING_GROUP', destinationTarget: '8000', description: 'Support Ring Group' },
      { digit: '0', destinationType: 'EXTENSION', destinationTarget: '1001', description: 'Receptionist' },
    ],
  });

  const loadMenus = async () => {
    try {
      const [ivrData, audioData] = await Promise.all([
        api.getIvrMenus(),
        api.getAudioPrompts().catch(() => ({ audioList: [] })),
      ]);
      setMenus(ivrData.ivrMenus || []);
      setAudioPrompts(audioData.audioList || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenus();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createIvrMenu(form);
      setShowModal(false);
      toast.success(`IVR Auto-Attendant "${form.name}" created at Ext ${form.extensionNumber}`, 'IVR Created');
      setForm({
        name: '',
        extensionNumber: '',
        audioPromptFile: 'ivr/welcome_main.wav',
        timeout: 5,
        maxAttempts: 3,
        timeoutDestType: 'VOICEMAIL',
        timeoutTarget: '1000',
        invalidDestType: 'VOICEMAIL',
        invalidTarget: '1000',
        options: [
          { digit: '1', destinationType: 'QUEUE', destinationTarget: '6000', description: 'Sales Queue' },
          { digit: '2', destinationType: 'RING_GROUP', destinationTarget: '8000', description: 'Support Ring Group' },
          { digit: '0', destinationType: 'EXTENSION', destinationTarget: '1001', description: 'Receptionist' },
        ],
      });
      loadMenus();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create IVR menu');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm.id) return;
    setDeleting(true);
    try {
      await api.deleteIvrMenu(deleteConfirm.id);
      toast.success(`IVR Menu "${deleteConfirm.name}" removed`, 'IVR Deleted');
      setDeleteConfirm({ isOpen: false, id: '', name: '' });
      loadMenus();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete IVR');
    } finally {
      setDeleting(false);
    }
  };

  const handlePlayPrompt = (promptFile: string, menuName: string = 'IVR Greeting') => {
    const cleanPath = promptFile || 'custom/welcome_main';
    audioPlayer.toggleTrack({
      id: `ivr-${menuName}-${cleanPath}`,
      title: `IVR Greeting: ${menuName}`,
      subtitle: `Asterisk Sound: ${cleanPath}`,
      streamUrl: `/api/audio/${encodeURIComponent(cleanPath)}/stream`,
      category: 'IVR_PROMPT',
    });
  };

  const handleAddOption = () => {
    setForm({
      ...form,
      options: [
        ...form.options,
        { digit: String(form.options.length + 1), destinationType: 'EXTENSION', destinationTarget: '1001', description: 'New Option' },
      ],
    });
  };

  const handleRemoveOption = (index: number) => {
    setForm({
      ...form,
      options: form.options.filter((_, idx) => idx !== index),
    });
  };

  const filteredMenus = menus.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.extensionNumber.includes(q);
  });

  return (
    <div className="space-y-5">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              IVR & Auto-Attendant Menus
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/80">
              {menus.length} Menus Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure automated voice menus, DTMF keypad trees, prompts, and failover actions
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-xs shadow-sky-600/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Create IVR Menu</span>
        </button>
      </div>

      {/* Grid of Menus */}
      {menus.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mx-auto mb-3">
            <GitFork className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No IVR Menus Configured</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Create an automated digital receptionist to greet callers with audio prompts and route them based on keypad input.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-xs"
          >
            Create First IVR
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMenus.map((m) => (
            <div
              key={m.id}
              className="bg-white border border-slate-200/90 hover:border-purple-300 rounded-xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 group"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200/80 flex items-center justify-center text-purple-600 shadow-2xs">
                      <GitFork className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-purple-700 transition-colors">
                        {m.name}
                      </h3>
                      <span className="text-[11px] font-mono font-bold text-sky-600">
                        Extension {m.extensionNumber}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {(() => {
                      const soundRef = m.audioPromptFile || 'custom/welcome_main';
                      const isPlayingThis = audioPlayer.isCurrentPlaying(`ivr-${m.name}-${soundRef}`);
                      return (
                        <button
                          onClick={() => handlePlayPrompt(soundRef, m.name)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer ${
                            isPlayingThis
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs animate-pulse'
                              : 'bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border-slate-200'
                          }`}
                          title={isPlayingThis ? 'Pause IVR Audio' : 'Play IVR Greeting'}
                        >
                          {isPlayingThis ? <Pause className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                          <span>{isPlayingThis ? 'Playing...' : 'Audio'}</span>
                        </button>
                      );
                    })()}
                    <button
                      onClick={() => setDeleteConfirm({ isOpen: true, id: m.id, name: m.name })}
                      className="p-1.5 bg-white hover:bg-rose-50 border border-slate-200 text-slate-400 hover:text-rose-600 rounded-lg transition"
                      title="Delete IVR"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Keypad DTMF Tree */}
                <div className="mt-3.5 space-y-2">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                    DTMF Keypad Navigation Tree
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(m.options || [
                      { digit: '1', destinationType: 'QUEUE', destinationTarget: '6000', description: 'Sales' },
                      { digit: '2', destinationType: 'RING_GROUP', destinationTarget: '8000', description: 'Support' },
                      { digit: '0', destinationType: 'EXTENSION', destinationTarget: '1001', description: 'Operator' },
                    ]).map((opt: any) => (
                      <div
                        key={opt.digit}
                        className="flex items-center gap-2 p-2 rounded-xl bg-slate-50/90 border border-slate-200/80 text-xs"
                      >
                        <div className="w-6 h-6 rounded-lg bg-slate-900 text-white font-mono font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          {opt.digit}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-800 text-[11px] truncate">
                            {opt.description || `${opt.destinationType} ${opt.destinationTarget}`}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {opt.destinationType} &rarr; {opt.destinationTarget}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Failover summary */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono text-[11px]">
                <span>Timeout: {m.timeout || 5}s ({m.timeoutDestType || 'VOICEMAIL'})</span>
                <span>Max Attempts: {m.maxAttempts || 3}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create IVR Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200/80 flex items-center justify-center text-purple-600">
                  <GitFork className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Create IVR Auto-Attendant</h2>
                  <p className="text-[11px] text-slate-500">Configure DTMF keypad branch tree and greeting audio</p>
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
                  <label className="text-xs text-slate-700 font-semibold block mb-1">IVR Menu Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Main Daytime Menu"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">Extension Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 7000"
                    value={form.extensionNumber}
                    onChange={(e) => setForm({ ...form, extensionNumber: e.target.value })}
                    className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-700 font-semibold block">
                    Audio Prompt / Welcome Greeting *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(true)}
                    className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 transition"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Audio</span>
                  </button>
                </div>

                <div className="flex gap-2 items-center">
                  <select
                    value={form.audioPromptFile}
                    onChange={(e) => setForm({ ...form, audioPromptFile: e.target.value })}
                    className="flex-1 bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                  >
                    <option value="ivr/welcome_main.wav">ivr/welcome_main.wav (Default Greeting)</option>
                    {audioPrompts.map((p) => (
                      <option key={p.id} value={p.asteriskSoundPath || `custom/${p.filename}`}>
                        {p.label} ({p.asteriskSoundPath})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handlePlayPrompt(form.audioPromptFile, form.name || 'New IVR')}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition shrink-0 cursor-pointer"
                    title="Preview selected audio prompt"
                  >
                    <Play className="w-3.5 h-3.5 text-purple-600" />
                    <span>Preview</span>
                  </button>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Current Asterisk sound reference: <code className="font-mono text-slate-600 bg-slate-100 px-1 rounded">{form.audioPromptFile}</code>
                </div>
              </div>

              {/* Dynamic Keypad Options */}
              <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Keypad DTMF Options
                  </span>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Key</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {form.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                      <input
                        type="text"
                        placeholder="Key"
                        value={opt.digit}
                        onChange={(e) => {
                          const updated = [...form.options];
                          updated[idx].digit = e.target.value;
                          setForm({ ...form, options: updated });
                        }}
                        className="w-12 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-center font-mono font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Description"
                        value={opt.description}
                        onChange={(e) => {
                          const updated = [...form.options];
                          updated[idx].description = e.target.value;
                          setForm({ ...form, options: updated });
                        }}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Target"
                        value={opt.destinationTarget}
                        onChange={(e) => {
                          const updated = [...form.options];
                          updated[idx].destinationTarget = e.target.value;
                          setForm({ ...form, options: updated });
                        }}
                        className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">DTMF Timeout (sec)</label>
                  <input
                    type="number"
                    value={form.timeout}
                    onChange={(e) => setForm({ ...form, timeout: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">Timeout Target</label>
                  <input
                    type="text"
                    value={form.timeoutTarget}
                    onChange={(e) => setForm({ ...form, timeoutTarget: e.target.value })}
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
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{saving ? 'Creating...' : 'Deploy IVR Menu'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete IVR Menu"
        message={`Are you sure you want to delete IVR Auto-Attendant "${deleteConfirm.name}"? Inbound routes routing to Ext ${deleteConfirm.name} will fail.`}
        confirmText="Delete Menu"
        variant="danger"
        isLoading={deleting}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
      />

      {/* Audio Upload Modal */}
      <AudioUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        defaultCategory="IVR_PROMPT"
        onUploaded={(newAudio) => {
          setForm((prev) => ({
            ...prev,
            audioPromptFile: newAudio.asteriskSoundPath,
          }));
          loadMenus();
        }}
      />
    </div>
  );
}
