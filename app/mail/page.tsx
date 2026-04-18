import type { Metadata } from "next";
import MailboxPage from "../socio/careers/[campusId]/mailbox/page";

export const metadata: Metadata = {
  title: "SOCIO Mail",
  description: "SOCIO mailbox for admin inbox, sent, and compose.",
  robots: "noindex, nofollow",
};

export default MailboxPage;
