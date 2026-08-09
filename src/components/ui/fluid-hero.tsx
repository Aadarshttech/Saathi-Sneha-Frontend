"use client";
import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function FluidHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Parallax effects
  const yText = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacityText = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const yImage = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const scaleImage = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  return (
    <main ref={containerRef} className="relative w-full h-screen min-h-[800px] flex items-center justify-center overflow-hidden">
      
      {/* Immersive Background Image (Faded into the void) */}
      <motion.div 
        style={{ y: yImage, scale: scaleImage }}
        className="absolute inset-0 z-0 flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-[#030303] z-10"></div>
        {/* We use a radial gradient to mask the image seamlessly into the black background so there are NO box edges */}
        <div 
          className="absolute w-[120vw] h-[120vh] opacity-40 mix-blend-luminosity pointer-events-none"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1576091160550-2173ff9e9e9c?q=80&w=2000&auto=format&fit=crop)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            maskImage: 'radial-gradient(circle at center, black 20%, transparent 60%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 20%, transparent 60%)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#030303]/50 to-[#030303] z-10"></div>
      </motion.div>

      {/* Fluid, Gridless Typography */}
      <div className="relative z-20 w-full px-6 md:px-12 flex flex-col items-center justify-center text-center mt-20">
        
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          style={{ y: yText, opacity: opacityText }}
        >
          <p className="text-emerald-500 tracking-[0.2em] uppercase text-xs md:text-sm font-semibold mb-6">
            Distance is no longer a barrier
          </p>

          <h1 className="text-[12vw] sm:text-[9vw] md:text-[7vw] font-black leading-[0.85] tracking-tighter text-white mix-blend-difference mb-8">
            EXPERT CARE. <br/>
            <span className="italic font-light text-white/70">OCEANS AWAY.</span>
          </h1>

          <p className="text-lg md:text-2xl text-white/50 max-w-2xl mx-auto font-light leading-relaxed mb-12">
            Clinical home care for the ones who raised you. Stay constantly connected through real-time health dashboards.
          </p>

          {/* Liquid CTA Button (No hard box, completely rounded pill with soft glowing borders) */}
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group relative inline-flex items-center gap-4 px-10 py-5 rounded-full overflow-hidden border border-emerald-500/30 bg-transparent text-white"
          >
            <div className="absolute inset-0 bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors duration-500"></div>
            <span className="relative z-10 text-sm md:text-base font-medium tracking-wide uppercase">Initiate Care Plan</span>
            <div className="relative z-10 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-4 h-4 text-black" />
            </div>
          </motion.button>
        </motion.div>
        
      </div>

      {/* Floating abstract element (replacing rigid boxes) */}
      <motion.div 
        animate={{ 
          y: [0, -20, 0],
          rotate: [0, 5, 0]
        }}
        transition={{ 
          duration: 6, 
          repeat: Infinity,
          ease: "easeInOut" 
        }}
        className="absolute top-1/4 left-10 md:left-20 w-32 h-32 md:w-64 md:h-64 rounded-full bg-emerald-600/10 blur-[60px] pointer-events-none z-10"
      />
      <motion.div 
        animate={{ 
          y: [0, 30, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ 
          duration: 8, 
          repeat: Infinity,
          ease: "easeInOut" 
        }}
        className="absolute bottom-1/4 right-10 md:right-20 w-48 h-48 md:w-96 md:h-96 rounded-full bg-blue-600/10 blur-[80px] pointer-events-none z-10"
      />

    </main>
  );
}
