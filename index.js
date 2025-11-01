console.log("⏳ Mulai proses inisialisasi bot...")

const fs = require("fs")
const path = require("path")
const {
  Client,
  Collection,
  GatewayIntentBits,
  REST,
  Routes,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
} = require("discord.js")
const express = require("express")
const cors = require("cors")
const config = require("./config.json")
const statusMonitor = require("./utils/statusMonitor")
const whitelistManager = require("./utils/whitelistManager")
const sheetsManager = require("./utils/sheetsManager")
require("./deploy-commands")

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
})

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "online",
    bot_status: client.isReady() ? "ready" : "not_ready",
    timestamp: new Date().toISOString(),
  })
})

app.get("/api/whitelist/check/:ip", async (req, res) => {
  try {
    const { ip } = req.params
    const isWhitelisted = await sheetsManager.isWhitelisted(ip)
    const serverData = await sheetsManager.getServerByIP(ip)

    console.log(`[API] Whitelist check for IP: ${ip} - Result: ${isWhitelisted}`)

    if (!isWhitelisted && client.isReady()) {
      const channel = client.channels.cache.get(config.ChannelLogWhitelist)
      if (channel) {
        const embed = {
          color: 0xff0000,
          title: "🚫 Server Tidak Diwhitelist Mencoba Start",
          description: `Terdapat server yang tidak diwhitelist sedang coba menyalakan server!`,
          fields: [
            { name: "🌐 IP Address", value: ip, inline: true },
            { name: "🔌 Port", value: ip.includes(":") ? ip.split(":")[1] : "Unknown", inline: true },
            { name: "📝 Server Name", value: "Unknown", inline: true },
          ],
          timestamp: new Date().toISOString(),
        }

        try {
          await channel.send({ embeds: [embed] })
          console.log(`[DISCORD] Sent non-whitelist notification for IP: ${ip}`)
        } catch (err) {
          console.error("[DISCORD] Failed to send notification:", err)
        }
      }
    }

    res.json({
      success: true,
      whitelisted: isWhitelisted,
      server: serverData || null,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[API] Error checking whitelist:", error)
    res.status(500).json({
      success: false,
      error: "Internal server error",
    })
  }
})

app.post("/api/whitelist/verify", async (req, res) => {
  try {
    const { ip, port, serverName } = req.body

    if (!ip) {
      return res.status(400).json({
        success: false,
        error: "IP address is required",
      })
    }

    let checkIP = ip
    if (!ip.includes(":") && port) {
      checkIP = `${ip}:${port}`
    }

    console.log(`[API] Checking whitelist for IP: ${checkIP}`)

    const isWhitelisted = await sheetsManager.isWhitelisted(checkIP)
    const serverData = await sheetsManager.getServerByIP(checkIP)

    const logData = {
      ip: checkIP,
      port: port || "unknown",
      serverName: serverName || "unknown",
      whitelisted: isWhitelisted,
      timestamp: new Date().toISOString(),
    }

    const logPath = path.join(__dirname, "data", "server_logs.json")
    let logs = []
    if (fs.existsSync(logPath)) {
      logs = JSON.parse(fs.readFileSync(logPath, "utf8"))
    }
    logs.push(logData)

    if (logs.length > 1000) {
      logs = logs.slice(-1000)
    }

    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2))

    console.log(`[API] Server verification - IP: ${checkIP}, Port: ${port}, Whitelisted: ${isWhitelisted}`)

    res.json({
      success: true,
      whitelisted: isWhitelisted,
      server: serverData || null,
      message: isWhitelisted
        ? "Server berhasil diverifikasi dan diizinkan untuk berjalan"
        : "Server tidak terdaftar dalam whitelist",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[API] Error verifying server:", error)
    res.status(500).json({
      success: false,
      error: "Internal server error",
    })
  }
})

app.get("/api/whitelist/list", async (req, res) => {
  try {
    const servers = await sheetsManager.getAllServers()

    res.json({
      success: true,
      count: servers.length,
      servers: servers,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[API] Error getting whitelist:", error)
    res.status(500).json({
      success: false,
      error: "Internal server error",
    })
  }
})

const server = app.listen(PORT, () => {
  console.log(`🌐 HTTP API Server berjalan di port ${PORT}`)
  console.log(`📡 API Endpoints:`)
  console.log(`   GET  /api/health`)
  console.log(`   GET  /api/whitelist/check/:ip`)
  console.log(`   POST /api/whitelist/verify`)
  console.log(`   GET  /api/whitelist/list`)
})

client.commands = new Collection()
client.pendingRequests = new Map()

console.log("✅ Semua module berhasil di-load.")
console.log("✅ Client Discord berhasil dibuat.")

statusMonitor(client)
// Removed errorMonitoring(client) since the file was deleted

const commandsArray = []

const foldersPath = path.join(__dirname, "commands")
const commandFolders = fs.readdirSync(foldersPath)

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder)
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"))

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file)
    try {
      const command = require(filePath)
      if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command)
        commandsArray.push(command.data.toJSON())
        console.log(`✅ Command berhasil dimuat: ${filePath}`)
      } else {
        console.warn(`[WARNING] Command di ${filePath} tidak punya properti "data" atau "execute".`)
      }
    } catch (err) {
      console.error(`❌ Gagal memuat command: ${filePath}`)
      console.error(err)
    }
  }
}

const rest = new REST({ version: "10" }).setToken(config.token)
rest
  .put(Routes.applicationCommands(config.clientId), { body: commandsArray })
  .then(() => console.log("✅ Commands berhasil di-deploy"))
  .catch(console.error)

const eventsPath = path.join(__dirname, "events")
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith(".js"))

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file)
  try {
    const event = require(filePath)
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client))
    } else {
      client.on(event.name, (...args) => event.execute(...args, client))
    }
    console.log(`✅ Event berhasil dimuat: ${file}`)
  } catch (err) {
    console.error(`❌ Gagal memuat event: ${file}`)
    console.error(err)
  }
}

client.on("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName)
    if (!command) return
    try {
      await command.execute(interaction)
    } catch (err) {
      console.error(`❌ Error saat eksekusi command ${interaction.commandName}:`, err)
      await interaction.reply({ content: "❌ Terjadi kesalahan saat menjalankan command.", ephemeral: true })
    }
  }
})

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err)
})

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err)
})

client
  .login(config.token)
  .then(() => {
    console.log("🔓 Login ke Discord berhasil.")
  })
  .catch((err) => {
    console.error("❌ Gagal login ke Discord:", err)
  })
