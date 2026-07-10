// ============================================================
// API: Admin Candidates CRUD
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/auth";
import { candidateSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // When with_votes=true, use the RPC that joins candidates with votes
    const { searchParams } = new URL(request.url);
    const withVotes = searchParams.get("with_votes") === "true";

    if (withVotes) {
      const { data, error } = await supabase.rpc("get_election_results");
      if (error) {
        return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
      }
      const candidatesWithVotes = (data || []).map((r: Record<string, unknown>) => ({
        id: r.candidate_id,
        candidate_name: r.candidate_name,
        position: r.position,
        department: r.department,
        photo_url: r.photo_url,
        vote_count: Number(r.vote_count) || 0,
        status: "active",
      }));
      return NextResponse.json({ candidates: candidatesWithVotes });
    }

    const { data, error } = await supabase
      .from("candidates")
      .select("*")
      .order("position")
      .order("candidate_name");

    if (error) {
      return NextResponse.json({ error: "Failed to fetch candidates" }, { status: 500 });
    }

    return NextResponse.json({ candidates: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = candidateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("candidates")
      .insert(parsed.data)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to add candidate" }, { status: 500 });
    }

    // Audit
    await supabase.from("audit_logs").insert({
      action: "CANDIDATE_ADDED",
      performed_by: session.email,
      details: { candidate_name: parsed.data.candidate_name, position: parsed.data.position },
    });

    return NextResponse.json({ candidate: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Candidate ID required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("candidates")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to update candidate" }, { status: 500 });
    }

    await supabase.from("audit_logs").insert({
      action: "CANDIDATE_UPDATED",
      performed_by: session.email,
      details: { candidate_id: id },
    });

    return NextResponse.json({ candidate: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Candidate ID required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    // Soft delete
    const { error } = await supabase
      .from("candidates")
      .update({ status: "inactive" })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Failed to deactivate candidate" }, { status: 500 });
    }

    await supabase.from("audit_logs").insert({
      action: "CANDIDATE_DEACTIVATED",
      performed_by: session.email,
      details: { candidate_id: id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
