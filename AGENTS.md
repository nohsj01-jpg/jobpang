<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# 잡팡 (JOBPANG) 프로젝트 개발 지침

상세 프로젝트 규칙은 [PROJECT_RULES.md](file:///c:/Users/노혜정/OneDrive/바탕%20화면/선정/바이브코딩/jobpang/PROJECT_RULES.md)를 반드시 준수합니다.

## 핵심 요약
1. **서비스 정의**: 갑작스러운 결근으로 인력 공백이 생긴 매장과, 같은 브랜드 근무 경험이 있는 근무자를 빠르게 연결하는 긴급 대타 매칭 플랫폼. (슬로건: *"오늘 일, 지금 잡자!"*)
2. **기술 스택**: Next.js(App Router) + TypeScript + Tailwind CSS + Supabase(Postgres, Auth, RLS, Realtime), PWA, 모바일 우선.
3. **역할**: 점주(`owner`), 근무자(`worker`). 접근 권한은 서버(RLS)에서 강제.
4. **매칭 경로**: 
   - ① 점주 공고 → 근무자 지원 → 점주 선택
   - ② 점주가 근무자 검색 → 직접 요청 → 근무자 수락 → 최종 확정
5. **상태값 (10개)**: `Draft`, `Open`, `Reviewing`, `Pending`, `Matched`, `In Progress`, `Completed`, `Cancelled`, `Expired`, `Disputed`
6. **핵심 원칙**:
   - 경력 구분은 `self_declared` / `store_confirmed` 로만 표기 ("공식 인증 경력" 표현 금지).
   - 근무자 연락처 및 상세 위치는 매칭 확정(`Matched`) 전 비공개.
   - 직접 요청 거절 시 근무자 불이익 없음.
   - 시간 중복, 이중 확정, 만료 건 확정은 서버/DB 레벨에서 강제 차단.
   - 중요 상태 변경은 전용 이력 테이블에 저장.
   - **구현 제외 (Non-Goals)**: 결제/정산, AI 매칭, 본사 인증 연동.
   - 모든 UI 문구는 한국어.

