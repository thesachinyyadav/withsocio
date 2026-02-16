"use client";

import React, { useState, useEffect, useRef } from "react";
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

const roleIcons: Record<string, string> = {
  "Database Handling": "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4",
  "Frontend Development": "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
  "Operations": "M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2",
  "Content Writing": "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  "Digital Marketing": "M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  "Video Editing / Videographer": "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
};

export default function CareersApplicationPage() {
  const params = useParams();
  const campusId = params.campusId as string;
  const [currentStep, setCurrentStep] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

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
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
      setIsMobile(isMobileDevice);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const steps = [
    { label: "Details", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    { label: "Role", icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
    { label: "About", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
    { label: "Submit", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  ];

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => /^[0-9]{10}$/.test(phone);
  const validateUrl = (url: string) => url === "" || /^https?:\/\/.+/.test(url);

  const roleSkillOptions: Record<string, string[]> = {
    "Frontend Development": ["HTML", "CSS", "JavaScript", "React", "Next.js", "Other"],
    "Database Handling": ["SQL", "PostgreSQL", "MySQL", "MongoDB", "Other"],
    "Operations": ["Excel/Sheets", "Process Ops", "Project Management", "Documentation", "Other"],
    "Content Writing": ["Blog Writing", "Copywriting", "SEO Writing", "Social Media Content", "Other"],
    "Digital Marketing": ["SEO", "SEM", "Social Media", "Email Marketing", "Analytics", "Other"],
    "Video Editing / Videographer": ["Adobe Premiere Pro", "After Effects", "DaVinci Resolve", "Final Cut Pro", "CapCut", "Other"],
  };

  const techRoles = ["Frontend Development", "Database Handling"];
  const videoRoles = ["Video Editing / Videographer"];

  const getWorkSampleLabel = () => {
    if (techRoles.includes(formData.roleInterest)) return "GitHub Repo Link";
    if (videoRoles.includes(formData.roleInterest)) return "Work Sample (Google Drive Link)";
    return "Work Sample / Portfolio Link";
  };

  const getWorkSamplePlaceholder = () => {
    if (techRoles.includes(formData.roleInterest)) return "https://github.com/yourusername/project";
    if (videoRoles.includes(formData.roleInterest)) return "https://drive.google.com/...";
    return "https://your-work-sample-link.com";
  };

  const validateField = (name: string, value: string) => {
    const errors = { ...fieldErrors };
    switch (name) {
      case "fullName":
        if (!value.trim()) errors[name] = "Full name is required";
        else if (value.trim().length < 2) errors[name] = "Name must be at least 2 characters";
        else delete errors[name];
        break;
      case "email":
        if (!value.trim()) errors[name] = "Email address is required";
        else if (!validateEmail(value)) errors[name] = "Please enter a valid email (e.g. name@example.com)";
        else delete errors[name];
        break;
      case "phoneNumber":
        if (!value.trim()) errors[name] = "Phone number is required";
        else if (!validatePhone(value)) errors[name] = "Please enter exactly 10 digits (e.g. 8861330665)";
        else delete errors[name];
        break;
      case "courseYearDept":
        if (!value.trim()) errors[name] = "Course and year is required (e.g. BCA, 2nd Year)";
        else delete errors[name];
        break;
      case "portfolioLink":
        if (value && !validateUrl(value)) errors[name] = "Please enter a valid URL starting with http:// or https://";
        else delete errors[name];
        break;
      case "roleInterest":
        if (!value) errors[name] = "Please select a role you're interested in";
        else delete errors[name];
        break;
      case "whyConsider":
        if (!value.trim()) errors[name] = "Please tell us why you're interested in this internship";
        else if (value.trim().length < 10) errors[name] = "Please write at least 10 characters";
        else delete errors[name];
        break;
      case "projectExperience":
        if (!value.trim()) errors[name] = "Please describe your past experience or projects";
        else if (value.trim().length < 10) errors[name] = "Please write at least 10 characters";
        else delete errors[name];
        break;
      case "startupComfort":
        if (!value) errors[name] = "Please select whether you're comfortable in a startup environment";
        else delete errors[name];
        break;
      case "workSample":
        if (value && !validateUrl(value)) errors[name] = "Please enter a valid URL starting with http:// or https://";
        else delete errors[name];
        break;
      case "hoursPerWeek":
        if (!value) errors[name] = "Please select how many hours per week you can commit";
        else delete errors[name];
        break;
      case "internshipGoals":
        if (!value.trim()) errors[name] = "Please share what you hope to learn from this internship";
        else if (value.trim().length < 10) errors[name] = "Please write at least 10 characters";
        else delete errors[name];
        break;
      default:
        break;
    }
    setFieldErrors(errors);
    return errors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: FormData) => {
      const updated = { ...prev, [name]: value };
      if (name === "roleInterest" && prev.roleInterest !== value) {
        updated.workSample = "";
        updated.existingSkills = "";
      }
      return updated;
    });
    if (touchedFields.has(name)) validateField(name, value);
  };

  const handleFieldBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouchedFields((prev: Set<string>) => new Set([...prev, name]));
    validateField(name, value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev: FormData) => ({ ...prev, resume: file }));
    if (file) {
      const newErrors = { ...fieldErrors };
      delete newErrors.resume;
      setFieldErrors(newErrors);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".doc") || file.name.endsWith(".docx")) {
        setFormData((prev: FormData) => ({ ...prev, resume: file }));
        const newErrors = { ...fieldErrors };
        delete newErrors.resume;
        setFieldErrors(newErrors);
      }
    }
  };

  const validateStep = (step: number): boolean => {
    const stepFields: Record<number, string[]> = {
      0: ["fullName", "email", "phoneNumber", "courseYearDept"],
      1: ["roleInterest"],
      2: ["whyConsider", "projectExperience", "startupComfort"],
      3: ["hoursPerWeek", "internshipGoals"],
    };

    const fields = stepFields[step] || [];
    let hasErrors = false;
    const newTouched = new Set(touchedFields);

    fields.forEach((field) => {
      newTouched.add(field);
      const value = formData[field as keyof FormData] as string;
      const errors = validateField(field, value || "");
      if (errors[field]) hasErrors = true;
    });

    if (step === 3 && !formData.resume) {
      setFieldErrors((prev: FormErrors) => ({ ...prev, resume: "Please upload your resume (PDF, DOC, or DOCX)" }));
      newTouched.add("resume");
      hasErrors = true;
    }

    setTouchedFields(newTouched);
    return !hasErrors;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev: number) => Math.min(prev + 1, 3));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setTimeout(() => {
        const firstError = document.querySelector("[data-error='true']");
        if (firstError) firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev: number) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validateAllFields = (): boolean => {
    const allFields = [
      "fullName", "email", "phoneNumber", "courseYearDept",
      "roleInterest", "whyConsider", "projectExperience",
      "startupComfort", "hoursPerWeek", "internshipGoals"
    ];
    let allErrors: FormErrors = {};
    allFields.forEach((field) => {
      const value = formData[field as keyof FormData] as string;
      const errors = validateField(field, value || "");
      allErrors = { ...allErrors, ...errors };
    });
    if (formData.portfolioLink) {
      const errors = validateField("portfolioLink", formData.portfolioLink);
      allErrors = { ...allErrors, ...errors };
    }
    if (formData.workSample) {
      const errors = validateField("workSample", formData.workSample);
      allErrors = { ...allErrors, ...errors };
    }
    if (!formData.resume) {
      allErrors.resume = "Please upload your resume (PDF, DOC, or DOCX)";
    }
    setFieldErrors(allErrors);
    setTouchedFields(new Set([...allFields, "portfolioLink", "workSample", "resume"]));
    return Object.keys(allErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateAllFields()) {
      setError("Please fix the errors highlighted above before submitting.");
      setTimeout(() => {
        const firstError = document.querySelector("[data-error='true']");
        if (firstError) firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "resume" && value instanceof File) {
          submitData.append(key, value);
          return;
        }
        if (key !== "resume") {
          submitData.append(key, String(value ?? ""));
        }
      });
      submitData.append("campusId", campusId);

      const response = await fetch("/api/apply", { method: "POST", body: submitData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to submit");

      if (typeof window !== "undefined") {
        try {
          const { default: confetti } = await import("canvas-confetti");
          confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: ["#6366f1", "#8b5cf6", "#a78bfa", "#10b981", "#f59e0b"] });
          setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { y: 0.5, x: 0.3 }, colors: ["#6366f1", "#8b5cf6"] }), 300);
          setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { y: 0.5, x: 0.7 }, colors: ["#10b981", "#f59e0b"] }), 500);
        } catch {}
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = (field: string) =>
    `w-full px-4 py-3.5 bg-white/60 backdrop-blur-sm border-2 rounded-2xl outline-none transition-all duration-300 placeholder:text-gray-400 ${
      fieldErrors[field] && touchedFields.has(field)
        ? "border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
        : "border-gray-200/80 hover:border-blue-300 focus:border-[#154CB3] focus:ring-4 focus:ring-[#154CB3]/15"
    }`;

  const ErrorMsg = ({ field }: { field: string }) =>
    fieldErrors[field] && touchedFields.has(field) ? (
      <p data-error="true" className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {fieldErrors[field]}
      </p>
    ) : null;

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a2d6b] via-[#154CB3] to-[#0f3d8f] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-[20%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-[20%] w-[400px] h-[400px] bg-[#154CB3]/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-sky-500/15 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: "2s" }} />
        </div>

        <div className="relative z-10 max-w-lg w-full">
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-10 md:p-14 text-center shadow-2xl">
            <div className="mb-8">
              <Image src="/socio.svg" alt="SOCIO" width={130} height={40} className="mx-auto brightness-0 invert" />
            </div>

            <div className="relative mx-auto mb-8 w-24 h-24">
              <div className="absolute inset-0 bg-emerald-400/30 rounded-full animate-ping" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">You&apos;re In!</h2>
            <p className="text-white/70 mb-8 leading-relaxed text-lg">Application submitted successfully. <span className="text-blue-200 font-semibold">We&apos;ll be in touch soon.</span></p>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 mb-6 border border-white/10">
              <p className="text-[10px] text-white/50 mb-1.5 uppercase tracking-[0.2em] font-semibold">Reference ID</p>
              <p className="font-mono font-bold text-xl text-white">{campusId?.toUpperCase()}-{Date.now().toString(36).toUpperCase()}</p>
            </div>

            <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-400/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-blue-200 font-semibold text-sm text-left leading-snug">CHECK YOUR EMAIL AND SPAM FOLDER AFTER CLOSING THIS PAGE</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbff] relative">
      <style jsx global>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        .animate-shake { animation: shake 0.3s ease-in-out; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slideUp { animation: slideUp 0.5s ease-out; }
        @keyframes floatSlow { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-20px) rotate(3deg); } }
        .animate-float-slow { animation: floatSlow 6s ease-in-out infinite; }
        .animate-float-slow-d { animation: floatSlow 8s ease-in-out 2s infinite; }
      `}</style>

      {isSubmitting && (
        <div className="fixed inset-0 z-50 bg-[#0a2d6b]/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-slideUp">
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
              <div className="absolute inset-0 rounded-full border-4 border-t-[#154CB3] animate-spin" />
              <div className="absolute inset-3 rounded-full bg-blue-50 flex items-center justify-center">
                <svg className="w-7 h-7 text-[#154CB3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Uploading...</h2>
            <p className="text-gray-500 text-sm">Please don&apos;t close this window</p>
          </div>
        </div>
      )}

      {isMobile && showMobileWarning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-slideUp">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-[#154CB3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2 text-center">Better on Desktop</h2>
            <p className="text-gray-500 text-center mb-6 text-sm">This form works best on a laptop or desktop.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowMobileWarning(false)} className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all text-sm">Continue Anyway</button>
              <a href="https://withsocio.com/careers/christid" className="flex-1 px-4 py-3 bg-[#154CB3] text-white font-bold rounded-xl hover:bg-[#0f3d8f] transition-all text-center text-sm">Open on Desktop</a>
            </div>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden bg-gradient-to-br from-[#154CB3] via-[#1e5fc9] to-[#0f3d8f]">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl animate-float-slow-d" />
          <svg className="absolute top-0 left-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="max-w-3xl mx-auto px-4 pt-12 pb-20 relative z-10">
          <div className="flex justify-center mb-8">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3 shadow-lg">
              <Image src="/socio.svg" alt="SOCIO" width={110} height={34} className="brightness-0 invert" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-center text-white mb-4 tracking-tight leading-tight">
            Join the <span className="bg-gradient-to-r from-sky-200 to-blue-200 bg-clip-text text-transparent">SOCIO</span> Team
          </h1>
          <p className="text-center text-white/60 text-lg md:text-xl max-w-xl mx-auto font-light">Apply for our internship programme and build something extraordinary with us.</p>
          <div className="flex justify-center mt-6">
            <a href="/SOCIOJobDescription.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-full hover:bg-white/20 transition-all text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              View Job Description
            </a>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, i) => (
              <button key={i} onClick={() => { if (i < currentStep) setCurrentStep(i); }} className={`flex items-center gap-2 transition-all duration-300 ${i <= currentStep ? "opacity-100" : "opacity-40"}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  i < currentStep ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30" :
                  i === currentStep ? "bg-[#154CB3] text-white shadow-md shadow-blue-500/30" :
                  "bg-gray-100 text-gray-400"
                }`}>
                  {i < currentStep ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.icon} /></svg>
                  )}
                </div>
                <span className={`text-sm font-semibold hidden sm:block ${i === currentStep ? "text-[#154CB3]" : i < currentStep ? "text-emerald-600" : "text-gray-400"}`}>{step.label}</span>
                {i < 3 && <div className={`hidden sm:block w-12 h-0.5 mx-1 rounded-full transition-all duration-500 ${i < currentStep ? "bg-emerald-400" : "bg-gray-200"}`} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <form ref={formRef} onSubmit={handleSubmit}>
          {currentStep === 0 && (
            <div className="space-y-6 animate-slideUp">
              <div className="mb-8">
                <h2 className="text-3xl font-black text-gray-900 mb-2">Personal Details</h2>
                <p className="text-gray-500">Tell us a bit about yourself</p>
              </div>
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Full Name <span className="text-red-400">*</span></label>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} onBlur={handleFieldBlur} required className={inputClasses("fullName")} placeholder="John Doe" />
                    <ErrorMsg field="fullName" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email <span className="text-red-400">*</span></label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} onBlur={handleFieldBlur} required className={inputClasses("email")} placeholder="john@example.com" />
                    <ErrorMsg field="email" />
                    <p className="text-xs text-[#154CB3] mt-1.5 flex items-center gap-1 font-medium">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      All communication will be through this email
                    </p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Phone <span className="text-red-400">*</span></label>
                    <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} onBlur={handleFieldBlur} required maxLength={10} className={inputClasses("phoneNumber")} placeholder="8861330665" />
                    <ErrorMsg field="phoneNumber" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Course & Year <span className="text-red-400">*</span></label>
                    <input type="text" name="courseYearDept" value={formData.courseYearDept} onChange={handleInputChange} onBlur={handleFieldBlur} required className={inputClasses("courseYearDept")} placeholder="BCA, 2nd Year" />
                    <ErrorMsg field="courseYearDept" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Portfolio / LinkedIn <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input type="url" name="portfolioLink" value={formData.portfolioLink} onChange={handleInputChange} onBlur={handleFieldBlur} className={inputClasses("portfolioLink")} placeholder="https://linkedin.com/in/yourprofile" />
                  <ErrorMsg field="portfolioLink" />
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6 animate-slideUp">
              <div className="mb-8">
                <h2 className="text-3xl font-black text-gray-900 mb-2">Choose Your Role</h2>
                <p className="text-gray-500">Select the role that matches your skills and interest</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.keys(roleSkillOptions).map((role) => (
                  <label key={role} className="cursor-pointer group">
                    <input type="radio" name="roleInterest" value={role} checked={formData.roleInterest === role} onChange={handleInputChange} required className="sr-only" />
                    <div className={`relative p-5 rounded-2xl border-2 transition-all duration-300 ${
                      formData.roleInterest === role
                        ? "border-[#154CB3] bg-blue-50 shadow-lg shadow-blue-500/10 scale-[1.02]"
                        : "border-gray-200/80 bg-white hover:border-blue-300 hover:shadow-md hover:scale-[1.01]"
                    }`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all ${
                        formData.roleInterest === role ? "bg-[#154CB3] text-white" : "bg-gray-100 text-gray-400 group-hover:bg-blue-100 group-hover:text-[#154CB3]"
                      }`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={roleIcons[role] || roleIcons["Operations"]} /></svg>
                      </div>
                      <span className="font-bold text-gray-900 text-sm">{role}</span>
                      {formData.roleInterest === role && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-[#154CB3] rounded-full flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              <ErrorMsg field="roleInterest" />
              {formData.roleInterest && (
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm animate-slideUp">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Primary Skill</label>
                  <select name="existingSkills" value={formData.existingSkills} onChange={handleInputChange} className={inputClasses("existingSkills")}>
                    <option value="">Select your primary skill</option>
                    {roleSkillOptions[formData.roleInterest]?.map((skill) => (
                      <option key={skill} value={skill}>{skill}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 animate-slideUp">
              <div className="mb-8">
                <h2 className="text-3xl font-black text-gray-900 mb-2">Tell Us More</h2>
                <p className="text-gray-500">Help us understand your motivation and experience</p>
              </div>
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Why this internship? <span className="text-red-400">*</span></label>
                  <textarea name="whyConsider" value={formData.whyConsider} onChange={handleInputChange} onBlur={handleFieldBlur} required rows={3} className={inputClasses("whyConsider") + " resize-none"} placeholder="What excites you about working with SOCIO..." />
                  <ErrorMsg field="whyConsider" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Past Experience <span className="text-red-400">*</span></label>
                  <textarea name="projectExperience" value={formData.projectExperience} onChange={handleInputChange} onBlur={handleFieldBlur} required rows={3} className={inputClasses("projectExperience") + " resize-none"} placeholder="Projects, roles, or responsibilities you've had..." />
                  <ErrorMsg field="projectExperience" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Comfortable with a startup environment? <span className="text-red-400">*</span></label>
                  <div className="grid grid-cols-2 gap-3">
                    {["Yes", "No"].map((opt) => (
                      <label key={opt} className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                        formData.startupComfort === opt ? "border-[#154CB3] bg-blue-50 shadow-md" : "border-gray-200/80 bg-white hover:border-blue-300"
                      }`}>
                        <input type="radio" name="startupComfort" value={opt} checked={formData.startupComfort === opt} onChange={handleInputChange} required className="sr-only" />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.startupComfort === opt ? "border-[#154CB3]" : "border-gray-300"}`}>
                          {formData.startupComfort === opt && <div className="w-2.5 h-2.5 rounded-full bg-[#154CB3]" />}
                        </div>
                        <span className="font-bold text-gray-800">{opt}</span>
                      </label>
                    ))}
                  </div>
                  <ErrorMsg field="startupComfort" />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6 animate-slideUp">
              <div className="mb-8">
                <h2 className="text-3xl font-black text-gray-900 mb-2">Almost There!</h2>
                <p className="text-gray-500">Share your work and goals, then hit submit</p>
              </div>
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{getWorkSampleLabel()} <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input type="url" name="workSample" value={formData.workSample} onChange={handleInputChange} onBlur={handleFieldBlur} className={inputClasses("workSample")} placeholder={getWorkSamplePlaceholder()} />
                  <ErrorMsg field="workSample" />
                  {formData.roleInterest && (
                    <p className="text-xs text-gray-400 mt-1.5">
                      {techRoles.includes(formData.roleInterest) && "Paste your GitHub repository link showcasing your code/projects."}
                      {videoRoles.includes(formData.roleInterest) && "Paste a Google Drive link to your video editing work samples."}
                      {!techRoles.includes(formData.roleInterest) && !videoRoles.includes(formData.roleInterest) && "Share a link to your relevant work or portfolio."}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Hours per week <span className="text-red-400">*</span></label>
                  <select name="hoursPerWeek" value={formData.hoursPerWeek} onChange={handleInputChange} onBlur={handleFieldBlur} required className={inputClasses("hoursPerWeek")}>
                    <option value="">Select commitment</option>
                    <option value="5-10">5 - 10 hours</option>
                    <option value="10-15">10 - 15 hours</option>
                    <option value="15-20">15 - 20 hours</option>
                    <option value="20-30">20 - 30 hours</option>
                    <option value="30+">30+ hours</option>
                  </select>
                  <ErrorMsg field="hoursPerWeek" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">What do you want to learn? <span className="text-red-400">*</span></label>
                  <textarea name="internshipGoals" value={formData.internshipGoals} onChange={handleInputChange} onBlur={handleFieldBlur} required rows={3} className={inputClasses("internshipGoals") + " resize-none"} placeholder="Skills and experiences you hope to gain..." />
                  <ErrorMsg field="internshipGoals" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Resume <span className="text-red-400">*</span></label>
                  <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                    dragActive ? "border-[#154CB3] bg-blue-50 scale-[1.01]" :
                    formData.resume ? "border-emerald-400 bg-emerald-50/50" :
                    "border-gray-300 hover:border-blue-400 hover:bg-blue-50/30"
                  }`}>
                    <input type="file" id="resume" name="resume" accept=".pdf,.doc,.docx" onChange={handleFileChange} required={!formData.resume} className="hidden" />
                    <label htmlFor="resume" className="cursor-pointer block">
                      {formData.resume ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-emerald-700">{formData.resume.name}</p>
                            <p className="text-xs text-emerald-500">Click to change file</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <svg className="w-7 h-7 text-[#154CB3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                          </div>
                          <p className="font-bold text-gray-700 mb-1">Drop your resume here or <span className="text-[#154CB3]">browse</span></p>
                          <p className="text-xs text-gray-400">PDF, DOC, or DOCX</p>
                        </>
                      )}
                    </label>
                  </div>
                  <ErrorMsg field="resume" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-start gap-3 animate-shake">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-700 font-semibold text-sm">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 gap-4">
            {currentStep > 0 ? (
              <button type="button" onClick={handleBack} className="px-6 py-3.5 border-2 border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                  Back
                </span>
              </button>
            ) : <div />}
            {currentStep < 3 ? (
              <button type="button" onClick={handleNext} className="px-8 py-3.5 bg-[#154CB3] text-white font-bold rounded-2xl hover:bg-[#0f3d8f] transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] text-sm">
                <span className="flex items-center gap-2">
                  Continue
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </span>
              </button>
            ) : (
              <button type="submit" disabled={isSubmitting} className="px-10 py-4 bg-gradient-to-r from-[#154CB3] to-[#0f3d8f] text-white font-black rounded-2xl hover:from-[#0f3d8f] hover:to-[#0a2d6b] transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-sm tracking-wide">
                <span className="flex items-center gap-2">
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </>
                  )}
                </span>
              </button>
            )}
          </div>
          <p className="text-center text-gray-400 text-xs mt-6">Additional details will be shared after selection</p>
        </form>
      </div>

      <div className="border-t border-gray-100 py-8 px-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Image src="/socio.svg" alt="SOCIO" width={80} height={24} />
          <p className="text-gray-400 text-xs">&copy; {new Date().getFullYear()} SOCIO. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
