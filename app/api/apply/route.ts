import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Client for storage operations (uses anon key)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Client for database operations (uses service role key for elevated privileges)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract form fields
    const fullName = formData.get("fullName") as string;
    const courseYearDept = formData.get("courseYearDept") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const email = formData.get("email") as string;
    const portfolioLink = formData.get("portfolioLink") as string;
    const roleInterest = formData.get("roleInterest") as string;
    const existingSkills = formData.get("existingSkills") as string;
    const whyConsider = formData.get("whyConsider") as string;
    const projectExperience = formData.get("projectExperience") as string;
    const startupComfort = formData.get("startupComfort") as string;
    const workSample = formData.get("workSample") as string;
    const hoursPerWeek = formData.get("hoursPerWeek") as string;
    const internshipGoals = formData.get("internshipGoals") as string;
    const campusId = formData.get("campusId") as string;
    const resumeFile = formData.get("resume") as File;

    if (!resumeFile || !fullName || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Upload resume to Supabase Storage
    const fileExt = resumeFile.name.split(".").pop();
    const fileName = `${campusId}_${Date.now()}_${fullName.replace(/\s+/g, "_")}.${fileExt}`;
    const filePath = `resumes/${fileName}`;

    const fileBuffer = await resumeFile.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("internship-resumes")
      .upload(filePath, fileBuffer, {
        contentType: resumeFile.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload resume: " + uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL for the resume
    const { data: urlData } = supabase.storage
      .from("internship-resumes")
      .getPublicUrl(filePath);

    // Insert application data into Supabase using admin client
    const { data, error: insertError } = await supabaseAdmin
      .from("internship_applications")
      .insert({
        full_name: fullName,
        course_year_dept: courseYearDept,
        phone_number: phoneNumber,
        email: email,
        portfolio_link: portfolioLink || null,
        role_interest: roleInterest,
        existing_skills: existingSkills || null,
        why_consider: whyConsider,
        project_experience: projectExperience,
        startup_comfort: startupComfort,
        work_sample: workSample || null,
        hours_per_week: hoursPerWeek,
        internship_goals: internshipGoals,
        resume_url: urlData.publicUrl,
        resume_file_name: resumeFile.name,
        campus_id: campusId,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save application: " + insertError.message },
        { status: 500 }
      );
    }

    // Send confirmation email using Resend
    try {
      const firstName = fullName.split(" ")[0];
      
      await resend.emails.send({
        from: "Careers <careers@withsocio.com>",
        to: email,
        subject: "Thank You for Applying at SOCIO! 🎉",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #154CB3 0%, #0a2d6b 100%); padding: 40px 30px; text-align: center;">
                <div style="display: inline-block; background-color: white; width: 60px; height: 60px; border-radius: 12px; line-height: 60px; margin-bottom: 15px;">
                  <span style="color: #154CB3; font-size: 28px; font-weight: bold;">W</span>
                </div>
                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Application Received!</h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <p style="color: #333; font-size: 18px; margin: 0 0 20px 0;">
                  Hi <strong>${firstName}</strong>,
                </p>
                
                <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                  Thank you for applying at <strong>SOCIO</strong>! We're excited to have received your application for the <strong>${roleInterest}</strong> internship position.
                </p>
                
                <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                  Our team will carefully review your application, and if shortlisted, we will be contacting you <strong>within this week</strong>. The next step would be a personal interview, post which we will start operations within this month.
                </p>
                
                <div style="background-color: #f8f9fa; border-left: 4px solid #154CB3; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                  <p style="color: #333; font-size: 14px; margin: 0;">
                    <strong>What's Next?</strong><br><br>
                    ✅ Application Review<br>
                    📞 Personal Interview (if shortlisted)<br>
                    🚀 Start Operations
                  </p>
                </div>
                
                <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;">
                  Thank you for your interest in joining our team!
                </p>
                
                <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
                  With love,<br>
                  <strong style="color: #154CB3;">Team SOCIO</strong>
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #1a1a1a; padding: 25px 30px; text-align: center;">
                <p style="color: #888; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} SOCIO. All rights reserved.
                </p>
                <p style="color: #666; font-size: 11px; margin: 10px 0 0 0;">
                  This email was sent to ${email} because you applied for an internship at SOCIO.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error("Email error:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully",
      applicationId: data.id,
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
