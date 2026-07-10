// ============================================================
// API: Admin Login
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminLoginSchema } from "@/lib/validations";
import { createAdminSession } from "@/lib/auth";
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";

    // Rate limit
    const rateLimitResult = checkRateLimit(
      getRateLimitKey("admin", ip),
      RATE_LIMITS.admin
    );
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = adminLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const supabase = createAdminClient();

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify user is in admins table
    const { data: admin, error: adminError } = await supabase
      .from("admins")
      .select("*")
      .eq("email", email)
      .single();

    if (adminError || !admin) {
      return NextResponse.json(
        { error: "Unauthorized. Not an admin account." },
        { status: 403 }
      );
    }

    // Create admin session
    await createAdminSession(admin.id, admin.email, admin.role);

    // Audit log
    await supabase.from("audit_logs").insert({
      action: "ADMIN_LOGIN",
      performed_by: admin.email,
      details: { role: admin.role },
      ip_address: ip,
    });

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
