-- ============================================================
-- ANTIGRAVITY — Database Schema
-- College Association Election Voting System
-- ============================================================
-- Run this in your Supabase SQL Editor

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: students
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  register_number TEXT UNIQUE NOT NULL,
  student_name TEXT NOT NULL,
  department TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1 AND year <= 5),
  dob DATE NOT NULL,
  mobile_number TEXT UNIQUE NOT NULL,
  email TEXT,
  is_voted BOOLEAN DEFAULT FALSE,
  voted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_register ON students(register_number);
CREATE INDEX IF NOT EXISTS idx_students_mobile ON students(mobile_number);
CREATE INDEX IF NOT EXISTS idx_students_voted ON students(is_voted);

-- ============================================================
-- TABLE: admins
-- ============================================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE, -- FK to auth.users if using Supabase Auth
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMIN')),
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: candidates
-- ============================================================
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_name TEXT NOT NULL,
  position TEXT NOT NULL CHECK (position IN (
    'PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY',
    'JOINT_SECRETARY', 'TREASURER', 'JOINT_TREASURER'
  )),
  department TEXT NOT NULL,
  photo_url TEXT,
  symbol_url TEXT,
  bio TEXT,
  vision_statement TEXT,
  achievements TEXT,
  campaign_quote TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidates_position ON candidates(position);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);

-- ============================================================
-- TABLE: votes
-- ============================================================
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id),
  candidate_id UUID NOT NULL REFERENCES candidates(id),
  position TEXT NOT NULL CHECK (position IN (
    'PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY',
    'JOINT_SECRETARY', 'TREASURER', 'JOINT_TREASURER'
  )),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  device_info TEXT,
  UNIQUE(student_id, position)
);

CREATE INDEX IF NOT EXISTS idx_votes_student ON votes(student_id);
CREATE INDEX IF NOT EXISTS idx_votes_candidate ON votes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_votes_position ON votes(position);

-- ============================================================
-- TABLE: election_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS election_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_title TEXT NOT NULL DEFAULT 'College Association Election',
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'ACTIVE', 'PAUSED', 'ENDED')),
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_election_status ON election_settings(status);

-- ============================================================
-- TABLE: otp_verifications
-- ============================================================
CREATE TABLE IF NOT EXISTS otp_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mobile_number TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_mobile ON otp_verifications(mobile_number);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_verifications(expires_at);

-- ============================================================
-- TABLE: audit_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  details JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Students: Service role can do everything (our API uses service role)
DROP POLICY IF EXISTS "Service role full access to students" ON students;
CREATE POLICY "Service role full access to students"
  ON students FOR ALL
  USING (true)
  WITH CHECK (true);

-- Candidates: Public read, service role write
DROP POLICY IF EXISTS "Anyone can read active candidates" ON candidates;
CREATE POLICY "Anyone can read active candidates"
  ON candidates FOR SELECT
  USING (status = 'active');

DROP POLICY IF EXISTS "Service role full access to candidates" ON candidates;
CREATE POLICY "Service role full access to candidates"
  ON candidates FOR ALL
  USING (true)
  WITH CHECK (true);

-- Votes: Insert only, no update/delete for anyone except service role
DROP POLICY IF EXISTS "Service role full access to votes" ON votes;
CREATE POLICY "Service role full access to votes"
  ON votes FOR ALL
  USING (true)
  WITH CHECK (true);

-- Election settings: Public read
DROP POLICY IF EXISTS "Anyone can read election settings" ON election_settings;
CREATE POLICY "Anyone can read election settings"
  ON election_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role full access to election_settings" ON election_settings;
CREATE POLICY "Service role full access to election_settings"
  ON election_settings FOR ALL
  USING (true)
  WITH CHECK (true);

-- Admins: Service role only
DROP POLICY IF EXISTS "Service role full access to admins" ON admins;
CREATE POLICY "Service role full access to admins"
  ON admins FOR ALL
  USING (true)
  WITH CHECK (true);

-- OTP: Service role only
DROP POLICY IF EXISTS "Service role full access to otp" ON otp_verifications;
CREATE POLICY "Service role full access to otp"
  ON otp_verifications FOR ALL
  USING (true)
  WITH CHECK (true);

-- Audit logs: Service role only
DROP POLICY IF EXISTS "Service role full access to audit_logs" ON audit_logs;
CREATE POLICY "Service role full access to audit_logs"
  ON audit_logs FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function: Submit vote (atomic transaction)
CREATE OR REPLACE FUNCTION submit_vote(
  p_student_id UUID,
  p_votes JSONB,
  p_ip TEXT DEFAULT NULL,
  p_device TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_vote JSONB;
  v_student_voted BOOLEAN;
  v_election_active BOOLEAN;
BEGIN
  -- Check if student already voted
  SELECT is_voted INTO v_student_voted FROM students WHERE id = p_student_id;
  IF v_student_voted IS NULL THEN
    RAISE EXCEPTION 'Student not found';
  END IF;
  IF v_student_voted THEN
    RAISE EXCEPTION 'Student has already voted';
  END IF;

  -- Check if election is active
  SELECT (status = 'ACTIVE') INTO v_election_active
  FROM election_settings
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT v_election_active THEN
    RAISE EXCEPTION 'Election is not active';
  END IF;

  -- Insert all votes
  FOR v_vote IN SELECT * FROM jsonb_array_elements(p_votes)
  LOOP
    INSERT INTO votes (student_id, candidate_id, "position", ip_address, device_info)
    VALUES (
      p_student_id,
      (v_vote->>'candidate_id')::UUID,
      v_vote->>'position',
      p_ip,
      p_device
    );
  END LOOP;

  -- Mark student as voted
  UPDATE students
  SET is_voted = TRUE, voted_at = NOW()
  WHERE id = p_student_id;

  RETURN TRUE;
END;
$$;

-- Function: Get election results
CREATE OR REPLACE FUNCTION get_election_results()
RETURNS TABLE (
  "position" TEXT,
  candidate_id UUID,
  candidate_name TEXT,
  department TEXT,
  photo_url TEXT,
  vote_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c."position",
    c.id AS candidate_id,
    c.candidate_name,
    c.department,
    c.photo_url,
    COUNT(v.id) AS vote_count
  FROM candidates c
  LEFT JOIN votes v ON v.candidate_id = c.id
  WHERE c.status = 'active'
  GROUP BY c."position", c.id, c.candidate_name, c.department, c.photo_url
  ORDER BY c."position", vote_count DESC;
END;
$$;

-- Function: Get dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
  total_students BIGINT,
  total_voted BIGINT,
  remaining BIGINT,
  participation_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total BIGINT;
  v_voted BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_total FROM students;
  SELECT COUNT(*) INTO v_voted FROM students WHERE is_voted = TRUE;

  RETURN QUERY SELECT
    v_total,
    v_voted,
    v_total - v_voted,
    CASE WHEN v_total > 0 THEN ROUND((v_voted::NUMERIC / v_total) * 100, 2) ELSE 0 END;
END;
$$;

-- ============================================================
-- TRIGGERS: Prevent vote modification
-- ============================================================

CREATE OR REPLACE FUNCTION prevent_vote_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Votes cannot be updated';
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION prevent_vote_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Votes cannot be deleted';
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS no_vote_update ON votes;
CREATE TRIGGER no_vote_update
  BEFORE UPDATE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION prevent_vote_update();

DROP TRIGGER IF EXISTS no_vote_delete ON votes;
CREATE TRIGGER no_vote_delete
  BEFORE DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION prevent_vote_delete();

-- ============================================================
-- Enable Realtime
-- ============================================================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE votes;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE students;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE election_settings;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
