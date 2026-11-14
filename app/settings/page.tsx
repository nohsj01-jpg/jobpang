'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { UserRole } from '@/types/database.types';
import { createClient } from '@/lib/supabase/client';
import { clearDemoSessionCookie } from '@/lib/demo-session';
import { User, Shield, RefreshCw, LogOut, Info, Bell, Store, UserCheck } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>('worker');
  const [userName, setUserName] = useState('김회원');
  const [phone, setPhone] = useState('010-1234-5678');

  const supabase = createClient();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const demoRole = localStorage.getItem('jobpang_demo_role') as UserRole | null;
      const demoUser = localStorage.getItem('jobpang_demo_user');
      if (demoRole) {
        setRole(demoRole);
        if (demoUser) {
          try {
            const parsed = JSON.parse(demoUser);
            setUserName(parsed.name || '');
            setPhone(parsed.phone || '010-1234-5678');
          } catch (e) {}
        }
      }
    }
  }, []);

  // 점주 <-> 근무자 역할 전환 토글
  const handleToggleRole = () => {
    const newRole: UserRole = role === 'owner' ? 'worker' : 'owner';
    setRole(newRole);
    if (typeof window !== 'undefined') {
      localStorage.setItem('jobpang_demo_role', newRole);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jobpang_demo_role');
      localStorage.removeItem('jobpang_demo_user');
      clearDemoSessionCookie();
    }
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 pb-20">
      <Header title="설정 및 내 정보" showBack role={role} />

      <main className="flex-1 p-4 space-y-4">
        {/* 프로필 카드 */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-lg">
              {userName.slice(0, 1)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900 truncate">{userName}</h2>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 border border-zinc-200">
                  {role === 'owner' ? '점주 계정' : '근무자 계정'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">{phone}</p>
            </div>
          </div>

          {/* 역할 전환 버튼 (Role Switch) */}
          <div className="mt-4 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={handleToggleRole}
              className="flex w-full items-center justify-between rounded-xl bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 active:scale-[0.99] transition-all border border-zinc-200"
            >
              <span className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-blue-600" />
                {role === 'owner' ? '근무자 모드로 전환하기' : '점주 모드로 전환하기'}
              </span>
              <span className="text-[11px] text-blue-600 font-bold">전환</span>
            </button>
          </div>
        </div>

        {/* 알림 수신함 */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
              <Bell className="h-4 w-4 text-blue-600" />
              최근 알림 수신함
            </h3>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              새 알림 2건
            </span>
          </div>

          <div className="space-y-2">
            <div className="rounded-xl bg-zinc-50 p-3 text-xs space-y-1 border border-zinc-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-900">대타 매칭 확정 안내</span>
                <span className="text-[10px] text-zinc-400">5분 전</span>
              </div>
              <p className="text-zinc-600 text-[11px] leading-relaxed">
                메가커피 강남역점 대타 근무가 최종 확정되었습니다. 상호 연락처가 열람 가능합니다.
              </p>
            </div>

            <div className="rounded-xl bg-zinc-50 p-3 text-xs space-y-1 border border-zinc-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-900">1:1 직접 대타 요청 도착</span>
                <span className="text-[10px] text-zinc-400">15분 전</span>
              </div>
              <p className="text-zinc-600 text-[11px] leading-relaxed">
                메가커피 역삼역점에서 긴급 대타 요청이 도착했습니다. 요청 관리 탭에서 확인해주세요.
              </p>
            </div>
          </div>
        </div>

        {/* 핵심 안심 정책 카드 */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-emerald-600" />
            잡팡 안심 매칭 원칙
          </h3>
          <ul className="space-y-2 text-xs text-zinc-600">
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span><strong>개인정보 보호:</strong> 매칭 확정 전에는 연락처 및 상세 위치가 절대 공개되지 않습니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span><strong>불이익 없는 거절:</strong> 점주의 1:1 대타 요청을 거절해도 평점 등에 어떠한 불이익도 없습니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span><strong>투명한 경력 표기:</strong> 공식 인증 대신 <code className="bg-zinc-100 px-1 py-0.5 rounded text-[11px]">자가 등록</code> 및 <code className="bg-zinc-100 px-1 py-0.5 rounded text-[11px]">매장 확인</code> 경력으로 정확히 구분합니다.</span>
            </li>
          </ul>
        </div>

        {/* 로그아웃 버튼 */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white py-3 text-xs font-semibold text-red-600 hover:bg-red-50 active:scale-[0.99] transition-all"
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </button>

        <p className="text-center text-[11px] text-zinc-400">
          잡팡 JOBPANG MVP v0.1.0 • 오늘 일, 지금 잡자!
        </p>
      </main>

      <BottomNav role={role} />
    </div>
  );
}
