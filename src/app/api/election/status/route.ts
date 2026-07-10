// ============================================================
// API: Election Status (Public)
// ============================================================
import { NextResponse } from "next/server";
import { getElectionStatusInfo } from "@/lib/election";

export async function GET() {
  try {
    const info = await getElectionStatusInfo();
    return NextResponse.json({
      status: info.status,
      settings: info.settings
        ? {
            election_title: info.settings.election_title,
            start_time: info.settings.start_time,
            end_time: info.settings.end_time,
            status: info.settings.status,
          }
        : null,
      isActive: info.isWithinWindow,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch election status" },
      { status: 500 }
    );
  }
}
