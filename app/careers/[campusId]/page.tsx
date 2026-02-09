"use client";

import React, { useState, useEffect } from "react";
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
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileWarning, setShowMobileWarning] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(phone);
  const validateUrl = (url: string) => url === "" || /^https?:\/\/.+/.test(url);

  const roleSkillOptions: Record<string, string[]> = {
    "Frontend Development": ["HTML", "CSS", "JavaScript", "React", "Next.js", "Other"],
    "Database Handling": ["SQL", "PostgreSQL", "MySQL", "MongoDB", "Other"],
    "Operations": ["Excel/Sheets", "Process Ops", "Project Management", "Documentation", "Other"],
    "Content Writing": ["Blog Writing", "Copywriting", "SEO Writing", "Social Media Content", "Other"],
    "Digital Marketing": ["SEO", "SEM", "Social Media", "Email Marketing", "Analytics", "Other"],
  };

  const validateField = (name: string, value: string) => {
    const errors = { ...fieldErrors };
    if (name === "fullName" && !value.trim()) errors[name] = "Required";
    else if (name === "fullName") delete errors[name];
    if (name === "email" && !value.trim()) errors[name] = "Required";
    else if (name === "email" && !validateEmail(value)) errors[name] = "Invalid email";
    else if (name === "email") delete errors[name];
    if (name === "phoneNumber" && !value.trim()) errors[name] = "Required";
    else if (name === "phoneNumber" && !validatePhone(value)) errors[name] = "Invalid phone";
    else if (name === "phoneNumber") delete errors[name];
    if (name === "portfolioLink" && !validateUrl(value)) errors[name] = "Invalid URL";
    else if (name === "portfolioLink") delete errors[name];
    setFieldErrors(errors);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touchedFields.has(name)) validateField(name, value);
  };

  const handleFieldBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouchedFields((prev) => new Set([...prev, name]));
    validateField(name, value);
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
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "resume" && value) submitData.append(key, value);
        else if (key !== "resume") submitData.append(key, value as string);
      });
      submitData.append("campusId", campusId);

      const response = await fetch("/api/apply", {
        method: "POST",
        body: submitData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to submit");

      if (typeof window !== "undefined") {
        try {
          const confetti = require("canvas-confetti");
          confetti.default({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ["#154CB3", "#1e6fd4", "#10b981", "#f59e0b"] });
        } catch (e) {}
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#154CB3] via-[#0f3d8f] to-[#0a2d6b] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="bg-white rounded-3xl p-8 md:p-12 max-w-lg w-full text-center shadow-2xl animate-fade-in relative z-10">
          <div className="mb-8">
            <Image src="/socio.svg" alt="SOCIO" width={140} height={42} className="mx-auto" />
          </div>
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg success-icon">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Application Submitted</h2>
          <p className="text-gray-600 mb-8 leading-relaxed text-lg">We've received your application. <span className="font-bold text-[#154CB3]">Additional details will be shared after selection.</span></p>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 mb-6 border border-blue-100">
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-medium">Reference ID</p>
            <p className="font-mono font-bold text-xl text-[#154CB3]">{campusId?.toUpperCase()}-{Date.now().toString(36).toUpperCase()}</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Email confirmation sent</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Mobile Warning */}
      {isMobile && showMobileWarning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-sm w-full shadow-2xl animate-fade-in">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-2H9m3 0h3m-6 4h6a2 2 0 002-2V7a2 2 0 00-2-2H9a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">Open on Desktop</h2>
            <p className="text-gray-600 text-center mb-6">This form works best on a laptop or desktop device.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowMobileWarning(false)} className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all">Continue</button>
              <a href="https://withsocio.com/careers/christid" className="flex-1 px-4 py-3 bg-[#154CB3] text-white font-semibold rounded-lg hover:bg-[#0f3d8f] transition-all text-center">Open on Desktop</a>
            </div>
          </div>
        </div>
      )}

      {/* Premium Header */}
      <div className="relative bg-gradient-to-b from-[#154CB3] via-[#1a56c4] to-[#0f3d8f] text-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 right-4 z-20 bg-white rounded-lg px-4 py-2 shadow-lg">
          <Image src="/socio.svg" alt="SOCIO" width={120} height={36} />
        </div>
        <div className="max-w-4xl mx-auto px-4 py-16 relative z-10">
          <h1 className="text-4xl md:text-5xl font-black text-center mb-3 tracking-tight">SOCIO Internship Application</h1>
          <p className="text-center text-blue-50 text-lg md:text-xl font-light max-w-2xl mx-auto">Join Our Team - Apply Now</p>
        </div>
      </div>

      {/* Premium Form */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1 */}
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#154CB3] to-[#1e6fd4] flex items-center justify-center text-white font-bold">1</div>
              <h2 className="text-2xl font-bold text-gray-900">Your Details</h2>
            </div>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2.5">Full Name</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} onBlur={handleFieldBlur} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#154CB3] focus:ring-2 focus:ring-[#154CB3]/10 outline-none transition-all" placeholder="Your name" />
                  {fieldErrors.fullName && touchedFields.has("fullName") && <p className="text-red-500 text-xs mt-1.5">{fieldErrors.fullName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2.5">Email <span className="text-red-500">*</span></label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} onBlur={handleFieldBlur} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#154CB3] focus:ring-2 focus:ring-[#154CB3]/10 outline-none transition-all" placeholder="your@email.com" />
                  {fieldErrors.email && touchedFields.has("email") && <p className="text-red-500 text-xs mt-1.5">{fieldErrors.email}</p>}
                  <p className="text-xs text-orange-600 mt-2 font-semibold flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    All communication will be through this email
                  </p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2.5">Phone</label>
                  <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} onBlur={handleFieldBlur} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#154CB3] focus:ring-2 focus:ring-[#154CB3]/10 outline-none transition-all" placeholder="+91 98765 43210" />
                  {fieldErrors.phoneNumber && touchedFields.has("phoneNumber") && <p className="text-red-500 text-xs mt-1.5">{fieldErrors.phoneNumber}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2.5">Course, Year</label>
                  <input type="text" name="courseYearDept" value={formData.courseYearDept} onChange={handleInputChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#154CB3] focus:ring-2 focus:ring-[#154CB3]/10 outline-none transition-all" placeholder="BCA, 2nd Year" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2.5">Portfolio / LinkedIn</label>
                <input type="url" name="portfolioLink" value={formData.portfolioLink} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#154CB3] focus:ring-2 focus:ring-[#154CB3]/10 outline-none transition-all" placeholder="https://linkedin.com/in/you" />
              </div>
            </div>
          </div>

          {/* Section 2 - Role Selection */}
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#154CB3] to-[#1e6fd4] flex items-center justify-center text-white font-bold">2</div>
              <h2 className="text-2xl font-bold text-gray-900">Role Interest</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {["Database Handling", "Frontend Development", "Operations", "Content Writing", "Digital Marketing"].map((role) => (
                <label key={role} className="cursor-pointer">
                  <input type="radio" name="roleInterest" value={role} checked={formData.roleInterest === role} onChange={handleInputChange} required className="sr-only" />
                  <div className={`p-4 rounded-2xl border-2 transition-all ${formData.roleInterest === role ? "border-[#154CB3] bg-blue-50 shadow-lg" : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"}`}>
                    <span className="font-semibold text-gray-900">{role}</span>
                  </div>
                </label>
              ))}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2.5">Primary skill</label>
              <select
                name="existingSkills"
                value={formData.existingSkills}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#154CB3] focus:ring-2 focus:ring-[#154CB3]/10 outline-none bg-white transition-all"
                disabled={!formData.roleInterest}
              >
                {!formData.roleInterest ? (
                  <option value="">Select a role first</option>
                ) : (
                  <>
                    <option value="">Select a primary skill</option>
                    {roleSkillOptions[formData.roleInterest]?.map((skill) => (
                      <option key={skill} value={skill}>
                        {skill}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Section 3 - About You */}
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#154CB3] to-[#1e6fd4] flex items-center justify-center text-white font-bold">3</div>
              <h2 className="text-2xl font-bold text-gray-900">About You</h2>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2.5">Why this internship?</label>
                <textarea name="whyConsider" value={formData.whyConsider} onChange={handleInputChange} required rows={2} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#154CB3] focus:ring-2 focus:ring-[#154CB3]/10 outline-none resize-none transition-all" placeholder="What attracts you..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2.5">Past experience</label>
                <textarea name="projectExperience" value={formData.projectExperience} onChange={handleInputChange} required rows={2} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#154CB3] focus:ring-2 focus:ring-[#154CB3]/10 outline-none resize-none transition-all" placeholder="Project or responsibility..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">Startup environment comfort</label>
                <div className="flex gap-4">
                  {["Yes", "No"].map((opt) => (
                    <label key={opt} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.startupComfort === opt ? "border-[#154CB3] bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <input type="radio" name="startupComfort" value={opt} checked={formData.startupComfort === opt} onChange={handleInputChange} required className="w-4 h-4" />
                      <span className="font-medium text-gray-900">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4 - Work & Goals */}
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#154CB3] to-[#1e6fd4] flex items-center justify-center text-white font-bold">4</div>
              <h2 className="text-2xl font-bold text-gray-900">Work & Goals</h2>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2.5">Work sample / GitHub</label>
                <input type="url" name="workSample" value={formData.workSample} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#154CB3] focus:ring-2 focus:ring-[#154CB3]/10 outline-none transition-all" placeholder="https://github.com/yourwork" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2.5">Hours per week</label>
                <select name="hoursPerWeek" value={formData.hoursPerWeek} onChange={handleInputChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#154CB3] focus:ring-2 focus:ring-[#154CB3]/10 outline-none bg-white transition-all">
                  <option value="">Select hours</option>
                  <option value="5-10">5-10 hours</option>
                  <option value="10-15">10-15 hours</option>
                  <option value="15-20">15-20 hours</option>
                  <option value="20-30">20-30 hours</option>
                  <option value="30+">30+ hours</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2.5">What you want to learn</label>
                <textarea name="internshipGoals" value={formData.internshipGoals} onChange={handleInputChange} required rows={2} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#154CB3] focus:ring-2 focus:ring-[#154CB3]/10 outline-none resize-none transition-all" placeholder="Your goals..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2.5">Resume</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#154CB3] hover:bg-blue-50/20 transition-all">
                  <input type="file" id="resume" name="resume" accept=".pdf,.doc,.docx" onChange={handleFileChange} required className="hidden" />
                  <label htmlFor="resume" className="cursor-pointer">
                    <svg className="w-8 h-8 text-[#154CB3] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {formData.resume ? <p className="text-[#154CB3] font-semibold">{formData.resume.name}</p> : <p className="text-gray-700 font-semibold">Upload Resume</p>}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-[#154CB3] to-[#1e6fd4] hover:from-[#0f3d8f] hover:to-[#154CB3] text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] text-lg">
            {isSubmitting ? <>
              <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Submitting...
            </> : <>
              Submit Application
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>}
          </button>

          <p className="text-center text-gray-500 text-sm">Additional details will be shared after selection</p>
        </form>
      </div>

      <div className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white rounded-lg px-3 py-2">
              <Image src="/socio.svg" alt="SOCIO" width={100} height={30} />
            </div>
          </div>
          <p className="text-gray-400 text-sm">&copy; {new Date().getFullYear()} SOCIO. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
