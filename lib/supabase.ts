import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==================== INTERNSHIP APPLICATION TYPES ====================
export interface InternshipApplication {
  id: string;
  full_name: string;
  course_year_dept: string;
  phone_number: string;
  email: string;
  portfolio_link: string | null;
  role_interest: string;
  existing_skills: string | null;
  why_consider: string;
  project_experience: string;
  startup_comfort: "Yes" | "No";
  work_sample: string | null;
  hours_per_week: string;
  internship_goals: string;
  resume_url: string;
  resume_file_name: string;
  campus_id: string;
  status: "pending" | "reviewed" | "shortlisted" | "hired" | "rejected";
  created_at: string;
  updated_at: string;
}

// ==================== INTERNS WORKSPACE TYPES ====================

export interface InternAdminUser {
  id: string;
  email: string;
  full_name: string;
  password_hash: string;
  role: "super_admin" | "admin";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: "file" | "drive_link" | "image";
  size?: number;
}

export interface InternWorkLog {
  id: string;
  log_date: string;
  title: string;
  description: string;
  collaborator_emails: string[];
  progress_status: "submitted" | "in_progress" | "completed" | "blocked" | "reviewed";
  created_by_email: string;
  admin_notes: string | null;
  attachments: Attachment[];
  work_start_time: string | null;
  work_end_time: string | null;
  total_hours: number | null;
  created_at: string;
  updated_at: string;
}

export interface InternReport {
  id: string;
  category: "bug" | "problem";
  title: string;
  details: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  created_by_email: string;
  assigned_to_emails: string[];
  admin_notes: string | null;
  attachments: Attachment[];
  created_at: string;
  updated_at: string;
}

export interface InternAdminAudit {
  id: string;
  actor_email: string;
  action: string;
  target_type: "work_log" | "report" | "assignment" | "email";
  target_id: string | null;
  old_status: string | null;
  new_status: string | null;
  assigned_to_email: string | null;
  notes: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface InternGamification {
  id: string;
  intern_email: string;
  total_points: number;
  work_logs_submitted: number;
  reports_resolved: number;
  current_streak: number;
  max_streak: number;
  last_activity_date: string | null;
  badges: string[];
  created_at: string;
  updated_at: string;
}

export interface InternWorkSession {
  id: string;
  intern_email: string;
  session_date: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  work_log_id: string | null;
  created_at: string;
}

export interface InternEmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_template: string;
  variables: string[];
  created_by_admin_email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InternEmailLog {
  id: string;
  recipient_email: string;
  subject: string;
  template_id: string | null;
  sent_by_admin_email: string;
  sent_at: string;
  status: "sent" | "failed" | "bounced";
  resend_message_id: string | null;
  created_at: string;
}

// ==================== HELPER FUNCTIONS ====================

export async function submitApplication(
  formData: Omit<InternshipApplication, "id" | "status" | "created_at" | "updated_at">,
  resumeFile: File
) {
  try {
    const fileExt = resumeFile.name.split(".").pop();
    const fileName = `${formData.campus_id}_${Date.now()}.${fileExt}`;
    const filePath = `resumes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("internship-resumes")
      .upload(filePath, resumeFile);

    if (uploadError) {
      throw new Error("Failed to upload resume: " + uploadError.message);
    }

    const { data: urlData } = supabase.storage
      .from("internship-resumes")
      .getPublicUrl(filePath);

    const { data, error } = await supabase
      .from("internship_applications")
      .insert({
        ...formData,
        resume_url: urlData.publicUrl,
        resume_file_name: resumeFile.name,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      throw new Error("Failed to submit application: " + error.message);
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error submitting application:", error);
    return { success: false, error };
  }
}
    .from("internship_applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching applications:", error);
    return [];
  }

  return data as InternshipApplication[];
}

export async function getApplicationById(id: string) {
  const { data, error } = await supabase
    .from("internship_applications")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching application:", error);
    return null;
  }

  return data as InternshipApplication;
}

export async function updateApplicationStatus(
  id: string,
  status: InternshipApplication["status"]
) {
  const { data, error } = await supabase
    .from("internship_applications")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating status:", error);
    return null;
  }

  return data as InternshipApplication;
}

export async function getApplicationsByCampus(campusId: string) {
  const { data, error } = await supabase
    .from("internship_applications")
    .select("*")
    .eq("campus_id", campusId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching applications:", error);
    return [];
  }

  return data as InternshipApplication[];
}

export async function getResumeDownloadUrl(resumePath: string) {
  const { data, error } = await supabase.storage
    .from("internship-resumes")
    .createSignedUrl(resumePath, 3600); // URL valid for 1 hour

  if (error) {
    console.error("Error getting download URL:", error);
    return null;
  }

  return data.signedUrl;
}
