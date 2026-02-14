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
Our team will reach out shortly with the next steps.

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
                Our team will reach out shortly with the next steps.
              </p>
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
};

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { type, email, fullName, roleInterest } = body || {};

  if (!type || !email || !fullName || !roleInterest) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!(type in templates)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const firstName = String(fullName).split(" ")[0];
  const { subject, html, text } = templates[type as "shortlisted" | "selected"]({
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
