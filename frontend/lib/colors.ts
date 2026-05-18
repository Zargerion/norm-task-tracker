export const GENSHIN_COLORS = [
  { key: 'legendary',  name: 'Легендарный',  hex: '#C8773B', dark: '#2A1200' },
  { key: 'amber',      name: 'Янтарный',     hex: '#FFB13C', dark: '#2D1800' },
  { key: 'unique',     name: 'Уникальный',   hex: '#956FD4', dark: '#1E0D35' },
  { key: 'electro',    name: 'Электро',      hex: '#9B59B6', dark: '#1E0D30' },
  { key: 'rare',       name: 'Редкий',       hex: '#4E7FC4', dark: '#0A1A35' },
  { key: 'hydro',      name: 'Гидро',        hex: '#00BFFF', dark: '#001E30' },
  { key: 'uncommon',   name: 'Необычный',    hex: '#42A153', dark: '#0A2010' },
  { key: 'dendro',     name: 'Дендро',       hex: '#73C947', dark: '#102010' },
  { key: 'common',     name: 'Обычный',      hex: '#9DADA8', dark: '#1A2220' },
  { key: 'relic',      name: 'Реликвия',     hex: '#C2185B', dark: '#280A18' },
  { key: 'crimson',    name: 'Малиновый',    hex: '#DC143C', dark: '#300010' },
  { key: 'gold',       name: 'Золотой',      hex: '#DEB887', dark: '#2D2010' },
  { key: 'celestial',  name: 'Небесный',     hex: '#7EC8E3', dark: '#0D2030' },
  { key: 'pyro',       name: 'Пиро',         hex: '#FF6B35', dark: '#2D1500' },
  { key: 'cryo',       name: 'Крио',         hex: '#A8D8EA', dark: '#0D2030' },
] as const;

export type GenshinColorKey = typeof GENSHIN_COLORS[number]['key'];

export function getColor(key: string | null | undefined) {
  return GENSHIN_COLORS.find((c) => c.key === key) ?? null;
}

export function getTaskComplexity(hours: number | null | undefined) {
  if (!hours) return { hex: '#9DADA8', label: 'Обычная', glow: '' };
  if (hours <= 3)  return { hex: '#9DADA8', label: 'Обычная',    glow: '' };
  if (hours <= 5)  return { hex: '#4E7FC4', label: 'Нормальная', glow: '0 0 8px rgba(78,127,196,0.4)' };
  if (hours <= 8)  return { hex: '#956FD4', label: 'Уникальная', glow: '0 0 10px rgba(149,111,212,0.5)' };
  if (hours <= 20) return { hex: '#E8920A', label: 'Легендарная', glow: '0 0 12px rgba(232,146,10,0.6)' };
  return { hex: '#C2185B', label: 'Реликварная', glow: '0 0 16px rgba(194,24,91,0.7)', relic: true };
}
