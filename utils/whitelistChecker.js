const whitelistManager = require("./whitelistManager")
const discordNotifier = require("./discordNotifier")

async function checkServerLicense(serverIP) {
  const isAllowed = await whitelistManager.isWhitelisted(serverIP)

  if (isAllowed) {
    console.log(`[Info] Lisensi terdaftar, server akan dijalankan.`)
    console.log(`[Info] IP:PORT Servermu adalah ${serverIP}.`)
    return true
  } else {
    console.log(`[Info] Terdapat server yang tidak diwhitelist sedang cuba memulaikan server! ${serverIP}`)
    await discordNotifier.sendWhitelistAlert(serverIP, "Unauthorized Server")
    return false
  }
}

// Fungsi untuk log aktivitas server
function logServerActivity(serverIP, action) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] [Info] Server ${serverIP} - ${action}`)
}

module.exports = {
  checkServerLicense,
  logServerActivity,
}
