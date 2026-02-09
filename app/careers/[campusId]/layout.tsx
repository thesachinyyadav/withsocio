import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Internship Application",
  description: "Apply for an internship at SOCIO. Join our team and gain hands-on experience in a fast-moving startup environment.",
};

export default function CareersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
