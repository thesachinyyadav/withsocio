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
    const preference1 = formData.get("preference1") as string;
    const preference2 = formData.get("preference2") as string;
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
        preference1: preference1 || null,
        preference2: preference2 || null,
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
      
      const plainTextContent = `
Hello ${firstName},

Thank you for submitting your application for the ${roleInterest} position at SOCIO. We're impressed by your interest and excited to review your profile.

APPLICATION STATUS: Under Review

Our team will carefully evaluate your application this week. If your profile matches our requirements, we'll reach out for an interview this week or next week.

TIMELINE:
1. Application Review - This week
2. Interview - This/Next week  
3. Onboarding - If selected

In the meantime, feel free to explore our work and learn more about SOCIO. If you have any questions, don't hesitate to reach out at careers@withsocio.com.

Best regards,
Team SOCIO
careers@withsocio.com

---
This is an automated message. Please do not reply to this email.
© ${new Date().getFullYear()} SOCIO. All rights reserved.
To unsubscribe from career emails, reply to this email with "UNSUBSCRIBE".
      `.trim();
      
      await resend.emails.send({
        from: "SOCIO Careers <careers@withsocio.com>",
        to: email,
        cc: "thesocio.blr@gmail.com",
        replyTo: "careers@withsocio.com",
        subject: `Application Received - ${roleInterest} Role at SOCIO`,
        headers: {
          "List-Unsubscribe": "<mailto:careers@withsocio.com?subject=UNSUBSCRIBE>",
        },
        text: plainTextContent,
        html: `
          <!DOCTYPE html>
          <html lang="en" xmlns="http://www.w3.org/1999/xhtml">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <title>Application Confirmed</title>
            <style>
              body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; }
              table { border-collapse: collapse; width: 100%; }
              img { max-width: 100%; height: auto; display: block; }
              a { color: #154CB3; text-decoration: none; }
              a:hover { text-decoration: underline; }
            </style>
          </head>
          <body style="background-color: #f7f9fc;">
            <table style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #154CB3 0%, #1a56c4 100%); padding: 40px 30px; text-align: center;">
                  <div style="font-size: 24px; font-weight: 700; color: white; margin-bottom: 10px;">SOCIO</div>
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">Application Confirmed</h1>
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="margin: 0 0 20px 0; font-size: 16px; color: #555;">Hello <strong>${firstName}</strong>,</p>
                  
                  <p style="margin: 0 0 20px 0; font-size: 15px; color: #666; line-height: 1.8;">
                    Thank you for submitting your application for the <strong>${roleInterest}</strong> position at SOCIO. We're impressed by your interest and excited to review your profile.
                  </p>

                  <!-- Status Box -->
                  <table style="width: 100%; margin: 30px 0; background-color: #f0f4ff; border-radius: 8px; padding: 20px; border-left: 4px solid #154CB3;">
                    <tr>
                      <td style="padding: 0;">
                        <p style="margin: 0; font-size: 12px; color: #667085; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Application Status</p>
                        <p style="margin: 8px 0 0 0; font-size: 18px; color: #154CB3; font-weight: 700;">Under Review</p>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 0 0 20px 0; font-size: 15px; color: #666; line-height: 1.8;">
                    Our team will carefully evaluate your application this week. If your profile matches our requirements, we'll reach out for an interview this week or next week.
                  </p>

                  <!-- Timeline -->
                  <table style="width: 100%; margin: 30px 0;">
                    <tr>
                      <td style="padding: 15px; text-align: center; background-color: #f7f9fc; border-radius: 8px;">
                        <div style="font-size: 24px; color: #154CB3; font-weight: 700; margin-bottom: 5px;">1</div>
                        <div style="font-size: 13px; color: #667085; font-weight: 600;">Application Review</div>
                        <div style="font-size: 12px; color: #999; margin-top: 4px;">This week</div>
                      </td>
                      <td style="padding: 0 10px; text-align: center; color: #ccc;">→</td>
                      <td style="padding: 15px; text-align: center; background-color: #f7f9fc; border-radius: 8px;">
                        <div style="font-size: 24px; color: #154CB3; font-weight: 700; margin-bottom: 5px;">2</div>
                        <div style="font-size: 13px; color: #667085; font-weight: 600;">Interview</div>
                        <div style="font-size: 12px; color: #999; margin-top: 4px;">This/Next week</div>
                      </td>
                      <td style="padding: 0 10px; text-align: center; color: #ccc;">→</td>
                      <td style="padding: 15px; text-align: center; background-color: #f7f9fc; border-radius: 8px;">
                        <div style="font-size: 24px; color: #154CB3; font-weight: 700; margin-bottom: 5px;">3</div>
                        <div style="font-size: 13px; color: #667085; font-weight: 600;">Onboarding</div>
                        <div style="font-size: 12px; color: #999; margin-top: 4px;">If selected</div>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 30px 0 20px 0; font-size: 15px; color: #666; line-height: 1.8;">
                    In the meantime, feel free to explore our work and learn more about SOCIO. If you have any questions, don't hesitate to reach out.
                  </p>

                  <p style="margin: 0; font-size: 15px; color: #666;">
                    Best regards,<br>
                    <strong style="color: #154CB3; font-size: 16px;">Team SOCIO</strong><br>
                    <span style="font-size: 13px; color: #999;">careers@withsocio.com</span>
                  </p>
                </td>
              </tr>

              <!-- Divider -->
              <tr>
                <td style="height: 1px; background-color: #e5e7eb;"></td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 25px 30px; background-color: #f7f9fc; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #999;">
                    This is an automated message. Please do not reply to this email.
                  </p>
                  <p style="margin: 10px 0 0 0; font-size: 11px; color: #bbb;">
                    © ${new Date().getFullYear()} SOCIO. All rights reserved. | 
                    <a href="https://socio.christuniversity.in" style="color: #999;">Visit our website</a>
                  </p>
                  <p style="margin: 10px 0 0 0; font-size: 11px;">
                    <a href="mailto:careers@withsocio.com?subject=UNSUBSCRIBE" style="color: #999;">Unsubscribe from career emails</a>
                  </p>
                </td>
              </tr>
            </table>
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
