// ============================================================
// API: Export Results (PDF, Excel, CSV)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { format = "csv" } = body;

    const supabase = createAdminClient();

    // Check election status
    const { data: election } = await supabase
      .from("election_settings")
      .select("status, election_title")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!election) {
      return NextResponse.json({ error: "No election found" }, { status: 404 });
    }

    // Get comprehensive results with all details
    const { data: results } = await supabase.rpc("get_election_results");
    const { data: stats } = await supabase.rpc("get_dashboard_stats");

    if (!results) {
      return NextResponse.json({ error: "No results available" }, { status: 404 });
    }

    // Group results by position
    const groupedByPosition = results.reduce((acc: any, result: any) => {
      if (!acc[result.position]) {
        acc[result.position] = [];
      }
      acc[result.position].push(result);
      return acc;
    }, {});

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    await supabase.from("audit_logs").insert({
      action: "RESULTS_EXPORTED",
      performed_by: session.email,
      details: { format, election_title: election.election_title, device: request.headers.get("user-agent") || "unknown" },
      ip_address: ip,
    });

    if (format === "csv") {
      return exportAsCSV(groupedByPosition, election, stats);
    } else if (format === "excel") {
      return exportAsExcel(groupedByPosition, election, stats);
    } else if (format === "pdf") {
      return exportAsPDF(groupedByPosition, election, stats);
    } else {
      return NextResponse.json({ error: "Invalid format" }, { status: 400 });
    }
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export results" },
      { status: 500 }
    );
  }
}

function exportAsCSV(
  groupedByPosition: any,
  election: any,
  stats: any
): NextResponse {
  let csv = `Association Election Results\n`;
  csv += `Election: ${election.election_title}\n`;
  csv += `Date: ${new Date().toLocaleString()}\n\n`;

  if (stats) {
    csv += `Total Students: ${stats.total_students}\n`;
    csv += `Total Voted: ${stats.total_voted}\n`;
    csv += `Participation: ${stats.participation_percentage?.toFixed(2) || 0}%\n\n`;
  }

  csv += `RESULTS BY POSITION\n`;
  csv += `==================\n\n`;

  for (const [position, candidates] of Object.entries(groupedByPosition)) {
    csv += `${position}\n`;
    csv += `Candidate Name,Department,Vote Count\n`;
    const sorted = (candidates as any[]).sort((a, b) => b.vote_count - a.vote_count);
    for (const candidate of sorted) {
      csv += `"${candidate.candidate_name}","${candidate.department}",${candidate.vote_count}\n`;
    }
    csv += `\n`;
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition":
        `attachment; filename="election-results-${Date.now()}.csv"`,
    },
  });
}

function exportAsExcel(
  groupedByPosition: any,
  election: any,
  stats: any
): NextResponse {
  // For Excel, we'll return JSON that can be processed by xlsx on client
  // Or we can use a server-side library
  const data = {
    title: election.election_title,
    date: new Date().toLocaleString(),
    stats,
    results: groupedByPosition,
  };

  // Return JSON - client should use xlsx to process
  return NextResponse.json(data, {
    headers: {
      "Content-Disposition":
        `attachment; filename="election-results-${Date.now()}.json"`,
    },
  });
}

function exportAsPDF(
  groupedByPosition: any,
  election: any,
  stats: any
): NextResponse {
  // For PDF, return structured data that can be processed by jsPDF on client
  const data = {
    title: election.election_title,
    date: new Date().toLocaleString(),
    stats,
    results: groupedByPosition,
  };

  return NextResponse.json(data, {
    headers: {
      "Content-Disposition":
        `attachment; filename="election-results-${Date.now()}.json"`,
    },
  });
}
