'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, ArrowRight, Lock, Mail, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { clearDemoSessionCookie, setDemoSessionCookie } from '@/lib/demo-session';
import type { UserRole } from '@/types/database.types';

type SeedAccount = {
  label: string;
  email: string;
  role: UserRole;
  name: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const supabase = createClient();

  // 테스트용 시드 계정 목록 (점주 2명, 근무자 5명)
  const seedAccounts: SeedAccount[] =
    process.env.NODE_ENV === 'production'
      ? []
      : [
          { label: '점주 1 (메가커피 강남역점)', email: 'owner1@jobpang.kr', role: 'owner', name: '김점주' },
          { label: '점주 2 (컴포즈커피 역삼점)', email: 'owner2@jobpang.kr', role: 'owner', name: '이점주' },
          { label: '근무자 1 (메가커피 14개월/확인)', email: 'worker1@jobpang.kr', role: 'worker', name: '박알바' },
          { label: '근무자 2 (메가커피 6개월/자가)', email: 'worker2@jobpang.kr', role: 'worker', name: '정알바' },
          { label: '근무자 3 (컴포즈 10개월/확인)', email: 'worker3@jobpang.kr', role: 'worker', name: '최알바' },
          { label: '근무자 4 (빽다방 8개월/자가)', email: 'worker4@jobpang.kr', role: 'worker', name: '강알바' },
          { label: '근무자 5 (스타벅스 12개월/확인)', email: 'worker5@jobpang.kr', role: 'worker', name: '윤알바' },
        ];

  // 이메일 로그인 / 회원가입 핸들러
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              phone,
              onboarding_pending: true,
            },
          },
        });
        if (error) throw error;

        if (data.session) {
          router.push('/role-select');
        } else {
          setSuccessMessage('가입 확인 메일을 보냈어요. 이메일 인증을 마친 뒤 로그인해 주세요.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        // Supabase 오프라인/데모 환경 폴백 처리
        if (error) {
          // 시드 계정인 경우 로컬 데모 세션으로 부드럽게 연결
          const matched = seedAccounts.find((a) => a.email === email);
          if (matched && process.env.NODE_ENV !== 'production') {
            if (typeof window !== 'undefined') {
              localStorage.setItem('jobpang_demo_role', matched.role);
              localStorage.setItem(
                'jobpang_demo_user',
                JSON.stringify({
                  email: matched.email,
                  name: matched.name,
                  role: matched.role,
                  phone: '010-1234-5678',
                })
              );
              setDemoSessionCookie(matched.role);
            }
            router.push('/home');
            return;
          }
          if (matched) {
            throw new Error(
              '테스트 계정은 개발 환경에서만 사용할 수 있습니다. 회원가입하거나 실제 계정으로 로그인해 주세요.'
            );
          }
          throw new Error(
            error.message === 'Invalid login credentials'
              ? '이메일 또는 비밀번호가 올바르지 않습니다.'
              : error.message
          );
        }

        localStorage.removeItem('jobpang_demo_role');
        localStorage.removeItem('jobpang_demo_user');
        clearDemoSessionCookie();
        router.push(
          data.user.user_metadata?.onboarding_pending === true
            ? '/role-select'
            : '/home'
        );
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : '인증 처리 중 오류가 발생했습니다.'
      );
    } finally {
      setLoading(false);
    }
  };

  // 시드 계정 빠른 선택
  const handleSelectSeedAccount = (acc: SeedAccount) => {
    setEmail(acc.email);
    setPassword('password123!');
    setIsSignUp(false);

    // 즉시 세션 연동 체험
    if (typeof window !== 'undefined') {
      localStorage.setItem('jobpang_demo_role', acc.role);
      localStorage.setItem(
        'jobpang_demo_user',
        JSON.stringify({
          email: acc.email,
          name: acc.name,
          role: acc.role,
          phone: '010-1234-5678',
        })
      );
    }
  };

  return (
    <div className="w-full">
      {/* 서비스 로고 및 슬로건 */}
      <div className="text-center mb-6">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200 mb-3">
          <Zap className="h-8 w-8 fill-white" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-900">
          잡팡 <span className="text-blue-600 font-extrabold text-lg">JOBPANG</span>
        </h1>
        <p className="mt-1 text-base font-bold text-zinc-800">오늘 일, 지금 잡자!</p>
        <p className="mt-0.5 text-xs text-zinc-500">
          갑작스러운 결근으로 인한 공백, 동일 브랜드 경력자와 1초 연결
        </p>
      </div>

      {process.env.NODE_ENV === 'production' ? (
        <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 p-3.5 text-xs leading-relaxed text-blue-800">
          운영 환경에서는 테스트 계정을 사용할 수 없습니다. 실제 계정으로 로그인하거나 회원가입해 주세요.
        </div>
      ) : (
        <div className="mb-5 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-blue-600" />
              테스트 시드 계정 선택 (원클릭)
            </span>
            <span className="text-[10px] text-zinc-400 font-medium">비밀번호: password123!</span>
          </div>

          <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
            {seedAccounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleSelectSeedAccount(acc)}
                className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs transition-all border ${
                  email === acc.email
                    ? 'bg-blue-600 text-white font-bold border-blue-600 shadow-xs'
                    : 'bg-white text-zinc-700 hover:bg-zinc-100 border-zinc-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      email === acc.email
                        ? 'bg-white/20 text-white'
                        : acc.role === 'owner'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {acc.role === 'owner' ? '점주' : '근무자'}
                  </span>
                  <span className="truncate">{acc.label}</span>
                </div>
                <span className="text-[10px] opacity-75 font-mono">{acc.email.split('@')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 로그인 / 회원가입 탭 */}
      <div className="flex border-b border-zinc-200 mb-4">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(false);
            setErrorMessage('');
            setSuccessMessage('');
          }}
          className={`flex-1 pb-2 text-center text-sm font-semibold border-b-2 transition-colors ${
            !isSignUp ? 'border-blue-600 text-blue-600' : 'border-transparent text-zinc-400'
          }`}
        >
          이메일 로그인
        </button>
        <button
          type="button"
          onClick={() => {
            setIsSignUp(true);
            setErrorMessage('');
            setSuccessMessage('');
          }}
          className={`flex-1 pb-2 text-center text-sm font-semibold border-b-2 transition-colors ${
            isSignUp ? 'border-blue-600 text-blue-600' : 'border-transparent text-zinc-400'
          }`}
        >
          회원가입 (역할 선택)
        </button>
      </div>

      {/* 에러 메시지 알림 */}
      {errorMessage && (
        <div className="mb-3.5 rounded-xl bg-red-50 p-2.5 text-xs text-red-600 border border-red-200">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="mb-3.5 rounded-xl bg-emerald-50 p-2.5 text-xs text-emerald-700 border border-emerald-200">
          {successMessage}
        </div>
      )}

      {/* 폼 입력 영역 */}
      <form onSubmit={handleAuth} className="space-y-3">
        {isSignUp && (
          <>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">이름 (실명)</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                휴대폰 번호 (매칭 확정 전 비공개 보장)
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-1234-5678"
                className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">이메일 주소</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@jobpang.kr"
              className="w-full rounded-xl border border-zinc-300 pl-10 pr-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">비밀번호</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자리 이상 비밀번호"
              className="w-full rounded-xl border border-zinc-300 pl-10 pr-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md shadow-blue-100 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 transition-all"
        >
          {loading ? (
            '처리 중...'
          ) : isSignUp ? (
            <>
              다음 단계 (역할 선택하기)
              <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            '로그인'
          )}
        </button>
      </form>
    </div>
  );
}
