'use client';

import React, { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import {
  UploadCloud,
  FileAudio,
  X,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  Music,
  Radio,
  Layers,
  Voicemail,
  Volume2,
} from 'lucide-react';

interface AudioUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploaded?: (audioItem: any) => void;
  defaultCategory?: 'IVR_PROMPT' | 'MOH' | 'QUEUE_ANNOUNCEMENT' | 'VOICEMAIL_GREETING' | 'GENERAL';
}

export default function AudioUploadModal({
  isOpen,
  onClose,
  onUploaded,
  defaultCategory = 'IVR_PROMPT',
}: AudioUploadModalProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<string>(defaultCategory);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    // Check format
    const allowed = ['.wav', '.mp3', '.ogg', '.gsm', '.m4a'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowed.includes(ext) && !file.type.startsWith('audio/')) {
      showToast('Please select a valid audio file (WAV, MP3, OGG, or GSM)', 'warning');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      showToast('Audio file size exceeds maximum limit of 50MB', 'error');
      return;
    }

    setSelectedFile(file);
    if (!label) {
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setLabel(baseName.charAt(0).toUpperCase() + baseName.slice(1));
    }

    // Audio preview
    try {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } catch {}
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast('Please select an audio file to upload', 'warning');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('label', label.trim() || selectedFile.name);
      formData.append('category', category);

      const res = await api.uploadAudioPrompt(formData);
      showToast(`Audio prompt "${label || selectedFile.name}" uploaded successfully`, 'success');

      if (onUploaded) {
        onUploaded(res.audio);
      }
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to upload audio file', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200/90 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Upload Telephony Audio Prompt</h2>
              <p className="text-xs text-slate-500">
                Deploy sound prompts, IVR auto-attendants, music on hold, or queue greetings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
              isDragOver
                ? 'border-sky-500 bg-sky-50/50'
                : selectedFile
                ? 'border-emerald-300 bg-emerald-50/30'
                : 'border-slate-200 hover:border-sky-400 hover:bg-slate-50/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".wav,.mp3,.ogg,.gsm,.m4a,audio/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            {selectedFile ? (
              <div className="flex items-center gap-3 text-left w-full p-2 bg-white rounded-lg border border-emerald-200 shadow-2xs">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                  <FileAudio className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">{selectedFile.name}</div>
                  <div className="text-[10px] text-slate-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Telephony Audio
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Selected
                </span>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-sky-600 hover:underline">Click to browse</span>
                  <span className="text-xs text-slate-500"> or drag and drop audio file here</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Supports WAV (PCM 8kHz/16-bit recommended), MP3, OGG, GSM • Up to 50MB
                </span>
              </>
            )}
          </div>

          {/* Audio Preview if selected */}
          {previewUrl && (
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
              <Volume2 className="w-4 h-4 text-slate-500 shrink-0" />
              <audio controls src={previewUrl} className="w-full h-8 outline-none" />
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1">
                Prompt Title / Friendly Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Main Reception Day Greeting"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 transition"
              />
            </div>

            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1">
                Telephony Category / Purpose *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 transition font-medium"
              >
                <option value="IVR_PROMPT">IVR Auto-Attendant Greeting</option>
                <option value="MOH">Music on Hold (MOH)</option>
                <option value="QUEUE_ANNOUNCEMENT">Queue Greeting & Periodic Announcement</option>
                <option value="VOICEMAIL_GREETING">Voicemail Box Greeting</option>
                <option value="GENERAL">General Telephony Audio</option>
              </select>
            </div>
          </div>

          {/* Asterisk Optimization Notice */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-slate-900 font-semibold">Automatic Telephony Optimization: </strong>
              The audio engine automatically optimizes your file to 8kHz 16-bit mono PCM and registers it in Asterisk's <code className="bg-slate-200/80 px-1 py-0.2 rounded font-mono text-[10px]">custom/</code> directory for zero-latency playback.
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="px-5 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs shadow-sky-600/20 transition flex items-center gap-1.5 active:scale-95"
            >
              {isUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Converting & Uploading...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Audio Prompt</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
