"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Vote,
} from "lucide-react";
import CandidateCard from "@/components/vote/CandidateCard";
import ConfirmDialog from "@/components/vote/ConfirmDialog";
import { useVoteStore } from "@/store/voteStore";
import { POSITIONS } from "@/types";
import type { Candidate, Position } from "@/types";

interface VotingFormProps {
  candidates: Candidate[];
}

export default function VotingForm({ candidates }: VotingFormProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const {
    selections,
    currentStep,
    isSubmitting,
    setSelection,
    setStep,
    nextStep,
    prevStep,
    setSubmitting,
    getVoteArray,
    isComplete,
  } = useVoteStore();

  const currentPosition = POSITIONS[currentStep];
  const isReviewStep = currentStep === 6;

  // Get candidates for current position
  const positionCandidates = currentPosition
    ? candidates.filter((c) => c.position === currentPosition.value)
    : [];

  const progress = ((selections.size) / 6) * 100;

  // Prevent back navigation
  useEffect(() => {
    window.history.pushState(null, "", window.location.pathname);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.pathname);
      toast.error("Please complete voting before navigating away");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const submittingRef = useRef(false);

  const handleSubmit = useCallback(async () => {
    if (!isComplete()) {
      toast.error("Please vote for all 6 positions");
      return;
    }

    // Prevent double-click race condition (ref is synchronous, unlike state)
    if (submittingRef.current) return;
    submittingRef.current = true;

    setSubmitting(true);
    try {
      const votes = getVoteArray();
      const submitVote = async () => {
        return fetch("/api/vote/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ votes }),
        });
      };

      let res = await submitVote();
      let result = await res.json();

      // 409 = partial orphaned votes were cleaned up, retry automatically
      if (res.status === 409) {
        toast.info("Retrying submission...");
        res = await submitVote();
        result = await res.json();
      }

      if (!res.ok) {
        toast.error(result.error || "Failed to submit vote");
        return;
      }

      toast.success("Vote Submitted Successfully!");
      router.push("/success");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
      setShowConfirm(false);
      submittingRef.current = false;
    }
  }, [isComplete, setSubmitting, getVoteArray, router]);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <Vote className="w-6 h-6 text-[#4A90E2]" />
            Cast Your Vote
          </h1>
          <Badge
            variant="secondary"
            className="bg-[#DCEEFF] text-[#4A90E2] border-0"
          >
            {selections.size}/6 Selected
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />

        {/* Position tabs */}
        <div className="flex gap-1.5 mt-4 overflow-x-auto pb-2">
          {POSITIONS.map((pos, i) => {
            const isSelected = selections.has(pos.value);
            const isCurrent = currentStep === i;
            return (
              <button
                key={pos.value}
                onClick={() => setStep(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  isCurrent
                    ? "bg-[#4A90E2] text-white"
                    : isSelected
                    ? "bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20"
                    : "bg-[#F1F5F9] text-[#6B7280] hover:bg-[#E2E8F0]"
                }`}
              >
                {isSelected && <CheckCircle2 className="w-3 h-3" />}
                {pos.label}
              </button>
            );
          })}
          <button
            onClick={() => setStep(6)}
            disabled={!isComplete()}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
              isReviewStep
                ? "bg-[#4A90E2] text-white"
                : isComplete()
                ? "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20"
                : "bg-[#F1F5F9] text-[#CBD5E1] cursor-not-allowed"
            }`}
          >
            Review
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isReviewStep && currentPosition ? (
          <motion.div
            key={currentPosition.value}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            {/* Position title */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-[#1A1A1A]">
                Select {currentPosition.label}
              </h2>
              <p className="text-sm text-[#6B7280]">
                Choose one candidate for this position
              </p>
            </div>

            {/* Candidate cards */}
            <div className="grid gap-3">
              {positionCandidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  isSelected={selections.get(currentPosition.value) === candidate.id}
                  onSelect={() =>
                    setSelection(currentPosition.value, candidate.id)
                  }
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="border-[#E2E8F0]"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button
                onClick={nextStep}
                disabled={!selections.has(currentPosition.value)}
                className="bg-[#4A90E2] hover:bg-[#357ABD] text-white"
              >
                {currentStep === 5 ? "Review" : "Next"}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        ) : isReviewStep ? (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            <h2 className="text-lg font-semibold text-[#1A1A1A] mb-1">
              Review Your Selections
            </h2>
            <p className="text-sm text-[#6B7280] mb-4">
              Verify all your choices before submitting
            </p>

            <div className="space-y-3 mb-6">
              {POSITIONS.map((pos) => {
                const candidateId = selections.get(pos.value);
                const candidate = candidates.find((c) => c.id === candidateId);
                return (
                  <div
                    key={pos.value}
                    className="flex items-center justify-between p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"
                  >
                    <div>
                      <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                        {pos.label}
                      </p>
                      <p className="font-semibold text-[#1A1A1A] text-lg">
                        {candidate?.candidate_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#DCEEFF] text-[#4A90E2] border-0">
                        {candidate?.department}
                      </Badge>
                      <button
                        onClick={() => {
                          const idx = POSITIONS.findIndex(
                            (p) => p.value === pos.value
                          );
                          setStep(idx);
                        }}
                        className="text-xs text-[#4A90E2] hover:underline"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(5)}
                className="flex-1 border-[#E2E8F0]"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Go Back
              </Button>
              <Button
                onClick={() => setShowConfirm(true)}
                className="flex-1 bg-[#16A34A] hover:bg-[#15803D] text-white text-lg h-12"
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Submit Vote
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSubmit}
        selections={selections}
        candidates={candidates}
        loading={isSubmitting}
      />
    </div>
  );
}
