-- =====================================================================
-- 잡팡 (JOBPANG) Initial Database Schema & Security Definition
-- Description: Core Tables, Custom Types, RLS Policies, Audit Triggers,
--              Concurrency Control, and Atomic Matching Functions.
-- Rules: 
--  - Official verification word banned ("self_declared" / "store_confirmed" only)
--  - Server-enforced double booking / double match / expired match blocking
--  - Status history audit logging
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ENUM TYPES
-- ---------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('owner', 'worker');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.experience_verification_type AS ENUM ('self_declared', 'store_confirmed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.job_status AS ENUM (
        'Draft', 'Open', 'Reviewing', 'Pending', 'Matched', 
        'In Progress', 'Completed', 'Cancelled', 'Expired', 'Disputed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.application_status AS ENUM ('submitted', 'accepted', 'rejected', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.direct_request_status AS ENUM ('Pending', 'Matched', 'Cancelled', 'Expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.match_status AS ENUM ('Matched', 'In Progress', 'Completed', 'Cancelled', 'Disputed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.match_type AS ENUM ('job_application', 'direct_request');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ---------------------------------------------------------------------
-- 2. TABLES DEFINITION
-- ---------------------------------------------------------------------

-- (1) profiles: Supabase auth.users 확장 프로필
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.user_role NOT NULL DEFAULT 'worker',
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- (2) stores: 점주 매장 정보
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL,
    branch_name TEXT NOT NULL,
    address_summary TEXT NOT NULL, -- 시/군/구 및 동 (공개용)
    address_detail TEXT NOT NULL,  -- 번지/호수/건물명 (매칭 전 비공개)
    contact_phone TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- (3) worker_experiences: 근무자 브랜드 경력 (자가등록 / 매장확인)
CREATE TABLE IF NOT EXISTS public.worker_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL,
    months_of_exp INTEGER NOT NULL DEFAULT 1 CHECK (months_of_exp > 0),
    verification_type public.experience_verification_type NOT NULL DEFAULT 'self_declared',
    confirmed_by_store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- (4) jobs: 긴급 대타 공고
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    work_date DATE NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    hourly_wage INTEGER NOT NULL CHECK (hourly_wage >= 9860), -- 법정 최저시급 기준 체크
    description TEXT,
    status public.job_status NOT NULL DEFAULT 'Draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT check_job_time_range CHECK (end_time > start_time)
);

-- (5) job_applications: 공고 지원서
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status public.application_status NOT NULL DEFAULT 'submitted',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_job_worker_application UNIQUE (job_id, worker_id)
);

-- (6) direct_requests: 점주 1:1 직접 대타 요청
CREATE TABLE IF NOT EXISTS public.direct_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    work_date DATE NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    hourly_wage INTEGER NOT NULL CHECK (hourly_wage >= 9860),
    message TEXT,
    rejection_reason TEXT,
    status public.direct_request_status NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT check_direct_request_time_range CHECK (end_time > start_time)
);

-- (7) matches: 최종 확정 매칭 (공고 or 직접요청 모두 수렴)
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_type public.match_type NOT NULL,
    job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    direct_request_id UUID REFERENCES public.direct_requests(id) ON DELETE SET NULL,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    hourly_wage INTEGER NOT NULL,
    status public.match_status NOT NULL DEFAULT 'Matched',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT check_match_time_range CHECK (end_time > start_time)
);

-- (8) status_history: 중요 상태 변경 감사 로그 (Audit History)
CREATE TABLE IF NOT EXISTS public.status_history (
    id BIGSERIAL PRIMARY KEY,
    entity_type TEXT NOT NULL, -- 'jobs', 'direct_requests', 'matches'
    entity_id UUID NOT NULL,
    from_status TEXT,
    to_status TEXT NOT NULL,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- (9) notifications: 실시간 인앱 알림
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ---------------------------------------------------------------------
-- 3. INDEXES & CONCURRENCY CONTROLS
-- ---------------------------------------------------------------------

-- 단일 공고 건에 대해 활성 매칭은 최대 1개만 존재 가능 (이중 확정 원천 차단)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_match_per_job 
    ON public.matches (job_id) 
    WHERE (job_id IS NOT NULL AND status IN ('Matched', 'In Progress', 'Completed'));

-- 단일 직접 요청 건에 대해 활성 매칭은 최대 1개만 존재 가능
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_match_per_request 
    ON public.matches (direct_request_id) 
    WHERE (direct_request_id IS NOT NULL AND status IN ('Matched', 'In Progress', 'Completed'));

-- 공고 검색 및 근무자 탐색 속도 향상을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_jobs_search ON public.jobs (status, work_date, start_time);
CREATE INDEX IF NOT EXISTS idx_jobs_store ON public.jobs (store_id);
CREATE INDEX IF NOT EXISTS idx_stores_owner ON public.stores (owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_brand ON public.stores (brand_name);
CREATE INDEX IF NOT EXISTS idx_worker_exp_brand ON public.worker_experiences (brand_name, verification_type);
CREATE INDEX IF NOT EXISTS idx_worker_exp_worker ON public.worker_experiences (worker_id);
CREATE INDEX IF NOT EXISTS idx_direct_requests_worker ON public.direct_requests (worker_id, status);
CREATE INDEX IF NOT EXISTS idx_matches_worker_time ON public.matches (worker_id, start_time, end_time, status);
CREATE INDEX IF NOT EXISTS idx_status_history_entity ON public.status_history (entity_type, entity_id);

-- ---------------------------------------------------------------------
-- 4. SERVER FUNCTIONS & TRIGGERS
-- ---------------------------------------------------------------------

-- (1) updated_at 자동 갱신 트리거 함수
CREATE OR REPLACE FUNCTION public.fn_handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.fn_handle_updated_at();
CREATE OR REPLACE TRIGGER trg_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.fn_handle_updated_at();
CREATE OR REPLACE TRIGGER trg_worker_experiences_updated_at BEFORE UPDATE ON public.worker_experiences FOR EACH ROW EXECUTE FUNCTION public.fn_handle_updated_at();
CREATE OR REPLACE TRIGGER trg_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.fn_handle_updated_at();
CREATE OR REPLACE TRIGGER trg_job_applications_updated_at BEFORE UPDATE ON public.job_applications FOR EACH ROW EXECUTE FUNCTION public.fn_handle_updated_at();
CREATE OR REPLACE TRIGGER trg_direct_requests_updated_at BEFORE UPDATE ON public.direct_requests FOR EACH ROW EXECUTE FUNCTION public.fn_handle_updated_at();
CREATE OR REPLACE TRIGGER trg_matches_updated_at BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.fn_handle_updated_at();

-- (2) 감사 로그 (status_history) 자동 기록 트리거 함수
CREATE OR REPLACE FUNCTION public.fn_audit_status_transition()
RETURNS TRIGGER AS $$
DECLARE
    v_entity_type TEXT;
    v_changed_by UUID;
BEGIN
    v_entity_type := TG_TABLE_NAME;
    v_changed_by := auth.uid();

    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.status_history (
            entity_type,
            entity_id,
            from_status,
            to_status,
            changed_by
        ) VALUES (
            v_entity_type,
            NEW.id,
            OLD.status::TEXT,
            NEW.status::TEXT,
            v_changed_by
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_audit_job_status AFTER UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.fn_audit_status_transition();
CREATE OR REPLACE TRIGGER trg_audit_request_status AFTER UPDATE ON public.direct_requests FOR EACH ROW EXECUTE FUNCTION public.fn_audit_status_transition();
CREATE OR REPLACE TRIGGER trg_audit_match_status AFTER UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.fn_audit_status_transition();

-- (3) 근무자 시간 중복(Double Booking) 방지 트리거 함수
CREATE OR REPLACE FUNCTION public.fn_prevent_worker_time_overlap()
RETURNS TRIGGER AS $$
DECLARE
    v_conflict_count INTEGER;
BEGIN
    -- 활성 상태인 매칭(Matched, In Progress) 건과 시간대가 겹치는지 체크
    IF NEW.status IN ('Matched', 'In Progress') THEN
        SELECT COUNT(*)
        INTO v_conflict_count
        FROM public.matches
        WHERE worker_id = NEW.worker_id
          AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
          AND status IN ('Matched', 'In Progress')
          AND tstzrange(start_time, end_time) && tstzrange(NEW.start_time, NEW.end_time);

        IF v_conflict_count > 0 THEN
            RAISE EXCEPTION '해당 근무자는 동일한 시간대에 이미 확정된 다른 근무 일정이 존재합니다.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_prevent_worker_match_overlap
BEFORE INSERT OR UPDATE ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_worker_time_overlap();

-- (4) 지원자 발생 시 공고 상태 자동 전이 (Open -> Reviewing)
CREATE OR REPLACE FUNCTION public.fn_on_job_application_submitted()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.jobs
    SET status = 'Reviewing'
    WHERE id = NEW.job_id
      AND status = 'Open';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_job_application_submitted
AFTER INSERT ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.fn_on_job_application_submitted();

-- ---------------------------------------------------------------------
-- 5. ATOMIC STORED PROCEDURES (매칭 확정 원자적 처리)
-- ---------------------------------------------------------------------

-- A. 공고 기반 채용 확정 (점주 액션)
CREATE OR REPLACE FUNCTION public.rpc_accept_job_application(
    p_job_id UUID,
    p_worker_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_job public.jobs%ROWTYPE;
    v_store public.stores%ROWTYPE;
    v_match_id UUID;
BEGIN
    -- 1. 공고 정보 및 상태 잠금 조회 (FOR UPDATE)
    SELECT * INTO v_job
    FROM public.jobs
    WHERE id = p_job_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION '해당 공고를 찾을 수 없습니다.';
    END IF;

    -- 2. 매장 점주 본인 확인
    SELECT * INTO v_store FROM public.stores WHERE id = v_job.store_id;
    IF v_store.owner_id <> auth.uid() THEN
        RAISE EXCEPTION '해당 공고의 지원자를 채용할 권한이 없습니다.';
    END IF;

    -- 3. 만료 및 유효 상태 검증
    IF v_job.status NOT IN ('Open', 'Reviewing') THEN
        RAISE EXCEPTION '현재 상태(%)에서는 지원자를 채용할 수 없습니다.', v_job.status;
    END IF;

    IF v_job.start_time <= timezone('utc'::text, now()) THEN
        UPDATE public.jobs SET status = 'Expired' WHERE id = p_job_id;
        RAISE EXCEPTION '근무 시작 시각이 이미 경과하여 채용할 수 없습니다 (공고 만료).';
    END IF;

    -- 4. 매칭 생성 (트리거에서 근무자 시간 중복 자동 검증)
    INSERT INTO public.matches (
        match_type,
        job_id,
        store_id,
        worker_id,
        start_time,
        end_time,
        hourly_wage,
        status
    ) VALUES (
        'job_application',
        v_job.id,
        v_job.store_id,
        p_worker_id,
        v_job.start_time,
        v_job.end_time,
        v_job.hourly_wage,
        'Matched'
    ) RETURNING id INTO v_match_id;

    -- 5. 공고 상태 Matched로 갱신
    UPDATE public.jobs
    SET status = 'Matched'
    WHERE id = p_job_id;

    -- 6. 지원서 상태 처리 (선정된 자 accepted, 나머지 rejected)
    UPDATE public.job_applications
    SET status = 'accepted'
    WHERE job_id = p_job_id AND worker_id = p_worker_id;

    UPDATE public.job_applications
    SET status = 'rejected'
    WHERE job_id = p_job_id AND worker_id <> p_worker_id;

    -- 7. 알림 발송
    INSERT INTO public.notifications (user_id, title, message, link_url)
    VALUES (
        p_worker_id,
        '대타 매칭 확정 안내',
        v_store.brand_name || ' ' || v_store.branch_name || ' 대타 근무가 확정되었습니다.',
        '/matches/' || v_match_id
    );

    RETURN v_match_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. 직접 대타 요청 수락 (근무자 액션)
CREATE OR REPLACE FUNCTION public.rpc_accept_direct_request(
    p_request_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_req public.direct_requests%ROWTYPE;
    v_store public.stores%ROWTYPE;
    v_match_id UUID;
BEGIN
    -- 1. 요청 정보 잠금 조회
    SELECT * INTO v_req
    FROM public.direct_requests
    WHERE id = p_request_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION '대타 요청을 찾을 수 없습니다.';
    END IF;

    -- 2. 수신 근무자 본인 확인
    IF v_req.worker_id <> auth.uid() THEN
        RAISE EXCEPTION '해당 요청을 수락할 권한이 없습니다.';
    END IF;

    -- 3. 유효 상태 및 만료 검증
    IF v_req.status <> 'Pending' THEN
        RAISE EXCEPTION '대기 중(Pending)인 요청만 수락할 수 있습니다. (현재 상태: %)', v_req.status;
    END IF;

    IF v_req.start_time <= timezone('utc'::text, now()) THEN
        UPDATE public.direct_requests SET status = 'Expired' WHERE id = p_request_id;
        RAISE EXCEPTION '근무 시작 시각이 경과하여 수락할 수 없습니다 (요청 만료).';
    END IF;

    -- 4. 매칭 생성 (트리거에서 시간 중복 검증)
    INSERT INTO public.matches (
        match_type,
        direct_request_id,
        store_id,
        worker_id,
        start_time,
        end_time,
        hourly_wage,
        status
    ) VALUES (
        'direct_request',
        v_req.id,
        v_req.store_id,
        v_req.worker_id,
        v_req.start_time,
        v_req.end_time,
        v_req.hourly_wage,
        'Matched'
    ) RETURNING id INTO v_match_id;

    -- 5. 요청 상태 Matched 갱신
    UPDATE public.direct_requests
    SET status = 'Matched'
    WHERE id = p_request_id;

    -- 6. 점주에게 수락 알림 발송
    SELECT * INTO v_store FROM public.stores WHERE id = v_req.store_id;
    INSERT INTO public.notifications (user_id, title, message, link_url)
    VALUES (
        v_store.owner_id,
        '직접 대타 요청 수락 알림',
        '근무자가 ' || v_store.brand_name || ' 대타 요청을 수락하여 매칭이 확정되었습니다.',
        '/matches/' || v_match_id
    );

    RETURN v_match_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C. 직접 대타 요청 거절 (근무자 불이익 없음)
CREATE OR REPLACE FUNCTION public.rpc_reject_direct_request(
    p_request_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_req public.direct_requests%ROWTYPE;
    v_store public.stores%ROWTYPE;
BEGIN
    SELECT * INTO v_req FROM public.direct_requests WHERE id = p_request_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION '요청을 찾을 수 없습니다.';
    END IF;

    IF v_req.worker_id <> auth.uid() THEN
        RAISE EXCEPTION '해당 요청을 거절할 권한이 없습니다.';
    END IF;

    IF v_req.status <> 'Pending' THEN
        RAISE EXCEPTION '대기 중인 요청만 거절할 수 있습니다.';
    END IF;

    UPDATE public.direct_requests
    SET status = 'Cancelled',
        rejection_reason = p_reason
    WHERE id = p_request_id;

    -- 점주에게 알림 (근무자 불이익/페널티 전혀 없음)
    SELECT * INTO v_store FROM public.stores WHERE id = v_req.store_id;
    INSERT INTO public.notifications (user_id, title, message, link_url)
    VALUES (
        v_store.owner_id,
        '대타 요청 미수락 안내',
        '근무자가 대타 요청에 참여하지 못했습니다. 다른 근무자를 탐색해보세요.',
        '/workers'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ---------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- (1) profiles RLS
CREATE POLICY "profiles_select_all" ON public.profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- (2) stores RLS
CREATE POLICY "stores_select_all" ON public.stores
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "stores_manage_own" ON public.stores
    FOR ALL TO authenticated USING (auth.uid() = owner_id);

-- (3) worker_experiences RLS
CREATE POLICY "experiences_select_all" ON public.worker_experiences
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "experiences_manage_own" ON public.worker_experiences
    FOR ALL TO authenticated USING (auth.uid() = worker_id);

-- (4) jobs RLS
CREATE POLICY "jobs_select_public" ON public.jobs
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "jobs_manage_by_owner" ON public.jobs
    FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.stores 
            WHERE stores.id = jobs.store_id AND stores.owner_id = auth.uid()
        )
    );

-- (5) job_applications RLS
CREATE POLICY "applications_select_parties" ON public.job_applications
    FOR SELECT TO authenticated
    USING (
        worker_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.jobs
            JOIN public.stores ON stores.id = jobs.store_id
            WHERE jobs.id = job_applications.job_id AND stores.owner_id = auth.uid()
        )
    );

CREATE POLICY "applications_insert_worker" ON public.job_applications
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "applications_update_parties" ON public.job_applications
    FOR UPDATE TO authenticated
    USING (
        worker_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.jobs
            JOIN public.stores ON stores.id = jobs.store_id
            WHERE jobs.id = job_applications.job_id AND stores.owner_id = auth.uid()
        )
    );

-- (6) direct_requests RLS
CREATE POLICY "requests_select_parties" ON public.direct_requests
    FOR SELECT TO authenticated
    USING (
        worker_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.stores 
            WHERE stores.id = direct_requests.store_id AND stores.owner_id = auth.uid()
        )
    );

CREATE POLICY "requests_insert_owner" ON public.direct_requests
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.stores 
            WHERE stores.id = direct_requests.store_id AND stores.owner_id = auth.uid()
        )
    );

CREATE POLICY "requests_update_parties" ON public.direct_requests
    FOR UPDATE TO authenticated
    USING (
        worker_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.stores 
            WHERE stores.id = direct_requests.store_id AND stores.owner_id = auth.uid()
        )
    );

-- (7) matches RLS
CREATE POLICY "matches_select_parties" ON public.matches
    FOR SELECT TO authenticated
    USING (
        worker_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.stores 
            WHERE stores.id = matches.store_id AND stores.owner_id = auth.uid()
        )
    );

CREATE POLICY "matches_update_parties" ON public.matches
    FOR UPDATE TO authenticated
    USING (
        worker_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.stores 
            WHERE stores.id = matches.store_id AND stores.owner_id = auth.uid()
        )
    );

-- (8) status_history RLS
CREATE POLICY "history_select_parties" ON public.status_history
    FOR SELECT TO authenticated USING (true);

-- (9) notifications RLS
CREATE POLICY "notifications_manage_own" ON public.notifications
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 7. PRIVACY-SAFE SECURE VIEWS
-- (매칭 확정 전 연락처 및 상세주소 마스킹 뷰)
-- ---------------------------------------------------------------------

-- 근무자 마스킹 프로필 (매칭 확정되지 않은 점주에게는 전화번호 마스킹)
CREATE OR REPLACE VIEW public.view_safe_worker_profiles AS
SELECT 
    p.id,
    p.role,
    p.name,
    CASE 
        WHEN p.id = auth.uid() THEN p.phone
        WHEN EXISTS (
            SELECT 1 FROM public.matches m
            JOIN public.stores s ON s.id = m.store_id
            WHERE m.worker_id = p.id 
              AND s.owner_id = auth.uid() 
              AND m.status IN ('Matched', 'In Progress', 'Completed')
        ) THEN p.phone
        ELSE overlay(p.phone placing '****' from 5 for 4)
    END AS display_phone,
    p.avatar_url,
    p.created_at
FROM public.profiles p
WHERE p.role = 'worker';

-- 매장 마스킹 정보 (매칭 확정 전에는 상세주소 비공개)
CREATE OR REPLACE VIEW public.view_safe_stores AS
SELECT 
    s.id,
    s.owner_id,
    s.brand_name,
    s.branch_name,
    s.address_summary,
    CASE 
        WHEN s.owner_id = auth.uid() THEN s.address_detail
        WHEN EXISTS (
            SELECT 1 FROM public.matches m
            WHERE m.store_id = s.id 
              AND m.worker_id = auth.uid() 
              AND m.status IN ('Matched', 'In Progress', 'Completed')
        ) THEN s.address_detail
        ELSE '매칭 확정 후 공개됩니다.'
    END AS display_address_detail,
    s.contact_phone,
    s.created_at
FROM public.stores s;
