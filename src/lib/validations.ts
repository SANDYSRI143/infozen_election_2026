// ============================================================
// Zod Validation Schemas
// ============================================================
import { z } from "zod";

export const loginSchema = z.object({
  register_number: z
    .string()
    .min(1, "Register number is required")
    .max(20, "Register number too long")
    .regex(/^[A-Za-z0-9]+$/, "Invalid register number format"),
  dob: z
    .string()
    .min(1, "Date of birth is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
});

export const otpSchema = z.object({
  register_number: z
    .string()
    .min(1, "Register number is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must be numeric"),
});

export const voteSubmitSchema = z.object({
  votes: z
    .array(
      z.object({
        position: z.enum([
          "PRESIDENT",
          "VICE_PRESIDENT",
          "SECRETARY",
          "JOINT_SECRETARY",
          "TREASURER",
          "JOINT_TREASURER",
        ]),
        candidate_id: z.string().uuid("Invalid candidate ID"),
      })
    )
    .length(6, "Must vote for exactly 6 positions"),
});

export const candidateSchema = z.object({
  candidate_name: z.string().min(1, "Name is required").max(100),
  position: z.enum([
    "PRESIDENT",
    "VICE_PRESIDENT",
    "SECRETARY",
    "JOINT_SECRETARY",
    "TREASURER",
    "JOINT_TREASURER",
  ]),
  department: z.string().min(1, "Department is required").max(100),
  bio: z.string().max(500).optional().or(z.literal("")),
  vision_statement: z.string().max(300).optional().or(z.literal("")),
  achievements: z.string().max(500).optional().or(z.literal("")),
  campaign_quote: z.string().max(200).optional().or(z.literal("")),
  photo_url: z.string().url().optional().or(z.literal("")),
  photo_fit: z.enum(["cover", "contain", "fill"]).optional(),
  symbol_url: z.string().url().optional().or(z.literal("")),
});

export const electionSettingsSchema = z.object({
  election_title: z.string().min(1, "Title is required").max(200),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().optional().or(z.literal("")),
});

export const adminLoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const addAdminSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "SUPER_ADMIN"]),
});

// Student bulk import schema
export const studentImportSchema = z.object({
  register_number: z
    .string()
    .min(1, "Register number is required")
    .max(20, "Register number too long")
    .regex(/^[A-Za-z0-9]+$/, "Invalid register number format"),
  student_name: z.string().min(1, "Name is required").max(100),
  department: z.string().min(1, "Department is required").max(100),
  year: z
    .number()
    .int("Year must be a whole number")
    .min(1, "Year must be 1-5")
    .max(5, "Year must be 1-5"),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .refine((date) => new Date(date) < new Date(), "Date of birth must be in the past"),
  mobile_number: z
    .string()
    .max(15, "Invalid mobile number")
    .regex(/^[0-9]{10,15}$/, "Mobile number must contain only digits")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .email("Invalid email address")
    .min(1, "Email is required"),
});

export const studentsBulkImportSchema = z.object({
  students: z.array(studentImportSchema).min(1, "At least one student required"),
});
