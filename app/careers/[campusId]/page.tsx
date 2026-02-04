"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";

interface FormData {
  fullName: string;
  courseYearDept: string;
  phoneNumber: string;
  email: string;
  portfolioLink: string;
  roleInterest: string;
  existingSkills: string;
  whyConsider: string;
  projectExperience: string;
  startupComfort: string;
  workSample: string;
  hoursPerWeek: string;
  internshipGoals: string;
  resume: File | null;
}

const roleOptions = [
  "Database Handling",
  "Frontend Development",
  "Operations",
  "Content Writing",
  "Marketing",
];

export default function CareersApplicationPage() {
  const params = useParams();
  const campusId = params.campusId as string;

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    courseYearDept: "",
    phoneNumber: "",
    email: "",
    portfolioLink: "",
    roleInterest: "",
    existingSkills: "",
    whyConsider: "",
    projectExperience: "",
    startupComfort: "",
    workSample: "",
    hoursPerWeek: "",
    internshipGoals: "",
    resume: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, resume: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // TODO: Connect to Supabase
      // For now, simulate submission
      const submissionData = {
        ...formData,
        campusId,
        submittedAt: new Date().toISOString(),
        resumeFileName: formData.resume?.name || null,
      };

      console.log("Form submitted:", submissionData);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#154CB3] to-[#0a2d6b] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 md:p-12 max-w-lg w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Application Submitted!
          </h2>
          <p className="text-gray-600 mb-6">
            Thank you for applying to SOCIO. We&apos;ve received your application and will review it
            shortly. You&apos;ll hear from us soon!
          </p>
          <div className="flex items-center justify-center gap-2 text-[#154CB3]">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            <span className="font-medium">Application ID: {campusId?.toUpperCase()}-{Date.now().toString(36).toUpperCase()}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-[#154CB3] text-white py-8 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <span className="text-[#154CB3] font-bold text-xl">W</span>
            </div>
            <span className="text-2xl font-bold">SOCIO</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Internship Application Form
          </h1>
          <p className="text-blue-100 text-sm md:text-base">
            Campus: {campusId?.replace(/id$/i, "").toUpperCase() || "General"}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Details Section */}
          <section className="bg-white rounded-2xl p-6 md:p-8 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#154CB3] text-white rounded-lg flex items-center justify-center text-sm">
                1
              </span>
              Basic Details
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#154CB3] focus:border-transparent transition-all outline-none"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course, Year, and Department <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="courseYearDept"
                  value={formData.courseYearDept}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#154CB3] focus:border-transparent transition-all outline-none"
                  placeholder="e.g., BCA, 2nd Year, Computer Science"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#154CB3] focus:border-transparent transition-all outline-none"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#154CB3] focus:border-transparent transition-all outline-none"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn, GitHub, or Portfolio Link
                </label>
                <input
                  type="url"
                  name="portfolioLink"
                  value={formData.portfolioLink}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#154CB3] focus:border-transparent transition-all outline-none"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
            </div>
          </section>

          {/* Role Interest Section */}
          <section className="bg-white rounded-2xl p-6 md:p-8 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#154CB3] text-white rounded-lg flex items-center justify-center text-sm">
                2
              </span>
              Role Interest
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Which area are you most interested in? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {roleOptions.map((role) => (
                    <label
                      key={role}
                      className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.roleInterest === role
                          ? "border-[#154CB3] bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="roleInterest"
                        value={role}
                        checked={formData.roleInterest === role}
                        onChange={handleInputChange}
                        required
                        className="w-4 h-4 text-[#154CB3] focus:ring-[#154CB3]"
                      />
                      <span className="text-gray-700 font-medium">{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mention any tools, platforms, or skills you already know related to your chosen area
                </label>
                <textarea
                  name="existingSkills"
                  value={formData.existingSkills}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#154CB3] focus:border-transparent transition-all outline-none resize-none"
                  placeholder="e.g., React, Node.js, Figma, MySQL, Canva, etc."
                />
              </div>
            </div>
          </section>

          {/* Quick Screening Section */}
          <section className="bg-white rounded-2xl p-6 md:p-8 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#154CB3] text-white rounded-lg flex items-center justify-center text-sm">
                3
              </span>
              Quick Screening
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  In one or two lines, why should we consider you for SOCIO? <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="whyConsider"
                  value={formData.whyConsider}
                  onChange={handleInputChange}
                  required
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#154CB3] focus:border-transparent transition-all outline-none resize-none"
                  placeholder="Tell us what makes you stand out..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mention one project, event, or responsibility you have handled before <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="projectExperience"
                  value={formData.projectExperience}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#154CB3] focus:border-transparent transition-all outline-none resize-none"
                  placeholder="If none, describe something you are currently learning..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Are you comfortable working in a fast-moving startup environment with real responsibilities? <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  {["Yes", "No"].map((option) => (
                    <label
                      key={option}
                      className={`flex-1 flex items-center justify-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.startupComfort === option
                          ? "border-[#154CB3] bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="startupComfort"
                        value={option}
                        checked={formData.startupComfort === option}
                        onChange={handleInputChange}
                        required
                        className="w-4 h-4 text-[#154CB3] focus:ring-[#154CB3]"
                      />
                      <span className="text-gray-700 font-medium">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Practical Check Section */}
          <section className="bg-white rounded-2xl p-6 md:p-8 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#154CB3] text-white rounded-lg flex items-center justify-center text-sm">
                4
              </span>
              Practical Check
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share one example of your work
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  GitHub repo, design link, writing sample, campaign page, or anything relevant
                </p>
                <input
                  type="url"
                  name="workSample"
                  value={formData.workSample}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#154CB3] focus:border-transparent transition-all outline-none"
                  placeholder="https://github.com/username/project"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How many hours per week can you realistically commit? <span className="text-red-500">*</span>
                </label>
                <select
                  name="hoursPerWeek"
                  value={formData.hoursPerWeek}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#154CB3] focus:border-transparent transition-all outline-none bg-white"
                >
                  <option value="">Select hours per week</option>
                  <option value="5-10">5-10 hours</option>
                  <option value="10-15">10-15 hours</option>
                  <option value="15-20">15-20 hours</option>
                  <option value="20-30">20-30 hours</option>
                  <option value="30+">30+ hours</option>
                </select>
              </div>
            </div>
          </section>

          {/* Short Response Section */}
          <section className="bg-white rounded-2xl p-6 md:p-8 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#154CB3] text-white rounded-lg flex items-center justify-center text-sm">
                5
              </span>
              Short Response
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What do you want to gain from this internship? <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="internshipGoals"
                  value={formData.internshipGoals}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#154CB3] focus:border-transparent transition-all outline-none resize-none"
                  placeholder="Share your goals and expectations from this internship..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Your Resume <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#154CB3] transition-all">
                  <input
                    type="file"
                    id="resume"
                    name="resume"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    required
                    className="hidden"
                  />
                  <label htmlFor="resume" className="cursor-pointer">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg
                        className="w-6 h-6 text-[#154CB3]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    </div>
                    {formData.resume ? (
                      <p className="text-[#154CB3] font-medium">{formData.resume.name}</p>
                    ) : (
                      <>
                        <p className="text-gray-700 font-medium">Click to upload your resume</p>
                        <p className="text-gray-500 text-sm mt-1">PDF, DOC, or DOCX (Max 5MB)</p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#154CB3] hover:bg-[#0f3d8f] text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Submitting Application...
              </>
            ) : (
              <>
                Submit Application
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>

          <p className="text-center text-gray-500 text-sm">
            By submitting this form, you agree to our terms and conditions.
          </p>
        </form>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-gray-400 py-6 px-4 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} WSOCIO. All rights reserved.</p>
      </div>
    </div>
  );
}
