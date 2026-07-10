// ============================================================
// API: Admin Management (Super Admin only)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/auth";
import { addAdminSchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("admins")
      .select("id, name, email, role, created_at")
      .order("created_at");

    if (error) {
      return NextResponse.json({ error: "Failed to fetch admins" }, { status: 500 });
    }

    return NextResponse.json({ admins: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only Super Admin can add admins" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = addAdminSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password, role } = parsed.data;
    const supabase = createAdminClient();

    // Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return NextResponse.json(
        { error: `Failed to create user: ${authError.message}` },
        { status: 500 }
      );
    }

    // Add to admins table
    const { error: adminError } = await supabase.from("admins").insert({
      auth_user_id: authUser.user.id,
      name,
      email,
      role,
      created_by: session.admin_id,
    });

    if (adminError) {
      return NextResponse.json(
        { error: "Failed to add admin record" },
        { status: 500 }
      );
    }

    await supabase.from("audit_logs").insert({
      action: "ADMIN_ADDED",
      performed_by: session.email,
      details: { new_admin_email: email, role },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only Super Admin can remove admins" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Admin ID required" }, { status: 400 });
    }

    // Prevent self-deletion
    if (id === session.admin_id) {
      return NextResponse.json(
        { error: "Cannot remove yourself" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get admin to delete their auth user too
    const { data: admin } = await supabase
      .from("admins")
      .select("auth_user_id, email")
      .eq("id", id)
      .single();

    if (admin?.auth_user_id) {
      await supabase.auth.admin.deleteUser(admin.auth_user_id);
    }

    const { error } = await supabase.from("admins").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Failed to remove admin" }, { status: 500 });
    }

    await supabase.from("audit_logs").insert({
      action: "ADMIN_REMOVED",
      performed_by: session.email,
      details: { removed_admin: admin?.email },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
