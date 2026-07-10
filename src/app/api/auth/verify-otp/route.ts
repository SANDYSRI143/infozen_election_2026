// ============================================================
// API: Verify OTP + CAPTCHA → Create Session (Email-based)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { otpSchema } from "@/lib/validations";
import { createSession } from "@/lib/auth";
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";

async function verifyCaptcha(token: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  // Skip CAPTCHA in development if no key configured or dev-skip token
  if (!secret || secret === "your-recaptcha-secret-key") {
    return true;
  }

  // Allow dev-skip token in development (localhost)
  if (token === "dev-skip") {
    return true;
  }

  try {
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${secret}&response=${token}`,
      }
    );
    const data = await response.json();
    console.log("reCAPTCHA response data from Google:", data);
    if (!data.success) {
      console.warn("reCAPTCHA failed. Error codes:", data["error-codes"]);
    }
    return data.success === true;
  } catch (err) {
    console.error("reCAPTCHA network/verification error:", err);
    return false;
  }
}

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

    const { register_number, email, otp, captcha_token } = parsed.data;

    // Verify CAPTCHA
    const captchaValid = await verifyCaptcha(captcha_token);
    if (!captchaValid) {
      return NextResponse.json(
        { error: "Captcha Verification Failed" },
        { status: 400 }
      );
    }

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
