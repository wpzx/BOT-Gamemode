// =========================
// 📜 sheetManager.js
// =========================

import { google } from "googleapis";

// Pastikan kamu sudah set environment variable:
// GOOGLE_CREDENTIALS={"type":"service_account", ...}
// SPREADSHEET_ID=spreadsheet_id_kamu

// Cek kredensial dari environment
if (!process.env.GOOGLE_CREDENTIALS) {
  console.error("[SHEETS] ❌ Environment variable GOOGLE_CREDENTIALS tidak ditemukan!");
  process.exit(1);
}

// Parse JSON dari GOOGLE_CREDENTIALS
let credentials;
try {
  credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
} catch (err) {
  console.error("[SHEETS] ❌ Gagal parse GOOGLE_CREDENTIALS:", err);
  process.exit(1);
}

// Setup autentikasi Google
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// Ambil ID Spreadsheet dari environment
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
if (!SPREADSHEET_ID) {
  console.error("[SHEETS] ❌ Environment variable SPREADSHEET_ID tidak ditemukan!");
  process.exit(1);
}

// =========================
// 📂 Fungsi: Ambil data whitelist
// =========================
export async function getWhitelist() {
  try {
    const range = "Whitelist!A2:B"; // Ubah sesuai struktur sheet kamu
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
    });

    const rows = res.data.values || [];
    const whitelist = rows.map((row) => ({
      ip: row[0],
      owner: row[1] || "Unknown",
    }));

    console.log(`[SHEETS] ✅ Berhasil ambil ${whitelist.length} server dari whitelist.`);
    return whitelist;
  } catch (err) {
    console.error("[SHEETS] ❌ Gagal ambil data whitelist:", err);
    return [];
  }
}

// =========================
// ➕ Fungsi: Tambah server ke whitelist
// =========================
export async function addWhitelist(ip, owner) {
  try {
    const range = "Whitelist!A:B";
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "RAW",
      requestBody: {
        values: [[ip, owner]],
      },
    });
    console.log(`[SHEETS] ✅ Server ${ip} ditambahkan ke whitelist.`);
    return true;
  } catch (err) {
    console.error("[SHEETS] ❌ Gagal menambah whitelist:", err);
    return false;
  }
}

// =========================
// ❌ Fungsi: Hapus server dari whitelist
// =========================
export async function removeWhitelist(ip) {
  try {
    const range = "Whitelist!A2:B";
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
    });

    const rows = res.data.values || [];
    const rowIndex = rows.findIndex((row) => row[0] === ip);

    if (rowIndex === -1) {
      console.warn(`[SHEETS] ⚠️ IP ${ip} tidak ditemukan di whitelist.`);
      return false;
    }

    const requests = [
      {
        deleteDimension: {
          range: {
            sheetId: 0, // Ganti jika sheet ID kamu bukan 0
            dimension: "ROWS",
            startIndex: rowIndex + 1,
            endIndex: rowIndex + 2,
          },
        },
      },
    ];

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests },
    });

    console.log(`[SHEETS] 🗑️ Server ${ip} dihapus dari whitelist.`);
    return true;
  } catch (err) {
    console.error("[SHEETS] ❌ Gagal hapus whitelist:", err);
    return false;
  }
}
