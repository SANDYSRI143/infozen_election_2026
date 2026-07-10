"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Play,
  Pause,
  Square,
  RotateCcw,
  Save,
  Loader2,
  UserPlus,
  Trash2,
  ShieldCheck,
  Shield,
  AlertTriangle,
  Eraser,
  Sparkles,
} from "lucide-react";
import type { ElectionSettings, Admin, AdminRole } from "@/types";

export default function SettingsPage() {
  const [election, setElection] = useState<ElectionSettings | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<AdminRole | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Add admin form
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    password: "",
    role: "ADMIN" as AdminRole,
  });

  // Confirmation input for dangerous actions
  const [resetInput, setResetInput] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [electionRes, adminsRes] = await Promise.all([
          fetch("/api/admin/election"),
          fetch("/api/admin/manage"),
        ]);

        if (electionRes.ok) {
          const data = await electionRes.json();
          setElection(data.election);
          setTitle(data.election?.election_title || "");
          setStartTime(
            data.election?.start_time
              ? new Date(data.election.start_time).toISOString().slice(0, 16)
              : ""
          );
          setEndTime(
            data.election?.end_time
              ? new Date(data.election.end_time).toISOString().slice(0, 16)
              : ""
          );
        }

        if (adminsRes.ok) {
          const data = await adminsRes.json();
          setAdmins(data.admins || []);
        }

        // Detect current role from cookie (simplified)
        // In production, get this from the session
        setCurrentRole("SUPER_ADMIN");
      } catch {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/election", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          election_title: title,
          start_time: startTime ? new Date(startTime).toISOString() : "",
          end_time: endTime ? new Date(endTime).toISOString() : "",
        }),
      });
      if (res.ok) {
        toast.success("Settings saved");
      } else {
        const data = await res.json();
        if (data.details) {
          const firstError = Object.entries(data.details)[0];
          toast.error(`${firstError[0]}: ${firstError[1]}`);
        } else {
          toast.error(data.error || "Failed to save");
        }
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleElectionAction = async (action: "start" | "end" | "pause" | "resume") => {
    let confirmMsg = "";
    if (action === "start") confirmMsg = "Are you sure you want to START the election?";
    if (action === "pause") confirmMsg = "Are you sure you want to PAUSE the election? Students will not be able to vote.";
    if (action === "resume") confirmMsg = "Are you sure you want to RESUME the election?";
    if (action === "end") confirmMsg = "Are you sure you want to END the election? This cannot be undone.";

    if (confirmMsg && !confirm(confirmMsg)) return;

    setActionLoading(action);
    try {
      const res = await fetch("/api/admin/election", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const data = await res.json();
        let successMsg = "";
        if (action === "start") successMsg = "Election started!";
        if (action === "pause") successMsg = "Election paused!";
        if (action === "resume") successMsg = "Election resumed!";
        if (action === "end") successMsg = "Election ended!";
        
        toast.success(successMsg);
        setElection((prev) =>
          prev ? { ...prev, status: data.status } : null
        );
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActionLoading("");
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      toast.error("Fill in all fields");
      return;
    }
    try {
      const res = await fetch("/api/admin/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAdmin),
      });
      if (res.ok) {
        toast.success("Admin added");
        setAddAdminOpen(false);
        setNewAdmin({ name: "", email: "", password: "", role: "ADMIN" });
        // Refresh
        const adminsRes = await fetch("/api/admin/manage");
        if (adminsRes.ok) {
          const data = await adminsRes.json();
          setAdmins(data.admins || []);
        }
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to add admin");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleRemoveAdmin = async (id: string) => {
    if (!confirm("Remove this admin?")) return;
    try {
      const res = await fetch(`/api/admin/manage?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Admin removed");
        setAdmins(admins.filter((a) => a.id !== id));
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleResetVotes = async () => {
    setActionLoading("reset_votes");
    try {
      const res = await fetch("/api/admin/election", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_votes" }),
      });
      if (res.ok) {
        toast.success("All votes have been reset successfully!");
        setResetInput("");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to reset votes");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActionLoading("");
    }
  };

  const handleFreshElection = async () => {
    setActionLoading("fresh_election");
    try {
      const res = await fetch("/api/admin/election", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fresh_election" }),
      });
      if (res.ok) {
        toast.success("Election has been completely reset!");
        setResetInput("");
        // Reset local state
        setElection((prev) =>
          prev ? { ...prev, status: "NOT_STARTED", election_title: "", start_time: null, end_time: null } : null
        );
        setTitle("");
        setStartTime("");
        setEndTime("");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to reset election");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActionLoading("");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#6B7280]">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A] flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#4A90E2]" />
          Settings
        </h1>
        <p className="text-sm text-[#6B7280]">
          Configure election and manage administrators
        </p>
      </div>

      {/* Election Settings */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Election Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="font-medium">Election Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-[#E2E8F0]"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-medium">Start Time</Label>
              <Input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="border-[#E2E8F0]"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-medium">End Time</Label>
              <Input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="border-[#E2E8F0]"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSaveSettings}
              disabled={saving}
              className="bg-[#4A90E2] hover:bg-[#357ABD] text-white"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              Save Settings
            </Button>
          </div>

          <Separator />

          {/* Election Control */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[#1A1A1A]">Election Control</p>
              <p className="text-sm text-[#6B7280]">
                Current status:{" "}
                <Badge
                  className={`ml-1 ${
                    election?.status === "ACTIVE"
                      ? "bg-[#16A34A]/10 text-[#16A34A]"
                      : election?.status === "PAUSED"
                      ? "bg-amber-50 text-amber-600"
                      : election?.status === "ENDED"
                      ? "bg-red-50 text-red-600"
                      : "bg-[#F59E0B]/10 text-[#F59E0B]"
                  }`}
                >
                  {election?.status || "NOT_STARTED"}
                </Badge>
              </p>
            </div>
            <div className="flex gap-2">
              {/* Start/Restart Button - Always available if not active or paused */}
              {election?.status !== "ACTIVE" && election?.status !== "PAUSED" && (
                <Button
                  onClick={() => handleElectionAction("start")}
                  disabled={!!actionLoading}
                  className="bg-[#16A34A] hover:bg-[#15803D] text-white"
                >
                  {actionLoading === "start" ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    election?.status === "ENDED" ? <RotateCcw className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />
                  )}
                  {election?.status === "ENDED" ? "Restart Election" : "Start Election"}
                </Button>
              )}

              {/* Pause Button - Only if active */}
              {election?.status === "ACTIVE" && (
                <Button
                  onClick={() => handleElectionAction("pause")}
                  disabled={!!actionLoading}
                  variant="outline"
                  className="border-amber-200 text-amber-600 hover:bg-amber-50"
                >
                  {actionLoading === "pause" ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <Pause className="w-4 h-4 mr-1" />
                  )}
                  Pause
                </Button>
              )}

              {/* Resume Button - Only if paused */}
              {election?.status === "PAUSED" && (
                <Button
                  onClick={() => handleElectionAction("resume")}
                  disabled={!!actionLoading}
                  className="bg-[#4A90E2] hover:bg-[#357ABD] text-white"
                >
                  {actionLoading === "resume" ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <Play className="w-4 h-4 mr-1" />
                  )}
                  Resume
                </Button>
              )}

              {/* End Button - If active or paused */}
              {(election?.status === "ACTIVE" || election?.status === "PAUSED") && (
                <Button
                  onClick={() => handleElectionAction("end")}
                  disabled={!!actionLoading}
                  variant="destructive"
                >
                  {actionLoading === "end" ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <Square className="w-4 h-4 mr-1" />
                  )}
                  End Election
                </Button>
              )}

              {election?.status === "ENDED" && (
                <Badge variant="secondary" className="text-sm py-1.5 px-4 bg-gray-100 text-gray-500 border-0">
                  Election has ended
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-0 shadow-sm border-l-4" style={{ borderLeftColor: '#EF4444' }}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-xl bg-red-50/30 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="font-semibold text-[#1A1A1A] dark:text-slate-200 text-sm">Action 1: Reset All Votes</p>
                <p className="text-xs text-[#6B7280] dark:text-slate-400">
                  Clears all cast votes and resets every student&apos;s voted status. Election settings (title, candidates, dates) remain unchanged.
                </p>
                <p className="text-xs font-mono font-medium text-red-600 dark:text-red-400">
                  Required phrase: RESET VOTES
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-[#1A1A1A] dark:text-slate-200 text-sm">Action 2: Start Fresh Election</p>
                <p className="text-xs text-[#6B7280] dark:text-slate-400">
                  Wipes everything. Clears all votes, resets student voted status, deletes all OTP sessions, and resets election settings.
                </p>
                <p className="text-xs font-mono font-medium text-red-600 dark:text-red-400">
                  Required phrase: FRESH ELECTION
                </p>
              </div>
            </div>

            <Separator className="bg-red-100 dark:bg-red-900/30" />

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
                <div className="flex-1 w-full space-y-1.5">
                  <Label className="text-xs font-semibold text-[#6B7280] dark:text-slate-300">
                    Type confirmation phrase below:
                  </Label>
                  <Input
                    value={resetInput}
                    onChange={(e) => setResetInput(e.target.value)}
                    placeholder="Type RESET VOTES or FRESH ELECTION"
                    className="border-red-200 dark:border-red-900 focus:border-red-400 focus:ring-red-400/20"
                  />
                </div>
                <div className="shrink-0 w-full sm:w-auto">
                  {resetInput === "RESET VOTES" ? (
                    <Button
                      onClick={handleResetVotes}
                      disabled={!!actionLoading}
                      variant="destructive"
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-medium"
                    >
                      {actionLoading === "reset_votes" ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <Eraser className="w-4 h-4 mr-1" />
                      )}
                      Reset All Votes
                    </Button>
                  ) : resetInput === "FRESH ELECTION" ? (
                    <Button
                      onClick={handleFreshElection}
                      disabled={!!actionLoading}
                      variant="destructive"
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-medium animate-pulse"
                    >
                      {actionLoading === "fresh_election" ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-1" />
                      )}
                      Start Fresh Election
                    </Button>
                  ) : (
                    <Button
                      disabled
                      variant="outline"
                      className="w-full border-gray-200 dark:border-slate-800 text-gray-400 bg-gray-50 dark:bg-slate-900/50"
                    >
                      Enter Phrase to Confirm
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Management */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#4A90E2]" />
              Administrators
            </CardTitle>
            {currentRole === "SUPER_ADMIN" && (
              <Button
                size="sm"
                onClick={() => setAddAdminOpen(true)}
                className="bg-[#4A90E2] hover:bg-[#357ABD] text-white"
              >
                <UserPlus className="w-4 h-4 mr-1" />
                Add Admin
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      admin.role === "SUPER_ADMIN"
                        ? "bg-[#F59E0B]/10"
                        : "bg-[#4A90E2]/10"
                    }`}
                  >
                    <Shield
                      className={`w-4 h-4 ${
                        admin.role === "SUPER_ADMIN"
                          ? "text-[#F59E0B]"
                          : "text-[#4A90E2]"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-[#1A1A1A] text-sm">
                      {admin.name}
                    </p>
                    <p className="text-xs text-[#6B7280]">{admin.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={`text-xs ${
                      admin.role === "SUPER_ADMIN"
                        ? "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20 border"
                        : "bg-[#4A90E2]/10 text-[#4A90E2] border-[#4A90E2]/20 border"
                    }`}
                  >
                    {admin.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
                  </Badge>
                  {currentRole === "SUPER_ADMIN" &&
                    admin.role !== "SUPER_ADMIN" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveAdmin(admin.id)}
                        className="h-8 w-8 text-[#6B7280] hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                </div>
              </div>
            ))}
          </div>

          {currentRole !== "SUPER_ADMIN" && (
            <div className="mt-4 p-3 rounded-lg bg-[#F59E0B]/5 border border-[#F59E0B]/20">
              <p className="text-sm text-[#F59E0B] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Only Super Admin can manage administrators
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Admin Dialog */}
      <Dialog open={addAdminOpen} onOpenChange={setAddAdminOpen}>
        <DialogContent className="max-w-md border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle>Add Administrator</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newAdmin.name}
                onChange={(e) =>
                  setNewAdmin({ ...newAdmin, name: e.target.value })
                }
                className="border-[#E2E8F0]"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={newAdmin.email}
                onChange={(e) =>
                  setNewAdmin({ ...newAdmin, email: e.target.value })
                }
                className="border-[#E2E8F0]"
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={newAdmin.password}
                onChange={(e) =>
                  setNewAdmin({ ...newAdmin, password: e.target.value })
                }
                className="border-[#E2E8F0]"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={newAdmin.role}
                onValueChange={(val) =>
                  setNewAdmin({ ...newAdmin, role: val as AdminRole })
                }
              >
                <SelectTrigger className="border-[#E2E8F0]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddAdminOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddAdmin}
              className="bg-[#4A90E2] hover:bg-[#357ABD] text-white"
            >
              Add Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
   