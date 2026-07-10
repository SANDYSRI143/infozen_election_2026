"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Clock, Home } from "lucide-react";
import { useElectionStatus } from "@/hooks/useElectionStatus";

export default function ElectionClosedPage() {
  const { settings } = useElectionStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#F0F7FF] to-[#DCEEFF] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="w-20 h-20 rounded-full bg-[#F59E0B]/10 dark:bg-[#F59E0B]/5 flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-[#F59E0B]" />
        </div>

        <h1 className="text-3xl font-bold text-[#1A1A1A] dark:text-white mb-2">
          Election Not Active
        </h1>
        <p className="text-[#6B7280] dark:text-slate-400 mb-6">
          {settings?.status === "ENDED"
            ? "The election has ended. Thank you for your interest."
            : settings?.status === "NOT_STARTED"
            ? "The election has not started yet. Please check back later."
            : "Voting is currently unavailable."}
        </p>

        {settings?.start_time && settings.status === "NOT_STARTED" && (
          <div className="bg-[#DCEEFF] dark:bg-blue-950/30 rounded-xl p-4 mb-6">
            <p className="text-sm text-[#4A90E2] dark:text-blue-400 font-medium">
              Scheduled to start at
            </p>
            <p className="text-lg font-semibold text-[#1A1A1A] dark:text-white">
              {new Date(settings.start_time).toLocaleString()}
            </p>
          </div>
        )}

        <Link href="/">
          <Button className="bg-[#4A90E2] hover:bg-[#357ABD] text-white px-6">
            <Home className="w-4 h-4 mr-2" />
            Return Home
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
