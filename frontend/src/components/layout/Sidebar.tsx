'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Smartphone,
  Users2,
  BookOpen,
  Radio,
  PhoneIncoming,
  PhoneOutgoing,
  GitFork,
  PhoneCall,
  Layers,
  Network,
  Cpu,
  FileAudio,
  HardDriveDownload,
  History,
  BarChart3,
  MessageSquare,
  Sliders,
  Shield,
  Activity,
  X,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

interface SidebarProps {
  collapsed?: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  onToggleCollapse?: () => void;
}

interface NavSection {
  title: string;
  items: {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

export default function Sidebar({
  collapsed = false,
  mobileOpen = false,
  onCloseMobile,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();

  const sections: NavSection[] = [
    {
      title: 'OVERVIEW',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'EXTENSIONS & PHONES',
      items: [
        { name: 'Phones & Devices', href: '/phones', icon: Smartphone },
        { name: 'Extensions', href: '/extensions', icon: Users2 },
        { name: 'Ring Groups', href: '/ring-groups', icon: PhoneCall },
        { name: 'Company Directory', href: '/contacts', icon: BookOpen },
      ],
    },
    {
      title: 'TELEPHONY ROUTING',
      items: [
        { name: 'SIP Trunks', href: '/trunks', icon: Radio },
        { name: 'Inbound Routes', href: '/inbound-routes', icon: PhoneIncoming },
        { name: 'Outbound Routes', href: '/outbound-routes', icon: PhoneOutgoing },
        { name: 'Digital Receptionist', href: '/ivr', icon: GitFork },
      ],
    },
    {
      title: 'CALL CENTER & MEDIA',
      items: [
        { name: 'Call Queues', href: '/queues', icon: Layers },
        { name: 'Multi-Site Bridges', href: '/bridges', icon: Network },
        { name: 'Analog FXS / DECT', href: '/fxs-dect', icon: Cpu },
        { name: 'Call Recordings', href: '/recordings', icon: FileAudio },
      ],
    },
    {
      title: 'LOGS & AUDIT TRAIL',
      items: [
        { name: 'Call Detail Records', href: '/cdr', icon: History },
        { name: 'Analytics & Reports', href: '/reports', icon: BarChart3 },
        { name: 'Chat Logs', href: '/chat-logs', icon: MessageSquare },
        { name: 'Backup & Restore', href: '/backups', icon: HardDriveDownload },
      ],
    },
    {
      title: 'SYSTEM ADMIN',
      items: [
        { name: 'System Diagnostics', href: '/system-health', icon: Activity },
        { name: 'Security & Firewall', href: '/security', icon: Shield },
        { name: 'PBX Settings', href: '/settings', icon: Sliders },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity animate-in fade-in"
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        className={`bg-white border-r border-slate-200/90 fixed top-[52px] bottom-0 left-0 z-40 select-none flex flex-col justify-between overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shadow-sm transition-all duration-200 ease-in-out ${
          /* Desktop behavior */
          collapsed ? 'lg:w-[68px] lg:translate-x-0' : 'lg:w-[236px] lg:translate-x-0'
        } ${
          /* Mobile behavior */
          mobileOpen ? 'w-[260px] translate-x-0' : 'w-[260px] -translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Navigation Sections */}
        <div className="py-3 space-y-3">
          {/* Mobile Close Button Header */}
          <div className="flex items-center justify-between px-3.5 pb-2 lg:hidden border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800">Navigation Menu</span>
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition"
              title="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {sections.map((section, idx) => (
            <div key={section.title} className="space-y-0.5">
              {/* Collapsed separator divider on desktop */}
              {idx > 0 && (
                <div
                  className={`border-t border-slate-100 my-2 ${
                    collapsed ? 'hidden lg:block mx-3' : 'hidden'
                  }`}
                />
              )}

              {/* Expanded Category Header */}
              <div
                className={`px-3.5 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase transition-opacity ${
                  collapsed ? 'lg:hidden block' : 'block'
                }`}
              >
                {section.title}
              </div>

              {section.items.map((item) => {
                const isExact = pathname === item.href;
                const isActive =
                  item.href === '/dashboard'
                    ? pathname === '/dashboard' || pathname === '/'
                    : isExact || pathname.startsWith(item.href + '/');

                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => {
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`transition-all duration-150 flex items-center relative group ${
                      collapsed
                        ? 'lg:mx-2 lg:px-0 lg:py-2.5 lg:justify-center mx-2.5 px-3 py-1.5 gap-2.5 rounded-xl'
                        : 'mx-2.5 px-3 py-1.5 gap-2.5 rounded-xl'
                    } ${
                      isActive
                        ? 'bg-sky-50 text-sky-700 font-semibold border border-sky-200 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span
                      className={`truncate text-xs ${
                        collapsed ? 'lg:hidden inline' : 'inline'
                      }`}
                    >
                      {item.name}
                    </span>

                    {/* Floating Tooltip when collapsed on desktop */}
                    {collapsed && (
                      <div className="hidden lg:group-hover:flex absolute left-full ml-3 z-50 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap items-center pointer-events-none animate-in fade-in zoom-in-95 duration-100">
                        {item.name}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer System Status Badge & Collapse Toggle */}
        <div
          className={`border-t border-slate-100 bg-slate-50/70 text-slate-600 transition-all ${
            collapsed ? 'lg:p-2 p-3.5' : 'p-3.5'
          }`}
        >
          {/* Expanded view */}
          <div className={`space-y-2 text-[11px] ${collapsed ? 'lg:hidden block' : 'block'}`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Telephony Core:</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Operational
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              ECLYPETECH PBX v2.4
            </div>

            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="w-full mt-1.5 flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 text-xs font-semibold transition shadow-xs group"
                title="Collapse sidebar to icon rail (Ctrl+B)"
              >
                <span className="flex items-center gap-1.5">
                  <PanelLeftClose className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                  <span>Collapse Menu</span>
                </span>
                <ChevronLeft className="w-3.5 h-3.5 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>

          {/* Collapsed view on desktop */}
          {collapsed && (
            <div className="hidden lg:flex flex-col items-center gap-2 py-1">
              <div className="relative group flex items-center justify-center py-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div className="hidden group-hover:flex absolute left-full ml-3 z-50 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-lg shadow-xl whitespace-nowrap pointer-events-none">
                  Asterisk 22 Core: Operational
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                </div>
              </div>

              {onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="w-10 h-10 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 flex items-center justify-center transition shadow-xs group relative"
                  title="Expand sidebar (Ctrl+B)"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:translate-x-0.5 transition-transform" />
                  <div className="hidden group-hover:flex absolute left-full ml-3 z-50 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap pointer-events-none">
                    Expand Menu
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                  </div>
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
