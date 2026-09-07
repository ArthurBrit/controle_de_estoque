import { NextResponse } from "next/server";
import { getMinimumStock, setMinimumStock } from "@/lib/db";
export const runtime="nodejs"; export const dynamic="force-dynamic";
export async function GET(){ return NextResponse.json({minimumStock:getMinimumStock()}); }
export async function PUT(req:Request){ try{ const {minimumStock}=await req.json(); if(!Number.isInteger(minimumStock)||minimumStock<0) throw new Error("Informe um número inteiro igual ou maior que zero."); setMinimumStock(minimumStock); return NextResponse.json({minimumStock}); }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Erro"},{status:400});} }
