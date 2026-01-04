// lib/group-cache.js
// Minimal per-session group metadata cache, bounded and TTL'd.
// Stores only: id, subject, description, owner, adminIds, participantsCount, createdAt, lastUpdatedAt, isBotAdmin (when conn provided).

import { LRUCache } from "lru-cache";
import { jidNormalizedUser } from "@whiskeysockets/baileys";

/* ---------- CONFIG (tune via env) ---------- */
const GLOBAL_MAX_SESSIONS = Number(process.env.GROUPCACHE_MAX_SESSIONS) || 50;
const PER_SESSION_MAX_GROUPS = Number(process.env.GROUPCACHE_MAX_GROUPS) || 1000;
const PER_GROUP_TTL_MS = Number(process.env.GROUPCACHE_GROUP_TTL_MS) || 1000 * 60 * 60 * 24; // 24h
const PREFETCH_GROUPS_LIMIT = Number(process.env.GROUPCACHE_PREFETCH_LIMIT) || 300;
const PRUNE_INTERVAL_MS = 1000 * 60 * 5; // background prune every 5m
// Optional per-session byte cap (if set, enforce per-session memory budget)
const PER_SESSION_MAX_BYTES = Number(process.env.GROUPCACHE_PER_SESSION_MAX_BYTES) || 0;
// Auto-clean interval (defaults to prune interval)
const AUTO_CLEAN_INTERVAL_MS = Number(process.env.GROUPCACHE_AUTO_CLEAN_INTERVAL_MS) || PRUNE_INTERVAL_MS;

/* ---------- helpers ---------- */
function safeNorm(j) {
  try {
    return jidNormalizedUser(String(j));
  } catch {
    return String(j || "");
  }
}
function estimateSizeBytes(obj) {
  try {
    if (!obj) return 128;
    let size = 128;
    // add lengths of common string fields
    if (obj.id) size += Buffer.byteLength(String(obj.id), 'utf8');
    if (obj.subject) size += Buffer.byteLength(String(obj.subject), 'utf8');
    if (obj.description) size += Buffer.byteLength(String(obj.description), 'utf8');
    if (obj.owner) size += Buffer.byteLength(String(obj.owner), 'utf8');
    if (Array.isArray(obj.adminIds)) {
      for (const a of obj.adminIds) size += Buffer.byteLength(String(a), 'utf8') + 8;
    }
    // rough per-participant cost
    size += ((obj.participantsCount || 0) * 8);
    return Math.max(size, 128);
  } catch {
    return 128;
  }
}
// cap lengths to avoid storing huge blobs in memory
const MAX_SUBJECT_LEN = Number(process.env.GROUPCACHE_MAX_SUBJECT_LEN) || 200;
const MAX_DESC_LEN = Number(process.env.GROUPCACHE_MAX_DESC_LEN) || 500;
function compactFromRaw(mdRaw = {}, conn = null) {
  // mdRaw typically from conn.groupMetadata(jid)
  const id = mdRaw.id || mdRaw.jid || mdRaw?.id || null;
  // truncate to keep memory bounded
  const subject = (mdRaw.subject || mdRaw.name || "").toString().slice(0, MAX_SUBJECT_LEN);
  const description = (mdRaw.desc || mdRaw.description || "").toString().slice(0, MAX_DESC_LEN);
  const owner = mdRaw.owner ? safeNorm(mdRaw.owner) : null;
  // participants: extract admin ids if any (limit admin list size)
  let adminIds = [];
  try {
    const parts = mdRaw.participants || [];
    for (const p of parts) {
      // p may be string or object with id/admin/isAdmin/admin === 'admin'
      const pid = typeof p === "string" ? p : (p?.id || p?.jid || null);
      if (!pid) continue;
      const isAdmin = !!(typeof p === "object" && (p.admin === true || p.isAdmin === true || p.admin === "admin"));
      if (isAdmin) adminIds.push(safeNorm(pid));
    }
    // dedupe and cap to first 50 admins (extremely unlikely to be >50)
    adminIds = Array.from(new Set(adminIds)).slice(0, 50);
  } catch {
    adminIds = [];
  }
  const participantsCount = (mdRaw.participants && mdRaw.participants.length) || mdRaw.size || 0;

  // compute isBotAdmin if conn provided
  let isBotAdmin = false;
  try {
    if (conn && conn.user && conn.user.id) {
      const botJ = safeNorm(conn.user.id);
      isBotAdmin = adminIds.some((a) => a === botJ);
    }
  } catch { isBotAdmin = false; }

  const now = Date.now();
  const out = {
    id,
    subject,
    description,
    owner,
    adminIds,
    participantsCount,
    isBotAdmin,
    createdAt: mdRaw.createdAt || now,
    lastUpdatedAt: now,
  };
  out._size = Math.max(estimateSizeBytes(out), 128);
  return out;
}

/* ---------- LRU storage ---------- */
// global sessions LRU; each entry holds a `groups` LRU and inflight map
// sessions LRU: either cap by number of sessions or by total bytes (if configured)
const SESSIONS_MAX_BYTES = Number(process.env.GROUPCACHE_MAX_BYTES) || 0;
let sessions;
if (SESSIONS_MAX_BYTES > 0) {
  // use size-based eviction when max bytes provided; sizeCalculation uses session._size
  sessions = new LRUCache({
    maxSize: SESSIONS_MAX_BYTES,
    sizeCalculation: (s) => s._size || 1,
    ttlAutopurge: true,
  });
} else {
  sessions = new LRUCache({
    max: GLOBAL_MAX_SESSIONS,
    ttlAutopurge: true,
  });
}

function _ensureSession(sessionId) {
  if (!sessionId) throw new Error("sessionId required");
  let s = sessions.get(sessionId);
  if (s) return s;
  const groups = new LRUCache({
    max: PER_SESSION_MAX_GROUPS,
    ttl: PER_GROUP_TTL_MS,
    ttlAutopurge: true,
  });
  s = { groups, inflight: new Map(), _size: 1 };
  sessions.set(sessionId, s);
  return s;
}
function _recalcSessionSize(sessionId) {
  const s = sessions.get(sessionId);
  if (!s) return;
  let total = 0;
  s.groups.forEach((v) => { total += (v && v._size) ? v._size : 128; });
  s._size = Math.max(total, 1);
  sessions.set(sessionId, s);
}

// Enforce per-session limits (group count and optional byte budget). This removes least-recent entries until
// session respects configured limits. Returns number of evicted groups.
function _enforceSessionLimits(sessionId, s) {
  if (!s) s = sessions.get(sessionId);
  if (!s) return 0;
  let evicted = 0;

  // cap by group count (ensure we don't grow beyond PER_SESSION_MAX_GROUPS)
  try {
    while (s.groups.size > PER_SESSION_MAX_GROUPS) {
      // delete least-recently-used keys by iterating keys and removing from the end
      const keys = Array.from(s.groups.keys());
      if (keys.length === 0) break;
      const oldest = keys[keys.length - 1];
      const prev = s.groups.get(oldest);
      const prevSize = prev && prev._size ? prev._size : 0;
      s.groups.delete(oldest);
      s.inflight.delete(oldest);
      s._size = Math.max((s._size || 0) - prevSize, 1);
      evicted++;
    }
  } catch (e) { /* best-effort */ }

  // cap by per-session bytes if configured
  try {
    if (PER_SESSION_MAX_BYTES > 0) {
      while ((s._size || 0) > PER_SESSION_MAX_BYTES) {
        const keys = Array.from(s.groups.keys());
        if (keys.length === 0) break;
        const oldest = keys[keys.length - 1];
        const prev = s.groups.get(oldest);
        const prevSize = prev && prev._size ? prev._size : 0;
        s.groups.delete(oldest);
        s.inflight.delete(oldest);
        s._size = Math.max((s._size || 0) - prevSize, 1);
        evicted++;
      }
    }
  } catch (e) { /* ignore */ }

  if (evicted > 0) {
    s._lastCleanAt = Date.now();
    s._lastEvicted = evicted;
    sessions.set(sessionId, s);
  }
  return evicted;
}

// Manual clean helpers
export function cleanSession(sessionId) {
  const s = sessions.get(sessionId);
  if (!s) return 0;
  return _enforceSessionLimits(sessionId, s);
}

export function cleanAllSessions() {
  let totalEvicted = 0;
  try {
    sessions.forEach((s, sid) => {
      try {
        if (s?.groups?.purge) {
          try { s.groups.purge(); } catch {}
        }
        totalEvicted += _enforceSessionLimits(sid, s);
        try { _recalcSessionSize(sid); } catch {}
      } catch {}
    });
  } catch {}
  return totalEvicted;
}

/* ---------- API (session-first) ---------- */
export function getCached(sessionId, jid) {
  const s = _ensureSession(sessionId);
  return s.groups.get(jid) || null;
}

export function setCached(sessionId, jid, metadata) {
  if (!sessionId || !jid || !metadata) return;
  const s = _ensureSession(sessionId);
  // keep the metadata compact and deterministic; truncate strings
  const compact = {
    id: metadata.id || jid,
    subject: (metadata.subject || metadata.name || "").toString().slice(0, MAX_SUBJECT_LEN),
    description: (metadata.description || metadata.desc || "").toString().slice(0, MAX_DESC_LEN),
    owner: metadata.owner ? safeNorm(metadata.owner) : (metadata.owner || null),
    adminIds: Array.isArray(metadata.adminIds) ? Array.from(new Set(metadata.adminIds.map(safeNorm))).slice(0,50) : [],
    participantsCount: metadata.participantsCount || metadata.participants?.length || 0,
    isBotAdmin: !!metadata.isBotAdmin,
    createdAt: metadata.createdAt || Date.now(),
    lastUpdatedAt: Date.now(),
  };
  compact._size = Math.max(estimateSizeBytes(compact), 128);

  // incremental session size accounting to avoid full scans
  const prev = s.groups.get(jid);
  const prevSize = prev && prev._size ? prev._size : 0;
  s.groups.set(jid, compact);
  s._size = Math.max((s._size || 0) + compact._size - prevSize, 1);
  sessions.set(sessionId, s);
}

export function deleteCached(sessionId, jid) {
  if (!sessionId) return;
  const s = _ensureSession(sessionId);
  const prev = s.groups.get(jid);
  const prevSize = prev && prev._size ? prev._size : 0;
  s.groups.delete(jid);
  s.inflight.delete(jid);
  s._size = Math.max((s._size || 0) - prevSize, 1);
  sessions.set(sessionId, s);
}

export function listCachedJids(sessionId) {
  const s = _ensureSession(sessionId);
  return Array.from(s.groups.keys());
}

/**
 * Fetch group metadata with inflight dedupe for a session.
 * signature: getGroupMetadata(sessionId, conn, jid)
 * - conn optional only for computing isBotAdmin at fetch time; if absent, saved value may have outdated isBotAdmin.
 */
export async function getGroupMetadata(sessionId, conn, jid) {
  if (!sessionId) throw new Error("sessionId required");
  if (!jid) throw new Error("jid required");
  const s = _ensureSession(sessionId);
  const cached = s.groups.get(jid);
  // if present and fresh per LRU/TTL, return it
  if (cached) {
    // if conn present and bot admin might be stale, recompute isBotAdmin cheaply
    if (conn && conn.user && conn.user.id) {
      try {
        const botJ = safeNorm(conn.user.id);
        const isBotAdmin = (cached.adminIds || []).some(a => a === botJ);
        if (cached.isBotAdmin !== isBotAdmin) {
          const patched = { ...cached, isBotAdmin, lastUpdatedAt: Date.now() };
          patched._size = Math.max(estimateSizeBytes(patched), 128);
          s.groups.set(jid, patched);
          _recalcSessionSize(sessionId);
          return patched;
        }
      } catch { /* ignore */ }
    }
    return cached;
  }
  // inflight dedupe
  if (s.inflight.has(jid)) return s.inflight.get(jid);
  const p = (async () => {
    try {
      // fetch from server
      if (!conn || typeof conn.groupMetadata !== "function") {
        // can't fetch; create minimal stub
        const stub = { id: jid, subject: "", description: "", owner: null, adminIds: [], participantsCount: 0, isBotAdmin: false, createdAt: Date.now(), lastUpdatedAt: Date.now() };
        stub._size = Math.max(estimateSizeBytes(stub), 128);
        const prev = s.groups.get(jid);
        const prevSize = prev && prev._size ? prev._size : 0;
        s.groups.set(jid, stub);
        s._size = Math.max((s._size || 0) + stub._size - prevSize, 1);
        sessions.set(sessionId, s);
        return s.groups.get(jid);
      }
      const mdRaw = await conn.groupMetadata(jid);
      const compact = compactFromRaw(mdRaw || {}, conn);
      const prev = s.groups.get(jid);
      const prevSize = prev && prev._size ? prev._size : 0;
      s.groups.set(jid, compact);
      s._size = Math.max((s._size || 0) + compact._size - prevSize, 1);
      sessions.set(sessionId, s);
      return s.groups.get(jid);
    } catch (err) {
      // on error, keep inflight cleared and rethrow
      throw err;
    } finally {
      s.inflight.delete(jid);
    }
  })();
  s.inflight.set(jid, p);
  return p;
}

/**
 * updateCached: merge partial updates (subject, description, participants)
 * keep small shape
 */
export function updateCached(sessionId, jid, updateObj) {
  if (!sessionId || !jid || !updateObj) return;
  const s = _ensureSession(sessionId);
  const cached = s.groups.get(jid) || { id: jid, subject: "", description: "", owner: null, adminIds: [], participantsCount: 0, isBotAdmin: false, createdAt: Date.now(), lastUpdatedAt: Date.now() };
  const merged = { ...cached, ...updateObj, lastUpdatedAt: Date.now() };
  // if participants present, recompute adminIds and participantsCount
  if (Array.isArray(updateObj.participants)) {
    const ids = [];
    for (const p of updateObj.participants) {
      try {
        const pid = typeof p === "string" ? p : (p.id || p.jid || null);
        if (!pid) continue;
        const isAdmin = !!(typeof p === "object" && (p.admin === true || p.isAdmin === true || p.admin === "admin"));
        if (isAdmin) ids.push(safeNorm(pid));
      } catch {}
    }
    merged.adminIds = Array.from(new Set([...(merged.adminIds || []), ...ids])).slice(0,50);
    merged.participantsCount = updateObj.participants.length || merged.participantsCount;
  }
  merged._size = Math.max(estimateSizeBytes(merged), 128);
  const prev = s.groups.get(jid);
  const prevSize = prev && prev._size ? prev._size : 0;
  s.groups.set(jid, merged);
  s._size = Math.max((s._size || 0) + merged._size - prevSize, 1);
  sessions.set(sessionId, s);
}

/**
 * Prefetch participating groups (bounded to PREFETCH_GROUPS_LIMIT)
 * returns number loaded
 */
export async function prefetchAllParticipating(sessionId, conn) {
  if (!conn || typeof conn.groupFetchAllParticipating !== "function") return 0;
  const s = _ensureSession(sessionId);
  try {
    const all = await conn.groupFetchAllParticipating();
    let count = 0;
    // accumulate size delta to avoid repeated recalc calls
    let delta = 0;
    for (const [jid, md] of Object.entries(all || {})) {
      if (count >= PREFETCH_GROUPS_LIMIT) break;
      if (!md) continue;
      const compact = compactFromRaw(md, conn);
      const prev = s.groups.get(jid);
      const prevSize = prev && prev._size ? prev._size : 0;
      s.groups.set(jid, compact);
      delta += compact._size - prevSize;
      count++;
    }
    if (delta !== 0) {
      s._size = Math.max((s._size || 0) + delta, 1);
      sessions.set(sessionId, s);
    }
    return count;
  } catch (err) {
    return 0;
  }
}

/* ---------- lifecycle helpers ---------- */
export function deleteSession(sessionId) {
  if (!sessionId) return;
  sessions.delete(sessionId);
}
export function listSessions() {
  return Array.from(sessions.keys());
}

/* ---------- convenience bound API ---------- */
export function forSession(sessionId) {
  if (!sessionId) throw new Error("sessionId required");
  return {
    getCached: (jid) => getCached(sessionId, jid),
    setCached: (jid, md) => setCached(sessionId, jid, md),
    deleteCached: (jid) => deleteCached(sessionId, jid),
    listCachedJids: () => listCachedJids(sessionId),
    getGroupMetadata: (conn, jid) => getGroupMetadata(sessionId, conn, jid),
    updateCached: (jid, obj) => updateCached(sessionId, jid, obj),
    prefetchAllParticipating: (conn) => prefetchAllParticipating(sessionId, conn),
    deleteSession: () => deleteSession(sessionId),
    listSessions: () => listSessions(),
    // convenience helpers
    clean: () => cleanSession(sessionId),
    stats: () => ({ groups: (sessions.get(sessionId)?.groups?.size) || 0, approxBytes: (sessions.get(sessionId)?._size) || 0, lastCleanAt: sessions.get(sessionId)?._lastCleanAt || null, lastEvicted: sessions.get(sessionId)?._lastEvicted || 0 }),
  };
}

/* ---------- background maintenance ---------- */
// Periodic maintenance: purge internal TTL'd items, then enforce limits and recalc sizes
const _pruneTimer = setInterval(() => {
  try {
    sessions.forEach((s, sid) => {
      try { if (s?.groups?.purge) s.groups.purge(); } catch {}
      // enforce configured per-session limits (count/bytes)
      try { _enforceSessionLimits(sid, s); } catch {}
      // full recalculation occasionally helps keep sizes accurate after purge
      try { _recalcSessionSize(sid); } catch {}
    });
  } catch {}
}, PRUNE_INTERVAL_MS);
if (_pruneTimer && _pruneTimer.unref) _pruneTimer.unref();

// Separate auto-clean loop runs more often if configured; keeps memory bounded proactively
if (AUTO_CLEAN_INTERVAL_MS > 0 && AUTO_CLEAN_INTERVAL_MS !== PRUNE_INTERVAL_MS) {
  const _autoCleanTimer = setInterval(() => {
    try {
      sessions.forEach((s, sid) => {
        try { _enforceSessionLimits(sid, s); } catch {}
      });
    } catch {}
  }, AUTO_CLEAN_INTERVAL_MS);
  if (_autoCleanTimer && _autoCleanTimer.unref) _autoCleanTimer.unref();
}

/* ---------- diagnostics ---------- */
export function stats() {
  const out = { totalSessions: sessions.size, sessions: [] };
  sessions.forEach((s, sid) => {
    out.sessions.push({ sessionId: sid, groups: s.groups.size, approxBytes: s._size, lastCleanAt: s._lastCleanAt || null, lastEvicted: s._lastEvicted || 0 });
  });
  return out;
}