"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";

// Animated Counter Hook
const useCounter = (end: number, duration: number = 2000, startOnView: boolean = true) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(!startOnView);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (startOnView) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !hasStarted) {
            setHasStarted(true);
          }
        },
        { threshold: 0.5 }
      );
      if (ref.current) observer.observe(ref.current);
      return () => observer.disconnect();
    }
  }, [startOnView, hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration, hasStarted]);

  return { count, ref };
};

const WithSocioPage = () => {
  const [activeService, setActiveService] = useState<string>("video-production");
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isNavScrolled, setIsNavScrolled] = useState(false);

  // Animated counters
  const projectsCounter = useCounter(10, 2000);
  const clientsCounter = useCounter(5, 2000);
  const satisfactionCounter = useCounter(100, 2000);
  const experienceCounter = useCounter(1, 2000);

  useEffect(() => {
    setIsVisible(true);

    const handleScroll = () => {
      // Scroll progress
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setScrollProgress(progress);

      // Back to top visibility
      setShowBackToTop(scrollTop > 500);

      // Nav background on scroll
      setIsNavScrolled(scrollTop > 50);

      // Reveal animations
      const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
      reveals.forEach((element) => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        if (elementTop < windowHeight - elementVisible) {
          element.classList.add('active');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const faqs = [
    {
      question: "How long does a typical video project take?",
      answer: "Depending on the complexity, most video projects are completed within 5-14 days. We'll provide a detailed timeline during our initial consultation based on your specific requirements."
    },
    {
      question: "Do you offer revisions?",
      answer: "Yes! All our packages include revisions. Essential packages include 2 revisions, Professional includes 4, and Enterprise packages come with unlimited revisions until you're completely satisfied."
    },
    {
      question: "What makes your personal branding service unique?",
      answer: "We combine strategic content creation with authentic storytelling. We don't just create content – we build a cohesive brand identity that resonates with your target audience and establishes you as an authority in your field."
    },
    {
      question: "Can you help with ongoing content needs?",
      answer: "Absolutely! We offer monthly retainer packages for clients who need consistent content. This ensures brand consistency and allows us to develop a deep understanding of your business."
    },
    {
      question: "What's included in website development?",
      answer: "Our website packages include custom design, mobile responsiveness, SEO optimization, SSL security, analytics integration, and post-launch support. We use modern technologies to ensure fast loading times and excellent user experience."
    },
    {
      question: "How do your automation systems work?",
      answer: "We build custom workflows that automate repetitive tasks like lead follow-ups, appointment reminders, and data entry. Our systems integrate with your existing tools and run 24/7, saving you hours every week and ensuring no lead falls through the cracks."
    },
    {
      question: "What communication channels does your CRM support?",
      answer: "Our CRM solutions support WhatsApp Business API, SMS marketing, and Email campaigns - all from one unified dashboard. You can manage all customer conversations, run targeted campaigns, and track analytics across all channels seamlessly."
    }
  ];

  const services = [
    {
      id: "video-production",
      title: "Business Video Production",
      tagline: "Tell Your Story Visually",
      description: "Transform your brand narrative with cinematic video content. From concept to final cut, we craft compelling visual stories that captivate your audience and drive engagement.",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      features: [
        "Professional Scriptwriting",
        "4K Cinematography",
        "Color Grading & VFX",
        "Motion Graphics",
        "Licensed Music",
        "Multiple Revisions"
      ],
      packages: [
        {
          name: "Essential",
          videos: "Based on needs",
          description: "Perfect for getting started with video content",
          price: "From 15,000",
          features: ["30 Reels","HD Quality", "Basic Editing", "2 Revisions", "5-Day Delivery"],
          highlight: false
        },
        {
          name: "Professional",
          videos: "Customizable",
          description: "Ideal for consistent content creation",
          price: "From 35,000",
          features: ["30 Reels","HD Videography", "Advanced Editing", "4 Revisions", "Priority Support", "Color Grading"],
          highlight: true
        },
        {
          name: "End to End Content Production",
          videos: "Scripting+Videography+Editing",
          description: "Tailored packages for your specific needs",
          price: "48,000",
          features: ["30 Reels","4K Videography + ", "Premium Editing", "Flexible Revisions", "Dedicated Team", "VFX & Motion Graphics"],
          highlight: false
        }
      ],
      stats: { clients: "5+", videos: "20+", satisfaction: "100%" }
    },
    {
      id: "personal-branding",
      title: "Personal Branding",
      tagline: "Amplify Your Influence",
      description: "Build an authentic personal brand that resonates. We help thought leaders, entrepreneurs, and professionals establish a powerful digital presence that opens doors.",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      features: [
        "Brand Strategy Session",
        "Content Calendar",
        "Social Media Optimization",
        "Professional Photoshoot",
        "LinkedIn Optimization",
        "Engagement Strategy"
      ],
      packages: [
        {
          name: "Starter",
          videos: "Content Strategy + Basic Edits",
          description: "Begin your personal branding journey",
          price: "From 18,000",
          features: ["30 Reels","2 Content Strategy Sessions", "Basic Editing", "Social Templates"],
          highlight: false
        },
        {
          name: "Growth",
          videos: "Customizable",
          description: "Build your visibility and reach",
          price: "From 40,000",
          features: ["30 Reels","5 Content Strategy Sessions", "Content Creation", "HD Videography", "Advanced Editing"],
          highlight: true
        },
        {
          name: "End to End Content Production",
          videos: "Scripting+Videography+Editing",
          description: "Complete branding tailored for you",
          price: "52,000",
          features: ["30 Reels","30 Sessions of Content Strategy", "4K Videography", "Premium Editing", "Flexible Revisions", "Dedicated Team",],
          highlight: false
        }
      ],
      stats: { brands: "5+", reach: "5K+", growth: "Growing" }
    },
    {
      id: "website-development",
      title: "Website Development",
      tagline: "Your Digital Headquarters",
      description: "Stunning, high-performance websites that convert visitors into customers. Built with cutting-edge technology and designed to make lasting impressions.",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      features: [
        "Custom Design",
        "Mobile Responsive",
        "SEO Optimized",
        "Fast Loading",
        "SSL Security",
        "Analytics Integration"
      ],
      packages: [
        {
          name: "Landing Page",
          videos: "Single Page",
          description: "High-converting landing page for your business",
          price: "From 10,000",
          features: ["Custom Design", "Mobile Responsive", "Contact Form", "Basic SEO", "1 Revision"],
          highlight: false
        },
        {
          name: "Business Website",
          videos: "Multi-page",
          description: "Complete website for your business",
          price: "From 17,000",
          features: ["Custom Multi-page", "CMS Integration", "Blog Setup", "Advanced SEO", "3 Revisions", "Support"],
          highlight: true
        },
        {
          name: "Custom Project",
          videos: "Your requirements",
          description: "Web applications tailored to your needs",
          price: "Let's Talk",
          features: ["Custom Development", "Database Design", "API Integration", "Admin Dashboard", "Flexible Support"],
          highlight: false
        }
      ],
      stats: { websites: "5+", uptime: "99%", speed: "Fast" }
    },
    {
      id: "automation-systems",
      title: "Automation Systems",
      tagline: "Work Smarter, Not Harder",
      description: "Streamline your business operations with intelligent automation. From lead capture to follow-ups, we build systems that work 24/7 so you can focus on what matters most.",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      features: [
        "Workflow Automation",
        "Lead Capture Systems",
        "Auto Follow-ups",
        "Task Scheduling",
        "Data Sync & Integration",
        "Custom Triggers"
      ],
      packages: [
        {
          name: "Starter",
          videos: "Basic Setup",
          description: "Essential automations for small businesses",
          price: "From 8,000",
          features: ["3 Workflows", "Email Automation", "Lead Capture Form", "Basic Integrations", "Support"],
          highlight: false
        },
        {
          name: "Business",
          videos: "Complete Suite",
          description: "Full automation for growing teams",
          price: "From 18,000",
          features: ["10 Workflows", "Multi-channel", "CRM Integration", "Custom Triggers", "Analytics", "Priority Support"],
          highlight: true
        },
        {
          name: "Custom",
          videos: "Your requirements",
          description: "Tailored automation for your needs",
          price: "Let's Talk",
          features: ["Custom Workflows", "Advanced Automation", "Custom Development", "API Access", "Dedicated Support"],
          highlight: false
        }
      ],
      stats: { workflows: "10+", hours: "50+", efficiency: "Growing" }
    },
    {
      id: "crm-solutions",
      title: "CRM & Communication",
      tagline: "Connect & Convert",
      description: "Unified customer relationship management with multi-channel communication. Reach your customers via SMS, Email, and WhatsApp - all from one powerful platform.",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
      ),
      features: [
        "WhatsApp Business API",
        "SMS Marketing",
        "Email Campaigns",
        "Contact Management",
        "Lead Scoring",
        "Analytics & Reports"
      ],
      packages: [
        {
          name: "Essential",
          videos: "Single Channel",
          description: "Start with one communication channel",
          price: "From 8,000",
          features: ["1 Channel (SMS/Email/WA)", "Contact Management", "Basic Templates", "Simple Analytics"],
          highlight: false
        },
        {
          name: "Professional",
          videos: "Multi-Channel",
          description: "Communication across multiple channels",
          price: "From 15,000",
          features: ["All 3 Channels", "Contact Management", "Custom Templates", "Automation Rules", "Analytics"],
          highlight: true
        },
        {
          name: "Custom",
          videos: "Your requirements",
          description: "Full-scale CRM tailored to you",
          price: "Let's Talk",
          features: ["All Channels", "Custom Integrations", "Advanced Features", "API Access", "Priority Support"],
          highlight: false
        }
      ],
      stats: { messages: "1K+", channels: "3", response: "Fast" }
    }
  ];

  const currentService = services.find(s => s.id === activeService) || services[0];

  const processSteps = [
    {
      step: "01",
      title: "Discovery",
      description: "We dive deep into your vision, goals, and target audience to create a tailored strategy."
    },
    {
      step: "02",
      title: "Strategy",
      description: "Our team crafts a comprehensive plan aligned with your brand identity and objectives."
    },
    {
      step: "03",
      title: "Creation",
      description: "We bring your vision to life with meticulous attention to detail and creativity."
    },
    {
      step: "04",
      title: "Launch",
      description: "Your content goes live with our support ensuring maximum impact and reach."
    }
  ];

  const testimonials = [
    {
      quote: "With Socio delivered exceptional video quality for my fitness content. Their attention to detail and professionalism made the entire process seamless.",
      author: "Dion Samuel",
      role: "Fitness Creator",
      avatar: "DS",
      beforeImage: "/dion1.png",
      afterImage: "/dion2.png",
      hasComparison: true
    },
    {
      quote: "Our Instagram page saw incredible organic growth thanks to With Socio's strategic content approach. They truly understand social media dynamics.",
      author: "Oxytocin",
      role: "Instagram Page",
      avatar: "OX",
      beforeImage: "/oxytocin.png",
      afterImage: "/oxytocin2.png",
      hasComparison: true
    },
    {
      quote: "With Socio combines creativity with strategy. They don't just create content, they build brands that resonate with audiences.",
      author: "Jebin Jaison",
      role: "Founder, WITHSOCIO",
      avatar: "JJ",
      hasComparison: false
    }
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Scroll Progress Bar */}
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />

      {/* Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 w-full z-[100] transition-all duration-300 ${isNavScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white border-b border-gray-100 shadow-sm'}`}>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 max-w-7xl mx-auto">
            <Link href="/" className="flex items-center group">
              <span className="text-2xl font-black text-[#154CB3]">WITH</span><span className="text-2xl font-black text-[#063168]">SOCIO</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a href="#services" className="text-gray-600 hover:text-[#154CB3] font-medium transition-colors relative group">
                Services
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#154CB3] transition-all group-hover:w-full" />
              </a>
              <a href="#process" className="text-gray-600 hover:text-[#154CB3] font-medium transition-colors relative group">
                Process
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#154CB3] transition-all group-hover:w-full" />
              </a>
              <a href="#testimonials" className="text-gray-600 hover:text-[#154CB3] font-medium transition-colors relative group">
                Testimonials
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#154CB3] transition-all group-hover:w-full" />
              </a>
              <a href="#faq" className="text-gray-600 hover:text-[#154CB3] font-medium transition-colors relative group">
                FAQ
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#154CB3] transition-all group-hover:w-full" />
              </a>
            </div>
            <a
              href="mailto:withsocio@gmail.com"
              className="bg-[#154CB3] text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-[#0d3a8a] transition-all hover:shadow-lg"
            >
              Get Quote
            </a>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-slate-900 via-[#0d3a8a] to-[#154CB3] overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#FFCC00]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
          </div>

          <div className="container mx-auto px-4 max-w-7xl relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                  <span className="w-2 h-2 bg-[#FFCC00] rounded-full animate-pulse" />
                  <span className="text-white/90 text-sm font-medium">Creative Team Ready to Grow With You</span>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-black text-white mb-5 leading-tight">
                  We Build Brands
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#FFCC00] to-amber-300">
                    That Stand Out
                  </span>
                </h1>
                
                <p className="text-lg md:text-xl text-blue-100/90 mb-8 leading-relaxed">
                  From viral video content to powerful automation systems — we help businesses grow with strategic digital solutions that deliver real results.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href="#services"
                    className="group inline-flex items-center justify-center gap-3 bg-white text-[#154CB3] px-6 py-3.5 rounded-full font-bold hover:shadow-2xl hover:shadow-white/20 transition-all"
                  >
                    Explore Services
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </a>
                  <a
                    href="https://wa.me/918056178520"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-3 bg-transparent border-2 border-white/30 text-white px-6 py-3.5 rounded-full font-bold hover:bg-white/10 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Let&apos;s Talk
                  </a>
                </div>

                {/* Trust Indicators with Animated Counters */}
                <div className="mt-10 pt-8 border-t border-white/10 grid grid-cols-4 gap-4">
                  <div className="text-center" ref={projectsCounter.ref}>
                    <div className="text-2xl md:text-3xl font-black text-white counter">{projectsCounter.count}+</div>
                    <div className="text-blue-200 text-xs">Projects</div>
                  </div>
                  <div className="text-center" ref={clientsCounter.ref}>
                    <div className="text-2xl md:text-3xl font-black text-white counter">{clientsCounter.count}</div>
                    <div className="text-blue-200 text-xs">Clients</div>
                  </div>
                  <div className="text-center" ref={satisfactionCounter.ref}>
                    <div className="text-2xl md:text-3xl font-black text-white counter">{satisfactionCounter.count}%</div>
                    <div className="text-blue-200 text-xs">Satisfaction</div>
                  </div>
                  <div className="text-center" ref={experienceCounter.ref}>
                    <div className="text-2xl md:text-3xl font-black text-white counter">{experienceCounter.count}+</div>
                    <div className="text-blue-200 text-xs">Year Exp</div>
                  </div>
                </div>
              </div>

              {/* Right Visual */}
              <div className={`hidden lg:block transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
                <div className="relative">
                  {/* Main Card */}
                  <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                    <div className="space-y-6">
                      {/* Service Icons Grid */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white/10 rounded-2xl p-4 text-center hover:bg-white/20 transition-all cursor-pointer">
                          <svg className="w-8 h-8 mx-auto text-[#FFCC00] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span className="text-white/80 text-xs">Video</span>
                        </div>
                        <div className="bg-white/10 rounded-2xl p-4 text-center hover:bg-white/20 transition-all cursor-pointer">
                          <svg className="w-8 h-8 mx-auto text-[#FFCC00] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-white/80 text-xs">Branding</span>
                        </div>
                        <div className="bg-white/10 rounded-2xl p-4 text-center hover:bg-white/20 transition-all cursor-pointer">
                          <svg className="w-8 h-8 mx-auto text-[#FFCC00] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="text-white/80 text-xs">Web Dev</span>
                        </div>
                      </div>

                      {/* Testimonial Preview */}
                      <div className="bg-white/5 rounded-2xl p-5">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFCC00] to-amber-500 flex items-center justify-center text-gray-900 font-bold text-sm flex-shrink-0">
                            DS
                          </div>
                          <div>
                            <p className="text-white/80 text-sm italic">&quot;Exceptional quality and professionalism!&quot;</p>
                            <p className="text-white/50 text-xs mt-1">— Dion Samuel, Fitness Creator</p>
                          </div>
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="flex items-center justify-between text-center">
                        <div>
                          <div className="text-[#FFCC00] font-bold">4K</div>
                          <div className="text-white/50 text-xs">Quality</div>
                        </div>
                        <div className="w-px h-8 bg-white/20"></div>
                        <div>
                          <div className="text-[#FFCC00] font-bold">Fast</div>
                          <div className="text-white/50 text-xs">Delivery</div>
                        </div>
                        <div className="w-px h-8 bg-white/20"></div>
                        <div>
                          <div className="text-[#FFCC00] font-bold">24/7</div>
                          <div className="text-white/50 text-xs">Support</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating Elements */}
                  <div className="absolute -top-4 -right-4 bg-[#FFCC00] text-gray-900 px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-bounce" style={{ animationDuration: '2s' }}>
                    New
                  </div>
                  <div className="absolute -bottom-3 -left-3 bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 border border-white/20">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-white text-xs">Available for projects</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
            <span className="text-white/50 text-xs">Scroll to explore</span>
            <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="reveal-left">
                <span className="inline-block text-[#154CB3] font-semibold text-sm uppercase tracking-wider mb-3">Why Work With Us</span>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
                  A Young Team<br />
                  <span className="text-[#154CB3]">With Fresh Ideas</span>
                </h2>
                <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                  We&apos;re college students passionate about tech, marketing, and creative work. 
                  We bring fresh perspectives, dedication, and competitive pricing to every project we take on.
                </p>
                
                <div className="space-y-4">
                  {[
                    { 
                      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                      title: "Committed to Quality", 
                      desc: "We put our best into every project we deliver" 
                    },
                    { 
                      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
                      title: "Quick Turnaround", 
                      desc: "We respect your deadlines and deliver on time" 
                    },
                    { 
                      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>,
                      title: "Easy Communication", 
                      desc: "Direct contact with our team throughout" 
                    },
                    { 
                      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                      title: "Flexible Pricing", 
                      desc: "Packages that fit your budget and needs" 
                    }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                      <span className="text-[#154CB3]">{item.icon}</span>
                      <div>
                        <h4 className="font-bold text-gray-900">{item.title}</h4>
                        <p className="text-gray-600 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="reveal-right">
                <div className="relative">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-[#154CB3] to-[#0d3a8a] p-6 rounded-2xl text-white">
                      <div className="text-4xl font-black mb-1">5+</div>
                      <div className="text-blue-200 text-sm">Happy Clients</div>
                    </div>
                    <div className="bg-gradient-to-br from-[#FFCC00] to-amber-500 p-6 rounded-2xl text-gray-900">
                      <div className="text-4xl font-black mb-1">20+</div>
                      <div className="text-amber-800 text-sm">Projects Completed</div>
                    </div>
                    <div className="bg-gray-900 p-6 rounded-2xl text-white">
                      <div className="text-4xl font-black mb-1">100%</div>
                      <div className="text-gray-400 text-sm">Client Satisfaction</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-2xl text-white">
                      <div className="text-4xl font-black mb-1">Fast</div>
                      <div className="text-green-100 text-sm">Response Time</div>
                    </div>
                  </div>
                  
                  {/* Decorative */}
                  <div className="absolute -z-10 -top-8 -right-8 w-48 h-48 bg-[#154CB3]/10 rounded-full blur-3xl" />
                  <div className="absolute -z-10 -bottom-8 -left-8 w-48 h-48 bg-[#FFCC00]/20 rounded-full blur-3xl" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-24 bg-gray-50">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center mb-16 reveal">
              <span className="inline-block text-[#154CB3] font-semibold text-sm uppercase tracking-wider mb-3">Our Services</span>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">What We Do Best</h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Comprehensive creative solutions tailored to elevate your brand and accelerate your growth.
              </p>
            </div>

            {/* Service Tabs - Horizontal Scroll on Mobile */}
            <div className="mb-12 reveal">
              <div className="flex justify-center">
                <div className="inline-flex flex-wrap justify-center gap-3 p-2 bg-gray-100 rounded-2xl">
                  {services.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => setActiveService(service.id)}
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${
                        activeService === service.id
                          ? 'bg-[#154CB3] text-white shadow-lg'
                          : 'bg-transparent text-gray-600 hover:bg-white hover:shadow-md'
                      }`}
                    >
                      <span className={`${activeService === service.id ? 'text-white' : 'text-[#154CB3]'}`}>
                        {service.icon}
                      </span>
                      <span className="hidden sm:inline">{service.title}</span>
                      <span className="sm:hidden">{service.title.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Service Content */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden reveal hover-card">
              {/* Service Header */}
              <div className="bg-gradient-to-r from-[#154CB3] to-[#0d3a8a] p-8 md:p-12 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#FFCC00]/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div>
                    <span className="text-blue-200 text-sm font-medium uppercase tracking-wider">{currentService.tagline}</span>
                    <h3 className="text-3xl md:text-4xl font-bold text-white mt-2">{currentService.title}</h3>
                    <p className="text-blue-100 mt-4 max-w-xl text-lg">{currentService.description}</p>
                  </div>
                  <div className="flex gap-6">
                    {Object.entries(currentService.stats).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div className="text-3xl font-black text-white">{value}</div>
                        <div className="text-blue-200 text-sm capitalize">{key}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Features Pills */}
                <div className="flex flex-wrap gap-3 mt-8">
                  {currentService.features.map((feature, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm"
                    >
                      <svg className="w-4 h-4 text-[#FFCC00]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              {/* Pricing Cards */}
              <div className="p-8 md:p-12">
                <h4 className="text-2xl font-bold text-gray-900 mb-8 text-center">Choose Your Package</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {currentService.packages.map((pkg, index) => (
                    <div
                      key={index}
                      className={`relative rounded-2xl p-8 transition-all hover:-translate-y-2 ${
                        pkg.highlight
                          ? 'bg-gradient-to-br from-[#154CB3] to-[#0d3a8a] text-white shadow-2xl shadow-blue-500/30 scale-105 z-10'
                          : 'bg-gray-50 border border-gray-200 hover:border-[#154CB3] hover:shadow-xl'
                      }`}
                    >
                      {pkg.highlight && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                          <span className="bg-gradient-to-r from-[#FFCC00] to-amber-400 text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                            MOST POPULAR
                          </span>
                        </div>
                      )}

                      <div className="mb-6">
                        <h5 className={`text-xl font-bold ${pkg.highlight ? 'text-white' : 'text-gray-900'}`}>
                          {pkg.name}
                        </h5>
                        <p className={`text-sm mt-1 ${pkg.highlight ? 'text-blue-100' : 'text-gray-500'}`}>
                          {pkg.videos}
                        </p>
                      </div>

                      <div className="mb-6">
                        <div className="flex items-baseline gap-1">
                          {pkg.price !== "Custom" && (
                            <span className={`text-sm ${pkg.highlight ? 'text-blue-100' : 'text-gray-500'}`}>₹</span>
                          )}
                          <span className={`text-4xl font-black ${pkg.highlight ? 'text-white' : 'text-gray-900'}`}>
                            {pkg.price}
                          </span>
                        </div>
                        <p className={`text-sm mt-2 ${pkg.highlight ? 'text-blue-100' : 'text-gray-500'}`}>
                          {pkg.description}
                        </p>
                      </div>

                      <ul className="space-y-3 mb-8">
                        {pkg.features.map((feature, fIndex) => (
                          <li key={fIndex} className="flex items-center gap-3">
                            <svg
                              className={`w-5 h-5 flex-shrink-0 ${pkg.highlight ? 'text-[#FFCC00]' : 'text-[#154CB3]'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className={`text-sm ${pkg.highlight ? 'text-blue-50' : 'text-gray-600'}`}>
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <a
                        href={`mailto:withsocio@gmail.com?subject=Inquiry: ${currentService.title} - ${pkg.name} Package`}
                        className={`block w-full py-4 rounded-xl text-center font-bold transition-all ${
                          pkg.highlight
                            ? 'bg-white text-[#154CB3] hover:bg-gray-100 shadow-lg'
                            : 'bg-[#154CB3] text-white hover:bg-[#0d3a8a]'
                        }`}
                      >
                        Get Started
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section id="process" className="py-24 bg-white">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center mb-16 reveal">
              <span className="inline-block text-[#154CB3] font-semibold text-sm uppercase tracking-wider mb-3">Our Process</span>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">How We Work</h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                A streamlined approach that ensures quality delivery and exceeds expectations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {processSteps.map((process, index) => (
                <div key={index} className="relative reveal" style={{ animationDelay: `${index * 0.15}s` }}>
                  {index < processSteps.length - 1 && (
                    <div className="hidden md:block absolute top-10 left-[60%] w-full h-0.5 bg-gradient-to-r from-[#154CB3] to-transparent" />
                  )}
                  <div className="relative z-10 text-center md:text-left group">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#154CB3] to-[#0d3a8a] text-white text-2xl font-black mb-6 shadow-xl shadow-blue-500/25 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                      {process.step}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{process.title}</h3>
                    <p className="text-gray-600">{process.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-24 bg-gray-50">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center mb-16 reveal">
              <span className="inline-block text-[#154CB3] font-semibold text-sm uppercase tracking-wider mb-3">Our Portfolio</span>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Proven Results That Speak</h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">Real transformations, real growth. See the impact we&apos;ve made for our clients.</p>
            </div>

            {/* Before/After Showcase - Card Style */}
            <div className="space-y-20 mb-16">
              {testimonials.filter(t => t.hasComparison).map((testimonial, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-8 lg:gap-16 reveal`}
                >
                  {/* Images Container */}
                  <div className="w-full lg:w-1/2">
                    <div className="relative">
                      {/* Main Container with gradient border */}
                      <div className="relative bg-gradient-to-br from-[#154CB3] to-[#FFCC00] p-1 rounded-3xl">
                        <div className="bg-white rounded-3xl p-4">
                          <div className="flex gap-4">
                            {/* Before Image */}
                            <div className="flex-1 relative group">
                              <div className="overflow-hidden rounded-2xl bg-gray-900">
                                <img 
                                  src={testimonial.beforeImage} 
                                  alt={`${testimonial.author} - Before`}
                                  className="w-full h-auto max-h-96 object-contain group-hover:scale-105 transition-transform duration-500"
                                />
                              </div>
                              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
                                Before
                              </div>
                            </div>
                            
                            {/* Arrow */}
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-[#154CB3] rounded-full flex items-center justify-center shadow-lg">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                              </div>
                            </div>
                            
                            {/* After Image */}
                            <div className="flex-1 relative group">
                              <div className="overflow-hidden rounded-2xl ring-4 ring-green-500/30 bg-gray-900">
                                <img 
                                  src={testimonial.afterImage} 
                                  alt={`${testimonial.author} - After`}
                                  className="w-full h-auto max-h-96 object-contain group-hover:scale-105 transition-transform duration-500"
                                />
                              </div>
                              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
                                After
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Decorative elements */}
                      <div className="absolute -z-10 -top-4 -left-4 w-24 h-24 bg-[#154CB3]/10 rounded-full blur-2xl" />
                      <div className="absolute -z-10 -bottom-4 -right-4 w-32 h-32 bg-[#FFCC00]/20 rounded-full blur-2xl" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="w-full lg:w-1/2 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified Results
                    </div>
                    
                    <svg className="w-12 h-12 text-[#154CB3]/20 mb-4 mx-auto lg:mx-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                    
                    <p className="text-gray-700 text-xl mb-8 leading-relaxed">&quot;{testimonial.quote}&quot;</p>
                    
                    <div className="flex items-center gap-4 justify-center lg:justify-start">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#154CB3] to-[#0d3a8a] flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-lg">{testimonial.author}</div>
                        <div className="text-[#154CB3] font-medium">{testimonial.role}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Other Testimonials */}
            <div className="max-w-3xl mx-auto reveal">
              {testimonials.filter(t => !t.hasComparison).map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-white rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all border border-gray-100 text-center"
                >
                  <svg className="w-12 h-12 text-[#154CB3]/20 mb-6 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                  <p className="text-gray-700 text-xl mb-8 leading-relaxed">&quot;{testimonial.quote}&quot;</p>
                  <div className="flex items-center gap-4 justify-center">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#154CB3] to-[#0d3a8a] flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {testimonial.avatar}
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-gray-900 text-lg">{testimonial.author}</div>
                      <div className="text-[#154CB3] font-medium">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-br from-slate-900 via-[#0d3a8a] to-[#154CB3] relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#FFCC00]/10 rounded-full blur-3xl" />
          </div>
          
          <div className="container mx-auto px-4 max-w-4xl relative z-10 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white/90 text-sm font-medium">Limited Slots Available This Month</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              Let&apos;s Build Your Success Story
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Join the brands that have already transformed their digital presence. Book a free consultation and let&apos;s discuss your growth strategy.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="mailto:withsocio@gmail.com"
                className="inline-flex items-center justify-center gap-3 bg-white text-[#154CB3] px-10 py-5 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-white/20 transition-all"
              >
                Start Your Project
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <a
                href="https://wa.me/918056178520"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 bg-green-500 text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-green-600 transition-all"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp Us
              </a>
              <a
                href="https://calendar.app.google/7WqvggmtHta6vDh1A"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 bg-[#4285F4] text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-[#3367D6] transition-all"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
                </svg>
                Schedule a Call
              </a>
            </div>
          </div>
        </section>

        {/* Contact Info */}
        <section className="py-16 bg-white border-t border-gray-100">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <a
                href="mailto:withsocio@gmail.com"
                className="group flex items-center gap-5 p-6 rounded-2xl bg-gray-50 hover:bg-[#154CB3] transition-all"
              >
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-lg transition-all">
                  <svg className="w-6 h-6 text-[#154CB3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500 group-hover:text-blue-100 transition-colors">Email Us</p>
                  <p className="font-bold text-gray-900 group-hover:text-white transition-colors">withsocio@gmail.com</p>
                </div>
              </a>

              <a
                href="tel:+918056178520"
                className="group flex items-center gap-5 p-6 rounded-2xl bg-gray-50 hover:bg-[#154CB3] transition-all"
              >
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-lg transition-all">
                  <svg className="w-6 h-6 text-[#154CB3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500 group-hover:text-blue-100 transition-colors">Call Us</p>
                  <p className="font-bold text-gray-900 group-hover:text-white transition-colors">+91 8056178520</p>
                </div>
              </a>

              <div className="flex items-center gap-5 p-6 rounded-2xl bg-gray-50">
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <svg className="w-6 h-6 text-[#154CB3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-bold text-gray-900">Bangalore, India</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-24 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-16 reveal">
              <span className="inline-block text-[#154CB3] font-semibold text-sm uppercase tracking-wider mb-3">FAQ</span>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Frequently Asked Questions</h2>
              <p className="text-gray-600 text-lg">Got questions? We&apos;ve got answers.</p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-md overflow-hidden reveal hover-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full px-8 py-6 flex items-center justify-between text-left"
                  >
                    <span className="font-bold text-gray-900 text-lg pr-4">{faq.question}</span>
                    <span className={`flex-shrink-0 w-10 h-10 rounded-full bg-[#154CB3]/10 flex items-center justify-center transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`}>
                      <svg className="w-5 h-5 text-[#154CB3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </button>
                  <div className={`accordion-content ${openFaq === index ? 'open' : ''}`}>
                    <div className="px-8 pb-6 text-gray-600 leading-relaxed">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Still have questions CTA */}
            <div className="mt-12 text-center reveal">
              <p className="text-gray-600 mb-4">Still have questions?</p>
              <a
                href="https://wa.me/918056178520"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-600 transition-all"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Chat with us on WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* Client Logos Marquee */}
        <section className="py-12 bg-white border-y border-gray-100 overflow-hidden">
          <div className="container mx-auto px-4 max-w-7xl">
            <p className="text-center text-gray-400 text-sm mb-8 uppercase tracking-wider">Clients we&apos;ve worked with</p>
            <div className="relative">
              <div className="flex animate-marquee space-x-16">
                {[...Array(2)].map((_, setIndex) => (
                  <div key={setIndex} className="flex space-x-16 items-center">
                    <div className="flex items-center gap-3 text-2xl font-bold text-gray-300 hover:text-[#154CB3] transition-colors whitespace-nowrap">
                      <span className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </span>
                      Dion Samuel
                    </div>
                    <div className="flex items-center gap-3 text-2xl font-bold text-gray-300 hover:text-[#154CB3] transition-colors whitespace-nowrap">
                      <span className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </span>
                      Oxytocin
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/918056178520"
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float group"
        aria-label="Chat on WhatsApp"
      >
        <div className="relative">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:bg-green-600 transition-all">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          {/* Pulse effect */}
          <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-25" />
          {/* Tooltip */}
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Chat with us!
          </span>
        </div>
      </a>

      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        className={`back-to-top ${showBackToTop ? 'visible' : ''}`}
        aria-label="Back to top"
      >
        <div className="w-12 h-12 bg-[#154CB3] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:bg-[#0d3a8a] transition-all">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </div>
      </button>
    </div>
  );
};

export default WithSocioPage;
