'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, Users, Briefcase, Inbox, Settings } from 'lucide-react';
import { UserRole } from '@/types/database.types';

interface BottomNavProps {
  role: UserRole;
  pendingRequestsCount?: number;
}

interface NavTab {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

function BottomNavContent({ role, pendingRequestsCount = 0 }: BottomNavProps) {
  const pathname = usePathname();

  const ownerTabs: NavTab[] = [
    { label: '홈', href: '/home', icon: Home },
    { label: '공고등록', href: '/jobs/new', icon: PlusCircle },
    { label: '근무자탐색', href: '/workers', icon: Users },
    { label: '설정', href: '/settings', icon: Settings },
  ];

  const workerTabs: NavTab[] = [
    { label: '홈', href: '/home', icon: Home },
    { label: '공고찾기', href: '/jobs', icon: Briefcase },
    { label: '받은요청', href: '/requests', icon: Inbox, badge: pendingRequestsCount },
    { label: '설정', href: '/settings', icon: Settings },
  ];

  const tabs = role === 'owner' ? ownerTabs : workerTabs;

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-30 flex h-16 w-full max-w-md items-center justify-around border-t border-zinc-200 bg-white/95 px-2 backdrop-blur">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          tab.href === '/home'
            ? pathname === '/home'
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative flex flex-1 flex-col items-center justify-center py-1 transition-colors ${
              isActive ? 'text-blue-600 font-semibold' : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <div className="relative">
              <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              {Boolean(tab.badge && tab.badge > 0) && (
                <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="mt-1 text-[11px] leading-tight tracking-tight">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav(props: BottomNavProps) {
  return (
    <Suspense
      fallback={
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-30 flex h-16 w-full max-w-md items-center justify-around border-t border-zinc-200 bg-white/95 px-2 h-16" />
      }
    >
      <BottomNavContent {...props} />
    </Suspense>
  );
}
