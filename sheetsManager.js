const { google } = require("googleapis");

// ========== GOOGLE SHEETS SETUP ==========
const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json", // gunakan file kredensial lokal (service account)
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// ⚙️ Info spreadsheet
const SPREADSHEET_ID = "1jJdqZNmBdLqXoZeRTSmZvsM-HiKMs96hF5TSS-xWbXU";
const SHEET_NAME = "Whitelist Server";

// ========== WHITELIST FUNCTIONS ==========

// 🧾 Baca data whitelist
async function getWhitelistFromSheets() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:E`,
    });

    const rows = response.data.values || [];
    return rows.map((row) => ({
      ip: row[0] || "",
      owner: row[1] || "",
      addedBy: row[2] || "",
      addedAt: row[3] || new Date().toISOString(),
      status: row[4] || "active",
    }));
  } catch (error) {
    console.error("[SHEETS] Error reading whitelist:", error.message);
    return [];
  }
}

// 💾 Simpan data whitelist
async function saveWhitelistToSheets(servers) {
  try {
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:E`,
    });

    const rows = servers.map((s) => [s.ip, s.owner, s.addedBy, s.addedAt, s.status]);
    if (rows.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A2`,
        valueInputOption: "RAW",
        resource: { values: rows },
      });
    }

    console.log("[SHEETS] Data saved successfully");
    return true;
  } catch (error) {
    console.error("[SHEETS] Error saving whitelist:", error.message);
    return false;
  }
}

// 🔍 Cek apakah IP ter-whitelist
async function isWhitelisted(ip) {
  const servers = await getWhitelistFromSheets();
  return servers.some((s) => s.ip === ip && s.status === "active");
}

// 🔍 Ambil data server berdasarkan IP
async function getServerByIP(ip) {
  const servers = await getWhitelistFromSheets();
  return servers.find((s) => s.ip === ip && s.status === "active");
}

// ➕ Tambah ke whitelist
async function addToWhitelist(ip, owner, addedBy) {
  const servers = await getWhitelistFromSheets();

  if (servers.some((s) => s.ip === ip)) {
    return { success: false, message: "Server sudah ada dalam whitelist!" };
  }

  const newServer = {
    ip,
    owner,
    addedBy,
    addedAt: new Date().toISOString(),
    status: "active",
  };

  servers.push(newServer);
  const saved = await saveWhitelistToSheets(servers);

  return saved
    ? { success: true, message: "Server berhasil ditambahkan!", server: newServer }
    : { success: false, message: "Gagal menyimpan ke Google Sheets!" };
}

// ➖ Hapus dari whitelist
async function removeFromWhitelist(ip) {
  const servers = await getWhitelistFromSheets();
  const index = servers.findIndex((s) => s.ip === ip);

  if (index === -1) {
    return { success: false, message: "Server tidak ditemukan!" };
  }

  const removed = servers[index];
  servers.splice(index, 1);
  const saved = await saveWhitelistToSheets(servers);

  return saved
    ? { success: true, message: "Server berhasil dihapus!", server: removed }
    : { success: false, message: "Gagal menyimpan ke Google Sheets!" };
}

// 📜 Ambil semua server
async function getAllServers() {
  return await getWhitelistFromSheets();
}

// 📜 Ambil semua server aktif
async function getAllWhitelisted() {
  const servers = await getWhitelistFromSheets();
  return servers.filter((server) => server.status === "active");
}

// ========== EXPORTS ==========
module.exports = {
  getWhitelistFromSheets,
  saveWhitelistToSheets,
  isWhitelisted,
  getServerByIP,
  addToWhitelist,
  removeFromWhitelist,
  getAllServers,
  getAllWhitelisted,
};
