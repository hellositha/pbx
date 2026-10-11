'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { clearAuthToken, getStoredUser } from '@/lib/api';
import {
  Menu,
  Bell,
  HelpCircle,
  Globe,
  User,
  LogOut,
  Phone,
  Server,
  Shield,
  Check,
  ChevronDown,
  X,
  Maximize2,
  Minimize2,
  ExternalLink,
  Activity,
  Layers,
  Smartphone,
} from 'lucide-react';

interface TopNavbarProps {
  onToggleSidebar?: () => void;
  onOpenSoftphone?: () => void;
  asteriskOnline?: boolean;
  freeswitchOnline?: boolean;
}

export default function TopNavbar({
  onToggleSidebar,
  onOpenSoftphone,
  asteriskOnline,
  freeswitchOnline = true,
}: TopNavbarProps) {
  const isEngineOnline = asteriskOnline !== undefined ? asteriskOnline : freeswitchOnline;
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Notifications state
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(2);
  const notifRef = useRef<HTMLDivElement>(null);

  // Language state
  const [langOpen, setLangOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('English');
  const langRef = useRef<HTMLDivElement>(null);

  // Account menu state
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  // Support menu state
  const [supportOpen, setSupportOpen] = useState(false);
  const supportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentUser(getStoredUser());

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
      if (supportRef.current && !supportRef.current.contains(e.target as Node)) {
        setSupportOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    router.push('/login');
  };

  const languages = ['English', 'Español', 'Français', 'Deutsch', 'Italiano'];

  return (
    <header className="h-[52px] bg-[#0F172A]/95 backdrop-blur-md text-slate-100 fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 select-none shadow-sm border-b border-slate-800/90 transition-colors">
      {/* Left: Brand & Sidebar Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition duration-150"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5">
          {/* Eclype Technology PBX Emblem with gradient glow */}
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-500 via-sky-600 to-blue-600 flex items-center justify-center text-white font-black text-xs tracking-wider shadow-sm shadow-sky-500/30">
            ET
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[13px] tracking-wider text-white">
              ECLYPETECH
            </span>
            <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded tracking-widest uppercase">
              PBX
            </span>
          </div>
        </div>
      </div>

      {/* Right Navigation & Tools */}
      <div className="flex items-center gap-2 sm:gap-2.5 text-xs">
        {/* WebRTC Softphone Launch Button */}
        {onOpenSoftphone && (
          <button
            onClick={onOpenSoftphone}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold transition text-xs shadow-sm shadow-sky-500/25 active:scale-[0.98]"
            title="Launch WebRTC Softphone"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Softphone</span>
          </button>
        )}

        {/* Android App APK Download Button */}
        <a
          href="/download/ECLYPE_TECH.apk"
          download="ECLYPE_TECH.apk"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 font-semibold transition text-xs border border-slate-700/80 active:scale-[0.98]"
          title="Download ECLYPE TECH Android APK"
        >
          <Smartphone className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Android App</span>
        </a>

        {/* System Telemetry Status Pill */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800/70 border border-slate-700/60 text-[11px] text-slate-300">
          <span className="relative flex h-2 w-2">
            {isEngineOnline && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isEngineOnline ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
          </span>
          <span className="font-medium text-slate-200">
            Asterisk {isEngineOnline ? '22.5 LTS Online' : 'Offline'}
          </span>
        </div>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition duration-150 hidden sm:flex items-center justify-center"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Support Menu */}
        <div className="relative" ref={supportRef}>
          <button
            onClick={() => setSupportOpen(!supportOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition duration-150"
            title="Help & Support"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline font-medium">Support</span>
          </button>

          {supportOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white text-slate-800 border border-slate-200 rounded-xl shadow-xl p-1.5 space-y-1 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2.5 py-1.5 border-b border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Documentation & Tools
                </span>
              </div>
              <a
                href="#documentation"
                onClick={() => setSupportOpen(false)}
                className="flex items-center justify-between px-2.5 py-1.5 text-xs hover:bg-slate-50 rounded-lg font-medium text-slate-700 transition"
              >
                <span>PBX Administrator Guide</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
              <button
                onClick={() => {
                  setSupportOpen(false);
                  router.push('/system-health');
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs hover:bg-slate-50 rounded-lg font-medium text-slate-700 transition"
              >
                <span>Diagnostics & Health</span>
                <Activity className="w-3 h-3 text-sky-500" />
              </button>
              <a
                href="/download/ECLYPE_TECH.apk"
                download="ECLYPE_TECH.apk"
                onClick={() => setSupportOpen(false)}
                className="flex items-center justify-between px-2.5 py-1.5 text-xs hover:bg-slate-50 rounded-lg font-medium text-slate-700 transition"
              >
                <div className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-sky-600" />
                  <span>Download Android App</span>
                </div>
                <span className="text-[10px] bg-sky-50 text-sky-600 font-bold px-1.5 py-0.5 rounded border border-sky-200">APK</span>
              </a>
              <div className="border-t border-slate-100 my-1" />
              <div className="px-2.5 py-1 text-[10px] text-slate-500 font-medium">
                Eclype Technology PBX Enterprise v2.4
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setNotificationCount(0);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white relative transition duration-150"
            title="System Alerts & Notifications"
          >
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white text-slate-800 border border-slate-200 rounded-xl shadow-xl p-2.5 z-50 space-y-2 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 px-1">
                <span className="text-xs font-bold text-slate-900">Notifications</span>
                <button
                  onClick={() => setNotificationsOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1 hover:border-emerald-200 transition">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-700 text-[11px] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Asterisk Telephony Engine
                    </span>
                    <span className="text-[10px] text-slate-400">Just now</span>
                  </div>
                  <p className="text-[11px] text-slate-600">Asterisk 22 PJSIP UDP/TCP/WS transports listening on 5060/8088.</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1 hover:border-sky-200 transition">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-700 text-[11px] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                      Automated Backup
                    </span>
                    <span className="text-[10px] text-slate-400">Today</span>
                  </div>
                  <p className="text-[11px] text-slate-600">PostgreSQL configuration and dialplan snapshot archived.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Language Selector */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition duration-150 text-xs"
            title="Language"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline font-medium">{currentLang}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {langOpen && (
            <div className="absolute right-0 mt-2 w-36 bg-white text-slate-800 border border-slate-200 rounded-xl shadow-xl p-1 z-50 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
              {languages.map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setCurrentLang(l);
                    setLangOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-left rounded-lg transition ${
                    currentLang === l
                      ? 'font-bold text-sky-600 bg-sky-50'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{l}</span>
                  {currentLang === l && <Check className="w-3.5 h-3.5 text-sky-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Account Menu & Current User */}
        <div className="relative" ref={accountRef}>
          <button
            onClick={() => setAccountOpen(!accountOpen)}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white transition duration-150"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-[11px] font-bold shadow-xs">
              {currentUser?.firstName?.[0] || 'A'}
            </div>
            <span className="hidden md:inline font-semibold text-xs">
              {currentUser?.firstName || 'Admin'}
            </span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {accountOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white text-slate-800 border border-slate-200 rounded-xl shadow-xl p-1.5 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="font-bold text-xs text-slate-900">
                  {currentUser?.firstName} {currentUser?.lastName || ''}
                </div>
                <div className="text-[11px] text-slate-500 font-mono truncate">
                  {currentUser?.email || 'admin@eclypetechnology.local'}
                </div>
                <div className="text-[9px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded-full inline-block mt-1 uppercase tracking-wide">
                  {currentUser?.role?.replace('_', ' ') || 'SUPER ADMIN'}
                </div>
              </div>

              <button
                onClick={() => {
                  setAccountOpen(false);
                  router.push('/users');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-left text-slate-700 hover:bg-slate-50 rounded-lg transition"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Account Profile</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-left text-rose-600 hover:bg-rose-50 rounded-lg font-semibold transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
