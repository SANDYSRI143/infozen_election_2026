import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#F0F7FF] to-[#DCEEFF] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-[#F59E0B]/20 dark:text-[#F59E0B]/10 mb-4">403</div>
        <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-white mb-2">
          Unauthorized Access
        </h1>
        <p className="text-[#6B7280] dark:text-slate-400 mb-6">
          You do not have permission to access this page.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center h-10 px-6 rounded-lg bg-[#4A90E2] hover:bg-[#357ABD] text-white text-sm font-medium transition-colors"
        >
          Return Home
        </Link>
        <p className="text-xs text-[#6B7280] dark:text-slate-500 mt-6">
          ASSOCIATION ELECTION 2026 — Secure Votes. Fair Leadership.
        </p>
      </div>
    </div>
  );
}
