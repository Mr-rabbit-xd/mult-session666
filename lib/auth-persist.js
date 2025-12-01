import fs from 'fs-extra';
import path from 'path';
import zlib from 'zlib';
import crypto from 'crypto';

const SELECTED_PATTERNS = [
  'creds.json',
  // support both nested `keys/` layout and older top-level layout
  'keys/noise-key.json',
  'noise-key.json',
  'keys/signed-pre-key-*.json',
  'signed-pre-key-*.json',
  'keys/pre-key-*.json',
  'pre-key-*.json',
];

function matchPattern(name, pattern) {
  if (!pattern.includes('*')) return name === pattern;
  const [pre, post] = pattern.split('*');
  return name.startsWith(pre) && name.endsWith(post || '');
}

async function collectSelectedFilesRaw(authDir) {
  const map = {};
  if (!(await fs.pathExists(authDir))) return map;

  async function walk(dir, base = '') {
    const items = await fs.readdir(dir);
    for (const it of items) {
      const abs = path.join(dir, it);
      const rel = base ? `${base}/${it}` : it;
      const stat = await fs.stat(abs);
      if (stat.isDirectory()) {
        await walk(abs, rel);
      } else {
        const ok = SELECTED_PATTERNS.some((p) => matchPattern(rel, p));
        if (!ok) continue;
        const buf = await fs.readFile(abs);
        map[rel.replace(/\\/g, '/')] = buf;
      }
    }
  }

  await walk(authDir);
  return map;
}

function gzipAndEncode(buf) {
  const gz = zlib.gzipSync(buf);
  return { gz, b64: gz.toString('base64') };
}

function sha256hex(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

async function atomicWriteFile(absPath, buf, mode = 0o600) {
  const dir = path.dirname(absPath);
  await fs.ensureDir(dir);
  const tmp = `${absPath}.tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  await fs.writeFile(tmp, buf, { mode });
  await fs.rename(tmp, absPath);
  try { await fs.chmod(absPath, mode); } catch (e) { }
}

export async function persistSelectedFiles(sessionId, authDir, saveToDbFn, loadFromDbFn, opts = {}) {
  const attempts = opts.attempts ?? 5;
  const backoffBase = opts.backoffBase ?? 200; // ms
  const maxBytes = opts.maxBytes ?? parseInt(process.env.AUTH_MAX_BYTES || `${600 * 1024}`, 10);

  const rawMap = await collectSelectedFilesRaw(authDir);
  if (Object.keys(rawMap).length === 0) {
    const credsPath = path.join(authDir, 'creds.json');
    if (await fs.pathExists(credsPath)) {
      rawMap['creds.json'] = await fs.readFile(credsPath);
    }
  }

  if (Object.keys(rawMap).length === 0) {
    return { ok: false, reason: 'no_selected_files' };
  }

  const checksums = {};
  const encoded = {};
  let totalBytes = 0;
  for (const [rel, buf] of Object.entries(rawMap)) {
    checksums[rel] = sha256hex(buf);
    const { gz, b64 } = gzipAndEncode(buf);
    encoded[rel] = b64;
    totalBytes += gz.length;
  }

  let finalMap = encoded;
  let finalTotal = totalBytes;
  if (finalTotal > maxBytes) {
    const small = {};
    if (rawMap['creds.json']) small['creds.json'] = rawMap['creds.json'];
    if (rawMap['keys/noise-key.json']) small['keys/noise-key.json'] = rawMap['keys/noise-key.json'];
    const smallEncoded = {};
    let smallTotal = 0;
    for (const [rel, buf] of Object.entries(small)) {
      const { gz, b64 } = gzipAndEncode(buf);
      smallEncoded[rel] = b64;
      smallTotal += gz.length;
    }
    if (smallTotal <= maxBytes && Object.keys(smallEncoded).length > 0) {
      finalMap = smallEncoded;
      finalTotal = smallTotal;
      for (const k of Object.keys(checksums)) if (!small[k]) delete checksums[k];
    } else {
      if (rawMap['creds.json']) {
        const { gz, b64 } = gzipAndEncode(rawMap['creds.json']);
        finalMap = { 'creds.json': b64 };
        finalTotal = gz.length;
        for (const k of Object.keys(checksums)) if (k !== 'creds.json') delete checksums[k];
      }
    }
  }

  const payload = {
    _selected_files: finalMap,
    _selected_meta: {
      checksums,
      totalBytes: finalTotal,
      ts: Date.now(),
    },
  };

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      await saveToDbFn(sessionId, payload);
      const loaded = await loadFromDbFn(sessionId);
      if (!loaded) throw new Error('load_returned_null');
      const loadedCreds = loaded.creds ?? loaded;
      const sel = loadedCreds?._selected_files ?? loaded?._selected_files ?? null;
      const meta = loadedCreds?._selected_meta ?? loaded?._selected_meta ?? null;
      if (!sel || !meta || !meta.checksums) throw new Error('no_selected_files_in_db');

      let ok = true;
      for (const [rel, expectedHex] of Object.entries(meta.checksums)) {
        const b64 = sel[rel];
        if (!b64) { ok = false; break; }
        const gzBuf = Buffer.from(b64, 'base64');
        const buf = zlib.gunzipSync(gzBuf);
        const gotHex = sha256hex(buf);
        if (gotHex !== expectedHex) { ok = false; break; }
      }
      if (ok) return { ok: true };
      throw new Error('checksum_mismatch');
    } catch (err) {
      const reason = err?.message || String(err);
      if (attempt + 1 >= attempts) return { ok: false, reason };
      const delay = backoffBase * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }
  }

  return { ok: false, reason: 'unknown' };
}

export async function restoreSelectedFiles(sessionId, authDir, loadFromDbFn) {
  try {
    const loaded = await loadFromDbFn(sessionId);
    if (!loaded) return { ok: false, reason: 'no_db_row' };
    const loadedCreds = loaded.creds ?? loaded;
    const sel = loadedCreds?._selected_files ?? loaded?._selected_files ?? null;
    const meta = loadedCreds?._selected_meta ?? loaded?._selected_meta ?? null;
    if (!sel || !meta || !meta.checksums) return { ok: false, reason: 'no_selected_files_in_db' };

    for (const [rel, b64] of Object.entries(sel)) {
      try {
        const gzBuf = Buffer.from(b64, 'base64');
        const buf = zlib.gunzipSync(gzBuf);
        const abs = path.join(authDir, rel);
        await atomicWriteFile(abs, buf, 0o600);
        const got = sha256hex(buf);
        const expect = meta.checksums[rel];
        if (!expect || got !== expect) {
          return { ok: false, reason: `checksum_mismatch:${rel}` };
        }
      } catch (err) {
        return { ok: false, reason: `write_failed:${rel}:${err?.message || err}` };
      }
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err?.message || String(err) };
  }
}

export default {
  persistSelectedFiles,
  restoreSelectedFiles,
};
