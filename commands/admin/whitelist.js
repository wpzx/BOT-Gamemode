const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js")
const whitelistManager = require("../../utils/whitelistManager")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("whitelist")
    .setDescription("Panel manajemen whitelist server")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const member = interaction.member
    const ADMIN_ROLE_ID = "1382028511228985345";

    // Cek apakah user punya role admin
    if (!member.roles.cache.has(ADMIN_ROLE_ID)) {
      return interaction.reply({
        content: "❌ Kamu tidak memiliki izin untuk menggunakan command ini.",
        ephemeral: true,
      })
    }

    const whitelistedServers = whitelistManager.getAllWhitelisted()

    // Buat embed utama dengan informasi dan tombol
    const embed = new EmbedBuilder()
      .setTitle("🛡️ Panel Manajemen Whitelist Server")
      .setDescription(
        `**Sistem Whitelist Server Gamemode**\n\n` +
          `📊 **Status Saat Ini:**\n` +
          `• Server Terdaftar: **${whitelistedServers.length}** server\n` +
          `• Status API: 🟢 Online\n\n` +
          `**Gunakan tombol di bawah untuk mengelola whitelist:**`,
      )
      .addFields(
        { name: "🟢 Tambah Server", value: "Whitelist server baru", inline: true },
        { name: "🔴 Hapus Server", value: "Unwhitelist server", inline: true },
        { name: "📋 Lihat Daftar", value: "Tampilkan semua server", inline: true },
      )
      .setColor("Blue")
      .setFooter({
        text: `Panel Whitelist • Diakses oleh ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp()

    // Buat action row dengan buttons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("whitelist_add")
        .setLabel("Tambah Server")
        .setStyle(ButtonStyle.Success)
        .setEmoji("🟢"),
      new ButtonBuilder()
        .setCustomId("whitelist_remove")
        .setLabel("Hapus Server")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("🔴"),
      new ButtonBuilder()
        .setCustomId("whitelist_list")
        .setLabel("Lihat Daftar")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("📋"),
    )

    await interaction.reply({ embeds: [embed], components: [row] })
  },
}
