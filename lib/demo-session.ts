import type { UserRole } from '@/types/database.types';

const demoRoleCookie = 'jobpang_demo_role';

export function setDemoSessionCookie(role: UserRole) {
  if (process.env.NODE_ENV === 'production') return;

  document.cookie = `${demoRoleCookie}=${role}; Path=/; SameSite=Lax`;
}

export function clearDemoSessionCookie() {
  document.cookie = `${demoRoleCookie}=; Path=/; Max-Age=0; SameSite=Lax`;
}
