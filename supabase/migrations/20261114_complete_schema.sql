-- =====================================================================
-- 잡팡 (JOBPANG) Full Database Schema Migration & Seed Definition
-- Tables:
--   1. profiles (users)
--   2. brands
--   3. stores
--   4. work_experiences
--   5. worker_availability
--   6. shift_posts
--   7. applications
--   8. shift_invitations
--   9. matches
--  10. attendance
--  11. payments
--  12. notifications
--  13. reviews
--  14. reports
--  15. status_history
-- Requirements:
--  - Strict RLS (Owners only store/post/applications, Workers only own profile/apply/invitations)
--  - Time overlap prevention for matches (DB function/trigger)
--  - Unique active match per post / invitation
--  - Cafe brands seed & 2 owners / 5 workers test seed data
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ENUM TYPES
-- ---------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('owner', 'worker');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.experience_verification_type AS ENUM ('self_declared', 'store_confirmed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.shift_post_status AS ENUM (
        'Draft', 'Open', 'Reviewing', 'Pending', 'Matched', 
        'In Progress', 'Completed', 'Cancelled', 'Expired', 'Disputed'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.application_status AS ENUM ('submitted', 'accepted', 'rejected', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.invitation_status AS ENUM ('Pending', 'Matched', 'Cancelled', 'Expired');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.match_status AS ENUM ('Matched', 'In Progress', 'Completed', 'Cancelled', 'Disputed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.match_type AS ENUM ('post_application', 'direct_invitation');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.attendance_status AS ENUM ('scheduled', 'clocked_in', 'clocked_out', 'no_show', 'disputed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'disputed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.report_status AS ENUM ('submitted', 'investigating', 'resolved', 'dismissed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ---------------------------------------------------------------------
-- 2. TABLES DEFINITIONS
-- ---------------------------------------------------------------------

-- 1. profiles (users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.user_role NOT NULL DEFAULT 'worker',
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. brands (프랜차이즈 브랜드 마스터)
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'cafe',
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. stores (점주 매장)
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE RESTRICT,
    branch_name TEXT NOT NULL,
    address_summary TEXT NOT NULL, -- 시/군/구 및 동 (공개용)
    address_detail TEXT NOT NULL,  -- 번지/상세 호수 (매칭 확정 전 비공개)
    contact_phone TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. work_experiences (근무자 브랜드 경력)
CREATE TABLE IF NOT EXISTS public.work_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE RESTRICT,
    months_of_exp INTEGER NOT NULL DEFAULT 1 CHECK (months_of_exp > 0),
    verification_type public.experience_verification_type NOT NULL DEFAULT 'self_declared',
    confirmed_by_store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_worker_brand_exp UNIQUE (worker_id, brand_id)
);

-- 5. worker_availability (근무 가능 시간대 설정)
CREATE TABLE IF NOT EXISTS public.worker_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0:일, 1:월, ... 6:토
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_avail_time CHECK (end_time > start_time)
);

-- 6. shift_posts (긴급 대타 공고)
CREATE TABLE IF NOT EXISTS public.shift_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    work_date DATE NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    hourly_wage INTEGER NOT NULL CHECK (hourly_wage >= 9860),
    description TEXT,
    status public.shift_post_status NOT NULL DEFAULT 'Draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_post_time_range CHECK (end_time > start_time)
);

-- 7. applications (공고 지원)
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.shift_posts(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status public.application_status NOT NULL DEFAULT 'submitted',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_post_worker_app UNIQUE (post_id, worker_id)
);

-- 8. shift_invitations (직접 1:1 대타 요청/초대)
CREATE TABLE IF NOT EXISTS public.shift_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.shift_posts(id) ON DELETE SET NULL,
    work_date DATE NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    hourly_wage INTEGER NOT NULL CHECK (hourly_wage >= 9860),
    message TEXT,
    rejection_reason TEXT,
    status public.invitation_status NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_invitation_time_range CHECK (end_time > start_time)
);

-- 9. matches (최종 확정 매칭)
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_type public.match_type NOT NULL,
    post_id UUID REFERENCES public.shift_posts(id) ON DELETE SET NULL,
    invitation_id UUID REFERENCES public.shift_invitations(id) ON DELETE SET NULL,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    hourly_wage INTEGER NOT NULL,
    status public.match_status NOT NULL DEFAULT 'Matched',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_match_time_range CHECK (end_time > start_time)
);

-- 10. attendance (출퇴근/근무 상태 기록)
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL UNIQUE REFERENCES public.matches(id) ON DELETE CASCADE,
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    actual_hours NUMERIC(4, 2),
    status public.attendance_status NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. payments (대타 급여 정산/확인 기록)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL UNIQUE REFERENCES public.matches(id) ON DELETE CASCADE,
    total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
    payment_status public.payment_status NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    memo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. notifications (인앱 알림)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 13. reviews (근무 완료 후 상호 후기 및 평가)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_match_reviewer UNIQUE (match_id, reviewer_id)
);

-- 14. reports (신고 / 분쟁 접수)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL, -- 'shift_post', 'match', 'profile'
    target_id UUID NOT NULL,
    reason_category TEXT NOT NULL,
    details TEXT,
    status public.report_status NOT NULL DEFAULT 'submitted',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 15. status_history (상태 변경 감사 이력)
CREATE TABLE IF NOT EXISTS public.status_history (
    id BIGSERIAL PRIMARY KEY,
    entity_type TEXT NOT NULL, -- 'shift_posts', 'shift_invitations', 'matches'
    entity_id UUID NOT NULL,
    from_status TEXT,
    to_status TEXT NOT NULL,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ---------------------------------------------------------------------
-- 3. CONCURRENCY & INTEGRITY CONTROLS (부분 유니크 인덱스 & 트리거)
-- ---------------------------------------------------------------------

-- [제약 1] 하나의 공고에 대해 활성 매칭은 최대 1개만 존재 (이중 확정 방지)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_match_per_post 
    ON public.matches (post_id) 
    WHERE (post_id IS NOT NULL AND status IN ('Matched', 'In Progress', 'Completed'));

-- [제약 2] 하나의 직접 요청에 대해 활성 매칭은 최대 1개만 존재
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_match_per_invitation 
    ON public.matches (invitation_id) 
    WHERE (invitation_id IS NOT NULL AND status IN ('Matched', 'In Progress', 'Completed'));

-- [제약 3] 같은 근무자의 시간 겹치는 Matched 방지 트리거 함수
CREATE OR REPLACE FUNCTION public.fn_prevent_worker_match_overlap()
RETURNS TRIGGER AS $$
DECLARE
    v_conflict_count INTEGER;
BEGIN
    IF NEW.status IN ('Matched', 'In Progress') THEN
        SELECT COUNT(*)
        INTO v_conflict_count
        FROM public.matches
        WHERE worker_id = NEW.worker_id
          AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
          AND status IN ('Matched', 'In Progress')
          AND tstzrange(start_time, end_time) && tstzrange(NEW.start_time, NEW.end_time);

        IF v_conflict_count > 0 THEN
            RAISE EXCEPTION '해당 근무자는 동일한 시간대에 이미 확정된 다른 근무 일정이 존재합니다. (시간 중복 차단)';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_worker_match_overlap ON public.matches;
CREATE TRIGGER trg_prevent_worker_match_overlap
BEFORE INSERT OR UPDATE ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_worker_match_overlap();

-- [감사 로그 트리거] 상태 변경 시 status_history 자동 기록
CREATE OR REPLACE FUNCTION public.fn_audit_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.status_history (
            entity_type,
            entity_id,
            from_status,
            to_status,
            changed_by
        ) VALUES (
            TG_TABLE_NAME,
            NEW.id,
            OLD.status::TEXT,
            NEW.status::TEXT,
            auth.uid()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_shift_post_status ON public.shift_posts;
CREATE TRIGGER trg_audit_shift_post_status AFTER UPDATE ON public.shift_posts FOR EACH ROW EXECUTE FUNCTION public.fn_audit_status_transition();

DROP TRIGGER IF EXISTS trg_audit_shift_invitation_status ON public.shift_invitations;
CREATE TRIGGER trg_audit_shift_invitation_status AFTER UPDATE ON public.shift_invitations FOR EACH ROW EXECUTE FUNCTION public.fn_audit_status_transition();

DROP TRIGGER IF EXISTS trg_audit_match_status ON public.matches;
CREATE TRIGGER trg_audit_match_status AFTER UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.fn_audit_status_transition();

-- ---------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ---------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;

-- (1) brands: 모든 인증 사용자가 조회 가능
DROP POLICY IF EXISTS "brands_select_all" ON public.brands;
CREATE POLICY "brands_select_all" ON public.brands FOR SELECT TO authenticated USING (true);

-- (2) profiles: 누구나 기본 정보 조회 가능(마스킹은 뷰에서 처리), 본인만 수정
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- (3) stores: 누구나 매장 기본 정보 조회 가능, 점주는 본인 소유 매장만 INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "stores_select_all" ON public.stores;
CREATE POLICY "stores_select_all" ON public.stores FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "stores_manage_owner" ON public.stores;
CREATE POLICY "stores_manage_owner" ON public.stores FOR ALL TO authenticated USING (auth.uid() = owner_id);

-- (4) work_experiences: 누구나 조회 가능(근무자 탐색용), 근무자는 본인 경력만 관리
DROP POLICY IF EXISTS "experiences_select_all" ON public.work_experiences;
CREATE POLICY "experiences_select_all" ON public.work_experiences FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "experiences_manage_own" ON public.work_experiences;
CREATE POLICY "experiences_manage_own" ON public.work_experiences FOR ALL TO authenticated USING (auth.uid() = worker_id);

-- (5) worker_availability: 누구나 조회 가능, 본인만 관리
DROP POLICY IF EXISTS "availability_select_all" ON public.worker_availability;
CREATE POLICY "availability_select_all" ON public.worker_availability FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "availability_manage_own" ON public.worker_availability;
CREATE POLICY "availability_manage_own" ON public.worker_availability FOR ALL TO authenticated USING (auth.uid() = worker_id);

-- (6) shift_posts (공고):
--  - 조회: Open/Reviewing/Matched 등 공개된 공고는 누구나 조회 가능
--  - 등록/수정/삭제: 점주는 [본인 매장]의 공고만 관리 가능
DROP POLICY IF EXISTS "posts_select_all" ON public.shift_posts;
CREATE POLICY "posts_select_all" ON public.shift_posts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "posts_manage_owner" ON public.shift_posts;
CREATE POLICY "posts_manage_owner" ON public.shift_posts FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.stores 
        WHERE stores.id = shift_posts.store_id AND stores.owner_id = auth.uid()
    )
);

-- (7) applications (공고 지원):
--  - 점주는 [본인 매장 공고에 접수된 지원자]만 접근 가능
--  - 근무자는 [본인이 제출한 지원서]만 접근 가능
DROP POLICY IF EXISTS "applications_select_policy" ON public.applications;
CREATE POLICY "applications_select_policy" ON public.applications FOR SELECT TO authenticated
USING (
    worker_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.shift_posts
        JOIN public.stores ON stores.id = shift_posts.store_id
        WHERE shift_posts.id = applications.post_id AND stores.owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "applications_insert_worker" ON public.applications;
CREATE POLICY "applications_insert_worker" ON public.applications FOR INSERT TO authenticated
WITH CHECK (auth.uid() = worker_id);

DROP POLICY IF EXISTS "applications_update_parties" ON public.applications;
CREATE POLICY "applications_update_parties" ON public.applications FOR UPDATE TO authenticated
USING (
    worker_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.shift_posts
        JOIN public.stores ON stores.id = shift_posts.store_id
        WHERE shift_posts.id = applications.post_id AND stores.owner_id = auth.uid()
    )
);

-- (8) shift_invitations (직접 대타 요청):
--  - 점주는 [본인 매장에서 보낸 요청]만 접근 가능
--  - 근무자는 [본인에게 도착한 요청]만 접근 가능
DROP POLICY IF EXISTS "invitations_select_policy" ON public.shift_invitations;
CREATE POLICY "invitations_select_policy" ON public.shift_invitations FOR SELECT TO authenticated
USING (
    worker_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.stores 
        WHERE stores.id = shift_invitations.store_id AND stores.owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "invitations_insert_owner" ON public.shift_invitations;
CREATE POLICY "invitations_insert_owner" ON public.shift_invitations FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.stores 
        WHERE stores.id = shift_invitations.store_id AND stores.owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "invitations_update_parties" ON public.shift_invitations;
CREATE POLICY "invitations_update_parties" ON public.shift_invitations FOR UPDATE TO authenticated
USING (
    worker_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.stores 
        WHERE stores.id = shift_invitations.store_id AND stores.owner_id = auth.uid()
    )
);

-- (9) matches (확정 매칭):
--  - 해당 매칭의 점주 또는 근무자 본인만 접근 가능
DROP POLICY IF EXISTS "matches_parties_policy" ON public.matches;
CREATE POLICY "matches_parties_policy" ON public.matches FOR ALL TO authenticated
USING (
    worker_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.stores 
        WHERE stores.id = matches.store_id AND stores.owner_id = auth.uid()
    )
);

-- (10) attendance, payments: 해당 매칭의 당사자만 접근
DROP POLICY IF EXISTS "attendance_parties_policy" ON public.attendance;
CREATE POLICY "attendance_parties_policy" ON public.attendance FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.matches 
        JOIN public.stores ON stores.id = matches.store_id
        WHERE matches.id = attendance.match_id 
          AND (matches.worker_id = auth.uid() OR stores.owner_id = auth.uid())
    )
);

DROP POLICY IF EXISTS "payments_parties_policy" ON public.payments;
CREATE POLICY "payments_parties_policy" ON public.payments FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.matches 
        JOIN public.stores ON stores.id = matches.store_id
        WHERE matches.id = payments.match_id 
          AND (matches.worker_id = auth.uid() OR stores.owner_id = auth.uid())
    )
);

-- (11) notifications: 본인 알림만 접근
DROP POLICY IF EXISTS "notifications_own_policy" ON public.notifications;
CREATE POLICY "notifications_own_policy" ON public.notifications FOR ALL TO authenticated
USING (auth.uid() = user_id);

-- (12) reviews: 리뷰 작성자 또는 대상자만 접근
DROP POLICY IF EXISTS "reviews_parties_policy" ON public.reviews;
CREATE POLICY "reviews_parties_policy" ON public.reviews FOR ALL TO authenticated
USING (reviewer_id = auth.uid() OR reviewee_id = auth.uid());

-- (13) reports: 본인 신고 내역 접근
DROP POLICY IF EXISTS "reports_own_policy" ON public.reports;
CREATE POLICY "reports_own_policy" ON public.reports FOR ALL TO authenticated
USING (reporter_id = auth.uid());

-- (14) status_history: 인증된 사용자 조회 가능
DROP POLICY IF EXISTS "history_select_all" ON public.status_history;
CREATE POLICY "history_select_all" ON public.status_history FOR SELECT TO authenticated USING (true);

-- ---------------------------------------------------------------------
-- 5. ATOMIC STORED PROCEDURES (매칭 체결 함수)
-- ---------------------------------------------------------------------

-- 공고 지원자 채용 확정 RPC
CREATE OR REPLACE FUNCTION public.rpc_accept_shift_application(
    p_post_id UUID,
    p_worker_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_post public.shift_posts%ROWTYPE;
    v_store public.stores%ROWTYPE;
    v_match_id UUID;
BEGIN
    SELECT * INTO v_post FROM public.shift_posts WHERE id = p_post_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION '공고를 찾을 수 없습니다.'; END IF;

    SELECT * INTO v_store FROM public.stores WHERE id = v_post.store_id;
    IF v_store.owner_id <> auth.uid() THEN RAISE EXCEPTION '해당 공고의 지원자를 채용할 권한이 없습니다.'; END IF;

    IF v_post.status NOT IN ('Open', 'Reviewing') THEN
        RAISE EXCEPTION '현재 상태(%)에서는 지원자를 채용할 수 없습니다.', v_post.status;
    END IF;

    IF v_post.start_time <= timezone('utc'::text, now()) THEN
        UPDATE public.shift_posts SET status = 'Expired' WHERE id = p_post_id;
        RAISE EXCEPTION '근무 시작 시각이 경과하여 채용할 수 없습니다. (공고 만료)';
    END IF;

    -- 매칭 생성 (트리거에서 근무자 시간 중복 자동 검증)
    INSERT INTO public.matches (
        match_type,
        post_id,
        store_id,
        worker_id,
        start_time,
        end_time,
        hourly_wage,
        status
    ) VALUES (
        'post_application',
        v_post.id,
        v_post.store_id,
        p_worker_id,
        v_post.start_time,
        v_post.end_time,
        v_post.hourly_wage,
        'Matched'
    ) RETURNING id INTO v_match_id;

    -- 공고 상태 변경
    UPDATE public.shift_posts SET status = 'Matched' WHERE id = p_post_id;

    -- 지원서 상태 변경 (채택 accepted, 나머지 rejected)
    UPDATE public.applications SET status = 'accepted' WHERE post_id = p_post_id AND worker_id = p_worker_id;
    UPDATE public.applications SET status = 'rejected' WHERE post_id = p_post_id AND worker_id <> p_worker_id;

    -- 출퇴근 및 정산 레코드 자동 초기화
    INSERT INTO public.attendance (match_id, status) VALUES (v_match_id, 'scheduled');
    INSERT INTO public.payments (match_id, total_amount, payment_status)
    VALUES (v_match_id, ROUND(EXTRACT(EPOCH FROM (v_post.end_time - v_post.start_time)) / 3600 * v_post.hourly_wage)::INTEGER, 'pending');

    RETURN v_match_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 직접 초대 수락 RPC
CREATE OR REPLACE FUNCTION public.rpc_accept_shift_invitation(
    p_invitation_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_inv public.shift_invitations%ROWTYPE;
    v_match_id UUID;
BEGIN
    SELECT * INTO v_inv FROM public.shift_invitations WHERE id = p_invitation_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION '요청을 찾을 수 없습니다.'; END IF;

    IF v_inv.worker_id <> auth.uid() THEN RAISE EXCEPTION '해당 요청을 수락할 권한이 없습니다.'; END IF;
    IF v_inv.status <> 'Pending' THEN RAISE EXCEPTION '대기 중인 요청만 수락할 수 있습니다.'; END IF;

    IF v_inv.start_time <= timezone('utc'::text, now()) THEN
        UPDATE public.shift_invitations SET status = 'Expired' WHERE id = p_invitation_id;
        RAISE EXCEPTION '근무 시작 시각이 경과하여 수락할 수 없습니다. (요청 만료)';
    END IF;

    INSERT INTO public.matches (
        match_type,
        invitation_id,
        store_id,
        worker_id,
        start_time,
        end_time,
        hourly_wage,
        status
    ) VALUES (
        'direct_invitation',
        v_inv.id,
        v_inv.store_id,
        v_inv.worker_id,
        v_inv.start_time,
        v_inv.end_time,
        v_inv.hourly_wage,
        'Matched'
    ) RETURNING id INTO v_match_id;

    UPDATE public.shift_invitations SET status = 'Matched' WHERE id = p_invitation_id;

    INSERT INTO public.attendance (match_id, status) VALUES (v_match_id, 'scheduled');
    INSERT INTO public.payments (match_id, total_amount, payment_status)
    VALUES (v_match_id, ROUND(EXTRACT(EPOCH FROM (v_inv.end_time - v_inv.start_time)) / 3600 * v_inv.hourly_wage)::INTEGER, 'pending');

    RETURN v_match_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------
-- 6. SEED DATA (카페 브랜드, 점주 2명, 근무자 5명)
-- ---------------------------------------------------------------------

-- A. 카페 브랜드 7종 시드
INSERT INTO public.brands (id, name, category, logo_url) VALUES
('b0000000-0000-0000-0000-000000000001', '메가MGC커피', 'cafe', '/icons/mega.png'),
('b0000000-0000-0000-0000-000000000002', '컴포즈커피', 'cafe', '/icons/compose.png'),
('b0000000-0000-0000-0000-000000000003', '빽다방', 'cafe', '/icons/paik.png'),
('b0000000-0000-0000-0000-000000000004', '스타벅스', 'cafe', '/icons/starbucks.png'),
('b0000000-0000-0000-0000-000000000005', '이디야커피', 'cafe', '/icons/ediya.png'),
('b0000000-0000-0000-0000-000000000006', '투썸플레이스', 'cafe', '/icons/twosome.png'),
('b0000000-0000-0000-0000-000000000007', '배스킨라빈스', 'icecream', '/icons/baskin.png')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- B. 테스트용 점주 2명 auth.users & profiles 시드
-- (Supabase auth.users 삽입 트리거/외래키 고려)
DO $$
DECLARE
    v_pwd TEXT := crypt('password123!', gen_salt('bf'));
BEGIN
    -- 점주 1: 김점주 (메가커피 강남역점)
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
    VALUES (
        '10000000-0000-0000-0000-000000000001',
        'owner1@jobpang.kr',
        v_pwd,
        now(),
        '{"name": "김점주", "role": "owner", "phone": "010-1111-2222"}'::jsonb
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, role, name, phone)
    VALUES ('10000000-0000-0000-0000-000000000001', 'owner', '김점주', '010-1111-2222')
    ON CONFLICT (id) DO UPDATE SET role = 'owner', name = '김점주', phone = '010-1111-2222';

    -- 점주 2: 이점주 (컴포즈커피 역삼점)
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
    VALUES (
        '10000000-0000-0000-0000-000000000002',
        'owner2@jobpang.kr',
        v_pwd,
        now(),
        '{"name": "이점주", "role": "owner", "phone": "010-3333-4444"}'::jsonb
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, role, name, phone)
    VALUES ('10000000-0000-0000-0000-000000000002', 'owner', '이점주', '010-3333-4444')
    ON CONFLICT (id) DO UPDATE SET role = 'owner', name = '이점주', phone = '010-3333-4444';

    -- 근무자 1: 박알바 (메가커피 14개월, store_confirmed)
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
    VALUES (
        '20000000-0000-0000-0000-000000000001',
        'worker1@jobpang.kr',
        v_pwd,
        now(),
        '{"name": "박알바", "role": "worker", "phone": "010-5555-0001"}'::jsonb
    ) ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.profiles (id, role, name, phone)
    VALUES ('20000000-0000-0000-0000-000000000001', 'worker', '박알바', '010-5555-0001')
    ON CONFLICT (id) DO UPDATE SET role = 'worker', name = '박알바', phone = '010-5555-0001';

    -- 근무자 2: 정알바 (메가커피 6개월, self_declared)
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
    VALUES (
        '20000000-0000-0000-0000-000000000002',
        'worker2@jobpang.kr',
        v_pwd,
        now(),
        '{"name": "정알바", "role": "worker", "phone": "010-5555-0002"}'::jsonb
    ) ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.profiles (id, role, name, phone)
    VALUES ('20000000-0000-0000-0000-000000000002', 'worker', '정알바', '010-5555-0002')
    ON CONFLICT (id) DO UPDATE SET role = 'worker', name = '정알바', phone = '010-5555-0002';

    -- 근무자 3: 최알바 (컴포즈커피 10개월, store_confirmed)
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
    VALUES (
        '20000000-0000-0000-0000-000000000003',
        'worker3@jobpang.kr',
        v_pwd,
        now(),
        '{"name": "최알바", "role": "worker", "phone": "010-5555-0003"}'::jsonb
    ) ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.profiles (id, role, name, phone)
    VALUES ('20000000-0000-0000-0000-000000000003', 'worker', '최알바', '010-5555-0003')
    ON CONFLICT (id) DO UPDATE SET role = 'worker', name = '최알바', phone = '010-5555-0003';

    -- 근무자 4: 강알바 (빽다방 8개월, self_declared)
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
    VALUES (
        '20000000-0000-0000-0000-000000000004',
        'worker4@jobpang.kr',
        v_pwd,
        now(),
        '{"name": "강알바", "role": "worker", "phone": "010-5555-0004"}'::jsonb
    ) ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.profiles (id, role, name, phone)
    VALUES ('20000000-0000-0000-0000-000000000004', 'worker', '강알바', '010-5555-0004')
    ON CONFLICT (id) DO UPDATE SET role = 'worker', name = '강알바', phone = '010-5555-0004';

    -- 근무자 5: 윤알바 (스타벅스 12개월, store_confirmed)
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
    VALUES (
        '20000000-0000-0000-0000-000000000005',
        'worker5@jobpang.kr',
        v_pwd,
        now(),
        '{"name": "윤알바", "role": "worker", "phone": "010-5555-0005"}'::jsonb
    ) ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.profiles (id, role, name, phone)
    VALUES ('20000000-0000-0000-0000-000000000005', 'worker', '윤알바', '010-5555-0005')
    ON CONFLICT (id) DO UPDATE SET role = 'worker', name = '윤알바', phone = '010-5555-0005';
END $$;

-- C. 점주 매장 2곳 시드
INSERT INTO public.stores (id, owner_id, brand_id, branch_name, address_summary, address_detail, contact_phone)
VALUES
(
    's0000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001', -- 메가MGC커피
    '강남역점',
    '서울 강남구 역삼동',
    '테헤란로 123 1층 (강남역 1번 출구 도보 2분)',
    '02-555-1234'
),
(
    's0000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000002', -- 컴포즈커피
    '역삼점',
    '서울 강남구 역삼동',
    '역삼로 456 1층',
    '02-777-5678'
)
ON CONFLICT (id) DO NOTHING;

-- D. 근무자 경력 시드
INSERT INTO public.work_experiences (id, worker_id, brand_id, months_of_exp, verification_type, confirmed_by_store_id)
VALUES
(
    'e0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001', -- 박알바
    'b0000000-0000-0000-0000-000000000001', -- 메가MGC커피
    14,
    'store_confirmed',
    's0000000-0000-0000-0000-000000000001'
),
(
    'e0000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002', -- 정알바
    'b0000000-0000-0000-0000-000000000001', -- 메가MGC커피
    6,
    'self_declared',
    NULL
),
(
    'e0000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000003', -- 최알바
    'b0000000-0000-0000-0000-000000000002', -- 컴포즈커피
    10,
    'store_confirmed',
    's0000000-0000-0000-0000-000000000002'
),
(
    'e0000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000004', -- 강알바
    'b0000000-0000-0000-0000-000000000003', -- 빽다방
    8,
    'self_declared',
    NULL
),
(
    'e0000000-0000-0000-0000-000000000005',
    '20000000-0000-0000-0000-000000000005', -- 윤알바
    'b0000000-0000-0000-0000-000000000004', -- 스타벅스
    12,
    'store_confirmed',
    NULL
)
ON CONFLICT (id) DO NOTHING;

-- E. 샘플 긴급 공고 시드 (메가커피 강남역점)
INSERT INTO public.shift_posts (id, store_id, title, work_date, start_time, end_time, hourly_wage, description, status)
VALUES
(
    'p0000000-0000-0000-0000-000000000001',
    's0000000-0000-0000-0000-000000000001',
    '오늘 저녁 18:00~22:00 긴급 마감 대타 급구!',
    CURRENT_DATE,
    (CURRENT_DATE || ' 18:00:00+09')::TIMESTAMPTZ,
    (CURRENT_DATE || ' 22:00:00+09')::TIMESTAMPTZ,
    13500,
    '메가커피 음료 제조 및 마감 청소 경험자 우대합니다.',
    'Reviewing'
),
(
    'p0000000-0000-0000-0000-000000000002',
    's0000000-0000-0000-0000-000000000002',
    '내일 주말 미들 12:00~17:00 대타 구합니다',
    CURRENT_DATE + 1,
    ((CURRENT_DATE + 1) || ' 12:00:00+09')::TIMESTAMPTZ,
    ((CURRENT_DATE + 1) || ' 17:00:00+09')::TIMESTAMPTZ,
    13000,
    '포스 및 음료 제조',
    'Open'
)
ON CONFLICT (id) DO NOTHING;

-- F. 샘플 공고 지원서 시드 (박알바, 정알바가 공고 1번에 지원)
INSERT INTO public.applications (id, post_id, worker_id, status)
VALUES
(
    'a0000000-0000-0000-0000-000000000001',
    'p0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001', -- 박알바
    'submitted'
),
(
    'a0000000-0000-0000-0000-000000000002',
    'p0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002', -- 정알바
    'submitted'
)
ON CONFLICT (id) DO NOTHING;

-- G. 샘플 1:1 대타 요청 시드 (점주 1이 박알바에게 요청)
INSERT INTO public.shift_invitations (id, store_id, worker_id, work_date, start_time, end_time, hourly_wage, message, status)
VALUES
(
    'i0000000-0000-0000-0000-000000000001',
    's0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001', -- 박알바
    CURRENT_DATE,
    (CURRENT_DATE || ' 19:00:00+09')::TIMESTAMPTZ,
    (CURRENT_DATE || ' 23:00:00+09')::TIMESTAMPTZ,
    14000,
    '직원 급한 결근으로 1:1 요청드립니다! 가능하시면 수락 부탁드려요.',
    'Pending'
)
ON CONFLICT (id) DO NOTHING;
