"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Quote, Award, Lightbulb } from "lucide-react";
import type { Candidate, Position } from "@/types";

interface CandidateShowcaseProps {
  candidate: Candidate;
  isSelected?: boolean;
  onSelect?: (candidateId: string) => void;
  showVoteButton?: boolean;
}

const POSITION_LABELS: Record<Position, string> = {
  PRESIDENT: "President",
  VICE_PRESIDENT: "Vice President",
  SECRETARY: "Secretary",
  JOINT_SECRETARY: "Joint Secretary",
  TREASURER: "Treasurer",
  JOINT_TREASURER: "Joint Treasurer",
};

export default function CandidateShowcase({
  candidate,
  isSelected = false,
  onSelect,
  showVoteButton = false,
}: CandidateShowcaseProps) {
  const initials = candidate.candidate_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      layoutId={`candidate-${candidate.id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`overflow-hidden transition-all duration-300 cursor-pointer dark:border-slate-700 ${
          isSelected
            ? "ring-2 ring-[#4A90E2] shadow-lg"
            : "hover:shadow-md hover:border-[#4A90E2]/50"
        }`}
        onClick={() => onSelect?.(candidate.id)}
      >
        <div className="relative bg-gradient-to-br from-[#F0F7FF] to-[#DCEEFF] dark:from-slate-800 dark:to-slate-700 p-6">
          {/* Symbol if available */}
          {candidate.symbol_url && (
            <div className="absolute top-4 right-4 w-12 h-12 rounded-lg shadow-md overflow-hidden bg-white dark:bg-slate-700">
              <img
                src={candidate.symbol_url}
                alt="Election symbol"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Candidate Photo & Info */}
          <div className="flex gap-4 mb-4">
            <Avatar className="w-20 h-20 flex-shrink-0 ring-2 ring-[#4A90E2]">
              <AvatarImage src={candidate.photo_url || ""} alt={candidate.candidate_name} />
              <AvatarFallback className="bg-[#4A90E2] text-white font-bold text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h3 className="text-lg font-bold text-[#1A1A1A] dark:text-white line-clamp-2">
                {candidate.candidate_name}
              </h3>
              <Badge variant="secondary" className="my-2 bg-[#DCEEFF] text-[#4A90E2] dark:bg-slate-700 dark:text-cyan-400">
                {POSITION_LABELS[candidate.position]}
              </Badge>
              <p className="text-sm text-[#6B7280] dark:text-slate-400">
                {candidate.department}
              </p>
            </div>
          </div>

          {/* Selection Indicator */}
          {showVoteButton && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm mb-4">
              <input
                type="radio"
                checked={isSelected}
                onChange={() => onSelect?.(candidate.id)}
                className="w-5 h-5 cursor-pointer accent-[#4A90E2]"
              />
              <span className="text-sm font-medium text-[#1A1A1A] dark:text-white">
                {isSelected ? "Selected" : "Select as your vote"}
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-4">
          {/* Bio */}
          {candidate.bio && (
            <div>
              <p className="text-sm text-[#6B7280] dark:text-slate-400 line-clamp-2">
                {candidate.bio}
              </p>
            </div>
          )}

          {/* Campaign Quote */}
          {candidate.campaign_quote && (
            <div className="flex gap-3 p-3 rounded-lg bg-[#F0F7FF] dark:bg-slate-700/50 border border-[#DCEEFF] dark:border-slate-600">
              <Quote className="w-4 h-4 text-[#4A90E2] flex-shrink-0 mt-1" />
              <p className="text-sm italic text-[#4A90E2] dark:text-cyan-400">
                {candidate.campaign_quote}
              </p>
            </div>
          )}

          {/* Vision Statement */}
          {candidate.vision_statement && (
            <div className="flex gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50">
              <Lightbulb className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase mb-1">
                  Vision
                </p>
                <p className="text-sm text-green-600 dark:text-green-300">
                  {candidate.vision_statement}
                </p>
              </div>
            </div>
          )}

          {/* Achievements */}
          {candidate.achievements && (
            <div className="flex gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50">
              <Award className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase mb-1">
                  Achievements
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  {candidate.achievements}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Selection Border */}
        <div
          className={`h-1 transition-all duration-300 ${
            isSelected
              ? "bg-gradient-to-r from-[#4A90E2] to-[#357ABD]"
              : "bg-transparent"
          }`}
        />
      </Card>
    </motion.div>
  );
}
