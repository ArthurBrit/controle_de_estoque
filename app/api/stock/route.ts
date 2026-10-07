import { NextResponse } from "next/server";
import { currentStock, getMinimumStock } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ stock: currentStock(), minimumStock: getMinimumStock() });
}
