# Дизайн-система Norm Task Tracker

## Концепция
Стилистика Genshin Impact: расслабляющая, минималистичная, красивая.
Лёгкая тема с мягкими цветами, золотыми акцентами, плавными анимациями.

## Цветовая палитра Genshin Impact

Все цвета захардкожены в `frontend/lib/colors.ts`.

### Цвета предметов (для выбора цвета проектов/пользователей)

```typescript
export const GENSHIN_COLORS = [
  { key: 'legendary',  name: 'Легендарный',  hex: '#C8773B', dark: '#2A1200', label: '5★ Оранжевый' },
  { key: 'amber',      name: 'Янтарный',     hex: '#FFB13C', dark: '#2D1800', label: '5★ Янтарь' },
  { key: 'unique',     name: 'Уникальный',   hex: '#956FD4', dark: '#1E0D35', label: '4★ Фиолетовый' },
  { key: 'electro',    name: 'Электро',      hex: '#9B59B6', dark: '#1E0D30', label: '4★ Электро' },
  { key: 'rare',       name: 'Редкий',       hex: '#4E7FC4', dark: '#0A1A35', label: '3★ Синий' },
  { key: 'hydro',      name: 'Гидро',        hex: '#00BFFF', dark: '#001E30', label: '3★ Гидро' },
  { key: 'uncommon',   name: 'Необычный',    hex: '#42A153', dark: '#0A2010', label: '2★ Зелёный' },
  { key: 'dendro',     name: 'Дендро',       hex: '#73C947', dark: '#102010', label: '2★ Дендро' },
  { key: 'common',     name: 'Обычный',      hex: '#9DADA8', dark: '#1A2220', label: '1★ Серый' },
  { key: 'relic',      name: 'Реликвия',     hex: '#C2185B', dark: '#280A18', label: 'Реликварный' },
  { key: 'crimson',    name: 'Малиновый',    hex: '#DC143C', dark: '#300010', label: 'Малиновый' },
  { key: 'gold',       name: 'Золотой',      hex: '#DEB887', dark: '#2D2010', label: 'Золотой UI' },
  { key: 'celestial',  name: 'Небесный',     hex: '#7EC8E3', dark: '#0D2030', label: 'Небесный' },
  { key: 'pyro',       name: 'Пиро',         hex: '#FF6B35', dark: '#2D1500', label: 'Пиро' },
  { key: 'cryo',       name: 'Крио',         hex: '#A8D8EA', dark: '#0D2030', label: 'Крио' },
] as const;
```

### Цвета сложности задач (автоматически, по часам)

```typescript
export const TASK_COMPLEXITY = {
  common:    { range: '1-3ч',   hex: '#9DADA8', glow: 'none',                     label: 'Обычная' },
  rare:      { range: '3-5ч',   hex: '#4E7FC4', glow: '0 0 8px #4E7FC440',        label: 'Нормальная' },
  unique:    { range: '5-8ч',   hex: '#956FD4', glow: '0 0 10px #956FD450',       label: 'Уникальная' },
  epic:      { range: '8-20ч',  hex: '#B08FE8', glow: '0 0 12px #B08FE860',       label: 'Особая' },
  relic:     { range: '>20ч',   hex: '#C2185B', glow: '0 0 15px #C2185B70',       label: 'Реликварная' },
};

export function getTaskComplexity(hours: number) {
  if (hours <= 3)  return TASK_COMPLEXITY.common;
  if (hours <= 5)  return TASK_COMPLEXITY.rare;
  if (hours <= 8)  return TASK_COMPLEXITY.unique;
  if (hours <= 20) return TASK_COMPLEXITY.epic;
  return TASK_COMPLEXITY.relic;
}
```

## UI Токены (CSS переменные)

```css
:root {
  /* Backgrounds */
  --bg-base:        #F5F0E8;  /* тёплый кремовый (основной фон) */
  --bg-panel:       #FDFAF4;  /* панели и карточки */
  --bg-sidebar:     #EDE8DE;  /* боковая панель */
  --bg-overlay:     rgba(30, 25, 15, 0.6); /* затемнение модалок */

  /* Text */
  --text-primary:   #2C2416;  /* основной текст */
  --text-secondary: #6B5E45;  /* вторичный текст */
  --text-muted:     #9B8E78;  /* подсказки */
  --text-on-dark:   #F5F0E8;  /* текст на тёмном фоне */

  /* Accents */
  --accent-gold:    #C8A96E;  /* золотой акцент Genshin */
  --accent-gold-light: #DEB887;
  --accent-jade:    #5BAD8A;  /* нефритовый */

  /* Borders */
  --border-soft:    rgba(200, 169, 110, 0.2);
  --border-card:    rgba(200, 169, 110, 0.35);

  /* Shadows */
  --shadow-card:    0 2px 12px rgba(44, 36, 22, 0.08);
  --shadow-hover:   0 4px 20px rgba(44, 36, 22, 0.14);

  /* Radius */
  --radius-sm:      6px;
  --radius-md:      12px;
  --radius-lg:      18px;
  --radius-xl:      24px;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 400ms ease;
}
```

## Анимации

- Появление карточек: `fadeInUp` 300ms ease-out
- Hover на карточке: scale(1.01), shadow increase — 200ms
- Sidebar навигация: плавный highlight 200ms
- Модалки: scale + fade, 250ms
- Шкала прогресса: плавная, без резких скачков
- Блеск реликвии: subtle CSS shimmer animation на рамке карточки

## Компоненты UI

### Карточка проекта (hover tooltip)
- Плавное появление (opacity + translateY)
- Стеклянный эффект: backdrop-filter: blur(8px)
- Цветная полоска сверху — цвет проекта

### Иерархическая пирамида пользователей
- SVG или flex-based трёхуровневая структура
- Admins — вверху (большие карточки)
- Managers — в центре
- Employees — снизу (мелкие карточки)

### Канбан-доска
- 4 колонки с горизонтальным скроллом на мобиле
- Drag & drop через mouse events (или dnd-kit)
- Карточка задачи с цветной рамкой по сложности

### Шкала статуса задачи (на hover карточки)
- 4 точки, соединённые линией
- Текущий статус подсвечен акцентным цветом
- Анимированное заполнение

## Шрифты
- Основной: `Inter` (system font stack fallback)
- Заголовки: `Cinzel` или `Cormorant Garamond` (Genshin-style serif)
- Моноширинный: `JetBrains Mono` (для кода в материалах)
