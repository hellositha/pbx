'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import {
  Sliders,
  RefreshCw,
  Save,
  CheckCircle2,
  Shield,
  AlertCircle,
  X,
  Server,
  Radio,
  Volume2,
  Clock,
  Lock,
} from 'lucide-react';

export default function SettingsPage() {
  const toast = useToast();
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [reloading, setReloading] = useState(false);
  const [reloadStatus, setReloadStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data.settings || []);
      const map: Record<string, string> = {};
      data.settings?.forEach((s: any) => {
        map[s.key] = s.value;
      });
      setValues(map);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleUpdate = async (key: string) => {
    setSavingKey(key);
    try {
      await api.updateSetting(key, values[key]);
      toast.success(`Parameter "${key}" updated successfully`, 'Setting Saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update setting');
    } finally {
      setSavingKey(null);
    }
  };

  const handleReloadEngine = async () => {
    setReloading(true);
    setReloadStatus(null);
    try {
      const res = await api.reloadTelephonyConfig();
      setReloadStatus({
        type: 'success',
        message: res.message || 'Asterisk PJSIP dialplans and endpoints successfully reloaded!',
      });
      toast.success('Asterisk 22 LTS PJSIP engine reloaded', 'Telephony Reloaded');
      setTimeout(() => setReloadStatus(null), 5000);
    } catch (err: any) {
      setReloadStatus({
        type: 'error',
        message: 'Failed to reload Asterisk: ' + (err.message || 'Unknown error'),
      });
      toast.error('Asterisk reload failed: ' + err.message);
    } finally {
      setReloading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              PBX Global Configuration & Engine
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80">
              Host Core
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure system parameters, RTP media port boundaries, SIP domains, and emergency routing overrides
          </p>
        </div>

        <button
          onClick={handleReloadEngine}
          disabled={reloading}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${reloading ? 'animate-spin' : ''}`} />
          <span>{reloading ? 'Reloading Engine...' : 'Reload Asterisk Core'}</span>
        </button>
      </div>

      {reloadStatus && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold animate-in fade-in duration-200 ${
            reloadStatus.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {reloadStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{reloadStatus.message}</span>
          </div>
          <button onClick={() => setReloadStatus(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settings.map((s) => (
          <div
            key={s.id}
            className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs font-mono">{s.key}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {s.category}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{s.description}</p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                value={values[s.key] ?? s.value}
                onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
                className="flex-1 bg-slate-50/70 focus:bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-sky-500"
              />
              <button
                onClick={() => handleUpdate(s.key)}
                disabled={savingKey === s.key}
                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-xs transition flex items-center gap-1 active:scale-95 disabled:opacity-50"
              >
                {savingKey === s.key ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
