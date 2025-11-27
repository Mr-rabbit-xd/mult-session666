const { groupDB } = require("../lib/database");
const { Module } = require("../lib/plugins");
const { getTheme } = require("../Themes/themes");
const theme = getTheme();
const defaultWords = [
  "sex",
  "porn",
  "xxx",
  "xvideo",
  "cum4k",
  "randi",
  "chuda",
  "fuck",
  "nude",
  "bobs",
  "vagina",
];
Module({
  command: "antiword",
  package: "group",
  description: "Manage antiword settings",
})(async (message, match) => {
  await message.loadGroupInfo();
  if (!message.isGroup) return message.send(theme.isGroup);
  if (!message.isAdmin && !message.isFromMe) return message.send(theme.isAdmin);

  const rawMatch = match?.trim();
  const lowerMatch = rawMatch?.toLowerCase();
  const actions = ["null", "warn", "kick"];

  let data = await groupDB(["word"], { jid: message.from }, "get");
  let current = data.word || {
    status: "false",
    action: "null",
    words: [],
    warns: {},
    warn_count: 3,
  };

  // 💡 Fix: Ensure `words` is always an array
  if (!Array.isArray(current.words)) current.words = [];

  // 📝 Command: list
  if (lowerMatch === "list") {
    const list = current.words.length > 0 ? current.words : defaultWords;
    return await message.send(
      `📃 *Banned Word List:*\n${list.map((w) => `• ${w}`).join("\n")}`
    );
  }

  // ♻️ Reset to default
  if (lowerMatch === "reset") {
    await message.react("⏳");
    await groupDB(
      ["word"],
      {
        jid: message.from,
        content: {
          status: "false",
          action: "null",
          words: [],
          warns: {},
          warn_count: 3,
        },
      },
      "set"
    );
    await message.react("✅");
    return await message.send(
      "♻️ *Antiword settings have been reset to default!*"
    );
  }

  // 🛠️ Settings overview
  if (!rawMatch) {
    return await message.sendreply(
      `*🔞 Antiword Settings*\n\n` +
        `• *Status:* ${current.status === "true" ? "✅ ON" : "❌ OFF"}\n` +
        `• *Action:* ${
          current.action === "null"
            ? "🚫 Null"
            : current.action === "warn"
            ? "⚠️ Warn"
            : "❌ Kick"
        }\n` +
        `• *Warn Before Kick:* ${current.warn_count}\n` +
        `• *Banned Words:* ${
          current.words?.length > 0
            ? current.words.join(", ")
            : defaultWords.join(", ")
        }\n\n` +
        `*Commands:*\n` +
        `• antiword on/off\n` +
        `• antiword action warn/kick/null\n` +
        `• antiword set_warn <number>\n` +
        `• antiword add <word>\n` +
        `• antiword remove <word>\n` +
        `• antiword list\n` +
        `• antiword reset`
    );
  }

  // ✅ Turn on
  if (lowerMatch === "on") {
    await message.react("⏳");
    await groupDB(
      ["word"],
      {
        jid: message.from,
        content: { ...current, status: "true" },
      },
      "set"
    );
    await message.react("✅");
    return await message.send(
      `✅ Antiword activated with action *${current.action}*`
    );
  }

  // ❌ Turn off
  if (lowerMatch === "off") {
    await message.react("⏳");
    await groupDB(
      ["word"],
      {
        jid: message.from,
        content: { ...current, status: "false" },
      },
      "set"
    );
    await message.react("✅");
    return await message.send(`❌ Antiword deactivated`);
  }

  // ⚙️ Set action
  if (lowerMatch.startsWith("action")) {
    const action = rawMatch
      .replace(/action/i, "")
      .trim()
      .toLowerCase();
    if (!actions.includes(action)) {
      await message.react("❌");
      return await message.send(
        "❗ Invalid action! Use: `warn`, `kick`, or `null`"
      );
    }

    await message.react("⏳");
    await groupDB(
      ["word"],
      {
        jid: message.from,
        content: { ...current, action },
      },
      "set"
    );
    await message.react("✅");
    return await message.send(`⚙️ Antiword action set to *${action}*`);
  }

  // 🚨 Set warn count
  if (lowerMatch.startsWith("set_warn")) {
    const count = parseInt(rawMatch.replace(/set_warn/i, "").trim());
    if (isNaN(count) || count < 1 || count > 10) {
      await message.react("❌");
      return await message.send(
        "❗ Please provide a valid number between 1 and 10"
      );
    }

    await message.react("⏳");
    await groupDB(
      ["word"],
      {
        jid: message.from,
        content: { ...current, warn_count: count },
      },
      "set"
    );
    await message.react("✅");
    return await message.send(`🚨 Warning count set to *${count}*`);
  }

  // ➕ Add word
  if (lowerMatch.startsWith("add")) {
    const word = rawMatch.replace(/add/i, "").trim().toLowerCase();
    if (!word || word.includes(" ")) {
      await message.react("❌");
      return await message.send("❗ Provide a valid single word to ban");
    }

    if (current.words.includes(word)) {
      await message.react("❌");
      return await message.send("⚠️ Word already exists in the list");
    }

    await message.react("⏳");
    current.words.push(word);
    await groupDB(
      ["word"],
      {
        jid: message.from,
        content: { ...current },
      },
      "set"
    );
    await message.react("✅");
    return await message.send(`✅ Word "*${word}*" added to banned list`);
  }

  // ➖ Remove word
  if (lowerMatch.startsWith("remove")) {
    const word = rawMatch
      .replace(/remove/i, "")
      .trim()
      .toLowerCase();
    const newWords = current.words.filter((w) => w !== word);
    if (newWords.length === current.words.length) {
      await message.react("❌");
      return await message.send("⚠️ Word not found in the list");
    }

    await message.react("⏳");
    await groupDB(
      ["word"],
      {
        jid: message.from,
        content: { ...current, words: newWords },
      },
      "set"
    );
    await message.react("✅");
    return await message.send(`🗑️ Word "*${word}*" removed from banned list`);
  }

  await message.react("❌");
  return await message.send("⚠️ Invalid usage. Type `antiword` to see help.");
});

Module({
  command: "antilink",
  package: "group",
  description: "Manage anti-link settings",
})(async (message, match) => {
  await message.loadGroupInfo();
  if (!message.isGroup) return message.send(theme.isGroup);
  if (!message.isAdmin && !message.isFromMe) return message.send(theme.isAdmin);

  const data = await groupDB(["link"], { jid: message.from }, "get");
  const current = data.link || {
    status: "false",
    action: "null",
    not_del: [],
    warns: {},
    warn_count: 3,
  };

  const rawMatch = match?.trim();
  const lowerMatch = rawMatch?.toLowerCase();
  const actions = ["null", "warn", "kick"];
  
  if (lowerMatch === "reset") {
    await message.react("⏳");
    await groupDB(
      ["link"],
      {
        jid: message.from,
        content: {
          status: "false",
          action: "null",
          not_del: [],
          warns: {},
          warn_count: 3,
        },
      },
      "set"
    );
    await message.react("✅");
    return await message.send(
      "♻️ *Antilink settings have been reset to default!*"
    );
  }
  
  if (!rawMatch) {
    return await message.sendreply(
      `* Antilink Settings*\n\n` +
        `• *Status:* ${current.status === "true" ? "✅ ON" : "❌ OFF"}\n` +
        `• *Action:* ${
          current.action === "null"
            ? "🚫 Null"
            : current.action === "warn"
            ? "⚠️ Warn"
            : "❌ Kick"
        }\n` +
        `• *Warn Before Kick:* ${current.warn_count}\n` +
        `• *Ignore URLs:* ${
          current.not_del?.length > 0 ? current.not_del.join(", ") : "None"
        }\n\n` +
        `*Commands:*\n` +
        `• antilink on/off\n` +
        `• antilink action warn/kick/null\n` +
        `• antilink set_warn <number>\n` +
        `• antilink not_del <url>\n` +
        `• antilink reset`
    );
  }
  
  if (lowerMatch === "on") {
    await message.react("⏳");
    await groupDB(
      ["link"],
      {
        jid: message.from,
        content: { ...current, status: "true" },
      },
      "set"
    );
    await message.react("✅");
    return await message.send(
      `✅ Antilink activated with action *${current.action}*`
    );
  }
  
  if (lowerMatch === "off") {
    await message.react("⏳");
    await groupDB(
      ["link"],
      {
        jid: message.from,
        content: { ...current, status: "false" },
      },
      "set"
    );
    await message.react("✅");
    return await message.send(`❌ Antilink deactivated`);
  }
  
  if (lowerMatch.startsWith("action")) {
    const action = rawMatch
      .replace(/action/i, "")
      .trim()
      .toLowerCase();
    if (!actions.includes(action)) {
      await message.react("❌");
      return await message.send(
        "❗ Invalid action! Use: `warn`, `kick`, or `null`"
      );
    }

    await message.react("⏳");
    await groupDB(
      ["link"],
      {
        jid: message.from,
        content: { ...current, action },
      },
      "set"
    );
    await message.react("✅");
    return await message.send(`⚙️ Antilink action set to *${action}*`);
  }

  if (lowerMatch.startsWith("set_warn")) {
    const count = parseInt(rawMatch.replace(/set_warn/i, "").trim());
    if (isNaN(count) || count < 1 || count > 10) {
      await message.react("❌");
      return await message.send(
        "❗ Please provide a valid number between 1 and 10"
      );
    }

    await message.react("⏳");
    await groupDB(
      ["link"],
      {
        jid: message.from,
        content: { ...current, warn_count: count },
      },
      "set"
    );
    await message.react("✅");
    return await message.send(`🚨 Antilink warning count set to *${count}*`);
  }
  
  if (lowerMatch.startsWith("not_del")) {
    const url = rawMatch.replace(/not_del/i, "").trim();
    if (!url.startsWith("http")) {
      await message.react("❌");
      return await message.send(
        "❗ Please provide a valid URL (must start with http)"
      );
    }
    const list = current.not_del || [];
    if (list.some((link) => link.toLowerCase() === url.toLowerCase())) {
      await message.react("❌");
      return await message.send("⚠️ URL is already in the ignore list");
    }
    
    await message.react("⏳");
    list.push(url);
    await groupDB(
      ["link"],
      {
        jid: message.from,
        content: { ...current, not_del: list },
      },
      "set"
    );
    await message.react("✅");
    return await message.send("✅ URL added to ignore list (case preserved)");
  }
  
  await message.react("❌");
  return await message.send("⚠️ Invalid usage. Type `antilink` to see help.");
});