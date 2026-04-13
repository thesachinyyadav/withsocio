-- Supabase SQL Schema for Internship Applications
-- Run this in your Supabase SQL Editor to create the table and storage bucket

-- Create the internship_applications table
CREATE TABLE IF NOT EXISTS internship_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    course_year_dept TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT NOT NULL,
    portfolio_link TEXT,
    role_interest TEXT NOT NULL CHECK (role_interest IN (
        'Database Handling',
        'Frontend Development',
        'Finance',
        'Operations',
        'Content Writing',
        'Marketing',
        'Legal Intern',
        'Video Editing / Videographer'
    )),
    existing_skills TEXT,
    why_consider TEXT NOT NULL,
    project_experience TEXT NOT NULL,
    startup_comfort TEXT NOT NULL CHECK (startup_comfort IN ('Yes', 'No')),
    work_sample TEXT,
    hours_per_week TEXT NOT NULL CHECK (hours_per_week IN (
        '5-10',
        '10-15',
        '15-20',
        '20-30',
        '30+'
    )),
    internship_goals TEXT NOT NULL,
    resume_url TEXT NOT NULL,
    resume_file_name TEXT NOT NULL,
    campus_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',
        'reviewed',
        'shortlisted',
        'hired',
        'alumni',
        'rejected'
    )),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on campus_id for faster filtering
CREATE INDEX idx_applications_campus_id ON internship_applications(campus_id);

-- Create an index on status for faster filtering
CREATE INDEX idx_applications_status ON internship_applications(status);

-- Create an index on role_interest for faster filtering
CREATE INDEX idx_applications_role ON internship_applications(role_interest);

-- Create an index on created_at for ordering
CREATE INDEX idx_applications_created_at ON internship_applications(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE internship_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert (for form submissions)
CREATE POLICY "Allow public inserts" ON internship_applications
    FOR INSERT
    WITH CHECK (true);

-- Policy: Only authenticated users can read
-- Change this if you want to use a different auth method
CREATE POLICY "Allow authenticated reads" ON internship_applications
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy: Only authenticated users can update status
CREATE POLICY "Allow authenticated updates" ON internship_applications
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Mailbox email state (for SOCIO Mail inbox UX)
CREATE TABLE IF NOT EXISTS mailbox_email_state (
    email_id TEXT PRIMARY KEY,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    is_starred BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mailbox_state_updated_at ON mailbox_email_state(updated_at DESC);

-- Mailbox inbound notification log (for Telegram push dedupe)
CREATE TABLE IF NOT EXISTS mailbox_notification_log (
    id BIGSERIAL PRIMARY KEY,
    event_key TEXT NOT NULL UNIQUE,
    email_id TEXT,
    message_id TEXT,
    from_email TEXT,
    subject TEXT,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mailbox_notification_received_at ON mailbox_notification_log(received_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_internship_applications_updated_at
    BEFORE UPDATE ON internship_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mailbox_email_state_updated_at ON mailbox_email_state;
CREATE TRIGGER update_mailbox_email_state_updated_at
    BEFORE UPDATE ON mailbox_email_state
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Interns admin users (proper admin management)
CREATE TABLE IF NOT EXISTS intern_admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intern_admin_users_email ON intern_admin_users(email);
CREATE INDEX IF NOT EXISTS idx_intern_admin_users_active ON intern_admin_users(is_active);

-- Interns work logs (enhanced with collaborators, attachments, timing)
CREATE TABLE IF NOT EXISTS intern_work_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    log_date DATE NOT NULL,
    work_mode TEXT NOT NULL DEFAULT 'onsite' CHECK (work_mode IN ('wfh', 'onsite')),
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

CREATE INDEX IF NOT EXISTS idx_intern_work_logs_date ON intern_work_logs(log_date DESC);
CREATE INDEX IF NOT EXISTS idx_intern_work_logs_work_mode ON intern_work_logs(work_mode);
CREATE INDEX IF NOT EXISTS idx_intern_work_logs_email ON intern_work_logs(created_by_email);
CREATE INDEX IF NOT EXISTS idx_intern_work_logs_status ON intern_work_logs(progress_status);
CREATE INDEX IF NOT EXISTS idx_intern_work_logs_created_at ON intern_work_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intern_work_logs_collaborators ON intern_work_logs USING GIN (collaborator_emails);

-- Interns reports (bug tracking with assignments)
CREATE TABLE IF NOT EXISTS intern_reports (
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

CREATE INDEX IF NOT EXISTS idx_intern_reports_category ON intern_reports(category);
CREATE INDEX IF NOT EXISTS idx_intern_reports_status ON intern_reports(status);
CREATE INDEX IF NOT EXISTS idx_intern_reports_priority ON intern_reports(priority);
CREATE INDEX IF NOT EXISTS idx_intern_reports_email ON intern_reports(created_by_email);
CREATE INDEX IF NOT EXISTS idx_intern_reports_created_at ON intern_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intern_reports_assigned_to ON intern_reports USING GIN (assigned_to_emails);

-- Internship gamification system
CREATE TABLE IF NOT EXISTS intern_gamification (
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

CREATE INDEX IF NOT EXISTS idx_intern_gamification_email ON intern_gamification(intern_email);
CREATE INDEX IF NOT EXISTS idx_intern_gamification_points ON intern_gamification(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_intern_gamification_streak ON intern_gamification(current_streak DESC);

-- Work session tracking (for timing analytics)
CREATE TABLE IF NOT EXISTS intern_work_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    intern_email TEXT NOT NULL,
    session_date DATE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INT,
    work_log_id UUID REFERENCES intern_work_logs(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intern_work_sessions_email ON intern_work_sessions(intern_email);
CREATE INDEX IF NOT EXISTS idx_intern_work_sessions_date ON intern_work_sessions(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_intern_work_sessions_work_log ON intern_work_sessions(work_log_id);

-- Email templates for Resend
CREATE TABLE IF NOT EXISTS intern_email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    html_template TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    created_by_admin_email TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intern_email_templates_name ON intern_email_templates(name);
CREATE INDEX IF NOT EXISTS idx_intern_email_templates_active ON intern_email_templates(is_active);

-- Email send log
CREATE TABLE IF NOT EXISTS intern_email_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    template_id UUID REFERENCES intern_email_templates(id),
    sent_by_admin_email TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
    resend_message_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intern_email_log_recipient ON intern_email_log(recipient_email);
CREATE INDEX IF NOT EXISTS idx_intern_email_log_sent_at ON intern_email_log(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_intern_email_log_template ON intern_email_log(template_id);

-- Admin audit log (enhanced)
CREATE TABLE IF NOT EXISTS intern_admin_audit (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_email TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('work_log', 'report', 'assignment', 'email')),
    target_id UUID,
    old_status TEXT,
    new_status TEXT,
    assigned_to_email TEXT,
    notes TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intern_admin_audit_actor ON intern_admin_audit(actor_email);
CREATE INDEX IF NOT EXISTS idx_intern_admin_audit_target ON intern_admin_audit(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_intern_admin_audit_created_at ON intern_admin_audit(created_at DESC);

-- Updated at trigger
DROP TRIGGER IF EXISTS update_intern_work_logs_updated_at ON intern_work_logs;
CREATE TRIGGER update_intern_work_logs_updated_at
    BEFORE UPDATE ON intern_work_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_intern_reports_updated_at ON intern_reports;
CREATE TRIGGER update_intern_reports_updated_at
    BEFORE UPDATE ON intern_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_intern_gamification_updated_at ON intern_gamification;
CREATE TRIGGER update_intern_gamification_updated_at
    BEFORE UPDATE ON intern_gamification
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_intern_admin_users_updated_at ON intern_admin_users;
CREATE TRIGGER update_intern_admin_users_updated_at
    BEFORE UPDATE ON intern_admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- IMPORTANT: Update role_interest CHECK constraint if table exists
ALTER TABLE internship_applications
    DROP CONSTRAINT IF EXISTS internship_applications_role_interest_check;

ALTER TABLE internship_applications
    ADD CONSTRAINT internship_applications_role_interest_check
    CHECK (role_interest IN (
        'Database Handling',
        'Frontend Development',
        'Finance',
        'Operations',
        'Content Writing',
        'Marketing',
        'Legal Intern',
        'Video Editing / Videographer'
    ));

-- IMPORTANT: Update status CHECK constraint if table exists
ALTER TABLE internship_applications
    DROP CONSTRAINT IF EXISTS internship_applications_status_check;

ALTER TABLE internship_applications
    ADD CONSTRAINT internship_applications_status_check
    CHECK (status IN (
        'pending',
        'reviewed',
        'shortlisted',
        'hired',
        'alumni',
        'rejected'
    ));

-- Storage bucket for resumes (run this in Supabase Dashboard -> Storage)
-- Create a bucket named 'internship-resumes'
-- Set it to public or use signed URLs for access

/*
STORAGE SETUP INSTRUCTIONS:
1. Go to Supabase Dashboard -> Storage
2. Create a new bucket named 'internship-resumes'
3. Make it public if you want direct download links, or keep it private and use signed URLs
4. Add the following storage policy to allow uploads:

-- Allow anyone to upload files
CREATE POLICY "Allow public uploads" ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'internship-resumes');

-- Allow anyone to read files (if public bucket)
CREATE POLICY "Allow public reads" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'internship-resumes');
*/
