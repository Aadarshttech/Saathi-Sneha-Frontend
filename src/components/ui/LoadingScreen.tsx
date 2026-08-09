"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedLogo from "./AnimatedLogo";

interface LoadingScreenProps {
  isReady: boolean;
  onComplete: () => void;
}

export default function LoadingScreen({ isReady, onComplete }: LoadingScreenProps) {
  const [phase, setPhase] = useState(0);
  const [exitReady, setExitReady] = useState(false);

  const stableOnComplete = useCallback(onComplete, []);

  // Handle when website content is completely loaded
  useEffect(() => {
    if (isReady) {
      // Trigger smooth fade exit immediately when ready
      setExitReady(true);
      const t = setTimeout(() => {
        stableOnComplete();
      }, 800); // Wait 800ms for the smooth fade out to finish
      return () => clearTimeout(t);
    }
  }, [isReady, stableOnComplete]);

  // Single cinematic animation sequence
  useEffect(() => {
    let isActive = true;

    const playSequence = async () => {
      // Phase 1: HOME + GRANDMA
      if (!isActive) return;
      setPhase(1);
      await new Promise(r => setTimeout(r, 400));
      
      // Phase 2: MAN
      if (!isActive) return;
      setPhase(2);
      await new Promise(r => setTimeout(r, 400));
      
      // Phase 3: HEART / HANDS
      if (!isActive) return;
      setPhase(3);
      await new Promise(r => setTimeout(r, 400));
      
      // Phase 4: LEAVES + FULL
      if (!isActive) return;
      setPhase(4);
    };

    playSequence();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-white"
      initial={{ opacity: 1 }}
      animate={exitReady ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <div className="relative w-[200px] h-[200px] md:w-[260px] md:h-[260px] lg:w-[300px] lg:h-[300px]">
        {/* SVG Animated Outline Logo - draws phase by phase */}
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 1, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ opacity: { duration: 0.8 }, scale: { duration: 0.6, ease: "easeOut" } }}
        >
          <AnimatedLogo phase={phase} />
        </motion.div>
      </div>
    </motion.div>
  );
}
