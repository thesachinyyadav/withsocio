import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const getAdminPassword = () =>
  process.env.ADMIN_DASHBOARD_PASSWORD || "socio2026";

const isAuthorized = (request: Request) => {
  const headerPassword = request.headers.get("x-admin-password");
  return headerPassword && headerPassword === getAdminPassword();
};

const baseUrl = "https://socio.christuniversity.in";

const templates = {
  shortlisted: ({ firstName, role }: { firstName: string; role: string }) => ({
    subject: `Shortlisted - ${role} Internship at SOCIO`,
    text: `Hello ${firstName},

Great news! You've been shortlisted for the ${role} internship at SOCIO.

** YOUR INTERVIEWS WILL BE SCHEDULED IN THE UPCOMING WEEK **
Please stay active - the schedule and venue will be sent via email.

Please keep an eye on your email and phone for updates.

Visit: ${baseUrl}

Best regards,
Team SOCIO

---
© ${new Date().getFullYear()} SOCIO. All rights reserved.
To unsubscribe from career emails, reply to careers@withsocio.com with subject "UNSUBSCRIBE".`,
    html: `
      <!DOCTYPE html>
      <html lang="en" xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Shortlisted</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f7f9fc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',sans-serif;color:#333;">
        <table style="max-width:600px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#154CB3 0%,#1a56c4 100%);padding:32px;text-align:center;">
              <div style="font-size:24px;font-weight:700;color:#fff;">SOCIO</div>
              <h1 style="margin:8px 0 0 0;color:#fff;font-size:26px;">You’re Shortlisted</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px 0;font-size:16px;color:#555;">Hello <strong>${firstName}</strong>,</p>
              <p style="margin:0 0 16px 0;font-size:15px;color:#666;line-height:1.7;">
                Great news! You’ve been shortlisted for the <strong>${role}</strong> internship at SOCIO.
              </p>
              <div style="background-color:#e8f4f8;border-left:4px solid #154CB3;padding:16px;border-radius:4px;margin:16px 0;">
                <p style="margin:0;font-size:15px;color:#154CB3;line-height:1.6;">
                  <strong style="font-size:16px;">YOUR INTERVIEWS WILL BE SCHEDULED IN THE UPCOMING WEEK.</strong><br><br>
                  Please stay active - the schedule and venue will be sent via email.
                </p>
              </div>
              <p style="margin:0 0 20px 0;font-size:15px;color:#666;line-height:1.7;">
                Please keep an eye on your email and phone for updates.
              </p>
              <a href="${baseUrl}" style="display:inline-block;padding:10px 16px;background:#154CB3;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">Visit SOCIO</a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#f7f9fc;text-align:center;font-size:11px;color:#999;">
              © ${new Date().getFullYear()} SOCIO. All rights reserved. | 
              <a href="mailto:careers@withsocio.com?subject=UNSUBSCRIBE" style="color:#999;">Unsubscribe</a>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  }),
  selected: ({ firstName, role }: { firstName: string; role: string }) => ({
    subject: `Selected - ${role} Internship at SOCIO`,
    text: `Hello ${firstName},

Congratulations! You've been selected for the ${role} internship at SOCIO.
We'll share onboarding details shortly.

Please keep an eye on your email and phone for the onboarding schedule.

Visit: ${baseUrl}

Best regards,
Team SOCIO

---
© ${new Date().getFullYear()} SOCIO. All rights reserved.
To unsubscribe from career emails, reply to careers@withsocio.com with subject "UNSUBSCRIBE".`,
    html: `
      <!DOCTYPE html>
      <html lang="en" xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Selected</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f7f9fc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',sans-serif;color:#333;">
        <table style="max-width:600px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#154CB3 0%,#1a56c4 100%);padding:32px;text-align:center;">
              <div style="font-size:24px;font-weight:700;color:#fff;">SOCIO</div>
              <h1 style="margin:8px 0 0 0;color:#fff;font-size:26px;">You’re Selected</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px 0;font-size:16px;color:#555;">Hello <strong>${firstName}</strong>,</p>
              <p style="margin:0 0 16px 0;font-size:15px;color:#666;line-height:1.7;">
                Congratulations! You’ve been selected for the <strong>${role}</strong> internship at SOCIO.
                We’ll share onboarding details shortly.
              </p>
              <p style="margin:0 0 20px 0;font-size:15px;color:#666;line-height:1.7;">
                Please keep an eye on your email and phone for the onboarding schedule.
              </p>
              <a href="${baseUrl}" style="display:inline-block;padding:10px 16px;background:#154CB3;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">Visit SOCIO</a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#f7f9fc;text-align:center;font-size:11px;color:#999;">
              © ${new Date().getFullYear()} SOCIO. All rights reserved. | 
              <a href="mailto:careers@withsocio.com?subject=UNSUBSCRIBE" style="color:#999;">Unsubscribe</a>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  }),
  rejected: ({ firstName, role }: { firstName: string; role: string }) => ({
    subject: `Application Status - ${role} Internship at SOCIO`,
    text: `Hello ${firstName},

Thank you for your interest in the ${role} internship position at SOCIO.

NOT SHORTLISTED

We are sorry that we will not be going ahead with your application at this time. We truly appreciate the time and effort you took to apply.

We encourage you to remain connected with us. We will retain your profile and consider you for future opportunities at SOCIO that align with your skills and experience. Should a suitable position become available, we will reach out to you directly.

Thank you once again for considering SOCIO!

Best regards,
Team SOCIO
careers@withsocio.com

---
© ${new Date().getFullYear()} SOCIO. All rights reserved.
To unsubscribe from career emails, reply to careers@withsocio.com with subject "UNSUBSCRIBE".`,
    html: `
      <!DOCTYPE html>
      <html lang="en" xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Application Status</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f7f9fc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',sans-serif;color:#333;">
        <table style="max-width:600px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#154CB3 0%,#1a56c4 100%);padding:32px;text-align:center;">
              <div style="font-size:24px;font-weight:700;color:#fff;">SOCIO</div>
              <h1 style="margin:8px 0 0 0;color:#fff;font-size:26px;">Application Status</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px 0;font-size:16px;color:#555;">Hello <strong>${firstName}</strong>,</p>
              
              <p style="margin:0 0 20px 0;font-size:15px;color:#666;line-height:1.7;">
                Thank you for your interest in the <strong>${role}</strong> internship position at SOCIO.
              </p>

              <div style="background-color:#ffe6e6;border:2px solid #ff6b6b;border-radius:8px;padding:20px;margin:24px 0;">
                <p style="margin:0 0 12px 0;font-size:12px;color:#c92a2a;font-weight:700;text-transform:uppercase;letter-spacing:1px;text-align:center;">Not Shortlisted</p>
                <p style="margin:0;font-size:15px;color:#c92a2a;line-height:1.6;text-align:center;font-weight:600;">
                  We are sorry that we will not be going ahead with your application at this time.
                </p>
              </div>

              <p style="margin:20px 0 16px 0;font-size:15px;color:#666;line-height:1.7;">
                We truly appreciate the <strong>time and effort</strong> you took to apply.
              </p>

              <div style="background-color:#e8f4f8;border-left:4px solid #154CB3;padding:16px;border-radius:4px;margin:20px 0;">
                <p style="margin:0;font-size:15px;color:#154CB3;line-height:1.6;">
                  We encourage you to remain connected with us. We will retain your profile and consider you for future opportunities at SOCIO that align with your skills and experience. Should a suitable position become available, we will reach out to you directly.
                </p>
              </div>

              <p style="margin:20px 0 0 0;font-size:15px;color:#666;">
                <strong>Thank you once again for considering SOCIO!</strong>
              </p>

              <p style="margin:24px 0 0 0;font-size:15px;color:#666;">
                Best regards,<br>
                <strong style="color:#154CB3;font-size:16px;">Team SOCIO</strong><br>
                <a href="mailto:careers@withsocio.com" style="color:#154CB3;text-decoration:none;font-size:13px;">careers@withsocio.com</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#f7f9fc;text-align:center;font-size:11px;color:#999;">
              © ${new Date().getFullYear()} SOCIO. All rights reserved. | 
              <a href="mailto:careers@withsocio.com?subject=UNSUBSCRIBE" style="color:#999;">Unsubscribe</a>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  }),
  interview: ({ firstName, role, venue, date, time }: { firstName: string; role: string; venue: string; date: string; time: string }) => ({
    subject: `Interview Invitation - ${role} Internship at SOCIO`,
    text: `Hello ${firstName},

Congratulations! You have been shortlisted for the ${role} internship at SOCIO.

You are invited to attend an interview as per the following details:

Date: ${date}
Time: ${time}
Venue: ${venue}

Please be present at the venue on time. If you have any questions or are unable to attend, reply to this email as soon as possible.

Best regards,
Team SOCIO
careers@withsocio.com

---
© ${new Date().getFullYear()} SOCIO. All rights reserved.
To unsubscribe from career emails, reply to careers@withsocio.com with subject "UNSUBSCRIBE".`,
    html: `
      <!DOCTYPE html>
      <html lang="en" xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Interview Invitation</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f7f9fc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',sans-serif;color:#333;">
        <table style="max-width:600px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#154CB3 0%,#1a56c4 100%);padding:32px;text-align:center;">
              <div style="font-size:24px;font-weight:700;color:#fff;">SOCIO</div>
              <h1 style="margin:8px 0 0 0;color:#fff;font-size:26px;">Interview Invitation</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px 0;font-size:16px;color:#555;">Hello <strong>${firstName}</strong>,</p>
              <p style="margin:0 0 16px 0;font-size:15px;color:#666;line-height:1.7;">
                Congratulations! You have been shortlisted for the <strong>${role}</strong> internship at SOCIO.
              </p>
              <div style="background-color:#e8f4f8;border-left:4px solid #154CB3;padding:16px;border-radius:4px;margin:16px 0;">
                <p style="margin:0;font-size:15px;color:#154CB3;line-height:1.6;">
                  <strong style="font-size:16px;">You are invited to attend an interview as per the following details:</strong><br><br>
                  <b>Date:</b> ${date}<br>
                  <b>Time:</b> ${time}<br>
                  <b>Venue:</b> ${venue}
                </p>
              </div>
              <p style="margin:0 0 20px 0;font-size:15px;color:#666;line-height:1.7;">
                Please be present at the venue on time. If you have any questions or are unable to attend, reply to this email as soon as possible.
              </p>
              <a href="https://socio.christuniversity.in" style="display:inline-block;padding:10px 16px;background:#154CB3;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">Visit SOCIO</a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#f7f9fc;text-align:center;font-size:11px;color:#999;">
              © ${new Date().getFullYear()} SOCIO. All rights reserved. | 
              <a href="mailto:careers@withsocio.com?subject=UNSUBSCRIBE" style="color:#999;">Unsubscribe</a>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  }),
};

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { type, email, fullName, roleInterest, venue, date, time } = body || {};

  if (!type || !email || !fullName || !roleInterest || (type === "interview" && (!venue || !date || !time))) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!(type in templates)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const firstName = String(fullName).split(" ")[0];
  let templateArgs: any = { firstName, role: roleInterest };
  if (type === "interview") {
    templateArgs = { ...templateArgs, venue, date, time };
  }
  const { subject, html, text } = templates[type as "shortlisted" | "selected" | "rejected" | "interview"]({
    firstName,
    role: roleInterest,
  });

  await resend.emails.send({
    from: "SOCIO Careers <careers@withsocio.com>",
    to: email,
    replyTo: "careers@withsocio.com",
    subject,
    text,
    html,
    headers: {
      "List-Unsubscribe": "<mailto:careers@withsocio.com?subject=UNSUBSCRIBE>",
    },
  });

  return NextResponse.json({ success: true });
}
