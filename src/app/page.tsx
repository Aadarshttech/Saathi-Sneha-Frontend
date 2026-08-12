"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Stethoscope, ClipboardCheck, HeartHandshake, Smartphone, Users, Smile, Headset, Globe, HeartPulse, UserCheck, Hospital, FlaskConical, Pill, UserPlus, ShieldCheck, Heart, CheckCircle2, ArrowRight, Plus, Bell, CreditCard, Home, ChevronRight, Phone, Mail, MapPin, Clock, Facebook, Instagram, MessageCircle, Building2, Menu } from "lucide-react";
import { motion, AnimatePresence, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import LoadingScreen from "@/components/ui/LoadingScreen";
import AnimatedLogo from "@/components/ui/AnimatedLogo";
import { Dancing_Script } from "next/font/google";

const dancingScript = Dancing_Script({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

function AnimatedCounter({ value }: { value: string }) {
  const match = value.match(/(\d+)(.*)/);
  if (!match) return <>{value}</>;

  const num = parseInt(match[1], 10);
  const suffix = match[2];

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    if (isInView) {
      animate(count, num, { duration: 2.5, ease: "easeOut" });
    }
  }, [count, isInView, num]);

  return (
    <span ref={ref}>
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

export default function HomePage() {
  const [showLoading, setShowLoading] = useState(true);
  const [isContentReady, setIsContentReady] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (showLoading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showLoading]);

  useEffect(() => {
    // If mobile view, skip the flashy animation entirely to keep it simple
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setShowLoading(false);
      setIsContentReady(true);
      return;
    }

    // Simulate website content loading for 4.5 seconds to allow full cinematic intro
    const t = setTimeout(() => {
      setIsContentReady(true);
    }, 4500);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {showLoading && <LoadingScreen isReady={isContentReady} onComplete={() => setShowLoading(false)} />}
    <div className="min-h-screen bg-[#f4f7f9] font-sans text-slate-900 overflow-x-hidden selection:bg-[#209D8B]/30">
      {/* Luxurious Glassmorphism Navbar */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] md:w-[calc(100%-4rem)] max-w-7xl px-6 lg:px-8 py-2 flex items-center justify-between z-50 rounded-full bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-500">
        <div className="flex items-center gap-2">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group z-50">
            <div className="w-16 h-16 drop-shadow-sm group-hover:scale-105 transition-transform duration-500">
              <AnimatedLogo phase={4} />
            </div>
            <div className="leading-none flex flex-col">
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <span className="font-black text-[#209D8B] text-[22px] sm:text-[34px] tracking-tight" style={{ fontFamily: 'var(--font-quicksand)' }}>Saathi</span>
                <span className="text-[12px] sm:text-[17px] font-medium tracking-wide text-[#528070]">Sneha Care</span>
              </div>
              <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
                <span className="text-[#6aab5e] text-[8px] sm:text-[10px]">♥</span>
                <span className="text-[10px] sm:text-[13px] text-[#6aab5e] font-semibold italic" style={{ fontFamily: 'var(--font-playfair)' }}>Care that feels like family</span>
                <span className="text-[#6aab5e] text-[8px] sm:text-[10px]">♥</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="hidden lg:flex items-center gap-10">
          {[
            { name: 'Services', href: '#services' },
            { name: 'Care Options', href: '#care-options' },
            { name: 'About Us', href: '#about' }
          ].map((item) => (
            <Link 
              key={item.name} 
              href={item.href} 
              className="group relative text-[14px] uppercase tracking-[0.05em] font-bold text-slate-700 hover:text-[#209D8B] transition-colors duration-300"
            >
              {item.name}
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-[#209D8B] rounded-full transition-all duration-300 group-hover:w-full opacity-0 group-hover:opacity-100"></span>
            </Link>
          ))}
        </nav>

        {/* Actions & Mobile Menu */}
        <div className="flex items-center gap-4 lg:gap-8">
          <div className="hidden lg:flex items-center gap-8">
            <Link href="/login" className="flex items-center gap-1.5 text-[14px] uppercase tracking-[0.05em] font-bold text-slate-700 hover:text-[#209D8B] transition-colors duration-300 relative group">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Login
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-[#209D8B] rounded-full transition-all duration-300 group-hover:w-full opacity-0 group-hover:opacity-100"></span>
            </Link>
            <button className="relative group overflow-hidden bg-gradient-to-r from-[#209D8B] to-[#2ab5a1] text-white px-7 py-3 rounded-full text-[14px] uppercase tracking-[0.05em] font-bold shadow-[0_8px_20px_rgba(32,157,139,0.25)] hover:shadow-[0_12px_25px_rgba(32,157,139,0.4)] hover:-translate-y-0.5 transition-all duration-300">
              <span className="relative z-10 flex items-center gap-2">
                Free Consultation
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform duration-300"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex lg:hidden items-center justify-center w-10 h-10 rounded-full bg-white/80 border border-[#209D8B]/20 text-[#1a2b3c] hover:bg-white transition-colors shadow-sm relative z-[60]"
          >
            {mobileMenuOpen ? <Plus className="w-5 h-5 text-[#209D8B] rotate-45 transition-transform" /> : <Menu className="w-5 h-5 text-[#209D8B] transition-transform" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-24 left-4 right-4 z-40 bg-white/95 backdrop-blur-xl border border-white/50 rounded-3xl shadow-xl overflow-hidden flex flex-col p-6 gap-6 lg:hidden"
          >
            <nav className="flex flex-col gap-4">
              {[
                { name: 'Services', href: '#services' },
                { name: 'Care Options', href: '#care-options' },
                { name: 'About Us', href: '#about' }
              ].map((item) => (
                <Link 
                  key={item.name} 
                  href={item.href} 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-bold text-slate-800 hover:text-[#209D8B] transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            <hr className="border-slate-100" />
            <div className="flex flex-col gap-4">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-2 text-[15px] font-bold text-slate-700 w-full py-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Login
              </Link>
              <button onClick={() => setMobileMenuOpen(false)} className="bg-gradient-to-r from-[#209D8B] to-[#2ab5a1] text-white px-6 py-3.5 rounded-full text-[14px] uppercase tracking-[0.05em] font-bold shadow-[0_8px_20px_rgba(32,157,139,0.25)] w-full">
                Free Consultation
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative w-full min-h-[90vh] lg:min-h-0 lg:h-[125vh] flex items-start pt-28 lg:pt-0 lg:items-center bg-[#f4f7f9]">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          
          {/* Full screen fit image without any feathering */}
          <div className="absolute inset-0">
            {/* Mobile Background */}
            <Image 
              src="/mobilebg.png" 
              alt="Hero Background Mobile" 
              fill 
              className="block lg:hidden object-cover object-[center_35%] saturate-[.85]"
              priority
            />
            {/* Desktop Background */}
            <Image 
              src="/final_hero.png" 
              alt="Hero Background" 
              fill 
              className="hidden lg:block object-cover lg:origin-bottom lg:scale-[1.25] lg:translate-y-[4%] lg:translate-x-[5%] saturate-[.85]"
              priority
            />
          </div>

          {/* Fades for text readability - different on mobile vs desktop */}
          <div className="absolute inset-0 z-10 pointer-events-none hidden lg:block" style={{ background: 'radial-gradient(ellipse 55% 120% at 0% 0%, #f4f7f9 60%, rgba(244,247,249, 0.9) 80%, transparent 100%)' }}></div>
          {/* Mobile fade removed since mobilebg.png already has a built-in white fade at the top */}
        </div>

        {/* Double Bottom Curve - smooth scoop on the left, completely flat on the right to reveal all details */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] z-20 pointer-events-none">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 1440 320" 
            className="w-full h-4 md:h-6 lg:h-10 block drop-shadow-[0_-5px_15px_rgba(0,0,0,0.03)]" 
            preserveAspectRatio="none"
          >
            {/* Top translucent curve - Soft frosty teal */}
            <path 
              fill="rgba(170, 215, 210, 0.8)" 
              d="M0,0 C 350,320 900,320 1440,120 L 1440,320 L 0,320 Z"
            ></path>
            {/* Bottom solid curve - Green (blends into the green ribbon) */}
            <path 
              fill="#209D8B" 
              d="M0,40 C 450,320 1000,320 1440,160 L 1440,320 L 0,320 Z"
            ></path>
          </svg>
        </div>

        {/* Hero Content */}
        <div className="relative z-30 w-full max-w-7xl mx-auto px-6 lg:px-8 mt-0 lg:-mt-20">
          <div className="max-w-[500px] lg:max-w-[600px] flex flex-col items-start text-left">
            {/* Trust Badge - Hide on mobile since we have one below */}
            <div className="hidden lg:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-white/80 shadow-[0_4px_15px_rgba(0,0,0,0.05)] mb-6">
              <span className="flex h-2 w-2 rounded-full bg-[#209D8B] animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-widest text-[#209D8B]">Nepal&apos;s Premium Elder Care</span>
            </div>

            {/* Headline */}
            <h1 className="text-[2.1rem] leading-[1.1] md:text-[3.5rem] lg:text-[72px] font-black lg:leading-[1.05] tracking-tight text-[#1a2b3c] mb-4 lg:mb-6">
              Your parents <br /> deserve <br />
              <span className="relative inline-block mt-1 lg:mt-2">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-[#209D8B] to-[#156e61] pr-2" style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic', fontWeight: 800 }}>expert care</span>
                {/* SVG Swoosh Underline */}
                <motion.svg 
                  initial={{ clipPath: "inset(0% 100% 0% 0%)", opacity: 0 }}
                  animate={!showLoading ? { clipPath: "inset(0% 0% 0% 0%)", opacity: 1 } : { clipPath: "inset(0% 100% 0% 0%)", opacity: 0 }}
                  transition={{ duration: 1.0, delay: 0, ease: [0.65, 0, 0.35, 1] }}
                  className="absolute -bottom-1.5 lg:-bottom-3 left-0 w-full h-2.5 lg:h-4 text-[#187A6C] -rotate-2" viewBox="0 0 200 9" fill="none" xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M2.00015 6.6436C40.6668 2.31027 122.8 -3.1564 198.5 6.6436" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                </motion.svg>
              </span>
              <br className="block lg:hidden" />
              <span className="hidden lg:inline">{' '}</span>at home.
            </h1>

            {/* Paragraph with Horizontal Divider on Mobile, Vertical on Desktop */}
            <div className="relative pl-0 lg:pl-5 mb-6 lg:mb-10 w-[140px] sm:w-[220px] md:w-[280px] lg:w-auto">
              <div className="absolute left-0 top-1 bottom-1 w-[3px] lg:w-1 bg-gradient-to-b from-[#209D8B] to-transparent rounded-full opacity-60 hidden lg:block"></div>
              <div className="w-12 h-[3px] bg-[#209D8B] rounded-full mb-3 block lg:hidden opacity-80"></div>
              <p className="text-[14px] sm:text-[15px] md:text-[17px] lg:text-xl text-[#3b5266] leading-[1.3] lg:leading-relaxed font-medium drop-shadow-sm">
                Professional medical care at home in Nepal, with real-time updates for families abroad.
              </p>
            </div>
            {/* Action Area (Pushed down on mobile to clear the subjects) */}
            <div className="flex flex-col items-start mt-10 sm:mt-16 md:mt-24 lg:mt-0">
              {/* Mobile Trust Badge (Inspired by reference) */}
              <div className="flex lg:hidden items-center gap-3 bg-[#e6f4f1] pr-4 p-1.5 rounded-2xl mb-5 shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-[#209D8B] text-white flex items-center justify-center shadow-sm">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-[#1a2b3c] leading-tight">Trusted by 150+ Families</span>
                  <span className="text-[10px] font-medium text-[#4a6b5d] leading-tight">in Nepal and Abroad</span>
                </div>
              </div>

              {/* Action Buttons & Desktop Trust Indicators */}
              <div className="flex flex-wrap items-center gap-4">
                <button className="group relative overflow-hidden bg-gradient-to-r from-[#209D8B] to-[#2ab5a1] text-white px-6 py-3 lg:px-8 lg:py-4 rounded-full text-[13px] lg:text-[14px] uppercase tracking-[0.08em] font-bold shadow-[0_8px_25px_rgba(32,157,139,0.35)] hover:shadow-[0_12px_30px_rgba(32,157,139,0.5)] hover:-translate-y-1 transition-all duration-300">
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Get Started Today
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform duration-300"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                </button>

                {/* Desktop Trust Avatars */}
                <div className="hidden lg:flex items-center gap-3 bg-white/40 backdrop-blur-sm pr-4 p-1.5 rounded-full border border-white/50 shadow-sm">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center shadow-sm overflow-hidden relative" style={{ zIndex: 4 - i }}>
                        <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="Family" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-[#e8f4f2] text-[#209D8B] flex items-center justify-center text-[10px] font-bold z-0 shadow-sm">
                      150+
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[#1a2b3c] uppercase tracking-wider leading-none">Trusted by</span>
                    <span className="text-[11px] font-medium text-[#4a6b5d] leading-tight">Families Abroad</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Green Ribbon Section */}
      <section className="relative z-40 w-full bg-[#209D8B] pt-2 pb-6 md:pt-4 md:pb-10 lg:pb-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="grid grid-cols-2 md:flex md:flex-row items-center justify-between w-full gap-y-8 gap-x-4 md:gap-0">
            {[
              { stat: "500+", label: "Patients", icon: <Users className="w-5 h-5 md:w-7 md:h-7 text-white" /> },
              { stat: "98%", label: "Satisfaction", icon: <Smile className="w-5 h-5 md:w-7 md:h-7 text-white" /> },
              { stat: "24/7", label: "Support", icon: <Headset className="w-5 h-5 md:w-7 md:h-7 text-white" /> },
              { stat: "33+", label: "Countries", icon: <Globe className="w-5 h-5 md:w-7 md:h-7 text-white" /> },
            ].map((item, i) => (
              <div key={i} className="flex-1 w-full flex items-center justify-center relative group">
                <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-2 md:gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-white flex items-center justify-center bg-white/10 group-hover:bg-white/20 transition-colors shadow-sm mx-auto md:mx-0">
                    {item.icon}
                  </div>
                  {/* Text */}
                  <div className="flex flex-col items-center md:items-start mt-1 md:mt-0">
                    <span className="text-xl sm:text-2xl md:text-4xl font-bold text-white mb-0 leading-tight tracking-tight"><AnimatedCounter value={item.stat} /></span>
                    <span className="text-[11px] sm:text-[13px] md:text-[15px] text-white/90 font-medium tracking-wide">{item.label}</span>
                  </div>
                </div>
                
                {/* Vertical Divider */}
                {i < 3 && (
                  <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-[1px] h-16 bg-white/20"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom curve of the ribbon to match the hero curve and cut into the next section */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] pointer-events-none">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 1440 320" 
            className="w-full h-4 md:h-6 lg:h-10 block drop-shadow-[0_-5px_15px_rgba(0,0,0,0.1)]" 
            preserveAspectRatio="none"
          >
            {/* Top translucent curve - Soft frosty teal */}
            <path 
              fill="rgba(255, 255, 255, 0.15)" 
              d="M0,0 C 350,320 900,320 1440,120 L 1440,320 L 0,320 Z"
            ></path>
            {/* Bottom solid curve - Gray (blends into the next section) */}
            <path 
              fill="#f4f7f9" 
              d="M0,40 C 450,320 1000,320 1440,160 L 1440,320 L 0,320 Z"
            ></path>
          </svg>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full relative bg-[#f4f7f9] pt-20 pb-16 md:pb-24 overflow-hidden z-30">
        {/* Background Image with Teal Color Correction */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center"
          style={{ 
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)', 
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)' 
          }}
        >
          <Image src="/imgsrc.png" alt="Background" fill className="object-cover object-center opacity-90" />
          <div className="absolute inset-0 bg-[#209D8B]/10 mix-blend-color"></div>
          
          {/* Left and Right Feathering to hide hard edges on ultra-wide screens / zoomed out */}
          <div className="absolute inset-y-0 left-0 w-[15%] lg:w-[25%] bg-gradient-to-r from-[#f4f7f9] via-[#f4f7f9]/80 to-transparent z-10"></div>
          <div className="absolute inset-y-0 right-0 w-[15%] lg:w-[25%] bg-gradient-to-l from-[#f4f7f9] via-[#f4f7f9]/80 to-transparent z-10"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
          {/* Header */}
          <div className="text-center mb-24 md:mb-32">
             {/* Small header with line/dots */}
             <div className="flex items-center justify-center gap-4 mb-6">
               <div className="w-12 h-[1px] bg-[#209D8B] relative"><div className="absolute -left-1 -top-[2px] w-[5px] h-[5px] rounded-full bg-[#209D8B]"></div></div>
               <span className="text-[#209D8B] font-bold text-xs tracking-[0.2em] uppercase">How Saathi Sneha Care Works</span>
               <div className="w-12 h-[1px] bg-[#209D8B] relative"><div className="absolute -right-1 -top-[2px] w-[5px] h-[5px] rounded-full bg-[#209D8B]"></div></div>
             </div>
             
             {/* Big Headline */}
             <h2 className="text-4xl md:text-6xl font-black text-[#1e293b] mb-6">
               Simple Care. <br className="hidden md:block"/>
               Complete <span className="text-[#209D8B] inline-block" style={{ fontFamily: 'var(--font-playfair)' }}>Peace of Mind.<span className="text-[#209D8B] text-2xl md:text-3xl ml-1 font-sans align-top relative -top-2">♡</span></span>
             </h2>

             {/* Subtitle */}
             <p className="text-slate-600 text-lg md:text-xl max-w-2xl mx-auto font-medium">
               From your first consultation to continuous updates, <br className="hidden md:block" />
               we make caring for your parents effortless—wherever you are.
             </p>
          </div>

          {/* Cards Grid */}
          <div className="relative">
            {/* The SVG connecting line - hidden on mobile, visible on lg */}
            <div className="hidden lg:block absolute top-1/2 left-[5%] w-[90%] h-[100px] -translate-y-1/2 z-0 pointer-events-none">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 100" preserveAspectRatio="none">
                <path d="M0,50 Q166,0 333,50 T666,50 T1000,50" fill="none" stroke="#209D8B" strokeWidth="2" strokeDasharray="8 6" className="opacity-40" />
                
                {/* Connecting dots at card centers */}
                <circle cx="0" cy="50" r="4" fill="#209D8B" />
                <circle cx="333" cy="50" r="4" fill="#209D8B" />
                <circle cx="666" cy="50" r="4" fill="#209D8B" />
                <circle cx="1000" cy="50" r="4" fill="#209D8B" />

                {/* Pulse that flows from one end to another */}
                <g>
                  <circle r="12" fill="#209D8B" opacity="0.3" />
                  <circle r="5" fill="#209D8B" />
                  <animateMotion dur="4s" repeatCount="indefinite" path="M0,50 Q166,0 333,50 T666,50 T1000,50" />
                </g>
              </svg>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 lg:gap-10 xl:gap-14 mt-12">
              {[
                { 
                  step: "01", 
                  title: "Free Consultation", 
                  desc: "We understand your parents' health needs and recommend the right care.", 
                  icon: <Stethoscope size={32} strokeWidth={1.5} /> 
                },
                { 
                  step: "02", 
                  title: "Personalized Care Plan", 
                  desc: "Tailored home visits, monitoring and healthcare services.", 
                  icon: <ClipboardCheck size={32} strokeWidth={1.5} /> 
                },
                { 
                  step: "03", 
                  title: "Care Begins", 
                  desc: "Our dedicated nurse and care coordinator start supporting your loved ones.", 
                  icon: <HeartHandshake size={32} strokeWidth={1.5} /> 
                },
                { 
                  step: "04", 
                  title: "Stay Connected", 
                  desc: "Receive real-time reports, lab results and health updates from anywhere.", 
                  icon: <Smartphone size={32} strokeWidth={1.5} /> 
                }
              ].map((item, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 80 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 1.2, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
                  key={index} 
                  className="group relative bg-white/95 border border-white/80 rounded-[2rem] p-8 pt-16 shadow-[0_15px_50px_-15px_rgba(0,0,0,0.08)] hover:shadow-[0_25px_60px_-15px_rgba(32,157,139,0.25)] hover:-translate-y-3 transition-all duration-500 text-center flex flex-col items-center transform-gpu cursor-default"
                >
                  
                  {/* Subtle Glowing Background on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-b from-[#209D8B]/0 via-[#209D8B]/[0.02] to-[#209D8B]/[0.08] rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                  {/* Icon Circle */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-white/90 backdrop-blur-sm shadow-xl shadow-[#209D8B]/10 flex items-center justify-center z-10 border-4 border-white group-hover:border-[#e8f4f2] transition-colors duration-500">
                    <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-[#4db5a6] to-[#209D8B] flex items-center justify-center text-white relative group-hover:scale-110 group-hover:-translate-y-1.5 group-hover:shadow-[0_12px_25px_-5px_rgba(32,157,139,0.5)] transition-all duration-500 shadow-inner">
                      {/* Step Number Badge */}
                      <div className="absolute -top-1 -left-1 w-8 h-8 rounded-full bg-[#187A6C] text-white font-bold text-[13px] flex items-center justify-center border-2 border-white shadow-sm z-20 group-hover:scale-110 group-hover:rotate-[-10deg] transition-transform duration-500">
                        {item.step}
                      </div>
                      {/* SVG Icon */}
                      <div className="transform group-hover:scale-110 group-hover:rotate-[8deg] transition-transform duration-500 ease-out">
                        {item.icon}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-[22px] font-bold text-slate-800 mb-4 group-hover:text-[#209D8B] transition-colors duration-500 relative z-10">{item.title}</h3>
                  <p className="text-slate-500 text-[16px] leading-relaxed mb-2 flex-1 relative z-10">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer Badge */}
          <div className="flex justify-center mt-20">
            <div className="inline-flex items-center gap-2.5 bg-white/90 backdrop-blur-md px-6 py-3.5 rounded-full shadow-lg shadow-[#209D8B]/10 border border-white/60 text-slate-700 font-bold text-[15px] hover:shadow-xl transition-shadow cursor-default">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#209D8B" stroke="#209D8B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
               Trusted by Families Across Nepal
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="w-full relative bg-[#f4f7f9] pt-8 md:pt-12 pb-32 overflow-hidden z-30">
        
        {/* Background Image that flows seamlessly from the previous section */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ 
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)', 
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)' 
          }}
        >
          {/* We position it at the bottom so the scenery naturally sits behind the cards */}
          <Image src="/servicesimg.png" alt="Services Background" fill className="object-cover object-bottom opacity-30 mix-blend-multiply" />
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center mb-16 md:mb-24">
             <div className="flex items-center justify-center gap-4 mb-4">
               <div className="w-12 h-[1px] bg-[#209D8B] relative"><div className="absolute -left-1 -top-[2px] w-[5px] h-[5px] rounded-full bg-[#209D8B]"></div></div>
               <span className="text-[#209D8B] font-bold text-xs tracking-[0.2em] uppercase">What We Offer</span>
               <div className="w-12 h-[1px] bg-[#209D8B] relative"><div className="absolute -right-1 -top-[2px] w-[5px] h-[5px] rounded-full bg-[#209D8B]"></div></div>
             </div>
             
             <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#1e293b] mb-6">
               Home Care <span className="text-[#209D8B] inline-block" style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}>Services</span>
             </h2>
          </div>
          
          <div className="relative">
            {/* Mobile/Tablet Grid View */}
            <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {[
                { title: "Caregiver Support", desc: "Support and training for caregivers", icon: <UserPlus size={28} strokeWidth={1.5} />, side: 'left' },
                { title: "Hospital Escort", desc: "Escort patient to hospital appointment", icon: <Hospital size={28} strokeWidth={1.5} />, side: 'left' },
                { title: "Chronic Disease", desc: "Monitoring of chronic conditions", icon: <HeartPulse size={28} strokeWidth={1.5} />, side: 'left' },
                { title: "Doctor Consult", desc: "Virtual or in-person doctor consult", icon: <UserCheck size={28} strokeWidth={1.5} />, side: 'right' },
                { title: "Lab Coordination", desc: "Lab test collection and coordination", icon: <FlaskConical size={28} strokeWidth={1.5} />, side: 'right' },
                { title: "Medication Mgt", desc: "Medication review and compliance", icon: <Pill size={28} strokeWidth={1.5} />, side: 'right' },
              ].map((srv, i) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 1.0, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  key={i} 
                  className="group relative bg-white/95 border border-transparent hover:border-[#209D8B]/30 rounded-[1.5rem] p-5 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_-15px_rgba(32,157,139,0.15)] hover:-translate-y-1.5 transition-all duration-500 transform-gpu flex items-center gap-4"
                >
                  {/* Subtle hover gradient background */}
                  <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-br from-[#209D8B]/[0.01] to-[#209D8B]/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                  
                  <div className="w-14 h-14 flex-shrink-0 rounded-2xl bg-[#f4f7f9] group-hover:bg-white flex items-center justify-center text-[#209D8B] border border-white/60 group-hover:border-[#209D8B]/20 group-hover:shadow-[0_8px_16px_rgba(32,157,139,0.12)] relative z-10 transition-all duration-500">
                    <div className="transform group-hover:scale-110 group-hover:text-[#156e61] transition-all duration-500">
                      {srv.icon}
                    </div>
                  </div>
                  <div className="flex-1 relative z-10">
                    <h3 className="text-[18px] font-bold text-slate-800 mb-1 group-hover:text-[#209D8B] transition-colors duration-500">{srv.title}</h3>
                    <p className="text-slate-500 text-[14px] leading-snug">{srv.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Desktop Radial Layout */}
            <div className="hidden lg:flex flex-row items-center justify-between max-w-[1200px] mx-auto gap-4 xl:gap-8 min-h-[600px] relative z-20">
              
              {/* Left Column */}
              <div className="flex flex-col justify-between h-[450px] w-[320px] xl:w-[350px] relative z-30">
                {[
                  { title: "Caregiver Support", desc: "Support and training for caregivers", icon: <UserPlus size={28} strokeWidth={1.5} />, side: 'left' },
                  { title: "Hospital Escort", desc: "Escort patient to hospital appointment", icon: <Hospital size={28} strokeWidth={1.5} />, side: 'left' },
                  { title: "Chronic Disease", desc: "Monitoring of chronic conditions", icon: <HeartPulse size={28} strokeWidth={1.5} />, side: 'left' },
                ].map((srv, index) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -80 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 1.2, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
                    key={index} 
                    className="group relative bg-white/95 border border-transparent hover:border-[#209D8B]/30 rounded-[1.5rem] p-5 xl:p-6 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_-15px_rgba(32,157,139,0.15)] hover:-translate-y-1 hover:translate-x-2 transition-all duration-500 transform-gpu flex items-center gap-4 xl:gap-5"
                  >
                    {/* Subtle hover gradient pulling towards center */}
                    <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-r from-transparent via-transparent to-[#209D8B]/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    
                    <div className="w-14 h-14 flex-shrink-0 rounded-2xl bg-[#f4f7f9] group-hover:bg-white flex items-center justify-center text-[#209D8B] border border-white/60 group-hover:border-[#209D8B]/20 group-hover:shadow-[0_8px_16px_rgba(32,157,139,0.12)] relative z-10 transition-all duration-500">
                      <div className="transform group-hover:scale-110 group-hover:text-[#156e61] transition-all duration-500">
                        {srv.icon}
                      </div>
                    </div>
                    <div className="flex-1 relative z-10">
                      <h3 className="text-[17px] xl:text-[19px] font-bold text-slate-800 mb-1 group-hover:text-[#209D8B] transition-colors duration-500">{srv.title}</h3>
                      <p className="text-slate-500 text-[13px] xl:text-[14px] leading-snug">{srv.desc}</p>
                    </div>
                    
                    {/* Connecting Line (SVG Curve) */}
                    {index === 0 && (
                      <svg className="hidden lg:block absolute top-1/2 left-full w-16 xl:w-[130px] h-20 xl:h-28 pointer-events-none overflow-visible group-hover:text-[#209D8B] text-[#209D8B]/40 transition-colors duration-500 -z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0,0 Q50,0 100,100" fill="none" stroke="currentColor" strokeWidth="4" vectorEffect="non-scaling-stroke" />
                        <circle cx="0" cy="0" r="4" fill="currentColor" vectorEffect="non-scaling-stroke" />
                        <circle r="4" fill="#209D8B" className="shadow-[0_0_8px_#209D8B]">
                          <animateMotion dur="2.5s" repeatCount="indefinite" path="M0,0 Q50,0 100,100" />
                        </circle>
                      </svg>
                    )}
                    {index === 1 && (
                      <svg className="hidden lg:block absolute top-1/2 left-full w-16 xl:w-[130px] h-4 pointer-events-none overflow-visible group-hover:text-[#209D8B] text-[#209D8B]/40 transition-colors duration-500 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none" style={{ transform: 'translateY(-50%)' }}>
                        <path d="M0,5 L100,5" fill="none" stroke="currentColor" strokeWidth="4" vectorEffect="non-scaling-stroke" />
                        <circle cx="0" cy="5" r="4" fill="currentColor" vectorEffect="non-scaling-stroke" />
                        <circle r="4" fill="#209D8B" className="shadow-[0_0_8px_#209D8B]">
                          <animateMotion dur="2.5s" repeatCount="indefinite" path="M0,5 L100,5" />
                        </circle>
                      </svg>
                    )}
                    {index === 2 && (
                      <svg className="hidden lg:block absolute bottom-1/2 left-full w-16 xl:w-[130px] h-20 xl:h-28 pointer-events-none overflow-visible group-hover:text-[#209D8B] text-[#209D8B]/40 transition-colors duration-500 -z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0,100 Q50,100 100,0" fill="none" stroke="currentColor" strokeWidth="4" vectorEffect="non-scaling-stroke" />
                        <circle cx="0" cy="100" r="4" fill="currentColor" vectorEffect="non-scaling-stroke" />
                        <circle r="4" fill="#209D8B" className="shadow-[0_0_8px_#209D8B]">
                          <animateMotion dur="2.5s" repeatCount="indefinite" path="M0,100 Q50,100 100,0" />
                        </circle>
                      </svg>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Center Model Image */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.7 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative flex-1 max-w-[450px] aspect-square flex items-center justify-center z-40 pointer-events-none"
              >
                <div className="absolute inset-0 rounded-full bg-white/60 border-2 border-white shadow-[0_0_80px_rgba(32,157,139,0.15)] backdrop-blur-md transform scale-90 z-0"></div>
                <Image src="/servimodel.png" alt="Nurse Model" fill className="object-contain object-bottom drop-shadow-2xl z-40 scale-110 origin-bottom" />
              </motion.div>

              {/* Right Column */}
              <div className="flex flex-col justify-between h-[450px] w-[320px] xl:w-[350px] relative z-30">
                {[
                  { title: "Doctor Consult", desc: "Virtual or in-person doctor consult", icon: <UserCheck size={28} strokeWidth={1.5} />, side: 'right' },
                  { title: "Lab Coordination", desc: "Lab test collection and coordination", icon: <FlaskConical size={28} strokeWidth={1.5} />, side: 'right' },
                  { title: "Medication Mgt", desc: "Medication review and compliance", icon: <Pill size={28} strokeWidth={1.5} />, side: 'right' },
                ].map((srv, index) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 80 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 1.2, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
                    key={index} 
                    className="group relative bg-white/95 border border-transparent hover:border-[#209D8B]/30 rounded-[1.5rem] p-5 xl:p-6 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_-15px_rgba(32,157,139,0.15)] hover:-translate-y-1 hover:-translate-x-2 transition-all duration-500 transform-gpu flex items-center gap-4 xl:gap-5"
                  >
                    {/* Subtle hover gradient pulling towards center */}
                    <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-l from-transparent via-transparent to-[#209D8B]/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    
                    <div className="w-14 h-14 flex-shrink-0 rounded-2xl bg-[#f4f7f9] group-hover:bg-white flex items-center justify-center text-[#209D8B] border border-white/60 group-hover:border-[#209D8B]/20 group-hover:shadow-[0_8px_16px_rgba(32,157,139,0.12)] relative z-10 transition-all duration-500">
                      <div className="transform group-hover:scale-110 group-hover:text-[#156e61] transition-all duration-500">
                        {srv.icon}
                      </div>
                    </div>
                    <div className="flex-1 relative z-10">
                      <h3 className="text-[17px] xl:text-[19px] font-bold text-slate-800 mb-1 group-hover:text-[#209D8B] transition-colors duration-500">{srv.title}</h3>
                      <p className="text-slate-500 text-[13px] xl:text-[14px] leading-snug">{srv.desc}</p>
                    </div>
                    
                    {/* Connecting Line (SVG Curve) */}
                    {index === 0 && (
                      <svg className="hidden lg:block absolute top-1/2 right-full w-16 xl:w-[130px] h-20 xl:h-28 pointer-events-none overflow-visible group-hover:text-[#209D8B] text-[#209D8B]/40 transition-colors duration-500 -z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M100,0 Q50,0 0,100" fill="none" stroke="currentColor" strokeWidth="4" vectorEffect="non-scaling-stroke" />
                        <circle cx="100" cy="0" r="4" fill="currentColor" vectorEffect="non-scaling-stroke" />
                        <circle r="4" fill="#209D8B" className="shadow-[0_0_8px_#209D8B]">
                          <animateMotion dur="2.5s" repeatCount="indefinite" path="M100,0 Q50,0 0,100" />
                        </circle>
                      </svg>
                    )}
                    {index === 1 && (
                      <svg className="hidden lg:block absolute top-1/2 right-full w-16 xl:w-[130px] h-4 pointer-events-none overflow-visible group-hover:text-[#209D8B] text-[#209D8B]/40 transition-colors duration-500 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none" style={{ transform: 'translateY(-50%)' }}>
                        <path d="M100,5 L0,5" fill="none" stroke="currentColor" strokeWidth="4" vectorEffect="non-scaling-stroke" />
                        <circle cx="100" cy="5" r="4" fill="currentColor" vectorEffect="non-scaling-stroke" />
                        <circle r="4" fill="#209D8B" className="shadow-[0_0_8px_#209D8B]">
                          <animateMotion dur="2.5s" repeatCount="indefinite" path="M100,5 L0,5" />
                        </circle>
                      </svg>
                    )}
                    {index === 2 && (
                      <svg className="hidden lg:block absolute bottom-1/2 right-full w-16 xl:w-[130px] h-20 xl:h-28 pointer-events-none overflow-visible group-hover:text-[#209D8B] text-[#209D8B]/40 transition-colors duration-500 -z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M100,100 Q50,100 0,0" fill="none" stroke="currentColor" strokeWidth="4" vectorEffect="non-scaling-stroke" />
                        <circle cx="100" cy="100" r="4" fill="currentColor" vectorEffect="non-scaling-stroke" />
                        <circle r="4" fill="#209D8B" className="shadow-[0_0_8px_#209D8B]">
                          <animateMotion dur="2.5s" repeatCount="indefinite" path="M100,100 Q50,100 0,0" />
                        </circle>
                      </svg>
                    )}
                  </motion.div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Care Plans Section */}
      <section id="care-options" className="w-full relative bg-[#f8fbfa] pt-12 md:pt-16 pb-32 -mt-8 md:-mt-16 overflow-hidden z-30">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center opacity-40"
          style={{ 
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)', 
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)' 
          }}
        >
          <Image src="/imgsrc.png" alt="Mountains Background" fill className="object-cover object-top mix-blend-multiply" />
        </div>

        {/* Floating Plus Signs (like in image) */}
        <div className="absolute top-[35%] right-[5%] w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center text-[#209D8B] z-10 hidden lg:flex"><Plus size={24} strokeWidth={4} /></div>
        
        <div className="max-w-6xl mx-auto px-4 md:px-6 relative z-10">
          
          {/* Header */}
          <div className="flex flex-col items-center mb-24 gap-6 text-center relative">
            {/* Badge */}
            <div className="flex items-center justify-center gap-4 mb-2">
              <div className="w-12 h-[1px] bg-[#209D8B] relative"><div className="absolute -left-1 -top-[2px] w-[5px] h-[5px] rounded-full bg-[#209D8B]"></div></div>
              <span className="text-[#209D8B] font-bold text-xs tracking-[0.2em] uppercase">Transparent Pricing</span>
              <div className="w-12 h-[1px] bg-[#209D8B] relative"><div className="absolute -right-1 -top-[2px] w-[5px] h-[5px] rounded-full bg-[#209D8B]"></div></div>
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-[56px] font-black text-[#1a2b3c] tracking-tight flex items-center justify-center gap-3">
              Care <span className="text-[#209D8B]">Plans</span>
              <Heart className="w-8 h-8 md:w-10 md:h-10 text-[#209D8B]" strokeWidth={2.5} />
            </h2>
            
            <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl">
              Simple, transparent care plans designed for your loved one's health and your peace of mind.
            </p>
            
            <div className="absolute top-0 right-0 hidden lg:block">
              <button className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-slate-200 bg-white/90 backdrop-blur-sm text-[#209D8B] font-bold text-sm shadow-sm hover:shadow-md transition-shadow">
                All plans <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-6 xl:gap-10 pt-8">
            
            {/* Plan 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="relative bg-white/70 backdrop-blur-xl border border-white rounded-[2rem] p-8 pt-12 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] text-center flex flex-col h-full hover:shadow-[0_20px_50px_-15px_rgba(32,157,139,0.15)] hover:-translate-y-2 transition-all duration-500 group"
            >
              {/* Inner Glow on Hover */}
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-b from-[#209D8B]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

              {/* Floating Icon */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-xl shadow-[#209D8B]/5 border-[3px] border-white/50 transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-1 z-10">
                <div className="w-[68px] h-[68px] rounded-full border border-[#209D8B]/20 flex items-center justify-center text-[#209D8B] bg-white group-hover:bg-[#209D8B] group-hover:text-white transition-colors duration-500">
                  <Smartphone size={32} strokeWidth={1.5} className="transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
                </div>
              </div>
              
              <h3 className="text-2xl font-black text-[#1a2b3c] mb-1 mt-4">Care Connect</h3>
              <p className="text-[#209D8B] font-bold text-[17px] mb-8 tracking-wide">केयर कनेक्ट</p>
              
              <div className="flex flex-col gap-4 text-left flex-1 mb-10">
                <div className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-[#209D8B] shrink-0 mt-0.5" strokeWidth={2} /> <span className="text-slate-600 text-[15px] font-medium">App access & family dashboard</span></div>
                <div className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-[#209D8B] shrink-0 mt-0.5" strokeWidth={2} /> <span className="text-slate-600 text-[15px] font-medium">Dedicated care manager</span></div>
                <div className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-[#209D8B] shrink-0 mt-0.5" strokeWidth={2} /> <span className="text-slate-600 text-[15px] font-medium">Monthly phone wellness check</span></div>
              </div>
              
              <button className="w-full flex justify-center items-center gap-2 py-3.5 rounded-full border-2 border-[#e8ecee] text-[#209D8B] font-bold text-[15px] hover:border-[#209D8B] hover:bg-[#209D8B] hover:text-white transition-colors group">
                Get Started <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
            
            {/* Plan 2 - MOST POPULAR */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative bg-white/95 backdrop-blur-xl border border-[#209D8B]/40 rounded-[2rem] p-8 pt-12 shadow-[0_20px_50px_-15px_rgba(32,157,139,0.2)] text-center flex flex-col h-full transform md:-translate-y-4 hover:-translate-y-6 transition-all duration-500 group"
            >
              {/* Inner Glow on Hover */}
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-b from-[#209D8B]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

              {/* Popular Badge */}
              <div className="absolute -top-[60px] left-1/2 -translate-x-1/2 bg-[#209D8B] text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full flex items-center gap-1 shadow-sm z-20 whitespace-nowrap transition-transform duration-500 group-hover:-translate-y-2">
                ★ MOST POPULAR
              </div>
              
              {/* Floating Icon */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-xl shadow-[#209D8B]/10 border-[3px] border-[#209D8B]/10 z-10 transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-1">
                <div className="w-[68px] h-[68px] rounded-full border border-[#209D8B]/30 flex items-center justify-center text-[#209D8B] bg-[#f8fbfa] group-hover:bg-[#209D8B] group-hover:text-white transition-colors duration-500">
                  <Stethoscope size={32} strokeWidth={1.5} className="transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110" />
                </div>
              </div>
              
              <h3 className="text-2xl font-black text-[#1a2b3c] mb-1 mt-4">Wellness Plus</h3>
              <p className="text-[#209D8B] font-bold text-[17px] mb-8 tracking-wide">वेलनेस प्लस</p>
              
              <div className="flex flex-col gap-4 text-left flex-1 mb-10">
                <div className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-[#209D8B] shrink-0 mt-0.5" strokeWidth={2} /> <span className="text-slate-600 text-[15px] font-medium">Everything in Care Connect</span></div>
                <div className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-[#209D8B] shrink-0 mt-0.5" strokeWidth={2} /> <span className="text-slate-600 text-[15px] font-medium">2 nurse visits per month</span></div>
                <div className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-[#209D8B] shrink-0 mt-0.5" strokeWidth={2} /> <span className="text-slate-600 text-[15px] font-medium">Vitals monitoring & trending</span></div>
              </div>
              
              <button className="w-full flex justify-center items-center gap-2 py-3.5 rounded-full border-2 border-transparent bg-[#209D8B] text-white font-bold text-[15px] hover:bg-[#156e61] transition-colors shadow-md group">
                Get Started <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
            
            {/* Plan 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative bg-white/70 backdrop-blur-xl border border-white rounded-[2rem] p-8 pt-12 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] text-center flex flex-col h-full hover:shadow-[0_20px_50px_-15px_rgba(32,157,139,0.15)] hover:-translate-y-2 transition-all duration-500 group"
            >
              {/* Inner Glow on Hover */}
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-b from-[#209D8B]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

              {/* Floating Icon */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-xl shadow-[#209D8B]/5 border-[3px] border-white/50 transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-1 z-10">
                <div className="w-[68px] h-[68px] rounded-full border border-[#209D8B]/20 flex items-center justify-center text-[#209D8B] bg-white group-hover:bg-[#209D8B] group-hover:text-white transition-colors duration-500">
                  <HeartPulse size={32} strokeWidth={1.5} className="transition-transform duration-500 group-hover:scale-110" />
                </div>
              </div>
              
              <h3 className="text-2xl font-black text-[#1a2b3c] mb-1 mt-4">Chronic Care</h3>
              <p className="text-[#209D8B] font-bold text-[17px] mb-8 tracking-wide">क्रोनिक केयर</p>
              
              <div className="flex flex-col gap-4 text-left flex-1 mb-10">
                <div className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-[#209D8B] shrink-0 mt-0.5" strokeWidth={2} /> <span className="text-slate-600 text-[15px] font-medium">Weekly vitals monitoring</span></div>
                <div className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-[#209D8B] shrink-0 mt-0.5" strokeWidth={2} /> <span className="text-slate-600 text-[15px] font-medium">Medicine coordination & refills</span></div>
                <div className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-[#209D8B] shrink-0 mt-0.5" strokeWidth={2} /> <span className="text-slate-600 text-[15px] font-medium">Monthly doctor review</span></div>
              </div>
              
              <button className="w-full flex justify-center items-center gap-2 py-3.5 rounded-full border-2 border-[#e8ecee] text-[#209D8B] font-bold text-[15px] hover:border-[#209D8B] hover:bg-[#209D8B] hover:text-white transition-colors group">
                Get Started <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Testimonials & App Features Section */}
      <section className="relative w-full pt-10 pb-8 z-20 bg-[#f8fbfa] overflow-hidden min-h-[90vh] flex flex-col justify-center">
        {/* Background */}
        <div 
          className="absolute inset-0 z-0"
          style={{ 
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 100%)', 
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 100%)' 
          }}
        >
          <Image src="/testoimg.png" alt="Features Background" fill className="object-cover object-bottom opacity-100" priority={false} />
          {/* Dim only the left side for text readability, ensuring the sofa and phone on the right are completely untouched */}
          <div className="absolute top-0 left-0 w-full lg:w-[50%] h-full bg-gradient-to-r from-[#f8fbfa] via-[#f8fbfa]/95 to-transparent z-10 pointer-events-none"></div>
        </div>
        
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 relative z-10 w-full">
          
          {/* Testimonials Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-12 h-[1px] bg-[#209D8B] relative"><div className="absolute -left-1 -top-[2px] w-[5px] h-[5px] rounded-full bg-[#209D8B]"></div></div>
              <span className="text-[#209D8B] font-bold text-xs tracking-[0.2em] uppercase">Real Stories</span>
              <div className="w-12 h-[1px] bg-[#209D8B] relative"><div className="absolute -right-1 -top-[2px] w-[5px] h-[5px] rounded-full bg-[#209D8B]"></div></div>
            </div>
            <div className="flex justify-center items-center gap-3">
              <h2 className="text-4xl md:text-5xl font-black text-[#1a2b3c] tracking-tight">
                What <span className="text-[#209D8B]">Families Say</span>
              </h2>
              <Heart className="w-8 h-8 text-[#209D8B]" strokeWidth={2.5} />
            </div>
          </div>
          
          {/* Testimonials Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16 max-w-6xl mx-auto">
             {/* Card 1 */}
             <motion.div 
               initial={{ opacity: 0, y: 40 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: "-50px" }}
               transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
               className="bg-white/95 backdrop-blur-md rounded-[2rem] p-8 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_50px_-15px_rgba(32,157,139,0.15)] hover:-translate-y-2 transition-all duration-500 relative overflow-hidden flex gap-5 border border-white group cursor-default"
             >
               {/* Inner Glow on Hover */}
               <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-b from-[#209D8B]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

               <div className="flex flex-col items-center gap-3 shrink-0 relative z-10">
                 <div className="text-[#209D8B] text-5xl font-serif font-black leading-none mt-2 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500">“</div>
                 <div className="w-12 h-12 rounded-full bg-[#209D8B] flex items-center justify-center text-white font-bold text-[17px] shadow-md mt-1 group-hover:bg-[#156e61] transition-colors duration-500">RT</div>
               </div>
               <div className="flex flex-col pt-3 relative z-10">
                 <p className="text-[#1a2b3c] font-medium leading-relaxed mb-6 text-[15px] italic">
                   I check my mother's vitals from my phone every morning. Saathi Sneha Care changed my relationship with distance.
                 </p>
                 <div className="w-8 h-[2px] bg-[#209D8B]/30 mb-4 group-hover:w-16 transition-all duration-500"></div>
                 <div className="text-[13px] font-bold">
                   <span className="text-[#209D8B]">Raj Thapa</span> <span className="text-slate-400 font-medium">· Boston, USA</span>
                 </div>
               </div>
             </motion.div>

             {/* Card 2 */}
             <motion.div 
               initial={{ opacity: 0, y: 40 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: "-50px" }}
               transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
               className="bg-white/95 backdrop-blur-md rounded-[2rem] p-8 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_50px_-15px_rgba(32,157,139,0.15)] hover:-translate-y-2 transition-all duration-500 relative overflow-hidden flex gap-5 border border-white group cursor-default"
             >
               {/* Inner Glow on Hover */}
               <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-b from-[#209D8B]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

               <div className="flex flex-col items-center gap-3 shrink-0 relative z-10">
                 <div className="text-[#209D8B] text-5xl font-serif font-black leading-none mt-2 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500">“</div>
                 <div className="w-12 h-12 rounded-full bg-[#209D8B] flex items-center justify-center text-white font-bold text-[17px] shadow-md mt-1 group-hover:bg-[#156e61] transition-colors duration-500">PS</div>
               </div>
               <div className="flex flex-col pt-3 relative z-10">
                 <p className="text-[#1a2b3c] font-medium leading-relaxed mb-6 text-[15px] italic">
                   After Baba's fall, the nurse visits gave us real confidence he's safe and comfortable at home.
                 </p>
                 <div className="w-8 h-[2px] bg-[#209D8B]/30 mb-4 group-hover:w-16 transition-all duration-500"></div>
                 <div className="text-[13px] font-bold">
                   <span className="text-[#209D8B]">Priya Shrestha</span> <span className="text-slate-400 font-medium">· London, UK</span>
                 </div>
               </div>
             </motion.div>

             {/* Card 3 */}
             <motion.div 
               initial={{ opacity: 0, y: 40 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: "-50px" }}
               transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
               className="bg-white/95 backdrop-blur-md rounded-[2rem] p-8 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_50px_-15px_rgba(32,157,139,0.15)] hover:-translate-y-2 transition-all duration-500 relative overflow-hidden flex gap-5 border border-white group cursor-default"
             >
               {/* Inner Glow on Hover */}
               <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-b from-[#209D8B]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

               <div className="flex flex-col items-center gap-3 shrink-0 relative z-10">
                 <div className="text-[#209D8B] text-5xl font-serif font-black leading-none mt-2 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500">“</div>
                 <div className="w-12 h-12 rounded-full bg-[#209D8B] flex items-center justify-center text-white font-bold text-[17px] shadow-md mt-1 group-hover:bg-[#156e61] transition-colors duration-500">SG</div>
               </div>
               <div className="flex flex-col pt-3 relative z-10">
                 <p className="text-[#1a2b3c] font-medium leading-relaxed mb-6 text-[15px] italic">
                   Lab results go straight to the dashboard. Ama no longer has to navigate the city for tests.
                 </p>
                 <div className="w-8 h-[2px] bg-[#209D8B]/30 mb-4 group-hover:w-16 transition-all duration-500"></div>
                 <div className="text-[13px] font-bold">
                   <span className="text-[#209D8B]">Sunil Gurung</span> <span className="text-slate-400 font-medium">· Sydney, Australia</span>
                 </div>
               </div>
             </motion.div>
          </div>
          
          {/* App Features Area */}
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-6 items-center mb-10 pl-4 lg:pl-16">
            {/* Left Text Box */}
            <div className="flex-1 w-full max-w-lg relative z-20">
              <div className="flex items-center justify-start gap-4 mb-5">
                <div className="w-12 h-[1px] bg-[#209D8B] relative"><div className="absolute -left-1 -top-[2px] w-[5px] h-[5px] rounded-full bg-[#209D8B]"></div></div>
                <span className="text-[#209D8B] font-bold text-xs tracking-[0.2em] uppercase">For Families Abroad</span>
                <div className="w-12 h-[1px] bg-[#209D8B] relative"><div className="absolute -right-1 -top-[2px] w-[5px] h-[5px] rounded-full bg-[#209D8B]"></div></div>
              </div>
              <h3 className="text-3xl md:text-4xl leading-[1.15] font-black text-[#1a2b3c] mb-8">
                When you can't<br />be there, <span className="text-[#209D8B]">we are.</span>
              </h3>
              
              <div className="flex flex-col gap-2 mb-8 relative">
                 {/* Connecting vertical line */}
                 <div className="absolute left-[19px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-[#209D8B]/50 via-[#209D8B]/20 to-transparent z-0"></div>

                 {[
                   { icon: <HeartPulse size={18} strokeWidth={2.5} />, text: "Real-time health dashboard" },
                   { icon: <ClipboardCheck size={18} strokeWidth={2.5} />, text: "Visit summaries after every nurse visit" },
                   { icon: <FlaskConical size={18} strokeWidth={2.5} />, text: "Lab results with flagged abnormals" },
                   { icon: <Bell size={18} strokeWidth={2.5} />, text: "Emergency alerts sent directly to you" },
                   { icon: <CreditCard size={18} strokeWidth={2.5} />, text: "Pay by credit card from abroad" },
                 ].map((item, i) => (
                   <motion.div 
                     initial={{ opacity: 0, x: -20 }}
                     whileInView={{ opacity: 1, x: 0 }}
                     transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
                     viewport={{ once: true, margin: "-50px" }}
                     key={i} 
                     className="relative z-10 flex items-center gap-4 group cursor-default"
                   >
                     {/* Icon */}
                     <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#209D8B] shrink-0 border-2 border-[#209D8B]/20 shadow-sm group-hover:bg-[#209D8B] group-hover:text-white group-hover:scale-110 group-hover:border-[#209D8B] transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(32,157,139,0.4)] relative">
                       {item.icon}
                     </div>
                     {/* Text Pill */}
                     <div className="bg-transparent group-hover:bg-white/90 group-hover:backdrop-blur-md group-hover:shadow-[0_8px_20px_rgba(32,157,139,0.12)] px-4 py-3 rounded-2xl border border-transparent group-hover:border-white transition-all duration-300 transform group-hover:translate-x-2">
                       <span className="text-[#1a2b3c] font-bold text-[14px] group-hover:text-[#156e61] transition-colors duration-300 whitespace-nowrap">{item.text}</span>
                     </div>
                   </motion.div>
                 ))}
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mt-2">
                <button className="flex justify-center items-center gap-2 px-7 py-3 rounded-full bg-[#209D8B] text-white font-bold text-[14px] hover:bg-[#156e61] transition-colors shadow-lg group">
                  Talk to Our Team <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
            
            {/* Right side is intentionally left blank so the background image (phone & couch) is visible */}
            <div className="flex-1 w-full min-h-[350px] lg:min-h-0 relative z-10 pointer-events-none"></div>
          </div>
          
        </div>
      </section>
      <footer className="w-full relative bg-[#f4f9f8] pt-24 overflow-hidden z-30 flex flex-col justify-between min-h-[600px] md:min-h-[700px]">
        {/* Top Wave Divider */}
        <div className="absolute top-0 left-0 w-full overflow-hidden leading-[0] pointer-events-none rotate-180 z-10">
          <svg viewBox="0 0 1440 100" className="w-full h-8 md:h-12 block" preserveAspectRatio="none">
            <path fill="#f8fbfa" d="M0,0 C 350,100 900,100 1440,0 L 1440,100 L 0,100 Z"></path>
          </svg>
        </div>

        {/* The Footer Graphic - Stretched to both corners as full footer background */}
        <div className="absolute bottom-0 left-0 w-full z-0 pointer-events-none">
          <img src="/footer_graphics.png" alt="Medical Supplies Background" className="w-full h-auto object-bottom -scale-x-100" />
        </div>


        
        {/* Decorative Leaf on Left */}
        <div className="absolute top-[30%] left-[-5%] w-[20%] opacity-[0.02] pointer-events-none -scale-x-100 hidden lg:block z-0">
           <svg viewBox="0 0 200 400" fill="currentColor">
              <path d="M100,400 C100,200 0,150 0,150 C50,150 100,200 100,300 C100,200 200,100 200,100 C150,150 100,200 100,400 Z"/>
           </svg>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 w-full mt-8 lg:mt-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 pb-10 items-start">
            
            {/* Column 1: Brand & Info */}
            <div className="lg:col-span-4 flex flex-col">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-3 shrink-0 group mb-8">
                <div className="w-[84px] h-[84px] group-hover:scale-105 transition-transform duration-500">
                  <AnimatedLogo phase={4} />
                </div>
                <div className="leading-none flex items-center gap-4">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-black text-[#106b5b] text-5xl tracking-tight" style={{ fontFamily: 'var(--font-quicksand)' }}>Saathi</span>
                    </div>
                    <div className="mt-1.5">
                      <span className="text-[20px] font-bold tracking-wide text-[#209D8B]">Sneha Care</span>
                    </div>
                  </div>
                  <Heart className="text-[#209D8B] opacity-80" size={28} strokeWidth={2}/>
                </div>
              </Link>
              
              {/* Cursive Tagline with SVG Swoosh */}
              <div className="relative mb-8 w-fit mt-3">
                <h3 className={`${dancingScript.className} text-[36px] text-[#1a2b3c] whitespace-nowrap z-10 relative pr-12`} style={{ letterSpacing: '1px' }}>
                  Care that feels like family
                </h3>
                <svg viewBox="0 0 550 60" className="absolute -bottom-6 left-0 w-[125%] h-[40px] text-[#209D8B] z-0 overflow-visible" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  {/* Single continuous path: longer underline -> left lobe -> right lobe -> tail */}
                  <path d="M 0,45 Q 230,42 460,45 C 430,10 445,0 460,20 C 475,0 490,10 460,45 Q 490,40 530,32" />
                </svg>
              </div>

              <p className="text-[#334659] text-[18px] leading-relaxed font-medium mb-8">
                Professional home care for<br/>your parents in Nepal.
              </p>

              {/* Removed Nepali Text Pill from here as it was moved to footer bottom */}
            </div>

            {/* Column 2: Services */}
            <div className="lg:col-span-3 lg:pl-4">
              <div className="inline-flex items-center gap-3 bg-[#e8f6f3] pr-5 p-1.5 rounded-full mb-8">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#209D8B] shadow-sm">
                  <Stethoscope size={18} strokeWidth={2.5}/>
                </div>
                <span className="font-bold text-[#106b5b] text-[16px]">Services</span>
              </div>
              <ul className="flex flex-col gap-6">
                {[
                  { icon: <HeartPulse size={20} strokeWidth={2}/>, label: "Wellness Checks", href: "#" },
                  { icon: <UserPlus size={20} strokeWidth={2}/>, label: "Chronic Disease Care", href: "#" },
                  { icon: <Pill size={20} strokeWidth={2}/>, label: "Medication Management", href: "#" },
                ].map((item, i) => (
                  <li key={i}>
                    <Link href={item.href} className="flex items-center gap-4 text-[#4a5f73] hover:text-[#209D8B] font-semibold transition-colors group">
                      <div className="text-[#209D8B] group-hover:scale-110 transition-transform duration-300">
                        {item.icon}
                      </div>
                      <span className="text-[15px]">{item.label}</span>
                    </Link>
                  </li>
                ))}
                <li className="pt-2">
                  <Link href="#" className="text-[#209D8B] font-bold text-[14px] hover:underline">
                    – many more →
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Company */}
            <div className="lg:col-span-2">
              <div className="inline-flex items-center gap-3 bg-[#e8f6f3] pr-5 p-1.5 rounded-full mb-8">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#209D8B] shadow-sm">
                  <Building2 size={18} strokeWidth={2.5}/>
                </div>
                <span className="font-bold text-[#106b5b] text-[16px]">Company</span>
              </div>
              <ul className="flex flex-col gap-6">
                {[
                  { icon: <Users size={20} strokeWidth={2}/>, label: "About Us", href: "#" },
                  { icon: <ClipboardCheck size={20} strokeWidth={2}/>, label: "Plans & Pricing", href: "#" },
                  { icon: <Phone size={20} strokeWidth={2}/>, label: "Contact", href: "#" },
                ].map((item, i) => (
                  <li key={i}>
                    <Link href={item.href} className="flex items-center gap-4 text-[#4a5f73] hover:text-[#209D8B] font-semibold transition-colors group">
                      <div className="text-[#209D8B] group-hover:scale-110 transition-transform duration-300">
                        {item.icon}
                      </div>
                      <span className="text-[15px]">{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Contact */}
            <div className="lg:col-span-3 relative lg:pl-10">
              {/* Vertical line divider for large screens */}
              <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-[1px] bg-slate-200/60"></div>
              
              <div className="inline-flex items-center gap-3 bg-[#e8f6f3] pr-5 p-1.5 rounded-full mb-8">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#209D8B] shadow-sm">
                  <MapPin size={18} strokeWidth={2.5}/>
                </div>
                <span className="font-bold text-[#106b5b] text-[16px]">Contact</span>
              </div>
              <ul className="flex flex-col gap-6">
                <li>
                  <div className="flex items-center gap-4 text-[#4a5f73] font-semibold group cursor-pointer hover:text-[#209D8B] transition-colors">
                    <MapPin size={20} strokeWidth={2} className="text-[#209D8B] shrink-0 group-hover:scale-110 transition-transform duration-300"/>
                    <span className="text-[15px]">Kathmandu, Nepal</span>
                  </div>
                </li>
                <li>
                  <div className="flex items-center gap-4 text-[#4a5f73] font-semibold group cursor-pointer hover:text-[#209D8B] transition-colors">
                    <Phone size={20} strokeWidth={2} className="text-[#209D8B] shrink-0 group-hover:scale-110 transition-transform duration-300"/>
                    <span className="text-[15px]">+977 980-1234567</span>
                  </div>
                </li>
                <li>
                  <div className="flex items-center gap-4 text-[#4a5f73] font-semibold group cursor-pointer hover:text-[#209D8B] transition-colors">
                    <Mail size={20} strokeWidth={2} className="text-[#209D8B] shrink-0 group-hover:scale-110 transition-transform duration-300"/>
                    <span className="text-[15px]">care@saathisnehacare.com</span>
                  </div>
                </li>
                <li>
                  <div className="flex items-center gap-4 text-[#4a5f73] font-semibold group cursor-pointer hover:text-[#209D8B] transition-colors">
                    <Globe size={20} strokeWidth={2} className="text-[#209D8B] shrink-0 group-hover:scale-110 transition-transform duration-300"/>
                    <span className="text-[15px]">www.saathisnehacare.com</span>
                  </div>
                </li>
              </ul>
            </div>
            
          </div>
        </div>

        {/* Bottom: Social Icons, Copyright & Nepali Text */}
        <div className="relative z-20 w-full px-6 md:px-12 pb-8 mt-auto pt-[120px] md:pt-[180px] flex flex-col md:flex-row items-center justify-between gap-10 md:gap-0">
           
           {/* Left: Social Icons + Copyright */}
           <div className="flex flex-col items-center md:items-start gap-5 w-full md:w-1/3">
              {/* Social Icons — bigger, glassmorphic */}
              <div className="flex items-center gap-4">
                 <Link href="#" className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/25 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(255,255,255,0.15)] transition-all duration-300">
                   <Facebook size={22} />
                 </Link>
                 <Link href="#" className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/25 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(255,255,255,0.15)] transition-all duration-300">
                   <Instagram size={22} />
                 </Link>
                 <Link href="#" className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/25 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(255,255,255,0.15)] transition-all duration-300">
                   <MessageCircle size={22} />
                 </Link>
              </div>

              {/* Thin separator */}
              <div className="w-48 h-[1px] bg-white/15"></div>

              {/* Copyright */}
              <p className="text-white/80 text-[14px] font-medium tracking-wide">
                 © 2025 Saathi Sneha Care. All rights reserved.
              </p>
           </div>

           {/* Center: Creative Nepali Text (Shifted Diagonally Up) */}
           <div className="flex justify-center w-full md:w-1/3 order-first md:order-none mb-8 md:mb-0 md:-translate-y-[140px] md:-translate-x-[110px] z-30">
              <div className="group inline-flex items-center justify-center gap-4 px-8 py-4 rounded-full bg-white/95 backdrop-blur-md border border-white/60 shadow-[0_20px_50px_rgba(16,107,91,0.08)] hover:shadow-[0_25px_60px_rgba(32,157,139,0.15)] hover:-translate-y-1.5 transition-all duration-500 cursor-default relative overflow-hidden">
                 
                 {/* Ambient glow behind icon */}
                 <div className="absolute left-6 w-12 h-12 bg-[#209D8B] rounded-full blur-xl opacity-15 group-hover:opacity-30 transition-opacity duration-500"></div>
                 
                 {/* Icon container */}
                 <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-[#106b5b] to-[#209D8B] shadow-md group-hover:scale-110 transition-transform duration-500">
                    <Heart size={18} fill="currentColor" strokeWidth={0} className="text-white" />
                 </div>
                 
                 {/* Text */}
                 <span className="relative z-10 text-[#1a2b3c] font-extrabold text-[16px] sm:text-[18px] tracking-[0.02em] group-hover:text-[#106b5b] transition-colors duration-300">
                    साथी स्नेह केयर — आमाबाको हेरचाह
                 </span>
              </div>
           </div>

           {/* Right: Empty spacer for flex-between balance */}
           <div className="hidden md:block w-full md:w-1/3"></div>

        </div>
      </footer>
    </div>
    </>
  );
}
