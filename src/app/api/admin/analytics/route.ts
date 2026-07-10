// ============================================================
// API: Admin Analytics — Department & Candidate Stats
// ============================================================
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Department-wise stats
    const { data: allStudents } = await supabase
      .from("students")
      .select("department, is_voted");

    const deptMap: Record<
      string,
      { total: number; voted: number }
    > = {};

    (allStudents || []).forEach((s) => {
      const dept = s.department || "Unknown";
      if (!deptMap[dept]) deptMap[dept] = { total: 0, voted: 0 };
      deptMap[dept].total++;
      if (s.is_voted) deptMap[dept].voted++;
    });

    const departmentStats = Object.entries(deptMap)
      .map(([department, counts]) => ({
        department,
        total: counts.total,
        voted: counts.voted,
        remaining: counts.total - counts.voted,
        participation: counts.total > 0
          ? Math.round((counts.voted / counts.total) * 100 * 10) / 10
          : 0,
      }))
      .sort((a, b) => b.participation - a.participation);

    // Candidate analytics — votes per candidate per position
    const { data: results } = await supabase.rpc("get_election_results");
    const { data: stats } = await supabase.rpc("get_dashboard_stats");

    // Overall stats
    const totalStudents = allStudents?.length || 0;
    const totalVoted = allStudents?.filter((s) => s.is_voted).length || 0;

    return NextResponse.json({
      departmentStats,
      candidateResults: results || [],
      overallStats: {
        total_students: totalStudents,
        total_voted: totalVoted,
        remaining: totalStudents - totalVoted,
        participation_percentage:
          totalStudents > 0
            ? Math.round((totalVoted / totalStudents) * 100 * 10) / 10
            : 0,
      },
      dashboardStats: stats?.[0] || null,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
