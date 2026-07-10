// ============================================================
// Hook: useElectionStatus — Poll election status
// ============================================================
"use client";

import { useState, useEffect, useCallback } from "react";
import type { ElectionSettings, ElectionStatus } from "@/types";

export function useElectionStatus(pollInterval = 30000) {
  const [status, setStatus] = useState<ElectionStatus>("NOT_STARTED");
  const [settings, setSettings] = useState<ElectionSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/election/status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data.status);
        setSettings(data.settings);
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, pollInterval);
    return () => clearInterval(interval);
  }, [fetchStatus, pollInterval]);

  return { status, settings, loading, refetch: fetchStatus };
}
