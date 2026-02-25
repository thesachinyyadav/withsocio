import { createClient } from "@supabase/supabase-js";

// TODO: Replace with your Supabase project credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for the internship_applications table
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

// Helper functions for CRUD operations

export async function submitApplication(
  formData: Omit<InternshipApplication, "id" | "status" | "created_at" | "updated_at">,
  resumeFile: File
) {
  try {
    // 1. Upload resume to Supabase Storage
    const fileExt = resumeFile.name.split(".").pop();
    const fileName = `${formData.campus_id}_${Date.now()}.${fileExt}`;
    const filePath = `resumes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("internship-resumes")
      .upload(filePath, resumeFile);

    if (uploadError) {
      throw new Error("Failed to upload resume: " + uploadError.message);
    }

    // 2. Get public URL for the resume
    const { data: urlData } = supabase.storage
      .from("internship-resumes")
      .getPublicUrl(filePath);

    // 3. Insert application data
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

export async function getAllApplications() {
  const { data, error } = await supabase
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
