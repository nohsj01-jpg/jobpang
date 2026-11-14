'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { OwnerDashboard } from '@/components/owner/OwnerDashboard';
import { WorkerDashboard } from '@/components/worker/WorkerDashboard';
import { UserRole } from '@/types/database.types';
import { createClient } from '@/lib/supabase/client';

export default function HomePage() {
  const [role, setRole] = useState<UserRole>('worker');
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [isGuestPreview, setIsGuestPreview] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      // 1. 데모 모드 체크
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
        const demoRole = localStorage.getItem('jobpang_demo_role');
        const demoUser = localStorage.getItem('jobpang_demo_user');
        if (demoRole === 'owner' || demoRole === 'worker') {
          setRole(demoRole);
          setIsGuestPreview(true);
          if (demoUser) {
            try {
              const parsed = JSON.parse(demoUser);
              setUserName(parsed.name || '');
            } catch (e) {}
          }
          setLoading(false);
          return;
        }
      }

      // 2. 실제 Supabase 세션 조회
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await (supabase.from('profiles') as any)
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setRole(profile.role as UserRole);
          setUserName(profile.name);
        }
      } else {
        setRole('owner');
        setUserName('김점주');
        setIsGuestPreview(true);
      }

      setLoading(false);
    }

    loadUser();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <Header role={role} />
      {isGuestPreview && (
        <p className="px-4 pt-2 text-center text-[11px] text-zinc-500">
          게스트 미리보기 · 예시 데이터이며 저장되지 않습니다.
        </p>
      )}
      <main className="flex-1">
        {role === 'owner' ? (
          <OwnerDashboard userName={userName || '김점주'} />
        ) : (
          <WorkerDashboard userName={userName || '박알바'} />
        )}
      </main>
      <BottomNav role={role} pendingRequestsCount={role === 'worker' ? 1 : 0} />
    </div>
  );
}
