-- SOCIO Workspace: Interns DB bootstrap (idempotent)
-- Safe to run multiple times.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- Base table used by auth resolver (if not already present)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.internship_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    status TEXT,
    role_interest TEXT,
    portfolio_link TEXT,
    hours_per_week INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Interns workspace tables
-- =====================================================
CREATE TABLE IF NOT EXISTS public.intern_admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.intern_work_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    log_date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    collaborator_emails TEXT[] NOT NULL DEFAULT '{}',
    progress_status TEXT NOT NULL DEFAULT 'submitted' CHECK (progress_status IN (
        'submitted',
        'in_progress',
        'completed',
        'blocked',
        'reviewed'
    )),
    created_by_email TEXT NOT NULL,
    admin_notes TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    work_start_time TIMESTAMP WITH TIME ZONE,
    work_end_time TIMESTAMP WITH TIME ZONE,
    total_hours NUMERIC(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.intern_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT NOT NULL CHECK (category IN ('bug', 'problem')),
    title TEXT NOT NULL,
    details TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    created_by_email TEXT NOT NULL,
    assigned_to_emails TEXT[] DEFAULT '{}',
    admin_notes TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.intern_gamification (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    intern_email TEXT NOT NULL UNIQUE,
    total_points INT DEFAULT 0,
    work_logs_submitted INT DEFAULT 0,
    reports_resolved INT DEFAULT 0,
    current_streak INT DEFAULT 0,
    max_streak INT DEFAULT 0,
    last_activity_date DATE,
    badges TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.intern_work_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    intern_email TEXT NOT NULL,
    session_date DATE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INT,
    work_log_id UUID REFERENCES public.intern_work_logs(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.intern_email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    key TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.intern_email_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    template_id UUID REFERENCES public.intern_email_templates(id) ON DELETE SET NULL,
    sent_by_admin_email TEXT,
    resend_message_id TEXT,
    status TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.intern_admin_audit (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_email TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID,
    old_status TEXT,
    new_status TEXT,
    assigned_to_email TEXT,
    notes TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Compatibility patching for older schemas
-- =====================================================

-- intern_reports: work_status -> status
DO $$
BEGIN
  IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='intern_reports' AND column_name='work_status'
  ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='intern_reports' AND column_name='status'
  ) THEN
      ALTER TABLE public.intern_reports RENAME COLUMN work_status TO status;
  END IF;
END $$;

-- intern_work_logs: collaborated_with -> collaborator_emails (legacy text -> text[])
ALTER TABLE public.intern_work_logs ADD COLUMN IF NOT EXISTS collaborator_emails TEXT[] DEFAULT '{}';
DO $$
BEGIN
  IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='intern_work_logs' AND column_name='collaborated_with'
  ) THEN
      UPDATE public.intern_work_logs
      SET collaborator_emails = CASE
          WHEN collaborated_with IS NULL OR btrim(collaborated_with) = '' THEN '{}'
          ELSE ARRAY[btrim(collaborated_with)]
      END
      WHERE (collaborator_emails IS NULL OR cardinality(collaborator_emails) = 0);
  END IF;
END $$;

-- Ensure all expected columns exist (safe no-op if present)
ALTER TABLE public.intern_work_logs ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.intern_work_logs ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.intern_work_logs ADD COLUMN IF NOT EXISTS work_start_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.intern_work_logs ADD COLUMN IF NOT EXISTS work_end_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.intern_work_logs ADD COLUMN IF NOT EXISTS total_hours NUMERIC(5,2);
ALTER TABLE public.intern_work_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE public.intern_reports ADD COLUMN IF NOT EXISTS assigned_to_emails TEXT[] DEFAULT '{}';
ALTER TABLE public.intern_reports ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.intern_reports ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.intern_reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE public.intern_gamification ADD COLUMN IF NOT EXISTS work_logs_submitted INT DEFAULT 0;
ALTER TABLE public.intern_gamification ADD COLUMN IF NOT EXISTS reports_resolved INT DEFAULT 0;
ALTER TABLE public.intern_gamification ADD COLUMN IF NOT EXISTS current_streak INT DEFAULT 0;
ALTER TABLE public.intern_gamification ADD COLUMN IF NOT EXISTS max_streak INT DEFAULT 0;
ALTER TABLE public.intern_gamification ADD COLUMN IF NOT EXISTS last_activity_date DATE;
ALTER TABLE public.intern_gamification ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}';
ALTER TABLE public.intern_gamification ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE public.intern_admin_users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.intern_admin_users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.intern_admin_users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';
ALTER TABLE public.intern_admin_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.intern_admin_users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.intern_admin_audit ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.intern_admin_audit ADD COLUMN IF NOT EXISTS actor_email TEXT;
ALTER TABLE public.intern_admin_audit ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE public.intern_admin_audit ADD COLUMN IF NOT EXISTS target_type TEXT;
ALTER TABLE public.intern_admin_audit ADD COLUMN IF NOT EXISTS target_id UUID;
ALTER TABLE public.intern_admin_audit ADD COLUMN IF NOT EXISTS old_status TEXT;
ALTER TABLE public.intern_admin_audit ADD COLUMN IF NOT EXISTS new_status TEXT;
ALTER TABLE public.intern_admin_audit ADD COLUMN IF NOT EXISTS assigned_to_email TEXT;
ALTER TABLE public.intern_admin_audit ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.intern_admin_audit ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.intern_admin_audit ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.intern_email_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.intern_email_log ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.intern_work_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.intern_admin_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_intern_admin_users_email ON public.intern_admin_users(email);
CREATE INDEX IF NOT EXISTS idx_intern_admin_users_active ON public.intern_admin_users(is_active);

CREATE INDEX IF NOT EXISTS idx_intern_work_logs_date ON public.intern_work_logs(log_date DESC);
CREATE INDEX IF NOT EXISTS idx_intern_work_logs_email ON public.intern_work_logs(created_by_email);
CREATE INDEX IF NOT EXISTS idx_intern_work_logs_status ON public.intern_work_logs(progress_status);
CREATE INDEX IF NOT EXISTS idx_intern_work_logs_created_at ON public.intern_work_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intern_work_logs_collaborators ON public.intern_work_logs USING GIN (collaborator_emails);

CREATE INDEX IF NOT EXISTS idx_intern_reports_category ON public.intern_reports(category);
CREATE INDEX IF NOT EXISTS idx_intern_reports_status ON public.intern_reports(status);
CREATE INDEX IF NOT EXISTS idx_intern_reports_priority ON public.intern_reports(priority);
CREATE INDEX IF NOT EXISTS idx_intern_reports_email ON public.intern_reports(created_by_email);
CREATE INDEX IF NOT EXISTS idx_intern_reports_created_at ON public.intern_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intern_reports_assigned_to ON public.intern_reports USING GIN (assigned_to_emails);

CREATE INDEX IF NOT EXISTS idx_intern_gamification_email ON public.intern_gamification(intern_email);
CREATE INDEX IF NOT EXISTS idx_intern_gamification_points ON public.intern_gamification(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_intern_gamification_streak ON public.intern_gamification(current_streak DESC);

CREATE INDEX IF NOT EXISTS idx_intern_admin_audit_actor ON public.intern_admin_audit(actor_email);
CREATE INDEX IF NOT EXISTS idx_intern_admin_audit_target ON public.intern_admin_audit(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_intern_admin_audit_created_at ON public.intern_admin_audit(created_at DESC);

-- =====================================================
-- Updated-at trigger function + triggers
-- =====================================================
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_intern_admin_users_updated_at ON public.intern_admin_users;
CREATE TRIGGER update_intern_admin_users_updated_at
BEFORE UPDATE ON public.intern_admin_users
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS update_intern_work_logs_updated_at ON public.intern_work_logs;
CREATE TRIGGER update_intern_work_logs_updated_at
BEFORE UPDATE ON public.intern_work_logs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS update_intern_reports_updated_at ON public.intern_reports;
CREATE TRIGGER update_intern_reports_updated_at
BEFORE UPDATE ON public.intern_reports
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS update_intern_gamification_updated_at ON public.intern_gamification;
CREATE TRIGGER update_intern_gamification_updated_at
BEFORE UPDATE ON public.intern_gamification
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS update_intern_work_sessions_updated_at ON public.intern_work_sessions;
CREATE TRIGGER update_intern_work_sessions_updated_at
BEFORE UPDATE ON public.intern_work_sessions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS update_intern_email_templates_updated_at ON public.intern_email_templates;
CREATE TRIGGER update_intern_email_templates_updated_at
BEFORE UPDATE ON public.intern_email_templates
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS update_intern_email_log_updated_at ON public.intern_email_log;
CREATE TRIGGER update_intern_email_log_updated_at
BEFORE UPDATE ON public.intern_email_log
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS update_intern_admin_audit_updated_at ON public.intern_admin_audit;
CREATE TRIGGER update_intern_admin_audit_updated_at
BEFORE UPDATE ON public.intern_admin_audit
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

COMMIT;
