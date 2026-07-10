// ============================================================
// API: Admin Results
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

    // Check election status
    const { data: election } = await supabase
      .from("election_settings")
      .select("status, election_title")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!election || election.status !== "ENDED") {
      return NextResponse.json(
        { error: "Results are only available after election ends." },
        { status: 403 }
      );
    }

    // Get results using DB function
    const { data: results, error } = await supabase.rpc("get_election_results");

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch results" },
        { status: 500 }
      );
    }

    // Get dashboard stats
    const { data: stats } = await supabase.rpc("get_dashboard_stats");

    return NextResponse.json({
      election_title: election.election_title,
      results,
      stats: stats?.[0] || null,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
