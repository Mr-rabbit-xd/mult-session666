// ============================================
// lib/messageHandler.js - Message Router
// ============================================
import { plugins } from "./plugins/index.js";
import { botOwners } from "./session.js";
import { getGroupSettings } from "./database.js";

export async function handleMessages(sock, messages, sessionId) {
  for (const msg of messages) {
    if (!msg.message || msg.key.fromMe) continue;

    const from = msg.key.remoteJid;
    const sender = msg.key.participant || from;
    const isGroup = from.endsWith("@g.us");
    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      msg.message.videoMessage?.caption ||
      "";

    if (!body) continue;

    const args = body.trim().split(/\s+/);
    const command = args[0].toLowerCase();
    const isOwner = botOwners.includes(sender.split("@")[0]);

    // Get group admin status
    let isAdmin = false;
    if (isGroup) {
      try {
        const groupMetadata = await sock.groupMetadata(from);
        const participant = groupMetadata.participants.find(
          (p) => p.id === sender
        );
        isAdmin =
          participant?.admin === "admin" || participant?.admin === "superadmin";
      } catch (error) {
        console.error("Error getting group metadata:", error);
      }
    }

    const context = {
      sock,
      msg,
      from,
      sender,
      body,
      args,
      command,
      isGroup,
      isOwner,
      isAdmin,
      sessionId,
    };

    // Execute plugins
    for (const plugin of plugins) {
      if (plugin.pattern && plugin.pattern.test(command)) {
        // Check permissions
        if (plugin.ownerOnly && !isOwner) {
          await sock.sendMessage(
            from,
            {
              text: "❌ This command is only for bot owner!",
            },
            { quoted: msg }
          );
          continue;
        }

        if (plugin.adminOnly && !isAdmin && !isOwner) {
          await sock.sendMessage(
            from,
            {
              text: "❌ This command is only for group admins!",
            },
            { quoted: msg }
          );
          continue;
        }

        if (plugin.groupOnly && !isGroup) {
          await sock.sendMessage(
            from,
            {
              text: "❌ This command is only for groups!",
            },
            { quoted: msg }
          );
          continue;
        }

        try {
          await plugin.execute(context);
        } catch (error) {
          console.error(`Error executing plugin ${plugin.name}:`, error);
          await sock.sendMessage(
            from,
            {
              text: `❌ Error: ${error.message}`,
            },
            { quoted: msg }
          );
        }
        break;
      }
    }
  }
}

async function handleGroupUpdate(sock, update, sessionId) {
  const { id, participants, action } = update;
  const settings = getGroupSettings(id);

  if (!settings.welcome && !settings.goodbye) return;

  for (const participant of participants) {
    if (action === "add" && settings.welcome) {
      await sock.sendMessage(id, {
        text: `👋 Welcome @${participant.split("@")[0]} to the group!`,
        mentions: [participant],
      });
    } else if (action === "remove" && settings.goodbye) {
      await sock.sendMessage(id, {
        text: `👋 Goodbye @${participant.split("@")[0]}!`,
        mentions: [participant],
      });
    }
  }

  // Anti-promote/demote
  if (
    (action === "promote" || action === "demote") &&
    settings[`anti${action}`]
  ) {
    for (const participant of participants) {
      const oppositeAction = action === "promote" ? "demote" : "promote";
      await sock.groupParticipantsUpdate(id, [participant], oppositeAction);
    }
  }
}
