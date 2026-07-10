"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Download,
  FileText,
  FileSpreadsheet,
  FileDown,
  Lock,
  Award,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { POSITIONS } from "@/types";
import type { CandidateResult, PositionResult, DashboardStats } from "@/types";
import {
  exportResultsToPDF,
  exportResultsToExcel,
  exportResultsToCSV,
} from "@/lib/export";

export default function ResultsPage() {
  const [results, setResults] = useState<PositionResult[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [electionTitle, setElectionTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [restricted, setRestricted] = useState(false);
  const [showVoteDetails, setShowVoteDetails] = useState(false);
  const [voteDetails, setVoteDetails] = useState<VoteDetail[]>([]);
  const [voteDetailsLoading, setVoteDetailsLoading] = useState(false);
  const [voteSearch, setVoteSearch] = useState("");
  const [votePage, setVotePage] = useState(1);
  const [voteTotalPages, setVoteTotalPages] = useState(1);
  const [voteTotal, setVoteTotal] = useState(0);
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());

  interface StudentVote {
    position: string;
    candidate_name: string;
    candidate_department: string;
  }

  interface VoteDetail {
    student_id: string;
    register_number: string;
    student_name: string;
    department: string;
    year: number;
    voted_at: string;
    votes: StudentVote[];
  }

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await fetch("/api/admin/results");
        if (res.status === 403) {
          setRestricted(true);
          setLoading(false);
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setElectionTitle(data.election_title || "Election");
          setStats(data.stats);

          // Transform results into PositionResult format
          const rawResults = data.results || [];
          const grouped: PositionResult[] = POSITIONS.map((pos) => {
            const posCandidates: CandidateResult[] = rawResults
              .filter((r: Record<string, unknown>) => r.position === pos.value)
              .map((r: Record<string, unknown>) => ({
                id: r.candidate_id,
                candidate_name: r.candidate_name,
                position: r.position,
                department: r.department,
                photo_url: r.photo_url,
                vote_count: Number(r.vote_count) || 0,
                status: "active",
                bio: null,
                symbol_url: null,
                created_at: "",
              })) as CandidateResult[];

            const winner =
              posCandidates.length > 0
                ? posCandidates.reduce((max, c) =>
                    c.vote_count > max.vote_count ? c : max
                  )
                : null;

            return {
              position: pos.value,
              label: pos.label,
              candidates: posCandidates,
              winner: winner && winner.vote_count > 0 ? winner : null,
            };
          });

          setResults(grouped);
        }
      } catch {
        toast.error("Failed to load results");
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, []);

  const fetchVoteDetails = useCallback(async () => {
    setVoteDetailsLoading(true);
    try {
      const params = new URLSearchParams({
        search: voteSearch,
        page: String(votePage),
        limit: "25",
      });
      const res = await fetch(`/api/admin/results/vote-details?${params}`);
      if (res.ok) {
        const data = await res.json();
        setVoteDetails(data.vote_details || []);
        setVoteTotalPages(data.totalPages || 1);
        setVoteTotal(data.total || 0);
      }
    } catch {
      toast.error("Failed to load vote details");
    } finally {
      setVoteDetailsLoading(false);
    }
  }, [voteSearch, votePage]);

  useEffect(() => {
    if (showVoteDetails) {
      const debounce = setTimeout(fetchVoteDetails, 300);
      return () => clearTimeout(debounce);
    }
  }, [showVoteDetails, fetchVoteDetails]);

  const toggleStudentExpand = (studentId: string) => {
    setExpandedStudents(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const getPositionLabel = (pos: string) => {
    const found = POSITIONS.find(p => p.value === pos);
    return found ? found.label : pos;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#6B7280]">Loading results...</p>
      </div>
    );
  }

  if (restricted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Lock className="w-12 h-12 text-[#6B7280] mx-auto mb-4 opacity-30" />
          <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">
            Results Not Available
          </h2>
          <p className="text-[#6B7280]">
            Results will be visible after the election ends.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <Trophy className="w-6 h-6 text-[#F59E0B]" />
            Election Results
          </h1>
          <p className="text-sm text-[#6B7280]">{electionTitle}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportResultsToPDF(results, electionTitle)}
            className="border-[#E2E8F0]"
          >
            <FileText className="w-4 h-4 mr-1" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportResultsToExcel(results, electionTitle)}
            className="border-[#E2E8F0]"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1" />
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportResultsToCSV(results, electionTitle)}
            className="border-[#E2E8F0]"
          >
            <FileDown className="w-4 h-4 mr-1" />
            CSV
          </Button>
        </div>
      </div>

      {/* Stats summary */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm text-center p-4">
            <p className="text-2xl font-bold text-[#1A1A1A]">{stats.total_students}</p>
            <p className="text-xs text-[#6B7280]">Total Students</p>
          </Card>
          <Card className="border-0 shadow-sm text-center p-4">
            <p className="text-2xl font-bold text-[#16A34A]">{stats.total_voted}</p>
            <p className="text-xs text-[#6B7280]">Total Voted</p>
          </Card>
          <Card className="border-0 shadow-sm text-center p-4">
            <p className="text-2xl font-bold text-[#4A90E2]">{stats.participation_percentage}%</p>
            <p className="text-xs text-[#6B7280]">Participation</p>
          </Card>
        </div>
      )}

      {/* Results by position */}
      {results.map((posResult) => (
        <Card key={posResult.position} className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              {posResult.label}
              {posResult.winner && (
                <Badge className="bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20 border ml-auto">
                  <Award className="w-3 h-3 mr-1" />
                  Winner: {posResult.winner.candidate_name}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {posResult.candidates.map((candidate, idx) => {
                const isWinner = posResult.winner?.id === candidate.id;
                const totalVotes = posResult.candidates.reduce(
                  (s, c) => s + c.vote_count,
                  0
                );
                const percentage =
                  totalVotes > 0
                    ? Math.round((candidate.vote_count / totalVotes) * 100)
                    : 0;

                return (
                  <div
                    key={candidate.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isWinner
                        ? "bg-[#F59E0B]/5 border-[#F59E0B]/20"
                        : "bg-[#F8FAFC] border-[#E2E8F0]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-[#6B7280] w-6">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-[#1A1A1A] flex items-center gap-2">
                            {isWinner && <Trophy className="w-4 h-4 text-[#F59E0B]" />}
                            {candidate.candidate_name}
                          </p>
                          <p className="text-xs text-[#6B7280]">
                            {candidate.department}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#1A1A1A]">
                          {candidate.vote_count}
                        </p>
                        <p className="text-xs text-[#6B7280]">votes</p>
                      </div>
                    </div>
                    <div className="bg-[#E2E8F0] rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isWinner
                            ? "bg-gradient-to-r from-[#F59E0B] to-[#F97316]"
                            : "bg-gradient-to-r from-[#4A90E2] to-[#357ABD]"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-[#6B7280] mt-1 text-right">
                      {percentage}%
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Vote Details Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#4A90E2]" />
            Individual Vote Details
            <Button
              variant="outline"
              size="sm"
              className="ml-auto border-[#E2E8F0]"
              onClick={() => setShowVoteDetails(!showVoteDetails)}
            >
              {showVoteDetails ? (
                <><ChevronUp className="w-4 h-4 mr-1" /> Hide Details</>
              ) : (
                <><ChevronDown className="w-4 h-4 mr-1" /> Show Details</>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        {showVoteDetails && (
          <CardContent>
            <div className="space-y-4">
              {/* Search */}
              <div className="relative max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                <Input
                  placeholder="Search by register no, name, department..."
                  value={voteSearch}
                  onChange={(e) => {
                    setVoteSearch(e.target.value);
                    setVotePage(1);
                  }}
                  className="pl-10 border-[#E2E8F0]"
                />
              </div>

              <p className="text-sm text-[#6B7280]">
                {voteTotal} students voted
              </p>

              {/* Vote Details Table */}
              <div className="overflow-x-auto rounded-lg border border-[#E2E8F0]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F8FAFC]">
                      <TableHead className="font-semibold w-8"></TableHead>
                      <TableHead className="font-semibold">Register No</TableHead>
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold">Department</TableHead>
                      <TableHead className="font-semibold">Voted At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {voteDetails.map((detail) => {
                      const isExpanded = expandedStudents.has(detail.student_id);
                      return (
                        <>
                          <TableRow
                            key={detail.student_id}
                            className="hover:bg-[#F8FAFC] cursor-pointer"
                            onClick={() => toggleStudentExpand(detail.student_id)}
                          >
                            <TableCell className="w-8">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-[#6B7280]" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-[#6B7280]" />
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-sm font-medium">
                              {detail.register_number}
                            </TableCell>
                            <TableCell className="font-medium">
                              {detail.student_name}
                            </TableCell>
                            <TableCell className="text-[#6B7280]">
                              {detail.department}
                            </TableCell>
                            <TableCell className="text-sm text-[#6B7280]">
                              {detail.voted_at
                                ? new Date(detail.voted_at).toLocaleString()
                                : "—"}
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow key={`${detail.student_id}-votes`}>
                              <TableCell colSpan={5} className="p-0">
                                <div className="bg-[#F0F7FF] dark:bg-slate-800/30 px-6 py-3">
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {detail.votes.map((vote) => (
                                      <div
                                        key={vote.position}
                                        className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-[#E2E8F0] dark:border-slate-700 shadow-sm"
                                      >
                                        <p className="text-[10px] uppercase tracking-wider text-[#6B7280] font-semibold mb-1">
                                          {getPositionLabel(vote.position)}
                                        </p>
                                        <p className="text-sm font-semibold text-[#1A1A1A] dark:text-slate-200">
                                          {vote.candidate_name}
                                        </p>
                                        <p className="text-xs text-[#6B7280]">
                                          {vote.candidate_department}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })}
                    {voteDetails.length === 0 && !voteDetailsLoading && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-[#6B7280]">
                          No vote records found
                        </TableCell>
                      </TableRow>
                    )}
                    {voteDetailsLoading && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-[#6B7280]">
                          Loading vote details...
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {voteTotalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#6B7280]">
                    Page {votePage} of {voteTotalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={votePage <= 1}
                      onClick={() => setVotePage(votePage - 1)}
                      className="border-[#E2E8F0]"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={votePage >= voteTotalPages}
                      onClick={() => setVotePage(votePage + 1)}
                      className="border-[#E2E8F0]"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
