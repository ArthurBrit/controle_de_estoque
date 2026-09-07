import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type { DashboardData, Movement, ReportData } from "./types";

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });
export const DB_PATH = process.env.DATABASE_PATH || path.join(dataDir, "controle-cestas.db");

const globalDb = globalThis as unknown as { basketDb?: Database.Database };
const db = globalDb.basketDb ?? new Database(DB_PATH);
if (process.env.NODE_ENV !== "production") globalDb.basketDb = db;
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(`
  CREATE TABLE IF NOT EXISTS movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('ENTRADA','SAIDA','ESTORNO')),
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    technician TEXT,
    destination TEXT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'ATIVO' CHECK(status IN ('ATIVO','ESTORNADO')),
    reversed_movement_id INTEGER UNIQUE REFERENCES movements(id),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  INSERT OR IGNORE INTO settings(key, value) VALUES ('minimumStock', '5');
  CREATE INDEX IF NOT EXISTS idx_movements_date ON movements(date);
`);

const mapMovement = (row: any): Movement => ({
  id: row.id, type: row.type, quantity: row.quantity, technician: row.technician,
  destination: row.destination, date: row.date, time: row.time, notes: row.notes,
  status: row.status, reversedMovementId: row.reversed_movement_id,
  createdAt: row.created_at, updatedAt: row.updated_at,
});

export function getStock(untilDate?: string) {
  const where = untilDate ? "WHERE date < ?" : "";
  const rows = db.prepare(`SELECT type, quantity FROM movements ${where}`).all(...(untilDate ? [untilDate] : [])) as {type:string;quantity:number}[];
  return rows.reduce((sum, m) => sum + (m.type === "ENTRADA" ? m.quantity : m.type === "SAIDA" ? -m.quantity : 0), 0);
}

export const createMovement = db.transaction((input: { type: "ENTRADA" | "SAIDA"; quantity: number; technician?: string; destination?: string; date: string; time: string; notes?: string }) => {
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) throw new Error("A quantidade deve ser um número inteiro maior que zero.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !/^\d{2}:\d{2}$/.test(input.time)) throw new Error("Data ou hora inválida.");
  if (input.type === "SAIDA") {
    if (!input.technician?.trim()) throw new Error("Informe o nome do técnico.");
    if (!input.destination?.trim()) throw new Error("Informe o destino.");
    const stock = getStock();
    if (input.quantity > stock) throw new Error(`Estoque insuficiente. Existem apenas ${stock} cestas disponíveis no estoque.`);
  }
  const result = db.prepare(`INSERT INTO movements(type,quantity,technician,destination,date,time,notes) VALUES(?,?,?,?,?,?,?)`).run(
    input.type, input.quantity, input.technician?.trim() || null, input.destination?.trim() || null, input.date, input.time, input.notes?.trim() || null
  );
  return mapMovement(db.prepare("SELECT * FROM movements WHERE id = ?").get(result.lastInsertRowid));
});

export const reverseMovement = db.transaction((id: number) => {
  const original = db.prepare("SELECT * FROM movements WHERE id = ?").get(id) as any;
  if (!original) throw new Error("Movimentação não encontrada.");
  if (original.status === "ESTORNADO" || original.type === "ESTORNO") throw new Error("Esta movimentação não pode ser estornada.");
  if (original.type === "ENTRADA" && currentStock() < original.quantity) throw new Error("Não é possível estornar a entrada: o estoque ficaria negativo.");
  const now = new Date();
  const date = now.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  const time = now.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
  db.prepare("UPDATE movements SET status='ESTORNADO', updated_at=CURRENT_TIMESTAMP WHERE id=?").run(id);
  const opposite = original.type === "ENTRADA" ? "SAIDA" : "ENTRADA";
  const result = db.prepare(`INSERT INTO movements(type,quantity,technician,destination,date,time,notes,reversed_movement_id) VALUES('ESTORNO',?,?,?,?,?,?,?)`).run(
    original.quantity, original.technician, original.destination, date, time, `Estorno de ${opposite.toLowerCase()} #${id}`, id
  );
  // ESTORNO carries no sign itself; insert an auditable compensating movement encoded by trigger-free quantity logic below.
  db.prepare("UPDATE movements SET notes = ? WHERE id = ?").run(`Estorno de ${original.type.toLowerCase()} #${id}`, result.lastInsertRowid);
  return mapMovement(db.prepare("SELECT * FROM movements WHERE id=?").get(result.lastInsertRowid));
});

function signedStock(rows: any[]) {
  const reversed = new Set(rows.filter(r => r.type === "ESTORNO").map(r => r.reversed_movement_id));
  return rows.reduce((sum, r) => {
    if (r.type === "ESTORNO" || reversed.has(r.id)) return sum;
    return sum + (r.type === "ENTRADA" ? r.quantity : -r.quantity);
  }, 0);
}

export function currentStock() { return signedStock(db.prepare("SELECT * FROM movements").all() as any[]); }

export function listMovements(filters: Record<string, string | undefined> = {}) {
  const clauses: string[] = []; const params: unknown[] = [];
  if (filters.start) { clauses.push("date >= ?"); params.push(filters.start); }
  if (filters.end) { clauses.push("date <= ?"); params.push(filters.end); }
  if (filters.type) { clauses.push("type = ?"); params.push(filters.type); }
  if (filters.technician) { clauses.push("technician LIKE ?"); params.push(`%${filters.technician}%`); }
  if (filters.destination) { clauses.push("destination LIKE ?"); params.push(`%${filters.destination}%`); }
  if (filters.q) { clauses.push("(technician LIKE ? OR destination LIKE ? OR notes LIKE ?)"); params.push(...Array(3).fill(`%${filters.q}%`)); }
  const sql = `SELECT * FROM movements ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""} ORDER BY date DESC,time DESC,id DESC`;
  return (db.prepare(sql).all(...params) as any[]).map(mapMovement);
}

export function getReport(month: number, year: number): ReportData {
  const start = `${year}-${String(month).padStart(2,"0")}-01`;
  const endDate = new Date(year, month, 0); const end = `${year}-${String(month).padStart(2,"0")}-${String(endDate.getDate()).padStart(2,"0")}`;
  const allBefore = db.prepare("SELECT * FROM movements WHERE date < ?").all(start) as any[];
  const rows = db.prepare("SELECT * FROM movements WHERE date BETWEEN ? AND ? ORDER BY date,time,id").all(start,end) as any[];
  const reversed = new Set((db.prepare("SELECT reversed_movement_id FROM movements WHERE reversed_movement_id IS NOT NULL AND date <= ?").all(end) as any[]).map(r=>r.reversed_movement_id));
  const effective = rows.filter(r => r.type !== "ESTORNO" && !reversed.has(r.id));
  const entries = effective.filter(r=>r.type==="ENTRADA").reduce((s,r)=>s+r.quantity,0);
  const exits = effective.filter(r=>r.type==="SAIDA").reduce((s,r)=>s+r.quantity,0);
  const dailyMap = new Map<string,{entradas:number;saidas:number}>();
  effective.forEach(r=>{ const x=dailyMap.get(r.date)||{entradas:0,saidas:0}; x[r.type==="ENTRADA"?"entradas":"saidas"]+=r.quantity; dailyMap.set(r.date,x); });
  const group = (key:string) => { const m=new Map<string,number>(); effective.filter(r=>r.type==="SAIDA"&&r[key]).forEach(r=>m.set(r[key],(m.get(r[key])||0)+r.quantity)); return [...m].map(([name,total])=>({name,total})).sort((a,b)=>b.total-a.total); };
  const initialStock=signedStock(allBefore); const minimumStock=Number((db.prepare("SELECT value FROM settings WHERE key='minimumStock'").get() as any).value);
  return { stock: currentStock(), monthEntries: entries, monthExits: exits, requests: effective.filter(r=>r.type==="SAIDA").length, minimumStock,
    movements: rows.map(mapMovement), daily:[...dailyMap].map(([date,v])=>({day:date.slice(8),...v})), technicians:group("technician"), destinations:group("destination"),
    month,year,initialStock,finalStock:initialStock+entries-exits,techniciansCount:group("technician").length,destinationsCount:group("destination").length,periodStart:start,periodEnd:end };
}

export function getDashboard(month:number,year:number): DashboardData { const r=getReport(month,year); return r; }
export function getMinimumStock(){ return Number((db.prepare("SELECT value FROM settings WHERE key='minimumStock'").get() as any).value); }
export function setMinimumStock(value:number){ db.prepare("UPDATE settings SET value=? WHERE key='minimumStock'").run(String(value)); }
export function checkpoint(){ db.pragma("wal_checkpoint(TRUNCATE)"); }
