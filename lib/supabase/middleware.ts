import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { Database } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export async function updateSession(request: NextRequest) {
  const demoRole = request.cookies.get('jobpang_demo_role')?.value;
  const isDemoSession =
    process.env.NODE_ENV !== 'production' &&
    (demoRole === 'owner' || demoRole === 'worker');

  if (isDemoSession) {
    const pathname = request.nextUrl.pathname;
    if (pathname.startsWith('/login') || pathname.startsWith('/role-select')) {
      return NextResponse.redirect(new URL('/home', request.url));
    }

    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Supabase URL이 기본 placeholder인 경우 세션 체크 생략하고 통과 (개발/데모 모드 지원)
  if (supabaseUrl.includes('placeholder.supabase.co')) {
    return supabaseResponse;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // 비인증 유저 보호 경로 리다이렉트
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/role-select');
  const isPublicRoute =
    isAuthRoute ||
    pathname === '/' ||
    pathname === '/demo' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.');

  if (!user && !isPublicRoute) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 로그인 상태에서 인증 라우트 접근 시 홈으로 이동
  if (user && isAuthRoute) {
    url.pathname = '/home';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
