// ============================================================
// API: Admin Election Control
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/auth";
import { electionSettingsSchema } from "@/lib/validations";
import { clearRateLimitByPrefix } from "@/lib/rate-limit";

// Prevent Next.js from caching this route
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("election_settings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      return NextResponse.json({ error: "No election settings found" }, { status: 404 });
    }

    // Get stats
    const { data: stats } = await supabase.rpc("get_dashboard_stats");

    return NextResponse.json({
      election: data,
      stats: stats?.[0] || null,
    }, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
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

    // Handle election actions
    if (body.action === "start") {
      return handleStartElection(session.email);
    }
    if (body.action === "pause") {
      return handleElectionStatusChange(session.email, "PAUSED", "ELECTION_PAUSED");
    }
    if (body.action === "resume") {
      return handleElectionStatusChange(session.email, "ACTIVE", "ELECTION_RESUMED");
    }
    if (body.action === "end") {
      return handleEndElection(session.email);
    }
    if (body.action === "reset_votes") {
      return handleResetVotes(session.email);
    }
    if (body.action === "fresh_election") {
      return handleFreshElection(session.email);
    }

    // Update settings
    const parsed = electionSettingsSchema.safeParse(body);
    if (!parsed.success) {
      console.error("Settings validation failed:", parsed.error.format());
      return NextResponse.json(
        { 
          error: "Invalid data", 
          details: parsed.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get current election
    const { data: current } = await supabase
      .from("election_settings")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (current) {
      const updateData = {
        ...parsed.data,
        end_time: parsed.data.end_time || null,
      };
      const { error } = await supabase
        .from("election_settings")
        .update(updateData)
        .eq("id", current.id);

      if (error) {
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
      }
    } else {
      const insertData = {
        ...parsed.data,
        end_time: parsed.data.end_time || null,
        status: "NOT_STARTED"
      };
      const { error } = await supabase
        .from("election_settings")
        .insert(insertData);

      if (error) {
        console.error("Failed to create settings:", error);
        return NextResponse.json({ error: "Failed to create settings" }, { status: 500 });
      }
    }

    await supabase.from("audit_logs").insert({
      action: "ELECTION_SETTINGS_UPDATED",
      performed_by: session.email,
      details: parsed.data,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function handleStartElection(adminEmail: string) {
  const supabase = createAdminClient();

  const { data: current } = await supabase
    .from("election_settings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!current) {
    return NextResponse.json({ error: "No election settings configured" }, { status: 400 });
  }

  // Allow starting/restarting even if ended or paused
  const { error } = await supabase
    .from("election_settings")
    .update({
      status: "ACTIVE",
      start_time: new Date().toISOString(),
      end_time: null,
    })
    .eq("id", current.id);

  if (error) {
    return NextResponse.json({ error: "Failed to start election" }, { status: 500 });
  }

  await supabase.from("audit_logs").insert({
    action: "ELECTION_STARTED",
    performed_by: adminEmail,
  });

  return NextResponse.json({ success: true, status: "ACTIVE" });
}

async function handleElectionStatusChange(adminEmail: string, status: string, logAction: string) {
  const supabase = createAdminClient();

  const { data: current } = await supabase
    .from("election_settings")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!current) {
    return NextResponse.json({ error: "No election settings found" }, { status: 400 });
  }

  const { error } = await supabase
    .from("election_settings")
    .update({ status })
    .eq("id", current.id);

  if (error) {
    return NextResponse.json({ error: `Failed to ${status.toLowerCase()} election` }, { status: 500 });
  }

  await supabase.from("audit_logs").insert({
    action: logAction,
    performed_by: adminEmail,
  });

  return NextResponse.json({ success: true, status });
}

async function handleEndElection(adminEmail: string) {
  const supabase = createAdminClient();

  const { data: current } = await supabase
    .from("election_settings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!current) {
    return NextResponse.json({ error: "No election settings found" }, { status: 400 });
  }

  const { error } = await supabase
    .from("election_settings")
    .update({
      status: "ENDED",
      end_time: new Date().toISOString(),
    })
    .eq("id", current.id);

  if (error) {
    return NextResponse.json({ error: "Failed to end election" }, { status: 500 });
  }

  await supabase.from("audit_logs").insert({
    action: "ELECTION_ENDED",
    performed_by: adminEmail,
  });

  return NextResponse.json({ success: true, status: "ENDED" });
}

async function handleResetVotes(adminEmail: string) {
  const supabase = createAdminClient();

  const { error } = await supabase.rpc("admin_execute_reset", {
    action_type: "RESET_VOTES"
  });

  if (error) {
    console.error("Database reset votes error:", error);
    return NextResponse.json(
      { error: "Failed to reset votes. Make sure you have deployed the SQL function in Supabase. Details: " + error.message },
      { status: 500 }
    );
  }

  // Clear in-memory rate limiter
  clearRateLimitByPrefix("vote");

  await supabase.from("audit_logs").insert({
    action: "VOTES_RESET",
    performed_by: adminEmail,
    details: { message: "All votes have been reset" },
  });

  return NextResponse.json({ success: true });
}

async function handleFreshElection(adminEmail: string) {
  const supabase = createAdminClient();

  const { error } = await supabase.rpc("admin_execute_reset", {
    action_type: "FRESH_ELECTION"
  });

  if (error) {
    console.error("Database fresh election error:", error);
    return NextResponse.json(
      { error: "Failed to reset election. Make sure you have deployed the SQL function in Supabase. Details: " + error.message },
      { status: 500 }
    );
  }

  // Clear in-memory rate limiter
  clearRateLimitByPrefix("vote");

  await supabase.from("audit_logs").insert({
    action: "FRESH_ELECTION",
    performed_by: adminEmail,
    details: { message: "Fresh election started — all data reset" },
  });

  return NextResponse.json({ success: true, status: "NOT_STARTED" });
}
