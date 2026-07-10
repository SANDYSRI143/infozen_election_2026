// ============================================================
// Association Election — Type Definitions
// ============================================================

export type Position =
  | "PRESIDENT"
  | "VICE_PRESIDENT"
  | "SECRETARY"
  | "JOINT_SECRETARY"
  | "TREASURER"
  | "JOINT_TREASURER";

export const POSITIONS: { value: Position; label: string }[] = [
  { value: "PRESIDENT", label: "President" },
  { value: "VICE_PRESIDENT", label: "Vice President" },
  { value: "SECRETARY", label: "Secretary" },
  { value: "JOINT_SECRETARY", label: "Joint Secretary" },
  { value: "TREASURER", label: "Treasurer" },
  { value: "JOINT_TREASURER", label: "Joint Treasurer" },
];

export type ElectionStatus = "NOT_STARTED" | "ACTIVE" | "PAUSED" | "ENDED";

export type AdminRole = "SUPER_ADMIN" | "ADMIN";

export interface Student {
  id: string;
  register_number: string;
  student_name: string;
  department: string;
  year: number;
  dob: string;
  mobile_number?: string | null;
  email: string;
  is_voted: boolean;
  voted_at: string | null;
  created_at: string;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  created_by: string | null;
  created_at: string;
}

export interface Candidate {
  id: string;
  candidate_name: string;
  position: Position;
  department: string;
  photo_url: string | null;
  symbol_url: string | null;
  bio: string | null;
  vision_statement: string | null;
  achievements: string | null;
  campaign_quote: string | null;
  status: "active" | "inactive";
  created_at: string;
}

export interface Vote {
  id: string;
  student_id: string;
  candidate_id: string;
  position: Position;
  timestamp: string;
  ip_address: string | null;
  device_info: string | null;
}

export interface ElectionSettings {
  id: string;
  election_title: string;
  start_time: string | null;
  end_time: string | null;
  status: ElectionStatus;
  created_by: string | null;
  created_at: string;
}

export interface OtpVerification {
  id: string;
  email: string;
  otp: string;
  expires_at: string;
  verified: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  performed_by: string;
  details: Record<string, unknown> | null;
  timestamp: string;
  ip_address: string | null;
}

// API types
export interface VoteSelection {
  position: Position;
  candidate_id: string;
}

export interface LoginRequest {
  register_number: string;
  dob: string;
  email: string;
}

export interface DashboardStats {
  total_students: number;
  total_voted: number;
  remaining: number;
  participation_percentage: number;
}

export interface CandidateResult extends Candidate {
  vote_count: number;
}

export interface PositionResult {
  position: Position;
  label: string;
  candidates: CandidateResult[];
  winner: CandidateResult | null;
}

export interface SessionPayload {
  student_id: string;
  register_number: string;
  email: string;
  exp: number;
  iat: number;
}

export interface AdminSessionPayload {
  admin_id: string;
  email: string;
  role: AdminRole;
  exp: number;
  iat: number;
}
