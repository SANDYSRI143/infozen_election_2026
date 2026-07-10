"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Pencil, Trash2, UserCheck, Loader2, RotateCcw, Upload, ImageIcon, X } from "lucide-react";
import { POSITIONS } from "@/types";
import type { Candidate, Position } from "@/types";
import { parsePhotoUrl, buildPhotoUrl, getPhotoAdjustStyle } from "@/lib/image-adjust";

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCandidate, setEditCandidate] = useState<Candidate | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    candidate_name: "",
    position: "" as Position | "",
    department: "",
    bio: "",
    photo_url: "",
    zoom: 1,
    x: 0,
    y: 0,
  });

  const fetchCandidates = async () => {
    try {
      const res = await fetch("/api/admin/candidates");
      if (res.ok) {
        const data = await res.json();
        setCandidates(data.candidates || []);
      }
    } catch {
      toast.error("Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const openAddDialog = () => {
    setEditCandidate(null);
    setForm({ 
      candidate_name: "", 
      position: "", 
      department: "", 
      bio: "", 
      photo_url: "", 
      zoom: 1, 
      x: 0, 
      y: 0 
    });
    setDialogOpen(true);
  };

  const openEditDialog = (candidate: Candidate) => {
    setEditCandidate(candidate);
    const { url, adjustments } = parsePhotoUrl(candidate.photo_url);
    setForm({
      candidate_name: candidate.candidate_name,
      position: candidate.position,
      department: candidate.department,
      bio: candidate.bio || "",
      photo_url: url,
      zoom: adjustments.zoom,
      x: adjustments.x,
      y: adjustments.y,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.candidate_name || !form.position || !form.department) {
      toast.error("Please fill in all required fields");
      return;
    }

    const photoUrlToSave = buildPhotoUrl(form.photo_url, {
      zoom: form.zoom,
      x: form.x,
      y: form.y,
    });

    const payload = {
      candidate_name: form.candidate_name,
      position: form.position,
      department: form.department,
      bio: form.bio,
      photo_url: photoUrlToSave,
    };

    setSaving(true);
    try {
      if (editCandidate) {
        // Update
        const res = await fetch("/api/admin/candidates", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editCandidate.id, ...payload }),
        });
        if (res.ok) {
          toast.success("Candidate updated");
          fetchCandidates();
          setDialogOpen(false);
        } else {
          const data = await res.json();
          toast.error(data.error || "Update failed");
        }
      } else {
        // Create
        const res = await fetch("/api/admin/candidates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          toast.success("Candidate added");
          fetchCandidates();
          setDialogOpen(false);
        } else {
          const data = await res.json();
          toast.error(data.error || "Failed to add candidate");
        }
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate on client side too
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Use JPG, PNG, WebP, or GIF.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 2MB.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/candidates/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setForm((prev) => ({ ...prev, photo_url: data.url, zoom: 1, x: 0, y: 0 }));
        toast.success("Photo uploaded successfully!");
      } else {
        const data = await res.json();
        toast.error(data.error || "Upload failed");
      }
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
      // Reset the input so re-selecting the same file triggers onChange
      e.target.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this candidate?")) return;
    try {
      const res = await fetch(`/api/admin/candidates?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Candidate deactivated");
        fetchCandidates();
      }
    } catch {
      toast.error("Failed to deactivate candidate");
    }
  };

  const handleReactivate = async (id: string) => {
    if (!confirm("Are you sure you want to reactivate this candidate?")) return;
    try {
      const res = await fetch("/api/admin/candidates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "active" }),
      });
      if (res.ok) {
        toast.success("Candidate reactivated");
        fetchCandidates();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to reactivate");
      }
    } catch {
      toast.error("Failed to reactivate candidate");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Candidates</h1>
          <p className="text-sm text-[#6B7280]">Manage election candidates</p>
        </div>
        <Button
          onClick={openAddDialog}
          className="bg-[#4A90E2] hover:bg-[#357ABD] text-white"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Candidate
        </Button>
      </div>

      {/* Group by position */}
      {POSITIONS.map((pos) => {
        const posCandidates = candidates.filter(
          (c) => c.position === pos.value
        );
        if (posCandidates.length === 0 && !loading) return null;

        return (
          <Card key={pos.value} className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#4A90E2]" />
                {pos.label}
                <Badge variant="secondary" className="ml-auto">
                  {posCandidates.filter((c) => c.status === "active").length} active
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {posCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                      candidate.status === "inactive"
                        ? "bg-gray-50 border-gray-200 opacity-60"
                        : "bg-[#F8FAFC] border-[#E2E8F0]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {(() => {
                        const parsed = parsePhotoUrl(candidate.photo_url);
                        return (
                          <Avatar className="w-10 h-10 rounded-lg overflow-hidden">
                            <AvatarImage 
                              src={parsed.url || undefined} 
                              style={getPhotoAdjustStyle(parsed.adjustments)}
                            />
                            <AvatarFallback className="rounded-lg bg-[#DCEEFF] text-[#4A90E2] text-sm">
                              {candidate.candidate_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                        );
                      })()}
                      <div>
                        <p className="font-medium text-[#1A1A1A]">
                          {candidate.candidate_name}
                        </p>
                        <p className="text-xs text-[#6B7280]">
                          {candidate.department}
                        </p>
                      </div>
                      {candidate.status === "inactive" && (
                        <Badge variant="destructive" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(candidate)}
                        className="h-8 w-8 text-[#6B7280] hover:text-[#4A90E2]"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {candidate.status === "active" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(candidate.id)}
                          className="h-8 w-8 text-[#6B7280] hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                      {candidate.status === "inactive" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleReactivate(candidate.id)}
                          className="h-8 w-8 text-[#6B7280] hover:text-[#16A34A]"
                          title="Reactivate candidate"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle>
              {editCandidate ? "Edit Candidate" : "Add Candidate"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-medium">Name *</Label>
              <Input
                value={form.candidate_name}
                onChange={(e) =>
                  setForm({ ...form, candidate_name: e.target.value })
                }
                placeholder="Enter candidate name"
                className="border-[#E2E8F0]"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-medium">Position *</Label>
              <Select
                value={form.position}
                onValueChange={(val) =>
                  setForm({ ...form, position: val as Position })
                }
              >
                <SelectTrigger className="border-[#E2E8F0]">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-medium">Department *</Label>
              <Input
                value={form.department}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value })
                }
                placeholder="e.g. Computer Science"
                className="border-[#E2E8F0]"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-medium">Bio</Label>
              <Textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Brief bio (optional)"
                className="border-[#E2E8F0] resize-none"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-medium">Candidate Photo</Label>
              
              {/* Image Preview & Manual Adjustment Controls */}
              {form.photo_url && (
                <div className="space-y-4 p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                  <div className="flex gap-4 items-center">
                    <div 
                      className="relative w-28 h-28 rounded-xl overflow-hidden border-2 border-[#E2E8F0] bg-white cursor-move select-none group"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        const tracker = e.currentTarget;
                        tracker.setPointerCapture(e.pointerId);
                        
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const startOffsetX = form.x;
                        const startOffsetY = form.y;
                        
                        const handlePointerMove = (moveEvent: PointerEvent) => {
                          const deltaX = moveEvent.clientX - startX;
                          const deltaY = moveEvent.clientY - startY;
                          const rect = tracker.getBoundingClientRect();
                          const speedFactor = 1 / form.zoom;
                          const newX = startOffsetX + (deltaX / rect.width) * 100 * speedFactor;
                          const newY = startOffsetY + (deltaY / rect.height) * 100 * speedFactor;
                          
                          setForm(prev => ({
                            ...prev,
                            x: Math.max(-100, Math.min(100, newX)),
                            y: Math.max(-100, Math.min(100, newY))
                          }));
                        };
                        
                        const handlePointerUp = () => {
                          tracker.removeEventListener("pointermove", handlePointerMove);
                          tracker.removeEventListener("pointerup", handlePointerUp);
                        };
                        
                        tracker.addEventListener("pointermove", handlePointerMove);
                        tracker.addEventListener("pointerup", handlePointerUp);
                      }}
                    >
                      <img
                        src={form.photo_url}
                        alt="Preview"
                        className="w-full h-full object-cover select-none pointer-events-none"
                        style={{ 
                          transform: `scale(${form.zoom}) translate(${form.x}%, ${form.y}%)`,
                          transformOrigin: "center center",
                          transition: "none"
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      {/* Guide overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                        <span className="text-white text-[10px] font-medium px-2 py-1 bg-black/60 rounded-md">
                          Drag to reposition
                        </span>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, photo_url: "", zoom: 1, x: 0, y: 0 })}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors pointer-events-auto"
                        title="Remove photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Quick Info */}
                    <div className="flex-1 space-y-1 text-xs text-[#6B7280]">
                      <p className="font-semibold text-[#1A1A1A]">Image Adjustment</p>
                      <p>• Drag the photo inside the frame to adjust positioning.</p>
                      <p>• Use the sliders below to fine-tune zoom & alignment.</p>
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => setForm(prev => ({ ...prev, zoom: 1, x: 0, y: 0 }))}
                        className="h-auto p-0 text-[#4A90E2] font-semibold flex items-center gap-1 animate-none"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset adjustments
                      </Button>
                    </div>
                  </div>

                  {/* Manual Adjustment Sliders */}
                  <div className="space-y-3 pt-2 border-t border-[#E2E8F0] text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between font-medium">
                        <span>Zoom ({form.zoom.toFixed(2)}x)</span>
                        <span className="text-slate-400">1.00x - 3.00x</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.05"
                        value={form.zoom}
                        onChange={(e) => setForm(prev => ({ ...prev, zoom: parseFloat(e.target.value) }))}
                        className="w-full h-1.5 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#4A90E2]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="flex justify-between font-medium">
                          <span>Horizontal ({Math.round(form.x)}%)</span>
                        </div>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          step="1"
                          value={form.x}
                          onChange={(e) => setForm(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                          className="w-full h-1.5 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#4A90E2]"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between font-medium">
                          <span>Vertical ({Math.round(form.y)}%)</span>
                        </div>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          step="1"
                          value={form.y}
                          onChange={(e) => setForm(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                          className="w-full h-1.5 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#4A90E2]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <div className="flex gap-2">
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-[#E2E8F0] hover:border-[#4A90E2] hover:bg-[#F0F7FF] cursor-pointer transition-all text-sm text-[#6B7280] hover:text-[#4A90E2]">
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload Photo (max 2MB)
                      </>
                    )}
                  </div>
                </label>
              </div>

              {/* Or enter URL manually */}
              <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                <div className="flex-1 border-t border-[#E2E8F0]" />
                <span>or enter URL</span>
                <div className="flex-1 border-t border-[#E2E8F0]" />
              </div>
              <Input
                value={form.photo_url}
                onChange={(e) => {
                  const { url, adjustments } = parsePhotoUrl(e.target.value);
                  setForm(prev => ({
                    ...prev,
                    photo_url: url,
                    zoom: adjustments.zoom,
                    x: adjustments.x,
                    y: adjustments.y
                  }));
                }}
                placeholder="https://... (paste image URL)"
                className="border-[#E2E8F0] text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#4A90E2] hover:bg-[#357ABD] text-white"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              {editCandidate ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
