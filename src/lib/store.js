// Simple localStorage store for Sushi ORDO
const KEY = 'sushi-ordo-menu-v2';
const OLD_KEYS = ['cafe-menu-v3', 'cafe-menu-v2'];

function uid() { return Math.random().toString(36).slice(2, 9); }

function defaultStyle() {
  return {
    bg: '#000000',
    bgOpacity: 0.58,
    blur: 12,
    radius: 13,
    borderOpacity: 0,
    shadow: false,
    textColor: '#ffffff',
    priceBg: '#ad2525',
    priceColor: '#ffffff',
  };
}

function normalizeItem(raw, i) {
  const cols = [46, 30, 32];
  const rawW = typeof raw.w === 'number' ? raw.w : raw.w ? Number(raw.w) : cols[i % cols.length];
  // clamp width to prevent old huge values from breaking layout
  const w = Math.max(12, Math.min(88, rawW));
  return {
    id: raw.id || uid(),
    title: raw.title || raw.name || 'Блюдо',
    desc: raw.desc || raw.subtitle || '',
    weight: raw.weight || raw.gram || raw.grams || raw.gramm || '',
    price: raw.price || '0.-',
    x: typeof raw.x === 'number' ? Math.max(0, Math.min(100 - w, raw.x)) : (i === 0 ? 6 : i === 1 ? 52 : 10 + i * 30) % 60,
    y: typeof raw.y === 'number' ? raw.y : 68,
    w,
    style: { ...defaultStyle(), ...(raw.style || {}) },
  };
}

const RAW_DEFAULT = {
  screens: [
    {
      id: 'tv1',
      name: 'Экран 1',
      slides: [
        {
          id: 's1',
          type: 'image',
          bg: '/cafe-menu-board-v2/data/img/tv1-01.jpg',
          duration: 20,
          transition: 'fade',
          items: [
            { title: 'Грек салаты', desc: 'Помидор, бадыраң, сыр Фетта', price: '350.-', x: 5, y: 10, w: 23 },
            { title: 'Цезарь салаты', desc: 'Айсберг, соус цезарь, тоок эти', price: '350.-', x: 6, y: 68, w: 23 },
          ],
        },
      ],
    },
    {
      id: 'tv2',
      name: 'Экран 2',
      slides: [
        {
          id: 's2',
          type: 'image',
          bg: '/cafe-menu-board-v2/data/img/tv2-01.jpg',
          duration: 20,
          transition: 'fade',
          items: [
            { title: 'Маргарита 30/40', desc: '', price: '380/500.-', x: 25, y: 25, w: 18 },
            { title: 'Пепперони 30/40', desc: '', price: '400/600.-', x: 60, y: 25, w: 18 },
          ],
        },
      ],
    },
    {
      id: 'tv3',
      name: 'Экран 3',
      slides: [
        {
          id: 's3',
          type: 'image',
          bg: '/cafe-menu-board-v2/data/img/tv3-01.jpg',
          duration: 20,
          transition: 'fade',
          items: [
            { title: 'Филадельфия', desc: 'Лосось, сливочный сыр', price: '420.-', x: 10, y: 30, w: 20 },
            { title: 'Калифорния', desc: 'Краб, авокадо, тобико', price: '340.-', x: 60, y: 30, w: 20 },
          ],
        },
      ],
    },
    {
      id: 'tv4',
      name: 'Экран 4',
      slides: [
        {
          id: 's4',
          type: 'image',
          bg: '/cafe-menu-board-v2/data/img/tv1-02.jpg',
          duration: 20,
          transition: 'fade',
          items: [
            { title: 'Сет Самурай', desc: 'Ассорти роллов', price: '1300.-', x: 10, y: 40, w: 24 },
            { title: 'Сет Темпура', desc: 'Горячие роллы', price: '1500.-', x: 60, y: 40, w: 24 },
          ],
        },
      ],
    },
    {
      id: 'tv5',
      name: 'Экран 5',
      slides: [
        {
          id: 's5',
          type: 'image',
          bg: '/cafe-menu-board-v2/data/img/tv2-05.jpg',
          duration: 20,
          transition: 'fade',
          items: [
            { title: 'Чиккен Бургер', desc: 'Сочное филе, соус', price: '360.-', x: 15, y: 40, w: 22 },
            { title: 'Чизбургер', desc: 'Говядина, сыр чеддер', price: '400.-', x: 60, y: 40, w: 22 },
          ],
        },
      ],
    },
    {
      id: 'tv6',
      name: 'Экран 6',
      slides: [
        {
          id: 's6',
          type: 'image',
          bg: '/cafe-menu-board-v2/data/img/tv3-04.jpg',
          duration: 20,
          transition: 'fade',
          items: [
            { title: 'Том Ям с креветками', desc: 'Острый суп', price: '500.-', x: 15, y: 40, w: 24 },
            { title: 'Рамен с говядиной', desc: 'Насыщенный бульон', price: '350.-', x: 60, y: 40, w: 24 },
          ],
        },
      ],
    },
  ],
};

export function normalizeStore(raw) {
  if (!raw || !raw.screens) return normalizeStore(RAW_DEFAULT);
  const screens = raw.screens.map((sc) => ({
    id: sc.id,
    name: sc.name,
    slides: (sc.slides || []).map((sl) => ({
      id: sl.id,
      type: sl.type || 'image',
      bg: sl.bg,
      duration: sl.duration || 7,
      transition: sl.transition || 'fade',
      items: (sl.items || []).map((it, idx) => normalizeItem(it, idx)),
    })),
  }));
  return { screens };
}

const DEFAULT = normalizeStore(RAW_DEFAULT);
export function loadStore() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT);
    const parsed = JSON.parse(raw);
    return normalizeStore(parsed);
  } catch { return structuredClone(DEFAULT); }
}

export function wipeOldKeys() {
  for (const k of OLD_KEYS) try { localStorage.removeItem(k); localStorage.removeItem(k + '_ts'); } catch {}
}

export function saveStore(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
  localStorage.setItem(KEY + '_ts', Date.now().toString());
}

// время последней правки на этом устройстве (0 = здесь не редактировали)
export function localTs() {
  try { return Number(localStorage.getItem(KEY + '_ts') || 0); } catch { return 0; }
}

// записать данные в кэш, не помечая их как «свежая правка» (приходит из облака)
export function cacheStore(data, ts) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    localStorage.setItem(KEY + '_ts', String(ts || 0));
  } catch {}
}

// чистим только данные меню — токен облака и другой localStorage не трогаем
export function clearMenuKeys() {
  for (const k of [...OLD_KEYS, KEY]) {
    try { localStorage.removeItem(k); localStorage.removeItem(k + '_ts'); } catch {}
  }
}

export function resetStore() {
  const d = structuredClone(DEFAULT);
  saveStore(d);
  return d;
}

export function createEmptyItem() {
  return normalizeItem({ title: 'Новое блюдо', desc: '', price: '300 ₽', x: 30, y: 36, w: 36 }, 0);
}

export function makeId() { return uid(); }

export const TRANSITIONS = [
  { id: 'fade', label: 'Fade + Scale (дорого)' },
  { id: 'slide', label: 'Slide влево' },
  { id: 'zoom', label: 'Zoom + Blur' },
  { id: 'blinds', label: 'Жалюзи' },
  { id: 'cube', label: '3D Cube' },
  { id: 'pixel', label: 'Pixelate' },
  { id: 'displacement', label: 'Displacement (GL Warp)' },
];

export const DEFAULT_STYLE = defaultStyle();

export function hexToRgba(hex, opacity = 1) {
  try {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${opacity})`;
  } catch { return `rgba(255,255,255,${opacity})`; }
}
