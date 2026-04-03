import { NextRequest, NextResponse } from "next/server";
import { getTeas } from "@/lib/queries";
import type { FilterState, TeaType, CaffeineLevel, ExperienceTag } from "@/lib/types";

export const revalidate = 3600;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters: Partial<FilterState> = {};

    const type = searchParams.get("type");
    if (type) filters.type = type as TeaType;

    const caffeine = searchParams.get("caffeine");
    if (caffeine) filters.caffeine = caffeine as CaffeineLevel;

    const experience = searchParams.get("experience");
    if (experience) filters.experience = experience as ExperienceTag;

    const brand = searchParams.get("brand");
    if (brand) filters.brand = brand;

    const region = searchParams.get("region");
    if (region) filters.region = region;

    const teas = await getTeas(filters);
    return NextResponse.json(teas);
  } catch (error) {
    console.error("GET /api/teas error:", error);
    return NextResponse.json(
      { error: "Failed to fetch teas" },
      { status: 500 }
    );
  }
}
