const { google } = require("googleapis");

// ==================================
// 🔐 Langsung isi kredensial disini
// ==================================
const credentials = {
  type: "service_account",
  project_id: "discord-bot-whitelist",
  private_key_id: "1849cb93279592eeb28d5b4dd74be948d18eb148",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCpct97JryZw87b\nz+Z0xtIKrYDsYpnJ9AHfb0NIkwMtt5tZlXKYmGbiAQ8lQcd9sqoz3Br+HpDLHBR6\nG9HDR5Jr2XTV/bixURu7mWRG9RxC7zEGwKXMmLIjE4k+OdqZsV0EUL4rMmaD8kEs\nmybG1cN43i1ERR+Eq7Rp16J0wSTZn6xAjyipe8oTeB0p8vAyXKXTwC3H+bIkDCFl\nxjBv19+Sl3FeMU5+tefaW2cLd/TSVMf47LZYOuqKl4cAnT7seqiSoModbb1STPeM\ni+4Oh0o563FSI2vb0SNfbrMjZUj9OVvv+t6VMfBp0/vIGzGdmsMG0M2SaWb5v3/5\nE/QUTYkjAgMBAAECggEARRL2RfH7BOV8oD9mLulTexXSTco97cThtI7bCy0eqRbF\nJaYV0l2h5vROk732T+eymTRa7odQN/PI5yQLBMNazUsWZRsqHGI3X2h+p6xIaoKt\n5hZHIBmI2GKg2jRkR621AMrXUq2Xe6cX6VKP4pMGPXG4WzGgUQlboJ/N8jE/z9Qs\nw9ZlZckGtrehFMDDQ9MSrOMNvm45dBgE9IZKwfF5hiTd2eGVtqdjT/8sm8TECvoD\n4NOIGUdjoFgNmiLYQvhaRkhHgP/6DOzRtx5JbCK37u7eLAnQwKpJ77jbUolzZEBH\nLHz1jjFS+aJgTQKyXEFYHqRXWBhV+9Vner9kJfey7QKBgQDZKxlDHdsP/43O0Ikr\nTXduGauFNddkKZUpMkxLic1ZIjrDxCsCf3FYD35XSLMePbY/8ZUQPFP+cXnERUzQ\nQDUkYhQm8w2GYddv88Na0JDAeXMO24d66Bc+k89T8AyfTLNe5/Z1ZKdwgfg/Za6F\nG/bg6MLfgZn91L/jM4vKY2sczwKBgQDHv2deDrFLgOhWuvHiBOb+x1wanw+f7eNV\nDMGBgdSUv8mHsOwnr9tosnd7VX8h6SGSohhVYikjTh/pljOtJcL2cxM0rpXKJB1T\nn0fG68NvKLl1QpwuyueNmsS1oC+d+lSie/MCPTSTtBS7oOgrP8mf/TEXx1g3+HXX\nrGmoekyrbQKBgQCHRVdI/THUt0QnjLHEbU51IDw8j5sI4vXsYU4wxzdHzBB6nJiF\nx8hcJ9p0l+4qaho5nktRf6J6HUjRvrDoDvaLISSYVlEYYZ2GOHp4+O0RVxUaLhgn\nsKW57uv3xtC18VrRRP+5g+bgJ7TwGHAqrY6L7bBk9B9tgrW72gG7IU449QKBgHub\nIzEeMHKDq8L33nS6CePBpGpI4dda02GvChPFLrJ52BEi15Bbj4/DWJK2vnxSktb1\nfc9gdgqF7tOSghn0kygE3+6q1sCHBqrXlwgunvqrndBFTvbZ0t5a1r16Cd1dqn/9\n6cwJ6f444teU4/bXe0KI4JdRYXMJSosTAzMhs04lAoGBAMXLfdool4uoSU84ppiF\nCCxYfjZHdPFQSF6e8CNobgrRX24y9SKkdwfIGbSOxe+BDOJf+jCHULn/mAilShE3\nZije1ohcFW/HI2Mwc+CzXSn0RN7k4RyeAtfBry3g/6V5xRC9W7XbpZ8uayIOifeO\noZv5ogoZg+WyNTC5aIPayYqn\n-----END PRIVATE KEY-----\n",
  client_email: "discordbotwhitelistnew@discord-bot-whitelist.iam.gserviceaccount.com",
  client_id: "112579294848233049153",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/discordbotwhitelistnew%40discord-bot-whitelist.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

// ==================================
// ⚙️ Konfigurasi Spreadsheet
// ==================================
const SPREADSHEET_ID = "1jJdqZNmBdLqXoZeRTSmZvsM-HiKMs96hF5TSS-xWbXU";
const SHEET_NAME = "Whitelist Server";

// 🔐 Autentikasi Google Sheets
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// =============================
// 📜 Fungsi baca data whitelist
// =============================
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

// =============================
// 💾 Fungsi simpan whitelist
// =============================
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

    console.log("[SHEETS] ✅ Data saved successfully");
    return true;
  } catch (error) {
    console.error("[SHEETS] ❌ Error saving whitelist:", error.message);
    return false;
  }
}

// =============================
// 🔍 Cek & manipulasi whitelist
// =============================
async function isWhitelisted(ip) {
  const servers = await getWhitelistFromSheets();
  return servers.some((server) => server.ip === ip && server.status === "active");
}

async function getServerByIP(ip) {
  const servers = await getWhitelistFromSheets();
  return servers.find((server) => server.ip === ip && server.status === "active");
}

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

async function getAllServers() {
  return await getWhitelistFromSheets();
}

async function getAllWhitelisted() {
  const servers = await getWhitelistFromSheets();
  return servers.filter((server) => server.status === "active");
}

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
