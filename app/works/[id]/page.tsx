'use client';

import React, { useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { STATUS_META } from '@/lib/constants/status';
import {
  Play,
  CheckCircle,
  AlertTriangle,
  Clock,
  History,
  Store,
  User,
  ShieldCheck,
  FileCheck2,
  Calendar,
} from 'lucide-react';

function WorkManagementContent() {
  const params = useParams();
  const workId = (params?.id as string) || 'work-1';

  // 상태값: Matched -> In Progress -> Completed / Disputed
  const [currentStatus, setCurrentStatus] = useState<
    'Matched' | 'In Progress' | 'Completed' | 'Disputed'
  >('In Progress');

  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('근무 시간 불일치 (조기 퇴근/지각)');

  // 모의 근무 관리 데이터
  const workData = {
    id: workId,
    storeBrand: '메가커피',
    branchName: '강남역점',
    workerName: '이수진',
    ownerName: '김점주',
    startTimeStr: '18:00',
    endTimeStr: '22:00',
    hourlyWage: 13500,
    historyLogs: [
      {
        id: 1,
        fromStatus: 'Reviewing',
        toStatus: 'Matched',
        time: '17:15',
        desc: '점주가 지원자를 채용 확정하여 대타 계약이 체결되었습니다.',
      },
      {
        id: 2,
        fromStatus: 'Matched',
        toStatus: 'In Progress',
        time: '18:00',
        desc: '근무 시작 시각이 도래하여 근무가 시작되었습니다.',
      },
    ],
  };

  const statusInfo = STATUS_META[currentStatus];

  // 근무 완료 확인
  const handleCompleteWork = () => {
    const confirmed = confirm('대타 근무를 정상적으로 완료 처리하시겠습니까?');
    if (!confirmed) return;

    setCurrentStatus('Completed');
    alert('근무가 완료(`Completed`) 처리되었습니다!\n수고하셨습니다.');
  };

  // 이의 제기 / 분쟁 접수
  const handleDispute = () => {
    if (!disputeReason) return;
    setCurrentStatus('Disputed');
    setIsDisputeModalOpen(false);
    alert('이의 제기(`Disputed`)가 접수되었습니다.\n점주-근무자 간 확인 및 운영 조정을 진행합니다.');
  };

  return (
    <main className="flex-1 p-4 space-y-4">
      {/* 상태 현황 메인 카드 */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs space-y-3 text-center">
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-bold border ${statusInfo.badgeClass}`}
        >
          {statusInfo.label}
        </span>

        <h2 className="text-xl font-black text-zinc-900">
          {workData.storeBrand} {workData.branchName}
        </h2>
        <p className="text-xs text-zinc-500">{statusInfo.description}</p>

        {/* 근무 시간 및 시급 요약 */}
        <div className="rounded-xl bg-zinc-50 p-3 grid grid-cols-2 gap-2 text-xs text-zinc-700 border border-zinc-100">
          <div>
            <span className="text-zinc-400 block text-[10px]">약정 근무 시간</span>
            <span className="font-bold text-zinc-900">
              {workData.startTimeStr} ~ {workData.endTimeStr} (4시간)
            </span>
          </div>
          <div>
            <span className="text-zinc-400 block text-[10px]">시급</span>
            <span className="font-bold text-blue-600">
              {workData.hourlyWage.toLocaleString()}원
            </span>
          </div>
        </div>

        {/* 상태별 액션 제어 버튼 */}
        <div className="pt-2 space-y-2">
          {currentStatus === 'Matched' && (
            <button
              type="button"
              onClick={() => setCurrentStatus('In Progress')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
            >
              <Play className="h-4 w-4 fill-white" />
              근무 시작하기 (출근)
            </button>
          )}

          {currentStatus === 'In Progress' && (
            <button
              type="button"
              onClick={handleCompleteWork}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all"
            >
              <CheckCircle className="h-4 w-4 stroke-[2.5]" />
              근무 정상 완료 확인 (퇴근)
            </button>
          )}

          {currentStatus === 'Completed' && (
            <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 font-bold border border-emerald-200 flex items-center justify-center gap-1.5">
              <FileCheck2 className="h-4 w-4 text-emerald-600" />
              정상 완료된 근무입니다.
            </div>
          )}

          {currentStatus === 'Disputed' && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-800 font-bold border border-rose-200 flex items-center justify-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              이의 제기(분쟁) 접수 건입니다.
            </div>
          )}

          {/* 이의 제기 버튼 */}
          {currentStatus !== 'Completed' && currentStatus !== 'Disputed' && (
            <button
              type="button"
              onClick={() => setIsDisputeModalOpen(true)}
              className="flex w-full items-center justify-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 py-1.5"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              노쇼 / 결근 / 시간 불일치 신고 (이의 제기)
            </button>
          )}
        </div>
      </div>

      {/* 상태 변경 감사 로그 타임라인 (Audit History) */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
          <History className="h-4 w-4 text-zinc-500" />
          상태 변경 이력 로그 (서버 감사 기록)
        </h3>

        <div className="space-y-3 relative pl-4 border-l-2 border-zinc-200 ml-2">
          {workData.historyLogs.map((log) => (
            <div key={log.id} className="relative text-xs">
              <span className="absolute -left-[21px] top-0.5 flex h-2.5 w-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-900">{log.toStatus}</span>
                <span className="text-[10px] text-zinc-400">{log.time}</span>
              </div>
              <p className="mt-0.5 text-zinc-600 leading-relaxed text-[11px]">{log.desc}</p>
            </div>
          ))}

          {currentStatus === 'Completed' && (
            <div className="relative text-xs">
              <span className="absolute -left-[21px] top-0.5 flex h-2.5 w-2.5 rounded-full bg-emerald-600 ring-4 ring-white" />
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-700">Completed</span>
                <span className="text-[10px] text-zinc-400">방금</span>
              </div>
              <p className="mt-0.5 text-zinc-600 leading-relaxed text-[11px]">
                근무가 정상 완료 처리되었습니다.
              </p>
            </div>
          )}

          {currentStatus === 'Disputed' && (
            <div className="relative text-xs">
              <span className="absolute -left-[21px] top-0.5 flex h-2.5 w-2.5 rounded-full bg-rose-600 ring-4 ring-white" />
              <div className="flex items-center gap-2">
                <span className="font-bold text-rose-700">Disputed</span>
                <span className="text-[10px] text-zinc-400">방금</span>
              </div>
              <p className="mt-0.5 text-zinc-600 leading-relaxed text-[11px]">
                이의 제기(분쟁) 사유: &quot;{disputeReason}&quot;
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 이의 제기 팝업 모달 */}
      {isDisputeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl space-y-3">
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-1.5 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              이의 제기 / 분쟁 접수
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              근무 시간 불일치, 무단 결근, 지각 등 확인이 필요한 사유를 선택해주세요. 상태가 <code className="bg-zinc-100 px-1 py-0.5 rounded text-[11px] font-bold">Disputed</code>로 변경됩니다.
            </p>

            <div className="space-y-2 pt-1">
              {[
                '근무 시간 불일치 (조기 퇴근/지각)',
                '무단 결근 (노쇼)',
                '약정 업무 불이행 / 매장 내 갈등',
                '기타 확인 필요',
              ].map((reason) => (
                <label
                  key={reason}
                  className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer p-2 rounded-lg hover:bg-zinc-50 border border-zinc-200"
                >
                  <input
                    type="radio"
                    name="disputeReason"
                    checked={disputeReason === reason}
                    onChange={() => setDisputeReason(reason)}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDisputeModalOpen(false)}
                className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={handleDispute}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-700"
              >
                이의 접수
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function WorkManagementPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 pb-20">
      <Header title="실시간 근무 관리" showBack />
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
        }
      >
        <WorkManagementContent />
      </Suspense>
      <BottomNav role="worker" />
    </div>
  );
}
