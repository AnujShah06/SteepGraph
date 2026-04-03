import { NextRequest, NextResponse } from "next/server";
import { getGraph } from "@/lib/queries";
import type { FilterState, TeaType } from "@/lib/types";

export const revalidate = 3600;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters: Partial<FilterState> = {};

    const type = searchParams.get("type");
    if (type) filters.type = type as TeaType;

    const brand = searchParams.get("brand");
    if (brand) filters.brand = brand;

    const graph = await getGraph(filters);
    return NextResponse.json(graph);
  } catch (error) {
    console.error("GET /api/graph error:", error);
    return NextResponse.json(
      { error: "Failed to fetch graph" },
      { status: 500 }
    );
  }
}
