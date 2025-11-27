const { Module } = require("../lib/plugins");
const config = require("../config");
const { getTheme } = require("../Themes/themes");
const theme = getTheme();

Module({
  command: "fact",
  package: "fun",
  description: "Get a random fact",
})(async (message) => {
  try {
    const facts = [
      "Honey never spoils. Archaeologists have found 3000-year-old honey in Egyptian tombs that's still edible!",
      "A group of flamingos is called a 'flamboyance'.",
      "Octopuses have three hearts and blue blood.",
      "Bananas are berries, but strawberries aren't!",
      "The shortest war in history lasted only 38 minutes.",
      "A bolt of lightning is five times hotter than the surface of the sun.",
      "There are more stars in the universe than grains of sand on all Earth's beaches.",
      "Sharks existed before trees on Earth.",
      "A day on Venus is longer than its year.",
      "Wombat poop is cube-shaped!",
    ];

    const fact = facts[Math.floor(Math.random() * facts.length)];
    await message.sendreply(`💡 *Random Fact*\n\n${fact}`);
  } catch (error) {
    console.error("Fact command error:", error);
    await message.send("❌ _Failed to get fact_");
  }
});

Module({
  command: "joke",
  package: "fun",
  description: "Get a random joke",
})(async (message) => {
  try {
    const jokes = [
      "Why don't scientists trust atoms? Because they make up everything!",
      "What do you call a bear with no teeth? A gummy bear!",
      "Why did the scarecrow win an award? He was outstanding in his field!",
      "What do you call a fake noodle? An impasta!",
      "Why don't eggs tell jokes? They'd crack each other up!",
      "What did the ocean say to the beach? Nothing, it just waved!",
      "Why don't skeletons fight each other? They don't have the guts!",
      "What do you call a can opener that doesn't work? A can't opener!",
      "Why did the bicycle fall over? It was two-tired!",
      "What do you call a fish wearing a crown? A king fish!",
    ];

    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    await message.sendreply(`😂 *Random Joke*\n\n${joke}`);
  } catch (error) {
    console.error("Joke command error:", error);
    await message.send("❌ _Failed to get joke_");
  }
});

Module({
  command: "quote",
  package: "fun",
  description: "Get an inspirational quote",
})(async (message) => {
  try {
    const quotes = [
      '"The only way to do great work is to love what you do." - Steve Jobs',
      '"Innovation distinguishes between a leader and a follower." - Steve Jobs',
      '"The future belongs to those who believe in the beauty of their dreams." - Eleanor Roosevelt',
      '"It is during our darkest moments that we must focus to see the light." - Aristotle',
      '"The only impossible journey is the one you never begin." - Tony Robbins',
      '"Life is 10% what happens to you and 90% how you react to it." - Charles R. Swindoll',
      '"The best time to plant a tree was 20 years ago. The second best time is now." - Chinese Proverb',
      '"An unexamined life is not worth living." - Socrates',
      "\"Your time is limited, don't waste it living someone else's life.\" - Steve Jobs",
      '"The way to get started is to quit talking and begin doing." - Walt Disney',
    ];

    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    await message.sendreply(`✨ *Inspirational Quote*\n\n${quote}`);
  } catch (error) {
    console.error("Quote command error:", error);
    await message.send("❌ _Failed to get quote_");
  }
});

Module({
  command: "flip",
  package: "fun",
  description: "Flip a coin",
})(async (message) => {
  try {
    const result = Math.random() < 0.5 ? "🪙 *Heads*" : "🪙 *Tails*";
    await message.sendreply(result);
  } catch (error) {
    console.error("Flip command error:", error);
    await message.send("❌ _Failed to flip coin_");
  }
});

Module({
  command: "roll",
  package: "fun",
  description: "Roll a dice",
})(async (message) => {
  try {
    const roll = Math.floor(Math.random() * 6) + 1;
    const dice = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
    await message.sendreply(`🎲 You rolled: ${dice[roll - 1]} *${roll}*`);
  } catch (error) {
    console.error("Roll command error:", error);
    await message.send("❌ _Failed to roll dice_");
  }
});
