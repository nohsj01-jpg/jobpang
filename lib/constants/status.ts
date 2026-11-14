import { JobStatus, MatchStatus, DirectRequestStatus } from '@/types/database.types';

export interface StatusMeta {
  label: string;
  description: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  badgeClass: string;
}

export const STATUS_META: Record<JobStatus, StatusMeta> = {
  Draft: {
    label: '임시저장',
    description: '공고가 아직 게시되지 않은 상태입니다.',
    variant: 'outline',
    badgeClass: 'bg-zinc-100 text-zinc-600 border-zinc-300',
  },
  Open: {
    label: '모집 중',
    description: '근무자 지원을 기다리는 중입니다.',
    variant: 'default',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  Reviewing: {
    label: '검토 중',
    description: '지원자가 발생하여 검토 중입니다.',
    variant: 'warning',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  Pending: {
    label: '수락 대기',
    description: '근무자의 요청 수락을 기다리고 있습니다.',
    variant: 'warning',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  Matched: {
    label: '매칭 확정',
    description: '대타 근무가 최종 확정되었습니다.',
    variant: 'success',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-medium',
  },
  'In Progress': {
    label: '근무 진행 중',
    description: '대타 근무가 진행 중입니다.',
    variant: 'default',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse',
  },
  Completed: {
    label: '근무 완료',
    description: '대타 근무가 정상 종료되었습니다.',
    variant: 'secondary',
    badgeClass: 'bg-zinc-100 text-zinc-800 border-zinc-200',
  },
  Cancelled: {
    label: '취소됨',
    description: '공고 또는 매칭이 취소되었습니다.',
    variant: 'destructive',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  Expired: {
    label: '기간 만료',
    description: '근무 시작 시각이 경과하여 마감되었습니다.',
    variant: 'secondary',
    badgeClass: 'bg-gray-100 text-gray-500 border-gray-200',
  },
  Disputed: {
    label: '이의 제기',
    description: '근무 관련 분쟁 또는 확인 요청이 접수되었습니다.',
    variant: 'destructive',
    badgeClass: 'bg-red-50 text-red-800 border-red-300 font-medium',
  },
};

export const VERIFICATION_LABELS = {
  self_declared: '자가 등록 경력',
  store_confirmed: '매장 확인 경력',
} as const;
