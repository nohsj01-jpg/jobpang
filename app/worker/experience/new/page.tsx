'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { createClient } from '@/lib/supabase/client';
import { VERIFICATION_LABELS } from '@/lib/constants/status';
import {
  Briefcase,
  Store,
  Calendar,
  CheckSquare,
  BadgeCheck,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function NewExperiencePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const cafeBrands = [
    { id: 'b0000000-0000-0000-0000-000000000001', name: '메가MGC커피' },
    { id: 'b0000000-0000-0000-0000-000000000002', name: '컴포즈커피' },
    { id: 'b0000000-0000-0000-0000-000000000003', name: '빽다방' },
    { id: 'b0000000-0000-0000-0000-000000000004', name: '스타벅스' },
    { id: 'b0000000-0000-0000-0000-000000000005', name: '이디야커피' },
    { id: 'b0000000-0000-0000-0000-000000000006', name: '투썸플레이스' },
    { id: 'b0000000-0000-0000-0000-000000000007', name: '배스킨라빈스' },
  ];

  // 1) 브랜드, 지점, 근무 기간
  const [brandId, setBrandId] = useState(cafeBrands[0].id);
  const [branchName, setBranchName] = useState('강남역점');
  const [startDate, setStartDate] = useState('2025-01');
  const [endDate, setEndDate] = useState('2026-02');
  const [monthsOfExp, setMonthsOfExp] = useState(14);

  // 2) 담당 업무
  const roleOptions = ['포스 계산', '음료 제조', '매장 청소/마감', '재고 입고/정리', '고객 응대'];
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['포스 계산', '음료 제조']);

  // 3) 수행 가능 세부 업무 (체크리스트)
  const skillOptions = [
    '에스프레소 머신 조작/샷 추출',
    '스팀 밀크 및 라떼 제조',
    '프라페/스무디/블렌더 음료 제조',
    '포스 마감 정산 및 시재 점검',
    '와플/디저트/베이커리 조리',
    '배달의민족/요기요/쿠팡이츠 접수 처리',
  ];
  const [selectedSkills, setSelectedSkills] = useState<string[]>(skillOptions.slice(0, 4));

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const selectedBrand = cafeBrands.find((b) => b.id === brandId);

      // 로컬 스토리지에 새 경력 추가 (데모 모드 및 즉시 뷰 반영)
      if (typeof window !== 'undefined') {
        const storedExps = localStorage.getItem('jobpang_worker_experiences');
        const expsList = storedExps ? JSON.parse(storedExps) : [];
        const newExp = {
          id: `exp-${Date.now()}`,
          brandId,
          brandName: selectedBrand?.name || '메가MGC커피',
          branchName,
          monthsOfExp,
          startDate,
          endDate,
          roles: selectedRoles,
          skills: selectedSkills,
          verificationType: 'self_declared', // 최초 자가 등록 경력
        };
        expsList.unshift(newExp);
        localStorage.setItem('jobpang_worker_experiences', JSON.stringify(expsList));
        localStorage.setItem('jobpang_worker_main_brand', selectedBrand?.name || '메가MGC커피');
        localStorage.setItem('jobpang_worker_main_exp', String(monthsOfExp));
      }

      // Supabase 세션이 있을 경우 DB insert
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await (supabase.from('work_experiences') as any).insert({
          worker_id: user.id,
          brand_id: brandId,
          branch_name: branchName,
          months_of_exp: Number(monthsOfExp),
          start_date: startDate,
          end_date: endDate,
          roles: selectedRoles,
          skills: selectedSkills,
          verification_type: 'self_declared',
        });
      }

      alert('새로운 브랜드 경력이 등록되었습니다!\n(기본 "자가 등록 경력"으로 표기되며, 근무 완료 시 "매장 확인 경력"으로 승격됩니다.)');
      router.push('/home');
    } catch (err: any) {
      setErrorMessage(err.message || '경력 등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 pb-24">
      <Header title="브랜드 경력 등록" showBack role="worker" />

      <main className="flex-1 p-4 space-y-4">
        {errorMessage && (
          <div className="rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-200">
            {errorMessage}
          </div>
        )}

        {/* 상단 원칙 안내 배너 */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-4 text-white shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-blue-100">
              <Briefcase className="h-4 w-4" />
              근무 이력 등록
            </span>
            {/* 경력 확인 상태 배지 */}
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-white border border-white/30 backdrop-blur">
              <BadgeCheck className="h-3.5 w-3.5" />
              {VERIFICATION_LABELS.self_declared}
            </span>
          </div>
          <h2 className="text-base font-bold">같은 브랜드 경험을 상세하게 작성해주세요</h2>
          <p className="text-xs text-blue-100 leading-relaxed">
            점주는 브랜드 경험과 수행 가능 업무를 확인하고 1:1 대타 요청을 우선 발송합니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1) 브랜드 및 지점 */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
              <Store className="h-4 w-4 text-blue-600" />
              브랜드 및 근무 지점
            </h3>

            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                프랜차이즈 브랜드
              </label>
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-zinc-900 focus:border-blue-500 focus:outline-none"
              >
                {cafeBrands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                근무 지점명
              </label>
              <input
                type="text"
                required
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="예: 강남역 1호점, 역삼점"
                className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* 근무 기간 */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-zinc-600 mb-1">시작 년월</label>
                <input
                  type="month"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-zinc-600 mb-1">종료 년월</label>
                <input
                  type="month"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                총 근무 개월 수
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="120"
                  required
                  value={monthsOfExp}
                  onChange={(e) => setMonthsOfExp(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm font-bold text-zinc-900 focus:border-blue-500 focus:outline-none"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-zinc-400 font-medium">개월</span>
              </div>
            </div>
          </div>

          {/* 2) 담당 업무 태그 선택 */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs space-y-2.5">
            <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-blue-600" />
              담당했던 업무 (복수 선택)
            </h3>
            <div className="flex flex-wrap gap-2 pt-1">
              {roleOptions.map((role) => {
                const isSelected = selectedRoles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3) 즉시 투입 가능한 수행 가능 업무 (체크리스트) */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
              <CheckSquare className="h-4 w-4 text-blue-600" />
              즉시 수행 가능한 업무 능력
            </h3>
            <p className="text-[11px] text-zinc-500 leading-tight">
              대타 당일 별도 교육 없이 바로 수행할 수 있는 항목을 체크해주세요.
            </p>

            <div className="space-y-2 pt-1">
              {skillOptions.map((skill) => {
                const isChecked = selectedSkills.includes(skill);
                return (
                  <label
                    key={skill}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'border-blue-500 bg-blue-50/60 font-semibold text-blue-900'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSkill(skill)}
                      className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs">{skill}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 원칙 안내 카드 */}
          <div className="rounded-xl bg-blue-50/80 p-3 text-[11px] text-blue-800 border border-blue-200 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
            <div>
              <p className="font-bold">경력 인증 승격 안내</p>
              <p className="mt-0.5 text-blue-700 leading-relaxed">
                처음 등록한 경력은 <span className="font-bold underline">자가 등록 경력</span> 배지가 부여되며, 해당 매장에서 대타 근무를 1회 이상 정상 완료하면 <span className="font-bold underline">매장 확인 경력</span>으로 자동 승격됩니다.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 transition-all"
          >
            {loading ? '등록 중...' : '경력 등록 완료하기'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </main>

      <BottomNav role="worker" />
    </div>
  );
}
