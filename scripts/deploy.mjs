// Деплой: build → сохранить живые данные облака в dist → опубликовать dist в ветку gh-pages.
// gh-pages заменяет ветку целиком, поэтому data/menu.json нужно пронести через деплой.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';

const REPO = 'ahror1994/cafe-menu-board-v2';
const RAW_LIVE = `https://raw.githubusercontent.com/${REPO}/gh-pages/data/menu.json`;
const LIVE = `https://ahror1994.github.io/cafe-menu-board-v2/data/menu.json`;

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: true });
  if (r.status !== 0) process.exit(r.status || 1);
}

run('npx', ['vite', 'build']);

// --- пронести живые данные облака через деплой (gh-pages заменяется целиком) ---
async function ghApi(p) {
  const { execSync } = await import('node:child_process');
  const out = execSync(`gh api "${p}"`, { maxBuffer: 64 * 1024 * 1024, encoding: 'utf8' });
  return JSON.parse(out);
}

try {
  // 1) данные меню: сравниваем даты и берём самую свежую версию
  let localTxt = '';
  let localUpdatedAt = 0;
  try {
    localTxt = readFileSync('public/data/menu.json', 'utf8');
    localUpdatedAt = Date.parse(JSON.parse(localTxt).updatedAt) || 0;
  } catch {}

  let cloudTxt = '';
  for (const url of [`${RAW_LIVE}?t=${Date.now()}`, `${LIVE}?t=${Date.now()}`]) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const txt = await res.text();
        JSON.parse(txt);
        cloudTxt = txt;
        break;
      }
    } catch {}
  }

  if (cloudTxt) {
    const cloudUpdatedAt = Date.parse(JSON.parse(cloudTxt).updatedAt) || 0;
    if (cloudUpdatedAt >= localUpdatedAt) {
      mkdirSync('dist/data', { recursive: true });
      writeFileSync('dist/data/menu.json', cloudTxt);
      console.log(`[deploy] живые данные облака сохранены в dist (${Math.round(cloudTxt.length / 1024)}KB)`);
    } else {
      mkdirSync('dist/data', { recursive: true });
      writeFileSync('dist/data/menu.json', localTxt);
      console.log(`[deploy] локальный seed новее облака (${Math.round(localTxt.length / 1024)}KB) — оставляем его`);
    }
  } else if (localTxt) {
    mkdirSync('dist/data', { recursive: true });
    writeFileSync('dist/data/menu.json', localTxt);
    console.log(`[deploy] в облаке ещё нет данных — уходит seed из public/data`);
  }
  // 2) все файлы данных облака (data/img/*, data/video/* и т.д.)
  const treeRes = await ghApi(`repos/${REPO}/git/trees/gh-pages?recursive=1`);
  const dataFiles = (treeRes.tree || []).filter((t) => t.type === 'blob' && t.path.startsWith('data/') && t.path !== 'data/menu.json');
  for (const t of dataFiles) {
    const dest = 'dist/' + t.path;
    mkdirSync(path.dirname(dest), { recursive: true });
    const r = await fetch(`https://ahror1994.github.io/cafe-menu-board-v2/${t.path}`);
    if (r.ok) writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
  }
  if (dataFiles.length) console.log(`[deploy] файлы облака перенесены: ${dataFiles.length} шт.`);
} catch (e) {
  console.warn('[deploy] инфо по живым данным облака:', e.message);
}

run('npx', ['gh-pages', '-d', 'dist']);
