'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import AudioUploadModal from '@/components/audio/AudioUploadModal';
import { useAudioPlayer } from '@/components/audio/AudioPlayerContext';
import {
  FileAudio,
  Play,
  Pause,
  Download,
  Trash2,
  ShieldCheck,
  Clock,
  HardDrive,
  Search,
  Filter,
  Volume2,
  X,
  UploadCloud,
  Music,
  Radio,
  Layers,
  Voicemail,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';

export default function RecordingsPage() {
  const { showToast } = useToast();
  const audioPlayer = useAudioPlayer();
  const [activeTab, setActiveTab] = useState<'RECORDINGS' | 'PROMPTS'>('PROMPTS');
  const [recordings, setRecordings] = useState<any[]>([]);
  const [audioPrompts, setAudioPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Delete modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: string;
    type: 'RECORDING' | 'PROMPT';
    title: string;
  }>({
    isOpen: false,
    id: '',
    type: 'PROMPT',
    title: '',
  });
  const [deleting, setDeleting] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [recData, audioData] = await Promise.all([
        api.getRecordings(),
        api.getAudioPrompts(),
      ]);
      setRecordings(recData.recordings || []);
      setAudioPrompts(audioData.audioList || []);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load audio data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handlePlayRecording = async (rec: any) => {
    if (audioPlayer.isCurrentTrack(rec.id)) {
      if (audioPlayer.isPlaying) {
        audioPlayer.pauseTrack();
      } else {
        audioPlayer.resumeTrack();
      }
      return;
    }

    try {
      const authData = await api.authorizeRecordingDownload(rec.id);
      audioPlayer.playTrack({
        id: rec.id,
        title: `Call: ${rec.callRecord?.callerIdNum || 'Caller'} → ${rec.callRecord?.destination || 'Destination'}`,
        subtitle: `Duration: ${rec.durationSeconds}s • AES-256 Encrypted`,
        streamUrl: authData.downloadUrl,
        category: 'RECORDING',
      });
      showToast('Streaming call recording', 'info');
    } catch (err: any) {
      showToast('Failed to authorize audio stream: ' + err.message, 'error');
    }
  };

  const handlePlayPrompt = (prompt: any) => {
    audioPlayer.toggleTrack({
      id: prompt.id,
      title: prompt.label,
      subtitle: `${prompt.asteriskSoundPath} • ${(prompt.fileSize / 1024).toFixed(1)} KB`,
      streamUrl: `/api/audio/${encodeURIComponent(prompt.id)}/stream`,
      category: prompt.category,
    });
  };

  const handleDownload = async (id: string) => {
    try {
      const authData = await api.authorizeRecordingDownload(id);
      window.open(authData.downloadUrl, '_blank');
      showToast('Audio archive download started', 'success');
    } catch (err: any) {
      showToast('Download authorization failed: ' + err.message, 'error');
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm.id) return;
    setDeleting(true);
    try {
      if (deleteConfirm.type === 'RECORDING') {
        await api.deleteRecording(deleteConfirm.id);
        showToast('Call audio recording permanently purged', 'success');
      } else {
        await api.deleteAudioPrompt(deleteConfirm.id);
        showToast(`Audio prompt "${deleteConfirm.title}" deleted`, 'success');
      }

      if (audioPlayer.isCurrentTrack(deleteConfirm.id)) {
        audioPlayer.stopTrack();
      }
      setDeleteConfirm({ isOpen: false, id: '', type: 'PROMPT', title: '' });
      await loadAll();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete audio item', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyPath = (pathText: string) => {
    navigator.clipboard.writeText(pathText);
    setCopiedPath(pathText);
    showToast(`Asterisk path copied: ${pathText}`, 'info');
    setTimeout(() => setCopiedPath(null), 2500);
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'IVR_PROMPT':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 inline-flex items-center gap-1">
            <Radio className="w-3 h-3" /> IVR Auto-Attendant
          </span>
        );
      case 'MOH':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center gap-1">
            <Music className="w-3 h-3" /> Music on Hold
          </span>
        );
      case 'QUEUE_ANNOUNCEMENT':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
            <Layers className="w-3 h-3" /> Queue Greeting
          </span>
        );
      case 'VOICEMAIL_GREETING':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center gap-1">
            <Voicemail className="w-3 h-3" /> Voicemail Box
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            Telephony Audio
          </span>
        );
    }
  };

  const filteredPrompts = audioPrompts.filter((p) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      (p.label && p.label.toLowerCase().includes(s)) ||
      (p.filename && p.filename.toLowerCase().includes(s)) ||
      (p.category && p.category.toLowerCase().includes(s)) ||
      (p.asteriskSoundPath && p.asteriskSoundPath.toLowerCase().includes(s))
    );
  });

  const filteredRecordings = recordings.filter((r) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      (r.callRecord?.callerIdNum && r.callRecord.callerIdNum.includes(s)) ||
      (r.callRecord?.destination && r.callRecord.destination.includes(s)) ||
      (r.filePath && r.filePath.toLowerCase().includes(s))
    );
  });

  return (
    <div className="space-y-4">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Telephony Audio & Sound Prompts Library
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80">
              {audioPrompts.length} Prompts • {recordings.length} Recordings
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload custom IVR audio greetings, music on hold (MOH), queue announcements, and stream call recordings
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition hover:border-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-xs shadow-sky-600/20 transition active:scale-95"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Audio</span>
          </button>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex gap-1.5 p-1 bg-slate-100/80 rounded-lg">
          <button
            onClick={() => setActiveTab('PROMPTS')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'PROMPTS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5 text-sky-600" />
            <span>Sound Prompts & Custom Audio ({audioPrompts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('RECORDINGS')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'RECORDINGS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileAudio className="w-3.5 h-3.5 text-emerald-600" />
            <span>Call Recordings ({recordings.length})</span>
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder={
              activeTab === 'PROMPTS'
                ? 'Search prompts by name or category...'
                : 'Search recordings by caller or destination...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 transition"
          />
        </div>
      </div>

      {/* TAB 1: CUSTOM SOUND PROMPTS & AUDIO */}
      {activeTab === 'PROMPTS' && (
        <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 text-slate-500 font-semibold border-b border-slate-200/80 text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-4 w-14">Play</th>
                  <th className="py-2.5 px-4">Prompt Title / Label</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Asterisk Sound Reference</th>
                  <th className="py-2.5 px-4">Format / Size</th>
                  <th className="py-2.5 px-4">Uploaded</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-medium">Loading audio prompts library...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPrompts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <UploadCloud className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-800 text-sm">No audio prompts found</p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                        Click "Upload Audio" to add custom WAV or MP3 files for IVR auto-attendants, hold music, or greetings.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredPrompts.map((prompt) => {
                    const isPlayingThis = audioPlayer.isCurrentPlaying(prompt.id);
                    return (
                      <tr key={prompt.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-4">
                          <button
                            onClick={() => handlePlayPrompt(prompt)}
                            className={`p-2 rounded-xl transition cursor-pointer ${
                              isPlayingThis
                                ? 'bg-sky-600 text-white shadow-xs animate-pulse'
                                : 'bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-600'
                            }`}
                            title={isPlayingThis ? 'Pause Audio' : 'Preview Audio'}
                          >
                            {isPlayingThis ? (
                              <Pause className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        {prompt.label}
                        <div className="text-[11px] font-mono text-slate-400 font-normal">
                          {prompt.filename}
                        </div>
                      </td>
                      <td className="py-2.5 px-4">{getCategoryBadge(prompt.category)}</td>
                      <td className="py-2.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleCopyPath(prompt.asteriskSoundPath)}
                          className="font-mono text-xs text-sky-700 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded border border-sky-200/80 inline-flex items-center gap-1.5 transition group cursor-pointer"
                          title="Click to copy Asterisk dialplan sound path"
                        >
                          <span>{prompt.asteriskSoundPath}</span>
                          {copiedPath === prompt.asteriskSoundPath ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400 group-hover:text-sky-600" />
                          )}
                        </button>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-600 text-[11px]">
                        <span className="uppercase font-bold text-slate-800">{prompt.format}</span> •{' '}
                        {formatSize(prompt.fileSize)}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                        {new Date(prompt.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`/api/audio/${prompt.id}/stream`}
                            download={prompt.filename}
                            className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg transition inline-flex items-center"
                            title="Download Audio File"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                isOpen: true,
                                id: prompt.id,
                                type: 'PROMPT',
                                title: prompt.label,
                              })
                            }
                            className="p-1.5 bg-white hover:bg-rose-50 border border-slate-200 text-slate-400 hover:text-rose-600 rounded-lg transition"
                            title="Delete Audio Prompt"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CALL RECORDINGS */}
      {activeTab === 'RECORDINGS' && (
        <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 text-slate-500 font-semibold border-b border-slate-200/80 text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-4 w-14">Play</th>
                  <th className="py-2.5 px-4">Recorded Date</th>
                  <th className="py-2.5 px-4">Call Parties</th>
                  <th className="py-2.5 px-4">Duration</th>
                  <th className="py-2.5 px-4">File Size</th>
                  <th className="py-2.5 px-4">Encryption / Storage</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecordings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <FileAudio className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-semibold text-slate-700">No call audio recordings found</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Calls with recording policies active will appear here automatically.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRecordings.map((r) => {
                    const isPlayingRec = audioPlayer.isCurrentPlaying(r.id);
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-4">
                          <button
                            onClick={() => handlePlayRecording(r)}
                            className={`p-2 rounded-xl transition ${
                              isPlayingRec
                                ? 'bg-sky-600 text-white shadow-xs animate-pulse'
                                : 'bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-600'
                            }`}
                            title={isPlayingRec ? 'Pause Stream' : 'Play Audio'}
                          >
                            {isPlayingRec ? (
                              <Pause className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                          <span>{r.callRecord?.callerIdNum || 'Unknown'}</span>
                          <span className="text-slate-400">&rarr;</span>
                          <span className="text-sky-700 font-mono">
                            {r.callRecord?.destination || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-700">
                        {r.durationSeconds}s
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-500">
                        {formatSize(r.fileSizeBytes)}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>AES-256</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleDownload(r.id)}
                            className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg transition"
                            title="Download WAV"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                isOpen: true,
                                id: r.id,
                                type: 'RECORDING',
                                title: `Call ${r.callRecord?.callerIdNum || r.id}`,
                              })
                            }
                            className="p-1.5 bg-white hover:bg-rose-50 border border-slate-200 text-slate-400 hover:text-rose-600 rounded-lg transition"
                            title="Purge Recording"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Audio Modal */}
      <AudioUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploaded={() => loadAll()}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title={
          deleteConfirm.type === 'RECORDING'
            ? 'Purge Call Audio Recording'
            : `Delete Audio Prompt "${deleteConfirm.title}"`
        }
        message={
          deleteConfirm.type === 'RECORDING'
            ? 'Are you sure you want to permanently delete this audio recording from disk? This action cannot be reversed.'
            : `Delete audio prompt "${deleteConfirm.title}" from PBX storage? Any IVR menu or queue referencing this sound file will need to be reconfigured.`
        }
        confirmText={deleteConfirm.type === 'RECORDING' ? 'Purge Recording' : 'Delete Prompt'}
        variant="danger"
        isLoading={deleting}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: '', type: 'PROMPT', title: '' })}
      />
    </div>
  );
}
