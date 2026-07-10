"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PauseCircle, Home, RefreshCw, Wifi, Clock } from "lucide-react";

export default function ElectionPausedPage() {
  const [checking, setChecking] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [nextCheckIn, setNextCheckIn] = useState(15);
  const [checkCount, setCheckCount] = useState(0);

  // Format elapsed time as MM:SS
  const formatElapsed = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Check election status
  const checkStatus = useCallback(async (manual = false) => {
    if (manual) setChecking(true);
    try {
      const res = await fetch("/api/election/status");
      if (res.ok) {
        const data = await res.json();
        if (data.status === "ACTIVE") {
          window.location.href = "/login";
          return;
        }
      }
    } catch {
      // Silently retry
    }
    if (manual) {
      setChecking(false);
      setCheckCount((c) => c + 1);
    }
  }, []);

  // Auto-check every 15 seconds
  useEffect(() => {
    const statusInterval = setInterval(() => {
      checkStatus(false);
      setNextCheckIn(15);
    }, 15000);

    const countdownInterval = setInterval(() => {
      setNextCheckIn((c) => (c <= 1 ? 15 : c - 1));
    }, 1000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(countdownInterval);
    };
  }, [checkStatus]);

  // Elapsed time counter
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleManualCheck = () => {
    checkStatus(true);
    setNextCheckIn(15);
  };

  // Calculate the countdown ring progress (0 to 1)
  const ringProgress = (15 - nextCheckIn) / 15;
  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference * (1 - ringProgress);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#F0F7FF] to-[#DCEEFF] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4 transition-colors duration-300 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="fixed -top-40 -right-40 w-96 h-96 rounded-full bg-[#F59E0B]/5 dark:bg-[#F59E0B]/3 blur-3xl" />
      <div className="fixed -bottom-20 -left-20 w-72 h-72 rounded-full bg-[#4A90E2]/8 dark:bg-blue-900/5 blur-3xl" />
      <div className="fixed top-1/4 left-1/4 w-48 h-48 rounded-full bg-[#F59E0B]/3 blur-3xl animate-pulse" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center max-w-lg relative z-10 w-full"
      >
        {/* Animated pause icon with concentric rings */}
        <div className="relative w-28 h-28 mx-auto mb-8">
          {/* Outer pulsing ring */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.05, 0.15] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full bg-[#F59E0B]"
          />
          {/* Middle ring */}
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.2, 0.08, 0.2] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            className="absolute inset-2 rounded-full bg-[#F59E0B]"
          />
          {/* Inner circle */}
          <div className="absolute inset-4 rounded-full bg-[#F59E0B]/10 dark:bg-[#F59E0B]/5 flex items-center justify-center backdrop-blur-sm">
            <motion.div
              animate={{ scale: [1, 0.92, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <PauseCircle className="w-12 h-12 text-[#F59E0B]" />
            </motion.div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] dark:text-white mb-3 tracking-tight">
          Election Temporarily Paused
        </h1>
        <p className="text-[#6B7280] dark:text-slate-400 mb-8 text-base md:text-lg leading-relaxed max-w-md mx-auto">
          The administrator has paused the election.
          Voting will resume shortly — please stay on this page.
        </p>

        {/* Status card with glassmorphism */}
        <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-[#F59E0B]/15 dark:border-[#F59E0B]/10 p-6 mb-6 shadow-lg shadow-[#F59E0B]/5">
          {/* Live connection indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-[#F59E0B]"
            />
            <span className="text-xs font-medium text-[#92400E] dark:text-[#F59E0B] uppercase tracking-wider">
              Monitoring Election Status
            </span>
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              className="w-2 h-2 rounded-full bg-[#F59E0B]"
            />
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-6">
            {/* Waiting time */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] dark:bg-[#F59E0B]/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-[#92400E] dark:text-[#F59E0B]" />
              </div>
              <div className="text-left">
                <p className="text-xs text-[#6B7280] dark:text-slate-400">Waiting</p>
                <p className="text-sm font-semibold text-[#1A1A1A] dark:text-white font-mono">
                  {formatElapsed(elapsedSeconds)}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-10 bg-[#E2E8F0] dark:bg-slate-800" />

            {/* Next check countdown ring */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#DCEEFF] dark:bg-blue-900/20 flex items-center justify-center relative">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 40 40">
                  <circle
                    cx="20"
                    cy="20"
                    r="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-[#E2E8F0] dark:text-slate-800"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="text-[#4A90E2] transition-all duration-1000 ease-linear"
                  />
                </svg>
                <Wifi className="w-3.5 h-3.5 text-[#4A90E2]" />
              </div>
              <div className="text-left">
                <p className="text-xs text-[#6B7280] dark:text-slate-400">Next check</p>
                <p className="text-sm font-semibold text-[#1A1A1A] dark:text-white font-mono">
                  {nextCheckIn}s
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info banner */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#FEF3C7]/60 dark:bg-[#FEF3C7]/5 rounded-xl p-4 mb-6 border border-[#F59E0B]/15 dark:border-[#F59E0B]/8"
        >
          <p className="text-sm text-[#92400E] dark:text-[#FCD34D] font-medium leading-relaxed">
            🔄 This page automatically checks for updates every 15 seconds.
            You&apos;ll be redirected as soon as voting resumes.
          </p>
        </motion.div>

        {/* Action buttons */}
        <div className="flex gap-3 justify-center">
          <Link href="/">
            <Button
              variant="outline"
              className="border-[#E2E8F0] dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm hover:bg-slate-50 dark:hover:bg-slate-800 text-foreground px-5 h-11 rounded-xl transition-all duration-200"
            >
              <Home className="w-4 h-4 mr-2" />
              Return Home
            </Button>
          </Link>
          <Button
            onClick={handleManualCheck}
            disabled={checking}
            className="bg-[#4A90E2] hover:bg-[#357ABD] text-white px-5 h-11 rounded-xl transition-all duration-200 shadow-md shadow-[#4A90E2]/20"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Checking..." : "Check Now"}
          </Button>
        </div>

        {/* Check count subtle indicator */}
        {checkCount > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-[#9CA3AF] dark:text-slate-500 mt-4"
          >
            Checked {checkCount} {checkCount === 1 ? "time" : "times"} manually
          </motion.p>
        )}

        {/* Footer */}
        <p className="text-xs text-[#6B7280] dark:text-slate-500 mt-6">
          Secure Votes. Fair Leadership.
        </p>
      </motion.div>
    </div>
  );
}
