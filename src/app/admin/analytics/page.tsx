"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Users,
  Building2,
  TrendingUp,
  Award,
} from "lucide-react";
import { POSITIONS } from "@/types";

interface DeptStat {
  department: string;
  total: number;
  voted: number;
  remaining: number;
  participation: number;
}

interface CandidateResult {
  candidate_name: string;
  position: string;
  department: string;
  vote_count: number;
}

interface OverallStats {
  total_students: number;
  total_voted: number;
  remaining: number;
  participation_percentage: number;
}

export default function AnalyticsPage() {
  const [departmentStats, setDepartmentStats] = useState<DeptStat[]>([]);
  const [candidateResults, setCandidateResults] = useState<CandidateResult[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/admin/analytics");
        if (res.ok) {
          const data = await res.json();
          setDepartmentStats(data.departmentStats || []);
          setCandidateResults(data.candidateResults || []);
          setOverallStats(data.overallStats || null);
        }
      } catch {
        toast.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#6B7280]">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A] flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-[#4A90E2]" />
          Advanced Analytics
        </h1>
        <p className="text-sm text-[#6B7280]">
          Real-time election statistics and insights
        </p>
      </div>

      {/* Overall Stats */}
      {overallStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <Users className="w-5 h-5 text-[#4A90E2] mx-auto mb-1" />
              <p className="text-2xl font-bold text-[#1A1A1A]">
                {overallStats.total_students}
              </p>
              <p className="text-xs text-[#6B7280]">Total Students</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-5 h-5 text-[#16A34A] mx-auto mb-1" />
              <p className="text-2xl font-bold text-[#16A34A]">
                {overallStats.total_voted}
              </p>
              <p className="text-xs text-[#6B7280]">Total Voted</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <Users className="w-5 h-5 text-[#F59E0B] mx-auto mb-1" />
              <p className="text-2xl font-bold text-[#F59E0B]">
                {overallStats.remaining}
              </p>
              <p className="text-xs text-[#6B7280]">Remaining</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <BarChart3 className="w-5 h-5 text-[#8B5CF6] mx-auto mb-1" />
              <p className="text-2xl font-bold text-[#8B5CF6]">
                {overallStats.participation_percentage}%
              </p>
              <p className="text-xs text-[#6B7280]">Participation</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Department Analytics */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#4A90E2]" />
            Department-Wise Participation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {departmentStats.map((dept) => (
              <div key={dept.department} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#1A1A1A]">
                      {dept.department}
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      {dept.voted} of {dept.total} students voted
                    </p>
                  </div>
                  <Badge
                    className={`border ${
                      dept.participation >= 75
                        ? "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20"
                        : dept.participation >= 50
                        ? "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20"
                        : "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20"
                    }`}
                  >
                    {dept.participation}%
                  </Badge>
                </div>
                <div className="bg-[#E2E8F0] rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      dept.participation >= 75
                        ? "bg-gradient-to-r from-[#16A34A] to-[#22C55E]"
                        : dept.participation >= 50
                        ? "bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]"
                        : "bg-gradient-to-r from-[#EF4444] to-[#F87171]"
                    }`}
                    style={{ width: `${dept.participation}%` }}
                  />
                </div>
              </div>
            ))}
            {departmentStats.length === 0 && (
              <p className="text-center text-[#6B7280] py-4">
                No department data available
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Candidate Analytics by Position */}
      {POSITIONS.map((pos) => {
        const posCandidates = candidateResults.filter(
          (c) => c.position === pos.value
        );
        if (posCandidates.length === 0) return null;

        const totalVotes = posCandidates.reduce(
          (s, c) => s + (Number(c.vote_count) || 0),
          0
        );
        const sorted = [...posCandidates].sort(
          (a, b) => (Number(b.vote_count) || 0) - (Number(a.vote_count) || 0)
        );

        return (
          <Card key={pos.value} className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="w-5 h-5 text-[#4A90E2]" />
                {pos.label}
                <Badge variant="secondary" className="ml-auto">
                  {totalVotes} total votes
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sorted.map((candidate, idx) => {
                  const voteCount = Number(candidate.vote_count) || 0;
                  const percentage =
                    totalVotes > 0
                      ? Math.round((voteCount / totalVotes) * 100)
                      : 0;

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#6B7280] w-5">
                            #{idx + 1}
                          </span>
                          <div>
                            <p className="font-medium text-[#1A1A1A] text-sm">
                              {candidate.candidate_name}
                            </p>
                            <p className="text-xs text-[#6B7280]">
                              {candidate.department}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#1A1A1A]">
                            {voteCount}
                          </p>
                          <p className="text-xs text-[#6B7280]">
                            {percentage}%
                          </p>
                        </div>
                      </div>
                      <div className="bg-[#E2E8F0] rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            idx === 0
                              ? "bg-gradient-to-r from-[#4A90E2] to-[#357ABD]"
                              : "bg-[#94A3B8]"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
