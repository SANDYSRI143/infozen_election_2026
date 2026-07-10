"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Trophy,
  Settings,
  Vote,
  LogOut,
  Menu,
  ChevronRight,
  BarChart3,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

const navItems = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/candidates", icon: UserCheck, label: "Candidates" },
  { href: "/admin/students", icon: Users, label: "Students" },
  { href: "/admin/results", icon: Trophy, label: "Results" },
  { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/admin/audit-logs", icon: Shield, label: "Audit Logs" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

function SidebarContent({ pathname }: { pathname: string }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Clear admin session cookie
      document.cookie = "ag_admin_session=; path=/; max-age=0";
      toast.success("Logged out successfully");
      router.push("/admin/login");
    } catch {
      toast.error("Logout failed");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 text-foreground transition-colors duration-200">
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#4A90E2] flex items-center justify-center">
            <Vote className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-[#1A1A1A] dark:text-white text-sm">Association Election</h2>
            <p className="text-[10px] text-[#6B7280] dark:text-slate-400">Admin Panel</p>
          </div>
        </div>
      </div>

      <Separator className="mx-4 dark:bg-slate-800" />

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-[#4A90E2] text-white shadow-sm shadow-[#4A90E2]/20"
                    : "text-[#6B7280] dark:text-slate-400 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 hover:text-[#1A1A1A] dark:hover:text-white"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
                {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Logout & Theme */}
      <div className="p-4 border-t border-[#E2E8F0] dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#6B7280] dark:text-slate-400 flex-1">Theme</span>
          <ThemeToggle />
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Don't show sidebar on login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-foreground transition-colors duration-200">
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col bg-white dark:bg-slate-900 border-r border-[#E2E8F0] dark:border-slate-800 transition-colors duration-200">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-[#E2E8F0] dark:border-slate-800 px-4 py-3 transition-colors duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#4A90E2] flex items-center justify-center">
              <Vote className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm text-[#1A1A1A] dark:text-white">Association Election</span>
          </div>
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger>
              <Menu className="w-5 h-5 text-foreground" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
              <SidebarContent pathname={pathname} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
