// ============================================================
// API: Public Candidates List
// ============================================================
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("candidates")
      .select("id, candidate_name, position, department, photo_url, symbol_url, bio")
      .eq("status", "active")
      .order("position")
      .order("candidate_name");

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch candidates" },
        { status: 500 }
      );
    }

    return NextResponse.json({ candidates: data });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
