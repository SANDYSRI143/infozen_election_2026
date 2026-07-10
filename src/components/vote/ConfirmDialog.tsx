"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import type { Candidate, Position } from "@/types";
import { POSITIONS } from "@/types";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selections: Map<Position, string>;
  candidates: Candidate[];
  loading: boolean;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  selections,
  candidates,
  loading,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl text-[#1A1A1A] flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
            Confirm Your Vote
          </DialogTitle>
          <DialogDescription className="text-[#6B7280]">
            Please review your selections carefully. Once submitted, your vote
            <strong className="text-[#DC2626]"> cannot be changed or undone</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-4 max-h-[400px] overflow-y-auto pr-2">
          {POSITIONS.map((pos) => {
            const candidateId = selections.get(pos.value);
            const candidate = candidates.find((c) => c.id === candidateId);

            return (
              <div
                key={pos.value}
                className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]"
              >
                <div>
                  <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                    {pos.label}
                  </p>
                  <p className="font-semibold text-[#1A1A1A]">
                    {candidate?.candidate_name || "Not selected"}
                  </p>
                </div>
                {candidate && (
                  <Badge className="bg-[#DCEEFF] text-[#4A90E2] border-0 text-xs">
                    {candidate.department}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter className="gap-3 sm:gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1 border-[#E2E8F0]"
          >
            Go Back
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-[#16A34A] hover:bg-[#15803D] text-white"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            {loading ? "Submitting..." : "Confirm Vote"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
