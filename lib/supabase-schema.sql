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
        'Operations',
        'Content Writing',
        'Marketing',
        'Digital Marketing',
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

-- Interns work logs (used by /interns workspace)
CREATE TABLE IF NOT EXISTS intern_work_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    log_date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    collaborated_with TEXT,
    progress_status TEXT NOT NULL DEFAULT 'submitted' CHECK (progress_status IN (
        'submitted',
        'in_progress',
        'completed',
        'blocked',
        'reviewed'
    )),
    created_by_email TEXT NOT NULL,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intern_work_logs_date ON intern_work_logs(log_date DESC);
CREATE INDEX IF NOT EXISTS idx_intern_work_logs_email ON intern_work_logs(created_by_email);
CREATE INDEX IF NOT EXISTS idx_intern_work_logs_status ON intern_work_logs(progress_status);
CREATE INDEX IF NOT EXISTS idx_intern_work_logs_created_at ON intern_work_logs(created_at DESC);

-- Intern reports for feature/bug/issue/problem submissions
CREATE TABLE IF NOT EXISTS intern_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT NOT NULL CHECK (category IN (
        'feature',
        'bug',
        'issue',
        'problem'
    )),
    title TEXT NOT NULL,
    details TEXT NOT NULL,
    work_status TEXT NOT NULL DEFAULT 'open' CHECK (work_status IN (
        'open',
        'in_progress',
        'resolved',
        'closed'
    )),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN (
        'low',
        'medium',
        'high',
        'critical'
    )),
    created_by_email TEXT NOT NULL,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intern_reports_category ON intern_reports(category);
CREATE INDEX IF NOT EXISTS idx_intern_reports_status ON intern_reports(work_status);
CREATE INDEX IF NOT EXISTS idx_intern_reports_priority ON intern_reports(priority);
CREATE INDEX IF NOT EXISTS idx_intern_reports_email ON intern_reports(created_by_email);
CREATE INDEX IF NOT EXISTS idx_intern_reports_created_at ON intern_reports(created_at DESC);

-- Admin audit log for interns workspace actions
CREATE TABLE IF NOT EXISTS intern_admin_audit (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('work_log', 'report')),
    target_id UUID NOT NULL,
    old_status TEXT,
    new_status TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intern_admin_audit_target ON intern_admin_audit(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_intern_admin_audit_created_at ON intern_admin_audit(created_at DESC);

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

-- IMPORTANT: If table already exists, update role_interest CHECK constraint in place.
-- (CREATE TABLE IF NOT EXISTS does not modify existing constraints.)
ALTER TABLE internship_applications
    DROP CONSTRAINT IF EXISTS internship_applications_role_interest_check;

ALTER TABLE internship_applications
    ADD CONSTRAINT internship_applications_role_interest_check
    CHECK (role_interest IN (
        'Database Handling',
        'Frontend Development',
        'Operations',
        'Content Writing',
        'Marketing',
        'Digital Marketing',
        'Legal Intern',
        'Video Editing / Videographer'
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
