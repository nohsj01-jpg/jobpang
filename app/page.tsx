'use client';

import { useRouter } from 'next/navigation';
import { Briefcase, Store, Zap } from 'lucide-react';
import { prototypeAccounts, startPrototypeSession } from '@/lib/prototype-session';

export default function AccountPickerPage() {
  const router = useRouter();

  const handleSelect = (account: (typeof prototypeAccounts)[number]) => {
    startPrototypeSession(account);
    router.push('/home');
  };

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8">
      <section className="mx-auto w-full max-w-md">
        <header className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <Zap className="h-8 w-8 fill-white" />
          </div>
          <h1 className="text-2xl font-black text-zinc-900">
            잡팡 <span className="text-blue-600">JOBPANG</span>
          </h1>
          <p className="mt-1 text-sm font-bold text-zinc-700">체험할 계정을 선택해 주세요</p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            로그인이나 회원가입 없이 초안 화면을 둘러볼 수 있습니다.
            입력한 내용은 이 브라우저에만 임시 저장됩니다.
          </p>
        </header>

        <div className="space-y-2">
          {prototypeAccounts.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => handleSelect(account)}
              className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white p-3.5 text-left shadow-xs transition hover:border-blue-300 hover:bg-blue-50/40 active:scale-[0.99]"
            >
              <span className="flex items-center gap-3">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    account.role === 'owner'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {account.role === 'owner' ? (
                    <Store className="h-4 w-4" />
                  ) : (
                    <Briefcase className="h-4 w-4" />
                  )}
                </span>
                <span>
                  <span className="block text-sm font-bold text-zinc-900">{account.name}</span>
                  <span className="mt-0.5 block text-xs text-zinc-500">{account.label}</span>
                </span>
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  account.role === 'owner'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-blue-50 text-blue-700'
                }`}
              >
                {account.role === 'owner' ? '점주' : '근무자'}
              </span>
            </button>
          ))}
        </div>

        <p className="mt-4 text-center text-[11px] text-zinc-400">
          초안 체험 모드 · 실제 계정이나 운영 데이터에 연결되지 않습니다.
        </p>
      </section>
    </main>
  );
}
