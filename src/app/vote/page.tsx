import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isElectionActive } from "@/lib/election";
import { createAdminClient } from "@/lib/supabase/admin";
import VotingForm from "@/components/vote/VotingForm";
import ScreenProtection from "@/components/ScreenProtection";
import type { Candidate } from "@/types";

export default async function VotePage() {
  // Verify session
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Check election status
  const active = await isElectionActive();
  if (!active) {
    redirect("/election-closed");
  }

  // Check if already voted
  const supabase = createAdminClient();
  const { data: student } = await supabase
    .from("students")
    .select("is_voted")
    .eq("id", session.student_id)
    .single();

  if (student?.is_voted) {
    redirect("/success");
  }

  // Fetch candidates
  const { data: candidates } = await supabase
    .from("candidates")
    .select("*")
    .eq("status", "active")
    .order("position")
    .order("candidate_name");

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#F0F7FF] to-[#DCEEFF] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      <ScreenProtection />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <VotingForm candidates={(candidates as Candidate[]) || []} />
      </div>
    </div>
  );
}
