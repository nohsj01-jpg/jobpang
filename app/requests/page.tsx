'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { createClient } from '@/lib/supabase/client';
import { isPrototypeSession } from '@/lib/prototype-session';
import { STATUS_META } from '@/lib/constants/status';
import { Clock, MapPin, DollarSign, Store, Check, X, ShieldAlert, Sparkles, MessageSquare } from 'lucide-react';

interface DirectRequestItem {
  id: string;
  storeName: string;
  branchName: string;
  brandName: string;
  workDate: string;
  startTime: string;
  endTime: string;
  hourlyWage: number;
  message: string;
  addressSummary: string;
  status: 'Pending' | 'Matched' | 'Cancelled' | 'Expired';
}

export default function RequestsManagePage() {
  const router = useRouter();
  const [loadingRequestId, setLoadingRequestId] = useState<string | null>(null);
  const [rejectingItem, setRejectingItem] = useState<DirectRequestItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('다른 개인 일정이 있습니다.');

  // 모의 직접 대타 요청 리스트
  const [requests, setRequests] = useState<DirectRequestItem[]>([
    {
      id: 'req-1',
      storeName: '메가커피',
      branchName: '역삼역점',
      brandName: '메가커피',
      workDate: '오늘 (11월 14일)',
      startTime: '19:00',
      endTime: '23:00',
      hourlyWage: 14000,
      addressSummary: '서울 강남구 역삼동',
      message: '마감 타임 직원 급한 사정으로 대타 요청드립니다! 제조 가능하시면 바로 수락 부탁드려요.',
      status: 'Pending',
    },
    {
      id: 'req-2',
      storeName: '메가커피',
      branchName: '선릉점',
      brandName: '메가커피',
      workDate: '내일 (11월 15일)',
      startTime: '12:00',
      endTime: '17:00',
      hourlyWage: 13000,
      addressSummary: '서울 강남구 대치동',
      message: '주말 피크타임 지원 대타 요청드립니다.',
      status: 'Pending',
    },
  ]);

  useEffect(() => {
    if (!isPrototypeSession()) return;

    const savedRequests = localStorage.getItem('jobpang_prototype_requests');
    if (!savedRequests) return;

    try {
      const prototypeRequests = JSON.parse(savedRequests) as DirectRequestItem[];
      const timeoutId = window.setTimeout(
        () => setRequests((current) => [...prototypeRequests, ...current]),
        0
      );
      return () => window.clearTimeout(timeoutId);
    } catch (error) {
      console.error('프로토타입 요청 데이터를 불러오지 못했습니다.', error);
    }
  }, []);

  // 대타 요청 수락 (매칭 최종 확정)
  const handleAccept = async (request: DirectRequestItem) => {
    const confirmed = confirm(
      `${request.storeName} ${request.branchName} 대타 근무를 수락하시겠습니까?\n수락 즉시 매칭이 확정되며 점주 연락처가 공개됩니다.`
    );
    if (!confirmed) return;

    setLoadingRequestId(request.id);

    try {
      if (isPrototypeSession()) {
        setRequests((current) =>
          current.map((item) =>
            item.id === request.id ? { ...item, status: 'Matched' } : item
          )
        );
        alert('프로토타입에서 대타 근무가 확정되었습니다.');
        router.push('/matches/demo-match-direct-1');
        return;
      }

      // 1. Supabase RPC 호출 (원자적 수락 & 시간 중복/만료 검증)
      const supabase = createClient();
      const { data: matchId, error } = await (supabase.rpc as any)('rpc_accept_direct_request', {
        p_request_id: request.id,
      });

      if (error && !error.message.includes('찾을 수 없습니다')) {
        throw error;
      }

      alert('대타 근무가 확정되었습니다! 매칭 상세 화면으로 이동합니다.');
      router.push(`/matches/${matchId || 'demo-match-direct-1'}`);
    } catch (err: any) {
      alert(err.message || '수락 처리 중 오류가 발생했습니다.');
    } finally {
      setLoadingRequestId(null);
    }
  };

  // 대타 요청 거절 (패널티 전혀 없음)
  const handleConfirmReject = async () => {
    if (!rejectingItem) return;

    setLoadingRequestId(rejectingItem.id);

    try {
      if (isPrototypeSession()) {
        setRequests((current) =>
          current.filter((request) => request.id !== rejectingItem.id)
        );
        setRejectingItem(null);
        alert('프로토타입 요청을 거절했습니다. 실제 데이터에는 반영되지 않습니다.');
        return;
      }

      const supabase = createClient();
      const { error } = await (supabase.rpc as any)('rpc_reject_direct_request', {
        p_request_id: rejectingItem.id,
        p_reason: rejectionReason,
      });

      // 리스트에서 제거 또는 상태 갱신
      setRequests((prev) => prev.filter((r) => r.id !== rejectingItem.id));
      setRejectingItem(null);
      alert('정중히 거절 처리되었습니다.\n직접 요청 거절은 평점에 어떠한 영향도 주지 않습니다.');
    } catch (err: any) {
      alert(err.message || '거절 처리 중 오류가 발생했습니다.');
    } finally {
      setLoadingRequestId(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 pb-20">
      <Header title="받은 1:1 대타 요청" role="worker" />

      <main className="flex-1 p-4 space-y-4">
        {/* 불이익 없음 안심 배너 */}
        <div className="rounded-2xl bg-blue-50 p-3.5 text-xs text-blue-900 border border-blue-200">
          <p className="font-bold flex items-center gap-1.5 text-blue-800">
            <Sparkles className="h-4 w-4 text-blue-600" />
            근무자 보호 안심 약속
          </p>
          <p className="mt-1 text-blue-700 leading-relaxed text-[11px]">
            점주의 1:1 직접 대타 제안은 근무자의 상황에 따라 자유롭게 수락 또는 거절할 수 있으며, <strong>거절하더라도 평점 감점이나 일감 노출 제한 등의 불이익이 일체 없습니다.</strong>
          </p>
        </div>

        {requests.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-zinc-400">
            <p className="text-sm font-semibold text-zinc-600">현재 대기 중인 요청이 없습니다.</p>
            <p className="text-xs mt-1">새로운 대타 요청이 도착하면 알림으로 알려드립니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-700 px-1">
              수락 대기 요청 <strong className="text-blue-600">{requests.length}</strong>건
            </h3>

            {requests.map((request) => (
              <div
                key={request.id}
                className="rounded-2xl border-2 border-amber-300 bg-white p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 font-bold text-xs">
                      <Store className="h-4 w-4" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">
                        {request.storeName} {request.branchName}
                      </h4>
                      <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {request.addressSummary}
                      </span>
                    </div>
                  </div>

                  <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                    수락 대기
                  </span>
                </div>

                {/* 점주 전달 메시지 */}
                <div className="rounded-xl bg-zinc-50 p-2.5 text-xs text-zinc-700 border border-zinc-100 flex items-start gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-zinc-400 mt-0.5 shrink-0" />
                  <p className="italic leading-relaxed">&quot;{request.message}&quot;</p>
                </div>

                {/* 조건 요약 */}
                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-600 bg-amber-50/40 p-2.5 rounded-xl">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                    <span>
                      {request.workDate} {request.startTime}~{request.endTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-1 font-bold text-zinc-900">
                    <span>시급</span>
                    <span className="text-sm font-extrabold text-blue-600">
                      {request.hourlyWage.toLocaleString()}원
                    </span>
                  </div>
                </div>

                {/* 수락 / 거절 버튼 */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={loadingRequestId === request.id}
                    onClick={() => setRejectingItem(request)}
                    className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-zinc-200 bg-white py-2.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 active:scale-95 transition-all"
                  >
                    <X className="h-3.5 w-3.5 text-zinc-400" />
                    정중히 거절
                  </button>

                  <button
                    type="button"
                    disabled={loadingRequestId === request.id}
                    onClick={() => handleAccept(request)}
                    className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all"
                  >
                    <Check className="h-4 w-4 stroke-[3]" />
                    {loadingRequestId === request.id ? '수락 처리 중...' : '근무 수락하기'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 정중히 거절 모달 (불이익 없음 재확인) */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl space-y-3">
            <h3 className="text-base font-bold text-zinc-900">대타 요청을 거절하시겠습니까?</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              거절하더라도 평점 등 어떠한 불이익도 없습니다. 점주님께 전달할 사유를 선택해주세요 (선택).
            </p>

            <div className="space-y-2 pt-1">
              {[
                '다른 개인 일정이 있습니다.',
                '거리가 너무 멉니다.',
                '제시된 시간대 근무가 어렵습니다.',
                '단순 사정으로 어렵습니다.',
              ].map((reason) => (
                <label
                  key={reason}
                  className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer p-2 rounded-lg hover:bg-zinc-50 border border-zinc-200"
                >
                  <input
                    type="radio"
                    name="rejectReason"
                    checked={rejectionReason === reason}
                    onChange={() => setRejectionReason(reason)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-xs font-bold text-white hover:bg-zinc-800"
              >
                거절 확정
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav role="worker" />
    </div>
  );
}
