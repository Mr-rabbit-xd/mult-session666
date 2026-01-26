import { Module } from '../lib/plugins.js';
import { getTheme } from '../Themes/themes.js';
const theme = getTheme();

Module({
  command: "pp",
  package: "owner",
  description: "Set profile picture",
})(async (message) => {
  // owner check (FIXED)
  if (!message.isFromMe) return message.send(theme.isFromMe);

  // quoted image check (FIXED)
  if (!message.quoted || !message.quoted.imageMessage) {
    return message.send("❌ Reply to an image");
  }

  try {
    // download image
    const buf = await message.quoted.download();

    // SET OWN DP (FIXED – no setPp, no sender)
    await message.client.updateProfilePicture(
      message.client.user.id,
      buf
    );

    return message.send("✅ _Profile picture updated_");
  } catch (err) {
    console.error(err);
    return message.send("❌ Failed to update profile picture");
  }
});

Module({
  command: "fullpp",
  package: "owner",
  description: "Set full profile picture",
})(async (message) => {
  if (!message.isFromMe) return message.send(theme.isFromMe);

  if (!message.quoted || !message.quoted.imageMessage) {
    return message.send("❌ Reply to an image");
  }

  try {
    const buf = await message.quoted.download();

    await message.client.updateProfilePicture(
      message.client.user.id,
      buf
    );

    return message.send("✅ _Profile picture updated_");
  } catch (err) {
    console.error(err);
    return message.send("❌ Failed to update profile picture");
  }
});
