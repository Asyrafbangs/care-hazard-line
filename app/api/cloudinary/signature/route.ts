import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: "Cloudinary has been removed from this project. Use /api/storage/hazard-photo for Supabase Storage uploads."
    },
    { status: 410 }
  );
}
