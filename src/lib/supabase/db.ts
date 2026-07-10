// ============================================================
// Direct PostgreSQL Connection — For admin operations
// that require bypassing triggers (e.g. vote reset)
// ============================================================

import postgres from "postgres";

let sql: ReturnType<typeof postgres> | null = null;

function getSQL() {
  if (sql) return sql;

  const dbUrl =
    process.env.SUPABASE_DB_URL ||
    process.env.DATABASE_URL;

  // ============================
  // DEBUG LOGS (Temporary)
  // ============================
  console.log("========== DB DEBUG ==========");
  console.log(
    "SUPABASE_DB_URL exists:",
    !!process.env.SUPABASE_DB_URL
  );
  console.log(
    "DATABASE_URL exists:",
    !!process.env.DATABASE_URL
  );
  console.log("dbUrl exists:", !!dbUrl);

  if (dbUrl) {
    console.log(
      "Connection String Starts With:",
      dbUrl.substring(0, 20)
    );
  }

  console.log("==============================");

  if (!dbUrl) {
    console.error("❌ No database URL found.");
    return null;
  }

  sql = postgres(dbUrl, {
    max: 1,
    idle_timeout: 10,
    connect_timeout: 10,
  });

  return sql;
}

/**
 * Execute raw SQL via direct PostgreSQL connection.
 * Used for admin operations that need to bypass triggers.
 */
export async function executeSQL(
  query: string
): Promise<{ success: boolean; error?: string }> {
  const db = getSQL();

  if (!db) {
    return {
      success: false,
      error:
        "SUPABASE_DB_URL not configured. Add your Supabase database connection string to .env.local",
    };
  }

  try {
    await db.unsafe(query);
    return { success: true };
  } catch (err) {
    console.error("Postgres Error:", err);
    return {
      success: false,
      error: String(err),
    };
  }
}

/**
 * Reset all votes
 */
export async function resetAllVotes(): Promise<{
  success: boolean;
  error?: string;
}> {
  return executeSQL(`
    DO $$
    BEGIN

      BEGIN
        ALTER TABLE votes DISABLE TRIGGER no_vote_delete;
      EXCEPTION WHEN undefined_object THEN NULL;
      END;

      DELETE FROM votes;

      BEGIN
        ALTER TABLE votes ENABLE TRIGGER no_vote_delete;
      EXCEPTION WHEN undefined_object THEN NULL;
      END;

      UPDATE students
      SET is_voted = FALSE,
          voted_at = NULL;

    END;
    $$;
  `);
}

/**
 * Full election reset
 */
export async function freshElectionReset(): Promise<{
  success: boolean;
  error?: string;
}> {
  return executeSQL(`
    DO $$
    BEGIN

      BEGIN
        ALTER TABLE votes DISABLE TRIGGER no_vote_delete;
      EXCEPTION WHEN undefined_object THEN NULL;
      END;

      DELETE FROM votes;

      BEGIN
        ALTER TABLE votes ENABLE TRIGGER no_vote_delete;
      EXCEPTION WHEN undefined_object THEN NULL;
      END;

      UPDATE students
      SET is_voted = FALSE,
          voted_at = NULL;

      DELETE FROM otp_verifications;

      UPDATE election_settings
      SET election_title='',
          start_time=NULL,
          end_time=NULL,
          status='NOT_STARTED'
      WHERE id=(
        SELECT id
        FROM election_settings
        ORDER BY created_at DESC
        LIMIT 1
      );

    END;
    $$;
  `);
}