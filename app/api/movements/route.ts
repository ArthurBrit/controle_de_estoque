import { NextRequest, NextResponse } from "next/server";
import { createMovement, listMovements } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  return NextResponse.json(listMovements(Object.fromEntries(p.entries())));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return NextResponse.json(createMovement(body), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível registrar." }, { status: 400 });
  }
}
