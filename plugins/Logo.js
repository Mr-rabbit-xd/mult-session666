const axios = require("axios");
const { Module } = require('../lib/plugins');

// Helper function to fetch JSON
async function fetchJson(url) {
  const response = await axios.get(url);
  return response.data;
}

// 3D Comic
Module({
  command: "3dcomic",
  package: "logo",
  description: "Create a 3D Comic-style text effect"
})(async (message, match) => {
  try {
    if (!match) {
      return await message.sendReply("❌ Please provide a name. Example: 3dcomic Empire");
    }

    const apiUrl = `https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/create-online-3d-comic-style-text-effects-817.html&name=${encodeURIComponent(match)}`;
    const result = await fetchJson(apiUrl);

    if (!result?.result?.download_url) {
      return await message.sendReply("❌ Failed to generate logo. Please try again.");
    }

    await message.conn.sendMessage(message.from, {
      image: { url: result.result.download_url },
      caption: `🎨 *3D Comic Style*\n> © X-kira`
    });
  } catch (e) {
    return await message.sendReply(`*An error occurred while processing your request.*\n\n_Error:_ ${e.message}`);
  }
});

// Dragon Ball
Module({
  command: "dragonball",
  package: "logo",
  description: "Create a Dragon Ball style text effect"
})(async (message, match) => {
  try {
    if (!match) {
      return await message.sendReply("❌ Please provide a name. Example: dragonball Empire");
    }

    const apiUrl = `https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/create-dragon-ball-style-text-effects-online-809.html&name=${encodeURIComponent(match)}`;
    const result = await fetchJson(apiUrl);

    if (!result?.result?.download_url) {
      return await message.sendReply("❌ Failed to generate logo. Please try again.");
    }

    await message.conn.sendMessage(message.from, {
      image: { url: result.result.download_url },
      caption: `🎨 *Dragon Ball Style*\n> © X-kira`
    });
  } catch (e) {
    return await message.sendReply(`*An error occurred while processing your request.*\n\n_Error:_ ${e.message}`);
  }
});

// Deadpool
Module({
  command: "deadpool",
  package: "logo",
  description: "Create a Deadpool text effect"
})(async (message, match) => {
  try {
    if (!match) {
      return await message.sendReply("❌ Please provide a name. Example: deadpool Empire");
    }

    const apiUrl = `https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/create-text-effects-in-the-style-of-the-deadpool-logo-818.html&name=${encodeURIComponent(match)}`;
    const result = await fetchJson(apiUrl);

    if (!result?.result?.download_url) {
      return await message.sendReply("❌ Failed to generate logo. Please try again.");
    }

    await message.conn.sendMessage(message.from, {
      image: { url: result.result.download_url },
      caption: `🎨 *Deadpool Style*\n> © X-kira`
    });
  } catch (e) {
    return await message.sendReply(`*An error occurred while processing your request.*\n\n_Error:_ ${e.message}`);
  }
});

// Blackpink
Module({
  command: "blackpink",
  package: "logo",
  description: "Create a Blackpink text effect"
})(async (message, match) => {
  try {
    if (!match) {
      return await message.sendReply("❌ Please provide a name. Example: blackpink Empire");
    }

    const apiUrl = `https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/create-a-blackpink-style-logo-with-members-signatures-810.html&name=${encodeURIComponent(match)}`;
    const result = await fetchJson(apiUrl);

    if (!result?.result?.download_url) {
      return await message.sendReply("❌ Failed to generate logo. Please try again.");
    }

    await message.conn.sendMessage(message.from, {
      image: { url: result.result.download_url },
      caption: `🎨 *Blackpink Style*\n> © X-kira`
    });
  } catch (e) {
    return await message.sendReply(`*An error occurred while processing your request.*\n\n_Error:_ ${e.message}`);
  }
});

// Neon Light
Module({
  command: "neonlight",
  package: "logo",
  description: "Create a neon light text effect"
})(async (message, match) => {
  try {
    if (!match) {
      return await message.sendReply("❌ Please provide a name. Example: neonlight Empire");
    }

    const apiUrl = `https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/create-colorful-neon-light-text-effects-online-797.html&name=${encodeURIComponent(match)}`;
    const result = await fetchJson(apiUrl);

    if (!result?.result?.download_url) {
      return await message.sendReply("❌ Failed to generate logo. Please try again.");
    }

    await message.conn.sendMessage(message.from, {
      image: { url: result.result.download_url },
      caption: `🎨 *Neon Light Style*\n> © X-kira`
    });
  } catch (e) {
    return await message.sendReply(`*An error occurred while processing your request.*\n\n_Error:_ ${e.message}`);
  }
});

// Cat (Foggy Glass)
Module({
  command: "cat",
  package: "logo",
  description: "Create a foggy glass text effect"
})(async (message, match) => {
  try {
    if (!match) {
      return await message.sendReply("❌ Please provide a name. Example: cat Empire");
    }

    const apiUrl = `https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/handwritten-text-on-foggy-glass-online-680.html&name=${encodeURIComponent(match)}`;
    const result = await fetchJson(apiUrl);

    if (!result?.result?.download_url) {
      return await message.sendReply("❌ Failed to generate logo. Please try again.");
    }

    await message.conn.sendMessage(message.from, {
      image: { url: result.result.download_url },
      caption: `🎨 *Foggy Glass Style*\n> © X-kira`
    });
  } catch (e) {
    return await message.sendReply(`*An error occurred while processing your request.*\n\n_Error:_ ${e.message}`);
  }
});

// Sad Girl (Wet Glass)
Module({
  command: "sadgirl",
  package: "logo",
  description: "Create a wet glass text effect"
})(async (message, match) => {
  try {
    if (!match) {
      return await message.sendReply("❌ Please provide a name. Example: sadgirl Empire");
    }

    const apiUrl = `https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/write-text-on-wet-glass-online-589.html&name=${encodeURIComponent(match)}`;
    const result = await fetchJson(apiUrl);

    if (!result?.result?.download_url) {
      return await message.sendReply("❌ Failed to generate logo. Please try again.");
    }

    await message.conn.sendMessage(message.from, {
      image: { url: result.result.download_url },
      caption: `🎨 *Wet Glass Style*\n> © X-kira`
    });
  } catch (e) {
    return await message.sendReply(`*An error occurred while processing your request.*\n\n_Error:_ ${e.message}`);
  }
});

// Naruto
Module({
  command: "naruto",
  package: "logo",
  description: "Create a Naruto text effect"
})(async (message, match) => {
  try {
    if (!match) {
      return await message.sendReply("❌ Please provide a name. Example: naruto Empire");
    }

    const apiUrl = `https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/naruto-shippuden-logo-style-text-effect-online-808.html&name=${encodeURIComponent(match)}`;
    const result = await fetchJson(apiUrl);

    if (!result?.result?.download_url) {
      return await message.sendReply("❌ Failed to generate logo. Please try again.");
    }

    await message.conn.sendMessage(message.from, {
      image: { url: result.result.download_url },
      caption: `🎨 *Naruto Style*\n> © X-kira`
    });
  } catch (e) {
    return await message.sendReply(`*An error occurred while processing your request.*\n\n_Error:_ ${e.message}`);
  }
});

// Thor
Module({
  command: "thor",
  package: "logo",
  description: "Create a Thor text effect"
})(async (message, match) => {
  try {
    if (!match) {
      return await message.sendReply("❌ Please provide a name. Example: thor Empire");
    }

    const apiUrl = `https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/create-thor-logo-style-text-effects-online-for-free-796.html&name=${encodeURIComponent(match)}`;
    const result = await fetchJson(apiUrl);

    if (!result?.result?.download_url) {
      return await message.sendReply("❌ Failed to generate logo. Please try again.");
    }

    await message.conn.sendMessage(message.from, {
      image: { url: result.result.download_url },
      caption: `🎨 *Thor Style*\n> © X-kira`
    });
  } catch (e) {
    return await message.sendReply(`*An error occurred while processing your request.*\n\n_Error:_ ${e.message}`);
  }
});

// America
Module({
  command: "america",
  package: "logo",
  description: "Create American flag text effect"
})(async (message, match) => {
  try {
    if (!match) {
      return await message.sendReply("❌ Please provide a name. Example: america Empire");
    }

    const apiUrl = `https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/free-online-american-flag-3d-text-effect-generator-725.html&name=${encodeURIComponent(match)}`;
    const result = await fetchJson(apiUrl);

    if (!result?.result?.download_url) {
      return await message.sendReply("❌ Failed to generate logo. Please try again.");
    }

    await message.conn.sendMessage(message.from, {
      image: { url: result.result.download_url },
      caption: `🎨 *American Flag Style*\n> © X-kira`
    });
  } catch (e) {
    return await message.sendReply(`*An error occurred while processing your request.*\n\n_Error:_ ${e.message}`);
  }
});

// Eraser
Module({
  command: "eraser",
  package: "logo",
  description: "Create an eraser text effect"
})(async (message, match) => {
  try {
    if (!match) {
      return await message.sendReply("❌ Please provide a name. Example: eraser Empire");
    }

    const apiUrl = `https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/create-eraser-deleting-text-effect-online-717.html&name=${encodeURIComponent(match)}`;
    const result = await fetchJson(apiUrl);

    if (!result?.result?.download_url) {
      return await message.sendReply("❌ Failed to generate logo. Please try again.");
    }

    await message.conn.sendMessage(message.from, {
      image: { url: result.result.download_url },
      caption: `🎨 *Eraser Style*\n> © X-kira`
    });
  } catch (e) {
    return await message.sendReply(`*An error occurred while processing your request.*\n\n_Error:_ ${e.message}`);
  }
});

// 3D Paper
Module({
  command: "3dpaper",
  package: "logo",
  description: "Create a 3D paper text effect"
})(async (message, match) => {
  try {
    if (!match) {
      return await message.sendReply("❌ Please provide a name. Example: 3dpaper Empire");
    }

    const apiUrl = `https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/multicolor-3d-paper-cut-style-text-effect-658.html&name=${encodeURIComponent(match)}`;
    const result = await fetchJson(apiUrl);

    if (!result?.result?.download_url) {
      return await message.sendReply("❌ Failed to generate logo. Please try again.");
    }

    await message.conn.sendMessage(message.from, {
      image: { url: result.result.download_url },
      caption: `🎨 *3D Paper Style*\n> © X-kira`
    });
  } catch (e) {
    return await message.sendReply(`*An error occurred while processing your request.*\n\n_Error:_ ${e.message}`);
  }
});

// Futuristic
Module({
  command: "futuristic",
  package: "logo",
  description: "Create a futuristic text effect"
})(async (message, match) => {
  try {
    if (!match) {
      return await message.sendReply("❌ Please provide a name. Example: futuristic Empire");
    }

    const apiUrl = `https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/light-text-effect-futuristic-technology-style-648.html&name=${encodeURIComponent(match)}`;
    const result = await fetchJson(apiUrl);

    if (!result?.result?.download_url) {
      return await message.sendReply("❌ Failed to generate logo. Please try again.");
    }

    await message.conn.sendMessage(message.from, {
      image: { url: result.result.download_url },
      caption: `🎨 *Futuristic Style*\n> © X-kira`
    });
  } catch (e) {
    return await message.sendReply(`*An error occurred while processing your request.*\n\n_Error:_ ${e.message}`);
  }
});

// Clouds
Module({
  command: "clouds",
  package: "logo",
  description: "Create a clouds text effect"
})(async (message, match) => {
  try {
    if (!match) {
      return await message.sendReply("❌ Please provide a name. Example: clouds Empire");
    }

    const apiUrl = `https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/write-text-effect-clouds-in-the-sky-online-619.html&name=${encodeURIComponent(match)}`;
    const result = await fetchJson(apiUrl);

    if (!result?.result?.download_url) {
      return await message.sendReply("❌ Failed to generate logo. Please try again.");
    }

    await message.conn.sendMessage(message.from, {
      image: { url: result.result.download_url },
      caption: `🎨 *Clouds Style*\n> © X-kira`
    });
  } catch (e) {
    return await message.sendReply(`*An error occurred while processing your request.*\n\n_Error:_ ${e.message}`);
  }
});

// Sand
Module({
  command: "sand",
  package: "logo",
  description: "Create a sand text effect"
})(async (message, match) => {
  try {
    if (!match) {
      return await message.sendReply("❌ Please provide a name. Example: sand Empire");
    }

    const apiUrl = `https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/write-in-sand-summer-beach-online-free-595.html&name=${encodeURIComponent(match)}`;
    const result = await fetchJson(apiUrl);

    if (!result?.result?.download_url) {
      return await message.sendReply("❌ Failed to generate logo. Please try again.");
    }

    await message.conn.sendMessage(message.from, {
      image: { url: result.result.download_url },
      caption: `🎨 *Sand Style*\n> © X-kira`
    });
  } catch (e) {
    return await message.sendReply(`*An error occurred while processing your request.*\n\n_Error:_ ${e.message}`);
  }
});

// Galaxy
Module({
  command: "galaxy",
  package: "logo",
  description: "Create a galaxy text effect"
})(async (message, match) => {
  try {
    if (!match) {
      return await message.sendReply("❌ Please provide a name. Example: galaxy Empire");
    }

    const apiUrl = `https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/create-galaxy-wallpaper-mobile-online-528.html&name=${encodeURIComponent(match)}`;
    const result = await fetchJson(apiUrl);

    if (!result?.result?.download_url) {
      return await message.sendReply("❌ Failed to generate logo. Please try again.");
    }

    await message.conn.sendMessage(message.from, {
      image: { url: result.result.download_url },
      caption: `🎨 *Galaxy Style*\n> © X-kira`
    });
  } catch (e) {
    return await message.sendReply(`*An error occurred while processing your request.*\n\n_Error:_ ${e.message}`);
  }
});

// Leaf
Module({
  command: "leaf",
  package: "logo",
  description: "Create a leaf text effect"
})(async (message, match) => {
  try {
    if (!match) {
      return await message.sendReply("❌ Please provide a name. Example: leaf Empire");
    }

    const apiUrl = `https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/green-brush-text-effect-typography-maker-online-153.html&name=${encodeURIComponent(match)}`;
    const result = await fetchJson(apiUrl);

    if (!result?.result?.download_url) {
      return await message.sendReply("❌ Failed to generate logo. Please try again.");
    }

    await message.conn.sendMessage(message.from, {
      image: { url: result.result.download_url },
      caption: `🎨 *Leaf Style*\n> © X-kira`
    });
  } catch (e) {
    return await message.sendReply(`*An error occurred while processing your request.*\n\n_Error:_ ${e.message}`);
  }
});

// Hacker
Module({
  command: "hacker",
  package: "logo",
  description: "Create a hacker text effect"
})(async (message, match) => {
  try {
    if (!match) {
      return await message.sendReply("❌ Please provide a name. Example: hacker Empire");
    }

    const apiUrl = `https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/create-anonymous-hacker-avatars-cyan-neon-677.html&name=${encodeURIComponent(match)}`;
    const result = await fetchJson(apiUrl);

    if (!result?.result?.download_url) {
      return await message.sendReply("❌ Failed to generate logo. Please try again.");
    }

    await message.conn.sendMessage(message.from, {
      image: { url: result.result.download_url },
      caption: `🎨 *Hacker Style*\n> © X-kira`
    });
  } catch (e) {
    return await message.sendReply(`*An error occurred while processing your request.*\n\n_Error:_ ${e.message}`);
  }
});

// Boom
Module({
  command: "boom",
  package: "logo",
  description: "Create a boom text effect"
})(async (message, match) => {
  try {
    if (!match) {
      return await message.sendReply("❌ Please provide a name. Example: boom Empire");
    }

    const apiUrl = `https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/boom-text-comic-style-text-effect-675.html&name=${encodeURIComponent(match)}`;
    const result = await fetchJson(apiUrl);

    if (!result?.result?.download_url) {
      return await message.sendReply("❌ Failed to generate logo. Please try again.");
    }

    await message.conn.sendMessage(message.from, {
      image: { url: result.result.download_url },
      caption: `🎨 *Boom Style*\n> © X-kira`
    });
  } catch (e) {
    return await message.sendReply(`*An error occurred while processing your request.*\n\n_Error:_ ${e.message}`);
  }
});

// Floral
Module({
  command: "floral",
  package: "logo",
  description: "Create a floral text effect"
})(async (message, match) => {
  try {
    if (!match) {
      return await message.sendReply("❌ Please provide a name. Example: floral Empire");
    }

    const apiUrl = `https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/floral-luxury-logo-collection-for-branding-616.html&name=${encodeURIComponent(match)}`;
    const result = await fetchJson(apiUrl);

    if (!result?.result?.download_url) {
      return await message.sendReply("❌ Failed to generate logo. Please try again.");
    }

    await message.conn.sendMessage(message.from, {
      image: { url: result.result.download_url },
      caption: `🎨 *Floral Style*\n> © X-kira`
    });
  } catch (e) {
    return await message.sendReply(`*An error occurred while processing your request.*\n\n_Error:_ ${e.message}`);
  }
});

// Zodiac
Module({
  command: "zodiac",
  package: "logo",
  description: "Create a zodiac text effect"
})(async (message, match) => {
  try {
    if (!match) {
      return await message.sendReply("❌ Please provide a name. Example: zodiac Empire");
    }

    const apiUrl = `https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/create-star-zodiac-wallpaper-mobile-604.html&name=${encodeURIComponent(match)}`;
    const result = await fetchJson(apiUrl);

    if (!result?.result?.download_url) {
      return await message.sendReply("❌ Failed to generate logo. Please try again.");
    }

    await message.conn.sendMessage(message.from, {
      image: { url: result.result.download_url },
      caption: `🎨 *Zodiac Style*\n> © X-kira`
    });
  } catch (e) {
    return await message.sendReply(`*An error occurred while processing your request.*\n\n_Error:_ ${e.message}`);
  }
});

// Angel
Module({
  command: "angel",
  package: "logo",
  description: "Create an angel text effect"
})(async (message, match) => {
  try {
    if (!match) {
      return await message.sendReply("❌ Please provide a name. Example: angel Empire");
    }

    const apiUrl = `https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/angel-wing-effect-329.html&name=${encodeURIComponent(match)}`;
    const result = await fetchJson(apiUrl);

    if (!result?.result?.download_url) {
      return await message.sendReply("❌ Failed to generate logo. Please try again.");
    }

    await message.conn.sendMessage(message.from, {
      image: { url: result.result.download_url },
      caption: `🎨 *Angel Wing Style*\n> © X-kira`
    });
  } catch (e) {
    return await message.sendReply(`*An error occurred while processing your request.*\n\n_Error:_ ${e.message}`);
  }
});