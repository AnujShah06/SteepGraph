import { NextRequest, NextResponse } from "next/server";
import { searchTeas } from "@/lib/queries";

export const revalidate = 0; // no cache on search

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    if (!q || q.trim().length === 0) {
      return NextResponse.json([]);
    }

    const results = await searchTeas(q.trim());
    return NextResponse.json(results);
  } catch (error) {
    console.error("GET /api/search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
