import { Module } from "../lib/plugins.js";

Module({
  command: "checkid",
  aliases: ["cekid", "getid", "id"],
  description: "Get WhatsApp Group or Channel ID from invite link",
})(async (message, match) => {
  try {
    if (!match) {
      return message.send(
        "❌ WhatsApp group বা channel link দাও\n\nExample:\n.checkid https://chat.whatsapp.com/xxxx"
      );
    }

    await message.react("⌛");

    const linkMatch = match.match(
      /https?:\/\/(chat\.whatsapp\.com|whatsapp\.com\/channel)\/[^\s]+/i
    );

    if (!linkMatch) {
      await message.react("❌");
      return message.send("❌ Valid WhatsApp group / channel link দাও");
    }

    const link = linkMatch[0];
    const url = new URL(link);

    // ================= GROUP =================
    if (url.hostname === "chat.whatsapp.com") {
      const code = url.pathname.replace("/", "");
      const res = await message.client.groupGetInviteInfo(code);
      const id = res.id;

      await message.react("✅");

      return message.client.sendMessage(message.chat, {
        interactiveMessage: {
          header: {
            title: "📊 Group Link Analysis",
          },
          body: {
            text:
              `🔗 Link:\n${link}\n\n` +
              `🆔 Group ID:\n\`${id}\``,
          },
          footer: {
            text: "Powered By Rabbit Xmd Mini",
          },
          buttons: [
            {
              name: "cta_copy",
              buttonParamsJson: JSON.stringify({
                display_text: "📋 Copy Group ID",
                copy_code: id,
              }),
            },
          ],
        },
      });
    }

    // ================= CHANNEL =================
    if (url.pathname.startsWith("/channel/")) {
      const code = url.pathname.split("/channel/")[1];
      const res = await message.client.newsletterMetadata(
        "invite",
        code,
        "GUEST"
      );
      const id = res.id;

      await message.react("✅");

      return message.client.sendMessage(message.chat, {
        interactiveMessage: {
          header: {
            title: "📢 Channel Link Analysis",
          },
          body: {
            text:
              `🔗 Link:\n${link}\n\n` +
              `🆔 Channel ID:\n\`${id}\``,
          },
          footer: {
            text: "Powered By Rabbit Xmd Mini",
          },
          buttons: [
            {
              name: "cta_copy",
              buttonParamsJson: JSON.stringify({
                display_text: "📋 Copy Channel ID",
                copy_code: id,
              }),
            },
          ],
        },
      });
    }

    await message.react("❌");
    message.send("❌ Unsupported WhatsApp link");

  } catch (err) {
    console.error("[CHECKID ERROR]", err);
    await message.react("❌");
    message.send("⚠️ Link invalid বা expired");
  }
});
