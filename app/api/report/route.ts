import { NextRequest, NextResponse } from "next/server";
import { getReport } from "@/lib/db";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(req:NextRequest){ const now=new Date(); return NextResponse.json(getReport(Number(req.nextUrl.searchParams.get("month"))||now.getMonth()+1,Number(req.nextUrl.searchParams.get("year"))||now.getFullYear())); }
