// ============================================================
// API: Student Login — Validate credentials (Email-based)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loginSchema } from "@/lib/validations";
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";

    // Rate limit check
    const rateLimitResult = checkRateLimit(
      getRateLimitKey("login", ip),
      RATE_LIMITS.login
    );
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { register_number, dob, email } = parsed.data;
    const supabase = createAdminClient();

    // Look up student by register number
    const { data: student, error } = await supabase
      .from("students")
      .select("*")
      .eq("register_number", register_number.toUpperCase())
      .single();

    if (error || !student) {
      return NextResponse.json(
        { error: "Invalid Register Number." },
        { status: 401 }
      );
    }

    // Validate DOB
    if (student.dob !== dob) {
      return NextResponse.json(
        { error: "Date of Birth does not match." },
        { status: 401 }
      );
    }

    // Validate Email
    if (student.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: "Email ID does not match our records." },
        { status: 401 }
      );
    }

    // Check if already voted
    if (student.is_voted) {
      return NextResponse.json(
        { error: "You have already voted." },
        { status: 403 }
      );
    }

    // Check election status
    const { data: election } = await supabase
      .from("election_settings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!election || election.status === "NOT_STARTED") {
      return NextResponse.json(
        { error: "Election is not currently active." },
        { status: 403 }
      );
    }

    if (election.status === "PAUSED") {
      return NextResponse.json(
        { error: "Election Temporarily Paused." },
        { status: 403 }
      );
    }

    if (election.status === "ENDED") {
      return NextResponse.json(
        { error: "Election has already ended." },
        { status: 403 }
      );
    }

    // Check time window
    const now = new Date();
    if (election.start_time && now < new Date(election.start_time)) {
      return NextResponse.json(
        { error: "Election has not started yet." },
        { status: 403 }
      );
    }
    if (election.end_time && now > new Date(election.end_time)) {
      return NextResponse.json(
        { error: "Election has ended." },
        { status: 403 }
      );
    }

    // Student is valid — return student ID for OTP step
    // Mask email for display (e.g., s****t@gmail.com)
    const emailParts = email.split("@");
    const name = emailParts[0];
    const maskedName = name[0] + "****" + name[name.length - 1];
    const maskedEmail = maskedName + "@" + emailParts[1];

    // Audit log
    await supabase.from("audit_logs").insert({
      action: "STUDENT_LOGIN_INITIATED",
      performed_by: register_number.toUpperCase(),
      details: { email, device: request.headers.get("user-agent") || "unknown" },
      ip_address: ip,
    });

    return NextResponse.json({
      success: true,
      student_id: student.id,
      student_name: student.student_name,
      email: student.email,
      masked_email: maskedEmail,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
