"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Loader2, Lock } from "lucide-react";
import { adminLoginSchema } from "@/lib/validations";
import type { z } from "zod";
import Link from "next/link";

type AdminLoginData = z.infer<typeof adminLoginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginData>({
    resolver: zodResolver(adminLoginSchema),
  });

  const onSubmit = async (data: AdminLoginData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Login failed");
        return;
      }

      toast.success(`Welcome, ${result.admin.name}`);
      router.push("/admin/dashboard");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#F0F7FF] to-[#DCEEFF] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#1A1A1A] dark:text-slate-400 dark:hover:text-white mb-6 transition-colors"
        >
          ← Back to Home
        </Link>

        <Card className="border border-[#E2E8F0] dark:border-slate-800 shadow-xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-md">
          <CardHeader className="text-center pb-2">
            <div className="w-14 h-14 rounded-2xl bg-[#1A1A1A] dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-[#1A1A1A] dark:text-white">
              Admin Panel
            </CardTitle>
            <p className="text-sm text-[#6B7280] dark:text-slate-400 mt-1">
              Sign in to manage the election
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-medium text-[#1A1A1A] dark:text-slate-200">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@college.edu"
                  className="h-11 border-[#E2E8F0] dark:border-slate-800 bg-transparent text-foreground placeholder:text-muted-foreground focus:border-[#4A90E2]"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-medium text-[#1A1A1A] dark:text-slate-200">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="h-11 border-[#E2E8F0] dark:border-slate-800 bg-transparent text-foreground placeholder:text-muted-foreground focus:border-[#4A90E2]"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#1A1A1A] dark:bg-slate-100 hover:bg-[#333] dark:hover:bg-slate-200 text-white dark:text-slate-950 font-medium"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <ShieldCheck className="w-4 h-4 mr-2" />
                )}
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
