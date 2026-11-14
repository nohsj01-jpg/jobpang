'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { VERIFICATION_LABELS } from '@/lib/constants/status';
import { Search, BadgeCheck, Users, ArrowRight, Send, Filter, MapPin, Sparkles } from 'lucide-react';

interface WorkerProfile {
  id: string;
  name: string;
  maskedPhone: string;
  preferredArea: string;
  brandName: string;
  monthsOfExp: number;
  verificationType: 'self_declared' | 'store_confirmed';
  recentWorkCount: number;
  isAvailableToday: boolean;
}

export default function WorkersExplorePage() {
  const [selectedBrand, setSelectedBrand] = useState('전체');
  const [onlyStoreConfirmed, setOnlyStoreConfirmed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const brands = ['전체', '메가커피', '배스킨라빈스', 'CU', '올리브영', '스타벅스', 'GS25'];

  // 모의 근무자 풀 데이터
  const [workers, setWorkers] = useState<WorkerProfile[]>([
    {
      id: 'worker-1',
      name: '이수진',
      maskedPhone: '010-****-4589',
      preferredArea: '서울 강남구 역삼동',
      brandName: '메가커피',
      monthsOfExp: 14,
      verificationType: 'store_confirmed', // 매장 확인 경력
      recentWorkCount: 12,
      isAvailableToday: true,
    },
    {
      id: 'worker-2',
      name: '박알바',
      maskedPhone: '010-****-1234',
      preferredArea: '서울 강남구 대치동',
      brandName: '메가커피',
      monthsOfExp: 8,
      verificationType: 'self_declared', // 자가 등록 경력
      recentWorkCount: 4,
      isAvailableToday: true,
    },
    {
      id: 'worker-3',
      name: '김태호',
      maskedPhone: '010-****-9123',
      preferredArea: '서울 서초구 서초동',
      brandName: '배스킨라빈스',
      monthsOfExp: 10,
      verificationType: 'store_confirmed',
      recentWorkCount: 9,
      isAvailableToday: false,
    },
    {
      id: 'worker-4',
      name: '최민지',
      maskedPhone: '010-****-7890',
      preferredArea: '서울 강남구 삼성동',
      brandName: 'CU',
      monthsOfExp: 18,
      verificationType: 'store_confirmed',
      recentWorkCount: 15,
      isAvailableToday: true,
    },
    {
      id: 'worker-5',
      name: '정현우',
      maskedPhone: '010-****-3321',
      preferredArea: '서울 송파구 잠실동',
      brandName: '올리브영',
      monthsOfExp: 6,
      verificationType: 'self_declared',
      recentWorkCount: 2,
      isAvailableToday: true,
    },
  ]);

  const filteredWorkers = workers.filter((worker) => {
    const matchBrand = selectedBrand === '전체' || worker.brandName === selectedBrand;
    const matchConfirmed = !onlyStoreConfirmed || worker.verificationType === 'store_confirmed';
    const matchQuery =
      worker.name.includes(searchQuery) ||
      worker.brandName.includes(searchQuery) ||
      worker.preferredArea.includes(searchQuery);

    return matchBrand && matchConfirmed && matchQuery;
  });

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 pb-20">
      <Header title="경력 근무자 탐색" showBack role="owner" />

      <main className="flex-1 p-4 space-y-3.5">
        {/* 안내 카드 */}
        <div className="rounded-2xl bg-amber-500 p-4 text-white shadow-xs">
          <h2 className="text-sm font-bold flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" />
            공고 올리기 전, 원하는 근무자에게 직접 요청해보세요!
          </h2>
          <p className="mt-1 text-xs text-amber-100 leading-relaxed">
            같은 브랜드 경험이 검증된 근무자에게 1:1로 요청서를 보내면 훨씬 빠르게 대타를 확정할 수 있습니다.
          </p>
        </div>

        {/* 검색창 */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="브랜드명, 희망 지역, 근무자 검색..."
            className="w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 py-2.5 text-xs focus:border-amber-500 focus:outline-none shadow-2xs"
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
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>

        {/* 매장 확인 경력 필터 토글 */}
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => setOnlyStoreConfirmed(!onlyStoreConfirmed)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all ${
              onlyStoreConfirmed
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-zinc-500 border-zinc-200'
            }`}
          >
            <BadgeCheck className="h-3.5 w-3.5" />
            매장 확인 경력자만 보기
          </button>
          <span className="text-xs text-zinc-400 font-medium">{filteredWorkers.length}명 검색됨</span>
        </div>

        {/* 근무자 카드 리스트 */}
        <div className="space-y-3">
          {filteredWorkers.map((worker) => {
            const isConfirmed = worker.verificationType === 'store_confirmed';

            return (
              <div
                key={worker.id}
                className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs space-y-3 hover:border-amber-300 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 text-zinc-800 font-bold text-sm">
                      {worker.name.slice(0, 1)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-zinc-900">{worker.name}</span>
                        <span className="text-xs text-zinc-400 font-mono">
                          ({worker.maskedPhone})
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-zinc-400" />
                        {worker.preferredArea}
                      </span>
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
                    {VERIFICATION_LABELS[worker.verificationType]}
                  </span>
                </div>

                {/* 경력 세부 요약 */}
                <div className="rounded-xl bg-zinc-50 p-2.5 text-xs flex justify-between items-center">
                  <span className="text-zinc-700">
                    <strong>{worker.brandName}</strong> 실무 경력
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-500">완료 {worker.recentWorkCount}회</span>
                    <span className="font-extrabold text-blue-600">{worker.monthsOfExp}개월</span>
                  </div>
                </div>

                {/* 퀵 액션 */}
                <div className="flex gap-2 pt-1">
                  <Link
                    href={`/workers/${worker.id}`}
                    className="flex-1 rounded-xl border border-zinc-200 bg-white py-2 text-center text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                  >
                    프로필 상세
                  </Link>
                  <Link
                    href={`/workers/${worker.id}/request`}
                    className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-amber-500 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-600 active:scale-95 transition-all"
                  >
                    <Send className="h-3.5 w-3.5" />
                    대타 요청서 보내기
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <BottomNav role="owner" />
    </div>
  );
}
