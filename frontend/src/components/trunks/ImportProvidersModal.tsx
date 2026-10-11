'use client';

import React, { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import {
  UploadCloud,
  FileCode,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Server,
  Layers,
} from 'lucide-react';

interface ImportProvidersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (providers: any[]) => Promise<void>;
}

export default function ImportProvidersModal({
  isOpen,
  onClose,
  onImport,
}: ImportProvidersModalProps) {
  const { showToast } = useToast();
  const [jsonText, setJsonText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonText(content);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jsonText.trim()) {
      showToast('Please provide JSON configuration text or upload a file', 'warning');
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      if (items.length === 0) {
        showToast('Configuration contains no valid trunk entries', 'warning');
        return;
      }

      setIsImporting(true);
      await onImport(items);
      showToast(`Successfully imported ${items.length} provider configuration(s)`, 'success');
      onClose();
    } catch (err: any) {
      showToast('Invalid JSON format: ' + err.message, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const sampleTemplate = `[
  {
    "name": "Custom Carrier Trunk",
    "provider": "Carrier Example",
    "trunkType": "SIP_TRUNK",
    "serverAddress": "sip.carrier.net",
    "serverPort": 5060,
    "transport": "UDP",
    "authMode": "REGISTRATION",
    "authUsername": "user123",
    "maxConcurrent": 30,
    "enabled": true
  }
]`;

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 border border-sky-200/80 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Import SIP Providers & Trunks</h2>
              <p className="text-[11px] text-slate-500">
                Import predefined carrier profiles or backup configs via JSON
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-5 text-center transition flex flex-col items-center justify-center cursor-pointer ${
              dragOver
                ? 'border-sky-500 bg-sky-50/50'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
            }`}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json,application/json';
              input.onchange = (e: any) => {
                if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
              };
              input.click();
            }}
          >
            <FileCode className="w-7 h-7 text-slate-400 mb-1" />
            <div className="font-semibold text-slate-700">Click to upload or drag JSON file</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Supports .json provider profile manifests</div>
          </div>

          {/* JSON Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">JSON Configuration Payload</label>
              <button
                type="button"
                onClick={() => setJsonText(sampleTemplate)}
                className="text-[11px] text-sky-600 hover:underline font-bold"
              >
                Load Sample Template
              </button>
            </div>
            <textarea
              rows={8}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="Paste provider JSON configuration array here..."
              className="w-full bg-slate-50/60 focus:bg-white border border-slate-200 rounded-xl p-3 font-mono text-[11px] text-slate-800 focus:outline-none focus:border-sky-500 transition shadow-inner"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isImporting}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {isImporting && (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{isImporting ? 'Importing...' : 'Import Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
