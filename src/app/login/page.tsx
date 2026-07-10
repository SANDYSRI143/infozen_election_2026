"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Vote,
  ArrowLeft,
  ArrowRight,
  Loader2,
  ShieldCheck,
  KeyRound,
  UserCheck,
  Mail,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { loginSchema, otpSchema } from "@/lib/validations";
import type { z } from "zod";
import Link from "next/link";

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1); // 1=credentials, 2=otp
  const [loading, setLoading] = useState(false);
  const [studentEmail, setStudentEmail] = useState("");
  const [registerNumber, setRegisterNumber] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [alertMessage, setAlertMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend OTP cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Send OTP helper
  const sendOtp = useCallback(async (email: string) => {
    const otpRes = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const otpResult = await otpRes.json();

    if (!otpRes.ok) {
      toast.error(otpResult.error || "Failed to send OTP");
      return null;
    }

    return otpResult;
  }, []);

  // Step 1: Validate credentials
  const onCredentialSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setAlertMessage("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setAlertMessage(result.error || "Invalid credentials. Please check your details.");
        } else if (res.status === 403) {
          setAlertMessage(result.error || "Access denied.");
        } else {
          toast.error(result.error || "Login failed");
        }
        return;
      }

      setStudentEmail(data.email);
      setRegisterNumber(data.register_number);

      // Send OTP to email
      const otpResult = await sendOtp(data.email);
      if (!otpResult) return;


      if (otpResult.masked_email) {
        setMaskedEmail(otpResult.masked_email);
      }

      toast.success(otpResult.message || "OTP Sent Successfully");
      setResendCooldown(60); // 60 second cooldown
      setStep(2);
    } catch {
      toast.error("Network Error. Please Retry.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !studentEmail) return;
    setLoading(true);
    try {
      const otpResult = await sendOtp(studentEmail);
      if (!otpResult) return;


      toast.success("OTP Sent Successfully");
      setResendCooldown(60);
      setOtp("");
    } catch {
      toast.error("Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const onVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const parsed = otpSchema.safeParse({
        register_number: registerNumber,
        email: studentEmail,
        otp,
      });

      if (!parsed.success) {
        toast.error("Invalid input");
        return;
      }

      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Verification failed");
        return;
      }

      toast.success("Login Successful! Redirecting to voting...");
      router.push("/vote");
    } catch {
      toast.error("Network Error. Please Retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#F0F7FF] to-[#DCEEFF] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      {/* Decorative */}
      <div className="fixed -top-40 -right-40 w-80 h-80 rounded-full bg-[#DCEEFF]/50 dark:bg-blue-900/10 blur-3xl" />
      <div className="fixed -bottom-20 -left-20 w-60 h-60 rounded-full bg-[#4A90E2]/10 dark:bg-blue-900/5 blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Back link */}
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#1A1A1A] dark:text-slate-400 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <Card className="border border-[#E2E8F0] dark:border-slate-800 shadow-xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-md">
          <CardHeader className="text-center pb-2">
            <div className="w-14 h-14 rounded-2xl bg-[#4A90E2] flex items-center justify-center mx-auto mb-3">
              <Vote className="w-7 h-7 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-[#1A1A1A] dark:text-white">
              Student Login
            </CardTitle>
            <p className="text-sm text-[#6B7280] dark:text-slate-400 mt-1">
              Verify your identity to cast your vote
            </p>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {[
                { icon: UserCheck, label: "Verify" },
                { icon: KeyRound, label: "OTP" },
                { icon: ShieldCheck, label: "Confirm" },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                      step > i + 1
                        ? "bg-[#16A34A] text-white"
                        : step === i + 1
                        ? "bg-[#4A90E2] text-white"
                        : "bg-[#F1F5F9] dark:bg-slate-800 text-[#6B7280] dark:text-slate-400"
                    }`}
                  >
                    <s.icon className="w-4 h-4" />
                  </div>
                  {i < 2 && (
                    <div
                      className={`w-8 h-0.5 transition-all duration-300 ${
                        step > i + 1 ? "bg-[#16A34A]" : "bg-[#E2E8F0] dark:bg-slate-800"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <AnimatePresence mode="wait">
              {/* Step 1: Credentials */}
              {step === 1 && (
                <motion.form
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSubmit(onCredentialSubmit)}
                  className="space-y-4"
                >
                  {/* Alert message for credential errors */}
                  {alertMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30"
                    >
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                        {alertMessage}
                      </p>
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="register_number" className="text-[#1A1A1A] dark:text-slate-200 font-medium">
                      Register Number
                    </Label>
                    <Input
                      id="register_number"
                      placeholder="Eg: 7150XXXXXXXX"
                      className="h-11 border-[#E2E8F0] dark:border-slate-800 bg-transparent text-foreground placeholder:text-muted-foreground focus:border-[#4A90E2] focus:ring-[#4A90E2]/20"
                      {...register("register_number")}
                      onChange={(e) => {
                        register("register_number").onChange(e);
                        setAlertMessage("");
                      }}
                    />
                    {errors.register_number && (
                      <p className="text-xs text-red-500">{errors.register_number.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dob" className="text-[#1A1A1A] dark:text-slate-200 font-medium">
                      Date of Birth
                    </Label>
                    <Input
                      id="dob"
                      type="date"
                      className="h-11 border-[#E2E8F0] dark:border-slate-800 bg-transparent text-foreground focus:border-[#4A90E2] focus:ring-[#4A90E2]/20"
                      {...register("dob")}
                    />
                    {errors.dob && (
                      <p className="text-xs text-red-500">{errors.dob.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#1A1A1A] dark:text-slate-200 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-[#4A90E2]" />
                        Email Address
                      </span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      className="h-11 border-[#E2E8F0] dark:border-slate-800 bg-transparent text-foreground placeholder:text-muted-foreground focus:border-[#4A90E2] focus:ring-[#4A90E2]/20"
                      {...register("email")}
                      onChange={(e) => {
                        register("email").onChange(e);
                        setAlertMessage("");
                      }}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500">{errors.email.message}</p>
                    )}
                    <p className="text-xs text-[#6B7280] dark:text-slate-400">
                      OTP will be sent to this email address
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-[#4A90E2] hover:bg-[#357ABD] text-white rounded-lg transition-all duration-200"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {loading ? "Verifying..." : "Continue"}
                    {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                </motion.form>
              )}

              {/* Step 2: OTP */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-[#1A1A1A] dark:text-slate-200 font-medium">
                      Enter OTP
                    </Label>
                    <p className="text-xs text-[#6B7280] dark:text-slate-400">
                      A 6-digit code has been sent to{" "}
                      <span className="font-medium text-[#4A90E2] dark:text-blue-400">{maskedEmail || studentEmail}</span>
                    </p>
                    <Input
                      id="otp"
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      className="h-12 text-center text-lg tracking-[0.5em] font-mono border-[#E2E8F0] dark:border-slate-800 bg-transparent text-foreground focus:border-[#4A90E2] focus:ring-[#4A90E2]/20"
                    />

                    {/* Resend OTP */}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={resendCooldown > 0 || loading}
                        className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                          resendCooldown > 0
                            ? "text-[#9CA3AF] cursor-not-allowed"
                            : "text-[#4A90E2] hover:text-[#357ABD] cursor-pointer"
                        }`}
                      >
                        <RefreshCw className="w-3 h-3" />
                        {resendCooldown > 0
                          ? `Resend OTP in ${resendCooldown}s`
                          : "Resend OTP"}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1 h-11 border-[#E2E8F0] dark:border-slate-800 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Back
                    </Button>
                    <Button
                      onClick={onVerifyOtp}
                      disabled={loading || otp.length !== 6}
                      className="flex-1 h-11 bg-[#4A90E2] hover:bg-[#357ABD] text-white"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 mr-2" />
                      )}
                      {loading ? "Verifying..." : "Verify & Vote"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-[#6B7280] dark:text-slate-400 mt-4">
          Your vote is secure and confidential
        </p>
      </div>
    </div>
  );
}
