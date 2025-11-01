const fs = require("fs")
const path = require("path")
const sheetsManager = require("./sheetsManager")

const whitelistPath = path.join(__dirname, "../data/whitelist.json")

// Fungsi untuk membaca data whitelist
function readWhitelist() {
  try {
    if (!fs.existsSync(whitelistPath)) {
      // Buat file jika belum ada
      const defaultData = { servers: [] }
      fs.writeFileSync(whitelistPath, JSON.stringify(defaultData, null, 2))
      return defaultData
    }
    const data = fs.readFileSync(whitelistPath, "utf8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Error reading whitelist:", error)
    return { servers: [] }
  }
}

// Fungsi untuk menyimpan data whitelist
function saveWhitelist(data) {
  try {
    fs.writeFileSync(whitelistPath, JSON.stringify(data, null, 2))
    return true
  } catch (error) {
    console.error("Error saving whitelist:", error)
    return false
  }
}

// Fungsi untuk menambah server ke whitelist
async function addToWhitelist(ip, owner, addedBy) {
  return await sheetsManager.addToWhitelist(ip, owner, addedBy)
}

// Fungsi untuk menghapus server dari whitelist
async function removeFromWhitelist(ip) {
  return await sheetsManager.removeFromWhitelist(ip)
}

// Fungsi untuk mengecek apakah IP ada dalam whitelist
async function isWhitelisted(ip) {
  return await sheetsManager.isWhitelisted(ip)
}

// Fungsi untuk mendapatkan semua server yang diwhitelist
async function getAllWhitelisted() {
  return await sheetsManager.getAllWhitelisted()
}

// Fungsi untuk mendapatkan data server berdasarkan IP
async function getServerByIP(ip) {
  return await sheetsManager.getServerByIP(ip)
}

// Fungsi untuk mendapatkan semua server (termasuk yang tidak aktif)
async function getAllServers() {
  return await sheetsManager.getAllServers()
}

module.exports = {
  isWhitelisted,
  getServerByIP,
  getAllServers,
  getAllWhitelisted,
  addToWhitelist,
  removeFromWhitelist,
}
