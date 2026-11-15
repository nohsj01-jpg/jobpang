'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Users, Clock, AlertTriangle, ArrowRight, Store, ChevronRight } from 'lucide-react';
import { STATUS_META } from '@/lib/constants/status';
import { isPrototypeSession } from '@/lib/prototype-session';
import type { JobStatus } from '@/types/database.types';

type OwnerJob = {
  id: string;
  title: string;
  date: string;
  time: string;
  wage: number;
  status: JobStatus;
  applicantCount: number;
};

const initialRecentJobs: OwnerJob[] = [
  {
    id: 'job-1',
    title: '오늘 저녁 18:00~22:00 긴급 마감 대타',
    date: '오늘 (11월 14일)',
    time: '18:00 ~ 22:00 (4시간)',
    wage: 13500,
    status: 'Reviewing',
    applicantCount: 2,
  },
  {
    id: 'job-2',
    title: '내일 오전 09:00~14:00 주말 오픈 대타',
    date: '내일 (11월 15일)',
    time: '09:00 ~ 14:00 (5시간)',
    wage: 12000,
    status: 'Open',
    applicantCount: 0,
  },
];

interface OwnerDashboardProps {
  userName?: string;
  storeName?: string;
  activeJobsCount?: number;
  pendingRequestsCount?: number;
}

export function OwnerDashboard({
  userName = '김점주',
  storeName = '메가커피 강남역점',
  activeJobsCount = 2,
  pendingRequestsCount = 1,
}: OwnerDashboardProps) {
  const [recentJobs, setRecentJobs] = useState(initialRecentJobs);

  useEffect(() => {
    if (!isPrototypeSession()) return;

    const savedJobs = localStorage.getItem('jobpang_prototype_jobs');
    if (!savedJobs) return;

    try {
      const prototypeJobs = JSON.parse(savedJobs) as OwnerJob[];
      const timeoutId = window.setTimeout(
        () => setRecentJobs((current) => [...prototypeJobs, ...current]),
        0
      );
      return () => window.clearTimeout(timeoutId);
    } catch (error) {
      console.error('프로토타입 공고 데이터를 불러오지 못했습니다.', error);
    }
  }, []);

  return (
    <div className="flex-1 pb-20 px-4 pt-4 space-y-5">
      {/* 매장 상태 헤더 카드 */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-4 text-white shadow-md">
        <div className="flex items-center justify-between mb-2">
          <span className="flex items-center gap-1.5 rounded-full bg-amber-400/30 px-2.5 py-0.5 text-xs font-semibold backdrop-blur">
            <Store className="h-3.5 w-3.5" />
            {storeName}
          </span>
          <span className="text-xs text-amber-100 font-medium">점주 모드</span>
        </div>
        <h2 className="text-lg font-bold leading-tight">
          갑작스러운 인력 공백이 생기셨나요?
        </h2>
        <p className="mt-1 text-xs text-amber-100">
          같은 브랜드 근무 경험이 있는 대타를 바로 찾아드립니다.
        </p>

        {/* 퀵 액션: 공고 등록 */}
        <div className="mt-4 flex gap-2">
          <Link
            href="/jobs/new"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-white py-2.5 px-3 text-xs font-bold text-amber-800 shadow-sm active:scale-95 transition-all"
          >
            <PlusCircle className="h-4 w-4 text-amber-600" />
            긴급 대타 공고 올리기
          </Link>
          <Link
            href="/workers"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-700/60 py-2.5 px-3 text-xs font-bold text-white border border-amber-400/40 active:scale-95 transition-all"
          >
            <Users className="h-4 w-4 text-amber-200" />
            경력 근무자 직접 찾기
          </Link>
        </div>
      </div>

      {/* 상태 현황 그리드 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-xs font-medium">모집/검토 중 공고</span>
            <Clock className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-xl font-black text-zinc-900">{activeJobsCount}건</p>
          <span className="text-[11px] text-blue-600 font-medium mt-0.5 block">
            지원자 2명 대기 중
          </span>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-xs font-medium">직접 요청 진행</span>
            <Users className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-xl font-black text-zinc-900">{pendingRequestsCount}건</p>
          <span className="text-[11px] text-amber-600 font-medium mt-0.5 block">
            근무자 수락 대기 중
          </span>
        </div>
      </div>

      {/* 실시간 등록 공고 리스트 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
            <span>내 매장 긴급 공고 현황</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-bold text-zinc-600">
              {recentJobs.length}
            </span>
          </h3>
          <Link href="/jobs/new" className="text-xs font-semibold text-blue-600 flex items-center gap-0.5">
            공고 추가
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="space-y-2.5">
          {recentJobs.map((job) => {
            const statusInfo = STATUS_META[job.status];
            return (
              <div
                key={job.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs hover:border-zinc-300 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium border ${statusInfo.badgeClass}`}
                    >
                      {statusInfo.label}
                    </span>
                    <h4 className="mt-1.5 text-sm font-bold text-zinc-900 leading-snug">
                      {job.title}
                    </h4>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-3 text-xs text-zinc-500">
                  <span>{job.date}</span>
                  <span>•</span>
                  <span>{job.time}</span>
                  <span>•</span>
                  <span className="font-semibold text-zinc-900">시급 {job.wage.toLocaleString()}원</span>
                </div>

                <div className="mt-3.5 pt-3 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-xs text-zinc-600">
                    지원자 <strong className="text-blue-600 font-bold">{job.applicantCount}명</strong>
                  </span>
                  <Link
                    href={`/jobs/${job.id}/applicants`}
                    className="flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800"
                  >
                    지원자 검토하기
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
