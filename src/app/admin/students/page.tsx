"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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
  Upload,
  Download,
  Users,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardPaste,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { useRealtime } from "@/hooks/useRealtime";
import { exportStudentsToCSV } from "@/lib/export";
import type { Student } from "@/types";

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pasteImporting, setPasteImporting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    student_name: "",
    department: "",
    year: "",
    dob: "",
    email: "",
    mobile_number: "",
  });

  const fetchStudents = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        search,
        filter,
        page: String(page),
        limit: "25",
      });
      const res = await fetch(`/api/admin/students?${params}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [search, filter, page]);

  useEffect(() => {
    setLoading(true);
    const debounce = setTimeout(fetchStudents, 300);
    return () => clearTimeout(debounce);
  }, [fetchStudents]);

  // Real-time refresh on student updates
  useRealtime("students", useCallback(() => {
    fetchStudents();
  }, [fetchStudents]));

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split("\n").filter((l) => l.trim());
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

      const students = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => {
          obj[h] = values[i] || "";
        });
        return obj;
      });

      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students }),
      });

      const result = await res.json();
      if (res.ok) {
        toast.success(`Imported ${result.imported} students`);
        fetchStudents();
      } else {
        toast.error(result.error || "Import failed");
      }
    } catch {
      toast.error("Failed to parse CSV");
    }
    e.target.value = "";
  };

  const handlePasteImport = async () => {
    if (!pasteText.trim()) {
      toast.error("Please paste some data first");
      return;
    }

    setPasteImporting(true);
    try {
      const lines = pasteText.split("\n").filter((l) => l.trim());
      if (lines.length < 2) {
        toast.error("Need at least a header row and one data row");
        setPasteImporting(false);
        return;
      }

      // Detect delimiter (tab or comma)
      const delimiter = lines[0].includes("\t") ? "\t" : ",";
      const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase().replace(/[\"]/g, ""));

      const students = lines.slice(1).map((line) => {
        const values = line.split(delimiter).map((v) => v.trim().replace(/[\"]/g, ""));
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => {
          obj[h] = values[i] || "";
        });
        return obj;
      });

      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students }),
      });

      const result = await res.json();
      if (res.ok) {
        toast.success(`Imported ${result.imported} students from pasted data`);
        fetchStudents();
        setPasteDialogOpen(false);
        setPasteText("");
      } else {
        toast.error(result.error || "Import failed");
      }
    } catch {
      toast.error("Failed to parse pasted data");
    } finally {
      setPasteImporting(false);
    }
  };

  const openEditDialog = (student: Student) => {
    setEditStudent(student);
    setEditForm({
      student_name: student.student_name,
      department: student.department,
      year: String(student.year),
      dob: student.dob || "",
      email: student.email,
      mobile_number: student.mobile_number || "",
    });
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editStudent || !editForm.student_name || !editForm.email) {
      toast.error("Name and email are required");
      return;
    }

    setEditSaving(true);
    try {
      const res = await fetch("/api/admin/students", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editStudent.id, ...editForm }),
      });
      if (res.ok) {
        toast.success("Student updated");
        fetchStudents();
        setEditDialogOpen(false);
      } else {
        const data = await res.json();
        toast.error(data.error || "Update failed");
      }
    } catch {
      toast.error("Failed to update student");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (student: Student) => {
    if (!confirm(`Are you sure you want to delete ${student.student_name} (${student.register_number})?`)) return;
    try {
      const res = await fetch(`/api/admin/students?id=${student.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Student deleted");
        fetchStudents();
      } else {
        const data = await res.json();
        toast.error(data.error || "Delete failed");
      }
    } catch {
      toast.error("Failed to delete student");
    }
  };

  const handleExport = () => {
    exportStudentsToCSV(students);
    toast.success("CSV exported");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Students</h1>
          <p className="text-sm text-[#6B7280]">
            {total} students registered
          </p>
        </div>
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCSVUpload}
            />
            <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2 border border-[#E2E8F0] bg-background hover:bg-accent hover:text-accent-foreground transition-colors">
              <Upload className="w-4 h-4" />
              Import CSV
            </div>
          </label>
          <Button
            variant="outline"
            className="border-[#E2E8F0]"
            onClick={() => setPasteDialogOpen(true)}
          >
            <ClipboardPaste className="w-4 h-4 mr-1" />
            Paste Data
          </Button>
          <Button
            variant="outline"
            className="border-[#E2E8F0]"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <Input
                placeholder="Search by register no, name, department..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10 border-[#E2E8F0]"
              />
            </div>
            <Select
              value={filter}
              onValueChange={(val) => {
                setFilter(val || "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[160px] border-[#E2E8F0]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="voted">Voted</SelectItem>
                <SelectItem value="not_voted">Not Voted</SelectItem>
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
                  <TableHead className="font-semibold">Register No</TableHead>
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Department</TableHead>
                  <TableHead className="font-semibold">Year</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Voted At</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id} className="hover:bg-[#F8FAFC]">
                    <TableCell className="font-mono text-sm font-medium">
                      {student.register_number}
                    </TableCell>
                    <TableCell className="font-medium">
                      {student.student_name}
                    </TableCell>
                    <TableCell className="text-sm font-mono text-[#4A90E2]">
                      {student.email}
                    </TableCell>
                    <TableCell className="text-[#6B7280]">
                      {student.department}
                    </TableCell>
                    <TableCell>{student.year}</TableCell>
                    <TableCell>
                      {student.is_voted ? (
                        <Badge className="bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20 border">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Voted
                        </Badge>
                      ) : (
                        <Badge className="bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20 border">
                          <XCircle className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-[#6B7280]">
                      {student.voted_at
                        ? new Date(student.voted_at).toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(student)}
                          className="h-8 w-8 text-[#6B7280] hover:text-[#4A90E2]"
                          title="Edit student"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(student)}
                          className="h-8 w-8 text-[#6B7280] hover:text-red-500"
                          title="Delete student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {students.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-[#6B7280]">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No students found
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

      {/* Paste Data Dialog */}
      <Dialog open={pasteDialogOpen} onOpenChange={setPasteDialogOpen}>
        <DialogContent className="max-w-2xl border-0 shadow-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-lg">Paste Student Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-1">
            <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/50 border border-[#E2E8F0] dark:border-slate-700">
              <p className="text-sm text-[#6B7280] dark:text-slate-400 leading-relaxed">
                Paste tab-separated or comma-separated data from Excel, Google Sheets, or any spreadsheet.
              </p>
              <p className="text-sm text-[#6B7280] dark:text-slate-400 mt-2">
                First row must be headers:
              </p>
              <code className="block mt-1.5 bg-[#E2E8F0] dark:bg-slate-700 px-2.5 py-1.5 rounded text-xs font-mono text-[#1A1A1A] dark:text-slate-200 break-all">
                register_number, student_name, department, year, dob, email
              </code>
            </div>
            <Textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={`register_number,student_name,department,year,dob,email\n7376224CS001,JOHN DOE,COMPUTER SCIENCE,3,2004-05-15,john@gmail.com`}
              className="border-[#E2E8F0] dark:border-slate-700 min-h-[220px] font-mono text-xs resize-y"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPasteDialogOpen(false); setPasteText(""); }}>
              Cancel
            </Button>
            <Button
              onClick={handlePasteImport}
              disabled={pasteImporting || !pasteText.trim()}
              className="bg-[#4A90E2] hover:bg-[#357ABD] text-white"
            >
              {pasteImporting && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg">Edit Student</DialogTitle>
          </DialogHeader>
          {editStudent && (
            <div className="space-y-4">
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/50 border border-[#E2E8F0] dark:border-slate-700">
                <p className="text-xs text-[#6B7280]">Register Number</p>
                <p className="font-mono font-medium text-sm">{editStudent.register_number}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Name *</Label>
                <Input
                  value={editForm.student_name}
                  onChange={(e) => setEditForm({ ...editForm, student_name: e.target.value })}
                  className="border-[#E2E8F0]"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Email *</Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="border-[#E2E8F0]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="font-medium">Department</Label>
                  <Input
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="border-[#E2E8F0]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-medium">Year</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={editForm.year}
                    onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                    className="border-[#E2E8F0]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="font-medium">Date of Birth</Label>
                  <Input
                    type="date"
                    value={editForm.dob}
                    onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                    className="border-[#E2E8F0]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-medium">Mobile</Label>
                  <Input
                    value={editForm.mobile_number}
                    onChange={(e) => setEditForm({ ...editForm, mobile_number: e.target.value })}
                    placeholder="Optional"
                    className="border-[#E2E8F0]"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={editSaving}
              className="bg-[#4A90E2] hover:bg-[#357ABD] text-white"
            >
              {editSaving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
