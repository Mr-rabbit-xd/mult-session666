
import os from "os";
import { Module } from "../lib/plugins.js";
import config from "../config.js";
Module({
  command: "alive",
  package: "general",
  description: "Check if bot is alive",
})(async (message) => {
  try {
    const hostname = os.hostname();
    // Indian Time
    const time = new Date().toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: false, // 24-hour format
    });

    const ramUsedMB = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const caption = `
💜🦋💗 𝐁ᴏᴛ 𝐀ʟɪᴠᴇ 💗🦋💜

🌸 𝐁ᴏᴛ ɴᴀᴍᴇ: 𝐑ᴀʙʙɪᴛ Xᴍᴅ 🌸
⚡ 𝐓ɪᴍᴇ (IST): ${time}
🏠 𝐇ᴏsᴛ: 𝐑ᴀʙʙɪᴛ𝐇ᴏsᴛ
💾 𝐑ᴀᴍ 𝐔sᴀɢᴇ: ${ramUsedMB} MB
⏱ 𝐔ᴘᴛɪᴍᴇ: ${hours}h ${minutes}m ${seconds}s

🎀 𝐄ɴᴊᴏʏ ʏᴏᴜʀ ʙᴏᴛ! 🌷🦋💖
    `.trim();

    const opts = {
      image: { url: "https://www.rabbit.zone.id/pzf1km.jpg" },
      caption: caption,
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

    await message.conn.sendMessage(message.from, opts);
  } catch (err) {
    console.error("❌ Alive command error:", err);
    await message.conn.sendMessage(message.from, {
      text: `❌ Error: ${err?.message || err}`,
    });
  }
});
