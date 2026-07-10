// ============================================================
// API: Verify OTP → Create Session (Email-based)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { otpSchema } from "@/lib/validations";
import { createSession } from "@/lib/auth";
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";

    // Rate limit — 5 attempts per 10 minutes per Blueprint §19
    const rateLimitResult = checkRateLimit(
      getRateLimitKey("verify", ip),
      RATE_LIMITS.verify
    );
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = otpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { register_number, email, otp } = parsed.data;

    const supabase = createAdminClient();

    // Verify OTP — lookup by email
    const { data: otpRecord, error: otpError } = await supabase
      .from("otp_verifications")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("otp", otp)
      .eq("verified", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpRecord) {
      return NextResponse.json(
        { error: "Invalid OTP" },
        { status: 401 }
      );
    }

    // Check expiry
    if (new Date(otpRecord.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "OTP Expired. Please request a new one." },
        { status: 401 }
      );
    }

    // Mark OTP as verified (single use only)
    await supabase
      .from("otp_verifications")
      .update({ verified: true })
      .eq("id", otpRecord.id);

    // Get student by register_number
    const { data: student } = await supabase
      .from("students")
      .select("id, register_number, email, is_voted")
      .eq("register_number", register_number.toUpperCase())
      .single();

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    if (student.is_voted) {
      return NextResponse.json(
        { error: "You have already voted." },
        { status: 403 }
      );
    }

    // Create session with email
    await createSession(student.id, student.register_number, student.email);

    // Audit log
    await supabase.from("audit_logs").insert({
      action: "STUDENT_LOGIN",
      performed_by: student.register_number,
      details: { email, register_number, device: request.headers.get("user-agent") || "unknown" },
      ip_address: ip,
    });

    return NextResponse.json({
      success: true,
      redirect: "/vote",
    });
  } catch {
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
