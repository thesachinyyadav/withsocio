"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

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
  { name: "Database Handling", icon: "🗄️", color: "from-orange-500 to-amber-500" },
  { name: "Frontend Development", icon: "💻", color: "from-purple-500 to-indigo-500" },
  { name: "Operations", icon: "⚙️", color: "from-cyan-500 to-teal-500" },
  { name: "Content Writing", icon: "✍️", color: "from-pink-500 to-rose-500" },
  { name: "Marketing", icon: "📈", color: "from-green-500 to-emerald-500" },
];

interface FormErrors {
  [key: string]: string;
}

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
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Validation functions
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(phone);
  const validateUrl = (url: string) => url === "" || /^https?:\/\/.+/.test(url);

  const validateField = (name: string, value: string) => {
    const errors = { ...fieldErrors };
    
    if (name === "fullName" && !value.trim()) {
      errors[name] = "Full name is required";
    } else if (name === "fullName") {
      delete errors[name];
    }

    if (name === "email" && !value.trim()) {
      errors[name] = "Email is required";
    } else if (name === "email" && !validateEmail(value)) {
      errors[name] = "Please enter a valid email";
    } else if (name === "email") {
      delete errors[name];
    }

    if (name === "phoneNumber" && !value.trim()) {
      errors[name] = "Phone number is required";
    } else if (name === "phoneNumber" && !validatePhone(value)) {
      errors[name] = "Please enter a valid phone number";
    } else if (name === "phoneNumber") {
      delete errors[name];
    }

    if (name === "portfolioLink" && !validateUrl(value)) {
      errors[name] = "Please enter a valid URL";
    } else if (name === "portfolioLink") {
      delete errors[name];
    }

    setFieldErrors(errors);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touchedFields.has(name)) {
      validateField(name, value);
    }
  };

  const handleFieldBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouchedFields((prev) => new Set([...prev, name]));
    validateField(name, value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, resume: file }));
    if (file) {
      const errors = { ...fieldErrors };
      delete errors.resume;
      setFieldErrors(errors);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append("fullName", formData.fullName);
      submitData.append("courseYearDept", formData.courseYearDept);
      submitData.append("phoneNumber", formData.phoneNumber);
      submitData.append("email", formData.email);
      submitData.append("portfolioLink", formData.portfolioLink);
      submitData.append("roleInterest", formData.roleInterest);
      submitData.append("existingSkills", formData.existingSkills);
      submitData.append("whyConsider", formData.whyConsider);
      submitData.append("projectExperience", formData.projectExperience);
      submitData.append("startupComfort", formData.startupComfort);
      submitData.append("workSample", formData.workSample);
      submitData.append("hoursPerWeek", formData.hoursPerWeek);
      submitData.append("internshipGoals", formData.internshipGoals);
      submitData.append("campusId", campusId);
      if (formData.resume) {
        submitData.append("resume", formData.resume);
      }

      const response = await fetch("/api/apply", {
        method: "POST",
        body: submitData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit application");
      }

      // Trigger confetti on success
      if (typeof window !== "undefined") {
        try {
          const confetti = require("canvas-confetti");
          confetti.default({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#154CB3", "#1e6fd4", "#10b981", "#f59e0b"],
          });
        } catch (e) {
          // Confetti not available, continue
        }
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#154CB3] via-[#0f3d8f] to-[#0a2d6b] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="bg-white rounded-3xl p-8 md:p-12 max-w-lg w-full text-center shadow-2xl animate-fade-in relative z-10">
          {/* Logo */}
          <div className="mb-8">
            <Image
              src="/socio.svg"
              alt="SOCIO"
              width={140}
              height={42}
              className="mx-auto"
            />
          </div>
          
          {/* Success Icon with animation */}
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg success-icon">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          
          <div className="success-content">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Application Submitted! 🎉
            </h2>
            
            <p className="text-gray-600 mb-8 leading-relaxed text-lg">
              Thank you for applying to <span className="font-bold text-[#154CB3]">SOCIO</span>. We&apos;ve received your application and will review it shortly.
            </p>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 mb-6 border border-blue-100">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-medium">Application Reference</p>
              <p className="font-mono font-bold text-xl text-[#154CB3]">
                {campusId?.toUpperCase()}-{Date.now().toString(36).toUpperCase()}
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Confirmation email sent to your inbox</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#154CB3] via-[#1a56c4] to-[#154CB3] text-white py-10 px-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="flex items-center justify-center mb-5">
            <div className="bg-white rounded-2xl flex items-center justify-center shadow-lg px-4 py-3">
              <Image
                src="/socio.svg"
                alt="SOCIO"
                width={140}
                height={42}
              />
            </div>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold mb-3 tracking-tight">
            Internship Application
          </h1>
          <p className="text-blue-100 text-sm md:text-base font-medium">
            {campusId?.replace(/id$/i, " University").replace(/^\w/, (c) => c.toUpperCase()) || "General Application"}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Progress Indicator */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between text-xs font-medium text-gray-500">
              <span>Complete all sections to submit</span>
              <span className="text-[#154CB3]">5 sections</span>
            </div>
          </div>

          {/* Basic Details Section */}
          <section className="bg-white rounded-2xl p-6 md:p-8 shadow-lg card-hover border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <span className="w-9 h-9 bg-gradient-to-br from-[#154CB3] to-[#1e6fd4] text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-md">
                1
              </span>
              <span>Basic Details</span>
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    onBlur={handleFieldBlur}
                    required
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all outline-none ${
                      fieldErrors.fullName && touchedFields.has("fullName")
                        ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200"
                        : "border-gray-300 focus:ring-2 focus:ring-[#154CB3] focus:border-[#154CB3]"
                    }`}
                    placeholder="Enter your full name"
                  />
                  {formData.fullName && !fieldErrors.fullName && (
                    <div className="absolute right-3 top-3.5 text-green-500">✓</div>
                  )}
                </div>
                {fieldErrors.fullName && touchedFields.has("fullName") && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.fullName}
                  </p>
                )}
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
                  onBlur={handleFieldBlur}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#154CB3] focus:border-[#154CB3] transition-all outline-none"
                  placeholder="e.g., BCA, 2nd Year, Computer Science"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      onBlur={handleFieldBlur}
                      required
                      className={`w-full px-4 py-3 border-2 rounded-xl transition-all outline-none ${
                        fieldErrors.phoneNumber && touchedFields.has("phoneNumber")
                          ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200"
                          : "border-gray-300 focus:ring-2 focus:ring-[#154CB3] focus:border-[#154CB3]"
                      }`}
                      placeholder="+91 XXXXX XXXXX"
                    />
                    {formData.phoneNumber && !fieldErrors.phoneNumber && (
                      <div className="absolute right-3 top-3.5 text-green-500">✓</div>
                    )}
                  </div>
                  {fieldErrors.phoneNumber && touchedFields.has("phoneNumber") && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.phoneNumber}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={handleFieldBlur}
                      required
                      className={`w-full px-4 py-3 border-2 rounded-xl transition-all outline-none ${
                        fieldErrors.email && touchedFields.has("email")
                          ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200"
                          : "border-gray-300 focus:ring-2 focus:ring-[#154CB3] focus:border-[#154CB3]"
                      }`}
                      placeholder="your.email@example.com"
                    />
                    {formData.email && !fieldErrors.email && (
                      <div className="absolute right-3 top-3.5 text-green-500">✓</div>
                    )}
                  </div>
                  {fieldErrors.email && touchedFields.has("email") && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
                  )}
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
          <section className="bg-white rounded-2xl p-6 md:p-8 shadow-lg card-hover border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <span className="w-9 h-9 bg-gradient-to-br from-[#154CB3] to-[#1e6fd4] text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-md">
                2
              </span>
              <span>Role Interest</span>
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Which area are you most interested in? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {roleOptions.map((role) => (
                    <label
                      key={role.name}
                      className={`relative flex flex-col items-center gap-2 p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 group ${
                        formData.roleInterest === role.name
                          ? "border-[#154CB3] bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg scale-[1.02]"
                          : "border-gray-200 hover:border-blue-300 hover:bg-gray-50 hover:shadow-md"
                      }`}
                    >
                      <input
                        type="radio"
                        name="roleInterest"
                        value={role.name}
                        checked={formData.roleInterest === role.name}
                        onChange={handleInputChange}
                        required
                        className="sr-only"
                      />
                      <span className="text-3xl mb-1 transform group-hover:scale-110 transition-transform duration-300">{role.icon}</span>
                      <span className={`text-sm font-semibold text-center ${formData.roleInterest === role.name ? 'text-[#154CB3]' : 'text-gray-700'}`}>{role.name}</span>
                      {formData.roleInterest === role.name && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-[#154CB3] rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
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
          <section className="bg-white rounded-2xl p-6 md:p-8 shadow-lg card-hover border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <span className="w-9 h-9 bg-gradient-to-br from-[#154CB3] to-[#1e6fd4] text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-md">
                3
              </span>
              <span>Quick Screening</span>
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
          <section className="bg-white rounded-2xl p-6 md:p-8 shadow-lg card-hover border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <span className="w-9 h-9 bg-gradient-to-br from-[#154CB3] to-[#1e6fd4] text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-md">
                4
              </span>
              <span>Practical Check</span>
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
          <section className="bg-white rounded-2xl p-6 md:p-8 shadow-lg card-hover border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <span className="w-9 h-9 bg-gradient-to-br from-[#154CB3] to-[#1e6fd4] text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-md">
                5
              </span>
              <span>Short Response</span>
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
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-2xl p-4 flex items-start gap-3 shadow-lg animate-pulse">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-bold text-red-800">Submission Failed</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-[#154CB3] to-[#1e6fd4] hover:from-[#0f3d8f] hover:to-[#154CB3] text-white font-bold py-5 px-8 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] text-lg"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin w-6 h-6"
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
                  <svg className="w-6 h-6 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>

            <p className="text-center text-gray-400 text-sm mt-4">
              By submitting this form, you agree to our terms and conditions.
            </p>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white rounded-lg px-3 py-2">
              <Image
                src="/socio.svg"
                alt="SOCIO"
                width={100}
                height={30}
              />
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} SOCIO. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
