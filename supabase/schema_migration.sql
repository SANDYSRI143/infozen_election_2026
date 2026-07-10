-- ============================================================
-- ANTIGRAVITY — Schema Migration: Email-Based Authentication
-- Run this in Supabase SQL Editor AFTER the original schema.sql
-- ============================================================

-- ============================================================
-- STEP 1: Make email UNIQUE NOT NULL on students table
-- ============================================================

-- First, drop the existing mobile_number constraints (keep column as optional)
ALTER TABLE students ALTER COLUMN mobile_number DROP NOT NULL;

-- Drop the unique constraint on mobile_number (keep column for backwards compat)
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_mobile_number_key;

-- Make email NOT NULL (ensure all rows have email before running this)
-- If rows have NULL emails, update them first:
-- UPDATE students SET email = register_number || '@placeholder.edu' WHERE email IS NULL;
ALTER TABLE students ALTER COLUMN email SET NOT NULL;

-- Add UNIQUE constraint on email
ALTER TABLE students ADD CONSTRAINT students_email_key UNIQUE (email);

-- Add index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);

-- ============================================================
-- STEP 2: Migrate otp_verifications table from mobile to email
-- ============================================================

-- Rename mobile_number column to email
ALTER TABLE otp_verifications RENAME COLUMN mobile_number TO email;

-- Update the index
DROP INDEX IF EXISTS idx_otp_mobile;
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_verifications(email);

-- ============================================================
-- STEP 3: Verify constraints
-- ============================================================

-- Verify the changes
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: email is now UNIQUE NOT NULL on students';
  RAISE NOTICE 'Migration complete: otp_verifications now uses email column';
END $$;

-- ============================================================
-- STEP 4: Add photo_fit column to candidates table
-- ============================================================

ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS photo_fit TEXT DEFAULT 'cover'
CHECK (photo_fit IN ('cover', 'contain', 'fill'));

COMMENT ON COLUMN candidates.photo_fit IS 'Controls how the candidate photo fits in the frame: cover (crop), contain (show full), fill (stretch)';
