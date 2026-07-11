"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Activity,
  Vote,
} from "lucide-react";
import { useRealtime } from "@/hooks/useRealtime";
import type { DashboardStats, Candidate, Position } from "@/types";
import { POSITIONS } from "@/types";

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [candidates, setCandidates] = useState<(Candidate & { vote_count: number })[]>([]);
  const [electionStatus, setElectionStatus] = useState("NOT_STARTED");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [electionRes, candidatesRes] = await Promise.all([
        fetch("/api/admin/election", { cache: "no-store" }),
        fetch("/api/admin/candidates?with_votes=true", { cache: "no-store" }),
      ]);

      if (electionRes.ok) {
        const data = await electionRes.json();
        setStats(data.stats);
        setElectionStatus(data.election?.status || "NOT_STARTED");
      }

      if (candidatesRes.ok) {
        const data = await candidatesRes.json();
        setCandidates(data.candidates || []);
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Poll every 5 seconds for live stats during active elections
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Real-time updates when votes come in
  useRealtime("votes", useCallback(() => {
    fetchData();
  }, [fetchData]));

  useRealtime("students", useCallback(() => {
    fetchData();
  }, [fetchData]));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Activity className="w-8 h-8 text-[#4A90E2] animate-pulse mx-auto mb-2" />
          <p className="text-sm text-[#6B7280]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Dashboard</h1>
          <p className="text-sm text-[#6B7280]">Real-time election monitoring</p>
        </div>
        <Badge
          className={`px-3 py-1 text-sm ${
            electionStatus === "ACTIVE"
              ? "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20"
              : electionStatus === "ENDED"
              ? "bg-red-50 text-red-600 border-red-200"
              : "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full mr-2 inline-block ${
              electionStatus === "ACTIVE" ? "bg-[#16A34A] animate-pulse" : ""
            }`}
          />
          {electionStatus === "ACTIVE"
            ? "Election Live"
            : electionStatus === "ENDED"
            ? "Election Ended"
            : "Not Started"}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                  Total Students
                </p>
                <p className="text-3xl font-bold text-[#1A1A1A] mt-1">
                  {stats?.total_students || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#4A90E2]/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-[#4A90E2]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                  Total Voted
                </p>
                <p className="text-3xl font-bold text-[#16A34A] mt-1">
                  {stats?.total_voted || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#16A34A]/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-[#16A34A]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                  Remaining
                </p>
                <p className="text-3xl font-bold text-[#F59E0B] mt-1">
                  {stats?.remaining || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                  Participation
                </p>
                <p className="text-3xl font-bold text-[#4A90E2] mt-1">
                  {stats?.participation_percentage || 0}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#4A90E2]/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#4A90E2]" />
              </div>
            </div>
            <Progress
              value={stats?.participation_percentage || 0}
              className="mt-3 h-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Live Vote Distribution */}
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-[#1A1A1A] flex items-center gap-2">
            <Vote className="w-5 h-5 text-[#4A90E2]" />
            Live Vote Distribution
          </CardTitle>
          <p className="text-xs text-[#6B7280]">
            {electionStatus === "ACTIVE"
              ? "Updates in real-time"
              : "Current vote counts"}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {POSITIONS.map((pos) => {
              const posCandidates = candidates.filter(
                (c) => c.position === pos.value && c.status === "active"
              );
              const totalVotesForPosition = posCandidates.reduce(
                (sum, c) => sum + (c.vote_count || 0),
                0
              );

              return (
                <div key={pos.value}>
                  <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">
                    {pos.label}
                  </h3>
                  <div className="space-y-2">
                    {posCandidates.map((candidate) => {
                      const percentage =
                        totalVotesForPosition > 0
                          ? Math.round(
                              ((candidate.vote_count || 0) / totalVotesForPosition) * 100
                            )
                          : 0;
                      return (
                        <div key={candidate.id} className="flex items-center gap-3">
                          <div className="w-32 text-sm text-[#1A1A1A] truncate font-medium">
                            {candidate.candidate_name}
                          </div>
                          <div className="flex-1 bg-[#F1F5F9] rounded-full h-6 relative overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#4A90E2] to-[#357ABD] rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                              style={{
                                width: `${Math.max(percentage, 2)}%`,
                              }}
                            >
                              {percentage > 15 && (
                                <span className="text-[10px] font-medium text-white">
                                  {percentage}%
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="w-16 text-right text-sm font-semibold text-[#1A1A1A]">
                            {candidate.vote_count || 0}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
