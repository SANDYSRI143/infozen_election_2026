// ============================================================
// API: Admin Audit Logs
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");
    const search = searchParams.get("search") || "";
    const actionFilter = searchParams.get("action") || "";
    const offset = (page - 1) * limit;

    const supabase = createAdminClient();

    // Build query
    let query = supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(
        `action.ilike.%${search}%,performed_by.ilike.%${search}%`
      );
    }

    if (actionFilter) {
      query = query.eq("action", actionFilter);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch audit logs" },
        { status: 500 }
      );
    }

    // Get distinct action types for filter dropdown
    const { data: actions } = await supabase
      .from("audit_logs")
      .select("action")
      .order("action");

    const uniqueActions = [...new Set((actions || []).map((a) => a.action))];

    return NextResponse.json({
      logs: data || [],
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      page,
      actionTypes: uniqueActions,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
