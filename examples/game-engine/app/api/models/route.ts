import { NextResponse } from "next/server";
import { listAssets } from "@/lib/minio";

export async function GET() {
  try {
    const blobs = await listAssets("game-engine/models/");
    const models = blobs.map((blob) => ({
      name: blob.pathname.split("/").pop() || "Unknown",
      url: blob.url,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
    }));
    return NextResponse.json({ models });
  } catch (error) {
    console.error("Failed to list models:", error);
    return NextResponse.json(
      { error: "Failed to list models" },
      { status: 500 },
    );
  }
}
