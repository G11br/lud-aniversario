/**
 * Backend do site de aniversário da Lud — Google Apps Script.
 * Salva confirmações de presença e reservas de presentes numa planilha.
 *
 * Como instalar: veja README.md (passo 2).
 */

const SHEET_RSVP = "Confirmações";
const SHEET_GIFTS = "Presentes";

const RSVP_HEADERS = ["Data/hora", "Nome", "Vem?", "Acompanhantes", "Total de pessoas", "WhatsApp", "Recado", "token"];
const GIFT_HEADERS = ["Data/hora", "Presente", "Quem vai dar", "Status", "id", "token"];

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "";
  if (action === "gifts") {
    return json({ ok: true, gifts: giftSummary(String(e.parameter.token || "")) });
  }
  return json({ ok: true, hello: "Lud 21" });
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json({ ok: false, error: "invalid json" });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    switch (body.action) {
      case "rsvp": return json(saveRsvp(body));
      case "reserve": return json(reserveGift(body));
      case "unreserve": return json(unreserveGift(body));
      default: return json({ ok: false, error: "unknown action" });
    }
  } finally {
    lock.releaseLock();
  }
}

// ---------------- RSVP ----------------
// Uma linha por pessoa: se a mesma pessoa responder de novo (mesmo navegador),
// a linha dela é atualizada em vez de duplicada.
function saveRsvp(b) {
  const sh = sheet(SHEET_RSVP, RSVP_HEADERS);
  const yes = b.attending === "sim";
  const guests = yes ? Math.max(0, Math.min(10, Number(b.guests) || 0)) : 0;
  const row = [
    new Date(),
    clean(b.name, 80),
    yes ? "Sim" : "Não",
    guests,
    yes ? guests + 1 : 0,
    clean(b.phone, 20),
    clean(b.message, 500),
    clean(b.token, 64)
  ];
  if (!row[1]) return { ok: false, error: "name required" };

  const last = sh.getLastRow();
  if (last > 1 && row[7]) {
    const tokens = sh.getRange(2, 8, last - 1, 1).getValues();
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i][0] === row[7]) {
        sh.getRange(i + 2, 1, 1, row.length).setValues([row]);
        return { ok: true, updated: true };
      }
    }
  }
  sh.appendRow(row);
  return { ok: true };
}

// ---------------- Presentes ----------------
function giftRows() {
  const sh = sheet(SHEET_GIFTS, GIFT_HEADERS);
  const last = sh.getLastRow();
  if (last < 2) return { sh: sh, rows: [] };
  return { sh: sh, rows: sh.getRange(2, 1, last - 1, GIFT_HEADERS.length).getValues() };
}

function giftSummary(token) {
  const map = {};
  giftRows().rows.forEach(function (r) {
    if (r[3] !== "Reservado") return;
    const id = r[4];
    map[id] = map[id] || { id: id, count: 0, mine: false };
    map[id].count++;
    if (token && r[5] === token) map[id].mine = true;
  });
  return Object.keys(map).map(function (k) { return map[k]; });
}

function reserveGift(b) {
  const id = clean(b.id, 80);
  const token = clean(b.token, 64);
  const name = clean(b.name, 80);
  if (!id || !token || !name) return { ok: false, error: "missing fields" };

  const max = Math.max(1, Number(b.max) || 1);
  const data = giftRows();
  let count = 0;
  for (let i = 0; i < data.rows.length; i++) {
    const r = data.rows[i];
    if (r[4] !== id || r[3] !== "Reservado") continue;
    if (r[5] === token) return { ok: true, already: true };
    count++;
  }
  if (count >= max) return { ok: false, code: "taken", error: "already taken" };

  data.sh.appendRow([new Date(), clean(b.gift, 120), name, "Reservado", id, token]);
  return { ok: true };
}

function unreserveGift(b) {
  const id = clean(b.id, 80);
  const token = clean(b.token, 64);
  const data = giftRows();
  for (let i = 0; i < data.rows.length; i++) {
    const r = data.rows[i];
    if (r[4] === id && r[5] === token && r[3] === "Reservado") {
      data.sh.getRange(i + 2, 4).setValue("Cancelado");
    }
  }
  return { ok: true };
}

// ---------------- utilidades ----------------
function sheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f7cfdf");
    sh.hideColumns(headers.length); // esconde a coluna token
  }
  return sh;
}

// Evita que um texto vire fórmula na planilha (ex.: começar com "=").
function clean(v, max) {
  let s = String(v == null ? "" : v).trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
