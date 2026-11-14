'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

/**
 * Owner Store Registration Page
 * Mobile‑first layout (max‑w-md) for 375px width.
 * Allows an owner to register a new store.
 */
export default function OwnerStoreRegisterPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [brands, setBrands] = useState<Database['public']['Tables']['brands']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [brandId, setBrandId] = useState('');
  const [branchName, setBranchName] = useState('');
  const [addressSummary, setAddressSummary] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [minShiftHours, setMinShiftHours] = useState('');

  // Fetch brands for selector
  useEffect(() => {
    async function fetchBrands() {
      const { data, error } = await supabase.from('brands').select('*');
      if (error) {
        setError(error.message);
      } else {
        setBrands(data ?? []);
        if (data?.length) setBrandId(data[0].id);
      }
      setLoading(false);
    }
    fetchBrands();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Get current user to obtain owner_id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('로그인이 필요합니다.');
      return;
    }
    const insertPayload = {
      owner_id: user.id,
      brand_id: brandId,
      branch_name: branchName,
      address_summary: addressSummary,
      address_detail: addressDetail,
      contact_phone: contactPhone,
      min_shift_hours: Number(minShiftHours),
    };
    const { error: insertError } = await supabase.from('stores').insert(insertPayload);
    if (insertError) {
      setError(insertError.message);
    } else {
      // Redirect to owner home or store list
      router.push('/owner/home');
    }
  };

  if (loading) return <div className="flex justify-center p-4">불러오는 중…</div>;

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">새 매장 등록</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-gray-700">브랜드</span>
          <select
            className="mt-1 block w-full border rounded p-2"
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
            required
          >
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-gray-700">지점명</span>
          <input
            type="text"
            className="mt-1 block w-full border rounded p-2"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="text-gray-700">주소 요약</span>
          <input
            type="text"
            className="mt-1 block w-full border rounded p-2"
            value={addressSummary}
            onChange={(e) => setAddressSummary(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="text-gray-700">상세 주소</span>
          <input
            type="text"
            className="mt-1 block w-full border rounded p-2"
            value={addressDetail}
            onChange={(e) => setAddressDetail(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="text-gray-700">연락 전화</span>
          <input
            type="tel"
            className="mt-1 block w-full border rounded p-2"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="text-gray-700">최소 근무시간 (시간)</span>
          <input
            type="number"
            min="0"
            className="mt-1 block w-full border rounded p-2"
            value={minShiftHours}
            onChange={(e) => setMinShiftHours(e.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          등록하기
        </button>
      </form>
    </div>
  );
}
