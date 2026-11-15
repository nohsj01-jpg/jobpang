'use client';

import React, { useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { createClient } from '@/lib/supabase/client';
import { isPrototypeSession } from '@/lib/prototype-session';
import { Store, User, Calendar, Clock, DollarSign, MessageSquare, Send, ArrowRight } from 'lucide-react';

function DirectRequestContent() {
  const params = useParams();
  const router = useRouter();
  const workerId = (params?.id as string) || 'worker-1';

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [workDate, setWorkDate] = useState('2026-11-14');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('22:00');
  const [hourlyWage, setHourlyWage] = useState(14000);
  const [message, setMessage] = useState(
    '안녕하세요! 오늘 마감 타임 직원이 급한 사정으로 출근하지 못해 대타 요청드립니다. 제조 가능하시면 빠른 수락 부탁드립니다!'
  );

  React.useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setWorkDate(today);
  }, []);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const startDateTime = new Date(`${workDate}T${startTime}:00`);
      const endDateTime = new Date(`${workDate}T${endTime}:00`);

      if (endDateTime <= startDateTime) {
        throw new Error('근무 종료 시각은 시작 시각보다 뒤여야 합니다.');
      }

      if (!Number.isInteger(hourlyWage) || hourlyWage < 9860) {
        throw new Error('시급은 9,860원 이상의 정수로 입력해 주세요.');
      }

      if (isPrototypeSession()) {
        const request = {
          id: `prototype-request-${Date.now()}`,
          storeName: '메가커피',
          branchName: '강남역점',
          brandName: '메가커피',
          workDate,
          startTime,
          endTime,
          hourlyWage,
          message,
          addressSummary: '서울 강남구 강남역 인근',
          status: 'Pending',
        };
        const savedRequests = JSON.parse(
          localStorage.getItem('jobpang_prototype_requests') || '[]'
        );
        localStorage.setItem(
          'jobpang_prototype_requests',
          JSON.stringify([request, ...savedRequests])
        );
        alert('대타 요청이 프로토타입 데이터로 이 브라우저에 임시 저장되었습니다.');
        router.push('/home');
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let storeId = 'demo-store-id';

      if (user) {
        const { data: store } = await (supabase.from('stores') as any)
          .select('id')
          .eq('owner_id', user.id)
          .limit(1)
          .maybeSingle();

        if (store) {
          storeId = store.id;
        }
      }

      // DB direct_requests INSERT (status = 'Pending')
      const { data, error } = await (supabase.from('direct_requests') as any)
        .insert({
          store_id: storeId,
          worker_id: workerId,
          work_date: workDate,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          hourly_wage: Number(hourlyWage),
          message,
          status: 'Pending',
        })
        .select()
        .single();

      if (error && !storeId.startsWith('demo-')) throw error;

      alert('근무자에게 1:1 긴급 대타 요청서가 발송되었습니다!\n근무자가 수락하면 매칭이 즉시 체결됩니다.');
      router.push('/home');
    } catch (err: any) {
      setErrorMessage(err.message || '요청 발송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 p-4 space-y-4">
      {errorMessage && (
        <div className="rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-200">
          {errorMessage}
        </div>
      )}

      {/* 수신 대상 안내 카드 */}
      <div className="rounded-2xl bg-amber-500 p-4 text-white shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-bold text-amber-100">
            <User className="h-4 w-4" />
            수신 근무자: 이수진 (메가커피 14개월 경력)
          </span>
          <span className="rounded bg-amber-600 px-2 py-0.5 text-[10px] font-bold">1:1 직접 제안</span>
        </div>
        <h2 className="text-base font-bold">이 근무자에게 제안할 근무 조건을 작성해주세요</h2>
        <p className="text-xs text-amber-100 leading-relaxed">
          요청서를 발송하면 근무자의 홈 화면에 즉시 알림 카드가 노출됩니다.
        </p>
      </div>

      <form onSubmit={handleSendRequest} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-zinc-800 mb-1 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-amber-600" />
            근무 날짜
          </label>
          <input
            type="date"
            required
            value={workDate}
            onChange={(e) => setWorkDate(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              시작 시각
            </label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              종료 시각
            </label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-800 mb-1 flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-amber-600" />
            제시 시급 (원)
          </label>
          <div className="relative">
            <input
              type="number"
              step="1"
              min="9860"
              required
              value={hourlyWage}
              onChange={(e) => setHourlyWage(Number(e.target.value))}
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm font-bold text-zinc-900 focus:border-amber-500 focus:outline-none"
            />
            <span className="absolute right-3.5 top-2.5 text-xs text-zinc-400 font-medium">원</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-800 mb-1 flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-amber-600" />
            근무자에게 전달할 요청 메시지
          </label>
          <textarea
            rows={3}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 p-3 text-xs focus:border-amber-500 focus:outline-none resize-none"
          />
        </div>

        <div className="rounded-xl bg-zinc-50 p-2.5 text-[11px] text-zinc-500 leading-relaxed border border-zinc-200">
          * 안내: 근무자가 개인 사정으로 요청을 거절하더라도 근무자에게 어떠한 페널티나 불이익도 부과되지 않습니다.
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 text-sm font-bold text-white shadow-md shadow-amber-200 hover:bg-amber-600 active:scale-[0.99] disabled:opacity-50 transition-all"
        >
          <Send className="h-4 w-4" />
          {loading ? '요청서 발송 중...' : '1:1 대타 요청서 발송하기'}
        </button>
      </form>
    </main>
  );
}

export default function DirectRequestPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 pb-20">
      <Header title="직접 대타 요청서 작성" showBack role="owner" />
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          </div>
        }
      >
        <DirectRequestContent />
      </Suspense>
      <BottomNav role="owner" />
    </div>
  );
}
