// ============================================
// lib/pairing.js - Pairing Code Generation (ESM)
// ============================================
import { createBaileysConnection } from "./connection.js";

async function waitForOpen(sock, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      sock.ev.off("connection.update", handler);
      reject(new Error("Timed out waiting for connection to open"));
    }, timeoutMs);

    const handler = (update) => {
      const { connection, lastDisconnect } = update || {};

      if (connection === "open") {
        clearTimeout(timeout);
        sock.ev.off("connection.update", handler);
        resolve();
        return;
      } else if (connection === "close") {
        clearTimeout(timeout);
        sock.ev.off("connection.update", handler);
        const err = lastDisconnect?.error || new Error("Connection closed before open");
        reject(err);
      }
    };

    sock.ev.on("connection.update", handler);
  });
}

export async function generatePairingCode(sessionId, phoneNumber) {
  const cleanNumber = String(phoneNumber || "").replace(/[^0-9]/g, "");

  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    attempts += 1;
    try {
      const sock = await createBaileysConnection(sessionId);
      if (!sock) throw new Error("Failed to create socket");

      try {
        await waitForOpen(sock, 20000);
      } catch (waitErr) {
        // Log but proceed to attempt requestPairingCode once the socket might be usable
        console.warn(`⚠️ [${sessionId}] waitForOpen warning: ${waitErr.message}`);
      }

      if (!sock.requestPairingCode) throw new Error("Pairing not supported by this socket");

      return await sock.requestPairingCode(cleanNumber);
    } catch (err) {
      console.error(`❌ [${sessionId}] requestPairingCode attempt ${attempts} failed:`, err?.message || err);

      const payloadErr = err?.output?.payload?.error || err?.message || "";
      const statusCode = err?.output?.statusCode || err?.output?.payload?.statusCode || null;

      // If it's a connection-closed type error, try once more after a short delay
      if (attempts < maxAttempts && (payloadErr === "Connection Closed" || statusCode === 428 || /closed/i.test(payloadErr))) {
        console.log(`ℹ️ [${sessionId}] Retrying pairing (attempt ${attempts + 1}/${maxAttempts}) after brief delay...`);
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }

      // Otherwise, surface the error
      throw err;
    }
  }

  throw new Error("Failed to generate pairing code after retries");
}
