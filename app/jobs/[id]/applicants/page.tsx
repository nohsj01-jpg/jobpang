'use client';

import React, { useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { createClient } from '@/lib/supabase/client';
import { VERIFICATION_LABELS } from '@/lib/constants/status';
import { User, Check, Shield, Clock, BadgeCheck, AlertCircle, ArrowRight } from 'lucide-react';

interface Applicant {
  id: string;
  workerId: string;
  name: string;
  maskedPhone: string;
  brandName: string;
  monthsOfExp: number;
  verificationType: 'self_declared' | 'store_confirmed';
  appliedAt: string;
  status: 'submitted' | 'accepted' | 'rejected';
}

function ApplicantsContent() {
  const params = useParams();
  const router = useRouter();
  const jobId = (params?.id as string) || 'job-1';

  const [loadingApplicantId, setLoadingApplicantId] = useState<string | null>(null);
  const supabase = createClient();

  // 모의 지원자 데이터 (공고 지원 리스트)
  const [applicants, setApplicants] = useState<Applicant[]>([
    {
      id: 'app-1',
      workerId: 'worker-1',
      name: '이수진',
      maskedPhone: '010-****-4589',
      brandName: '메가커피',
      monthsOfExp: 14,
      verificationType: 'store_confirmed', // 매장 확인 경력
      appliedAt: '10분 전',
      status: 'submitted',
    },
    {
      id: 'app-2',
      workerId: 'worker-2',
      name: '김태호',
      maskedPhone: '010-****-9123',
      brandName: '메가커피',
      monthsOfExp: 6,
      verificationType: 'self_declared', // 자가 등록 경력
      appliedAt: '25분 전',
      status: 'submitted',
    },
  ]);

  // 채용 확정(매칭 체결) 핸들러
  const handleAccept = async (applicant: Applicant) => {
    const confirmed = confirm(
      `${applicant.name} 근무자를 최종 채용 확정하시겠습니까?\n채용 확정 시 대타 계약이 체결되며 상호 연락처가 공개됩니다.`
    );
    if (!confirmed) return;

    setLoadingApplicantId(applicant.id);

    try {
      // 1. Supabase RPC 호출 시도 (원자적 채용 확정 및 이중확정/시간중복 검증)
      const { data: matchId, error } = await (supabase.rpc as any)('rpc_accept_job_application', {
        p_job_id: jobId,
        p_worker_id: applicant.workerId,
      });

      if (error && !error.message.includes('찾을 수 없습니다')) {
        throw error;
      }

      alert(`${applicant.name} 근무자와 매칭이 최종 확정되었습니다!`);
      // 매칭 상세 페이지로 이동
      router.push(`/matches/${matchId || 'demo-match-1'}`);
    } catch (err: any) {
      alert(err.message || '채용 확정 처리 중 오류가 발생했습니다.');
    } finally {
      setLoadingApplicantId(null);
    }
  };

  return (
    <main className="flex-1 p-4 space-y-4">
      {/* 공고 요약 바 */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
          <span>메가커피 강남역점</span>
          <span className="font-bold text-amber-600">지원자 {applicants.length}명</span>
        </div>
        <h2 className="text-sm font-bold text-zinc-900">
          오늘 저녁 18:00~22:00 긴급 마감 대타 급구!
        </h2>
        <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
          <Clock className="h-3.5 w-3.5 text-zinc-400" />
          <span>오늘 18:00 ~ 22:00 (4시간) • 시급 13,500원</span>
        </div>
      </div>

      {/* 개인정보 보호 안내 */}
      <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs text-blue-800 border border-blue-200">
        <Shield className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
        <p>
          <strong>개인정보 보호 원칙:</strong> 채용 확정 전에는 지원자의 연락처가 마스킹 처리되며, 점주님이 <strong>채용 확정</strong>을 누르는 즉시 실제 전화번호와 상세 정보가 상호 열람됩니다.
        </p>
      </div>

      {/* 지원자 목록 */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-700 px-1">지원자 비교</h3>

        {applicants.map((applicant) => {
          const isConfirmed = applicant.verificationType === 'store_confirmed';

          return (
            <div
              key={applicant.id}
              className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs space-y-3 hover:border-zinc-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 font-bold">
                    {applicant.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-zinc-900">{applicant.name}</span>
                      <span className="text-xs text-zinc-400 font-mono">
                        ({applicant.maskedPhone})
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-400">{applicant.appliedAt} 지원</span>
                  </div>
                </div>

                {/* 경력 배지 - 공식 인증 경력 명칭 금지 원칙 준수 */}
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold border ${
                    isConfirmed
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                  }`}
                >
                  {isConfirmed && <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />}
                  {VERIFICATION_LABELS[applicant.verificationType]}
                </span>
              </div>

              {/* 경력 세부 요약 */}
              <div className="rounded-xl bg-zinc-50 p-2.5 text-xs flex justify-between items-center">
                <span className="text-zinc-600">
                  <strong>{applicant.brandName}</strong> 실무 경력
                </span>
                <span className="font-extrabold text-blue-600">{applicant.monthsOfExp}개월</span>
              </div>

              {/* 채용 확정 버튼 */}
              <div className="pt-1">
                <button
                  type="button"
                  disabled={loadingApplicantId === applicant.id}
                  onClick={() => handleAccept(applicant)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-zinc-900 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-50 transition-all"
                >
                  <Check className="h-4 w-4 stroke-[3]" />
                  {loadingApplicantId === applicant.id
                    ? '채용 확정 처리 중...'
                    : '이 근무자 채용 확정하기'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

export default function JobApplicantsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 pb-20">
      <Header title="지원자 목록 심사" showBack role="owner" />
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          </div>
        }
      >
        <ApplicantsContent />
      </Suspense>
      <BottomNav role="owner" />
    </div>
  );
}
