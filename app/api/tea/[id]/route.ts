import { NextRequest, NextResponse } from "next/server";
import { getTeaById } from "@/lib/queries";

export const revalidate = 3600;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tea = await getTeaById(params.id);

    if (!tea) {
      return NextResponse.json({ error: "Tea not found" }, { status: 404 });
    }

    return NextResponse.json(tea);
  } catch (error) {
    console.error(`GET /api/tea/${params.id} error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch tea" },
      { status: 500 }
    );
  }
}
