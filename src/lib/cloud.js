// Cloud sync: данные лежат в самом репозитории (ветка gh-pages, файл data/menu.json).
// Чтение — публично с того же GitHub Pages (работает на ТВ и любом ПК без токена).
// Запись — коммит через GitHub API, нужен токен (хранится только в браузере админа).
import { normalizeStore } from './store.js';

const REPO = 'ahror1994/cafe-menu-board-v2';
const BRANCH = 'gh-pages';
const PATH = 'data/menu.json';
export const TOKEN_KEY = 'sushi-ordo-gh-token';
const FALLBACK_TOKEN_KEY = 'cafe-menu-gh-token';

const API = `https://api.github.com/repos/${REPO}`;

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(FALLBACK_TOKEN_KEY) || ''; } catch { return ''; }
}
export function setToken(t) {
  try {
    const val = normalizeTokenInput(t);
    if (!val) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(FALLBACK_TOKEN_KEY);
    } else {
      localStorage.setItem(TOKEN_KEY, val);
    }
  } catch {}
}

// принимает и голый токен, и целую ссылку-подключение (#gh=...)
export function normalizeTokenInput(raw) {
  const s = String(raw || '').trim();
  const m = s.match(/gh=([A-Za-z0-9._-]+)/);
  return m ? m[1] : s;
}

// мгновенная проверка: работает ли токен (возвращает логин аккаунта)
export async function checkToken() {
  const u = await gh('/user');
  return u && u.login ? String(u.login) : 'ok';
}
export function hasToken() { return Boolean(getToken()); }

export function cloudFileUrl() { return `${import.meta.env.BASE_URL}${PATH}`; }

const RAW_URL = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${PATH}`;

// Запрашивает актуальные данные. При bust=true пробует raw.githubusercontent.com
// (обновляется за 1 секунду) и GitHub Pages с защитой от кэширования (?t=Date.now())
export async function fetchCloud(timeoutMs = 8000, bust = true) {
  const urls = bust
    ? [`${RAW_URL}?t=${Date.now()}`, `${cloudFileUrl()}?t=${Date.now()}`]
    : [cloudFileUrl(), RAW_URL];

  for (const url of urls) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetchStable(url, {
        cache: bust ? 'no-store' : 'default',
        signal: ctrl.signal,
      }, 1);
      clearTimeout(t);
      if (!res.ok) continue;
      const j = await res.json();
      if (!j || !j.data || !Array.isArray(j.data.screens)) continue;
      return { updatedAt: j.updatedAt || '', data: normalizeStore(j.data) };
    } catch {
      // пробуем следующий URL
    }
  }
  return null;
}

function b64utf8(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

// сеть бывает нестабильной — сетевые сбои повторяем сами, HTTP-ошибки (401 и т.п.) отдаём сразу
async function fetchStable(url, opts, tries = 3) {
  let lastErr;
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      return await fetch(url, opts);
    } catch (e) {
      lastErr = e;
      if (attempt < tries - 1) await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
  }
  throw lastErr;
}

async function gh(path, method = 'GET', body) {
  try {
    const res = await fetchStable(`${API}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${getToken()}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      let msg = `GitHub ${res.status}`;
      try { msg += `: ${(await res.json()).message}`; } catch {}
      const err = new Error(msg);
      err.isHttp = true;
      throw err;
    }
    if (res.status === 204) return null;
    return res.json();
  } catch (e) {
    if (e && e.isHttp) throw e;
    // сетевой сбой после повторов — добавляем понятный контекст
    throw new Error('Failed to fetch (сеть unstable): ' + String(e.message || e));
  }
}

// Коммитит уже созданные блобы в ветку. При гонке/обрыве — повторяет целиком.
async function commitFiles(files, message) {
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const ref = await gh(`/git/ref/heads/${BRANCH}`);
      const commit = await gh(`/git/commits/${ref.object.sha}`);
      const tree = await gh('/git/trees', 'POST', {
        base_tree: commit.tree.sha,
        tree: files,
      });
      const newCommit = await gh('/git/commits', 'POST', {
        message: message || `update ${new Date().toISOString()}`,
        tree: tree.sha,
        parents: [ref.object.sha],
      });
      await gh(`/git/refs/heads/${BRANCH}`, 'PATCH', { sha: newCommit.sha });
      return newCommit;
    } catch (e) {
      lastErr = e;
      // гонка на ветке или сетевой сбой — пауза и повтор целиком
      if (!/409|422|Failed to fetch/i.test(String(e.message))) throw e;
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  throw lastErr;
}

function bufToB64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

// Загружает видеофайл (или любой файл) в репозиторий и возвращает публичный путь.
export async function uploadRepoFile(file) {
  if (!hasToken()) throw new Error('NO_TOKEN');
  const ext = (file.name.match(/\.(mp4|webm|m4v|mov)$/i) || [, 'mp4'])[1].toLowerCase();
  const name = `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}.${ext}`;
  const path = `data/video/${name}`;
  const buf = new Uint8Array(await file.arrayBuffer());
  const blob = await gh('/git/blobs', 'POST', { content: bufToB64(buf), encoding: 'base64' });
  await commitFiles([{ path, mode: '100644', type: 'blob', sha: blob.sha }], `video ${name}`);
  return `${import.meta.env.BASE_URL}${path}`;
}

// Публикует данные коммитом в gh-pages. Возвращает ISO-время публикации.
// При гонке (кто-то другой тоже двигает ветку) — повторяем от свежей головы несколько раз.
export async function pushCloud(data) {
  if (!hasToken()) throw new Error('NO_TOKEN');
  const updatedAt = new Date().toISOString();
  const blob = await gh('/git/blobs', 'POST', {
    content: b64utf8(JSON.stringify({ updatedAt, data })),
    encoding: 'base64',
  });
  await commitFiles([{ path: PATH, mode: '100644', type: 'blob', sha: blob.sha }], `menu update ${updatedAt}`);
  return updatedAt;
}
