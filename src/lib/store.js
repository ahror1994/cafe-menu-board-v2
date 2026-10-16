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
          id: 's_tv1_1',
          type: 'image',
          bg: '/cafe-menu-board-v2/data/img/tv2-12.jpg',
          duration: 20,
          transition: 'fade',
          items: [
            { title: 'Морской бриз', desc: '', price: '777 с.', x: 3, y: 17, w: 14 },
            { title: 'Лосось Манго', desc: '', price: '497 с.', x: 82, y: 9, w: 14 },
          ],
        },
      ],
    },
    {
      id: 'tv2',
      name: 'Экран 2',
      slides: [
        {
          id: 's_tv2_1',
          type: 'image',
          bg: '/cafe-menu-board-v2/data/img/tv3-01.jpg',
          duration: 20,
          transition: 'fade',
          items: [
            { title: 'Кани Маки', desc: 'Краб, рис, нори', price: '130.-', x: 6, y: 28, w: 16 },
            { title: 'Саке Маки', desc: 'Лосось, рис, нори', price: '200.-', x: 28, y: 46, w: 16 },
            { title: 'Унаги Маки', desc: 'Угорь, унаги, кунжут', price: '230.-', x: 74, y: 68, w: 16 },
          ],
        },
      ],
    },
    {
      id: 'tv3',
      name: 'Экран 3',
      slides: [
        {
          id: 's_tv3_1',
          type: 'image',
          bg: '/cafe-menu-board-v2/data/img/tv3-02.jpg',
          duration: 20,
          transition: 'fade',
          items: [
            { title: 'Калифорния Тобико', desc: 'Снежный краб, авокадо', price: '340.-', x: 2, y: 76, w: 18 },
            { title: 'Калифорния Маки', desc: 'Классический крабовый ролл', price: '330.-', x: 60, y: 76, w: 18 },
            { title: 'Сливочный угорь', desc: 'Нежный сыр, угорь, унаги', price: '390.-', x: 6, y: 38, w: 18 },
          ],
        },
      ],
    },
    {
      id: 'tv4',
      name: 'Экран 4',
      slides: [
        {
          id: 's_tv4_1',
          type: 'image',
          bg: '/cafe-menu-board-v2/data/img/tv2-08.jpg',
          duration: 20,
          transition: 'fade',
          items: [
            { title: 'Сет Дабл', desc: 'Большой набор для двоих', price: '1430.-', x: 4, y: 78, w: 26 },
            { title: 'Сет Темпура', desc: 'Хрустящие горячие роллы', price: '1500.-', x: 66, y: 44, w: 26 },
          ],
        },
      ],
    },
    {
      id: 'tv5',
      name: 'Экран 5',
      slides: [
        {
          id: 's_tv5_1',
          type: 'image',
          bg: '/cafe-menu-board-v2/data/img/tv2-10.jpg',
          duration: 20,
          transition: 'fade',
          items: [
            { title: 'Сет Самурай', desc: 'Фирменный набор роллов', price: '1300.-', x: 74, y: 16, w: 22 },
            { title: 'Филадельфия Макси', desc: 'Много свежего лосося', price: '1610.-', x: 6, y: 12, w: 24 },
          ],
        },
      ],
    },
    {
      id: 'tv6',
      name: 'Экран 6',
      slides: [
        {
          id: 's_tv6_1',
          type: 'image',
          bg: '/cafe-menu-board-v2/data/img/tv3-06.jpg',
          duration: 20,
          transition: 'fade',
          items: [
            { title: 'Унаги Фьюжн', desc: 'Запеченный угорь, спайси', price: '420.-', x: 32, y: 80, w: 18 },
            { title: 'Яки Унаги маки', desc: 'Горячий запеченный ролл', price: '370.-', x: 78, y: 80, w: 18 },
          ],
        },
      ],
    },
  ],
};

export function normalizeStore(raw) {
  if (!raw || !raw.screens) return normalizeStore(RAW_DEFAULT);
  const screens = (raw.screens || []).map((sc) => ({
    id: sc.id,
    name: sc.name || `Экран ${sc.id.replace('tv', '')}`,
    slides: (sc.slides || []).map((sl) => ({
      id: sl.id,
      type: sl.type || 'image',
      bg: sl.bg,
      duration: sl.duration || 7,
      transition: sl.transition || 'fade',
      items: (sl.items || []).map((it, idx) => normalizeItem(it, idx)),
    })),
  }));

  // Гарантируем наличие всех 6 экранов (tv1 .. tv6)
  for (let i = 1; i <= 6; i++) {
    const id = `tv${i}`;
    if (!screens.some((s) => s.id === id)) {
      const defSc = RAW_DEFAULT.screens.find((s) => s.id === id);
      screens.push(defSc ? structuredClone(defSc) : { id, name: `Экран ${i}`, slides: [] });
    }
  }

  // Сортировка tv1 .. tv6
  screens.sort((a, b) => {
    const numA = parseInt(a.id.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.id.replace(/\D/g, '')) || 0;
    return numA - numB;
  });

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
