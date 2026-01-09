import os from "os";
import { Module, getCommands } from "../lib/plugins.js";
import { getRandomPhoto } from "./bin/menu_img.js";
import config from "../config.js";

const name = "X-kira ━ 𝐁𝕺𝐓";
const runtime = (secs) => {
  const pad = (s) => s.toString().padStart(2, "0");
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  return `${pad(h)}h ${pad(m)}m ${pad(s)}s`;
};
const readMore = String.fromCharCode(8206).repeat(4001);

// Build grouped commands from current plugin list (uses snapshot getter)
function buildGroupedCommands() {
  const cmds = getCommands();
  return cmds
    .filter((cmd) => cmd && cmd.command && cmd.command !== "undefined")
    .reduce((acc, cmd) => {
      const pkg = (cmd.package || "uncategorized").toString().toLowerCase();
      if (!acc[pkg]) acc[pkg] = [];
      acc[pkg].push(cmd.command);
      return acc;
    }, {});
}

// Menu command
Module({
  command: "menu",
  package: "general",
  description: "Show all commands or a specific package",
})(async (message, match) => {
  try {
    await message.react("📜");
    const time = new Date().toLocaleTimeString("en-ZA", {
      timeZone: "Africa/Johannesburg",
    });
    const mode = config.WORK_TYPE || process.env.WORK_TYPE;
    const userName = message.pushName || "User";
    const usedGB = ((os.totalmem() - os.freemem()) / 1073741824).toFixed(2);
    const totGB = (os.totalmem() / 1073741824).toFixed(2);
    const ram = `${usedGB} / ${totGB} GB`;

    // Build grouped commands
  const grouped = buildGroupedCommands();
const categories = Object.keys(grouped).sort();
let _cmd_st = "";

if (match && grouped[match.toLowerCase()]) {
  const pack = match.toLowerCase();
  _cmd_st += `\n *╭────❒ ${pack.toUpperCase()} ❒*\n`;
  grouped[pack]
    .sort((a, b) => a.localeCompare(b))
    .forEach((cmdName) => {
      _cmd_st += ` *├◈ ${cmdName}*\n`;
    });
  _cmd_st += ` *┕──────────────────❒*\n`;
} else {
  _cmd_st += `
╔〔 🧚‍♀️*Rᴀʙʙɪᴛ Xᴍᴅ Mɪɴɪ*💐〕╗
 *👋 Hᴇʟʟᴏ, Rᴀʙʙɪᴛ Xᴍᴅ Mɪɴɪ Usᴇʀ!*
╚══════════════════════╝

╭─「 *Cᴏᴍᴍᴀɴᴅ Pᴀɴᴇʟ* 」
│🔹 *𝐎ᴡɴᴇʀ*    : 𝐌ʀ 𝐑ᴀʙʙɪᴛ
│🔹 *Rᴜɴ*     : ${runtime(process.uptime())}
│🔹 *Mᴏᴅᴇ*    : Pᴜʙʟɪᴄ
│🔹 *Pʀᴇғɪx*  : ${config.prefix}
│🔹 *Rᴀᴍ*     : ${ram}
│🔹 *Tɪᴍᴇ*    : ${time}
│🔹 *Uѕᴇʀ*    : ${userName}
╰─────────────●●►
${readMore}
`;

  if (match && !grouped[match.toLowerCase()]) {
    _cmd_st += `\n⚠️ *Pᴀᴄᴋᴀɢᴇ Nᴏᴛ Fᴏᴜɴᴅ : ${match}*\n\n`;
    _cmd_st += `*Aᴠᴀɪʟᴀʙʟᴇ Pᴀᴄᴋᴀɢᴇs* :\n`;
    categories.forEach((cat) => {
      _cmd_st += `├◈ ${cat}\n`;
    });
  } else {
    for (const cat of categories) {
      _cmd_st += `\n *╭────❒ ${cat.toUpperCase()} ❒*\n`;
      grouped[cat]
        .sort((a, b) => a.localeCompare(b))
        .forEach((cmdName) => {
          _cmd_st += ` *├◈ ${cmdName}*\n`;
        });
      _cmd_st += ` *┕──────────────────❒*\n`;
    }
  }

  _cmd_st += `\n *💐 𝐓ʜᴀɴᴋ 𝐘ᴏᴜ 𝐅ᴏʀ 𝐔sɪɴɢ 𝐑ᴀʙʙɪᴛ Xᴍᴅ 𝐁ᴏᴛ 💞*`;
}

const opts = {
  image: { url: getRandomPhoto() || "https://www.rabbit.zone.id/pzf1km.jpg" },
  caption: _cmd_st,
  mimetype: "image/jpeg",
  contextInfo: {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: "120363404737630340@newsletter",
      newsletterName: "𝐑ᴀʙʙɪᴛ Xᴍᴅ",
      serverMessageId: 6,
    },
  },
};


    // sendMessage: (jid, message) where message is an object like { image: {url}, caption, ... }
    await message.conn.sendMessage(message.from, opts);
  } catch (err) {
    console.error("❌ Menu command error:", err);
    await message.conn.sendMessage(message.from, {
      text: `❌ Error: ${err?.message || err}`,
    });
  }
});

// List command
Module({
  command: "list",
  package: "general",
  description: "List all available commands",
})(async (message) => {
  try {
    const aca = getCommands()
      .filter((cmd) => cmd && cmd.command && cmd.command !== "undefined")
      .map((cmd) => cmd.command)
      .join("\n");
    await message.conn.sendMessage(message.from, {
      text: `*List:*\n${aca}`,
    });
  } catch (err) {
    console.error("❌ List command error:", err);
    await message.conn.sendMessage(message.from, {
      text: `❌ Error: ${err?.message || err}`,
    });
  }
});

// Alive command
Module({
  command: "alive",
  package: "general",
  description: "Check if bot is alive",
})(async (message) => {
  try {
    const hostname = os.hostname();
    const time = new Date().toLocaleTimeString("en-ZA", {
      timeZone: "Africa/Johannesburg",
    });
    const ramUsedMB = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    const ctx = `
*${name}* is online
*Time:* ${time}
*Host:* ${hostname}
*RAM Usage:* ${ramUsedMB} MB
*Uptime:* ${hours}h ${minutes}m ${seconds}s
`;
    await message.conn.sendMessage(message.from, {
      image: { url: getRandomPhoto() },
      caption: ctx,
    });
  } catch (err) {
    console.error("❌ Alive command error:", err);
    await message.conn.sendMessage(message.from, {
      text: `❌ Error: ${err?.message || err}`,
    });
  }
});
