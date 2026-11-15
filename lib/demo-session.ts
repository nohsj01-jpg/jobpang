import type { UserRole } from '@/types/database.types';

const demoRoleCookie = 'jobpang_demo_role';

export function setDemoSessionCookie(role: UserRole) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${demoRoleCookie}=${role}; Path=/; SameSite=Lax${secure}`;
}

export function clearDemoSessionCookie() {
  document.cookie = `${demoRoleCookie}=; Path=/; Max-Age=0; SameSite=Lax`;
}
