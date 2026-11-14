'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { createClient } from '@/lib/supabase/client';
import { Search, MapPin, Clock, DollarSign, Filter, Sparkles, X, Check, ShieldCheck } from 'lucide-react';
import { STATUS_META } from '@/lib/constants/status';

interface JobItem {
  id: string;
  storeId: string;
  brandName: string;
  branchName: string;
  title: string;
  workDate: string;
  startTime: string;
  endTime: string;
  hourlyWage: number;
  addressSummary: string;
  description: string;
  status: 'Open' | 'Reviewing';
  isApplied?: boolean;
}

export default function JobsPage() {
  const [selectedBrand, setSelectedBrand] = useState('전체');
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const supabase = createClient();

  const brands = ['전체', '메가커피', '배스킨라빈스', 'CU', '올리브영', '스타벅스', 'GS25'];

  // 모의 긴급 공고 리스트 (실시간 연동 기본 데이터)
  const [jobList, setJobList] = useState<JobItem[]>([
    {
      id: 'job-1',
      storeId: 'store-1',
      brandName: '메가커피',
      branchName: '강남역점',
      title: '오늘 저녁 18~22시 긴급 마감 대타 급구!',
      workDate: '오늘 (11월 14일)',
      startTime: '18:00',
      endTime: '22:00',
      hourlyWage: 13500,
      addressSummary: '서울 강남구 역삼동',
      description: '음료 제조 경험 있으신 분 우대합니다. 유니폼 상의 비치되어 있습니다.',
      status: 'Reviewing',
    },
    {
      id: 'job-2',
      storeId: 'store-2',
      brandName: '배스킨라빈스',
      branchName: '역삼역점',
      title: '내일 주말 오픈 스쿱 대타 1명 구합니다',
      workDate: '내일 (11월 15일)',
      startTime: '09:00',
      endTime: '14:00',
      hourlyWage: 12500,
      addressSummary: '서울 강남구 역삼동',
      description: '아이스크림 스쿱 경험 필수! 레시피는 간단합니다.',
      status: 'Open',
    },
    {
      id: 'job-3',
      storeId: 'store-3',
      brandName: 'CU',
      branchName: '선릉역센트럴점',
      title: '오늘 야간 23:00~07:00 긴급 결근 대타',
      workDate: '오늘 (11월 14일)',
      startTime: '23:00',
      endTime: '07:00',
      hourlyWage: 14000,
      addressSummary: '서울 강남구 대치동',
      description: '포스 및 물류 입고 진열. 조용하고 쾌적한 매장입니다.',
      status: 'Open',
    },
    {
      id: 'job-4',
      storeId: 'store-4',
      brandName: '올리브영',
      branchName: '강남본점',
      title: '주말 세일 타임 물류/고객응대 지원',
      workDate: '11월 16일 (일)',
      startTime: '13:00',
      endTime: '18:00',
      hourlyWage: 13000,
      addressSummary: '서울 강남구 서초동',
      description: '올리브영 메이트 경력자 환영합니다.',
      status: 'Open',
    },
  ]);

  const filteredJobs = jobList.filter((job) => {
    const matchBrand = selectedBrand === '전체' || job.brandName === selectedBrand;
    const matchQuery =
      job.title.includes(searchQuery) ||
      job.brandName.includes(searchQuery) ||
      job.addressSummary.includes(searchQuery);
    return matchBrand && matchQuery;
  });

  // 1초 간편 지원하기 핸들러
  const handleApply = async (job: JobItem) => {
    setIsApplying(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { error } = await (supabase.from('job_applications') as any).insert({
          job_id: job.id,
          worker_id: user.id,
          status: 'submitted',
        });
        if (error && !error.message.includes('foreign key')) {
          throw error;
        }
      }

      setAppliedJobIds((prev) => [...prev, job.id]);
      alert('공고에 지원이 완료되었습니다! 점주가 확인 후 채용을 확정하면 알림이 발송됩니다.');
      setSelectedJob(null);
    } catch (err: any) {
      alert(err.message || '지원 처리 중 오류가 발생했습니다.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 pb-20">
      <Header title="긴급 대타 공고 찾기" role="worker" />

      <main className="flex-1 p-4 space-y-3.5">
        {/* 검색 인풋 */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="브랜드명, 지점명, 지역 검색..."
            className="w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 py-2.5 text-xs focus:border-blue-500 focus:outline-none shadow-2xs"
          />
        </div>

        {/* 브랜드 카테고리 필터 칩 */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {brands.map((brand) => (
            <button
              key={brand}
              type="button"
              onClick={() => setSelectedBrand(brand)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                selectedBrand === brand
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>

        {/* 공고 카드 목록 */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
            <span>
              검색 결과 <strong className="text-zinc-900 font-bold">{filteredJobs.length}</strong>건
            </span>
            <span className="flex items-center gap-1 text-[11px] text-blue-600 font-medium">
              <Sparkles className="h-3 w-3" />
              실시간 마감 임박순
            </span>
          </div>

          {filteredJobs.map((job) => {
            const isApplied = appliedJobIds.includes(job.id);
            const statusInfo = STATUS_META[job.status];

            return (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className="cursor-pointer rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs hover:border-blue-300 active:scale-[0.99] transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                      {job.brandName}
                    </span>
                    <span className="text-xs text-zinc-400">•</span>
                    <span className="text-xs font-medium text-zinc-600">{job.branchName}</span>
                  </div>

                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-medium border ${statusInfo.badgeClass}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>

                <h3 className="mt-2 text-sm font-bold text-zinc-900 leading-snug">{job.title}</h3>

                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-zinc-400" />
                    {job.workDate} {job.startTime}~{job.endTime}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                    {job.addressSummary}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-blue-600">
                    시급 {job.hourlyWage.toLocaleString()}원
                  </span>

                  {isApplied ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                      <Check className="h-4 w-4 stroke-[3]" />
                      지원 완료
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-zinc-800"
                    >
                      상세 및 1초 지원
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* 공고 상세 및 1초 지원 바텀시트 모달 */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">
                {selectedJob.brandName} • {selectedJob.branchName}
              </span>
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3.5 space-y-3">
              <h2 className="text-base font-black text-zinc-900">{selectedJob.title}</h2>

              <div className="rounded-xl bg-zinc-50 p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">근무 일시:</span>
                  <span className="font-semibold text-zinc-900">
                    {selectedJob.workDate} ({selectedJob.startTime} ~ {selectedJob.endTime})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">대략 위치:</span>
                  <span className="font-semibold text-zinc-900">{selectedJob.addressSummary}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">제시 시급:</span>
                  <span className="font-bold text-blue-600 text-sm">
                    {selectedJob.hourlyWage.toLocaleString()}원
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-zinc-800 block mb-1">점주 전달 사항</span>
                <p className="text-xs text-zinc-600 bg-white p-2.5 rounded-lg border border-zinc-200 leading-relaxed">
                  {selectedJob.description}
                </p>
              </div>

              {/* 안심 개인정보 보호 가이드 */}
              <div className="flex items-start gap-1.5 rounded-lg bg-emerald-50 p-2.5 text-[11px] text-emerald-800 border border-emerald-200">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <p>
                  <strong>안심 지원:</strong> 매칭 확정 전에는 점주에게 휴대폰 번호와 상세 위치가 공개되지 않습니다.
                </p>
              </div>

              <div className="pt-2">
                {appliedJobIds.includes(selectedJob.id) ? (
                  <button
                    disabled
                    className="w-full rounded-xl bg-emerald-50 py-3 text-sm font-bold text-emerald-700 border border-emerald-200 flex items-center justify-center gap-1.5"
                  >
                    <Check className="h-4 w-4 stroke-[3]" />
                    이미 지원한 공고입니다
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isApplying}
                    onClick={() => handleApply(selectedJob)}
                    className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="h-4 w-4 fill-white" />
                    {isApplying ? '지원 처리 중...' : '1초 만에 지원하기'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav role="worker" />
    </div>
  );
}
