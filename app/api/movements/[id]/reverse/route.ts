import { NextResponse } from "next/server";
import { reverseMovement } from "@/lib/db";

export const runtime = "nodejs";
export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  try { return NextResponse.json(reverseMovement(Number((await context.params).id))); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Erro ao estornar." }, { status: 400 }); }
}
