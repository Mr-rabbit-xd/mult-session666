// wal-db-fast.mjs
// ESM version of WalDBFast
// Usage:
// import WalDBFast from './wal-db-fast.mjs';
// const db = new WalDBFast({ dir: './data' });
// await db.ready();
// if (db.get(sessionId, 'autoread') === true) { await sock.readMessages([msg.key]); }
// db.setHot(sessionId, 'autoread', true);

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { once } from 'events';

class WalDBFast {
  constructor(options = {}) {
    this.dir = options.dir ? String(options.dir) : path.join(process.cwd(), 'data');
    this.snapshotFile = options.snapshotFile || 'snapshot.json';
    this.journalFile = options.journalFile || 'journal.log';
    this.metaFile = options.metaFile || 'meta.json';
    this.hotFile = options.hotFile || 'hot.json'; // persistent hot-key index
    this.journalMaxEntries = typeof options.journalMaxEntries === 'number' ? options.journalMaxEntries : 200_000;
    this.compactIntervalMs = typeof options.compactIntervalMs === 'number' ? options.compactIntervalMs : 60_000;
    this.pretty = !!options.pretty;
    this.durable = !!options.durable;

    // in-memory main cache and hot-index
    this.cache = new Map();                 // Map<sid, Map<key,value>>
    this.hotIndex = new Map();              // Map<sid, { key: value, ... }>
    this.blocked = new Set();               // blocked sessions (persisted in meta.json)

    // internals
    this._journalEntries = 0;
    this._journalBytes = 0;
    this._journalStream = null;
    this._initPromise = null;
    this._compacting = false;
    this._writeQueue = [];
    this._closing = false;
    this._pendingRestores = new Map();     // sid -> Promise
    this._hotPersistTimer = null;
    this._hotDirty = false;

    this._ensureDirAndInit();
  }

  // ---------- init ----------
  async _ensureDirAndInit() {
    await fs.promises.mkdir(this.dir, { recursive: true }).catch(()=>{});
    this.snapshotPath = path.join(this.dir, this.snapshotFile);
    this.journalPath = path.join(this.dir, this.journalFile);
    this.metaPath = path.join(this.dir, this.metaFile);
    this.hotPath = path.join(this.dir, this.hotFile);

    this._initPromise = (async () => {
      await this._loadMeta();
      await this._loadHotIndex();           // load hot keys first (so get() returns correct after ready)
      await this._loadSnapshotAndReplay();  // full restore of unblocked sessions (may be large)
      await this._openJournalStream();
      if (this.compactIntervalMs > 0) this._startPeriodicCompaction();
    })().catch(err => { console.error('[WalDBFast] init error', err); throw err; });

    return this._initPromise;
  }

  async ready() { return this._initPromise; }

  // ---------- meta & hot ----------
  async _loadMeta() {
    try {
      const raw = await fs.promises.readFile(this.metaPath, 'utf8').catch(()=>null);
      if (raw) {
        const parsed = JSON.parse(raw || '{}');
        this.blocked = new Set((Array.isArray(parsed.blocked) ? parsed.blocked : []).map(String));
      } else {
        this.blocked = new Set();
      }
    } catch (e) { console.warn('[WalDBFast] meta read failed', e); this.blocked = new Set(); }
  }

  async _persistMeta() {
    const tmp = this.metaPath + '.tmp';
    const data = this.pretty ? JSON.stringify({ blocked: Array.from(this.blocked) }, null, 2)
                            : JSON.stringify({ blocked: Array.from(this.blocked) });
    await fs.promises.writeFile(tmp, data, 'utf8');
    if (this.durable) { const fd = await fs.promises.open(tmp,'r'); await fd.sync(); await fd.close(); }
    await fs.promises.rename(tmp, this.metaPath);
  }

  async _loadHotIndex() {
    try {
      const raw = await fs.promises.readFile(this.hotPath, 'utf8').catch(()=>null);
      if (raw) {
        const parsed = JSON.parse(raw || '{}');
        // parsed: { sid: { key: value, ... }, ... }
        for (const [sid, kv] of Object.entries(parsed || {})) {
          this.hotIndex.set(String(sid), Object.assign({}, kv));
        }
      }
    } catch (e) { console.warn('[WalDBFast] hot index load failed', e); this.hotIndex = new Map(); }
  }

  _scheduleHotPersist(delay = 500) {
    this._hotDirty = true;
    if (this._hotPersistTimer) clearTimeout(this._hotPersistTimer);
    this._hotPersistTimer = setTimeout(() => {
      this._hotPersistTimer = null;
      this._persistHotIndex().catch(err => console.error('[WalDBFast] persist hot failed', err));
    }, delay);
    if (this._hotPersistTimer && this._hotPersistTimer.unref) this._hotPersistTimer.unref();
  }

  async _persistHotIndex() {
    if (!this._hotDirty) return;
    const tmp = this.hotPath + '.tmp';
    const obj = Object.create(null);
    for (const [sid, kv] of this.hotIndex.entries()) obj[sid] = kv;
    const data = this.pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
    try {
      await fs.promises.writeFile(tmp, data, 'utf8');
      if (this.durable) { const fd = await fs.promises.open(tmp,'r'); await fd.sync(); await fd.close(); }
      await fs.promises.rename(tmp, this.hotPath);
      this._hotDirty = false;
    } catch (e) {
      console.error('[WalDBFast] hot persist error', e);
    }
  }

  // ---------- snapshot + journal ----------
  async _loadSnapshotAndReplay() {
    // Load snapshot but skip blocked sessions when populating cache
    try {
      const raw = await fs.promises.readFile(this.snapshotPath, 'utf8').catch(()=>null);
      if (raw) {
        const parsed = JSON.parse(raw);
        for (const [sid, kv] of Object.entries(parsed || {})) {
          if (this.blocked.has(String(sid))) continue; // don't load blocked sessions into memory
          const m = new Map();
          for (const [k, v] of Object.entries(kv || {})) m.set(k, v);
          this.cache.set(String(sid), m);
        }
      }
    } catch (e) { console.warn('[WalDBFast] snapshot load failed', e); }

    // Replay journal; skip blocked sessions
    try {
      const stat = await fs.promises.stat(this.journalPath).catch(()=>null);
      if (!stat || stat.size === 0) { this._journalEntries = 0; this._journalBytes = stat ? stat.size : 0; return; }
      const rl = readline.createInterface({ input: fs.createReadStream(this.journalPath, { encoding: 'utf8' }), crlfDelay: Infinity });
      let entries = 0;
      for await (const line of rl) {
        if (!line) continue;
        try {
          const op = JSON.parse(line);
          if (this.blocked.has(String(op.sid))) { /* skip */ }
          else this._applyOpToCache(op, false);
          entries++;
        } catch (e) { /* skip malformed */ }
      }
      this._journalEntries = entries;
      this._journalBytes = stat.size;
    } catch (e) { console.warn('[WalDBFast] journal replay failed', e); }
  }

  async _openJournalStream() {
    this._journalStream = fs.createWriteStream(this.journalPath, { flags: 'a' });
    this._journalStream.on('error', e => console.error('[WalDBFast] journal stream error', e));
  }

  _appendJournal(op) {
    if (this._compacting || this._closing) {
      return new Promise((resolve, reject) => { this._writeQueue.push({ op, resolve, reject }); });
    }
    const line = JSON.stringify(op) + '\n';
    this._journalBytes += Buffer.byteLength(line);
    this._journalEntries++;
    const ok = this._journalStream.write(line);
    if (ok) return Promise.resolve();
    return once(this._journalStream, 'drain').then(()=>{});
  }

  // ---------- core apply ----------
  _applyOpToCache(op) {
    const sid = String(op.sid);
    if (op.op === 'set') {
      let m = this.cache.get(sid);
      if (!m) { m = new Map(); this.cache.set(sid, m); }
      m.set(String(op.key), op.value);
    } else if (op.op === 'del') {
      const m = this.cache.get(sid);
      if (!m) return;
      m.delete(String(op.key));
      if (m.size === 0) this.cache.delete(sid);
    } else if (op.op === 'clear_session') {
      this.cache.delete(sid);
    }
  }

  // ---------- synchronous fast read (no await) ----------
  // Returns value if found in memory or hot-index, otherwise returns default immediately
  // and triggers async restore/unblock in background.
  get(sessionId, key, defaultValue = undefined) {
    const sid = String(sessionId);

    // 1) check main cache (fast)
    const s = this.cache.get(sid);
    if (s && s.has(key)) return s.get(key);

    // 2) check hot index (fast) - this is what gives you immediate correctness for critical flags like 'autoread'
    const hot = this.hotIndex.get(sid);
    if (hot && Object.prototype.hasOwnProperty.call(hot, key)) return hot[key];

    // 3) Not in memory: trigger async restore/unblock in background and return default immediately.
    // Background restore: auto-unblock (remove blocked) and rebuild the session map
    this._ensureSessionRestoredAndUnblockedBg(sid).catch(err => console.error('[WalDBFast] bg restore failed', err));
    return defaultValue;
  }

  // ---------- async read if you need guaranteed restored value ----------
  async getAsync(sessionId, key, defaultValue = undefined) {
    const sid = String(sessionId);
    await this._ensureSessionRestoredAndUnblocked(sid);
    const s = this.cache.get(sid);
    if (s && s.has(key)) return s.get(key);
    const hot = this.hotIndex.get(sid);
    if (hot && Object.prototype.hasOwnProperty.call(hot, key)) return hot[key];
    return defaultValue;
  }

  // ---------- set/del (async for disk durability) ----------
  async set(sessionId, key, value) {
    const sid = String(sessionId);
    await this._ensureSessionRestoredAndUnblocked(sid);
    const op = { op: 'set', sid, key: String(key), value };
    this._applyOpToCache(op);
    await this._appendJournal(op);
    await this._maybeCompact();
  }

  async del(sessionId, key) {
    const sid = String(sessionId);
    await this._ensureSessionRestoredAndUnblocked(sid);
    const op = { op: 'del', sid, key: String(key) };
    this._applyOpToCache(op);
    await this._appendJournal(op);
    await this._maybeCompact();
  }

  // ---------- HOT KEYS (synchronous update, persisted async) ----------
  // Use for flags you need immediate correctness (eg 'autoread').
  // setHot updates in-memory hotIndex immediately and schedules persistence and journaling.
// ---------- HOT KEYS (synchronous update, persisted async) ----------
setHot(sessionId, key, value) {
  const sid = String(sessionId);

  // 1) update hotIndex (so it persists across restarts)
  const obj = this.hotIndex.get(sid) || {};
  obj[key] = value;
  this.hotIndex.set(sid, obj);
  this._scheduleHotPersist();

  // 2) ensure main cache is in sync so get() sees the new value immediately
  let m = this.cache.get(sid);
  if (!m) { m = new Map(); this.cache.set(sid, m); }
  m.set(String(key), value);

  // 3) append journal op asynchronously (fire-and-forget)
  const op = { op: 'set', sid, key: String(key), value };
  this._appendJournal(op).catch(err => console.error('[WalDBFast] setHot journal append failed', err));
}

delHot(sessionId, key) {
  const sid = String(sessionId);

  // 1) update hotIndex
  const obj = this.hotIndex.get(sid);
  if (obj) {
    delete obj[key];
    this.hotIndex.set(sid, obj);
    this._scheduleHotPersist();
  }

  // 2) remove from main cache as well (so get() won't return stale value)
  const m = this.cache.get(sid);
  if (m) {
    m.delete(String(key));
    if (m.size === 0) this.cache.delete(sid);
  }

  // 3) append journal op asynchronously
  const op = { op: 'del', sid, key: String(key) };
  this._appendJournal(op).catch(err => console.error('[WalDBFast] delHot journal append failed', err));
}

  // ---------- logout: remove from memory and mark blocked ----------
  async logout(sessionId) {
    const sid = String(sessionId);
    if (!this.blocked.has(sid)) {
      this.blocked.add(sid);
      await this._persistMeta();
    }
    if (this.cache.has(sid)) this.cache.delete(sid);
    // NOTE: hotIndex is preserved so hot keys remain immediately available across restarts.
  }

  // ---------- internal: background ensure restore (non-blocking) ----------
  async _ensureSessionRestoredAndUnblocked(sid) {
    if (this.cache.has(sid)) return;
    if (this._pendingRestores.has(sid)) return this._pendingRestores.get(sid);
    // If blocked, unblock and persist meta
    if (this.blocked.has(sid)) {
      this.blocked.delete(sid);
      await this._persistMeta().catch(err => console.warn('[WalDBFast] persist meta on unblock failed', err));
    }
    const p = this._restoreSessionFromDisk(sid)
      .catch(err => console.error('[WalDBFast] restore error', sid, err))
      .finally(() => this._pendingRestores.delete(sid));
    this._pendingRestores.set(sid, p);
    return p;
  }

  // background non-blocking version used by sync get()
  _ensureSessionRestoredAndUnblockedBg(sid) {
    if (this.cache.has(sid)) return Promise.resolve();
    if (this._pendingRestores.has(sid)) return this._pendingRestores.get(sid);
    // If blocked, remove block and persist meta asynchronously
    if (this.blocked.has(sid)) {
      this.blocked.delete(sid);
      this._persistMeta().catch(err => console.warn('[WalDBFast] async persist meta failed', err));
    }
    const p = this._restoreSessionFromDisk(sid)
      .catch(err => console.error('[WalDBFast] restore error', sid, err))
      .finally(() => this._pendingRestores.delete(sid));
    this._pendingRestores.set(sid, p);
    return p;
  }

  // rebuild session from snapshot + journaling only for this sid
  async _restoreSessionFromDisk(sid) {
    // read snapshot entry
    let base = null;
    try {
      const raw = await fs.promises.readFile(this.snapshotPath, 'utf8').catch(()=>null);
      if (raw) {
        const parsed = JSON.parse(raw || '{}');
        if (parsed && Object.prototype.hasOwnProperty.call(parsed, sid)) base = parsed[sid];
      }
    } catch (e) { console.warn('[WalDBFast] snapshot read during restore failed', e); }

    const m = new Map();
    if (base && typeof base === 'object') for (const [k,v] of Object.entries(base)) m.set(k, v);

    // scan journal and apply ops for this sid
    try {
      const rl = readline.createInterface({
        input: fs.createReadStream(this.journalPath, { encoding: 'utf8' }),
        crlfDelay: Infinity
      });
      for await (const line of rl) {
        if (!line) continue;
        try {
          const op = JSON.parse(line);
          if (String(op.sid) !== sid) continue;
          if (op.op === 'set') m.set(String(op.key), op.value);
          else if (op.op === 'del') m.delete(String(op.key));
          else if (op.op === 'clear_session') m.clear();
        } catch (e) { /* ignore malform */ }
      }
    } catch (e) { console.warn('[WalDBFast] journal read during restore failed', e); }

    this.cache.set(sid, m);
  }

  // ---------- compaction / snapshot ----------
  async _maybeCompact() {
    if (this._compacting) return;
    if (this._journalEntries >= this.journalMaxEntries) await this._compact();
  }

  _startPeriodicCompaction() {
    this._compactTimer = setInterval(()=> {
      if (this._journalEntries > 0) this._compact().catch(e=>console.error('[WalDBFast] compact failed', e));
    }, this.compactIntervalMs);
    if (this._compactTimer.unref) this._compactTimer.unref();
  }

  async _compact() {
    if (this._compacting) return;
    this._compacting = true;
    try {
      await new Promise((resolve, reject) => {
        this._journalStream.end(()=>resolve());
        this._journalStream.on('error', reject);
      });
    } catch (e) { console.warn('[WalDBFast] error closing journal stream', e); }

    // snapshot: export only in-memory unblocked sessions
    const obj = Object.create(null);
    for (const [sid, map] of this.cache.entries()) {
      obj[sid] = Object.create(null);
      for (const [k,v] of map.entries()) obj[sid][k] = v;
    }
    const tmp = this.snapshotPath + '.tmp';
    const data = this.pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
    try {
      await fs.promises.writeFile(tmp, data, 'utf8');
      if (this.durable) { const fd = await fs.promises.open(tmp,'r'); await fd.sync(); await fd.close(); }
      await fs.promises.rename(tmp, this.snapshotPath);
    } catch (e) { console.error('[WalDBFast] snapshot write failed', e); }

    // recreate empty journal
    try {
      await fs.promises.writeFile(this.journalPath, '', 'utf8');
      this._journalStream = fs.createWriteStream(this.journalPath, { flags: 'a' });
      this._journalEntries = 0;
      this._journalBytes = 0;
    } catch (e) {
      console.error('[WalDBFast] recreate journal failed', e);
      try { this._journalStream = fs.createWriteStream(this.journalPath, { flags: 'a' }); } catch {}
    }

    // flush queued writes
    const queue = this._writeQueue; this._writeQueue = [];
    for (const item of queue) {
      try {
        this._applyOpToCache(item.op);
        const line = JSON.stringify(item.op) + '\n';
        this._journalBytes += Buffer.byteLength(line);
        this._journalEntries++;
        const ok = this._journalStream.write(line);
        if (!ok) await once(this._journalStream, 'drain');
        item.resolve();
      } catch (e) { item.reject(e); }
    }

    this._compacting = false;
  }

  // ---------- flush / close ----------
  async flush() {
    if (this._journalStream && !this._journalStream.writable) await once(this._journalStream, 'finish').catch(()=>{});
    await this._compact();
    await this._persistHotIndex().catch(()=>{});
    await this._persistMeta().catch(()=>{});
  }

  async close() {
    this._closing = true;
    if (this._compactTimer) clearInterval(this._compactTimer);
    try { await this.flush(); } catch(e){ console.warn('[WalDBFast] flush failed', e); }
    try { if (this._journalStream) this._journalStream.end(); } catch {}
    this._closing = false;
  }

  // ---------- utilities ----------
  isBlocked(sessionId) { return this.blocked.has(String(sessionId)); }
  export() {
    const out = Object.create(null);
    for (const [sid, map] of this.cache.entries()) {
      out[sid] = Object.create(null);
      for (const [k,v] of map.entries()) out[sid][k] = v;
    }
    return out;
  }
}

export default WalDBFast;