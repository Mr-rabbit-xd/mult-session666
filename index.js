// ============================================
// index.js - Main Server
// ============================================
import express from "express";
import { createBaileysConnection } from "./lib/connection.js";
import { sessions } from "./lib/session.js";
import { generatePairingCode } from "./lib/pairing.js";
const Boom = require("@hapi/boom");
const path = require("path");
const { db } = require("./lib/blockDB");
const { ref, set, get, remove, child } = require("firebase/database");
const config = require("./config");
const fs = require("fs-extra");
const {
  initSessions,
  saveSession,
  getAllSessions,
  deleteSession,
} = require("./lib/database/index");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

/**
 * Start a bot instance for a given number
 */
async function startBot(number) {
  try {
    console.log(`🔄 [${number}] Starting bot...`);

    const sessionDir = path.join(__dirname, "sessions", number);
    await fs.ensureDir(sessionDir);

    await createBaileysConnection(sessionId, phoneNumber);
    if (!conn) {
      console.error(`❌ [${number}] Failed to create connection`);
      return null;
    }

    // ✅ Save credentials to database
    const credPath = path.join(sessionDir, "creds.json");
    if (fs.existsSync(credPath)) {
      const creds = fs.readJSONSync(credPath);
      await saveSession(number, creds);
      console.log(`✅ [${number}] Session saved to database`);
    }

    return conn;
  } catch (err) {
    console.error(`❌ Failed to start bot for ${number}:`, err);
    return null;
  }
}

/**
 * Restore all sessions from DB + local
 */
async function restoreSessions() {
  const baileys = await import("baileys");
  const { delay } = baileys;

  try {
    console.log("🌱 Syncing Database...");
    await config.DATABASE.sync();

    const baseDir = path.join(__dirname, "sessions");
    await fs.ensureDir(baseDir);

    // 1️⃣ Get sessions from DB
    const dbSessions = await getAllSessions();
    const dbNumbers = dbSessions.map((s) => s.number);

    // 2️⃣ Get sessions from local folder
    const folderNumbers = (await fs.readdir(baseDir)).filter((f) =>
      fs.existsSync(path.join(baseDir, f, "creds.json"))
    );

    // 3️⃣ Merge DB + Folder (avoid duplicates)
    const allNumbers = [...new Set([...dbNumbers, ...folderNumbers])];

    if (!allNumbers.length) {
      console.log("⚠️ No sessions found in DB or local folders.");
      return;
    }

    console.log(
      `♻️ Restoring ${
        allNumbers.length
      } sessions at ${new Date().toLocaleString()}...`
    );

    // ✅ Restore sessions with delay to avoid rate limits
    for (const number of allNumbers) {
      try {
        const sessionDir = path.join(baseDir, number);
        await fs.ensureDir(sessionDir);
        const credPath = path.join(sessionDir, "creds.json");

        let creds;

        // 4️⃣ If folder has creds → sync to DB
        if (fs.existsSync(credPath)) {
          creds = await fs.readJSON(credPath);
          await saveSession(number, creds);
        }
        // 5️⃣ Else if DB has creds → write to folder
        else {
          const dbSession = dbSessions.find((s) => s.number === number);
          if (dbSession?.creds) {
            creds = dbSession.creds;
            await fs.writeJSON(credPath, creds, { spaces: 2 });
          }
        }

        // 6️⃣ Start the bot
        if (creds) {
          console.log(`🔄 Restoring session for ${number}...`);
          await startBot(number);

          // ✅ Add delay between sessions to avoid connection issues
          await delay(2000);
        } else {
          await deleteSession(number);
          console.log(`⚠️ No creds found for ${number}, skipping...`);
        }
      } catch (err) {
        console.error(`❌ Failed restoring session for ${number}:`, err);
      }
    }
  } catch (err) {
    console.error("❌ restoreSessions() failed:", err);
  }
}

// ==================== ROUTES ====================

app.get("/", (req, res) => {
  res.json({
    status: "online",
    timestamp: new Date().toISOString(),
    sessions: manager.connections.size,
  });
});

// Pair endpoint
app.get("/pair", async (req, res) => {
  try {
    const { number } = req.query;

    if (!number) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const sessionId = number.replace(/[^0-9]/g, "");

    if (sessions.has(sessionId)) {
      return res.status(400).json({
        success: false,
        message: "Session already exists",
      });
    }

    const pairingCode = await generatePairingCode(sessionId, number);

    res.json({
      success: true,
      sessionId,
      pairingCode,
      message:
        "Enter this code in WhatsApp: Settings > Linked Devices > Link a Device",
    });
  } catch (error) {
    console.error("Pairing error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Logout endpoint
app.get("/logout", async (req, res) => {
  try {
    const { number } = req.query;

    if (!number) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const sessionId = number.replace(/[^0-9]/g, "");
    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    await session.sock.logout();
    sessions.delete(sessionId);

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Status endpoint
app.get("/status", (req, res) => {
  const activeSessions = Array.from(sessions.keys());
  res.json({
    success: true,
    activeSessions: activeSessions.length,
    sessions: activeSessions,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Pair: http://localhost:${PORT}/pair?number=YOUR_NUMBER`);
  console.log(`🚪 Logout: http://localhost:${PORT}/logout?number=YOUR_NUMBER`);
});
