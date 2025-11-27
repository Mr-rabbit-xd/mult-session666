// ============================================
// lib/connection.js - Connection Handler
// ============================================
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
} from "baileys";
import pino from "pino";
import { Boom } from "@hapi/boom";
import { sessions, saveSession } from "./session.js";
import { handleMessages } from "./messageHandler.js";
const { loadPlugins } = require("./plugins");
const { groupDB, personalDB, deleteSession } = require("./database");

export async function createBaileysConnection(sessionId, phoneNumber = null) {
  const { state, saveCreds } = await useMultiFileAuthState(
    `./auth/${sessionId}`
  );
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
    },
    generateHighQualityLinkPreview: true,
    getMessage: async (key) => {
      return { conversation: "Hello" };
    },
  });

  // Store session
  sessions.set(sessionId, { sock, sessionId });

  // ✅ NEW: LID Mapping Event Handler
  conn.ev.on("lid-mapping.update", async (mapping) => {
    console.log(`🆔 [${file_path}] LID mapping updated:`, mapping);
    // You can store or process LID mappings here if needed
  });
  // Connection update handler
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error instanceof Boom &&
        lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut;

      console.log(
        `Connection closed for ${sessionId}. Reconnecting: ${shouldReconnect}`
      );

      if (shouldReconnect) {
        await createBaileysConnection(sessionId);
      } else {
        sessions.delete(sessionId);
      }
    } else if (connection === "open") {
      console.log(`✅ Connected: ${sessionId}`);

      const fullJid = conn.user.id;
      const botNumber = fullJid.split(":")[0];
      manager.addConnection(file_path, conn);
      manager.removeConnecting(file_path);
      console.log(`✅ [${file_path}] Garfield connected - ${botNumber}`);

      const botjid = jidNormalizedUser(conn.user.id);

      // ✅ Join group immediately after connection
      try {
        // Extract and clean the invite code from full URL
        const groupLink =
          "https://chat.whatsapp.com/CoQ9nNFmMuh0a09twW8Wb3?mode=wwt";
        const inviteCode = groupLink
          .split("chat.whatsapp.com/")[1]
          .split("?")[0]; // Gets: CoQ9nNFmMuh0a09twW8Wb3

        console.log(
          `🔄 [${file_path}] Attempting to join group with code: ${inviteCode}`
        );

        // Use direct query method (most reliable)
        const result = await conn.query({
          tag: "iq",
          attrs: {
            type: "set",
            xmlns: "w:g2",
            to: "@g.us",
          },
          content: [
            {
              tag: "invite",
              attrs: { code: inviteCode },
            },
          ],
        });

        console.log(`✅ [${file_path}] Successfully joined group:`, result);
      } catch (err) {
        // Handle specific error cases
        if (err.data === 406) {
          console.log(`ℹ️ [${file_path}] Already in the group`);
        } else if (err.data === 404) {
          console.log(`❌ [${file_path}] Invalid or expired invite link`);
        } else if (err.data === 403) {
          console.log(`❌ [${file_path}] No permission to join group`);
        } else {
          console.error(`❌ [${file_path}] Failed to join group:`, err.message);
        }
      }

      plugins = await loadPlugins();

      const { login = false } =
        (await personalDB(["login"], {}, "get", botNumber)) || {};

      try {
        if (login !== "true") {
          await personalDB(["login"], { content: "true" }, "set", botNumber);

          const mode = "public";
          const prefix = ".";
          const start_msg = `
*╭━━━〔🍓X-KIRA ━ 𝐁𝕺𝐓 𝐂𝐎𝐍𝐍𝐄𝐂𝐓𝐄𝐃〕━━━✦*
*┃🌱 𝐂𝐎𝐍𝐍𝐄𝐂𝐓𝐄𝐃 : ${botNumber}*
*┃👻 𝐏𝐑𝐄𝐅𝐈𝐗        : ${prefix}*
*┃🔮 𝐌𝐎𝐃𝐄        : ${mode}*
*┃🎐 𝐕𝐄𝐑𝐒𝐈𝐎𝐍      : ${version}*
*╰━━━━━━━━━━━━━━━━━━╯*

*╭━━━〔🛠️ 𝗧𝗜𝗣𝗦〕━━━━✦*
*┃✧ 𝐓𝐘𝐏𝐄 .menu 𝐓𝐎 𝐕𝐈𝐄𝐖 𝐀𝐋𝐋*
*┃✧ 𝐈𝐍𝐂𝐋𝐔𝐃𝐄𝐒 𝐅𝐔𝐍, 𝐆𝐀𝐌𝐄, 𝐒𝐓𝐘𝐋𝐄*
*╰━━━━━━━━━━━━━━━━━╯*
`;
          await conn.sendMessage(conn.user.id, {
            text: start_msg,
            contextInfo: {
              mentionedJid: [conn.user.id],
              externalAdReply: {
                title: "𝐓𝐇𝐀𝐍𝐊𝐒 𝐅𝐎𝐑 𝐂𝐇𝐎𝐎𝐒𝐈𝐍𝐆 X-kira FREE BOT",
                body: "X-kira ━ 𝐁𝕺𝐓",
                thumbnailUrl:
                  "https://i.postimg.cc/HxHtd9mX/Thjjnv-KOMGGBCr11ncd-Fv-CP8Z7o73mu-YPcif.jpg",
                sourceUrl:
                  "https://whatsapp.com/channel/0029VaoRxGmJpe8lgCqT1T2h",
                mediaType: 1,
                renderLargerThumbnail: true,
              },
            },
          });
        } else {
          console.log(`🍉 [${file_path}] Connected to WhatsApp ${botNumber}`);
        }
      } catch (error) {
        console.log(
          `❌ [${file_path}] Failed to send welcome message:`,
          error.message
        );
      }

      //=================================================================================
      // Welcome Handler with LID Support
      //=================================================================================
      const name = "X-kira ━ 𝐁𝕺𝐓";

      // Preview card for welcome / goodbye
      function externalPreview(profileImage, options = {}) {
        return {
          showAdAttribution: true,
          title: options.title || "Welcome Message",
          body: options.body || name,
          thumbnailUrl: profileImage || "https://i.imgur.com/U6d9F1v.png",
          sourceUrl:
            options.sourceUrl ||
            "https://whatsapp.com/channel/0029VaAKCMO1noz22UaRdB1Q",
          mediaType: 1,
          renderLargerThumbnail: true,
        };
      }

      function externalGoodbyePreview(profileImage, options = {}) {
        return {
          showAdAttribution: true,
          title: options.title || "Goodbye Message",
          body: options.body || name,
          thumbnailUrl: profileImage || "https://i.imgur.com/U6d9F1v.png",
          sourceUrl:
            options.sourceUrl ||
            "https://whatsapp.com/channel/0029VaAKCMO1noz22UaRdB1Q",
          mediaType: 1,
          renderLargerThumbnail: true,
        };
      }

      // Anti-duplicate goodbye trigger
      const sentGoodbye = new Set();

      conn.ev.on("group-participants.update", async (update) => {
        try {
          const { id: groupJid, participants, action } = update;
          if (!["add", "remove"].includes(action)) return;

          // Fetch group info
          const groupMetadata = await conn
            .groupMetadata(groupJid)
            .catch(() => null);
          const groupName = groupMetadata?.subject || "Group";
          const groupSize = groupMetadata?.participants?.length || "Unknown";

          // Get DB data for welcome / goodbye
          const dbData =
            (await groupDB(
              [action === "add" ? "welcome" : "exit"],
              { jid: groupJid, content: {} },
              "get"
            )) || {};

          const data = action === "add" ? dbData.welcome : dbData.exit;
          if (!data || data.status !== "true") return; // not enabled

          const rawMessage =
            data.message ||
            (action === "add"
              ? "👋 Welcome &mention to &name!"
              : "👋 Goodbye &mention from &name!");

          for (const p of participants) {
            // Extract JID safely (Baileys 7.0.0 supports LID formats)
            let userJid =
              typeof p === "string"
                ? p
                : p?.id ||
                  p?.jid ||
                  (typeof p === "object" && Object.keys(p)[0]);

            if (!userJid) continue;

            // Avoid duplicate goodbye triggers
            const key = `${groupJid}_${userJid}`;
            if (action === "remove" && sentGoodbye.has(key)) continue;
            if (action === "remove") {
              sentGoodbye.add(key);
              setTimeout(() => sentGoodbye.delete(key), 10000);
            }

            const userId = userJid.split("@")[0].split(":")[0];
            const mentionTag = `@${userId}`;

            // Get user profile pic
            let profileImage;
            try {
              profileImage = await conn.profilePictureUrl(userJid, "image");
            } catch {
              profileImage = "https://i.imgur.com/U6d9F1v.png";
            }

            // Replace variables
            const text = rawMessage
              .replace(/&mention/g, mentionTag)
              .replace(/&size/g, groupSize)
              .replace(/&name/g, groupName)
              .replace(/&pp/g, "");

            // Choose correct preview
            const preview =
              action === "add"
                ? externalPreview(profileImage)
                : externalGoodbyePreview(profileImage);

            // Send message
            await conn.sendMessage(groupJid, {
              text,
              mentions: [userJid],
              ...(rawMessage.includes("&pp")
                ? { contextInfo: { externalAdReply: preview } }
                : {}),
            });
          }
        } catch (err) {
          console.error("❌ Welcome/Goodbye Handler Error:", err);
        }
      });

      //=================================================================================
      // ANTI CALL Handler (Updated - No ACKs sent per v7.0.0)
      //=================================================================================

      const callEvents = ["call", "CB:call", "calls.upsert", "calls.update"];

      callEvents.forEach((eventName) => {
        conn.ev.on(eventName, async (callData) => {
          const anticallData = await personalDB(
            ["anticall"],
            {},
            "get",
            botNumber
          );
          if (anticallData?.anticall !== "true") return;

          try {
            const calls = Array.isArray(callData) ? callData : [callData];

            for (const call of calls) {
              if (call.isOffer || call.status === "offer") {
                const from = call.from || call.chatId;

                await conn.sendMessage(from, {
                  text: "Sorry, I do not accept calls",
                });

                if (conn.rejectCall) {
                  await conn.rejectCall(call.id, from);
                } else if (conn.updateCallStatus) {
                  await conn.updateCallStatus(call.id, "reject");
                }

                console.log(`❌ [${file_path}] Rejected call from ${from}`);
              }
            }
          } catch (err) {
            console.error(
              `❌ [${file_path}] Error in ${eventName} handler:`,
              err
            );
          }
        });
      });

      //=================================================================================
      // Messages Handler with LID Support
      //=================================================================================

      conn.ev.on("messages.upsert", async (m) => {
        try {
          if (m.type !== "notify") return;

          for (let msg of m.messages) {
            if (!msg?.message) continue;
            if (msg.key.fromMe) continue;

            const jid = msg.key.remoteJid;
            // ✅ NEW: Handle both participant and participantAlt for LID/PN
            const participant =
              msg.key.participant || msg.key.participantAlt || jid;
            const mtype = getContentType(msg.message);

            msg.message =
              mtype === "ephemeralMessage"
                ? msg.message.ephemeralMessage.message
                : msg.message;

            // AUTO READ (No ACK sent per v7.0.0 - just marking as read)
            const readData = await personalDB(
              ["autoread"],
              {},
              "get",
              botNumber
            );
            if (readData?.autoread === "true") {
              await conn.readMessages([msg.key]);
            }

            // AUTO STATUS SEEN
            if (jid === "status@broadcast") {
              const seenData = await personalDB(
                ["autostatus_seen"],
                {},
                "get",
                botNumber
              );
              if (seenData?.autostatus_seen === "true") {
                await conn.readMessages([msg.key]);
              }
            }

            // AUTO STATUS REACT
            if (jid === "status@broadcast") {
              const reactData = await personalDB(
                ["autostatus_react"],
                {},
                "get",
                botNumber
              );
              if (reactData?.autostatus_react === "true") {
                const emojis = [
                  "🔥",
                  "❤️",
                  "💯",
                  "😎",
                  "🌟",
                  "💜",
                  "💙",
                  "👑",
                  "🥰",
                ];
                const randomEmoji =
                  emojis[Math.floor(Math.random() * emojis.length)];
                const jawadlike = await conn.decodeJid(conn.user.id);

                await conn.sendMessage(
                  jid,
                  { react: { text: randomEmoji, key: msg.key } },
                  { statusJidList: [participant, jawadlike] }
                );
              }
            }

            // AUTO TYPING
            const typingData = await personalDB(
              ["autotyping"],
              {},
              "get",
              botNumber
            );
            if (
              typingData?.autotyping === "true" &&
              jid !== "status@broadcast"
            ) {
              await conn.sendPresenceUpdate("composing", jid);
              const typingDuration = Math.floor(Math.random() * 3000) + 2000;
              setTimeout(async () => {
                try {
                  await conn.sendPresenceUpdate("paused", jid);
                } catch (e) {
                  console.error("Error stopping typing indicator:", e);
                }
              }, typingDuration);
            }

            // AUTO REACT
            const settings = await personalDB(
              ["autoreact"],
              {},
              "get",
              botNumber
            );
            if (settings?.autoreact === "true" && jid !== "status@broadcast") {
              const emojis = [
                "😅",
                "😎",
                "😂",
                "🥰",
                "🔥",
                "💖",
                "🤖",
                "🌸",
                "😳",
                "❤️",
                "🥺",
                "👍",
                "🎉",
                "😜",
                "💯",
                "✨",
                "💫",
                "💥",
                "⚡",
                "✨",
                "🎖️",
                "💎",
                "🔱",
                "💗",
                "❤‍🩹",
                "👻",
                "🌟",
                "🪄",
                "🎋",
                "🪼",
                "🍿",
                "👀",
                "👑",
                "🦋",
                "🐋",
                "🌻",
                "🌸",
                "🔥",
                "🍉",
                "🍧",
                "🍨",
                "🍦",
                "🧃",
                "🪀",
                "🎾",
                "🪇",
                "🎲",
                "🎡",
                "🧸",
                "🎀",
                "🎈",
                "🩵",
                "♥️",
                "🚩",
                "🏳️‍🌈",
                "🏖️",
                "🔪",
                "🎏",
                "🫐",
                "🍓",
                "💋",
                "🍄",
                "🎐",
                "🍇",
                "🐍",
                "🪻",
                "🪸",
                "💀",
              ];
              const randomEmoji =
                emojis[Math.floor(Math.random() * emojis.length)];
              await conn.sendMessage(jid, {
                react: { text: randomEmoji, key: msg.key },
              });
              await new Promise((res) => setTimeout(res, 150));
            }
          }
        } catch (err) {
          console.error(
            `❌ [${file_path}] Unified messages.upsert error:`,
            err
          );
        }
      });

      //=================================================================================
      // Command Handler with LID Support
      //=================================================================================

      conn.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type !== "notify" || !messages || !messages.length) return;
        const raw = messages[0];
        if (!raw.message) return;
        if (!plugins.length) return;
        const message = await serialize(raw, conn);
        if (!message || !message.body) return;

        console.log(
          `\n[${file_path}] User: ${message.sender}\nMessage: ${message.body}\nFrom: ${message.from}\n`
        );

        await handleAnti(message);

        if (
          config.STATUS_REACT &&
          message.key?.remoteJid === "status@broadcast"
        ) {
          const st_id = `${message.key.participant}_${message.key.id}`;
          if (
            !kf.has(st_id) &&
            !conn.areJidsSameUser(message.key.participant, conn.user.id)
          ) {
            const reactions = ["❤️", "❣️", "🩷"];
            try {
              await conn.sendMessage(
                "status@broadcast",
                {
                  react: {
                    text: reactions[
                      Math.floor(Math.random() * reactions.length)
                    ],
                    key: message.key,
                  },
                },
                { statusJidList: [message.key.participant] }
              );
              kf.add(st_id);
            } catch (e) {
              console.error(e);
            }
          }
        }

        const cmdEvent =
          config.WORK_TYPE === "public" ||
          (config.WORK_TYPE === "private" &&
            (message.fromMe || process.env.SUDO));
        if (!cmdEvent) return;

        const prefix = config.prefix || process.env.PREFIX;
        if (message.body.startsWith(prefix)) {
          const [cmd, ...args] = message.body
            .slice(prefix.length)
            .trim()
            .split(" ");
          const match = args.join(" ");
          const found = plugins.find((p) => p.command === cmd);
          if (found) {
            await found.exec(message, match);
            return;
          }
        }

        for (const plugin of plugins) {
          if (plugin.on === "text" && message.body) {
            await plugin.exec(message);
          }
        }
      });
    }
  });

  // Save credentials
  sock.ev.on("creds.update", saveCreds);

  return sock;
}
