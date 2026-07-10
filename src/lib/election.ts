// ============================================================
// Election Status Helper
// ============================================================
import { createAdminClient } from "@/lib/supabase/admin";
import type { ElectionSettings, ElectionStatus } from "@/types";

export async function getElectionSettings(): Promise<ElectionSettings | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("election_settings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as ElectionSettings;
}

export async function isElectionActive(): Promise<boolean> {
  const settings = await getElectionSettings();
  if (!settings) return false;

  if (settings.status !== "ACTIVE") return false;

  const now = new Date();
  const start = settings.start_time ? new Date(settings.start_time) : null;
  const end = settings.end_time ? new Date(settings.end_time) : null;

  if (start && now < start) return false;
  if (end && now > end) return false;

  return true;
}

export async function getElectionStatusInfo(): Promise<{
  status: ElectionStatus;
  settings: ElectionSettings | null;
  isWithinWindow: boolean;
}> {
  const settings = await getElectionSettings();

  if (!settings) {
    return { status: "NOT_STARTED", settings: null, isWithinWindow: false };
  }

  const now = new Date();
  const start = settings.start_time ? new Date(settings.start_time) : null;
  const end = settings.end_time ? new Date(settings.end_time) : null;

  // Auto-close if past end time
  if (settings.status === "ACTIVE" && end && now > end) {
    const supabase = createAdminClient();
    await supabase
      .from("election_settings")
      .update({ status: "ENDED" })
      .eq("id", settings.id);
    return {
      status: "ENDED",
      settings: { ...settings, status: "ENDED" },
      isWithinWindow: false,
    };
  }

  const isWithinWindow =
    settings.status === "ACTIVE" &&
    (!start || now >= start) &&
    (!end || now <= end);

  return {
    status: settings.status,
    settings,
    isWithinWindow,
  };
}
