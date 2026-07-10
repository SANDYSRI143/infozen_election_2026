// ============================================================
// Hook: useRealtime — Subscribe to Supabase Realtime changes
// ============================================================
"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type TableName = "votes" | "students" | "election_settings" | "candidates";

export function useRealtime(
  table: TableName,
  callback: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
) {
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, callback]);
}
