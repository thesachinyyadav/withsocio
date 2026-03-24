import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, createAuditLog, sendEmail } from "../../_utils";

type FounderInviteOption = "none" | "both_founders" | "socio_mail";

const BOTH_FOUNDERS = [
  "surya.s@bcah.christuniversity.in",
  "sachin.yadav@bcah.christuniversity.in",
];
const SOCIO_MAIL = "thesocioblr@gmail.com";

function toUtcStamp(value: Date) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function uniqueEmails(values: string[]) {
  return Array.from(new Set(values.map((value) => String(value || "").trim().toLowerCase()).filter(Boolean)));
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request, "admin");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const {
      recipientEmails,
      title,
      agenda,
      meetingDate,
      meetingTime,
      startDateTimeIso,
      timezone,
      durationMinutes,
      founderInviteOption,
    } = body as {
      recipientEmails: string[];
      title: string;
      agenda?: string;
      meetingDate: string;
      meetingTime: string;
      startDateTimeIso: string;
      timezone?: string;
      durationMinutes?: number;
      founderInviteOption?: FounderInviteOption;
    };

    if (!Array.isArray(recipientEmails) || recipientEmails.length === 0) {
      return NextResponse.json({ error: "Select at least one intern" }, { status: 400 });
    }

    if (!title || !meetingDate || !meetingTime || !startDateTimeIso) {
      return NextResponse.json(
        { error: "title, meetingDate, meetingTime and startDateTimeIso are required" },
        { status: 400 }
      );
    }

    const duration = Number.isFinite(Number(durationMinutes))
      ? Math.min(240, Math.max(15, Number(durationMinutes)))
      : 30;

    const option: FounderInviteOption = ["none", "both_founders", "socio_mail"].includes(
      String(founderInviteOption)
    )
      ? (founderInviteOption as FounderInviteOption)
      : "none";

    const founderEmails = option === "both_founders" ? BOTH_FOUNDERS : option === "socio_mail" ? [SOCIO_MAIL] : [];

    const finalRecipients = uniqueEmails([...recipientEmails, ...founderEmails]);

    const start = new Date(startDateTimeIso);
    if (Number.isNaN(start.getTime())) {
      return NextResponse.json({ error: "Invalid startDateTimeIso" }, { status: 400 });
    }

    const end = new Date(start.getTime() + duration * 60 * 1000);

    const datesParam = `${toUtcStamp(start)}/${toUtcStamp(end)}`;
    const details = [
      agenda ? `Agenda: ${agenda}` : "Intern sync-up",
      "This Google Calendar invite is prefilled for Google Meet.",
      `Scheduled by: ${auth.identifier}`,
      timezone ? `Timezone: ${timezone}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: title,
      dates: datesParam,
      details,
      location: "Google Meet",
      add: finalRecipients.join(","),
    });

    const calendarLink = `https://calendar.google.com/calendar/render?${params.toString()}`;

    let successCount = 0;
    let failCount = 0;

    for (const email of finalRecipients) {
      const emailResponse = await sendEmail({
        to: email,
        subject: `GMeet Invite: ${title} (${meetingDate} ${meetingTime})`,
        adminEmail: auth.identifier,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;">
            <h2 style="margin:0 0 12px;">You are invited to an Intern GMeet</h2>
            <p><strong>Title:</strong> ${title}</p>
            <p><strong>Date:</strong> ${meetingDate}</p>
            <p><strong>Time:</strong> ${meetingTime}${timezone ? ` (${timezone})` : ""}</p>
            <p><strong>Duration:</strong> ${duration} minutes</p>
            ${agenda ? `<p><strong>Agenda:</strong> ${agenda}</p>` : ""}
            <p style="margin-top:16px;">
              <a href="${calendarLink}" style="background:#1e40af;color:#ffffff;padding:10px 14px;border-radius:8px;text-decoration:none;display:inline-block;">
                Open Calendar Invite
              </a>
            </p>
            <p style="font-size:12px;color:#6b7280;margin-top:16px;">
              Open the link, verify details, and save the event to generate/join on Google Meet.
            </p>
          </div>
        `,
      });

      if (emailResponse.success) successCount += 1;
      else failCount += 1;
    }

    await createAuditLog({
      actorEmail: auth.identifier,
      action: "GMEET_SCHEDULED",
      targetType: "email",
      notes: `Title: ${title}; recipients=${finalRecipients.length}; success=${successCount}; failed=${failCount}`,
    });

    return NextResponse.json({
      success: true,
      data: {
        title,
        meetingDate,
        meetingTime,
        durationMinutes: duration,
        timezone: timezone || null,
        calendarLink,
        recipients: finalRecipients,
        founderInviteOption: option,
        delivery: {
          successCount,
          failCount,
        },
      },
    });
  } catch (error) {
    console.error("Schedule GMeet error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
