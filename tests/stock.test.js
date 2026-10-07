const { test, before } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cestas-test-"));
process.env.DATABASE_PATH = path.join(dir, "test.db");

let db;
before(async () => { db = await import("../lib/db.ts"); });

const entrada = (quantity, date = "2026-10-01") => db.createMovement({ type: "ENTRADA", quantity, date, time: "08:00" });
const saida = (quantity, date = "2026-10-02") => db.createMovement({ type: "SAIDA", quantity, technician: "Ana", destination: "CRAS", date, time: "09:00" });

test("saldo do exemplo do README", () => {
  entrada(10); saida(2); saida(1); entrada(5);
  assert.equal(db.currentStock(), 12);
});

test("retirada estornada devolve as cestas ao saldo disponível para novas retiradas", () => {
  const before = db.currentStock();
  const s = saida(before);
  assert.equal(db.currentStock(), 0);
  db.reverseMovement(s.id);
  assert.equal(db.currentStock(), before);
  // Antes da correção, esta retirada falhava com "Estoque insuficiente" mesmo com saldo.
  assert.doesNotThrow(() => saida(before));
  assert.equal(db.currentStock(), 0);
});

test("não permite retirar mais do que o saldo", () => {
  entrada(3);
  assert.throws(() => saida(4), /Estoque insuficiente\. Existem apenas 3/);
  assert.doesNotThrow(() => saida(3));
});

test("entrada estornada sai do saldo e não pode ser estornada duas vezes", () => {
  const e = entrada(7);
  db.reverseMovement(e.id);
  assert.equal(db.currentStock(), 0);
  assert.throws(() => db.reverseMovement(e.id));
});

test("rejeita tipos e quantidades inválidos", () => {
  assert.throws(() => db.createMovement({ type: "ESTORNO", quantity: 1, date: "2026-10-01", time: "08:00" }), /Tipo/);
  assert.throws(() => entrada(0));
  assert.throws(() => entrada(1.5));
});

test("relatório: saldo inicial + entradas - saídas = saldo final = saldo atual", () => {
  entrada(4, "2026-11-03"); saida(1, "2026-11-04");
  const r = db.getReport(11, 2026);
  assert.equal(r.initialStock + r.monthEntries - r.monthExits, r.finalStock);
  assert.equal(r.finalStock, db.currentStock());
});

test("backup e restauração", async () => {
  const file = path.join(dir, "backup.db");
  await db.backupTo(file);
  const stock = db.currentStock();
  entrada(50);
  assert.equal(db.currentStock(), stock + 50);
  await db.restoreFrom(file);
  assert.equal(db.currentStock(), stock);
});
