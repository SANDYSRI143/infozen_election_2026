"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Vote,
  ArrowRight,
  Lock,
} from "lucide-react";

export default function HomePage() {
  const [electionStatus, setElectionStatus] = useState<string>("NOT_STARTED");
  const [electionTitle, setElectionTitle] = useState<string>("");

  useEffect(() => {
    fetch("/api/election/status")
      .then((r) => r.json())
      .then((data) => {
        setElectionStatus(data.status || "NOT_STARTED");
        setElectionTitle(data.settings?.election_title || "");
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#F0F7FF] to-[#DCEEFF] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[#DCEEFF]/40 dark:bg-blue-900/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-[#4A90E2]/10 dark:bg-blue-900/5 blur-3xl" />

        <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#4A90E2] flex items-center justify-center">
              <Vote className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[#1A1A1A] dark:text-white tracking-tight">
              Association Election
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/admin/login">
              <Button variant="ghost" size="sm" className="text-[#6B7280] hover:text-[#1A1A1A] dark:text-slate-400 dark:hover:text-white">
                <Lock className="w-4 h-4 mr-1" />
                Admin
              </Button>
            </Link>
          </div>
        </nav>

        <div className="relative z-10 max-w-4xl mx-auto px-6 pt-16 pb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Status Badge */}
            <Badge
              variant={electionStatus === "ACTIVE" ? "default" : "secondary"}
              className={`mb-6 px-4 py-1.5 text-sm font-medium ${
                electionStatus === "ACTIVE"
                  ? "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20 hover:bg-[#16A34A]/10"
                  : electionStatus === "ENDED"
                  ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-50"
                  : "bg-[#DCEEFF] text-[#4A90E2] border-[#4A90E2]/20 hover:bg-[#DCEEFF]"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full mr-2 inline-block ${
                  electionStatus === "ACTIVE"
                    ? "bg-[#16A34A] animate-pulse"
                    : electionStatus === "ENDED"
                    ? "bg-red-500"
                    : "bg-[#4A90E2]"
                }`}
              />
              {electionStatus === "ACTIVE"
                ? "Election is Live"
                : electionStatus === "PAUSED"
                ? "Election is Paused"
                : electionStatus === "ENDED"
                ? "Election Has Ended"
                : "Election Not Started"}
            </Badge>

            <h1 className="text-5xl md:text-6xl font-bold text-[#1A1A1A] dark:text-white tracking-tight leading-tight mb-4">
              {electionTitle || "College Association"}{" "}
              <span className="text-[#4A90E2]">Election</span>
            </h1>
            <p className="text-lg md:text-xl text-[#6B7280] dark:text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
              Secure Votes. Fair Leadership.
              <br />A transparent and tamper-proof voting experience for every student.
            </p>

            {electionStatus === "ACTIVE" ? (
              <Link href="/login">
                <Button
                  size="lg"
                  className="bg-[#4A90E2] hover:bg-[#357ABD] text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-[#4A90E2]/25 transition-all duration-200 hover:shadow-xl hover:shadow-[#4A90E2]/30 hover:-translate-y-0.5"
                >
                  Cast Your Vote
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            ) : (
              <Button
                size="lg"
                disabled
                className="px-8 py-6 text-lg rounded-xl opacity-60 cursor-not-allowed"
              >
                {electionStatus === "ENDED"
                  ? "Voting Has Closed"
                  : electionStatus === "PAUSED"
                  ? "Voting is Paused"
                  : "Voting Not Yet Open"}
              </Button>
            )}
          </motion.div>
        </div>
      </header>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {[
            {
              emoji: "🗳️",
              title: "Your Vote. Your Voice.",
              desc: "Participate in shaping tomorrow's leadership.",
              color: "#4A90E2",
            },
            {
              emoji: "🔐",
              title: "Secure & Verified",
              desc: "Protected by multi-layer authentication.",
              color: "#16A34A",
            },
            {
              emoji: "🏛️",
              title: "Democracy In Action",
              desc: "Every eligible student deserves a fair vote.",
              color: "#8B5CF6",
            },
            {
              emoji: "🚀",
              title: "Built For Excellence",
              desc: "Fast, transparent and reliable election experience.",
              color: "#F59E0B",
            },
          ].map((feature, i) => (
            <Card
              key={i}
              className="border border-[#E2E8F0] dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm"
            >
              <CardContent className="p-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-2xl"
                  style={{ backgroundColor: `${feature.color}10` }}
                >
                  {feature.emoji}
                </div>
                <h3 className="font-semibold text-[#1A1A1A] dark:text-white mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#6B7280] dark:text-slate-400 leading-relaxed">
                  {feature.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] dark:border-slate-800 py-6 text-center">
        <p className="text-sm text-[#6B7280] dark:text-slate-400">
          Association Election — Secure Votes. Fair Leadership. •{" "}
          {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
