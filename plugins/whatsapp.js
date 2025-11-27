const { Module } = require("../lib/plugins");
const config = require("../config");
const { getTheme } = require("../Themes/themes");
const axios = require("axios");
const theme = getTheme();

// ==================== USER MANAGEMENT ====================

Module({
  command: "block",
  package: "owner",
  description: "Block a user",
  usage: ".block <reply|tag|number>",
})(async (message, match) => {
  try {
    if (!message.isFromMe) return message.send(theme.isFromMe);

    let jid;
    if (message.quoted) {
      // ✅ NEW: Handle both participant and participantAlt
      jid = message.quoted.participant || message.quoted.participantAlt || message.quoted.sender;
    } else if (message.mentions?.[0]) {
      jid = message.mentions[0];
    } else if (match) {
      const number = match.replace(/[^0-9]/g, "");
      jid = number ? `${number}@s.whatsapp.net` : null;
    }

    if (!jid) {
      return message.send(
        "❌ _Reply to a user, mention them, or provide number_\n\n*Example:*\n• .block (reply)\n• .block @user\n• .block 1234567890"
      );
    }

    await message.react("⏳");
    await message.blockUser(jid);
    await message.react("✅");

    await message.send(
      `✅ *User Blocked*\n\n@${jid.split("@")[0]} has been blocked`,
      {
        mentions: [jid],
      }
    );
  } catch (error) {
    console.error("Block command error:", error);
    await message.react("❌");
    await message.send("❌ _Failed to block user_");
  }
});

Module({
  command: "unblock",
  package: "owner",
  description: "Unblock a user",
  usage: ".unblock <reply|tag|number>",
})(async (message, match) => {
  try {
    if (!message.isFromMe) return message.send(theme.isFromMe);

    let jid;
    if (message.quoted) {
      // ✅ NEW: Handle both participant and participantAlt
      jid = message.quoted.participant || message.quoted.participantAlt || message.quoted.sender;
    } else if (message.mentions?.[0]) {
      jid = message.mentions[0];
    } else if (match) {
      const number = match.replace(/[^0-9]/g, "");
      jid = number ? `${number}@s.whatsapp.net` : null;
    }

    if (!jid) {
      return message.send(
        "❌ _Reply to a user, mention them, or provide number_\n\n*Example:*\n• .unblock (reply)\n• .unblock @user\n• .unblock 1234567890"
      );
    }

    await message.react("⏳");
    await message.unblockUser(jid);
    await message.react("✅");

    await message.send(
      `✅ *User Unblocked*\n\n@${jid.split("@")[0]} has been unblocked`,
      {
        mentions: [jid],
      }
    );
  } catch (error) {
    console.error("Unblock command error:", error);
    await message.react("❌");
    await message.send("❌ _Failed to unblock user_");
  }
});

Module({
  command: "blocklist",
  package: "owner",
  description: "Get list of blocked users",
})(async (message) => {
  try {
    if (!message.isFromMe) return message.send(theme.isFromMe);

    await message.react("⏳");

    const blockedUsers = await message.conn.fetchBlocklist();

    if (!blockedUsers || blockedUsers.length === 0) {
      await message.react("ℹ️");
      return message.send("ℹ️ _No blocked users_");
    }

    let text = `╭━━━「 *BLOCKED USERS* 」━━━╮\n┃\n`;

    const showCount = Math.min(blockedUsers.length, 50);
    for (let i = 0; i < showCount; i++) {
      text += `┃ ${i + 1}. @${blockedUsers[i].split("@")[0]}\n`;
    }

    text += `┃\n╰━━━━━━━━━━━━━━━━━━╯\n\n*Total:* ${blockedUsers.length} user(s)`;

    if (blockedUsers.length > 50) {
      text += `\n\n_Showing first 50 of ${blockedUsers.length} blocked users_`;
    }

    await message.react("✅");
    await message.send(text, { mentions: blockedUsers.slice(0, 50) });
  } catch (error) {
    console.error("Blocklist command error:", error);
    await message.react("❌");
    await message.send("❌ _Failed to fetch blocklist_");
  }
});

Module({
  command: "unblockall",
  package: "owner",
  description: "Unblock all blocked users",
})(async (message) => {
  try {
    if (!message.isFromMe) return message.send(theme.isFromMe);

    const blocklist = await message.conn.fetchBlocklist();

    if (!blocklist || blocklist.length === 0) {
      return message.send("ℹ️ _No blocked users_");
    }

    await message.react("⏳");
    await message.send(`⏳ _Unblocking ${blocklist.length} users..._`);

    let unblocked = 0;
    let failed = 0;

    for (const jid of blocklist) {
      try {
        await message.unblockUser(jid);
        unblocked++;
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch {
        failed++;
      }
    }

    await message.react("✅");
    await message.send(
      `✅ *Unblock Complete*\n\n• Unblocked: ${unblocked}\n• Failed: ${failed}`
    );
  } catch (error) {
    console.error("UnblockAll command error:", error);
    await message.react("❌");
    await message.send("❌ _Failed to unblock users_");
  }
});

// ==================== PROFILE MANAGEMENT ====================

Module({
  command: "setpp",
  package: "owner",
  aliases: ["setdp", "setprofile"],
  description: "Set bot profile picture",
  usage: ".setpp <reply to image | url>",
})(async (message, match) => {
  try {
    if (!message.isFromMe) return message.send(theme.isFromMe);

    let buffer;

    if (match && match.startsWith("http")) {
      // Download from URL
      await message.react("⏳");
      const response = await axios.get(match, {
        responseType: "arraybuffer",
        timeout: 30000,
      });
      buffer = Buffer.from(response.data);
    } else if (message.type === "imageMessage") {
      buffer = await message.download();
    } else if (message.quoted?.type === "imageMessage") {
      buffer = await message.quoted.download();
    } else {
      return message.send(
        "❌ _Send image, reply to image, or provide URL_\n\n*Methods:*\n• Send image with .setpp\n• Reply to image with .setpp\n• .setpp <image_url>"
      );
    }

    await message.react("⏳");
    // ✅ NEW: Use bot's own JID
    const botJid = message.conn.user.id;
    await message.setPp(botJid, buffer);
    await message.react("✅");

    await message.send(
      "✅ *Profile Picture Updated*\n\nBot profile picture has been changed"
    );
  } catch (error) {
    console.error("SetPP command error:", error);
    await message.react("❌");
    await message.send("❌ _Failed to update profile picture_");
  }
});

Module({
  command: "removepp",
  package: "owner",
  aliases: ["removedp", "deletepp"],
  description: "Remove bot profile picture",
})(async (message) => {
  try {
    if (!message.isFromMe) return message.send(theme.isFromMe);

    await message.react("⏳");
    
    // ✅ NEW: Properly remove profile picture
    const botJid = message.conn.user.id;
    await message.conn.removeProfilePicture(botJid);
    
    await message.react("✅");

    await message.send(
      "✅ *Profile Picture Removed*\n\nBot profile picture has been deleted"
    );
  } catch (error) {
    console.error("RemovePP command error:", error);
    await message.react("❌");
    await message.send("❌ _Failed to remove profile picture_");
  }
});

Module({
  command: "setname",
  package: "owner",
  description: "Set bot display name",
  usage: ".setname <name>",
})(async (message, match) => {
  try {
    if (!message.isFromMe) return message.send(theme.isFromMe);

    if (!match || match.trim().length === 0) {
      return message.send("❌ _Provide new name_\n\n*Example:* .setname MyBot");
    }

    if (match.length > 25) {
      return message.send("❌ _Name too long (max 25 characters)_");
    }

    await message.react("⏳");
    await message.conn.updateProfileName(match.trim());
    await message.react("✅");

    await message.send(`✅ *Name Updated*\n\n*New Name:* ${match.trim()}`);
  } catch (error) {
    console.error("SetName command error:", error);
    await message.react("❌");
    await message.send("❌ _Failed to update name_");
  }
});

Module({
  command: "myname",
  package: "owner",
  description: "Get bot's current name",
})(async (message) => {
  try {
    if (!message.isFromMe) return message.send(theme.isFromMe);

    const botName =
      message.conn.user?.name ||
      message.conn.user?.verifiedName ||
      "Name not set";
    await message.reply(`👤 *My Current Name*\n\n${botName}`);
  } catch (error) {
    console.error("MyName command error:", error);
    await message.send("❌ _Failed to get my name_");
  }
});

Module({
  command: "setbio",
  package: "owner",
  aliases: ["setstatus", "setabout"],
  description: "Set bot status/bio",
  usage: ".setbio <text>",
})(async (message, match) => {
  try {
    if (!message.isFromMe) return message.send(theme.isFromMe);

    if (!match || match.trim().length === 0) {
      return message.send(
        "❌ _Provide bio text_\n\n*Example:* .setbio Hello, I am a bot!"
      );
    }

    if (match.length > 139) {
      return message.send("❌ _Bio too long (max 139 characters)_");
    }

    await message.react("⏳");
    await message.conn.updateProfileStatus(match.trim());
    await message.react("✅");

    await message.send(`✅ *Bio Updated*\n\n*New Bio:*\n${match.trim()}`);
  } catch (error) {
    console.error("SetBio command error:", error);
    await message.react("❌");
    await message.send("❌ _Failed to update bio_");
  }
});

Module({
  command: "mystatus",
  package: "owner",
  aliases: ["mybio"],
  description: "Get bot's current status/bio",
})(async (message) => {
  try {
    if (!message.isFromMe) return message.send(theme.isFromMe);

    // ✅ NEW: Get bot JID properly (handles LID)
    const myJid = message.conn.user.id.split(":")[0] + "@s.whatsapp.net";
    const status = await message.fetchStatus(myJid).catch(() => null);

    const bioText = status?.status || "_No status set_";
    const setDate = status?.setAt
      ? new Date(status.setAt).toLocaleDateString()
      : "Unknown";

    await message.reply(
      `╭━━━「 *MY STATUS* 」━━━╮\n┃\n┃ 📝 ${bioText}\n┃\n┃ 📅 *Set on:* ${setDate}\n┃\n╰━━━━━━━━━━━━━━━━━━╯`
    );
  } catch (error) {
    console.error("MyStatus command error:", error);
    await message.send("❌ _Failed to get status_");
  }
});

Module({
  command: "getbio",
  package: "owner",
  aliases: ["bio", "getstatus"],
  description: "Get bio/status of a user",
  usage: ".getbio <reply|tag>",
})(async (message) => {
  try {
    if (!message.isFromMe) return message.send(theme.isFromMe);

    // ✅ NEW: Handle both participant and participantAlt
    const jid =
      message.quoted?.participant ||
      message.quoted?.participantAlt ||
      message.quoted?.sender ||
      message.mentions?.[0] ||
      message.sender;

    await message.react("⏳");
    const status = await message.fetchStatus(jid);
    await message.react("✅");

    const bioText = status?.status || "_No bio set_";
    const setDate = status?.setAt
      ? new Date(status.setAt).toLocaleDateString()
      : "Unknown";

    await message.send(
      `╭━━━「 *USER BIO* 」━━━╮\n┃\n┃ 👤 *User:* @${
        jid.split("@")[0]
      }\n┃\n┃ 📝 *Bio:*\n┃ ${bioText}\n┃\n┃ 📅 *Set on:* ${setDate}\n┃\n╰━━━━━━━━━━━━━━━━━━╯`,
      { mentions: [jid] }
    );
  } catch (error) {
    console.error("GetBio command error:", error);
    await message.react("❌");
    await message.send("❌ _Failed to fetch bio_");
  }
});

Module({
  command: "getname",
  package: "owner",
  description: "Get username of mentioned user",
  usage: ".getname <reply|tag>",
})(async (message) => {
  try {
    if (!message.isFromMe) return message.send(theme.isFromMe);

    // ✅ NEW: Handle both participant and participantAlt
    const jid =
      message.quoted?.participant ||
      message.quoted?.participantAlt ||
      message.quoted?.sender ||
      message.mentions?.[0];

    if (!jid) {
      return message.send("❌ _Reply to or mention a user_");
    }

    let groupName = null;
    if (message.isGroup) {
      await message.loadGroupInfo();
      // ✅ NEW: Use 'id' instead of 'jid' for participants
      const participant = message.groupParticipants.find((p) => 
        message.areJidsSame ? message.areJidsSame(p.id, jid) : p.id === jid
      );
      groupName = participant?.notify || participant?.name;
    }

    const name = message.pushName || groupName || jid.split("@")[0];

    await message.reply(
      `╭━━━「 *USERNAME INFO* 」━━━╮\n┃\n┃ 👤 *User:* @${
        jid.split("@")[0]
      }\n┃ 📝 *Name:* ${name}\n┃ 📍 *Source:* ${
        groupName ? "Group" : "Number"
      }\n┃\n╰━━━━━━━━━━━━━━━━━━╯`,
      { mentions: [jid] }
    );
  } catch (error) {
    console.error("GetName command error:", error);
    await message.send("❌ _Failed to get username_");
  }
});

// ==================== BROADCAST & MESSAGING ====================

Module({
  command: "broadcast",
  package: "owner",
  aliases: ["bc"],
  description: "Broadcast message to all chats",
  usage: ".broadcast <message>",
})(async (message, match) => {
  try {
    if (!message.isFromMe) return message.send(theme.isFromMe);

    if (!match) {
      return message.send(
        "❌ _Provide broadcast message_\n\n*Example:* .broadcast Important announcement!"
      );
    }

    await message.react("⏳");

    const chats = await message.conn.groupFetchAllParticipating();
    const groups = Object.values(chats);

    await message.send(
      `📢 *Broadcasting...*\n\nSending to ${groups.length} group(s)`
    );

    let sent = 0;
    let failed = 0;

    for (const group of groups) {
      try {
        await message.conn.sendMessage(group.id, {
          text: `📢 *BROADCAST MESSAGE*\n\n${match}`,
        });
        sent++;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (err) {
        failed++;
        console.error(`Failed to send to ${group.id}:`, err);
      }
    }

    await message.react("✅");
    await message.send(
      `✅ *Broadcast Complete!*\n\n• Total: ${groups.length}\n• Sent: ${sent}\n• Failed: ${failed}`
    );
  } catch (error) {
    console.error("Broadcast command error:", error);
    await message.react("❌");
    await message.send("❌ _Failed to broadcast message_");
  }
});

Module({
  command: "forward",
  package: "owner",
  description: "Forward quoted message to a chat",
  usage: ".forward <number>",
})(async (message, match) => {
  try {
    if (!message.isFromMe) return message.send(theme.isFromMe);

    if (!message.quoted) {
      return message.send("❌ _Reply to a message to forward_");
    }

    if (!match) {
      return message.send(
        "❌ _Provide target number_\n\n*Example:* .forward 1234567890"
      );
    }

    const number = match.replace(/[^0-9]/g, "");
    if (!number) return message.send("❌ _Invalid number_");

    const jid = `${number}@s.whatsapp.net`;

    await message.react("⏳");
    
    // ✅ NEW: Properly forward message
    await message.conn.sendMessage(jid, { 
      forward: message.quoted.raw || message.quoted 
    });
    
    await message.react("✅");

    await message.send(`✅ *Message forwarded* to @${number}`, {
      mentions: [jid],
    });
  } catch (error) {
    console.error("Forward command error:", error);
    await message.react("❌");
    await message.send("❌ _Failed to forward message_");
  }
});

// ==================== GROUP MANAGEMENT ====================

Module({
  command: "join",
  package: "owner",
  description: "Join group via invite link",
  usage: ".join <invite link>",
})(async (message, match) => {
  try {
    if (!message.isFromMe) return message.send(theme.isFromMe);

    if (!match) {
      return message.send(
        "❌ _Provide WhatsApp group invite link_\n\n*Example:*\n.join https://chat.whatsapp.com/xxxxx"
      );
    }

    const inviteCode = match.match(
      /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i
    )?.[1];

    if (!inviteCode) {
      return message.send("❌ _Invalid invite link format_");
    }

    await message.react("⏳");

    const info = await message.getInviteInfo(inviteCode);

    await message.send(
      `╭━━━「 *GROUP INFO* 」━━━╮\n┃\n┃ 📝 *Name:* ${
        info.subject
      }\n┃ 👥 *Members:* ${info.size}\n┃ 📅 *Created:* ${new Date(
        info.creation * 1000
      ).toLocaleDateString()}\n┃\n╰━━━━━━━━━━━━━━━━━━╯\n\n⏳ _Joining group..._`
    );

    await message.joinViaInvite(inviteCode);
    await message.react("✅");

    await message.send("✅ *Successfully joined the group!*");
  } catch (error) {
    console.error("Join command error:", error);
    await message.react("❌");
    await message.send(
      "❌ _Failed to join group_\n\n*Possible reasons:*\n• Invalid or expired link\n• Already in group\n• Group is full"
    );
  }
});

Module({
  command: "leaveall",
  package: "owner",
  description: "Leave all groups except specified",
  usage: ".leaveall <exception1,exception2>",
})(async (message, match) => {
  try {
    if (!message.isFromMe) return message.send(theme.isFromMe);

    const chats = await message.conn.groupFetchAllParticipating();
    const groups = Object.values(chats);

    if (groups.length === 0) {
      return message.send("ℹ️ _Bot is not in any groups_");
    }

    const exceptions = match ? match.split(",").map((e) => e.trim()) : [];
    let left = 0;
    let kept = 0;

    await message.send(
      `⚠️ *Leaving Groups...*\n\nTotal: ${groups.length} groups\nExceptions: ${exceptions.length}`
    );

    for (const group of groups) {
      try {
        const isException = exceptions.some(
          (e) =>
            group.subject.toLowerCase().includes(e.toLowerCase()) ||
            group.id.includes(e)
        );

        if (isException) {
          kept++;
          continue;
        }

        await message.conn.groupLeave(group.id);
        left++;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to leave group ${group.id}:`, error);
      }
    }

    await message.send(
      `✅ *Leave All Complete*\n\n• Left: ${left} groups\n• Kept: ${kept} groups`
    );
  } catch (error) {
    console.error("LeaveAll command error:", error);
    await message.send("❌ _Failed to leave groups_");
  }
});

Module({
  command: "listgc",
  package: "owner",
  aliases: ["grouplist"],
  description: "List all group chats",
})(async (message) => {
  try {
    if (!message.isFromMe) return message.send(theme.isFromMe);

    const chats = await message.conn.groupFetchAllParticipating();
    const groups = Object.values(chats);

    if (groups.length === 0) {
      return message.send("ℹ️ _Bot is not in any groups_");
    }

    let text = `╭━━━「 *GROUP LIST* 」━━━╮\n┃\n`;

    const showCount = Math.min(groups.length, 50);
    for (let i = 0; i < showCount; i++) {
      const group = groups[i];
      text += `┃ ${i + 1}. ${group.subject}\n┃    ID: ${
        group.id.split("@")[0]
      }\n┃    Members: ${group.participants?.length || "N/A"}\n┃\n`;
    }

    text += `╰━━━━━━━━━━━━━━━━━━╯\n\n*Total:* ${groups.length} group(s)`;

    if (groups.length > 50) {
      text += `\n\n_Showing first 50 of ${groups.length} groups_`;
    }

    await message.send(text);
  } catch (error) {
    console.error("ListGC command error:", error);
    await message.send("❌ _Failed to list groups_");
  }
});

// ==================== UTILITY COMMANDS ====================

Module({
  command: "save",
  package: "owner",
  description: "Save quoted message to private chat",
  usage: ".save <reply to message>",
})(async (message) => {
  try {
    if (!message.isFromMe) return message.send(theme.isFromMe);

    if (!message.quoted) {
      return message.send("❌ _Reply to a message to save_");
    }

    const myJid = message.sender;

    if (message.quoted.type === "conversation" || message.quoted.body) {
      await message.conn.sendMessage(myJid, {
        text: `╭━━━「 💾 *SAVED MESSAGE* 」━━━╮\n┃\n┃ ${
          message.quoted.body
        }\n┃\n┃ *From:* ${
          message.isGroup ? message.groupMetadata?.subject : message.pushName
        }\n┃ *Time:* ${new Date().toLocaleString()}\n┃\n╰━━━━━━━━━━━━━━━━━━╯`,
      });
    } else if (
      [
        "imageMessage",
        "videoMessage",
        "audioMessage",
        "documentMessage",
        "stickerMessage",
      ].includes(message.quoted.type)
    ) {
      const buffer = await message.quoted.download();
      const mediaType = message.quoted.type.replace("Message", "");

      await message.conn.sendMessage(myJid, {
        [mediaType]: buffer,
        caption: `💾 *Saved from:* ${
          message.isGroup ? message.groupMetadata?.subject : message.pushName
        }\n*Time:* ${new Date().toLocaleString()}`,
      });
    }

    await message.react("✅");
    await message.send("✅ _Message saved to your private chat_");
  } catch (error) {
    console.error("Save command error:", error);
    await message.send("❌ _Failed to save message_");
  }
});

Module({
  command: "delete",
  package: "owner",
  aliases: ["del"],
  description: "Delete bot's message",
  usage: ".delete <reply to bot message>",
})(async (message) => {
  try {
    if (!message.isFromMe) return message.send(theme.isFromMe);

    if (!message.quoted) {
      return message.send("❌ _Reply to bot's message to delete it_");
    }

    if (!message.quoted.fromMe) {
      return message.send("❌ _Can only delete bot's own messages_");
    }

    await message.send({ delete: message.quoted.key });
    await message.react("✅");
  } catch (error) {
    console.error("Delete command error:", error);
    await message.send("❌ _Failed to delete message_");
  }
});

Module({
  command: "quoted",
  package: "owner",
  aliases: ["q"],
  description: "Get quoted message info",
  usage: ".quoted <reply to message>",
})(async (message) => {
  try {
    if (!message.isFromMe) return message.send(theme.isFromMe);

    if (!message.quoted) {
      return message.send("❌ _Reply to a message_");
    }

    const q = message.quoted;
    // ✅ NEW: Handle both participant and participantAlt
    const sender = q.participant || q.participantAlt || q.sender;

    const info = `╭━━━「 📋 *QUOTED INFO* 」━━━╮
┃
┃ *Type:* ${q.type}
┃ *From:* @${sender.split("@")[0]}
┃ *Message ID:* ${q.id}
┃ *Timestamp:* ${new Date(q.key.timestamp || Date.now()).toLocaleString()}
┃${q.body ? `\n┃ *Message:*\n┃ ${q.body}` : ""}
┃
╰━━━━━━━━━━━━━━━━━━╯`;

    await message.reply(info, { mentions: [sender] });
  } catch (error) {
    console.error("Quoted command error:", error);
    await message.send("❌ _Failed to get quoted info_");
  }
});

Module({
  command: "jid",
  package: "owner",
  description: "Get JID of user or group",
  usage: ".jid <reply|tag>",
})(async (message) => {
  try {
    if (!message.isFromMe) return message.send(theme.isFromMe);

    // ✅ NEW: Handle both participant and participantAlt
    const jid =
      message.quoted?.participant ||
      message.quoted?.participantAlt ||
      message.quoted?.sender ||
      message.mentions?.[0] ||
      message.from;

    await message.reply(`📋 *JID Information*\n\n\`\`\`${jid}\`\`\``);
  } catch (error) {
    console.error("JID command error:", error);
    await message.send("❌ _Failed to get JID_");
  }
});
