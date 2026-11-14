'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Bell, Zap } from 'lucide-react';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  role?: 'owner' | 'worker';
  rightElement?: React.ReactNode;
}

export function Header({ title, showBack = false, role, rightElement }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur">
      <div className="flex items-center gap-2">
        {showBack ? (
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 active:bg-zinc-200"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        ) : (
          <Link href="/home" className="flex items-center gap-1.5 font-bold tracking-tight text-blue-600">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <Zap className="h-4 w-4 fill-white" />
            </span>
            <span className="text-lg">잡팡</span>
          </Link>
        )}

        {title && (
          <h1 className="text-base font-semibold text-zinc-900 truncate max-w-[200px]">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        {role && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              role === 'owner'
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}
          >
            {role === 'owner' ? '점주' : '근무자'}
          </span>
        )}

        {rightElement ? (
          rightElement
        ) : (
          <Link
            href="/settings"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100"
            aria-label="알림 및 설정"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
          </Link>
        )}
      </div>
    </header>
  );
}
