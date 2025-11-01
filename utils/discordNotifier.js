const axios = require("axios")

// URL endpoint bot Discord (akan di-set di environment variable)
const BOT_WEBHOOK_URL = process.env.BOT_WEBHOOK_URL || "http://localhost:3001/api/webhook/alert"

async function sendWhitelistAlert(ipAddress, serverName = "Unknown") {
  try {
    const payload = {
      type: "whitelist_alert",
      data: {
        ip: ipAddress,
        serverName: serverName,
        timestamp: new Date().toISOString(),
        status: "unauthorized_attempt",
      },
    }

    console.log(`[NOTIFIER] Sending alert to Discord bot for IP: ${ipAddress}`)

    const response = await axios.post(BOT_WEBHOOK_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.BOT_API_KEY || "default-key",
      },
      timeout: 5000,
    })

    console.log(`[NOTIFIER] Alert sent successfully:`, response.data)
    return true
  } catch (error) {
    console.error(`[NOTIFIER] Failed to send alert:`, error.message)
    return false
  }
}

module.exports = {
  sendWhitelistAlert,
}
