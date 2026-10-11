'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, setAuthToken, setStoredUser } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Shield, AlertCircle, ArrowRight, CheckCircle2, Server, Activity, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('Connecting to PBX Console...');

  const handleEnterConsole = useCallback(async () => {
    setLoading(true);
    setError(null);
    setStatusText('Verifying Asterisk Telephony Engine...');

    try {
      // Direct frictionless login without username/password
      const res = await api.login();
      if (res?.token) {
        setAuthToken(res.token);
        setStoredUser(res.user);
        setStatusText('Session verified. Entering Dashboard...');
        toast.success(`Welcome to ECLYPE TECH PBX!`, 'Direct Access Authorized');
        router.push('/dashboard');
      } else {
        throw new Error('Authentication response did not contain a session token');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to connect to PBX server. Please verify your connection.');
      setLoading(false);
    }
  }, [router, toast]);

  // Auto-login on load for immediate frictionless access
  useEffect(() => {
    const timer = setTimeout(() => {
      handleEnterConsole();
    }, 250);
    return () => clearTimeout(timer);
  }, [handleEnterConsole]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center px-4 relative selection:bg-sky-500 selection:text-white">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-60 pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-sm relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 via-sky-600 to-blue-600 mx-auto flex items-center justify-center text-white shadow-lg shadow-sky-500/25 font-black text-xl tracking-wider mb-3 ring-4 ring-white">
            ET
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            ECLYPETECH <span className="text-sky-600">PBX</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-semibold tracking-wide uppercase">
            Enterprise VoIP Management Console
          </p>
        </div>

        {/* Console Entry Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-200/60 p-6 space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Console Direct Access</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Direct Administrator Access Enabled
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Online</span>
            </div>
          </div>

          {error ? (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <UserCheck className="w-4 h-4 text-sky-600" />
                <span>Super Administrator</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Credentials are automatically verified with the Asterisk 22 LTS core and database engine.
              </p>
            </div>
          )}

          {/* Enter Button */}
          <button
            type="button"
            onClick={handleEnterConsole}
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-sky-600 via-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-sm shadow-sky-600/25 flex items-center justify-center gap-2 transition disabled:opacity-75 active:scale-[0.98] cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{statusText}</span>
              </>
            ) : error ? (
              <>
                <span>Retry Connection</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Enter PBX Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Security & System Info Footer */}
        <div className="mt-4 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>Asterisk 22 LTS Telephony Engine • TLS 1.3</span>
        </div>
      </div>
    </div>
  );
}
