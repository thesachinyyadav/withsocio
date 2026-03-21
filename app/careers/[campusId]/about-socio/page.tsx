import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Socio and Role Descriptions",
  description: "Learn about Socio and internship role descriptions.",
};

const roleDescriptions = [
  {
    title: "Database Handling",
    description:
      "This role involves managing and maintaining structured organizational data using SQL-based systems. The individual will be responsible for handling data storage, updates, validation, and retrieval to ensure accuracy and consistency across records. The role supports internal teams by providing reliable data access and maintaining data integrity. Attention to detail, logical thinking, and responsible handling of information are essential for this role.",
  },
  {
    title: "Frontend Development",
    description:
      "This role focuses on developing and maintaining the user-facing components of Socio’s digital platforms. The individual will work on implementing functional and responsive interfaces while ensuring usability and visual consistency. The role requires collaboration with other teams to translate requirements into effective frontend solutions. A structured approach to development and basic technical proficiency are expected.",
  },
  {
    title: "Operations",
    description:
      "This role is responsible for ensuring smooth execution of internal processes and activities. The individual will coordinate tasks, manage timelines, and support workflow alignment across teams. The role plays a critical part in ensuring that plans are executed efficiently and operational gaps are addressed promptly. Strong organizational skills and accountability are key requirements.",
  },
  {
    title: "Content Writing",
    description:
      "This role focuses on developing clear, professional, and purpose-driven written communication. The individual will create and refine content for internal and external use while maintaining consistency in tone and messaging. The role requires strong language proficiency, clarity of thought, and the ability to communicate ideas effectively.",
  },
  {
    title: "Digital Marketing",
    description:
      "This role involves managing Socio’s digital presence and supporting outreach initiatives. The individual will work on executing digital campaigns, monitoring engagement, and improving visibility across platforms. The role requires an understanding of digital platforms, consistency in execution, and the ability to analyze basic performance metrics.",
  },
  {
    title: "Legal Intern",
    description:
      "This role supports compliance and legal documentation workflows within Socio. The individual will assist with legal research, drafting and reviewing basic agreements, maintaining records, and helping ensure policies and processes align with applicable guidelines. Strong attention to detail, confidentiality, and clear written communication are important for this role.",
  },
];

export default function AboutSocioPage() {
  return (
    <main className="min-h-screen bg-[#fafbff]">
      <div className="bg-gradient-to-br from-[#154CB3] via-[#1e5fc9] to-[#0f3d8f] py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-semibold tracking-wide text-white/80 mb-3">SOCIO</p>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">About Socio and Role Descriptions</h1>
          <p className="text-white/75 mt-4 max-w-2xl">A quick overview of how we work and what each internship role is responsible for.</p>
          <Link
            href="../"
            className="inline-flex items-center gap-2 mt-8 px-5 py-2.5 rounded-full bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Application
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
          <h2 className="text-2xl font-black text-gray-900 mb-4">About Socio</h2>
          <p className="text-gray-700 leading-8">
            Socio is a structured student-led organization built to create efficient systems for collaboration, execution,
            and engagement within the campus ecosystem. The organization operates with a strong focus on process clarity,
            accountability, and practical output. Socio is designed to function as a working organization rather than a
            conventional student initiative, emphasizing real responsibilities, defined roles, and outcome-driven work.
          </p>
          <p className="text-gray-700 leading-8 mt-4">
            The core objective of Socio is to provide members with hands-on exposure to operational, technical, and
            communication roles that mirror professional environments. Every function within Socio contributes directly to
            the organization’s growth, efficiency, and impact.
          </p>
        </section>

        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Why Socio</h2>
          <p className="text-gray-700 leading-8">
            Socio offers an opportunity to work in clearly defined roles with measurable responsibility. Members are
            expected to contribute through consistent execution, disciplined work habits, and professional conduct. The
            experience prioritizes skill development through practice rather than theory, preparing individuals for
            real-world organizational and industry expectations.
          </p>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl font-black text-gray-900">Role Descriptions</h2>
          {roleDescriptions.map((role) => (
            <article key={role.title} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
              <h3 className="text-xl font-black text-gray-900 mb-3">{role.title}</h3>
              <p className="text-gray-700 leading-8">{role.description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
