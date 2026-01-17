import axios from "axios";
import yts from "yt-search";
import { Module } from "../lib/plugins.js";

Module({
  command: "play",
  package: "youtube",
  description: "Play song from YouTube (API based)",
})(async (message, match) => {
  try {
    if (!match) {
      return message.send("❌ Song name dao\n\n.play love nwantiti");
    }

    await message.react("🔍");

    // 1️⃣ YouTube search
    const res = await yts(match);
    if (!res.videos || res.videos.length === 0) {
      return message.send("❌ Kono video paoa jay nai");
    }

    const video = res.videos[0];

    // Send Now Playing message
await message.send(opts);
    

// 2️⃣ Caption (WITH Powered By)
const caption = `
🎵 *Now Playing*

Pᴏᴡᴇʀᴇᴅ Bʏ Rᴀʙʙɪᴛ Xᴍᴅ Mɪɴɪ

📌 *Title:* ${video.title}
👤 *Channel:* ${video.author.name}
⏱️ *Duration:* ${video.timestamp}

⬇️ *Downloading audio...*
`.trim();

// 3️⃣ opts (YouTube thumbnail ব্যবহার হবে)
const opts = {
  image: { url: video.thumbnail }, // ✅ YouTube thumbnail
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



    // Send Now Playing message
    await message.send(opts);

    // 4️⃣ Call your API with YouTube link
    const apiUrl =
      "https://api-aswin-sparky.koyeb.app/api/downloader/song?search=" +
      encodeURIComponent(video.url);

    const { data } = await axios.get(apiUrl, { timeout: 30000 });

    if (!data || !data.status || !data.data?.url) {
      return message.send("❌ Audio download failed");
    }

    // 5️⃣ Send audio
    await message.send({
      audio: { url: data.data.url },
      mimetype: "audio/mpeg",
      fileName: `${data.data.title || video.title}.mp3`,
      contextInfo: {
        externalAdReply: {
          title: data.data.title || video.title,
          body: "Powered By Rabbit Xmd Mini",
          mediaType: 2,
          sourceUrl: video.url,
          thumbnailUrl: video.thumbnail,
        },
      },
    });

    await message.react("🎧");

  } catch (err) {
    console.error("[PLAY ERROR]", err);
    await message.send("⚠️ Play failed");
  }
});
