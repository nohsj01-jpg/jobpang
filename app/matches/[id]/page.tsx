'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { STATUS_META, VERIFICATION_LABELS } from '@/lib/constants/status';
import {
  CheckCircle2,
  Phone,
  MessageCircle,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Store,
  User,
  X,
} from 'lucide-react';

function MatchDetailContent() {
  const params = useParams();
  const router = useRouter();
  const matchId = (params?.id as string) || 'match-1';

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('매장 사정으로 인한 취소');
  const [currentStatus, setCurrentStatus] = useState<'Matched' | 'In Progress' | 'Cancelled'>(
    'Matched'
  );

  // 모의 매칭 확정 계약 상세 데이터
  const matchData = {
    id: matchId,
    status: currentStatus,
    matchType: 'job_application',
    store: {
      brandName: '메가커피',
      branchName: '강남역점',
      addressSummary: '서울 강남구 역삼동',
      addressDetail: '테헤란로 123 메가빌딩 1층 (강남역 1번 출구 도보 2분)',
      contactPhone: '02-555-1234',
      ownerName: '김점주',
      ownerPhone: '010-9876-5432',
    },
    worker: {
      name: '이수진',
      phone: '010-4589-1234', // 매칭 확정에 따라 비공개 해제된 실제 전화번호
      brandName: '메가커피',
      monthsOfExp: 14,
      verificationType: 'store_confirmed' as const,
    },
    schedule: {
      workDate: '오늘 (11월 14일)',
      startTime: '18:00',
      endTime: '22:00',
      totalHours: 4,
      hourlyWage: 13500,
      totalWage: 54000,
    },
  };

  const statusInfo = STATUS_META[matchData.status];

  const handleCancelMatch = () => {
    const confirmed = confirm('정말 매칭을 취소하시겠습니까?\n취소 시 상태가 변경되며 상대방에게 알림이 전송됩니다.');
    if (!confirmed) return;

    setCurrentStatus('Cancelled');
    setIsCancelModalOpen(false);
    alert('매칭이 취소되었습니다.');
  };

  return (
    <main className="flex-1 p-4 space-y-4">
      {/* 매칭 체결 완료 헤더 배너 */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white shadow-sm space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/30 backdrop-blur border border-emerald-400/40">
          <CheckCircle2 className="h-7 w-7 text-white stroke-[2.5]" />
        </div>
        <span className="inline-block rounded-full bg-emerald-400/30 px-3 py-0.5 text-xs font-bold text-emerald-100 border border-emerald-300/30">
          {statusInfo.label}
        </span>
        <h2 className="text-lg font-black leading-tight">대타 근무 매칭이 확정되었습니다!</h2>
        <p className="text-xs text-emerald-100">
          상호 연락처 및 매장 상세 주소가 성공적으로 해제되었습니다.
        </p>
      </div>

      {/* [핵심] 상호 연락처 및 즉시 통화 액션 카드 */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
          <h3 className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            매칭 확정 연락처 (상호 공개)
          </h3>
          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
            연락처 잠금 해제됨
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* 점주 정보 */}
          <div className="rounded-xl bg-zinc-50 p-3 space-y-2">
            <span className="text-[11px] font-bold text-zinc-500 flex items-center gap-1">
              <Store className="h-3.5 w-3.5 text-amber-600" />
              점주 연락처
            </span>
            <p className="text-sm font-black text-zinc-900">{matchData.store.ownerName}</p>
            <p className="text-xs font-mono text-zinc-600">{matchData.store.ownerPhone}</p>
            <a
              href={`tel:${matchData.store.ownerPhone}`}
              className="flex items-center justify-center gap-1 w-full rounded-lg bg-white border border-zinc-200 py-1.5 text-xs font-bold text-zinc-800 hover:bg-zinc-100 shadow-2xs"
            >
              <Phone className="h-3 w-3 text-amber-600" />
              전화 걸기
            </a>
          </div>

          {/* 근무자 정보 */}
          <div className="rounded-xl bg-zinc-50 p-3 space-y-2">
            <span className="text-[11px] font-bold text-zinc-500 flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-blue-600" />
              근무자 연락처
            </span>
            <p className="text-sm font-black text-zinc-900">{matchData.worker.name}</p>
            <p className="text-xs font-mono text-zinc-600">{matchData.worker.phone}</p>
            <a
              href={`tel:${matchData.worker.phone}`}
              className="flex items-center justify-center gap-1 w-full rounded-lg bg-white border border-zinc-200 py-1.5 text-xs font-bold text-zinc-800 hover:bg-zinc-100 shadow-2xs"
            >
              <Phone className="h-3 w-3 text-blue-600" />
              전화 걸기
            </a>
          </div>
        </div>
      </div>

      {/* 매장 위치 상세 (매칭 전 비공개였다가 공개됨) */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs space-y-2">
        <h3 className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-rose-500" />
          매장 상세 위치
        </h3>
        <p className="text-sm font-bold text-zinc-900">
          {matchData.store.brandName} {matchData.store.branchName}
        </p>
        <p className="text-xs text-zinc-600 bg-zinc-50 p-3 rounded-xl border border-zinc-200 leading-relaxed">
          {matchData.store.addressDetail}
        </p>
        <p className="text-[11px] text-zinc-400">매장 대표 전화: {matchData.store.contactPhone}</p>
      </div>

      {/* 대타 근무 조건 요약 */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-zinc-800">확정된 근무 조건</h3>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-zinc-100">
            <span className="text-zinc-500">근무 일시</span>
            <span className="font-bold text-zinc-900">
              {matchData.schedule.workDate} {matchData.schedule.startTime} ~ {matchData.schedule.endTime} ({matchData.schedule.totalHours}시간)
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-zinc-100">
            <span className="text-zinc-500">약정 시급</span>
            <span className="font-bold text-zinc-900">
              {matchData.schedule.hourlyWage.toLocaleString()}원
            </span>
          </div>

          <div className="flex justify-between py-1">
            <span className="text-zinc-500">예상 총 급여</span>
            <span className="font-black text-blue-600 text-sm">
              {matchData.schedule.totalWage.toLocaleString()}원
            </span>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="space-y-2 pt-1">
        <Link
          href={`/works/${matchData.id}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-700 active:scale-[0.99] transition-all"
        >
          실시간 근무 관리 및 출퇴근 확인
          <ArrowRight className="h-4 w-4" />
        </Link>

        {currentStatus === 'Matched' && (
          <button
            type="button"
            onClick={() => setIsCancelModalOpen(true)}
            className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-50 active:scale-[0.99] transition-all"
          >
            매칭 취소 신청
          </button>
        )}
      </div>

      {/* 매칭 취소 팝업 */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl space-y-3">
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-1.5 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              매칭을 취소하시겠습니까?
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              확정된 매칭을 취소하면 전용 상태 이력 테이블에 취소 사유가 영구 기록됩니다.
            </p>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">취소 사유</label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:border-rose-500 focus:outline-none resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={handleCancelMatch}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-700"
              >
                취소 확정
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function MatchDetailPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 pb-20">
      <Header title="매칭 상세 확인서" showBack />
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          </div>
        }
      >
        <MatchDetailContent />
      </Suspense>
      <BottomNav role="worker" />
    </div>
  );
}
