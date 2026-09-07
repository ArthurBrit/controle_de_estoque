import { NextRequest, NextResponse } from "next/server";
import { getDashboard } from "@/lib/db";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const now=new Date(); const month=Number(req.nextUrl.searchParams.get("month"))||now.getMonth()+1; const year=Number(req.nextUrl.searchParams.get("year"))||now.getFullYear();
  return NextResponse.json(getDashboard(month,year));
}
