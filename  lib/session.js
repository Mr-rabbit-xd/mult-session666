// ============================================
// lib/session.js - Session Management
// ============================================
import fs from "fs";

export const sessions = new Map();

export function saveSession(sessionId, data) {
  const sessionPath = `./sessions/${sessionId}.json`;
  fs.mkdirSync("./sessions", { recursive: true });
  fs.writeFileSync(sessionPath, JSON.stringify(data, null, 2));
}

export function loadSession(sessionId) {
  const sessionPath = `./sessions/${sessionId}.json`;
  if (fs.existsSync(sessionPath)) {
    return JSON.parse(fs.readFileSync(sessionPath, "utf-8"));
  }
  return {};
}
