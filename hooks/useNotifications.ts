'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: '대타 매칭 확정 안내',
      message: '메가커피 강남역점 대타 근무가 최종 확정되었습니다.',
      linkUrl: '/matches/demo-match-1',
      isRead: false,
      createdAt: '5분 전',
    },
    {
      id: 'notif-2',
      title: '1:1 대타 요청 도착',
      message: '메가커피 역삼역점에서 긴급 대타 요청이 도착했습니다.',
      linkUrl: '/requests',
      isRead: false,
      createdAt: '15분 전',
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}
