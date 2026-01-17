import fs from "fs";
import axios from "axios";
import fetch from "node-fetch";
import os from "os";
import path from "path";
import yts from "yt-search";
import { File } from "megajs";
import { promisify } from "util";
import stream from "stream";
import { fileURLToPath } from "url";
import { Module } from "../lib/plugins.js";

const pipeline = promisify(stream.pipeline);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const x = "AIzaSyDLH31M0HfyB7Wjttl6QQudyBEq5x9s1Yg";
// Helper: choose a working API from a list and a request path (full URL or path builder callback)
async function tryApis(apiList, buildUrlFn, options = {}) {
  for (const base of apiList) {
    try {
      const url =
        typeof buildUrlFn === "function"
          ? buildUrlFn(base)
          : buildUrlFn.replace("{base}", base);
      const res = await axios.get(url, { timeout: options.timeout || 25000 });
      if (res && res.data) return { base, data: res.data };
    } catch (e) {
      // continue to next
      continue;
    }
  }
  return null;
}

// Helper function to download video using the new API
async function downloadYtVideo(url, resolution = "720p") {
  console.log(url);
  const apiUrl = `https://api.privatezia.biz.id/api/downloader/ytmp4?url=${encodeURIComponent(
    url
  )}&resolution=${resolution}`;
  const response = await axios.get(apiUrl);

  if (!response.data || !response.data.success) {
    throw new Error("Failed to fetch video data from API");
  }

  return response.data.data;
}
// Helper: download stream to temp file
async function downloadToTemp(url, ext = "") {
  const tempDir = path.join(__dirname, "temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  const filename = `file_${Date.now()}${Math.random()
    .toString(36)
    .slice(2, 8)}${ext}`;
  const outPath = path.join(tempDir, filename);
  const res = await axios({
    method: "GET",
    url,
    responseType: "stream",
    timeout: 180000,
  });
  await pipeline(res.data, fs.createWriteStream(outPath));
  return outPath;
}
// Helper: safe cleanup
function safeUnlink(file) {
  try {
    if (file && fs.existsSync(file)) fs.unlinkSync(file);
  } catch (e) {}
}
// Common gift/quoted contact used previously
function makeGiftQuote(pushname, sender) {
  return {
    key: {
      fromMe: false,
      participant: `0@s.whatsapp.net`,
      remoteJid: "status@broadcast",
    },
    message: {
      contactMessage: {
        displayName: pushname || "User",
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${pushname || "User"};;\nFN:${
          pushname || "User"
        }\nitem1.TEL;waid=${(sender || "").split("@")[0]}:${
          (sender || "").split("@")[0]
        }\nitem1.X-ABLabel:WhatsApp\nEND:VCARD`,
      },
    },
  };
}
async function ytSearch(query, max = 10) {
  const url = `https://www.googleapis.com/youtube/v3/search?key=${x}&part=snippet&type=video&maxResults=${max}&q=${query}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(res.statusText);
  const data = await res.json();
  if (!data.items || !data.items.length) return [];
  return data.items.map((vid) => ({
    id: vid.id.videoId,
    title: vid.snippet.title,
    url: `https://www.youtube.com/watch?v=${vid.id.videoId}`,
    thumbnail: vid.snippet.thumbnails.high.url,
    channel: vid.snippet.channelTitle,
    publishedAt: vid.snippet.publishedAt,
  }));
}
async function downloadYtAudio(query) {
  const apiUrl = `https://api.privatezia.biz.id/api/downloader/ytplaymp3?query=${encodeURIComponent(
    query
  )}`;
  const response = await axios.get(apiUrl);

  if (!response.data || !response.data.status) {
    throw new Error("Failed to fetch audio data from API");
  }

  return response.data.result;
}
async function handleSongDownload(conn, input, message) {
  let videoUrl = input;
  let videoInfo = null;

  // Check if input is a URL or search query
  const urlRegex = /(?:youtube\.com\/.*v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

  if (!urlRegex.test(input)) {
    // Search for the song using the new API
    await message.react("🔍");

    try {
      const audioData = await downloadYtAudio(input);

      // Download the audio file
      await message.react("⬇️");
      const audioBuffer = await axios.get(audioData.downloadUrl, {
        responseType: "arraybuffer",
      });

      // Send audio with thumbnail and link preview
      await message.react("🎧");
      await conn.sendMessage(message.from, {
        audio: Buffer.from(audioBuffer.data),
        mimetype: "audio/mpeg",
        fileName: `${audioData.title}.mp3`,
        contextInfo: {
          externalAdReply: {
            title: audioData.title,
            body: `Duration: ${Math.floor(audioData.duration / 60)}:${(
              audioData.duration % 60
            )
              .toString()
              .padStart(2, "0")} | Quality: ${audioData.quality}`,
            thumbnail: await axios
              .get(audioData.thumbnail, { responseType: "arraybuffer" })
              .then((res) => Buffer.from(res.data)),
            mediaType: 2,
            mediaUrl: audioData.videoUrl,
            sourceUrl: audioData.videoUrl,
          },
        },
      });
    } catch (error) {
      // Fallback to old method if new API fails
      console.log("New API failed, falling back to old method:", error.message);
      await fallbackSongDownload(conn, input, message);
    }
  } else {
    // For URLs, use the old method
    await fallbackSongDownload(conn, input, message);
  }
}
// Helper function to handle video downloads
async function handleVideoDownload(conn, input, message, resolution = "720p") {
  let videoUrl = input;
  // Check if input is a URL or search query
  const urlRegex = /(?:youtube\.com\/.*v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  if (!urlRegex.test(input)) {
    // Search for the video
    await message.send("🔍 Searching...");
    const searchResults = await yts(input);
    if (!searchResults.videos || searchResults.videos.length === 0) {
      return await message.send("❌ No results found");
    }
    videoUrl = searchResults.videos[0].url;
  }
  // Download video
  await message.send(`⬇️ Downloading video in ${resolution}...`);
  const videoData = await downloadYtVideo(videoUrl, resolution);
  // Download the video file
  const videoBuffer = await axios.get(videoData.download_url, {
    responseType: "arraybuffer",
  });
  // Get thumbnail
  const thumbnailBuffer = await axios.get(videoData.thumbnail, {
    responseType: "arraybuffer",
  });
  // Send video with small link preview
  await conn.sendMessage(message.from, {
    video: Buffer.from(videoBuffer.data),
    caption: `*${videoData.title}*\n\n📹 Quality: ${
      videoData.format
    }\n⏱️ Duration: ${Math.floor(videoData.duration / 60)}:${(
      videoData.duration % 60
    )
      .toString()
      .padStart(2, "0")}`,
    jpegThumbnail: Buffer.from(thumbnailBuffer.data),
  });
}
Module({
  command: "yts",
  package: "search",
  description: "Search YouTube videos",
})(async (message, match) => {
  if (!match) return await message.send("Please provide a search query");
  const query = match.trim();
  const results = await ytSearch(query, 10);
  if (!results.length) return await message.send("❌ No results found");
  let reply = `*YouTube results for "${query}":*\n\n`;
  results.forEach((v, i) => {
    const date = new Date(v.publishedAt).toISOString().split("T")[0];
    reply += `⬢ ${i + 1}. ${v.title}\n   Channel: ${
      v.channel
    }\n   Published: ${date}\n   Link: ${v.url}\n\n`;
  });
  await message.send({
    image: { url: results[0].thumbnail },
    caption: reply,
  });
});
Module({
  command: "song",
  package: "downloader",
  description: "Download audio from YouTube",
})(async (message, match) => {
  if (!match) return message.send("_need a yt url or song name_");
  let input = match.trim();
  try {
    await handleSongDownload(message.conn, input, message);
  } catch (err) {
    console.error("[PLUGIN SONG] Error:", err?.message || err);
    await message.send("⚠️ Song download failed. Please try again later.");
  }
});
Module({
  command: "mp4",
  package: "downloader",
  description: "Download YouTube MP4",
})(async (message, match) => {
  if (!match) return message.send("_need a yt url or video name_");
  let input = match.trim();
  try {
    await handleVideoDownload(message.conn, input, message, "720p");
  } catch (err) {
    console.error("[PLUGIN MP4] Error:", err?.message || err);
    await message.send("⚠️ Video download failed. Please try again later.");
  }
});
Module({
  command: "video",
  package: "downloader",
  description: "Download YouTube Video",
})(async (message, match) => {
  if (!match) return message.send("_need a yt url or video name_");
  let input = match.trim();
  try {
    await handleVideoDownload(message.conn, input, message, "720p");
  } catch (err) {
    console.error("[PLUGIN VIDEO] Error:", err?.message || err);
    await message.send("⚠️ Video download failed. Please try again later.");
  }
});
Module({
  command: "ytv",
  package: "downloader",
  description: "Download YouTube Video",
})(async (message, match) => {
  if (!match) return message.send("_need a yt url or video name_");
  let input = match.trim();
  try {
    await handleVideoDownload(message.conn, input, message, "720p");
  } catch (err) {
    console.error("[PLUGIN YTV] Error:", err?.message || err);
    await message.send("⚠️ Video download failed. Please try again later.");
  }
});
Module({
  command: "yta",
  package: "downloader",
  description: "Download YouTube Audio",
})(async (message, match) => {
  if (!match) return message.send("_need a yt url or song name_");
  let input = match.trim();
  try {
    await handleSongDownload(message.conn, input, message);
  } catch (err) {
    console.error("[PLUGIN YTA] Error:", err?.message || err);
    await message.send("⚠️ Audio download failed. Please try again later.");
  }
});
Module({
  command: "ytmp3",
  package: "downloader",
  description: "Download YouTube MP3",
})(async (message, match) => {
  if (!match) return message.send("_need a yt url or song name_");
  let input = match.trim();
  try {
    await handleSongDownload(message.conn, input, message);
  } catch (err) {
    console.error("[PLUGIN YTMP3] Error:", err?.message || err);
    await message.send("⚠️ MP3 download failed. Please try again later.");
  }
});
/* ----------------- PLAY (MP3) ----------------- */
Module({
  command: "plaky",
  package: "downloader",
  description:
    "Download YouTube song using multiple APIs (PrivateZia / Zen / Finix)",
})(async (message, match) => {
  const q = (match || "").trim();
  if (!q)
    return message.send(
      "🎵 Please provide a song name!\n\nExample: .play On My Way"
    );
  try {
    await message.react("⏳");
    const apiList = ["https://api.privatezia.biz.id"];
    const result = await tryApis(
      apiList,
      (base) =>
        `${base}/api/downloader/ytplaymp3?query=${encodeURIComponent(q)}`,
      { timeout: 25000 }
    );
    if (!result || !result.data?.result)
      return message.send("❌ All APIs failed. Please try again later.");
    const r = result.data.result;
    const title = r.title || q;
    const thumbnail = r.thumbnail;
    const downloadUrl = r.downloadUrl || r.downloadUrlFull || r.url;
    if (!downloadUrl)
      return message.send("⚠️ No download URL returned by API.");
    // download to temp
    await message.react("⬇️");
    const tempPath = await downloadToTemp(downloadUrl, ".mp3");
    const buffer = fs.readFileSync(tempPath);
    // prepare externalAdReply style
    const contextInfo = {};
    if (thumbnail)
      contextInfo.externalAdReply = {
        title: title,
        body: `Duration: ${r.duration || "unknown"}`,
        thumbnail: await (async () => {
          try {
            const t = await axios.get(thumbnail, {
              responseType: "arraybuffer",
            });
            return Buffer.from(t.data);
          } catch (e) {
            return undefined;
          }
        })(),
        sourceUrl: r.videoUrl || r.video || "",
      };
    await message.conn.sendMessage(
      message.from,
      {
        audio: buffer,
        mimetype: "audio/mpeg",
        fileName: `${title.replace(/[^\w\s]/gi, "")}.mp3`,
        contextInfo,
      },
      {
        quoted: makeGiftQuote("𝐒uɱꪸ๏η 𝐃ɛ̚𝐯'ʬ 合", message.bot),
      }
    );
    await message.react("✅");
    safeUnlink(tempPath);
  } catch (err) {
    console.error("Play Error:", err);
    await message.react("❌");
    return message.send("❌ Something went wrong while fetching the song.");
  }
});

/* ----------------- GitClone ----------------- */
Module({
  command: "gitclone",
  package: "downloader",
  description: "Download GitHub repository as zip",
})(async (message, match) => {
  const arg = (match || "").trim();
  if (!arg)
    return message.send(
      "❌ Provide a GitHub link.\n\nExample:\n.gitclone https://github.com/username/repository"
    );
  try {
    const link = arg.split(/\s+/)[0];
    const regex = /github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?/i;
    const m = link.match(regex);
    if (!m) return message.send("⚠️ Invalid GitHub repository format.");
    const [, username, repo] = m;
    const zipUrl = `https://api.github.com/repos/${username}/${repo}/zipball`;
    // Confirm repository exists
    const head = await fetch(zipUrl, { method: "HEAD" });
    if (!head.ok) return message.send("Repository not found or private.");
    const filename = `${repo}.zip`;
    await message.conn.sendMessage(
      message.from,
      {
        document: { url: zipUrl },
        fileName: filename,
        mimetype: "application/zip",
        caption: `GitHub: ${username}/${repo}`,
      },
      { quoted: message.raw }
    );
    await message.react("✅");
  } catch (err) {
    console.error("GitClone Error:", err);
    await message.react("❌");
    return message.send(
      "❌ Failed to download repository. Please try again later."
    );
  }
});
/* ----------------- APK Downloader ----------------- */
Module({
  command: "apk",
  package: "downloader",
  description: "Download APK files using NexOracle API",
})(async (message, match) => {
  const appName = (match || "").trim();
  if (!appName) return message.send("*🏷️ Please provide an app name.*");
  try {
    await message.react("⏳");
    const apiUrl = `https://api.nexoracle.com/downloader/apk`;
    const params = { apikey: "free_key@maher_apis", q: appName };
    const res = await axios.get(apiUrl, { params }).catch(() => null);
    if (!res || !res.data || res.data.status !== 200 || !res.data.result) {
      await message.react("❌");
      return message.send("❌ Unable to find the APK. Please try again later.");
    }
    const { name, lastup, package: pkg, size, icon, dllink } = res.data.result;
    // send metadata first
    await message.conn.sendMessage(
      message.from,
      {
        image: { url: icon },
        caption: `\`「 APK DOWNLOADED 」\`\nName: ${name}\nUpdated: ${lastup}\nPackage: ${pkg}\nSize: ${size}\nSending APK...`,
      },
      { quoted: message.raw }
    );
    const apkRes = await axios
      .get(dllink, { responseType: "arraybuffer" })
      .catch(() => null);
    if (!apkRes || !apkRes.data) {
      await message.react("❌");
      return message.send("❌ Failed to download the APK.");
    }
    await message.conn.sendMessage(
      message.from,
      {
        document: Buffer.from(apkRes.data),
        mimetype: "application/vnd.android.package-archive",
        fileName: `${name}.apk`,
        caption: "APK file",
      },
      { quoted: message.raw }
    );
    await message.react("✅");
  } catch (err) {
    console.error("APK Error:", err);
    await message.react("❌");
    return message.send("❌ Unable to fetch APK details.");
  }
});
/* ----------------- YT Community Post ----------------- */
Module({
  command: "ytpost",
  package: "downloader",
  description: "Download YouTube community post (text + images)",
})(async (message, match) => {
  const q = (match || "").trim();
  if (!q)
    return message.send("❌ Please provide a YouTube community post URL.");
  try {
    await message.react("⏳");
    const apiUrl = `https://api.siputzx.my.id/api/d/ytpost?url=${encodeURIComponent(
      q
    )}`;
    const { data } = await axios.get(apiUrl);
    if (!data?.status || !data?.data) {
      await message.react("❌");
      return message.send("⚠️ Failed to fetch the community post.");
    }
    const post = data.data;
    const caption = `📢 *YouTube Community Post*\n📝 *Content:* ${
      post.content || "No text content."
    }`;
    if (post.images && post.images.length > 0) {
      for (let i = 0; i < post.images.length; i++) {
        await message.conn.sendMessage(
          message.from,
          {
            image: { url: post.images[i] },
            caption: i === 0 ? caption : undefined,
          },
          { quoted: message.raw }
        );
      }
    } else {
      await message.send(caption);
    }
    await message.react("✅");
  } catch (err) {
    console.error("YTPOST Error:", err);
    await message.react("❌");
    return message.send(
      "❌ Something went wrong while fetching the YouTube post."
    );
  }
});
/* ----------------- Pinterest ----------------- */
Module({
  command: "pinterest",
  package: "downloader",
  description: "Download images or videos from Pinterest",
})(async (message, match) => {
  const q = (match || "").trim();
  if (!q) return message.send("❌ Please provide a Pinterest URL!");
  if (!q.includes("pinterest.com") && !q.includes("pin.it"))
    return message.send("❌ Invalid Pinterest link!");
  try {
    await message.react("⏳");
    const api1 = `https://api.privatezia.biz.id/api/downloader/pinterestdl?url=${encodeURIComponent(
      q
    )}`;
    const api2 = `https://bk9.fun/download/pinterest?url=${encodeURIComponent(
      q
    )}`;
    let data;
    try {
      const r = await axios.get(api1, { timeout: 20000 });
      data = r.data?.data?.medias;
    } catch {
      const r = await axios.get(api2, { timeout: 20000 });
      data = r.data?.BK9;
    }
    if (!data || data.length === 0) {
      await message.react("❌");
      return message.send("⚠️ No downloadable media found!");
    }
    const video = data.find((i) => i.url && i.extension === "mp4");
    const image = data.find((i) => i.url && i.extension !== "mp4");
    if (video) {
      await message.conn.sendMessage(
        message.from,
        {
          video: { url: video.url },
          mimetype: "video/mp4",
          caption: "Pinterest Video",
        },
        { quoted: message.raw }
      );
    } else {
      await message.conn.sendMessage(
        message.from,
        { image: { url: image.url }, caption: "Pinterest Image" },
        { quoted: message.raw }
      );
    }
    await message.react("✅");
  } catch (err) {
    console.error("Pinterest Error:", err);
    await message.react("❌");
    return message.send("⚠️ Failed to download Pinterest media.");
  }
});
/* ----------------- Mega.nz Downloader ----------------- */
Module({
  command: "mega",
  package: "downloader",
  description: "Download files from Mega.nz",
})(async (message, match) => {
  const q = (match || "").trim();
  if (!q) return message.send("❌ Please provide a Mega.nz link!");
  try {
    await message.react("⏳");
    const file = File.fromURL(q);
    const data = await new Promise((resolve, reject) =>
      file.download((err, data) => (err ? reject(err) : resolve(data)))
    );
    const fileName = file.name || `mega_file_${Date.now()}`;
    const savePath = path.join(os.tmpdir(), fileName);
    fs.writeFileSync(savePath, data);
    await message.conn.sendMessage(
      message.from,
      {
        document: fs.readFileSync(savePath),
        fileName,
        mimetype: "application/octet-stream",
        caption: `Downloaded from Mega.nz: ${fileName}`,
      },
      { quoted: message.raw }
    );
    fs.unlinkSync(savePath);
    await message.react("✅");
  } catch (err) {
    console.error("MegaDL Error:", err);
    await message.react("❌");
    return message.send("❌ Failed to download from Mega.nz.");
  }
});
