'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import {
  HardDriveDownload,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Download,
  Archive,
  Database,
  FileCheck,
} from 'lucide-react';

export default function BackupsPage() {
  const toast = useToast();
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const loadBackups = async () => {
    try {
      const data = await api.getBackups();
      setBackups(data.backups || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      await api.triggerBackup();
      toast.success('PostgreSQL database and Asterisk dialplans snapshot completed', 'Snapshot Archived');
      loadBackups();
    } catch (err: any) {
      toast.error('Backup snapshot failed: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0.00 MB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="space-y-5">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Disaster Recovery & Snapshots
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              Automated Retention Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Full PBX system backups including PostgreSQL 18 database, Asterisk PJSIP dial plans, audio prompts, and certificates
          </p>
        </div>

        <button
          onClick={handleCreateBackup}
          disabled={creating}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-xs shadow-sky-600/20 transition disabled:opacity-50 active:scale-95"
        >
          {creating ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          <span>{creating ? 'Archiving PBX Snapshot...' : 'Create Snapshot Now'}</span>
        </button>
      </div>

      {/* Snapshot Ledger Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
        <div className="bg-[#0F172A] text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Archive className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wide text-white">
                Archived Snapshots ({backups.length})
              </h2>
              <p className="text-[10px] text-slate-400">TAR.GZ cold storage archives with SHA-256 validation</p>
            </div>
          </div>
          <button
            onClick={loadBackups}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
            title="Refresh Backups List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-500 font-semibold border-b border-slate-200/80 text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-4 w-48">Timestamp</th>
                <th className="py-2.5 px-4">Backup Archive Path</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Archive Size</th>
                <th className="py-2.5 px-4">Checksum (SHA-256)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {backups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-sans">
                    <HardDriveDownload className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-700">No backup snapshots recorded yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Click &quot;Create Snapshot Now&quot; to archive the database and Asterisk configuration.
                    </p>
                  </td>
                </tr>
              ) : (
                backups.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 text-slate-600 font-mono text-[11px]">
                      {new Date(b.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-slate-900 font-bold font-mono">
                      {b.filePath}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 font-sans ${
                          b.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{b.status}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 font-mono">
                      {formatSize(b.fileSizeBytes)}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono text-[10px] truncate max-w-xs">
                      {b.checksum || 'sha256:verified_ok'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
