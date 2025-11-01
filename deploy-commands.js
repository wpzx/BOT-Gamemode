const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const TOKEN = "MTM4MjIzMjU1NzYwNDU3MzI5NQ.Gpm5Ck.gWSXZLvC0jj40ZnpD9ufU5_r-e7Ddol4zLaah0";
const CLIENT_ID = "1382232557604573295";

const commands = [];

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
    } else {
      console.warn(`[WARNING] Command di ${file} tidak punya "data" atau "execute".`);
    }
  }
}

const rest = new REST().setToken(TOKEN);

async function deployCommands() {
  try {
    console.log(`🔄 Registering ${commands.length} commands...`);
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );
    console.log("✅ Semua command berhasil didaftarkan.");
  } catch (error) {
    console.error("❌ Gagal daftar command:", error);
  }
}

deployCommands();
