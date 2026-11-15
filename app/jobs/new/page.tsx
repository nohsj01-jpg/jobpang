'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { createClient } from '@/lib/supabase/client';
import { isPrototypeSession } from '@/lib/prototype-session';
import { Store, Calendar, Clock, DollarSign, FileText, CheckCircle2, ArrowRight } from 'lucide-react';

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 폼 필드 상태
  const [title, setTitle] = useState('');
  const [workDate, setWorkDate] = useState('2026-11-14');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('22:00');
  const [hourlyWage, setHourlyWage] = useState(13000);
  const [description, setDescription] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>(['음료 제조', '포스 계산']);

  React.useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setWorkDate(today);
  }, []);

  const taskOptions = ['음료 제조', '포스 계산', '매장 청소/마감', '재고 입고/정리', '고객 응대'];

  const toggleTask = (task: string) => {
    setSelectedTasks((prev) =>
      prev.includes(task) ? prev.filter((t) => t !== task) : [...prev, task]
    );
  };

  const handleSubmit = async (status: 'Open' | 'Draft') => {
    setLoading(true);
    setErrorMessage('');

    try {
      // 시간 유효성 검사
      const startDateTime = new Date(`${workDate}T${startTime}:00`);
      const endDateTime = new Date(`${workDate}T${endTime}:00`);

      if (endDateTime <= startDateTime) {
        throw new Error('근무 종료 시각은 시작 시각보다 뒤여야 합니다.');
      }

      if (hourlyWage < 9860) {
        throw new Error('시급은 2026년 법정 최저시급(9,860원) 이상이어야 합니다.');
      }

      if (isPrototypeSession()) {
        const prototypeJob = {
          id: `prototype-job-${Date.now()}`,
          title: title || `${workDate} 긴급 대타 구인`,
          date: workDate,
          time: `${startTime} ~ ${endTime}`,
          wage: Number(hourlyWage),
          status,
          applicantCount: 0,
        };
        const savedJobs = JSON.parse(localStorage.getItem('jobpang_prototype_jobs') || '[]');
        localStorage.setItem(
          'jobpang_prototype_jobs',
          JSON.stringify([prototypeJob, ...savedJobs])
        );
        alert('프로토타입 공고가 이 브라우저에 임시 저장되었습니다.');
        router.push('/home');
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let storeId = 'demo-store-id';

      if (user) {
        // 점주의 첫 번째 매장 조회
        const { data: store } = await (supabase.from('stores') as any)
          .select('id')
          .eq('owner_id', user.id)
          .limit(1)
          .maybeSingle();

        if (store) {
          storeId = store.id;
        }
      }

      const fullDescription = `${selectedTasks.length > 0 ? `[주요 업무: ${selectedTasks.join(', ')}]\n` : ''}${description}`;

      // 공고 등록
      const { data, error } = await (supabase.from('jobs') as any)
        .insert({
          store_id: storeId,
          title: title || `${workDate} 긴급 대타 구인`,
          work_date: workDate,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          hourly_wage: Number(hourlyWage),
          description: fullDescription,
          status,
        })
        .select()
        .single();

      if (error && !storeId.startsWith('demo-')) throw error;

      alert(status === 'Open' ? '긴급 대타 공고가 등록되었습니다!' : '공고가 임시저장되었습니다.');
      router.push('/home');
    } catch (err: any) {
      setErrorMessage(err.message || '공고 등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 pb-24">
      <Header title="긴급 대타 공고 등록" showBack role="owner" />

      <main className="flex-1 p-4 space-y-4">
        {errorMessage && (
          <div className="rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-200">
            {errorMessage}
          </div>
        )}

        {/* 안내 카드 */}
        <div className="rounded-2xl bg-amber-500 p-4 text-white shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Store className="h-4 w-4" />
            <span className="text-xs font-bold text-amber-100">메가커피 강남역점</span>
          </div>
          <h2 className="text-base font-bold">인력 공백이 생긴 근무 일정을 입력해주세요</h2>
          <p className="mt-1 text-xs text-amber-100 leading-relaxed">
            공고를 등록하면 같은 브랜드 근무 경험이 있는 근처 대타 근무자들에게 즉시 알림이 전송됩니다.
          </p>
        </div>

        {/* 폼 카드 */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1">공고 제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 오늘 저녁 18~22시 긴급 마감 대타 급구!"
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-amber-600" />
              근무 날짜
            </label>
            <input
              type="date"
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
                step="500"
                min="9860"
                value={hourlyWage}
                onChange={(e) => setHourlyWage(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm font-bold text-zinc-900 focus:border-amber-500 focus:outline-none"
              />
              <span className="absolute right-3.5 top-2.5 text-xs text-zinc-400 font-medium">원</span>
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">
              * 긴급 결근인 만큼 매칭 확률을 높이려면 통상 시급보다 약간 높게 설정하는 것을 추천합니다.
            </p>
          </div>

          {/* 주요 담당 업무 체크칩 */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-2">필요 업무</label>
            <div className="flex flex-wrap gap-2">
              {taskOptions.map((task) => {
                const isSelected = selectedTasks.includes(task);
                return (
                  <button
                    key={task}
                    type="button"
                    onClick={() => toggleTask(task)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {task}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-amber-600" />
              근무자에게 전달할 요청 사항
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예: 레시피 숙지되신 분 우대합니다. 유니폼 상의는 매장에 비치되어 있습니다."
              className="w-full rounded-xl border border-zinc-300 p-3 text-xs focus:border-amber-500 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit('Open')}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 text-sm font-bold text-white shadow-md shadow-amber-200 hover:bg-amber-600 active:scale-[0.99] disabled:opacity-50 transition-all"
          >
            {loading ? '등록 중...' : '지금 바로 긴급 공고 올리기'}
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit('Draft')}
            className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 active:scale-[0.99] transition-all"
          >
            임시저장 (나중에 올리기)
          </button>
        </div>
      </main>

      <BottomNav role="owner" />
    </div>
  );
}
