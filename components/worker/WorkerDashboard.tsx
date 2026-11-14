'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { VERIFICATION_LABELS } from '@/lib/constants/status';
import {
  Sparkles,
  MapPin,
  Clock,
  ArrowRight,
  Check,
  X,
  BadgeCheck,
  Calendar,
  Store,
  DollarSign,
  PlusCircle,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Briefcase,
} from 'lucide-react';

interface WorkerDashboardProps {
  userName?: string;
}

export function WorkerDashboard({ userName = '박알바' }: WorkerDashboardProps) {
  const router = useRouter();

  // 근무자 프로필 및 경력 상태
  const [currentBrand, setCurrentBrand] = useState('메가MGC커피');
  const [monthsOfExp, setMonthsOfExp] = useState(14);
  const [verificationType, setVerificationType] = useState<'self_declared' | 'store_confirmed'>(
    'store_confirmed'
  );
  const [preferredArea, setPreferredArea] = useState('서울 강남구 역삼동');

  // 로컬 스토리지에 저장된 사용자 정보 동기화
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedBrand = localStorage.getItem('jobpang_worker_main_brand');
      const storedExp = localStorage.getItem('jobpang_worker_main_exp');
      const storedArea = localStorage.getItem('jobpang_worker_preferred_area');

      if (storedBrand) setCurrentBrand(storedBrand);
      if (storedExp) setMonthsOfExp(Number(storedExp));
      if (storedArea) setPreferredArea(storedArea);
    }
  }, []);

  // 1) 확정된 근무 데이터 (Confirmed Shift)
  const [confirmedShift, setConfirmedShift] = useState({
    id: 'match-demo-1',
    storeBrand: '메가MGC커피',
    branchName: '강남역점',
    workDate: '오늘 (11월 14일)',
    startTime: '18:00',
    endTime: '22:00',
    hourlyWage: 13500,
    addressDetail: '서울 강남구 테헤란로 123 1층',
    status: 'Matched' as const,
  });

  // 2) 받은 1:1 대타 요청 데이터 (Incoming Request)
  const [incomingRequest, setIncomingRequest] = useState<{
    id: string;
    storeBrand: string;
    branchName: string;
    distance: string;
    workDate: string;
    time: string;
    wage: number;
    message: string;
  } | null>({
    id: 'inv-demo-1',
    storeBrand: '메가MGC커피',
    branchName: '역삼역점',
    distance: '350m (도보 5분)',
    workDate: '내일 (11월 15일)',
    time: '19:00 ~ 23:00 (4시간)',
    wage: 14000,
    message: '마감 타임 직원이 급한 사정으로 출근하지 못해 대타 요청드립니다! 제조 가능하시면 빠른 수락 부탁드립니다.',
  });

  // 3) 내 경력/지역 맞춤 추천 공고 목록
  const recommendedJobs = [
    {
      id: 'post-1',
      brand: currentBrand,
      branchName: '선릉역센트럴점',
      title: `${currentBrand} 선릉점 마감 타임 음료 제조/마감`,
      date: '오늘 19:00 ~ 23:00',
      wage: 13500,
      location: '서울 강남구 역삼동 (800m)',
      matchScore: '브랜드 일치 100%',
    },
    {
      id: 'post-2',
      brand: currentBrand,
      branchName: '대치포스코점',
      title: `${currentBrand} 주말 오픈/미들 피크타임 급구`,
      date: '내일 10:00 ~ 15:00',
      wage: 13000,
      location: '서울 강남구 대치동 (1.2km)',
      matchScore: '활동지역 일치',
    },
  ];

  // 직접 요청 수락 핸들러
  const handleAcceptRequest = () => {
    alert('대타 근무가 확정되었습니다! 점주 연락처가 공개되며 매칭 상세 페이지로 이동합니다.');
    router.push('/matches/demo-match-1');
  };

  // 직접 요청 거절 핸들러 (불이익 없음)
  const handleRejectRequest = () => {
    setIncomingRequest(null);
    alert('대타 요청을 정중히 거절했습니다.\n(직접 요청 거절은 근무자에게 어떠한 불이익이나 평점 감점도 없습니다.)');
  };

  return (
    <div className="flex-1 pb-24 px-4 pt-4 space-y-4">
      {/* 1. 상단 내 프로필 & 경력 상태 배너 */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 p-4 text-white shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-blue-100 flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            근무자 모드
          </span>

          {/* 경력 확인 상태 배지 (공식 인증 경력 단어 금지 원칙 준수) */}
          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-white border border-white/30 backdrop-blur">
            <BadgeCheck className="h-3.5 w-3.5 text-emerald-300" />
            {VERIFICATION_LABELS[verificationType]}
          </span>
        </div>

        <div>
          <h2 className="text-lg font-black leading-tight">
            {userName}님, {currentBrand} {monthsOfExp}개월 경력
          </h2>
          <p className="mt-1 text-xs text-blue-100 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-blue-200" />
            활동 지역: {preferredArea}
          </p>
        </div>

        {/* 빠른 설정 액션 2종 */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/20">
          <Link
            href="/worker/experience/new"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 py-2 px-2.5 text-xs font-bold text-white border border-white/20 active:scale-95 transition-all text-center"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            경력 추가 등록
          </Link>
          <Link
            href="/worker/availability"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 py-2 px-2.5 text-xs font-bold text-white border border-white/20 active:scale-95 transition-all text-center"
          >
            <Sliders className="h-3.5 w-3.5" />
            가능 시간·지역 설정
          </Link>
        </div>
      </div>

      {/* 2. [섹션 1] 확정된 근무 (Confirmed Shift) */}
      {confirmedShift && (
        <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50/70 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white">
              <CheckCircle2 className="h-3.5 w-3.5 fill-white text-emerald-600" />
              출근 예정된 확정 근무
            </span>
            <span className="text-[11px] font-bold text-emerald-700">오늘 출근</span>
          </div>

          <div>
            <h3 className="text-base font-black text-zinc-900 leading-tight">
              {confirmedShift.storeBrand} {confirmedShift.branchName}
            </h3>
            <p className="mt-1 text-xs text-zinc-600 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-emerald-600" />
              <span>{confirmedShift.workDate} {confirmedShift.startTime} ~ {confirmedShift.endTime} (4시간)</span>
            </p>
            <p className="mt-0.5 text-xs text-zinc-600 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-emerald-600" />
              <span>{confirmedShift.addressDetail}</span>
            </p>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-emerald-200">
            <span className="text-xs text-zinc-600">
              약정 시급 <strong className="text-zinc-900">{confirmedShift.hourlyWage.toLocaleString()}원</strong>
            </span>
            <div className="flex gap-2">
              <Link
                href={`/matches/${confirmedShift.id}`}
                className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
              >
                매칭 상세
              </Link>
              <Link
                href={`/works/${confirmedShift.id}`}
                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all"
              >
                출근/근무 관리
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 3. [섹션 2] 받은 요청 (Incoming Direct Shift Invitations) */}
      {incomingRequest ? (
        <div className="rounded-2xl border-2 border-amber-400 bg-amber-50/80 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white">
              <Sparkles className="h-3 w-3 fill-white" />
              1:1 직접 대타 요청 도착
            </span>
            <span className="text-[11px] font-bold text-amber-800">응답 대기 중</span>
          </div>

          <div>
            <h3 className="text-base font-black text-zinc-900 leading-snug">
              {incomingRequest.storeBrand} {incomingRequest.branchName}
            </h3>
            <p className="mt-1 text-xs text-zinc-700 bg-white/90 p-2.5 rounded-xl border border-amber-200 italic leading-relaxed">
              &quot;{incomingRequest.message}&quot;
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-zinc-700 bg-white/60 p-2 rounded-xl">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              <span>{incomingRequest.time}</span>
            </div>
            <div className="flex items-center gap-1 justify-end font-bold text-amber-900">
              <DollarSign className="h-3.5 w-3.5 text-amber-600" />
              <span>시급 {incomingRequest.wage.toLocaleString()}원</span>
            </div>
          </div>

          {/* 수락 / 거절 액션 버튼 */}
          <div className="pt-1 flex gap-2">
            <button
              type="button"
              onClick={handleRejectRequest}
              className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-zinc-300 bg-white py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 active:scale-95 transition-all"
            >
              <X className="h-3.5 w-3.5 text-zinc-400" />
              정중히 거절
            </button>
            <button
              type="button"
              onClick={handleAcceptRequest}
              className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
            >
              <Check className="h-4 w-4 stroke-[3]" />
              근무 수락하기
            </button>
          </div>
          <p className="text-center text-[10px] text-zinc-500">
            * 직접 요청을 거절하더라도 근무자에게 어떠한 불이익(페널티)도 부과되지 않습니다.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white p-3 text-center text-xs text-zinc-400">
          현재 새로 도착한 1:1 대타 요청이 없습니다.
        </div>
      )}

      {/* 4. [섹션 3] 추천 공고 (내 등록 브랜드 및 지역 기반 맞춤) */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
            <span>내 맞춤 긴급 대타 추천</span>
            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
              {currentBrand}
            </span>
          </h3>
          <Link href="/jobs" className="text-xs font-semibold text-blue-600 flex items-center gap-0.5">
            전체 공고 보기
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="space-y-2.5">
          {recommendedJobs.map((job) => (
            <div
              key={job.id}
              className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs space-y-2.5 hover:border-blue-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                  {job.matchScore}
                </span>
                <span className="text-sm font-extrabold text-blue-600">
                  시급 {job.wage.toLocaleString()}원
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-zinc-900 leading-snug">{job.title}</h4>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-zinc-400" />
                    {job.date}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-zinc-400" />
                    {job.location}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-100 flex justify-end">
                <Link
                  href="/jobs"
                  className="rounded-xl bg-zinc-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-zinc-800"
                >
                  1초 지원하기
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
