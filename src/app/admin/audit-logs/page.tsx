"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";

interface AuditLogEntry {
  id: string;
  action: string;
  performed_by: string;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  STUDENT_LOGIN_INITIATED: "bg-blue-50 text-blue-600 border-blue-100",
  STUDENT_OTP_REQUEST: "bg-orange-100 text-orange-700 border-orange-200",
  STUDENT_LOGIN: "bg-blue-100 text-blue-700 border-blue-200",
  VOTE_SUBMITTED: "bg-green-100 text-green-700 border-green-200",
  ELECTION_STARTED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  ELECTION_PAUSED: "bg-yellow-100 text-yellow-700 border-yellow-200",
  ELECTION_RESUMED: "bg-cyan-100 text-cyan-700 border-cyan-200",
  ELECTION_ENDED: "bg-red-100 text-red-700 border-red-200",
  ADMIN_ADDED: "bg-purple-100 text-purple-700 border-purple-200",
  ADMIN_REMOVED: "bg-pink-100 text-pink-700 border-pink-200",
  CANDIDATE_ADDED: "bg-indigo-100 text-indigo-700 border-indigo-200",
  CANDIDATE_UPDATED: "bg-sky-100 text-sky-700 border-sky-200",
  RESULTS_EXPORTED: "bg-teal-100 text-teal-700 border-teal-200",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "25",
        ...(search && { search }),
        ...(actionFilter && actionFilter !== "all" && { action: actionFilter }),
      });
      const res = await fetch(`/api/admin/audit-logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
        if (data.actionTypes) setActionTypes(data.actionTypes);
      }
    } catch {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [search, actionFilter, page]);

  useEffect(() => {
    setLoading(true);
    const debounce = setTimeout(fetchLogs, 300);
    return () => clearTimeout(debounce);
  }, [fetchLogs]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A] flex items-center gap-2">
          <Shield className="w-6 h-6 text-[#4A90E2]" />
          Audit Logs
        </h1>
        <p className="text-sm text-[#6B7280]">
          {total} total events recorded
        </p>
      </div>

      {/* Search & Filter */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <Input
                placeholder="Search by action, performer..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10 border-[#E2E8F0]"
              />
            </div>
            <Select
              value={actionFilter}
              onValueChange={(val) => {
                setActionFilter(val || "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[200px] border-[#E2E8F0]">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actionTypes.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F8FAFC]">
                  <TableHead className="font-semibold">Timestamp</TableHead>
                  <TableHead className="font-semibold">Action</TableHead>
                  <TableHead className="font-semibold">Performed By</TableHead>
                  <TableHead className="font-semibold">IP Address</TableHead>
                  <TableHead className="font-semibold">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-[#F8FAFC]">
                    <TableCell className="text-sm text-[#6B7280] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`border text-xs font-medium ${
                          ACTION_COLORS[log.action] ||
                          "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        <ScrollText className="w-3 h-3 mr-1" />
                        {log.action.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-[#1A1A1A]">
                      {log.performed_by}
                    </TableCell>
                    <TableCell className="text-sm text-[#6B7280] font-mono">
                      {log.ip_address || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-[#6B7280] max-w-[200px] truncate">
                      {log.details
                        ? JSON.stringify(log.details).slice(0, 80)
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && !loading && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-[#6B7280]"
                    >
                      <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No audit logs found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#E2E8F0]">
              <p className="text-sm text-[#6B7280]">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="border-[#E2E8F0]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="border-[#E2E8F0]"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
