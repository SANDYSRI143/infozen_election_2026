// ============================================================
// API: Submit Vote
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession, destroySession } from "@/lib/auth";
import { voteSubmitSchema } from "@/lib/validations";

// In-flight dedup: tracks student IDs with an active submission
// to prevent rapid double-clicks from creating parallel requests.
// Entries are cleaned up on completion (success or failure).
const inflightSubmissions = new Set<string>();

export async function POST(request: NextRequest) {
  let studentId: string | null = null;

  try {
    // Verify session
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please login again." },
        { status: 401 }
      );
    }

    studentId = session.student_id;
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Fast-path: prevent concurrent duplicate submissions (double-click guard)
    if (inflightSubmissions.has(studentId)) {
      return NextResponse.json(
        { error: "Your vote is being processed. Please wait." },
        { status: 429 }
      );
    }
    inflightSubmissions.add(studentId);

    const body = await request.json();
    const parsed = voteSubmitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid vote data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { votes } = parsed.data;

    // Verify all 6 positions are unique
    const positions = new Set(votes.map((v) => v.position));
    if (positions.size !== 6) {
      return NextResponse.json(
        { error: "Must vote for exactly 6 unique positions" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Authoritative duplicate check: query the DB for is_voted flag
    const { data: student } = await supabase
      .from("students")
      .select("is_voted")
      .eq("id", studentId)
      .single();

    if (student?.is_voted) {
      return NextResponse.json(
        { error: "You have already voted." },
        { status: 403 }
      );
    }

    // Verify candidates exist and match positions
    for (const vote of votes) {
      const { data: candidate } = await supabase
        .from("candidates")
        .select("id, position, status")
        .eq("id", vote.candidate_id)
        .eq("position", vote.position)
        .eq("status", "active")
        .single();

      if (!candidate) {
        return NextResponse.json(
          { error: `Invalid candidate for position ${vote.position}` },
          { status: 400 }
        );
      }
    }

    // Submit votes using database function (atomic transaction)
    const { error: voteError } = await supabase.rpc("submit_vote", {
      p_student_id: studentId,
      p_votes: votes,
      p_ip: ip,
      p_device: userAgent,
    });

    if (voteError) {
      // Handle specific errors
      if (voteError.message.includes("already voted")) {
        return NextResponse.json(
          { error: "You have already voted." },
          { status: 403 }
        );
      }
      if (voteError.message.includes("not active")) {
        return NextResponse.json(
          { error: "Election is not currently active." },
          { status: 403 }
        );
      }

      // Handle unique constraint violation: votes already exist from a
      // previous partial/crashed submission where is_voted wasn't set.
      if (voteError.message.includes("unique constraint") ||
          voteError.message.includes("duplicate key")) {
        // Check how many votes this student already has
        const { data: existingVotes, error: countError } = await supabase
          .from("votes")
          .select("id, position")
          .eq("student_id", studentId);

        if (!countError && existingVotes && existingVotes.length >= 6) {
          // All 6 votes are present — repair the is_voted flag
          await supabase
            .from("students")
            .update({ is_voted: true, voted_at: new Date().toISOString() })
            .eq("id", studentId);

          // Audit the recovery
          supabase.from("audit_logs").insert({
            action: "VOTE_RECOVERED",
            performed_by: session.register_number,
            details: {
              student_id: studentId,
              reason: "is_voted flag repaired after constraint violation",
              existing_vote_count: existingVotes.length,
            },
            ip_address: ip,
          }).then(() => {});

          // Destroy session and return success — votes were already recorded
          await destroySession();
          return NextResponse.json({
            success: true,
            message: "Vote Submitted Successfully",
          });
        }

        // Partial votes exist (< 6): clean up orphaned rows and ask user to retry
        if (!countError && existingVotes && existingVotes.length > 0) {
          await supabase
            .from("votes")
            .delete()
            .eq("student_id", studentId);

          // Audit the cleanup
          supabase.from("audit_logs").insert({
            action: "VOTE_CLEANUP",
            performed_by: session.register_number,
            details: {
              student_id: studentId,
              reason: "Partial orphaned votes cleaned up",
              cleaned_count: existingVotes.length,
            },
            ip_address: ip,
          }).then(() => {});

          return NextResponse.json(
            { error: "A previous attempt was incomplete. Please try submitting again." },
            { status: 409 }
          );
        }
      }

      console.error("Vote submission error:", voteError);
      return NextResponse.json(
        { error: `Failed to submit vote: ${voteError.message}` },
        { status: 500 }
      );
    }

    // Audit log (fire-and-forget, don't block success)
    supabase.from("audit_logs").insert({
      action: "VOTE_SUBMITTED",
      performed_by: session.register_number,
      details: { student_id: studentId, vote_count: votes.length },
      ip_address: ip,
    }).then(() => {});

    // Destroy session (auto-logout after voting)
    await destroySession();

    return NextResponse.json({
      success: true,
      message: "Vote Submitted Successfully",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    // Always clean up the in-flight guard
    if (studentId) {
      inflightSubmissions.delete(studentId);
    }
  }
}
