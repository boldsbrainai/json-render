import { NextResponse } from "next/server";
import { listAssets } from "@/lib/minio";

export async function GET() {
  try {
    const blobs = await listAssets("game-engine/environments/");
    const environments = blobs.map((blob) => ({
      name: blob.pathname.split("/").pop() || "Unknown",
      url: blob.url,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
    }));
    return NextResponse.json({ environments });
  } catch (error) {
    console.error("Failed to list environments:", error);
    return NextResponse.json(
      { error: "Failed to list environments" },
      { status: 500 },
    );
  }
}
