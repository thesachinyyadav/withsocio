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
