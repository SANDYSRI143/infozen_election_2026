// ============================================================
// Zustand Vote Store — Client-side voting state
// ============================================================
import { create } from "zustand";
import type { VoteSelection, Position } from "@/types";

interface VoteState {
  selections: Map<Position, string>; // position -> candidate_id
  isSubmitting: boolean;
  isSubmitted: boolean;
  currentStep: number; // 0-5 for positions, 6 for review

  setSelection: (position: Position, candidateId: string) => void;
  removeSelection: (position: Position) => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setSubmitting: (val: boolean) => void;
  setSubmitted: (val: boolean) => void;
  getVoteArray: () => VoteSelection[];
  isComplete: () => boolean;
  reset: () => void;
}

export const useVoteStore = create<VoteState>((set, get) => ({
  selections: new Map(),
  isSubmitting: false,
  isSubmitted: false,
  currentStep: 0,

  setSelection: (position, candidateId) =>
    set((state) => {
      const newSelections = new Map(state.selections);
      newSelections.set(position, candidateId);
      return { selections: newSelections };
    }),

  removeSelection: (position) =>
    set((state) => {
      const newSelections = new Map(state.selections);
      newSelections.delete(position);
      return { selections: newSelections };
    }),

  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 6) })),
  prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),
  setSubmitting: (val) => set({ isSubmitting: val }),
  setSubmitted: (val) => set({ isSubmitted: val }),

  getVoteArray: () => {
    const selections = get().selections;
    const votes: VoteSelection[] = [];
    selections.forEach((candidateId, position) => {
      votes.push({ position, candidate_id: candidateId });
    });
    return votes;
  },

  isComplete: () => get().selections.size === 6,

  reset: () =>
    set({
      selections: new Map(),
      isSubmitting: false,
      isSubmitted: false,
      currentStep: 0,
    }),
}));
