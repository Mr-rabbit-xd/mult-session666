// ============================================
// lib/database.js - Simple JSON Database
// ============================================
import fs from "fs";

const DB_PATH = "./database.json";

function loadDB() {
  if (fs.existsSync(DB_PATH)) {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  }
  return { groups: {} };
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export function getGroupSettings(groupId) {
  const db = loadDB();
  if (!db.groups[groupId]) {
    db.groups[groupId] = {
      welcome: false,
      goodbye: false,
      antilink: false,
      antiword: [],
      antipromote: false,
      antidemote: false,
    };
    saveDB(db);
  }
  return db.groups[groupId];
}

export function updateGroupSettings(groupId, settings) {
  const db = loadDB();
  db.groups[groupId] = { ...db.groups[groupId], ...settings };
  saveDB(db);
  return db.groups[groupId];
}
