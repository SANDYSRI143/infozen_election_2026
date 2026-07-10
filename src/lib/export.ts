// ============================================================
// Export Utilities — PDF, Excel, CSV
// ============================================================
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import type { PositionResult } from "@/types";

export function exportResultsToPDF(results: PositionResult[], title: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(20);
  doc.setTextColor(74, 144, 226); // #4A90E2
  doc.text(title, pageWidth / 2, 20, { align: "center" });

  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, 28, {
    align: "center",
  });

  let yPos = 40;

  results.forEach((posResult) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // Position header
    doc.setFontSize(14);
    doc.setTextColor(26, 26, 26);
    doc.text(posResult.label, 14, yPos);
    yPos += 8;

    // Candidates
    posResult.candidates.forEach((candidate) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      const isWinner =
        posResult.winner?.id === candidate.id;
      doc.setFontSize(11);
      doc.setTextColor(isWinner ? 22 : 107, isWinner ? 163 : 114, isWinner ? 74 : 128);
      doc.text(
        `${isWinner ? "★ " : "  "}${candidate.candidate_name} — ${candidate.department} — ${candidate.vote_count} votes`,
        20,
        yPos
      );
      yPos += 6;
    });

    yPos += 6;
  });

  doc.save(`${title.replace(/\s+/g, "_")}_Results.pdf`);
}

export function exportResultsToExcel(results: PositionResult[], title: string) {
  const rows: Record<string, string | number>[] = [];

  results.forEach((posResult) => {
    posResult.candidates.forEach((candidate) => {
      rows.push({
        Position: posResult.label,
        "Candidate Name": candidate.candidate_name,
        Department: candidate.department,
        "Vote Count": candidate.vote_count,
        Winner: posResult.winner?.id === candidate.id ? "YES" : "",
      });
    });
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Results");

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buf], { type: "application/octet-stream" });
  saveAs(blob, `${title.replace(/\s+/g, "_")}_Results.xlsx`);
}

export function exportResultsToCSV(results: PositionResult[], title: string) {
  const rows: Record<string, string | number>[] = [];

  results.forEach((posResult) => {
    posResult.candidates.forEach((candidate) => {
      rows.push({
        Position: posResult.label,
        "Candidate Name": candidate.candidate_name,
        Department: candidate.department,
        "Vote Count": candidate.vote_count,
        Winner: posResult.winner?.id === candidate.id ? "YES" : "",
      });
    });
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, `${title.replace(/\s+/g, "_")}_Results.csv`);
}

export function exportStudentsToCSV(
  students: { register_number: string; student_name: string; email: string; department: string; year: number; is_voted: boolean; voted_at: string | null }[]
) {
  const rows = students.map((s) => ({
    "Register Number": s.register_number,
    "Student Name": s.student_name,
    Email: s.email,
    Department: s.department,
    Year: s.year,
    "Has Voted": s.is_voted ? "YES" : "NO",
    "Voted At": s.voted_at || "",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, "Students_Report.csv");
}
