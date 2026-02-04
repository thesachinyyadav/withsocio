import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard | SOCIO",
  description: "SOCIO Internship Applications Admin Dashboard",
  robots: "noindex, nofollow", // Prevent search engines from indexing this page
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
