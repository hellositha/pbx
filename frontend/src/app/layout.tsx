'use client';

import React, { useState, useEffect } from 'react';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import TopNavbar from '@/components/layout/TopNavbar';
import WebRtcSoftphone from '@/components/softphone/WebRtcSoftphone';
import { ToastProvider } from '@/components/ui/Toast';
import { AudioPlayerProvider } from '@/components/audio/AudioPlayerContext';
import { usePathname, useRouter } from 'next/navigation';
import { getAuthToken, api, setAuthToken, setStoredUser } from '@/lib/api';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [softphoneOpen, setSoftphoneOpen] = useState(false);
  const [initialDialTarget, setInitialDialTarget] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const isLoginPage = pathname === '/login';

  // Load user's saved sidebar collapse preference on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pbx_sidebar_collapsed');
      if (saved !== null) {
        setSidebarCollapsed(saved === 'true');
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (!token && !isLoginPage) {
      api.login().then((res) => {
        if (res?.token) {
          setAuthToken(res.token);
          setStoredUser(res.user);
          setIsAuth(true);
        } else {
          router.push('/login');
        }
      }).catch(() => {
        router.push('/login');
      });
    } else {
      setIsAuth(true);
    }
  }, [pathname, isLoginPage, router]);

  // Global event listener for click-to-call across any page
  useEffect(() => {
    const handleQuickDialEvent = (e: any) => {
      if (e.detail?.target) {
        setInitialDialTarget(e.detail.target);
        setSoftphoneOpen(true);
      }
    };

    window.addEventListener('pbx:dial' as any, handleQuickDialEvent);
    return () => {
      window.removeEventListener('pbx:dial' as any, handleQuickDialEvent);
    };
  }, []);

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileSidebarOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('pbx_sidebar_collapsed', String(next));
        } catch (e) {}
        return next;
      });
    }
  };

  // Shortcut Ctrl+B or Cmd+B to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleToggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoginPage) {
    return (
      <html lang="en">
        <head>
          <title>ECLYPETECH PBX - Enterprise VoIP Management Console</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body className="bg-[#F8FAFC] text-slate-800 min-h-screen font-sans">
          <ToastProvider>{children}</ToastProvider>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>
        <title>ECLYPETECH PBX - Enterprise VoIP Management Console</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-[#F8FAFC] text-slate-800 min-h-screen flex flex-col font-sans">
        <ToastProvider>
          <AudioPlayerProvider>
            {/* Top Frosted Navbar */}
            <TopNavbar
              onToggleSidebar={handleToggleSidebar}
              onOpenSoftphone={() => setSoftphoneOpen(true)}
            />

            {/* Left Structured Sidebar */}
            <Sidebar
              collapsed={sidebarCollapsed}
              mobileOpen={mobileSidebarOpen}
              onCloseMobile={() => setMobileSidebarOpen(false)}
              onToggleCollapse={handleToggleSidebar}
            />

            {/* Main Workspace Area with responsive smooth margin */}
            <main
              className={`pt-[52px] min-h-screen bg-[#F8FAFC] transition-all duration-200 ease-in-out pl-0 ${
                sidebarCollapsed ? 'lg:pl-[68px]' : 'lg:pl-[236px]'
              }`}
            >
              <div className="max-w-[1600px] mx-auto p-3.5 sm:p-5 lg:p-6">
                {children}
              </div>
            </main>

            {/* WebRTC Softphone Drawer */}
            <WebRtcSoftphone
              isOpen={softphoneOpen}
              initialTarget={initialDialTarget}
              onClose={() => {
                setSoftphoneOpen(false);
                setInitialDialTarget('');
              }}
            />
          </AudioPlayerProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
