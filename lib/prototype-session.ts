import type { UserRole } from '@/types/database.types';
import { clearDemoSessionCookie, setDemoSessionCookie } from '@/lib/demo-session';

export type PrototypeAccount = {
  label: string;
  email: string;
  role: UserRole;
  name: string;
};

export const prototypeAccounts: PrototypeAccount[] = [
  { label: '점주 1 (메가커피 강남역점)', email: 'owner1@jobpang.kr', role: 'owner', name: '김점주' },
  { label: '점주 2 (컴포즈커피 역삼점)', email: 'owner2@jobpang.kr', role: 'owner', name: '이점주' },
  { label: '근무자 1 (메가커피 14개월/확인)', email: 'worker1@jobpang.kr', role: 'worker', name: '박알바' },
  { label: '근무자 2 (메가커피 6개월/자가)', email: 'worker2@jobpang.kr', role: 'worker', name: '정알바' },
  { label: '근무자 3 (컴포즈 10개월/확인)', email: 'worker3@jobpang.kr', role: 'worker', name: '최알바' },
  { label: '근무자 4 (빽다방 8개월/자가)', email: 'worker4@jobpang.kr', role: 'worker', name: '강알바' },
  { label: '근무자 5 (스타벅스 12개월/확인)', email: 'worker5@jobpang.kr', role: 'worker', name: '윤알바' },
];

export function isPrototypeSession() {
  return (
    typeof window !== 'undefined' &&
    localStorage.getItem('jobpang_prototype_session') === 'true'
  );
}

export function startPrototypeSession(account: PrototypeAccount) {
  localStorage.setItem('jobpang_prototype_session', 'true');
  localStorage.setItem('jobpang_demo_role', account.role);
  localStorage.setItem(
    'jobpang_demo_user',
    JSON.stringify({
      email: account.email,
      name: account.name,
      role: account.role,
      phone: '010-1234-5678',
    })
  );
  setDemoSessionCookie(account.role);
}

export function clearPrototypeSession() {
  localStorage.removeItem('jobpang_prototype_session');
  localStorage.removeItem('jobpang_demo_role');
  localStorage.removeItem('jobpang_demo_user');
  clearDemoSessionCookie();
}
