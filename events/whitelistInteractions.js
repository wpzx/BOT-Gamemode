const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require("discord.js")
const whitelistManager = require("../utils/whitelistManager")
const config = require("../config.json")

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    if (!interaction.isButton() && !interaction.isModalSubmit()) return

    const member = interaction.member
    const ADMIN_ROLE_ID = config.ADMIN_ROLE_ID

    // Handle button interactions
    if (interaction.isButton()) {
      // Check permissions for whitelist buttons
      if (interaction.customId.startsWith("whitelist_")) {
        if (!member.roles.cache.has(ADMIN_ROLE_ID)) {
          return interaction.reply({
            content: "❌ Kamu tidak memiliki izin untuk menggunakan fitur ini.",
            ephemeral: true,
          })
        }
      }

      // Handle whitelist add button
      if (interaction.customId === "whitelist_add") {
        const modal = new ModalBuilder().setCustomId("whitelist_add_modal").setTitle("Tambah Server ke Whitelist")

        const ipInput = new TextInputBuilder()
          .setCustomId("server_ip")
          .setLabel("IP Address Server")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Contoh: 127.0.0.1:7777")
          .setRequired(true)

        const ownerInput = new TextInputBuilder()
          .setCustomId("server_owner")
          .setLabel("Nama Pemilik Server")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Nama pemilik server")
          .setRequired(true)

        const firstActionRow = new ActionRowBuilder().addComponents(ipInput)
        const secondActionRow = new ActionRowBuilder().addComponents(ownerInput)

        modal.addComponents(firstActionRow, secondActionRow)
        await interaction.showModal(modal)
      }

      // Handle whitelist remove button
      if (interaction.customId === "whitelist_remove") {
        const whitelistedServers = whitelistManager.getAllWhitelisted()

        if (whitelistedServers.length === 0) {
          return interaction.reply({
            content: "❌ Tidak ada server yang diwhitelist saat ini.",
            ephemeral: true,
          })
        }

        const modal = new ModalBuilder().setCustomId("whitelist_remove_modal").setTitle("Hapus Server dari Whitelist")

        const ipInput = new TextInputBuilder()
          .setCustomId("server_ip_remove")
          .setLabel("IP Address Server yang akan dihapus")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Contoh: 127.0.0.1:7777")
          .setRequired(true)

        const firstActionRow = new ActionRowBuilder().addComponents(ipInput)
        modal.addComponents(firstActionRow)
        await interaction.showModal(modal)
      }

      // Handle whitelist list button
      if (interaction.customId === "whitelist_list") {
        const whitelistedServers = whitelistManager.getAllWhitelisted()

        if (whitelistedServers.length === 0) {
          const embed = new EmbedBuilder()
            .setTitle("📋 Daftar Server Whitelist")
            .setDescription("Tidak ada server yang diwhitelist saat ini.")
            .setColor("Orange")
            .setFooter({ text: "Sistem Whitelist Server" })
            .setTimestamp()

          return interaction.reply({ embeds: [embed], ephemeral: true })
        }

        let serverList = ""
        whitelistedServers.forEach((server, index) => {
          const addedDate = new Date(server.addedAt).toLocaleDateString("id-ID")
          serverList += `**${index + 1}. ${server.ip}**\n`
          serverList += `👤 Pemilik: ${server.owner}\n`
          serverList += `👨‍💼 Ditambahkan oleh: ${server.addedBy}\n`
          serverList += `📅 Tanggal: ${addedDate}\n`
          serverList += `⚡ Status: 🟢 Active\n\n`
        })

        const listEmbed = new EmbedBuilder()
          .setTitle(`📋 Daftar Server Whitelist (${whitelistedServers.length} server)`)
          .setDescription(serverList)
          .setColor("Green")
          .setFooter({ text: "Sistem Whitelist Server" })
          .setTimestamp()

        await interaction.reply({ embeds: [listEmbed], ephemeral: true })
      }
    }

    // Handle modal submissions
    if (interaction.isModalSubmit()) {
      // Check permissions for whitelist modals
      if (interaction.customId.includes("whitelist_")) {
        if (!member.roles.cache.has(ADMIN_ROLE_ID)) {
          return interaction.reply({
            content: "❌ Kamu tidak memiliki izin untuk menggunakan fitur ini.",
            ephemeral: true,
          })
        }
      }

      // Handle add server modal
      if (interaction.customId === "whitelist_add_modal") {
        const ip = interaction.fields.getTextInputValue("server_ip")
        const owner = interaction.fields.getTextInputValue("server_owner")
        const addedBy = interaction.user.tag

        // Validate IP format
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(:\d{1,5})?$/
        if (!ipRegex.test(ip)) {
          return interaction.reply({
            content: "❌ Format IP tidak valid! Gunakan format: 192.168.1.1 atau 192.168.1.1:7777",
            ephemeral: true,
          })
        }

        const result = whitelistManager.addToWhitelist(ip, owner, addedBy)

        if (result.success) {
          const embed = new EmbedBuilder()
            .setTitle("✅ Server Berhasil Diwhitelist")
            .setDescription("Server telah ditambahkan ke whitelist dan dapat menjalankan gamemode.")
            .addFields(
              { name: "🌐 IP Address", value: `\`${result.server.ip}\``, inline: true },
              { name: "👤 Pemilik", value: result.server.owner, inline: true },
              { name: "⚡ Status", value: "🟢 Active", inline: true },
              { name: "👨‍💼 Ditambahkan oleh", value: addedBy, inline: true },
              {
                name: "📅 Tanggal",
                value: `<t:${Math.floor(new Date(result.server.addedAt).getTime() / 1000)}:F>`,
                inline: true,
              },
            )
            .setColor("Green")
            .setFooter({ text: "Sistem Whitelist Server" })
            .setTimestamp()

          const logChannel = client.channels.cache.get(config.ChannelLogWhitelist)
          if (logChannel) {
            const logEmbed = new EmbedBuilder()
              .setTitle("🟢 Server Ditambahkan ke Whitelist")
              .addFields(
                { name: "🌐 IP Address", value: `\`${result.server.ip}\``, inline: true },
                { name: "👤 Pemilik", value: result.server.owner, inline: true },
                { name: "👨‍💼 Admin", value: addedBy, inline: true },
              )
              .setColor("Green")
              .setTimestamp()

            try {
              await logChannel.send({ embeds: [logEmbed] })
            } catch (err) {
              console.error("[LOG] Failed to send whitelist log:", err)
            }
          }

          await interaction.reply({ embeds: [embed], ephemeral: true })
        } else {
          await interaction.reply({
            content: `❌ ${result.message}`,
            ephemeral: true,
          })
        }
      }

      // Handle remove server modal
      if (interaction.customId === "whitelist_remove_modal") {
        const ip = interaction.fields.getTextInputValue("server_ip_remove")
        const removedBy = interaction.user.tag

        const result = whitelistManager.removeFromWhitelist(ip)

        if (result.success) {
          const embed = new EmbedBuilder()
            .setTitle("✅ Server Berhasil Dihapus dari Whitelist")
            .setDescription("Server telah dihapus dari whitelist dan tidak dapat lagi menjalankan gamemode.")
            .addFields(
              { name: "🌐 IP Address", value: `\`${ip}\``, inline: true },
              { name: "👨‍💼 Dihapus oleh", value: removedBy, inline: true },
              { name: "⚡ Status", value: "🔴 Removed", inline: true },
            )
            .setColor("Red")
            .setFooter({ text: "Sistem Whitelist Server" })
            .setTimestamp()

          const logChannel = client.channels.cache.get(config.ChannelLogWhitelist)
          if (logChannel) {
            const logEmbed = new EmbedBuilder()
              .setTitle("🔴 Server Dihapus dari Whitelist")
              .addFields(
                { name: "🌐 IP Address", value: `\`${ip}\``, inline: true },
                { name: "👨‍💼 Admin", value: removedBy, inline: true },
              )
              .setColor("Red")
              .setTimestamp()

            try {
              await logChannel.send({ embeds: [logEmbed] })
            } catch (err) {
              console.error("[LOG] Failed to send whitelist log:", err)
            }
          }

          await interaction.reply({ embeds: [embed], ephemeral: true })
        } else {
          await interaction.reply({
            content: `❌ ${result.message}`,
            ephemeral: true,
          })
        }
      }
    }
  },
}
