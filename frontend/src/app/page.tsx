'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, getAuthToken, setAuthToken, setStoredUser } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (token) {
        router.replace('/dashboard');
        return;
      }

      try {
        const res = await api.login();
        if (res.token) {
          setAuthToken(res.token);
          setStoredUser(res.user);
          router.replace('/dashboard');
          return;
        }
      } catch (err) {
        router.replace('/login');
      }
    };

    initAuth();
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#F3F5F6]">
      <div className="text-center space-y-3">
        <div className="w-9 h-9 border-3 border-[#0798CC] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[#707070] font-medium tracking-wide">
          Loading Eclype Technology PBX Console...
        </p>
      </div>
    </div>
  );
}
