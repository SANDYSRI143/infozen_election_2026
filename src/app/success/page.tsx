"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Home } from "lucide-react";

export default function SuccessPage() {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Prevent back navigation
    window.history.pushState(null, "", window.location.pathname);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);

    // Countdown redirect
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          window.location.href = "/";
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#F0F7FF] to-[#DCEEFF] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="text-center max-w-md"
      >
        {/* Animated checkmark */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-24 h-24 rounded-full bg-[#16A34A]/10 dark:bg-[#16A34A]/5 flex items-center justify-center mx-auto mb-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            className="w-16 h-16 rounded-full bg-[#16A34A] flex items-center justify-center"
          >
            <CheckCircle2 className="w-8 h-8 text-white" />
          </motion.div>
        </motion.div>

        <h1 className="text-3xl font-bold text-[#1A1A1A] dark:text-white mb-2">
          Vote Submitted Successfully!
        </h1>
        <p className="text-[#6B7280] dark:text-slate-400 mb-2">
          Your vote has been recorded securely. Thank you for participating in
          the election.
        </p>
        <p className="text-sm text-[#6B7280] dark:text-slate-400 mb-8">
          You will be redirected in{" "}
          <span className="font-semibold text-[#4A90E2] dark:text-blue-400">{countdown}s</span>
        </p>

        <Link href="/">
          <Button className="bg-[#4A90E2] hover:bg-[#357ABD] text-white px-6">
            <Home className="w-4 h-4 mr-2" />
            Return Home
          </Button>
        </Link>

        <p className="text-xs text-[#6B7280] dark:text-slate-500 mt-6">
          Secure Votes. Fair Leadership.
        </p>
      </motion.div>
    </div>
  );
}
