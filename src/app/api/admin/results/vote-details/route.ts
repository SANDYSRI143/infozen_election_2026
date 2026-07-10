// ============================================================
// API: Admin Vote Details — who voted for whom (post-election)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Check election status — only available after election ends
    const { data: election } = await supabase
      .from("election_settings")
      .select("status")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!election || election.status !== "ENDED") {
      return NextResponse.json(
        { error: "Vote details are only available after the election ends." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");
    const offset = (page - 1) * limit;

    // Get students who voted, with their vote details
    let studentQuery = supabase
      .from("students")
      .select("id, register_number, student_name, department, year, voted_at", { count: "exact" })
      .eq("is_voted", true);

    if (search) {
      studentQuery = studentQuery.or(
        `register_number.ilike.%${search}%,student_name.ilike.%${search}%,department.ilike.%${search}%`
      );
    }

    const { data: students, error: studentsError, count } = await studentQuery
      .order("voted_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (studentsError) {
      return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
    }

    if (!students || students.length === 0) {
      return NextResponse.json({
        vote_details: [],
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      });
    }

    // Get votes for these students with candidate info
    const studentIds = students.map(s => s.id);
    const { data: votes, error: votesError } = await supabase
      .from("votes")
      .select("student_id, candidate_id, position")
      .in("student_id", studentIds);

    if (votesError) {
      return NextResponse.json({ error: "Failed to fetch votes" }, { status: 500 });
    }

    // Get all candidate names
    const candidateIds = [...new Set((votes || []).map(v => v.candidate_id))];
    const { data: candidates } = await supabase
      .from("candidates")
      .select("id, candidate_name, position, department")
      .in("id", candidateIds);

    const candidateMap = new Map(
      (candidates || []).map(c => [c.id, c])
    );

    // Build response: each student with their votes
    const voteDetails = students.map(student => {
      const studentVotes = (votes || [])
        .filter(v => v.student_id === student.id)
        .map(v => {
          const candidate = candidateMap.get(v.candidate_id);
          return {
            position: v.position,
            candidate_name: candidate?.candidate_name || "Unknown",
            candidate_department: candidate?.department || "",
          };
        })
        .sort((a, b) => {
          const order = ["PRESIDENT", "VICE_PRESIDENT", "SECRETARY", "JOINT_SECRETARY", "TREASURER", "JOINT_TREASURER"];
          return order.indexOf(a.position) - order.indexOf(b.position);
        });

      return {
        student_id: student.id,
        register_number: student.register_number,
        student_name: student.student_name,
        department: student.department,
        year: student.year,
        voted_at: student.voted_at,
        votes: studentVotes,
      };
    });

    return NextResponse.json({
      vote_details: voteDetails,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
