'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, UserCheck, Check, ArrowRight, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { UserRole } from '@/types/database.types';

export default function RoleSelectPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>('worker');
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

  // 점주 입력 항목
  const [selectedBrandId, setSelectedBrandId] = useState(cafeBrands[0].id);
  const [branchName, setBranchName] = useState('강남역 2호점');
  const [addressSummary, setAddressSummary] = useState('서울 강남구 역삼동');
  const [addressDetail, setAddressDetail] = useState('테헤란로 123 1층');
  const [storePhone, setStorePhone] = useState('02-555-5678');

  // 근무자 입력 항목
  const [workerBrandId, setWorkerBrandId] = useState(cafeBrands[0].id);
  const [workerBranch, setWorkerBranch] = useState('강남역점');
  const [monthsOfExp, setMonthsOfExp] = useState(14);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['포스 계산', '음료 제조']);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    '에스프레소 머신 조작/샷 추출',
    '스팀 밀크 및 라떼 제조',
    '프라페/스무디/블렌더 음료 제조',
  ]);

  const roleOptions = ['포스 계산', '음료 제조', '매장 청소/마감', '재고 입고/정리', '고객 응대'];
  const skillOptions = [
    '에스프레소 머신 조작/샷 추출',
    '스팀 밀크 및 라떼 제조',
    '프라페/스무디/블렌더 음료 제조',
    '포스 마감 정산 및 시재 점검',
    '와플/디저트/베이커리 조리',
    '배달의민족/요기요 접수 처리',
  ];

  const toggleRole = (r: string) => {
    setSelectedRoles((prev) => (prev.includes(r) ? prev.filter((i) => i !== r) : [...prev, r]));
  };

  const toggleSkill = (s: string) => {
    setSelectedSkills((prev) => (prev.includes(s) ? prev.filter((i) => i !== s) : [...prev, s]));
  };

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let active = true;

    async function prefillSignupRole() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error) throw error;
        if (!active) return;

        const role = user?.user_metadata?.role;
        if (role === 'owner' || role === 'worker') {
          setSelectedRole(role);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error ? error.message : '회원 정보를 불러오지 못했습니다.'
          );
        }
      }
    }

    void prefillSignupRole();
    return () => {
      active = false;
    };
  }, [supabase]);

  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const brand = cafeBrands.find((b) => b.id === (selectedRole === 'owner' ? selectedBrandId : workerBrandId));

      // 1. 로컬 스토리지에 즉시 저장
      if (typeof window !== 'undefined') {
        localStorage.setItem('jobpang_demo_role', selectedRole);
        if (selectedRole === 'worker') {
          localStorage.setItem('jobpang_worker_main_brand', brand?.name || '메가MGC커피');
          localStorage.setItem('jobpang_worker_main_exp', String(monthsOfExp));
          localStorage.setItem(
            'jobpang_worker_experiences',
            JSON.stringify([
              {
                id: `exp-${Date.now()}`,
                brandId: workerBrandId,
                brandName: brand?.name || '메가MGC커피',
                branchName: workerBranch,
                monthsOfExp,
                roles: selectedRoles,
                skills: selectedSkills,
                verificationType: 'self_declared',
              },
            ])
          );
        }
      }

      // 2. Supabase DB 연동
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: selectedRole })
          .eq('id', user.id);
        if (profileError) throw profileError;

        if (selectedRole === 'owner') {
          const { error: storeError } = await supabase.from('stores').insert({
            owner_id: user.id,
            brand_id: selectedBrandId,
            branch_name: branchName,
            address_summary: addressSummary,
            address_detail: addressDetail,
            contact_phone: storePhone,
          });
          if (storeError) throw storeError;
        } else {
          const { error: experienceError } = await supabase
            .from('work_experiences')
            .insert({
              worker_id: user.id,
              brand_id: workerBrandId,
              branch_name: workerBranch,
              months_of_exp: Number(monthsOfExp),
              roles: selectedRoles,
              skills: selectedSkills,
              verification_type: 'self_declared',
            });
          if (experienceError) throw experienceError;
        }

        const { error: metadataError } = await supabase.auth.updateUser({
          data: { onboarding_pending: false },
        });
        if (metadataError) throw metadataError;
      }

      router.push('/home');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : '온보딩 정보 저장 중 오류가 발생했습니다.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full pb-8">
      <div className="mb-5">
        <h1 className="text-xl font-black text-zinc-900 tracking-tight">어떤 역할로 활동하시나요?</h1>
        <p className="mt-1 text-xs text-zinc-500">
          잡팡에서 주로 활동하실 회원 역할을 선택해주세요.
        </p>
      </div>

      {/* 역할 선택 카드 2종 */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <button
          type="button"
          onClick={() => setSelectedRole('owner')}
          className={`relative flex flex-col items-center rounded-2xl border p-4 text-center transition-all ${
            selectedRole === 'owner'
              ? 'border-amber-500 bg-amber-50/70 shadow-xs ring-1 ring-amber-500'
              : 'border-zinc-200 bg-white hover:border-zinc-300'
          }`}
        >
          {selectedRole === 'owner' && (
            <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white">
              <Check className="h-3 w-3 stroke-[3]" />
            </span>
          )}
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-2">
            <Store className="h-6 w-6" />
          </div>
          <span className="text-sm font-bold text-zinc-900">점주 (매장)</span>
          <span className="mt-1 text-[11px] text-zinc-500 leading-tight">
            갑작스러운 결근 대타를 구합니다
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedRole('worker')}
          className={`relative flex flex-col items-center rounded-2xl border p-4 text-center transition-all ${
            selectedRole === 'worker'
              ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-600'
              : 'border-zinc-200 bg-white hover:border-zinc-300'
          }`}
        >
          {selectedRole === 'worker' && (
            <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white">
              <Check className="h-3 w-3 stroke-[3]" />
            </span>
          )}
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-2">
            <UserCheck className="h-6 w-6" />
          </div>
          <span className="text-sm font-bold text-zinc-900">근무자 (대타)</span>
          <span className="mt-1 text-[11px] text-zinc-500 leading-tight">
            브랜드 경력으로 긴급 근무 참여
          </span>
        </button>
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-xl bg-red-50 p-2.5 text-xs text-red-600 border border-red-200">
          {errorMessage}
        </div>
      )}

      {/* 역할별 기본 온보딩 폼 */}
      <form onSubmit={handleCompleteOnboarding} className="space-y-4">
        {selectedRole === 'owner' ? (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 space-y-3">
            <h2 className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5 text-amber-600" />
              매장 기본 정보 등록
            </h2>

            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                프랜차이즈 브랜드 선택
              </label>
              <select
                value={selectedBrandId}
                onChange={(e) => setSelectedBrandId(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
              >
                {cafeBrands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">지점명</label>
              <input
                type="text"
                required
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                지역 요약 (공개 주소)
              </label>
              <input
                type="text"
                required
                value={addressSummary}
                onChange={(e) => setAddressSummary(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                상세 주소 (매칭 확정 전 비공개 보장)
              </label>
              <input
                type="text"
                required
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">매장 대표 번호</label>
              <input
                type="tel"
                required
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 space-y-3.5">
            <h2 className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-blue-600" />
              첫 브랜드 근무 경력 상세 등록
            </h2>

            {/* 브랜드 및 지점 */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                근무 경험 브랜드 선택
              </label>
              <select
                value={workerBrandId}
                onChange={(e) => setWorkerBrandId(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none font-semibold"
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
                value={workerBranch}
                onChange={(e) => setWorkerBranch(e.target.value)}
                placeholder="예: 강남역점, 역삼점"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                총 근무 개월 수
              </label>
              <input
                type="number"
                min="1"
                max="120"
                required
                value={monthsOfExp}
                onChange={(e) => setMonthsOfExp(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* 담당 업무 태그 */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1.5">
                담당했던 주요 업무 (복수 선택)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {roleOptions.map((r) => {
                  const active = selectedRoles.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggleRole(r)}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
                        active ? 'bg-blue-600 text-white' : 'bg-white text-zinc-600 border border-zinc-200'
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 수행 가능 업무 체크 */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1.5">
                즉시 수행 가능한 업무 능력
              </label>
              <div className="space-y-1.5">
                {skillOptions.map((s) => {
                  const checked = selectedSkills.includes(s);
                  return (
                    <label
                      key={s}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs transition-all ${
                        checked ? 'bg-blue-50 border-blue-400 text-blue-900 font-semibold' : 'bg-white border-zinc-200 text-zinc-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSkill(s)}
                        className="h-3.5 w-3.5 text-blue-600 rounded"
                      />
                      <span>{s}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 경력 배지 안내 */}
            <div className="rounded-xl bg-blue-50/90 p-2.5 text-[11px] text-blue-800 border border-blue-200 flex gap-1.5 items-start">
              <AlertCircle className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
              <div>
                <p className="font-bold">경력 표기 원칙 안내</p>
                <p className="mt-0.5 text-blue-700 leading-relaxed">
                  등록 직후에는 <span className="font-bold underline">자가 등록 경력</span> 배지가 표시되며, 해당 매장에서 대타 근무를 1회 이상 정상 완료하면 <span className="font-bold underline">매장 확인 경력</span>으로 승격됩니다.
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-100 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 transition-all"
        >
          {loading ? '등록 중...' : '잡팡 시작하기'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
