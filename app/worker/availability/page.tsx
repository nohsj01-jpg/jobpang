'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { createClient } from '@/lib/supabase/client';
import { MapPin, Clock, Calendar, Check, ArrowRight, Zap, Bell } from 'lucide-react';

interface DaySchedule {
  dayName: string;
  dayIndex: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

export default function WorkerAvailabilityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 활동 지역
  const [preferredArea, setPreferredArea] = useState('서울 강남구 역삼동');
  const [radiusKm, setRadiusKm] = useState('3km (도보/대중교통 20분 이내)');
  const [isInstantAvailable, setIsInstantAvailable] = useState(true);

  // 요일별 스케줄 (0:일, 1:월, ... 6:토)
  const [schedules, setSchedules] = useState<DaySchedule[]>([
    { dayName: '월요일', dayIndex: 1, enabled: true, startTime: '18:00', endTime: '23:00' },
    { dayName: '화요일', dayIndex: 2, enabled: true, startTime: '18:00', endTime: '23:00' },
    { dayName: '수요일', dayIndex: 3, enabled: true, startTime: '18:00', endTime: '23:00' },
    { dayName: '목요일', dayIndex: 4, enabled: true, startTime: '18:00', endTime: '23:00' },
    { dayName: '금요일', dayIndex: 5, enabled: true, startTime: '18:00', endTime: '24:00' },
    { dayName: '토요일', dayIndex: 6, enabled: true, startTime: '09:00', endTime: '22:00' },
    { dayName: '일요일', dayIndex: 0, enabled: true, startTime: '09:00', endTime: '22:00' },
  ]);

  const toggleDay = (dayIndex: number) => {
    setSchedules((prev) =>
      prev.map((s) => (s.dayIndex === dayIndex ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const updateTime = (dayIndex: number, field: 'startTime' | 'endTime', value: string) => {
    setSchedules((prev) =>
      prev.map((s) => (s.dayIndex === dayIndex ? { ...s, [field]: value } : s))
    );
  };

  const supabase = createClient();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('jobpang_worker_preferred_area', preferredArea);
        localStorage.setItem('jobpang_worker_instant_available', isInstantAvailable ? 'true' : 'false');
        localStorage.setItem('jobpang_worker_schedules', JSON.stringify(schedules));
      }

      alert('근무 가능 시간과 활동 지역 설정이 저장되었습니다!\n설정한 조건에 일치하는 긴급 대타 공고와 요청이 우선 전달됩니다.');
      router.push('/home');
    } catch (err: any) {
      alert(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 pb-24">
      <Header title="근무 가능 시간 및 활동 지역" showBack role="worker" />

      <main className="flex-1 p-4 space-y-4">
        {/* 상단 퀵 알림 */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 p-4 text-white shadow-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-100">
            <Zap className="h-4 w-4" />
            맞춤 대타 매칭 설정
          </div>
          <h2 className="text-base font-bold">내가 일할 수 있는 시간과 지역을 알려주세요</h2>
          <p className="text-xs text-indigo-100 leading-relaxed">
            점주가 검색할 때 설정하신 활동 지역과 가능한 요일의 근무자에게 직접 요청을 우선 제안합니다.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* 활동 지역 설정 */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-blue-600" />
              활동 희망 지역
            </h3>

            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                기본 활동 중심지 (동/구 단위)
              </label>
              <input
                type="text"
                required
                value={preferredArea}
                onChange={(e) => setPreferredArea(e.target.value)}
                placeholder="예: 서울 강남구 역삼동, 서초동"
                className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm font-semibold text-zinc-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                이동 가능 반경
              </label>
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              >
                <option value="1km">1km 이내 (도보 10분)</option>
                <option value="3km (도보/대중교통 20분 이내)">3km (도보/대중교통 20분 이내)</option>
                <option value="5km 이내">5km 이내 (대중교통 30분)</option>
                <option value="강남/서초/송파 전역">강남/서초/송파 전역</option>
              </select>
            </div>

            {/* 당일 즉시 출동 가능 토글 */}
            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-900 flex items-center gap-1">
                  <Bell className="h-3.5 w-3.5 text-amber-500" />
                  오늘 당일 긴급 출동 가능
                </span>
                <span className="text-[10px] text-zinc-500 block">
                  오늘 결근 발생 시 긴급 알림을 즉시 받습니다.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsInstantAvailable(!isInstantAvailable)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  isInstantAvailable ? 'bg-blue-600' : 'bg-zinc-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isInstantAvailable ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 요일별 근무 가능 시간대 */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-blue-600" />
              요일별 근무 가능 시간
            </h3>

            <div className="space-y-2 pt-1">
              {schedules.map((schedule) => (
                <div
                  key={schedule.dayIndex}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    schedule.enabled
                      ? 'border-zinc-200 bg-white'
                      : 'border-zinc-100 bg-zinc-50 opacity-60'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleDay(schedule.dayIndex)}
                    className="flex items-center gap-2 text-left"
                  >
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${
                        schedule.enabled
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-200 text-zinc-500'
                      }`}
                    >
                      {schedule.dayName.slice(0, 1)}
                    </div>
                    <span className="text-xs font-semibold text-zinc-800">
                      {schedule.dayName}
                    </span>
                  </button>

                  {schedule.enabled ? (
                    <div className="flex items-center gap-1.5 text-xs">
                      <input
                        type="time"
                        value={schedule.startTime}
                        onChange={(e) =>
                          updateTime(schedule.dayIndex, 'startTime', e.target.value)
                        }
                        className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-medium"
                      />
                      <span className="text-zinc-400">~</span>
                      <input
                        type="time"
                        value={schedule.endTime}
                        onChange={(e) =>
                          updateTime(schedule.dayIndex, 'endTime', e.target.value)
                        }
                        className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-medium"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-400 font-medium pr-2">근무 불가</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 transition-all"
          >
            {loading ? '저장 중...' : '근무 가능 조건 저장하기'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </main>

      <BottomNav role="worker" />
    </div>
  );
}
