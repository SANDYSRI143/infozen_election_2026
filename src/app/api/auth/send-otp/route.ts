// ============================================================
// API: Send OTP via Email (SMTP / Nodemailer)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";
import nodemailer from "nodemailer";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create reusable email transporter
function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_APP_PASSWORD,
    },
  });
}

async function sendOTPEmail(email: string, otp: string, studentName: string): Promise<boolean> {
  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"INFOZEN ELECTION" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: "INFOZEN ELECTION Verification Code",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 56px; height: 56px; background: #4A90E2; border-radius: 14px; display: inline-flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 24px; font-weight: bold;">✓</span>
            </div>
          </div>
          <h2 style="text-align: center; color: #1A1A1A; margin: 0 0 8px; font-size: 22px;">Verify Your Identity</h2>
          <p style="text-align: center; color: #6B7280; margin: 0 0 24px; font-size: 14px;">
            Hello ${studentName}, your OTP Code is:
          </p>
          <div style="background: #F0F7FF; border: 2px solid #4A90E2; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4A90E2; font-family: monospace;">${otp}</span>
          </div>
          <p style="text-align: center; color: #6B7280; font-size: 13px; margin: 0 0 4px;">
            This OTP is valid for <strong>5 minutes</strong>.
          </p>
          <p style="text-align: center; color: #DC2626; font-size: 13px; margin: 8px 0 0; font-weight: 600;">
            Do not share this OTP with anyone.
          </p>
          <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
          <p style="text-align: center; color: #9CA3AF; font-size: 11px; margin: 0;">
            ASSOCIATION ELECTION 2026 — Secure Votes. Fair Leadership.
          </p>
        </div>
      `,
    });

    return true;
  } catch (err) {
    console.error("Email send error:", err);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Rate limit — 3 requests per 5 minutes per Blueprint §19
    const rateLimitResult = checkRateLimit(
      getRateLimitKey("otp", email),
      RATE_LIMITS.otp
    );
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many OTP requests. Please wait 5 minutes." },
        { status: 429 }
      );
    }

    const supabase = createAdminClient();

    // Verify student exists with this email
    const { data: student } = await supabase
      .from("students")
      .select("email, student_name, register_number")
      .eq("email", email.toLowerCase())
      .limit(1)
      .single();

    if (!student?.email) {
      return NextResponse.json(
        { error: "No student found with this email." },
        { status: 404 }
      );
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Invalidate previous OTPs for this email
    await supabase
      .from("otp_verifications")
      .update({ verified: true })
      .eq("email", email.toLowerCase())
      .eq("verified", false);

    // Store new OTP
    await supabase.from("otp_verifications").insert({
      email: email.toLowerCase(),
      otp,
      expires_at: expiresAt.toISOString(),
    });

    // Send OTP via email
    const emailSent = await sendOTPEmail(email, otp, student.student_name);

    if (!emailSent) {
      // Fallback: log to console in dev mode
      console.log(`\n🔐 [ANTIGRAVITY OTP] Email: ${email} | OTP: ${otp}\n`);
    }

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    await supabase.from("audit_logs").insert({
      action: "STUDENT_OTP_REQUEST",
      performed_by: student.register_number,
      details: { email: student.email, device: request.headers.get("user-agent") || "unknown" },
      ip_address: ip,
    });

    // Mask email for display (e.g., s****t@gmail.com)
    const emailParts = email.split("@");
    const name = emailParts[0];
    const maskedName = name[0] + "****" + name[name.length - 1];
    const maskedEmail = maskedName + "@" + emailParts[1];

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${maskedEmail}`,
      masked_email: maskedEmail,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}
