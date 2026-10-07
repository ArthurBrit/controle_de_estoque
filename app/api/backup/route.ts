import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { backupTo, restoreFrom } from "@/lib/db";
import { localNow } from "@/lib/date";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE = 100 * 1024 * 1024;
const tempFile = (name: string) => path.join(os.tmpdir(), `controle-cestas-${Date.now()}-${Math.random().toString(36).slice(2)}-${name}`);

export async function GET() {
  const file = tempFile("backup.db");
  try {
    await backupTo(file);
    const data = await fs.readFile(file);
    const { date } = localNow();
    return new NextResponse(data, { headers: {
      "Content-Type": "application/vnd.sqlite3",
      "Content-Disposition": `attachment; filename="controle-cestas-${date}.db"`,
      "Cache-Control": "no-store",
    } });
  } catch {
    return NextResponse.json({ error: "Não foi possível gerar o backup." }, { status: 500 });
  } finally {
    await fs.rm(file, { force: true });
  }
}

export async function POST(req: Request) {
  const file = tempFile("restore.db");
  try {
    const upload = (await req.formData()).get("file");
    if (!(upload instanceof File)) throw new Error("Selecione um arquivo de backup.");
    if (upload.size > MAX_SIZE) throw new Error("Arquivo muito grande.");
    const data = Buffer.from(await upload.arrayBuffer());
    if (data.subarray(0, 16).toString("latin1") !== "SQLite format 3\u0000") throw new Error("O arquivo não é um banco SQLite válido.");
    await fs.writeFile(file, data);
    await restoreFrom(file);
    return NextResponse.json({ message: "Backup restaurado com sucesso." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível restaurar o backup." }, { status: 400 });
  } finally {
    await fs.rm(file, { force: true });
  }
}
