// ============================================================
// API: Admin Students Management
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
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "all"; // all, voted, not_voted
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    const supabase = createAdminClient();
    let query = supabase.from("students").select("*", { count: "exact" });

    // Search
    if (search) {
      query = query.or(
        `register_number.ilike.%${search}%,student_name.ilike.%${search}%,department.ilike.%${search}%`
      );
    }

    // Filter
    if (filter === "voted") {
      query = query.eq("is_voted", true);
    } else if (filter === "not_voted") {
      query = query.eq("is_voted", false);
    }

    const { data, error, count } = await query
      .order("register_number")
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
    }

    return NextResponse.json({
      students: data,
      total: count,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
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

    // Support bulk import (CSV data as array)
    if (Array.isArray(body.students)) {
      const supabase = createAdminClient();
      const students = body.students.map((s: Record<string, string | number>) => ({
        register_number: String(s.register_number).toUpperCase(),
        student_name: s.student_name,
        department: s.department,
        year: Number(s.year),
        dob: s.dob,
        email: String(s.email),
        mobile_number: s.mobile_number ? String(s.mobile_number) : null,
      }));

      const { data, error } = await supabase
        .from("students")
        .upsert(students, { onConflict: "register_number" })
        .select();

      if (error) {
        return NextResponse.json(
          { error: "Failed to import students", details: error.message },
          { status: 500 }
        );
      }

      await supabase.from("audit_logs").insert({
        action: "STUDENTS_IMPORTED",
        performed_by: session.email,
        details: { count: students.length },
      });

      return NextResponse.json({
        success: true,
        imported: data?.length || 0,
      });
    }

    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
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
      return NextResponse.json({ error: "Student ID required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("students")
      .update({
        student_name: updates.student_name,
        department: updates.department,
        year: Number(updates.year),
        dob: updates.dob,
        email: updates.email,
        mobile_number: updates.mobile_number || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to update student", details: error.message }, { status: 500 });
    }

    await supabase.from("audit_logs").insert({
      action: "STUDENT_UPDATED",
      performed_by: session.email,
      details: { student_id: id, register_number: data.register_number },
    });

    return NextResponse.json({ student: data });
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
      return NextResponse.json({ error: "Student ID required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get student info before deleting for audit
    const { data: student } = await supabase
      .from("students")
      .select("register_number, student_name")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("students")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Failed to delete student", details: error.message }, { status: 500 });
    }

    await supabase.from("audit_logs").insert({
      action: "STUDENT_DELETED",
      performed_by: session.email,
      details: { student_id: id, register_number: student?.register_number, student_name: student?.student_name },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
