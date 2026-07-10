"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Quote, Award, Lightbulb } from "lucide-react";
import type { Candidate } from "@/types";

interface CandidateCardProps {
  candidate: Candidate;
  isSelected: boolean;
  onSelect: () => void;
}

export default function CandidateCard({
  candidate,
  isSelected,
  onSelect,
}: CandidateCardProps) {
  const initials = candidate.candidate_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        onClick={onSelect}
        className={`cursor-pointer transition-all duration-300 relative overflow-hidden dark:border-slate-700 ${
          isSelected
            ? "border-[#4A90E2] border-2 shadow-lg shadow-[#4A90E2]/10 bg-[#F0F7FF] dark:bg-slate-800/50"
            : "border-[#E2E8F0] hover:border-[#4A90E2]/40 hover:shadow-md bg-white dark:bg-slate-900"
        }`}
      >
        {/* Selected indicator */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-3 right-3 z-10"
          >
            <div className="w-7 h-7 rounded-full bg-[#4A90E2] flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
          </motion.div>
        )}

        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Photo */}
            <div className="relative">
              <Avatar className={`w-28 h-28 sm:w-32 sm:h-32 rounded-xl border-2 border-[#E2E8F0] dark:border-slate-700 ${candidate.photo_fit === "contain" ? "bg-[#F8FAFC] dark:bg-slate-800" : ""}`}>
                <AvatarImage
                  src={candidate.photo_url || undefined}
                  alt={candidate.candidate_name}
                  className={
                    candidate.photo_fit === "contain" ? "object-contain" :
                    candidate.photo_fit === "fill" ? "object-fill" :
                    "object-cover"
                  }
                />
                <AvatarFallback className="rounded-xl bg-[#DCEEFF] dark:bg-slate-700 text-[#4A90E2] dark:text-cyan-400 text-2xl sm:text-3xl font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {candidate.symbol_url && (
                <div className="absolute -bottom-1 -right-1 w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 shadow-sm overflow-hidden">
                  <img src={candidate.symbol_url} alt="Symbol" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[#1A1A1A] dark:text-white text-lg leading-tight">
                {candidate.candidate_name}
              </h3>
              <Badge
                variant="secondary"
                className="mt-1 bg-[#DCEEFF] text-[#4A90E2] dark:bg-slate-700 dark:text-cyan-400 border-0 text-xs"
              >
                {candidate.department}
              </Badge>
              
              {candidate.bio && (
                <p className="text-sm text-[#6B7280] dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {candidate.bio}
                </p>
              )}

              {candidate.campaign_quote && (
                <div className="flex gap-2 mt-2 p-2 rounded-lg bg-[#F0F7FF] dark:bg-slate-800/50 border border-[#DCEEFF] dark:border-slate-700">
                  <Quote className="w-3 h-3 text-[#4A90E2] dark:text-cyan-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs italic text-[#4A90E2] dark:text-cyan-400 line-clamp-1">
                    {candidate.campaign_quote}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Additional info row */}
          <div className="flex gap-2 mt-3 text-xs">
            {candidate.vision_statement && (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                <Lightbulb className="w-3 h-3" />
                Vision
              </div>
            )}
            {candidate.achievements && (
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                <Award className="w-3 h-3" />
                Achievements
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
