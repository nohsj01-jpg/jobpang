'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { VERIFICATION_LABELS } from '@/lib/constants/status';
import { User, BadgeCheck, Shield, MapPin, Calendar, Clock, Send, Award, CheckCircle2 } from 'lucide-react';

function WorkerProfileContent() {
  const params = useParams();
  const workerId = (params?.id as string) || 'worker-1';

  // 모의 근무자 상세 프로필 데이터
  const worker = {
    id: workerId,
    name: '이수진',
    maskedPhone: '010-****-4589',
    preferredArea: '서울 강남구 역삼동',
    totalWorkCount: 12,
    rating: 4.9,
    experiences: [
      {
        id: 'exp-1',
        brandName: '메가커피',
        branchName: '역삼역점',
        months: 14,
        verificationType: 'store_confirmed' as const, // 매장 확인 경력
        period: '2025.01 ~ 2026.03',
        description: '포스 계산, 전 음료 제조(스무디/프라페 포함), 오픈 및 미들 담당',
      },
      {
        id: 'exp-2',
        brandName: '컴포즈커피',
        branchName: '강남본점',
        months: 6,
        verificationType: 'self_declared' as const, // 자가 등록 경력
        period: '2024.06 ~ 2024.12',
        description: '와플 굽기 및 음료 서빙, 마감 청소',
      },
    ],
  };

  return (
    <main className="flex-1 p-4 space-y-4">
      {/* 프로필 요약 카드 */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs text-center space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-black text-xl shadow-inner">
          {worker.name.slice(0, 1)}
        </div>

        <div>
          <h2 className="text-lg font-black text-zinc-900 flex items-center justify-center gap-1.5">
            {worker.name}
            <span className="text-xs text-zinc-400 font-mono">({worker.maskedPhone})</span>
          </h2>
          <p className="text-xs text-zinc-500 flex items-center justify-center gap-1 mt-1">
            <MapPin className="h-3.5 w-3.5 text-zinc-400" />
            희망 지역: {worker.preferredArea}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 text-xs">
          <div className="rounded-xl bg-zinc-50 p-2 text-center">
            <span className="text-zinc-400 block text-[10px]">잡팡 대타 완료</span>
            <span className="font-extrabold text-zinc-900 text-sm">{worker.totalWorkCount}회</span>
          </div>
          <div className="rounded-xl bg-zinc-50 p-2 text-center">
            <span className="text-zinc-400 block text-[10px]">브랜드 총 경력</span>
            <span className="font-extrabold text-blue-600 text-sm">20개월</span>
          </div>
        </div>
      </div>

      {/* 안심 개인정보 보호 가이드 */}
      <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs text-blue-800 border border-blue-200">
        <Shield className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
        <p>
          <strong>개인정보 보호 원칙:</strong> 매칭 확정 전에는 근무자의 연락처와 상세 위치가 비공개됩니다. 1:1 대타 요청을 보내고 근무자가 수락하면 실제 연락처가 상호 공개됩니다.
        </p>
      </div>

      {/* 브랜드 경력 타임라인 */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-800 px-1">브랜드 근무 이력</h3>

        {worker.experiences.map((exp) => {
          const isConfirmed = exp.verificationType === 'store_confirmed';

          return (
            <div
              key={exp.id}
              className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs space-y-2 hover:border-zinc-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-zinc-900">{exp.brandName}</span>
                    <span className="text-xs text-zinc-400">• {exp.branchName}</span>
                  </div>
                  <span className="text-[11px] text-zinc-400">{exp.period} ({exp.months}개월)</span>
                </div>

                {/* 경력 구분 표기 원칙 준수 */}
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold border ${
                    isConfirmed
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                  }`}
                >
                  {isConfirmed && <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />}
                  {VERIFICATION_LABELS[exp.verificationType]}
                </span>
              </div>

              <p className="text-xs text-zinc-600 bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 leading-relaxed">
                {exp.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* 하단 고정 요청 CTA */}
      <div className="pt-2">
        <Link
          href={`/workers/${worker.id}/request`}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 text-sm font-bold text-white shadow-md shadow-amber-200 hover:bg-amber-600 active:scale-[0.99] transition-all"
        >
          <Send className="h-4 w-4" />
          이 근무자에게 1:1 대타 요청서 작성하기
        </Link>
      </div>
    </main>
  );
}

export default function WorkerProfilePage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 pb-20">
      <Header title="근무자 프로필 상세" showBack role="owner" />
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          </div>
        }
      >
        <WorkerProfileContent />
      </Suspense>
      <BottomNav role="owner" />
    </div>
  );
}
