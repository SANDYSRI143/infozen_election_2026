// ============================================================
// API: Upload Candidate Photo to Supabase Storage
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 2MB" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `candidate_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Convert File to ArrayBuffer then to Buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("candidate-photos")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload image. Make sure the 'candidate-photos' storage bucket exists in Supabase." },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from("candidate-photos")
      .getPublicUrl(fileName);

    return NextResponse.json({
      url: publicData.publicUrl,
      fileName,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
