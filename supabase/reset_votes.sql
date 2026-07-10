-- ============================================================
-- FUNCTION: Admin Reset Votes
-- Bypasses the no_vote_delete trigger by disabling it temporarily
-- Only callable via service role (SECURITY DEFINER)
-- ============================================================

CREATE OR REPLACE FUNCTION admin_reset_votes()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Disable the delete prevention trigger
  ALTER TABLE votes DISABLE TRIGGER no_vote_delete;

  -- Delete all votes
  DELETE FROM votes;

  -- Re-enable the trigger
  ALTER TABLE votes ENABLE TRIGGER no_vote_delete;

  -- Reset all students' voted status
  UPDATE students SET is_voted = FALSE, voted_at = NULL;

  RETURN TRUE;
END;
$$;

-- ============================================================
-- FUNCTION: Admin Fresh Election  
-- Full reset: votes + students + OTPs + election settings
-- ============================================================

CREATE OR REPLACE FUNCTION admin_fresh_election()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Disable the delete prevention trigger
  ALTER TABLE votes DISABLE TRIGGER no_vote_delete;

  -- Delete all votes
  DELETE FROM votes;

  -- Re-enable the trigger
  ALTER TABLE votes ENABLE TRIGGER no_vote_delete;

  -- Reset all students' voted status
  UPDATE students SET is_voted = FALSE, voted_at = NULL;

  -- Delete all OTP verifications
  DELETE FROM otp_verifications;

  -- Reset election settings to clean slate
  UPDATE election_settings
  SET election_title = '',
      start_time = NULL,
      end_time = NULL,
      status = 'NOT_STARTED'
  WHERE id = (SELECT id FROM election_settings ORDER BY created_at DESC LIMIT 1);

  RETURN TRUE;
END;
$$;
